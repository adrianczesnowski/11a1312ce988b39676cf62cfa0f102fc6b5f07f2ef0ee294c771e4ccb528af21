import { UI, showView, showModal, addClick } from './ui.js';
import * as Notes from './notes.js';
import * as Settings from './settings.js';
import * as Speech from './speech.js';

let cameraStream = null;
let isListening = false;

// ==========================================
// START APLIKACJI
// ==========================================
function init() {
    showView('list', stopCamera);
    Notes.loadNotes();
}

// ==========================================
// OBSŁUGA ZDARZEŃ
// ==========================================

// Nawigacja i Notatki
addClick('btn-new-note', () => Notes.openEditor());
addClick('btn-save', Notes.saveNote);
addClick('btn-delete', Notes.deleteCurrentNote);
addClick('btn-go-settings', () => showView('settings', stopCamera));
addClick('btn-go-list', () => { showView('list', stopCamera); Notes.loadNotes(); });
addClick('btn-full-reset', Settings.performFullReset);

// --- GEOLOKALIZACJA ---
addClick('btn-geo', Notes.toggleGeo);
addClick('btn-remove-geo', (e) => {
    e.stopPropagation();
    Notes.toggleGeo();
});

// --- KAMERA ---
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

// --- MOWA ---
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
            (text) => {
                const val = UI.editor.body.value;
                UI.editor.body.value = val + (val ? ' ' : '') + text;
            },
            () => { isListening = false; UI.editor.btnSpeech.classList.remove('danger'); UI.editor.btnSpeech.classList.add('outline'); },
            () => { isListening = false; UI.editor.btnSpeech.classList.remove('danger'); UI.editor.btnSpeech.classList.add('outline'); }
        );
    }
});

window.addEventListener('online', () => UI.common.offlineIndicator.style.display = 'none');
window.addEventListener('offline', () => UI.common.offlineIndicator.style.display = 'block');

init();