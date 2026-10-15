const MODEL = 'gemini-3.8-flash';

async function callGemini(apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let last;
  // Si Google está saturado (503), reintenta hasta 3 veces
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    last = { r, data };
    if (r.status !== 503) break;
    await new Promise(ok => setTimeout(ok, 1000 * attempt));
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

    const { r, data } = await callGemini(apiKey, {
      systemInstruction: { parts: [{ text: system }] },
      contents
    });
    if (!r.ok) {
      console.error('Gemini error', r.status, data.error && data.error.message);
      return res.status(r.status).json({ error: (data.error && data.error.message) || 'upstream_error' });
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (!text) return res.status(502).json({ error: 'safety block' });
    return res.status(200).json({ text });
  } catch (e) {
    console.error('chat error', e);
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
