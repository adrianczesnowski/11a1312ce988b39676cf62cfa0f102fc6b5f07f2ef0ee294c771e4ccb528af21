// =====================================================
// KONFIGURACJA SERVICE WORKERA
// =====================================================

const CACHE_VERSION = "v24";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Lista plików niezbędnych do uruchomienia aplikacji
const APP_SHELL_ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./manifest.json",
    "./js/app.js",
    "./js/db.js",
    "./js/geo.js",
    "./js/speech.js",
    "./js/settings.js",
    "./js/notes.js",
    "./js/ui.js",
    "./assets/icon-192.png"
];

// =====================================================
// CYKL ŻYCIA SW
// =====================================================

/**
 * Zdarzenie instalacji.
 * Pobiera i cache'uje statyczne zasoby aplikacji.
 */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => {
            return cache.addAll(APP_SHELL_ASSETS);
        })
    );
    self.skipWaiting();
});

/**
 * Zdarzenie aktywacji.
 * Usuwa przestarzałe wersje cache'u przy aktualizacji wersji.
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(k))
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// =====================================================
// OBSŁUGA ZAPYTAŃ SIECIOWYCH
// =====================================================

/**
 * Interceptor zapytań fetch.
 * Implementuje strategie cache'owania dla różnych typów zasobów.
 */
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Ignorowanie domen zewnętrznych
    if (url.origin !== self.location.origin) return;

    // Strategia dla nawigacji: Zawsze zwraca index.html
    if (req.mode === "navigate") {
        event.respondWith(
            caches.match("./index.html").then((cached) => cached || fetch(req))
        );
        return;
    }

    // Strategia: Cache First dla plików statycznych (App Shell)
    const isAppShell = APP_SHELL_ASSETS.includes(url.pathname) || url.pathname === "/";
    if (isAppShell) {
        event.respondWith(cacheFirst(req));
        return;
    }

    // Strategia: Stale-While-Revalidate dla pozostałych zasobów
    event.respondWith(staleWhileRevalidate(req));
});

// Pomocnicza: Najpierw cache, potem sieć (z aktualizacją cache'u)
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const fresh = await fetch(request);
        const cache = await caches.open(APP_SHELL_CACHE);
        cache.put(request, fresh.clone());
        return fresh;
    } catch (e) {
        return new Response('Network error', { status: 408 });
    }
}

// Pomocnicza: Zwróć cache natychmiast, w tle pobierz nową wersję
async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const networkFetch = fetch(request)
        .then((fresh) => {
            cache.put(request, fresh.clone());
            return fresh;
        })
        .catch(() => cached);

    return cached || networkFetch;
}