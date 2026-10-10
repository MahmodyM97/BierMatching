// Hero-Intro im Stil der Jägermeister-Startseite:
// 3D-Textzeilen fliegen durch den Raum, danach öffnet sich eine Punkt-Weltkarte
// mit den Brauerei-Standorten. Klick auf einen Standort zeigt die Biere des Landes.
//
// Ablauf = CSS-Klassen pro Phase (siehe css/style.css, Abschnitt "Hero-Intro").
// Intro-Video (assets/hero-720.mp4, mobil hero-480.mp4): Die Textzeilen hängen an der
// Abspielzeit des Videos (VIDEO_PHASEN), nicht an Timern. Lädt das Video zu langsam
// oder darf es nicht abspielen, läuft das Intro ohne Video.
import { daten, istFavorit } from "./store.js";
import { esc, flasche, zahl } from "./components.js";

const PHASEN = [            // [Klasse, Startzeit in ms]
  ["p-zeile1", 0],
  ["p-zeile2", 1900],
  ["p-zeile3", 3800],
  ["p-karte", 5200],
  ["p-punkte", 6400],
  ["p-ende", 8200],
];
const ENDE = PHASEN.map(([k]) => k);

// Gleiche Phasen, aber in Sekunden Videozeit. Abgestimmt auf den Schnitt:
// 0 s Flasche · 1,6 s Biere am Tisch · 3,1 s Glas in Nahaufnahme · ab 4,6 s Weltkarte im Video
const VIDEO_PHASEN = [
  ["p-zeile1", 0.15],
  ["p-zeile2", 1.6],
  ["p-zeile3", 3.1],
  ["p-karte", 4.9],     // Video blendet aus, unsere Karte blendet ein
  ["p-punkte", 5.5],
  ["p-ende", 6.2],      // nach Videoende, läuft per Timer weiter
];
const VIDEO = { gross: "assets/hero-720.mp4", klein: "assets/hero-480.mp4" };
const VIDEO_WARTEN_MS = 2500;   // so lange darf das Video zum Starten brauchen
let lauf = 0;                   // erhöht sich bei jedem Start/Abbruch, alte Schleifen beenden sich
const SESSION_KEY = "bk.intro-gesehen";

// Größen in Bildschirm-Pixeln, unabhängig vom Zoom
const PUNKT_PX = 6;         // Radius des sichtbaren Punkts
const TREFFER_PX = 16;      // Radius der Klickfläche (32 px Durchmesser, gut für Finger)

let timer = [];
let aktuellesLand = null;
let aktuelleBrauerei = null;
let ansicht = null;         // aktuelle viewBox {x, y, w, h}
let zoomAnimation = null;

/* ---------- Projektion (gleich wie data/weltkarte.json) ---------- */
const px = (lng) => lng + 180;
const py = (lat) => 75 - lat;

// Am Handy ist die Karte höher (Seitenverhältnis 1,15 statt 2,7, siehe CSS) und startet in Europa,
// sonst wäre Europa nur ein Punkthaufen.
const MOBIL = "(max-width: 760px)";
const MOBIL_VERH = 1.15;
const istMobil = () => matchMedia(MOBIL).matches;
function seitenVerh() {
  const k = daten.weltkarte;
  return istMobil() ? MOBIL_VERH : k.breite / k.hoehe;
}
function ansichten() {
  const k = daten.weltkarte;
  const verh = seitenVerh();
  const um = (lng, lat, w) => ({ x: px(lng) - w / 2, y: py(lat) - w / verh / 2, w, h: w / verh });
  const weltH = k.breite / verh;
  return {
    welt: { x: 0, y: (k.hoehe - weltH) / 2, w: k.breite, h: weltH },
    europa: istMobil() ? um(13, 50, 46) : um(14, 50, 64),
  };
}
const startAnsicht = () => (istMobil() ? ansichten().europa : ansichten().welt);

