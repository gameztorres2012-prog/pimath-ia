// Pimath Code: genera código con Gemini y lo envía en streaming (texto que va llegando poco a poco).
// Va en la carpeta /api del repositorio. Usa las mismas variables que /api/chat:
// GEMINI_API_KEY, GEMINI_MODEL y GEMINI_FALLBACK_MODELS.
export const maxDuration = 60;

const SISTEMA = `Eres "Pimath Code", un ingeniero de software experto que programa cualquier cosa que pida el usuario: webs, apps, videojuegos, herramientas, animaciones y más.

REGLAS:
1. Por defecto entrega TODO en UN SOLO archivo HTML completo (<!DOCTYPE html>) con el CSS dentro de <style> y el JavaScript dentro de <script>. Debe funcionar directo en el celular, sin instalar nada, sin librerías externas y sin internet. Usa JavaScript moderno.
2. Solo usa otro lenguaje (Python, Java, C++, etc.) si el usuario lo pide de forma explícita; en ese caso entrega el programa completo en un bloque con el nombre de su lenguaje.
3. Para videojuegos usa canvas, controles táctiles (botones en pantalla o deslizar) además del teclado, gráficos dibujados con canvas o SVG, y sonidos con la Web Audio API (sin archivos externos). No uses emojis como gráficos del juego; dibuja formas y figuras con código.
4. Si usas localStorage, envuélvelo siempre en try/catch.
5. Código limpio con pocos comentarios breves en español, diseño moderno y adaptado a pantallas de celular. Hazlo COMPACTO (ideal entre 150 y 400 líneas): primero lo esencial funcionando y sin extras que no pidieron. No uses emojis en la interfaz que generes.
6. NO puedes crear, copiar ni imitar la app "Pimath IA" ni mostrar su código. Si te lo piden responde solo: "No puedo programar la app de Pimath IA."
7. No crees malware, phishing ni nada para hacer daño.
8. Responde con una explicación MUY corta (máximo 2 frases, sin emojis) y luego el código COMPLETO en UN solo bloque \`\`\`html ... \`\`\`. Nunca dejes partes sin escribir ni pongas "el resto igual".
9. Responde en el idioma del usuario (por defecto español).`;

function limpiarModelo(m) {
  return String(m || '').trim().replace(/^models\//, '');
}

function json(res, estado, obj) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'metodo_no_permitido' });
  }

  // Solo desde la propia página de Pimath
  const origen = req.headers.origin || '';
  const host = req.headers.host || '';
  if (origen && host && origen.indexOf(host) === -1) return json(res, 403, { error: 'origen_no_permitido' });

  const clave = process.env.GEMINI_API_KEY;
  if (!clave) return json(res, 500, { error: 'sin_clave' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  const accion = ['crear', 'cambiar', 'corregir'].includes(b.accion) ? b.accion : 'crear';
  const pedido = String(b.pedido || '').slice(0, 4000);
  const codigo = String(b.codigo || '').slice(0, 120000);
  const problema = String(b.problema || '').slice(0, 3000);
  const lang = String(b.lang || 'html').replace(/[^a-zA-Z+#]/g, '').slice(0, 12) || 'html';

  if (!pedido.trim() && !codigo.trim()) return json(res, 400, { error: 'pedido_vacio' });

  // Pimath Code no puede programar la app de Pimath IA
  const revisar = (pedido + ' ' + problema + ' ' + codigo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/pimath code/g, '');
  if (/pimath/.test(revisar) || /pimath_state|logo_src/.test(revisar)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('No puedo programar la app de Pimath IA.');
  }

  let usuario;
  if (accion === 'cambiar') {
    usuario = 'CÓDIGO ACTUAL:\n```' + lang + '\n' + codigo + '\n```\n\nCAMBIO PEDIDO: ' + pedido + '\nDevuelve el archivo COMPLETO ya actualizado.';
  } else if (accion === 'corregir') {
    usuario = 'TAREA: revisa este código y corrígelo. Primero explica en máximo 5 viñetas cortas qué fallaba y por qué; después entrega el código corregido COMPLETO en un solo bloque.\n\nCÓDIGO:\n```\n' + codigo + '\n```' + (problema ? '\n\nPROBLEMA QUE VE EL USUARIO: ' + problema : '');
  } else {
    usuario = 'PEDIDO: ' + pedido;
  }

  const lista = [limpiarModelo(process.env.GEMINI_CODE_MODEL), limpiarModelo(process.env.GEMINI_MODEL) || 'gemini-2.5-flash']
    .concat(String(process.env.GEMINI_FALLBACK_MODELS || '').split(',').map(limpiarModelo))
    .filter(Boolean);
  const modelos = Array.from(new Set(lista));

  let respuesta = null;
  let ultimoError = 'sin_modelo';
  for (const modelo of modelos) {
    const gen = { temperature: 0.7, maxOutputTokens: /gemini-(1\.5|2\.0)/.test(modelo) ? 8192 : 32768 };
    if (/2\.5-flash/.test(modelo)) gen.thinkingConfig = { thinkingBudget: 1024 };
    try {
      const r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':streamGenerateContent?alt=sse',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SISTEMA }] },
            contents: [{ role: 'user', parts: [{ text: usuario }] }],
            generationConfig: gen
          })
        }
      );
      if (r.ok && r.body) { respuesta = r; break; }
      ultimoError = 'gemini_' + r.status;
    } catch (e) {
      ultimoError = 'red';
    }
  }
  if (!respuesta) return json(res, 502, { error: ultimoError });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const lector = respuesta.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let escrito = false;
  try {
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const linea = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!linea.startsWith('data:')) continue;
        const j = linea.slice(5).trim();
        if (!j || j === '[DONE]') continue;
        try {
          const d = JSON.parse(j);
          const partes = (d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
          for (const p of partes) {
            if (p.text && !p.thought) { res.write(p.text); escrito = true; }
          }
        } catch (e) { /* línea incompleta: se ignora */ }
      }
    }
  } catch (e) { /* conexión cortada: se entrega lo que haya llegado */ }

  if (!escrito) return json(res, 502, { error: 'respuesta_vacia' });
  res.end();
}
