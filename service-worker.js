const CACHE_NAME = 'chokinkako-v2';

// インストール時（即座に有効化）
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ネットワーク優先・失敗時にキャッシュ使用
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('yahoo') ||
      url.includes('allorigins') ||
      url.includes('corsproxy') ||
      url.includes('codetabs')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        return cached || caches.match('./index.html');
      });
    })
  );
});
