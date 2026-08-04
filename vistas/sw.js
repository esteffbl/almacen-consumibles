// Service Worker para funcionamiento 100% Offline (Sin Internet)
const CACHE_NAME = 'qr-inventory-cache-v1';
const ASSETS_TO_CACHE = [
  'index.php',
  'estilos/styles.css',
  'js/data.js',
  'js/data_history.js',
  'js/app.js',
  'js/imagen1_base64.js',
  'Imagen1.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('index.php');
    })
  );
});
