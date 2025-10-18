import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // other config options...
  eslint: {
    ignoreDuringBuilds: true, // <-- allows build even if ESLint fails
  },
};

export default nextConfig;
