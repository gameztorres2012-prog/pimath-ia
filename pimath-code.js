// Pimath IA: PIMATH CODE
// Menú ☰ > Pimath Code: crear webs, apps y videojuegos con una frase, ver el resultado en vivo,
// pedir cambios (escribiendo o hablando), corregir código, guardar proyectos y descargarlos.
// Pimath Code puede programar cualquier cosa MENOS la app de Pimath IA.
(function () {
  'use strict';

  var KEY = 'pimath_code_projects';
  var EXT = { html: 'html', python: 'py', py: 'py', java: 'java', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', 'c#': 'cs', php: 'php', css: 'css', json: 'json', kotlin: 'kt', swift: 'swift', go: 'go', rust: 'rs', ruby: 'rb', sql: 'sql', bash: 'sh', sh: 'sh', lua: 'lua', dart: 'dart' };

  var IDEAS = [
    ['🐍', 'Juego Snake táctil', 'Hazme un juego de Snake con controles táctiles, marcador, récord guardado y sonidos.'],
    ['🚀', 'Videojuego de naves', 'Hazme un videojuego de naves espaciales con enemigos, disparos, vidas, puntaje, efectos de sonido y controles táctiles.'],
    ['🃏', 'Juego de memoria', 'Hazme un juego de memoria con cartas de emojis, contador de intentos, cronómetro y sonidos.'],
    ['🎹', 'Piano virtual', 'Hazme un piano virtual con teclas táctiles y sonidos reales usando Web Audio.'],
    ['🧮', 'Calculadora bonita', 'Hazme una calculadora científica con diseño moderno y historial de operaciones.'],
    ['📈', 'Graficador de funciones', 'Hazme un graficador de funciones matemáticas donde escribo f(x) y se dibuja la gráfica con zoom.'],
    ['💼', 'Portafolio personal', 'Hazme una página de portafolio personal con secciones de sobre mí, proyectos y contacto, con animaciones suaves.'],
    ['🛒', 'Tienda con carrito', 'Hazme una tienda en línea de ejemplo con productos, carrito de compras y total.'],
    ['🎉', 'Invitación animada', 'Hazme una invitación de cumpleaños animada con cuenta regresiva y confeti.'],
    ['📝', 'App de notas', 'Hazme una app de notas con crear, editar, borrar y buscar, que guarde las notas.'],
    ['✅', 'Lista de tareas', 'Hazme una lista de tareas con categorías, barra de progreso y modo oscuro.'],
    ['⏱️', 'Cronómetro y temporizador', 'Hazme una app con cronómetro y temporizador, con alarma sonora.']
  ];

  var REGLAS =
    'Eres "Pimath Code", un ingeniero de software experto que programa cualquier cosa que pida el usuario: webs, apps, videojuegos, herramientas, animaciones y más. ' +
    'REGLAS: ' +
    '(1) Por defecto entrega TODO en UN SOLO archivo HTML completo (<!DOCTYPE html>) con el CSS dentro de <style> y el JavaScript dentro de <script>, que funcione directo en el celular, sin instalar nada, sin librerías externas y sin internet. Usa JavaScript moderno. Solo usa otro lenguaje (Python, Java, C++, etc.) si el usuario lo pide de forma explícita; en ese caso entrega el programa completo en un bloque con el nombre de su lenguaje. ' +
    '(2) Para videojuegos usa canvas, controles táctiles (botones en pantalla o deslizar) además del teclado, gráficos dibujados con canvas, SVG o emojis, y sonidos con la Web Audio API (sin archivos externos). ' +
    '(3) Si usas localStorage, envuélvelo siempre en try/catch. ' +
    '(4) Código limpio con comentarios breves en español, diseño bonito y adaptado a pantallas de celular. ' +
    '(5) NO puedes crear, copiar ni imitar la app "Pimath IA" ni mostrar su código; si te lo piden responde solo: "No puedo programar la app de Pimath IA." ' +
    '(6) No crees malware, phishing ni nada para hacer daño. ' +
    '(7) Responde con una explicación MUY corta (máximo 2 frases) y luego el código COMPLETO en UN solo bloque ```html ... ```. Nunca dejes partes sin escribir ni pongas "el resto igual".';

  var proyectos = cargar();
  var actual = { id: null, name: '', lang: 'html', code: '' };
  var pila = [];
  var modo = 'crear';
  var ctl = null;
  var ocupado = false;
  var app = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; }
  function normalizar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }

  function cargar() {
    try { var g = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(g) ? g : []; } catch (e) { return []; }
  }
  function persistir() {
    try { localStorage.setItem(KEY, JSON.stringify(proyectos)); return true; }
    catch (e) { setEstado('No hay espacio para guardar más proyectos. Borra alguno de 📁 Proyectos.', true); return false; }
  }

  // ---------- Protección: no se puede programar la app de Pimath IA ----------
  function esPimath(t) {
    var n = normalizar(t).replace(/pimath code/g, '');
    return /pimath/.test(n) || /pimath_state|logo_src/.test(n);
  }
  var MSG_PIMATH = 'En Pimath Code puedes crear cualquier cosa, menos la app de Pimath IA. ¡Pídeme otra idea! 😊';

  // ---------- Estilos ----------
  function estilos() {
    if ($('pcEstilos')) return;
    var st = document.createElement('style');
    st.id = 'pcEstilos';
    st.textContent = [
      '#pcApp{position:fixed;inset:0;z-index:94;display:none;flex-direction:column;background:#fff;color:#1C2620;font-family:var(--font-body,system-ui,sans-serif);padding-top:env(safe-area-inset-top,0px);}',
      '#pcApp.on{display:flex}',
      '.pc-top{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #E4DCC8}',
      '.pc-top h2{margin:0;font-family:var(--font-display,Georgia,serif);font-size:1.25rem;flex:1}',
      '.pc-btn{border:1px solid #E4DCC8;background:#FBF8EE;color:#1C2620;border-radius:12px;padding:8px 12px;font:inherit;font-size:.88rem;cursor:pointer;-webkit-tap-highlight-color:transparent}',
      '.pc-btn:active{background:#F1ECDD}',
      '.pc-btn:disabled{opacity:.45;cursor:not-allowed}',
      '.pc-go{background:#B8791E;color:#fff;border:none;font-weight:600}',
      '.pc-go:active{background:#9c6618}',
      '.pc-pill.on{background:#F6E9CF;border-color:#B8791E;font-weight:600}',
      '.pc-row{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;align-items:center}',
      '.pc-body{flex:1;overflow:auto;padding:4px 12px calc(28px + env(safe-area-inset-bottom,0px))}',
      '.pc-ta{width:100%;box-sizing:border-box;min-height:84px;resize:vertical;padding:10px 12px;border:1px solid #E4DCC8;border-radius:12px;font:inherit;background:#FBF8EE;color:#1C2620}',
      '.pc-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.78rem;min-height:300px;white-space:pre;overflow:auto}',
      '.pc-name{flex:1;min-width:0;padding:9px 12px;border:1px solid #E4DCC8;border-radius:12px;font:inherit;font-weight:600;background:#fff;color:#1C2620}',
      '.pc-msg{font-size:.88rem;color:#5E6B62;margin:6px 0}',
      '.pc-msg.err{color:#B8422F}',
      '.pc-expl{background:#FBF8EE;border:1px solid #E4DCC8;border-radius:12px;padding:10px 12px;margin:8px 0;white-space:pre-wrap;font-size:.9rem;line-height:1.5}',
      '.pc-frame{width:100%;height:60vh;border:1px solid #E4DCC8;border-radius:12px;background:#fff;display:block}',
      '.pc-frame.full{position:fixed;inset:0;z-index:99;width:100%;height:100%;border:0;border-radius:0}',
      '.pc-exit{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:100;background:rgba(28,38,32,.85);color:#fff;border:none;border-radius:18px;padding:8px 14px;font:inherit;font-size:.85rem;cursor:pointer}',
      '.pc-mic.on{background:#B8422F;color:#fff;border-color:#B8422F}',
      '.pc-sheet{position:fixed;inset:0;z-index:97;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}',
      '.pc-card{background:#fff;color:#1C2620;width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));max-height:85vh;overflow:auto;box-sizing:border-box;font-family:var(--font-body,system-ui,sans-serif)}',
      '.pc-card h3{margin:0;font-size:1.1rem}',
      '.pc-item{display:flex;align-items:center;gap:10px;padding:11px 8px;border-bottom:1px solid #E4DCC8;cursor:pointer}',
      '.pc-item:active{background:#F1ECDD}',
      '.pc-item .t{flex:1;min-width:0}',
      '.pc-item .t b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pc-item .t small{color:#5E6B62}',
      '.pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
      '.pc-idea{border:1px solid #E4DCC8;background:#FBF8EE;border-radius:14px;padding:12px 10px;text-align:left;font:inherit;font-size:.88rem;cursor:pointer;color:#1C2620}',
      '.pc-idea:active{background:#F6E9CF}',
      '.pc-idea span{font-size:1.5rem;display:block;margin-bottom:4px}'
    ].join('');
    document.head.appendChild(st);
  }

  // ---------- Interfaz principal ----------
  function construir() {
    if (app) return;
    estilos();
    app = document.createElement('div');
    app.id = 'pcApp';
    app.setAttribute('role', 'dialog');
    app.setAttribute('aria-label', 'Pimath Code');
    app.innerHTML =
      '<div class="pc-top"><button class="pc-btn" id="pcCerrar" aria-label="Cerrar">✕</button><h2>💻 Pimath Code</h2></div>' +
      '<div class="pc-body">' +
        '<div class="pc-row">' +
          '<button class="pc-btn pc-pill on" id="pcModoCrear">Crear</button>' +
          '<button class="pc-btn pc-pill" id="pcModoFix">Corregir código</button>' +
          '<button class="pc-btn" id="pcProy">📁 Proyectos</button>' +
          '<button class="pc-btn" id="pcGal">✨ Ideas</button>' +
          '<button class="pc-btn" id="pcNuevo">➕ Nuevo</button>' +
        '</div>' +
        '<div id="pcCrear">' +
          '<textarea class="pc-ta" id="pcIn" placeholder="Describe lo que quieres crear. Ej: un juego de carreras con puntaje"></textarea>' +
          '<div class="pc-row"><button class="pc-btn pc-mic" id="pcMic" aria-label="Dictar por voz">🎙️</button><button class="pc-btn pc-go" id="pcGo" style="flex:1">Crear</button></div>' +
        '</div>' +
        '<div id="pcFix" style="display:none">' +
          '<textarea class="pc-ta pc-code" id="pcFixCode" style="min-height:150px" spellcheck="false" placeholder="Pega aquí tu código"></textarea>' +
          '<textarea class="pc-ta" id="pcFixErr" style="margin-top:8px;min-height:60px" placeholder="¿Qué error ves o qué no funciona? (opcional)"></textarea>' +
          '<div class="pc-row"><button class="pc-btn pc-go" id="pcFixGo" style="flex:1">Revisar y corregir</button></div>' +
        '</div>' +
        '<div class="pc-msg" id="pcEstado"></div>' +
        '<div class="pc-expl" id="pcExpl" style="display:none"></div>' +
        '<div id="pcRes" style="display:none">' +
          '<div class="pc-row"><input class="pc-name" id="pcNombre" placeholder="Nombre del proyecto" maxlength="60"></div>' +
          '<div class="pc-row"><button class="pc-btn pc-pill on" id="pcTabVer">▶ Vista previa</button><button class="pc-btn pc-pill" id="pcTabCod">&lt;/&gt; Código</button></div>' +
          '<div id="pcVer"></div>' +
          '<div id="pcCod" style="display:none">' +
            '<textarea class="pc-ta pc-code" id="pcCodigo" spellcheck="false"></textarea>' +
            '<div class="pc-row"><button class="pc-btn pc-go" id="pcEjec">▶ Ejecutar</button><button class="pc-btn" id="pcCopiar">Copiar</button></div>' +
          '</div>' +
          '<div class="pc-row">' +
            '<button class="pc-btn" id="pcDeshacer">↩ Deshacer</button>' +
            '<button class="pc-btn" id="pcGuardar">💾 Guardar</button>' +
            '<button class="pc-btn" id="pcBajar">⬇ Descargar</button>' +
            '<button class="pc-btn" id="pcZip">📱 App instalable</button>' +
            '<button class="pc-btn" id="pcFull">⛶ Pantalla completa</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(app);

    $('pcCerrar').addEventListener('click', cerrar);
    $('pcModoCrear').addEventListener('click', function () { cambiarModo('crear'); });
    $('pcModoFix').addEventListener('click', function () { cambiarModo('fix'); });
    $('pcProy').addEventListener('click', abrirProyectos);
    $('pcGal').addEventListener('click', abrirIdeas);
    $('pcNuevo').addEventListener('click', nuevo);
    $('pcGo').addEventListener('click', generar);
    $('pcFixGo').addEventListener('click', corregir);
    $('pcMic').addEventListener('click', dictar);
    $('pcTabVer').addEventListener('click', function () { pestana('ver'); });
    $('pcTabCod').addEventListener('click', function () { pestana('cod'); });
    $('pcEjec').addEventListener('click', ejecutarEditado);
    $('pcCopiar').addEventListener('click', copiar);
    $('pcDeshacer').addEventListener('click', deshacer);
    $('pcGuardar').addEventListener('click', function () { if (guardar()) setEstado('Proyecto guardado ✓'); });
    $('pcBajar').addEventListener('click', descargar);
    $('pcZip').addEventListener('click', descargarApp);
    $('pcFull').addEventListener('click', pantallaCompleta);
    $('pcNombre').addEventListener('change', function () { actual.name = this.value.trim().slice(0, 60) || actual.name; guardar(); });
    $('pcIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generar(); });
    actualizarEntrada();
  }

  function abrir() { construir(); app.classList.add('on'); }
  function cerrar() { if (app) app.classList.remove('on'); }

  function cambiarModo(m) {
    modo = m;
    $('pcModoCrear').classList.toggle('on', m === 'crear');
    $('pcModoFix').classList.toggle('on', m === 'fix');
    $('pcCrear').style.display = m === 'crear' ? '' : 'none';
    $('pcFix').style.display = m === 'fix' ? '' : 'none';
    setEstado('');
  }

  function setEstado(txt, error) {
    var e = $('pcEstado');
    if (!e) return;
    e.textContent = txt || '';
    e.className = 'pc-msg' + (error ? ' err' : '');
  }

  function mostrarExpl(txt) {
    var e = $('pcExpl');
    if (!txt) { e.style.display = 'none'; e.textContent = ''; return; }
    e.style.display = 'block';
    e.textContent = txt;
  }

  function actualizarEntrada() {
    var tiene = !!actual.code;
    $('pcIn').placeholder = tiene
      ? 'Pide un cambio. Ej: ponle fondo azul y añade un marcador de puntos'
      : 'Describe lo que quieres crear. Ej: un juego de carreras con puntaje';
    $('pcGo').textContent = tiene ? 'Aplicar cambio' : 'Crear';
  }

  function nuevo() {
    if (ocupado && ctl) ctl.abort();
    actual = { id: null, name: '', lang: 'html', code: '' };
    pila = [];
    $('pcRes').style.display = 'none';
    $('pcIn').value = '';
    mostrarExpl('');
    setEstado('');
    actualizarEntrada();
    cambiarModo('crear');
  }

  // ---------- Hablar para pedir ----------
  var reconocimiento = null;
  function dictar() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var btn = $('pcMic');
    if (!SR) { setEstado('Este navegador no permite dictar por voz.', true); return; }
    if (reconocimiento) { try { reconocimiento.stop(); } catch (e) {} return; }
    reconocimiento = new SR();
    reconocimiento.lang = window.__pimathLang || 'es-ES';
    reconocimiento.interimResults = false;
    reconocimiento.continuous = false;
    btn.classList.add('on');
    setEstado('Te escucho…');
    reconocimiento.onresult = function (ev) {
      var t = ev.results[0][0].transcript;
      var campo = $('pcIn');
      campo.value = (campo.value ? campo.value + ' ' : '') + t;
    };
    reconocimiento.onerror = function () { setEstado('No pude escucharte. Revisa el permiso del micrófono.', true); };
    reconocimiento.onend = function () { reconocimiento = null; btn.classList.remove('on'); if ($('pcEstado').textContent === 'Te escucho…') setEstado(''); };
    try { reconocimiento.start(); } catch (e) { reconocimiento = null; btn.classList.remove('on'); }
  }

  // ---------- Hablar con la IA ----------
  function nombreUsuario() { try { return (typeof studentName !== 'undefined' && studentName) || ''; } catch (e) { return ''; } }

  function llamar(mensaje) {
    ctl = new AbortController();
    return fetch('/api/chat', {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [], message: mensaje, image: null, studentName: nombreUsuario(), area: 'Pimath Code' })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('http_' + r.status));
        return d.text || '';
      });
    });
  }

  function errorTexto(msg) {
    var m = String(msg || '').toLowerCase();
    if (m.indexOf('504') !== -1 || m.indexOf('timeout') !== -1 || m.indexOf('502') !== -1) return 'Tardó demasiado generando el código. Pide algo más pequeño o hazlo por partes (primero lo básico y luego agrega cosas).';
    if (m.indexOf('quota') !== -1 || m.indexOf('rate') !== -1 || m.indexOf('429') !== -1 || m.indexOf('exhausted') !== -1) return 'Se alcanzó el límite de uso por ahora. Intenta más tarde.';
    if (m.indexOf('demand') !== -1 || m.indexOf('overloaded') !== -1 || m.indexOf('503') !== -1) return 'Pimath tiene mucha demanda. Intenta de nuevo en unos segundos.';
    return 'Hubo un problema de conexión. Intenta de nuevo.';
  }

  function extraer(texto) {
    var re = /```([a-zA-Z+#]*)[ \t]*\r?\n([\s\S]*?)```/g, m, mejor = null;
    while ((m = re.exec(texto))) {
      if (!mejor || m[2].length > mejor.code.length) mejor = { lang: (m[1] || '').toLowerCase(), code: m[2] };
    }
    if (!mejor) {
      var a = texto.indexOf('```');
      if (a >= 0) {
        var resto = texto.slice(a + 3), nl = resto.indexOf('\n');
        if (nl >= 0) mejor = { lang: resto.slice(0, nl).trim().toLowerCase(), code: resto.slice(nl + 1), truncado: true };
      } else if (/<!doctype html|<html/i.test(texto)) {
        mejor = { lang: 'html', code: texto };
      }
    }
    var expl = texto.replace(/```[\s\S]*?(```|$)/g, '').trim();
    return { codigo: mejor, expl: expl };
  }

  function ocupar(si, textoBoton) {
    ocupado = si;
    ['pcGo', 'pcFixGo'].forEach(function (id) {
      var b = $(id);
      if (!b) return;
      b.disabled = si;
      if (si) { b.dataset.txt = b.textContent; b.textContent = textoBoton || 'Pimath está programando…'; }
      else if (b.dataset.txt) b.textContent = b.dataset.txt;
    });
    if (!si) actualizarEntrada();
  }

  // ---------- Crear / cambiar ----------
  function generar() {
    if (ocupado) return;
    var texto = $('pcIn').value.trim();
    if (!texto) { setEstado('Escribe o dicta lo que quieres crear.', true); return; }
    if (esPimath(texto)) { setEstado(''); mostrarExpl(MSG_PIMATH); return; }
    var mensaje, esCambio = !!actual.code;
    if (esCambio) {
      mensaje = REGLAS + '\n\nCÓDIGO ACTUAL:\n```' + (actual.lang || 'html') + '\n' + actual.code + '\n```\n\nCAMBIO PEDIDO: ' + texto + '\nDevuelve el archivo COMPLETO ya actualizado.';
    } else {
      mensaje = REGLAS + '\n\nPEDIDO: ' + texto;
    }
    mostrarExpl('');
    setEstado('Pimath está programando… puede tardar unos segundos.');
    ocupar(true);
    llamar(mensaje).then(function (texto2) {
      var r = extraer(texto2);
      if (!r.codigo || !r.codigo.code.trim()) {
        setEstado('');
        mostrarExpl(r.expl || texto2 || 'No pude generar código. Intenta describirlo de otra forma.');
        return;
      }
      aplicar(r.codigo, esCambio ? actual.name : texto.slice(0, 40));
      mostrarExpl(r.expl);
      $('pcIn').value = '';
      setEstado(r.codigo.truncado ? 'El código llegó cortado. Pide "continúa" o un cambio más pequeño.' : 'Listo ✓ Pide otro cambio cuando quieras.', !!r.codigo.truncado);
    }).catch(function (e) {
      if (e && e.name === 'AbortError') { setEstado(''); return; }
      setEstado(errorTexto(e && e.message), true);
    }).then(function () { ocupar(false); });
  }

  // ---------- Corregir código ----------
  function corregir() {
    if (ocupado) return;
    var codigo = $('pcFixCode').value;
    var problema = $('pcFixErr').value.trim();
    if (!codigo.trim()) { setEstado('Pega el código que quieres revisar.', true); return; }
    if (esPimath(codigo + ' ' + problema)) { setEstado(''); mostrarExpl(MSG_PIMATH); return; }
    var mensaje = REGLAS +
      '\n\nTAREA: revisa este código y corrígelo. Primero explica en máximo 5 viñetas cortas qué fallaba y por qué; después entrega el código corregido COMPLETO en un solo bloque.' +
      '\n\nCÓDIGO:\n```\n' + codigo + '\n```' +
      (problema ? '\n\nPROBLEMA QUE VE EL USUARIO: ' + problema : '');
    mostrarExpl('');
    setEstado('Pimath está revisando tu código…');
    ocupar(true, 'Pimath está revisando…');
    llamar(mensaje).then(function (texto) {
      var r = extraer(texto);
      if (!r.codigo || !r.codigo.code.trim()) {
        setEstado('');
        mostrarExpl(r.expl || texto || 'No pude corregir ese código.');
        return;
      }
      if (!r.codigo.lang && /<(html|body|canvas|script)/i.test(r.codigo.code)) r.codigo.lang = 'html';
      aplicar(r.codigo, 'Código corregido');
      mostrarExpl(r.expl);
      setEstado(r.codigo.truncado ? 'El código llegó cortado. Intenta con un fragmento más pequeño.' : 'Listo ✓ Esta es la versión corregida.', !!r.codigo.truncado);
    }).catch(function (e) {
      if (e && e.name === 'AbortError') { setEstado(''); return; }
      setEstado(errorTexto(e && e.message), true);
    }).then(function () { ocupar(false); });
  }

  // ---------- Resultado ----------
  function esWeb() {
    var c = actual.code || '';
    return actual.lang === 'html' || (!actual.lang && /<(html|body|canvas|script)/i.test(c)) || /^\s*<!doctype html/i.test(c);
  }

  function aplicar(codigo, nombreSugerido) {
    if (actual.code) pila.push({ code: actual.code, lang: actual.lang });
    if (pila.length > 30) pila.shift();
    actual.code = codigo.code.replace(/\s+$/, '') + '\n';
    actual.lang = codigo.lang || (/<(html|body|canvas|script)/i.test(codigo.code) ? 'html' : '');
    if (/^(html|htm|xml)$/.test(actual.lang)) actual.lang = 'html';
    if (!actual.name) actual.name = (nombreSugerido || 'Proyecto').trim().slice(0, 60) || 'Proyecto';
    guardar();
    mostrarResultado();
  }

  function mostrarResultado() {
    $('pcRes').style.display = 'block';
    $('pcNombre').value = actual.name;
    $('pcCodigo').value = actual.code;
    var web = esWeb();
    $('pcTabVer').style.display = web ? '' : 'none';
    $('pcZip').style.display = web ? '' : 'none';
    $('pcFull').style.display = web ? '' : 'none';
    $('pcEjec').textContent = web ? '▶ Ejecutar' : '✓ Guardar cambios';
    $('pcDeshacer').disabled = !pila.length;
    actualizarEntrada();
    refrescarVista();
    pestana(web ? 'ver' : 'cod');
  }

  function refrescarVista() {
    var cont = $('pcVer');
    cont.innerHTML = '';
    if (!esWeb()) return;
    var f = document.createElement('iframe');
    f.className = 'pc-frame';
    // Sin allow-same-origin: el proyecto no puede leer los datos de Pimath IA
    f.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-pointer-lock allow-popups');
    f.srcdoc = actual.code;
    cont.appendChild(f);
  }

  function pestana(p) {
    var ver = p === 'ver' && esWeb();
    $('pcVer').style.display = ver ? '' : 'none';
    $('pcCod').style.display = ver ? 'none' : '';
    $('pcTabVer').classList.toggle('on', ver);
    $('pcTabCod').classList.toggle('on', !ver);
  }

  function ejecutarEditado() {
    var nuevoCodigo = $('pcCodigo').value;
    if (!nuevoCodigo.trim()) return;
    if (nuevoCodigo !== actual.code) {
      pila.push({ code: actual.code, lang: actual.lang });
      actual.code = nuevoCodigo;
      guardar();
    }
    mostrarResultado();
  }

  function deshacer() {
    var v = pila.pop();
    if (!v) return;
    actual.code = v.code;
    actual.lang = v.lang;
    guardar();
    mostrarResultado();
    setEstado('Volviste a la versión anterior.');
  }

  function copiar() {
    var t = $('pcCodigo').value;
    try { navigator.clipboard.writeText(t); setEstado('Código copiado ✓'); }
    catch (e) { var c = $('pcCodigo'); c.select(); try { document.execCommand('copy'); setEstado('Código copiado ✓'); } catch (x) {} }
  }

  function pantallaCompleta() {
    var f = app.querySelector('.pc-frame');
    if (!f) return;
    f.classList.add('full');
    var x = el('button', '', '✕ Salir');
    x.className = 'pc-exit';
    x.addEventListener('click', function () { f.classList.remove('full'); x.remove(); });
    document.body.appendChild(x);
  }

  // ---------- Guardar proyectos ----------
  function guardar() {
    if (!actual.code) return false;
    var ahora = Date.now();
    if (!actual.id) actual.id = ahora.toString(36) + Math.random().toString(36).slice(2, 5);
    var existente = null;
    for (var i = 0; i < proyectos.length; i++) if (proyectos[i].id === actual.id) existente = proyectos[i];
    if (existente) {
      existente.name = actual.name; existente.code = actual.code; existente.lang = actual.lang; existente.updated = ahora;
    } else {
      proyectos.unshift({ id: actual.id, name: actual.name || 'Proyecto', code: actual.code, lang: actual.lang, updated: ahora });
    }
    proyectos.sort(function (a, b) { return b.updated - a.updated; });
    return persistir();
  }

  function hoja(titulo, llenar) {
    var viejo = document.getElementById('pcHoja');
    if (viejo) viejo.remove();
    var ov = el('div', '');
    ov.id = 'pcHoja';
    ov.className = 'pc-sheet';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    var card = el('div', '');
    card.className = 'pc-card';
    var cab = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;');
    cab.appendChild(el('h3', '', titulo));
    var x = el('button', 'border:none;background:none;font-size:1.3rem;cursor:pointer;color:#5E6B62;', '✕');
    x.type = 'button';
    x.addEventListener('click', function () { ov.remove(); });
    cab.appendChild(x);
    card.appendChild(cab);
    llenar(card, function () { ov.remove(); });
    ov.appendChild(card);
    document.body.appendChild(ov);
  }

  function abrirProyectos() {
    hoja('Mis proyectos', function (card, cerrarHoja) {
      if (!proyectos.length) {
        card.appendChild(el('p', 'color:#5E6B62;', 'Aún no tienes proyectos. Crea uno y se guarda solo en este dispositivo.'));
        return;
      }
      proyectos.forEach(function (p) {
        var fila = el('div', '');
        fila.className = 'pc-item';
        var t = el('div', '');
        t.className = 't';
        t.appendChild(el('b', '', p.name || 'Proyecto'));
        t.appendChild(el('small', '', new Date(p.updated).toLocaleDateString() + ' · ' + ((p.lang || 'html') === 'html' ? 'Web' : p.lang)));
        fila.appendChild(t);
        var del = el('button', '', '🗑');
        del.className = 'pc-btn';
        del.type = 'button';
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          if (del.dataset.c === '1') {
            proyectos = proyectos.filter(function (q) { return q.id !== p.id; });
            persistir();
            if (actual.id === p.id) nuevo();
            fila.remove();
          } else {
            del.dataset.c = '1';
            del.textContent = '¿Seguro?';
            setTimeout(function () { del.dataset.c = '0'; del.textContent = '🗑'; }, 2500);
          }
        });
        fila.appendChild(del);
        fila.addEventListener('click', function () {
          actual = { id: p.id, name: p.name, lang: p.lang, code: p.code };
          pila = [];
          cerrarHoja();
          cambiarModo('crear');
          mostrarExpl('');
          setEstado('Proyecto abierto. Pide cambios abajo o edítalo en la pestaña Código.');
          mostrarResultado();
        });
        card.appendChild(fila);
      });
    });
  }

  // ---------- Ideas para empezar ----------
  function abrirIdeas() {
    hoja('Ideas para empezar', function (card, cerrarHoja) {
      card.appendChild(el('p', 'margin:0;color:#5E6B62;font-size:.9rem;', 'Toca una idea y Pimath la crea. Luego puedes pedirle cambios.'));
      var grid = el('div', '');
      grid.className = 'pc-grid';
      IDEAS.forEach(function (i) {
        var b = el('button', '');
        b.className = 'pc-idea';
        b.type = 'button';
        var s = el('span', '', i[0]);
        b.appendChild(s);
        b.appendChild(document.createTextNode(i[1]));
        b.addEventListener('click', function () {
          cerrarHoja();
          if (actual.code) nuevo();
          cambiarModo('crear');
          $('pcIn').value = i[2];
          generar();
        });
        grid.appendChild(b);
      });
      card.appendChild(grid);
    });
  }

  // ---------- Descargar ----------
  function slug(t) {
    return normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'proyecto';
  }
  function bajar(blob, nombre) {
    var u = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = u;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
  }
  function descargar() {
    if (!actual.code) return;
    var ext = esWeb() ? 'html' : (EXT[actual.lang] || 'txt');
    bajar(new Blob([actual.code], { type: 'text/plain;charset=utf-8' }), slug(actual.name) + '.' + ext);
    setEstado('Descargando ' + slug(actual.name) + '.' + ext + ' ✓');
  }

  // ---------- App instalable (.zip con index.html + manifest + service worker + icono) ----------
  function crc32(bytes) {
    var t = crc32.t;
    if (!t) {
      t = crc32.t = [];
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = t[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function crearZip(archivos) {
    var enc = new TextEncoder(), partes = [], central = [], offset = 0;
    archivos.forEach(function (f) {
      var nombre = enc.encode(f.name), datos = enc.encode(f.data), crc = crc32(datos);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true);
      h.setUint32(18, datos.length, true); h.setUint32(22, datos.length, true); h.setUint16(26, nombre.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nombre, datos);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true);
      c.setUint32(20, datos.length, true); c.setUint32(24, datos.length, true); c.setUint16(28, nombre.length, true);
      c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
      c.setUint32(38, 0, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), nombre);
      offset += 30 + nombre.length + datos.length;
    });
    var tam = 0;
    central.forEach(function (p) { tam += p.length; });
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(4, 0, true); e.setUint16(6, 0, true);
    e.setUint16(8, archivos.length, true); e.setUint16(10, archivos.length, true);
    e.setUint32(12, tam, true); e.setUint32(16, offset, true); e.setUint16(20, 0, true);
    return new Blob(partes.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }

  function descargarApp() {
    if (!actual.code || !esWeb()) return;
    var nombre = actual.name || 'Mi app';
    var html = actual.code;
    var cabeza = '<link rel="manifest" href="manifest.json"><meta name="theme-color" content="#B8791E"><link rel="icon" href="icon.svg">';
    var registro = '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js")}<\/script>';
    html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, cabeza + '</head>') : cabeza + html;
    var i = html.toLowerCase().lastIndexOf('</body>');
    html = i >= 0 ? html.slice(0, i) + registro + html.slice(i) : html + registro;
    var manifest = JSON.stringify({
      name: nombre, short_name: nombre.slice(0, 12), start_url: '.', scope: '.', display: 'standalone',
      background_color: '#ffffff', theme_color: '#B8791E',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    }, null, 2);
    var sw = "var C='app-v1';\nself.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','index.html','icon.svg'])}));self.skipWaiting()});\n" +
      "self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});\n" +
      "self.addEventListener('fetch',function(e){e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request).catch(function(){return caches.match('index.html')})}))});\n";
    var icono = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#B8791E"/><text x="256" y="340" font-size="260" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">' +
      (nombre.trim().charAt(0).toUpperCase().replace(/[<>&"]/g, '') || 'P') + '</text></svg>';
    var leeme = 'APP INSTALABLE - ' + nombre + '\n\n' +
      'Contenido: index.html (tu app), manifest.json, sw.js e icon.svg.\n\n' +
      'Para instalarla en el celular:\n' +
      '1. Sube estos 4 archivos a un hosting con https (Vercel, Netlify o GitHub Pages).\n' +
      '2. Abre el enlace en Chrome.\n' +
      '3. Toca el menú de Chrome > "Instalar app" o "Añadir a la pantalla de inicio".\n\n' +
      'Creada con Pimath Code.\n';
    var zip = crearZip([
      { name: 'index.html', data: html }, { name: 'manifest.json', data: manifest },
      { name: 'sw.js', data: sw }, { name: 'icon.svg', data: icono }, { name: 'LEEME.txt', data: leeme }
    ]);
    bajar(zip, slug(nombre) + '-app.zip');
    setEstado('Descargando la app instalable ✓ Dentro del .zip está LEEME.txt con los pasos para instalarla.');
  }

  window.__pimathAbrirCodigo = abrir;

  // ---------- Opción "Pimath Code" en el menú lateral ----------
  var ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/><path d="M14 4l-4 16"/></svg>';
  function alAbrirDesdeMenu() {
    try { if (typeof closeSidebar === 'function') closeSidebar(); } catch (e) {}
    setTimeout(abrir, 180);
  }
  function agregarAlMenu() {
    if ($('pcMenuItem')) return true;
    var nav = $('pxMenuLat');
    if (!nav) return false;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'pcMenuItem';
    b.className = 'pxm-item';
    b.innerHTML = ICONO + '<span>Pimath Code</span>';
    b.addEventListener('click', alAbrirDesdeMenu);
    nav.insertBefore(b, nav.firstChild);
    return true;
  }
  function agregarRespaldo() {
    var sb = $('sidebar'), nuevoBtn = $('sidebarNewChat');
    if (!sb || !nuevoBtn || $('pcMenuItem')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'pcMenuItem';
    b.textContent = '💻 Pimath Code';
    b.style.cssText = 'width:100%;padding:12px 8px;border:none;background:none;text-align:left;font:inherit;font-size:1.05rem;cursor:pointer;color:#1C2620;';
    b.addEventListener('click', alAbrirDesdeMenu);
    sb.insertBefore(b, nuevoBtn);
  }

  function iniciar() {
    var n = 0;
    (function esperar() {
      if (agregarAlMenu()) return;
      if (++n < 60) setTimeout(esperar, 250);
      else agregarRespaldo();
    })();
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();
