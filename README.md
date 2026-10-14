# Bierkompass

**Finde dein nächstes Lieblingsbier.** Ein Bierkatalog mit 50 Bieren aus 26 Ländern, der aus deinen Lieblingsbieren dein Geschmacksprofil berechnet und dir passende Biere empfiehlt, jeweils mit Match in Prozent und einem Satz, warum es passt.

FH-Semesterprojekt, Gruppe 4. Konzept, Anforderungen und Tickets stehen in [KONZEPT.md](KONZEPT.md).
---

## Inhalt

1. [Funktionen](#funktionen)
2. [Starten](#starten)
3. [Technik](#technik)
4. [Ordnerstruktur](#ordnerstruktur)
5. [Seiten und Routen](#seiten-und-routen)
6. [Empfehlungs-Algorithmus](#empfehlungs-algorithmus)
7. [Daten pflegen](#daten-pflegen)
8. [Häufige Änderungen](#häufige-änderungen)
9. [Tests und Prüfung](#tests-und-prüfung)
10. [Design](#design)
11. [Veröffentlichen](#veröffentlichen)
12. [Bekannte Grenzen](#bekannte-grenzen)
13. [Quellen und Lizenzen](#quellen-und-lizenzen)

---

## Funktionen

| Bereich | Was es kann |
|---|---|
| **Altersabfrage** | Geburtsdatum mit Tag, Monat und Jahr, Zugang ab 16 Jahren (Österreich). Wird nur bestätigt, nicht gespeichert. |
| **Intro** | Video mit 3D-Textzeilen, das in eine klickbare Punkt-Weltkarte der Brauereien übergeht. Tippen auf einen Standort zeigt die Biere des Landes. |
| **So funktioniert's** | Drei Schritte direkt nach dem Intro: Lieblingsbiere wählen, Geschmack berechnen, Neues entdecken. |
| **Karussell** | Alle Biere in einem endlosen 3D-Karussell. Ziehen oder Wischen, die mittlere Flasche öffnet sich. |
| **Für dich** | Platz 1 groß mit Radar (Bier gegen deinen Geschmack), Plätze 2–5 als Karten. Jede Empfehlung mit persönlicher Begründung, z. B. „Ähnlich malzig wie dein Guinness Draught, aber heller.“ |
| **Deine Top 5** | Bis zu fünf Favoriten, per Ziehen oder Pfeilen sortierbar. Platz 1 zählt am meisten. |
| **Katalog** | Alle Biere mit Geschmacksreglern (fruchtig ↔ herb, leicht ↔ kräftig, hell ↔ dunkel), Filter nach Sorte und Land, Sortierung. |
| **Detailseite** | Flasche, Glas, das sich einschenkt, Kennzahlen, Radar, Sternebewertung, ähnliche Biere. |
| **Vergleich** | Zwei Biere nebeneinander mit gemeinsamem Radar, Kennzahlen und einem Satz zu den Unterschieden. |
| **Quiz** | 8 Fragen ohne Bierwissen. Ergebnis: dein Biertyp (z. B. Hopfenfuchs, Malzbär) als Bild zum Teilen und fünf passende Biere. |
| **Profil** | Favoriten, Geschmacksprofil mit Biertyp, Bewertungs-Historie. Mehrere lokale Konten möglich. |
| **Rechtliches** | Impressum, Datenschutzerklärung, Button zum Löschen aller lokalen Daten. |

---

## Starten

Die Seite braucht einen lokalen Webserver. Direkt als Datei geöffnet (`file://…`) blockiert der Browser das Laden der JSON-Daten und der JavaScript-Module.

1. Ordner in VS Code öffnen.
2. Erweiterung **Live Server** installieren.
3. Rechtsklick auf `index.html` → **Open with Live Server**.


---

## Technik

- **HTML, CSS und JavaScript ohne Framework und ohne Build-Schritt.** Jede Datei im Ordner ist genau so, wie sie im Browser läuft.
- **Single-Page-App:** Es gibt nur eine `index.html`. Sie enthält Navigation, Footer und einen leeren Platzhalter `<main id="app">`. Der Router in `js/main.js` liest die Adresse (z. B. `#/bier/4`) und lässt die passende Datei aus `js/views/` den Inhalt bauen. Vorteile: Navigation und Footer stehen nur einmal im Code, Seitenwechsel ohne Neuladen, Daten werden nur einmal geladen, Favoriten wirken sofort überall.
- **ES-Module:** Jede Datei importiert, was sie braucht (`import … from "./store.js"`).
- **Daten:** schreibgeschützte JSON-Dateien in `data/`. Alles, was Nutzer ändern (Favoriten, Bewertungen, Quiz, Konten), liegt im `localStorage` des Browsers. Es gibt keinen Server und keine Datenbank.
- **Grafiken:** Flaschen, Gläser, Radar und Weltkarte sind SVG, die im Code erzeugt werden. Das Teilen-Bild des Biertyps entsteht per Canvas.
- **Seitenwechsel-Animation:** View Transitions API. Die Flasche „fliegt“ vom Karussell auf die Detailseite. Browser ohne Unterstützung wechseln ohne Animation.
- **Schriften:** Bevan, Oswald und Source Sans 3 über Google Fonts.

---

## Ordnerstruktur

```
index.html              Gerüst: Navigation, Altersabfrage, Footer, <main id="app">
css/style.css           alle Styles (Farb-Tokens oben in :root)
js/
  main.js               Router, Navigation, Altersabfrage, globale Klicks (Favorit, Sterne)
  config.js             alle Konstanten: Altersgrenze, Attribute, Gewichte, Textbausteine
  store.js              Daten laden, localStorage, Konten und Profile
  algo.js               Empfehlungs-Algorithmus (rein, ohne DOM, getestet)
  rules.js              Regeln: Alter aus Geburtsdatum, gültige Bewertung
  components.js         Bausteine: Flasche, Glas, Karte, Radar, Sterne, Fehlerseite
  hero.js               Intro mit Video, 3D-Text und Weltkarte
  karussell.js          Endlos-Karussell
  biertyp.js            Biertyp aus dem Profil, Teilen-Bild
  views/
    home.js             Startseite
    katalog.js          Alle Biere mit Reglern und Filtern
    detail.js           Detailseite eines Biers
    vergleich.js        Zwei Biere vergleichen
    quiz.js             Geschmacks-Quiz
    profil.js           Profil
    login.js            Anmelden und Registrieren
    favoriten-panel.js  Liste „Deine Top 5“ (Startseite und Profil)
    rechtliches.js      Impressum und Datenschutz
data/
  biere.json            die Biere (hier pflegen)
  brauereien_welt.json  Brauereien mit Koordinaten und Ländernamen
  quiz.json             8 Fragen mit je 4 Antworten
  favoriten.json        Start-Favoriten für neue Besucher
  weltkarte.json        Punktraster der Weltkarte (generiert, nicht von Hand ändern)
assets/                 Logo, Favicons, Intro-Video, Vorschaubild zum Teilen
scripts/
  validate_biere.mjs    prüft biere.json
  weltkarte_erzeugen.mjs  erzeugt weltkarte.json neu
tests/algo.test.mjs     Tests für Algorithmus, Regeln und Biertyp
KONZEPT.md              Anforderungen, Tickets, Datenmodell, Entscheidungen
```

---

## Seiten und Routen

| Adresse | Seite | Datei |
|---|---|---|
| `#/` | Startseite | `views/home.js` |
| `#/weltkarte` · `#/weltkarte/<brauerei-id>` | Startseite direkt bei der Karte | `views/home.js` + `hero.js` |
| `#/biere` · `#/biere/land/<ISO>` | Katalog, optional nach Land gefiltert | `views/katalog.js` |
| `#/bier/<id>` | Detailseite | `views/detail.js` |
| `#/vergleich` · `#/vergleich/<a>/<b>` | Vergleich | `views/vergleich.js` |
| `#/quiz` | Quiz | `views/quiz.js` |
| `#/profil` | Profil | `views/profil.js` |
| `#/login` | Konto | `views/login.js` |
| `#/impressum` · `#/datenschutz` | Rechtliches | `views/rechtliches.js` |

Unbekannte Adressen zeigen die Fehlerseite „Hier ist das Glas leer.“

**Neue Seite anlegen:** Datei in `js/views/` mit `export function render(el) { el.innerHTML = "…"; return {}; }` erstellen, in `js/main.js` importieren und eine Zeile in `ROUTEN` ergänzen.

---

## Empfehlungs-Algorithmus

Jedes Bier hat sechs Geschmackswerte von 0 bis 10: **bitter, malzig, fruchtig, süß, sauer, Körper**.

1. **Profil:** gewichteter Durchschnitt der eigenen Biere. Favoriten zählen nach Rang (Platz 1 = 5, Platz 5 = 1). Biere mit 5 Sternen zählen 3, mit 4 Sternen 2.
2. **Quiz:** Solange es weniger als fünf eigene Biere gibt, fließt das Quiz anteilig ein, mit Anteil (5 − n) / 5.
3. **Match pro Merkmal:** `exp(−(Abstand / 2,5)²)`. Kleine Abweichungen kosten wenig, große viel. Der Match ist der Durchschnitt der sechs Werte in Prozent.
4. **Abwertung:** Biere, die einem mit 1–2 Sternen bewerteten Bier sehr ähnlich sind, rutschen nach unten.
5. **Ausschluss:** Favoriten und bereits bewertete Biere werden nicht empfohlen.
6. **Begründung:** Für jede Empfehlung wird das ähnlichste eigene Bier gesucht, dazu die stärkste Gemeinsamkeit und der größte Unterschied. Bereits genannte Biere, Merkmale und Satzmuster werden für die nächsten Plätze abgewertet, damit sich die Sätze nicht wiederholen.

Ohne Favoriten, Bewertungen und Quiz zeigt die Seite die beliebtesten Biere. Details stehen in KONZEPT.md, Abschnitt 6.

---

## Daten pflegen

### Ein Bier hinzufügen oder ändern

Eintrag in `data/biere.json`:

```json
{
  "id": 51,
  "name": "Stiegl Goldbräu",
  "brauerei_id": 1020,
  "brauerei": "Stieglbrauerei zu Salzburg",
  "sorte": "Märzen",
  "herkunftsland": "AT",
  "abv": 4.9,
  "ibu": 18,
  "ebc": 12,
  "volumen_ml": 500,
  "beschreibung": "Ein Satz zum Charakter des Biers.",
  "popularity": 80,
  "profil": { "bitter": 3, "malzig": 6, "fruchtig": 1, "suess": 3, "sauer": 0, "koerper": 5 },
  "quelle": "https://… (Herstellerseite)",
  "dummy": false,
  "form": "euro",
  "etikett_farbe": "#C8102E"
}
```

| Feld | Bedeutung |
|---|---|
| `id` | eindeutige Zahl, nie neu vergeben |
| `brauerei_id` | muss in `brauereien_welt.json` existieren |
| `sorte` | eine der Sorten aus `SORTEN` in `js/config.js` |
| `herkunftsland` | ISO-Code mit zwei Buchstaben, Name in `brauereien_welt.json` → `laender` |
| `abv` / `ibu` / `ebc` | Alkohol in %, Bittere, Farbe (die EBC-Zahl bestimmt die Bierfarbe in Flasche und Glas) |
| `popularity` | 0–100, für „Beliebtheit“ und den Kaltstart |
| `profil` | sechs Werte 0–10. Am besten von zwei Personen unabhängig schätzen und mitteln. |
| `quelle` | Link, woher Alkohol, IBU und EBC stammen |
| `dummy` | `false` für recherchierte Biere. Bei `true`  |
| `form` | Flaschenform: `longneck`, `euro`, `weizen`, `bauchig` oder `dose` |
| `etikett_farbe` | Farbe von Kronkorken und Etikettrand |

Danach `npm run validate` ausführen.

### Eine Brauerei hinzufügen

Eintrag in `data/brauereien_welt.json` → `brauereien`:

```json
{ "id": 1041, "name": "Brauerei Name", "stadt": "Stadt", "land": "AT", "land_name": "Österreich", "lat": 47.80, "lng": 13.04 }
```

Ist das Land neu, auch unter `laender` eintragen. Der Punkt erscheint automatisch auf der Weltkarte.

### Quiz ändern

`data/quiz.json`: Jede Antwort hat `werte` für die Merkmale, die sie beeinflusst. Nicht genannte Merkmale bleiben neutral.

---

## Häufige Änderungen

| Was | Wo |
|---|---|
| Altersgrenze | `AGE_LIMIT` in `js/config.js` |
| Wie streng der Match rechnet | `MATCH_STRENGE` in `js/config.js` (kleiner = größere Unterschiede zwischen den Prozenten) |
| Anzahl Favoriten oder Empfehlungen | `MAX_FAVORITEN`, `EMPFEHLUNGEN_ANZAHL` in `js/config.js` |
| Wörter in den Begründungen | `ATTRIBUT_ADJEKTIV`, `ATTRIBUT_MEHR`, `ATTRIBUT_WENIGER`, `ATTRIBUT_NOMEN` in `js/config.js` |
| Biertypen (Namen, Texte) | `TYPEN` in `js/biertyp.js` |
| Geschmacksregler im Katalog | `ACHSEN` in `js/views/katalog.js` |
| Farben | Tokens in `:root` am Anfang von `css/style.css` |
| Impressum und Datenschutz | `js/views/rechtliches.js`, alle Angaben in [eckigen Klammern] ausfüllen |
| Logo und Favicon | Dateien in `assets/` ersetzen, gleiche Namen behalten |

### Intro-Video austauschen

Das Video läuft hinter den 3D-Textzeilen. `VIDEO_PHASEN` in `js/hero.js` legt fest, bei welcher Sekunde welche Zeile erscheint. Neues Video mit [ffmpeg](https://ffmpeg.org) für das Web vorbereiten:

```bash
ffmpeg -i neu.mp4 -an -vf scale=1280:-2 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -g 24 -movflags +faststart assets/hero-720.mp4
ffmpeg -i neu.mp4 -an -vf scale=854:-2  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -g 24 -movflags +faststart assets/hero-480.mp4
ffmpeg -i neu.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 4 assets/hero-poster.jpg
```

Danach die Sekunden in `VIDEO_PHASEN` an die neuen Schnitte anpassen. Lädt das Video nicht innerhalb von 2,5 Sekunden, läuft das Intro automatisch ohne Video.

### Weltkarte neu erzeugen

Nur nötig, wenn sich Ausschnitt oder Raster ändern sollen:

```bash
npm i -D world-atlas@2 topojson-client@3 d3-geo@3
node scripts/weltkarte_erzeugen.mjs data/weltkarte.json
```

### Lokale Daten zurücksetzen

Seite **Datenschutz** → „Alle lokalen Daten löschen“. Alternativ in den Entwicklertools unter *Application → Local Storage* alle Einträge mit `bk.` löschen.

---

## Tests und Prüfung

```bash
npm test             # 23 Tests: Algorithmus, Begründungen, Biertyp, Altersprüfung, Bewertung
npm run validate     # prüft biere.json: Pflichtfelder, Wertebereiche, Sorten, Brauerei-IDs
```

Vor jedem Commit, der `js/algo.js`, `js/config.js` oder `data/` ändert, beides ausführen.

**Manuell prüfen:** Startseite, Katalog, ein Bier, Vergleich, Quiz bis zum Ergebnis, Profil. Jeweils am Desktop und in den Entwicklertools in der Handy-Ansicht (390 px). Die Seite darf nie seitlich scrollen.

---

## Design

| Farbe | Wert | Verwendung |
|---|---|---|
| Coffee Bean | `#241A14` | Hintergrund |
| Amber Honey | `#E9A620` | Akzente, Buttons, Match-Werte |
| Pearl Beige | `#EFDEBD` | Text |

Abgeleitete Töne stehen als Tokens in `css/style.css` (`--flaeche`, `--karte`, `--linie`, `--text-2` …).

| Schrift | Verwendung |
|---|---|
| **Bevan** | nur große Momente: Logo, Seitentitel, Biername, Prozentwerte |
| **Oswald** | Zwischentitel, Labels, Buttons (Großbuchstaben, gesperrt) |
| **Source Sans 3** | Fließtext |

Regeln: Auf Amber-Flächen nur dunkle Schrift. Tastatur-Fokus immer sichtbar (2 px Amber). Bei „Bewegung reduzieren“ im Betriebssystem laufen keine Animationen.

---

## Veröffentlichen

Die Seite ist statisch und läuft auf jedem Webspace, z. B. **GitHub Pages**:

1. Repository auf GitHub → *Settings* → *Pages* → Branch `main`, Ordner `/ (root)`.
2. Nach einer Minute ist sie unter `https://<name>.github.io/<repo>/` erreichbar.

Danach:

- In `index.html` bei `og:image` die volle Adresse eintragen, z. B. `https://<name>.github.io/<repo>/assets/og-bild.jpg`. Sonst zeigen WhatsApp und Co. beim Teilen kein Vorschaubild.
- In `js/views/rechtliches.js` den Hosting-Anbieter und alle Platzhalter eintragen.

---

## Bekannte Grenzen

- **Konten nur lokal:** Konten gelten nur in diesem Browser. Passwörter werden als SHA-256-Hash gespeichert, das ist aber kein echter Schutz. Für echte Konten bräuchte es einen Server.
- **JavaScript nötig:** Ohne JavaScript bleibt die Seite leer.
- **Suchmaschinen und Teilen:** Wegen der `#/`-Adressen sehen sie nur die Startseite. Das Vorschaubild ist für alle Unterseiten gleich.
- **Browser:** Für aktuelle Versionen von Chrome, Edge, Firefox und Safari gebaut. Die Flaschen-Animation beim Seitenwechsel braucht die View Transitions API. Browser ohne sie wechseln die Seite ohne Animation, alles andere funktioniert gleich.

---

## Quellen und Lizenzen

- **Weltkarte:** [Natural Earth](https://www.naturalearthdata.com) (Public Domain), über das npm-Paket world-atlas
- **Schriften:** Bevan, Oswald, Source Sans 3 über [Google Fonts](https://fonts.google.com) (SIL Open Font License)
- **Flaschen, Gläser, Radar, Karte:** eigene SVG-Grafiken
- **Logo und Intro-Video:** vom Projektteam mit KI-Bild- und Videowerkzeugen erstellt
- **Biernamen und Marken** gehören ihren Inhabern und werden nur zur Beschreibung verwendet

Nicht-kommerzielles Studienprojekt. Genieße verantwortungsvoll.
