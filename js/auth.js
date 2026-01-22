const Auth = (() => {
    const CRED_STORE = 'webauthn-cred';

    // Sprawdza dostępność platformowego uwierzytelniania
    function isPlatformAvailable() {
        return (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) ?
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : Promise.resolve(false);
    }

    // Rejestruje nowe uwierzytelnienie
    async function register() {
        try {
            const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
            const pubKey = { challenge, rp: { name: 'FajneNotatki' }, user: { id: new TextEncoder().encode('local-user'), name: 'local-user', displayName: 'local-user' }, pubKeyCredParams: [{ alg: -7, type: 'public-key' }], authenticatorSelection: { authenticatorAttachment: 'platform' }, timeout: 60000, attestation: 'none' };
            const cred = await navigator.credentials.create({ publicKey: pubKey });
            if (cred) { localStorage.setItem(CRED_STORE, btoa(String.fromCharCode(...new Uint8Array(cred.rawId)))); return true; }
        } catch (e) {
            console.error(e);
        }
        return false;
    }

    // Loguje użytkownika za pomocą uwierzytelnienia
    async function login() {
        try {
            const stored = localStorage.getItem(CRED_STORE); if (!stored) throw new Error('no-cred');
            const id = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
            const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
            const pubKey = { challenge, allowCredentials: [{ id, type: 'public-key', transports: ['internal'] }], timeout: 60000, userVerification: 'preferred' };
            const assertion = await navigator.credentials.get({ publicKey: pubKey });
            return !!assertion;
        } catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Ustawia kod PIN
    function setPin(pin) {
        localStorage.setItem('securenotes-pin', pin);
    }

    // Sprawdza kod PIN
    function checkPin(pin) {
        return localStorage.getItem('securenotes-pin') === pin;
    }

    // Eksportowane funkcje
    return { isPlatformAvailable, register, login, setPin, checkPin };
})();