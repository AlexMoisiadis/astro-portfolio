import type { NextRequest } from 'next/server';

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }   // params is a Promise in this runtime
) {
    const { id } = await ctx.params;           // <- unwrap the Promise
    if (!id) return new Response('Missing id', { status: 400 });

    const base = process.env.IMMICH_BASE_URL!;
    const key = process.env.IMMICH_API_KEY!;

    const upstream = `${base}/api/assets/${encodeURIComponent(id)}/thumbnail`;
    const res = await fetch(upstream, {
        headers: { 'x-api-key': key },
        cache: 'no-store',
    });

    if (!res.ok || !res.body) {
        // Pass through the upstream status so Next/Image logs are informative
        const text = await res.text().catch(() => '');
        return new Response(text || 'Upstream error', { status: res.status || 502 });
    }

    // Stream image bytes to the browser with appropriate headers
    return new Response(res.body, {
        status: 200,
        headers: {
            'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
            'Cache-Control': res.headers.get('cache-control') ?? 'private, max-age=60',
        },
    });
}