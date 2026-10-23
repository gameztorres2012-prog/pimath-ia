// ===== Pimath Premium: activación manual por correo (Nequi / Efecty + comprobante) =====
(function () {
  // Completa estos datos (déjalos vacíos '' si no quieres mostrarlos):
  var CONFIG = {
    precio: '$5.000 COP (pesos colombianos)',
    metodos: ['Nequi', 'PayPal', 'Efecty'],  // Formas de pago que se muestran
    nequi: '',     // Cuando quieras, escribe aquí tu número. Ej: '300 123 4567'
    paypal: '',    // Cuando quieras, escribe aquí tu usuario o correo de PayPal
    efecty: '',    // Cuando quieras, escribe aquí los datos del giro
    correo: 'pimathia.com@gmail.com',  // Correo donde te llegan los comprobantes
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
      if (CONFIG.paypal) { pasos.appendChild(el('p', 'margin:0 0 4px;', 'PayPal: ' + CONFIG.paypal)); hayPago = true; }
      if (CONFIG.efecty) { pasos.appendChild(el('p', 'margin:0 0 4px;', 'Efecty: ' + CONFIG.efecty)); hayPago = true; }
      if (!hayPago) {
        var metodos = (CONFIG.metodos || []).join(', ').replace(/, ([^,]*)$/, ' o $1');
        pasos.appendChild(el('p', 'margin:0 0 4px;color:#5E6B62;',
          (metodos ? 'Puedes pagar por ' + metodos + '. ' : '') +
          (CONFIG.correo ? 'Pide los datos de pago por correo y te los enviamos.' : 'Escríbenos para coordinar el pago.')));
        if (CONFIG.correo) {
          var pedir = el('a', 'display:block;padding:10px;border-radius:12px;background:#F1ECDD;color:#1C2620;font-weight:600;text-align:center;text-decoration:none;margin-top:6px;', 'Pedir datos de pago por correo');
          pedir.href = 'mailto:' + CONFIG.correo + '?subject=' + encodeURIComponent('Quiero Pimath Premium') +
            '&body=' + encodeURIComponent('Hola, quiero Pimath Premium. Mi correo de Pimath es: ' + u.email + '. ¿Me envían los datos para pagar por ' + (metodos || 'Nequi, PayPal o Efecty') + '?');
          pasos.appendChild(pedir);
        }
      }
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
          boton.onclick = function () {
            if (!window.confirm('¿Borrar la IA guardada? Tendrás que descargarla otra vez para usarla sin internet.')) return;
            P.borrar().then(estadoInicial);
          };
        } else {
          info.textContent = 'Descarga única de unos 3.4 GB. Usa WiFi, ten espacio libre y no cierres la app mientras descarga.';
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
            if (libre !== null && libre < 4.2e9) {
              if (!window.confirm('Parece que no hay suficiente espacio libre (hacen falta unos 4 GB). ¿Intentar de todos modos?')) return;
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
        abrirModal();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
// FIN premium-ui.js
