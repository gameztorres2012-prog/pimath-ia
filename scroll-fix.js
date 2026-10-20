// Pimath IA: al llegar la respuesta, mostrarla desde su inicio (como Gemini)
(function () {
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
        }
      });
    });
    obs.observe(chat, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
      subtree: true
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
