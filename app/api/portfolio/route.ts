import { NextResponse } from 'next/server';
import { immich } from '@/lib/immich';

/** Minimal types for what we use */
type AlbumListItem = { id: string; albumName?: string | null };
type ExifInfo = {
    imageWidth?: number | null;
    imageHeight?: number | null;
    imageName?: string | null;
    cameraModel?: string | null;
    focalLength?: number | null;
    exposureTime?: string | null;
    iso?: number | null;
};
type SearchAsset = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ExifInfo | null;
};
/** Different Immich versions may return `assets` as an array or an object with `items` */
type SearchArrayShape = { assets?: SearchAsset[] | null };
type SearchObjectShape = { assets?: { items?: SearchAsset[] | null } | null };

type AlbumAssetRef = { assetId: string };
type AlbumDetail = { id: string; assets?: AlbumAssetRef[] | null };

type GalleryItem = {
    id: string;
    width?: number;
    height?: number;
    capturedAt?: string;
    title?: string;
    camera?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
    thumbUrl: string;
    originalUrl: string;
};

function toItems(baseUrl: string, assets: SearchAsset[] | undefined | null): GalleryItem[] {
    const out: GalleryItem[] = [];
    if (!assets || !Array.isArray(assets)) return out;

    for (const asset of assets) {
        const exif = asset.exifInfo ?? {};
        const width = exif.imageWidth ?? undefined;
        const height = exif.imageHeight ?? undefined;

        out.push({
            id: asset.id,
            width: typeof width === 'number' ? width : undefined,
            height: typeof height === 'number' ? height : undefined,
            capturedAt: asset.fileCreatedAt ?? undefined,
            title: exif.imageName ?? asset.originalFileName ?? undefined,
            camera: exif.cameraModel ?? undefined,
            focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
            exposureTime: exif.exposureTime ?? undefined,
            iso: typeof exif.iso === 'number' ? exif.iso : undefined,
            thumbUrl: `/api/image/${asset.id}/thumbnail`,
            originalUrl: `/api/image/${asset.id}/original`, // <-- use proxy
        });
    }
    return out;
}

export async function GET() {
    try {
        const baseUrl = process.env.IMMICH_BASE_URL;
        if (!baseUrl) {
            return NextResponse.json({ error: 'IMMICH_BASE_URL not set' }, { status: 500 });
        }

        // Resolve album
        const albumIdFromEnv = process.env.IMMICH_PORTFOLIO_ALBUM_ID?.trim();
        const albumName = (process.env.IMMICH_PORTFOLIO_ALBUM_NAME || 'Portfolio')
            .trim()
            .toLowerCase();

        let albumId: string | undefined = albumIdFromEnv;
        console.log('[portfolio] env albumId:', albumIdFromEnv, 'env albumName:', albumName);

        if (!albumId) {
            const albums = await immich<AlbumListItem[]>('/albums');
            console.log('[portfolio] /albums returned:', albums.length, 'albums');
            const found = albums.find(
                (a) => a.albumName && a.albumName.trim().toLowerCase() === albumName,
            );
            albumId = found?.id;
            console.log('[portfolio] matched album id by name:', albumId);
        }

        if (!albumId) {
            console.log('[portfolio] No album match. Returning empty list.');
            return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
        }

        // ---- Attempt #1: Search by albumIds (recommended by Immich maintainers)
        const size = 250;
        const searchBody = { albumIds: [albumId], size };

        // We don't know exact shape -> type as union of possible shapes
        const result = await immich<SearchArrayShape & SearchObjectShape>('/search/metadata', {
            method: 'POST',
            body: JSON.stringify(searchBody),
        });

        // Normalize potential shapes: assets[] OR assets.items[]
        const assetsArray =
            Array.isArray((result as SearchArrayShape).assets)
                ? (result as SearchArrayShape).assets
                : (result as SearchObjectShape).assets?.items;

        const searchCount = Array.isArray(assetsArray) ? assetsArray.length : 0;
        console.log('[portfolio] search/metadata albumIds size:', searchCount);

        if (searchCount > 0) {
            const items = toItems(baseUrl, assetsArray);
            console.log('[portfolio] items prepared (search):', items.length);
            return NextResponse.json({ items });
        }

        // ---- Attempt #2 (fallback): album detail -> asset IDs -> search by ids
        // Some installs might not return assets via albumIds filter.
        const album = await immich<AlbumDetail>(`/albums/${albumId}`);
        const assetIds = (album.assets ?? []).map((x) => x.assetId).filter(Boolean);
        console.log('[portfolio] fallback album assets count:', assetIds.length);

        if (assetIds.length === 0) {
            return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
        }

        // Chunk search by ids
        const pageSize = 200;
        let all: SearchAsset[] = [];
        for (let i = 0; i < assetIds.length; i += pageSize) {
            const chunk = assetIds.slice(i, i + pageSize);
            const res2 = await immich<SearchArrayShape & SearchObjectShape>('/search/metadata', {
                method: 'POST',
                body: JSON.stringify({ ids: chunk, size: pageSize }),
            });
            const arr2 =
                Array.isArray((res2 as SearchArrayShape).assets)
                    ? (res2 as SearchArrayShape).assets
                    : (res2 as SearchObjectShape).assets?.items;

            const n = Array.isArray(arr2) ? arr2.length : 0;
            console.log('[portfolio] fallback chunk requested:', chunk.length, 'returned:', n);

            if (Array.isArray(arr2) && arr2.length) {
                all = all.concat(arr2);
            }
        }

        const items = toItems(baseUrl, all);
        console.log('[portfolio] items prepared (fallback):', items.length);
        return NextResponse.json({ items });
    } catch (e) {
        console.error('[/api/portfolio] error:', e);
        return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
    }
}