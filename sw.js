/* 每日报数 PWA — Service Worker: 缓存应用外壳,离线也能打开 */
var CACHE = 'baoshu-shell-v2';
var ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // 数据请求(跨域 POST 到 Apps Script)直接放行,不缓存
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 应用外壳: 先用缓存(离线可用),后台再更新缓存
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (cached) {
      var update = fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || update;
    })
  );
});
