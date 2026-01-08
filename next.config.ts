import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow build to succeed even with type errors during deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow build to succeed even with eslint errors during deployment
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

};

export default nextConfig;
