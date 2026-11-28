// La web de Astro (27/11/2026) ya no usa caché local. Este archivo existe solo para quien visitó la web anterior,
// que registraba un service worker con este nombre: al actualizarse, borra su caché y se da de baja, y la página
// vuelve a cargarse normal desde la red. Se puede borrar dentro de unos meses.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
