/* ロケハンダッシュボード service worker */
const CACHE = "nagi-v8.0.0";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icons/Nagi.png",
  "./icons/nagi-wordmark.png",
  "./favicon.ico",
  "./icons/favicon-16.png", "./icons/favicon-32.png", "./icons/favicon-48.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // 予報API: ネット優先、成功したらキャッシュ更新、圏外なら最後の取得結果
  if (url.hostname.endsWith("open-meteo.com")) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // アプリ本体: キャッシュ優先(オフラインで確実に起動)
  if (e.request.method === "GET" && url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
