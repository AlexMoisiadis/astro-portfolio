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
import { pickDisplayTitle } from '@/lib/strings';  // <-- import

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

        const items: GalleryItem[] = (assets ?? []).map((asset: ImmichAsset) => {
            const exif = asset.exifInfo ?? {};
            const width = exif.imageWidth ?? undefined;
            const height = exif.imageHeight ?? undefined;

            return {
                id: asset.id,
                width: typeof width === 'number' ? width : undefined,
                height: typeof height === 'number' ? height : undefined,
                capturedAt: asset.fileCreatedAt ?? undefined,

                // Title: EXIF first, otherwise filename without extension
                title: pickDisplayTitle(exif.imageName, asset.originalFileName, 'Untitled'),

                camera: exif.cameraModel ?? undefined,
                focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
                exposureTime: exif.exposureTime ?? undefined,
                iso: typeof exif.iso === 'number' ? exif.iso : undefined,

                // Proxy endpoints so the browser doesn’t need the API key
                thumbUrl: `/api/image/${asset.id}/thumbnail`,
                originalUrl: `/api/image/${asset.id}/original`,
            };
        });

        console.log('[portfolio] items prepared (search):', items.length);
        return NextResponse.json({ items });
    } catch (e) {
        console.error('[/api/portfolio] error:', e);
        return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
    }
}