// Impressum und Datenschutzerklärung.
// VORLAGE: Alle Angaben in [eckigen Klammern] vor der Veröffentlichung ausfüllen.
// Keine Rechtsberatung. Vor einer echten Veröffentlichung prüfen lassen.
import { AGE_LIMIT } from "../config.js";
import { alleDatenLoeschen } from "../store.js";

const HINWEIS = `<p class="hinweis">Vorlage für das FH-Semesterprojekt. Angaben in [eckigen Klammern] vor einer Veröffentlichung ausfüllen und rechtlich prüfen lassen.</p>`;

export function impressum(el) {
  el.innerHTML = `<section class="seite schmal rechtliches">
    <p class="eyebrow">Rechtliches</p>
    <h1>Impressum</h1>
    ${HINWEIS}

    <h2>Angaben gemäß § 5 ECG und Offenlegung gemäß § 25 MedienG</h2>
    <p><b>Medieninhaber und Herausgeber:</b><br>
      [Vorname Nachname], [Vorname Nachname] (Gruppe 4)<br>
      [Studiengang], [Name der Fachhochschule]<br>
      [Straße Hausnummer], [PLZ Ort], Österreich</p>
    <p><b>Kontakt:</b> [E-Mail-Adresse]</p>

    <h2>Grundlegende Richtung (Blattlinie)</h2>
    <p>Bierkompass ist ein nicht-kommerzielles Studienprojekt. Die Website informiert über Biere und Brauereien und gibt persönliche Empfehlungen auf Basis eines Geschmacksprofils. Es werden keine Produkte verkauft und keine bezahlten Inhalte veröffentlicht.</p>

    <h2>Jugendschutz und verantwortungsvoller Genuss</h2>
    <p>Die Inhalte richten sich an Personen ab ${AGE_LIMIT} Jahren. Bitte genieße Alkohol verantwortungsvoll und niemals im Straßenverkehr.</p>

    <h2>Haftung für Inhalte und Links</h2>
    <p>Die Inhalte wurden mit Sorgfalt erstellt. Angaben zu Bieren (Alkoholgehalt, Bittere, Geschmacksprofil) sind teilweise Beispieldaten und ohne Gewähr. Für Inhalte externer Websites, auf die verlinkt wird, sind ausschließlich deren Betreiber verantwortlich.</p>

    <h2>Bild- und Datennachweise</h2>
    <ul class="liste">
      <li>Flaschen, Gläser und Animationen: eigene Grafiken (SVG)</li>
      <li>Logo (Fuchs mit Kompass) und Intro-Video: vom Projektteam mit KI-Bild- bzw. Videowerkzeugen erstellt</li>
      <li>Weltkarte: Natural Earth (Public Domain)</li>
      <li>Schriften: Bevan, Oswald, Source Sans 3 über Google Fonts (SIL Open Font License)</li>
      <li>Biernamen und Marken gehören ihren jeweiligen Inhabern und werden nur zur Beschreibung verwendet.</li>
    </ul>
  </section>`;
  return {};
}

export function datenschutz(el) {
  el.innerHTML = `<section class="seite schmal rechtliches">
    <p class="eyebrow">Rechtliches</p>
    <h1>Datenschutzerklärung</h1>
    ${HINWEIS}

    <h2>1. Verantwortliche</h2>
    <p>[Vorname Nachname], [Vorname Nachname], [Straße Hausnummer], [PLZ Ort], Österreich, E-Mail: [E-Mail-Adresse]</p>

    <h2>2. Grundsatz: Deine Daten bleiben in deinem Browser</h2>
    <p>Bierkompass hat keinen eigenen Server und keine Datenbank. Alles, was du eingibst, speichert die Website ausschließlich im lokalen Speicher (localStorage, sessionStorage) deines Browsers. Wir als Betreiber können diese Daten nicht einsehen.</p>
    <p>Gespeichert werden:</p>
    <ul class="liste">
      <li>die Bestätigung der Altersabfrage (nicht dein Geburtsdatum selbst),</li>
      <li>deine Favoriten, Bewertungen (Historie) und dein Quiz-Ergebnis,</li>
      <li>bei einem Konto: der Benutzername und ein SHA-256-Hash des Passworts (nicht das Passwort im Klartext),</li>
      <li>ob du das Intro in dieser Sitzung schon gesehen hast.</li>
    </ul>
    <p>Rechtsgrundlage ist dein Interesse an der Nutzung der Funktionen (Art. 6 Abs. 1 lit. b und f DSGVO). Die Daten bleiben gespeichert, bis du sie löschst.</p>

    <h2>3. Google Fonts</h2>
    <p>Zur Darstellung der Schriften lädt die Website Schriftdateien von Google (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Dabei wird deine IP-Adresse an Google übertragen. Rechtsgrundlage ist unser berechtigtes Interesse an einer einheitlichen Darstellung (Art. 6 Abs. 1 lit. f DSGVO). Mehr dazu in der Datenschutzerklärung von Google: policies.google.com/privacy.</p>

    <h2>4. Hosting</h2>
    <p>Die Website wird bei [Hosting-Anbieter, z. B. GitHub Pages] gehostet. Der Anbieter verarbeitet beim Aufruf technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Logfiles. [Details des Anbieters ergänzen.]</p>

    <h2>5. Keine Cookies, kein Tracking</h2>
    <p>Wir setzen keine Cookies, keine Analyse- oder Werbe-Tools und keine Social-Media-Plugins ein.</p>

    <h2>6. Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wende dich dafür an die oben genannte E-Mail-Adresse. Du kannst dich außerdem bei der österreichischen Datenschutzbehörde beschweren (Barichgasse 40–42, 1030 Wien, dsb.gv.at).</p>

    <h2>7. Lokale Daten selbst löschen</h2>
    <p>Mit diesem Button löschst du alle Daten, die Bierkompass in diesem Browser gespeichert hat: Altersbestätigung, Favoriten, Bewertungen, Quiz-Ergebnis und Konten.</p>
    <div class="loeschen-box">
      <button class="btn sekundaer" id="daten-weg">Alle lokalen Daten löschen</button>
      <div id="daten-weg-bestaetigen" hidden>
        <p>Wirklich alles löschen? Das lässt sich nicht rückgängig machen.</p>
        <div class="hero-cta">
          <button class="btn primaer klein" id="daten-weg-ja">Ja, alles löschen</button>
          <button class="btn sekundaer klein" id="daten-weg-nein">Abbrechen</button>
        </div>
      </div>
    </div>
  </section>`;

  const box = el.querySelector("#daten-weg-bestaetigen");
  el.querySelector("#daten-weg").addEventListener("click", () => { box.hidden = false; });
  el.querySelector("#daten-weg-nein").addEventListener("click", () => { box.hidden = true; });
  el.querySelector("#daten-weg-ja").addEventListener("click", () => {
    alleDatenLoeschen();
    location.hash = "#/";
    location.reload();
  });
  return {};
}
