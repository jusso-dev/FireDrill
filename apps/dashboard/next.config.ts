import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@firedrill/shared"],
  output: "standalone",
  experimental: {
    typedRoutes: false,
  },
};

export default config;
