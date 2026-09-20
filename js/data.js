/* ===========================================================================
   HORARIO // 2º GM  ·  Datos base del curso
   I.E.S. Alfonso XI — Alcalá la Real
   Fuente: parte oficial "Grupos de alumnos · 2º GM" (Peñalara, 14/09/2026)
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});

  /* --- Centro y grupo ---------------------------------------------------- */
  var SCHOOL = {
    name: 'I.E.S. Alfonso XI',
    city: 'Alcalá la Real',
    group: '2º GM',
    course: 'Sistemas Microinformáticos y Redes',
    year: '2026 / 2027',
    totalPeriods: 30
  };

  /* --- Profesorado ------------------------------------------------------- */
  var TEACHERS = {
    ALVAREZ:   { id: 'ALVAREZ',   name: 'Jesús Álvarez Jiménez',           short: 'Álva. Ji, Je',   periods: 6 },
    MESA:      { id: 'MESA',      name: 'Francisco José Mesa Castillo',    short: 'Mesa Ca, FrJo',  periods: 3 },
    MUNOZ:     { id: 'MUNOZ',     name: 'María Dolores Muñoz Muñoz',       short: 'Muñoz Mu, MaDo', periods: 7 },
    PENA:      { id: 'PENA',      name: 'Juan Antonio Peña Martín',        short: 'Peña Ma, JuAn',  periods: 2 },
    PRATS:     { id: 'PRATS',     name: 'Antonia Prats Campos',            short: 'Prats Ca, An',   periods: 6 },
    ROCHINA:   { id: 'ROCHINA',   name: 'Paula Rochina García',            short: 'Roch. Ga, Pa',   periods: 4 },
    RODRIGUEZ: { id: 'RODRIGUEZ', name: 'Nuria María Rodríguez Navarro',   short: 'Rodr Na, NuMa',  periods: 2 }
  };

  /* --- Materias ----------------------------------------------------------
     `neon`  → color de identidad (hereda el color del parte en papel)
     `chart` → paso validado para gráficos sobre fondo oscuro              */
  var SUBJECTS = {
    SERRE:  { id: 'SERRE',  code: 'SERRE',  name: 'Servicios en Red',
              teacher: 'ALVAREZ',   neon: '#2FD9FF', chart: '#15a2d8', icon: '🛰️',
              about: 'Servicios de red: DNS, DHCP, web, correo, FTP y acceso remoto.' },
    IPE2:   { id: 'IPE2',   code: 'IPE II', name: 'Itinerario Personal para la Empleabilidad II',
              teacher: 'MESA',      neon: '#FF5C7A', chart: '#ed5a7c', icon: '🧭',
              about: 'Orientación laboral, emprendimiento y proyecto profesional.' },
    APLWE:  { id: 'APLWE',  code: 'APLWE',  name: 'Aplicaciones Web',
              teacher: 'MUNOZ',     neon: '#C9E44B', chart: '#82a326', icon: '🌐',
              about: 'Gestores de contenidos, ofimática web y aplicaciones en servidor.' },
    INGPRO: { id: 'INGPRO', code: 'INGPRO', name: 'Inglés Profesional',
              teacher: 'PENA',      neon: '#7CA7FF', chart: '#7b89f2', icon: '🗣️',
              about: 'Inglés técnico aplicado al sector informático.' },
    SIOPR:  { id: 'SIOPR',  code: 'SIOPR',  name: 'Sistemas Operativos en Red',
              teacher: 'PRATS',     neon: '#FFC53D', chart: '#b58f00', icon: '🖧',
              about: 'Windows Server y GNU/Linux: dominios, usuarios y recursos compartidos.' },
    SINF:   { id: 'SINF',   code: 'SINF',   name: 'Sistemas Informáticos',
              teacher: 'ROCHINA',   neon: '#2BE38B', chart: '#18af74', icon: '💾',
              about: 'Hardware, sistemas operativos y mantenimiento de equipos.' },
    PI:     { id: 'PI',     code: 'PI',     name: 'Proyecto Intermodular',
              teacher: 'RODRIGUEZ', neon: '#FF8A3C', chart: '#e26e39', icon: '🚀',
              about: 'Proyecto que integra los resultados de aprendizaje del ciclo.' }
  };

  /* --- Tramos horarios ---------------------------------------------------
     `kind`: 'lesson' | 'break'                                            */
  var PERIODS = [
    { i: 0, start: '08:30', end: '09:30', kind: 'lesson', label: '1ª' },
    { i: 1, start: '09:30', end: '10:30', kind: 'lesson', label: '2ª' },
    { i: 2, start: '10:30', end: '11:30', kind: 'lesson', label: '3ª' },
    { i: 3, start: '11:30', end: '12:00', kind: 'break',  label: 'Recreo' },
    { i: 4, start: '12:00', end: '13:00', kind: 'lesson', label: '4ª' },
    { i: 5, start: '13:00', end: '14:00', kind: 'lesson', label: '5ª' },
    { i: 6, start: '14:00', end: '15:00', kind: 'lesson', label: '6ª' }
  ];

  var DAYS = [
    { i: 1, key: 'mon', name: 'Lunes',     short: 'Lun', letter: 'L' },
    { i: 2, key: 'tue', name: 'Martes',    short: 'Mar', letter: 'M' },
    { i: 3, key: 'wed', name: 'Miércoles', short: 'Mié', letter: 'X' },
    { i: 4, key: 'thu', name: 'Jueves',    short: 'Jue', letter: 'J' },
    { i: 5, key: 'fri', name: 'Viernes',   short: 'Vie', letter: 'V' }
  ];

  /* --- Horario (índice = índice de tramo; null = recreo) ------------------ */
  var TIMETABLE = {
    mon: ['SERRE',  'SERRE',  'SINF',  null, 'INGPRO', 'APLWE', 'SIOPR'],
    tue: ['IPE2',   'SINF',   'APLWE', null, 'APLWE',  'SERRE', 'SIOPR'],
    wed: ['SERRE',  'INGPRO', 'APLWE', null, 'APLWE',  'PI',    'PI'   ],
    thu: ['SIOPR',  'SIOPR',  'SERRE', null, 'IPE2',   'SINF',  'APLWE'],
    fri: ['SERRE',  'SIOPR',  'SIOPR', null, 'APLWE',  'SINF',  'IPE2' ]
  };

  /* --- Calendario (editable desde Ajustes) -------------------------------
     Fechas orientativas del curso 2026/27 en Andalucía. */
  var CALENDAR = {
    termStart: '2026-09-15',
    termEnd:   '2027-06-22',
    holidays: [
      { name: 'Fiesta Nacional',        from: '2026-10-12', to: '2026-10-12' },
      { name: 'Todos los Santos',       from: '2026-11-02', to: '2026-11-02' },
      { name: 'Día de la Constitución', from: '2026-12-07', to: '2026-12-08' },
      { name: 'Navidad',                from: '2026-12-23', to: '2027-01-07' },
      { name: 'Día de Andalucía',       from: '2027-03-01', to: '2027-03-01' },
      { name: 'Semana Santa',           from: '2027-03-22', to: '2027-03-28' },
      { name: 'Fin de curso',           from: '2027-06-23', to: '2027-06-23' }
    ]
  };

  /* --- Derivados ---------------------------------------------------------- */
  function toMin(hhmm) {
    var p = hhmm.split(':');
    return (+p[0]) * 60 + (+p[1]);
  }

  PERIODS.forEach(function (p) {
    p.startMin = toMin(p.start);
    p.endMin = toMin(p.end);
    p.duration = p.endMin - p.startMin;
  });

  var DAY_START = PERIODS[0].startMin;
  var DAY_END = PERIODS[PERIODS.length - 1].endMin;

  /* Horas semanales por materia, calculadas del propio horario. */
  var WEEKLY = (function () {
    var out = {};
    Object.keys(SUBJECTS).forEach(function (id) { out[id] = 0; });
    DAYS.forEach(function (d) {
      TIMETABLE[d.key].forEach(function (id) { if (id) out[id]++; });
    });
    return out;
  })();

  /* Bloques contiguos por día: {subject, from, to, span} */
  function blocksFor(dayKey) {
    var row = TIMETABLE[dayKey], out = [], i = 0;
    while (i < PERIODS.length) {
      var id = row[i];
      if (!id) { out.push({ subject: null, from: i, to: i, span: 1 }); i++; continue; }
      var j = i;
      while (j + 1 < PERIODS.length && row[j + 1] === id && PERIODS[j + 1].kind === 'lesson') j++;
      out.push({ subject: id, from: i, to: j, span: j - i + 1 });
      i = j + 1;
    }
    return out;
  }

  HX.data = {
    SCHOOL: SCHOOL,
    TEACHERS: TEACHERS,
    SUBJECTS: SUBJECTS,
    PERIODS: PERIODS,
    DAYS: DAYS,
    TIMETABLE: TIMETABLE,
    CALENDAR: CALENDAR,
    WEEKLY: WEEKLY,
    DAY_START: DAY_START,
    DAY_END: DAY_END,
    toMin: toMin,
    blocksFor: blocksFor,
    subject: function (id) { return SUBJECTS[id] || null; },
    teacherOf: function (id) {
      var s = SUBJECTS[id];
      return s ? TEACHERS[s.teacher] : null;
    },
    dayByIndex: function (n) {
      for (var i = 0; i < DAYS.length; i++) if (DAYS[i].i === n) return DAYS[i];
      return null;
    }
  };
})(window);
