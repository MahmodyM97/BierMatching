// Startseite: Hero mit Weltkarte, „So funktioniert's“, Endlos-Karussell,
// „Für dich“ (Platz 1 groß mit Radar, Plätze 2–5 als Karten) und das Regal „Deine Top 5“.
import { suche } from "../algo.js";
import { daten, istFavorit } from "../store.js";
import {
  esc, flasche, bierKarte, bierfarbe, radar, aktuelleEmpfehlungen, aktuellesProfil, zahl,
} from "../components.js";
import { erstelleKarussell } from "../karussell.js";
import { renderFavoriten } from "./favoriten-panel.js";
import { heroMarkup, starteHero, aktualisiereHero } from "../hero.js";

let karussell = null;
let zufall = null; // alle Biere in zufälliger Reihenfolge, einmal pro Seitenaufruf
function zufallsAuswahl() {
  if (!zufall) {
    const kopie = [...daten.biere];
    for (let i = kopie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    }
    zufall = kopie;
  }
  return zufall;
}

export function render(el, { suchbegriff = "", zurKarte = false, brauerei = null } = {}) {
  el.innerHTML = `
  ${heroMarkup()}
  ${soGehts()}

  <section class="entdecken" aria-labelledby="kar-h">
    <div class="entdecken-kopf">
      <h2 id="kar-h" class="spalten-titel"></h2>
      <p id="kar-info" class="meta" aria-live="polite"></p>
    </div>
    <div class="k3d" id="karussell"></div>
    <div class="leer-zustand k3d-leer" id="kar-leer" hidden></div>
  </section>

  <section class="fuer-dich" aria-labelledby="empf-h">
    <div class="block-kopf">
      <div><p class="eyebrow">Persönlich</p><h2 id="empf-h">Für dich</h2></div>
      <p class="meta" id="empf-info"></p>
    </div>
    <div class="fd-grid" id="empf-liste"></div>
  </section>

  <section class="regal" aria-labelledby="fav-h">
    <div class="block-kopf">
      <div><p class="eyebrow">Deine Basis</p><h2 id="fav-h">Deine Top 5</h2></div>
      <p class="meta">Ziehen oder mit den Pfeilen sortieren. Platz 1 zählt am meisten.</p>
    </div>
    <ol id="fav-liste" class="fav-liste regal-liste"></ol>
  </section>`;

  starteHero(el.querySelector(".hero"), { zurKarte, brauerei });
  karussell = erstelleKarussell(el.querySelector("#karussell"));

  setzeSuche(suchbegriff);
  update();
  return { update, setzeSuche };
}

/* ---------- So funktioniert's ---------- */
function soGehts() {
  const drei = ["Pils", "Weizen", "Stout"].map((s) => daten.biere.find((b) => b.sorte === s)).filter(Boolean);
  const hex = (r) => Array.from({ length: 6 }, (_, i) => {
    const w = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${(60 + Math.cos(w) * r).toFixed(1)},${(60 + Math.sin(w) * r).toFixed(1)}`;
  }).join(" ");
  const form = [0.9, 0.55, 0.35, 0.5, 0.25, 0.75].map((f, i) => {
    const w = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${(60 + Math.cos(w) * 46 * f).toFixed(1)},${(60 + Math.sin(w) * 46 * f).toFixed(1)}`;
  }).join(" ");
  return `<section class="so-gehts" aria-labelledby="sg-h">
    <div class="block-kopf">
      <div><p class="eyebrow">So funktioniert's</p><h2 id="sg-h">In drei Schritten zum nächsten Lieblingsbier</h2></div>
    </div>
    <ol class="sg-schritte">
      <li style="--i:0">
        <div class="sg-bild sg-flaschen" aria-hidden="true">${drei.map((b) => flasche(b, "sg-fl")).join("")}<span class="sg-stern">★</span></div>
        <h3><span class="sg-nr">1</span>Lieblingsbiere wählen</h3>
        <p>Markiere bis zu fünf Biere mit dem Stern. Platz 1 zählt am meisten.</p>
      </li>
      <li style="--i:1">
        <div class="sg-bild" aria-hidden="true">
          <svg viewBox="0 0 120 120" class="sg-radar">
            ${[46, 31, 16].map((r) => `<polygon points="${hex(r)}" class="r-ring"/>`).join("")}
            <polygon points="${form}" class="r-bier"/>
          </svg>
        </div>
        <h3><span class="sg-nr">2</span>Geschmack berechnen</h3>
        <p>Aus deinen Bieren entsteht dein Profil mit sechs Merkmalen, von herb bis fruchtig.</p>
      </li>
      <li style="--i:2">
        <div class="sg-bild sg-match" aria-hidden="true"><b>94&thinsp;%</b><span class="match-spur"><span style="width:94%"></span></span></div>
        <h3><span class="sg-nr">3</span>Neues entdecken</h3>
        <p>Du bekommst passende Biere mit Match in Prozent und einem Satz, warum sie zu dir passen.</p>
      </li>
    </ol>
    <p class="sg-fuss">Noch keine Lieblingsbiere? <a href="#/quiz">Mach das Quiz</a>, es dauert etwa eine Minute.</p>
  </section>`;
}

