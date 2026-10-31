// Pimath IA: BUSCAR VIDEOS EN YOUTUBE
// Si el estudiante pide "búscame un video de fracciones en YouTube, ejemplo profe Axel", Pimath busca,
// muestra tarjetas con miniatura y título en el chat, y el video se reproduce dentro de la app.
(function () {
  'use strict';

  // ---------- Entender el pedido ----------
  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿¡?!.,;:()"“”«»]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  var VERBOS = /\b(busca|buscame|buscar|busco|busque|buscarme|muestrame|mostrar|mostrame|recomiendame|recomienda|recomendar|ponme|pon|poner|dame|encuentra|encuentrame|mandame|enviame|pasame|quiero ver|quisiera ver|necesito ver|me gustaria ver)\b/;
  var OBJETO = /\b(video|videos|videito|videitos|tutorial|tutoriales|canal|canales)\b/;
  var YT = /\b(youtube|you tube|youtuber|yt)\b/;

  function esPedidoDeVideo(msg) {
    var n = normalizar(msg);
    if (!n || n.length > 260) return false;
    if (YT.test(n) && (VERBOS.test(n) || OBJETO.test(n))) return true;
    return OBJETO.test(n) && VERBOS.test(n);
  }

  var RELLENO = {};
  ('por favor porfa porfavor quiero quisiera necesito puedes podrias podria me te se lo la los las le un una unos unas el del al ' +
   'ver busca buscame buscar busco busque buscarme muestrame mostrar mostrame recomiendame recomienda recomendar ponme pon poner dame ' +
   'encuentra encuentrame mandame enviame pasame gustaria video videos videito videitos tutorial tutoriales canal canales ' +
   'en youtube you tube youtuber yt ejemplo ejemplos como tipo tal y e o otro otra otros otras mas que de para sobre con por a ' +
   'hola pimath explica explicame ensename quien algun alguno alguna algunos algunas hay tienes tiene ya mismo aqui este esta ' +
   'clase clases profesor profesora').split(' ').forEach(function (w) { if (w) RELLENO[w] = 1; });

  var MATE = /(matem|algebra|geometr|fraccion|ecuacion|calcul|aritm|estadist|trigonom|derivad|integral|suma|resta|multiplic|divis|potencia|raiz|porcentaje|decimal|polinomio|funcion|logaritm|pitagor|probabilidad|angulo|triangulo|area|perimetro|volumen)/;

  function extraerConsulta(msg) {
    var palabras = normalizar(msg).split(' ');
    var out = [];
    palabras.forEach(function (p) {
      // "profe" y "profesor" se conservan solo si acompañan a un nombre (se quita la palabra suelta "clase", etc.)
      if (!p || RELLENO[p]) return;
      if (out.indexOf(p) === -1) out.push(p);
    });
    var q = out.join(' ').trim();
    if (!q) q = 'matematicas';
    if (!MATE.test(q)) q = 'matematicas ' + q;
    return q.slice(0, 80);
  }

  // ---------- Buscar ----------
  var fetchPrevio = window.fetch.bind(window);

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

  function buscar(q) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 15000);
    return fetchPrevio('/api/youtube?q=' + encodeURIComponent(q), { signal: ctl.signal, cache: 'no-store' })
      .then(function (r) {
        clearTimeout(t);
        return r.json().then(function (d) {
          if (!r.ok || !d || !Array.isArray(d.videos)) throw new Error((d && d.error) || ('http_' + r.status));
          return d.videos;
        });
      }, function (e) { clearTimeout(t); throw e; });
  }

  function guardarVideos(id, q, videos) {
    try {
      localStorage.setItem('pmv_' + id, JSON.stringify({ q: q, v: videos }));
      var idx = JSON.parse(localStorage.getItem('pmv_idx') || '[]');
      idx.push(id);
      while (idx.length > 30) { try { localStorage.removeItem('pmv_' + idx.shift()); } catch (e) {} }
      localStorage.setItem('pmv_idx', JSON.stringify(idx));
    } catch (e) {}
  }

  function responderVideos(msg, init) {
    var q = extraerConsulta(msg);
    var id = 'v' + Date.now().toString(36);
    var token = '⟦pmv:' + id + '|' + q + '⟧';

    if (navigator.onLine === false) {
      return conAbort(Promise.resolve(jsonResp({ text: 'Necesitas internet para buscar videos. Cuando tengas conexión, vuelve a pedírmelo.' })), init && init.signal);
    }
    var trabajo = buscar(q).then(function (videos) {
      if (!videos.length) {
        return jsonResp({ text: 'No encontré videos para «' + q + '». Prueba con otro tema o con el nombre del canal.\n\n' + token });
      }
      guardarVideos(id, q, videos);
      return jsonResp({
        text: 'Encontré estos videos de matemáticas en YouTube para «' + q + '». Toca uno para verlo aquí mismo.\n\n' + token +
          '\n\nSi quieres, también te explico el tema paso a paso aquí en el chat.'
      });
    }).catch(function (e) {
      if (e && e.name === 'AbortError' && init && init.signal && init.signal.aborted) throw e;
      return jsonResp({ text: 'No pude buscar los videos dentro de Pimath en este momento, pero te dejo la búsqueda lista en YouTube.\n\n' + token });
    });
    return conAbort(trabajo, init && init.signal);
  }

  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf('/api/chat') !== -1 && init && typeof init.body === 'string') {
        var cuerpo = JSON.parse(init.body);
        // Las tarjetas de videos no se envían como texto a la IA
        if (Array.isArray(cuerpo.history)) {
          var cambio = false;
          cuerpo.history.forEach(function (t) {
            if (t && typeof t.text === 'string' && t.text.indexOf('⟦pmv:') !== -1) {
              t.text = t.text.replace(/⟦pmv:[^⟧]*⟧/g, '');
              cambio = true;
            }
          });
          if (cambio) init = Object.assign({}, init, { body: JSON.stringify(cuerpo) });
        }
        if (!cuerpo.image && esPedidoDeVideo(cuerpo.message)) return responderVideos(cuerpo.message, init);
      }
    } catch (e) {}
    return fetchPrevio(input, init);
  };

  window.__pimathVideos = { esPedidoDeVideo: esPedidoDeVideo, extraerConsulta: extraerConsulta }; // para pruebas

  // ---------- Tarjetas en el chat ----------
  function el(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt) e.textContent = txt;
    return e;
  }

  function estilos() {
    if (document.getElementById('pmvEstilos')) return;
    var st = document.createElement('style');
    st.id = 'pmvEstilos';
    st.textContent = [
      '.pmv-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:12px;margin:14px 0 6px}',
      '.pmv-card{display:block;width:100%;border:1px solid #E4DCC8;border-radius:16px;overflow:hidden;background:#fff;cursor:pointer;text-align:left;padding:0;font:inherit;color:#1C2620;-webkit-tap-highlight-color:transparent}',
      '.pmv-card:active{background:#FBF8EE}',
      '.pmv-img{position:relative;width:100%;aspect-ratio:16/9;background:#E4DCC8;overflow:hidden}',
      '.pmv-img img{width:100%;height:100%;object-fit:cover;display:block}',
      '.pmv-play{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(28,38,32,.72);display:flex;align-items:center;justify-content:center}',
      '.pmv-play:after{content:"";border-style:solid;border-width:9px 0 9px 15px;border-color:transparent transparent transparent #fff;margin-left:3px}',
      '.pmv-t{padding:10px 12px 2px;font-weight:600;font-size:.92rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.pmv-c{padding:0 12px 11px;color:#5E6B62;font-size:.82rem}',
      '.pmv-mas{display:inline-block;margin:8px 0 2px;padding:10px 16px;border-radius:12px;background:#F1ECDD;color:#1C2620;text-decoration:none;font-size:.92rem;font-weight:600}',
      '#pmvPlayer{position:fixed;left:0;top:0;right:0;bottom:0;z-index:96;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}',
      '#pmvPlayer .pmv-caja{width:100%;max-width:780px;max-height:100%;display:flex;flex-direction:column;gap:10px}',
      '#pmvPlayer .pmv-cab{display:flex;align-items:flex-start;gap:12px;color:#fff;font-family:var(--font-body,system-ui,sans-serif)}',
      '#pmvPlayer .pmv-tit{flex:1;font-weight:600;font-size:.98rem;line-height:1.35}',
      '#pmvPlayer .pmv-x{flex:none;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:18px;padding:8px 16px;font:inherit;font-size:.88rem;cursor:pointer}',
      '#pmvPlayer .pmv-vid{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden}',
      '#pmvPlayer iframe{position:absolute;left:0;top:0;width:100%;height:100%;border:0}',
      '#pmvPlayer .pmv-yt{color:#fff;opacity:.85;font-size:.88rem;text-decoration:underline;font-family:var(--font-body,system-ui,sans-serif)}'
    ].join('');
    document.head.appendChild(st);
  }

  function cerrarReproductor() {
    var p = document.getElementById('pmvPlayer');
    if (p && p.parentNode) p.parentNode.removeChild(p);
  }

  function abrirReproductor(v) {
    estilos();
    cerrarReproductor();
    try { window.dispatchEvent(new Event('pimath-video-abierto')); } catch (e) {}
    var ov = el('div', '');
    ov.id = 'pmvPlayer';
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrarReproductor(); });
    var caja = el('div', '');
    caja.className = 'pmv-caja';
    var cab = el('div', '');
    cab.className = 'pmv-cab';
    cab.appendChild(el('div', '', v.title || 'Video'));
    cab.firstChild.className = 'pmv-tit';
    var x = el('button', '', 'Cerrar');
    x.type = 'button';
    x.className = 'pmv-x';
    x.addEventListener('click', cerrarReproductor);
    cab.appendChild(x);
    var vid = el('div', '');
    vid.className = 'pmv-vid';
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1&rel=0&playsinline=1';
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('allowfullscreen', '');
    f.title = v.title || 'Video';
    vid.appendChild(f);
    var yt = el('a', '', 'Abrir en YouTube');
    yt.className = 'pmv-yt';
    yt.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id);
    yt.target = '_blank';
    yt.rel = 'noopener';
    caja.appendChild(cab);
    caja.appendChild(vid);
    caja.appendChild(yt);
    ov.appendChild(caja);
    document.body.appendChild(ov);
  }

  function crearTarjetas(id, q) {
    var datos = null;
    try { datos = JSON.parse(localStorage.getItem('pmv_' + id) || 'null'); } catch (e) {}
    var cont = el('div', '');
    if (datos && Array.isArray(datos.v) && datos.v.length) {
      var lista = el('div', '');
      lista.className = 'pmv-lista';
      datos.v.slice(0, 8).forEach(function (v) {
        if (!v || !v.id) return;
        var b = el('button', '');
        b.type = 'button';
        b.className = 'pmv-card';
        var img = el('div', '');
        img.className = 'pmv-img';
        var im = document.createElement('img');
        im.loading = 'lazy';
        im.alt = '';
        im.src = v.thumb || ('https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/mqdefault.jpg');
        img.appendChild(im);
        img.appendChild(el('div', ''));
        img.lastChild.className = 'pmv-play';
        b.appendChild(img);
        var t = el('div', '', v.title || 'Video');
        t.className = 'pmv-t';
        b.appendChild(t);
        var c = el('div', '', v.canal || '');
        c.className = 'pmv-c';
        b.appendChild(c);
        b.addEventListener('click', function () { abrirReproductor(v); });
        lista.appendChild(b);
      });
      cont.appendChild(lista);
    }
    var mas = el('a', '', (datos && datos.v && datos.v.length) ? 'Ver más videos en YouTube' : 'Buscar «' + q + '» en YouTube');
    mas.className = 'pmv-mas';
    mas.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    mas.target = '_blank';
    mas.rel = 'noopener';
    cont.appendChild(mas);
    return cont;
  }

  // Lo usa el modo de conversación por voz para mostrar las tarjetas en su pantalla
  window.__pimathVideosTarjetas = function (id, q) { estilos(); return crearTarjetas(id, q); };

  function procesar(msg) {
    if (!msg || msg.dataset.pmv === '1' || msg.classList.contains('thinking')) return;
    var texto = msg.textContent || '';
    var m = /⟦pmv:([a-z0-9]+)\|([^⟧]*)⟧/.exec(texto);
    if (!m) return;
    msg.dataset.pmv = '1';
    estilos();
    // Quitar la marca del texto
    var walker = document.createTreeWalker(msg, NodeFilter.SHOW_TEXT);
    var nodos = [], n;
    while ((n = walker.nextNode())) { if (n.nodeValue.indexOf('⟦pmv:') !== -1) nodos.push(n); }
    nodos.forEach(function (nodo) {
      nodo.nodeValue = nodo.nodeValue.replace(/⟦pmv:[^⟧]*⟧/g, '');
      var padre = nodo.parentNode;
      if (padre && padre !== msg && !padre.children.length && !padre.textContent.trim()) padre.parentNode.removeChild(padre);
    });
    var tarjetas = crearTarjetas(m[1], m[2]);
    var cierre = null, hijos = msg.children;
    for (var i = hijos.length - 1; i >= 0; i--) { if (/speak|escuchar/i.test(hijos[i].className + ' ' + hijos[i].textContent)) { cierre = hijos[i]; break; } }
    // Debajo del primer párrafo (la introducción)
    var primero = msg.querySelector('p');
    if (primero && primero.nextSibling) msg.insertBefore(tarjetas, primero.nextSibling);
    else if (cierre) msg.insertBefore(tarjetas, cierre);
    else msg.appendChild(tarjetas);
  }

  function revisar() {
    var chat = document.getElementById('chat');
    if (!chat) return;
    var msgs = chat.querySelectorAll('.msg.bot');
    for (var i = 0; i < msgs.length; i++) procesar(msgs[i]);
  }

  var pendiente = false;
  function programar() {
    if (pendiente) return;
    pendiente = true;
    (window.requestAnimationFrame || setTimeout)(function () { pendiente = false; revisar(); });
  }

  function iniciar() {
    var chat = document.getElementById('chat');
    if (!chat) { setTimeout(iniciar, 500); return; }
    new MutationObserver(programar).observe(chat, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    revisar();
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarReproductor(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
