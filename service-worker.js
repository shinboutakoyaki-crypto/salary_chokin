// ★ バージョンを上げるたびにキャッシュが自動クリアされる
const CACHE_VERSION = 'v20260616';
const CACHE_NAME = 'chokinbako-' + CACHE_VERSION;

// キャッシュするファイル（オフライン時に使う最小限のもの）
const STATIC_ASSETS = [
  './',
  './index-5-6.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時：静的ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 待機せず即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを全削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 古いキャッシュを削除:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ：Network First（常にネットから取得、失敗時のみキャッシュ）
self.addEventListener('fetch', event => {
  // POSTリクエストやChrome拡張はスキップ
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 有効なレスポンスならキャッシュを更新
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request).then(cached => {
          return cached || new Response('オフラインです。接続を確認してください。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});

// index.htmlからのskipWaitingメッセージを受信
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
