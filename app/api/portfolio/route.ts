// app/portfolio/route.ts
import { NextResponse } from 'next/server';
import { immich } from '@/lib/immich';
import type {
    ImmichAlbumListItem,
    ImmichAsset,
    ImmichSearchArrayShape,
    ImmichSearchObjectShape,
} from '@/types/immich.types';
import type { GalleryItem } from '@/types/gallery.types';
import type { PortfolioSearchResponse } from './route.types';
import { pickDisplayTitle, toSlug } from '@/lib/strings';

export async function GET() {
    try {
        const baseUrl = process.env.IMMICH_BASE_URL;
        if (!baseUrl) return NextResponse.json({ error: 'IMMICH_BASE_URL not set' }, { status: 500 });

        const albumIdFromEnv = process.env.IMMICH_PORTFOLIO_ALBUM_ID?.trim();
        const albumName = (process.env.IMMICH_PORTFOLIO_ALBUM_NAME || 'Portfolio')
            .trim()
            .toLowerCase();

        let albumId: string | undefined = albumIdFromEnv;
        console.log('[portfolio] env albumId:', albumIdFromEnv, 'env albumName:', albumName);

        if (!albumId) {
            const albums = await immich<ImmichAlbumListItem[]>('/albums');
            console.log('[portfolio] /albums returned:', albums.length, 'albums');
            const found = albums.find(a => a.albumName && a.albumName.trim().toLowerCase() === albumName);
            albumId = found?.id;
            console.log('[portfolio] matched album id by name:', albumId);
        }

        if (!albumId) return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });

        const result = await immich<PortfolioSearchResponse>('/search/metadata', {
            method: 'POST',
            body: JSON.stringify({ albumIds: [albumId], size: 250 }),
        });

        const assets =
            Array.isArray((result as ImmichSearchArrayShape).assets)
                ? (result as ImmichSearchArrayShape).assets
                : (result as ImmichSearchObjectShape).assets?.items;

        // Build items and assign unique slugs (append -2, -3, … on duplicates)
        const slugCounts = new Map<string, number>();

        const items: GalleryItem[] = (assets ?? []).map((asset: ImmichAsset) => {
            const exif = asset.exifInfo ?? {};
            const width = exif.imageWidth ?? undefined;
            const height = exif.imageHeight ?? undefined;

            const title = pickDisplayTitle(exif.imageName, asset.originalFileName, 'Untitled');

            // Generate a unique slug from the title (or a fallback from the ID)
            const baseSlug = toSlug(title ?? '') || `photo-${asset.id.slice(0, 8)}`;
            const count = (slugCounts.get(baseSlug) ?? 0) + 1;
            slugCounts.set(baseSlug, count);
            const slug = count === 1 ? baseSlug : `${baseSlug}-${count}`;

            return {
                id: asset.id,
                slug,
                width: typeof width === 'number' ? width : undefined,
                height: typeof height === 'number' ? height : undefined,
                capturedAt: asset.fileCreatedAt ?? undefined,

                // Title: EXIF first, otherwise filename without extension
                title,

                camera: exif.cameraModel ?? undefined,
                focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
                exposureTime: exif.exposureTime ?? undefined,
                iso: typeof exif.iso === 'number' ? exif.iso : undefined,

                // Slug-based proxy endpoints — no UUID exposed to the browser
                thumbUrl: `/api/image/by-slug/${slug}/thumbnail`,
                originalUrl: `/api/image/by-slug/${slug}/original`,
            };
        });

        console.log('[portfolio] items prepared (search):', items.length);
        return NextResponse.json({ items });
    } catch (e) {
        console.error('[/api/portfolio] error:', e);
        return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
    }
}
