
const CACHE_NAME = 'loftdesk-v56';
const OFFLINE_URLS = ['/', '/manifest.webmanifest'];
const SKIP_CACHE = ['/api/', 'supabase.co', '/portal-get', '/portal-message', '.netlify/functions'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache API or Supabase requests
  const url = event.request.url;
  if (SKIP_CACHE.some((s) => url.includes(s))) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return caches.match('/');
  }));
});
