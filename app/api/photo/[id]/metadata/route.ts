import { NextRequest, NextResponse } from 'next/server';
import { immich } from '@/lib/immich';
import type { PhotoMeta } from '@/types/gallery.types';
import { UUID_RE, type AssetResponse } from './route.types';

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;            // Next 16: params is a Promise
        const assetId = decodeURIComponent(id ?? '');

        if (!UUID_RE.test(assetId)) {
            return NextResponse.json({ error: 'Bad id (must be a UUID)' }, { status: 400 });
        }

        const baseUrl = process.env.IMMICH_BASE_URL!;
        const asset = await immich<AssetResponse>(`/assets/${assetId}`);
        if (!asset || !asset.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const exif = asset.exifInfo ?? {};
        const meta: PhotoMeta = {
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
            description: exif.description ?? undefined,        // acquisition notes
            originalUrl: `${baseUrl}/api/assets/${asset.id}/original`,
            integration: undefined,
            mount: undefined,
            filters: undefined,
        };

        return NextResponse.json(meta);
    } catch (err) {
        console.error('[metadata] error:', err);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}