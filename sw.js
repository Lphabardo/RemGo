const CACHE_NAME = 'remgo-v1';
const urlsToCache = [
  '/RemGo/',
  '/RemGo/index.html',
  '/RemGo/styles.css',
  '/RemGo/app.js',
  '/RemGo/register.html',
  '/RemGo/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'no-cache' })))
          .catch(err => {
            console.log('Cache addAll failed:', err);
          });
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          // Если сеть недоступна и нет в кэше — ничего не делаем
          return new Response('');
        });
      })
  );
});
