import { UI, showView, showModal } from './ui.js';
import * as DB from './db.js';
import * as Geo from './geo.js';

let currentNoteId = null;
let currentGeo = null;

export async function loadNotes() {
    const notes = await DB.getAll();
    renderList(notes);
}

function renderList(notes) {
    UI.list.container.innerHTML = '';

    if (notes.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'text-center p-3 text-muted';
        msg.textContent = 'Brak notatek. Dodaj pierwszą!';
        UI.list.container.appendChild(msg);
        return;
    }

    notes.sort((a, b) => b.updated - a.updated).forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.onclick = () => openEditor(n.id);

        const header = document.createElement('div');
        header.className = 'note-header';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = n.title || '(Bez nazwy)';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'text-muted';
        dateSpan.style.fontWeight = 'normal';
        dateSpan.style.fontSize = '0.8em';
        dateSpan.textContent = new Date(n.updated).toLocaleDateString('pl-PL');

        header.appendChild(titleSpan);
        header.appendChild(dateSpan);

        const preview = document.createElement('div');
        preview.className = 'note-preview';
        preview.textContent = n.body || '';

        div.appendChild(header);
        div.appendChild(preview);

        if (n.image) {
            const imgBadge = document.createElement('div');
            imgBadge.style.marginTop = '5px';
            imgBadge.style.fontSize = '0.8em';
            imgBadge.style.color = 'var(--text-muted)';
            imgBadge.textContent = '📷 Zawiera zdjęcie';
            div.appendChild(imgBadge);
        }

        if (n.geo) {
            const mapLink = document.createElement('a');
            mapLink.href = Geo.getMapLink(n.geo.lat, n.geo.lon);
            mapLink.target = '_blank';
            mapLink.className = 'map-link';
            mapLink.textContent = '📍 Zobacz na mapie';
            mapLink.onclick = (e) => e.stopPropagation();
            div.appendChild(mapLink);
        }

        UI.list.container.appendChild(div);
    });
}

// Otwieranie edytora (nowa lub istniejąca notatka)
export async function openEditor(id = null) {
    currentNoteId = id;
    currentGeo = null;

    UI.editor.title.value = '';
    UI.editor.body.value = '';
    UI.editor.imgPreview.src = '';
    UI.editor.imgPreview.classList.add('hidden');
    UI.editor.date.textContent = 'Nowa notatka';

    if (id) {
        const n = await DB.getNote(id);
        if (!n) return;

        UI.editor.title.value = n.title;
        UI.editor.body.value = n.body;
        UI.editor.date.textContent = 'Edycja: ' + new Date(n.updated).toLocaleString();

        if (n.image) {
            UI.editor.imgPreview.src = n.image;
            UI.editor.imgPreview.classList.remove('hidden');
        }

        // Ładowanie lokalizacji
        if (n.geo) {
            currentGeo = n.geo;
            updateGeoUI(true);
        } else {
            updateGeoUI(false);
        }
    } else {
        updateGeoUI(false);
    }

    showView('editor');
}

// Zarządza przyciskiem Geo i podglądem
function updateGeoUI(hasGeo) {
    if (hasGeo) {
        UI.editor.geoPreview.classList.remove('hidden');
        UI.editor.btnGeo.classList.add('primary');
        UI.editor.btnGeo.classList.remove('outline');
    } else {
        UI.editor.geoPreview.classList.add('hidden');
        UI.editor.btnGeo.classList.remove('primary');
        UI.editor.btnGeo.classList.add('outline');
    }
}

//Logika przycisku Geo
export async function toggleGeo() {
    if (currentGeo) {
        currentGeo = null;
        updateGeoUI(false);
        return;
    }

    try {
        UI.editor.btnGeo.disabled = true;
        const pos = await Geo.getPosition();
        UI.editor.btnGeo.disabled = false;

        if (pos) {
            currentGeo = pos;
            updateGeoUI(true);
        } else {
            showModal('Info', 'Nie udało się ustalić lokalizacji. Sprawdź GPS.');
        }
    } catch (e) {
        UI.editor.btnGeo.disabled = false;
        showModal('Błąd', 'Brak dostępu do lokalizacji.');
    }
}

// Zapisywanie notatki
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
        geo: currentGeo,
        updated: Date.now()
    };

    try {
        await DB.addNote(note);
        showView('list');
        loadNotes();
    } catch (e) {
        showModal('Błąd', 'Pamięć pełna! Usuń coś.');
    }
}

// Usuwanie notatki
export async function deleteCurrentNote() {
    if (!currentNoteId) {
        showView('list');
        return;
    }
    const confirm = await showModal('Usuwanie', 'Usunąć notatkę?', true);
    if (confirm) {
        await DB.deleteNote(currentNoteId);
        showView('list');
        loadNotes();
    }
}