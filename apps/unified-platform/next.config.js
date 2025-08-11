/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages for Next.js 15
  serverExternalPackages: ['@mounasabet/database'],
  // Transpile packages from the monorepo
  transpilePackages: [
    '@mounasabet/ui',
    '@mounasabet/events',
    '@mounasabet/pricing',
    '@mounasabet/notifications',
    '@mounasabet/users',
    '@mounasabet/utils',
    '@mounasabet/types',
    '@mounasabet/calendar',
  ],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@mounasabet/ui',
      '@mounasabet/events',
      '@mounasabet/pricing',
      '@mounasabet/notifications',
      '@mounasabet/users',
      '@mounasabet/utils',
      '@mounasabet/types',
      '@mounasabet/calendar',
    ],
  },
  // Compression
  compress: true,
  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;