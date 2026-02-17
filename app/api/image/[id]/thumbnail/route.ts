import type { NextRequest } from 'next/server';
import { immichFetch } from '@/lib/immich';
import { CACHE_REVALIDATE_IMAGE } from '@/lib/constants';

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }   // params is a Promise in this runtime
) {
    const { id } = await ctx.params;           // <- unwrap the Promise
    if (!id) return new Response('Missing id', { status: 400 });

    const res = await immichFetch(`/assets/${encodeURIComponent(id)}/thumbnail`, {}, CACHE_REVALIDATE_IMAGE);

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