/* ---------- Markup ---------- */
export function heroMarkup() {
  const karte = daten.weltkarte;
  const welt = daten.welt.brauereien;
  const laenderAnzahl = new Set(daten.biere.map((b) => b.herkunftsland)).size;
  // Reihenfolge des Aufpoppens: von Europa nach außen
  const sortiert = [...welt].sort((a, b) => Math.hypot(a.lng - 10, a.lat - 50) - Math.hypot(b.lng - 10, b.lat - 50));
  const punkte = sortiert.map((b, i) => `
    <g class="standort" data-id="${b.id}" data-land="${b.land}" style="--i:${i}" tabindex="0" role="button"
       aria-label="${esc(b.name)}, ${esc(b.stadt)}, ${esc(b.land_name)}. Biere aus ${esc(b.land_name)} anzeigen">
      <circle class="puls" cx="${px(b.lng)}" cy="${py(b.lat)}" r="2"/>
      <circle class="punkt" cx="${px(b.lng)}" cy="${py(b.lat)}" r="1.5"/>
      <circle class="treffer" cx="${px(b.lng)}" cy="${py(b.lat)}" r="4"/>
    </g>`).join("");

  return `
  <section class="hero" aria-labelledby="hero-h">
    <video class="hero-video" muted playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1"></video>
    <canvas class="hero-blasen" aria-hidden="true"></canvas>

    <div class="intro" aria-hidden="true">
      <p class="intro-zeile z1"><span>Ein Glas.</span></p>
      <p class="intro-zeile z2"><span>${laenderAnzahl} Länder.</span></p>
      <p class="intro-zeile z3"><span>Eine Welt</span><span class="akzent">voll Bier.</span></p>
    </div>

    <div class="hero-buehne">
      <div class="hero-inhalt">
        <div class="hero-titel">
          <p class="eyebrow">${daten.biere.length} Biere · ${welt.length} Brauereien · ${laenderAnzahl} Länder</p>
          <h2 id="hero-h">Finde dein nächstes Lieblingsbier.</h2>
        </div>
        <div class="hero-neben">
          <p class="hero-text">Wähle bis zu fünf Biere, die du liebst. Wir zeigen dir, was als Nächstes passt, und sagen dir auch, warum.</p>
          <div class="hero-cta">
            <a class="btn primaer" href="#/quiz">Geschmacks-Quiz starten</a>
            <a class="btn sekundaer" href="#/biere">Alle Biere ansehen</a>
          </div>
        </div>
      </div>

      <div class="karten-bereich" id="weltkarte">
        <div class="karten-kopf">
          <p class="karten-hinweis"><span class="hinweis-punkt"></span>Tippe auf einen Standort, um seine Biere zu sehen.</p>
          <div class="zoom-wahl" role="group" aria-label="Kartenausschnitt">
            <button class="zoom-btn" data-zoom="welt" aria-pressed="true">Welt</button>
            <button class="zoom-btn" data-zoom="europa" aria-pressed="false">Europa</button>
          </div>
        </div>
        <div class="weltkarte">
          <svg viewBox="0 0 ${karte.breite} ${karte.hoehe}" role="group" aria-label="Weltkarte der Brauereien">
            <path class="land grob" d="${karte.grob.rest}"/>
            <path class="land grob grob-eu" d="${karte.grob.europa}"/>
            <path class="land fein" d="${karte.fein.europa}"/>
            <path class="grenzen" d="${karte.grenzen_europa}"/>
            <g class="standorte">${punkte}</g>
          </svg>
          <aside class="land-panel" id="land-panel" aria-live="polite" hidden></aside>
        </div>
      </div>
    </div>

    <div class="hero-steuerung">
      <button class="text-btn" id="intro-skip">Intro überspringen</button>
      <button class="text-btn" id="intro-neu" hidden>↻ Intro abspielen</button>
    </div>
  </section>`;
}

