/**
 * Moduł obsługi Geolocation API.
 */

export function isSupported() {
    return 'geolocation' in navigator;
}

/**
 * Pobiera aktualną pozycję użytkownika.
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
export function getPosition() {
    return new Promise((resolve, reject) => {
        if (!isSupported()) {
            reject(new Error('Geolokalizacja nie jest wspierana'));
            return;
        }

        const options = {
            enableHighAccuracy: true, // Dokładna pozycja
            timeout: 10000,           // Czekaj max 10 sekund
            maximumAge: 0             // Nie używaj cache
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                });
            },
            (err) => {
                console.warn('Błąd lokalizacji:', err.message);
                resolve(null);
            },
            options
        );
    });
}

/**
 * Generuje link do Map Google.
 */
export function getMapLink(lat, lon) {
    return `https://www.google.com/maps?q=${lat},${lon}`;
}