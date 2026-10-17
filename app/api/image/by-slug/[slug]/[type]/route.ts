// app/api/image/by-slug/[slug]/[type]/route.ts
import type { NextRequest } from 'next/server';
import { getImage, resolveSlug, type ImageType } from '@/lib/photo-source';

const VALID_TYPES = new Set<string>(['thumbnail', 'preview', 'original']);

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ slug: string; type: string }> }
) {
    const { slug, type } = await ctx.params;

    if (!slug || !VALID_TYPES.has(type)) {
        return new Response('Bad request', { status: 400 });
    }

    const item = await resolveSlug(slug);
    if (!item) {
        return new Response('Not found', { status: 404 });
    }

    const res = await getImage(item, type as ImageType);
    if (!res?.body) {
        return new Response('Upstream error', { status: 502 });
    }

    const defaultMaxAge = type === 'preview' ? 300 : 60;

    return new Response(res.body, {
        status: 200,
        headers: {
            'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
            'Cache-Control': res.headers.get('cache-control') ?? `private, max-age=${defaultMaxAge}`,
        },
    });
}
