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

// ===== Carga del panel Premium (va en un archivo aparte para que cada archivo sea liviano) =====
(function () {
  ['/premium-ui.js', '/portada.js', '/pimath-code.js', '/pimath-videos.js'].forEach(function (src) {
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    (document.head || document.documentElement).appendChild(s);
  });
})();
// FIN scroll-fix.js
