// lib/constants.ts

/** Server-side revalidation for API data (portfolio list, metadata) — in seconds. */
export const CACHE_REVALIDATE_API = 60; // 60 seconds

/** Server-side revalidation for image binary data (thumbnail, preview, original) — in seconds. */
export const CACHE_REVALIDATE_IMAGE = 3600; // 60 minutes
