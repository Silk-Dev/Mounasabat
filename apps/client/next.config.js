/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@weddni/ui"],
  reactStrictMode: true,
  experimental: {
    // appDir: true, // removed as it's not recognized in this Next.js version
  },
}

module.exports = nextConfig
