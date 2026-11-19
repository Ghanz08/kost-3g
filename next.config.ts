import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Image Docker ringkas untuk VPS (lihat Dockerfile).
  output: "standalone",
  experimental: {
    // Foto KTP, bukti bayar, dan foto galeri diunggah lewat Server Action.
    serverActions: { bodySizeLimit: "10mb" },
  },
  partialPrefetching: true,
  // Umami (analitik tanpa cookie) di VPS, tidak dibuka ke internet: script dan kiriman event lewat domain situs sendiri.
  async rewrites() {
    const umami = process.env.UMAMI_URL ?? "http://127.0.0.1:3200";
    return [
      { source: "/u/script.js", destination: `${umami}/script.js` },
      { source: "/u/api/send", destination: `${umami}/api/send` },
    ];
  },
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
