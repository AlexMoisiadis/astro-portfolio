// next.config.ts
import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

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
  images: {
    remotePatterns,
  },
};

export default nextConfig;