/* ---------- Ablauf ---------- */
export function starteHero(hero, { zurKarte = false, brauerei = null } = {}) {
  if (!hero) return;
  timer.forEach(clearTimeout);
  timer = [];
  aktuellesLand = null;
  ansicht = { ...startAnsicht() };
  warMobil = istMobil();
  starteBlasen(hero.querySelector(".hero-blasen"));
  verbindeKarte(hero);
  skaliere(hero);
  zoomeAuf(hero, startAnsicht(), false);

  hero.querySelector("#intro-skip").onclick = () => zeigeEnde(hero);
  hero.querySelector("#intro-neu").onclick = () => spieleIntro(hero);

  let gesehen = false;
  try { gesehen = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* privat */ }
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (gesehen || ruhig || zurKarte) zeigeEnde(hero);
  else spieleIntro(hero);
  if (zurKarte) requestAnimationFrame(() => {
    hero.querySelector("#weltkarte").scrollIntoView({ block: "start" });
    if (brauerei) zeigeBrauerei(hero, brauerei);
  });
}

function spieleIntro(hero) {
  timer.forEach(clearTimeout);
  timer = [];
  lauf++;
  hero.classList.remove("sofort", "mit-video", ...ENDE);
  hero.querySelector("#intro-skip").hidden = false;
  hero.querySelector("#intro-neu").hidden = true;
  schliessePanel(hero);
  zoomeAuf(hero, startAnsicht(), false);
  void hero.offsetWidth; // Animationen neu starten

  const video = hero.querySelector("video.hero-video");
  if (video && videoErlaubt()) spieleMitVideo(hero, video);
  else phasenAb(hero, PHASEN, 0);
}

function videoErlaubt() {
  try { if (navigator.connection?.saveData) return false; } catch { /* egal */ }
  return true;
}

// Video starten und die Phasen an seine Abspielzeit koppeln.
// Stockt das Video, warten auch die Texte: Bild und Schrift bleiben synchron.
function spieleMitVideo(hero, video) {
  const meinLauf = ++lauf;
  const aktiv = () => meinLauf === lauf;
  if (!video.src) {
    video.poster = "assets/hero-poster.jpg";
    video.src = matchMedia("(max-width: 760px)").matches ? VIDEO.klein : VIDEO.gross;
    video.preload = "auto";
  }
  hero.classList.add("mit-video");
  try { video.currentTime = 0; } catch { /* noch keine Metadaten */ }

  let i = 0;
  const feuere = (klasse) => {
    hero.classList.add(klasse);
    if (klasse === "p-ende") abschliessen(hero);
  };
  const schleife = () => {
    if (!aktiv()) return;
    const t = video.currentTime;
    while (i < VIDEO_PHASEN.length && VIDEO_PHASEN[i][1] <= t) feuere(VIDEO_PHASEN[i++][0]);
    if (i < VIDEO_PHASEN.length && !video.ended) requestAnimationFrame(schleife);
  };

  // Kein Start innerhalb von VIDEO_WARTEN_MS (langsames Netz, Stromsparmodus): Intro ohne Video
  const notfall = setTimeout(() => { if (aktiv() && video.currentTime === 0) ohneVideo(hero, video); }, VIDEO_WARTEN_MS);
  timer.push(notfall);

  video.onended = () => {
    if (!aktiv()) return;
    const ende = video.duration || 0;
    phasenAb(hero, VIDEO_PHASEN.slice(i).map(([k, t]) => [k, Math.max(0, (t - ende) * 1000)]), 0);
    i = VIDEO_PHASEN.length;
  };
  // Hängt das Video mitten im Abspielen länger als 3 s: direkt zur Karte
  let haenger = null;
  video.onwaiting = () => { haenger = setTimeout(() => aktiv() && zeigeEnde(hero), 3000); timer.push(haenger); };
  video.onplaying = () => clearTimeout(haenger);
  video.onerror = () => aktiv() && ohneVideo(hero, video);

  video.play().then(() => { if (aktiv()) requestAnimationFrame(schleife); })
    .catch(() => aktiv() && ohneVideo(hero, video));
}

