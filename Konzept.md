# Bierkompass – Abschlusskonzept 

 

**FH-Semesterprojekt · Gruppe 4 · Daniel Redl, Temuulen Ganbaatar** 

Version 3.1 · Stand 10.10.2026 

 

> Technische Anleitung: [README.md] 

--- 

 

## Inhalt 

 

1. [Kurzfassung](#1-kurzfassung) 

2. [Ausgangslage und Ziel](#2-ausgangslage-und-ziel) 

3. [Anforderungen und Umsetzung](#3-anforderungen-und-umsetzung) 

5. [Funktionsumfang](#5-funktionsumfang) 

6. [Nutzerführung](#6-nutzerführung) 

7. [Architektur](#7-architektur) 

8. [Datenmodell](#8-datenmodell) 

9. [Empfehlungs-Algorithmus](#9-empfehlungs-algorithmus) 

10. [Quiz und Biertyp](#10-quiz-und-biertyp) 

11. [Design](#11-design) 

12. [Qualität](#12-qualität) 

13. [Tickets und Status](#13-tickets-und-status) 

14. [Offene Punkte vor der Abgabe](#14-offene-punkte-vor-der-abgabe) 

15. [Ausblick](#15-ausblick) 

16. [Präsentation](#16-präsentation) 

 

--- 

 

## 1. Kurzfassung 

 

**Bierkompass** ist ein personalisierter Bierkatalog als Website. Nutzer wählen bis zu fünf Lieblingsbiere. Daraus berechnet die Seite ein Geschmacksprofil mit sechs Merkmalen und empfiehlt passende, noch nicht probierte Biere, jeweils mit Match in Prozent und einem persönlichen Satz, warum das Bier passt. Wer noch keine Lieblingsbiere hat, startet über ein kurzes Quiz. 

 

| Kennzahl | Wert | 

|---|---| 

| Biere | 50 | 

| Brauereien / Länder | 40 / 26 | 

| Seiten | 10 Routen, eine HTML-Datei | 

| Geschmacksmerkmale | 6: bitter, malzig, fruchtig, süß, sauer, Körper (je 0–10) | 

| Automatische Tests | 23, alle grün | 

| Technik | HTML, CSS, JavaScript, JSON, kein Server | 

 

--- 

 

## 2. Ausgangslage und Ziel 

 

**Idee aus der Projektbeschreibung:** ein personalisierter Bierkatalog mit Suchfeld, Karussell der Treffer, Detailansicht, Liste der fünf Lieblingsbiere, daraus abgeleitetem Geschmacksprofil, Empfehlungen und einer Historie bewerteter Biere. Etwas, worauf wir stolz sein können und das wir und unser Bekanntenkreis selbst nutzen. 

 

**Ziel der Umsetzung:** 

 

1. Die Kernidee vollständig umsetzen: Suche, Karussell, Detail, Favoriten, Historie, Profil, Empfehlungen. 

2. Den Algorithmus sichtbar und nachvollziehbar machen, nicht nur eine Liste ausgeben. 

3. Eine Seite bauen, die wie ein echtes Markenprodukt wirkt (Referenzen: Jägermeister, Jack Daniel's, Stiegl). 

4. Ohne Server lauffähig, damit jeder im Team und jeder Prüfer sie sofort starten kann. 

 

**Zielgruppe:** Erwachsene ab 16 Jahren (Österreich), die gern Bier trinken, aber nicht wissen, was sie als Nächstes probieren sollen. Kein Fachwissen nötig. 

 

--- 

 

## 3. Anforderungen und Umsetzung 

 

### Funktionale Anforderungen 

 

| # | Anforderung (Projektbeschreibung) | Umsetzung | Status | 

|---|---|---|---| 

| FR1 | Suche nach Freitext (Name, Brauerei, Biersorte), Treffer im Karussell mit SVG und Name | Suchfeld in der Navigation. Durchsucht Name, Brauerei, Sorte, Land, Beschreibung und Geschmack („fruchtig“). Treffer erscheinen im 3D-Karussell als Flasche mit Namen. | erfüllt, erweitert | 

| FR2 | Klick im Karussell öffnet Detailansicht mit Namen, Brauerei, Sorte, Alkohol, Geschmacksprofil, Beschreibung | Detailseite mit Flasche, sich einschenkendem Glas, Kennzahlen (Alkohol, IBU, Farbe EBC, Inhalt), Radar im Vergleich zum eigenen Geschmack, Beschreibung, ähnlichen Bieren | erfüllt | 

| FR3 | Bis zu 5 Lieblingsbiere, ein sechstes erst nach Entfernen | „Deine Top 5“, sortierbar per Ziehen oder Pfeiltasten. Beim sechsten erscheint „Entferne zuerst ein Bier“. | erfüllt | 

| FR4 | Probiertes Bier mit Datum und 1–5 Sternen in der Historie, chronologisch | Sternebewertung auf der Detailseite. Historie im Profil, neueste zuerst, Bewertung änderbar, Eintrag löschbar. | erfüllt | 

| FR5 | Aus Favoriten und Historie ein Profil berechnen, sortierte Empfehlungen noch nicht probierter Biere | Algorithmus in `js/algo.js` (Abschnitt 9), „Für dich“ auf der Startseite, Quiz-Ergebnis, Sortierung „Passend für dich“ im Katalog | erfüllt, erweitert | 

 

### Nicht-funktionale Anforderungen 

 

| # | Anforderung | Umsetzung und Nachweis | Status | 

|---|---|---|---| 

| NFR1 | Ohne Einschulung von der Startansicht in höchstens 3 Klicks zur Detailansicht | 1 Klick: Flasche im Karussell oder Karte in „Für dich“. 2 Klicks: Land auf der Weltkarte, dann Bier. „So funktioniert's“ erklärt den Ablauf direkt nach dem Intro. | erfüllt | 

| NFR2 | Suchergebnis in weniger als 1 Sekunde | Die Suche läuft lokal im Browser, gemessen etwa 0,2 ms bei 50 Bieren. Die Dauer wird bei jedem Suchergebnis angezeigt. | erfüllt | 

 

### zusätzlich umgesetzt 

 

Altersabfrage ab 16, Geschmacks-Quiz mit Biertyp und Teilen-Bild, Weltkarte der Brauereien, Vergleich zweier Biere, Geschmacksregler im Katalog, persönliche Begründungen, lokale Konten, Impressum und Datenschutz, Handy-Ansicht. 

 

--- 

 

## 4. Abweichungen von der Projektbeschreibung 

 

| Projektbeschreibung | Umsetzung | Begründung | 

|---|---|---| 

| Bilder der Biere als PNG | Flaschen als SVG aus den Daten (Form, Bierfarbe, Etikettfarbe) | Keine Bildrechte nötig, Vermeidung von Urheberrechtsproblemen 

 

--- 

 

## 5. Funktionsumfang 

 

| Adresse | Seite | Inhalt | 

|---|---|---| 

| `#/` | Startseite | Intro (Video, 3D-Text, Weltkarte) → So funktioniert's → Karussell → Für dich → Deine Top 5 | 

| `#/weltkarte(/<id>)` | Startseite bei der Karte | Intro übersprungen, optional Zoom auf eine Brauerei | 

| `#/biere(/land/<ISO>)` | Katalog | Geschmacksregler, Filter nach Sorte und Land, Sortierung, Karten aller Biere | 

| `#/bier/<id>` | Detail | Flasche, Glas, Kennzahlen, Match, Favorit, Sterne, Radar, ähnliche Biere | 

| `#/vergleich(/<a>/<b>)` | Vergleich | Zwei Flaschen, Ähnlichkeit, gemeinsames Radar, Satz zu den Unterschieden, Tabelle | 

| `#/quiz` | Quiz | Einführung, 8 Fragen mit füllendem Glas, Biertyp, fünf Empfehlungen | 

| `#/profil` | Profil | Favoriten, Geschmack mit Biertyp, Historie | 

| `#/login` | Konto | Anmelden, Registrieren, Abmelden | 

| `#/impressum`, `#/datenschutz` | Rechtliches | Vorlagen nach österreichischem Recht, Daten löschen | 

| alles andere | Fehlerseite | „Hier ist das Glas leer.“ | 

 

**Immer sichtbar:** Navigation mit Logo, Suche, Menü „Biere“ (Alle Biere, Favoriten, Quiz, Vergleichen), Weltkarte und Kontomenü. Footer mit Hinweis „Ab 16 Jahren“ und Links zu Impressum und Datenschutz. 

 

--- 

 

## 6. Nutzerführung 

 

**Erster Besuch** 

Altersabfrage → Intro (6 Sekunden, überspringbar) → Weltkarte → „So funktioniert's“ erklärt die drei Schritte → im Karussell Biere mit „Zu Favoriten“ markieren → „Für dich“ füllt sich sofort mit Empfehlungen und Begründungen. 

 

**Ohne Lieblingsbiere** 

„Für dich“ zeigt die beliebtesten Biere und lädt zum Quiz ein → 8 Fragen zu Kaffee, Schokolade, Obst usw. → Biertyp und fünf Empfehlungen → das Quiz-Profil wirkt so lange mit, bis fünf eigene Biere da sind. 

 

**Wiederkehrend** 

Intro läuft nicht erneut → Empfehlungen sind da → Biere bewerten, Top 5 umsortieren, im Katalog mit Reglern stöbern, zwei Biere vergleichen. 

 

**Leere Zustände** laden immer zum nächsten Schritt ein, statt leere Rahmen zu zeigen. 

 

--- 

 

## 7. Architektur 

 

**Single-Page-App.** Es gibt eine `index.html` mit Navigation, Altersabfrage, Footer und dem Platzhalter `<main id="app">`. Der Router in `js/main.js` liest die Adresse und lässt die passende Datei in `js/views/` den Inhalt bauen. 

 

``` 

 index.html ─► js/main.js (Router, Navigation, Altersabfrage) 

                   │ 

                   ├─► js/views/*.js     eine Datei pro Seite, baut HTML 

                   │        │ 

                   │        ├─► js/components.js   Flasche, Glas, Karte, Radar, Sterne 

                   │        ├─► js/hero.js         Intro und Weltkarte 

                   │        ├─► js/karussell.js    3D-Karussell 

                   │        └─► js/biertyp.js      Biertyp, Teilen-Bild 

                   │ 

                   ├─► js/algo.js        Algorithmus (ohne DOM, getestet) 

                   ├─► js/rules.js       Altersprüfung, Bewertung (getestet) 

                   ├─► js/config.js      alle Konstanten 

                   └─► js/store.js ◄──► data/*.json (lesen) + localStorage (lesen/schreiben) 

``` 

 

**Warum eine Single-Page-App:** 

 

- Navigation und Footer stehen nur einmal im Code. 

- Seitenwechsel ohne Neuladen. Das ermöglicht die Animation, bei der die Flasche vom Karussell auf die Detailseite fliegt (View Transitions API). 

- Die Daten (etwa 250 KB) werden nur einmal geladen. 

- Favoriten und Bewertungen wirken sofort auf allen Bereichen. 

 

**Trennung von Logik und Darstellung:** `algo.js` und `rules.js` enthalten keinen Zugriff auf die Seite und sind deshalb mit Node testbar. Alle einstellbaren Werte stehen in `config.js`. 

 

--- 

 

## 8. Datenmodell 

 

### Abbildung der Tabellen aus der Projektbeschreibung 

 

| Tabelle (Projektbeschreibung) | Umsetzung | 

|---|---| 

| Bierkatalog | `data/biere.json`: id, name, brauerei, sorte, herkunftsland, abv, ibu, beschreibung, volumen_ml, zusätzlich ebc, popularity, form, etikett_farbe, quelle | 

| Geschmacksprofil (Bier) | Feld `profil` in jedem Bier: bitter, malzig, fruchtig, suess, sauer, koerper (0–10) | 

| User | `localStorage` → `bk.konten` (Benutzername, Passwort-Hash), `bk.current` (angemeldet) | 

| Favoriten | `bk.profile` → je Konto `favoriten: [bier_id, …]`, Reihenfolge = Rang 1–5 | 

| Historie | `bk.profile` → je Konto `historie: [{ bier_id, sterne, datum }]` | 

| Geschmacksprofil (User) | wird bei jedem Aufruf neu berechnet, nicht gespeichert. So ist es nie veraltet. Das Quiz-Profil liegt in `quiz_profil`. | 

 

### Dateien 

 

| Datei | Inhalt | Änderbar | 

|---|---|---| 

| `data/biere.json` | 50 Biere | von uns gepflegt | 

| `data/brauereien_welt.json` | 40 Brauereien mit Koordinaten, Ländernamen | von uns gepflegt | 

| `data/quiz.json` | 8 Fragen, je 4 Antworten mit Profilwerten | von uns gepflegt | 

| `data/favoriten.json` | Start-Favoriten für neue Besucher | von uns gepflegt | 

| `data/weltkarte.json` | Punktraster der Weltkarte (Natural Earth) | generiert per Skript | 

 

### Im Browser gespeichert (Präfix `bk.`) 

 

| Schlüssel | Inhalt | 

|---|---| 

| `bk.age` | Altersabfrage bestanden (nur `true`, kein Datum) | 

| `bk.konten` | lokale Konten mit SHA-256-Hash des Passworts | 

| `bk.current` | angemeldetes Konto, sonst „Gast“ | 

| `bk.profile` | je Konto: Favoriten, Historie, Quiz-Profil | 

| `bk.intro-gesehen` | Intro in diesem Tab gesehen (sessionStorage) | 

 

Feldbeschreibungen und ein Beispiel-Eintrag stehen im README unter „Daten pflegen“. `npm run validate` prüft Pflichtfelder, Wertebereiche, Sorten und Verweise. 

 

--- 

 

## 9. Empfehlungs-Algorithmus 

 

Umsetzung der Algorithmusbeschreibung aus der Projektbeschreibung, Schritt für Schritt: 

 

| Schritt (Beschreibung) | Umsetzung | 

|---|---| 

| 1. Merkmale auf 0–10 normiert | sechs Merkmale je Bier, alle auf 0–10 | 

| 2. Gewichtetes Profil, gute Bewertungen ziehen, schlechte werten ab | Favoriten nach Rang (Platz 1 = 5 … Platz 5 = 1), 5 ★ = 3, 4 ★ = 2, 3 ★ neutral. Biere ähnlich zu 1–2 ★ werden abgewertet (× 0,85 bzw. × 0,92 ab 90 % Ähnlichkeit). | 

| 3. Profil mit Katalog abstimmen | Match pro Merkmal `exp(−(Abstand / 2,5)²)`, Durchschnitt der sechs Werte in Prozent | 

| 4. Probierte Biere raus, absteigend sortiert | Favoriten und bewertete Biere ausgeschlossen, Sortierung nach Match, bei Gleichstand nach Beliebtheit | 

| 5. Profil passt sich mit jeder Bewertung an | Profil wird bei jeder Änderung neu berechnet, Empfehlungen aktualisieren sich sofort | 

 

**Warum die Gauß-Kurve statt einer Geraden:** Mit linearem Abstand lagen fast alle Biere zwischen 80 und 95 %, die Unterschiede waren kaum erkennbar. Mit der Kurve kosten kleine Abweichungen wenig, große viel. Ergebnis: beste Treffer etwa 87–94 %, Mittelfeld etwa 71 %, schlechteste unter 20 %. Die Strenge ist über `MATCH_STRENGE` einstellbar. 

 

**Quiz als Startpunkt:** Bei *n* eigenen Bieren zählt das Quiz mit dem Anteil (5 − n) / 5. Ab fünf eigenen Bieren hat es keinen Einfluss mehr. 

 

**Persönliche Begründung:** Für jede Empfehlung sucht der Algorithmus das ähnlichste eigene Bier, die stärkste Gemeinsamkeit (bei beiden ausgeprägt) und den größten Unterschied (ab 2 Punkten, sonst die Farbe). Daraus entstehen Sätze wie: 

 

- „Ähnlich malzig wie dein Guinness Draught, aber heller.“ 

- „Hat die Herbe von deinem Pilsner Urquell, nur fruchtiger.“ 

- „Für Fans von Mahou Cinco Estrellas (5 ★ von dir): ebenso vollmundig.“ 

 

Bereits genannte Biere, Merkmale und Satzmuster werden für die nächsten Plätze abgewertet. Ein Test stellt sicher, dass fünf Empfehlungen immer fünf verschiedene Sätze mit Bezug auf ein eigenes Bier ergeben. 

 

**Kaltstart:** Ohne Favoriten, Bewertungen und Quiz werden die beliebtesten Biere gezeigt. 

 

--- 

 

## 10. Quiz und Biertyp 

 

**8 Fragen mit je 4 Antworten, ohne Bierwissen:** 

 

1. Welche Art von Bier schmeckt dir am besten? 

2. Wie stehst du zu Bitterkeit? 

3. Wie trinkst du deinen Kaffee? 

4. Welche Schokolade nimmst du? 

5. Wie magst du Saures? 

6. Welches Obst greifst du zuerst? 

7. Welches Brot magst du am liebsten? 

8. Wie soll sich ein Bier im Mund anfühlen? 

 

Jede Antwort setzt Werte für einzelne Merkmale (`data/quiz.json`). Das Quiz-Profil ist der Durchschnitt. 

 

**Biertyp:** Das stärkste Merkmal bestimmt einen von sieben Typen, passend zum Logo: 

 

| Typ | Merkmal | Typisch | 

|---|---|---| 

| Hopfenfuchs | bitter | Pils, IPA, Pale Ale | 

| Malzbär | malzig | Märzen, Dunkel, Bock | 

| Röstrabe | Körper | Stout, Porter, Doppelbock | 

| Fruchtfink | fruchtig | Weizen, Witbier | 

| Honigdachs | süß | Helles, Radler, Fruchtbier | 

| Sauerluchs | sauer | Sauerbier, Gose, Kriek | 

| Allround-Eule | ausgewogen | alles | 

 

„Als Bild teilen“ erzeugt ein Hochformat-Bild (1080 × 1350) mit Logo, Typ, Radar und den drei besten Bieren. Am Handy öffnet sich das Teilen-Menü, am Computer wird das Bild gespeichert. Der Biertyp erscheint auch im Profil. 

 

--- 

 

## 11. Design 

 

**Konzept:** dunkle Bar-Atmosphäre, Bier im warmen Licht. 

 

| Farbe | Wert | Rolle | Kontrast auf Hintergrund | 

|---|---|---|---| 

| Coffee Bean | `#241A14` | Hintergrund | — | 

| Amber Honey | `#E9A620` | Akzente, Buttons, Prozentwerte | 8,1 : 1 | 

| Pearl Beige | `#EFDEBD` | Text | 12,9 : 1 | 

 

 

| Schrift | Rolle | 

|---|---| 

| **Bevan** | nur große Momente: Logo, Seitentitel, Biername, Prozentwerte | 

| **Oswald** | Zwischentitel, Labels, Buttons | 

| **Source Sans 3** | Fließtext | 

 

**Logo:** Hirsch in Amber und Beige. Favicon, Apple-Touch-Icon und Teilen-Vorschau sind davon abgeleitet. 

 

**Bewegung:** Intro-Video mit 3D-Text, Karussell mit sich öffnender Flasche, einschenkendes Glas, fliegende Flasche beim Seitenwechsel, Quiz-Glas, das sich füllt. Bei „Bewegung reduzieren“ im Betriebssystem ist alles statisch. 

 

**Referenzen:** mast-jaegermeister.de (Intro, Weltkarte), jackdaniels.com (Navigation), Mana Yerba Mate auf Awwwards (Karussell), stiegl.at (Detailseite). 

 

--- 

 

## 12. Qualität 

 

| Bereich | Maßnahme | 

|---|---| 

| **Tests** | 23 automatische Tests (`npm test`): Gewichte, Match, Profil, Historie, Quiz-Anteil, Abwertung, Begründungen, Biertyp, Altersprüfung (inkl. 29. Februar und Geburtstag heute/morgen), Bewertung | 

| **Daten** | `npm run validate` prüft jedes Bier auf Pflichtfelder, Wertebereiche, Sorte, Flaschenform und Brauerei | 

| **Darstellung** | alle Seiten auf 1440, 1024, 768, 390 und 320 px geprüft, automatisch auf seitliches Scrollen, abgeschnittenen Text und überstehende Inhalte | 

| **Barrierefreiheit** | Kontraste über 4,5 : 1, Tastaturbedienung (auch Karussell und Karte), sichtbarer Fokus, Beschriftungen für Screenreader, Klickflächen mindestens 32 px, reduzierte Bewegung | 

| **Leistung** | Suche etwa 0,2 ms. Video lädt nur, wenn das Intro spielt (720p 1,1 MB, Handy 480p 0,7 MB). Fällt das Video aus, läuft das Intro ohne. | 

| **Jugendschutz** | Altersabfrage ab 16 mit tagesgenauer Berechnung, unter 16 Weiterleitung. Hinweis „Genieße verantwortungsvoll“. | 

| **Datenschutz** | keine Cookies, kein Tracking, keine Datenbank. Daten bleiben im Browser, Geburtsdatum wird nicht gespeichert, Button zum Löschen aller Daten. | 

 

--- 

 

## 13. Tickets und Status 

 

| # | Ticket | Status | 

|---|---|---| 

| 0 | Repository und Grundgerüst | erledigt | 

| 1 | Bierdaten recherchieren | erledigt | 

| 2 | Favoriten mit Rang, max. 5, sortierbar | erledigt | 

| 3 | Altersabfrage ab 16 (Tag, Monat, Jahr) | erledigt | 

| 4 | Geschmacks-Quiz mit Biertyp und Teilen-Bild | erledigt | 

| 5 | Empfehlungs-Algorithmus mit Begründungen | erledigt | 

| 6 | Historie mit 1–5 Sternen | erledigt | 

| 7 | Startseite: So funktioniert's, Karussell, Für dich, Top 5 | erledigt | 

| 8 | Profil und lokale Konten | erledigt | 

| 9 | Detailseite mit Glas und Radar | erledigt | 

| 10 | Impressum, Datenschutz, Favicon, Teilen-Vorschau | erledigt, Platzhalter ausfüllen | 

| 11 | Intro mit Video und Weltkarte | erledigt | 

| 12 | Katalog mit Geschmacksreglern | erledigt | 

| 13 | Zwei Biere vergleichen | erledigt | 

| 14 | Darstellungsprüfung auf allen Bildschirmgrößen | erledigt | 

 

---
