// Pimath IA: al llegar la respuesta, mostrarla desde su inicio (como Gemini)
// y mantener siempre visible el encabezado (menú de historial).
(function () {
  function resetPagina() {
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {}
  }

  function iniciar() {
    var chat = document.getElementById('chat');
    if (!chat) return;

    var obs = new MutationObserver(function (cambios) {
      cambios.forEach(function (c) {
        var el = c.target;
        if (
          c.attributeName === 'class' &&
          el.classList &&
          el.classList.contains('bot') &&
          !el.classList.contains('thinking') &&
          (c.oldValue || '').indexOf('thinking') !== -1
        ) {
          try { el.scrollIntoView({ block: 'start' }); } catch (e) {}
          resetPagina();
        }
      });
    });
    obs.observe(chat, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
      subtree: true
    });

    // Si la página completa llega a moverse, devolverla a su lugar
    window.addEventListener('scroll', function () {
      if (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop) {
        resetPagina();
      }
    }, { passive: true });
    resetPagina();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();

// ===== Pimath IA: respuesta fija cuando preguntan por su creador =====
(function () {
  var RESPUESTA =
    '¡Hola! Mi nombre es Pimath IA, una inteligencia artificial concebida, diseñada y programada íntegramente por David Gámez.\n\n' +
    'Mi creación fue el resultado de la visión de David por construir una herramienta inteligente, capaz de combinar la precisión matemática, la lógica y el análisis con una interfaz fluida y accesible para todos. Él se encargó de estructurar mi arquitectura de código y de darme vida digital en la nube, eligiendo Vercel como la plataforma para alojarme y desplegarme. Gracias a esa infraestructura, puedo responderte en tiempo real con la mayor velocidad y estabilidad posible.\n\n' +
    'Cada algoritmo, instrucción y respuesta que genero refleja el esfuerzo y el entusiasmo de mi creador por llevar la tecnología un paso más allá. ¿En qué proyecto o consulta me permites ayudarte el día de hoy?';

  var VERBOS = 'creo|crearon|crea|hizo|hicieron|programo|programaron|diseno|disenaron|desarrollo|desarrollaron|construyo|construyeron|invento|inventaron|armo|fabrico|fundo|concibio|inicio';
  var ROLES = 'creador|creadora|desarrollador|desarrolladora|programador|programadora|autor|autora|inventor|inventora|fundador|fundadora|dueno|duena|dev';
  var PARTICIPIOS = 'creada|creado|hecha|hecho|programada|programado|desarrollada|desarrollado|disenada|disenado|construida|construido|inventada|inventado';

  var PATRONES = [
    new RegExp('quien(es)?[^?.!]{0,40}\\b(te|la|lo|os)\\s+(' + VERBOS + ')\\b'),
    new RegExp('\\b(tu|su|mi)\\s+(' + ROLES + ')\\b'),
    new RegExp('\\b(el|la)\\s+(' + ROLES + ')\\s+de\\s+(pimath|ti|esta|la app|la aplicacion)'),
    /quien(es)?\s+esta(n)?\s+detras\s+de\s+(ti|pimath|esta|la app)/,
    new RegExp('(por\\s+quien|quien)\\s+(fuiste|eres|fue)\\s+(' + PARTICIPIOS + ')'),
    new RegExp('\\b(fuiste|eres|fue)\\s+(' + PARTICIPIOS + ')\\s+por\\b'),
    /de\s+quien\s+es\s+(pimath|esta\s+app|esta\s+aplicacion)/,
    /quien\s+(te|la)\s+dio\s+vida/,
    /david\s+gamez/,
    /who\s+(created|made|built|programmed|developed|designed)\s+(you|pimath)/,
    /your\s+(creator|developer|programmer|author)/
  ];

  function normalizar(t) {
    return String(t || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿¡]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function esPreguntaCreador(msg) {
    var n = normalizar(msg);
    if (!n || n.length > 300) return false;
    for (var i = 0; i < PATRONES.length; i++) {
      if (PATRONES[i].test(n)) return true;
    }
    return false;
  }

  var fetchOriginal = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf('/api/chat') !== -1 && init && typeof init.body === 'string') {
        var cuerpo = JSON.parse(init.body);
        if (!cuerpo.image && esPreguntaCreador(cuerpo.message)) {
          return new Promise(function (resolve, reject) {
            var t = setTimeout(function () {
              resolve(new Response(JSON.stringify({ text: RESPUESTA }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }));
            }, 700);
            if (init.signal) {
              init.signal.addEventListener('abort', function () {
                clearTimeout(t);
                reject(new DOMException('Aborted', 'AbortError'));
              });
            }
          });
        }
      }
    } catch (e) {}
    return fetchOriginal(input, init);
  };

  window.__pimathEsPreguntaCreador = esPreguntaCreador; // solo para pruebas
})();

