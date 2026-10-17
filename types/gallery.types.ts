// types/gallery.types.ts
export type GalleryItem = {
    slug: string;
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
