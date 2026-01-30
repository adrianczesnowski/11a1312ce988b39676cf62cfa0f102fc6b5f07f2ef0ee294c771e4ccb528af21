/**
 * Moduł zarządzający DOM i widokami.
 */
export const UI = {
    views: {
        list: document.getElementById('view-list'),
        editor: document.getElementById('view-editor'),
        settings: document.getElementById('view-settings')
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
        btnCamera: document.getElementById('btn-camera'),
        btnGeo: document.getElementById('btn-geo'),

        geoPreview: document.getElementById('geo-preview'),
        geoText: document.getElementById('geo-text'),
        btnRemoveGeo: document.getElementById('btn-remove-geo')
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

export function showView(viewName, onExitCallback = null) {
    Object.values(UI.views).forEach(el => el.classList.add('hidden'));
    if (UI.views[viewName]) UI.views[viewName].classList.remove('hidden');

    UI.common.btnSettings.classList.toggle('hidden', viewName !== 'list');
    UI.common.btnBack.classList.toggle('hidden', viewName === 'list');

    if (onExitCallback) onExitCallback();
}

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

export function addClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
}