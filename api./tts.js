// Pimath IA: voz natural con Gemini TTS (usa tu misma GEMINI_API_KEY de Vercel).
// Recibe { text, voice, lang } y devuelve { audio: <PCM base64>, rate: 24000 }.
const VOCES = ['Kore', 'Aoede', 'Leda', 'Zephyr', 'Puck', 'Charon', 'Fenrir', 'Orus', 'Callirrhoe'];
const PREFIJO = {
  es: 'Di con voz cálida, clara y natural, como una profesora amable: ',
  en: 'Say in a warm, clear, natural voice, like a kind teacher: ',
  pt: 'Diga com voz calorosa, clara e natural, como uma professora gentil: '
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Solo desde tu propia página
  const origen = String(req.headers.origin || req.headers.referer || '');
  const host = String(req.headers.host || '');
  if (origen && host && origen.indexOf(host) === -1) return res.status(403).json({ error: 'forbidden' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'no_key' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const texto = String(body.text || '').trim().slice(0, 700);
  if (!texto) return res.status(400).json({ error: 'empty' });
  const voz = VOCES.indexOf(body.voice) !== -1 ? body.voice : 'Kore';
  const idioma = String(body.lang || 'es-ES').slice(0, 2).toLowerCase();
  const modelo = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (PREFIJO[idioma] || PREFIJO.es) + texto }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } }
        }
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'tts_failed', status: r.status });
    const j = await r.json();
    const partes = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const parte = partes.find(function (p) { return p.inlineData && p.inlineData.data; });
    if (!parte) return res.status(502).json({ error: 'no_audio' });
    const m = /rate=(\d+)/.exec(parte.inlineData.mimeType || '');
    return res.status(200).json({ audio: parte.inlineData.data, rate: m ? parseInt(m[1], 10) : 24000 });
  } catch (e) {
    return res.status(502).json({ error: 'tts_error' });
  }
};
