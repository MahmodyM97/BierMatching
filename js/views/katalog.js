// Alle Biere: Raster mit Sortenfilter und Sortierung.
import { match } from "../algo.js";
import { daten } from "../store.js";
import { bierKarte, aktuellesProfil, flaschenFaecher } from "../components.js";

let filter = "Alle";
let land = "Alle";
let sortierung = "beliebt";

// Geschmacksregler: -2 … +2, 0 = egal. Jede Achse bildet ein Bier auf -1 … +1 ab.
const ACHSEN = [
  { id: "frucht-herb", links: "fruchtig", rechts: "herb", wert: (b) => (b.profil.bitter - b.profil.fruchtig) / 10 },
  { id: "leicht-kraeftig", links: "leicht", rechts: "kräftig", wert: (b) => (b.profil.koerper - 5) / 5 },
  { id: "hell-dunkel", links: "hell", rechts: "dunkel", wert: (b) => Math.max(-1, Math.min(1, Math.log(b.ebc / 20) / Math.log(5))) },
];
// Rohwerte sind ungleich verteilt (fast alle Biere sind eher herb als fruchtig). Darum zählt die
// Position im Sortiment: -1 = das fruchtigste, +1 = das herbste Bier. "sehr" ≈ äußerste 20 %.
const TOLERANZ = 0.32;
let rangCache = null;
function rang(achse, bier) {
  if (!rangCache) {
    rangCache = {};
    for (const a of ACHSEN) {
      const werte = daten.biere.map((b) => a.wert(b)).sort((x, y) => x - y);
      const n = werte.length - 1 || 1;
      rangCache[a.id] = new Map(daten.biere.map((b) => {
        const w = a.wert(b);
        const erst = werte.indexOf(w), letzt = werte.lastIndexOf(w);
        return [b.id, ((erst + letzt) / 2 / n) * 2 - 1];
      }));
    }
  }
  return rangCache[achse.id].get(bier.id);
}
const regler = Object.fromEntries(ACHSEN.map((a) => [a.id, 0]));
const reglerText = (achse, v) => (v === 0 ? "egal" : `${Math.abs(v) === 2 ? "sehr" : "eher"} ${v < 0 ? achse.links : achse.rechts}`);
export function passtZuReglern(bier, werte = regler) {
  return ACHSEN.every((a) => werte[a.id] === 0 || Math.abs(rang(a, bier) - werte[a.id] / 2) <= TOLERANZ);
}

export function render(el, { land: landAusLink = null } = {}) {
  if (landAusLink) { land = landAusLink; filter = "Alle"; }
  const laender = Object.entries(daten.welt.laender)
    .filter(([code]) => daten.biere.some((b) => b.herkunftsland === code))
    .sort((a, b) => a[1].localeCompare(b[1], "de"));
  const sorten = ["Alle", ...[...new Set(daten.biere.map((b) => b.sorte))].sort((a, b) => a.localeCompare(b, "de"))];
  const fuenf = [...daten.biere].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  el.innerHTML = `
  <header class="seiten-buehne">
    <div class="sb-text">
      <p class="eyebrow">Katalog</p>
      <h1>Alle Biere</h1>
      <p class="sb-lead">${daten.biere.length} Biere aus ${laender.length} Ländern. Filtere nach Geschmack, Sorte oder Land und sortiere nach dem, was zu dir passt.</p>
    </div>
    ${flaschenFaecher(fuenf)}
  </header>
  <section class="seite">
    <fieldset class="regler">
      <legend>Nach Geschmack filtern</legend>
      ${ACHSEN.map((a) => `<label class="regler-zeile">
        <span class="regler-pol">${a.links}</span>
        <input type="range" min="-2" max="2" step="1" value="${regler[a.id]}" data-achse="${a.id}" aria-label="${a.links} bis ${a.rechts}" aria-valuetext="${reglerText(a, regler[a.id])}">
        <span class="regler-pol">${a.rechts}</span>
        <output id="out-${a.id}">${reglerText(a, regler[a.id])}</output>
      </label>`).join("")}
      <button type="button" class="text-btn" id="regler-reset">Regler zurücksetzen</button>
    </fieldset>
    <div class="werkzeug">
      <div class="chip-reihe" role="group" aria-label="Nach Sorte filtern">
        ${sorten.map((s) => `<button class="chip-btn" data-sorte="${s}" aria-pressed="${s === filter}">${s}</button>`).join("")}
      </div>
      <label class="sortierung">Land
        <select id="kat-land"><option value="Alle">Alle Länder</option>${laender.map(([c, n]) => `<option value="${c}" ${c === land ? "selected" : ""}>${n}</option>`).join("")}</select>
      </label>
      <label class="sortierung">Sortieren
        <select id="sortierung">
          <option value="beliebt">Beliebtheit</option>
          <option value="passend">Passend für dich</option>
          <option value="name">Name A–Z</option>
          <option value="abv-auf">Alkohol aufsteigend</option>
          <option value="abv-ab">Alkohol absteigend</option>
        </select>
      </label>
    </div>
    <p class="meta" id="kat-anzahl"></p>
    <div class="raster" id="kat-raster"></div>
  </section>`;

  el.querySelector("#kat-land").addEventListener("change", (e) => { land = e.target.value; zeichne(); });
  el.querySelector("#sortierung").value = sortierung;
  el.querySelectorAll("[data-achse]").forEach((inp) => inp.addEventListener("input", () => {
    const achse = ACHSEN.find((a) => a.id === inp.dataset.achse);
    regler[achse.id] = Number(inp.value);
    const text = reglerText(achse, regler[achse.id]);
    el.querySelector(`#out-${achse.id}`).textContent = text;
    inp.setAttribute("aria-valuetext", text);
    zeichne();
  }));
  el.querySelector("#regler-reset").addEventListener("click", () => {
    for (const a of ACHSEN) regler[a.id] = 0;
    el.querySelectorAll("[data-achse]").forEach((inp) => { inp.value = 0; inp.dispatchEvent(new Event("input")); });
  });
  el.querySelector("#sortierung").addEventListener("change", (e) => { sortierung = e.target.value; zeichne(); });
  el.querySelectorAll("[data-sorte]").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.sorte;
    el.querySelectorAll("[data-sorte]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    zeichne();
  }));
  zeichne();
  return { update: zeichne };
}

function zeichne() {
  const raster = document.getElementById("kat-raster");
  if (!raster) return;
  const { profil } = aktuellesProfil();
  let liste = daten.biere.filter((b) => (filter === "Alle" || b.sorte === filter) && (land === "Alle" || b.herkunftsland === land) && passtZuReglern(b));
  const sortierer = {
    beliebt: (a, b) => b.popularity - a.popularity,
    name: (a, b) => a.name.localeCompare(b.name, "de"),
    "abv-auf": (a, b) => a.abv - b.abv,
    "abv-ab": (a, b) => b.abv - a.abv,
    passend: profil ? (a, b) => match(profil, b.profil).score - match(profil, a.profil).score : (a, b) => b.popularity - a.popularity,
  };
  liste = [...liste].sort(sortierer[sortierung]);
  document.getElementById("kat-anzahl").textContent = `${liste.length} ${liste.length === 1 ? "Bier" : "Biere"}`;
  raster.innerHTML = liste.length
    ? liste.map((b, i) => bierKarte(b, { index: i })).join("")
    : `<div class="leer-zustand"><p>Kein Bier passt zu diesem Filter.</p><p class="meta">Stell einen Regler auf „egal“, wähle eine andere Sorte oder „Alle Länder“.</p></div>`;
}
