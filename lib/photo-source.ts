// lib/photo-source.ts
//
// Single place that decides where photos come from. Order tried:
//   primary Immich → backup Immich → local snapshot → curated folder
// Everything above this module deals in slugs only; Immich UUIDs never leave it.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { immich, immichFetch, immichTargets, type ImmichTarget } from './immich';
import { CACHE_REVALIDATE_API, CACHE_REVALIDATE_IMAGE } from './constants';
import { pickDisplayTitle, toSlug } from './strings';
import type {
    ImmichAlbumListItem,
    ImmichAsset,
    ImmichSearchArrayShape,
    ImmichSearchObjectShape,
} from '@/types/immich.types';
import type { PortfolioSearchResponse } from '@/app/api/portfolio/route.types';
import type { GalleryItem } from '@/types/gallery.types';

export type SourceName = 'primary' | 'backup' | 'snapshot' | 'curated';
export type ImageType = 'thumbnail' | 'preview' | 'original';

export type SourceItem = {
    slug: string;
    source: SourceName;
    /** Immich asset id (primary/backup), slug (snapshot) or filename (curated). */
    ref: string;
    title?: string;
    width?: number;
    height?: number;
    capturedAt?: string;
    camera?: string;
    lens?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
    sensorTemp?: number;
    description?: string;
};

export type Portfolio = { source: SourceName | 'none'; items: SourceItem[] };

const DOWN_MS = 60_000; // ponytail: fixed 60s cooldown, make configurable if needed
const PORTFOLIO_FILE = 'portfolio.json';
const CURATED_EXT = /\.(jpe?g|png|webp)$/i;

// Module state lives on globalThis so route handlers and pages share one copy
// even if the bundler gives each entry point its own module instance.
type State = {
    cache?: { at: number; value: Portfolio };
    inflight?: Promise<Portfolio>;
    downUntil: Record<string, number>;
    snapping: boolean;
    lastSource?: string;
};
const g = globalThis as typeof globalThis & { __photoSource?: State };
const state: State = (g.__photoSource ??= { downUntil: {}, snapping: false });

const snapshotDir = () => process.env.SNAPSHOT_DIR || path.join(process.cwd(), '.portfolio-snapshot');
const curatedDir = () => process.env.FALLBACK_PHOTOS_DIR || path.join(process.cwd(), 'fallback-photos');

/** Positive number from env, or Infinity (no cap) when unset/invalid. */
const capFromEnv = (name: string) => {
    const n = Number(process.env[name]);
    return n > 0 ? n : Infinity;
};

/** "name", "name-2", "name-3", … */
function uniqueSlug(base: string, counts: Map<string, number>): string {
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
}

function markDown(name: string) {
    state.downUntil[name] = Date.now() + DOWN_MS;
    state.cache = undefined; // next request re-evaluates the source order
}

// ── Immich ──────────────────────────────────────────────────────────────────

async function listImmich(t: ImmichTarget): Promise<SourceItem[]> {
    let albumId = t.albumId;
    if (!albumId) {
        const albums = await immich<ImmichAlbumListItem[]>('/albums', {}, t);
        albumId = albums.find(a => a.albumName?.trim().toLowerCase() === t.albumName)?.id;
    }
    if (!albumId) return [];

    const result = await immich<PortfolioSearchResponse>('/search/metadata', {
        method: 'POST',
        body: JSON.stringify({ albumIds: [albumId], size: 250 }),
    }, t);

    const assets = Array.isArray((result as ImmichSearchArrayShape).assets)
        ? (result as ImmichSearchArrayShape).assets
        : (result as ImmichSearchObjectShape).assets?.items;

    const counts = new Map<string, number>();
    return (assets ?? []).map((asset: ImmichAsset): SourceItem => {
        const exif = asset.exifInfo ?? {};
        const title = pickDisplayTitle(exif.imageName, asset.originalFileName, 'Untitled');
        const slug = uniqueSlug(toSlug(title ?? '') || `photo-${asset.id.slice(0, 8)}`, counts);
        return {
            slug,
            source: t.name,
            ref: asset.id,
            title,
            width: exif.imageWidth ?? undefined,
            height: exif.imageHeight ?? undefined,
            capturedAt: asset.fileCreatedAt ?? undefined,
            camera: exif.cameraModel ?? undefined,
            lens: exif.lensModel ?? undefined,
            focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
            exposureTime: exif.exposureTime ?? undefined,
            iso: typeof exif.iso === 'number' ? exif.iso : undefined,
            sensorTemp: typeof exif.temperature === 'number' ? exif.temperature : undefined,
            description: exif.description ?? undefined,
        };
    });
}

