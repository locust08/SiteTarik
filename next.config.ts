import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  devIndicators: false,
};

export default nextConfig;
