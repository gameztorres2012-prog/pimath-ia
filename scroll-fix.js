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
      
