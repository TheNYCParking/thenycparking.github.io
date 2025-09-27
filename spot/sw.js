const CACHE_NAME = 'uspotly-cache-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

const DATA_URL = "https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=5000";

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

// Respond with cache-first for app shell, network-first for data requests
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // If request is the dataset URL, try network then cache fallback
  if (req.url.startsWith('https://data.cityofnewyork.us/resource/')) {
    event.respondWith(
      fetch(req).then(res => {
        // put copy in cache
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || new Response('[]', { headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }

  // Otherwise app shell: cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(()=>caches.match('/index.html')))
  );
});
