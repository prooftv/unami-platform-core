import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@unami/shared', '@unami/api', '@unami/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
