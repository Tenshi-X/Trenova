import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ETags to prevent Netlify CDN from serving stale HTML with wrong chunk references
  generateEtags: false,

  async headers() {
    return [
      {
        // Apply no-cache to all HTML pages so browsers/CDN always fetch fresh HTML
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // Hashed static assets are safe to cache forever (content-addressed)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
