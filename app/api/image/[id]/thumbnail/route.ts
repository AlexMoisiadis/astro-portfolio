import type { NextRequest } from 'next/server';
import { immichFetch } from '@/lib/immich';
import { CACHE_REVALIDATE_IMAGE } from '@/lib/constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    if (!id || !UUID_RE.test(id)) {
        return new Response('Bad request', { status: 400 });
    }

    const res = await immichFetch(`/assets/${encodeURIComponent(id)}/thumbnail`, {}, CACHE_REVALIDATE_IMAGE);

    if (!res.ok || !res.body) {
        return new Response('Upstream error', { status: res.status || 502 });
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
