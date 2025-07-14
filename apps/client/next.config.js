/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@weddni/ui"],
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
