// Profilseite: Favoriten, Geschmacksprofil, Historie.
import { daten, profil, aktuellerName, istGast, bewertungLoeschen, quizLoeschen } from "../store.js";
import { esc, flasche, radar, sterne, aktuellesProfil, aktuelleEmpfehlungen, flaschenFaecher, toast } from "../components.js";
import { biertyp, teilKarte, teilen } from "../biertyp.js";
import { renderFavoriten } from "./favoriten-panel.js";

export function render(el) {
  el.innerHTML = `
  <header class="seiten-buehne">
    <div class="sb-text">
      <p class="eyebrow">${istGast() ? "Gast-Profil · nur in diesem Browser" : "Angemeldet"}</p>
      <h1>${istGast() ? "Dein Profil" : `Servus, ${esc(aktuellerName())}`}</h1>
      <p class="sb-lead" id="profil-lead"></p>
      ${istGast() ? `<p class="meta"><a href="#/login">Anmelden oder registrieren</a>, um mehrere Profile zu trennen.</p>` : ""}
    </div>
    <div id="profil-faecher"></div>
  </header>
  <section class="seite profil">
    <div class="profil-grid">
      <section class="karte-box" aria-labelledby="pf-h">
        <h2 id="pf-h">Favoriten</h2>
        <p class="meta">Ziehen oder ↑↓ zum Sortieren. Platz 1 zählt am meisten.</p>
        <ol id="fav-liste" class="fav-liste"></ol>
      </section>
      <section class="karte-box" aria-labelledby="pg-h" id="profil-geschmack"></section>
      <section class="karte-box breit" aria-labelledby="ph-h">
        <h2 id="ph-h">Historie</h2>
        <p class="meta">Ein Bier gilt als getrunken, sobald du es bewertest. Getrunkene Biere empfehlen wir nicht noch einmal.</p>
        <ol class="historie" id="historie"></ol>
      </section>
    </div>
  </section>`;
  update();
  return { update };
}

function update() {
  const fav = document.getElementById("fav-liste");
  if (!fav) return;
  renderFavoriten(fav);
  const favBiere = profil().favoriten.map((id) => daten.bierById.get(id)).filter(Boolean);
  document.getElementById("profil-faecher").innerHTML = favBiere.length
    ? flaschenFaecher(favBiere, { raenge: true })
    : `<div class="faecher-leer">${flaschenFaecher([...daten.biere].sort((a, b) => b.popularity - a.popularity).slice(0, 3))}</div>`;
  document.getElementById("profil-lead").textContent = favBiere.length
    ? `Deine Top ${favBiere.length}: ${favBiere.map((b) => b.name).join(", ")}.`
    : "Noch keine Lieblingsbiere. Markiere Biere mit dem Stern, dann stehen sie hier auf deiner Bühne.";

  const { profil: g, positive, quizAnteil } = aktuellesProfil();
  const p = profil();
  document.getElementById("profil-geschmack").innerHTML = `<h2 id="pg-h">Dein Geschmack</h2>
    ${g ? `<p class="meta">Aus ${positive} ${positive === 1 ? "Bier" : "Bieren"}${quizAnteil > 0 ? ` und zu ${Math.round(quizAnteil * 100)} % aus dem Quiz` : ""}.</p>
      <div class="geschmack-profil">
        <figure class="gp-radar">${radar(g, null, 340, { werte: true })}</figure>
        ${typBlock(biertyp(g))}
      </div>`
      : `<p class="meta">Noch kein Profil. Wähle Favoriten oder mach das Quiz.</p><a class="btn primaer klein" href="#/quiz">Quiz starten</a>`}
    ${p.quiz_profil ? `<button class="btn sekundaer klein" id="quiz-weg">Quiz-Ergebnis löschen</button>` : ""}`;
  document.getElementById("quiz-weg")?.addEventListener("click", quizLoeschen);
  document.getElementById("pf-teilen")?.addEventListener("click", async (e) => {
    const knopf = e.currentTarget;
    knopf.disabled = true;
    try {
      const top = aktuelleEmpfehlungen(3).liste.filter((x) => x.score !== undefined);
      if (await teilen(await teilKarte(g, biertyp(g), top), biertyp(g)) === "gespeichert") toast("Bild gespeichert.");
    } catch {
      toast("Das Bild konnte nicht erstellt werden.", "fehler");
    } finally { knopf.disabled = false; }
  });

  const hist = [...p.historie].sort((a, b) => b.datum.localeCompare(a.datum));
  const el = document.getElementById("historie");
  el.innerHTML = hist.length ? hist.map((h) => {
    const bier = daten.bierById.get(h.bier_id);
    if (!bier) return "";
    const datum = new Date(h.datum).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `<li class="hist-eintrag">
      <time datetime="${h.datum}">${datum}</time>
      <span class="fav-mini">${flasche(bier, "mini")}</span>
      <a href="#/bier/${bier.id}" class="fav-name">${esc(bier.name)}<small>${esc(bier.sorte)}</small></a>
      ${sterne(bier.id, { klein: true })}
      <button class="icon-btn" data-hist-weg="${bier.id}" aria-label="${esc(bier.name)} aus der Historie löschen">✕</button>
    </li>`;
  }).join("") : `<li class="leer-zustand"><p>Noch nichts bewertet.</p><p class="meta">Öffne ein Bier und vergib 1 bis 5 Sterne.</p></li>`;
  el.querySelectorAll("[data-hist-weg]").forEach((b) => b.addEventListener("click", () => bewertungLoeschen(Number(b.dataset.histWeg))));
}

function typBlock(typ) {
  return `<div class="gp-typ">
    <p class="eyebrow">Dein Biertyp</p>
    <h3 class="bt-name">${esc(typ.name)}</h3>
    <p class="bt-text">${esc(typ.text)}</p>
    ${typ.merkmale.length ? `<p class="bt-merkmale">${typ.merkmale.map((m) => `<span>${esc(m)}</span>`).join("")}</p>` : ""}
    <button class="btn sekundaer klein" id="pf-teilen">Als Bild teilen</button>
  </div>`;
}
