const CACHE_NAME = 'liu-engineering-quote-v1';

const urlsToCache = [
  './',
  // 注意：強烈建議將您的主網頁檔案命名為 index.html，若您使用的是「報價系統.html」，請更改成您的檔名
  './index.html', 
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/1005/1005141.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 安裝 Service Worker 並快取基本資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache successfully');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截請求，優先使用網路，網路失敗時使用快取 (Network First Strategy)
self.addEventListener('fetch', event => {
  // 忽略 Firebase/Google API 請求，避免干擾即時資料庫運作
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 清理舊的快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});