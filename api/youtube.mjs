// Pimath: buscador de videos de YouTube.
// Va en la carpeta "api" de tu repositorio: api/youtube.mjs
// Necesita una clave de la API de YouTube Data v3 en Vercel (variable YOUTUBE_API_KEY).
// Si no existe, intenta con GEMINI_API_KEY (solo funciona si esa clave tiene activada la API de YouTube).

export const config = { maxDuration: 15 };

function limpiarTexto(t) {
  return String(t || '')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'metodo_no_permitido' }); return; }

  const q = String((req.query && req.query.q) || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!q) { res.status(400).json({ error: 'sin_consulta' }); return; }

  const clave = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
  if (!clave) { res.status(500).json({ error: 'sin_clave' }); return; }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '12');
  url.searchParams.set('q', q);
  url.searchParams.set('relevanceLanguage', 'es');
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('key', clave);

  let r;
  try { r = await fetch(url); } catch (e) { res.status(502).json({ error: 'sin_conexion' }); return; }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    res.status(502).json({ error: 'youtube_' + r.status, detalle: t.slice(0, 160) });
    return;
  }

  const datos = await r.json().catch(() => ({}));
  const items = Array.isArray(datos.items) ? datos.items : [];

  // Se muestran videos de canales distintos primero (más variedad), y luego el resto
  const vistos = new Set();
  const primeros = [];
  const resto = [];
  items.forEach((i) => {
    const id = i && i.id && i.id.videoId;
    const s = i && i.snippet;
    if (!id || !s) return;
    const video = {
      id,
      title: limpiarTexto(s.title),
      canal: limpiarTexto(s.channelTitle),
      thumb: (s.thumbnails && ((s.thumbnails.medium && s.thumbnails.medium.url) || (s.thumbnails.default && s.thumbnails.default.url))) || ''
    };
    if (!vistos.has(s.channelId)) { vistos.add(s.channelId); primeros.push(video); } else resto.push(video);
  });
  const videos = primeros.concat(resto).slice(0, 6);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({ videos });
}
