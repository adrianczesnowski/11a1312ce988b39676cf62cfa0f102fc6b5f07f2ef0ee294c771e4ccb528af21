/**
 * Moduł obsługi Web Speech API (Rozpoznawanie mowy).
 * Dostarcza interfejs do sterowania mikrofonem i przetwarzania mowy na tekst.
 */

// Obsługa prefiksów przeglądarek (Chrome, Safari, Edge)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let rec = null;

/**
 * Sprawdza, czy przeglądarka obsługuje rozpoznawanie mowy.
 * @returns {boolean} True, jeśli API jest dostępne.
 */
export function available() {
    return !!SpeechRecognition;
}

/**
 * Uruchamia nasłuchiwanie i rozpoznawanie mowy.
 * * @param {function(string): void} onResult - Callback wywoływany po pomyślnym rozpoznaniu fragmentu tekstu. Otrzymuje tekst jako argument.
 * @param {function(Error): void} [onError] - Opcjonalny callback wywoływany w przypadku błędu API.
 * @param {function(): void} [onEnd] - Opcjonalny callback wywoływany po zakończeniu sesji nagrywania (automatycznym lub ręcznym).
 */
export function start(onResult, onError, onEnd) {
    if (!available()) {
        if (onError) onError(new Error('SpeechRecognition not available'));
        return;
    }

    rec = new SpeechRecognition();
    rec.lang = 'pl-PL';
    rec.interimResults = false; // Zwracaj tylko sfinalizowane wyniki
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
        if (e.results.length > 0) {
            const transcript = e.results[e.results.length - 1][0].transcript.trim();
            if (onResult) onResult(transcript);
        }
    };

    rec.onerror = (e) => {
        console.error('Speech API Error:', e);
        if (onError) onError(e);
    };

    rec.onend = () => {
        if (onEnd) onEnd();
    };

    try {
        rec.start();
    } catch (e) {
        console.warn('Speech start error', e);
    }
}

/**
 * Zatrzymuje aktywne nasłuchiwanie.
 * Wywołanie tej metody spowoduje wyzwolenie zdarzenia `onend`.
 */
export function stop() {
    if (rec) {
        rec.stop();
        rec = null;
    }
}