// Zwei Biere vergleichen: zwei Flaschen auf einer Bühne, ein Radar mit beiden Profilen,
// Kennzahlen nebeneinander und ein Satz, worin sie sich unterscheiden.
// Route: #/vergleich(/<a>(/<b>)). Fehlt b, nehmen wir den eigenen Favoriten Nr. 1 oder das ähnlichste Bier.
import { ATTRIBUTE, ATTRIBUT_LABEL, ATTRIBUT_ADJEKTIV, ATTRIBUT_MEHR, ATTRIBUT_WENIGER } from "../config.js";
import { match } from "../algo.js";
import { daten, profil, istFavorit } from "../store.js";
import { esc, flasche, radar, zahl, bierfarbe, leerSeite } from "../components.js";

export function render(el, { a = null, b = null }) {
  // Ohne Angabe: eigener Favorit Nr. 1, sonst das beliebteste Bier
  if (a === null) a = profil().favoriten[0] ?? [...daten.biere].sort((x, y) => y.popularity - x.popularity)[0].id;
  const A = daten.bierById.get(a);
  if (!A) {
    el.innerHTML = leerSeite({ eyebrow: "Vergleich", titel: "Dieses Bier gibt es nicht.", text: "Wähle im Katalog ein Bier und vergleiche es von dort aus." });
    return {};
  }
  let B = daten.bierById.get(b);
  if (!B || B.id === A.id) {
    const fav = profil().favoriten.find((id) => id !== A.id);
    B = daten.bierById.get(fav) ?? [...daten.biere].filter((x) => x.id !== A.id)
      .sort((x, y) => match(A.profil, y.profil).score - match(A.profil, x.profil).score)[0];
    history.replaceState(null, "", `#/vergleich/${A.id}/${B.id}`);
  }
  const aehnlich = match(A.profil, B.profil).score;
  const optionen = (aktiv, ohne) => [...daten.biere].sort((x, y) => x.name.localeCompare(y.name, "de"))
    .filter((x) => x.id !== ohne)
    .map((x) => `<option value="${x.id}" ${x.id === aktiv ? "selected" : ""}>${esc(x.name)} (${esc(x.sorte)})</option>`).join("");
  const seite = (bier, wer, anderer) => {
    const land = daten.weltById.get(bier.brauerei_id)?.land_name;
    return `<div class="vg-seite vg-${wer}" style="--bierfarbe:${bierfarbe(bier.ebc)}">
      <a class="vg-buehne" href="#/bier/${bier.id}" aria-label="${esc(bier.name)} ansehen"><span class="bk-licht" aria-hidden="true"></span>${flasche(bier, "vg-fl")}</a>
      <p class="bk-marke">${esc(bier.brauerei)}${land ? ` · ${esc(land)}` : ""}</p>
      <h2 class="vg-name"><span class="lg ${wer === "a" ? "lg-bier" : "lg-du"}" aria-hidden="true"></span>${esc(bier.name)}</h2>
      <label class="vg-wahl"><span class="sr-only">Anderes Bier wählen</span>
        <select data-wer="${wer}">${optionen(bier.id, anderer.id)}</select>
      </label>
      <button class="btn sekundaer klein" data-fav="${bier.id}" aria-pressed="${istFavorit(bier.id)}">${istFavorit(bier.id) ? "★ Favorit" : "☆ Zu Favoriten"}</button>
    </div>`;
  };

  el.innerHTML = `
  <header class="vg-kopf">
    <div class="vg-titel">
      <p class="eyebrow">Vergleich</p>
      <h1>Was unterscheidet sie?</h1>
    </div>
    <div class="vg-buehne-grid">
      ${seite(A, "a", B)}
      <div class="vg-mitte">
        <span class="vg-vs">vs</span>
        <p class="vg-prozent"><b>${aehnlich.toFixed(0)}&thinsp;%</b><span>ähnlich</span></p>
        <a class="icon-btn vg-tausch" href="#/vergleich/${B.id}/${A.id}" aria-label="Seiten tauschen">⇄</a>
      </div>
      ${seite(B, "b", A)}
    </div>
  </header>
  <section class="seite vg-inhalt">
    <figure class="vg-radar">
      ${radar(A.profil, B.profil, 380)}
      <figcaption><span class="lg-eintrag"><span class="lg lg-bier"></span>${esc(A.name)}</span><span class="lg-eintrag"><span class="lg lg-du"></span>${esc(B.name)}</span></figcaption>
    </figure>
    <div class="vg-text">
      <h2>Auf einen Blick</h2>
      <p class="vg-satz">${vergleichsSatz(A, B)}</p>
      <table class="vg-tabelle">
        <thead><tr><th scope="col"><span class="sr-only">Merkmal</span></th><th scope="col">${esc(A.name)}</th><th scope="col">${esc(B.name)}</th></tr></thead>
        <tbody>
          ${zeile("Sorte", esc(A.sorte), esc(B.sorte))}
          ${zeile("Alkohol", `${zahl(A.abv)} % vol.`, `${zahl(B.abv)} % vol.`, A.abv, B.abv)}
          ${zeile("Bittere", `${A.ibu} IBU`, `${B.ibu} IBU`, A.ibu, B.ibu)}
          ${zeile("Farbe", farbe(A), farbe(B))}
          ${zeile("Inhalt", `${A.volumen_ml} ml`, `${B.volumen_ml} ml`)}
          ${ATTRIBUTE.map((at) => zeile(ATTRIBUT_LABEL[at][0].toUpperCase() + ATTRIBUT_LABEL[at].slice(1), zahl(A.profil[at], 0), zahl(B.profil[at], 0), A.profil[at], B.profil[at])).join("")}
        </tbody>
      </table>
      <p class="meta">Geschmack auf einer Skala von 0 bis 10. Der höhere Wert ist hervorgehoben.</p>
    </div>
  </section>`;

  el.querySelectorAll(".vg-wahl select").forEach((s) => s.addEventListener("change", () => {
    const neu = Number(s.value);
    location.hash = s.dataset.wer === "a" ? `#/vergleich/${neu}/${B.id}` : `#/vergleich/${A.id}/${neu}`;
  }));
  return {};
}

