/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [ {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',        
      },],
  },
  typescript: {
    // !! Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
