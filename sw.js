// Service Worker de Pimath IA
// Cachea el "esqueleto" de la app (HTML, íconos) para que se pueda instalar
// y abrir rápido. NUNCA cachea /api/chat (las respuestas de la IA deben ser
// siempre frescas, nunca repetidas desde caché).

const CACHE_NAME = 'pimath-ia-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Nunca interceptar llamadas a la API: siempre deben ir a la red, en vivo.
  if (request.url.includes('/api/')) {
    return;
  }
  // Solo cachear peticiones GET de nuestro propio origen.
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
