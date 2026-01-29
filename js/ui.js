/**
 * Moduł zarządzający interfejsem użytkownika.
 * Eksportuje referencje do elementów DOM i metody nawigacji.
 */

// Centralny obiekt z referencjami do DOM
export const UI = {
    views: {
        auth: document.getElementById('view-auth'),
        list: document.getElementById('view-list'),
        editor: document.getElementById('view-editor'),
        settings: document.getElementById('view-settings')
    },
    auth: {
        cardLogin: document.getElementById('login-card'),
        cardRegister: document.getElementById('register-card'),
        loginPinInput: document.getElementById('login-pin-input'),
        loginPinArea: document.getElementById('login-pin-area'),
        registerArea: document.getElementById('register-area'),
        btnBiometrics: document.getElementById('btn-auth-biometrics'),
        btnRegisterBio: document.getElementById('btn-auth-register'),
        btnPinShow: document.getElementById('btn-auth-pin-login-show')
    },
    editor: {
        title: document.getElementById('note-title'),
        body: document.getElementById('note-body'),
        imgPreview: document.getElementById('note-image-preview'),
        camInterface: document.getElementById('camera-interface'),
        video: document.getElementById('video-feed'),
        canvas: document.getElementById('camera-canvas'),
        date: document.getElementById('note-date'),
        btnSpeech: document.getElementById('btn-speech'),
        btnCamera: document.getElementById('btn-camera')
    },
    list: {
        container: document.getElementById('notes-list-container'),
        search: document.getElementById('search-input')
    },
    common: {
        offlineIndicator: document.getElementById('offline-indicator'),
        btnSettings: document.getElementById('btn-go-settings'),
        btnBack: document.getElementById('btn-go-list'),
        modal: document.getElementById('app-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalMsg: document.getElementById('modal-message'),
        modalBtnOk: document.getElementById('btn-modal-confirm'),
        modalBtnCancel: document.getElementById('btn-modal-cancel')
    }
};

/**
 * Przełącza widok aplikacji.
 * @param {string} viewName - Klucz widoku (np. 'list', 'editor').
 * @param {function} onExitCallback - Opcjonalna funkcja wywoływana przy wyjściu.
 */
export function showView(viewName, onExitCallback = null) {
    // Ukryj wszystkie widoki
    Object.values(UI.views).forEach(el => el.classList.add('hidden'));

    // Pokaż żądany widok
    if (UI.views[viewName]) UI.views[viewName].classList.remove('hidden');

    // Obsługa widoczności przycisków nawigacji
    UI.common.btnSettings.classList.toggle('hidden', viewName !== 'list');
    UI.common.btnBack.classList.toggle('hidden', viewName === 'list' || viewName === 'auth');

    // Wywołanie callbacka czyszczącego (np. zatrzymanie kamery)
    if (onExitCallback) onExitCallback();
}

/**
 * Wyświetla modal
 * @returns {Promise<boolean>} True jeśli kliknięto OK.
 */
export function showModal(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        UI.common.modalTitle.innerText = title;
        UI.common.modalMsg.innerText = message;

        if (isConfirm) UI.common.modalBtnCancel.classList.remove('hidden');
        else UI.common.modalBtnCancel.classList.add('hidden');

        const handleOk = () => { closeAndResolve(true); };
        const handleCancel = () => { closeAndResolve(false); };

        const closeAndResolve = (result) => {
            UI.common.modal.close();
            UI.common.modalBtnOk.removeEventListener('click', handleOk);
            UI.common.modalBtnCancel.removeEventListener('click', handleCancel);
            resolve(result);
        };

        UI.common.modalBtnOk.addEventListener('click', handleOk);
        UI.common.modalBtnCancel.addEventListener('click', handleCancel);

        UI.common.modal.showModal();
    });
}

/** Helper do bezpiecznego przypinania zdarzeń */
export function addClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
}