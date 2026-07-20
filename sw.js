const CACHE_VERSION = 'crave-pwa-v2';
const STATIC_CACHE = `crave-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `crave-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = 'offline.html';
const STATIC_ASSETS = [
  'index.html',
  'menu.html',
  'about.html',
  'cart.html',
  'checkout.html',
  'reservation.html',
  'tracking.html',
  'offline.html',
  'css/main.css',
  'css/util.css',
  'css/crave-home.css',
  'favicon.png',
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'js/main.js',
  'js/vendor-setup.js',
  'js/swiper-custom.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
        return caches.delete(key);
      }
      return null;
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then(res => res || caches.match('index.html'))));
    return;
  }

  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')) || url.pathname === asset)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request))));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(OFFLINE_URL)))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'CRAVE';
  const options = {
    body: payload.body || 'A fresh update is waiting for you.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: payload.tag || 'crave-notification',
    data: payload.data || { url: self.registration.scope },
    vibrate: [120, 60, 120]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : self.registration.scope;
      for (const client of clientList) {
        if (client.url === targetUrl || client.url.startsWith(targetUrl)) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
