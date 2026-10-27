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
    var st = document.createElement('style');
    st.textContent =
      '#vozBtn{flex-shrink:0;width:42px;height:42px;border-radius:10px;border:1px solid var(--line,#E4DCC8);background:var(--panel-2,#F6F1E3);color:var(--ink,#1C2620);font-size:1.1rem;cursor:pointer}' +
      '#vozOverlay{position:fixed;inset:0;z-index:95;display:none;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(28px + env(safe-area-inset-top,0px)) 20px calc(28px + env(safe-area-inset-bottom,0px));background:radial-gradient(circle at 50% 35%,#2C3A31 0%,#1C2620 70%);color:#fff;font-family:var(--font-body,system-ui,sans-serif);text-align:center}' +
      '#vozOverlay.on{display:flex}' +
      '#vozTitulo{font-size:1.05rem;opacity:.8;letter-spacing:.3px}' +
      '#vozOrbe{width:190px;height:190px;border-radius:50%;border:none;cursor:pointer;background:radial-gradient(circle at 35% 30%,#E8B65A,#B8791E 70%);box-shadow:0 0 0 0 rgba(184,121,30,.5);display:flex;align-items:center;justify-content:center;transition:transform .2s}' +
      '#vozOrbe img{width:96px;height:96px;border-radius:50%;object-fit:cover;background:#fff}' +
      '#vozOverlay.escuchando #vozOrbe{animation:vozLatido 1.4s ease-in-out infinite}' +
      '#vozOverlay.hablando #vozOrbe{animation:vozHabla .7s ease-in-out infinite}' +
      '#vozOverlay.pensando #vozOrbe{animation:vozGira 1.2s linear infinite;opacity:.8}' +
      '#vozOverlay.pausa #vozOrbe{opacity:.55}' +
      '@keyframes vozLatido{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(184,121,30,.45)}50%{transform:scale(1.05);box-shadow:0 0 0 28px rgba(184,121,30,0)}}' +
      '@keyframes vozHabla{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}' +
      '@keyframes vozGira{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}' +
      '#vozEstado{font-size:1.35rem;font-weight:600;margin:0}' +
      '#vozAyuda{font-size:.9rem;opacity:.7;margin:6px 0 0}' +
      '#vozTexto{max-width:520px;min-height:3.6em;max-height:30vh;overflow:auto;font-size:1rem;line-height:1.45;opacity:.9;margin-top:14px}' +
      '#vozFin{background:#fff;color:#1C2620;border:none;border-radius:999px;padding:13px 34px;font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit}';
    document.head.appendChild(st);

    var ov = document.createElement('div');
    ov.id = 'vozOverlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Conversación por voz con Pimath IA');
    ov.innerHTML =
      '<div id="vozTitulo">Conversación con Pimath IA</div>' +
      '<div>' +
        '<button id="vozOrbe" type="button" aria-label="Hablar o interrumpir"><img src="/icon-192.png" alt=""></button>' +
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

    var btn = document.createElement('button');
    btn.id = 'vozBtn';
    btn.type = 'button';
    btn.title = 'Conversar con Pimath por voz';
    btn.setAttribute('aria-label', 'Conversar con Pimath por voz');
    btn.textContent = '🗣️';
    btn.addEventListener('click', abrir);
    var mic = document.getElementById('micBtn');
    if (mic && mic.parentNode) mic.parentNode.insertBefore(btn, mic.nextSibling);
    else {
      var fila = document.getElementById('row') || document.getElementById('composer');
      if (fila) fila.appendChild(btn);
    }
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
    pararAudio();
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
      if (silencios >= 3) {
        estado = 'pausa';
        pintar('No te escuché. Toca el círculo cuando quieras hablar.');
        return;
      }
      setTimeout(escuchar, 300);
    };
    try { rec.start(); }
    catch (e) { setTimeout(escuchar, 500); }
  }

  // ---------- Enviar al chat ----------
  function enviar(texto) {
    silencios = 0;
    var n = normalizar(texto);
    if (n.length <= 25 && /^(adios|chao|chau|terminar|finalizar|detente|salir|hasta luego|hasta pronto|goodbye|bye|stop|tchau|encerrar)\b/.test(n)) {
      cerrar();
      return;
    }
    estado = 'pensando';
    esperando = true;
    pintar(texto);
    try {
      var campo = document.getElementById('input');
      campo.value = texto;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      if (typeof send === 'function') send();
      else document.getElementById('sendBtn').click();
    } catch (e) {
      esperando = false;
      escuchar();
      return;
    }
    // Si algo falla y nunca llega respuesta, volvemos a escuchar
    clearTimeout(timerEspera);
    timerEspera = setTimeout(function () {
      if (activo && esperando) { esperando = false; escuchar(); }
    }, 60000);
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
  var ctxAudio = null, fuente = null, hablandoIA = false;

  function ttsCfg() { return (window.__pimathTTSConfig && window.__pimathTTSConfig()) || { on: false }; }

  function audioListo() {
    try {
      if (!ctxAudio) { var AC = window.AudioContext || window.webkitAudioContext; ctxAudio = new AC(); }
      if (ctxAudio.state === 'suspended') ctxAudio.resume();
    } catch (e) { ctxAudio = null; }
    return !!ctxAudio;
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
    var salida = [], actual = '';
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
    function reproducir(i) {
      if (mi !== idHabla) return;
      if (i >= piezas.length) { hablandoIA = false; fuente = null; alTerminar(); return; }
      pedir(i); pedir(i + 1);
      pedidos[i].then(function (dato) {
        if (mi !== idHabla) return;
        var b = pcmABuffer(dato.audio, dato.rate);
        fuente = ctxAudio.createBufferSource();
        fuente.buffer = b;
        fuente.connect(ctxAudio.destination);
        fuente.onended = function () { reproducir(i + 1); };
        fuente.start();
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

  // ---------- Enganche con el chat de Pimath ----------
  function engancharChat() {
    // 1) Camino principal: cuando el chat agrega el botón "Escuchar" a la respuesta final
    var original = window.addSpeakBtn;
    if (typeof original === 'function') {
      window.addSpeakBtn = function (div, text) {
        var r = original.apply(this, arguments);
        if (activo && esperando) hablar(text || (div && div.textContent) || '');
        return r;
      };
    }
    // 2) Respaldo: si la respuesta llega sin ese botón (por ejemplo, un error), la leemos igual
    var chat = document.getElementById('chat');
    if (!chat) return;
    new MutationObserver(function (cambios) {
      cambios.forEach(function (c) {
        var el = c.target;
        if (c.attributeName === 'class' && el.classList && el.classList.contains('bot') &&
            !el.classList.contains('thinking') && (c.oldValue || '').indexOf('thinking') !== -1) {
          setTimeout(function () {
            if (activo && esperando) {
              var clon = el.cloneNode(true);
              Array.prototype.forEach.call(clon.querySelectorAll('button,img,.katex-html'), function (n) { n.remove(); });
              hablar(clon.textContent || '');
            }
          }, 900);
        }
      });
    }).observe(chat, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  }

  window.__pimathVozActiva = function () { return activo; };
  document.addEventListener('visibilitychange', function () { if (document.hidden && activo) cerrar(); });

  // ---------- Inicio (espera a que el chat esté listo) ----------
  function iniciar() {
    var intentos = 0;
    (function esperar() {
      var listo = document.getElementById('input') && document.getElementById('chat') && typeof window.addSpeakBtn === 'function';
      if (listo) { crearUI(); engancharChat(); }
      else if (++intentos < 50) setTimeout(esperar, 200);
    })();
  }
  if (document.readyState === 'complete') iniciar();
  else window.addEventListener('load', iniciar);
})();
