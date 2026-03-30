/**
 * public/sw.js
 * Service Worker for Wiryo Family Tree PWA.
 *
 * Strategy:
 *  - App shell (HTML/JS/CSS) → Cache-first, falling back to network
 *  - API calls (/api/*) → Network-first, falling back to a generic offline response
 *
 * Cache versioning: bump CACHE_VERSION whenever you deploy a new shell.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `wiryo-shell-${CACHE_VERSION}`;
const API_CACHE   = `wiryo-api-${CACHE_VERSION}`;

/** Static assets that form the app shell */
const SHELL_ASSETS = [
  "/",
  "/members",
  // Next.js injects hashed filenames; the shell assets below are added
  // dynamically during `install` via self.__WB_MANIFEST in a Workbox setup.
  // For this zero-dependency SW we pre-cache only the known routes.
];

// ── Install ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all open clients
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls → network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Everything else (shell, pages, static) → cache-first
  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

// ── Strategies ────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? offlineApiResponse();
  }
}

function offlineFallback() {
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Wiryo – Offline</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1>🌳 Wiryo</h1>
  <p>You are offline. Please check your connection and try again.</p>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

function offlineApiResponse() {
  return new Response(
    JSON.stringify({ error: "You are offline. Data unavailable." }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}
