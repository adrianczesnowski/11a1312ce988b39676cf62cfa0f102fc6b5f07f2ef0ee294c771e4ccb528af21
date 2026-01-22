const app = (() => {
    /** * @function getEl - Pomocniczy wrapper dla document.getElementById.
     * @param {string} id - Identyfikator elementu.
     * @returns {HTMLElement}
     */
    const getEl = (id) => document.getElementById(id);

    // Mapowanie głównych sekcji widoków
    const views = {
        auth: getEl('view-auth'),
        list: getEl('view-list'),
        editor: getEl('view-editor'),
        settings: getEl('view-settings')
    };

    // Referencje do kluczowych elementów UI
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
        offlineIndicator: getEl('offline-indicator')
    };

    let currentNoteId = null; // Przechowuje ID edytowanej notatki (null dla nowej)
    let cameraStream = null;  // Referencja do aktywnego strumienia kamery

    /**
     * @function showView - Przełącza widoczność sekcji aplikacji.
     * @param {string} viewName - Nazwa klucza z obiektu views.
     */
    function showView(viewName) {
        if (!views[viewName]) return;
        // Ukryj wszystkie widoki
        Object.values(views).forEach(el => el && el.classList.add('d-none'));
        // Pokaż wybrany
        views[viewName].classList.remove('d-none');

        // Logika przycisków nawigacji górnej
        const btnSettings = getEl('btn-go-settings');
        const btnBack = getEl('btn-go-list');
        btnSettings?.classList.toggle('d-none', viewName !== 'list');
        btnBack?.classList.toggle('d-none', viewName === 'list' || viewName === 'auth');

        if (viewName === 'list') stopCamera(); // Zawsze zamykaj kamerę wracając do listy
    }

    /**
     * @function addClick - Rejestruje zdarzenie kliknięcia z zabezpieczeniem przed brakiem elementu.
     */
    const addClick = (id, fn) => getEl(id)?.addEventListener('click', fn);

    // --- OBSŁUGA AUTORYZACJI ---

    addClick('btn-auth-biometrics', async () => {
        const success = await Auth.login();
        if (success) enterApp();
        else alert('Błąd biometrii.');
    });

    addClick('btn-auth-pin-submit', () => {
        if (Auth.checkPin(ui.loginPinInput.value)) enterApp();
        else alert('Błędny PIN.');
    });

    addClick('btn-register-pin-save', () => {
        const pin = getEl('register-pin-input').value;
        if (pin.length < 4) return alert('PIN min. 4 znaki.');
        Auth.setPin(pin);
        alert('PIN zapisany.');
    });

    /**
     * @function enterApp - Finalizuje proces logowania i wchodzi do głównej części apki.
     */
    function enterApp() {
        showView('list');
        loadNotes();
    }

    // --- ZARZĄDZANIE NOTATKAMI ---

    /**
     * @function loadNotes - Pobiera wszystkie notatki z IndexedDB i wywołuje renderowanie.
     */
    async function loadNotes() {
        const notes = await DB.getAll();
        renderList(notes);
    }

    /**
     * @function renderList - Generuje kod HTML dla listy notatek.
     * @param {Array} notes - Tablica obiektów notatek.
     */
    function renderList(notes) {
        if (!ui.listContainer) return;
        ui.listContainer.innerHTML = notes.length ? '' : '<div class="text-center p-3">Brak notatek.</div>';

        notes.sort((a, b) => b.updated - a.updated).forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action py-3';
            btn.innerHTML = `<b>${n.title || 'Bez tytułu'}</b><br><small>${new Date(n.updated).toLocaleDateString()}</small>`;
            btn.onclick = () => openNote(n.id);
            ui.listContainer.appendChild(btn);
        });
    }

    /**
     * @function openNote - Ładuje dane konkretnej notatki do edytora.
     */
    async function openNote(id) {
        const n = await DB.getNote(id);
        if (!n) return;
        currentNoteId = n.id;
        ui.title.value = n.title;
        ui.body.value = n.body;
        if (n.image) {
            ui.imgPreview.src = n.image;
            ui.imgPreview.classList.remove('d-none');
        }
        showView('editor');
    }

    addClick('btn-save', async () => {
        const note = {
            id: currentNoteId || crypto.randomUUID(),
            title: ui.title.value,
            body: ui.body.value,
            image: ui.imgPreview.classList.contains('d-none') ? null : ui.imgPreview.src,
            updated: Date.now()
        };
        await DB.addNote(note);
        showView('list');
        loadNotes();
    });

    // --- MULTIMEDIA (KAMERA I GŁOS) ---

    /**
     * @function startCamera - Uruchamia podgląd wideo z kamery.
     */
    addClick('btn-camera', async () => {
        ui.camInterface.style.display = 'block';
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        ui.video.srcObject = cameraStream;
    });

    /**
     * @function stopCamera - Zatrzymuje strumień wideo i zwalnia sprzęt.
     */
    function stopCamera() {
        cameraStream?.getTracks().forEach(t => t.stop());
        ui.camInterface.style.display = 'none';
        cameraStream = null;
    }

    /**
     * @function takePhoto - Przechwytuje klatkę wideo do formatu obrazu.
     */
    addClick('btn-take-photo', () => {
        ui.canvas.width = ui.video.videoWidth;
        ui.canvas.height = ui.video.videoHeight;
        ui.canvas.getContext('2d').drawImage(ui.video, 0, 0);
        ui.imgPreview.src = ui.canvas.toDataURL('image/jpeg');
        ui.imgPreview.classList.remove('d-none');
        stopCamera();
    });

    // Sprawdzanie statusu sieci
    window.addEventListener('online', () => ui.offlineIndicator.style.display = 'none');
    window.addEventListener('offline', () => ui.offlineIndicator.style.display = 'block');

    // Inicjalizacja Service Workera
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
})();