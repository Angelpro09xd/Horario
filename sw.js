/* ===========================================================================
   Service worker — la app funciona sin conexión
   =========================================================================== */
var VERSION = 'horario-v1.0.3';
var CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/core.css',
  'css/fx.css',
  'css/layout.css',
  'css/components.css',
  'css/views.css',
  'js/data.js',
  'js/store.js',
  'js/ui.js',
  'js/fx.js',
  'js/time.js',
  'js/notify.js',
  'js/focus.js',
  'js/palette.js',
  'js/views-schedule.js',
  'js/views-study.js',
  'js/app.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;

  /* Documentos: red primero, caché de respaldo (para ver siempre la última versión) */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  /* Resto: caché primero con revalidación en segundo plano */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200 && (sameOrigin || res.type === 'cors')) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