function ohneVideo(hero, video) {
  lauf++;
  video.pause();
  hero.classList.remove("mit-video", ...ENDE);
  timer.forEach(clearTimeout);
  timer = [];
  void hero.offsetWidth;
  phasenAb(hero, PHASEN, 0);
}

function phasenAb(hero, phasen, versatz) {
  for (const [klasse, t] of phasen) {
    timer.push(setTimeout(() => {
      hero.classList.add(klasse);
      if (klasse === "p-ende") abschliessen(hero);
    }, t - versatz));
  }
}

function zeigeEnde(hero) {
  lauf++;
  timer.forEach(clearTimeout);
  timer = [];
  const video = hero.querySelector("video.hero-video");
  if (video && !video.paused) video.pause();
  hero.classList.add("sofort", ...ENDE);
  abschliessen(hero);
}

function abschliessen(hero) {
  hero.querySelector("#intro-skip").hidden = true;
  hero.querySelector("#intro-neu").hidden = false;
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* privat */ }
}

/* ---------- Größen an Zoom und Bildschirmbreite anpassen ---------- */
function pxProEinheit(hero) {
  const svg = hero.querySelector(".weltkarte svg");
  return svg.getBoundingClientRect().width / ansicht.w;
}

function skaliere(hero) {
  const svg = hero.querySelector(".weltkarte svg");
  if (!svg || !ansicht) return;
  svg.setAttribute("viewBox", `${ansicht.x} ${ansicht.y} ${ansicht.w} ${ansicht.h}`);
  const s = pxProEinheit(hero);
  if (!s) return;
  // Ab einem Punktabstand von ca. 10 px wird in Europa das feine Raster (0,4°) gezeigt,
  // damit Länder beim Hineinzoomen erkennbar bleiben.
  const k = daten.weltkarte;
  const fein = k.grob.schritt * s > 10;
  svg.classList.toggle("fein-an", fein);
  const grobPx = Math.min(5, Math.max(1.4, k.grob.schritt * s * 0.5));
  const feinPx = Math.min(4, Math.max(1.1, k.fein.schritt * s * 0.6));
  svg.querySelectorAll(".land.grob").forEach((p) => p.setAttribute("stroke-width", (grobPx / s).toFixed(3)));
  svg.querySelector(".land.fein").setAttribute("stroke-width", (feinPx / s).toFixed(3));
  svg.querySelectorAll(".standort").forEach((g) => {
    g.querySelector(".punkt").setAttribute("r", (PUNKT_PX / s).toFixed(3));
    g.querySelector(".puls").setAttribute("r", (PUNKT_PX / s).toFixed(3));
    g.querySelector(".treffer").setAttribute("r", (TREFFER_PX / s).toFixed(3));
  });
}

function zoomeAuf(hero, ziel, animiert = true) {
  cancelAnimationFrame(zoomAnimation);
  const start = { ...ansicht };
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dauer = animiert && !ruhig ? 650 : 0;
  const t0 = performance.now();
  const schritt = (jetzt) => {
    const t = dauer ? Math.min(1, (jetzt - t0) / dauer) : 1;
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // ease-in-out
    ansicht = {
      x: start.x + (ziel.x - start.x) * e, y: start.y + (ziel.y - start.y) * e,
      w: start.w + (ziel.w - start.w) * e, h: start.h + (ziel.h - start.h) * e,
    };
    skaliere(hero);
    if (t < 1) zoomAnimation = requestAnimationFrame(schritt);
  };
  zoomAnimation = requestAnimationFrame(schritt);
  const welt = ansichten().welt;
  const istWelt = Math.abs(ziel.w - welt.w) < 1;
  const istEuropa = Math.abs(ziel.w - ansichten().europa.w) < 1 && Math.abs(ziel.x - ansichten().europa.x) < 1;
  hero.querySelectorAll("[data-zoom]").forEach((b) => b.setAttribute("aria-pressed",
    String((b.dataset.zoom === "welt" && istWelt) || (b.dataset.zoom === "europa" && istEuropa))));
}

