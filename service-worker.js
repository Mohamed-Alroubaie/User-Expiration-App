const CACHE_NAME = `user-expiration-cache-v${new Date().getTime()}`;
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  OFFLINE_URL,
  '/icons/favicon-96x96.png',
  '/icons/favicon.svg',
  '/icons/favicon.ico',
  '/icons/apple-touch-icon.png',
  '/icons/logo-192x192.png',
  '/icons/logo-512x512.png',
];

// Install: Precache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Enhanced strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const { request } = event;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Only cache successful responses (status 200) and basic types
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If the fetch fails (offline), return the cached one or fallback
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return cached;
        });

      // Respond with cached version first, then update in the background
      return cached || fetchPromise;
    })
  );
});
