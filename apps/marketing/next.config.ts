import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configuration expérimentale désactivée pour le moment
  // experimental: {
  //   serverActions: true,
  // },
};

export default nextConfig;
