import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repository has lockfiles at both the monorepo root and this app root.
  // Pin Turbopack to the app without overriding Vercel's output file tracing.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