function setzeSuche(begriff) {
  const wurzel = document.getElementById("karussell");
  if (!wurzel || !karussell) return;
  const titel = document.getElementById("kar-h");
  const info = document.getElementById("kar-info");
  const leer = document.getElementById("kar-leer");
  const sucht = !!begriff.trim();
  let liste;
  if (sucht) {
    const t0 = performance.now();
    liste = suche(daten.biere, begriff, daten.welt.laender);
    const ms = performance.now() - t0;
    titel.textContent = `Treffer für „${begriff.trim()}“`;
    info.textContent = `${liste.length} ${liste.length === 1 ? "Bier" : "Biere"} · ${zahl(ms, 1)} ms`;
  } else {
    liste = zufallsAuswahl();
    titel.textContent = "Entdecken";
    info.textContent = `Alle ${liste.length} Biere · ziehen oder wischen`;
  }
  document.querySelector(".hero")?.classList.toggle("kompakt", sucht);
  const sg = document.querySelector(".so-gehts");
  if (sg) sg.hidden = sucht;
  wurzel.hidden = !liste.length;
  leer.hidden = !!liste.length;
  leer.innerHTML = `<p>Kein Bier passt zu „${esc(begriff)}“.</p><p class="meta">Versuch es mit einer Sorte wie „Märzen“, einem Land wie „Belgien“ oder einem Geschmack wie „fruchtig“.</p>`;
  karussell.setzeBiere(liste);
}

function update() {
  const favEl = document.getElementById("fav-liste");
  if (!favEl) return;
  renderFavoriten(favEl, { regal: true });
  aktualisiereHero();
  renderEmpfehlungen(document.getElementById("empf-liste"));
  karussell?.aktualisiere();
}

/* ---------- Für dich ---------- */
function renderEmpfehlungen(el) {
  const { kaltstart, liste } = aktuelleEmpfehlungen();
  const { profil: geschmack, quizAnteil } = aktuellesProfil();
  document.getElementById("empf-info").textContent = kaltstart
    ? "Noch keine Favoriten. Bis dahin die beliebtesten Biere."
    : quizAnteil > 0
      ? `Aus deinen Favoriten und zu ${Math.round(quizAnteil * 100)} % aus dem Quiz.`
      : "Aus deinen Favoriten und Bewertungen.";
  if (!liste.length) { el.innerHTML = ""; return; }
  const [erst, ...rest] = liste;
  el.innerHTML = topKarte(erst, geschmack, kaltstart) + `<div class="fd-rest">${rest.map((e, i) => bierKarte(e.bier, {
    index: i + 1,
    klasse: "kompakt",
    unterzeile: e.grund ?? "",
    extra: `<span class="match-badge">${e.score !== undefined ? `${e.score.toFixed(0)}&thinsp;% passt` : "Beliebt"}</span>`,
  })).join("")}</div>`;
}

function topKarte({ bier, score, grund, referenz }, geschmack, kaltstart) {
  const land = daten.weltById.get(bier.brauerei_id)?.land_name;
  const fav = istFavorit(bier.id);
  return `<article class="fd-top" data-id="${bier.id}">
    <a class="fd-buehne" href="#/bier/${bier.id}" style="--bierfarbe:${bierfarbe(bier.ebc)}" aria-label="${esc(bier.name)} ansehen">
      <span class="bk-licht" aria-hidden="true"></span>
      ${flasche(bier, "fd-fl")}
      <span class="fd-rang" aria-hidden="true">1</span>
    </a>
    <div class="fd-text">
      <p class="eyebrow">${kaltstart ? "Am beliebtesten" : "Dein bester Treffer"}</p>
      ${score !== undefined ? `<p class="fd-match"><b>${score.toFixed(0)}&thinsp;%</b><span>passt zu dir</span></p>` : ""}
      <h3><a href="#/bier/${bier.id}">${esc(bier.name)}</a></h3>
      <p class="bk-marke">${esc(bier.brauerei)}${land ? ` · ${esc(land)}` : ""}</p>
      <p class="bk-meta">${esc(bier.sorte)} · ${zahl(bier.abv)} % vol. · ${bier.volumen_ml} ml</p>
      <p class="fd-grund">${kaltstart ? "Markiere Biere, die du magst, oder mach das Quiz. Dann steht hier dein persönlicher Treffer." : esc(grund)}</p>
      ${geschmack ? `<figure class="fd-radar">
        ${radar(bier.profil, geschmack, 230)}
        <figcaption><span class="lg-eintrag"><span class="lg lg-bier"></span>${esc(bier.name)}</span><span class="lg-eintrag"><span class="lg lg-du"></span>Dein Geschmack</span></figcaption>
      </figure>` : ""}
      <div class="fd-aktionen">
        ${kaltstart ? `<a class="btn primaer klein" href="#/quiz">Quiz starten</a>` : `<a class="btn primaer klein" href="#/bier/${bier.id}">Details</a>`}
        <button class="btn sekundaer klein" data-fav="${bier.id}" aria-pressed="${fav}">${fav ? "★ Favorit" : "☆ Zu Favoriten"}</button>
      </div>
      ${referenz ? `<a class="pfeil-link" href="#/vergleich/${bier.id}/${referenz.id}">Mit deinem ${esc(referenz.name)} vergleichen →</a>` : ""}
    </div>
  </article>`;
}
