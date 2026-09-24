/* ===========================================================================
   VISTAS · Tareas, Exámenes, Notas, Materia (detalle) y Ajustes
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var D = HX.data, T = HX.time, U = HX.ui, store = HX.store;
  var el = U.el, icon = U.icon;

  function subjectOptions(includeAll) {
    var opts = includeAll ? [{ value: '', label: 'General' }] : [];
    Object.keys(D.SUBJECTS).forEach(function (id) {
      opts.push({ value: id, label: D.SUBJECTS[id].code + ' · ' + D.SUBJECTS[id].name });
    });
    return opts;
  }

  function colorOf(id) { return HX.skins.color(id); }

  /* ================================================================ TAREAS */
  function taskDialog(existing) {
    var title = U.input({ placeholder: 'Ej. Terminar práctica de Samba', value: existing ? existing.title : '' });
    var subject = U.select({}, subjectOptions(true), existing ? existing.subject || '' : '');
    var due = U.input({ type: 'date', value: existing && existing.due ? existing.due : '' });
    var priority = U.select({}, [
      { value: 'low', label: 'Tranquila' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'Urgente' }
    ], existing ? existing.priority : 'normal');

    U.modal({
      title: existing ? 'Editar tarea' : 'Nueva tarea',
      icon: 'checkSquare',
      body: [
        U.field('Descripción', title),
        el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-end' } }, [
          el('div', { class: 'grow' }, U.field('Materia', subject)),
          el('div', { class: 'grow' }, U.field('Fecha límite', due))
        ]),
        U.field('Prioridad', priority)
      ],
      actions: [
        existing ? { label: 'Eliminar', kind: 'danger', onClick: function () { store.removeTask(existing.id); HX.fx.tap('down'); } } : null,
        { label: 'Cancelar' },
        {
          label: 'Guardar', kind: 'primary', onClick: function () {
            var v = title.value.trim();
            if (!v) { U.toast('Ponle un nombre a la tarea', 'warn'); return false; }
            var patch = { title: v, subject: subject.value || null, due: due.value || null, priority: priority.value };
            if (existing) store.updateTask(existing.id, patch); else store.addTask(patch);
            HX.fx.tap('ok');
            U.toast(existing ? 'Tarea actualizada' : 'Tarea añadida', 'ok');
          }
        }
      ].filter(Boolean)
    });
  }

  function taskItem(t) {
    var sub = D.subject(t.subject);
    var c = HX.skins.color(sub);
    var days = t.due ? T.daysUntil(t.due) : null;
    var badge = null;
    if (t.done) badge = { text: 'hecha', c: 'var(--ok)' };
    else if (days == null) badge = null;
    else if (days < 0) badge = { text: 'atrasada', c: 'var(--bad)' };
    else if (days === 0) badge = { text: 'hoy', c: 'var(--warn)' };
    else if (days === 1) badge = { text: 'mañana', c: 'var(--warn)' };
    else badge = { text: 'en ' + days + ' d', c: c };

    var check = el('button', {
      class: 'check', type: 'button', role: 'checkbox', 'aria-checked': String(!!t.done),
      'aria-label': 'Marcar como hecha', style: { '--c': c },
      html: icon('check'),
      onclick: function () {
        store.updateTask(t.id, { done: !t.done });
        HX.fx.tap(t.done ? 'down' : 'ok');
      }
    });

    return el('div', { class: 'item accented' + (t.done ? ' done' : ''), style: { '--c': c } }, [
      check,
      el('button', {
        class: 'grow', type: 'button', style: { textAlign: 'left' },
        onclick: function () { taskDialog(t); }
      }, [
        el('div', { class: 'item-title truncate', text: t.title }),
        el('div', { class: 'item-sub truncate', text: [sub ? sub.code : 'General', t.due ? T.shortDate(t.due) : 'sin fecha',
          t.priority === 'high' ? '⚡ urgente' : t.priority === 'low' ? 'tranquila' : null].filter(Boolean).join(' · ') })
      ]),
      el('div', { class: 'item-actions' }, [
        badge ? el('span', { class: 'tag', style: { '--c': badge.c }, text: badge.text }) : null,
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Eliminar', html: icon('trash'), onclick: function () {
          store.removeTask(t.id); HX.fx.tap('down'); U.toast('Tarea eliminada');
        } })
      ])
    ]);
  }

  function renderTasks(host) {
    var filter = host._taskFilter || (host._taskFilter = { subject: '', show: 'pending' });

    var head = el('div', { class: 'row wrap between', style: { gap: '12px', marginBottom: '14px' } }, [
      el('div', { class: 'chips' }, [
        { k: 'pending', l: 'Pendientes' }, { k: 'all', l: 'Todas' }, { k: 'done', l: 'Hechas' }
      ].map(function (o) {
        return el('button', {
          class: 'chip', type: 'button', 'aria-pressed': String(filter.show === o.k),
          onclick: function () { filter.show = o.k; HX.app.refresh(); }
        }, o.l);
      })),
      el('button', { class: 'btn primary', type: 'button', html: icon('plus') + '<span>Nueva tarea</span>', onclick: function () { taskDialog(); } })
    ]);

    var subjChips = el('div', { class: 'chips', style: { marginBottom: '16px' } }, [
      el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(!filter.subject),
        onclick: function () { filter.subject = ''; HX.app.refresh(); }
      }, 'Todas las materias')
    ].concat(Object.keys(D.SUBJECTS).map(function (id) {
      var s = D.SUBJECTS[id];
      return el('button', {
        class: 'chip', type: 'button', style: { '--c': HX.skins.color(s) },
        'aria-pressed': String(filter.subject === id),
        onclick: function () { filter.subject = filter.subject === id ? '' : id; HX.app.refresh(); }
      }, [el('span', { class: 'dot' }), s.code]);
    })));

    var tasks = store.state.tasks.filter(function (t) {
      if (filter.subject && t.subject !== filter.subject) return false;
      if (filter.show === 'pending') return !t.done;
      if (filter.show === 'done') return t.done;
      return true;
    });

    var groups = { late: [], today: [], week: [], later: [], none: [], done: [] };
    tasks.forEach(function (t) {
      if (t.done) return groups.done.push(t);
      if (!t.due) return groups.none.push(t);
      var d = T.daysUntil(t.due);
      if (d < 0) groups.late.push(t);
      else if (d === 0) groups.today.push(t);
      else if (d <= 7) groups.week.push(t);
      else groups.later.push(t);
    });

    var order = [
      ['late', 'Atrasadas'], ['today', 'Para hoy'], ['week', 'Esta semana'],
      ['later', 'Más adelante'], ['none', 'Sin fecha'], ['done', 'Completadas']
    ];

    var body = el('div', {});
    var total = store.state.tasks.length;
    var doneCount = store.state.tasks.filter(function (t) { return t.done; }).length;

    if (total) {
      body.appendChild(el('div', { class: 'card glass', style: { marginBottom: '16px' } }, [
        el('div', { class: 'row between', style: { marginBottom: '10px' } }, [
          el('div', { class: 'card-title', text: 'Progreso' }),
          el('div', { class: 'mono muted', text: doneCount + ' / ' + total })
        ]),
        el('div', { class: 'meter' }, el('i', { style: { '--p': (total ? doneCount / total * 100 : 0) + '%' } }))
      ]));
    }

    var any = false;
    order.forEach(function (g) {
      var list = groups[g[0]];
      if (!list.length) return;
      any = true;
      list.sort(function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : 1; });
      body.appendChild(el('div', { class: 'group-title' }, [
        el('span', { text: g[1] }),
        el('span', { class: 'count', text: String(list.length) })
      ]));
      body.appendChild(el('div', { class: 'list' }, list.map(taskItem)));
    });

    if (!any) {
      body.appendChild(el('div', { class: 'empty' }, [
        el('span', { html: icon('checkSquare') }),
        el('div', { text: 'Sin tareas por aquí' }),
        el('button', { class: 'btn primary', type: 'button', text: 'Crear la primera', onclick: function () { taskDialog(); } })
      ]));
    }

    host.appendChild(head);
    host.appendChild(subjChips);
    host.appendChild(body);
  }

  /* ============================================================== EXÁMENES */
  function examDialog(existing) {
    var title = U.input({ placeholder: 'Ej. Examen tema 3', value: existing ? existing.title : '' });
    var subject = U.select({}, subjectOptions(true), existing ? existing.subject || '' : '');
    var date = U.input({ type: 'date', value: existing && existing.date ? existing.date : '' });
    var note = U.textarea({ placeholder: 'Temario, material permitido, recordatorios…', style: { minHeight: '90px' } });
    if (existing) note.value = existing.note || '';

    U.modal({
      title: existing ? 'Editar examen' : 'Nuevo examen',
      icon: 'flame',
      body: [
        U.field('Título', title),
        el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-end' } }, [
          el('div', { class: 'grow' }, U.field('Materia', subject)),
          el('div', { class: 'grow' }, U.field('Fecha', date))
        ]),
        U.field('Notas', note)
      ],
      actions: [
        existing ? { label: 'Eliminar', kind: 'danger', onClick: function () { store.removeExam(existing.id); U.toast('Examen eliminado'); } } : null,
        { label: 'Cancelar' },
        {
          label: 'Guardar', kind: 'primary', onClick: function () {
            if (!date.value) { U.toast('Falta la fecha', 'warn'); return false; }
            var patch = {
              title: title.value.trim() || ((D.subject(subject.value) || {}).code || 'Examen'),
              subject: subject.value || null, date: date.value, note: note.value
            };
            if (existing) store.updateExam(existing.id, patch); else store.addExam(patch);
            HX.fx.tap('ok');
            U.toast('Examen guardado', 'ok');
          }
        }
      ].filter(Boolean)
    });
  }

  function renderExams(host) {
    var exams = store.state.exams.slice().sort(function (a, b) { return (a.date || '') < (b.date || '') ? -1 : 1; });

    host.appendChild(el('div', { class: 'row wrap between', style: { gap: '12px', marginBottom: '16px' } }, [
      el('div', { class: 'view-sub', text: exams.length ? exams.length + ' exámenes registrados' : 'Aún no hay exámenes' }),
      el('button', { class: 'btn primary', type: 'button', html: icon('plus') + '<span>Nuevo examen</span>', onclick: function () { examDialog(); } })
    ]));

    var upcoming = exams.filter(function (e) { return T.daysUntil(e.date) >= 0; });
    var past = exams.filter(function (e) { return T.daysUntil(e.date) < 0; });

    if (!exams.length) {
      host.appendChild(el('div', { class: 'empty' }, [
        el('span', { html: icon('flame') }),
        el('div', { text: 'Sin exámenes a la vista. Que dure.' }),
        el('button', { class: 'btn', type: 'button', text: 'Añadir examen', onclick: function () { examDialog(); } })
      ]));
      return;
    }

    function card(e) {
      var sub = D.subject(e.subject);
      var c = HX.skins.color(sub);
      var days = T.daysUntil(e.date);
      var ratio = days < 0 ? 1 : Math.max(0.03, Math.min(1, 1 - days / 21));
      var ring = U.ring(ratio, days <= 3 && days >= 0 ? 'var(--bad)' : c, [
        el('div', { class: 'd', text: days < 0 ? '—' : String(days) }),
        el('div', { class: 'u', text: days < 0 ? 'pasado' : days === 1 ? 'día' : 'días' })
      ]);
      ring.classList.add('exam-ring');

      return el('article', {
        class: 'exam-card card glass sheen', style: { '--c': c },
        dataset: { soon: String(days >= 0 && days <= 3), past: String(days < 0) }
      }, [
        ring,
        el('div', { class: 'exam-body' }, [
          el('div', { class: 'exam-title truncate', text: e.title || 'Examen' }),
          el('div', { class: 'exam-meta' }, [
            sub ? el('span', { class: 'tag', style: { '--c': c }, text: sub.code }) : null,
            el('span', { class: 'mono', text: T.shortDate(e.date) })
          ]),
          e.note ? el('div', { class: 'item-sub', style: { whiteSpace: 'pre-wrap' }, text: e.note }) : null,
          el('div', { class: 'row', style: { marginTop: '6px', gap: '6px' } }, [
            el('button', { class: 'btn sm', type: 'button', html: icon('edit') + '<span>Editar</span>', onclick: function () { examDialog(e); } }),
            el('button', { class: 'btn sm ghost', type: 'button', html: icon('checkSquare') + '<span>Crear repaso</span>', onclick: function () {
              store.addTask({ title: 'Repasar ' + (e.title || 'examen'), subject: e.subject, due: e.date, priority: 'high' });
              U.toast('Tarea de repaso creada', 'ok'); HX.fx.tap('ok');
            } })
          ])
        ])
      ]);
    }

    if (upcoming.length) {
      host.appendChild(el('div', { class: 'group-title' }, [el('span', { text: 'Próximos' }), el('span', { class: 'count', text: String(upcoming.length) })]));
      host.appendChild(el('div', { class: 'cards stagger' }, upcoming.map(card)));
    }
    if (past.length) {
      host.appendChild(el('div', { class: 'group-title' }, [el('span', { text: 'Pasados' }), el('span', { class: 'count', text: String(past.length) })]));
      host.appendChild(el('div', { class: 'cards' }, past.map(card)));
    }
  }

  /* ================================================================= NOTAS */
  function gradeDialog(subjectId) {
    var subject = U.select({}, subjectOptions(false), subjectId || Object.keys(D.SUBJECTS)[0]);
    var name = U.input({ placeholder: 'Ej. Examen UT2', value: '' });
    var value = U.input({ type: 'number', min: '0', max: '10', step: '0.01', placeholder: '7,5' });
    var weight = U.input({ type: 'number', min: '0.1', max: '10', step: '0.1', value: '1' });

    U.modal({
      title: 'Añadir nota',
      icon: 'chart',
      body: [
        U.field('Materia', subject),
        U.field('Prueba', name),
        el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-end' } }, [
          el('div', { class: 'grow' }, U.field('Calificación (0-10)', value)),
          el('div', { class: 'grow' }, U.field('Peso', weight))
        ])
      ],
      actions: [
        { label: 'Cancelar' },
        {
          label: 'Guardar', kind: 'primary', onClick: function () {
            var v = parseFloat(String(value.value).replace(',', '.'));
            if (isNaN(v)) { U.toast('Introduce una calificación', 'warn'); return false; }
            store.addGrade(subject.value, {
              name: name.value.trim() || 'Prueba',
              value: Math.max(0, Math.min(10, v)),
              weight: Math.max(0.1, parseFloat(weight.value) || 1)
            });
            HX.fx.tap('ok');
            U.toast('Nota guardada', 'ok');
          }
        }
      ]
    });
  }

  function renderGrades(host) {
    var ids = Object.keys(D.SUBJECTS);
    var withGrades = ids.filter(function (id) { return (store.state.grades[id] || []).length; });

    var all = [];
    withGrades.forEach(function (id) {
      var a = store.average(id);
      if (a != null) all.push(a);
    });
    var overall = all.length ? all.reduce(function (x, y) { return x + y; }, 0) / all.length : null;

    host.appendChild(el('div', { class: 'row wrap between', style: { gap: '12px', marginBottom: '16px' } }, [
      el('div', { class: 'row', style: { gap: '14px' } }, [
        el('div', { class: 'stat glass', style: { '--c': overall == null ? 'var(--ink-4)' : overall >= 5 ? 'var(--ok)' : 'var(--bad)', minWidth: '180px' } }, [
          el('div', { class: 'k', text: 'Media global' }),
          el('div', { class: 'v', text: overall == null ? '—' : overall.toFixed(2) }),
          el('div', { class: 'u', text: withGrades.length === 1 ? '1 materia con notas' : withGrades.length + ' materias con notas' })
        ])
      ]),
      el('button', { class: 'btn primary', type: 'button', html: icon('plus') + '<span>Añadir nota</span>', onclick: function () { gradeDialog(); } })
    ]));

    /* Barras por materia: un solo tono por materia, con línea del aprobado */
    host.appendChild(el('div', { class: 'card glass', style: { marginBottom: 'var(--gap)' } }, [
      el('div', { class: 'card-head' }, [
        el('span', { class: 'icon-btn', html: icon('chart'), style: { pointerEvents: 'none' } }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'card-title', text: 'Medias por materia' }),
          el('div', { class: 'view-sub', text: 'Escala 0–10 · la línea marca el 5' })
        ])
      ]),
      el('div', { class: 'bars' }, ids.map(function (id) {
        var s = D.SUBJECTS[id];
        var avg = store.average(id);
        return el('div', { class: 'bar-row' }, [
          el('div', { class: 'bar-label', text: s.code }),
          el('div', { class: 'bar-track' }, [
            el('div', { class: 'bar-fill', style: { '--w': ((avg || 0) / 10 * 100) + '%', '--c': s.chart } }),
            el('div', { class: 'bar-mark', style: { '--at': '50%' } })
          ]),
          el('div', { class: 'bar-value', text: avg == null ? '—' : avg.toFixed(2) })
        ]);
      })),
      el('div', { class: 'bar-legend' }, [
        el('span', { text: '▎ media ponderada de cada materia' }),
        el('span', { text: '│ 5,00 = aprobado' })
      ])
    ]));

    /* Detalle por materia */
    var cards = el('div', { class: 'cards' });
    ids.forEach(function (id) {
      var s = D.SUBJECTS[id];
      var list = store.state.grades[id] || [];
      var avg = store.average(id);
      cards.appendChild(el('div', { class: 'card glass', style: { '--c': HX.skins.color(s) } }, [
        el('div', { class: 'card-head' }, [
          el('span', { class: 'tag', style: { '--c': HX.skins.color(s) }, text: s.code }),
          el('div', { class: 'grow truncate', style: { fontSize: '12.5px', color: 'var(--ink-3)' }, text: s.name }),
          el('span', { class: 'mono', style: { color: avg == null ? 'var(--ink-4)' : avg >= 5 ? 'var(--ok)' : 'var(--bad)', fontWeight: '700' },
            text: avg == null ? '—' : avg.toFixed(2) })
        ]),
        list.length ? el('div', { class: 'list' }, list.map(function (g) {
          return el('div', { class: 'item' }, [
            el('div', { class: 'grow' }, [
              el('div', { class: 'item-title truncate', text: g.name }),
              el('div', { class: 'item-sub', text: 'peso ×' + g.weight })
            ]),
            el('span', { class: 'mono', style: { fontSize: '16px', fontWeight: '700', color: g.value >= 5 ? 'var(--ok)' : 'var(--bad)' },
              text: Number(g.value).toFixed(2) }),
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Eliminar nota', html: icon('trash'),
              onclick: function () { store.removeGrade(id, g.id); HX.fx.tap('down'); } })
          ]);
        })) : el('div', { class: 'view-sub', text: 'Sin notas todavía' }),
        el('button', { class: 'btn sm', type: 'button', style: { marginTop: '12px' }, html: icon('plus') + '<span>Añadir</span>',
          onclick: function () { gradeDialog(id); } })
      ]));
    });
    host.appendChild(cards);
  }

  /* ====================================================== MATERIA (modal) */
  function subjectDetail(id) {
    var s = D.subject(id);
    if (!s) return;
    var t = D.TEACHERS[s.teacher];

    var slots = [];
    D.DAYS.forEach(function (d) {
      D.blocksFor(d.key).forEach(function (b) {
        if (b.subject === id) {
          slots.push({ day: d, from: D.PERIODS[b.from], to: D.PERIODS[b.to], span: b.span });
        }
      });
    });

    var next = (function () {
      var probe = T.now();
      for (var i = 0; i < 14; i++) {
        var list = T.mergedSessionsOf(T.addDays(probe, i)).filter(function (x) {
          return x.subject === id && x.start.getTime() > T.now().getTime();
        });
        if (list.length) return list[0];
      }
      return null;
    })();

    var note = U.textarea({ placeholder: 'Apuntes rápidos, enlaces, lo que haga falta…' });
    note.value = store.state.notes[id] || '';
    var saveTimer;
    note.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { store.setNote(id, note.value); }, 400);
    });

    var avg = store.average(id);
    var pending = store.state.tasks.filter(function (x) { return x.subject === id && !x.done; });

    U.modal({
      title: s.code + ' · ' + s.name,
      subtitle: t.name,
      icon: 'book',
      body: [
        el('div', { class: 'row wrap', style: { gap: '10px' } }, [
          el('span', { class: 'tag', style: { '--c': HX.skins.color(s) }, text: D.WEEKLY[id] + ' h / semana' }),
          el('span', { class: 'tag', style: { '--c': avg == null ? 'var(--ink-4)' : avg >= 5 ? 'var(--ok)' : 'var(--bad)' },
            text: avg == null ? 'sin notas' : 'media ' + avg.toFixed(2) }),
          el('span', { class: 'tag', style: { '--c': pending.length ? 'var(--warn)' : 'var(--ok)' },
            text: pending.length + ' tareas pendientes' })
        ]),
        el('p', { class: 'dim', style: { fontSize: '13.5px', lineHeight: '1.6' }, text: s.about }),
        next ? el('div', { class: 'item accented', style: { '--c': HX.skins.color(s) } }, [
          el('span', { html: icon('zap'), style: { width: '18px', color: HX.skins.color(s) } }),
          el('div', { class: 'grow' }, [
            el('div', { class: 'item-title', text: 'Próxima sesión' }),
            el('div', { class: 'item-sub', text: T.longDate(next.start) + ' · ' + T.clock(next.start) + '–' + T.clock(next.end) })
          ]),
          el('span', { class: 'tag', style: { '--c': HX.skins.color(s) }, text: T.human(next.start.getTime() - T.now().getTime()) })
        ]) : null,
        el('div', {}, [
          el('div', { class: 'eyebrow', style: { marginBottom: '8px' }, text: 'En el horario' }),
          el('div', { class: 'subject-slots', style: { '--c': HX.skins.color(s) } }, slots.map(function (x) {
            return el('span', { class: 'slot-pill', style: { '--c': HX.skins.color(s) },
              text: x.day.short + ' ' + x.from.start + '–' + x.to.end });
          }))
        ]),
        U.field('Apuntes', note)
      ],
      actions: [
        { label: 'Nueva tarea', onClick: function () { setTimeout(function () { taskDialog({ subject: id, title: '', due: null, priority: 'normal', id: null }); }, 220); } },
        { label: 'Cerrar', kind: 'primary' }
      ]
    });
  }

  /* =============================================================== AJUSTES */
  var THEMES = [
    { id: 'aurora', name: 'Aurora', a: '#35e7ff', b: '#ff4ecd' },
    { id: 'synth', name: 'Synth', a: '#ff4ecd', b: '#7c5cff' },
    { id: 'toxic', name: 'Toxic', a: '#9dff3c', b: '#00ffc3' },
    { id: 'solar', name: 'Solar', a: '#ffb03c', b: '#ff5c3c' },
    { id: 'ice', name: 'Ice', a: '#8fd6ff', b: '#c9b6ff' },
    { id: 'vapor', name: 'Vapor', a: '#00ffd5', b: '#ff7ab8' },
    { id: 'carbon', name: 'Carbon', a: '#d6dcf0', b: '#8e97b8' },
    { id: 'nebula', name: 'Nebulosa', a: '#8b7cff', b: '#ff6ec7' },
    { id: 'mint', name: 'Menta', a: '#4fffc1', b: '#63b3ff' },
    { id: 'cobalt', name: 'Cobalto', a: '#4d8dff', b: '#22d3ee' },
    { id: 'ember', name: 'Brasa', a: '#ff6b3d', b: '#ffd166' },
    { id: 'sakura', name: 'Sakura', a: '#ff9bc4', b: '#b06cff' }
  ];

  function settingsCard(title, iconName, children) {
    return el('div', { class: 'card glass' }, [
      el('div', { class: 'card-head' }, [
        el('span', { class: 'icon-btn', html: icon(iconName), style: { pointerEvents: 'none' } }),
        el('div', { class: 'card-title', text: title })
      ])
    ].concat(children));
  }

  function renderSettings(host) {
    var s = store.state.settings;
    var grid = el('div', { class: 'settings-grid stagger' });

    /* Apariencia */
    var swatches = el('div', { class: 'theme-grid' }, THEMES.map(function (th) {
      return el('button', {
        class: 'theme-swatch', type: 'button', 'aria-pressed': String(s.theme === th.id),
        style: { '--a': th.a, '--b': th.b },
        onclick: function () {
          store.set('settings.theme', th.id);
          store.set('settings.accent', null);
          HX.fx.applySettings(); HX.fx.tap();
          HX.app.refresh();
        }
      }, el('span', { text: th.name }));
    }));

    var accent = el('input', {
      type: 'color', class: 'input', style: { height: '44px', padding: '4px' },
      value: s.accent || THEMES.find(function (t) { return t.id === s.theme; }).a,
      oninput: function (e) { store.set('settings.accent', e.target.value); HX.fx.applySettings(); }
    });

    function rangeRow(label, path, min, max, step, fmt) {
      var val = store.get(path);
      var out = el('span', { class: 'mono muted', text: fmt(val) });
      var input = el('input', {
        type: 'range', class: 'range', min: min, max: max, step: step, value: val,
        style: { '--pct': ((val - min) / (max - min) * 100) + '%' },
        oninput: function (e) {
          var v = parseFloat(e.target.value);
          store.set(path, v);
          e.target.style.setProperty('--pct', ((v - min) / (max - min) * 100) + '%');
          out.textContent = fmt(v);
          HX.fx.applySettings();
        }
      });
      return el('div', { class: 'field', style: { marginTop: '10px' } }, [
        el('div', { class: 'row between' }, [el('label', { text: label }), out]),
        input
      ]);
    }

    /* Lenguaje visual: la piel manda sobre forma, materia y movimiento */
    var skinGrid = el('div', { class: 'skin-grid' }, HX.skins.SKINS.map(function (sk) {
      return el('button', {
        class: 'skin-card', type: 'button', 'aria-pressed': String((s.skin || 'glass') === sk.id),
        dataset: { preview: sk.id },
        onclick: function () {
          store.set('settings.skin', sk.id);
          HX.fx.applySettings();
          HX.fx.tap('up');
          HX.app.refresh();
          U.toast('Lenguaje visual: ' + sk.name, 'ok');
        }
      }, [
        el('span', { class: 'skin-demo' }, [
          el('i', { class: 'd1' }), el('i', { class: 'd2' }), el('i', { class: 'd3' })
        ]),
        el('span', { class: 'skin-name', text: sk.name }),
        el('span', { class: 'skin-claim', text: sk.claim })
      ]);
    }));

    grid.appendChild(settingsCard('Lenguaje visual', 'sparkles', [
      el('p', { class: 'view-sub', style: { marginBottom: '12px' },
        text: 'Cada piel cambia forma, materia, tipografía y movimiento. El color va aparte.' }),
      skinGrid,
      el('p', { class: 'view-sub', style: { marginTop: '12px', lineHeight: '1.6' },
        text: HX.skins.byId(s.skin || 'glass').about })
    ]));

    grid.appendChild(settingsCard('Apariencia', 'sparkles', [
      el('div', { class: 'eyebrow', style: { margin: '2px 0 10px' }, text: 'Tema' }),
      swatches,
      el('div', { class: 'field', style: { marginTop: '14px' } }, [
        el('label', { text: 'Color de acento personalizado' }),
        el('div', { class: 'row', style: { gap: '10px' } }, [
          accent,
          el('button', { class: 'btn sm', type: 'button', text: 'Restablecer', onclick: function () {
            store.set('settings.accent', null); HX.fx.applySettings(); HX.app.refresh();
          } })
        ])
      ]),
      rangeRow('Desenfoque del cristal', 'settings.blur', 0, 40, 1, function (v) { return v + ' px'; }),
      rangeRow('Intensidad del neón', 'settings.glow', 0, 2, 0.1, function (v) { return Math.round(v * 100) + '%'; })
    ]));

    /* Efectos */
    grid.appendChild(settingsCard('Efectos', 'zap', [
      U.switchRow('Partículas de fondo', 'Red de puntos animada', s.particles, function (v) { store.set('settings.particles', v); HX.fx.applySettings(); }),
      U.switchRow('Grano de película', 'Textura sutil sobre todo', s.grain, function (v) { store.set('settings.grain', v); HX.fx.applySettings(); }),
      U.switchRow('Líneas de escaneo', 'Modo CRT retrofuturista', s.scanlines, function (v) { store.set('settings.scanlines', v); HX.fx.applySettings(); }),
      U.switchRow('Halo del cursor', 'Solo en ordenador', s.cursorGlow, function (v) { store.set('settings.cursorGlow', v); HX.fx.applySettings(); }),
      U.switchRow('Inclinar tarjetas', 'Siguen al cursor en 3D', s.tilt, function (v) { store.set('settings.tilt', v); HX.fx.applySettings(); }),
      U.switchRow('Sonido', 'Pitidos al interactuar', s.sound, function (v) { store.set('settings.sound', v); if (v) HX.fx.play('ok'); }),
      U.switchRow('Vibración', 'En móviles compatibles', s.haptics, function (v) { store.set('settings.haptics', v); if (v) HX.fx.buzz(20); }),
      U.switchRow('Reducir movimiento', 'Menos animación, más batería', s.reduceMotion, function (v) { store.set('settings.reduceMotion', v); HX.fx.applySettings(); })
    ]));

    /* Avisos */
    var notifyState = el('div', { class: 'view-sub', style: { marginTop: '6px' },
      text: !('Notification' in global) ? 'Este navegador no admite avisos' : 'Permiso: ' + Notification.permission });

    grid.appendChild(settingsCard('Avisos', 'bell', [
      U.switchRow('Avisarme antes de clase', 'Mientras la app esté abierta', s.notify, function (v) {
        if (v) {
          HX.notify.request().then(function (ok) {
            store.set('settings.notify', ok);
            notifyState.textContent = 'Permiso: ' + (global.Notification ? Notification.permission : 'no disponible');
            if (!ok) { U.toast('No se concedió permiso para avisos', 'warn'); HX.app.refresh(); }
            else U.toast('Avisos activados', 'ok');
          });
        } else {
          store.set('settings.notify', false);
        }
      }),
      el('div', { class: 'field', style: { marginTop: '4px' } }, [
        el('label', { text: 'Antelación' }),
        U.select({ onchange: function (e) { store.set('settings.notifyLead', +e.target.value); } },
          [1, 3, 5, 10, 15].map(function (n) { return { value: n, label: n + ' minutos antes' }; }), s.notifyLead)
      ]),
      notifyState,
      el('button', { class: 'btn sm', type: 'button', style: { marginTop: '10px' }, text: 'Probar aviso',
        onclick: function () { HX.notify.test(); } })
    ]));

    /* Datos */
    var fileInput = el('input', { type: 'file', accept: 'application/json', class: 'hidden', onchange: function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          store.importJSON(String(reader.result));
          HX.fx.applySettings();
          HX.app.refresh();
          U.toast('Datos importados', 'ok');
        } catch (err) {
          U.toast('El archivo no es válido', 'bad');
        }
      };
      reader.readAsText(file);
    } });

    grid.appendChild(settingsCard('Tus datos', 'download', [
      el('p', { class: 'view-sub', style: { marginBottom: '12px' },
        text: 'Todo se guarda en este dispositivo. Nada sale de aquí.' }),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        el('button', { class: 'btn', type: 'button', html: icon('download') + '<span>Exportar</span>', onclick: function () {
          var blob = new Blob([store.exportJSON()], { type: 'application/json' });
          var a = el('a', { href: URL.createObjectURL(blob), download: 'horario-2gm-' + T.iso(T.now()) + '.json' });
          document.body.appendChild(a); a.click(); a.remove();
          U.toast('Copia descargada', 'ok');
        } }),
        el('button', { class: 'btn', type: 'button', html: icon('upload') + '<span>Importar</span>', onclick: function () { fileInput.click(); } }),
        el('button', { class: 'btn danger', type: 'button', html: icon('trash') + '<span>Borrar todo</span>', onclick: function () {
          U.confirm('¿Borrar todos los datos?', 'Se eliminarán tareas, exámenes, notas y ajustes de este dispositivo. El horario seguirá intacto.', true)
            .then(function (ok) {
              if (!ok) return;
              store.reset(); HX.fx.applySettings(); HX.app.refresh();
              U.toast('Datos borrados');
            });
        } }),
        fileInput
      ])
    ]));

    /* Acerca de */
    var install = el('button', { class: 'btn primary block hidden', type: 'button', html: icon('phone') + '<span>Instalar en el dispositivo</span>',
      onclick: function () { HX.app.install(); } });
    HX.app.registerInstallButton(install);

    grid.appendChild(settingsCard('Acerca de', 'info', [
      el('div', {}, [
        el('div', { class: 'about-line' }, [el('span', { text: 'Centro' }), el('b', { text: D.SCHOOL.name })]),
        el('div', { class: 'about-line' }, [el('span', { text: 'Grupo' }), el('b', { text: D.SCHOOL.group + ' · ' + D.SCHOOL.course })]),
        el('div', { class: 'about-line' }, [el('span', { text: 'Curso' }), el('b', { text: D.SCHOOL.year })]),
        el('div', { class: 'about-line' }, [el('span', { text: 'Periodos' }), el('b', { text: D.SCHOOL.totalPeriods + ' lectivos/semana' })]),
        el('div', { class: 'about-line' }, [el('span', { text: 'Versión' }), el('b', { text: HX.VERSION })])
      ]),
      el('div', { style: { marginTop: '14px' } }, install),
      el('button', { class: 'btn block', type: 'button', style: { marginTop: '8px' }, html: icon('sparkles') + '<span>Ver atajos de teclado</span>',
        onclick: function () { HX.app.showShortcuts(); } })
    ]));

    host.appendChild(grid);
  }

  HX.viewsStudy = {
    renderTasks: renderTasks, renderExams: renderExams, renderGrades: renderGrades,
    renderSettings: renderSettings, subjectDetail: subjectDetail,
    taskDialog: taskDialog, examDialog: examDialog, gradeDialog: gradeDialog,
    THEMES: THEMES
  };
})(window);
