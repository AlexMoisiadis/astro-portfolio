// app/(photo)/[id]/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { immich } from '@/lib/immich';

/**
 * Minimal types for the Immich asset response, limited to fields we use.
 * Extend if you need more.
 */
type ExifInfo = {
    imageWidth?: number | null;
    imageHeight?: number | null;
    imageName?: string | null;
    cameraModel?: string | null;
    lensModel?: string | null;
    focalLength?: number | null;
    exposureTime?: string | null; // commonly a string in Immich
    iso?: number | null;
    temperature?: number | null;
};

type AssetResponse = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ExifInfo | null;
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const baseUrl = process.env.IMMICH_BASE_URL;
        if (!baseUrl) {
            return NextResponse.json({ error: 'IMMICH_BASE_URL not set' }, { status: 500 });
        }

        const asset = await immich<AssetResponse>(`/assets/${params.id}`);

        if (!asset || !asset.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const exif = asset.exifInfo ?? {};

        const width = exif.imageWidth ?? undefined;
        const height = exif.imageHeight ?? undefined;

        const meta = {
            id: asset.id,
            width: typeof width === 'number' ? width : undefined,
            height: typeof height === 'number' ? height : undefined,
            capturedAt: asset.fileCreatedAt ?? undefined,
            title: exif.imageName ?? asset.originalFileName ?? undefined,
            camera: exif.cameraModel ?? undefined,
            lens: exif.lensModel ?? undefined,
            focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
            exposureTime: exif.exposureTime ?? undefined,
            iso: typeof exif.iso === 'number' ? exif.iso : undefined,
            sensorTemp: typeof exif.temperature === 'number' ? exif.temperature : undefined,

            // Your own optional/custom fields; keep undefined unless you have a source
            integration: undefined as string | undefined,
            mount: undefined as string | undefined,
            filters: undefined as string | undefined,

            // Original image URL served by Immich
            originalUrl: `${baseUrl}/api/assets/${asset.id}/original`,
        };

        return NextResponse.json(meta);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}