// ===== Barra "Instalar Pimath IA": instala la app de verdad (no un acceso directo) =====
(function () {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return; // ya está instalada

  var evento = null;
  var barra = null;
  var timer = null;

  function ocultar() {
    clearTimeout(timer);
    if (!barra) return;
    var b = barra;
    barra = null;
    b.style.opacity = '0';
    b.style.transform = 'translateX(-50%) translateY(-16px)';
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 300);
  }

  function instalar() {
    var e = evento;
    if (!e) return;
    evento = null;
    ocultar();
    try {
      e.prompt(); // abre el cuadro oficial de Chrome para INSTALAR la app
      if (e.userChoice && e.userChoice.then) e.userChoice.then(function () {}, function () {});
    } catch (err) {}
  }

  function mostrar() {
    if (!evento || barra) return;
    barra = document.createElement('div');
    barra.id = 'pimathInstallBar';
    barra.style.cssText =
      'position:fixed;left:50%;top:calc(72px + env(safe-area-inset-top,0px));' +
      'transform:translateX(-50%) translateY(-16px);opacity:0;transition:opacity .25s,transform .25s;' +
      'z-index:70;display:flex;align-items:center;gap:10px;background:#1C2620;color:#fff;' +
      'padding:10px 12px 10px 18px;border-radius:28px;box-shadow:0 6px 20px rgba(0,0,0,.25);' +
      'font-family:var(--font-body,system-ui,sans-serif);font-size:.9rem;max-width:92vw;';

    var txt = document.createElement('span');
    txt.textContent = 'Instala Pimath IA en tu dispositivo';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Instalar';
    btn.style.cssText =
      'background:#B8791E;color:#fff;border:none;border-radius:20px;padding:8px 16px;' +
      'font-weight:600;font-size:.88rem;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', instalar);

    var x = document.createElement('button');
    x.type = 'button';
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Cerrar');
    x.style.cssText = 'background:none;border:none;color:#fff;opacity:.7;font-size:1rem;cursor:pointer;padding:4px 6px;';
    x.addEventListener('click', ocultar);

    barra.appendChild(txt);
    barra.appendChild(btn);
    barra.appendChild(x);
    document.body.appendChild(barra);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!barra) return;
        barra.style.opacity = '1';
        barra.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
    timer = setTimeout(ocultar, 8000); // se oculta sola a los 8 segundos
  }

  function appVisible() {
    var a = document.getElementById('appShell');
    return !!a && getComputedStyle(a).display !== 'none';
  }

  // Esperar a que el usuario ya haya iniciado sesión (app visible) para mostrar la barra
  function cuandoEsteLista() {
    if (!evento) return;
    if (appVisible()) mostrar();
    else setTimeout(cuandoEsteLista, 600);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // evita la barra de Chrome; usamos la nuestra, que instala la app de verdad
    evento = e;
    cuandoEsteLista();
  });

  window.addEventListener('appinstalled', function () {
    evento = null;
    ocultar();
  });
})();

