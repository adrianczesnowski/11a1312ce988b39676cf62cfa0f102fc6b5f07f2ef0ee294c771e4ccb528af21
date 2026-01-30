# Podróżnik - PWA (Notatki z Podróży)

Progresywna Aplikacja Webowa (PWA) służąca do tworzenia notatek z podróży wzbogaconych o multimedia i lokalizację. Aplikacja działa w modelu **Local-First**, co oznacza, że Twoje dane (tekst, zdjęcia, współrzędne) są przechowywane w bazie danych przeglądarki i nigdy nie są wysyłane na zewnętrzny serwer.

## Szybki Start

Aplikacja jest napisana w czystym JavaScript (Vanilla JS) z wykorzystaniem modułów ES6. Nie wymaga bundlerów ani kompilacji.

### Wymagania
Ze względu na wykorzystanie zaawansowanych API przeglądarki (Service Worker, Kamera, Geolokalizacja), aplikacja **wymaga bezpiecznego połączenia HTTPS** (lub `localhost` podczas developmentu).

### Instalacja (Hosting)
1. Wgraj wszystkie pliki na serwer (np. GitHub Pages, Netlify, Vercel).
2. Upewnij się, że plik `sw.js` znajduje się w głównym katalogu (root), aby miał odpowiedni zakres działania.
3. Otwórz stronę na telefonie i użyj opcji "Dodaj do ekranu początkowego" (Android/iOS), aby zainstalować ją jako natywną aplikację.

---

## Kluczowe Funkcje

### 1. Geolokalizacja (GPS)
Moduł `js/geo.js` pozwala na jednym kliknięciem dodać aktualne współrzędne do notatki.
* **Działanie Offline:** Współrzędne są pobierane z modułu GPS urządzenia nawet bez dostępu do Internetu.
* **Integracja:** W notatce zapisywany jest link, który po kliknięciu (gdy jest sieć) otwiera lokalizację w Mapach Google.

### 2. Multimedia i Sprzęt
* **Aparat:** Przechwytywanie zdjęć bezpośrednio w aplikacji. Obrazy są kompresowane do formatu JPEG (Base64) i zapisywane wewnątrz notatki.
* **Rozpoznawanie mowy:** Integracja z Web Speech API pozwala na dyktowanie treści notatek (ikona mikrofonu).

### 3. Tryb Offline (Service Worker)
Aplikacja jest w pełni funkcjonalna bez dostępu do sieci:
* **App Shell:** Interfejs użytkownika, style i skrypty są cache'owane przy pierwszym uruchomieniu.
* **Baza danych:** Wszystkie notatki są dostępne offline.

### 4. Baza Danych (IndexedDB)
Zamiast `localStorage`, aplikacja używa **IndexedDB** (`js/db.js`), co zapewnia:
* Większą pojemność (niezbędne dla zdjęć).
* Asynchroniczny dostęp do danych (nie blokuje interfejsu).
* Trwałość danych.

### 5. Interfejs (Custom CSS)
Aplikacja nie używa zewnętrznych frameworków CSS (jak Bootstrap). Posiada lekki, autorski styl (`css/style.css`) zoptymalizowany pod urządzenia mobilne (Mobile First), obsługujący modalne okna dialogowe i responsywny układ.

---

## Struktura Projektu

Projekt oparty jest na modułach ES (ECMAScript Modules).

```text
/
├── index.html          # Główny widok aplikacji
├── manifest.json       # Konfiguracja instalacji PWA (ikony, kolory)
├── sw.js               # Service Worker (Cache i obsługa Offline)
├── css/
│   └── style.css       # Style aplikacji (Mobile First, Custom Design)
├── js/
│   ├── app.js          # Główny punkt wejścia, inicjalizacja zdarzeń
│   ├── db.js           # Obsługa bazy danych IndexedDB (CRUD)
│   ├── geo.js          # Obsługa Geolocation API
│   ├── notes.js        # Logika biznesowa notatek (edycja, zapis, renderowanie)
│   ├── settings.js     # Funkcje administracyjne (reset danych)
│   ├── speech.js       # Obsługa Web Speech API (dyktowanie)
│   └── ui.js           # Zarządzanie DOM, widokami i modalem
└── assets/             # Ikony aplikacji (PWA icons)