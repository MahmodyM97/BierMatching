// Favoritenliste mit Drag-and-Drop-Ranking (Startseite und Profil).
import { MAX_FAVORITEN } from "../config.js";
import { daten, profil, favoritEntfernen, favoritVerschieben } from "../store.js";
import { esc, flasche } from "../components.js";

export function renderFavoriten(el, { regal = false } = {}) {
  const ids = profil().favoriten;
  if (!ids.length) {
    // Leerer Zustand: Einladung statt fünf leerer Rahmen
    const aufStart = !!document.getElementById("karussell");
    el.innerHTML = `<li class="fav-einladung">
      <span class="fe-icon" aria-hidden="true">☆</span>
      <strong>Noch keine Lieblingsbiere</strong>
      <span>${aufStart ? "Wisch durchs Karussell und markiere dein erstes Bier mit „Zu Favoriten“." : "Stöber durch den Katalog und markiere dein erstes Bier mit dem Stern."}</span>
      ${aufStart ? `<button class="btn sekundaer klein" data-zum-karussell>Zum Karussell</button>` : `<a class="btn sekundaer klein" href="#/biere">Alle Biere ansehen</a>`}
      <span class="meta">Danach berechnen wir deinen Geschmack und empfehlen passende Biere.</span>
    </li>`;
    el.querySelector("[data-zum-karussell]")?.addEventListener("click", () =>
      document.getElementById("karussell")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return;
  }
  const slots = [];
  for (let i = 0; i < MAX_FAVORITEN; i++) {
    const bier = daten.bierById.get(ids[i]);
    if (!bier) {
      slots.push(`<li class="fav-slot leer"><span class="rang">${i + 1}</span><span class="leer-text">+ Bier hinzufügen</span></li>`);
      continue;
    }
    slots.push(`<li class="fav-slot" draggable="true" data-index="${i}">
      <span class="rang">${i + 1}</span>
      <span class="fav-mini">${flasche(bier, "mini")}</span>
      <a class="fav-name" draggable="false" href="#/bier/${bier.id}">${esc(bier.name)}<small>${esc(bier.sorte)}</small></a>
      <span class="fav-aktionen">
        <button class="icon-btn" data-hoch="${i}" aria-label="${esc(bier.name)} einen Platz nach vorne" ${i === 0 ? "disabled" : ""}>${regal ? "←" : "↑"}</button>
        <button class="icon-btn" data-runter="${i}" aria-label="${esc(bier.name)} einen Platz nach hinten" ${i === ids.length - 1 ? "disabled" : ""}>${regal ? "→" : "↓"}</button>
        <button class="icon-btn" data-weg="${bier.id}" aria-label="${esc(bier.name)} entfernen">✕</button>
      </span>
    </li>`);
  }
  el.innerHTML = slots.join("");
  verbinde(el);
}

function verbinde(el) {
  let von = null;
  el.querySelectorAll("[draggable=true]").forEach((li) => {
    li.addEventListener("dragstart", (e) => {
      von = Number(li.dataset.index);
      li.classList.add("zieht");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(von));
    });
    li.addEventListener("dragend", () => li.classList.remove("zieht"));
    li.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; li.classList.add("ziel"); });
    li.addEventListener("dragleave", () => li.classList.remove("ziel"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("ziel");
      if (von !== null) favoritVerschieben(von, Number(li.dataset.index));
      von = null;
    });
  });
  el.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.hoch) favoritVerschieben(Number(b.dataset.hoch), Number(b.dataset.hoch) - 1);
    if (b.dataset.runter) favoritVerschieben(Number(b.dataset.runter), Number(b.dataset.runter) + 1);
    if (b.dataset.weg) favoritEntfernen(Number(b.dataset.weg));
  };
}
