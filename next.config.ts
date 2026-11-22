import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel sets VERCEL_ENV to production, preview, or development. Expose it so
  // client and static markup can tell a production deploy from a preview or a
  // local `npm start`.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Redirects are applied in proxy.ts so the destination drops the request query.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
