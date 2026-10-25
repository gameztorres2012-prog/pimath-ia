// Service Worker de Pimath IA
// - Guarda el "esqueleto" de la app (HTML, estilos, scripts, íconos) para abrir rápido y sin internet.
// - Guarda las librerías externas (KaTeX, fuentes y el motor del modo sin internet).
// - NUNCA guarda /api/ (las respuestas de la IA deben ser siempre frescas).
// - NO borra la caché del modelo de IA del modo sin internet (la maneja transformers.js).

const CACHE_NAME = 'pimath-ia-v4';
const CDN_CACHE = 'pimath-ia-cdn-v1';
const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/gemini-barra.css',
  '/scroll-fix.js',
  '/premium-ui.js',
  '/portada.js',
  '/portada.json',
  '/offline-ia.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Si algún archivo no existe todavía, no se cancela la instalación
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          // Solo borra cachés viejas de Pimath; nunca la del modelo de IA
          .filter((n) => n.startsWith('pimath-ia-') && n !== CACHE_NAME && n !== CDN_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }

  // Nunca interceptar llamadas a la API: siempre deben ir a la red, en vivo.
  if (url.pathname.startsWith('/api/')) return;

  // Librerías externas (KaTeX, fuentes, motor de IA): primero la copia guardada
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CDN_CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          if (hit) return hit;
          return fetch(request).then((response) => {
            if (response && (response.status === 200 || response.type === 'opaque')) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Archivos propios de Pimath
  if (url.origin !== self.location.origin) return;

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
