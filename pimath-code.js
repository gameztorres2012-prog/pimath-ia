// Pimath IA: PIMATH CODE
// Menú ☰ > Pimath Code: se escribe lo que se quiere programar en la barra de abajo, se ve en vivo lo que
// Pimath va haciendo, y el resultado aparece en una tarjeta con Código / Vista previa.
// Pimath Code puede programar cualquier cosa MENOS la app de Pimath IA.
(function () {
  'use strict';

  var KEY = 'pimath_code_projects';
  var EXT = { html: 'html', python: 'py', py: 'py', java: 'java', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', 'c#': 'cs', php: 'php', css: 'css', json: 'json', kotlin: 'kt', swift: 'swift', go: 'go', rust: 'rs', ruby: 'rb', sql: 'sql', bash: 'sh', sh: 'sh', lua: 'lua', dart: 'dart' };
  var LENG = { html: 'Web', python: 'Python', py: 'Python', java: 'Java', javascript: 'JavaScript', js: 'JavaScript', typescript: 'TypeScript', ts: 'TypeScript', c: 'C', cpp: 'C++', 'c++': 'C++', csharp: 'C#', 'c#': 'C#', php: 'PHP', css: 'CSS', json: 'JSON', kotlin: 'Kotlin', swift: 'Swift', go: 'Go', rust: 'Rust', ruby: 'Ruby', sql: 'SQL', bash: 'Bash', sh: 'Bash', lua: 'Lua', dart: 'Dart' };

  function svg(path, tam, extra) {
    return '<svg viewBox="0 0 24 24" width="' + (tam || 20) + '" height="' + (tam || 20) + '" fill="none" stroke="currentColor" stroke-width="' + ((extra && extra.w) || 1.9) + '" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">' + path + '</svg>';
  }
  var ICO_ENVIAR = svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 22, { w: 2.3 });
  var ICO_PARAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="display:block"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  var ICO_MIC = svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', 22, { w: 1.8 });
  var ICO_X = svg('<path d="M6 6l12 12M18 6L6 18"/>', 20, { w: 2 });
  var ICO_MAS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display:block"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>';
  var ICO_GUARDAR = svg('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>');
  var ICO_UNDO = svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>');
  var ICO_EXPORTAR = svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/>', 18);
  var ICO_ABAJO = svg('<path d="M6 9l6 6 6-6"/>', 16);
  var ICO_COMPARTIR = svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>');
  var ICO_EXPANDIR = svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>');
  var ICO_CHEV = svg('<path d="M9 6l6 6-6 6"/>', 16);
  var ICO_OK = svg('<path d="M5 12l5 5 9-10"/>', 15, { w: 2.6 }).replace('stroke="currentColor"', 'stroke="#188038"');
  var ICO_GIRA = svg('<path d="M12 3a9 9 0 1 0 9 9" />', 15, { w: 2.4 }).replace('<svg ', '<svg class="pc-gira" ');

  var proyectos = cargar();
  var actual = { id: null, name: '', lang: 'html', code: '' };
  var pila = [];
  var ctl = null;
  var ocupado = false;
  var app = null;
  var menuAbierto = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; }
  function normalizar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }

  function cargar() {
    try { var g = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(g) ? g : []; } catch (e) { return []; }
  }
  function persistir() {
    try { localStorage.setItem(KEY, JSON.stringify(proyectos)); return true; }
    catch (e) { aviso('No hay espacio para guardar más proyectos. Borra alguno.'); return false; }
  }

  // ---------- Protección: no se puede programar la app de Pimath IA ----------
  function esPimath(t) {
    var n = normalizar(t).replace(/pimath code/g, '');
    return /pimath/.test(n) || /pimath_state|logo_src/.test(n);
  }
  var MSG_PIMATH = 'En Pimath Code puedes crear cualquier cosa, menos la app de Pimath IA. Pídeme otra idea.';

  // ---------- Colores del código (tema claro) ----------
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function tokenizar(texto, re, clases) {
    var out = '', ult = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(texto))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      out += esc(texto.slice(ult, m.index));
      var cl = '';
      for (var g = 1; g < m.length; g++) { if (m[g] !== undefined) { cl = clases[g - 1]; break; } }
      out += '<span class="hl-' + cl + '">' + esc(m[0]) + '</span>';
      ult = m.index + m[0].length;
    }
    return out + esc(texto.slice(ult));
  }

  var RE_JS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|new|class|extends|import|export|from|try|catch|finally|throw|async|await|of|in|typeof|instanceof|this|null|undefined|true|false|delete|void|yield|static|super)\b)|(\b[A-Za-z_$][\w$]*(?=\s*\())/g;
  var RE_CSS = /(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#[0-9a-fA-F]{3,8}\b|(?<![\w-])-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr)?)|(@[\w-]+)|([\w-]+(?=\s*:))/g;
  var RE_GEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:def|class|import|from|as|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|try|except|finally|raise|with|lambda|pass|break|continue|public|private|protected|static|void|int|long|double|float|boolean|char|String|new|this|extends|implements|interface|package|final|const|let|var|function|switch|case|default|throw|throws|catch|using|namespace|struct|enum|template|typename|auto|include|define|fn|func|mut|match|impl|use|pub|echo|null|true|false)\b)|(\b[A-Za-z_][\w]*(?=\s*\())/g;

  function hlJS(c) { return tokenizar(c, RE_JS, ['c', 's', 'n', 'k', 'f']); }
  function hlCSS(c) { return tokenizar(c, RE_CSS, ['c', 's', 'n', 'k', 'a']); }
  function hlGen(c) { return tokenizar(c, RE_GEN, ['c', 's', 'n', 'k', 'f']); }

  function hlTag(t) {
    if (/^<!doctype/i.test(t)) return '<span class="hl-m">' + esc(t) + '</span>';
    var m = /^<(\/?)([a-zA-Z][\w:-]*)([\s\S]*?)(\/?)>$/.exec(t);
    if (!m) return esc(t);
    var attrs = esc(m[3]).replace(/([\w:@.-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'>]+)/g, '<span class="hl-a">$1</span>$2<span class="hl-s">$3</span>');
    return '<span class="hl-p">&lt;' + m[1] + '</span><span class="hl-t">' + m[2] + '</span>' + attrs + '<span class="hl-p">' + m[4] + '&gt;</span>';
  }

  function hlHTML(code) {
    var re = /<!--[\s\S]*?-->|<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>|<!doctype[^>]*>|<\/?[a-zA-Z][^>]*>/gi;
    var out = '', ult = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(ult, m.index));
      var t = m[0];
      if (t.slice(0, 4) === '<!--') out += '<span class="hl-c">' + esc(t) + '</span>';
      else if (m[1]) {
        out += hlTag('<' + m[1] + m[2] + '>') + (m[1].toLowerCase() === 'script' ? hlJS(m[3]) : hlCSS(m[3])) + hlTag('</' + m[1] + '>');
      } else out += hlTag(t);
      ult = m.index + t.length;
    }
    return out + esc(code.slice(ult));
  }

  function resaltar(code) {
    if (code.length > 250000) return esc(code);
    var l = actual.lang || '';
    if (esWeb()) return hlHTML(code);
    if (l === 'css') return hlCSS(code);
    if (l === 'javascript' || l === 'js' || l === 'typescript' || l === 'ts') return hlJS(code);
    return hlGen(code);
  }

  // ---------- Estilos (pantalla blanca) ----------
  function estilos() {
    if ($('pcEstilos')) return;
    var M = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    var st = document.createElement('style');
    st.id = 'pcEstilos';
    st.textContent = [
      '#pcApp{position:fixed;left:0;right:0;top:0;bottom:0;z-index:94;display:none;flex-direction:column;background:#fff;color:#1f1f1f;font-family:var(--font-body,system-ui,sans-serif);padding-top:env(safe-area-inset-top,0px);box-sizing:border-box;-webkit-text-size-adjust:100%}',
      '#pcApp.on{display:flex}',
      '.pc-top{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fff;border-bottom:1px solid #ececec}',
      '.pc-top h2{margin:0;flex:1;font-family:var(--font-display,Georgia,serif);font-size:1.15rem;font-weight:600;color:#1f1f1f;padding-left:4px}',
      '.pc-ic{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:transparent;color:#444746;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}',
      '.pc-ic:active{background:#f0f0f0}',
      '.pc-ic:disabled{opacity:.3;cursor:default}',
      '.pc-main{position:relative;flex:1;overflow:auto;padding:16px 14px 24px;-webkit-overflow-scrolling:touch}',
      '.pc-feed,.pc-card2{max-width:780px;margin-left:auto;margin-right:auto}',
      '.pc-turno{margin-bottom:18px}',
      '.pc-user{margin-left:auto;max-width:85%;width:fit-content;background:#f0f0f0;color:#1f1f1f;border-radius:22px;padding:10px 16px;font-size:.98rem;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:14px}',
      '.pc-act{margin:0 0 10px}',
      '.pc-act-h{display:flex;align-items:center;gap:4px;border:0;background:none;padding:2px 0;font:inherit;font-size:.92rem;color:#5f6368;cursor:pointer;text-align:left}',
      '.pc-act-t.run{background:linear-gradient(90deg,#6b6b6b 0%,#6b6b6b 35%,#c9c9c9 50%,#6b6b6b 65%,#6b6b6b 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:pcBrillo 1.7s linear infinite}',
      '@keyframes pcBrillo{from{background-position:120% 0}to{background-position:-120% 0}}',
      '.pc-act .pc-chev{transition:transform .2s}',
      '.pc-act.abierto .pc-chev{transform:rotate(90deg)}',
      '.pc-pasos{display:none;margin:6px 0 0 5px;padding-left:14px;border-left:2px solid #e6e6e6}',
      '.pc-act.abierto .pc-pasos{display:block}',
      '.pc-paso{display:flex;align-items:center;gap:8px;font-size:.86rem;color:#5f6368;padding:4px 0}',
      '.pc-gira{animation:pcGira .9s linear infinite;color:#5f6368}',
      '@keyframes pcGira{to{transform:rotate(360deg)}}',
      '.pc-expl{color:#1f1f1f;font-size:.96rem;line-height:1.6;white-space:pre-wrap;margin:0 0 6px}',
      '.pc-expl.err{color:#c5221f}',
      '.pc-card2{background:#fff;border:1px solid #e3e3e3;border-radius:20px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden}',
      '.pc-ch{display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px;padding:8px 10px;border-bottom:1px solid #efefef}',
      '.pc-name{flex:1 1 90px;min-width:80px;border:0;background:transparent;font:inherit;font-size:.92rem;color:#1f1f1f;outline:none;padding:6px 4px;text-overflow:ellipsis}',
      '.pc-seg{display:flex;background:#f1f3f4;border-radius:18px;padding:3px;gap:2px}',
      '.pc-seg button{border:0;background:transparent;border-radius:15px;padding:6px 14px;font:inherit;font-size:.86rem;color:#444746;cursor:pointer}',
      '.pc-seg button.on{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.18);color:#111;font-weight:600}',
      '.pc-exp{margin-left:auto;display:flex;align-items:center;gap:6px;border:1px solid #dadce0;background:#fff;border-radius:18px;padding:6px 10px 6px 12px;font:inherit;font-size:.86rem;color:#1f1f1f;cursor:pointer}',
      '.pc-exp:active{background:#f6f6f6}',
      '.pc-frame{width:100%;height:58vh;min-height:260px;border:0;display:block;background:#fff}',
      '.pc-frame.full{position:fixed;left:0;top:0;width:100%;height:100%;z-index:99}',
      '.pc-ed{position:relative;height:58vh;min-height:260px;background:#fff}',
      '.pc-hl,.pc-edit{position:absolute;left:0;top:0;right:0;bottom:0;margin:0;padding:14px 16px;box-sizing:border-box;font-family:' + M + ';font-size:13px;line-height:20px;white-space:pre;tab-size:2;-moz-tab-size:2;letter-spacing:0;border:0;border-radius:0}',
      '.pc-hl{overflow:hidden;pointer-events:none;color:#1f1f1f;background:transparent}',
      '.pc-hl code{font:inherit;white-space:inherit}',
      '.pc-edit{overflow:auto;background:transparent;color:transparent;-webkit-text-fill-color:transparent;caret-color:#1f1f1f;resize:none;outline:none}',
      '.pc-edit::selection{background:rgba(26,115,232,.25)}',
      '.hl-t{color:#800000}.hl-a{color:#e50000}.hl-s{color:#a31515}.hl-c{color:#008000}.hl-k{color:#af00db}.hl-f{color:#795e26}.hl-n{color:#098658}.hl-m{color:#808080}.hl-p{color:#808080}',
      '.pc-errbar{display:none;align-items:center;gap:10px;padding:10px 12px;background:#fdecea;color:#b3261e;font-size:.86rem;line-height:1.4;border-top:1px solid #f5c6c2}',
      '.pc-errbar span{flex:1;min-width:0;overflow-wrap:anywhere}',
      '.pc-errbar button{flex:none;border:0;background:#b3261e;color:#fff;border-radius:16px;padding:7px 14px;font:inherit;font-size:.85rem;cursor:pointer}',
      '.pc-bottom{padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fff}',
      '.pc-input{display:flex;align-items:flex-end;gap:4px;max-width:780px;margin:0 auto;background:#f4f4f4;border:1px solid #e3e3e3;border-radius:28px;padding:5px}',
      '.pc-input:focus-within{border-color:#B8791E;background:#fff}',
      '.pc-input textarea{flex:1;min-width:0;background:transparent;border:0;outline:none;color:#1f1f1f;font:inherit;font-size:1rem;line-height:1.35;resize:none;padding:9px 4px;height:40px;max-height:120px;box-sizing:border-box}',
      '.pc-input textarea::placeholder{color:#757575}',
      '.pc-round{flex:none;width:40px;height:40px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;color:#444746;padding:0;-webkit-tap-highlight-color:transparent}',
      '.pc-round.send{background:#B8791E;color:#fff}',
      '.pc-round.mic.on{background:#c5221f;color:#fff}',
      '.pc-toast{position:absolute;left:50%;bottom:84px;transform:translateX(-50%);max-width:88%;background:#1f1f1f;color:#fff;padding:9px 16px;border-radius:18px;font-size:.86rem;z-index:6;pointer-events:none;text-align:center}',
      '.pc-menu{position:fixed;z-index:98;min-width:210px;background:#fff;border:1px solid #e3e3e3;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.2);padding:6px}',
      '.pc-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:11px 12px;border-radius:10px;font:inherit;font-size:.93rem;color:#1f1f1f;cursor:pointer}',
      '.pc-menu button:active{background:#f1f3f4}',
      '.pc-exit{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:100;background:rgba(31,31,31,.88);color:#fff;border:0;border-radius:18px;padding:8px 16px;font:inherit;font-size:.86rem;cursor:pointer}',
      '.pc-sheet{position:fixed;left:0;top:0;right:0;bottom:0;z-index:97;background:rgba(0,0,0,.4);display:flex;align-items:flex-end;justify-content:center}',
      '.pc-card{background:#fff;color:#1f1f1f;width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:16px 14px calc(16px + env(safe-area-inset-bottom,0px));max-height:85vh;overflow:auto;box-sizing:border-box;font-family:var(--font-body,system-ui,sans-serif)}',
      '.pc-card h3{margin:0;font-size:1.1rem;font-family:var(--font-display,Georgia,serif)}',
      '.pc-item{display:flex;align-items:center;gap:10px;padding:11px 8px;border-bottom:1px solid #ececec;cursor:pointer}',
      '.pc-item:active{background:#f6f6f6}',
      '.pc-item .t{flex:1;min-width:0}',
      '.pc-item .t b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pc-item .t small{color:#5f6368}',
      '.pc-btn{flex:none;border:1px solid #dadce0;background:#fff;color:#1f1f1f;border-radius:18px;padding:7px 14px;font:inherit;font-size:.85rem;cursor:pointer;white-space:nowrap}',
      '.pc-btn:active{background:#f1f3f4}'
    ].join('');
    document.head.appendChild(st);
  }

  // ---------- Interfaz ----------
  function construir() {
    if (app) return;
    estilos();
    app = document.createElement('div');
    app.id = 'pcApp';
    app.setAttribute('role', 'dialog');
    app.setAttribute('aria-label', 'Pimath Code');
    app.innerHTML =
      '<div class="pc-top">' +
        '<button class="pc-ic" id="pcCerrar" aria-label="Cerrar">' + ICO_X + '</button>' +
        '<h2>Pimath Code</h2>' +
        '<button class="pc-ic" id="pcMas" aria-label="Más opciones">' + ICO_MAS + '</button>' +
      '</div>' +
      '<div class="pc-main" id="pcMain">' +
        '<div class="pc-feed" id="pcFeed"></div>' +
        '<div class="pc-card2" id="pcCard" style="display:none">' +
          '<div class="pc-ch">' +
            '<input class="pc-name" id="pcNombre" maxlength="60" placeholder="Proyecto" aria-label="Nombre del proyecto">' +
            '<button class="pc-ic" id="pcGuardar" aria-label="Guardar">' + ICO_GUARDAR + '</button>' +
            '<button class="pc-ic" id="pcDeshacer" aria-label="Deshacer">' + ICO_UNDO + '</button>' +
            '<button class="pc-ic" id="pcShare" aria-label="Compartir">' + ICO_COMPARTIR + '</button>' +
            '<button class="pc-ic" id="pcFull" aria-label="Pantalla completa">' + ICO_EXPANDIR + '</button>' +
            '<div class="pc-seg"><button id="pcTabCod">Código</button><button id="pcTabVer" class="on">Vista previa</button></div>' +
            '<button class="pc-exp" id="pcExportar">' + ICO_EXPORTAR + '<span>Exportar</span>' + ICO_ABAJO + '</button>' +
          '</div>' +
          '<div id="pcVer"></div>' +
          '<div class="pc-errbar" id="pcErrBar"><span id="pcErrTxt"></span><button type="button" id="pcErrFix">Corregir con Pimath</button></div>' +
          '<div id="pcCod" style="display:none"><div class="pc-ed">' +
            '<pre class="pc-hl" id="pcHl" aria-hidden="true"><code id="pcHlCode"></code></pre>' +
            '<textarea class="pc-edit" id="pcCodigo" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea>' +
          '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="pc-bottom">' +
        '<div class="pc-input">' +
          '<button class="pc-round mic" id="pcMic" aria-label="Dictar por voz">' + ICO_MIC + '</button>' +
          '<textarea id="pcIn" rows="1" autocomplete="off"></textarea>' +
          '<button class="pc-round send" id="pcGo" aria-label="Enviar">' + ICO_ENVIAR + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(app);

    $('pcCerrar').addEventListener('click', cerrar);
    $('pcMas').addEventListener('click', function (e) {
      abrirMenu(this, [['Nuevo proyecto', nuevo], ['Mis proyectos', abrirProyectos]]);
      e.stopPropagation();
    });
    $('pcGo').addEventListener('click', enviar);
    $('pcMic').addEventListener('click', dictar);
    $('pcTabVer').addEventListener('click', function () { pestana('ver'); });
    $('pcTabCod').addEventListener('click', function () { pestana('cod'); });
    $('pcDeshacer').addEventListener('click', deshacer);
    $('pcGuardar').addEventListener('click', function () { sincronizarEdicion(); if (guardar()) aviso('Proyecto guardado'); });
    $('pcExportar').addEventListener('click', function (e) {
      var items = [['Descargar archivo', descargar]];
      if (esWeb()) items.push(['App instalable (.zip)', descargarApp]);
      items.push(['Copiar código', copiar]);
      abrirMenu(this, items);
      e.stopPropagation();
    });
    $('pcErrFix').addEventListener('click', corregirError);
    window.addEventListener('message', alMensaje);
    $('pcShare').addEventListener('click', compartir);
    $('pcFull').addEventListener('click', pantallaCompleta);
    $('pcNombre').addEventListener('change', function () { actual.name = this.value.trim().slice(0, 60) || actual.name; guardar(); });
    $('pcIn').addEventListener('input', autoAjustar);
    $('pcIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar(); });

    var ta = $('pcCodigo');
    ta.addEventListener('input', pintarCodigo);
    ta.addEventListener('scroll', sincronizar);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var a = ta.selectionStart, b = ta.selectionEnd;
        ta.value = ta.value.slice(0, a) + '  ' + ta.value.slice(b);
        ta.selectionStart = ta.selectionEnd = a + 2;
        pintarCodigo();
      }
    });

    document.addEventListener('click', cerrarMenu);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', ajustarTeclado);
      window.visualViewport.addEventListener('scroll', ajustarTeclado);
    }
    actualizarEntrada();
  }

  // Mantiene la barra de escribir visible cuando sale el teclado
  function ajustarTeclado() {
    if (!app || !app.classList.contains('on') || !window.visualViewport) return;
    var vv = window.visualViewport;
    app.style.height = vv.height + 'px';
    app.style.top = vv.offsetTop + 'px';
    app.style.bottom = 'auto';
  }

  function abrir() { construir(); app.classList.add('on'); ajustarTeclado(); }
  function cerrar() { if (app) { cerrarMenu(); app.classList.remove('on'); app.style.height = ''; app.style.top = '0'; app.style.bottom = '0'; } }

  function aviso(txt) {
    if (!app) return;
    var viejo = app.querySelector('.pc-toast');
    if (viejo) viejo.remove();
    var t = el('div', '', txt);
    t.className = 'pc-toast';
    app.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function abrirMenu(boton, items) {
    cerrarMenu();
    var m = el('div', '');
    m.className = 'pc-menu';
    items.forEach(function (it) {
      var b = el('button', '', it[0]);
      b.type = 'button';
      b.addEventListener('click', function (e) { e.stopPropagation(); cerrarMenu(); it[1](); });
      m.appendChild(b);
    });
    var r = boton.getBoundingClientRect();
    m.style.top = (r.bottom + 6) + 'px';
    m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    app.appendChild(m);
    menuAbierto = m;
  }
  function cerrarMenu() { if (menuAbierto) { menuAbierto.remove(); menuAbierto = null; } }

  function autoAjustar() {
    var t = $('pcIn');
    t.style.height = '40px';
    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
  }

  function actualizarEntrada() {
    var t = $('pcIn');
    if (!t) return;
    t.placeholder = actual.code ? 'Pide un cambio o una mejora' : 'Describe lo que quieres programar';
  }

  function nuevo() {
    if (ocupado && ctl) ctl.abort();
    actual = { id: null, name: '', lang: 'html', code: '' };
    pila = [];
    $('pcFeed').innerHTML = '';
    $('pcCard').style.display = 'none';
    $('pcIn').value = '';
    autoAjustar();
    actualizarEntrada();
  }

  // ---------- Hablar para pedir ----------
  var reconocimiento = null;
  function dictar() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var btn = $('pcMic');
    if (!SR) { aviso('Este navegador no permite dictar por voz.'); return; }
    if (reconocimiento) { try { reconocimiento.stop(); } catch (e) {} return; }
    reconocimiento = new SR();
    reconocimiento.lang = window.__pimathLang || 'es-ES';
    reconocimiento.interimResults = false;
    reconocimiento.continuous = false;
    btn.classList.add('on');
    $('pcIn').placeholder = 'Te escucho…';
    reconocimiento.onresult = function (ev) {
      var campo = $('pcIn');
      campo.value = (campo.value ? campo.value + ' ' : '') + ev.results[0][0].transcript;
      autoAjustar();
    };
    reconocimiento.onerror = function () { aviso('No pude escucharte. Revisa el permiso del micrófono.'); };
    reconocimiento.onend = function () { reconocimiento = null; btn.classList.remove('on'); actualizarEntrada(); };
    try { reconocimiento.start(); } catch (e) { reconocimiento = null; btn.classList.remove('on'); actualizarEntrada(); }
  }

  // ---------- Actividad en vivo (lo que Pimath va haciendo) ----------
  function desplazarA(nodo) {
    var main = $('pcMain');
    main.scrollTop = Math.max(0, nodo.offsetTop - 10);
  }

  function nuevoTurno(texto) {
    var feed = $('pcFeed');
    var turno = el('div', '');
    turno.className = 'pc-turno';
    var u = el('div', '', texto);
    u.className = 'pc-user';
    var act = el('div', '');
    act.className = 'pc-act';
    var h = el('button', '');
    h.className = 'pc-act-h';
    h.type = 'button';
    var titulo = el('span', '', '');
    titulo.className = 'pc-act-t run';
    var chev = el('span', 'display:flex;', '');
    chev.className = 'pc-chev';
    chev.innerHTML = ICO_CHEV;
    h.appendChild(titulo);
    h.appendChild(chev);
    var pasos = el('div', '');
    pasos.className = 'pc-pasos';
    h.addEventListener('click', function () { act.classList.toggle('abierto'); });
    act.appendChild(h);
    act.appendChild(pasos);
    var expl = el('div', '');
    expl.className = 'pc-expl';
    expl.style.display = 'none';
    turno.appendChild(u);
    turno.appendChild(act);
    turno.appendChild(expl);
    feed.appendChild(turno);
    desplazarA(turno);
    return { el: turno, titulo: titulo, pasos: pasos, expl: expl, act: act, actual: null, inicio: Date.now() };
  }

  function actPaso(t, clave, texto) {
    if (t.actual && t.actual.clave === clave) {
      if (t.actual.texto !== texto) { t.actual.texto = texto; t.actual.span.textContent = texto; t.titulo.textContent = texto; }
      return;
    }
    if (t.actual) t.actual.icono.innerHTML = ICO_OK;
    var fila = el('div', '');
    fila.className = 'pc-paso';
    var icono = el('span', 'display:flex;', '');
    icono.innerHTML = ICO_GIRA;
    var span = el('span', '', texto);
    fila.appendChild(icono);
    fila.appendChild(span);
    t.pasos.appendChild(fila);
    t.actual = { clave: clave, texto: texto, span: span, icono: icono };
    t.titulo.className = 'pc-act-t run';
    t.titulo.textContent = texto;
  }

  function actFin(t, ok, mensaje) {
    if (t.actual) t.actual.icono.innerHTML = ok ? ICO_OK : '';
    t.titulo.className = 'pc-act-t';
    var s = Math.max(1, Math.round((Date.now() - t.inicio) / 1000));
    var dur = s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
    t.titulo.textContent = ok ? 'Programó durante ' + dur : (mensaje || 'No se pudo completar');
  }

  function progreso(t, txt) {
    var lineas = txt.split('\n').length;
    if (txt.indexOf('```') < 0) actPaso(t, 'plan', 'Planeando la estructura');
    else if (txt.indexOf('<script') >= 0) actPaso(t, 'js', 'Programando la lógica · ' + lineas + ' líneas');
    else if (txt.indexOf('<style') >= 0) actPaso(t, 'css', 'Diseñando la apariencia · ' + lineas + ' líneas');
    else actPaso(t, 'cod', 'Escribiendo el código · ' + lineas + ' líneas');
  }

  // ---------- Hablar con la IA (el servidor envía el código poco a poco) ----------
  function llamar(paquete, alProgreso) {
    ctl = new AbortController();
    return fetch('/api/code', {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paquete)
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.error || ('http_' + r.status)); });
      }
      if (!r.body || !r.body.getReader) return r.text();
      var lector = r.body.getReader(), dec = new TextDecoder(), texto = '';
      function leer() {
        return lector.read().then(function (x) {
          if (x.done) return texto;
          texto += dec.decode(x.value, { stream: true });
          if (alProgreso) alProgreso(texto);
          return leer();
        });
      }
      return leer().catch(function (e) {
        if (e && e.name === 'AbortError') throw e;
        if (texto.length > 200) return texto; // se cortó la conexión: se usa lo que llegó
        throw e;
      });
    });
  }

  function errorTexto(msg) {
    var m = String(msg || '').toLowerCase();
    if (m.indexOf('http_404') !== -1) return 'Falta subir el archivo api/code.mjs a GitHub para que Pimath Code funcione.';
    if (m.indexOf('504') !== -1 || m.indexOf('timeout') !== -1 || m.indexOf('502') !== -1) return 'Tardó demasiado generando el código. Pide algo más pequeño o hazlo por partes (primero lo básico y luego agrega cosas).';
    if (m.indexOf('quota') !== -1 || m.indexOf('rate') !== -1 || m.indexOf('429') !== -1 || m.indexOf('exhausted') !== -1) return 'Se alcanzó el límite de uso por ahora. Intenta más tarde.';
    if (m.indexOf('demand') !== -1 || m.indexOf('overloaded') !== -1 || m.indexOf('503') !== -1) return 'Pimath tiene mucha demanda. Intenta de nuevo en unos segundos.';
    return 'Hubo un problema de conexión. Intenta de nuevo.';
  }

  function extraer(texto) {
    var re = /```([a-zA-Z+#]*)[ \t]*\r?\n([\s\S]*?)```/g, m, mejor = null;
    while ((m = re.exec(texto))) {
      if (!mejor || m[2].length > mejor.code.length) mejor = { lang: (m[1] || '').toLowerCase(), code: m[2] };
    }
    if (!mejor) {
      var a = texto.indexOf('```');
      if (a >= 0) {
        var resto = texto.slice(a + 3), nl = resto.indexOf('\n');
        if (nl >= 0) mejor = { lang: resto.slice(0, nl).trim().toLowerCase(), code: resto.slice(nl + 1), truncado: true };
      } else if (/<!doctype html|<html/i.test(texto)) {
        mejor = { lang: 'html', code: texto };
      }
    }
    var expl = texto.replace(/```[\s\S]*?(```|$)/g, '').trim();
    return { codigo: mejor, expl: expl };
  }

  function ocupar(si) {
    ocupado = si;
    var b = $('pcGo');
    if (!b) return;
    b.innerHTML = si ? ICO_PARAR : ICO_ENVIAR;
    b.setAttribute('aria-label', si ? 'Detener' : 'Enviar');
  }

  // ¿El texto pegado parece código para corregir?
  function pareceCodigo(t) {
    if (t.length < 120 || t.split('\n').length < 4) return false;
    var simbolos = (t.match(/[{};=<>()]/g) || []).length;
    return simbolos / t.length > 0.04;
  }

  function enviar() {
    if (ocupado) { if (ctl) ctl.abort(); return; }
    var texto = $('pcIn').value.trim();
    if (!texto) { aviso('Escribe o dicta lo que quieres programar.'); return; }
    if (esPimath(texto)) {
      var t0 = nuevoTurno(texto);
      t0.act.style.display = 'none';
      t0.expl.style.display = 'block';
      t0.expl.textContent = MSG_PIMATH;
      $('pcIn').value = '';
      autoAjustar();
      return;
    }
    var pegado = pareceCodigo(texto);
    var mensaje, inicio, nombre, etiqueta = texto;
    if (pegado) {
      mensaje = { accion: 'corregir', codigo: texto, problema: '' };
      inicio = 'Leyendo tu código';
      nombre = 'Código corregido';
      etiqueta = 'Código pegado · ' + texto.split('\n').length + ' líneas';
    } else if (actual.code) {
      sincronizarEdicion();
      mensaje = { accion: 'cambiar', pedido: texto, codigo: actual.code, lang: actual.lang || 'html' };
      inicio = 'Leyendo tu código actual';
      nombre = actual.name;
    } else {
      mensaje = { accion: 'crear', pedido: texto };
      inicio = 'Entendiendo lo que pides';
      nombre = texto.slice(0, 40);
    }
    ejecutar(etiqueta, mensaje, inicio, nombre);
  }

  function ejecutar(etiqueta, mensaje, inicio, nombre) {
    var t = nuevoTurno(etiqueta);
    $('pcIn').value = '';
    autoAjustar();
    ocupar(true);
    actPaso(t, 'ini', inicio);
    llamar(mensaje, function (txt) { progreso(t, txt); }).then(function (texto) {
      var r = extraer(texto);
      if (!r.codigo || !r.codigo.code.trim()) {
        actFin(t, false, 'No generó código');
        t.expl.style.display = 'block';
        t.expl.textContent = r.expl || texto || 'No pude generar código. Intenta describirlo de otra forma.';
        return;
      }
      actPaso(t, 'rev', 'Revisando el resultado');
      if (!r.codigo.lang && /<(html|body|canvas|script)/i.test(r.codigo.code)) r.codigo.lang = 'html';
      aplicar(r.codigo, nombre);
      actFin(t, true);
      if (r.expl) { t.expl.style.display = 'block'; t.expl.textContent = r.expl; }
      if (r.codigo.truncado) aviso('El código llegó cortado. Pide "continúa" o un cambio más pequeño.');
      desplazarA($('pcCard'));
    }).catch(function (e) {
      if (e && e.name === 'AbortError') { actFin(t, false, 'Detenido'); return; }
      actFin(t, false, 'No se pudo completar');
      t.expl.style.display = 'block';
      t.expl.className = 'pc-expl err';
      t.expl.textContent = errorTexto(e && e.message);
    }).then(function () { ocupar(false); });
  }

  // ---------- Resultado ----------
  function esWeb() {
    var c = actual.code || '';
    return actual.lang === 'html' || (!actual.lang && /<(html|body|canvas|script)/i.test(c)) || /^\s*<!doctype html/i.test(c);
  }

  function aplicar(codigo, nombreSugerido) {
    if (actual.code) pila.push({ code: actual.code, lang: actual.lang });
    if (pila.length > 30) pila.shift();
    actual.code = codigo.code.replace(/\s+$/, '') + '\n';
    actual.lang = codigo.lang || (/<(html|body|canvas|script)/i.test(codigo.code) ? 'html' : '');
    if (/^(html|htm|xml)$/.test(actual.lang)) actual.lang = 'html';
    if (!actual.name) actual.name = (nombreSugerido || 'Proyecto').trim().slice(0, 60) || 'Proyecto';
    guardar();
    mostrarResultado();
  }

  function sincronizar() {
    var ta = $('pcCodigo');
    $('pcHl').scrollTop = ta.scrollTop;
    $('pcHl').scrollLeft = ta.scrollLeft;
  }

  function pintarCodigo() {
    $('pcHlCode').innerHTML = resaltar($('pcCodigo').value) + '\n';
    sincronizar();
  }

  function mostrarResultado() {
    $('pcCard').style.display = 'block';
    $('pcNombre').value = actual.name;
    $('pcCodigo').value = actual.code;
    var web = esWeb();
    $('pcTabVer').style.display = web ? '' : 'none';
    $('pcFull').style.display = web ? '' : 'none';
    $('pcDeshacer').disabled = !pila.length;
    actualizarEntrada();
    vistaVieja = true;
    pestana(web ? 'ver' : 'cod');
    pintarCodigo();
  }

  // Se inyecta en la vista previa: arregla el almacenamiento (que el aislamiento bloquea) y avisa de errores
  var SHIM = '<script>(function(){try{localStorage.getItem("x")}catch(e){var m={};var f={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}};try{Object.defineProperty(window,"localStorage",{value:f,configurable:true});Object.defineProperty(window,"sessionStorage",{value:f,configurable:true})}catch(x){}}' +
    'function av(t){try{parent.postMessage({pimathCode:"error",msg:String(t).slice(0,300)},"*")}catch(e){}}' +
    'window.addEventListener("error",function(e){av((e.message||"Error")+(e.filename&&e.lineno?"":""))});' +
    'window.addEventListener("unhandledrejection",function(e){av("Promesa rechazada: "+((e.reason&&e.reason.message)||e.reason))});})();<\/script>';

  function conShim(c) {
    var m = /<head(\s[^>]*)?>/i.exec(c) || /<html(\s[^>]*)?>/i.exec(c);
    if (m) return c.slice(0, m.index + m[0].length) + SHIM + c.slice(m.index + m[0].length);
    return SHIM + c;
  }

  var vistaVieja = true;
  function refrescarVista() {
    var cont = $('pcVer');
    cont.innerHTML = '';
    vistaVieja = false;
    ocultarError();
    if (!esWeb()) return;
    var f = document.createElement('iframe');
    f.className = 'pc-frame';
    // Sin allow-same-origin: el proyecto no puede leer los datos de Pimath IA
    f.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-pointer-lock allow-popups');
    f.srcdoc = conShim(actual.code);
    cont.appendChild(f);
  }

  var ultimoErrorJuego = '';
  function alMensaje(e) {
    var d = e.data;
    if (!d || d.pimathCode !== 'error') return;
    var f = app && app.querySelector('.pc-frame');
    if (!f || e.source !== f.contentWindow) return;
    ultimoErrorJuego = String(d.msg || 'Error');
    $('pcErrTxt').textContent = 'El proyecto tiene un error: ' + ultimoErrorJuego;
    $('pcErrBar').style.display = 'flex';
  }
  function ocultarError() { ultimoErrorJuego = ''; var b = $('pcErrBar'); if (b) b.style.display = 'none'; }

  function corregirError() {
    if (ocupado || !actual.code) return;
    var msg = ultimoErrorJuego || 'No funciona';
    ocultarError();
    ejecutar('Corregir el error del proyecto', { accion: 'corregir', codigo: actual.code, problema: 'Al ejecutar sale este error: ' + msg + '. Si algo no se ve o no responde, corrígelo también.' }, 'Leyendo el error', actual.name);
  }

  // Si editaste el código a mano, se aplica antes de ver, guardar o exportar
  function sincronizarEdicion() {
    var ta = $('pcCodigo');
    if (!ta || !actual.code) return false;
    var v = ta.value;
    if (v.trim() && v !== actual.code) {
      pila.push({ code: actual.code, lang: actual.lang });
      actual.code = v;
      guardar();
      $('pcDeshacer').disabled = !pila.length;
      return true;
    }
    return false;
  }

  function pestana(p) {
    var ver = p === 'ver' && esWeb();
    if (ver && sincronizarEdicion()) vistaVieja = true;
    $('pcVer').style.display = ver ? '' : 'none';
    $('pcCod').style.display = ver ? 'none' : '';
    if (ver && vistaVieja) refrescarVista();
    $('pcTabVer').classList.toggle('on', ver);
    $('pcTabCod').classList.toggle('on', !ver);
    if (!ver) { pintarCodigo(); }
  }

  function deshacer() {
    var v = pila.pop();
    if (!v) return;
    actual.code = v.code;
    actual.lang = v.lang;
    guardar();
    mostrarResultado();
    aviso('Volviste a la versión anterior');
  }

  function copiar() {
    sincronizarEdicion();
    try { navigator.clipboard.writeText(actual.code); aviso('Código copiado'); }
    catch (e) { var c = $('pcCodigo'); c.select(); try { document.execCommand('copy'); aviso('Código copiado'); } catch (x) {} }
  }

  function compartir() {
    sincronizarEdicion();
    if (!actual.code) return;
    var ext = esWeb() ? 'html' : (EXT[actual.lang] || 'txt');
    var nombre = slug(actual.name) + '.' + ext;
    try {
      var f = new File([actual.code], nombre, { type: esWeb() ? 'text/html' : 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: actual.name }).catch(function () {}); return; }
    } catch (e) {}
    if (navigator.share) { navigator.share({ title: actual.name, text: actual.code }).catch(function () {}); return; }
    copiar();
  }

  function pantallaCompleta() {
    if (!esWeb()) return;
    pestana('ver');
    var f = app.querySelector('.pc-frame');
    if (!f) return;
    f.classList.add('full');
    var x = el('button', '', 'Salir');
    x.className = 'pc-exit';
    x.addEventListener('click', function () { f.classList.remove('full'); x.remove(); });
    document.body.appendChild(x);
  }

  // ---------- Guardar proyectos ----------
  function guardar() {
    if (!actual.code) return false;
    var ahora = Date.now();
    if (!actual.id) actual.id = ahora.toString(36) + Math.random().toString(36).slice(2, 5);
    var existente = null;
    for (var i = 0; i < proyectos.length; i++) if (proyectos[i].id === actual.id) existente = proyectos[i];
    if (existente) {
      existente.name = actual.name; existente.code = actual.code; existente.lang = actual.lang; existente.updated = ahora;
    } else {
      proyectos.unshift({ id: actual.id, name: actual.name || 'Proyecto', code: actual.code, lang: actual.lang, updated: ahora });
    }
    proyectos.sort(function (a, b) { return b.updated - a.updated; });
    return persistir();
  }

  function hoja(titulo, llenar) {
    var viejo = document.getElementById('pcHoja');
    if (viejo) viejo.remove();
    var ov = el('div', '');
    ov.id = 'pcHoja';
    ov.className = 'pc-sheet';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    var card = el('div', '');
    card.className = 'pc-card';
    var cab = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;');
    cab.appendChild(el('h3', '', titulo));
    var x = el('button', 'border:none;background:none;font-size:1.7rem;line-height:1;cursor:pointer;color:#5f6368;', '×');
    x.type = 'button';
    x.addEventListener('click', function () { ov.remove(); });
    cab.appendChild(x);
    card.appendChild(cab);
    llenar(card, function () { ov.remove(); });
    ov.appendChild(card);
    document.body.appendChild(ov);
  }

  function abrirProyectos() {
    hoja('Mis proyectos', function (card, cerrarHoja) {
      if (!proyectos.length) {
        card.appendChild(el('p', 'color:#5f6368;', 'Aún no tienes proyectos. Crea uno y se guarda solo en este dispositivo.'));
        return;
      }
      proyectos.forEach(function (p) {
        var fila = el('div', '');
        fila.className = 'pc-item';
        var t = el('div', '');
        t.className = 't';
        t.appendChild(el('b', '', p.name || 'Proyecto'));
        t.appendChild(el('small', '', new Date(p.updated).toLocaleDateString() + ' · ' + (LENG[p.lang] || 'Web')));
        fila.appendChild(t);
        var del = el('button', '', 'Borrar');
        del.className = 'pc-btn';
        del.type = 'button';
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          if (del.dataset.c === '1') {
            proyectos = proyectos.filter(function (q) { return q.id !== p.id; });
            persistir();
            if (actual.id === p.id) nuevo();
            fila.remove();
          } else {
            del.dataset.c = '1';
            del.textContent = '¿Seguro?';
            setTimeout(function () { del.dataset.c = '0'; del.textContent = 'Borrar'; }, 2500);
          }
        });
        fila.appendChild(del);
        fila.addEventListener('click', function () {
          if (ocupado && ctl) ctl.abort();
          actual = { id: p.id, name: p.name, lang: p.lang, code: p.code };
          pila = [];
          $('pcFeed').innerHTML = '';
          cerrarHoja();
          mostrarResultado();
        });
        card.appendChild(fila);
      });
    });
  }

  // ---------- Descargar ----------
  function slug(t) {
    return normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'proyecto';
  }
  function bajar(blob, nombre) {
    var u = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = u;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
  }
  function descargar() {
    sincronizarEdicion();
    if (!actual.code) return;
    var ext = esWeb() ? 'html' : (EXT[actual.lang] || 'txt');
    bajar(new Blob([actual.code], { type: 'text/plain;charset=utf-8' }), slug(actual.name) + '.' + ext);
    aviso('Descargando ' + slug(actual.name) + '.' + ext);
  }

  // ---------- App instalable (.zip con index.html + manifest + service worker + icono) ----------
  function crc32(bytes) {
    var t = crc32.t;
    if (!t) {
      t = crc32.t = [];
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = t[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function crearZip(archivos) {
    var enc = new TextEncoder(), partes = [], central = [], offset = 0;
    archivos.forEach(function (f) {
      var nombre = enc.encode(f.name), datos = enc.encode(f.data), crc = crc32(datos);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true);
      h.setUint32(18, datos.length, true); h.setUint32(22, datos.length, true); h.setUint16(26, nombre.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nombre, datos);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true);
      c.setUint32(20, datos.length, true); c.setUint32(24, datos.length, true); c.setUint16(28, nombre.length, true);
      c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
      c.setUint32(38, 0, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), nombre);
      offset += 30 + nombre.length + datos.length;
    });
    var tam = 0;
    central.forEach(function (p) { tam += p.length; });
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(4, 0, true); e.setUint16(6, 0, true);
    e.setUint16(8, archivos.length, true); e.setUint16(10, archivos.length, true);
    e.setUint32(12, tam, true); e.setUint32(16, offset, true); e.setUint16(20, 0, true);
    return new Blob(partes.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }

  function descargarApp() {
    sincronizarEdicion();
    if (!actual.code || !esWeb()) return;
    var nombre = actual.name || 'Mi app';
    var html = actual.code;
    var cabeza = '<link rel="manifest" href="manifest.json"><meta name="theme-color" content="#B8791E"><link rel="icon" href="icon.svg">';
    var registro = '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js")}<\/script>';
    html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, cabeza + '</head>') : cabeza + html;
    var i = html.toLowerCase().lastIndexOf('</body>');
    html = i >= 0 ? html.slice(0, i) + registro + html.slice(i) : html + registro;
    var manifest = JSON.stringify({
      name: nombre, short_name: nombre.slice(0, 12), start_url: '.', scope: '.', display: 'standalone',
      background_color: '#ffffff', theme_color: '#B8791E',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    }, null, 2);
    var sw = "var C='app-v1';\nself.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','index.html','icon.svg'])}));self.skipWaiting()});\n" +
      "self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});\n" +
      "self.addEventListener('fetch',function(e){e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request).catch(function(){return caches.match('index.html')})}))});\n";
    var icono = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#B8791E"/><text x="256" y="340" font-size="260" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">' +
      (nombre.trim().charAt(0).toUpperCase().replace(/[<>&"]/g, '') || 'P') + '</text></svg>';
    var leeme = 'APP INSTALABLE - ' + nombre + '\n\n' +
      'Contenido: index.html (tu app), manifest.json, sw.js e icon.svg.\n\n' +
      'Para instalarla en el celular:\n' +
      '1. Sube estos 4 archivos a un hosting con https (Vercel, Netlify o GitHub Pages).\n' +
      '2. Abre el enlace en Chrome.\n' +
      '3. Toca el menú de Chrome > "Instalar app" o "Añadir a la pantalla de inicio".\n\n' +
      'Creada con Pimath Code.\n';
    var zip = crearZip([
      { name: 'index.html', data: html }, { name: 'manifest.json', data: manifest },
      { name: 'sw.js', data: sw }, { name: 'icon.svg', data: icono }, { name: 'LEEME.txt', data: leeme }
    ]);
    bajar(zip, slug(nombre) + '-app.zip');
    aviso('Descargando la app instalable. Dentro del .zip está LEEME.txt con los pasos.');
  }

  window.__pimathAbrirCodigo = abrir;

  // ---------- Opción "Pimath Code" en el menú lateral ----------
  var ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/><path d="M14 4l-4 16"/></svg>';
  var ICONO_MIC = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';
  var ICONO_GRAF = '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>';
  function arreglarIconos() {
    var nav = $('pxMenuLat');
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.pxm-item'), function (b) {
      var sp = b.querySelector('span'), sv = b.querySelector('svg');
      if (!sp || !sv) return;
      if (sp.textContent === 'Hablar') { sv.innerHTML = ICONO_MIC; b.classList.remove('pxm-voz'); }
      if (sp.textContent === 'Progreso') { sv.innerHTML = ICONO_GRAF; }
    });
  }
  function alAbrirDesdeMenu() {
    try { if (typeof closeSidebar === 'function') closeSidebar(); } catch (e) {}
    setTimeout(abrir, 180);
  }
  function agregarAlMenu() {
    if ($('pcMenuItem')) { arreglarIconos(); return true; }
    var nav = $('pxMenuLat');
    if (!nav) return false;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'pcMenuItem';
    b.className = 'pxm-item';
    b.innerHTML = ICONO + '<span>Pimath Code</span>';
    b.addEventListener('click', alAbrirDesdeMenu);
    nav.insertBefore(b, nav.firstChild);
    arreglarIconos();
    return true;
  }
  function agregarRespaldo() {
    var sb = $('sidebar'), nuevoBtn = $('sidebarNewChat');
    if (!sb || !nuevoBtn || $('pcMenuItem')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'pcMenuItem';
    b.textContent = 'Pimath Code';
    b.style.cssText = 'width:100%;padding:12px 8px;border:none;background:none;text-align:left;font:inherit;font-size:1.05rem;cursor:pointer;color:#1C2620;';
    b.addEventListener('click', alAbrirDesdeMenu);
    sb.insertBefore(b, nuevoBtn);
  }

  function iniciar() {
    var n = 0;
    (function esperar() {
      if (agregarAlMenu()) return;
      if (++n < 60) setTimeout(esperar, 250);
      else agregarRespaldo();
    })();
  }
  if (document.readyState === 'complete') iniciar(); else window.addEventListener('load', iniciar);
})();
