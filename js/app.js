import { UI, showView, showModal, addClick } from './ui.js';
import * as Auth from './auth.js';
import * as Notes from './notes.js';
import * as Settings from './settings.js';
import * as Speech from './speech.js';

// ==========================================
// ZMIENNE STANU (Kamera / Głos)
// ==========================================
let cameraStream = null;
let isListening = false;

// ==========================================
// INICJALIZACJA
// ==========================================

async function init() {
    // Sprawdzanie sesji
    if (Auth.isSessionActive()) {
        enterApp();
        return;
    }

    // Konfiguracja UI logowania
    const hasAcc = Auth.hasAccount();
    if (hasAcc) {
        UI.auth.cardRegister.classList.add('hidden');
    } else {
        UI.auth.cardLogin.querySelector('.card-header').innerText = 'WITAJ!';
        // Ukryj biometrię jeśli brak konta
        UI.auth.btnBiometrics.classList.add('hidden');
    }
}

function enterApp() {
    showView('list', stopCamera);
    Notes.loadNotes();
}

// ==========================================
// OBSŁUGA ZDARZEŃ (EVENT LISTENERS)
// ==========================================

// --- AUTH ---
addClick('btn-auth-biometrics', async () => {
    if (await Auth.loginBiometrics()) enterApp();
    else showModal('Błąd', 'Weryfikacja nieudana.');
});

addClick('btn-auth-pin-login-show', () => {
    UI.auth.loginPinArea.classList.remove('hidden');
    UI.auth.loginPinInput.focus();
    UI.auth.btnPinShow.classList.add('hidden');
});

addClick('btn-auth-pin-submit', async () => {
    const pin = UI.auth.loginPinInput.value;
    if (await Auth.checkPin(pin)) enterApp();
    else {
        showModal('Błąd', 'Zły PIN.');
        UI.auth.loginPinInput.value = '';
    }
});

// Rejestracja
addClick('btn-register-pin-save', async () => {
    const pin = document.getElementById('register-pin-input').value;
    if (pin.length < 4) return showModal('Info', 'Min. 4 cyfry.');
    await Auth.setPin(pin);
    showModal('Sukces', 'PIN zapisany.');
});

addClick('btn-auth-register', async () => {
    if (await Auth.registerBiometrics()) {
        UI.auth.btnRegisterBio.innerText = 'Biometria dodana ✓';
        UI.auth.btnRegisterBio.classList.replace('outline', 'success');
    } else {
        showModal('Info', 'Błąd lub brak obsługi biometrii.');
    }
});

addClick('btn-enter-app-fresh', async () => {
    if (!Auth.hasAccount()) return showModal('Błąd', 'Ustaw PIN.');
    const regPin = document.getElementById('register-pin-input').value;
    if (regPin) await Auth.checkPin(regPin);
    enterApp();
});


// --- NOTATKI I NAWIGACJA ---
addClick('btn-new-note', () => Notes.openEditor());
addClick('btn-save', Notes.saveNote);
addClick('btn-delete', Notes.deleteCurrentNote);
addClick('btn-go-settings', () => showView('settings', stopCamera));
addClick('btn-go-list', () => { showView('list', stopCamera); Notes.loadNotes(); });
addClick('btn-full-reset', Settings.performFullReset);

// --- MULTIMEDIA (KAMERA) ---
addClick('btn-camera', async () => {
    try {
        UI.editor.camInterface.style.display = 'block';
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        UI.editor.video.srcObject = cameraStream;
        UI.editor.btnCamera.classList.add('hidden');
    } catch (e) {
        showModal('Błąd', 'Brak dostępu do kamery.');
    }
});

addClick('btn-take-photo', () => {
    if (!cameraStream) return;
    const v = UI.editor.video;
    const c = UI.editor.canvas;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);

    UI.editor.imgPreview.src = c.toDataURL('image/jpeg', 0.7);
    UI.editor.imgPreview.classList.remove('hidden');
    stopCamera();
});

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    UI.editor.camInterface.style.display = 'none';
    UI.editor.btnCamera.classList.remove('hidden');
}

// --- MULTIMEDIA (MOWA) ---
addClick('btn-speech', () => {
    if (!Speech.available()) return showModal('Info', 'Brak obsługi mowy.');

    if (isListening) {
        Speech.stop();
        isListening = false;
        UI.editor.btnSpeech.classList.add('outline');
        UI.editor.btnSpeech.classList.remove('danger');
    } else {
        isListening = true;
        UI.editor.btnSpeech.classList.remove('outline');
        UI.editor.btnSpeech.classList.add('danger');

        Speech.start(
            (text) => { // onResult
                const val = UI.editor.body.value;
                UI.editor.body.value = val + (val ? ' ' : '') + text;
            },
            () => { // onError
                isListening = false;
                UI.editor.btnSpeech.classList.add('outline');
                UI.editor.btnSpeech.classList.remove('danger');
            },
            () => { // onEnd
                isListening = false;
                UI.editor.btnSpeech.classList.add('outline');
                UI.editor.btnSpeech.classList.remove('danger');
            }
        );
    }
});
// --- OBSŁUGA SIECI ---
window.addEventListener('online', () => UI.common.offlineIndicator.style.display = 'none');
window.addEventListener('offline', () => UI.common.offlineIndicator.style.display = 'block');

// Start
init();