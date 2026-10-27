// Pimath IA: EXTRAS — Practicar, Pizarra, Progreso (resumen para padres), Idioma y Voz,
// y respuestas cortas cuando se conversa por voz. Se carga después de voz-conversacion.js.
(function () {
  'use strict';
  var KEY = 'pimath_extras';
  var IDIOMAS = {
    'es-ES': { n: 'Español', txt: '' },
    'en-US': { n: 'English', txt: 'Reply in English.' },
    'pt-BR': { n: 'Português', txt: 'Responda em português.' }
  };
  var datos = { lang: 'es-ES', voz: '', ia: true, vozIA: 'Kore', dias: {}, areas: {}, practicas: 0 };
  try { var g = JSON.parse(localStorage.getItem(KEY) || 'null'); if (g) Object.keys(g).forEach(function (k) { datos[k] = g[k]; }); } catch (e) {}
  window.__pimathLang = datos.lang;
  // Voz natural (IA): la usa el modo conversación y el botón "Escuchar"
  window.__pimathTTSConfig = function () { return { on: datos.ia !== false, voice: datos.vozIA || 'Kore' }; };
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(datos)); } catch (e) {} }
  function hoy(d) { return (d || new Date()).toLocaleDateString('en-CA'); }

  // ---- Voz elegida (la usa el modo conversación) ----
  window.__pimathElegirVoz = function () {
    if (!('speechSynthesis' in window)) return null;
    var vs = window.speechSynthesis.getVoices();
    if (datos.voz) { for (var i = 0; i < vs.length; i++) if (vs[i].name === datos.voz) return vs[i]; }
    if (datos.lang === 'es-ES') return null;
    var pref = datos.lang.slice(0, 2).toLowerCase();
    for (var j = 0; j < vs.length; j++) if ((vs[j].lang || '').toLowerCase().indexOf(pref) === 0) return vs[j];
    return null;
  };

  // ---- Interceptor del chat: idioma, respuestas cortas por voz y conteo de progreso ----
  var fetchPrev = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf('/api/chat') !== -1 && init && typeof init.body === 'string') {
        var c = JSON.parse(init.body);
        var d = hoy();
        datos.dias[d] = (datos.dias[d] || 0) + 1;
        var a = c.area || 'General';
        datos.areas[a] = (datos.areas[a] || 0) + 1;
        guardar();
        var extra = [];
        if (IDIOMAS[datos.lang] && IDIOMAS[datos.lang].txt) extra.push(IDIOMAS[datos.lang].txt);
        if (window.__pimathVozActiva && window.__pimathVozActiva()) extra.push('Se leerá en voz alta: máximo 3 frases cortas, sin listas, y termina con una pregunta breve.');
        if (extra.length) {
          c.message = (c.message || '') + ' (' + extra.join(' ') + ')';
          init = Object.assign({}, init, { body: JSON.stringify(c) });
        }
      }
    } catch (e) {}
    return fetchPrev(input, init);
  };

  // ---- Utilidades de interfaz ----
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; }
  var CARD = 'background:#fff;color:#1C2620;width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));max-height:85vh;overflow:auto;font-family:var(--font-body,system-ui,sans-serif);font-size:.95rem;line-height:1.45;box-sizing:border-box;';
  var OP = 'border:1px solid #E4DCC8;background:#FBF8EE;color:#1C2620;border-radius:12px;padding:10px 14px;font:inherit;cursor:pointer;margin:4px 6px 4px 0;';
  var OPON = 'border-color:#B8791E;background:#F6E9CF;font-weight:600;';
  var GO = 'display:block;width:100%;border:none;background:#B8791E;color:#fff;border-radius:12px;padding:13px;font:inherit;font-weight:600;cursor:pointer;margin-top:14px;';

  function hoja(titulo, llenar) {
    var viejo = document.getElementById('pxHoja'); if (viejo) viejo.remove();
    var ov = el('div', 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;');
    ov.id = 'pxHoja';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    var card = el('div', CARD);
    var cab = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;');
    cab.appendChild(el('h3', 'margin:0;font-size:1.15rem;', titulo));
    var x = el('button', 'border:none;background:none;font-size:1.3rem;cursor:pointer;color:#5E6B62;', '✕');
    x.addEventListener('click', function () { ov.remove(); });
    cab.appendChild(x);
    card.appendChild(cab);
    llenar(card, function () { ov.remove(); });
    ov.appendChild(card);
    document.body.appendChild(ov);
  }

  function opciones(card, lista, actual, alElegir) {
    var fila = el('div', 'margin:6px 0;');
    var btns = [];
    lista.forEach(function (o) {
      var b = el('button', OP + (o[0] === actual ? OPON : ''), o[1]);
      b.type = 'button';
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.style.cssText = OP; });
        b.style.cssText = OP + OPON;
        alElegir(o[0]);
      });
      btns.push(b); fila.appendChild(b);
    });
    card.appendChild(fila);
  }

  function enviarTexto(t) {
    try {
      var campo = document.getElementById('input');
      campo.value = t;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      if (typeof send === 'function') send(); else document.getElementById('sendBtn').click();
    } catch (e) {}
  }

  // ---- 🎯 Practicar ----
  function abrirPractica() {
    var nivel = 'fácil', tema = (typeof currentArea !== 'undefined' && currentArea) ? currentArea : 'cualquier tema de matemáticas';
    hoja('🎯 Practicar', function (card, cerrar) {
      card.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;', 'Pimath te pone ejercicios uno por uno y te corrige.'));
      card.appendChild(el('p', 'margin:10px 0 2px;font-weight:600;', 'Nivel'));
      opciones(card, [['fácil', 'Fácil'], ['medio', 'Medio'], ['difícil', 'Difícil']], nivel, function (v) { nivel = v; });
      card.appendChild(el('p', 'margin:10px 0 2px;font-weight:600;', 'Tema'));
      var temas = [['cualquier tema de matemáticas', 'General'], ['aritmética', 'Aritmética'], ['álgebra', 'Álgebra'], ['geometría', 'Geometría'], ['estadística', 'Estadística']];
      var act = temas[0][0];
      temas.forEach(function (t) { if (t[0] === String(tema).toLowerCase()) act = t[0]; });
      tema = act;
      opciones(card, temas, act, function (v) { tema = v; });
      var go = el('button', GO, 'Empezar'); go.type = 'button';
      go.addEventListener('click', function () {
        cerrar();
        datos.practicas++; guardar();
        enviarTexto('Quiero practicar ' + tema + ' (nivel ' + nivel + '). Ponme UN ejercicio y espera mi respuesta. Cuando responda dime si está bien o mal, explícame brevemente y ponme el siguiente, subiendo o bajando la dificultad según me vaya.');
      });
      card.appendChild(go);
    });
  }

  // ---- ✏️ Pizarra ----
  function abrirPizarra() {
    var ov = el('div', 'position:fixed;inset:0;z-index:92;background:#fff;display:flex;flex-direction:column;font-family:var(--font-body,system-ui,sans-serif);');
    var barra = el('div', 'display:flex;gap:6px;align-items:center;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 8px;border-bottom:1px solid #E4DCC8;flex-wrap:wrap;');
    var cv = el('canvas', 'flex:1;width:100%;touch-action:none;background:#fff;');
    var color = '#111', grosor = 3;
    function btn(txt, f) { var b = el('button', OP + 'margin:0;padding:8px 12px;', txt); b.type = 'button'; b.addEventListener('click', f); barra.appendChild(b); return b; }
    btn('⚫', function () { color = '#111'; grosor = 3; });
    btn('🔵', function () { color = '#1565C0'; grosor = 3; });
    btn('🔴', function () { color = '#C62828'; grosor = 3; });
    btn('🧽', function () { color = '#fff'; grosor = 22; });
    btn('Limpiar', function () { var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); });
    var sp = el('span', 'flex:1;'); barra.appendChild(sp);
    btn('Cancelar', function () { ov.remove(); });
    var env = el('button', 'border:none;background:#B8791E;color:#fff;border-radius:12px;padding:9px 14px;font:inherit;font-weight:600;cursor:pointer;', 'Enviar a Pimath');
    barra.appendChild(env);
    ov.appendChild(barra); ov.appendChild(cv);
    document.body.appendChild(ov);

    var r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * 2); cv.height = Math.round(r.height * 2);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var dibujando = false, ux = 0, uy = 0;
    function pos(e) { var b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height]; }
    cv.addEventListener('pointerdown', function (e) { dibujando = true; var p = pos(e); ux = p[0]; uy = p[1]; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) {
      if (!dibujando) return;
      var p = pos(e);
      ctx.strokeStyle = color; ctx.lineWidth = grosor * 2;
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(p[0], p[1]); ctx.stroke();
      ux = p[0]; uy = p[1];
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { dibujando = false; }); });
    env.addEventListener('click', function () {
      cv.toBlob(function (b) {
        try {
          var f = new File([b], 'pizarra.png', { type: 'image/png' });
          var dt = new DataTransfer(); dt.items.add(f);
          var fi = document.getElementById('fileInput');
          fi.files = dt.files;
          fi.dispatchEvent(new Event('change', { bubbles: true }));
          var campo = document.getElementById('input');
          if (campo && !campo.value.trim()) campo.value = 'Mira lo que escribí en la pizarra y ayúdame con el problema.';
          ov.remove();
          if (campo) campo.focus();
        } catch (e) { alert('No se pudo enviar la pizarra en este dispositivo.'); }
      }, 'image/png');
    });
  }

  // ---- 📊 Progreso (resumen para padres) ----
  function racha() {
    var n = 0, d = new Date();
    if (!datos.dias[hoy(d)]) d.setDate(d.getDate() - 1);
    while (datos.dias[hoy(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function abrirProgreso() {
    var total = 0, sem = 0, i;
    Object.keys(datos.dias).forEach(function (k) { total += datos.dias[k]; });
    var d = new Date();
    for (i = 0; i < 7; i++) { sem += datos.dias[hoy(d)] || 0; d.setDate(d.getDate() - 1); }
    var temas = Object.keys(datos.areas).sort(function (a, b) { return datos.areas[b] - datos.areas[a]; });
    hoja('📊 Mi progreso', function (card) {
      var fila = el('div', 'display:flex;gap:8px;margin:6px 0 12px;');
      [['🔥 ' + racha(), 'días seguidos'], [String(sem), 'preguntas esta semana'], [String(datos.practicas), 'prácticas']].forEach(function (x) {
        var c = el('div', 'flex:1;background:#FBF8EE;border:1px solid #E4DCC8;border-radius:12px;padding:10px;text-align:center;');
        c.appendChild(el('div', 'font-size:1.3rem;font-weight:700;', x[0]));
        c.appendChild(el('div', 'font-size:.75rem;color:#5E6B62;', x[1]));
        fila.appendChild(c);
      });
      card.appendChild(fila);
      card.appendChild(el('p', 'margin:0 0 6px;font-weight:600;', 'Temas más consultados'));
      if (!temas.length) card.appendChild(el('p', 'color:#5E6B62;margin:0;', 'Aún no hay datos. ¡Haz tu primera pregunta!'));
      temas.slice(0, 5).forEach(function (t) {
        var f = el('div', 'margin:6px 0;');
        f.appendChild(el('div', 'display:flex;justify-content:space-between;font-size:.9rem;', ''));
        f.firstChild.appendChild(el('span', '', t)); f.firstChild.appendChild(el('span', 'color:#5E6B62;', String(datos.areas[t])));
        var pista = el('div', 'height:8px;background:#E4DCC8;border-radius:6px;overflow:hidden;margin-top:3px;');
        pista.appendChild(el('div', 'height:100%;background:#B8791E;width:' + Math.round(datos.areas[t] * 100 / datos.areas[temas[0]]) + '%;'));
        f.appendChild(pista); card.appendChild(f);
      });
      var resumen = 'Resumen de Pimath IA: ' + sem + ' preguntas esta semana, ' + racha() + ' días seguidos estudiando, ' + datos.practicas + ' prácticas.' +
        (temas.length ? ' Tema más consultado: ' + temas[0] + '.' : '');
      var sh = el('button', GO, 'Compartir resumen'); sh.type = 'button';
      sh.addEventListener('click', function () {
        if (navigator.share) navigator.share({ text: resumen }).catch(function () {});
        else window.open('https://wa.me/?text=' + encodeURIComponent(resumen), '_blank');
      });
      card.appendChild(sh);
      card.appendChild(el('p', 'margin:10px 0 0;font-size:.78rem;color:#5E6B62;', 'El progreso se guarda solo en este dispositivo.'));
    });
  }

  // ---- 🌐 Idioma y voz ----
  var VOCES_IA = [['Kore', 'Kore · firme'], ['Aoede', 'Aoede · suave'], ['Leda', 'Leda · joven'], ['Zephyr', 'Zephyr · brillante'], ['Puck', 'Puck · animada'], ['Charon', 'Charon · informativa']];
  var MUESTRA = { 'es-ES': 'Hola, soy Pimath, tu profesor de matemáticas.', 'en-US': 'Hi, I am Pimath, your math teacher.', 'pt-BR': 'Olá, eu sou o Pimath, seu professor de matemática.' };

  function abrirIdioma() {
    hoja('🌐 Idioma y voz', function (card) {
      card.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;', 'Pimath responderá y hablará en el idioma que elijas.'));
      var zonaVoz = el('div', '');
      function probar() {
        try {
          if (window.__pimathLeerIA && window.__pimathLeerIA(MUESTRA[datos.lang] || MUESTRA['es-ES'])) return;
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(MUESTRA[datos.lang] || MUESTRA['es-ES']);
          u.lang = datos.lang; var v = window.__pimathElegirVoz(); if (v) u.voice = v;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }
      function selector(lista, actual, alCambiar) {
        var sel = el('select', 'width:100%;padding:10px;border-radius:12px;border:1px solid #E4DCC8;font:inherit;background:#FBF8EE;margin-top:6px;');
        lista.forEach(function (o) {
          var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1];
          if (o[0] === actual) op.selected = true; sel.appendChild(op);
        });
        sel.addEventListener('change', function () { alCambiar(sel.value); });
        return sel;
      }
      function pintarVoces() {
        zonaVoz.innerHTML = '';
        zonaVoz.appendChild(el('p', 'margin:12px 0 2px;font-weight:600;', 'Tipo de voz'));
        opciones(zonaVoz, [['ia', 'Natural (IA)'], ['nav', 'Del celular']], datos.ia !== false ? 'ia' : 'nav', function (v) {
          datos.ia = (v === 'ia'); guardar(); pintarVoces();
        });
        if (datos.ia !== false) {
          zonaVoz.appendChild(selector(VOCES_IA, datos.vozIA || 'Kore', function (v) { datos.vozIA = v; guardar(); probar(); }));
          zonaVoz.appendChild(el('p', 'margin:8px 0 0;font-size:.78rem;color:#5E6B62;', 'Si la voz de IA no está disponible, Pimath usa la del celular.'));
        } else if ('speechSynthesis' in window) {
          var pref = datos.lang.slice(0, 2).toLowerCase();
          var vs = window.speechSynthesis.getVoices().filter(function (v) { return (v.lang || '').toLowerCase().indexOf(pref) === 0; });
          if (vs.length) {
            var lista = [['', 'Automática']].concat(vs.map(function (v) { return [v.name, v.name]; }));
            zonaVoz.appendChild(selector(lista, datos.voz, function (v) { datos.voz = v; guardar(); probar(); }));
          }
        }
        var pb = el('button', OP + 'margin-top:10px;', '▶ Probar voz'); pb.type = 'button';
        pb.addEventListener('click', probar);
        zonaVoz.appendChild(pb);
      }
      opciones(card, Object.keys(IDIOMAS).map(function (k) { return [k, IDIOMAS[k].n]; }), datos.lang, function (v) {
        datos.lang = v; datos.voz = ''; window.__pimathLang = v; guardar(); pintarVoces();
      });
      card.appendChild(zonaVoz);
      pintarVoces();
    });
  }

  // El botón "🔊 Escuchar" de cada respuesta también usa la voz natural
  function enganchar() {
    var orig = window.hablarTexto;
    if (typeof orig !== 'function' || orig.__px) return;
    var nuevo = function (t) {
      if (window.__pimathLeerIA && window.__pimathLeerIA(t)) return;
      return orig.apply(this, arguments);
    };
    nuevo.__px = true;
    window.hablarTexto = nuevo;
  }

  // ---- Chips en la barra de temas ----
  function crearChips() {
    var cont = document.getElementById('areas');
    if (!cont || cont.querySelector('.pimx')) return;
    [['🎯 Practicar', abrirPractica], ['✏️ Pizarra', abrirPizarra], ['📊 Progreso', abrirProgreso], ['🌐 Idioma', abrirIdioma]].forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'area-chip pimx';
      b.textContent = x[0];
      b.addEventListener('click', x[1]);
      cont.appendChild(b);
    });
  }

  function iniciar() {
    var n = 0;
    (function esperar() {
      if (document.getElementById('areas') && document.getElementById('input')) { crearChips(); enganchar(); }
      else if (++n < 50) setTimeout(esperar, 200);
    })();
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();
