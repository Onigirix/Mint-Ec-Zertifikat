const FONT_CACHE = 'mint-ec-fonts-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(FONT_CACHE)
      .then(cache => cache.add('/assets/MaterialSymbolsRounded.woff2'))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Continue even if cache fails
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only intercept font requests
  if (event.request.url.endsWith('.woff') || event.request.url.endsWith('.woff2')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response; // Return from cache
          }
          // Not in cache, fetch and cache it
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              return caches.open(FONT_CACHE).then(cache => {
                cache.put(event.request, response.clone());
                return response;
              });
            }
            return response;
          });
        })
        .catch(() => fetch(event.request)) // Fallback to network
    );
  }
  // All other requests pass through normally (don't intercept)
});
