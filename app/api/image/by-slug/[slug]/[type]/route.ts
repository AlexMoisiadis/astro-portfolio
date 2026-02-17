// app/api/image/by-slug/[slug]/[type]/route.ts
import type { NextRequest } from 'next/server';
import { immichFetch } from '@/lib/immich';
import { CACHE_REVALIDATE_IMAGE } from '@/lib/constants';
import { getBaseUrl } from '@/lib/get-base-url';

const VALID_TYPES = new Set(['thumbnail', 'preview', 'original']);

/** Resolve a slug to an Immich asset UUID via the portfolio API. */
async function resolveSlug(slug: string): Promise<string | null> {
    const base = await getBaseUrl();
    const res = await fetch(
        `${base}/api/portfolio/lookup?slug=${encodeURIComponent(slug)}`,
        { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
}

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ slug: string; type: string }> }
) {
    const { slug, type } = await ctx.params;

    if (!slug || !VALID_TYPES.has(type)) {
        return new Response('Bad request', { status: 400 });
    }

    const assetId = await resolveSlug(slug);
    if (!assetId) {
        return new Response('Not found', { status: 404 });
    }

    // Build the Immich API path based on type
    let immichPath: string;
    if (type === 'preview') {
        immichPath = `/assets/${encodeURIComponent(assetId)}/thumbnail?size=preview`;
    } else if (type === 'thumbnail') {
        immichPath = `/assets/${encodeURIComponent(assetId)}/thumbnail`;
    } else {
        // original
        immichPath = `/assets/${encodeURIComponent(assetId)}/original`;
    }

    const res = await immichFetch(immichPath, {}, CACHE_REVALIDATE_IMAGE);

    if (!res.ok || !res.body) {
        return new Response('Upstream error', { status: res.status || 502 });
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
