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
      light: false
    },
    {
      id: 'material',
      name: 'Material Expressive',
      claim: 'Formas tonales y muelles, al estilo de Google',
      about: 'Superficies tonales sin desenfoque, esquinas muy redondeadas que se deforman al pulsar y movimiento con rebote.',
      ink: 'neon',
      particles: 'bokeh',
      light: false
    },
    {
      id: 'hud',
      name: 'Telemetría',
      claim: 'Instrumental técnico, tinta y retícula',
      about: 'Lenguaje propio: sin curvas ni brillos, esquinas achaflanadas, retícula milimetrada, rótulos monoespaciados y barridos de escaneo.',
      ink: 'neon',
      particles: 'grid',
      light: false
    },
    {
      id: 'paper',
      name: 'Papel Riso',
      claim: 'Tinta plana sobre papel, en claro',
      about: 'Lenguaje propio: impresión risográfica, tramas de semitono, sombras duras desplazadas y registro imperfecto.',
      ink: 'chart',
      particles: 'none',
      light: true
    }
  ];

  function byId(id) {
    for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i];
    return SKINS[0];
  }

  function current() {
    return byId(HX.store ? HX.store.get('settings.skin', 'glass') : 'glass');
  }

  /* Color de una materia en la piel activa: neón sobre fondo oscuro,
     tinta saturada sobre papel. */
  function color(subject) {
    if (!subject) return 'var(--accent)';
    var s = typeof subject === 'string' ? HX.data.subject(subject) : subject;
    if (!s) return 'var(--accent)';
    return current().ink === 'chart' ? s.chart : s.neon;
  }

  HX.skins = { SKINS: SKINS, byId: byId, current: current, color: color };
})(window);
