# Jak pobrać poprawki z GitHub na swój dysk

Ten dokument wyjaśnia, jak pobrać najnowszy kod z repozytorium GitHub na lokalny dysk po wprowadzeniu poprawek.

## Scenariusz 1: Pierwsze pobranie projektu

Jeśli jeszcze nie masz projektu na swoim dysku:

```bash
# Sklonuj repozytorium do nowego folderu
git clone https://github.com/shalke777/loftdeskv6.git

# Wejdź do folderu projektu
cd loftdeskv6

# Zainstaluj zależności
npm install
```

## Scenariusz 2: Aktualizacja istniejącego projektu (ZALECANE)

Jeśli masz już projekt na dysku i chcesz pobrać najnowsze poprawki:

```bash
# Wejdź do folderu projektu
cd loftdeskv6

# Pobierz najnowsze zmiany z głównej gałęzi
git pull origin main

# Jeśli używasz innej gałęzi (np. claude/fix-git-issue-with-revisions):
git pull origin claude/fix-git-issue-with-revisions

# Zaktualizuj zależności (jeśli były zmiany w package.json)
npm install
```

## Scenariusz 3: Masz lokalne zmiany i chcesz pobrać poprawki

Jeśli wprowadziłeś własne zmiany lokalnie i chcesz pobrać nowe poprawki z GitHub:

### Opcja A: Zachowaj swoje zmiany tymczasowo (stash)
```bash
# Zapisz swoje lokalne zmiany tymczasowo
git stash

# Pobierz najnowsze zmiany
git pull origin main

# Przywróć swoje lokalne zmiany
git stash pop
```

### Opcja B: Commituj swoje zmiany przed pobraniem
```bash
# Dodaj wszystkie zmiany do commitu
git add .

# Zapisz commit ze swoimi zmianami
git commit -m "Moje lokalne zmiany"

# Pobierz i scal zmiany z GitHub
git pull origin main
```

### Opcja C: Odrzuć lokalne zmiany (UWAGA: stracisz swoje zmiany!)
```bash
# UWAGA: To usunie wszystkie niezapisane zmiany!
git reset --hard HEAD

# Pobierz najnowsze zmiany
git pull origin main
```

## Scenariusz 4: Pełne odświeżenie projektu

Jeśli chcesz zacząć od zera z najnowszą wersją:

```bash
# Usuń cały stary folder projektu
rm -rf loftdeskv6

# Sklonuj projekt ponownie
git clone https://github.com/shalke777/loftdeskv6.git

# Wejdź do folderu
cd loftdeskv6

# Zainstaluj zależności
npm install
```

## Sprawdzanie stanu projektu

Przydatne komendy do sprawdzenia stanu:

```bash
# Sprawdź, na której gałęzi jesteś
git branch

# Sprawdź, czy masz lokalne zmiany
git status

# Zobacz ostatnie commity
git log --oneline -10

# Sprawdź, jakie zdalne gałęzie są dostępne
git branch -r

# Sprawdź różnice między lokalną wersją a zdalną
git fetch
git diff HEAD origin/main
```

## Pobieranie konkretnej wersji/tagu

Jeśli chcesz pobrać konkretną wersję projektu:

```bash
# Zobacz dostępne tagi/wersje
git tag

# Przełącz się na konkretny tag
git checkout v5.1.7

# Lub pobierz konkretną gałąź
git checkout nazwa-galezi
```

## Rozwiązywanie problemów

### Problem: "error: Your local changes would be overwritten"

Masz niezapisane lokalne zmiany. Użyj `git stash` lub `git reset --hard HEAD` (patrz Scenariusz 3).

### Problem: "fatal: not a git repository"

Nie jesteś w folderze projektu lub folder nie jest repozytorium git. Użyj `cd` aby przejść do właściwego folderu lub sklonuj projekt ponownie.

### Problem: Konflikty podczas git pull

Jeśli podczas `git pull` pojawią się konflikty:

```bash
# Git pokaże pliki z konfliktami
# Edytuj te pliki ręcznie, usuwając znaczniki konfliktu (<<<<, ====, >>>>)

# Po naprawieniu konfliktów:
git add .
git commit -m "Rozwiązane konflikty"
```

## Uruchomienie projektu po pobraniu

Po pobraniu poprawek z GitHub:

```bash
# Zainstaluj/zaktualizuj zależności
npm install

# Uruchom projekt w trybie deweloperskim
npm run dev

# Lub zbuduj wersję produkcyjną
npm run build
```

## Dodatkowe informacje

- Główna gałąź: zwykle `main` lub `master`
- Aktualne gałęzie można zobaczyć: `git branch -a`
- Link do repozytorium: https://github.com/shalke777/loftdeskv6

## Kontakt i pomoc

Jeśli masz problemy z pobraniem projektu:
1. Sprawdź, czy masz zainstalowany Git: `git --version`
2. Sprawdź, czy masz dostęp do repozytorium
3. Sprawdź połączenie internetowe
4. W razie większych problemów, użyj Scenariusza 4 (pełne odświeżenie)