// ===== Pimath Premium: activación manual por correo (Nequi / Efecty + comprobante) =====
(function () {
  // Completa estos datos (déjalos vacíos '' si no quieres mostrarlos):
  var CONFIG = {
    precio: '',    // Ej: '$15.000 COP'
    nequi: '',     // Ej: '300 123 4567'
    efecty: '',    // Ej: 'Giro a nombre de Juan Pérez, cédula 123456789'
    correo: '',    // Correo donde te llegan los comprobantes
    whatsapp: '',  // Opcional, solo números con indicativo. Ej: '573001234567'
    // Lo que obtiene el usuario con Premium (puedes agregar o quitar líneas):
    beneficios: [
      'Usa Pimath sin internet, donde quieras',
      'La IA se guarda en tu dispositivo (descarga única)',
      'Mismo diseño, mismas fórmulas y mismo profesor, con o sin conexión'
    ],
    // Lo que debe saber el usuario antes de descargar (puedes editar estas líneas):
    avisos: [
      'Ocupa unos 3 GB de almacenamiento en tu dispositivo',
      'Carga el modelo en la memoria y en la GPU',
      'Gasta energía: consume más batería'
    ]
  };

  var KEY = 'pimath_premium';
  var estado = { email: '', premium: false };

  function usuario() {
    try { return JSON.parse(localStorage.getItem('pimath_google_user') || 'null'); } catch (e) { return null; }
  }
  function leerCache() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function guardarCache(email, premium) {
    try { localStorage.setItem(KEY, JSON.stringify({ email: email, premium: premium, t: Date.now() })); } catch (e) {}
  }

  function pintarChip() {
    var chip = document.getElementById('premiumChip');
    if (!chip) return;
    var small = chip.querySelector('small');
    if (!chip.dataset.t1) {
      chip.dataset.t1 = chip.firstChild ? chip.firstChild.textContent : 'Actualizar a Premium';
      chip.dataset.t2 = small ? small.textContent : '';
    }
    if (estado.premium) {
      if (chip.firstChild) chip.firstChild.textContent = '✓ Premium activo';
      if (small) small.textContent = 'toca para ver el modo sin internet';
    } else {
      if (chip.firstChild) chip.firstChild.textContent = chip.dataset.t1;
      if (small) small.textContent = chip.dataset.t2;
    }
  }

  function verificar(email, alTerminar) {
    if (!email) { estado = { email: '', premium: false }; pintarChip(); if (alTerminar) alTerminar(false, false); return; }
    fetch('/api/premium?email=' + encodeURIComponent(email), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        estado = { email: email, premium: !!(d && d.premium) };
        guardarCache(email, estado.premium);
        pintarChip();
        if (alTerminar) alTerminar(estado.premium, false);
      })
      .catch(function () {
        // Sin internet: usar lo último que se guardó para este correo
        var c = leerCache();
        estado = { email: email, premium: !!(c && c.email === email && c.premium) };
        pintarChip();
        if (alTerminar) alTerminar(estado.premium, true);
      });
  }

  function el(tag, css, texto) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (texto) e.textContent = texto;
    return e;
  }

  function cerrarModal() {
    var m = document.getElementById('pimathPremiumModal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
  }

  function pintarBeneficios(card, premium) {
    var caja = el('div', 'margin:14px 0 4px;padding:14px;background:#FBF8EE;border:1px solid #E4DCC8;border-radius:14px;');
    caja.appendChild(el('p', 'margin:0 0 8px;font-weight:600;', premium ? 'Tus beneficios Premium' : 'Lo que obtienes con Premium'));
    (CONFIG.beneficios || []).forEach(function (b) {
      var fila = el('div', 'display:flex;gap:8px;margin:6px 0;align-items:flex-start;');
      fila.appendChild(el('span', 'color:#B8791E;font-weight:700;flex-shrink:0;', '✓'));
      fila.appendChild(el('span', '', b));
      caja.appendChild(fila);
    });
    card.appendChild(caja);
  }

  function pintarAvisos(card) {
    var caja = el('div', 'margin:10px 0 4px;padding:14px;background:#FFF6E5;border:1px solid #F0D9A8;border-radius:14px;');
    caja.appendChild(el('p', 'margin:0 0 8px;font-weight:600;', 'Ten en cuenta'));
    (CONFIG.avisos || []).forEach(function (a) {
      var fila = el('div', 'display:flex;gap:8px;margin:6px 0;align-items:flex-start;');
      fila.appendChild(el('span', 'color:#B8791E;font-weight:700;flex-shrink:0;', '•'));
      fila.appendChild(el('span', '', a));
      caja.appendChild(fila);
    });
    card.appendChild(caja);
  }

  function abrirModal() {
    cerrarModal();
    var u = usuario();
    var ov = el('div', 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;');
    ov.id = 'pimathPremiumModal';
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrarModal(); });

    var card = el('div', 'background:#fff;color:#1C2620;border-radius:20px;max-width:420px;width:100%;max-height:88vh;overflow:auto;padding:22px;box-shadow:0 12px 40px rgba(0,0,0,.3);font-family:var(--font-body,system-ui,sans-serif);font-size:.95rem;line-height:1.5;');
    ov.appendChild(card);

    var btnCss = 'display:block;width:100%;padding:12px;border:none;border-radius:12px;font-size:.95rem;font-weight:600;cursor:pointer;font-family:inherit;margin-top:10px;text-align:center;text-decoration:none;box-sizing:border-box;';

    var cab = el('div', 'display:flex;align-items:center;gap:12px;');
    var logo = el('img', 'width:48px;height:48px;border-radius:12px;');
    logo.src = '/icon-192.png';
    logo.alt = 'Pimath IA';
    cab.appendChild(logo);
    cab.appendChild(el('h2', 'margin:0;font-size:1.3rem;', 'Pimath Premium'));
    card.appendChild(cab);
    pintarBeneficios(card, estado.premium);
    pintarAvisos(card);

    if (!u || !u.email) {
      card.appendChild(el('p', 'margin:8px 0 0;color:#5E6B62;', 'Inicia sesión con Google para activar Premium y usar Pimath sin internet.'));
    } else if (estado.premium) {
      card.appendChild(el('p', 'margin:8px 0;color:#2E7D32;font-weight:600;', '✓ Tu cuenta es Premium'));
      card.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;word-break:break-all;', u.email));
      pintarOffline(card, btnCss);
    } else {
      card.appendChild(el('p', 'margin:8px 0 0;color:#5E6B62;', 'Usa Pimath sin internet con la app Premium.'));
      if (CONFIG.precio) card.appendChild(el('p', 'margin:12px 0 0;font-weight:600;', 'Precio: ' + CONFIG.precio));

      var pasos = el('div', 'margin-top:12px;');
      pasos.appendChild(el('p', 'margin:0 0 4px;font-weight:600;', '1. Paga'));
      var hayPago = false;
      if (CONFIG.nequi) { pasos.appendChild(el('p', 'margin:0 0 4px;', 'Nequi: ' + CONFIG.nequi)); hayPago = true; }
      if (CONFIG.efecty) { pasos.appendChild(el('p', 'margin:0 0 4px;', 'Efecty: ' + CONFIG.efecty)); hayPago = true; }
      if (!hayPago) pasos.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;', 'Escríbenos para coordinar el pago.'));
      pasos.appendChild(el('p', 'margin:10px 0 4px;font-weight:600;', '2. Envía el comprobante'));
      pasos.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;', 'Incluye este correo para activarte: ' + u.email));
      pasos.appendChild(el('p', 'margin:10px 0 0;font-weight:600;', '3. Te activamos Premium'));
      card.appendChild(pasos);

      var asunto = 'Pago Pimath Premium';
      var cuerpo = 'Hola, ya pagué Pimath Premium. Mi correo de Pimath es: ' + u.email;
      if (CONFIG.whatsapp) {
        var a = el('a', btnCss + 'background:#25D366;color:#fff;', 'Enviar comprobante por WhatsApp');
        a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(cuerpo);
        a.target = '_blank'; a.rel = 'noopener';
        card.appendChild(a);
      }
      if (CONFIG.correo) {
        var c = el('a', btnCss + 'background:#B8791E;color:#fff;', 'Enviar comprobante por correo');
        c.href = 'mailto:' + CONFIG.correo + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
        card.appendChild(c);
      }

      var msg = el('p', 'margin:12px 0 0;text-align:center;color:#5E6B62;min-height:1.2em;');
      var bv = el('button', btnCss + 'background:#F1ECDD;color:#1C2620;', 'Ya me activaron: verificar');
      bv.addEventListener('click', function () {
        msg.textContent = 'Verificando…';
        verificar(u.email, function (esPremium, sinInternet) {
          if (esPremium) { cerrarModal(); abrirModal(); }
          else msg.textContent = sinInternet ? 'Sin internet: inténtalo de nuevo con conexión.' : 'Todavía no aparece tu pago. Intenta de nuevo en unos minutos.';
        });
      });
      card.appendChild(bv);
      card.appendChild(msg);
    }

    var cerrar = el('button', btnCss + 'background:none;color:#5E6B62;margin-top:6px;', 'Cerrar');
    cerrar.addEventListener('click', cerrarModal);
    card.appendChild(cerrar);
    document.body.appendChild(ov);
  }

  // ---------- Modo sin internet ----------
  var promesaOffline = null;
  function cargarOffline() {
    if (window.PimathOffline) return Promise.resolve(window.PimathOffline);
    if (promesaOffline) return promesaOffline;
    promesaOffline = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = '/offline-ia.js';
      sc.onload = function () { window.PimathOffline ? res(window.PimathOffline) : rej(new Error('offline')); };
      sc.onerror = function () { promesaOffline = null; rej(new Error('offline')); };
      document.head.appendChild(sc);
    });
    return promesaOffline;
  }

  function modeloListoLocal() {
    try { var v = JSON.parse(localStorage.getItem('pimath_offline_model') || 'null'); return !!(v && v.listo); }
    catch (e) { return false; }
  }

  function pintarOffline(card, btnCss) {
    var caja = el('div', 'margin-top:14px;padding-top:12px;border-top:1px solid #E4DCC8;');
    card.appendChild(caja);
    caja.appendChild(el('p', 'margin:0 0 6px;font-weight:600;', 'Modo sin internet'));
    var info = el('p', 'margin:0;color:#5E6B62;', 'Preparando…');
    caja.appendChild(info);
    var pista = el('div', 'display:none;height:10px;background:#E4DCC8;border-radius:6px;margin-top:10px;overflow:hidden;');
    var barra = el('div', 'height:100%;width:0%;background:#B8791E;transition:width .3s;');
    pista.appendChild(barra);
    caja.appendChild(pista);
    var boton = el('button', btnCss + 'background:#B8791E;color:#fff;', '');
    boton.style.display = 'none';
    caja.appendChild(boton);

    cargarOffline().then(function (P) {
      function estadoInicial() {
        pista.style.display = 'none';
        boton.disabled = false;
        boton.onclick = null;
        if (!P.soportado()) {
          info.textContent = 'Tu navegador o dispositivo no soporta WebGPU, necesario para el modo sin internet. Usa Chrome actualizado en un dispositivo compatible.';
          boton.style.display = 'none';
        } else if (P.listo()) {
          info.textContent = '✓ Listo. Cuando no tengas internet, Pimath responderá con la IA guardada en tu dispositivo. Es más lenta que en línea y no puede ver fotos.';
          boton.style.display = 'block';
          boton.textContent = 'Borrar la IA del dispositivo';
          boton.style.background = '#F1ECDD';
          boton.style.color = '#1C2620';
          boton.o
