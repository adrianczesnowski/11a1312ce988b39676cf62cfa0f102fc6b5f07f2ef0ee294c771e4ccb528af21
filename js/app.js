/**
 * Główny moduł aplikacji.
 * Wykorzystuje wzorzec IIFE do izolacji zmiennych.
 */
const app = (() => {

    // Helper do pobierania elementów DOM
    const getEl = (id) => document.getElementById(id);

    // Cache elementów widoków
    const views = {
        auth: getEl('view-auth'),
        list: getEl('view-list'),
        editor: getEl('view-editor'),
        settings: getEl('view-settings')
    };

    // Cache elementów interfejsu użytkownika
    const ui = {
        loginPinInput: getEl('login-pin-input'),
        loginPinArea: getEl('login-pin-area'),
        listContainer: getEl('notes-list-container'),
        title: getEl('note-title'),
        body: getEl('note-body'),
        imgPreview: getEl('note-image-preview'),
        camInterface: getEl('camera-interface'),
        video: getEl('video-feed'),
        canvas: getEl('camera-canvas'),
        offlineIndicator: getEl('offline-indicator'),
        btnSpeech: getEl('btn-speech')
    };

    // Stan aplikacji
    let currentNoteId = null;
    let cameraStream = null;
    let isListening = false;

    /**
     * Zarządza nawigacją między ekranami (SPA routing).
     * @param {string} viewName - ID widoku do wyświetlenia.
     */
    function showView(viewName) {
        if (!views[viewName]) return;

        // Ukrywanie wszystkich widoków
        Object.values(views).forEach(el => el && el.classList.add('d-none'));

        // Aktywacja wybranego widoku
        views[viewName].classList.remove('d-none');

        // Zarządzanie widocznością przycisków w nagłówku
        const btnSettings = getEl('btn-go-settings');
        const btnBack = getEl('btn-go-list');

        // Przycisk ustawień widoczny tylko na liście notatek
        btnSettings?.classList.toggle('d-none', viewName !== 'list');

        // Przycisk wstecz widoczny wszędzie POZA listą i ekranem logowania
        btnBack?.classList.toggle('d-none', viewName === 'list' || viewName === 'auth');

        // Cleanup: wyłączenie kamery przy wyjściu z edytora
        if (viewName === 'list') {
            stopCamera();
        }
    }

    /**
     * Wrapper do bezpiecznego przypisywania zdarzeń (unika błędów null).
     */
    const addClick = (id, fn) => {
        const el = getEl(id);
        if (el) el.addEventListener('click', fn);
    };


    // ============================================================
    // MODUŁ 1: AUTORYZACJA
    // ============================================================

    // Logowanie biometryczne
    addClick('btn-auth-biometrics', async () => {
        const success = await Auth.login();
        if (success) enterApp();
        else alert('Nie udało się zweryfikować tożsamości.');
    });

    // Pokazanie panelu PIN dla logowania
    addClick('btn-auth-pin-login-show', () => {
        ui.loginPinArea.classList.remove('d-none');
        ui.loginPinInput.focus();
    });

    // Weryfikacja PIN przy logowaniu
    addClick('btn-auth-pin-submit', () => {
        if (Auth.checkPin(ui.loginPinInput.value)) {
            enterApp();
        } else {
            alert('Nieprawidłowy PIN.');
            ui.loginPinInput.value = '';
        }
    });

    // Zapisywanie PINu (Rejestracja - Krok 1)
    addClick('btn-register-pin-save', () => {
        const pin = getEl('register-pin-input').value;
        if (pin.length < 4) return alert('PIN powinien składać się z min. 4 cyfr.');
        Auth.setPin(pin);
        alert('PIN został ustawiony.');
    });

    // Rejestracja biometrii (Rejestracja - Krok 2)
    addClick('btn-auth-register', async () => {
        if (!window.PublicKeyCredential) {
            return alert("Twoje urządzenie nie obsługuje standardu WebAuthn.");
        }

        const success = await Auth.register();

        if (success) {
            const btn = getEl('btn-auth-register');
            btn.classList.remove('btn-outline-info');
            btn.classList.add('btn-success', 'text-white');
            btn.innerHTML = 'Biometria skonfigurowana ✓';
        } else {
            alert('Nie udało się zarejestrować biometrii.');
        }
    });

    // Finalizacja rejestracji i wejście do aplikacji
    addClick('btn-enter-app-fresh', () => {
        // Wymagamy ustawienia przynajmniej PINu
        if (!localStorage.getItem('securenotes-pin')) {
            alert('Konfiguracja PIN jest wymagana przed przejściem dalej.');
            return;
        }
        enterApp();
    });

    /**
     * Inicjalizacja głównego widoku aplikacji po autoryzacji.
     */
    function enterApp() {
        showView('list');
        loadNotes();
    }


    // ============================================================
    // MODUŁ 2: NOTATKI
    // ============================================================

    /**
     * Ładuje dane z IndexedDB i odświeża widok.
     */
    async function loadNotes() {
        const notes = await DB.getAll();
        renderList(notes);
    }

    /**
     * Renderuje listę notatek w DOM.
     * @param {Array} notes 
     */
    function renderList(notes) {
        if (!ui.listContainer) return;

        ui.listContainer.innerHTML = '';

        if (notes.length === 0) {
            ui.listContainer.innerHTML = '<div class="text-center p-3 text-muted">Brak zapisanych notatek.</div>';
            return;
        }

        // Sortowanie: najnowsze na górze
        notes.sort((a, b) => b.updated - a.updated).forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action py-3 border-start border-4 border-primary mb-2 shadow-sm rounded-0';

            const dateStr = new Date(n.updated).toLocaleString('pl-PL', {
                hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
            });

            btn.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 fw-bold text-truncate" style="max-width: 70%">${n.title || '(Bez tytułu)'}</h5>
                    <small class="text-muted">${dateStr}</small>
                </div>
                <p class="mb-1 text-truncate small text-muted">${n.body || 'Brak treści...'}</p>
                ${n.image ? '<small class="text-primary">📷 Załącznik</small>' : ''}
            `;

            btn.onclick = () => openNote(n.id);
            ui.listContainer.appendChild(btn);
        });
    }

    // Inicjalizacja nowej notatki
    addClick('btn-new-note', () => {
        currentNoteId = null;
        ui.title.value = '';
        ui.body.value = '';
        ui.imgPreview.src = '';
        ui.imgPreview.classList.add('d-none');
        getEl('note-date').innerText = 'Nowa notatka';
        showView('editor');
    });

    // Otwieranie istniejącej notatki
    async function openNote(id) {
        const n = await DB.getNote(id);
        if (!n) return;

        currentNoteId = n.id;
        ui.title.value = n.title;
        ui.body.value = n.body;

        if (n.image) {
            ui.imgPreview.src = n.image;
            ui.imgPreview.classList.remove('d-none');
        } else {
            ui.imgPreview.classList.add('d-none');
        }

        getEl('note-date').innerText = 'Zmodyfikowano: ' + new Date(n.updated).toLocaleString();
        showView('editor');
    }

    // Zapis notatki
    addClick('btn-save', async () => {
        const title = ui.title.value.trim();
        const body = ui.body.value.trim();

        if (!title && !body && ui.imgPreview.classList.contains('d-none')) {
            showView('list');
            return;
        }

        const note = {
            id: currentNoteId || crypto.randomUUID(),
            title: title,
            body: body,
            image: !ui.imgPreview.classList.contains('d-none') ? ui.imgPreview.src : null,
            updated: Date.now()
        };

        await DB.addNote(note);
        showView('list');
        loadNotes();
    });

    // Usuwanie notatki
    addClick('btn-delete', async () => {
        if (!currentNoteId) {
            showView('list');
            return;
        }

        if (confirm('Usunąć notatkę bezpowrotnie?')) {
            await DB.deleteNote(currentNoteId);
            showView('list');
            loadNotes();
        }
    });

    // Powrót do listy (uniwersalny przycisk "Wróć")
    addClick('btn-go-list', () => {
        showView('list');
        loadNotes();
    });


    // ============================================================
    // MODUŁ 3: MEDIA (Kamera / Głos)
    // ============================================================

    // Uruchomienie podglądu z kamery
    addClick('btn-camera', async () => {
        try {
            ui.camInterface.style.display = 'block';
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            ui.video.srcObject = cameraStream;
        } catch (err) {
            console.error(err);
            alert('Brak dostępu do kamery.');
            ui.camInterface.style.display = 'none';
        }
    });

    // Zrobienie zdjęcia (zrzut klatki wideo na canvas)
    addClick('btn-take-photo', () => {
        if (!cameraStream) return;

        ui.canvas.width = ui.video.videoWidth;
        ui.canvas.height = ui.video.videoHeight;

        const ctx = ui.canvas.getContext('2d');
        ctx.drawImage(ui.video, 0, 0);

        ui.imgPreview.src = ui.canvas.toDataURL('image/jpeg', 0.8);
        ui.imgPreview.classList.remove('d-none');

        stopCamera();
    });

    /**
     * Zwalnianie zasobów kamery.
     */
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        ui.camInterface.style.display = 'none';
    }

    // Obsługa dyktowania (Speech API)
    addClick('btn-speech', () => {
        if (!Speech.available()) {
            return alert('Funkcja niedostępna w tej przeglądarce.');
        }

        if (isListening) {
            Speech.stop();
            isListening = false;
            toggleSpeechBtn(false);
        } else {
            isListening = true;
            toggleSpeechBtn(true);

            Speech.start(
                (text) => {
                    ui.body.value += (ui.body.value ? ' ' : '') + text;
                },
                (err) => {
                    isListening = false;
                    toggleSpeechBtn(false);
                },
                () => {
                    isListening = false;
                    toggleSpeechBtn(false);
                }
            );
        }
    });

    // Helper wizualny dla przycisku mikrofonu
    function toggleSpeechBtn(active) {
        if (active) {
            ui.btnSpeech.classList.remove('btn-outline-secondary');
            ui.btnSpeech.classList.add('btn-danger', 'text-white');
        } else {
            ui.btnSpeech.classList.remove('btn-danger', 'text-white');
            ui.btnSpeech.classList.add('btn-outline-secondary');
        }
    }


    // ============================================================
    // MODUŁ 4: SYSTEM I USTAWIENIA
    // ============================================================

    // Nawigacja do panelu ustawień
    addClick('btn-go-settings', () => {
        showView('settings');
    });

    // Obsługa pełnego resetu aplikacji (usuwanie danych)
    addClick('btn-full-reset', async () => {
        if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE notatki i dane logowania? Tej operacji nie można cofnąć.')) {
            // Usuwanie wszystkich notatek z IndexedDB
            const notes = await DB.getAll();
            const deletePromises = notes.map(n => DB.deleteNote(n.id));
            await Promise.all(deletePromises);

            // Czyszczenie LocalStorage (PIN, credential ID)
            localStorage.clear();

            // Przeładowanie aplikacji do stanu początkowego
            window.location.reload();
        }
    });

    // Monitorowanie stanu sieci
    window.addEventListener('online', () => ui.offlineIndicator.style.display = 'none');
    window.addEventListener('offline', () => ui.offlineIndicator.style.display = 'block');

    // Inicjalizacja Service Workera
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
            .then(() => console.log('SW Registered'))
            .catch(console.error);
    }

})();