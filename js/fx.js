/* ===========================================================================
   FX — fondo animado, halo del cursor, sonido y vibración
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var store = HX.store;

  /* ---------------------------------------------------------------- fondo */
  var canvas = null, ctx = null, particles = [], raf = null, running = false;
  var W = 0, H = 0, dpr = 1;
  var particleStyle = 'constellation';
  var t0 = 0;

  function accentRGB() {
    var probe = document.createElement('span');
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#35e7ff';
    document.body.appendChild(probe);
    var rgb = getComputedStyle(probe).color;
    probe.remove();
    var m = rgb.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [53, 231, 255];
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    var area = W * H;
    particles = [];

    if (particleStyle === 'bokeh') {
      /* Material: pocas manchas grandes y lentas, sin líneas. */
      var blobs = Math.max(5, Math.min(14, Math.round(area / 150000)));
      for (var b = 0; b < blobs; b++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.13, vy: (Math.random() - 0.5) * 0.13,
          r: 40 + Math.random() * 110,
          a: 0.05 + Math.random() * 0.07,
          hue: Math.floor(Math.random() * 3)
        });
      }
      return;
    }

    if (particleStyle === 'grid') {
      /* Telemetría: cruces en una retícula regular que parpadean. */
      var step = 96;
      for (var gx = step / 2; gx < W; gx += step) {
        for (var gy = step / 2; gy < H; gy += step) {
          particles.push({ x: gx, y: gy, a: 0.1 + Math.random() * 0.2, ph: Math.random() * 6.28 });
        }
      }
      return;
    }

    var count = Math.max(18, Math.min(88, Math.round(area / 22000)));
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.7 + 0.5,
        a: Math.random() * 0.5 + 0.2
      });
    }
  }

  var color = [53, 231, 255];
  var accent2RGB = [255, 78, 205];
  var accent3RGB = [155, 91, 255];

  function varRGB(nombre, respaldo) {
    var probe = document.createElement('span');
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || respaldo;
    document.body.appendChild(probe);
    var rgb = getComputedStyle(probe).color;
    probe.remove();
    var m = rgb.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [53, 231, 255];
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var c = color, i, p;
    var now = (Date.now() - t0) / 1000;

    /* --- Material: manchas tonales grandes, difusas y lentas --- */
    if (particleStyle === 'bokeh') {
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -p.r) p.x = W + p.r; else if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H + p.r; else if (p.y > H + p.r) p.y = -p.r;
        var pulso = 1 + Math.sin(now * 0.4 + i) * 0.08;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * pulso);
        var col = p.hue === 0 ? c : (p.hue === 1 ? accent2RGB : accent3RGB);
        g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + p.a + ')');
        g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulso, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
      return;
    }

    /* --- Telemetría: cruces en retícula y un barrido que las enciende --- */
    if (particleStyle === 'grid') {
      var barrido = (now * 140) % (H + 400) - 200;
      ctx.lineWidth = 1;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var cerca = Math.max(0, 1 - Math.abs(p.y - barrido) / 150);
        var alfa = p.a * (0.5 + 0.5 * Math.sin(now * 1.6 + p.ph)) + cerca * 0.55;
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alfa.toFixed(3) + ')';
        var t = 3 + cerca * 3;
        ctx.beginPath();
        ctx.moveTo(p.x - t, p.y); ctx.lineTo(p.x + t, p.y);
        ctx.moveTo(p.x, p.y - t); ctx.lineTo(p.x, p.y + t);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.12)';
      ctx.beginPath();
      ctx.moveTo(0, barrido); ctx.lineTo(W, barrido);
      ctx.stroke();
      raf = requestAnimationFrame(frame);
      return;
    }

    /* --- Cristal: constelación de puntos unidos --- */
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + p.a + ')';
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();

      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          var alpha = (1 - d2 / 15000) * 0.16;
          ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function startBG() {
    if (!canvas || running) return;
    running = true;
    t0 = Date.now();
    refreshBG();
    resize(); seed();
    raf = requestAnimationFrame(frame);
  }

  function stopBG() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function refreshBG() {
    color = accentRGB();
    accent2RGB = varRGB('--accent-2', '#ff4ecd');
    accent3RGB = varRGB('--accent-3', '#9b5bff');
  }

  /* --------------------------------------------------------------- cursor */
  var glowNode = null, gx = 0, gy = 0, tx = 0, ty = 0, glowRaf = null;

  function glowLoop() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    if (glowNode) glowNode.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
    glowRaf = requestAnimationFrame(glowLoop);
  }

  function initCursor() {
    glowNode = document.querySelector('.cursor-glow');
    if (!glowNode) return;
    global.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      document.body.classList.add('has-pointer');
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });
    glowLoop();
  }

  /* ---------------------------------------------------------- inclinación */
  /* Las tarjetas se inclinan hacia el cursor. Solo con ratón, solo en las
     pieles con profundidad, y nunca con movimiento reducido. */
  var tiltNode = null, tiltRaf = null, tiltTo = { rx: 0, ry: 0, lift: 0 };

  function tiltAllowed() {
    if (!store.get('settings.tilt') || store.get('settings.reduceMotion')) return false;
    var id = HX.skins.current().id;
    return id === 'glass' || id === 'material';
  }

  function applyTilt() {
    if (!tiltNode) return;
    tiltNode.style.transform =
      'perspective(760px) rotateX(' + tiltTo.rx.toFixed(2) + 'deg) rotateY(' + tiltTo.ry.toFixed(2) + 'deg) ' +
      'translate3d(0,' + tiltTo.lift.toFixed(1) + 'px,0) scale(' + (tiltTo.lift ? 1.015 : 1) + ')';
    tiltRaf = null;
  }

  function queueTilt() {
    if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
  }

  function initTilt() {
    document.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse' || !tiltAllowed()) return;
      var card = e.target.closest && e.target.closest('.cell, .subject-card, .exam-card');
      if (!card || card === tiltNode) return;
      resetTilt();
      tiltNode = card;
      tiltNode.style.willChange = 'transform';
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!tiltNode || e.pointerType !== 'mouse') return;
      var r = tiltNode.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      tiltTo.ry = px * 9;
      tiltTo.rx = -py * 7;
      tiltTo.lift = -4;
      queueTilt();
    }, { passive: true });

    document.addEventListener('pointerout', function (e) {
      if (!tiltNode) return;
      if (e.relatedTarget && tiltNode.contains(e.relatedTarget)) return;
      resetTilt();
    }, { passive: true });

    document.addEventListener('scroll', resetTilt, { passive: true, capture: true });
  }

  function resetTilt() {
    if (!tiltNode) return;
    tiltNode.style.transform = '';
    tiltNode.style.willChange = '';
    tiltNode = null;
    tiltTo = { rx: 0, ry: 0, lift: 0 };
  }

  /* --------------------------------------------------------------- sonido */
  var actx = null;

  function audio() {
    if (!store.get('settings.sound')) return null;
    if (!actx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { actx = new AC(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  var TONES = {
    tap:   [[660, 0.05, 'triangle', 0.05]],
    ok:    [[740, 0.07, 'sine', 0.06], [1110, 0.12, 'sine', 0.05]],
    up:    [[520, 0.06, 'square', 0.03], [780, 0.09, 'square', 0.03]],
    down:  [[300, 0.12, 'sawtooth', 0.04]],
    alert: [[880, 0.1, 'sine', 0.05], [660, 0.1, 'sine', 0.05], [880, 0.18, 'sine', 0.05]]
  };

  function play(name) {
    var a = audio();
    if (!a) return;
    var seq = TONES[name] || TONES.tap;
    var t = a.currentTime;
    seq.forEach(function (step, i) {
      var osc = a.createOscillator(), gain = a.createGain();
      osc.type = step[2];
      osc.frequency.setValueAtTime(step[0], t + i * 0.06);
      gain.gain.setValueAtTime(0.0001, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(step[3], t + i * 0.06 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + step[1]);
      osc.connect(gain); gain.connect(a.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + step[1] + 0.05);
    });
  }

  function buzz(pattern) {
    if (!store.get('settings.haptics')) return;
    if (global.navigator && navigator.vibrate) {
      try { navigator.vibrate(pattern || 12); } catch (e) { /* ignorado */ }
    }
  }

  function tap(kind) { play(kind || 'tap'); buzz(kind === 'ok' ? [10, 30, 14] : 10); }

  /* -------------------------------------------------------------- ajustes */
  function applySettings() {
    var s = store.state.settings;
    var root = document.documentElement;
    var skin = HX.skins.byId(s.skin || 'glass');
    root.setAttribute('data-skin', skin.id);
    root.setAttribute('data-theme', s.theme || 'aurora');
    root.style.colorScheme = skin.light ? 'light' : 'dark';
    if (s.accent) root.style.setProperty('--accent', s.accent); else root.style.removeProperty('--accent');
    root.style.setProperty('--blur', (s.blur || 22) + 'px');
    root.style.setProperty('--glow', String(s.glow == null ? 1 : s.glow));

    document.body.dataset.motion = s.reduceMotion ? 'off' : 'on';
    document.body.dataset.density = s.density || 'comfy';

    var grain = document.querySelector('.grain');
    var scan = document.querySelector('.scanlines');
    var grid = document.querySelector('.bg-grid');
    if (grain) grain.classList.toggle('hidden', !s.grain);
    if (scan) scan.classList.toggle('hidden', !s.scanlines);
    if (grid) grid.classList.toggle('hidden', !!s.reduceMotion);
    if (glowNode) glowNode.classList.toggle('hidden', !s.cursorGlow);

    particleStyle = skin.particles || 'constellation';
    document.body.dataset.tilt = s.tilt ? 'on' : 'off';
    if (s.particles && !s.reduceMotion && particleStyle !== 'none') startBG(); else stopBG();
    refreshBG();
    if (running) seed();

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg-0').trim() || '#04050b');
  }

  /* --------------------------------------------------------------- inicio */
  function init() {
    canvas = document.querySelector('.bg-canvas');
    if (canvas && canvas.getContext) ctx = canvas.getContext('2d');
    initCursor();
    initTilt();
    global.addEventListener('resize', function () { resize(); seed(); }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopBG();
      else if (store.get('settings.particles') && !store.get('settings.reduceMotion')) startBG();
    });
    applySettings();
  }

  HX.fx = {
    init: init, applySettings: applySettings, play: play, buzz: buzz, tap: tap,
    startBG: startBG, stopBG: stopBG, resetTilt: resetTilt
  };
})(window);
