// Public/sw.js
const CACHE_NAME = "rose-v1";

// Replaced at build time by the swManifestPlugin with the actual emitted asset list.
// In dev (sw.js served as-is), this stays as an empty array — no precaching needed.
const PRECACHE_MANIFEST =
  "__PRECACHE_MANIFEST__" !== "__PRECACHE_MANIFEST__" ? __PRECACHE_MANIFEST__ : [];

// ── Install: precache all app shell assets ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_MANIFEST)));
  // Activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: delete stale caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// ── Fetch: cache-first for precached assets, network-first for the rest ─────
self.addEventListener("fetch", (event) => {
  // Only handle GET requests; skip non-http(s) schemes (chrome-extension, etc.)
  if (event.request.method !== "GET") {return;}
  const url = new URL(event.request.url);
  if (!["http:", "https:"].includes(url.protocol)) {return;}

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {return cached;}

      // Not in cache — fetch from network, cache successful responses
      return fetch(event.request)
        .then((response) => {
          // Only cache same-origin, successful, basic responses
          if (response.ok && response.type === "basic" && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve index.html for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    }),
  );
});

// ── Message: force update from the app UI ───────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {self.skipWaiting();}
});
