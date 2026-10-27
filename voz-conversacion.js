// Pimath IA: MODO CONVERSACIÓN POR VOZ
// Toca 🗣️ una sola vez: Pimath te escucha, responde en voz alta y vuelve a escucharte solo.
// Termina diciendo "adiós" o tocando "Finalizar". Usa la misma IA y el mismo historial del chat.
(function () {
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !('speechSynthesis' in window)) return; // este navegador no lo soporta

  var activo = false;        // ¿el modo conversación está abierto?
  var estado = 'inactivo';   // escuchando | pensando | hablando | pausa
  var rec = null;
  var silencios = 0;
  var esperando = false;     // ya enviamos una pregunta y falta la respuesta
  var idHabla = 0;           // para ignorar voces canceladas
  var wake = null;           // pantalla encendida
  var timerEspera = null;
  var ui = {};

  var ESTADOS = {
    escuchando: ['Te escucho…', 'Habla con naturalidad'],
    pensando: ['Pensando…', 'Pimath está preparando la respuesta'],
    hablando: ['Pimath está hablando', 'Toca el círculo para interrumpir'],
    pausa: ['En pausa', 'Toca el círculo para hablar']
  };

  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿¡?!.,]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // ---------- Interfaz ----------
  function crearUI() {
    var css = [
      '#vozOverlay{position:fixed;inset:0;z-index:95;display:none;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(28px + env(safe-area-inset-top,0px)) 20px calc(28px + env(safe-area-inset-bottom,0px));background:radial-gradient(circle at 50% 42%,#10286b 0%,#081544 45%,#040a22 100%);color:#fff;font-family:var(--font-body,system-ui,sans-serif);text-align:center;overflow:hidden}',
      '#vozOverlay.on{display:flex}',
      '#vozTitulo{font-size:1.02rem;opacity:.75;letter-spacing:.3px}',
      '#vozCentro{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}',
      '#vozOrbe{position:relative;width:230px;height:230px;border:none;background:none;padding:0;cursor:pointer;transition:transform .09s linear;-webkit-tap-highlight-color:transparent}',
      '#vozOrbe span{position:absolute;display:block;pointer-events:none}',
      '.vo-halo{inset:-36px;border-radius:50%;background:radial-gradient(circle,rgba(70,160,255,.55) 0%,rgba(70,160,255,.18) 45%,rgba(70,160,255,0) 70%);animation:voRespira 3.4s ease-in-out infinite}',
      '.vo-core{inset:20px;background:radial-gradient(circle at 32% 28%,#bff0ff 0%,#4fb4ff 28%,#2b63ff 62%,#1b2fc9 100%);box-shadow:0 0 70px 14px rgba(60,150,255,.55),inset 0 -14px 34px rgba(10,20,120,.55);border-radius:60% 40% 55% 45%/55% 45% 60% 40%;animation:voMorph 7s ease-in-out infinite,voGiro 16s linear infinite}',
      '.vo-brillo{inset:46px 70px 120px 56px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75) 0%,rgba(255,255,255,0) 70%);filter:blur(3px);animation:voRespira 3.4s ease-in-out infinite}',
      '#vozOverlay.escuchando #vozOrbe::after{content:"";position:absolute;inset:26px;border-radius:50%;animation:voOnda 1.9s ease-out infinite}',
      '#vozOverlay.escuchando .vo-core{animation-duration:5s,12s}',
      '#vozOverlay.hablando .vo-core{animation-duration:2.4s,7s}',
      '#vozOverlay.hablando .vo-halo{animation-duration:1.2s}',
      '#vozOverlay.pensando .vo-core{animation-duration:2.6s,3.2s;filter:hue-rotate(28deg) brightness(1.08)}',
      '#vozOverlay.pausa .vo-core{opacity:.5;animation-play-state:paused}',
      '#vozOverlay.pausa .vo-halo{opacity:.4}',
      '@keyframes voMorph{0%,100%{border-radius:60% 40% 55% 45%/55% 45% 60% 40%}25%{border-radius:45% 55% 40% 60%/60% 40% 55% 45%}50%{border-radius:55% 45% 60% 40%/45% 60% 40% 55%}75%{border-radius:40% 60% 45% 55%/55% 45% 50% 50%}}',
      '@keyframes voGiro{to{transform:rotate(360deg)}}',
      '@keyframes voRespira{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.09);opacity:1}}',
      '@keyframes voOnda{0%{box-shadow:0 0 0 0 rgba(90,175,255,.5)}100%{box-shadow:0 0 0 52px rgba(90,175,255,0)}}',
      '#vozEstado{font-size:1.4rem;font-weight:600;margin:34px 0 0}',
      '#vozAyuda{font-size:.9rem;opacity:.65;margin:6px 0 0}',
      '#vozTexto{max-width:520px;min-height:3.6em;max-height:28vh;overflow:auto;font-size:1rem;line-height:1.45;opacity:.88;margin-top:16px}',
      '#vozFin{background:rgba(255,255,255,.95);color:#081544;border:none;border-radius:999px;padding:13px 36px;font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit}'
    ].join('');
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var ov = document.createElement('div');
    ov.id = 'vozOverlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Conversación por voz con Pimath IA');
    ov.innerHTML =
      '<div id="vozTitulo">Conversación con Pimath IA</div>' +
      '<div id="vozCentro">' +
        '<button id="vozOrbe" type="button" aria-label="Hablar o interrumpir"><span class="vo-halo"></span><span class="vo-core"></span><span class="vo-brillo"></span></button>' +
        '<p id="vozEstado"></p><p id="vozAyuda"></p>' +
        '<div id="vozTexto"></div>' +
      '</div>' +
      '<button id="vozFin" type="button">Finalizar</button>';
    document.body.appendChild(ov);

    ui.ov = ov;
    ui.estado = ov.querySelector('#vozEstado');
    ui.ayuda = ov.querySelector('#vozAyuda');
    ui.texto = ov.querySelector('#vozTexto');
    ui.orbe = ov.querySelector('#vozOrbe');
    ui.orbe.addEventListener('click', tocarOrbe);
    ov.querySelector('#vozFin').addEventListener('click', cerrar);
  }

  function pintar(subtitulo) {
    if (!ui.ov) return;
    var e = ESTADOS[estado] || ['', ''];
    ui.ov.className = (activo ? 'on ' : '') + estado;
    ui.estado.textContent = e[0];
    ui.ayuda.textContent = e[1];
    if (typeof subtitulo === 'string') ui.texto.textContent = subtitulo;
  }

  function avatarHablando(on) {
    try { document.querySelectorAll('.pimath-avatar-img').forEach(function (i) { i.classList.toggle('talking', on); }); } catch (e) {}
  }

  // ---------- Abrir / cerrar ----------
  function abrir() {
    if (activo) return;
    try { if (typeof unlockSpeech === 'function') unlockSpeech(); } catch (e) {}
    activo = true;
    audioListo();
    silencios = 0;
    esperando = false;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () {});
    }
    estado = 'escuchando';
    pintar('');
    escuchar();
  }

  function cerrar() {
    activo = false;
    esperando = false;
    idHabla++;
    idPregunta++;
    try { if (ctlVoz) ctlVoz.abort(); } catch (e) {}
    vozTurnos = [];
    pararAudio();
    ponerNivel(0);
    clearTimeout(timerEspera);
    try { if (rec) { rec.onend = null; rec.abort(); } } catch (e) {}
    try { window.speechSynthesis.cancel(); } catch (e) {}
    avatarHablando(false);
    try { if (wake) wake.release(); } catch (e) {}
    wake = null;
    estado = 'inactivo';
    if (ui.ov) ui.ov.className = '';
  }

  function tocarOrbe() {
    if (!activo) return;
    if (estado === 'hablando') {
      idHabla++;
      pararAudio();
      try { window.speechSynthesis.cancel(); } catch (e) {}
      avatarHablando(false);
      silencios = 0;
      escuchar();
    } else if (estado === 'pausa') {
      silencios = 0;
      escuchar();
    }
  }

  // ---------- Escuchar ----------
  function escuchar() {
    if (!activo) return;
    estado = 'escuchando';
    pintar();
    var final = '';
    var error = '';
    try { if (rec) { rec.onend = null; rec.abort(); } } catch (e) {}
    rec = new SR();
    rec.lang = window.__pimathLang || 'es-ES';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = function (ev) {
      var t = '';
      for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      if (ui.texto) ui.texto.textContent = t;
      if (ev.results[ev.results.length - 1].isFinal) final = t;
    };
    rec.onerror = function (ev) { error = (ev && ev.error) || 'error'; };
    rec.onend = function () {
      if (!activo || estado !== 'escuchando') return;
      if (final.trim()) { enviar(final.trim()); return; }
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        estado = 'pausa';
        pintar('Activa el permiso del micrófono para este sitio y toca el círculo.');
        return;
      }
      silencios++;
      if (silencios >= 2) {
        estado = 'pausa';
        pintar('No te escuché. Toca el círculo cuando quieras hablar.');
        return;
      }
      setTimeout(escuchar, 300);
    };
    try { rec.start(); }
    catch (e) { setTimeout(escuchar, 500); }
  }

  // ---------- Preguntar a Pimath (la conversación de voz no se muestra en el chat) ----------
  var vozTurnos = [];   // memoria solo de esta conversación de voz
  var ctlVoz = null;
  var idPregunta = 0;

  function enviar(texto) {
    silencios = 0;
    var n = normalizar(texto);
    if (n.length <= 25 && /^(adios|chao|chau|terminar|finalizar|detente|salir|hasta luego|hasta pronto|goodbye|bye|stop|tchau|encerrar)\b/.test(n)) {
      cerrar();
      return;
    }
    estado = 'pensando';
    pintar(texto);
    var mia = ++idPregunta;
    try { if (ctlVoz) ctlVoz.abort(); } catch (e) {}
    ctlVoz = new AbortController();
    var cuerpo = {
      history: vozTurnos.slice(-12),
      message: texto,
      image: null,
      studentName: (typeof studentName !== 'undefined' ? studentName : ''),
      area: (typeof currentArea !== 'undefined' ? currentArea : '')
    };
    fetch('/api/chat', {
      method: 'POST',
      signal: ctlVoz.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('http_' + r.status));
        return d;
      });
    }).then(function (d) {
      if (!activo || mia !== idPregunta) return;
      var full = d.text || '';
      vozTurnos.push({ role: 'user', text: texto });
      vozTurnos.push({ role: 'model', text: full });
      hablar(full || 'No pude generar una respuesta. Intentemos de nuevo.');
    }).catch(function (e) {
      if (!activo || mia !== idPregunta || (e && e.name === 'AbortError')) return;
      hablar('No pude conectarme. Revisa tu internet e intentemos de nuevo.');
    });
  }

  // ---------- Hablar ----------
  function limpiarParaVoz(texto) {
    return String(texto || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 sobre $2 ')
      .replace(/\\sqrt\{([^{}]*)\}/g, ' raíz de $1 ')
      .replace(/\^2\b/g, ' al cuadrado ')
      .replace(/\^3\b/g, ' al cubo ')
      .replace(/\^\{([^{}]*)\}/g, ' elevado a $1 ')
      .replace(/\^(\w+)/g, ' elevado a $1 ')
      .replace(/\\pm/g, ' más menos ')
      .replace(/\\cdot|\\times/g, ' por ')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/\$/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/=/g, ' igual a ')
      .replace(/\+/g, ' más ')
      .replace(/(\d)\s*-\s*(\d)/g, '$1 menos $2')
      .replace(/[*#_~`>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function trozos(texto) {
    var max = 1000, extra = '';
    if (texto.length > max) {
      var corte = texto.lastIndexOf('. ', max);
      texto = texto.slice(0, corte > 300 ? corte + 1 : max);
      extra = ' El resto de la explicación lo puedes leer en la pantalla.';
    }
    texto += extra;
    var partes = texto.match(/[^.!?;:\n]+[.!?;:\n]*/g) || [texto];
    var salida = [], actual = '';
    partes.forEach(function (p) {
      if ((actual + p).length > 170 && actual) { salida.push(actual); actual = p; }
      else actual += p;
    });
    if (actual.trim()) salida.push(actual);
    return salida;
  }

  // ---------- Voz natural (Gemini TTS vía /api/tts) con respaldo a la voz del celular ----------
  var ctxAudio = null, fuente = null, hablandoIA = false, analizador = null, datosAn = null, rafNivel = null, nivelSuave = 0;

  function ttsCfg() { return (window.__pimathTTSConfig && window.__pimathTTSConfig()) || { on: false }; }

  function audioListo() {
    try {
      if (!ctxAudio) {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctxAudio = new AC();
        analizador = ctxAudio.createAnalyser();
        analizador.fftSize = 256;
        datosAn = new Uint8Array(analizador.fftSize);
        analizador.connect(ctxAudio.destination);
      }
      if (ctxAudio.state === 'suspended') ctxAudio.resume();
    } catch (e) { ctxAudio = null; }
    return !!ctxAudio;
  }

  function ponerNivel(n) {
    if (ui.orbe) ui.orbe.style.transform = n > 0.02 ? 'scale(' + (1 + n * 0.32).toFixed(3) + ')' : '';
  }

  function medirNivel() {
    if (!analizador || !activo || !fuente) { rafNivel = null; nivelSuave = 0; ponerNivel(0); return; }
    analizador.getByteTimeDomainData(datosAn);
    var suma = 0;
    for (var i = 0; i < datosAn.length; i++) { var v = (datosAn[i] - 128) / 128; suma += v * v; }
    var rms = Math.sqrt(suma / datosAn.length);
    nivelSuave = nivelSuave * 0.6 + Math.min(1, rms * 4.5) * 0.4;
    ponerNivel(nivelSuave);
    rafNivel = requestAnimationFrame(medirNivel);
  }

  function pararAudio() {
    hablandoIA = false;
    try { if (fuente) { fuente.onended = null; fuente.stop(); } } catch (e) {}
    fuente = null;
  }

  function pcmABuffer(b64, rate) {
    var bin = atob(b64), n = bin.length >> 1;
    var buf = ctxAudio.createBuffer(1, n, rate || 24000), ch = buf.getChannelData(0);
    for (var i = 0; i < n; i++) {
      var v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
      if (v & 0x8000) v -= 0x10000;
      ch[i] = v / 32768;
    }
    return buf;
  }

  function pedirVoz(texto, cfg) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, voice: cfg.voice, lang: window.__pimathLang || 'es-ES' }),
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error('tts');
      return r.json();
    }).then(function (j) {
      if (!j || !j.audio) throw new Error('tts');
      return j;
    });
  }

  function trozosIA(texto) {
    var max = 600, extra = '';
    if (texto.length > max) {
      var corte = texto.lastIndexOf('. ', max);
      texto = texto.slice(0, corte > 200 ? corte + 1 : max);
      extra = ' El resto de la explicación lo puedes leer en la pantalla.';
    }
    texto += extra;
    var partes = texto.match(/[^.!?;:\n]+[.!?;:\n]*/g) || [texto];
    var salida = [];
    // El primer trozo es corto para que Pimath empiece a hablar cuanto antes
    var primero = (partes.shift() || '').trim();
    if (primero.length > 110) {
      var c = primero.lastIndexOf(',', 110);
      if (c < 40) c = primero.lastIndexOf(' ', 110);
      if (c < 40) c = 110;
      partes.unshift(primero.slice(c + 1));
      primero = primero.slice(0, c + 1);
    }
    if (primero) salida.push(primero);
    var actual = '';
    partes.forEach(function (p) {
      if ((actual + p).length > 240 && actual) { salida.push(actual); actual = p; }
      else actual += p;
    });
    if (actual.trim()) salida.push(actual);
    return salida;
  }

  function hablarNavegador(lista, mi, terminar) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    lista.forEach(function (t, i) {
      var u = new SpeechSynthesisUtterance(t);
      u.lang = window.__pimathLang || 'es-ES';
      try {
        var vz = (window.__pimathElegirVoz && window.__pimathElegirVoz()) || (typeof spanishVoice !== 'undefined' ? spanishVoice : null);
        if (vz) u.voice = vz;
      } catch (e) {}
      u.rate = 0.97;
      u.pitch = 1.05;
      if (i === lista.length - 1) { u.onend = terminar; u.onerror = terminar; }
      window.speechSynthesis.speak(u);
    });
  }

  // Devuelve false si no se puede usar la voz natural (entonces se usa la del celular)
  function hablarIA(textoLimpio, cfg, mi, alTerminar) {
    if (!audioListo()) return false;
    var piezas = trozosIA(textoLimpio);
    var pedidos = [];
    function pedir(i) {
      if (i < piezas.length && !pedidos[i]) {
        pedidos[i] = pedirVoz(piezas[i], cfg);
        pedidos[i].catch(function () {});
      }
    }
    hablandoIA = true;
    for (var k = 0; k < piezas.length && k < 4; k++) pedir(k);
    function reproducir(i) {
      if (mi !== idHabla) return;
      if (i >= piezas.length) { hablandoIA = false; fuente = null; alTerminar(); return; }
      pedir(i); pedir(i + 1);
      pedidos[i].then(function (dato) {
        if (mi !== idHabla) return;
        var b = pcmABuffer(dato.audio, dato.rate);
        fuente = ctxAudio.createBufferSource();
        fuente.buffer = b;
        fuente.connect(analizador);
        fuente.onended = function () { reproducir(i + 1); };
        fuente.start();
        if (activo && !rafNivel) medirNivel();
      }).catch(function () {
        if (mi !== idHabla) return;
        hablandoIA = false;
        hablarNavegador(piezas.slice(i), mi, alTerminar); // respaldo
      });
    }
    reproducir(0);
    return true;
  }

  // Para el botón "🔊 Escuchar" de cada respuesta
  window.__pimathLeerIA = function (textoOriginal) {
    var cfg = ttsCfg();
    if (!cfg.on) return false;
    if (hablandoIA) { idHabla++; pararAudio(); avatarHablando(false); return true; }
    var limpio = limpiarParaVoz(textoOriginal);
    if (!limpio) return true;
    var mi = ++idHabla;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    avatarHablando(true);
    var fin = function () { if (mi === idHabla) avatarHablando(false); };
    if (!hablarIA(limpio, cfg, mi, fin)) { avatarHablando(false); return false; }
    return true;
  };

  function hablar(textoOriginal) {
    if (!activo) return;
    esperando = false;
    clearTimeout(timerEspera);
    var limpio = limpiarParaVoz(textoOriginal);
    if (!limpio) { escuchar(); return; }
    var mi = ++idHabla;
    estado = 'hablando';
    pintar(String(textoOriginal || '').replace(/[*#`$]/g, '').slice(0, 400));
    avatarHablando(true);
    pararAudio();
    try { window.speechSynthesis.cancel(); } catch (e) {}

    function terminar() {
      if (mi !== idHabla) return;
      avatarHablando(false);
      if (activo) setTimeout(function () { if (activo && mi === idHabla) escuchar(); }, 500);
    }
    var cfg = ttsCfg();
    if (cfg.on && hablarIA(limpio, cfg, mi, terminar)) return;
    hablarNavegador(trozos(limpio), mi, terminar);
  }

  window.__pimathVozActiva = function () { return activo; };
  window.__pimathAbrirVoz = function () { abrir(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden && activo) cerrar(); });

  function iniciar() { crearUI(); }
  if (document.readyState === 'complete') iniciar();
  else window.addEventListener('load', iniciar);
})();
