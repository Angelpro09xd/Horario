/* ===========================================================================
   APP — armazón, enrutado, atajos y ciclo de vida
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  HX.VERSION = '1.0.0';

  var D = HX.data, T = HX.time, U = HX.ui, store = HX.store;
  var el = U.el, icon = U.icon;

  var VIEWS = {
    week: {
      label: 'Horario', title: 'Horario semanal', icon: 'calendar', key: '1',
      sub: D.SCHOOL.group + ' · ' + D.SCHOOL.name,
      render: function (h) { HX.viewsSchedule.renderWeek(h); },
      tick: function (h) { HX.viewsSchedule.tickWeek(h); }
    },
    now: {
      label: 'Ahora', title: 'Ahora mismo', icon: 'clock', key: '2',
      sub: 'Lo que toca, lo que viene y lo que queda',
      render: function (h) { HX.viewsSchedule.renderNow(h); },
      tick: function (h) { HX.viewsSchedule.tickNow(h); }
    },
    tasks: {
      label: 'Tareas', title: 'Tareas', icon: 'checkSquare', key: '3',
      sub: 'Deberes, entregas y recordatorios',
      render: function (h) { HX.viewsStudy.renderTasks(h); }
    },
    exams: {
      label: 'Exámenes', title: 'Exámenes', icon: 'flame', key: '4',
      sub: 'Cuenta atrás para cada prueba',
      render: function (h) { HX.viewsStudy.renderExams(h); }
    },
    grades: {
      label: 'Notas', title: 'Notas', icon: 'chart', key: '5',
      sub: 'Medias ponderadas por materia',
      render: function (h) { HX.viewsStudy.renderGrades(h); }
    },
    subjects: {
      label: 'Materias', title: 'Materias', icon: 'book', key: '6',
      sub: '7 módulos · 30 periodos semanales',
      render: function (h) { HX.viewsSchedule.renderSubjects(h); }
    },
    settings: {
      label: 'Ajustes', title: 'Ajustes', icon: 'sliders', key: '7',
      sub: 'Haz que la app sea tuya',
      render: function (h) { HX.viewsStudy.renderSettings(h); }
    }
  };

  var MOBILE_TABS = ['week', 'now', 'tasks', 'exams'];
  var current = 'week';
  var viewHost = null;
  var deferredPrompt = null, installButtons = [];
  var ticks = 0;

  /* ------------------------------------------------------------- armazón */
  function buildShell() {
    var rail = U.qs('.rail .nav');
    Object.keys(VIEWS).forEach(function (id) {
      var v = VIEWS[id];
      rail.appendChild(el('button', {
        class: 'nav-btn', type: 'button', dataset: { view: id },
        onclick: function () { go(id); }
      }, [
        el('span', { class: 'ico', html: icon(v.icon) }),
        el('span', { text: v.label }),
        el('kbd', { text: v.key })
      ]));
    });

    var tabbar = U.qs('.tabbar');
    MOBILE_TABS.forEach(function (id) {
      var v = VIEWS[id];
      tabbar.appendChild(el('button', {
        class: 'tab', type: 'button', dataset: { view: id },
        onclick: function () { go(id); HX.fx.tap(); }
      }, [el('span', { html: icon(v.icon) }), el('span', { text: v.label })]));
    });
    tabbar.appendChild(el('button', {
      class: 'tab', type: 'button', dataset: { view: 'more' },
      onclick: function () { moreSheet(); HX.fx.tap(); }
    }, [el('span', { html: icon('sliders') }), el('span', { text: 'Más' })]));

    var foot = U.qs('.rail-foot');
    if (foot) {
      var info = el('div', { class: 'mini-card', id: 'rail-info' }, [
        el('div', { class: 'eyebrow', style: { marginBottom: '6px' }, text: 'Cuenta atrás' }),
        el('div', { class: 'row between', style: { fontSize: '11.5px', color: 'var(--ink-3)' } }, [
          el('span', { id: 'rail-holiday-name', class: 'truncate', text: '—' }),
          el('span', { id: 'rail-holiday-days', class: 'mono', style: { color: 'var(--accent)' }, text: '' })
        ])
      ]);
      foot.insertBefore(info, foot.firstChild);
    }

    U.qs('.fab').addEventListener('click', function () { quickAdd(); HX.fx.tap('up'); });

    U.qs('#btn-search').addEventListener('click', function () { HX.palette.toggle(); });
    U.qs('#btn-focus').addEventListener('click', function () { HX.focus.toggle(); });
    U.qs('#btn-today').addEventListener('click', function () { goToday(); });
  }

  function moreSheet() {
    U.modal({
      title: 'Más secciones',
      icon: 'sliders',
      body: [
        el('div', { class: 'list' }, ['grades', 'subjects', 'settings'].map(function (id) {
          var v = VIEWS[id];
          return el('button', {
            class: 'item', type: 'button', style: { textAlign: 'left' },
            onclick: function () { U.closeModal(); go(id); }
          }, [
            el('span', { class: 'icon-btn', html: icon(v.icon), style: { pointerEvents: 'none' } }),
            el('div', { class: 'grow' }, [
              el('div', { class: 'item-title', text: v.title }),
              el('div', { class: 'item-sub', text: v.sub })
            ]),
            el('span', { html: icon('right'), style: { opacity: '.5' } })
          ]);
        })),
        el('div', { class: 'row', style: { gap: '8px', marginTop: '6px' } }, [
          el('button', { class: 'btn grow', type: 'button', html: icon('expand') + '<span>Modo foco</span>',
            onclick: function () { U.closeModal(); HX.focus.open(); } }),
          el('button', { class: 'btn grow', type: 'button', html: icon('search') + '<span>Buscar</span>',
            onclick: function () { U.closeModal(); HX.palette.open(); } })
        ])
      ]
    });
  }

  /* ------------------------------------------------------------- enrutado */
  function go(id, skipHash) {
    if (!VIEWS[id]) id = 'week';
    current = id;
    if (!skipHash) {
      try { global.history.replaceState(null, '', '#/' + id); } catch (e) { global.location.hash = '#/' + id; }
    }
    U.qsa('.nav-btn').forEach(function (b) {
      if (b.dataset.view === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    U.qsa('.tab').forEach(function (b) {
      if (b.dataset.view === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    render();
  }

  function render() {
    var v = VIEWS[current];
    U.clear(viewHost);
    viewHost.scrollTop = 0;
    document.title = v.title + ' · Horario ' + D.SCHOOL.group;

    var body = el('div', { class: 'view-body' });
    viewHost.appendChild(el('div', { class: 'view-head' }, [
      el('div', {}, [
        el('div', { class: 'eyebrow', text: D.SCHOOL.group + ' · ' + D.SCHOOL.year }),
        el('h1', { class: 'view-title', text: v.title }),
        el('div', { class: 'view-sub', text: v.sub })
      ]),
      el('div', { class: 'view-actions' }, viewActions())
    ]));
    viewHost.appendChild(body);
    v.render(body);
    viewHost._body = body;
    if (v.tick) v.tick(body);
  }

  function viewActions() {
    var out = [];
    if (current === 'week') {
      out.push(el('button', { class: 'btn', type: 'button', html: icon('target') + '<span>Hoy</span>', onclick: goToday }));
      out.push(el('button', { class: 'btn', type: 'button', html: icon('expand') + '<span>Foco</span>', onclick: function () { HX.focus.open(); } }));
    }
    if (current === 'now') {
      out.push(el('button', { class: 'btn', type: 'button', html: icon('plus') + '<span>Tarea</span>', onclick: function () { HX.viewsStudy.taskDialog(); } }));
    }
    return out;
  }

  function refresh() {
    var pos = viewHost ? viewHost.scrollTop : 0;
    render();
    if (viewHost) viewHost.scrollTop = pos;
  }

  function goToday() {
    var d = T.now().getDay();
    var day = D.dayByIndex(d);
    if (current !== 'week') go('week');
    var body = viewHost._body;
    if (body && body._setDay) body._setDay(day ? day.i : 1);
    U.toast(day ? 'Mostrando ' + day.name : 'Hoy no hay clase — te enseño el lunes', 'info', 2200);
  }

  /* ------------------------------------------------------- barra superior */
  function paintTopbar() {
    var snap = T.snapshot();
    var st = HX.viewsSchedule.statusLine(snap);
    var now = T.now();

    U.qs('#clock-time').innerHTML = T.clock(now) + '<small>:' + T.pad(now.getSeconds()) + '</small>';
    U.qs('#clock-date').textContent = T.longDate(now);
    U.qs('#status-main').textContent = st.main;
    U.qs('#status-sub').textContent = st.sub;

    var subject = snap.current && snap.current.subject ? D.subject(snap.current.subject) :
      (snap.upcoming ? D.subject(snap.upcoming.subject) : null);
    var holidayName = U.qs('#rail-holiday-name');
    if (holidayName) {
      var h = T.nextHoliday();
      var todayHoliday = T.isHoliday(now);
      var daysNode = U.qs('#rail-holiday-days');
      if (todayHoliday) {
        holidayName.textContent = todayHoliday.name;
        daysNode.textContent = 'hoy';
      } else if (h) {
        holidayName.textContent = h.name;
        daysNode.textContent = T.daysUntil(h.from) + ' d';
      } else {
        holidayName.textContent = 'Fin de curso';
        daysNode.textContent = (T.daysUntil(D.CALENDAR.termEnd) || 0) + ' d';
      }
    }

    var dot = U.qs('.status-dot');
    if (dot) dot.style.background = subject ? subject.neon : 'var(--accent)';
    if (dot) dot.style.boxShadow = '0 0 14px ' + (subject ? subject.neon : 'var(--accent)');
  }

  /* ------------------------------------------------------------- utilidad */
  function openSubject(id) { HX.viewsStudy.subjectDetail(id); }

  function quickAdd(kind) {
    if (kind === 'task') return HX.viewsStudy.taskDialog();
    U.modal({
      title: 'Añadir',
      icon: 'plus',
      body: [
        el('div', { class: 'list' }, [
          { id: 'task', label: 'Nueva tarea', sub: 'Deberes, entregas, recordatorios', ico: 'checkSquare' },
          { id: 'exam', label: 'Nuevo examen', sub: 'Con cuenta atrás en días', ico: 'flame' },
          { id: 'grade', label: 'Nueva nota', sub: 'Se suma a tu media ponderada', ico: 'chart' }
        ].map(function (o) {
          return el('button', {
            class: 'item', type: 'button', style: { textAlign: 'left' },
            onclick: function () {
              U.closeModal();
              setTimeout(function () {
                if (o.id === 'task') HX.viewsStudy.taskDialog();
                else if (o.id === 'exam') HX.viewsStudy.examDialog();
                else HX.viewsStudy.gradeDialog();
              }, 220);
            }
          }, [
            el('span', { class: 'icon-btn', html: icon(o.ico), style: { pointerEvents: 'none' } }),
            el('div', { class: 'grow' }, [
              el('div', { class: 'item-title', text: o.label }),
              el('div', { class: 'item-sub', text: o.sub })
            ])
          ]);
        }))
      ]
    });
  }

  function showShortcuts() {
    var rows = [
      ['1 … 7', 'Cambiar de sección'],
      ['Ctrl / ⌘ + K', 'Paleta de comandos'],
      ['F', 'Modo foco'],
      ['N', 'Nueva tarea'],
      ['T', 'Ir a hoy'],
      ['← →', 'Cambiar de día (móvil)'],
      ['Espacio', 'Pausar el pomodoro'],
      ['Esc', 'Cerrar lo que esté abierto']
    ];
    U.modal({
      title: 'Atajos de teclado',
      icon: 'info',
      body: [el('div', {}, rows.map(function (r) {
        return el('div', { class: 'about-line' }, [
          el('span', { class: 'mono', style: { color: 'var(--accent)' }, text: r[0] }),
          el('span', { class: 'dim', text: r[1] })
        ]);
      }))],
      actions: [{ label: 'Entendido', kind: 'primary' }]
    });
  }

  /* ---------------------------------------------------------------- teclas */
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); HX.palette.toggle(); return;
      }
      if (typing) return;

      /* El documento no scrollea (lo hace #view), así que las teclas de
         desplazamiento hay que atenderlas a mano. */
      var overlayOpen = HX.focus.isOpen || HX.palette.isOpen || !!document.querySelector('.modal.open');
      if (!overlayOpen && scrollKey(e)) return;

      var k = e.key.toLowerCase();
      var byKey = Object.keys(VIEWS).filter(function (id) { return VIEWS[id].key === e.key; })[0];
      if (byKey) { e.preventDefault(); go(byKey); return; }
      if (k === 'f') { e.preventDefault(); HX.focus.toggle(); }
      else if (k === 'n') { e.preventDefault(); HX.viewsStudy.taskDialog(); }
      else if (k === 't') { e.preventDefault(); goToday(); }
      else if (k === '?') { e.preventDefault(); showShortcuts(); }
      else if (k === 'k' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); HX.palette.toggle(); }
      else if ((k === 'arrowleft' || k === 'arrowright') && current === 'week') {
        var body = viewHost._body;
        if (body && body._setDay) {
          var cur = body._weekDay || 1;
          var nextDay = Math.min(5, Math.max(1, cur + (k === 'arrowright' ? 1 : -1)));
          body._setDay(nextDay);
        }
      }
    });
  }

  /* Desplaza la vista con las teclas de siempre. Devuelve true si la consumió. */
  function scrollKey(e) {
    if (!viewHost || e.ctrlKey || e.metaKey || e.altKey) return false;
    var page = Math.max(120, viewHost.clientHeight - 90);
    var step = 90;
    var by = null, to = null;

    switch (e.key) {
      case 'ArrowDown': by = step; break;
      case 'ArrowUp': by = -step; break;
      case 'PageDown': by = page; break;
      case 'PageUp': by = -page; break;
      case ' ': case 'Spacebar': by = e.shiftKey ? -page : page; break;
      case 'Home': to = 0; break;
      case 'End': to = viewHost.scrollHeight; break;
      default: return false;
    }

    if (viewHost.scrollHeight <= viewHost.clientHeight + 1) return false;
    e.preventDefault();
    if (to != null) viewHost.scrollTo({ top: to, behavior: 'auto' });   /* Inicio/Fin, directos */
    else viewHost.scrollBy({ top: by, behavior: 'smooth' });
    return true;
  }

  /* --------------------------------------------------------------- gestos */
  function bindSwipe() {
    var x0 = null, y0 = null, t0 = 0;
    viewHost.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    viewHost.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
      x0 = null;
      if (dt > 600 || Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      if (current === 'week') {
        var body = viewHost._body;
        if (body && body._setDay) {
          var cur = body._weekDay || 1;
          var nd = Math.min(5, Math.max(1, cur + (dx < 0 ? 1 : -1)));
          if (nd !== cur) { body._setDay(nd); HX.fx.buzz(8); }
        }
      } else {
        var order = MOBILE_TABS.concat(['grades', 'subjects', 'settings']);
        var i = order.indexOf(current);
        if (i < 0) return;
        var ni = Math.min(order.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1)));
        if (ni !== i) { go(order[ni]); HX.fx.buzz(8); }
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------- exámenes semilla */
  function seedExams() {
    if (store.state.seededExams) return;
    var url = 'exams.json';
    if (!global.fetch || global.location.protocol === 'file:') { store.set('seededExams', true); return; }
    fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('sin archivo');
      return r.text();
    }).then(function (txt) {
      var list;
      try { list = JSON.parse(txt); }
      catch (e) { list = JSON.parse(txt.replace(/}\s*{/g, '},{')); } /* tolera comas olvidadas */
      if (!Array.isArray(list)) return;
      list.forEach(function (item) {
        if (!item || !item.date) return;
        var id = null;
        Object.keys(D.SUBJECTS).forEach(function (sid) {
          var s = D.SUBJECTS[sid];
          var probe = String(item.subject || '').toLowerCase();
          if (probe && (s.name.toLowerCase().indexOf(probe) >= 0 || probe.indexOf(s.code.toLowerCase()) >= 0)) id = sid;
        });
        store.addExam({ title: item.subject || 'Examen', subject: id, date: String(item.date).slice(0, 10), note: item.note || '' });
      });
      store.set('seededExams', true);
    }).catch(function () {
      store.set('seededExams', true);
    });
  }

  /* ------------------------------------------------------------------ PWA */
  function registerInstallButton(btn) {
    installButtons.push(btn);
    btn.classList.toggle('hidden', !deferredPrompt);
  }

  function install() {
    if (!deferredPrompt) {
      U.toast('Usa el menú del navegador → «Añadir a pantalla de inicio»', 'info', 5000);
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (r) {
      if (r.outcome === 'accepted') U.toast('¡Instalada!', 'ok');
      deferredPrompt = null;
      installButtons.forEach(function (b) { b.classList.add('hidden'); });
    });
  }

  function initPWA() {
    global.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installButtons.forEach(function (b) { b.classList.remove('hidden'); });
    });

    if ('serviceWorker' in navigator && global.location.protocol.indexOf('http') === 0) {
      global.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
          /* Si llega una versión nueva mientras la app está abierta, se ofrece
             recargar: si no, el navegador seguiría con los archivos en caché. */
          reg.addEventListener('updatefound', function () {
            var fresh = reg.installing;
            if (!fresh) return;
            fresh.addEventListener('statechange', function () {
              if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
                U.toast('Hay una versión nueva · toca para actualizar', 'ok', 12000, function () {
                  global.location.reload();
                });
              }
            });
          });
        }).catch(function (err) {
          console.warn('[sw] no registrado:', err && err.message);
        });
      });
    }
  }

  /* ------------------------------------------------------------ ciclo 1 Hz */
  function loop() {
    ticks++;
    paintTopbar();
    var v = VIEWS[current];
    if (v.tick && viewHost._body) {
      try { v.tick(viewHost._body); } catch (e) { console.error('[tick]', e); }
    }
    HX.focus.tick();
    if (ticks % 15 === 0) HX.notify.tick();
    if (ticks % 600 === 0 && current === 'week') refresh(); /* recalcula la semana cada 10 min */
  }

  /* ------------------------------------------------------------------ boot */
  function start() {
    store.load();
    store.set('stats.opens', (store.get('stats.opens', 0) || 0) + 1);
    store.set('stats.lastOpen', new Date().toISOString());

    viewHost = U.qs('#view');

    HX.fx.init();
    buildShell();
    bindKeys();
    bindSwipe();
    initPWA();
    seedExams();

    ['tasks', 'exams', 'grades', 'import'].forEach(function (evt) {
      store.on(evt, function () { if (current !== 'settings') refresh(); });
    });

    var hash = (global.location.hash || '').replace('#/', '');
    var isMobile = global.matchMedia('(max-width: 860px)').matches;
    var startPref = store.get('settings.startView', 'auto');
    var initial = VIEWS[hash] ? hash : (startPref === 'auto' ? (isMobile ? 'now' : 'week') : startPref);
    go(initial);

    paintTopbar();
    setInterval(loop, 1000);

    global.addEventListener('hashchange', function () {
      var h = (global.location.hash || '').replace('#/', '');
      if (VIEWS[h] && h !== current) go(h, true);
    });

    /* fuera la pantalla de arranque */
    setTimeout(function () {
      var boot = U.qs('#boot');
      if (boot) boot.classList.add('done');
    }, 620);

    if (!store.get('settings.seenTour')) {
      setTimeout(function () {
        U.toast('Pulsa K para buscar, F para el modo foco', 'info', 5200);
        store.set('settings.seenTour', true);
      }, 1800);
    }
  }

  HX.app = {
    go: go, refresh: refresh, openSubject: openSubject, quickAdd: quickAdd,
    showShortcuts: showShortcuts, install: install, registerInstallButton: registerInstallButton,
    goToday: goToday, VIEWS: VIEWS, get current() { return current; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
