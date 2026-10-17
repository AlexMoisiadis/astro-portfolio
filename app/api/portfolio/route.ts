// app/api/portfolio/route.ts
import { NextResponse } from 'next/server';
import { getPortfolio, toGalleryItem } from '@/lib/photo-source';

export async function GET() {
    const { source, items } = await getPortfolio();

    // Every source (both Immich servers, snapshot, curated folder) failed.
    if (source === 'none') {
        return NextResponse.json({ error: 'No photo source available' }, { status: 502 });
    }

    return NextResponse.json({ items: items.map(toGalleryItem) });
}
