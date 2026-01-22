/**
 * Główny moduł aplikacji (IIFE - Immediately Invoked Function Expression).
 * Zamyka logikę w prywatnym zakresie, nie zaśmiecając globalnej przestrzeni nazw.
 */
const app = (() => {

    /**
     * Pomocnicza funkcja skracająca zapis document.getElementById.
     * @param {string} id - ID elementu w DOM.
     * @returns {HTMLElement|null} - Znaleziony element lub null.
     */
    const getEl = (id) => document.getElementById(id);

    // Przechowywanie referencji do głównych widoków (sekcji) aplikacji
    const views = {
        auth: getEl('view-auth'),
        list: getEl('view-list'),
        editor: getEl('view-editor'),
        settings: getEl('view-settings')
    };

    // Przechowywanie referencji do elementów interfejsu (pola, przyciski, kontenery)
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

    // Zmienne stanu aplikacji
    let currentNoteId = null; // ID aktualnie edytowanej notatki (null = nowa)
    let cameraStream = null;  // Obiekt strumienia wideo (kamery)
    let isListening = false;  // Flaga czy trwa rozpoznawanie mowy

    /**
     * Przełącza widoczność sekcji (widoków) w aplikacji.
     * Ukrywa wszystkie, a następnie pokazuje ten przekazany w argumencie.
     * Obsługuje też widoczność przycisków nawigacyjnych w nagłówku.
     * * @param {string} viewName - Klucz z obiektu `views` (np. 'list', 'editor').
     */
    function showView(viewName) {
        if (!views[viewName]) return;

        // 1. Ukryj wszystkie widoki
        Object.values(views).forEach(el => el && el.classList.add('d-none'));

        // 2. Pokaż żądany widok
        views[viewName].classList.remove('d-none');

        // 3. Logika przycisków w nagłówku (Ustawienia / Wstecz)
        const btnSettings = getEl('btn-go-settings');
        const btnBack = getEl('btn-go-list');

        // Przycisk ustawień widoczny tylko na liście
        btnSettings?.classList.toggle('d-none', viewName !== 'list');

        // Przycisk wstecz widoczny wszędzie POZA listą i logowaniem
        btnBack?.classList.toggle('d-none', viewName === 'list' || viewName === 'auth');

        // Zabezpieczenie: jeśli wychodzimy z edytora, upewnij się, że kamera jest wyłączona
        if (viewName === 'list') {
            stopCamera();
        }
    }

    /**
     * Bezpieczne dodawanie nasłuchiwania na kliknięcie.
     * Sprawdza, czy element istnieje, zanim przypisze zdarzenie (zapobiega błędom null).
     * * @param {string} id - ID przycisku/elementu.
     * @param {Function} fn - Funkcja do wykonania po kliknięciu.
     */
    const addClick = (id, fn) => {
        const el = getEl(id);
        if (el) el.addEventListener('click', fn);
    };


    // ============================================================
    // SEKCJA 1: AUTORYZACJA I REJESTRACJA (NAPRAWIONE)
    // ============================================================

    /**
     * Obsługa przycisku logowania biometrycznego (Dla powracających użytkowników).
     * Wywołuje Auth.login() i w razie sukcesu wpuszcza do apki.
     */
    addClick('btn-auth-biometrics', async () => {
        const success = await Auth.login();
        if (success) enterApp();
        else alert('Nie rozpoznano użytkownika lub błąd urządzenia.');
    });

    /**
     * Przełącznik pokazujący pole do wpisania PINu (zamiast biometrii).
     */
    addClick('btn-auth-pin-login-show', () => {
        ui.loginPinArea.classList.remove('d-none');
        ui.loginPinInput.focus();
    });

    /**
     * Zatwierdzenie logowania PINem.
     * Sprawdza zgodność wpisanego PINu z zapisanym w localStorage.
     */
    addClick('btn-auth-pin-submit', () => {
        if (Auth.checkPin(ui.loginPinInput.value)) {
            enterApp();
        } else {
            alert('Błędny PIN.');
            ui.loginPinInput.value = ''; // Czyści pole po błędzie
        }
    });

    /**
     * Zapisywanie nowego PINu podczas rejestracji (Krok 1).
     * Waliduje długość i zapisuje do localStorage przez Auth.setPin.
     */
    addClick('btn-register-pin-save', () => {
        const pin = getEl('register-pin-input').value;
        if (pin.length < 4) return alert('PIN musi mieć minimum 4 cyfry.');
        Auth.setPin(pin);
        alert('PIN został zapisany. Teraz możesz dodać biometrię lub wejść do aplikacji.');
    });

    /**
     * [NAPRAWIONE] Rejestracja nowej biometrii (Krok 2).
     * Wywołuje Auth.register() i zmienia wygląd przycisku po sukcesie.
     */
    addClick('btn-auth-register', async () => {
        // Sprawdzenie czy przeglądarka obsługuje WebAuthn
        if (!window.PublicKeyCredential) {
            return alert("Twoja przeglądarka lub urządzenie nie obsługuje kluczy dostępu (Passkeys).");
        }

        const success = await Auth.register();

        if (success) {
            const btn = getEl('btn-auth-register');
            btn.classList.remove('btn-outline-info');
            btn.classList.add('btn-success', 'text-white');
            btn.innerHTML = 'Biometria dodana pomyślnie ✓';
        } else {
            alert('Błąd dodawania biometrii. Spróbuj ponownie.');
        }
    });

    /**
     * [NAPRAWIONE] Finalne wejście do aplikacji po procesie rejestracji.
     * Sprawdza, czy użytkownik ustawił przynajmniej PIN przed wpuszczeniem.
     */
    addClick('btn-enter-app-fresh', () => {
        // Weryfikacja czy PIN istnieje (jest to absolutne minimum zabezpieczenia)
        if (!localStorage.getItem('securenotes-pin')) {
            alert('Musisz ustawić kod PIN, aby zabezpieczyć notatki!');
            return;
        }
        enterApp();
    });

    /**
     * Funkcja uruchamiana po pomyślnym zalogowaniu/rejestracji.
     * Przenosi użytkownika do listy notatek i ładuje dane.
     */
    function enterApp() {
        showView('list');
        loadNotes();
    }


    // ============================================================
    // SEKCJA 2: ZARZĄDZANIE NOTATKAMI (CRUD)
    // ============================================================

    /**
     * Pobiera notatki z bazy IndexedDB i przekazuje je do renderowania.
     */
    async function loadNotes() {
        const notes = await DB.getAll();
        renderList(notes);
    }

    /**
     * Generuje HTML dla listy notatek i wstawia go do kontenera.
     * Sortuje notatki od najnowszych.
     * * @param {Array} notes - Tablica obiektów notatek.
     */
    function renderList(notes) {
        if (!ui.listContainer) return;

        // Wyczyszczenie listy
        ui.listContainer.innerHTML = '';

        if (notes.length === 0) {
            ui.listContainer.innerHTML = '<div class="text-center p-3 text-muted">Brak notatek. Dodaj pierwszą!</div>';
            return;
        }

        // Sortowanie malejąco po dacie (timestamp)
        notes.sort((a, b) => b.updated - a.updated).forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action py-3 border-start border-4 border-primary mb-2 shadow-sm rounded-0';

            // Formatowanie daty
            const dateStr = new Date(n.updated).toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

            btn.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 fw-bold text-truncate" style="max-width: 70%">${n.title || '(Bez tytułu)'}</h5>
                    <small class="text-muted">${dateStr}</small>
                </div>
                <p class="mb-1 text-truncate small text-muted">${n.body || 'Brak treści...'}</p>
                ${n.image ? '<small class="text-primary">📷 Zawiera zdjęcie</small>' : ''}
            `;

            // Kliknięcie otwiera edytor z tą notatką
            btn.onclick = () => openNote(n.id);

            ui.listContainer.appendChild(btn);
        });
    }

    /**
     * Przygotowuje edytor do nowej notatki.
     * Czyści pola formularza i resetuje ID.
     */
    addClick('btn-new-note', () => {
        currentNoteId = null; // Nowa notatka nie ma ID
        ui.title.value = '';
        ui.body.value = '';
        ui.imgPreview.src = '';
        ui.imgPreview.classList.add('d-none');
        getEl('note-date').innerText = 'Nowa notatka';
        showView('editor');
    });

    /**
     * Pobiera dane notatki z bazy i wypełnia nimi edytor.
     * * @param {string} id - ID notatki do edycji.
     */
    async function openNote(id) {
        const n = await DB.getNote(id);
        if (!n) return;

        currentNoteId = n.id;
        ui.title.value = n.title;
        ui.body.value = n.body;

        // Obsługa zdjęcia
        if (n.image) {
            ui.imgPreview.src = n.image;
            ui.imgPreview.classList.remove('d-none');
        } else {
            ui.imgPreview.classList.add('d-none');
        }

        getEl('note-date').innerText = 'Ostatnia edycja: ' + new Date(n.updated).toLocaleString();
        showView('editor');
    }

    /**
     * Zapisuje notatkę do bazy IndexedDB.
     * Tworzy obiekt notatki, zapisuje go i wraca do listy.
     */
    addClick('btn-save', async () => {
        const title = ui.title.value.trim();
        const body = ui.body.value.trim();

        // Walidacja: nie zapisuj pustych notatek
        if (!title && !body && ui.imgPreview.classList.contains('d-none')) {
            showView('list');
            return;
        }

        const note = {
            id: currentNoteId || crypto.randomUUID(), // Generuj ID jeśli to nowa notatka
            title: title,
            body: body,
            // Jeśli obrazek jest widoczny, weź jego źródło (Base64), w przeciwnym razie null
            image: !ui.imgPreview.classList.contains('d-none') ? ui.imgPreview.src : null,
            updated: Date.now()
        };

        await DB.addNote(note);
        showView('list');
        loadNotes(); // Odśwież listę, by pokazać zmiany
    });

    /**
     * Usuwa aktualnie otwartą notatkę.
     * Pyta użytkownika o potwierdzenie przed usunięciem.
     */
    addClick('btn-delete', async () => {
        if (!currentNoteId) {
            // Jeśli to nowa notatka (nie zapisana), po prostu wróć
            showView('list');
            return;
        }

        if (confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
            await DB.deleteNote(currentNoteId);
            showView('list');
            loadNotes();
        }
    });

    // Powrót z edytora do listy (przycisk strzałki w nagłówku)
    addClick('btn-go-list', () => {
        showView('list');
        loadNotes(); // Odśwież listę na wypadek zmian
    });


    // ============================================================
    // SEKCJA 3: MULTIMEDIA (KAMERA I GŁOS)
    // ============================================================

    /**
     * Uruchamia kamerę urządzenia.
     * Prosi użytkownika o uprawnienia i podpina strumień pod element <video>.
     */
    addClick('btn-camera', async () => {
        try {
            ui.camInterface.style.display = 'block';
            // facingMode: 'environment' sugeruje użycie tylnej kamery w telefonach
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            ui.video.srcObject = cameraStream;
        } catch (err) {
            console.error(err);
            alert('Nie udało się uruchomić kamery. Sprawdź uprawnienia.');
            ui.camInterface.style.display = 'none';
        }
    });

    /**
     * Wykonuje zdjęcie z aktywnego strumienia wideo.
     * Rysuje klatkę na canvasie, konwertuje do Base64 i wstawia do podglądu.
     */
    addClick('btn-take-photo', () => {
        if (!cameraStream) return;

        // Dopasowanie canvasu do rzeczywistych wymiarów wideo
        ui.canvas.width = ui.video.videoWidth;
        ui.canvas.height = ui.video.videoHeight;

        // Rysowanie klatki
        ui.canvas.getContext('2d').drawImage(ui.video, 0, 0);

        // Konwersja na obrazek
        ui.imgPreview.src = ui.canvas.toDataURL('image/jpeg', 0.8); // Jakość 0.8
        ui.imgPreview.classList.remove('d-none');

        stopCamera(); // Wyłącz kamerę po zrobieniu zdjęcia
    });

    /**
     * Zatrzymuje kamerę i zwalnia zasoby sprzętowe.
     * Ważne dla oszczędzania baterii i pamięci.
     */
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        ui.camInterface.style.display = 'none';
    }

    /**
     * Obsługa przycisku mikrofonu (Speech-to-Text).
     * Korzysta z biblioteki Speech (speech.js) do dyktowania notatek.
     */
    addClick('btn-speech', () => {
        if (!Speech.available()) {
            return alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy.');
        }

        if (isListening) {
            // Jeśli już słucha -> zatrzymaj
            Speech.stop();
            isListening = false;
            ui.btnSpeech.classList.remove('btn-danger', 'text-white');
            ui.btnSpeech.classList.add('btn-outline-secondary');
        } else {
            // Jeśli nie słucha -> startuj
            isListening = true;
            ui.btnSpeech.classList.remove('btn-outline-secondary');
            ui.btnSpeech.classList.add('btn-danger', 'text-white'); // Czerwony przycisk nagrywania

            Speech.start(
                // Callback sukcesu (gdy wykryto słowa)
                (text) => {
                    // Dodaj tekst do pola notatki (ze spacją)
                    ui.body.value += (ui.body.value ? ' ' : '') + text;
                },
                // Callback błędu
                (err) => {
                    console.error(err);
                    isListening = false;
                    ui.btnSpeech.classList.remove('btn-danger', 'text-white');
                    ui.btnSpeech.classList.add('btn-outline-secondary');
                },
                // Callback końca (gdy cisza)
                () => {
                    isListening = false;
                    ui.btnSpeech.classList.remove('btn-danger', 'text-white');
                    ui.btnSpeech.classList.add('btn-outline-secondary');
                }
            );
        }
    });


    // ============================================================
    // SEKCJA 4: SYSTEMOWE (OFFLINE / SW)
    // ============================================================

    // Nasłuchiwanie zmian stanu sieci (online/offline)
    // Pokazuje/ukrywa czerwony pasek "Brak połączenia"
    window.addEventListener('online', () => ui.offlineIndicator.style.display = 'none');
    window.addEventListener('offline', () => ui.offlineIndicator.style.display = 'block');

    // Rejestracja Service Workera (PWA)
    // Pozwala aplikacji działać offline i być instalowalną
    if ('serviceWorker' in navigator) {
        // updateViaCache: 'none' wymusza sprawdzanie aktualizacji SW przy każdym wejściu
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
            .then(() => console.log('Service Worker zarejestrowany.'))
            .catch(err => console.error('Błąd rejestracji SW:', err));
    }

})();