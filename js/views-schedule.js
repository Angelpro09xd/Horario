/* ===========================================================================
   VISTAS · Horario semanal, Ahora y Materias
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var D = HX.data, T = HX.time, U = HX.ui, store = HX.store;
  var el = U.el, icon = U.icon;

  function subjColor(id) { var s = D.subject(id); return s ? s.neon : 'var(--accent)'; }

  function openSubject(id) { HX.app.openSubject(id); }

  /* ======================================================= HORARIO SEMANAL */
  function renderWeek(host) {
    var snap = T.snapshot();
    var week = T.weekOf();
    var today = T.startOfDay(T.now()).getTime();
    var state = { day: snap.dayKey ? D.dayByIndex(T.now().getDay()).i : 1 };
    if (host._weekDay) state.day = host._weekDay;

    var wrap = el('div', { class: 'week-wrap' });

    /* Selector de día (móvil) */
    var picker = el('div', { class: 'day-picker glass' }, D.DAYS.map(function (d, idx) {
      var date = week[idx];
      return el('button', {
        class: 'day-pick', type: 'button',
        'aria-pressed': String(d.i === state.day),
        dataset: { day: String(d.i), today: String(T.startOfDay(date).getTime() === today) },
        onclick: function () { setDay(d.i); HX.fx.tap(); }
      }, [
        el('span', { class: 'l', text: d.letter }),
        el('span', { class: 'n', text: date.getDate() + '/' + (date.getMonth() + 1) })
      ]);
    }));

    var grid = el('div', { class: 'week', dataset: { day: String(state.day) } });

    /* Encabezados */
    grid.appendChild(el('div', { class: 'corner', text: 'Tramo', style: { gridColumn: '1', gridRow: '1' } }));
    D.DAYS.forEach(function (d, idx) {
      var date = week[idx];
      var isToday = T.startOfDay(date).getTime() === today;
      var holiday = T.isHoliday(date);
      grid.appendChild(el('div', {
        class: 'day-head', dataset: { today: String(isToday), holiday: String(!!holiday) },
        title: holiday ? holiday.name : '',
        style: { gridColumn: String(idx + 2), gridRow: '1' }
      }, [
        el('div', { class: 'n', text: d.name }),
        el('div', { class: 'd', text: holiday ? holiday.name
          : T.pad(date.getDate()) + '.' + T.pad(date.getMonth() + 1) + (isToday ? ' · hoy' : '') })
      ]));
    });

    /* Columna de horas */
    D.PERIODS.forEach(function (p) {
      grid.appendChild(el('div', {
        class: 'time-cell', dataset: { period: String(p.i) },
        style: { gridColumn: '1', gridRow: String(p.i + 2) }
      }, [
        el('div', { class: 's', text: p.start }),
        el('div', { class: 'e', text: p.end })
      ]));
    });

    /* Resplandor de la columna de hoy */
    var todayIdx = D.DAYS.findIndex(function (d, i) { return T.startOfDay(week[i]).getTime() === today; });
    if (todayIdx >= 0) {
      grid.appendChild(el('div', {
        class: 'today-glow',
        style: { gridColumn: String(todayIdx + 2), gridRow: '2 / -1' }
      }));
    }

    /* Recreo */
    var breakPeriod = D.PERIODS.find(function (p) { return p.kind === 'break'; });
    var breakCell = el('div', {
      class: 'break-cell', style: { gridRow: String(breakPeriod.i + 2) },
      dataset: { live: String(snap.phase === 'break') }
    }, [
      el('span', { html: icon('coffee'), style: { opacity: '.7' } }),
      el('span', { text: 'Recreo · ' + breakPeriod.start + '–' + breakPeriod.end })
    ]);
    grid.appendChild(breakCell);

    /* Celdas */
    var cells = [];
    D.DAYS.forEach(function (d, idx) {
      var date = week[idx];
      D.blocksFor(d.key).forEach(function (b) {
        if (!b.subject) return;
        var s = D.subject(b.subject);
        var t = D.TEACHERS[s.teacher];
        var from = D.PERIODS[b.from], to = D.PERIODS[b.to];
        var holidayHere = T.isHoliday(date);
        var cell = el('button', {
          class: 'cell', type: 'button',
          dataset: { day: String(d.i), from: String(b.from), to: String(b.to), subject: s.id,
            holiday: String(!!holidayHere) },
          style: { '--c': s.neon, gridColumn: String(idx + 2), gridRow: (b.from + 2) + ' / span ' + b.span },
          onclick: function () { HX.fx.tap(); openSubject(s.id); },
          title: s.name + ' · ' + t.name
        }, [
          el('div', { class: 'cell-top' }, [
            el('span', { class: 'cell-code', text: s.code }),
            el('span', { class: 'cell-len', text: b.span + 'h' })
          ]),
          el('div', { class: 'cell-name truncate', text: s.name }),
          b.span > 1 ? el('div', { class: 'cell-mid' }, el('span', { text: 'sesión de ' + b.span + ' h' })) : null,
          el('div', { class: 'cell-foot' }, [
            el('span', { class: 'who', text: t.short }),
            el('span', { class: 'hrs', text: from.start + '–' + to.end })
          ]),
          el('div', { class: 'cell-live' }, el('i'))
        ]);
        cell._meta = { day: d.i, date: date, start: from.startMin, end: to.endMin };
        cells.push(cell);
        grid.appendChild(cell);
      });
    });

    /* Leyenda */
    var legend = el('div', { class: 'legend' }, Object.keys(D.SUBJECTS).map(function (id) {
      var s = D.SUBJECTS[id];
      return el('button', {
        class: 'legend-item', type: 'button', style: { '--c': s.neon },
        onclick: function () { openSubject(id); }
      }, [
        el('span', { class: 'dot' }),
        el('span', { text: s.code }),
        el('span', { class: 'n', text: D.WEEKLY[id] + 'h' })
      ]);
    }));

    wrap.appendChild(picker);
    wrap.appendChild(grid);
    wrap.appendChild(legend);
    host.appendChild(wrap);

    host._cells = cells;
    host._grid = grid;
    host._breakCell = breakCell;
    host._picker = picker;

    function setDay(i) {
      state.day = i;
      host._weekDay = i;
      grid.dataset.day = String(i);
      U.qsa('.day-pick', picker).forEach(function (b) {
        b.setAttribute('aria-pressed', String(+b.dataset.day === i));
      });
    }

    host._setDay = setDay;
    tickWeek(host);
  }

  function tickWeek(host) {
    if (!host._cells) return;
    var snap = T.snapshot();
    var nowMs = T.now().getTime();
    var todayTime = T.startOfDay(T.now()).getTime();
    var upcoming = snap.upcoming;

    /* línea del ahora */
    var line = host._line;
    if (!line) {
      line = host._line = el('div', { class: 'now-line' });
    }
    var placed = false;

    host._cells.forEach(function (cell) {
      var m = cell._meta;
      var dayTime = T.startOfDay(m.date).getTime();
      var start = dayTime + m.start * 60000;
      var end = dayTime + m.end * 60000;
      var bar = cell.querySelector('.cell-live i');
      var state = 'future';

      if (nowMs >= end) state = 'past';
      else if (nowMs >= start) state = 'now';
      else if (upcoming && dayTime === todayTime && start === upcoming.start.getTime()) state = 'next';

      if (cell.dataset.state !== state) cell.dataset.state = state;

      if (state === 'now') {
        var p = (nowMs - start) / (end - start);
        bar.style.width = (p * 100).toFixed(2) + '%';
        if (!cell.querySelector('.badge-now')) {
          cell.appendChild(el('span', { class: 'badge-now' }, [el('i'), 'Ahora']));
        }
        line.style.setProperty('--p', (p * 100).toFixed(2) + '%');
        if (line.parentNode !== cell) cell.appendChild(line);
        placed = true;
      } else {
        bar.style.width = state === 'past' ? '100%' : '0%';
        var badge = cell.querySelector('.badge-now');
        if (badge) badge.remove();
      }
    });

    /* recreo en curso */
    var live = snap.phase === 'break';
    host._breakCell.dataset.live = String(live);
    if (live && !placed) {
      var bp = D.PERIODS.find(function (p) { return p.kind === 'break'; });
      var base = T.startOfDay(T.now()).getTime();
      var pr = (nowMs - (base + bp.startMin * 60000)) / (bp.duration * 60000);
      line.style.setProperty('--p', (pr * 100).toFixed(2) + '%');
      host._breakCell.appendChild(line);
      placed = true;
    }
    if (!placed && line.parentNode) line.remove();

    U.qsa('.time-cell', host).forEach(function (tc) {
      var p = D.PERIODS[+tc.dataset.period];
      var mins = T.minutesOf(T.now());
      var live = !!snap.dayKey && !snap.holiday && mins >= p.startMin && mins < p.endMin;
      tc.dataset.live = String(live);
    });
  }

  /* ================================================================ AHORA */
  function statusLine(snap) {
    if (snap.holiday) return { main: 'Festivo · ' + snap.holiday.name, sub: 'Sin clases hoy' };
    if (!snap.dayKey) return { main: 'Fin de semana', sub: 'Desconecta, ya toca' };
    if (snap.phase === 'class') return { main: 'En clase', sub: 'Quedan ' + T.human(snap.remaining) };
    if (snap.phase === 'break') return { main: 'Recreo', sub: 'Vuelta en ' + T.human(snap.remaining) };
    if (snap.phase === 'gap') return { main: 'Entre clases', sub: 'Siguiente en ' + T.human(snap.untilNext) };
    if (snap.phase === 'after') return { main: 'Jornada terminada', sub: 'Mañana más' };
    return { main: 'Libre', sub: '—' };
  }

  function renderNow(host) {
    var hero = el('div', { class: 'hero glass sheen' });
    var timelineCard = el('div', { class: 'card glass' });
    var statsGrid = el('div', { class: 'quick-stats' });
    var sideCard = el('div', { class: 'card glass' });

    var left = el('div', { class: 'col', style: { gap: 'var(--gap)' } }, [hero, timelineCard]);
    var right = el('div', { class: 'col', style: { gap: 'var(--gap)' } }, [statsGrid, sideCard]);
    host.appendChild(el('div', { class: 'now-grid stagger' }, [left, right]));

    host._now = { hero: hero, timelineCard: timelineCard, statsGrid: statsGrid, sideCard: sideCard };
    paintNow(host, true);
  }

  function paintNow(host, full) {
    var refs = host._now;
    if (!refs) return;
    var snap = T.snapshot();
    var current = snap.current;
    var subject = current && current.subject ? D.subject(current.subject) : null;
    var target = subject || (snap.upcoming ? D.subject(snap.upcoming.subject) : null);
    var color = target ? target.neon : 'var(--accent)';

    /* --- Héroe --- */
    var hero = refs.hero;
    hero.style.setProperty('--c', color);
    U.clear(hero);

    var isLive = snap.phase === 'class' && subject;
    var isBreak = snap.phase === 'break';
    var countdownMs = isLive || isBreak ? snap.remaining : snap.untilNext;
    var ratio = isLive || isBreak ? snap.progress : (function () {
      if (!snap.untilNext) return 0;
      var span = Math.min(snap.untilNext, 3600000);
      return 1 - span / 3600000;
    })();

    var ringInner = [
      el('div', { class: 'big mono', text: countdownMs != null && countdownMs < 86400000 ? T.countdown(countdownMs) : '—' }),
      el('div', { class: 'lbl', text: isLive ? 'restante' : isBreak ? 'de recreo' : 'para entrar' })
    ];
    var ring = U.ring(Math.max(0, Math.min(1, ratio || 0)), color, ringInner);
    ring.classList.add('hero-ring');
    hero.appendChild(ring);

    var st = statusLine(snap);
    var body = el('div', { class: 'hero-body' }, [
      el('div', { class: 'hero-eyebrow' }, [
        el('span', { class: 'tag', style: { '--c': color }, text: isLive ? 'Ahora mismo' : isBreak ? 'Recreo' : 'Siguiente' }),
        el('span', { class: 'eyebrow', text: st.main })
      ]),
      el('div', { class: 'hero-code', text: target ? target.code : '—' }),
      el('div', { class: 'hero-name', text: target ? target.name : (snap.holiday ? snap.holiday.name : 'Sin clases programadas') }),
      el('div', { class: 'hero-meta' }, target ? [
        el('span', {}, [el('b', { text: D.TEACHERS[target.teacher].name })]),
        el('span', { class: 'mono', text: isLive || isBreak
          ? T.clock(current.start) + '–' + T.clock(current.end)
          : (snap.upcoming ? T.clock(snap.upcoming.start) + '–' + T.clock(snap.upcoming.end) : '') }),
        el('span', { text: snap.upcoming && !isLive ? T.longDate(snap.upcoming.start) : (D.WEEKLY[target.id] + ' h / semana') })
      ] : [el('span', { text: st.sub })]),
      el('div', { class: 'hero-actions' }, [
        el('button', { class: 'btn primary', type: 'button', html: icon('expand') + '<span>Modo foco</span>', onclick: function () { HX.focus.open(); } }),
        el('button', { class: 'btn', type: 'button', html: icon('calendar') + '<span>Ver semana</span>', onclick: function () { HX.app.go('week'); } }),
        target ? el('button', { class: 'btn ghost', type: 'button', html: icon('info') + '<span>Materia</span>', onclick: function () { openSubject(target.id); } }) : null
      ])
    ]);
    hero.appendChild(body);

    /* --- Línea del día --- */
    var tl = refs.timelineCard;
    U.clear(tl);
    tl.appendChild(el('div', { class: 'card-head' }, [
      el('span', { class: 'icon-btn', html: icon('clock'), style: { pointerEvents: 'none' } }),
      el('div', { class: 'grow' }, [
        el('div', { class: 'card-title', text: snap.dayKey ? 'Jornada de hoy' : 'Próximo día lectivo' }),
        el('div', { class: 'view-sub', text: snap.dayKey && !snap.holiday
          ? snap.doneLessons + ' de ' + snap.totalLessons + ' bloques completados'
          : (snap.upcoming ? T.longDate(snap.upcoming.start) : '') })
      ]),
      el('div', { class: 'mono muted', text: Math.round((snap.dayProgress || 0) * 100) + '%' })
    ]));
    tl.appendChild(el('div', { class: 'meter', style: { marginBottom: '14px' } },
      el('i', { style: { '--p': ((snap.dayProgress || 0) * 100).toFixed(1) + '%' } })));

    var list = snap.lessons.length ? snap.lessons : (function () {
      var nx = snap.upcoming;
      return nx ? T.mergedSessionsOf(nx.start).filter(function (s) { return !s.isBreak; }) : [];
    })();

    var nowMs = T.now().getTime();
    tl.appendChild(el('div', { class: 'timeline' }, list.map(function (s) {
      var sub = D.subject(s.subject);
      var state = nowMs >= s.end.getTime() ? 'past' : (nowMs >= s.start.getTime() ? 'now' : 'future');
      return el('button', {
        class: 'tl-item', type: 'button', dataset: { state: state },
        style: { '--c': sub.neon }, onclick: function () { openSubject(sub.id); }
      }, [
        el('div', { class: 'tl-time' }, [
          el('div', { text: T.clock(s.start) }),
          el('div', { style: { opacity: '.6' }, text: T.clock(s.end) })
        ]),
        el('div', { class: 'tl-rail' }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'tl-title truncate', text: sub.code + ' · ' + sub.name }),
          el('div', { class: 'tl-sub truncate', text: D.TEACHERS[sub.teacher].name })
        ]),
        el('div', { class: 'tag', style: { '--c': sub.neon }, text: state === 'now' ? 'en curso' : (s.periods.length + 'h') })
      ]);
    })));

    /* --- Estadísticas --- */
    var pendingTasks = store.state.tasks.filter(function (t) { return !t.done; });
    var nextExam = store.state.exams
      .filter(function (e) { return e.date && T.daysUntil(e.date) >= 0; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
    var hoursLeft = snap.lessons.filter(function (s) { return s.end.getTime() > nowMs; })
      .reduce(function (acc, s) { return acc + (s.end - Math.max(nowMs, s.start)) / 3600000; }, 0);

    U.clear(refs.statsGrid);
    [
      { k: 'Clases hoy', v: String(snap.totalLessons), u: snap.totalLessons ? snap.doneLessons + ' hechas' : 'día libre', c: 'var(--accent)' },
      { k: 'Horas restantes', v: hoursLeft > 0 ? hoursLeft.toFixed(1) : '0', u: 'hasta las 15:00', c: 'var(--accent-2)' },
      { k: 'Tareas', v: String(pendingTasks.length), u: 'pendientes', c: pendingTasks.length ? 'var(--warn)' : 'var(--ok)' },
      { k: 'Próximo examen', v: nextExam ? String(T.daysUntil(nextExam.date)) : '—', u: nextExam ? 'días · ' + (D.subject(nextExam.subject) ? D.subject(nextExam.subject).code : 'general') : 'nada a la vista', c: 'var(--bad)' }
    ].forEach(function (s) {
      refs.statsGrid.appendChild(el('div', { class: 'stat glass', style: { '--c': s.c } }, [
        el('div', { class: 'k', text: s.k }),
        el('div', { class: 'v', style: { color: s.c }, text: s.v }),
        el('div', { class: 'u', text: s.u })
      ]));
    });

    /* --- Panel lateral: lo que viene --- */
    var side = refs.sideCard;
    U.clear(side);
    side.appendChild(el('div', { class: 'card-head' }, [
      el('span', { class: 'icon-btn', html: icon('zap'), style: { pointerEvents: 'none' } }),
      el('div', { class: 'grow' }, [
        el('div', { class: 'card-title', text: 'En el radar' }),
        el('div', { class: 'view-sub', text: 'Tareas y exámenes más cercanos' })
      ])
    ]));

    var radar = [];
    store.state.exams.forEach(function (e) {
      var d = T.daysUntil(e.date);
      if (d != null && d >= 0) radar.push({ kind: 'examen', title: e.title || 'Examen', subject: e.subject, days: d, date: e.date });
    });
    store.state.tasks.filter(function (t) { return !t.done && t.due; }).forEach(function (t) {
      var d = T.daysUntil(t.due);
      if (d != null) radar.push({ kind: 'tarea', title: t.title, subject: t.subject, days: d, date: t.due });
    });
    radar.sort(function (a, b) { return a.days - b.days; });

    if (!radar.length) {
      side.appendChild(el('div', { class: 'empty' }, [
        el('span', { html: icon('sparkles') }),
        el('div', { text: 'Nada pendiente. Disfrútalo.' }),
        el('button', { class: 'btn sm', type: 'button', text: 'Añadir tarea', onclick: function () { HX.app.quickAdd('task'); } })
      ]));
    } else {
      side.appendChild(el('div', { class: 'list' }, radar.slice(0, 6).map(function (r) {
        var sub = D.subject(r.subject);
        var c = sub ? sub.neon : 'var(--accent)';
        return el('div', { class: 'item accented', style: { '--c': c } }, [
          el('div', { class: 'grow' }, [
            el('div', { class: 'item-title truncate', text: r.title }),
            el('div', { class: 'item-sub', text: (sub ? sub.code + ' · ' : '') + T.shortDate(r.date) })
          ]),
          el('span', {
            class: 'tag',
            style: { '--c': r.days <= 1 ? 'var(--bad)' : r.days <= 3 ? 'var(--warn)' : c },
            text: r.days === 0 ? 'hoy' : r.days < 0 ? 'atrasado' : 'en ' + r.days + ' d'
          })
        ]);
      })));
    }
  }

  function tickNow(host) { paintNow(host); }

  /* ============================================================= MATERIAS */
  function renderSubjects(host) {
    var cards = el('div', { class: 'cards stagger' });
    Object.keys(D.SUBJECTS).forEach(function (id) {
      var s = D.SUBJECTS[id];
      var t = D.TEACHERS[s.teacher];
      var slots = [];
      D.DAYS.forEach(function (d) {
        D.blocksFor(d.key).forEach(function (b) {
          if (b.subject === id) slots.push(d.letter + ' ' + D.PERIODS[b.from].start);
        });
      });
      var avg = store.average(id);
      cards.appendChild(el('article', { class: 'subject-card card glass sheen', style: { '--c': s.neon } }, [
        el('div', { class: 'subject-top' }, [
          el('div', { class: 'row between' }, [
            el('div', { class: 'subject-code', text: s.code }),
            el('span', { style: { fontSize: '22px' }, text: s.icon })
          ]),
          el('div', { class: 'subject-name', text: s.name })
        ]),
        el('div', { class: 'subject-body' }, [
          el('div', { class: 'subject-row' }, [
            el('span', { html: icon('users'), style: { width: '16px', opacity: '.7' } }),
            el('span', {}, [el('b', { text: t.name })])
          ]),
          el('div', { class: 'subject-row' }, [
            el('span', { html: icon('clock'), style: { width: '16px', opacity: '.7' } }),
            el('span', {}, [el('b', { text: D.WEEKLY[id] + ' h' }), ' a la semana'])
          ]),
          el('div', { class: 'subject-slots' }, slots.map(function (x) { return el('span', { class: 'slot-pill', text: x }); })),
          el('div', { class: 'row between', style: { marginTop: '4px' } }, [
            el('span', { class: 'tag', style: { '--c': avg == null ? 'var(--ink-4)' : avg >= 5 ? 'var(--ok)' : 'var(--bad)' },
              text: avg == null ? 'sin notas' : 'media ' + avg.toFixed(2) }),
            el('button', { class: 'btn sm', type: 'button', text: 'Abrir', onclick: function () { openSubject(id); } })
          ])
        ])
      ]));
    });
    host.appendChild(cards);

    /* Reparto semanal — barras de un solo tono, ordenadas y etiquetadas */
    var max = Math.max.apply(null, Object.keys(D.WEEKLY).map(function (k) { return D.WEEKLY[k]; }));
    var sorted = Object.keys(D.SUBJECTS).sort(function (a, b) { return D.WEEKLY[b] - D.WEEKLY[a]; });
    host.appendChild(el('div', { class: 'card glass', style: { marginTop: 'var(--gap)' } }, [
      el('div', { class: 'card-head' }, [
        el('span', { class: 'icon-btn', html: icon('chart'), style: { pointerEvents: 'none' } }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'card-title', text: 'Reparto semanal' }),
          el('div', { class: 'view-sub', text: '30 periodos lectivos, de más a menos carga' })
        ])
      ]),
      el('div', { class: 'bars' }, sorted.map(function (id) {
        var s = D.SUBJECTS[id];
        return el('div', { class: 'bar-row' }, [
          el('div', { class: 'bar-label', text: s.code }),
          el('div', { class: 'bar-track' }, el('div', { class: 'bar-fill', style: { '--w': (D.WEEKLY[id] / max * 100) + '%', '--c': s.chart } })),
          el('div', { class: 'bar-value', text: D.WEEKLY[id] + ' h' })
        ]);
      }))
    ]));
  }

  HX.viewsSchedule = {
    renderWeek: renderWeek, tickWeek: tickWeek,
    renderNow: renderNow, tickNow: tickNow,
    renderSubjects: renderSubjects,
    statusLine: statusLine
  };
})(window);
