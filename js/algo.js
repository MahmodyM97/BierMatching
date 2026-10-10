// Empfehlungsalgorithmus. Rein (ohne DOM), testbar mit `npm test`.
// Beschreibung: KONZEPT.md, Abschnitt 6.
import {
  ATTRIBUTE, ATTRIBUT_ADJEKTIV, ATTRIBUT_MEHR, ATTRIBUT_WENIGER, ATTRIBUT_NOMEN,
  HISTORIE_GEWICHT, ABWERTUNG, ABWERTUNG_SCHWELLE,
  MAX_FAVORITEN, QUIZ_STANDARDWERT, MATCH_STRENGE,
} from "./config.js";

/** Rang-Gewichte: 5 Favoriten -> [5,4,3,2,1]. Rang 1 zählt am meisten. */
export function rangGewichte(anzahl) {
  return Array.from({ length: anzahl }, (_, i) => MAX_FAVORITEN - i);
}

/**
 * Ähnlichkeit pro Attribut: 1 = identisch, gegen 0 = weit auseinander.
 * Gauß-Kurve statt linear: kleine Abweichungen kosten wenig, große viel.
 * Dadurch spreizen sich die Match-Werte (linear lagen fast alle bei 80–95 %).
 * Beispiel bei MATCH_STRENGE 2,5: Abweichung 1 → 85 %, 2 → 53 %, 3 → 24 %, 5 → 2 %.
 */
export function attributAehnlichkeit(a, b) {
  const d = Math.abs(a - b);
  return Math.exp(-((d / MATCH_STRENGE) ** 2));
}

/** Match zwischen Profil und Bier. score 0..100, pro Attribut 0..1. */
export function match(profil, bierProfil) {
  const proAttribut = {};
  let summe = 0;
  for (const attr of ATTRIBUTE) {
    const s = attributAehnlichkeit(profil[attr], bierProfil[attr]);
    proAttribut[attr] = s;
    summe += s;
  }
  return { score: (summe / ATTRIBUTE.length) * 100, proAttribut };
}

/** Gewichteter Durchschnitt von [{profil, gewicht}] pro Attribut. */
function gewichteterDurchschnitt(eintraege) {
  const gesamt = eintraege.reduce((s, e) => s + e.gewicht, 0);
  if (gesamt === 0) return null;
  const profil = {};
  for (const attr of ATTRIBUTE) {
    profil[attr] = eintraege.reduce((s, e) => s + e.profil[attr] * e.gewicht, 0) / gesamt;
  }
  return profil;
}

/**
 * Nutzerprofil aus Favoriten (Rang), Historie (Sterne) und optionalem Quiz.
 * @returns {{profil: object|null, positive: number, quizAnteil: number}}
 */
export function baueProfil({ favoriten = [], historie = [], quizProfil = null }, bierById) {
  const eintraege = [];
  const gewichte = rangGewichte(favoriten.length);
  favoriten.forEach((id, i) => {
    const bier = bierById.get(id);
    if (bier) eintraege.push({ profil: bier.profil, gewicht: gewichte[i] });
  });
  for (const h of historie) {
    const gewicht = HISTORIE_GEWICHT[h.sterne];
    const bier = bierById.get(h.bier_id);
    if (gewicht && bier && !favoriten.includes(h.bier_id)) {
      eintraege.push({ profil: bier.profil, gewicht });
    }
  }
  const positive = eintraege.length;
  const ausBieren = gewichteterDurchschnitt(eintraege);
  if (!quizProfil) return { profil: ausBieren, positive, quizAnteil: 0 };

  const quizAnteil = Math.max(0, MAX_FAVORITEN - positive) / MAX_FAVORITEN;
  if (!ausBieren) return { profil: { ...quizProfil }, positive, quizAnteil: 1 };
  const profil = {};
  for (const attr of ATTRIBUTE) {
    profil[attr] = quizAnteil * quizProfil[attr] + (1 - quizAnteil) * ausBieren[attr];
  }
  return { profil, positive, quizAnteil };
}

/* ---------- Begründungen ----------
 * Pro Empfehlung ein persönlicher Satz statt eines Textbausteins:
 * 1. Referenz = das eigene Lieblingsbier (oder 4–5-Sterne-Bier), das dem Kandidaten am ähnlichsten ist.
 * 2. Gemeinsamkeit = das Merkmal, das bei beiden ausgeprägt und fast gleich ist.
 * 3. Unterschied = das Merkmal mit der größten Abweichung (ab 2 Punkten), sonst die Farbe (EBC).
 * 4. Abwechslung: bereits genannte Referenzen, Merkmale und Satzmuster werden für die
 *    nächsten Karten abgewertet. Ohne eigene Biere (nur Quiz) beziehen sich die Sätze aufs Quiz.
 */
