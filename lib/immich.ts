// lib/immich.ts
import { fetchWithRetry } from './fetch-with-retry';
import { CACHE_REVALIDATE_API } from './constants';

/** One Immich server we can talk to (the primary, or an optional backup). */
export type ImmichTarget = {
    name: 'primary' | 'backup';
    base: string;
    key: string;
    albumId?: string;
    albumName: string;
};

/** Targets in priority order: primary first, then the backup if configured. */
export function immichTargets(): ImmichTarget[] {
    const env = process.env;
    const primaryAlbumName = (env.IMMICH_PORTFOLIO_ALBUM_NAME || 'Portfolio').trim().toLowerCase();

    const targets: ImmichTarget[] = [{
        name: 'primary',
        base: env.IMMICH_BASE_URL!,
        key: env.IMMICH_API_KEY!,
        albumId: env.IMMICH_PORTFOLIO_ALBUM_ID?.trim() || undefined,
        albumName: primaryAlbumName,
    }];

    if (env.IMMICH_BACKUP_BASE_URL) {
        targets.push({
            name: 'backup',
            base: env.IMMICH_BACKUP_BASE_URL,
            key: env.IMMICH_BACKUP_API_KEY ?? env.IMMICH_API_KEY!,
            albumId: env.IMMICH_BACKUP_PORTFOLIO_ALBUM_ID?.trim() || undefined,
            albumName: (env.IMMICH_BACKUP_PORTFOLIO_ALBUM_NAME || primaryAlbumName).trim().toLowerCase(),
        });
    }
    return targets;
}

/**
 * Low-level helper: makes an authenticated request to the Immich API with
 * automatic retry on transient errors. Returns the raw Response so callers
 * can stream binary bodies (images) or handle status codes themselves.
 *
 * @param path       Immich API path (e.g. `/assets/{id}/thumbnail`)
 * @param init       Standard RequestInit overrides
 * @param revalidate Cache revalidation in seconds (default: CACHE_REVALIDATE_API).
 *                   Ignored when DISABLE_CACHE env var is "true".
 * @param target     Which Immich server to call (default: the primary).
 */
export async function immichFetch(
    path: string,
    init: RequestInit = {},
    revalidate: number = CACHE_REVALIDATE_API,
    target: ImmichTarget = immichTargets()[0],
): Promise<Response> {
    const noCache = process.env.DISABLE_CACHE === 'true';

    return fetchWithRetry(`${target.base}/api${path}`, {
        ...init,
        headers: {
            'x-api-key': target.key,
            ...(init.headers || {}),
        },
        ...(noCache
            ? { cache: 'no-store' as const }
            : { next: { revalidate } }),
    });
}

/**
 * High-level helper: makes an authenticated JSON request to the Immich API
 * with automatic retry on transient errors. Parses the response as JSON and
 * throws on non-OK status codes.
 */
export async function immich<T>(
    path: string,
    init: RequestInit = {},
    target?: ImmichTarget,
): Promise<T> {
    const res = await immichFetch(path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    }, CACHE_REVALIDATE_API, target);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Immich ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
}