function farbe(b) {
  return `<span class="vg-farbe" style="background:${bierfarbe(b.ebc)}"></span>${b.ebc} EBC`;
}

function zeile(label, a, b, wa = null, wb = null) {
  const hoch = (x, y) => (wa !== null && x > y ? ' class="hoeher"' : "");
  return `<tr><th scope="row">${label}</th><td${hoch(wa, wb)}>${a}</td><td${hoch(wb, wa)}>${b}</td></tr>`;
}

/** Ein bis zwei Sätze: Gemeinsamkeiten und die größten Unterschiede, aus Sicht von B. */
export function vergleichsSatz(A, B) {
  const gemeinsam = ATTRIBUTE.filter((a) => Math.abs(A.profil[a] - B.profil[a]) <= 1 && Math.min(A.profil[a], B.profil[a]) >= 4);
  const diffs = ATTRIBUTE.map((a) => ({ a, d: B.profil[a] - A.profil[a] }))
    .filter((x) => Math.abs(x.d) >= 2).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 2);
  const liste = (w) => (w.length > 1 ? `${w.slice(0, -1).join(", ")} und ${w.at(-1)}` : w[0]);
  const teile = [];
  if (gemeinsam.length) teile.push(`Beide sind ${liste(gemeinsam.map((a) => ATTRIBUT_ADJEKTIV[a]))}.`);
  if (diffs.length) {
    teile.push(`${esc(B.name)} ist ${liste(diffs.map(({ a, d }) =>
      `${d > 0 ? ATTRIBUT_MEHR[a] : ATTRIBUT_WENIGER[a]} (${zahl(B.profil[a], 0)} statt ${zahl(A.profil[a], 0)})`))}.`);
  } else {
    teile.push("Im Geschmack liegen die beiden sehr nah beieinander, der Unterschied steckt eher in Brauerei und Herkunft.");
  }
  const abv = B.abv - A.abv;
  if (Math.abs(abv) >= 1) teile.push(`Mit ${zahl(B.abv)} % hat es ${abv > 0 ? "mehr" : "weniger"} Alkohol.`);
  return teile.join(" ");
}
