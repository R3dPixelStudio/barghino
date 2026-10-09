import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ['@react-three/drei', 'three'],
  },
};

export default nextConfig;
