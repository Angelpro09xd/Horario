/* ===========================================================================
   REFRACCIÓN · cristal líquido de verdad
   -----------------------------------------------------------------------
   Un `backdrop-filter: blur()` solo empaña lo que hay detrás. El cristal de
   verdad además lo DESVÍA: la luz se dobla al entrar y salir del bisel, así
   que el borde de la pieza arrastra y estira la imagen de fondo, y una
   reflexión especular recorre ese mismo bisel.

   Receta (técnica de github.com/archisvaze/liquid-glass, reescrita aquí):
     1. Se calcula el perfil de refracción del bisel con la ley de Snell, a
        partir del grosor del cristal, el ancho del bisel y el índice de
        refracción.
     2. Ese perfil se pinta en un mapa de desplazamiento: en cada píxel del
        bisel, R y G codifican cuánto se desvía la imagen en x e y (128 es
        «no desvíes»).
     3. Otro mapa pinta el brillo especular del bisel según el ángulo de la
        luz.
     4. Un filtro SVG encadena feImage → feDisplacementMap → especular, y se
        aplica con `backdrop-filter: url(#id)`.

   Solo Chromium admite `backdrop-filter: url()`. En el resto no se toca
   nada y queda el desenfoque de siempre.
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});

  /* Qué piezas llevan refracción, según piel y nivel.
       «completa» → toda la superficie de cristal.
       «barras»   → solo la capa funcional (barras, carril, hojas), que es
                    además lo único que las guías de Apple permiten
                    acristalar y lo que menos cuesta de pintar.
     El filtro es caro: mide ~27 % más que un desenfoque normal, así que en
     equipos modestos se arranca en «barras». */
  var FUNCIONAL = '.topbar, .rail, .tabbar, .modal, .palette, .toast, .day-picker';
  var PIEZAS = {
    glass: { completa: '.glass, .cell', barras: FUNCIONAL },
    apple: { completa: FUNCIONAL, barras: FUNCIONAL }
  };

  /* Un equipo se considera holgado si tiene puntero fino (ratón) y varios
     núcleos. Si no, mejor empezar por lo barato. */
  function nivelAutomatico() {
    var finos = global.matchMedia && global.matchMedia('(pointer: fine)').matches;
    var nucleos = global.navigator.hardwareConcurrency || 4;
    var memoria = global.navigator.deviceMemory || 4;
    return (finos && nucleos >= 4 && memoria >= 4) ? 'completa' : 'barras';
  }

  function nivel() {
    var v = HX.store.get('settings.refraction', 'auto');
    if (v === true) v = 'completa';          /* valor antiguo */
    if (v === false) v = 'apagada';
    if (v === 'auto' || !v) {
      v = nivelAutomatico();
      HX.store.set('settings.refraction', v);
    }
    return v;
  }

  var PASO = 8;            /* los tamaños se redondean: menos filtros */
  var MAX_FILTROS = 30;
  var MIN_W = 48, MIN_H = 26;

  var defs = null;
  var cache = {};          /* clave «w×h×r» → id del filtro */
  var nFiltros = 0;
  var pendiente = null;

  var SOPORTA = (function () {
    try {
      return !!(global.CSS && CSS.supports &&
        (CSS.supports('backdrop-filter', 'url(#x)') ||
         CSS.supports('-webkit-backdrop-filter', 'url(#x)')));
    } catch (e) { return false; }
  })();

  /* --- 1. Perfil de refracción del bisel (Snell) ------------------------- */
  function perfilRefraccion(grosor, bisel, ior, muestras) {
    var eta = 1 / ior;
    var perfil = new Float64Array(muestras);

    /* Superficie del bisel: un cuarto de circunferencia. */
    function altura(x) { return Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))); }

    for (var i = 0; i < muestras; i++) {
      var x = i / muestras;
      var y = altura(x);
      var dx = x < 1 ? 0.0001 : -0.0001;
      var deriv = (altura(x + dx) - y) / dx;
      var mag = Math.sqrt(deriv * deriv + 1);
      var nx = -deriv / mag, ny = -1 / mag;

      var k = 1 - eta * eta * (1 - ny * ny);
      if (k < 0) { perfil[i] = 0; continue; }          /* reflexión total */
      var sq = Math.sqrt(k);
      var rx = -(eta * ny + sq) * nx;
      var ry = eta - (eta * ny + sq) * ny;
      perfil[i] = ry ? rx * ((y * bisel + grosor) / ry) : 0;
    }
    return perfil;
  }

  /* --- 2. Mapa de desplazamiento ---------------------------------------- */
  function mapaDesplazamiento(w, h, r, bisel, perfil, maxDesp) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) { d[i] = 128; d[i + 1] = 128; d[i + 2] = 0; d[i + 3] = 255; }

    var rSq = r * r, r1Sq = (r + 1) * (r + 1);
    var rBSq = Math.max(r - bisel, 0); rBSq *= rBSq;
    var wB = w - r * 2, hB = h - r * 2, S = perfil.length;

    for (var y1 = 0; y1 < h; y1++) {
      for (var x1 = 0; x1 < w; x1++) {
        var x = x1 < r ? x1 - r : (x1 >= w - r ? x1 - r - wB : 0);
        var y = y1 < r ? y1 - r : (y1 >= h - r ? y1 - r - hB : 0);
        var dSq = x * x + y * y;
        if (dSq > r1Sq || dSq < rBSq) continue;        /* fuera del bisel */
        var dist = Math.sqrt(dSq);
        if (dist === 0) continue;
        var op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
        if (op <= 0) continue;
        var bi = Math.min(((r - dist) / bisel * S) | 0, S - 1);
        var desp = perfil[bi] || 0;
        var idx = (y1 * w + x1) * 4;
        d[idx]     = (128 + (-(x / dist) * desp) / maxDesp * 127 * op + 0.5) | 0;
        d[idx + 1] = (128 + (-(y / dist) * desp) / maxDesp * 127 * op + 0.5) | 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  /* --- 3. Mapa especular ------------------------------------------------- */
  function mapaEspecular(w, h, r, bisel, angulo) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;

    var rSq = r * r, r1Sq = (r + 1) * (r + 1);
    var rBSq = Math.max(r - bisel, 0); rBSq *= rBSq;
    var wB = w - r * 2, hB = h - r * 2;
    var lx = Math.cos(angulo), ly = Math.sin(angulo);

    for (var y1 = 0; y1 < h; y1++) {
      for (var x1 = 0; x1 < w; x1++) {
        var x = x1 < r ? x1 - r : (x1 >= w - r ? x1 - r - wB : 0);
        var y = y1 < r ? y1 - r : (y1 >= h - r ? y1 - r - hB : 0);
        var dSq = x * x + y * y;
        if (dSq > r1Sq || dSq < rBSq) continue;
        var dist = Math.sqrt(dSq);
        if (dist === 0) continue;
        var op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
        if (op <= 0) continue;
        var punto = Math.abs((x / dist) * lx + (-y / dist) * ly);
        var borde = Math.sqrt(Math.max(0, 1 - (1 - (r - dist)) * (1 - (r - dist))));
        var coef = punto * borde;
        var col = (255 * coef) | 0;
        var idx = (y1 * w + x1) * 4;
        d[idx] = col; d[idx + 1] = col; d[idx + 2] = col;
        d[idx + 3] = (col * coef * op) | 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  /* --- 4. Filtro SVG ----------------------------------------------------- */
  function asegurarDefs() {
    if (defs) return defs;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'lg-defs');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    document.body.appendChild(svg);
    defs = svg;
    return svg;
  }

  function crearFiltro(w, h, r) {
    var clave = w + 'x' + h + 'r' + r;
    if (cache[clave]) return cache[clave];
    if (nFiltros >= MAX_FILTROS) return null;

    /* Las piezas grandes se calculan a media resolución: el mapa es un
       degradado suave, no se nota, y cuesta la cuarta parte. */
    var esc = (w * h > 150000) ? 0.5 : 1;
    var mw = Math.max(8, Math.round(w * esc));
    var mh = Math.max(8, Math.round(h * esc));
    var mr = Math.max(2, Math.round(r * esc));

    var bisel = Math.min(Math.max(5, mr * 0.75), mr - 1, Math.min(mw, mh) / 2 - 1);
    if (!(bisel > 1)) return null;

    var perfil = perfilRefraccion(26, bisel, 1.48, 96);
    var maxDesp = 1;
    for (var i = 0; i < perfil.length; i++) maxDesp = Math.max(maxDesp, Math.abs(perfil[i]));

    var urlDesp, urlEsp;
    try {
      urlDesp = mapaDesplazamiento(mw, mh, mr, bisel, perfil, maxDesp);
      urlEsp = mapaEspecular(mw, mh, mr, Math.min(bisel * 2.2, mr), Math.PI / 3);
    } catch (e) {
      return null;                       /* lienzo no disponible: sin refracción */
    }

    var id = 'lg-' + clave;
    var ns = 'http://www.w3.org/2000/svg';
    var f = document.createElementNS(ns, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '0%'); f.setAttribute('y', '0%');
    f.setAttribute('width', '100%'); f.setAttribute('height', '100%');
    f.innerHTML =
      '<feImage href="' + urlDesp + '" x="0" y="0" width="' + w + '" height="' + h + '" result="mapa"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="mapa" scale="' + (maxDesp / esc * 0.85).toFixed(2) +
        '" xChannelSelector="R" yChannelSelector="G" result="desviado"/>' +
      '<feImage href="' + urlEsp + '" x="0" y="0" width="' + w + '" height="' + h + '" result="brillo"/>' +
      '<feComponentTransfer in="brillo" result="brillo_suave">' +
        '<feFuncA type="linear" slope="0.42"/>' +
      '</feComponentTransfer>' +
      '<feBlend in="brillo_suave" in2="desviado" mode="screen"/>';

    asegurarDefs().appendChild(f);
    nFiltros++;
    cache[clave] = id;
    return id;
  }

  /* --- Aplicación a los elementos ---------------------------------------- */
  function selector() {
    var piel = PIEZAS[HX.skins.current().id];
    if (!piel) return null;
    var n = nivel();
    return n === 'apagada' ? null : (piel[n] || piel.barras);
  }

  function activa() {
    if (!SOPORTA) return false;
    if (HX.store.get('settings.reduceMotion')) return false;
    if (global.matchMedia && global.matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
    return !!selector();
  }

  function redondea(v) { return Math.max(PASO, Math.round(v / PASO) * PASO); }

  function aplicar(el) {
    var caja = el.getBoundingClientRect();
    if (caja.width < MIN_W || caja.height < MIN_H) { el.style.removeProperty('--lg-filtro'); return; }

    var w = redondea(caja.width), h = redondea(caja.height);
    var radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    radio = Math.min(Math.round(radio) || 8, Math.floor(Math.min(w, h) / 2) - 1);
    if (radio < 3) radio = 3;

    var id = crearFiltro(w, h, radio);
    if (id) el.style.setProperty('--lg-filtro', 'url(#' + id + ')');
    else el.style.removeProperty('--lg-filtro');
  }

  function limpiar() {
    var todos = document.querySelectorAll('[style*="--lg-filtro"]');
    for (var i = 0; i < todos.length; i++) todos[i].style.removeProperty('--lg-filtro');
    document.body.dataset.refraccion = 'off';
  }

  function escanear() {
    /* Se limpia siempre antes: al bajar de nivel, las piezas que ya no
       refractan deben soltar su filtro. */
    limpiar();
    var sel = activa() ? selector() : null;
    if (!sel) return;
    document.body.dataset.refraccion = 'on';
    var piezas = document.querySelectorAll(sel);
    for (var i = 0; i < piezas.length; i++) aplicar(piezas[i]);
  }

  function pedirEscaneo(retardo) {
    clearTimeout(pendiente);
    pendiente = setTimeout(function () {
      requestAnimationFrame(escanear);
    }, retardo || 60);
  }

  function reiniciar() {
    /* Al cambiar de piel cambian radios y tamaños: se tira la caché. */
    if (defs) { defs.remove(); defs = null; }
    cache = {}; nFiltros = 0;
    pedirEscaneo(30);
  }

  function init() {
    if (!SOPORTA) {
      document.body.dataset.refraccion = 'nosoportado';
      return;
    }
    global.addEventListener('resize', function () { reiniciar(); }, { passive: true });
    pedirEscaneo(120);
  }

  HX.glass = {
    soportado: SOPORTA,
    init: init,
    scan: pedirEscaneo,
    reset: reiniciar,
    activa: activa,
    nivel: nivel,
    nivelAutomatico: nivelAutomatico
  };
})(window);
