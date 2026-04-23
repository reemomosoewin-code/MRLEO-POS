// Mr.Leo POS - Service Worker
const CACHE_NAME = 'mrleo-pos-v1';

// Install event
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
