/* ===========================================================================
   PALETA DE COMANDOS — Ctrl/⌘ + K
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var D = HX.data, U = HX.ui, store = HX.store;
  var el = U.el, icon = U.icon;

  var node = null, input = null, list = null, items = [], active = 0, isOpen = false;

  function commands() {
    var out = [
      { id: 'week', label: 'Ir al horario semanal', icon: 'calendar', hint: '1', run: function () { HX.app.go('week'); } },
      { id: 'now', label: 'Ir a Ahora', icon: 'clock', hint: '2', run: function () { HX.app.go('now'); } },
      { id: 'tasks', label: 'Ir a Tareas', icon: 'checkSquare', hint: '3', run: function () { HX.app.go('tasks'); } },
      { id: 'exams', label: 'Ir a Exámenes', icon: 'flame', hint: '4', run: function () { HX.app.go('exams'); } },
      { id: 'grades', label: 'Ir a Notas', icon: 'chart', hint: '5', run: function () { HX.app.go('grades'); } },
      { id: 'subjects', label: 'Ir a Materias', icon: 'book', hint: '6', run: function () { HX.app.go('subjects'); } },
      { id: 'settings', label: 'Ir a Ajustes', icon: 'sliders', hint: '7', run: function () { HX.app.go('settings'); } },
      { id: 'focus', label: 'Modo foco a pantalla completa', icon: 'expand', hint: 'F', run: function () { HX.focus.open(); } },
      { id: 'newtask', label: 'Nueva tarea', icon: 'plus', hint: 'N', run: function () { HX.viewsStudy.taskDialog(); } },
      { id: 'newexam', label: 'Nuevo examen', icon: 'flame', run: function () { HX.viewsStudy.examDialog(); } },
      { id: 'newgrade', label: 'Añadir nota', icon: 'chart', run: function () { HX.viewsStudy.gradeDialog(); } },
      { id: 'shortcuts', label: 'Ver atajos de teclado', icon: 'info', hint: '?', run: function () { HX.app.showShortcuts(); } }
    ];

    Object.keys(D.SUBJECTS).forEach(function (id) {
      var s = D.SUBJECTS[id];
      out.push({
        id: 'subj-' + id, label: 'Materia · ' + s.code + ' — ' + s.name, icon: 'book',
        run: function () { HX.app.openSubject(id); }
      });
    });

    HX.viewsStudy.THEMES.forEach(function (t) {
      out.push({
        id: 'theme-' + t.id, label: 'Tema · ' + t.name, icon: 'sparkles',
        run: function () {
          store.set('settings.theme', t.id);
          store.set('settings.accent', null);
          HX.fx.applySettings(); HX.app.refresh();
          U.toast('Tema ' + t.name, 'ok');
        }
      });
    });

    out.push({
      id: 'toggle-sound', label: 'Sonido: ' + (store.get('settings.sound') ? 'desactivar' : 'activar'), icon: 'zap',
      run: function () { store.set('settings.sound', !store.get('settings.sound')); HX.app.refresh(); }
    });
    out.push({
      id: 'toggle-motion', label: (store.get('settings.reduceMotion') ? 'Activar' : 'Reducir') + ' animaciones', icon: 'sparkles',
      run: function () { store.set('settings.reduceMotion', !store.get('settings.reduceMotion')); HX.fx.applySettings(); HX.app.refresh(); }
    });

    return out;
  }

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function score(query, label) {
    var q = norm(query), l = norm(label);
    if (!q) return 1;
    if (l.indexOf(q) >= 0) return 100 - l.indexOf(q);
    /* coincidencia por subsecuencia */
    var i = 0;
    for (var c = 0; c < l.length && i < q.length; c++) if (l[c] === q[i]) i++;
    return i === q.length ? 20 : 0;
  }

  function render() {
    var q = input.value;
    items = commands()
      .map(function (c) { return { cmd: c, s: score(q, c.label) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 9)
      .map(function (x) { return x.cmd; });

    active = 0;
    U.clear(list);
    if (!items.length) {
      list.appendChild(el('div', { class: 'palette-item', text: 'Sin resultados' }));
      return;
    }
    items.forEach(function (c, i) {
      list.appendChild(el('button', {
        class: 'palette-item', type: 'button', dataset: { active: String(i === 0) },
        onmouseenter: function () { setActive(i); },
        onclick: function () { run(i); }
      }, [
        el('span', { class: 'ico', html: icon(c.icon || 'sparkles') }),
        el('span', { class: 'grow truncate', text: c.label }),
        c.hint ? el('span', { class: 'hint', text: c.hint }) : null
      ]));
    });
  }

  function setActive(i) {
    active = i;
    U.qsa('.palette-item', list).forEach(function (n, idx) { n.dataset.active = String(idx === i); });
  }

  function run(i) {
    var c = items[i];
    if (!c) return;
    close();
    setTimeout(function () { c.run(); }, 60);
  }

  function build() {
    input = el('input', {
      type: 'text', placeholder: 'Buscar acción, materia o tema…', 'aria-label': 'Buscar comando',
      oninput: render,
      onkeydown: function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(active + 1, items.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); run(active); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
      }
    });
    list = el('div', { class: 'palette-list' });
    node = el('div', { class: 'palette glass', role: 'dialog', 'aria-label': 'Paleta de comandos' }, [input, list]);
    document.body.appendChild(node);
    node.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function open() {
    if (!node) build();
    isOpen = true;
    input.value = '';
    render();
    node.classList.add('open');
    document.body.addEventListener('click', onOutside, true);
    setTimeout(function () { input.focus(); }, 90);
  }

  function close() {
    isOpen = false;
    if (node) {
      node.classList.remove('open');
      if (input) input.blur();   /* si no, el foco sigue en el campo y los atajos se ignoran */
    }
    document.body.removeEventListener('click', onOutside, true);
  }

  function onOutside(e) {
    if (node && !node.contains(e.target)) close();
  }

  function toggle() { isOpen ? close() : open(); }

  HX.palette = { open: open, close: close, toggle: toggle, get isOpen() { return isOpen; } };
})(window);
