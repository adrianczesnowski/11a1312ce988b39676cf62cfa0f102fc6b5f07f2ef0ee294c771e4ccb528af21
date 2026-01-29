import { UI, showView, showModal } from './ui.js';
import * as DB from './db.js';

let currentNoteId = null;

/** Ładuje notatki i renderuje listę */
export async function loadNotes() {
    const notes = await DB.getAll();
    renderList(notes);
}

/** * Renderuje elementy listy w HTML */
function renderList(notes) {
    UI.list.container.innerHTML = '';

    if (notes.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'text-center p-3 text-muted';
        emptyMsg.textContent = 'Brak notatek.';
        UI.list.container.appendChild(emptyMsg);
        return;
    }

    // Sortowanie po dacie (najnowsze)
    notes.sort((a, b) => b.updated - a.updated).forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.onclick = () => openEditor(n.id);

        const headerDiv = document.createElement('div');
        headerDiv.className = 'note-header';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = n.title || '(Bez tytułu)';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'text-muted';
        dateSpan.style.fontWeight = 'normal';
        dateSpan.style.fontSize = '0.8em';

        const dateStr = new Date(n.updated).toLocaleString('pl-PL', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        dateSpan.textContent = dateStr;

        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(dateSpan);

        const previewDiv = document.createElement('div');
        previewDiv.className = 'note-preview';
        previewDiv.textContent = n.body || 'Brak treści...';

        div.appendChild(headerDiv);
        div.appendChild(previewDiv);

        if (n.image) {
            const imgInfo = document.createElement('div');
            imgInfo.style.marginTop = '5px';
            imgInfo.style.fontSize = '0.8em';
            imgInfo.style.color = 'var(--primary)';
            imgInfo.textContent = '📷 Załącznik';
            div.appendChild(imgInfo);
        }

        UI.list.container.appendChild(div);
    });
}

/** Otwiera edytor dla konkretnej notatki lub nowej */
export async function openEditor(id = null) {
    currentNoteId = id;

    if (id) {
        const n = await DB.getNote(id);
        if (!n) return;

        UI.editor.title.value = n.title;
        UI.editor.body.value = n.body;
        UI.editor.date.textContent = 'Edycja: ' + new Date(n.updated).toLocaleString();

        if (n.image) {
            UI.editor.imgPreview.src = n.image;
            UI.editor.imgPreview.classList.remove('hidden');
        } else {
            UI.editor.imgPreview.classList.add('hidden');
        }
    } else {
        UI.editor.title.value = '';
        UI.editor.body.value = '';
        UI.editor.imgPreview.src = '';
        UI.editor.imgPreview.classList.add('hidden');
        UI.editor.date.textContent = 'Nowa notatka';
    }

    showView('editor');
}

/** Zapisuje bieżącą notatkę */
export async function saveNote() {
    const title = UI.editor.title.value.trim();
    const body = UI.editor.body.value.trim();
    const hasImage = !UI.editor.imgPreview.classList.contains('hidden');

    if (!title && !body && !hasImage) {
        showView('list');
        return;
    }

    const note = {
        id: currentNoteId || crypto.randomUUID(),
        title,
        body,
        image: hasImage ? UI.editor.imgPreview.src : null,
        updated: Date.now()
    };

    try {
        await DB.addNote(note);
        showView('list');
        loadNotes();
    } catch (e) {
        console.error(e);
        showModal('Błąd zapisu', 'Pamięć przeglądarki jest pełna. Usuń stare notatki lub pliki, aby kontynuować.');
    }
}

/** Usuwa bieżącą notatkę */
export async function deleteCurrentNote() {
    if (!currentNoteId) {
        showView('list');
        return;
    }

    const confirm = await showModal('Usuwanie', 'Czy na pewno usunąć notatkę? Operacji nie można cofnąć.', true);
    if (confirm) {
        await DB.deleteNote(currentNoteId);
        showView('list');
        loadNotes();
    }
}