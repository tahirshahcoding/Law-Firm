import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://tahirshahcoding-law-firm.hf.space/api/:path*'
      }
    ];
  },
};

export default nextConfig;
