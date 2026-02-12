// types/gallery.types.ts
export type GalleryItem = {
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

export type PhotoMeta = {
    id: string;
    width?: number;
    height?: number;
    capturedAt?: string;
    title?: string;
    camera?: string;
    lens?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
    sensorTemp?: number;
    description?: string;    // Immich exifInfo.description (acquisition notes)
    originalUrl: string;     // upstream original (not the proxied one)
    integration?: string;
    mount?: string;
    filters?: string;
};