const Auth = (() => {
    const CRED_KEY = 'webauthn-cred';
    const PIN_KEY = 'securenotes-pin';

    /**
     * Rejestruje nowe poświadczenie biometryczne (WebAuthn/Passkeys).
     * Tworzy parę kluczy i zapisuje identyfikator (rawId) w localStorage.
     * Wymaga kontekstu bezpiecznego (HTTPS lub localhost).
     */
    async function register() {
        try {
            // Generowanie losowego challenge'a dla serwera (tutaj symulowane lokalnie)
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const pubKey = {
                challenge,
                rp: { name: 'FajneNotatki' },
                user: {
                    id: new TextEncoder().encode('user'),
                    name: 'user',
                    displayName: 'Użytkownik'
                },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                authenticatorSelection: { authenticatorAttachment: 'platform' },
                timeout: 60000
            };

            const cred = await navigator.credentials.create({ publicKey: pubKey });

            if (cred) {
                // Konwersja rawId na format stringa bezpiecznego dla localStorage
                localStorage.setItem(CRED_KEY, btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
                return true;
            }
        } catch (e) {
            console.error('Auth Register Error:', e);
        }
        return false;
    }

    /**
     * Weryfikuje tożsamość użytkownika przy użyciu zapisanej biometrii.
     * Żąda podpisu cyfrowego dla challenge'a.
     */
    async function login() {
        try {
            const stored = localStorage.getItem(CRED_KEY);
            if (!stored) return false;

            const id = Uint8Array.from(atob(stored), c => c.charCodeAt(0));

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    allowCredentials: [{ id, type: 'public-key' }]
                }
            });

            return !!assertion;
        } catch (e) {
            return false;
        }
    }

    /**
     * Zapisuje kod PIN w pamięci lokalnej przeglądarki.
     * @param {string} pin - Kod PIN do zapisania.
     */
    function setPin(pin) {
        localStorage.setItem(PIN_KEY, pin);
    }

    /**
     * Sprawdza zgodność podanego PINu z zapisanym wzorcem.
     * @param {string} pin - Wprowadzony kod PIN.
     * @returns {boolean}
     */
    function checkPin(pin) {
        return localStorage.getItem(PIN_KEY) === pin;
    }

    return { register, login, setPin, checkPin };
})();