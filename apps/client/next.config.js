/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mounasabet/ui"],
  reactStrictMode: true,
  experimental: {
    // appDir: true, // removed as it's not recognized in this Next.js version
  },
}

module.exports = nextConfig
