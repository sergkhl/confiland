import type { NextConfig } from 'next';

const nextConfig: NextConfig =
  process.env.CONFILAND_STATIC_EXPORT === '1'
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {};

export default nextConfig;
