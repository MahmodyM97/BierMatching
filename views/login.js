// Anmelden / Registrieren. Nur lokal im Browser (Demo ohne Server).
import { anmelden, registrieren, istGast, aktuellerName, abmelden } from "../store.js";
import { esc, toast, flaschenFaecher } from "../components.js";
import { daten } from "../store.js";

export function render(el) {
  if (!istGast()) {
    el.innerHTML = `<section class="seite schmal">
      <p class="eyebrow">Konto</p><h1>Angemeldet als ${esc(aktuellerName())}</h1>
      <div class="hero-cta"><a class="btn primaer" href="#/profil">Zum Profil</a><button class="btn sekundaer" id="abmelden">Abmelden</button></div>
    </section>`;
    el.querySelector("#abmelden").addEventListener("click", () => { abmelden(); toast("Abgemeldet."); });
    return {};
  }
  const trio = ["Märzen", "Pale Ale", "Weizen"].map((x) => daten.biere.find((b) => b.sorte === x)).filter(Boolean);
  el.innerHTML = `<section class="login-buehne">
    <div class="login-bild">
      ${flaschenFaecher(trio)}
      <div class="sb-text">
        <p class="eyebrow">Konto</p>
        <h1>Prost, schön dass du da bist.</h1>
        <p class="sb-lead">Mit einem eigenen Profil behältst du deine Favoriten, Bewertungen und dein Quiz-Ergebnis getrennt von anderen, die dieses Gerät nutzen.</p>
        <p class="hinweis">Demo: Konten werden nur in diesem Browser gespeichert. Verwende kein echtes Passwort.</p>
      </div>
    </div>
    <div class="login-formulare">
      <form id="form-login" class="formular" novalidate>
        <h2>Anmelden</h2>
        <label for="l-name">Benutzername</label><input id="l-name" autocomplete="username" required>
        <label for="l-pw">Passwort</label><input id="l-pw" type="password" autocomplete="current-password" required>
        <p class="fehler" id="l-fehler" role="alert"></p>
        <button class="btn primaer">Anmelden</button>
      </form>
      <form id="form-reg" class="formular" novalidate>
        <h2>Neu hier? Konto anlegen</h2>
        <label for="r-name">Benutzername</label><input id="r-name" autocomplete="username" required>
        <label for="r-pw">Passwort (mind. 6 Zeichen)</label><input id="r-pw" type="password" autocomplete="new-password" required>
        <p class="fehler" id="r-fehler" role="alert"></p>
        <button class="btn sekundaer">Konto anlegen</button>
      </form>
    </div>
  </section>`;

  const senden = (formId, fn, fehlerId, nameId, pwId, text) =>
    el.querySelector(formId).addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const r = await fn(el.querySelector(nameId).value, el.querySelector(pwId).value);
        if (!r.ok) { el.querySelector(fehlerId).textContent = r.fehler; return; }
        toast(text);
        location.hash = "#/profil";
      } catch (err) {
        el.querySelector(fehlerId).textContent = err.message;
      }
    });
  senden("#form-login", anmelden, "#l-fehler", "#l-name", "#l-pw", "Angemeldet.");
  senden("#form-reg", registrieren, "#r-fehler", "#r-name", "#r-pw", "Konto angelegt.");
  return { update: () => {} };
}
