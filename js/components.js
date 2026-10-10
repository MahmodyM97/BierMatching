// Wiederverwendbare UI-Bausteine (geben HTML-Strings zurück) und Hilfsfunktionen.
import { ATTRIBUTE, ATTRIBUT_LABEL, EMPFEHLUNGEN_ANZAHL } from "./config.js";
import { baueProfil, empfehlen, beliebteste } from "./algo.js";
import { daten, profil, istFavorit, bewertung } from "./store.js";

/* ---------- Text sicher einsetzen ---------- */
export function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export const zahl = (n, stellen = 1) => Number(n).toLocaleString("de-AT", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

/* ---------- Profil + Empfehlungen für das aktuelle Konto ---------- */
export function aktuellesProfil() {
  const p = profil();
  return baueProfil({ favoriten: p.favoriten, historie: p.historie, quizProfil: p.quiz_profil }, daten.bierById);
}
export function aktuelleEmpfehlungen(anzahl = EMPFEHLUNGEN_ANZAHL) {
  const p = profil();
  const { profil: geschmack } = aktuellesProfil();
  if (!geschmack) return { kaltstart: true, liste: beliebteste(daten.biere, p.favoriten, anzahl).map((bier) => ({ bier })) };
  return { kaltstart: false, liste: empfehlen({ profil: geschmack, biere: daten.biere, favoriten: p.favoriten, historie: p.historie, anzahl }) };
}

/* ---------- Bierfarbe aus EBC (über SRM-Skala) ---------- */
const SRM = [[2, "#F3E44A"], [3, "#EED534"], [4, "#E6C125"], [6, "#D59B2B"], [8, "#C98431"], [10, "#BC6733"],
  [13, "#954C2A"], [17, "#6B3A1E"], [20, "#5A2E14"], [24, "#4A2318"], [30, "#341A14"], [40, "#1E110D"]];
export function bierfarbe(ebc) {
  const srm = ebc * 0.508;
  if (srm <= SRM[0][0]) return SRM[0][1];
  for (let i = 1; i < SRM.length; i++) if (srm <= SRM[i][0]) return SRM[i][1];
  return SRM[SRM.length - 1][1];
}

/* ---------- Flasche oder Dose als SVG (eigene Grafik, keine fremden Bilder) ----------
   form (aus biere.json): longneck | euro | weizen | bauchig | dose
   etikett_farbe: Markenfarbe für Kronkorken, Halsfolie, Etikettrand bzw. die ganze Dose */
let svgZaehler = 0;
const FORMEN = {
  longneck: { pfad: "M41 16 L59 16 L59 62 C59 84 78 92 78 116 L78 240 Q78 252 66 252 L34 252 Q22 252 22 240 L22 116 C22 92 41 84 41 62 Z",
    etikett: { x: 24, y: 138, w: 52, h: 66 }, folie: { x: 41, y: 56, w: 18, h: 12 }, hals: 16 },
  euro: { pfad: "M40 16 L60 16 L60 46 C60 70 82 80 82 112 L82 242 Q82 254 70 254 L30 254 Q18 254 18 242 L18 112 C18 80 40 70 40 46 Z",
    etikett: { x: 21, y: 138, w: 58, h: 72 }, folie: { x: 40, y: 18, w: 20, h: 30 }, hals: 16 },
  weizen: { pfad: "M41 16 L59 16 L59 52 C59 92 74 100 74 132 L74 244 Q74 254 64 254 L36 254 Q26 254 26 244 L26 132 C26 100 41 92 41 52 Z",
    etikett: { x: 28, y: 150, w: 44, h: 72 }, folie: { x: 41, y: 18, w: 18, h: 42 }, hals: 16 },
  bauchig: { pfad: "M41 16 L59 16 L59 60 C59 78 80 92 80 134 C80 172 80 222 78 240 Q77 254 64 254 L36 254 Q23 254 22 240 C20 222 20 172 20 134 C20 92 41 78 41 60 Z",
    etikett: { x: 23, y: 142, w: 54, h: 66 }, folie: { x: 41, y: 18, w: 18, h: 34 }, hals: 16 },
  dose: { pfad: "M26 38 Q26 30 34 28 L66 28 Q74 30 74 38 L74 242 Q74 252 66 252 L34 252 Q26 252 26 242 Z",
    etikett: { x: 29, y: 112, w: 42, h: 82 }, hals: 28, dose: true },
};

export function flasche(bier, klasse = "", { oeffnbar = false } = {}) {
  const id = `fl${++svgZaehler}`;
  const form = FORMEN[bier.form] ?? FORMEN.longneck;
  const marke = bier.etikett_farbe || "var(--amber)";
  const farbe = form.dose ? marke : bierfarbe(bier.ebc);
  const e = form.etikett;
  const viewBox = oeffnbar ? "0 -90 100 350" : "0 0 100 260";
  const h = form.hals;

  // Verschluss: Kronkorken (Flasche) oder Lasche (Dose)
  const verschluss = form.dose
    ? `<ellipse cx="50" cy="31" rx="23" ry="4" fill="#cfc7bb"/><ellipse cx="50" cy="31" rx="19" ry="2.8" fill="#a99f92"/>
       <g class="fl-lasche"><rect x="47" y="27.5" width="16" height="5" rx="2.5" fill="#e6dfd3" stroke="#8d8478" stroke-width=".6"/></g>`
    : oeffnbar
      ? `<g class="fl-kork"><path d="M36 18 L36 6 Q36 3 39 3 L61 3 Q64 3 64 6 L64 18 L61.5 15.5 L59 18 L56.5 15.5 L54 18 L51.5 15.5 L49 18 L46.5 15.5 L44 18 L41.5 15.5 L39 18 Z" fill="${marke}"/><rect x="39" y="6" width="22" height="2" rx="1" fill="#fff" opacity=".35"/></g>`
      : `<rect x="37" y="4" width="26" height="14" rx="3" fill="${marke}"/>`;
  const schaum = oeffnbar
    ? `<ellipse class="fl-oeffnung" cx="${form.dose ? 44 : 50}" cy="${h}" rx="${form.dose ? 5 : 8}" ry="2.2" fill="#1a120d"/>
       <g class="fl-schaum">${[[47, 0, 2.6], [53, 0.25, 2], [50, 0.5, 3], [45, 0.8, 1.8], [55, 1.05, 2.4], [49, 1.3, 1.6], [52, 1.6, 2.2]]
         .map(([cx, d, r]) => `<circle cx="${cx - (form.dose ? 6 : 0)}" cy="${h - 4}" r="${r}" style="--d:${d}s"/>`).join("")}</g>
       <path class="fl-dampf" d="M${form.dose ? 40 : 44} ${h - 4} C40 -6 58 -10 52 -30 C48 -42 58 -50 54 -64" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`
    : "";
  const folie = form.folie ? `<rect x="${form.folie.x}" y="${form.folie.y}" width="${form.folie.w}" height="${form.folie.h}" fill="${marke}"/>` : "";
  const glanz = form.dose
    ? `<rect x="32" y="40" width="5" height="200" rx="2.5" fill="#fff" opacity=".28"/><rect x="66" y="40" width="3" height="200" rx="1.5" fill="#000" opacity=".2"/>`
    : `<rect x="29" y="96" width="6" height="150" rx="3" fill="#fff" opacity=".22"/>`;

  return `<svg class="flasche ${klasse}" data-form="${form.dose ? "dose" : "flasche"}" viewBox="${viewBox}" role="img" aria-label="${form.dose ? "Dose" : "Flasche"} ${esc(bier.name)}">
    <defs><clipPath id="${id}"><path d="${form.pfad}"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>
    <g clip-path="url(#${id})">
      <rect x="0" y="0" width="100" height="260" fill="${farbe}"/>
      <rect x="0" y="0" width="100" height="260" fill="url(#${id}g)"/>
      ${glanz}
    </g>
    <path d="${form.pfad}" fill="none" stroke="var(--glas)" stroke-width="1.5"/>
    ${schaum}
    ${verschluss}
    ${folie}
    <rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="2" fill="var(--beige)"/>
    <rect x="${e.x}" y="${e.y}" width="${e.w}" height="7" rx="2" fill="${marke}"/>
    <rect x="${e.x + 4}" y="${e.y + 10}" width="${e.w - 8}" height="${e.h - 14}" rx="1" fill="none" stroke="${marke}" stroke-opacity=".7" stroke-width=".8"/>
    <text x="50" y="${e.y + e.h * 0.38}" text-anchor="middle" class="fl-sorte">${esc(bier.sorte.toUpperCase())}</text>
    <text x="50" y="${e.y + e.h * 0.64}" text-anchor="middle" class="fl-abv">${zahl(bier.abv)}%</text>
    <text x="50" y="${e.y + e.h * 0.84}" text-anchor="middle" class="fl-vol">${bier.volumen_ml} ml</text>
  </svg>`;
}

/* ---------- Glas mit Einschenk-Animation (Detailseite) ----------
   Glasform und Schaumkrone passen zur Sorte. Animation: Strahl von oben,
   Bier steigt, Schaum wächst, danach perlen Bläschen. */
const GLAESER = {
  willi:  { pfad: "M34 20 L86 20 L84 70 C90 110 88 170 82 226 L38 226 C32 170 30 110 36 70 Z", oben: 20, unten: 226, fuss: `<rect x="38" y="226" width="44" height="9" rx="2"/>` },
  pint:   { pfad: "M28 20 L92 20 L82 228 L38 228 Z", oben: 20, unten: 228, fuss: `<rect x="38" y="228" width="44" height="8" rx="2"/>` },
  weizen: { pfad: "M40 10 L80 10 C82 64 72 96 72 136 C72 176 80 202 78 228 L42 228 C40 202 48 176 48 136 C48 96 38 64 40 10 Z", oben: 10, unten: 228, fuss: `<rect x="42" y="228" width="36" height="8" rx="2"/>` },
  tulpe:  { pfad: "M34 18 L86 18 C88 70 80 118 66 148 L54 148 C40 118 32 70 34 18 Z", oben: 18, unten: 148, fuss: `<rect x="57" y="148" width="6" height="66"/><ellipse cx="60" cy="218" rx="26" ry="6"/>` },
  kelch:  { pfad: "M24 40 C24 112 42 144 60 144 C78 144 96 112 96 40 Z", oben: 40, unten: 144, fuss: `<rect x="57" y="144" width="6" height="70"/><ellipse cx="60" cy="218" rx="28" ry="6"/>` },
};
const GLAS_JE_SORTE = { Weizen: "weizen", Witbier: "weizen", Stout: "pint", "Pale Ale": "pint", IPA: "pint", Amber: "pint",
  Pils: "tulpe", Starkbier: "kelch", Trappist: "kelch", Doppelbock: "kelch", Bock: "kelch", Fruchtbier: "kelch" };
const SCHAUM_JE_SORTE = { Weizen: 0.22, Witbier: 0.2, Pils: 0.18, Starkbier: 0.16, Trappist: 0.15, Stout: 0.1, IPA: 0.1, "Pale Ale": 0.1, Radler: 0.06, Fruchtbier: 0.08 };

export function glas(bier) {
  const id = `gl${++svgZaehler}`;
  const g = GLAESER[GLAS_JE_SORTE[bier.sorte] ?? "willi"];
  const hoehe = g.unten - g.oben;
  const fuellOben = g.oben + hoehe * 0.08;                 // etwas Luft bis zum Rand
  const schaum = hoehe * (SCHAUM_JE_SORTE[bier.sorte] ?? 0.12);
  const dunkel = ["Stout", "Dunkel", "Doppelbock", "Trappist"].includes(bier.sorte);
  const schaumFarbe = dunkel ? "#E2CBA4" : "#F6EEDC";
  const blasen = Array.from({ length: 9 }, (_, i) => {
    const x = 48 + ((i * 37) % 24);
    return `<circle class="gl-blase" cx="${x}" cy="${g.unten - 6}" r="${(0.8 + (i % 3) * 0.4).toFixed(1)}" style="--d:${(i * 0.37).toFixed(2)}s; --h:${(hoehe * 0.75).toFixed(0)}px"/>`;
  }).join("");
  return `<svg class="glas" viewBox="0 -120 120 360" role="img" aria-label="Glas ${esc(bier.name)}, eingeschenkt" style="--steig:${hoehe.toFixed(0)}px">
    <defs>
      <clipPath id="${id}"><path d="${g.pfad}"/></clipPath>
      <linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".4" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    </defs>
    <rect class="gl-strahl" x="58" y="-120" width="4" height="${(fuellOben + 120).toFixed(0)}" rx="2" fill="${bierfarbe(bier.ebc)}"/>
    <g clip-path="url(#${id})">
      <g class="gl-inhalt">
        <rect x="0" y="${fuellOben.toFixed(1)}" width="120" height="${(g.unten - fuellOben + 4).toFixed(1)}" fill="${bierfarbe(bier.ebc)}"/>
        <rect x="0" y="${fuellOben.toFixed(1)}" width="120" height="${(g.unten - fuellOben + 4).toFixed(1)}" fill="url(#${id}b)"/>
        ${blasen}
        <g class="gl-schaum"><rect x="0" y="${(fuellOben - schaum).toFixed(1)}" width="120" height="${(schaum + 2).toFixed(1)}" fill="${schaumFarbe}"/>
          <path d="M0 ${(fuellOben - schaum).toFixed(1)} Q15 ${(fuellOben - schaum - 5).toFixed(1)} 30 ${(fuellOben - schaum).toFixed(1)} T60 ${(fuellOben - schaum).toFixed(1)} T90 ${(fuellOben - schaum).toFixed(1)} T120 ${(fuellOben - schaum).toFixed(1)} V${(fuellOben - schaum + 4).toFixed(1)} H0 Z" fill="${schaumFarbe}"/></g>
      </g>
    </g>
    <path d="${g.pfad}" fill="rgba(239,222,189,.05)" stroke="var(--glas)" stroke-width="1.6"/>
    <path d="${g.pfad}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="5" stroke-dasharray="60 400" stroke-dashoffset="-6"/>
    <g fill="rgba(239,222,189,.18)" stroke="var(--glas)" stroke-width="1">${g.fuss}</g>
  </svg>`;
}

/* ---------- Karte für Karussell und Raster ---------- */
export function bierKarte(bier, { favButton = true, extra = "", index = 0, unterzeile = "", klasse = "" } = {}) {
  const fav = istFavorit(bier.id);
  const land = daten.weltById.get(bier.brauerei_id)?.land_name;
  return `<article class="bierkarte${klasse ? ` ${klasse}` : ""}" data-id="${bier.id}" style="--i:${index % 12}">
    <a class="bk-link" href="#/bier/${bier.id}" aria-label="${esc(bier.name)} ansehen">
      <div class="bk-buehne" style="--bierfarbe:${bierfarbe(bier.ebc)}">
        <span class="bk-licht" aria-hidden="true"></span>
        ${flasche(bier, "bk-fl")}
      </div>
      <div class="bk-text">
        <span class="bk-marke">${esc(bier.brauerei)}${land ? ` · ${esc(land)}` : ""}</span>
        <h3>${esc(bier.name)}</h3>
        <span class="bk-meta">${esc(bier.sorte)} · ${zahl(bier.abv)} % vol. · ${bier.volumen_ml} ml</span>
        ${unterzeile ? `<p class="bk-grund">${esc(unterzeile)}</p>` : ""}
      </div>
    </a>
    ${favButton ? `<button class="bk-fav${fav ? " an" : ""}" data-fav="${bier.id}" aria-pressed="${fav}" aria-label="${esc(bier.name)} ${fav ? "aus Favoriten entfernen" : "zu Favoriten"}">${fav ? "★" : "☆"}</button>` : ""}
    ${extra}
  </article>`;
}

/* ---------- Bühne: aufgefächerte Flaschen mit Amber-Licht (Seitenköpfe) ---------- */
export function flaschenFaecher(biere, { raenge = false } = {}) {
  const n = biere.length;
  return `<div class="faecher" aria-hidden="true" style="--n:${n}">${biere.map((b, i) => `
    <div class="faecher-fl" style="--i:${i}; --o:${(i - (n - 1) / 2).toFixed(2)}; --a:${Math.abs(i - (n - 1) / 2).toFixed(2)}">
      ${flasche(b, "faecher")}
      ${raenge ? `<span class="faecher-rang">${i + 1}</span>` : ""}
    </div>`).join("")}</div>`;
}

/* ---------- Glas als Fortschrittsanzeige (Quiz) ---------- */
export function fortschrittsGlas(anteil, bier = { ebc: 9 }) {
  const id = `fg${++svgZaehler}`;
  return `<svg class="fortschritt-glas" viewBox="0 0 120 240" role="img" aria-label="Fortschritt ${Math.round(anteil * 100)} Prozent">
    <defs><clipPath id="${id}"><path d="M28 20 L92 20 L82 228 L38 228 Z"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <g class="fg-inhalt" style="transform: translateY(${((1 - anteil) * 210).toFixed(1)}px)">
        <rect x="0" y="18" width="120" height="230" fill="${bierfarbe(bier.ebc)}"/>
        <rect x="0" y="12" width="120" height="12" fill="#F6EEDC"/>
      </g>
    </g>
    <path d="M28 20 L92 20 L82 228 L38 228 Z" fill="rgba(239,222,189,.05)" stroke="var(--glas)" stroke-width="1.6"/>
    <rect x="38" y="228" width="44" height="8" rx="2" fill="rgba(239,222,189,.18)"/>
  </svg>`;
}

/* ---------- Sterne ---------- */
export function sterne(id, { klein = false } = {}) {
  const aktuell = bewertung(id);
  const knoepfe = [1, 2, 3, 4, 5].map((n) =>
    `<button class="stern${n <= aktuell ? " an" : ""}" data-stern="${n}" data-bier="${id}" aria-label="${n} von 5 Sternen" aria-pressed="${n === aktuell}">★</button>`).join("");
  return `<div class="sterne${klein ? " klein" : ""}" role="group" aria-label="Bewertung">${knoepfe}</div>`;
}

/* ---------- Geschmacksbalken ---------- */
export function balken(p) {
  return `<dl class="balken">${ATTRIBUTE.map((a) => `
    <div class="balken-zeile"><dt>${ATTRIBUT_LABEL[a]}</dt>
      <dd><span class="spur"><span class="fuellung" style="width:${p[a] * 10}%"></span></span><span class="wert">${zahl(p[a], 0)}</span></dd></div>`).join("")}</dl>`;
}

/* ---------- Radar (Bier vs. eigenes Profil) ---------- */
export function radar(bierProfil, nutzerProfil = null, groesse = 260, { werte = false } = {}) {
  const c = groesse / 2, r = c - (werte ? 54 : 42), n = ATTRIBUTE.length;
  const punkt = (i, wert) => {
    const w = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(w) * r * (wert / 10), c + Math.sin(w) * r * (wert / 10)];
  };
  const poly = (p) => ATTRIBUTE.map((a, i) => punkt(i, p[a]).map((v) => v.toFixed(1)).join(",")).join(" ");
  const ringe = [2.5, 5, 7.5, 10].map((v) => `<polygon points="${poly(Object.fromEntries(ATTRIBUTE.map((a) => [a, v])))}" class="r-ring"/>`).join("");
  const achsen = ATTRIBUTE.map((a, i) => {
    const [x, y] = punkt(i, 10), [lx, ly] = punkt(i, werte ? 13.2 : 12.6);
    const wert = werte ? `<tspan x="${lx.toFixed(1)}" dy="1.25em" class="r-wert">${zahl(bierProfil[a], 0)}</tspan>` : "";
    return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="r-achse"/>
      <text x="${lx.toFixed(1)}" y="${(ly - (werte ? 7 : 0)).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="r-label">${ATTRIBUT_LABEL[a]}${wert}</text>`;
  }).join("");
  return `<svg class="radar" viewBox="0 0 ${groesse} ${groesse}" role="img" aria-label="Geschmacksprofil als Netzdiagramm">
    ${ringe}${achsen}
    <polygon points="${poly(bierProfil)}" class="r-bier"/>
    ${ATTRIBUTE.map((a, i) => { const [px, py] = punkt(i, bierProfil[a]); return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" class="r-ecke"/>`; }).join("")}
    ${nutzerProfil ? `<polygon points="${poly(nutzerProfil)}" class="r-nutzer"/>` : ""}
  </svg>`;
}

/* ---------- Hinweis-Toast ---------- */
let toastTimer;
export function toast(text, art = "info") {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.dataset.art = art;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------- Leere Seite (404, Bier nicht gefunden) mit leerem Glas ---------- */
export function leerSeite({ eyebrow = "Seite nicht gefunden", titel = "Hier ist das Glas leer.", text = "", aktionen = "" } = {}) {
  return `<section class="seite schmal leer-seite">
    ${fortschrittsGlas(0)}
    <p class="eyebrow">${eyebrow}</p>
    <h1>${titel}</h1>
    ${text ? `<p class="sb-lead">${text}</p>` : ""}
    <div class="hero-cta">${aktionen || `<a class="btn primaer" href="#/">Zur Startseite</a><a class="btn sekundaer" href="#/biere">Alle Biere</a>`}</div>
  </section>`;
}
