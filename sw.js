/**
 * SERVICE WORKER — FajneNotatki
 * Odpowiada za:
 * - Pre-cache: Pobieranie i zapisywanie plików interfejsu przy instalacji.
 * - Strategie buforowania: Decydowanie skąd brać dane (sieć vs cache).
 * - Zarządzanie cyklem życia: Przejmowanie kontroli nad stroną bez odświeżania.
 */

// =====================================================
// KONFIGURACJA CACHE
// =====================================================

// Zmiana wersji wymusza usunięcie starych danych i pobranie nowych
const CACHE_VERSION = "v6";

// Magazyn dla plików statycznych (App Shell)
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;

// Magazyn dla zasobów pobieranych w trakcie pracy (np. obrazy zewnętrzne)
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// =====================================================
// LISTA ZASOBÓW (APP SHELL)
// =====================================================
// Kluczowe pliki, które muszą działać offline.
// UWAGA: Używamy ścieżek relatywnych "./", aby działały na GitHub/Netlify.
const APP_SHELL_ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./manifest.json",
    "./js/app.js",
    "./js/db.js",
    "./js/auth.js",
    "./js/speech.js",
    "./sw.js",
    "./assets/icon-192.png"
];

// =====================================================
// ZDARZENIE: INSTALL
// =====================================================
/**
 * @function install - Wywoływana przy pierwszym wejściu na stronę lub zmianie kodu SW.
 * Otwiera magazyn APP_SHELL_CACHE i zapisuje w nim listę plików ASSETS.
 */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => {
            console.log("[SW] Instalacja: Cache'owanie zasobów");
            return cache.addAll(APP_SHELL_ASSETS);
        })
    );

    // skipWaiting wymusza, aby nowy SW od razu stał się aktywny
    self.skipWaiting();
});

// =====================================================
// ZDARZENIE: ACTIVATE
// =====================================================
/**
 * @function activate - Wywoływana, gdy nowy SW przejmuje kontrolę.
 * Służy do czyszczenia starych wersji cache (np. v5, gdy instalujemy v6).
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(k))
                    .map((k) => {
                        console.log("[SW] Usuwanie starego cache:", k);
                        return caches.delete(k);
                    })
            )
        )
    );

    // clients.claim pozwala SW zacząć działać na otwartych kartach bez ich odświeżania
    self.clients.claim();
});

// =====================================================
// ZDARZENIE: FETCH
// =====================================================
/**
 * @function fetch - Interceptor wszystkich zapytań przeglądarki o pliki.
 */
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Ignoruj zapytania do zewnętrznych domen (np. analityka, inne api)
    if (url.origin !== self.location.origin) return;

    // NAVIGATION FALLBACK: Jeśli użytkownik odświeży stronę offline (brak pliku w cache),
    // zawsze zwróć index.html, aby aplikacja mogła wystartować.
    if (req.mode === "navigate") {
        event.respondWith(
            caches.match("./index.html").then((cached) => cached || fetch(req))
        );
        return;
    }

    // APP SHELL — STRATEGIA: CACHE FIRST
    // Dla plików JS, CSS, HTML: najpierw szukaj w pamięci, jeśli brak — pobierz z sieci.
    const isAppShell = APP_SHELL_ASSETS.includes(url.pathname) || url.pathname === "/";
    if (isAppShell) {
        event.respondWith(cacheFirst(req));
        return;
    }

    // RUNTIME — STRATEGIA: STALE WHILE REVALIDATE
    // Dla reszty plików: zwróć szybko to co masz w cache, ale w tle pobierz świeżą wersję.
    event.respondWith(staleWhileRevalidate(req));
});

// =====================================================
// STRATEGIE POBIERANIA (POMOCNICZE)
// =====================================================

/**
 * @function cacheFirst - Najpierw sprawdza cache. Jeśli nie znajdzie pliku,
 * pobiera go z sieci i przy okazji zapisuje kopię w cache.
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const fresh = await fetch(request);
    const cache = await caches.open(APP_SHELL_CACHE);
    cache.put(request, fresh.clone());

    return fresh;
}

/**
 * @function staleWhileRevalidate - Zwraca zasób z cache (szybkość),
 * a w tle wysyła zapytanie do sieci, by zaktualizować cache na następny raz.
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const networkFetch = fetch(request)
        .then((fresh) => {
            cache.put(request, fresh.clone());
            return fresh;
        })
        .catch(() => cached); // Jeśli brak sieci, zwróć to co było w cache

    return cached || networkFetch;
}