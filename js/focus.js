/* ===========================================================================
   MODO FOCO — la clase actual a pantalla completa + temporizador pomodoro
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var D = HX.data, T = HX.time, U = HX.ui, store = HX.store;
  var el = U.el, icon = U.icon;

  var node = null, refs = {}, isOpen = false;
  var pomo = { on: false, running: false, ends: 0, left: 25 * 60000, mode: 'work', cycles: 0 };
  var WORK = 25 * 60000, REST = 5 * 60000;

  function build() {
    refs.code = el('div', { class: 'focus-code', text: '—' });
    refs.sub = el('div', { class: 'focus-sub', text: '' });
    refs.count = el('div', { class: 'focus-count mono', text: '00:00' });
    refs.label = el('div', { class: 'eyebrow', text: 'Restante' });
    refs.meter = el('div', { class: 'meter' }, el('i'));
    refs.pomoBtn = el('button', { class: 'btn', type: 'button', html: icon('target') + '<span>Pomodoro</span>', onclick: togglePomo });
    refs.playBtn = el('button', { class: 'btn primary hidden', type: 'button', html: icon('play') + '<span>Empezar</span>', onclick: toggleRun });
    refs.resetBtn = el('button', { class: 'btn ghost hidden', type: 'button', html: icon('refresh') + '<span>Reiniciar</span>', onclick: resetPomo });
    refs.cycles = el('div', { class: 'view-sub hidden' });

    node = el('div', { class: 'focus', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Modo foco' }, [
      el('button', { class: 'icon-btn focus-close', type: 'button', 'aria-label': 'Salir del modo foco', html: icon('shrink'), onclick: close }),
      el('div', { class: 'focus-inner' }, [
        refs.label,
        refs.code,
        refs.sub,
        refs.count,
        el('div', { class: 'focus-meter' }, refs.meter),
        refs.cycles,
        el('div', { class: 'focus-actions' }, [
          refs.pomoBtn, refs.playBtn, refs.resetBtn,
          el('button', { class: 'btn ghost', type: 'button', html: icon('shrink') + '<span>Salir</span>', onclick: close })
        ])
      ])
    ]);
    document.body.appendChild(node);
  }

  function togglePomo() {
    pomo.on = !pomo.on;
    if (pomo.on) {
      pomo.mode = 'work'; pomo.left = WORK; pomo.running = false;
      refs.pomoBtn.classList.add('primary');
    } else {
      pomo.running = false;
      refs.pomoBtn.classList.remove('primary');
    }
    refs.playBtn.classList.toggle('hidden', !pomo.on);
    refs.resetBtn.classList.toggle('hidden', !pomo.on);
    refs.cycles.classList.toggle('hidden', !pomo.on);
    HX.fx.tap();
    paint();
  }

  function toggleRun() {
    if (!pomo.on) return;
    pomo.running = !pomo.running;
    if (pomo.running) pomo.ends = Date.now() + pomo.left;
    else pomo.left = Math.max(0, pomo.ends - Date.now());
    refs.playBtn.innerHTML = icon(pomo.running ? 'pause' : 'play') +
      '<span>' + (pomo.running ? 'Pausar' : 'Seguir') + '</span>';
    HX.fx.tap('up');
    paint();
  }

  function resetPomo() {
    pomo.running = false;
    pomo.mode = 'work';
    pomo.left = WORK;
    refs.playBtn.innerHTML = icon('play') + '<span>Empezar</span>';
    paint();
  }

  function pomoTick() {
    if (!pomo.on || !pomo.running) return;
    var left = pomo.ends - Date.now();
    if (left > 0) { pomo.left = left; return; }
    /* cambio de fase */
    if (pomo.mode === 'work') {
      pomo.cycles++;
      pomo.mode = 'rest'; pomo.left = REST;
      HX.fx.play('alert'); HX.fx.buzz([40, 60, 40]);
      U.toast('Pomodoro completado · descansa 5 min', 'ok', 5000);
      HX.notify.send('Descanso', 'Has completado un pomodoro. Estira las piernas.');
    } else {
      pomo.mode = 'work'; pomo.left = WORK;
      HX.fx.play('up'); HX.fx.buzz(30);
      U.toast('De vuelta al lío · 25 min', 'info', 5000);
      HX.notify.send('A trabajar', 'Se acabó el descanso.');
    }
    pomo.ends = Date.now() + pomo.left;
  }

  function paint() {
    if (!isOpen) return;
    var snap = T.snapshot();
    var current = snap.current;
    var subject = current && current.subject ? D.subject(current.subject) :
      (snap.upcoming ? D.subject(snap.upcoming.subject) : null);
    var color = subject ? subject.neon : 'var(--accent)';
    node.style.setProperty('--c', color);

    if (pomo.on) {
      var left = pomo.running ? Math.max(0, pomo.ends - Date.now()) : pomo.left;
      var total = pomo.mode === 'work' ? WORK : REST;
      refs.label.textContent = pomo.mode === 'work' ? 'Pomodoro · concentración' : 'Pomodoro · descanso';
      refs.count.textContent = T.countdown(left);
      refs.meter.firstChild.style.setProperty('--p', ((1 - left / total) * 100).toFixed(1) + '%');
      refs.cycles.textContent = pomo.cycles + ' pomodoros completados hoy';
    } else if (current && current.subject) {
      refs.label.textContent = 'Tiempo restante de clase';
      refs.count.textContent = T.countdown(snap.remaining);
      refs.meter.firstChild.style.setProperty('--p', ((snap.progress || 0) * 100).toFixed(1) + '%');
    } else if (snap.phase === 'break') {
      refs.label.textContent = 'Recreo';
      refs.count.textContent = T.countdown(snap.remaining);
      refs.meter.firstChild.style.setProperty('--p', ((snap.progress || 0) * 100).toFixed(1) + '%');
    } else {
      refs.label.textContent = 'Para la próxima clase';
      refs.count.textContent = snap.untilNext != null && snap.untilNext < 86400000
        ? T.countdown(snap.untilNext) : T.human(snap.untilNext);
      refs.meter.firstChild.style.setProperty('--p', '0%');
    }

    if (subject) {
      refs.code.textContent = current && current.subject ? subject.code : subject.code;
      refs.sub.textContent = subject.name + ' · ' + D.TEACHERS[subject.teacher].name +
        (current && current.subject ? ' · hasta las ' + T.clock(current.end) :
          (snap.upcoming ? ' · ' + T.longDate(snap.upcoming.start) + ' a las ' + T.clock(snap.upcoming.start) : ''));
    } else {
      refs.code.textContent = snap.holiday ? 'FESTIVO' : 'LIBRE';
      refs.sub.textContent = snap.holiday ? snap.holiday.name : 'No hay clase ahora mismo';
    }
  }

  function open() {
    if (!node) build();
    isOpen = true;
    node.classList.add('open');
    paint();
    HX.fx.tap('up');
    if (document.documentElement.requestFullscreen && store.get('settings.density') !== 'never') {
      /* pantalla completa real solo si el usuario ya interactuó y el navegador lo permite */
      var p = document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () { /* el navegador puede negarlo */ });
    }
  }

  function close() {
    isOpen = false;
    if (node) node.classList.remove('open');
    if (document.fullscreenElement && document.exitFullscreen) {
      var p = document.exitFullscreen();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function toggle() { isOpen ? close() : open(); }

  function tick() {
    if (!isOpen) return;
    pomoTick();
    paint();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) { e.stopPropagation(); close(); }
    if (e.code === 'Space' && isOpen && pomo.on) { e.preventDefault(); toggleRun(); }
  });

  HX.focus = { open: open, close: close, toggle: toggle, tick: tick, get isOpen() { return isOpen; } };
})(window);
