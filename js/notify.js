/* ===========================================================================
   AVISOS — recordatorio antes de cada clase (mientras la app esté abierta)
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var T = HX.time, D = HX.data, store = HX.store;
  var fired = {};

  function supported() { return 'Notification' in global; }

  function request() {
    if (!supported()) return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);
    if (Notification.permission === 'denied') return Promise.resolve(false);
    return Notification.requestPermission().then(function (p) { return p === 'granted'; });
  }

  function send(title, body) {
    if (!supported() || Notification.permission !== 'granted') return null;
    try {
      return new Notification(title, {
        body: body,
        icon: 'assets/icon-192.png',
        badge: 'assets/icon-192.png',
        tag: 'horario-2gm',
        renotify: false
      });
    } catch (e) {
      return null;
    }
  }

  function test() {
    request().then(function (ok) {
      if (!ok) { HX.ui.toast('Sin permiso para enviar avisos', 'warn'); return; }
      send('Horario 2º GM', 'Los avisos funcionan. Te recordaré cada clase.');
      HX.ui.toast('Aviso de prueba enviado', 'ok');
    });
  }

  /* Comprueba cada minuto si toca avisar de la próxima clase. */
  function tick() {
    if (!store.get('settings.notify') || !supported() || Notification.permission !== 'granted') return;
    var lead = (store.get('settings.notifyLead') || 5) * 60000;
    var next = T.nextSession();
    if (!next) return;
    var key = next.start.getTime() + ':' + next.subject;
    var delta = next.start.getTime() - Date.now();
    if (delta <= lead && delta > 0 && !fired[key]) {
      fired[key] = true;
      var s = D.subject(next.subject);
      send(s.code + ' en ' + Math.max(1, Math.round(delta / 60000)) + ' min',
        s.name + ' · ' + D.TEACHERS[s.teacher].name + ' · ' + T.clock(next.start) + '–' + T.clock(next.end));
      HX.fx.play('alert');
    }
  }

  HX.notify = { supported: supported, request: request, send: send, test: test, tick: tick };
})(window);
