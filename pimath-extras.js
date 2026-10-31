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
  var FORMATO_PRACTICA =
    'FORMATO OBLIGATORIO de cada ejercicio (opción múltiple): primero el enunciado en una línea que empiece con "Ejercicio:"; ' +
    'luego EXACTAMENTE 5 opciones, cada una en su propia línea, con este formato: "A) texto", "B) texto", "C) texto", "D) texto", "E) texto"; ' +
    'solo UNA es correcta y las otras 4 deben ser incorrectas pero creíbles; cambia la posición de la correcta de un ejercicio a otro; ' +
    'al final, en una última línea, escribe la marca oculta [[RESPUESTA: X]] con la letra correcta (por ejemplo [[RESPUESTA: C]]). ' +
    'NO reveles cuál es la correcta ni resuelvas el ejercicio en ese mensaje.';
  window.__pimathFormatoPractica = FORMATO_PRACTICA;

  function abrirPractica() {
    var nivel = 'fácil', materia = 'mate', libre = '';
    var tema = (typeof currentArea !== 'undefined' && currentArea) ? currentArea : 'cualquier tema de matemáticas';
    hoja('Practicar', function (card, cerrar) {
      card.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;', 'Pimath te pone ejercicios con opciones A–E y te dice si acertaste.'));
      card.appendChild(el('p', 'margin:10px 0 2px;font-weight:600;', 'Nivel'));
      opciones(card, [['fácil', 'Fácil'], ['medio', 'Medio'], ['difícil', 'Difícil']], nivel, function (v) { nivel = v; });

      card.appendChild(el('p', 'margin:10px 0 2px;font-weight:600;', 'Materia'));
      var cajaMate = el('div', ''), cajaLibre = el('div', 'display:none;');
      opciones(card, [['mate', 'Matemáticas'], ['libre', 'Escribir mi tema']], materia, function (v) {
        materia = v;
        cajaMate.style.display = v === 'mate' ? '' : 'none';
        cajaLibre.style.display = v === 'libre' ? '' : 'none';
        if (v === 'libre') setTimeout(function () { campoLibre.focus(); }, 50);
      });

      // Matemáticas: temas
      cajaMate.appendChild(el('p', 'margin:10px 0 2px;font-weight:600;', 'Tema'));
      var temas = [['cualquier tema de matemáticas', 'General'], ['aritmética', 'Aritmética'], ['álgebra', 'Álgebra'], ['geometría', 'Geometría'], ['estadística', 'Estadística']];
      var act = temas[0][0];
      temas.forEach(function (t) { if (t[0] === String(tema).toLowerCase()) act = t[0]; });
      tema = act;
      opciones(cajaMate, temas, act, function (v) { tema = v; });
      card.appendChild(cajaMate);

      // Libre: el usuario escribe de qué quiere practicar
      cajaLibre.appendChild(el('p', 'margin:10px 0 6px;font-weight:600;', '¿De qué quieres practicar?'));
      var campoLibre = el('input', 'width:100%;box-sizing:border-box;border:1px solid #E4DCC8;background:#FBF8EE;color:#1C2620;border-radius:12px;padding:11px 14px;font:inherit;');
      campoLibre.type = 'text';
      campoLibre.placeholder = 'Ej: capitales de Sudamérica, inglés, historia de Colombia…';
      campoLibre.maxLength = 120;
      campoLibre.addEventListener('input', function () { libre = campoLibre.value; });
      campoLibre.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      cajaLibre.appendChild(campoLibre);
      card.appendChild(cajaLibre);

      var go = el('button', GO, 'Empezar'); go.type = 'button';
      go.addEventListener('click', function () {
        var quiero;
        if (materia === 'libre') {
          libre = (campoLibre.value || '').trim();
          if (!libre) { campoLibre.style.borderColor = '#C62828'; campoLibre.focus(); return; }
          quiero = 'Quiero practicar este tema: ' + libre + ' (nivel ' + nivel + ').';
        } else {
          quiero = 'Quiero practicar ' + tema + ' (nivel ' + nivel + ').';
        }
        cerrar();
        datos.practicas++; guardar();
        enviarTexto(quiero + ' Ponme UN ejercicio de opción múltiple y espera mi respuesta. ' + FORMATO_PRACTICA +
          ' Cuando yo elija una letra, dime si está bien o mal, explícame brevemente y ponme el siguiente ejercicio con el mismo formato, subiendo o bajando la dificultad según me vaya.');
      });
      card.appendChild(go);
    });
  }

  // ---- Opciones A–E clicables dentro de los mensajes de Pimath ----
  var chatBox = document.getElementById('chat');
  function procesarOpciones(div) {
    if (!div || div.getAttribute('data-px-abcde')) return;
    var h = div.innerHTML;
    var sp = div.querySelector('.speak-btn');
    if (sp) { h = h.replace(sp.outerHTML, ''); }
    var m = h.match(/\[\[\s*RESPUESTA\s*:\s*([A-E])\s*\]\]/i);
    if (!m) return;
    var correcta = m[1].toUpperCase();
    div.setAttribute('data-px-abcde', '1');
    var limpio = h.replace(/(<br\s*\/?>\s*)*\[\[\s*RESPUESTA\s*:\s*[A-E]\s*\]\]/i, '');
    var partes = limpio.replace(/<\/p>\s*<p>/gi, '<br>').split(/<br\s*\/?>/i);
    var fila = [], resto = [];
    partes.forEach(function (ln) {
      var mm = ln.replace(/^\s*(<\/?(p|strong|em)>)*\s*/i, '').match(/^([A-E])[\)\.](?:\s*<\/(?:strong|em)>)?\s*([\s\S]+)$/);
      if (mm) fila.push([mm[1], mm[2].replace(/<\/p>\s*$/i, '')]); else resto.push(ln);
    });
    if (fila.length < 2) { div.innerHTML = limpio; if (sp) div.appendChild(sp); return; }
    // enunciado (todo lo que no es opción)
    div.innerHTML = resto.join('<br>').replace(/(<br>\s*)+(<\/p>)?\s*$/i, '$2');
    var caja = el('div', 'display:flex;flex-direction:column;gap:8px;margin-top:10px;');
    var botones = [];
    fila.forEach(function (o) {
      var b = el('button', OP + 'display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;margin:0;');
      b.type = 'button';
      var letra = el('span', 'font-weight:700;color:#B8791E;min-width:1.2em;', o[0]);
      var txt = el('span', 'flex:1;'); txt.innerHTML = o[1];
      b.appendChild(letra); b.appendChild(txt);
      b.addEventListener('click', function () {
        botones.forEach(function (x) { x.disabled = true; x.style.cursor = 'default'; });
        var ok = o[0] === correcta;
        b.style.cssText += ok ? 'border-color:#2E7D32;background:#E3F3E5;' : 'border-color:#C62828;background:#FBE4E4;';
        if (!ok) botones.forEach(function (x) { if (x.firstChild.textContent === correcta) x.style.cssText += 'border-color:#2E7D32;background:#E3F3E5;'; });
        var res = el('div', 'margin-top:8px;font-weight:600;color:' + (ok ? '#2E7D32' : '#C62828') + ';', ok ? '¡Correcto!' : 'Incorrecto. La correcta era la ' + correcta + '.');
        caja.appendChild(res);
        enviarTexto('Elegí la opción ' + o[0] + ' (' + (ok ? 'correcta' : 'incorrecta; la correcta era ' + correcta) + '). Explícame brevemente por qué y ponme el siguiente ejercicio con el mismo formato A–E.');
      });
      botones.push(b); caja.appendChild(b);
    });
    div.appendChild(caja);
    if (sp) div.appendChild(sp);
    try { if (window.renderMathInElement) window.renderMathInElement(div, { delimiters: [{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}], throwOnError: false }); } catch (e) {}
  }
  if (chatBox) {
    var lim = false;
    new MutationObserver(function () {
      if (lim) return; lim = true;
      setTimeout(function () {
        lim = false;
        var bots = chatBox.querySelectorAll('.msg.bot:not(.thinking)');
        for (var i = 0; i < bots.length; i++) procesarOpciones(bots[i]);
      }, 30);
    }).observe(chatBox, { childList: true, subtree: true, characterData: true });
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
    btn('Borrador', function () { color = '#fff'; grosor = 22; });
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
    hoja('Mi progreso', function (card) {
      var fila = el('div', 'display:flex;gap:8px;margin:6px 0 12px;');
      [[String(racha()), 'días seguidos'], [String(sem), 'preguntas esta semana'], [String(datos.practicas), 'prácticas']].forEach(function (x) {
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
    hoja('Idioma y voz', function (card) {
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
        var pb = el('button', OP + 'margin-top:10px;', 'Probar voz'); pb.type = 'button';
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

  // ---- Estilos: burbujas del chat y botones ----
  function estilos() {
    if (document.getElementById('pxEstilos')) return;
    var st = document.createElement('style');
    st.id = 'pxEstilos';
    st.textContent = [
      '@keyframes pxPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}',
      '.msg{animation:pxPop .3s cubic-bezier(.2,.8,.2,1)!important}',
      '.msg.user{background:linear-gradient(135deg,#C98B2B 0%,#E3AC45 100%)!important;color:#fff!important;border:none!important;border-radius:22px 22px 6px 22px!important;box-shadow:0 8px 20px rgba(184,121,30,.30)!important;padding:12px 18px!important}',
      '.msg.user *{color:#fff!important}',
      '.msg.bot:not(.thinking){background:#fff!important;border:1px solid #EFE6D2!important;border-radius:22px 22px 22px 6px!important;box-shadow:0 8px 22px rgba(28,38,32,.09)!important;padding:14px 18px!important}',
      '#sidebar{background:#FAF8F2!important}',
      '#sidebarHeader{margin-bottom:6px!important}',
      '#sidebarHeader h3{font-family:var(--font-display,Georgia,serif)!important;font-size:1.7rem!important;font-weight:700!important;letter-spacing:-.2px}',
      '#pxMenuLat{padding:0 0 2px}',
      '#pxSep{height:1px;background:#E4DCC8;margin:8px 4px 2px}',
      '#pxRec{padding:12px 4px 8px;font-size:.92rem;color:#7A857D;font-weight:500}',
      '.pxm-item{display:flex;align-items:center;gap:18px;width:100%;padding:14px 8px;border:none;background:none;border-radius:12px;font:inherit;font-size:1.08rem;color:#1C2620;cursor:pointer;text-align:left;-webkit-tap-highlight-color:transparent}',
      '.pxm-item:active{background:#EFE9DA}',
      '.pxm-item svg{width:25px;height:25px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
      '.pxm-voz svg{stroke:#2B5BFF}',
      '#pxHerramientas .pimx{padding:8px 16px;border-radius:999px;font-weight:600}',
      '#pxHerramientas .pimx-hablar{background:linear-gradient(135deg,#46A8FF,#2B5BFF)!important;color:#fff!important;border:none!important;box-shadow:0 6px 16px rgba(43,91,255,.35)}'
    ].join('');
    document.head.appendChild(st);
  }

  // ---- Menú lateral estilo Claude: opciones + recientes + Nuevo chat ----
  var ICONOS = {
    voz: '<path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/>',
    practicar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    pizarra: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    progreso: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
    idioma: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[k] + '</svg>'; }

  function cerrarMenu() { try { if (typeof closeSidebar === 'function') closeSidebar(); } catch (e) {} }

  function menuLateral() {
    var sb = document.getElementById('sidebar');
    var nuevo = document.getElementById('sidebarNewChat');
    var lista = document.getElementById('historyList');
    if (!sb || !nuevo || !lista || document.getElementById('pxMenuLat')) return;
    var h3 = sb.querySelector('#sidebarHeader h3');
    if (h3) h3.textContent = 'Pimath IA';

    var items = [];
    if (window.__pimathAbrirVoz) items.push(['Hablar', 'voz', function () { window.__pimathAbrirVoz(); }]);
    items.push(['Practicar', 'practicar', abrirPractica], ['Pizarra', 'pizarra', abrirPizarra]);

    var nav = document.createElement('nav');
    nav.id = 'pxMenuLat';
    items.forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pxm-item' + (x[1] === 'voz' ? ' pxm-voz' : '');
      b.innerHTML = svg(x[1]) + '<span>' + x[0] + '</span>';
      b.addEventListener('click', function () { cerrarMenu(); setTimeout(x[2], 180); });
      nav.appendChild(b);
    });
    var sep = document.createElement('div'); sep.id = 'pxSep';
    var rec = document.createElement('div'); rec.id = 'pxRec'; rec.textContent = 'Historial';
    sb.insertBefore(nav, nuevo);
    sb.insertBefore(sep, nuevo);
    sb.insertBefore(rec, nuevo);
  }

  // ---- ⚙️ Configuración (en el menú de la foto de perfil): Progreso e Idioma ----
  var GEAR = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';
  ICONOS.gear = GEAR;
  var CFG = [['Progreso', abrirProgreso, 'progreso'], ['Idioma', abrirIdioma, 'idioma']];
  var BTN_CFG = 'width:100%;padding:9px;border:1px solid #E4DCC8;border-radius:10px;background:#FBF8EE;color:#1C2620;font:inherit;font-size:.88rem;cursor:pointer;text-align:left;margin:0 0 8px;box-sizing:border-box;';
  function crearConfig(menu) {
    var caja = document.createElement('div'); caja.id = 'pxCfg';
    var cab = document.createElement('button'); cab.type = 'button'; cab.style.cssText = BTN_CFG + 'display:flex;justify-content:space-between;align-items:center;';
    var tit = document.createElement('div'); tit.style.cssText = 'display:flex;align-items:center;gap:8px;'; tit.innerHTML = svg('gear').replace('<svg ', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round" ') + '<div>Configuración</div>';
    var fl = document.createElement('div'); fl.textContent = '▾'; fl.style.cssText = 'transition:transform .2s;';
    cab.appendChild(tit); cab.appendChild(fl);
    var lista = document.createElement('div'); lista.style.cssText = 'display:none;padding-left:8px;';
    CFG.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.style.cssText = BTN_CFG + 'display:flex;align-items:center;gap:8px;'; b.innerHTML = svg(c[2]).replace('<svg ', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round" ') + '<div>' + c[0] + '</div>';
      b.addEventListener('click', function () { menu.classList.remove('open'); setTimeout(c[1], 120); });
      lista.appendChild(b);
    });
    cab.addEventListener('click', function () {
      var abierto = lista.style.display !== 'none';
      lista.style.display = abierto ? 'none' : 'block';
      fl.style.transform = abierto ? '' : 'rotate(180deg)';
    });
    caja.appendChild(cab); caja.appendChild(lista);
    return caja;
  }
  function configPerfil() {
    var menu = document.getElementById('userMenu');
    var slot = document.getElementById('userSlot');
    if (!menu || !slot) return;
    function poner() {
      // sesión iniciada: agregar "Configuración" antes de "Cerrar sesión"
      if (menu.children.length && !menu.querySelector('#pxCfg')) {
        var salir = menu.querySelector('button');
        var caja = crearConfig(menu);
        if (salir) menu.insertBefore(caja, salir); else menu.appendChild(caja);
      }
      // sin sesión: botón de engranaje junto al icono de Google
      var tieneAvatar = !!slot.querySelector('.avatar-btn');
      var eng = document.getElementById('pxGear');
      if (!tieneAvatar && !eng) {
        eng = document.createElement('button'); eng.id = 'pxGear'; eng.type = 'button'; eng.innerHTML = svg('gear').replace('<svg ', '<svg style="width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round" '); eng.title = 'Configuración';
        eng.style.cssText = 'border:none;background:none;color:#1C2620;cursor:pointer;margin-right:6px;padding:4px;display:flex;';
        eng.addEventListener('click', function () {
          hoja('Configuración', function (card, cerrar) {
            CFG.forEach(function (c) {
              var b = el('button', OP + 'display:block;width:100%;text-align:left;margin:6px 0;', c[0]); b.type = 'button';
              b.addEventListener('click', function () { cerrar(); setTimeout(c[1], 120); });
              card.appendChild(b);
            });
          });
        });
        slot.insertBefore(eng, slot.firstChild);
      } else if (tieneAvatar && eng) { eng.remove(); }
    }
    poner();
    new MutationObserver(function () { poner(); }).observe(menu, { childList: true });
    new MutationObserver(function () { poner(); }).observe(slot, { childList: true });
  }

  function iniciar() {
    var n = 0;
    (function esperar() {
      if (document.getElementById('chat') && document.getElementById('input') && document.getElementById('sidebar')) { estilos(); menuLateral(); configPerfil(); enganchar(); }
      else if (++n < 50) setTimeout(esperar, 200);
    })();
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();
