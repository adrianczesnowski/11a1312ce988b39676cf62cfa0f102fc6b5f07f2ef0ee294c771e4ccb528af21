/**
 * Moduł obsługi Web Speech API.
 */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let rec = null;

export function available() {
    return !!SpeechRecognition;
}

/**
 * Uruchamia nasłuchiwanie.
 */
export function start(onResult, onError, onEnd) {
    if (!available()) {
        if (onError) onError(new Error('Brak obsługi Speech API w tej przeglądarce'));
        return;
    }

    try {
        rec = new SpeechRecognition();
        rec.lang = 'pl-PL';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.continuous = false;

        rec.onresult = (e) => {
            if (e.results && e.results.length > 0) {
                const result = e.results[0][0];
                const transcript = result.transcript.trim();
                if (onResult && transcript) onResult(transcript);
            }
        };

        rec.onerror = (e) => {
            console.error("Speech Error:", e.error);
            if (onError) onError(e);
        };

        rec.onend = () => {
            if (onEnd) onEnd();
        };

        rec.start();
        console.log("Rozpoczęto nasłuchiwanie...");

    } catch (e) {
        console.error("Błąd startu Speech:", e);
        if (onEnd) onEnd();
    }
}

export function stop() {
    if (rec) {
        try {
            rec.stop();
        } catch (e) {
            console.warn("Nie można zatrzymać, prawdopodobnie już zatrzymane");
        }
        rec = null;
    }
}