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
    var count = Math.max(18, Math.min(88, Math.round(area / 22000)));
    particles = [];
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

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var c = color;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
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
    color = accentRGB();
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
    root.setAttribute('data-theme', s.theme || 'aurora');
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

    if (s.particles && !s.reduceMotion) startBG(); else stopBG();
    refreshBG();

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg-0').trim() || '#04050b');
  }

  /* --------------------------------------------------------------- inicio */
  function init() {
    canvas = document.querySelector('.bg-canvas');
    if (canvas && canvas.getContext) ctx = canvas.getContext('2d');
    initCursor();
    global.addEventListener('resize', function () { resize(); seed(); }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopBG();
      else if (store.get('settings.particles') && !store.get('settings.reduceMotion')) startBG();
    });
    applySettings();
  }

  HX.fx = {
    init: init, applySettings: applySettings, play: play, buzz: buzz, tap: tap,
    startBG: startBG, stopBG: stopBG
  };
})(window);
