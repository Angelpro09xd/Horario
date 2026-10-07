/* ===========================================================================
   PIELES — lenguajes visuales completos (forma, materia, tipo y movimiento).
   El color va aparte, en los temas: cualquier paleta funciona con cualquier
   piel.
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});

  var SKINS = [
    {
      id: 'glass',
      name: 'Liquid Glass',
      claim: 'Cristal líquido, neón y profundidad',
      about: 'Capas translúcidas con desenfoque, bordes luminosos y auroras de fondo.',
      ink: 'neon',           /* color de materia que usa */
      particles: 'constellation',
      light: false,
      knobs: ['blur', 'glow'],
      fx: ['particles', 'grain', 'scanlines', 'refraction']
    },
    {
      id: 'material',
      name: 'Material Expressive',
      claim: 'Formas tonales y muelles, al estilo de Google',
      about: 'Superficies tonales sin desenfoque, esquinas muy redondeadas que se deforman al pulsar y movimiento con rebote.',
      ink: 'neon',
      particles: 'bokeh',
      light: false,
      knobs: [],
      fx: ['particles']
    },
    {
      id: 'hud',
      name: 'Telemetría',
      claim: 'Instrumental técnico, tinta y retícula',
      about: 'Lenguaje propio: sin curvas ni brillos, esquinas achaflanadas, retícula milimetrada, rótulos monoespaciados y barridos de escaneo.',
      ink: 'neon',
      particles: 'grid',
      light: false,
      knobs: ['glow'],
      fx: ['particles', 'grain', 'scanlines']
    },
    {
      id: 'apple',
      name: 'Apple HIG',
      claim: 'Dos capas, cristal solo en los controles',
      about: 'Las Human Interface Guidelines al pie de la letra: el cristal líquido vive únicamente en la capa funcional (barras, carril y hojas) y la capa de contenido es opaca. Claro u oscuro según el sistema, color reservado a la acción principal y movimiento breve.',
      ink: 'auto',          /* tinta sobre claro, neón sobre oscuro */
      particles: 'none',
      light: 'system',
      knobs: [],
      fx: ['refraction']
    },
    {
      id: 'paper',
      name: 'Papel Riso',
      claim: 'Tinta plana sobre papel, en claro',
      about: 'Lenguaje propio: impresión risográfica, tramas de semitono, sombras duras desplazadas y registro imperfecto.',
      ink: 'chart',
      particles: 'none',
      light: true,
      knobs: [],
      fx: ['grain']
    }
  ];

  function byId(id) {
    for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i];
    return SKINS[0];
  }

  function current() {
    return byId(HX.store ? HX.store.get('settings.skin', 'glass') : 'glass');
  }

  /* ¿La piel se está viendo en claro? Con `light: 'system'` manda el sistema. */
  function isLight(skin) {
    var sk = skin || current();
    if (sk.light === 'system') {
      return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches);
    }
    return !!sk.light;
  }

  /* Color de una materia en la piel activa: neón sobre fondo oscuro,
     tinta saturada sobre claro. */
  function color(subject) {
    if (!subject) return 'var(--accent)';
    var s = typeof subject === 'string' ? HX.data.subject(subject) : subject;
    if (!s) return 'var(--accent)';
    var sk = current();
    var tinta = sk.ink === 'chart' || (sk.ink === 'auto' && isLight(sk));
    return tinta ? s.chart : s.neon;
  }

  /* ¿Esta piel usa ese mando o ese efecto? */
  function usa(lista, nombre) {
    var sk = current();
    return (sk[lista] || []).indexOf(nombre) >= 0;
  }

  HX.skins = {
    SKINS: SKINS, byId: byId, current: current, color: color, isLight: isLight,
    hasKnob: function (n) { return usa('knobs', n); },
    hasFx: function (n) { return usa('fx', n); }
  };
})(window);
