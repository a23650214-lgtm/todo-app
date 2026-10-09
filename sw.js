// =====================================================
//  sw.js - 오프라인 도우미 (서비스 워커)
//  인터넷이 되면: 최신 파일을 받아 쓰고, 복사본을 보관해 둬요.
//  인터넷이 안 되면: 보관해 둔 복사본으로 앱을 열어요.
//
//  ※ 새 파일(js 등)을 추가하면 아래 FILES 목록에도 적어 주세요.
// =====================================================

const CACHE_NAME = 'todo-calendar-v34';
const FONT_CACHE = 'todo-calendar-fonts';   // 받아 둔 글씨체 (버전이 바뀌어도 지우지 않아요)

const FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/dates.js',
  './js/storage.js',
  './js/tasks.js',
  './js/calendar.js',
  './js/vendor/Sortable.min.js',
  './js/calendar-drag.js',
  './js/habit-view.js',
  './js/streaks.js',
  './js/habit-list.js',
  './js/verses.js',
  './js/quotes.js',
  './js/home-view.js',
  './js/tabs.js',
  './js/month-picker.js',
  './js/dday.js',
  './js/month-goals.js',
  './js/drag-sort.js',
  './js/day-view.js',
  './js/goal-view.js',
  './js/emoji-picker.js',
  './js/color-picker.js',
  './js/task-edit.js',
  './js/fonts.js',
  './js/appearance.js',
  './js/notifier.js',
  './js/settings-view.js',
  './js/bucket.js',
  './js/bucket-view.js',
  './js/day-sheet.js',
  './js/screens.js',
  './js/nicknames.js',
  './js/settings-screen.js',
  './js/profile-view.js',
  './js/continuation.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// 설치될 때: 파일 복사본 보관하기
self.addEventListener('install', (event) => {
  // cache: 'reload' → 브라우저가 잠깐 들고 있는 옛 파일 말고, 꼭 서버에서 새로 받아요
  // (안 그러면 새 버전 복사본에 옛 파일이 섞여 들어갈 수 있어요)
  event.waitUntil(caches.open(CACHE_NAME).then((cache) =>
    cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' })))
  ));
  self.skipWaiting();
});

// 새 버전이 켜질 때: 옛날 복사본 지우기
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME && name !== FONT_CACHE).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// 알림을 눌렀을 때: 열려 있는 앱으로 가거나, 없으면 새로 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      if (windows.length > 0) return windows[0].focus();
      return self.clients.openWindow('./');
    })
  );
});

// 파일을 달라고 할 때: 인터넷 먼저, 안 되면 복사본
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // 구글 폰트 글씨체: 보관해 둔 게 있으면 그걸 쓰고 (빠르고 오프라인에서도 돼요), 없으면 받아서 보관
  const host = new URL(request.url).hostname;
  if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((saved) => saved || fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        }))
      )
    );
    return;
  }

  if (!request.url.startsWith(self.location.origin)) return;

  // cache: 'no-cache' → 서버에 "바뀐 게 있나요?" 꼭 물어보고 받아요
  // (GitHub Pages는 브라우저가 파일을 10분 동안 들고 있게 해서, 그냥 받으면 올린 직후에 옛 파일이 섞여요)
  event.respondWith(
    fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
