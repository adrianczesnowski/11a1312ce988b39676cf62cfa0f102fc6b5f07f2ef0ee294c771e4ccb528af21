const CACHE_VERSION = "v5";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./manifest.json",
    "./js/app.js",
    "./sw.js",
    "./js/db.js",
    "./js/auth.js",
    "./js/speech.js",
    "./assets/icon-192.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
    );
    self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);

    if (url.origin !== self.location.origin) return;

    if (req.mode === "navigate") {
        event.respondWith(
            caches.match("./index.html").then((cached) => cached || fetch(req))
        );
        return;
    }

    const isAppShell = APP_SHELL_ASSETS.includes(url.pathname) || url.pathname === "/";
    if (isAppShell) {
        event.respondWith(
            caches.match(req).then((cached) => {
                return cached || fetch(req).then((fresh) => {
                    const cacheCopy = fresh.clone();
                    caches.open(APP_SHELL_CACHE).then(c => c.put(req, cacheCopy));
                    return fresh;
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
            return cache.match(req).then((cached) => {
                const networkFetch = fetch(req).then((fresh) => {
                    cache.put(req, fresh.clone());
                    return fresh;
                });
                return cached || networkFetch;
            });
        })
    );
});