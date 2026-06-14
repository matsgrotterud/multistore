import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory doesn't
  // confuse output file tracing.
  outputFileTracingRoot: path.join(__dirname),
  // Storefront images come from the local /api/placeholder route and admin
  // uploads under /uploads/** in development; real deployments should add their
  // CDN/object-storage hostnames to remotePatterns. localPatterns whitelists the
  // upload path for next/image (the storefront uses plain <img> today, but this
  // keeps the path valid if/when imagery migrates to next/image).
  images: {
    remotePatterns: [],
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/api/placeholder" }],
  },
  // Multi-tenant rewrites are handled in src/middleware.ts based on the Host
  // header, so no static rewrites are needed here.
};

export default nextConfig;
