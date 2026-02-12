import { headers } from 'next/headers';

export async function getBaseUrl() {
    // 1) Prefer an explicit public base if set (handy in production)
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

    // 2) Derive from the incoming request headers (works in dev/preview/behind proxy)
    const h = await headers(); // <-- await fixes "Promise<ReadonlyHeaders>" issue
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';

    // Fallback for edge cases (e.g., no host during certain builds)
    if (!host) return 'http://localhost:3000';

    return `${proto}://${host}`;
}