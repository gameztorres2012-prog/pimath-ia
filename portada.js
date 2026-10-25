// Pimath IA - Pantalla de bienvenida: ícono + frase en el centro (como Claude / Gemini)
// y un fondo opcional que puede cambiar por fechas (como los Doodles de Google).
// Todo se configura en portada.json (sin tocar este archivo).
(function () {
  var DEFECTO = { frase: '{saludo}, {nombre}', subfrase: '', icono: '/icon-192.png', fondo: '', eventos: [] };
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
    var r = { frase: c.frase, subfrase: c.subfrase, icono: c.icono, fondo: c.fondo };
    (c.eventos || []).some(function (ev) {
      if (!ev || !enRango(hoy, ev.desde, ev.hasta)) return false;
      if (ev.frase) r.frase = ev.frase;
      if (typeof ev.subfrase === 'string') r.subfrase = ev.subfrase;
      if (ev.icono) r.icono = ev.icono;
      if (ev.fondo) r.fondo = ev.fondo;
      return true;
    });
    return r;
  }

  // Buenos días (5:00-11:59), Buenas tardes (12:00-18:59), Buenas noches (19:00-4:59)
  function saludoDe(fecha) {
    var h = fecha.getHours();
    return h >= 5 && h < 12 ? 'Buenos días' : (h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches');
  }

  function nombreDe(texto) {
    var m = String(texto || '').match(/Hola,\s*([^\s!.,\u{1F44B}]+)/u);
    return m ? m[1] : '';
  }

  function estilos() {
    var s = document.createElement('style');
    s.textContent =
      '#chat.pm-portada > .msg{display:none !important;}' +
      '#pmPortada{margin:auto;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;padding:24px;max-width:560px;animation:pmFade .5s ease;}' +
      '#pmPortada img{width:64px;height:64px;object-fit:contain;mix-blend-mode:multiply;background:none;border:0;box-shadow:none;}' +
      '#pmPortada p{margin:0;font-family:var(--font-body,system-ui,sans-serif);font-size:1rem;color:#5E6B62;}' +
      '#pmPortada h1{margin:0;font-family:var(--font-display,Georgia,serif);font-weight:500;font-size:1.75rem;line-height:1.25;color:#1C2620;}' +
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
    var ahora = new Date();
    function llenar(t) { return String(t).replace(/\{saludo\}/g, saludoDe(ahora)).replace(/\{nombre\}/g, nombre); }
    var frase = llenar(v.frase || DEFECTO.frase);
    var sub = llenar(typeof v.subfrase === 'string' ? v.subfrase : DEFECTO.subfrase);

    chat.classList.add('pm-portada');
    if (fondo) { chat.classList.add('pm-fondo'); chat.style.setProperty('--pm-fondo', 'url("' + fondo + '")'); }
    else { chat.classList.remove('pm-fondo'); chat.style.removeProperty('--pm-fondo'); }

    if (!hero) {
      hero = document.createElement('div');
      hero.id = 'pmPortada';
      var img = document.createElement('img');
      img.alt = 'Pimath IA';
      var h = document.createElement('h1');
      var sp = document.createElement('p');
      hero.appendChild(img);
      hero.appendChild(h);
      hero.appendChild(sp);
      chat.insertBefore(hero, chat.firstChild);
    }
    var im = hero.querySelector('img');
    var t = hero.querySelector('h1');
    if (im && im.getAttribute('src') !== icono) im.setAttribute('src', icono);
    if (t && t.textContent !== frase) t.textContent = frase;
    var sb = hero.querySelector('p');
    if (sb) { sb.textContent = sub; sb.style.display = sub ? '' : 'none'; }
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
            subfrase: typeof j.subfrase === 'string' ? j.subfrase : DEFECTO.subfrase,
            icono: j.icono || DEFECTO.icono,
            fondo: j.fondo || '',
            eventos: Array.isArray(j.eventos) ? j.eventos : []
          };
          aplicar();
        }
      })
      .catch(function () {});
  }

  window.__pimathPortada = { saludoDe: saludoDe, elegir: elegir, enRango: enRango, nombreDe: nombreDe, urlSegura: urlSegura }; // pruebas

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
// FIN portada.js
