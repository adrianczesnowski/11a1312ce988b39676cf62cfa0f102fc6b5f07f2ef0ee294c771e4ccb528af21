import { showModal } from './ui.js';
import * as DB from './db.js';

/**
 * Wykonuje pełny reset aplikacji.
 * Usuwa bazę danych i przeładowuje stronę.
 */
export async function performFullReset() {
    const confirmed = await showModal('Reset', 'Czy usunąć WSZYSTKIE dane? Operacja nieodwracalna.', true);

    if (confirmed) {
        try {
            await DB.clearAll();
            window.location.reload();
        } catch (e) {
            console.error(e);
            showModal('Błąd', 'Nie udało się wyczyścić danych.');
        }
    }
}