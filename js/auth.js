const Auth = (() => {
    const CRED_KEY = 'webauthn-cred';
    const PIN_KEY = 'securenotes-pin';

    /**
     * @function register - Rejestruje biometrię urządzenia (WebAuthn).
     */
    async function register() {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const pubKey = {
                challenge,
                rp: { name: 'FajneNotatki' },
                user: { id: new TextEncoder().encode('user'), name: 'user', displayName: 'Użytkownik' },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                authenticatorSelection: { authenticatorAttachment: 'platform' },
                timeout: 60000
            };
            const cred = await navigator.credentials.create({ publicKey: pubKey });
            if (cred) {
                localStorage.setItem(CRED_KEY, btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
                return true;
            }
        } catch (e) { console.error(e); }
        return false;
    }

    /**
     * @function login - Weryfikuje biometrię użytkownika.
     */
    async function login() {
        try {
            const stored = localStorage.getItem(CRED_KEY);
            if (!stored) return false;
            const id = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
            const assertion = await navigator.credentials.get({
                publicKey: { challenge: new Uint8Array(32), allowCredentials: [{ id, type: 'public-key' }] }
            });
            return !!assertion;
        } catch (e) { return false; }
    }

    /**
     * @function setPin - Zapisuje PIN w localStorage.
     */
    function setPin(pin) { localStorage.setItem(PIN_KEY, pin); }

    /**
     * @function checkPin - Sprawdza zgodność podanego PINu.
     */
    function checkPin(pin) { return localStorage.getItem(PIN_KEY) === pin; }

    return { register, login, setPin, checkPin };
})();