import type { NextRequest } from 'next/server';

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    if (!id) return new Response('Missing id', { status: 400 });

    const base = process.env.IMMICH_BASE_URL!;
    const key = process.env.IMMICH_API_KEY!;

    const upstream = `${base}/api/assets/${encodeURIComponent(id)}/original`;
    const res = await fetch(upstream, {
        headers: { 'x-api-key': key },
        cache: 'no-store',
    });

    if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        return new Response(text || 'Upstream error', { status: res.status || 502 });
    }

    return new Response(res.body, {
        status: 200,
        headers: {
            'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
            'Cache-Control': res.headers.get('cache-control') ?? 'private, max-age=60',
        },
    });
}