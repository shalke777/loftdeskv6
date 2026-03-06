# 🚀 Jak uruchomić LoftDesk v6

## Szybki Start

### 1. Instalacja zależności

```bash
npm install
```

### 2. Uruchomienie aplikacji deweloperskiej

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:5173**

---

## 📋 Dostępne Komendy

### Deweloperskie
| Komenda | Opis |
|---------|------|
| `npm run dev` | Uruchamia serwer deweloperski z HMR |
| `npm run build` | Buduje wersję produkcyjną (TypeScript + Vite) |
| `npm run preview` | Podgląd zbudowanej wersji produkcyjnej |
| `npm run typecheck` | Sprawdza błędy TypeScript bez budowania |
| `npm run lint` | Uruchamia ESLint |

### Narzędzia diagnostyczne
| Komenda | Opis |
|---------|------|
| `npm run env:check` | Sprawdza konfigurację środowiska |
| `npm run deploy:ready` | Raport gotowości do wdrożenia |
| `npm run release:report` | Raport wydania |
| `npm run go:live` | Raport produkcyjny |
| `npm run preflight` | Preflight check przed wdrożeniem |

---

## 🔐 Konta Demo

Aplikacja działa w **trybie demo** bez konieczności konfiguracji Supabase!

### Dostępne konta testowe:

#### 👨‍💼 Admin / Właściciel Firmy
- **Email:** `adam@budowlanka.pl`
- **Hasło:** `demo123`
- **Dostęp:** Pełny dostęp do wszystkich funkcji

#### 👷 Koordynator
- **Email:** `koordynator@budowlanka.pl`
- **Hasło:** `demo123`
- **Dostęp:** Ograniczone uprawnienia

#### 🏢 Inna Firma
- **Email:** `marta@marex.pl`
- **Hasło:** `demo456`
- **Dostęp:** Dane innej firmy

#### 🛡️ Super Admin
- **Email:** `biuro@loftdesk.pl`
- **Hasło:** `admin123`
- **Dostęp:** Panel administracyjny

---

## 📂 Struktura Projektu

```
loftdeskv6/
├── src/
│   ├── app/              # Główna aplikacja, routing, providers
│   ├── features/         # Moduły funkcjonalne (klienci, faktury, etc.)
│   ├── shared/           # Współdzielone komponenty, hooki, utils
│   ├── entities/         # Modele danych (TypeScript + Zod)
│   ├── services/         # Serwisy API
│   └── workflows/        # Workflow'y wieloetapowe
├── public/              # Statyczne pliki
├── dist/                # Zbudowana aplikacja (po npm run build)
└── supabase/            # Migracje i seed dla Supabase
```

---

## 🎯 Dostępne Moduły

Po zalogowaniu masz dostęp do:

- 📊 **Dashboard** - Przegląd kluczowych metryk
- 👥 **Klienci** - Zarządzanie kontrahentami
- 💰 **Kosztorysy** - Tworzenie wycen
- 🧾 **Faktury** - Generowanie faktur
- 📝 **Umowy** - Zarządzanie umowami
- 🏗️ **Projekty** - Projekty budowlane
- 📈 **Raporty** - Raporty finansowe
- 🏦 **KSeF** - Integracja z KSeF (Polski system e-faktur)
- 💳 **Billing** - Zarządzanie subskrypcją
- ⚙️ **Ustawienia** - Konfiguracja firmy i zespołu
- 🌐 **Portal Klienta** - Dedykowany portal dla klientów
- 🎓 **Onboarding** - Proces konfiguracji nowej firmy

---

## 🔧 Debugowanie

### React Query Devtools
Automatycznie dostępne w trybie dev - sprawdź stan cache'u i zapytań.

### TanStack Router Devtools
Dostępne w lewym dolnym rogu - debugowanie routingu.

### Console Logs
Wszystkie błędy i ostrzeżenia są logowane w konsoli przeglądarki.

---

## ✅ Status Projektu

- **TypeScript:** ✓ Kompiluje bez błędów
- **Build:** ✓ Działa poprawnie (2.83s)
- **ESLint:** ✓ Skonfigurowany
- **PWA:** ✓ Service Worker wygenerowany
- **Bundle Size:** ✓ Zoptymalizowany

---

## 🌐 Tryb Produkcyjny

### Budowanie:
```bash
npm run build
```

Wygeneruje folder `dist/` z zoptymalizowaną wersją aplikacji.

### Podgląd produkcji lokalnie:
```bash
npm run preview
```

Uruchomi zbudowaną wersję na lokalnym serwerze.

---

## 💡 Wskazówki

1. **Hot Module Replacement** - Zmiany w kodzie odświeżają się automatycznie
2. **Demo Mode** - Wszystkie dane są przechowywane w localStorage
3. **PWA Ready** - Aplikacja działa offline jako Progressive Web App
4. **TypeScript** - Pełne wsparcie typów dla bezpieczniejszego kodu
5. **Modułowa Architektura** - Łatwo dodawać nowe funkcje

---

## 🐛 Rozwiązywanie Problemów

### Problem: `npm run dev` nie działa
**Rozwiązanie:** Upewnij się, że masz Node.js v18+ i uruchom `npm install`

### Problem: Port 5173 zajęty
**Rozwiązanie:** Vite automatycznie wybierze kolejny wolny port (5174, 5175, etc.)

### Problem: Błędy TypeScript
**Rozwiązanie:** Uruchom `npm run typecheck` aby zobaczyć szczegóły

---

## 📞 Wsparcie

- Dokumentacja techniczna: Zobacz pliki w `docs/`
- Checklisty: Sprawdź `tests/manual/`
- Release notes: `PATCH_NOTES_*.md`

---

**Gotowe do użycia! Uruchom `npm run dev` i zacznij pracę! 🚀**
