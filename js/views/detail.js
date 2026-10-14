// Detailansicht eines Bieres (Referenz: stiegl.at Produktseite).
import { match } from "../algo.js";
import { ATTRIBUTE, ATTRIBUT_LABEL, ATTRIBUT_ADJEKTIV } from "../config.js";
import { daten, istFavorit } from "../store.js";
import { esc, flasche, glas, radar, sterne, bierKarte, aktuellesProfil, zahl, bierfarbe, leerSeite } from "../components.js";

export function render(el, { id }) {
  const bier = daten.bierById.get(id);
  if (!bier) {
    el.innerHTML = leerSeite({ eyebrow: "Bier nicht gefunden", titel: "Dieses Bier gibt es nicht.", text: "Vielleicht wurde es aus dem Katalog genommen. Schau dich bei den anderen Bieren um." });
    return {};
  }
  const standort = daten.weltById.get(bier.brauerei_id);
  const { profil: nutzer } = aktuellesProfil();
  const passt = nutzer ? match(nutzer, bier.profil).score : null;

  const aehnlich = daten.biere
    .filter((b) => b.id !== bier.id)
    .map((b) => ({ b, s: match(bier.profil, b.profil).score }))
    .sort((a, b) => b.s - a.s).slice(0, 4);

  const fakten = [
    ["Alkohol", `${zahl(bier.abv)} % vol.`],
    ["Bittere", bier.ibu != null ? `${bier.ibu} IBU` : "–"],
    ["Farbe", `${bier.ebc} EBC`],
    ["Inhalt", `${bier.volumen_ml} ml`],
  ];

  el.innerHTML = `
  <section class="detail">
    <nav class="brotkrumen" aria-label="Pfad"><a href="#/">Start</a> / <a href="#/biere">Alle Biere</a> / <span>${esc(bier.name)}</span></nav>
    <div class="detail-grid">
      <div class="detail-buehne" style="--bierfarbe:${bierfarbe(bier.ebc)}">
        <div class="buehne-flasche">${flasche(bier, "gross")}</div>
        <button class="buehne-glas einschenken" id="einschenken" aria-label="Nochmal einschenken">${glas(bier)}</button>
        <span class="buehne-hinweis">Aufs Glas tippen: nochmal einschenken</span>
      </div>
      <div class="detail-info">
        <p class="eyebrow">${esc(bier.brauerei)}${standort ? ` · ${esc(standort.stadt)}, ${esc(standort.land_name)}` : ""}</p>
        <h1>${esc(bier.name)}</h1>
        <p class="detail-sorte">${esc(bier.sorte)}</p>
        <p class="detail-text">${esc(bier.beschreibung)}</p>
        <dl class="fakten">${fakten.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        ${passt !== null ? `<p class="passt"><b>${passt.toFixed(0)} %</b> passend zu deinem Geschmack</p>` : ""}
        <div class="detail-aktionen">
          <button class="btn ${istFavorit(bier.id) ? "sekundaer" : "primaer"}" data-fav="${bier.id}" aria-pressed="${istFavorit(bier.id)}">${istFavorit(bier.id) ? "★ In deinen Favoriten" : "☆ Zu Favoriten"}</button>
          <div class="bewerten"><span class="meta">Getrunken? Bewerte es:</span>${sterne(bier.id)}</div>
        </div>
        <p class="meta detail-links">${standort ? `<a href="#/weltkarte/${standort.id}">Auf der Weltkarte zeigen</a> · <a href="#/biere/land/${standort.land}">Alle Biere aus ${esc(standort.land_name)}</a> · ` : ""}<a href="#/vergleich/${bier.id}">Mit anderem Bier vergleichen</a></p>
        ${bier.dummy ? `<p class="hinweis"></p>` : ""}
      </div>
    </div>

    <section class="geschmack" aria-labelledby="g-h">
      <h2 id="g-h">Geschmacksprofil</h2>
      <div class="geschmack-grid">
        <figure class="radar-fig">
          ${radar(bier.profil, nutzer, 360, { werte: true })}
          <figcaption><span class="legende bier"></span>Dieses Bier ${nutzer ? `<span class="legende nutzer"></span>Dein Geschmack` : ""}</figcaption>
        </figure>
        <div class="geschmack-text">${geschmackText(bier, nutzer)}</div>
      </div>
    </section>

    <section class="aehnlich" aria-labelledby="a-h">
      <h2 id="a-h">Schmeckt ähnlich</h2>
      <div class="raster raster-4">${aehnlich.map(({ b, s }, i) => bierKarte(b, { index: i, extra: `<span class="match-badge">${s.toFixed(0)} % ähnlich</span>` })).join("")}</div>
    </section>
  </section>`;

  // Ziel der View Transition: die große Flasche
  el.querySelector(".buehne-flasche .flasche").style.viewTransitionName = "bier-flasche";

  const knopf = el.querySelector("#einschenken");
  knopf.addEventListener("click", () => {
    knopf.classList.remove("einschenken");
    void knopf.offsetWidth;                 // Animation neu starten
    knopf.classList.add("einschenken");
  });
  // Bei Favorit/Bewertung nur den Aktionsbereich neu zeichnen, damit die Einschenk-Animation nicht neu startet
  return {
    update: () => {
      const neu = document.createElement("div");
      render(neu, { id });
      for (const sel of [".detail-aktionen", ".passt"]) {
        const alt = el.querySelector(sel), frisch = neu.querySelector(sel);
        if (alt && frisch) alt.replaceWith(frisch);
      }
    },
  };
}

/** Kurze Deutung des Radars: was prägt das Bier, wo weicht es vom eigenen Geschmack ab. */
function geschmackText(bier, nutzer) {
  const p = bier.profil;
  const top = [...ATTRIBUTE].sort((a, b) => p[b] - p[a]).slice(0, 2);
  let text = `<p class="gt-gross">Vor allem <b>${ATTRIBUT_ADJEKTIV[top[0]]}</b> und <b>${ATTRIBUT_ADJEKTIV[top[1]]}</b>.</p>`;
  if (nutzer) {
    const diff = ATTRIBUTE.map((a) => ({ a, d: p[a] - nutzer[a] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0];
    text += Math.abs(diff.d) < 1.5
      ? `<p>Liegt in allen sechs Punkten nah an deinem Geschmack.</p>`
      : `<p>Größter Unterschied zu deinem Geschmack: <b>${ATTRIBUT_LABEL[diff.a]}</b>, ${diff.d > 0 ? "deutlich mehr" : "deutlich weniger"} als du sonst magst (${zahl(p[diff.a], 0)} statt ${zahl(nutzer[diff.a], 0)}).</p>`;
  } else {
    text += `<p class="meta">Wähle Favoriten oder mach das Quiz, dann siehst du hier den Vergleich mit deinem Geschmack.</p>`;
  }
  text += `<p class="meta">Skala 0 bis 10 je Merkmal.</p>`;
  return text;
}
