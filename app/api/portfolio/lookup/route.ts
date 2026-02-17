// app/api/portfolio/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/get-base-url';
import type { GalleryItem } from '@/types/gallery.types';

/**
 * GET /api/portfolio/lookup?slug=southern-pleiades
 *
 * Resolves a photo slug to the corresponding Immich asset ID.
 * Returns { id, slug } on success or 404 if not found.
 */
export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get('slug')?.trim();

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    try {
        const base = await getBaseUrl();
        const res = await fetch(`${base}/api/portfolio`, { cache: 'no-store' });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 502 });
        }

        const data = (await res.json()) as { items: GalleryItem[] };
        const items = Array.isArray(data?.items) ? data.items : [];

        const match = items.find((item) => item.slug === slug);

        if (!match) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ id: match.id, slug: match.slug });
    } catch (err) {
        console.error('[portfolio/lookup] error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
