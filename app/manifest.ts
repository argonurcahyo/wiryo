/**
 * app/manifest.ts
 * Next.js App Router built-in PWA manifest.
 * Served automatically at /manifest.webmanifest
 *
 * Place icon files in /public/icons/ before deploying.
 * Recommended sizes: 192×192 and 512×512 PNG.
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wiryo – Family Tree",
    short_name: "Wiryo",
    description: "A multi-generation family tree app.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#059669",
    categories: ["lifestyle", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      // Add screenshots for richer install UI on Android
      // { src: "/screenshots/home.png", sizes: "1280x720", type: "image/png" },
    ],
  };
}
