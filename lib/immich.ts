// lib/immich.ts
const BASE = process.env.IMMICH_BASE_URL!;
const KEY = process.env.IMMICH_API_KEY!;

export async function immich<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}/api${path}`, {
        ...init,
        headers: {
            'x-api-key': KEY,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
        cache: 'no-store',
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Immich ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
}