/* ---------- Karte: Klick, Tippen, Tastatur ---------- */
function verbindeKarte(hero) {
  const svg = hero.querySelector(".weltkarte svg");

  // Klick: alle Standorte in Fingerreichweite suchen. Liegen mehrere Länder
  // übereinander, wird hineingezoomt statt geraten.
  svg.addEventListener("click", (e) => {
    if (!hero.classList.contains("p-ende")) zeigeEnde(hero);
    const s = pxProEinheit(hero);
    const r = svg.getBoundingClientRect();
    const mx = ansicht.x + (e.clientX - r.left) / s;
    const my = ansicht.y + (e.clientY - r.top) / s;
    const nah = daten.welt.brauereien
      .map((b) => ({ b, d: Math.hypot(px(b.lng) - mx, py(b.lat) - my) * s }))
      .filter((x) => x.d <= TREFFER_PX)
      .sort((a, b) => a.d - b.d);
    if (!nah.length) return;
    const laender = new Set(nah.map((x) => x.b.land));
    if (laender.size === 1 || ansicht.w <= 8) {
      zeigeLand(hero, nah[0].b.land, nah[0].b.id);
      return;
    }
    // So weit hineinzoomen, dass sich die Klickflächen der Länder im Umkreis nicht mehr überlappen
    const umkreis = daten.welt.brauereien.filter((b) => Math.hypot(px(b.lng) - mx, py(b.lat) - my) * s <= TREFFER_PX * 4);
    let minAbstand = Infinity;
    for (const a of umkreis) for (const b of umkreis) {
      if (a.land !== b.land) minAbstand = Math.min(minAbstand, Math.hypot(px(a.lng) - px(b.lng), py(a.lat) - py(b.lat)));
    }
    const breitePx = svg.getBoundingClientRect().width;
    const zielS = (TREFFER_PX * 2 + 6) / minAbstand;          // Pixel pro Karteneinheit, damit nichts überlappt
    const w = Math.min(ansicht.w / 2, Math.max(8, breitePx / zielS));
    const h = w * (ansicht.h / ansicht.w);
    zoomeAuf(hero, { x: mx - w / 2, y: my - h / 2, w, h });
  });

  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest?.(".standort");
    if (g && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      zeigeEnde(hero);
      zeigeLand(hero, g.dataset.land, Number(g.dataset.id));
    }
  });

  hero.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    if (!hero.classList.contains("p-ende")) zeigeEnde(hero);
    zoomeAuf(hero, ansichten()[b.dataset.zoom]);
  }));


  hero.addEventListener("keydown", (e) => { if (e.key === "Escape") schliessePanel(hero); });
}
let warMobil = null;
addEventListener("resize", () => {
  const h = document.querySelector(".hero");
  if (!h) return;
  // Wechsel Handy ↔ Desktop: Seitenverhältnis ändert sich, also Startansicht neu setzen
  if (warMobil !== null && warMobil !== istMobil()) zoomeAuf(h, startAnsicht(), false);
  warMobil = istMobil();
  skaliere(h);
}, { passive: true });

/** Von der Detailseite: zur Brauerei zoomen, sie hervorheben und die Biere des Landes zeigen. */
function zeigeBrauerei(hero, id) {
  const b = daten.weltById.get(id);
  if (!b) return;
  const k = daten.weltkarte;
  const w = istMobil() ? 24 : 36, h = w / seitenVerh();
  const x = Math.min(k.breite - w, Math.max(0, px(b.lng) - w / 2));
  const y = Math.min(Math.max(k.hoehe - h, 0), Math.max(Math.min(0, k.hoehe - h), py(b.lat) - h / 2));
  zoomeAuf(hero, { x, y, w, h });
  zeigeLand(hero, b.land, b.id);
  hero.querySelectorAll(".standort").forEach((g) => g.classList.toggle("fokus", Number(g.dataset.id) === id));
}

