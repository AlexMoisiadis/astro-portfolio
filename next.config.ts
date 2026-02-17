// next.config.ts
import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import { CACHE_REVALIDATE_IMAGE } from './lib/constants';

const remotePatterns: RemotePattern[] = [];

if (process.env.IMMICH_BASE_URL) {
  const u = new URL(process.env.IMMICH_BASE_URL);

  remotePatterns.push({
    protocol: (u.protocol.replace(':', '') as 'http' | 'https'),
    hostname: u.hostname,
    port: u.port || undefined,   // optional
    pathname: '/**',
  });
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns,
    // How long (in seconds) the Next.js image optimizer caches optimized images.
    // In development (`next dev`) this is ignored — images are always revalidated.
    minimumCacheTTL: CACHE_REVALIDATE_IMAGE,
  },
};

export default nextConfig;
