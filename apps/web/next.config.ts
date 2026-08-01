import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@moments/shared', '@moments/api', '@moments/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