function immichImagePath(id: string, type: ImageType): string {
    const q = encodeURIComponent(id);
    if (type === 'preview') return `/assets/${q}/thumbnail?size=preview`;
    if (type === 'thumbnail') return `/assets/${q}/thumbnail`;
    return `/assets/${q}/original`;
}

// ── Local snapshot (auto-written whenever Immich answers) ───────────────────

const snapshotFile = (slug: string, type: 'thumbnail' | 'preview') =>
    path.join(snapshotDir(), `${slug}.${type}.img`);

// ponytail: existing snapshot images are never refreshed; delete the folder to force it.
// Originals are not snapshotted (huge); fallback downloads serve the preview instead.
async function writeSnapshot(items: SourceItem[], t: ImmichTarget) {
    if (state.snapping || items.length === 0) return;
    state.snapping = true;
    try {
        const dir = snapshotDir();
        await fs.mkdir(dir, { recursive: true });

        // Newest capture date first (undated last), keeping photos until a cap is hit.
        // Only photos with both images on disk make it into the listing.
        const maxPhotos = capFromEnv('SNAPSHOT_MAX_PHOTOS');
        const maxBytes = capFromEnv('SNAPSHOT_MAX_MB') * 1024 * 1024;
        const newestFirst = [...items].sort((a, b) => (b.capturedAt ?? '').localeCompare(a.capturedAt ?? ''));
        const complete: SourceItem[] = [];
        let bytes = 0;
        for (const it of newestFirst) {
            if (complete.length >= maxPhotos) break;
            let ok = true;
            let size = 0;
            for (const type of ['thumbnail', 'preview'] as const) {
                const file = snapshotFile(it.slug, type);
                if (!(await fs.access(file).then(() => true, () => false))) {
                    const res = await immichFetch(immichImagePath(it.ref, type), {}, CACHE_REVALIDATE_IMAGE, t);
                    if (!res.ok) {
                        ok = false;
                        console.warn(`[photo-source] snapshot: ${it.slug} ${type} got HTTP ${res.status}`);
                        break;
                    }
                    await fs.writeFile(file, new Uint8Array(await res.arrayBuffer()));
                }
                size += (await fs.stat(file)).size;
            }
            if (!ok) continue;
            if (bytes + size > maxBytes) break; // files of photos left out are pruned below
            bytes += size;
            complete.push(it);
        }
        if (complete.length === 0) return; // keep any previous good snapshot

        // Prune images of photos that left the album.
        const keep = new Set(complete.map(i => i.slug));
        for (const f of await fs.readdir(dir)) {
            const m = /^(.+)\.(thumbnail|preview)\.img$/.exec(f);
            if (m && !keep.has(m[1])) await fs.unlink(path.join(dir, f));
        }

        // Written last, atomically, so readers never see a listing without its images.
        const tmp = path.join(dir, `${PORTFOLIO_FILE}.tmp`);
        await fs.writeFile(tmp, JSON.stringify(complete));
        await fs.rename(tmp, path.join(dir, PORTFOLIO_FILE));
    } catch (err) {
        console.warn('[photo-source] snapshot write failed:', err);
    } finally {
        state.snapping = false;
    }
}

async function readSnapshot(): Promise<SourceItem[] | null> {
    try {
        const raw = await fs.readFile(path.join(snapshotDir(), PORTFOLIO_FILE), 'utf8');
        const items = JSON.parse(raw) as SourceItem[];
        return items.map(i => ({ ...i, source: 'snapshot' as const, ref: i.slug }));
    } catch {
        return null;
    }
}

// ── Curated folder (last resort, title only) ────────────────────────────────

