// Endlos-Karussell (Referenz: 3D-Produktslider von "Mana Yerba Mate", Awwwards).
// - volle Seitenbreite, Flaschen auf einem 3D-Bogen
// - ziehen mit Maus oder Finger, mit Schwung; Trackpad seitlich; Pfeiltasten
// - endlos: nach dem letzten Bier kommt wieder das erste
// - das Bier in der Mitte öffnet sich: Kronkorken springt ab, Schaum steigt auf
// Keine Buttons und keine Scrollleiste.
import { esc, flasche, zahl } from "./components.js";
import { daten, istFavorit } from "./store.js";

const SICHTBAR = 3.6;        // wie viele Positionen links/rechts gezeichnet werden

export function erstelleKarussell(wurzel) {
  let biere = [];
  let offset = 0;            // Position in "Bier-Einheiten" (0 = erstes Bier in der Mitte)
  let ziel = 0;
  let geschw = 0;            // Einheiten pro Frame beim Loslassen
  let zieht = false;
  let schleife = null;
  let aktiv = -1;
  let oeffnenTimer = null;
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;

  wurzel.innerHTML = `
    <div class="k3d-buehne"></div>
    <div class="k3d-info" aria-live="polite"></div>
    <p class="k3d-hinweis" aria-hidden="true"><span>←</span> Ziehen zum Blättern <span>→</span></p>`;
  wurzel.tabIndex = 0;
  wurzel.setAttribute("role", "region");
  wurzel.setAttribute("aria-roledescription", "Karussell");
  wurzel.setAttribute("aria-label", "Biere, mit Pfeiltasten blättern");
  const buehne = wurzel.querySelector(".k3d-buehne");
  const info = wurzel.querySelector(".k3d-info");

  const abstand = () => Math.min(300, Math.max(150, wurzel.clientWidth * 0.2));   // px pro Position
  const n = () => biere.length;
  const wrap = (rel) => { const m = n(); return ((rel % m) + m + m / 2) % m - m / 2; };
  const index = (pos) => ((Math.round(pos) % n()) + n()) % n();

  function setzeBiere(liste) {
    biere = liste;
    offset = ziel = 0;
    aktiv = -1;
    buehne.innerHTML = liste.map((b, i) => `
      <div class="k3d-item" data-i="${i}" role="group" aria-label="${esc(b.name)}">
        <div class="k3d-flasche">${flasche(b, "k3d", { oeffnbar: true })}</div>
        <div class="k3d-schatten"></div>
      </div>`).join("");
    if (!liste.length) {
      info.innerHTML = "";
      return;
    }
    zeichne();
    oeffneMitte();
  }

  /* ---------- Darstellung ---------- */
  function zeichne() {
    if (!n()) return;
    const a = abstand();
    buehne.querySelectorAll(".k3d-item").forEach((el) => {
      const rel = wrap(Number(el.dataset.i) - offset);
      const betrag = Math.abs(rel);
      if (betrag > SICHTBAR) { el.style.visibility = "hidden"; return; }
      el.style.visibility = "visible";
      const x = rel * a * (1 - Math.min(betrag, 3) * 0.08);   // äußere rücken etwas zusammen
      const z = -Math.pow(betrag, 1.35) * 170;
      const rot = -rel * 22;
      const skala = 1 - Math.min(betrag, 3) * 0.1;
      el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), 0, ${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${skala.toFixed(3)})`;
      el.style.zIndex = String(100 - Math.round(betrag * 10));
      el.style.opacity = String(Math.max(0, Math.min(1, SICHTBAR - betrag)).toFixed(2));
      el.style.filter = betrag > 0.5 ? `brightness(${(1 - Math.min(betrag, 3) * 0.15).toFixed(2)})` : "none";
    });
    const neu = index(offset);
    if (neu !== aktiv) wechsleAktiv(neu);
  }

  function wechsleAktiv(i) {
    aktiv = i;
    clearTimeout(oeffnenTimer);
    buehne.querySelectorAll(".k3d-item").forEach((el) => el.classList.toggle("mitte", Number(el.dataset.i) === i));
    buehne.querySelectorAll(".k3d-item.offen").forEach((el) => el.classList.remove("offen"));
    zeigeInfo();
  }

  // Flasche in der Mitte öffnet sich erst, wenn das Karussell zur Ruhe gekommen ist
  function oeffneMitte() {
    clearTimeout(oeffnenTimer);
    oeffnenTimer = setTimeout(() => {
      if (!zieht && Math.abs(ziel - offset) < 0.01) buehne.querySelector(`.k3d-item[data-i="${aktiv}"]`)?.classList.add("offen");
    }, ruhig ? 0 : 60);
  }

  function zeigeInfo() {
    const b = biere[aktiv];
    if (!b) return;
    const ort = daten.weltById.get(b.brauerei_id);
    const fav = istFavorit(b.id);
    info.innerHTML = `
      <p class="eyebrow">${esc(b.brauerei)}${ort ? ` · ${esc(ort.land_name)}` : ""}</p>
      <h3 class="k3d-name">${esc(b.name)}</h3>
      <p class="k3d-meta">${esc(b.sorte)} · ${zahl(b.abv)} % vol. · ${b.volumen_ml} ml</p>
      <div class="k3d-aktionen">
        <a class="btn primaer klein" href="#/bier/${b.id}">Details ansehen</a>
        <button class="btn sekundaer klein" data-fav="${b.id}" aria-pressed="${fav}">${fav ? "★ Favorit" : "☆ Zu Favoriten"}</button>
      </div>`;
  }

  // Detailseite öffnen; die mittlere Flasche "fliegt" per View Transition dorthin
  function oeffneDetail() {
    document.querySelectorAll(".flasche").forEach((f) => { f.style.viewTransitionName = ""; });
    const f = buehne.querySelector(".k3d-item.mitte .flasche");
    if (f) f.style.viewTransitionName = "bier-flasche";
    location.hash = `#/bier/${biere[aktiv].id}`;
  }

  /* ---------- Bewegung ---------- */
  function animiere() {
    cancelAnimationFrame(schleife);
    const schritt = () => {
      if (!zieht) {
        if (Math.abs(geschw) > 0.002) {           // Schwung ausrollen lassen
          offset += geschw;
          geschw *= 0.9;
          ziel = Math.round(offset + geschw * 8);
        } else {
          geschw = 0;
          offset += (ziel - offset) * (ruhig ? 1 : 0.17);   // weich einrasten
        }
      }
      zeichne();
      if (zieht || Math.abs(ziel - offset) > 0.003 || Math.abs(geschw) > 0.002) {
        schleife = requestAnimationFrame(schritt);
      } else {
        offset = ziel;
        zeichne();
        oeffneMitte();
      }
    };
    schleife = requestAnimationFrame(schritt);
  }

  function gehe(nach) {               // relative Schritte, z. B. +1 / -1
    geschw = 0;
    ziel = Math.round(ziel) + nach;
    animiere();
  }

  /* ---------- Ziehen mit Maus / Finger ---------- */
  let startX = 0, startOffset = 0, letzteX = 0, letzteZeit = 0, bewegt = 0, zeiger = null;
  wurzel.addEventListener("dragstart", (e) => e.preventDefault());
  wurzel.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".k3d-info")) return;
    zeiger = e.pointerId;
    zieht = true;
    bewegt = 0;
    startX = letzteX = e.clientX;
    letzteZeit = performance.now();
    startOffset = offset;
    geschw = 0;
    wurzel.classList.add("zieht");
    animiere();
  });
  wurzel.addEventListener("pointermove", (e) => {
    if (!zieht || e.pointerId !== zeiger) return;
    const dx = e.clientX - startX;
    bewegt = Math.max(bewegt, Math.abs(dx));
    if (bewegt > 6 && !wurzel.hasPointerCapture(zeiger)) wurzel.setPointerCapture(zeiger);
    const jetzt = performance.now();
    const dt = Math.max(1, jetzt - letzteZeit);
    geschw = (-(e.clientX - letzteX) / abstand()) * (16 / dt);     // Einheiten pro 16 ms
    letzteX = e.clientX;
    letzteZeit = jetzt;
    offset = startOffset - dx / abstand();
    ziel = offset;
  });
  const loslassen = (e) => {
    if (!zieht || e.pointerId !== zeiger) return;
    zieht = false;
    zeiger = null;
    wurzel.classList.remove("zieht");
    wurzel.classList.add("benutzt");
    if (performance.now() - letzteZeit > 80) geschw = 0;          // stehen geblieben vor dem Loslassen
    geschw = Math.max(-0.25, Math.min(0.25, geschw));
    if (bewegt <= 6) {
      // Klick ohne Ziehen: seitliche Flasche in die Mitte holen, mittlere öffnen
      // Getroffenes Bier über die waagrechte Position bestimmen (die 3D-Ebenen liegen hintereinander)
      const r = wurzel.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const mitteBreite = buehne.querySelector(".k3d-item.mitte")?.getBoundingClientRect().width ?? 120;
      if (Math.abs(dx) <= mitteBreite / 2 + 10) { oeffneDetail(); return; }
      const rel = Math.max(-3, Math.min(3, Math.round(dx / (abstand() * 0.92))));
      if (rel !== 0 && n() > 1) { gehe(rel); return; }
    }
    ziel = Math.round(offset + geschw * 8);
    animiere();
  };
  wurzel.addEventListener("pointerup", loslassen);
  wurzel.addEventListener("pointercancel", loslassen);

  // Trackpad: nur seitliche Wischbewegung abfangen, senkrechtes Scrollen bleibt der Seite
  let radTimer;
  wurzel.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    offset += e.deltaX / abstand();
    ziel = offset;
    geschw = 0;
    zeichne();
    clearTimeout(radTimer);
    radTimer = setTimeout(() => { ziel = Math.round(offset); animiere(); }, 120);
  }, { passive: false });

  wurzel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); gehe(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); gehe(-1); }
    if (e.key === "Enter" && e.target === wurzel && biere[aktiv]) oeffneDetail();
  });

  addEventListener("resize", () => { if (wurzel.isConnected) zeichne(); }, { passive: true });

  return {
    setzeBiere,
    aktualisiere: () => { if (biere.length) zeigeInfo(); },
    gehe,
    zustand: () => ({ offset, ziel, geschw, zieht, aktiv, anzahl: biere.length, id: biere[aktiv]?.id }),
  };
}
