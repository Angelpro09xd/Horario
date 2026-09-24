/* ===========================================================================
   Store — estado persistente en localStorage + bus de eventos
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var KEY = 'hx.v1.state';

  var DEFAULTS = {
    settings: {
      skin: 'glass',
      theme: 'aurora',
      accent: null,           // null → el del tema
      blur: 22,
      glow: 1,
      particles: true,
      grain: true,
      scanlines: false,
      cursorGlow: true,
      tilt: true,
      sound: false,
      haptics: true,
      reduceMotion: false,
      density: 'comfy',       // comfy | compact
      startView: 'auto',      // auto | week | now
      notify: false,
      notifyLead: 5,
      seenTour: false
    },
    tasks: [],
    exams: [],
    grades: {},               // subjectId → [{ id, name, value, weight }]
    notes: {},                // subjectId → string
    pins: [],                 // ids de materia favoritas
    stats: { opens: 0, focusMinutes: 0, lastOpen: null },
    seededExams: false
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, extra) {
    var out = clone(base);
    if (!extra || typeof extra !== 'object') return out;
    Object.keys(extra).forEach(function (k) {
      var v = extra[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = merge(out[k], v);
      } else if (v !== undefined) {
        out[k] = v;
      }
    });
    return out;
  }

  var state = clone(DEFAULTS);
  var listeners = {};
  var saveTimer = null;

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) state = merge(DEFAULTS, JSON.parse(raw));
    } catch (e) {
      console.warn('[store] no se pudo leer el estado guardado:', e);
    }
    return state;
  }

  function persist() {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[store] no se pudo guardar:', e);
    }
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 120);
  }

  function on(evt, fn) {
    (listeners[evt] || (listeners[evt] = [])).push(fn);
    return function () { off(evt, fn); };
  }

  function off(evt, fn) {
    var arr = listeners[evt];
    if (!arr) return;
    var i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }

  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[store] listener', evt, e); }
    });
    if (evt !== '*') emit('*', { type: evt, payload: payload });
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  var store = {
    KEY: KEY,
    DEFAULTS: DEFAULTS,
    get state() { return state; },
    load: load,
    save: save,
    on: on,
    off: off,
    emit: emit,
    uid: uid,

    /* ---- Ajustes ---- */
    set: function (path, value) {
      var parts = path.split('.'), obj = state;
      for (var i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      save();
      emit('change', { path: path, value: value });
      return value;
    },
    get: function (path, fallback) {
      var parts = path.split('.'), obj = state;
      for (var i = 0; i < parts.length; i++) {
        if (obj == null) return fallback;
        obj = obj[parts[i]];
      }
      return obj === undefined ? fallback : obj;
    },

    /* ---- Tareas ---- */
    addTask: function (task) {
      var t = merge({ id: uid('t'), title: '', subject: null, due: null, priority: 'normal', done: false, created: Date.now() }, task);
      state.tasks.push(t);
      save(); emit('tasks', state.tasks);
      return t;
    },
    updateTask: function (id, patch) {
      var t = state.tasks.find(function (x) { return x.id === id; });
      if (!t) return null;
      Object.assign(t, patch);
      save(); emit('tasks', state.tasks);
      return t;
    },
    removeTask: function (id) {
      state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
      save(); emit('tasks', state.tasks);
    },

    /* ---- Exámenes ---- */
    addExam: function (exam) {
      var e = merge({ id: uid('e'), subject: null, title: 'Examen', date: null, note: '' }, exam);
      state.exams.push(e);
      save(); emit('exams', state.exams);
      return e;
    },
    updateExam: function (id, patch) {
      var e = state.exams.find(function (x) { return x.id === id; });
      if (!e) return null;
      Object.assign(e, patch);
      save(); emit('exams', state.exams);
      return e;
    },
    removeExam: function (id) {
      state.exams = state.exams.filter(function (x) { return x.id !== id; });
      save(); emit('exams', state.exams);
    },

    /* ---- Notas (calificaciones) ---- */
    addGrade: function (subjectId, grade) {
      var list = state.grades[subjectId] || (state.grades[subjectId] = []);
      var g = merge({ id: uid('g'), name: 'Prueba', value: 0, weight: 1 }, grade);
      list.push(g);
      save(); emit('grades', state.grades);
      return g;
    },
    removeGrade: function (subjectId, id) {
      if (!state.grades[subjectId]) return;
      state.grades[subjectId] = state.grades[subjectId].filter(function (g) { return g.id !== id; });
      save(); emit('grades', state.grades);
    },
    average: function (subjectId) {
      var list = state.grades[subjectId] || [];
      if (!list.length) return null;
      var sw = 0, sv = 0;
      list.forEach(function (g) {
        var w = Number(g.weight) || 1;
        sw += w; sv += (Number(g.value) || 0) * w;
      });
      return sw ? sv / sw : null;
    },

    /* ---- Apuntes ---- */
    setNote: function (subjectId, text) {
      state.notes[subjectId] = text;
      save(); emit('notes', state.notes);
    },

    /* ---- Import / export ---- */
    exportJSON: function () {
      return JSON.stringify({ app: 'horario-2gm', version: 1, exported: new Date().toISOString(), state: state }, null, 2);
    },
    importJSON: function (raw) {
      var parsed = JSON.parse(raw);
      var incoming = parsed && parsed.state ? parsed.state : parsed;
      state = merge(DEFAULTS, incoming);
      persist();
      emit('import', state);
      return state;
    },
    reset: function () {
      state = clone(DEFAULTS);
      persist();
      emit('import', state);
    }
  };

  HX.store = store;
})(window);
