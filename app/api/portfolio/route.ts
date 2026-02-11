// app/api/portfolio/route.ts
import { NextResponse } from 'next/server';
import { immich } from '@/lib/immich';

/**
 * Minimal types for just what we use from Immich.
 * If Immich changes its API or you need more fields, extend these.
 */

type AlbumListItem = {
    id: string;
    albumName?: string | null;
};

type AlbumAssetRef = {
    assetId: string; // the id of the asset in this album
};

type AlbumDetail = {
    id: string;
    assets?: AlbumAssetRef[];
};

type ExifInfo = {
    imageWidth?: number | null;
    imageHeight?: number | null;
    imageName?: string | null;
    cameraModel?: string | null;
    focalLength?: number | null;
    exposureTime?: string | null; // Immich returns as string (e.g., "120")
    iso?: number | null;
};

type SearchAsset = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ExifInfo | null;
};

type SearchMetadataResponse = {
    assets?: SearchAsset[];
};

type GalleryItem = {
    id: string;
    width?: number;
    height?: number;
    capturedAt?: string;
    title?: string;
    camera?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
    thumbUrl: string;
    originalUrl: string;
};

export async function GET() {
    try {
        const baseUrl = process.env.IMMICH_BASE_URL;
        if (!baseUrl) {
            return NextResponse.json({ error: 'IMMICH_BASE_URL not set' }, { status: 500 });
        }

        // 1) Resolve album id either from ENV or by name lookup
        const albumIdFromEnv = process.env.IMMICH_PORTFOLIO_ALBUM_ID?.trim();
        const albumName = (process.env.IMMICH_PORTFOLIO_ALBUM_NAME || 'Portfolio').trim().toLowerCase();

        let albumId: string | undefined = albumIdFromEnv;

        if (!albumId) {
            const albums = await immich<AlbumListItem[]>('/albums');

            const found = albums.find(
                (a) => a.albumName && a.albumName.trim().toLowerCase() === albumName,
            );
            albumId = found?.id;
        }

        if (!albumId) {
            // No album found—return empty gallery instead of throwing
            return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
        }

        // 2) Fetch album detail to get asset IDs
        const album = await immich<AlbumDetail>(`/albums/${albumId}`);
        const assetIds = (album.assets ?? []).map((x) => x.assetId).filter(Boolean);

        if (assetIds.length === 0) {
            return NextResponse.json({ items: [] as GalleryItem[] }, { status: 200 });
        }

        // 3) Fetch asset metadata in chunks via the search endpoint
        const pageSize = 200;
        const items: GalleryItem[] = [];

        for (let i = 0; i < assetIds.length; i += pageSize) {
            const chunk = assetIds.slice(i, i + pageSize);

            const result = await immich<SearchMetadataResponse>('/search/metadata', {
                method: 'POST',
                body: JSON.stringify({ ids: chunk, size: 250 }),
            });

            for (const asset of result.assets ?? []) {
                const exif = asset.exifInfo ?? {};

                const width = exif.imageWidth ?? undefined;
                const height = exif.imageHeight ?? undefined;

                items.push({
                    id: asset.id,
                    width: typeof width === 'number' ? width : undefined,
                    height: typeof height === 'number' ? height : undefined,
                    capturedAt: asset.fileCreatedAt ?? undefined,
                    title: exif.imageName ?? asset.originalFileName ?? undefined,
                    camera: exif.cameraModel ?? undefined,
                    focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
                    exposureTime: exif.exposureTime ?? undefined,
                    iso: typeof exif.iso === 'number' ? exif.iso : undefined,
                    // Use the configured base; Next.js Image allowlist must include this host
                    thumbUrl: `${baseUrl}/api/assets/${asset.id}/thumbnail`,
                    originalUrl: `${baseUrl}/api/assets/${asset.id}/original`,
                });
            }
        }

        return NextResponse.json({ items });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }
}