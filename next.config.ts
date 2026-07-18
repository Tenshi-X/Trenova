import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Next.js and Netlify's native adapter handle caching headers automatically
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'trenova-intelligence.vercel.app',
          },
        ],
        destination: 'https://trenova.my.id/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
