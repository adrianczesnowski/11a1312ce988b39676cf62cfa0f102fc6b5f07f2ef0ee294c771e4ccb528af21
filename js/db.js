const DB = (() => {
    const DB_NAME = 'secure-notes';
    const STORE_NAME = 'notes';

    /**
     * @function openDB - Inicjuje połączenie z IndexedDB i tworzy magazyn jeśli nie istnieje.
     */
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
    }

    /**
     * @function addNote - Zapisuje lub aktualizuje obiekt notatki.
     */
    async function addNote(note) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(note);
        return tx.complete;
    }

    /**
     * @function getAll - Pobiera wszystkie notatki z bazy.
     */
    async function getAll() {
        const db = await openDB();
        return new Promise(resolve => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
        });
    }

    /**
     * @function getNote - Pobiera jedną notatkę po ID.
     */
    async function getNote(id) {
        const db = await openDB();
        return new Promise(resolve => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
            req.onsuccess = () => resolve(req.result);
        });
    }

    /**
     * @function deleteNote - Usuwa notatkę o podanym ID.
     */
    async function deleteNote(id) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        return tx.complete;
    }

    return { addNote, getAll, getNote, deleteNote };
})();