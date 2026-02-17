// lib/immich.ts
import { fetchWithRetry } from './fetch-with-retry';
import { CACHE_REVALIDATE_API } from './constants';

const BASE = process.env.IMMICH_BASE_URL!;
const KEY = process.env.IMMICH_API_KEY!;

/**
 * Low-level helper: makes an authenticated request to the Immich API with
 * automatic retry on transient errors. Returns the raw Response so callers
 * can stream binary bodies (images) or handle status codes themselves.
 *
 * @param path       Immich API path (e.g. `/assets/{id}/thumbnail`)
 * @param init       Standard RequestInit overrides
 * @param revalidate Cache revalidation in seconds (default: CACHE_REVALIDATE_API).
 *                   Ignored when DISABLE_CACHE env var is "true".
 */
export async function immichFetch(
    path: string,
    init: RequestInit = {},
    revalidate: number = CACHE_REVALIDATE_API,
): Promise<Response> {
    const noCache = process.env.DISABLE_CACHE === 'true';

    return fetchWithRetry(`${BASE}/api${path}`, {
        ...init,
        headers: {
            'x-api-key': KEY,
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
export async function immich<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await immichFetch(path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Immich ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
}
