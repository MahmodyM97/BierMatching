// Einstieg: Daten laden, Alterscheck, Navbar, Router.
import { UNDERAGE_REDIRECT, AGE_LIMIT } from "./config.js";
import { pruefeGeburtsdatum } from "./rules.js";
import {
  ladeDaten, beiAenderung, alterBestaetigt, bestaetigeAlter, istFavorit,
  favoritHinzufuegen, favoritEntfernen, bewerten, aktuellerName, istGast, abmelden,
} from "./store.js";
import { toast, leerSeite } from "./components.js";
import * as home from "./views/home.js";
import * as katalog from "./views/katalog.js";
import * as detail from "./views/detail.js";
import * as quiz from "./views/quiz.js";
import * as profilSeite from "./views/profil.js";
import * as login from "./views/login.js";
import * as rechtliches from "./views/rechtliches.js";
import * as vergleich from "./views/vergleich.js";

const app = document.getElementById("app");
let aktiv = null;        // { update?, setzeSuche? } der aktuellen Seite
let suchbegriff = "";

/* ---------- Router ---------- */
const ROUTEN = [
  [/^#?\/?$/, () => home.render(app, { suchbegriff })],
  [/^#\/biere(?:\/land\/([A-Z]{2}))?$/, (m) => katalog.render(app, { land: m[1] || null })],
  [/^#\/bier\/(\d+)$/, (m) => detail.render(app, { id: Number(m[1]) })],
  [/^#\/quiz$/, () => quiz.render(app)],
  [/^#\/weltkarte(?:\/(\d+))?$/, (m) => home.render(app, { suchbegriff: "", zurKarte: true, brauerei: m[1] ? Number(m[1]) : null })],
  [/^#\/profil$/, () => profilSeite.render(app)],
  [/^#\/login$/, () => login.render(app)],
  [/^#\/vergleich(?:\/(\d+)(?:\/(\d+))?)?$/, (m) => vergleich.render(app, { a: m[1] ? Number(m[1]) : null, b: m[2] ? Number(m[2]) : null })],
  [/^#\/impressum$/, () => rechtliches.impressum(app)],
  [/^#\/datenschutz$/, () => rechtliches.datenschutz(app)],
];

function route() {
  const hash = location.hash || "#/";
  aktiv = null;
  for (const [muster, view] of ROUTEN) {
    const m = hash.match(muster);
    if (m) {
      aktiv = view(m) || {};
      break;
    }
  }
  if (!aktiv) app.innerHTML = leerSeite({ text: "Diese Adresse gibt es nicht (mehr). Über die Startseite oder den Katalog findest du weiter." });
  markiereNavigation(hash);
  schliesseMenues();
  if (!/^#?\/?$/.test(hash)) window.scrollTo({ top: 0 });
  app.focus({ preventScroll: true });
}

/* ---------- Seitenwechsel mit View Transition ----------
   Die angeklickte Flasche bekommt den Namen "bier-flasche", die große Flasche
   auf der Detailseite ebenso. Der Browser animiert dann die eine in die andere. */
function mitUebergang() {
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || ruhig) { route(); return; }
  document.startViewTransition(() => route());
}

export function markiereFlasche(flascheEl) {
  document.querySelectorAll(".flasche").forEach((f) => { f.style.viewTransitionName = ""; });
  if (flascheEl) flascheEl.style.viewTransitionName = "bier-flasche";
}

document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#/bier/"]');
  if (!link) return;
  const quelle = link.closest(".k3d-info")
    ? document.querySelector(".k3d-item.mitte .flasche")
    : link.querySelector(".flasche") ?? link.closest("article, li")?.querySelector(".flasche");
  markiereFlasche(quelle);
}, true);

function neuZeichnen() {
  if (aktiv?.update) aktiv.update();
  else route();
  aktualisiereKonto();
}

/* ---------- Globale Klicks: Favorit, Sterne ---------- */
document.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    e.preventDefault();
    const id = Number(fav.dataset.fav);
    if (istFavorit(id)) { favoritEntfernen(id); toast("Aus den Favoriten entfernt."); return; }
    const r = favoritHinzufuegen(id);
    toast(r.ok ? "Zu deinen Favoriten hinzugefügt." : r.fehler, r.ok ? "ok" : "fehler");
    return;
  }
  const stern = e.target.closest("[data-stern]");
  if (stern) {
    const r = bewerten(Number(stern.dataset.bier), Number(stern.dataset.stern));
    toast(r.ok ? `Mit ${stern.dataset.stern} ${stern.dataset.stern === "1" ? "Stern" : "Sternen"} bewertet. Steht jetzt in deiner Historie.` : r.fehler, r.ok ? "ok" : "fehler");
  }
});

/* ---------- Suche (Navbar) ---------- */
let suchTimer;
document.getElementById("suche").addEventListener("input", (e) => {
  clearTimeout(suchTimer);
  suchTimer = setTimeout(() => {
    suchbegriff = e.target.value;
    if (aktiv?.setzeSuche) aktiv.setzeSuche(suchbegriff);
    else location.hash = "#/";
  }, 120);
});
document.getElementById("suchform").addEventListener("submit", (e) => {
  e.preventDefault();
  suchbegriff = document.getElementById("suche").value;
  if (aktiv?.setzeSuche) aktiv.setzeSuche(suchbegriff);
  else location.hash = "#/";
  document.getElementById("karussell")?.scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ---------- Menüs ---------- */
const dropdownBtn = document.getElementById("biere-btn");
const dropdown = document.getElementById("biere-menue");
const burgerBtn = document.getElementById("burger-btn");
const burger = document.getElementById("burger-menue");

function schalte(btn, menue, offen = menue.hidden) {
  menue.hidden = !offen;
  btn.setAttribute("aria-expanded", String(offen));
}
function schliesseMenues() { schalte(dropdownBtn, dropdown, false); schalte(burgerBtn, burger, false); }
dropdownBtn.addEventListener("click", (e) => { e.stopPropagation(); schalte(burgerBtn, burger, false); schalte(dropdownBtn, dropdown); });
burgerBtn.addEventListener("click", (e) => { e.stopPropagation(); schalte(dropdownBtn, dropdown, false); schalte(burgerBtn, burger); });
document.addEventListener("click", (e) => { if (!e.target.closest(".menue-wrap")) schliesseMenues(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") schliesseMenues(); });
document.getElementById("abmelden-btn").addEventListener("click", () => { abmelden(); toast("Abgemeldet. Du bist jetzt Gast."); });

function aktualisiereKonto() {
  document.getElementById("konto-name").textContent = istGast() ? "Gast" : aktuellerName();
  document.getElementById("login-link").hidden = !istGast();
  document.getElementById("abmelden-btn").hidden = istGast();
}

function markiereNavigation(hash) {
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const an = hash.startsWith(a.getAttribute("href"));
    if (an) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

/* ---------- Alterscheck (Tag, Monat, Jahr) ---------- */
function alterscheck() {
  if (alterBestaetigt()) return Promise.resolve();
  const dlg = document.getElementById("altersdialog");
  const form = document.getElementById("alter-form");
  const felder = ["geb-tag", "geb-monat", "geb-jahr"].map((id) => document.getElementById(id));
  const fehler = document.getElementById("alter-fehler");
  document.getElementById("alter-hinweis").textContent = `Diese Seite ist nur für Personen ab ${AGE_LIMIT} Jahren.`;
  dlg.hidden = false;
  document.body.classList.add("gesperrt");
  felder[0].focus();

  // Nach 2 Ziffern automatisch ins nächste Feld springen
  felder.forEach((f, i) => f.addEventListener("input", () => {
    f.value = f.value.replace(/\D/g, "");
    if (i < 2 && f.value.length === f.maxLength) felder[i + 1].focus();
  }));

  return new Promise((fertig) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = pruefeGeburtsdatum(felder[0].value, felder[1].value, felder[2].value, Date.now());
      if (!r.ok) { fehler.textContent = r.fehler; return; }
      if (!r.altGenug) {
        form.innerHTML = `<p class="dialog-text">Du musst mindestens ${AGE_LIMIT} Jahre alt sein. Du wirst weitergeleitet.</p>
          <p><a class="btn sekundaer" href="${UNDERAGE_REDIRECT}">Weiter</a></p>`;
        setTimeout(() => { location.href = UNDERAGE_REDIRECT; }, 2500);
        return;
      }
      bestaetigeAlter();
      dlg.hidden = true;
      document.body.classList.remove("gesperrt");
      fertig();
    });
  });
}

/* ---------- Start ---------- */
async function start() {
  try {
    await ladeDaten();
  } catch (err) {
    app.innerHTML = `<section class="seite"><h1>Daten konnten nicht geladen werden.</h1>
      <p>${err.message}</p><p class="meta">Starte die Seite über einen lokalen Server (VS Code: Rechtsklick auf index.html → „Open with Live Server“). Direkt als Datei geöffnet blockiert der Browser das Laden der JSON-Dateien.</p></section>`;
    return;
  }
  await alterscheck();
  beiAenderung(neuZeichnen);
  addEventListener("hashchange", mitUebergang);
  aktualisiereKonto();
  route();
}
start();
