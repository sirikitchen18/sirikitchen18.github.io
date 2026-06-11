const CACHE = 'siri-kitchen-v1';
const SHELL = [
  '/',
  '/index.html',
  '/images/banner-desktop.jpg',
  '/images/banner-mobile.jpg',
  '/promoCodes.json',
  '/itemTags.json'
];

// Install — cache the app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // Cache successful responses for shell assets
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(e.request).then(function(cached) {
          return cached || new Response('Offline — please reconnect to order.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
