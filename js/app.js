import { UI, showView, showModal, addClick } from './ui.js';
import * as Notes from './notes.js';
import * as Settings from './settings.js';
import * as Speech from './speech.js';

let cameraStream = null;
let isListening = false;

/**
 * Inicjalizacja aplikacji.
 */
function init() {
    showView('list', stopCamera);
    Notes.loadNotes();
}

// Obsługa przycisków nawigacji i edytora
addClick('btn-new-note', () => Notes.openEditor());
addClick('btn-save', Notes.saveNote);
addClick('btn-delete', Notes.deleteCurrentNote);
addClick('btn-go-settings', () => showView('settings', stopCamera));
addClick('btn-go-list', () => { showView('list', stopCamera); Notes.loadNotes(); });
addClick('btn-full-reset', Settings.performFullReset);

// Obsługa usuwania zdjęcia
addClick('btn-remove-image', Notes.removeImage);

// Obsługa geolokalizacji
addClick('btn-geo', Notes.toggleGeo);
addClick('btn-remove-geo', (e) => {
    e.stopPropagation();
    Notes.toggleGeo();
});

// Obsługa kamery
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
    UI.editor.imgContainer.classList.remove('hidden'); // Pokazanie kontenera ze zdjęciem
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

// --- POPRAWIONA OBSŁUGA MOWY ---
addClick('btn-speech', () => {
    if (!Speech.available()) return showModal('Info', 'Twoja przeglądarka nie obsługuje dyktowania.');

    if (isListening) {
        // Użytkownik chce przerwać
        Speech.stop();
        stopListeningUI();
    } else {
        // Start nagrywania
        startListeningUI();

        Speech.start(
            (text) => {
                const val = UI.editor.body.value;
                UI.editor.body.value = val + (val.length > 0 ? ' ' : '') + text;
            },
            (error) => {
                console.warn(error);
                stopListeningUI();
            },
            () => {
                stopListeningUI();
            }
        );
    }
});

// Pomocnicze funkcje UI do mikrofonu
function startListeningUI() {
    isListening = true;
    UI.editor.btnSpeech.classList.remove('outline');
    UI.editor.btnSpeech.classList.add('danger');
}

function stopListeningUI() {
    isListening = false;
    UI.editor.btnSpeech.classList.remove('danger');
    UI.editor.btnSpeech.classList.add('outline');
}

window.addEventListener('online', () => UI.common.offlineIndicator.style.display = 'none');
window.addEventListener('offline', () => UI.common.offlineIndicator.style.display = 'block');

init();