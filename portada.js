// Pimath IA - Pantalla de bienvenida: ícono + frase en el centro (como Claude / Gemini)
// y un fondo opcional que puede cambiar por fechas (como los Doodles de Google).
// Todo se configura en portada.json (sin tocar este archivo).
(function () {
  var DEFECTO = { frase: '¿Qué vamos a resolver hoy?', icono: '/icon-192.png', fondo: '', eventos: [] };
  var cfg = DEFECTO;

  function urlSegura(u) {
    return typeof u === 'string' && /^(\/|https:\/\/)[^"'()\s\\]+$/.test(u) ? u : '';
  }

  function dosDigitos(n) { return (n < 10 ? '0' : '') + n; }

  // ¿La fecha "MM-DD" cae dentro del rango? (admite rangos que cruzan el fin de año)
  function enRango(hoy, desde, hasta) {
    if (!/^\d\d-\d\d$/.test(desde || '') || !/^\d\d-\d\d$/.test(hasta || '')) return false;
    return desde <= hasta ? (hoy >= desde && hoy <= hasta) : (hoy >= desde || hoy <= hasta);
  }

  function elegir(c, fecha) {
    var hoy = dosDigitos(fecha.getMonth() + 1) + '-' + dosDigitos(fecha.getDate());
    var r = { frase: c.frase, icono: c.icono, fondo: c.fondo };
    (c.eventos || []).some(function (ev) {
      if (!ev || !enRango(hoy, ev.desde, ev.hasta)) return false;
      if (ev.frase) r.frase = ev.frase;
      if (ev.icono) r.icono = ev.icono;
      if (ev.fondo) r.fondo = ev.fondo;
      return true;
    });
    return r;
  }

  function nombreDe(texto) {
    var m = String(texto || '').match(/Hola,\s*([^\s!.,\u{1F44B}]+)/u);
    return m ? m[1] : '';
  }

  function estilos() {
    var s = document.createElement('style');
    s.textContent =
      '#chat.pm-portada > .msg{display:none !important;}' +
      '#pmPortada{margin:auto;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding:24px;max-width:560px;animation:pmFade .5s ease;}' +
      '#pmPortada img{width:88px;height:88px;border-radius:22px;object-fit:cover;box-shadow:0 6px 22px rgba(0,0,0,.12);}' +
      '#pmPortada h1{margin:0;font-family:var(--font-display,Georgia,serif);font-weight:500;font-size:2rem;line-height:1.2;color:#1C2620;}' +
      '#chat.pm-portada.pm-fondo{background-image:linear-gradient(rgba(250,250,247,.6),rgba(250,250,247,.6)),var(--pm-fondo);background-size:cover;background-position:center;}' +
      '@keyframes pmFade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}';
    (document.head || document.documentElement).appendChild(s);
  }

  var ultimo = null; // lo que se está mostrando ahora

  function aplicar() {
    var chat = document.getElementById('chat');
    if (!chat) return;
    var hay = !!chat.querySelector('.msg.user');
    var hero = document.getElementById('pmPortada');

    if (hay) {
      chat.classList.remove('pm-portada', 'pm-fondo');
      chat.style.removeProperty('--pm-fondo');
      if (hero && hero.parentNode) hero.parentNode.removeChild(hero);
      return;
    }

    var v = elegir(cfg, new Date());
    var icono = urlSegura(v.icono) || DEFECTO.icono;
    var fondo = urlSegura(v.fondo);
    var bot = chat.querySelector('.msg.bot');
    var nombre = nombreDe(bot && bot.textContent) || 'estudiante';
    var frase = String(v.frase || DEFECTO.frase).replace(/\{nombre\}/g, nombre);

    chat.classList.add('pm-portada');
    if (fondo) { chat.classList.add('pm-fondo'); chat.style.setProperty('--pm-fondo', 'url("' + fondo + '")'); }
    else { chat.classList.remove('pm-fondo'); chat.style.removeProperty('--pm-fondo'); }

    if (!hero) {
      hero = document.createElement('div');
      hero.id = 'pmPortada';
      var img = document.createElement('img');
      img.alt = 'Pimath IA';
      var h = document.createElement('h1');
      hero.appendChild(img);
      hero.appendChild(h);
      chat.insertBefore(hero, chat.firstChild);
    }
    var im = hero.querySelector('img');
    var t = hero.querySelector('h1');
    if (im && im.getAttribute('src') !== icono) im.setAttribute('src', icono);
    if (t && t.textContent !== frase) t.textContent = frase;
    ultimo = frase;
  }

  function iniciar() {
    var chat = document.getElementById('chat');
    if (!chat) return;
    estilos();
    new MutationObserver(aplicar).observe(chat, { childList: true });
    aplicar();
    fetch('/portada.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && typeof j === 'object') {
          cfg = {
            frase: typeof j.frase === 'string' && j.frase ? j.frase : DEFECTO.frase,
            icono: j.icono || DEFECTO.icono,
            fondo: j.fondo || '',
            eventos: Array.isArray(j.eventos) ? j.eventos : []
          };
          aplicar();
        }
      })
      .catch(function () {});
  }

  window.__pimathPortada = { elegir: elegir, enRango: enRango, nombreDe: nombreDe, urlSegura: urlSegura }; // pruebas

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
// FIN portada.js
