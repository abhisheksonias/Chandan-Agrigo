// Simple service worker for PWA offline support
const CACHE_NAME = 'chandan-agrico-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/CAPL_Logo.png',
  '/TRISHUL_Logo.png',
  '/format.jpg', // Ensure PDF background is cached for offline use
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        // Don't block install if some files fail to cache
        console.warn('Failed to cache some resources:', error);
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API requests and external resources
  if (event.request.url.includes('/api/') || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = networkResponse.clone();

        // Only cache successful responses for same-origin requests
        if (event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              // Don't block on cache put errors
              console.warn('Cache put failed:', err);
            });
          });
        }

        return networkResponse;
      }).catch((error) => {
        // If navigation request fails, always try to return index.html from cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html').then((fallback) => {
            if (fallback) return fallback;
            // As a last resort, return a simple offline response
            return new Response('<h1>Offline</h1><p>The app is offline and the page is not cached.</p>', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        }
        // For other requests, just fail
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});
