// app/api/photo/[id]/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { immich } from '@/lib/immich';

type ExifInfo = {
    imageWidth?: number | null;
    imageHeight?: number | null;
    imageName?: string | null;
    cameraModel?: string | null;
    lensModel?: string | null;
    focalLength?: number | null;
    exposureTime?: string | null;
    iso?: number | null;
    temperature?: number | null;
};

type AssetResponse = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ExifInfo | null;
};

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> } // <-- params is a Promise in Next 16
) {
    try {
        const { id } = await ctx.params; // <-- unwrap
        const assetId = decodeURIComponent(id ?? '');

        if (!UUID_RE.test(assetId)) {
            return NextResponse.json(
                { error: 'Bad id (must be a UUID)' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.IMMICH_BASE_URL!;
        const asset = await immich<AssetResponse>(`/assets/${assetId}`);

        if (!asset || !asset.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const exif = asset.exifInfo ?? {};
        const meta = {
            id: asset.id,
            width: typeof exif.imageWidth === 'number' ? exif.imageWidth : undefined,
            height: typeof exif.imageHeight === 'number' ? exif.imageHeight : undefined,
            capturedAt: asset.fileCreatedAt ?? undefined,
            title: exif.imageName ?? asset.originalFileName ?? undefined,
            camera: exif.cameraModel ?? undefined,
            lens: exif.lensModel ?? undefined,
            focalLength: typeof exif.focalLength === 'number' ? exif.focalLength : undefined,
            exposureTime: exif.exposureTime ?? undefined,
            iso: typeof exif.iso === 'number' ? exif.iso : undefined,
            sensorTemp: typeof exif.temperature === 'number' ? exif.temperature : undefined,
            originalUrl: `${baseUrl}/api/assets/${asset.id}/original`,
            integration: undefined,
            mount: undefined,
            filters: undefined,
        };

        return NextResponse.json(meta);
    } catch (err) {
        // Surface the Immich error body for easier diagnosis in logs
        console.error('[metadata] error:', err);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}