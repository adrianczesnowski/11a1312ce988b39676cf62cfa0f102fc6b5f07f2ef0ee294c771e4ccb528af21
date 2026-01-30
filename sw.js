const CACHE_VERSION = "v27";
const APP_CACHE_NAME = `travel-notes-${CACHE_VERSION}`;

// Lista plików do zapisania w pamięci urządzenia
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

// 1. INSTALACJA: Pobierz i zapisz pliki
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then((cache) => {
            console.log("SW: Cache'owanie plików aplikacji");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. AKTYWACJA: Usuń stare wersje cache
self.addEventListener("activate", (event) => {
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
    self.clients.claim();
});

// 3. POBIERANIE Strategia Cache First (Najpierw Pamięć, potem Sieć)
self.addEventListener("fetch", (event) => {
    const req = event.request;

    if (req.method !== "GET") return;

    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            // 1. Jeśli plik jest w cache, zwróć go
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Jeśli nie ma w cache, spróbuj pobrać z sieci
            return fetch(req)
                .then((networkResponse) => {
                    return networkResponse;
                })
                .catch(() => {
                    if (req.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});