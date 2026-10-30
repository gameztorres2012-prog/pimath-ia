// Pimath IA - Pantalla Premium: plan, lo que incluye y cómo obtenerlo (sin emojis)
(function () {
  var P = window.__pmPremium;
  if (!P) return;
  var C = P.CONFIG;

  var ORO = '#B8791E', TINTA = '#1C2620', GRIS = '#5E6B62', LINEA = '#E4DCC8';

  // Íconos de línea (se dibujan con SVG, no con emojis)
  var ICONOS = {
    offline: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.4" r="1"/><path d="M3 3l18 18"/>',
    device: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M12 7.5v6m0 0l-3-3m3 3l3-3M10 18h4"/>',
    check: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    storage: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    battery: '<rect x="2.5" y="7" width="16" height="10" rx="2.5"/><path d="M21 10.5v3M6 10.5v3"/>',
    cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  };

  function el(tag, css, texto) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (texto) e.textContent = texto;
    return e;
  }
  function icono(nombre, tam) {
    var s = el('span', 'display:inline-flex;');
    s.innerHTML = '<svg viewBox="0 0 24 24" width="' + (tam || 22) + '" height="' + (tam || 22) +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONOS[nombre] || '') + '</svg>';
    return s;
  }
  function cerrar() {
    var m = document.getElementById('pmPremiumPage');
    if (m && m.parentNode) m.parentNode.removeChild(m);
  }

  var BTN = 'display:block;width:100%;padding:15px;border:none;border-radius:14px;font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit;margin-top:12px;text-align:center;text-decoration:none;box-sizing:border-box;';
  var TARJETA = 'background:#fff;border-radius:22px;padding:22px;margin-top:16px;border:1px solid ' + LINEA + ';';

  function filaIcono(padre, i, t, d) {
    if (typeof i === 'object' && i) { d = i.d; t = i.t; i = i.i; }
    var f = el('div', 'display:flex;gap:14px;align-items:flex-start;margin-top:18px;');
    var ic = el('div', 'width:42px;height:42px;border-radius:13px;background:#F6EBD6;color:' + ORO + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;');
    ic.appendChild(icono(i || 'check'));
    var tx = el('div', 'flex:1;');
    tx.appendChild(el('div', 'font-weight:600;font-size:1.02rem;', t));
    if (d) tx.appendChild(el('div', 'color:' + GRIS + ';font-size:.95rem;', d));
    f.appendChild(ic); f.appendChild(tx);
    padre.appendChild(f);
  }

  function paso(padre, n, titulo) {
    var f = el('div', 'display:flex;gap:12px;margin-top:20px;');
    f.appendChild(el('div', 'width:28px;height:28px;border-radius:50%;background:' + ORO + ';color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.9rem;', String(n)));
    var cuerpo = el('div', 'flex:1;min-width:0;');
    cuerpo.appendChild(el('div', 'font-weight:600;font-size:1.02rem;', titulo));
    f.appendChild(cuerpo); padre.appendChild(f);
    return cuerpo;
  }

  function precioGrande(padre) {
    if (C.precioAntes) padre.appendChild(el('div', 'text-decoration:line-through;color:#8A8F87;margin-top:16px;', C.precioAntes));
    var linea = el('div', 'display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:' + (C.precioAntes ? '0' : '16px') + ';');
    var m = String(C.precio || '').match(/^(\S+)\s+(.+)$/);
    linea.appendChild(el('span', 'font-size:2.5rem;font-weight:600;line-height:1.1;font-family:var(--font-display,Georgia,serif);', m ? m[1] : (C.precio || '')));
    if (m) linea.appendChild(el('span', 'color:' + GRIS + ';font-size:1.05rem;', m[2] + (C.periodo ? ' · ' + C.periodo : '')));
    else if (C.periodo) linea.appendChild(el('span', 'color:' + GRIS + ';font-size:1.05rem;', C.periodo));
    padre.appendChild(linea);
    var metodos = (C.metodos || []).join(', ').replace(/, ([^,]*)$/, ' o $1');
    if (metodos) padre.appendChild(el('div', 'color:' + GRIS + ';margin-top:4px;', 'Pago por ' + metodos));
  }

  function pasosDePago(u) {
    var caja = el('div', TARJETA + 'display:none;');
    caja.appendChild(el('h3', 'margin:0;font-family:var(--font-display,Georgia,serif);font-size:1.3rem;font-weight:600;', 'Cómo obtener Premium'));

    var p1 = paso(caja, 1, 'Elige cómo pagar');
    var hayPago = false;
    [['Nequi', C.nequi], ['PayPal', C.paypal], ['Efecty', C.efecty]].forEach(function (x) {
      if (x[1]) { p1.appendChild(el('div', 'color:' + TINTA + ';margin-top:4px;', x[0] + ': ' + x[1])); hayPago = true; }
    });
    if (!hayPago) {
      var met = (C.metodos || []).join(', ').replace(/, ([^,]*)$/, ' o $1');
      p1.appendChild(el('div', 'color:' + GRIS + ';margin-top:4px;',
        (met ? 'Puedes pagar por ' + met + '. ' : '') + (C.correo ? 'Pide los datos de pago por correo y te los enviamos.' : 'Escríbenos para coordinar el pago.')));
      if (C.correo) {
        var pedir = el('a', BTN + 'background:#F1ECDD;color:' + TINTA + ';padding:12px;', 'Pedir datos de pago por correo');
        pedir.href = 'mailto:' + C.correo + '?subject=' + encodeURIComponent('Quiero Pimath Premium') +
          '&body=' + encodeURIComponent('Hola, quiero Pimath Premium. Mi correo de Pimath es: ' + u.email + '. ¿Me envían los datos para pagar por ' + (met || 'Nequi, PayPal o Efecty') + '?');
        p1.appendChild(pedir);
      }
    }

    var p2 = paso(caja, 2, 'Envía el comprobante');
    p2.appendChild(el('div', 'color:' + GRIS + ';margin-top:4px;', 'Incluye este correo para activarte:'));
    p2.appendChild(el('div', 'font-weight:600;word-break:break-all;', u.email));
    var cuerpo = 'Hola, ya pagué Pimath Premium. Mi correo de Pimath es: ' + u.email;
    if (C.whatsapp) {
      var w = el('a', BTN + 'background:#F1ECDD;color:' + TINTA + ';padding:12px;', 'Enviar comprobante por WhatsApp');
      w.href = 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(cuerpo); w.target = '_blank'; w.rel = 'noopener';
      p2.appendChild(w);
    }
    if (C.correo) {
      var c = el('a', BTN + 'background:#F1ECDD;color:' + TINTA + ';padding:12px;', 'Enviar comprobante por correo');
      c.href = 'mailto:' + C.correo + '?subject=' + encodeURIComponent('Pago Pimath Premium') + '&body=' + encodeURIComponent(cuerpo);
      p2.appendChild(c);
    }

    var p3 = paso(caja, 3, 'Te activamos Premium');
    p3.appendChild(el('div', 'color:' + GRIS + ';margin-top:4px;', 'Cuando confirmemos tu pago, toca el botón para actualizar tu cuenta.'));
    var msg = el('div', 'margin-top:10px;color:' + GRIS + ';min-height:1.2em;');
    var bv = el('button', BTN + 'background:' + ORO + ';color:#fff;', 'Ya me activaron: verificar');
    bv.addEventListener('click', function () {
      msg.textContent = 'Verificando…';
      P.verificar(u.email, function (esPremium, sinInternet) {
        if (esPremium) abrir();
        else msg.textContent = sinInternet ? 'Sin internet: inténtalo de nuevo con conexión.' : 'Todavía no aparece tu pago. Intenta de nuevo en unos minutos.';
      });
    });
    p3.appendChild(bv); p3.appendChild(msg);
    return caja;
  }

  function abrir() {
    cerrar();
    var u = P.usuario(), est = P.estado();
    var pagina = el('div', 'position:fixed;inset:0;z-index:85;background:#F6F1E4;overflow-y:auto;font-family:var(--font-body,system-ui,sans-serif);color:' + TINTA + ';line-height:1.5;padding-top:env(safe-area-inset-top,0px);' + (window.innerWidth >= 560 ? 'zoom:.9;' : ''));
    pagina.id = 'pmPremiumPage';

    var barra = el('div', 'display:flex;align-items:center;gap:10px;padding:12px 16px;max-width:560px;margin:0 auto;box-sizing:border-box;');
    var logo = el('img', 'width:36px;height:36px;object-fit:contain;mix-blend-mode:multiply;'); logo.src = '/icon-192.png'; logo.alt = '';
    barra.appendChild(logo);
    barra.appendChild(el('div', 'flex:1;font-family:var(--font-display,Georgia,serif);font-size:1.3rem;font-weight:600;', 'Pimath'));
    var x = el('button', 'background:none;border:0;cursor:pointer;color:' + TINTA + ';padding:8px;');
    x.setAttribute('aria-label', 'Cerrar'); x.appendChild(icono('cerrar', 24)); x.addEventListener('click', cerrar);
    barra.appendChild(x);
    pagina.appendChild(barra);

    var cont = el('div', 'max-width:560px;margin:0 auto;padding:0 16px 48px;box-sizing:border-box;');
    pagina.appendChild(cont);

    // ---- Tarjeta del plan ----
    var plan = el('div', 'background:#fff;border:2px solid ' + ORO + ';border-radius:26px;padding:24px 22px;margin-top:6px;');
    plan.appendChild(el('div', 'color:' + ORO + ';font-size:.78rem;font-weight:700;letter-spacing:.09em;', 'PLAN PREMIUM'));
    plan.appendChild(el('h2', 'margin:6px 0 12px;font-family:var(--font-display,Georgia,serif);font-size:1.9rem;font-weight:600;line-height:1.15;', 'Pimath Premium'));
    var pastilla = el('span', 'display:inline-flex;align-items:center;gap:8px;background:#F6EBD6;color:' + TINTA + ';border-radius:999px;padding:7px 14px;font-size:.92rem;');
    var pi = icono('device', 18); pi.style.color = ORO; pastilla.appendChild(pi);
    pastilla.appendChild(el('span', '', C.etiqueta || 'Pimath sin internet'));
    plan.appendChild(pastilla);
    precioGrande(plan);

    var pasos = null;
    if (!u || !u.email) {
      plan.appendChild(el('div', 'margin-top:18px;color:' + GRIS + ';', 'Inicia sesión con Google en Pimath para obtener Premium.'));
    } else if (est.premium) {
      var ok = el('div', 'display:flex;align-items:center;gap:10px;margin-top:18px;padding:14px;border-radius:14px;background:#EAF3EA;color:#2E6B33;');
      ok.appendChild(icono('ok', 22));
      var tx = el('div', 'min-width:0;');
      tx.appendChild(el('div', 'font-weight:600;', 'Tu cuenta tiene Premium'));
      tx.appendChild(el('div', 'font-size:.85rem;word-break:break-all;', u.email));
      ok.appendChild(tx); plan.appendChild(ok);
    } else {
      pasos = pasosDePago(u);
      var cta = el('button', BTN + 'background:' + ORO + ';color:#fff;margin-top:18px;', 'Obtener Pimath Premium');
      cta.addEventListener('click', function () {
        pasos.style.display = 'block';
        try { pasos.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      });
      plan.appendChild(cta);
    }

    plan.appendChild(el('div', 'height:1px;background:' + LINEA + ';margin:22px 0 4px;'));
    plan.appendChild(el('div', 'font-weight:600;margin-top:14px;', est.premium ? 'Tus beneficios Premium' : 'Incluye'));
    (C.beneficios || []).forEach(function (b) { filaIcono(plan, typeof b === 'string' ? { i: 'check', t: b, d: '' } : b); });
    cont.appendChild(plan);

    if (pasos) cont.appendChild(pasos);

    // ---- Modo sin internet (solo Premium) ----
    if (est.premium && u && u.email) {
      var oc = el('div', TARJETA);
      P.pintarOffline(oc, BTN);
      cont.appendChild(oc);
    }

    // ---- Ten en cuenta ----
    var av = el('div', TARJETA);
    av.appendChild(el('h3', 'margin:0;font-family:var(--font-display,Georgia,serif);font-size:1.3rem;font-weight:600;', 'Ten en cuenta'));
    (C.avisos || []).forEach(function (a) { filaIcono(av, typeof a === 'string' ? { i: 'check', t: a, d: '' } : a); });
    cont.appendChild(av);

    document.body.appendChild(pagina);
  }

  P.abrir = abrir;
})();
// FIN premium-panel.js
