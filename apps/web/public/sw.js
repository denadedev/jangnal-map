// 홈 화면 설치 조건(서비스 워커의 fetch 처리)을 채우는 최소 워커.
// 페이지 이동은 네트워크를 먼저 쓰고, 오프라인일 때만 마지막으로 받은 홈 화면을 보여 준다.
const CACHE = "jangnal-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/")));
});
