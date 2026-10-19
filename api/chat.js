// Modelo principal y modelos de reserva (se cambian en Vercel, sin tocar el código):
//   GEMINI_MODEL = modelo principal (por defecto gemini-3.8-flash)
//   GEMINI_FALLBACK_MODELS = modelos de reserva separados por coma
const PRIMARY = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
const sleep = ms => new Promise(ok => setTimeout(ok, ms));

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
    if (/^gemini/i.test(model)) generationConfig.thinkingConfig = { thinkingLevel: 'low' };
    return { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig };
  }
  // Modo simple: algunos modelos (p. ej. Gemma) no aceptan instrucciones de sistema
  const merged = contents.map(c => ({ role: c.role, parts: c.parts.map(p => ({ ...p })) }));
  const first = merged.find(c => c.role === 'user');
  if (first) {
    const t = first.parts.find(p => p.text !== undefined);
    if (t) t.text = system + '\n\n' + t.text; else first.parts.unshift({ text: system });
    }
