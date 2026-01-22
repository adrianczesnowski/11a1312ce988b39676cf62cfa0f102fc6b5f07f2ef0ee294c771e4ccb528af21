const CACHE_NAME = 'fajne-notatki-v4';
const OFFLINE_URL = './index.html';

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    './js/auth.js',
    './js/speech.js',
    './assets/icon-192.png',
    './assets/icon-256.png',
    './assets/icon-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cacheowanie plików static');
                return cache.addAll(STATIC_ASSETS);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Usuwanie starego cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(e.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, cacheCopy);
                    });
                }
                return networkResponse;
            }).catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
            });
        })
    );
});