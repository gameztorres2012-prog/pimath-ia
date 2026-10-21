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
