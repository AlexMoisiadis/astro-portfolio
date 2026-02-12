// app/api/photo/[id]/metadata/route.types.ts
import type { ImmichExifInfo } from '@/types/immich.types';

export type AssetResponse = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ImmichExifInfo | null;
};

export const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;