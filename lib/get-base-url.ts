// lib/get-base-url.ts
import { headers } from 'next/headers';

/**
 * Returns the base URL for internal API calls.
 *
 * Server-side (Node.js): Always uses localhost — the server calls itself
 * directly, avoiding DNS issues inside Docker containers.
 *
 * Client-side (browser): Uses NEXT_PUBLIC_BASE_URL if set, otherwise
 * infers from the request headers (x-forwarded-host / host).
 */
export async function getBaseUrl() {
    // Server-side: always call ourselves via localhost
    if (typeof window === 'undefined') {
        const port = process.env.PORT ?? '3000';
        return `http://localhost:${port}`;
    }

    // Client-side: use the public URL or infer from headers
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';

    if (host) return `${proto}://${host}`;
    return 'http://localhost:3000';
}
