// Pimath IA - Modo sin internet (Qwen2.5 1.5B, un modelo liviano de ~1.2 GB, se ejecuta en el propio dispositivo con WebGPU)
// Se carga solo cuando un usuario Premium abre el panel o necesita responder sin internet.
(function () {
  var VERSION = '4.2.0';
  var BASE = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@' + VERSION;
  var MODEL = 'onnx-community/Qwen2.5-1.5B-Instruct';
  var FLAG = 'pimath_offline_model';

  var lib = null;
  var generator = null;
  var cargando = null;
  var cola = Promise.resolve();

  var SISTEMA =
    'Eres Pimath IA, un profesor de matemáticas amable y paciente. ' +
    'Responde siempre en español, explicando paso a paso y de forma clara. ' +
    'Usa formato simple (listas numeradas y **negritas** para resultados clave). ' +
    'Escribe TODA expresión matemática en LaTeX: en línea entre signos de dólar, por ejemplo $x = \\frac{15}{3}$, ' +
    'y las ecuaciones importantes en su propia línea entre dobles signos de dólar, por ejemplo $$x = 5$$. ' +
    'Nunca uses los signos de dólar para dinero; escribe "pesos" o "dólares" con palabras.';

  function soportado() {
    return !!(typeof navigator !== 'undefined' && navigator.gpu);
  }

  function listo() {
    try {
      var v = JSON.parse(localStorage.getItem(FLAG) || 'null');
      return !!(v && v.listo && v.version === VERSION && v.model === MODEL);
    } catch (e) { return false; }
  }

  function marcar(si) {
    try {
      if (si) localStorage.setItem(FLAG, JSON.stringify({ listo: true, version: VERSION, model: MODEL, t: Date.now() }));
      else localStorage.removeItem(FLAG);
    } catch (e) {}
  }

  async function cargarLib() {
    if (lib) return lib;
    var errores = [];
    var urls = [BASE, BASE + '/+esm'];
    for (var i = 0; i < urls.length; i++) {
      try {
        var m = await import(urls[i]);
        if (m && m.pipeline) { lib = m; return lib; }
      } catch (e) { errores.push(String((e && e.message) || e)); }
    }
    throw new Error('No se pudo cargar el motor: ' + errores.join(' | '));
  }

  async function cargarModelo(onProgreso) {
    if (generator) return generator;
    if (cargando) return cargando;
    cargando = (async function () {
      if (!soportado()) throw new Error('sin_webgpu');
      var T = await cargarLib();
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
      var archivos = {};
      var g = await T.pipeline('text-generation', MODEL, {
        dtype: 'q4f16',
        device: 'webgpu',
        progress_callback: function (info) {
          try {
            if (!onProgreso || !info) return;
            if (info.status === 'progress_total' && typeof info.progress === 'number') {
              onProgreso(Math.max(0, Math.min(100, info.progress)));
            } else if (info.status === 'progress' && info.file) {
              archivos[info.file] = { l: info.loaded || 0, t: info.total || 0 };
              var l = 0, t = 0;
              Object.keys(archivos).forEach(function (k) { l += archivos[k].l; t += archivos[k].t; });
              if (t > 0) onProgreso(Math.max(0, Math.min(100, (l / t) * 100)));
            } else if (info.status === 'ready') {
              onProgreso(100);
            }
          } catch (e) {}
        }
      });
      generator = g;
      return g;
    })();
    try { return await cargando; } finally { cargando = null; }
  }

  // Descarga única del modelo (necesita internet). Al terminar libera la memoria.
  async function descargar(onProgreso) {
    // Si quedó guardada una IA anterior (más pesada), se borra para liberar espacio
    try {
      var previo = JSON.parse(localStorage.getItem(FLAG) || 'null');
      if (previo && previo.model !== MODEL) await borrar();
    } catch (e) {}
    // La barra se actualiza como máximo 2 veces por segundo para no trabar la tablet
    var ultimoT = 0, ultimoP = -1;
    var suave = function (p) {
      var t = Date.now();
      if (p >= 100 || (t - ultimoT > 500 && Math.floor(p) !== ultimoP)) {
        ultimoT = t; ultimoP = Math.floor(p);
        if (onProgreso) onProgreso(p);
      }
    };
    var g = await cargarModelo(suave);
    marcar(true);
    try { if (g && typeof g.dispose === 'function') await g.dispose(); } catch (e) {}
    generator = null;
    return true;
  }

  function limpiar(t) {
    return String(t || '')
      .replace(/<\|channel>[\s\S]*?<channel\|>/g, '')
      .replace(/<\|[a-z_]+>|<[a-z_]+\|>/g, '')
      .trim();
  }

  // Responde una conversación (lista de {role, content}) con el modelo local
  function responder(mensajes, maxTokens) {
    var turno = cola.then(async function () {
      var g = await cargarModelo();
      var salida = await g(mensajes, { max_new_tokens: maxTokens || 700, do_sample: false });
      var gt = salida && salida[0] && salida[0].generated_text;
      var ultimo = Array.isArray(gt) ? gt[gt.length - 1] : gt;
      var contenido = ultimo && typeof ultimo === 'object' ? ultimo.content : ultimo;
      if (Array.isArray(contenido)) {
        contenido = contenido.map(function (p) { return (p && p.text) || ''; }).join('');
      }
      return limpiar(contenido);
    });
    cola = turno.catch(function () {});
    return turno;
  }

  // Borra el modelo guardado en el dispositivo
  async function borrar() {
    try {
      var nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter(function (n) { return /transformers|onnx|huggingface/i.test(n); })
          .map(function (n) { return caches.delete(n); })
      );
    } catch (e) {}
    marcar(false);
    generator = null;
  }

  window.PimathOffline = {
    soportado: soportado,
    listo: listo,
    descargar: descargar,
    responder: responder,
    borrar: borrar,
    sistema: SISTEMA
  };
})();
