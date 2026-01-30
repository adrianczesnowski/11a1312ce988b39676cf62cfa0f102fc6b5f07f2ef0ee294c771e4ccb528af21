const CACHE_VERSION = "v30-repair";
const APP_CACHE_NAME = `travel-notes-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./js/app.js",
    "./js/ui.js",
    "./js/notes.js",
    "./js/geo.js",
    "./js/settings.js",
    "./js/db.js",
    "./js/speech.js",
    "./assets/icon-192.png"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener("activate", (event) => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== APP_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Strategia: Network First dla HTML (żeby zawsze mieć świeżą wersję strony)
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Strategia: Stale-While-Revalidate dla reszty (szybkie ładowanie + aktualizacja w tle)
    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            const networkFetch = fetch(req).then((networkResponse) => {
                // Aktualizuj cache w tle
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(APP_CACHE_NAME).then((cache) => {
                        cache.put(req, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
            });

            return cachedResponse || networkFetch;
        })
    );
});