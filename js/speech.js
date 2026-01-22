const Speech = (() => {
    // Obsługa prefiksów dla różnych przeglądarek (Chrome, Safari, etc.)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    let rec = null;
    let onResultCallback, onErrorCallback, onEndCallback;

    /**
     * Sprawdza dostępność API SpeechRecognition w przeglądarce.
     * @returns {boolean}
     */
    function available() {
        return !!SpeechRecognition;
    }

    /**
     * Inicjuje i uruchamia nasłuchiwanie.
     * @param {Function} onResult - Callback wywoływany po rozpoznaniu tekstu.
     * @param {Function} onError - Callback błędów.
     * @param {Function} onEnd - Callback wywoływany po zakończeniu sesji nagrywania.
     */
    function start(onResult, onError, onEnd) {
        if (!available()) {
            if (onError) onError(new Error('SpeechRecognition not available'));
            return;
        }

        onResultCallback = onResult;
        onErrorCallback = onError;
        onEndCallback = onEnd;

        rec = new SpeechRecognition();
        rec.lang = 'pl-PL';
        rec.interimResults = false; // Zwracamy tylko finalne wyniki
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
            const transcript = e.results[e.results.length - 1][0].transcript.trim();
            if (onResultCallback) onResultCallback(transcript);
        };

        rec.onerror = (e) => {
            console.error('Speech API Error:', e);
            if (onErrorCallback) onErrorCallback(e);
        };

        rec.onend = () => {
            if (onEndCallback) onEndCallback();
        };

        try {
            rec.start();
        } catch (e) {
            console.warn('Speech recognition start failed', e);
        }
    }

    /**
     * Przerywa aktywne nasłuchiwanie.
     */
    function stop() {
        if (rec) {
            rec.stop();
            rec = null;
        }
    }

    return { available, start, stop };
})();