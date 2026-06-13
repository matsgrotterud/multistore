import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory doesn't
  // confuse output file tracing.
  outputFileTracingRoot: path.join(__dirname),
  // All storefront images are served from the local /api/placeholder route in
  // development; real deployments should add their CDN hostnames here.
  images: {
    remotePatterns: [],
  },
  // Multi-tenant rewrites are handled in src/middleware.ts based on the Host
  // header, so no static rewrites are needed here.
};

export default nextConfig;