export function neueVerwendung() {
  return { refs: new Map(), attrs: new Map(), muster: new Map() };
}
const zaehle = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const wieOft = (map, key) => map.get(key) ?? 0;

/** Ähnlichstes eigenes Bier zum Kandidaten (Wiederholungen werden leicht abgewertet). */
export function referenzFuer(kandidat, referenzen, verwendet = neueVerwendung()) {
  let beste = null;
  for (const r of referenzen) {
    const aehnlich = match(r.bier.profil, kandidat.profil).score;
    const wert = aehnlich * 0.82 ** wieOft(verwendet.refs, r.bier.id);
    if (!beste || wert > beste.wert) beste = { ...r, wert, aehnlich };
  }
  return beste;
}

function gemeinsamkeit(kandidat, vergleich, verwendet, ohne = null) {
  // Nur Merkmale, die bei beiden spürbar sind ("ähnlich süß" bei Süße 2 wäre falsch)
  const spuerbar = (min) => ATTRIBUTE.filter((a) => a !== ohne && Math.min(kandidat[a], vergleich[a]) >= min);
  const auswahl = [4, 2, 0].map(spuerbar).find((liste) => liste.length);
  return auswahl
    .map((a) => {
      const d = Math.abs(kandidat[a] - vergleich[a]);
      const auspraegung = Math.min(kandidat[a], vergleich[a]);
      return { a, wert: (1 - d / 10) * (1 + auspraegung) * 0.7 ** wieOft(verwendet.attrs, a) };
    })
    .sort((x, y) => y.wert - x.wert)[0].a;
}

function unterschied(kandidat, vergleich, gemeinsam, ebc = null) {
  const groesster = ATTRIBUTE
    .filter((a) => a !== gemeinsam)
    .map((a) => ({ a, d: kandidat[a] - vergleich[a] }))
    .sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0];
  const text = groesster.d > 0 ? ATTRIBUT_MEHR[groesster.a] : ATTRIBUT_WENIGER[groesster.a];
  if (Math.abs(groesster.d) >= 3) return text;
  if (ebc) {
    const [k, v] = ebc;
    if (k > v * 2.5 && k > 25) return "dunkler";
    if (v > k * 2.5 && v > 25) return "heller";
  }
  return Math.abs(groesster.d) >= 2 ? text : null;
}

function waehleMuster(muster, verwendet, versatz) {
  // am seltensten benutztes Muster, bei Gleichstand rotierend nach Position
  return muster
    .map((m, i) => ({ m, n: wieOft(verwendet.muster, m.id), i: (i - versatz + muster.length * 10) % muster.length }))
    .sort((x, y) => x.n - y.n || x.i - y.i)[0].m;
}

/**
 * Begründungssatz für eine Empfehlung.
 * @param kandidat   Bier-Objekt
 * @param kontext    {profil, referenzen: [{bier, art: "fav"|"hist", sterne?}]}
 * @param verwendet  Zähler aus neueVerwendung(), wird fortgeschrieben
 * @param position   Platz in der Liste (für die Rotation der Satzmuster)
 * @returns {{text: string, referenz: object|null}}
 */
export function begruendung(kandidat, { profil, referenzen = [] }, verwendet = neueVerwendung(), position = 0) {
  const k = kandidat.profil;
  const ref = referenzFuer(kandidat, referenzen, verwendet);

  if (ref) {
    const name = ref.bier.name;
    const g = gemeinsamkeit(k, ref.bier.profil, verwendet);
    const g2 = gemeinsamkeit(k, ref.bier.profil, verwendet, g);
    const diff = unterschied(k, ref.bier.profil, g, [kandidat.ebc, ref.bier.ebc]);
    const adj = ATTRIBUT_ADJEKTIV[g];
    const muster = [
      diff && { id: "aber", text: `Ähnlich ${adj} wie dein ${name}, aber ${diff}.` },
      diff && { id: "nur", text: `Hat ${ATTRIBUT_NOMEN[g]} von deinem ${name}, nur ${diff}.` },
      ref.art === "hist" && { id: "sterne", text: `Für Fans von ${name} (${ref.sterne} ★ von dir): ebenso ${adj}${diff ? `, etwas ${diff}` : ""}.` },
      !diff && { id: "zwilling", text: `Fast ein Zwilling von deinem ${name}: genauso ${adj}${Math.min(k[g2], ref.bier.profil[g2]) >= 4 ? ` und ${ATTRIBUT_ADJEKTIV[g2]}` : ""}.` },
      !diff && { id: "gleich", text: `Wenn dir ${name} schmeckt: genauso ${adj}, nur aus einer anderen Brauerei.` },
    ].filter(Boolean);
    const m = waehleMuster(muster, verwendet, position);
    zaehle(verwendet.refs, ref.bier.id);
    zaehle(verwendet.attrs, g);
    zaehle(verwendet.muster, m.id);
    return { text: m.text, referenz: ref.bier };
  }

  // Nur Quiz-Profil, noch keine eigenen Biere
  const g = gemeinsamkeit(k, profil, verwendet);
  const g2 = gemeinsamkeit(k, profil, verwendet, g);
  const diff = unterschied(k, profil, g);
  const muster = [
    { id: "q-trifft", text: `Trifft dein Quiz: ${ATTRIBUT_ADJEKTIV[g]}${Math.min(k[g2], profil[g2]) >= 4 ? ` und ${ATTRIBUT_ADJEKTIV[g2]}` : ""}, so wie du es angegeben hast.` },
    { id: "q-liefert", text: `Deine Antworten sagen: ${ATTRIBUT_ADJEKTIV[g]}. Dieses Bier liefert genau das${diff ? ` und ist etwas ${diff}` : ""}.` },
    { id: "q-nah", text: `Nah an deinem Quiz-Ergebnis, vor allem ${ATTRIBUT_ADJEKTIV[g]}${diff ? `, dabei ${diff} als gedacht` : ""}.` },
  ];
  const m = waehleMuster(muster, verwendet, position);
  zaehle(verwendet.attrs, g);
  zaehle(verwendet.muster, m.id);
  return { text: m.text, referenz: null };
}

