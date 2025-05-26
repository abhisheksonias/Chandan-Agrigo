// Simple service worker for PWA offline support
const CACHE_NAME = 'chandan-agrico-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/CAPL_Logo.png',
  '/TRISHUL_Logo.png',
  // Add more assets as needed
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
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
});
