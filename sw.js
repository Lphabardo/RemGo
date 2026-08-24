const CACHE_NAME = 'remgo-v1';
const urlsToCache = [
  '/RemGo/',
  '/RemGo/index.html',
  '/RemGo/styles.css',
  '/RemGo/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
