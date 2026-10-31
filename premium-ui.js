// ===== Pimath Premium: activación manual por correo (Nequi / Efecty + comprobante) =====
(function () {
  // Completa estos datos (déjalos vacíos '' si no quieres mostrarlos):
  var CONFIG = {
    precio: '$5.000 COP',   // Precio que se ve en grande
    precioAntes: '',        // Precio tachado (opcional). Ej: '$9.900 COP'
    periodo: 'pago único',  // Ej: 'al mes' si fuera mensual
    etiqueta: 'IA guardada en tu dispositivo',
    metodos: ['Nequi', 'PayPal', 'Efecty'],  // Formas de pago que se muestran
    nequi: '',     // Cuando quieras, escribe aquí tu número. Ej: '300 123 4567'
    paypal: '',    // Cuando quieras, escribe aquí tu usuario o correo de PayPal
    efecty: '',    // Cuando quieras, escribe aquí los datos del giro
    correo: 'pimathia.com@gmail.com',  // Correo donde te llegan los comprobantes
    whatsapp: '',  // Opcional, solo números con indicativo. Ej: '573001234567'
    // Lo que incluye Premium (i = ícono, t = título, d = descripción):
    beneficios: [
      { i: 'offline', t: 'Pimath sin internet', d: 'Usa Pimath donde quieras, aunque no tengas conexión.' },
      { i: 'device', t: 'IA guardada en tu dispositivo', d: 'Descarga única. La IA queda en tu tablet o celular.' },
      { i: 'check', t: 'Mismo diseño, mismo profesor', d: 'Las mismas fórmulas y explicaciones, con o sin conexión.' }
    ],
    // Lo que debe saber el usuario antes de descargar:
    avisos: [
      { i: 'storage', t: 'Almacenamiento', d: 'Ocupa unos 1.3 GB en tu dispositivo.' },
      { i: 'chip', t: 'Memoria y GPU', d: 'Carga el modelo en la memoria y en la GPU.' },
      { i: 'battery', t: 'Batería', d: 'Gasta más energía mientras responde.' }
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
      if (chip.firstChild) chip.firstChild.textContent = 'Premium activo';
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

  // El panel Premium (pantalla con plan, beneficios y pasos de pago) está en premium-panel.js
  var promesaPanel = null;
  function abrirPanel() {
    if (window.__pmPremium && window.__pmPremium.abrir) { window.__pmPremium.abrir(); return; }
    if (!promesaPanel) {
      promesaPanel = new Promise(function (res, rej) {
        var sc = document.createElement('script');
        sc.src = '/premium-panel.js';
        sc.onload = res;
        sc.onerror = function () { promesaPanel = null; rej(new Error('panel')); };
        document.head.appendChild(sc);
      });
    }
    promesaPanel.then(function () { window.__pmPremium.abrir(); },
      function () { window.alert('No se pudo abrir Premium. Revisa tu internet e inténtalo de nuevo.'); });
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
          info.textContent = 'Listo. Cuando no tengas internet, Pimath responderá con la IA guardada en tu dispositivo. Es más lenta que en línea y no puede ver fotos.';
          boton.style.display = 'block';
          boton.textContent = 'Borrar la IA del dispositivo';
          boton.style.background = '#F1ECDD';
          boton.style.color = '#1C2620';
          boton.onclick = function () {
            if (!window.confirm('¿Borrar la IA guardada? Tendrás que descargarla otra vez para usarla sin internet.')) return;
            P.borrar().then(estadoInicial);
          };
        } else {
          info.textContent = 'Descarga única de unos 1.3 GB. Usa WiFi, ten espacio libre y no cierres la app mientras descarga.';
          boton.style.display = 'block';
          boton.textContent = 'Descargar modo sin internet';
          boton.style.background = '#B8791E';
          boton.style.color = '#fff';
          boton.onclick = descargar;
        }
      }
      function descargar() {
        function seguir() {
          boton.disabled = true;
          pista.style.display = 'block';
          barra.style.width = '2%';
          info.textContent = 'Descargando… 0%. No cierres la app.';
          P.descargar(function (pct) {
            barra.style.width = pct.toFixed(0) + '%';
            info.textContent = 'Descargando… ' + pct.toFixed(0) + '%. No cierres la app.';
          }).then(function () {
            estadoInicial();
          }).catch(function (e) {
            pista.style.display = 'none';
            boton.disabled = false;
            var m = String((e && e.message) || e);
            info.textContent = m === 'sin_webgpu'
              ? 'Tu dispositivo no soporta WebGPU.'
              : 'No se pudo descargar. Revisa tu internet y el espacio libre, e inténtalo de nuevo. (' + m.slice(0, 120) + ')';
          });
        }
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(function (est) {
            var libre = (est && est.quota && est.usage != null) ? est.quota - est.usage : null;
            if (libre !== null && libre < 2.2e9) {
              if (!window.confirm('Parece que no hay suficiente espacio libre (hacen falta unos 2 GB). ¿Intentar de todos modos?')) return;
            }
            seguir();
          }, seguir);
        } else { seguir(); }
      }
      estadoInicial();
    }, function () {
      info.textContent = 'No se pudo cargar el modo sin internet. Revisa tu conexión e inténtalo de nuevo.';
    });
  }

  function jsonResp(obj, status) {
    return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  }

  function conAbort(promesa, signal) {
    if (!signal) return promesa;
    return new Promise(function (res, rej) {
      if (signal.aborted) return rej(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', function () { rej(new DOMException('Aborted', 'AbortError')); });
      promesa.then(res, rej);
    });
  }

  function respuestaLocal(cuerpo, init) {
    if (cuerpo.image) {
      return Promise.resolve(jsonResp({ text: 'Sin internet no puedo ver fotos. Escribe el ejercicio con texto, o conéctate a internet para usar la foto.' }));
    }
    var trabajo = cargarOffline().then(function (P) {
      var sistema = P.sistema +
        (cuerpo.studentName ? ' El estudiante se llama ' + cuerpo.studentName + '.' : '') +
        (cuerpo.area ? ' El tema actual es: ' + cuerpo.area + '.' : '');
      var msgs = [{ role: 'system', content: sistema }];
      (cuerpo.history || []).filter(function (t) { return t && t.text; }).slice(-6).forEach(function (t) {
        msgs.push({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text });
      });
      msgs.push({ role: 'user', content: cuerpo.message || '' });
      return P.responder(msgs, 700);
    }).then(function (texto) {
      return jsonResp({ text: texto || 'No pude generar una respuesta. Intenta de nuevo.' });
    }).catch(function () {
      return jsonResp({ error: 'local_failed' }, 500);
    });
    return conAbort(trabajo, init && init.signal);
  }

  function puedeUsarLocal() { return estado.premium && modeloListoLocal(); }

  var fetchPrevio = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('/api/chat') === -1 || !init || typeof init.body !== 'string') return fetchPrevio(input, init);
    var cuerpo;
    try { cuerpo = JSON.parse(init.body); } catch (e) { return fetchPrevio(input, init); }
    // La respuesta fija del creador sigue su camino normal
    if (window.__pimathEsPreguntaCreador && window.__pimathEsPreguntaCreador(cuerpo.message)) return fetchPrevio(input, init);
    if (navigator.onLine === false && puedeUsarLocal()) return respuestaLocal(cuerpo, init);
    return fetchPrevio(input, init).catch(function (err) {
      if (err && err.name === 'AbortError') throw err;
      if (puedeUsarLocal()) return respuestaLocal(cuerpo, init);
      throw err;
    });
  };

  function iniciar() {
    var chip = document.getElementById('premiumChip');
    if (chip) {
      pintarChip();
      // En fase de captura para reemplazar el aviso "Premium está en desarrollo"
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        abrirPanel();
      }, true);
    }
    var u = usuario();
    if (u && u.email) {
      var c = leerCache();
      if (c && c.email === u.email.toLowerCase().trim() || (c && c.email === u.email)) estado = { email: u.email, premium: !!c.premium };
      pintarChip();
      verificar(u.email);
    }
    // Detectar cuando alguien inicia o cierra sesión
    setInterval(function () {
      var x = usuario();
      var mail = x && x.email ? x.email : '';
      if (mail !== estado.email) verificar(mail);
    }, 2500);
    window.addEventListener('online', function () {
      var x = usuario();
      if (x && x.email) verificar(x.email);
    });
  }

  window.__pmPremium = {
    CONFIG: CONFIG,
    estado: function () { return estado; },
    usuario: usuario,
    verificar: verificar,
    pintarOffline: pintarOffline
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
// FIN premium-ui.js
