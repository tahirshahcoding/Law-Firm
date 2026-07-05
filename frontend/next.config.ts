import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache the daily diary API responses
        urlPattern: /\/api\/diary\/today\//,
        handler: "NetworkFirst",
        options: {
          cacheName: "diary-today-cache",
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // Cache tasks API responses
        urlPattern: /\/api\/tasks\//,
        handler: "NetworkFirst",
        options: {
          cacheName: "tasks-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // Cache cases API responses
        urlPattern: /\/api\/cases\//,
        handler: "NetworkFirst",
        options: {
          cacheName: "cases-cache",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 12 * 60 * 60, // 12 hours
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  turbopack: {},
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = isDev 
      ? 'http://localhost:8000' 
      : 'https://tahirshahcoding-law-firm.hf.space';
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend to avoid CORS completely
      },
    ];
  },
};

export default nextConfig;
