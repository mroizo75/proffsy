import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'engangslisens.no',
      },
      {
        protocol: 'https',
        hostname: 'www.engangslisens.no',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Håndter lokale bilder
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      }
    ]
  },
  // Konfigurer hvor bildene skal lagres
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: 'asset/resource',
    })
    return config
  },
  async redirects() {
    return [
      {
        source: '/:path*.map',
        destination: '/404',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