export function zeigeLand(hero, land, brauereiId = null) {
  aktuellesLand = land;
  aktuelleBrauerei = brauereiId;
  const name = daten.welt.laender[land] ?? land;
  const brauereien = daten.welt.brauereien.filter((b) => b.land === land);
  const biere = daten.biere.filter((b) => b.herkunftsland === land)
    .sort((a, b) => (b.brauerei_id === brauereiId) - (a.brauerei_id === brauereiId) || b.popularity - a.popularity);

  hero.querySelectorAll(".standort").forEach((g) => { g.classList.toggle("aktiv", g.dataset.land === land); g.classList.remove("fokus"); });
  const panel = hero.querySelector("#land-panel");
  panel.innerHTML = `
    <div class="panel-kopf">
      <div>
        <p class="eyebrow">${brauereien.length} ${brauereien.length === 1 ? "Brauerei" : "Brauereien"}</p>
        <h2>${esc(name)}</h2>
        <p class="meta">${brauereien.map((b) => `${esc(b.name)} (${esc(b.stadt)})`).join(" · ")}</p>
      </div>
      <button class="icon-btn" id="panel-zu" aria-label="Schließen">✕</button>
    </div>
    <ul class="panel-biere">
      ${biere.map((b) => `<li>
        <a href="#/bier/${b.id}" class="panel-bier">
          <span class="fav-mini">${flasche(b, "mini")}</span>
          <span><strong>${esc(b.name)}</strong><small>${esc(b.sorte)} · ${zahl(b.abv)} % vol.</small></span>
        </a>
        <button class="icon-btn${istFavorit(b.id) ? " an" : ""}" data-fav="${b.id}" aria-pressed="${istFavorit(b.id)}" aria-label="${esc(b.name)} ${istFavorit(b.id) ? "aus Favoriten entfernen" : "zu Favoriten"}">${istFavorit(b.id) ? "★" : "☆"}</button>
      </li>`).join("")}
    </ul>
    <a class="btn sekundaer klein" href="#/biere/land/${land}">Alle ${biere.length} Biere aus ${esc(name)}</a>`;
  panel.hidden = false;
  hero.classList.add("panel-offen");
  panel.querySelector("#panel-zu").onclick = () => schliessePanel(hero);
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function schliessePanel(hero) {
  aktuellesLand = null;
  const panel = hero.querySelector("#land-panel");
  if (panel) panel.hidden = true;
  hero.classList.remove("panel-offen");
  hero.querySelectorAll(".standort.aktiv").forEach((g) => g.classList.remove("aktiv"));
}

/** Nach Favoriten-Änderungen die Sterne im offenen Panel aktualisieren. */
export function aktualisiereHero() {
  const hero = document.querySelector(".hero");
  if (hero && aktuellesLand) zeigeLand(hero, aktuellesLand, aktuelleBrauerei);
}

/* ---------- Kohlensäure-Bläschen ---------- */
let laufend = null;
let beiResize = null;
addEventListener("resize", () => beiResize?.(), { passive: true });

function starteBlasen(canvas) {
  if (laufend) cancelAnimationFrame(laufend);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let blasen = [];

  function groesse() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    blasen = Array.from({ length: Math.round(r.width / 14) }, () => neu(r, true));
  }
  function neu(r, irgendwo) {
    return { x: Math.random() * r.width, y: irgendwo ? Math.random() * r.height : r.height + 10,
      r: 1 + Math.random() * 3.2, v: 0.25 + Math.random() * 0.8, wackel: Math.random() * Math.PI * 2 };
  }
  function zeichne() {
    if (!canvas.isConnected) return;
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    for (const b of blasen) {
      if (!ruhig) {
        b.y -= b.v;
        b.wackel += 0.03;
        if (b.y < -10) Object.assign(b, neu(r, false));
      }
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(b.wackel) * 2, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239,222,189,0.35)";
      ctx.fillStyle = "rgba(233,166,32,0.10)";
      ctx.fill();
      ctx.stroke();
    }
    if (!ruhig) laufend = requestAnimationFrame(zeichne);
  }
  groesse();
  beiResize = () => { groesse(); if (ruhig) zeichne(); };
  zeichne();
}
