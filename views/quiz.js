// Geschmacks-Quiz (Cold Start): 8 Fragen, danach Empfehlungs-Stack.
import { quizProfil, empfehlen } from "../algo.js";
import { daten, profil, quizSpeichern } from "../store.js";
import { esc, flasche, radar, flaschenFaecher, fortschrittsGlas, toast } from "../components.js";
import { biertyp, teilKarte, teilen } from "../biertyp.js";

let schritt = 0;      // 0 = Intro, 1..n = Frage, n+1 = Ergebnis
let antworten = [];

export function render(el) {
  schritt = 0;
  antworten = [];
  zeichne(el);
  return { update: () => {} }; // Quiz-Zustand bei Speicherungen nicht zurücksetzen
}

function zeichne(el) {
  const fragen = daten.quiz.fragen;
  // Neue Frage oder Ergebnis immer von oben zeigen (am Handy lag es sonst halb unter der Kante)
  if (schritt > 0 && el.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: "instant" });
  if (schritt === 0) {
    // drei sehr verschiedene Biere als Bühne: hell, Weizen, dunkel
    const trio = ["Pils", "Weizen", "Stout"].map((s) => daten.biere.find((b) => b.sorte === s)).filter(Boolean);
    el.innerHTML = `<header class="seiten-buehne quiz-start">
      <div class="sb-text">
        <p class="eyebrow">Geschmacks-Quiz · ${fragen.length} Fragen · ca. 1 Minute</p>
        <h1>Was schmeckt dir?</h1>
        <p class="sb-lead">Du kennst noch keine Biere, die du als Favoriten wählen willst? Beantworte ein paar Fragen zu Kaffee, Schokolade und Co. Mit jeder Antwort füllt sich dein Glas, am Ende steht dein Geschmacksprofil.</p>
        <button class="btn primaer" id="quiz-los">Quiz starten</button>
      </div>
      ${flaschenFaecher(trio)}
    </header>
    <section class="seite quiz-vorschau" aria-label="Was dich erwartet">
      <ol class="sg-schritte">
        <li style="--i:0"><h3><span class="sg-nr">1</span>${fragen.length} kurze Fragen</h3><p>Kaffee, Schokolade, Obst: Du brauchst kein Bierwissen, nur deinen Geschmack.</p></li>
        <li style="--i:1"><h3><span class="sg-nr">2</span>Dein Biertyp</h3><p>Hopfenfuchs, Malzbär, Fruchtfink oder einer von vier weiteren. Als Bild zum Teilen.</p></li>
        <li style="--i:2"><h3><span class="sg-nr">3</span>Fünf passende Biere</h3><p>Mit Match in Prozent und einem Satz, warum sie zu dir passen.</p></li>
      </ol>
    </section>`;
    el.querySelector("#quiz-los").addEventListener("click", () => { schritt = 1; zeichne(el); });
    return;
  }

  if (schritt <= fragen.length) {
    const f = fragen[schritt - 1];
    const gewaehlt = antworten[schritt - 1];
    const ziel = (schritt - 1) / fragen.length;              // beantwortete Fragen
    const vorher = Math.max(0, schritt - 2) / fragen.length;
    el.innerHTML = `<section class="quiz-buehne">
      <div class="quiz-inhalt">
        <div class="quiz-fortschritt" role="progressbar" aria-valuemin="1" aria-valuemax="${fragen.length}" aria-valuenow="${schritt}">
          <span style="width:${(schritt / fragen.length) * 100}%"></span>
        </div>
        <p class="eyebrow">Frage ${schritt} von ${fragen.length}</p>
        <h1 class="quiz-frage">${esc(f.frage)}</h1>
        <div class="quiz-antworten">
          ${f.antworten.map((a, i) => `<button class="quiz-antwort" data-i="${i}" aria-pressed="${gewaehlt === a}" style="--i:${i}">
            <span class="quiz-buchstabe">${"ABCD"[i]}</span>${esc(a.text)}</button>`).join("")}
        </div>
        <div class="quiz-nav">
          <button class="btn sekundaer klein" id="quiz-zurueck">${schritt === 1 ? "Abbrechen" : "Zurück"}</button>
        </div>
      </div>
      <figure class="quiz-glas">${fortschrittsGlas(vorher)}<figcaption>Dein Glas: ${Math.round(ziel * 100)} % voll</figcaption></figure>
    </section>`;
    // Glas steigt sichtbar von der vorigen Füllhöhe auf die aktuelle (nach jeder beantworteten Frage)
    const inhalt = el.querySelector(".fg-inhalt");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      inhalt.style.transform = `translateY(${((1 - ziel) * 210).toFixed(1)}px)`;
    }));
    el.querySelectorAll(".quiz-antwort").forEach((b) => b.addEventListener("click", () => {
      antworten[schritt - 1] = f.antworten[Number(b.dataset.i)];
      schritt++;
      zeichne(el);
    }));
    el.querySelector("#quiz-zurueck").addEventListener("click", () => {
      if (schritt === 1) { location.hash = "#/"; return; }
      schritt--;
      zeichne(el);
    });
    el.querySelector(".quiz-antwort")?.focus();
    return;
  }

  // Ergebnis
  const ergebnis = quizProfil(antworten);
  quizSpeichern(ergebnis);
  const p = profil();
  const stack = empfehlen({ profil: ergebnis, biere: daten.biere, favoriten: p.favoriten, historie: p.historie, anzahl: 5 });
  const typ = biertyp(ergebnis);
  el.innerHTML = `<section class="seite quiz-ergebnis">
    <div class="ergebnis-kopf">
      <div>
        <p class="eyebrow">Dein Ergebnis</p>
        <h1>Diese fünf Biere solltest du probieren.</h1>
        <p class="meta">Dein Quiz-Profil ist gespeichert und fließt in die Empfehlungen ein, bis du fünf Favoriten hast.</p>
        <div class="hero-cta">
          <a class="btn primaer" href="#/">Zur Startseite</a>
          <button class="btn sekundaer" id="quiz-neu">Quiz wiederholen</button>
        </div>
      </div>
      ${flaschenFaecher(stack.slice(0, 3).map((s) => s.bier), { raenge: true })}
    </div>
    <div class="ergebnis-profil">
      <figure class="radar-fig">${radar(ergebnis, null, 360, { werte: true })}<figcaption>Dein Geschmacksprofil aus dem Quiz</figcaption></figure>
      <article class="biertyp-karte">
        <img src="assets/logo-128.png" width="64" height="64" alt="">
        <p class="eyebrow">Dein Biertyp</p>
        <h2 class="bt-name">${esc(typ.name)}</h2>
        <p class="bt-text">${esc(typ.text)}</p>
        ${typ.merkmale.length ? `<p class="bt-merkmale">${typ.merkmale.map((m) => `<span>${esc(m)}</span>`).join("")}</p>` : ""}
        <button class="btn primaer" id="bt-teilen">Als Bild teilen</button>
        <p class="meta">Am Handy öffnet sich das Teilen-Menü, am Computer wird das Bild gespeichert.</p>
      </article>
    </div>
    <ol class="stack">
      ${stack.map(({ bier, score, grund }, i) => `<li style="--i:${i}">
        <a href="#/bier/${bier.id}" class="stack-karte">
          <span class="stack-rang">${i + 1}</span>
          <span class="stack-bild">${flasche(bier, "stack-fl")}</span>
          <span class="stack-text"><strong>${esc(bier.name)}</strong><small>${esc(bier.sorte)} · ${esc(bier.brauerei)}</small><span class="grund">${esc(grund)}</span></span>
          <span class="stack-match">${score.toFixed(0)} %</span>
        </a></li>`).join("")}
    </ol>
  </section>`;
  el.querySelector("#quiz-neu").addEventListener("click", () => { schritt = 1; antworten = []; zeichne(el); });
  el.querySelector("#bt-teilen").addEventListener("click", async (e) => {
    const knopf = e.currentTarget;
    knopf.disabled = true;
    knopf.textContent = "Bild wird erstellt …";
    try {
      const ergebnisTeilen = await teilen(await teilKarte(ergebnis, typ, stack), typ);
      if (ergebnisTeilen === "gespeichert") toast("Bild gespeichert.");
    } catch {
      toast("Das Bild konnte nicht erstellt werden.", "fehler");
    } finally {
      knopf.disabled = false;
      knopf.textContent = "Als Bild teilen";
    }
  });
}
