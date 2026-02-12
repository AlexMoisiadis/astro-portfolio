// types/immich.types.ts
/** Minimal Immich Album summary (only the fields we read) */
export type ImmichAlbumListItem = {
    id: string;
    albumName?: string | null;
};

/** Immich EXIF subset we actually use */
export type ImmichExifInfo = {
    imageWidth?: number | null;
    imageHeight?: number | null;
    imageName?: string | null;
    cameraModel?: string | null;
    lensModel?: string | null;
    focalLength?: number | null;
    exposureTime?: string | null;
    iso?: number | null;
    temperature?: number | null;
    description?: string | null;
};

/** Immich Asset (search + asset get share a similar subset) */
export type ImmichAsset = {
    id: string;
    fileCreatedAt?: string | null;
    originalFileName?: string | null;
    exifInfo?: ImmichExifInfo | null;
};

/** Some Immich versions return `assets` as an array, others as { items: [] } */
export type ImmichSearchArrayShape = { assets?: ImmichAsset[] | null };
export type ImmichSearchObjectShape = { assets?: { items?: ImmichAsset[] | null } | null };

/** Album detail referencing assets by id (older path we sometimes use as fallback) */
export type ImmichAlbumAssetRef = { assetId: string };
export type ImmichAlbumDetail = { id: string; assets?: ImmichAlbumAssetRef[] | null };