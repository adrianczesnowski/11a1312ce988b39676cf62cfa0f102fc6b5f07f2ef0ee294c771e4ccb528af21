# FajneNotatki - PWA

Progresywna Aplikacja Webowa (PWA) służąca do bezpiecznego tworzenia i przechowywania notatek multimedialnych. Aplikacja działa w modelu **Local-First**, co oznacza, że Twoje dane nigdy nie opuszczają urządzenia.

## Szybki Start

Aplikacja jest gotowa do użycia i nie wymaga kompilacji. Ze względu na bezpieczeństwo (WebAuthn, Kamera), wymagane jest połączenie **HTTPS**.

### Hosting (GitHub Pages / Netlify)
1. Wgraj pliki zachowując strukturę folderów.
2. Upewnij się, że `sw.js` znajduje się w katalogu głównym (root).
3. Po otwarciu strony na iOS użyj opcji "Dodaj do ekranu początkowego", aby uzyskać pełny tryb PWA.

---

## Kluczowe Funkcje PWA

### 1. Tryb Offline
Zastosowano zaawansowaną strategię buforowania w pliku `sw.js`:
* **App Shell (Cache First):** Kluczowe pliki (`index.html`, `style.css`, skrypty JS) są ładowane natychmiast z pamięci podręcznej.
* **Dynamic Assets (Stale-While-Revalidate):** Ikony i inne zasoby są serwowane z cache, a w tle następuje ich cicha aktualizacja.
* **Navigation Fallback:** W przypadku braku sieci, zapytania nawigacyjne są zawsze kierowane do `index.html`.

### 2. Bezpieczeństwo i Autoryzacja
Aplikacja oferuje dwa poziomy zabezpieczeń zarządzane przez `js/auth.js`:
* **Biometria (WebAuthn):** Wykorzystuje czytniki linii papilarnych lub rozpoznawanie twarzy (FaceID/TouchID). Dane biometryczne są przechowywane w bezpiecznym module urządzenia (platform authenticator).
* **Kod PIN:** Proste zabezpieczenie alternatywne przechowywane w `localStorage`. 
    * *Uwaga:* Obecna wersja wspiera jeden profil użytkownika na danej przeglądarce.

### 3. Multimedia i Sprzęt
* **Aparat:** Przechwytywanie zdjęć do notatek za pomocą API `MediaDevices`. Obrazy są przetwarzane na format Base64 i przechowywane lokalnie.
* **Dyktowanie (Speech-to-Text):** Integracja z Web Speech API umożliwia wprowadzanie tekstu za pomocą głosu (wymaga wsparcia przeglądarki, np. Chrome/Safari).

### 4. Baza Danych (IndexedDB)
Zamiast limitowanego `localStorage`, notatki są zapisywane w **IndexedDB** (`js/db.js`). Pozwala to na:
* Przechowywanie dużych ilości danych (w tym zdjęć).
* Szybkie przeszukiwanie treści notatek.
* Trwałość danych nawet po zamknięciu przeglądarki lub restarcie urządzenia.

---

## Struktura Projektu

```text
/
├── index.html          # Struktura UI (Bootstrap 5)
├── manifest.json       # Konfiguracja instalacji PWA
├── sw.js               # Service Worker (Logika Offline)
├── css/
│   └── style.css       # Style i poprawki interfejsu
├── js/
│   ├── app.js          # Główny kontroler widoków i nawigacji
│   ├── db.js           # Obsługa bazy danych IndexedDB
│   ├── auth.js         # Obsługa biometrii i PINu
│   └── speech.js       # Integracja z rozpoznawaniem mowy
└── assets/             # Ikony (192x192, 512x512)