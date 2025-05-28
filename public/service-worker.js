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
  if (event.request.method !== 'GET') {
    return;
  }
  // Skip caching for API requests and external resources
  if (event.request.url.includes('/api/') || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((fallback) => {
          if (fallback) return fallback;
          return new Response('<h1>Offline</h1><p>The app is offline and the page is not cached.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
      )
    );
    return;
  }

  // For assets (JS/CSS/images), try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid, update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              console.warn('Cache put failed:', err);
            });
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For assets, do NOT fallback to /index.html
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        })
      )
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
