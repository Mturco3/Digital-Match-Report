const CACHE_NAME = 'refcard-v1';
const ASSETS = [
  '/Digital-Match-Report/',
  '/Digital-Match-Report/referee_scorecard.html',
  '/Digital-Match-Report/game.html',
  '/Digital-Match-Report/referee_scorecard.css',
  '/Digital-Match-Report/storage.js',
  '/Digital-Match-Report/referee_scorecard.js',
  '/Digital-Match-Report/game.js',
  '/Digital-Match-Report/manifest.json',
  '/Digital-Match-Report/icons/icon-192.png',
  '/Digital-Match-Report/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
