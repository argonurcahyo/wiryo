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

const CACHE_VERSION  = "v2";
const SHELL_CACHE    = `wiryo-shell-${CACHE_VERSION}`;
const STATIC_CACHE   = `wiryo-static-${CACHE_VERSION}`;
const API_CACHE      = `wiryo-api-${CACHE_VERSION}`;

// Only pre-cache the offline fallback page — live pages are fetched fresh
const PRECACHE_ASSETS = [];

// ── Install ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Activate immediately — the new SW takes over without waiting
  self.skipWaiting();
});

// Allow clients to trigger skipWaiting on demand (for update banners)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  const KEEP = new Set([SHELL_CACHE, STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k)))
      )
      .then(() =>
        // Notify all open tabs so they can show an "update ready" banner
        self.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clients) =>
            clients.forEach((c) => c.postMessage({ type: "NEW_VERSION" }))
          )
      )
  );
  // Take control of all open clients immediately
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

  // Next.js hashed static assets → cache-first (safe: filenames are content-addressed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages & other routes → network-first so users always get fresh content
  event.respondWith(networkFirst(request, SHELL_CACHE));
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