async function readCurated(): Promise<SourceItem[]> {
    let files: string[];
    try {
        files = (await fs.readdir(curatedDir())).filter(f => CURATED_EXT.test(f)).sort();
    } catch {
        return [];
    }
    const counts = new Map<string, number>();
    return files.map((file): SourceItem => {
        const title = pickDisplayTitle(undefined, file, 'Untitled');
        return {
            slug: uniqueSlug(toSlug(title ?? '') || 'photo', counts),
            source: 'curated',
            ref: file,
            title,
        };
    });
}

// ── Public API ──────────────────────────────────────────────────────────────

async function load(): Promise<Portfolio> {
    for (const t of immichTargets()) {
        if ((state.downUntil[t.name] ?? 0) > Date.now()) continue;
        try {
            const items = await listImmich(t);
            delete state.downUntil[t.name];
            void writeSnapshot(items, t);
            return { source: t.name, items };
        } catch (err) {
            state.downUntil[t.name] = Date.now() + DOWN_MS;
            console.warn(`[photo-source] ${t.name} Immich failed:`, err);
        }
    }

    // Local fallback = snapshot + your folder, so adding a photo to either shows up.
    // A folder file whose slug is already in the snapshot is assumed to be the same photo.
    const snapshot = (await readSnapshot()) ?? [];
    const have = new Set(snapshot.map(i => i.slug));
    const curated = (await readCurated()).filter(i => !have.has(i.slug));
    const items = [...snapshot, ...curated];
    if (items.length) return { source: snapshot.length ? 'snapshot' : 'curated', items };

    return { source: 'none', items: [] };
}

/** The portfolio from the best available source, cached for CACHE_REVALIDATE_API seconds. */
export async function getPortfolio(): Promise<Portfolio> {
    const hit = state.cache;
    if (hit && Date.now() - hit.at < CACHE_REVALIDATE_API * 1000) return hit.value;

    state.inflight ??= load().then(value => {
        if (value.source !== 'none') state.cache = { at: Date.now(), value };
        if (state.lastSource !== value.source) {
            console.log(`[photo-source] serving from: ${value.source}`);
            state.lastSource = value.source;
        }
        return value;
    }).finally(() => { state.inflight = undefined; });

    return state.inflight;
}

/** Resolve a public slug to its item (and, internally, its source reference). */
export async function resolveSlug(slug: string): Promise<SourceItem | null> {
    const { items } = await getPortfolio();
    return items.find(i => i.slug === slug) ?? null;
}

function sniffType(b: Uint8Array): string {
    if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
    if (Buffer.from(b.subarray(8, 12)).toString() === 'WEBP') return 'image/webp';
    return 'application/octet-stream';
}

async function fileResponse(file: string): Promise<Response | null> {
    try {
        const buf = new Uint8Array(await fs.readFile(file));
        return new Response(buf, { headers: { 'Content-Type': sniffType(buf) } });
    } catch {
        return null;
    }
}

/** Image bytes for an item, falling back to the local snapshot if Immich fails mid-request. */
export async function getImage(item: SourceItem, type: ImageType): Promise<Response | null> {
    if (item.source === 'primary' || item.source === 'backup') {
        const t = immichTargets().find(x => x.name === item.source);
        if (t) {
            try {
                const res = await immichFetch(immichImagePath(item.ref, type), {}, CACHE_REVALIDATE_IMAGE, t);
                if (res.ok && res.body) return res;
                if (res.status >= 500) markDown(t.name);
            } catch {
                markDown(t.name);
            }
        }
    }

    if (item.source === 'curated') return fileResponse(path.join(curatedDir(), item.ref));

    // Snapshot (also the mid-request fallback for primary/backup). Originals fall back to the preview.
    return fileResponse(snapshotFile(item.slug, type === 'thumbnail' ? 'thumbnail' : 'preview'));
}

/** Public shape: slug-based URLs only, no asset id. */
export function toGalleryItem(i: SourceItem): GalleryItem {
    return {
        slug: i.slug,
        width: i.width,
        height: i.height,
        capturedAt: i.capturedAt,
        title: i.title,
        camera: i.camera,
        focalLength: i.focalLength,
        exposureTime: i.exposureTime,
        iso: i.iso,
        thumbUrl: `/api/image/by-slug/${i.slug}/thumbnail`,
        originalUrl: `/api/image/by-slug/${i.slug}/original`,
    };
}
