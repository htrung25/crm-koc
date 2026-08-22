import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Runner image chỉ chạy `node server.js`, không có node_modules đầy đủ.
  output: "standalone",
  // The repository has lockfiles at both the monorepo root and this app root.
  // Pin Turbopack to the app without overriding Vercel's output file tracing.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withNextIntl(nextConfig);