/**
 * Sortierte Empfehlungen.
 * @returns {Array<{bier, score, proAttribut, grund, referenz}>}
 */
export function empfehlen({ profil, biere, favoriten = [], historie = [], anzahl = Infinity }) {
  if (!profil) return [];
  const finde = (id) => biere.find((b) => b.id === id);
  const ausgeschlossen = new Set([...favoriten, ...historie.map((h) => h.bier_id)]);
  const abgelehnt = historie
    .filter((h) => ABWERTUNG[h.sterne])
    .map((h) => ({ faktor: ABWERTUNG[h.sterne], bier: finde(h.bier_id) }))
    .filter((x) => x.bier);
  const referenzen = [
    ...favoriten.map((id) => ({ bier: finde(id), art: "fav" })),
    ...historie.filter((h) => h.sterne >= 4 && !favoriten.includes(h.bier_id))
      .map((h) => ({ bier: finde(h.bier_id), art: "hist", sterne: h.sterne })),
  ].filter((r) => r.bier);

  const verwendet = neueVerwendung();
  return biere
    .filter((b) => !ausgeschlossen.has(b.id))
    .map((bier) => {
      const m = match(profil, bier.profil);
      let score = m.score;
      for (const a of abgelehnt) {
        if (match(a.bier.profil, bier.profil).score / 100 >= ABWERTUNG_SCHWELLE) score *= a.faktor;
      }
      return { bier, score, proAttribut: m.proAttribut };
    })
    .sort((a, b) => b.score - a.score || b.bier.popularity - a.bier.popularity)
    .slice(0, anzahl)
    .map((e, i) => {
      const { text, referenz } = begruendung(e.bier, { profil, referenzen }, verwendet, i);
      return { ...e, grund: text, referenz };
    });
}

/** Cold Start: beliebteste Biere, ohne bereits gewählte. */
export function beliebteste(biere, ausschliessen = [], anzahl = 5) {
  const aus = new Set(ausschliessen);
  return [...biere].filter((b) => !aus.has(b.id))
    .sort((a, b) => b.popularity - a.popularity).slice(0, anzahl);
}

/** Quiz-Profil: pro Attribut Durchschnitt aller gesetzten Werte, sonst Standardwert. */
export function quizProfil(antworten) {
  const profil = {};
  for (const attr of ATTRIBUTE) {
    const werte = antworten.map((a) => a.werte[attr]).filter((w) => w !== undefined);
    profil[attr] = werte.length ? werte.reduce((s, w) => s + w, 0) / werte.length : QUIZ_STANDARDWERT;
  }
  return profil;
}

/** Freitextsuche über Name, Brauerei, Sorte, Land und Geschmack (Attributnamen). */
export function suche(biere, begriff, laender = {}) {
  const q = begriff.trim().toLowerCase();
  if (!q) return biere;
  const woerter = q.split(/\s+/);
  return biere.filter((b) => {
    const starke = ATTRIBUTE.filter((a) => b.profil[a] >= 6).map((a) => ATTRIBUT_ADJEKTIV[a]);
    const text = [b.name, b.brauerei, b.sorte, b.beschreibung, laender[b.herkunftsland] ?? "", ...starke].join(" ").toLowerCase();
    return woerter.every((w) => text.includes(w));
  });
}
