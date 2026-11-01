// v2：網頁本體永遠「網路優先」並同步更新快取，避免離線/弱網時載入到舊版 index.html 而寫入舊資料
const CACHE_NAME = 'liu-engineering-quote-v2';

const CORE = ['./', './index.html', './manifest.json'];
const CDN = [
  'https://cdn-icons-png.flaticon.com/512/1005/1005141.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // 新版 SW 立即接手
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // 逐一快取：任一項失敗不會讓整個安裝失敗
      Promise.all(
        [...CORE, ...CDN].map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => { if (res && (res.ok || res.type === 'opaque')) return cache.put(url, res); })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;
  // 資料庫相關請求完全不攔截
  if (url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('securetoken.googleapis.com') ||
      url.includes('firebaseinstallations.googleapis.com')) {
    return;
  }

  // 網路優先；成功就更新快取；失敗才用快取（頁面導覽失敗時回退到 index.html）
  event.respondWith(
    fetch(req, req.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/') ? { cache: 'no-cache' } : undefined)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(hit =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
