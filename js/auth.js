const CRED_KEY = 'webauthn-cred';
const PIN_KEY = 'securenotes-pin-hash';
const SESSION_KEY = 'is-logged-in';

/**
 * Pomocnicza funkcja do hashowania PIN-u (SHA-256).
 * Zwraca ciąg heksadecymalny.
 * @param {string} pin
 * @returns {Promise<string>}
 */
async function hashPin(pin) {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rejestruje biometrię (WebAuthn).
 * to jest implementacja Client-Side. Bez backendu
 * nie jest to pełne zabezpieczenie kryptograficzne, a jedynie powiązanie credentiala z przeglądarką.
 */
export async function registerBiometrics() {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const pubKey = {
            challenge,
            rp: { name: 'FajneNotatki' },
            user: {
                id: crypto.getRandomValues(new Uint8Array(16)),
                name: 'user@local',
                displayName: 'Użytkownik'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: { authenticatorAttachment: 'platform' },
            timeout: 60000
        };

        const cred = await navigator.credentials.create({ publicKey: pubKey });
        if (cred) {
            localStorage.setItem(CRED_KEY, btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
            return true;
        }
    } catch (e) {
        console.error('Auth Register Error:', e);
    }
    return false;
}

/**
 * Logowanie biometryczne.
 */
export async function loginBiometrics() {
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

        // W prawdziwej aplikacji nastąpiłaby weryfikacja podpisu na serwerze
        if (assertion) {
            setSession(true);
            return true;
        }
    } catch (e) {
        console.warn('Biometrics check failed', e);
    }
    return false;
}

/**
 * Zapisuje zahashowany PIN.
 * @param {string} pin
 */
export async function setPin(pin) {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_KEY, hash);
}

/**
 * Sprawdza poprawność PINu.
 * @param {string} pin
 */
export async function checkPin(pin) {
    const hash = await hashPin(pin);
    const storedHash = localStorage.getItem(PIN_KEY);
    const isValid = hash === storedHash;
    if (isValid) setSession(true);
    return isValid;
}

/**
 * Ustawia flagę sesji (utrzymywaną do zamknięcia karty).
 * @param {boolean} status 
 */
function setSession(status) {
    if (status) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Sprawdza, czy użytkownik jest już zalogowany w tej sesji przeglądarki.
 */
export function isSessionActive() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
}

/**
 * Sprawdza, czy użytkownik ma skonfigurowany PIN (czy to powracający user).
 */
export function hasAccount() {
    return !!localStorage.getItem(PIN_KEY);
}

export function clearData() {
    localStorage.removeItem(CRED_KEY);
    localStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
}