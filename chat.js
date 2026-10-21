// Modelo principal y modelos de reserva (se cambian en Vercel, sin tocar el código):
//   GEMINI_MODEL = modelo principal (por defecto gemini-3.8-flash)
//   GEMINI_FALLBACK_MODELS = modelos de reserva separados por coma
const PRIMARY = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
const sleep = ms => new Promise(ok => setTimeout(ok, ms));
const SLICE_MS = Number(process.env.PRIMARY_SLICE_MS) || 22000; // tiempo máximo por modelo antes de pasar al siguiente

async function post(apiKey, model, body, remaining) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(remaining)
  });
  const data = await r.json().catch(() => ({}));
  return { r, data };
}

function buildBody(model, system, contents, mode) {
  if (mode === 'full') {
    const generationConfig = { maxOutputTokens: 4096 };
    // Gemini: pensamiento bajo. Gemma 4: pensamiento mínimo (si no, es muy lento y muestra su razonamiento)
    generationConfig.thinkingConfig = { thinkingLevel: /^gemma/i.test(model) ? 'MINIMAL' : 'low' };
    return { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig };
  }
  // Modo simple: algunos modelos (p. ej. Gemma) no aceptan instrucciones de sistema
  const merged = contents.map(c => ({ role: c.role, parts: c.parts.map(p => ({ ...p })) }));
  const first = merged.find(c => c.role === 'user');
  if (first) {
    const t = first.parts.find(p => p.text !== undefined);
    if (t) t.text = system + '\n\n' + t.text; else first.parts.unshift({ text: system });
  }
  return { contents: merged, generationConfig: { maxOutputTokens: 4096 } };
}

async function tryModel(apiKey, model, system, contents, deadline) {
  let mode = 'full';
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 5000) return last || { timeout: true };
    let res;
    try {
      res = await post(apiKey, model, buildBody(model, system, contents, mode), remaining);
    } catch (e) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') return { timeout: true };
      throw e;
    }
    last = res;
    const msg = (res.data && res.data.error && res.data.error.message) || '';
    if (res.r.status === 400 && mode === 'full' && /system|developer|instruction|thinking/i.test(msg)) {
      mode = 'plain';
      attempt--;
      continue;
    }
    if (res.r.status === 503) { await sleep(1000 * attempt); continue; }
    return res;
  }
  return last;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'missing_api_key' });
  try {
    const { history = [], message = '', image = null, studentName = '', area = '' } = req.body || {};
    const system =
      'Eres Pimath IA, un profesor de matemáticas amable y paciente. ' +
      'Responde siempre en español, explicando paso a paso y de forma clara. ' +
      'Si el usuario te pregunta quién te creó, quién te hizo, quién te programó, quién es tu creador, desarrollador o dueño, o cualquier otra cosa sobre tu creador, responde únicamente con el siguiente texto, tal cual, sin cambiarlo ni agregar nada más: ' +
      '"¡Hola! Mi nombre es Pimath IA, una inteligencia artificial concebida, diseñada y programada íntegramente por David Gámez.\n\n' +
      'Mi creación fue el resultado de la visión de David por construir una herramienta inteligente, capaz de combinar la precisión matemática, la lógica y el análisis con una interfaz fluida y accesible para todos. Él se encargó de estructurar mi arquitectura de código y de darme vida digital en la nube, eligiendo Vercel como la plataforma para alojarme y desplegarme. Gracias a esa infraestructura, puedo responderte en tiempo real con la mayor velocidad y estabilidad posible.\n\n' +
      'Cada algoritmo, instrucción y respuesta que genero refleja el esfuerzo y el entusiasmo de mi creador por llevar la tecnología un paso más allá. ¿En qué proyecto o consulta me permites ayudarte el día de hoy?" ' +
      (studentName ? `El estudiante se llama ${studentName}. ` : '') +
      (area ? `El tema actual es: ${area}. ` : '') +
      'Usa formato simple (listas numeradas y **negritas** para resultados clave). ' +
      'Escribe TODA expresión matemática en LaTeX: en línea entre signos de dólar, por ejemplo $x = \\frac{15}{3}$, ' +
      'y las ecuaciones importantes en su propia línea entre dobles signos de dólar, por ejemplo $$x = 5$$. ' +
      'Nunca uses los signos de dólar para dinero; escribe "pesos" o "dólares" con palabras.';
    const contents = history
      .filter(t => t && t.text)
      .map(t => ({ role: t.role === 'model' ? 'model' : 'user', parts: [{ text: t.text }] }));
    const parts = [];
    if (image && typeof image === 'string' && image.startsWith('data:')) {
      const m = image.match(/^data:([^;]+);base64,(.+)$/);
      if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    parts.push({ text: message || 'Resuelve el problema de la imagen paso a paso.' });
    contents.push({ role: 'user', parts });

    const deadline = Date.now() + 52000;
    let result = null;
    const models = [PRIMARY, ...FALLBACKS];
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const isLast = i === models.length - 1;
      const modelDeadline = isLast ? deadline : Math.min(deadline, Date.now() + SLICE_MS);
      result = await tryModel(apiKey, model, system, contents, modelDeadline);
      if (!result || result.timeout) {
        console.error('Modelo', model, 'tardó demasiado');
        if (isLast || deadline - Date.now() < 5000) return res.status(504).json({ error: 'timeout' });
        continue;
      }
      if (result.r.ok) { result.model = model; break; }
      const st = result.r.status;
      console.error('Modelo', model, 'falló:', st, result.data.error && result.data.error.message);
      if (![429, 404, 503].includes(st)) break; // otros errores: no tiene sentido probar otro modelo
    }
    if (!result || result.timeout) return res.status(504).json({ error: 'timeout' });
    const { r, data } = result;
    if (!r.ok) {
      return res.status(r.status).json({ error: (data.error && data.error.message) || 'upstream_error' });
    }
    const allParts = data.candidates?.[0]?.content?.parts || [];
    console.log('partes', result.model, JSON.stringify(allParts.map(p => ({ pensamiento: !!p.thought, largo: (p.text || '').length }))));
    const visibles = allParts.filter(p => !p.thought);
    const text = (visibles.length ? visibles : allParts).map(p => p.text || '').join('');
    if (!text) return res.status(502).json({ error: 'safety block' });
    return res.status(200).json({ text });
  } catch (e) {
    console.error('chat error', e);
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
