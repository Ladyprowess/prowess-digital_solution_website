// Minimal, deliberately conservative service worker. Goals: satisfy PWA
// installability (a controlling SW with a fetch handler), speed up repeat
// visits by caching static assets, and show a real offline page instead of
// the browser's default "no internet" screen. NOT trying to make the whole
// site work fully offline - this is a live jobs/opportunities platform,
// serving stale listings while online would be a real bug, not a feature.

const CACHE_VERSION = "v1";
const CACHE_NAME = `prowess-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only same-origin GET requests are ever intercepted. Cross-origin calls
  // (Supabase, Resend, analytics, Flutterwave) and any non-GET (mutations,
  // checkout, admin writes) always go straight to the network untouched -
  // caching or interfering with those would be a real correctness bug.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  // Page navigations: network-first, since jobs/opportunities/content
  // change and nobody should see stale data while actually online. Falls
  // back to a cached copy of that page, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets: cache-first for speed, refreshing the cache in the
  // background on every hit so it doesn't go stale forever.
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
