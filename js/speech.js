const Speech = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    let rec = null;
    let onResultCallback, onErrorCallback, onEndCallback;

    // Sprawdza dostępność rozpoznawania mowy
    function available() {
        return !!SpeechRecognition;
    }

    // Rozpoczyna rozpoznawanie mowy
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
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onresult = e => {
            const transcript = e.results[e.results.length - 1][0].transcript.trim();
            if (onResultCallback) onResultCallback(transcript);
        };

        rec.onerror = e => {
            console.error('Błąd rozpoznawania mowy:', e);
            if (onErrorCallback) onErrorCallback(e);
        };

        rec.onend = () => {
            if (onEndCallback) onEndCallback();
        };

        rec.start();
    }

    // Zatrzymuje rozpoznawanie mowy
    function stop() {
        if (rec) {
            rec.stop();
            rec = null;
        }
    }

    return { available, start, stop };
})();