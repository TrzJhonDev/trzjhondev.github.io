// Caché local del portafolio (PLAN-PANTALLA-CARGA.md, punto 5). Solo en producción (lo registra main.jsx).
//  - /assets/ (código con hash en el nombre): primero la caché; si cambia el código, cambia el nombre.
//  - /models/ y /img/ (sin hash): se sirve lo guardado y se actualiza por detrás; la próxima visita ya trae lo nuevo.
//  - La página (HTML): siempre de la red, para que una versión nueva se vea al momento (la caché solo sin conexión).
const CACHE = 'trz-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  if (path.includes('/assets/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })));
  } else if (//(models|img)//.test(path)) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  } else if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; }).catch(() => caches.match(req)));
  }
});
