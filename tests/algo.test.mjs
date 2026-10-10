import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  rangGewichte, match, baueProfil, empfehlen, quizProfil, suche, beliebteste,
} from "../js/algo.js";
import { pruefeGeburtsdatum, berechneAlter, istGueltigeBewertung } from "../js/rules.js";

const biere = JSON.parse(readFileSync(new URL("../data/biere.json", import.meta.url)));
const byId = new Map(biere.map((b) => [b.id, b]));
const id = (name) => biere.find((b) => b.name === name).id;
const P = (bitter, malzig, fruchtig, suess, sauer, koerper) => ({ bitter, malzig, fruchtig, suess, sauer, koerper });

test("Rang 1 hat das höchste Gewicht", () => {
  assert.deepEqual(rangGewichte(5), [5, 4, 3, 2, 1]);
  assert.deepEqual(rangGewichte(2), [5, 4]);
});

test("Match: identisch = 100 %, maximal verschieden nahe 0 %", () => {
  assert.equal(match(P(5, 5, 5, 5, 5, 5), P(5, 5, 5, 5, 5, 5)).score, 100);
  assert.ok(match(P(0, 0, 0, 0, 0, 0), P(10, 10, 10, 10, 10, 10)).score < 1);
});

test("Match-Werte spreizen sich: kleine Abweichung kostet wenig, große viel", () => {
  const basis = P(5, 5, 5, 5, 5, 5);
  const eins = match(basis, P(6, 6, 6, 6, 6, 6)).score;
  const drei = match(basis, P(8, 8, 8, 8, 8, 8)).score;
  assert.ok(eins > 80 && eins < 90, `Abweichung 1: ${eins}`);
  assert.ok(drei < 30, `Abweichung 3: ${drei}`);
});

test("Match wird pro Attribut berechnet, nicht über den Gesamtscore", () => {
  // gleiche Summe (30), aber völlig andere Verteilung
  const a = P(10, 10, 10, 0, 0, 0), b = P(0, 0, 0, 10, 10, 10);
  assert.ok(match(a, b).score < 1);
});

test("Profil: gewichteter Durchschnitt nach Rang", () => {
  const m = new Map([[1, { profil: P(10, 0, 0, 0, 0, 0) }], [2, { profil: P(0, 0, 0, 0, 0, 0) }]]);
  const { profil } = baueProfil({ favoriten: [1, 2] }, m);
  assert.ok(Math.abs(profil.bitter - (10 * 5) / 9) < 1e-9); // 5/(5+4)
});

test("Historie: 5 Sterne zählen, 3 Sterne sind neutral", () => {
  const m = new Map([[1, { profil: P(10, 0, 0, 0, 0, 0) }], [2, { profil: P(0, 0, 0, 0, 0, 0) }]]);
  const nur3 = baueProfil({ favoriten: [1], historie: [{ bier_id: 2, sterne: 3 }] }, m);
  assert.equal(nur3.profil.bitter, 10);
  const mit5 = baueProfil({ favoriten: [1], historie: [{ bier_id: 2, sterne: 5 }] }, m);
  assert.ok(mit5.profil.bitter < 10);
});

test("Quiz-Anteil sinkt mit jedem Favoriten und ist ab 5 null", () => {
  const q = P(0, 0, 0, 0, 0, 0);
  assert.equal(baueProfil({ quizProfil: q }, byId).quizAnteil, 1);
  assert.equal(baueProfil({ favoriten: [1, 2], quizProfil: q }, byId).quizAnteil, 0.6);
  assert.equal(baueProfil({ favoriten: [1, 2, 3, 4, 5], quizProfil: q }, byId).quizAnteil, 0);
});

test("Empfehlungen: Favoriten und bewertete Biere fehlen, absteigend sortiert", () => {
  const favoriten = [id("Pilsner Urquell"), id("Guinness Draught")], historie = [{ bier_id: id("Heineken"), sterne: 4 }];
  const { profil } = baueProfil({ favoriten, historie }, byId);
  const liste = empfehlen({ profil, biere, favoriten, historie });
  const ids = liste.map((e) => e.bier.id);
  for (const x of [...favoriten, id("Heineken")]) assert.ok(!ids.includes(x));
  for (let i = 1; i < liste.length; i++) assert.ok(liste[i - 1].score >= liste[i].score);
  assert.ok(liste[0].grund.length > 10);
});

test("Begründungen: abwechslungsreich und mit Bezug zum eigenen Lieblingsbier", () => {
  const favoriten = [id("Pilsner Urquell"), id("Guinness Draught"), id("Weihenstephaner Hefeweissbier")];
  const { profil } = baueProfil({ favoriten }, byId);
  const liste = empfehlen({ profil, biere, favoriten, anzahl: 5 });
  const texte = liste.map((e) => e.grund);
  assert.equal(new Set(texte).size, 5, "keine zwei gleichen Sätze");
  const namen = favoriten.map((f) => byId.get(f).name);
  for (const e of liste) {
    assert.ok(namen.some((n) => e.grund.includes(n)), `Bezug fehlt: ${e.grund}`);
    assert.ok(e.referenz && favoriten.includes(e.referenz.id));
  }
  // nicht alle mit demselben Satzanfang
  assert.ok(new Set(texte.map((t) => t.split(" ").slice(0, 2).join(" "))).size >= 2);
});

test("Begründungen ohne Favoriten beziehen sich aufs Quiz", () => {
  const liste = empfehlen({ profil: P(6, 4, 3, 2, 1, 5), biere, anzahl: 3 });
  for (const e of liste) { assert.match(e.grund, /Quiz|Antworten/); assert.equal(e.referenz, null); }
});

test("1-Stern-Bewertung bremst sehr ähnliche Biere", () => {
  const profil = byId.get(id("Heineken")).profil;
  const ziel = id("Peroni Nastro Azzurro");
  const ohne = empfehlen({ profil, biere, historie: [] }).find((e) => e.bier.id === ziel).score;
  const mit = empfehlen({ profil, biere, historie: [{ bier_id: id("Carlsberg Pilsner"), sterne: 1 }] }).find((e) => e.bier.id === ziel).score;
  assert.ok(mit < ohne);
});

test("Pils-Fan bekommt kein Stout als Top-Empfehlung", () => {
  const fav = [id("Pilsner Urquell")];
  const { profil } = baueProfil({ favoriten: fav }, byId);
  const top = empfehlen({ profil, biere, favoriten: fav, anzahl: 5 }).map((e) => e.bier.sorte);
  assert.ok(!top.includes("Stout"));
});

test("Weizen-Fan bekommt Weizen oder Witbier ganz oben", () => {
  const fav = [id("Paulaner Hefe-Weißbier")];
  const { profil } = baueProfil({ favoriten: fav }, byId);
  const top = empfehlen({ profil, biere, favoriten: fav, anzahl: 2 }).map((e) => e.bier.sorte);
  assert.ok(top.every((s) => ["Weizen", "Witbier", "Bock"].includes(s)), top.join());
});

test("Quiz-Profil: Durchschnitt pro Attribut, Standardwert 4", () => {
  const p = quizProfil([{ werte: { bitter: 2 } }, { werte: { bitter: 8, koerper: 6 } }]);
  assert.equal(p.bitter, 5);
  assert.equal(p.koerper, 6);
  assert.equal(p.sauer, 4);
});

test("Suche findet Name, Brauerei, Sorte, Land und Geschmack", () => {
  const laender = JSON.parse(readFileSync(new URL("../data/brauereien_welt.json", import.meta.url))).laender;
  assert.ok(suche(biere, "pils").some((b) => b.name === "Pilsner Urquell"));
  assert.equal(suche(biere, "sierra nevada").length, 2);
  assert.ok(suche(biere, "belgien", laender).length >= 5);
  assert.ok(suche(biere, "belgien", laender).every((b) => b.herkunftsland === "BE"));
  assert.ok(suche(biere, "fruchtig").length > 0);
  assert.equal(suche(biere, "gibtesnicht").length, 0);
});

test("Daten: 50 Biere, jede brauerei_id hat einen Standort auf der Weltkarte", () => {
  const welt = JSON.parse(readFileSync(new URL("../data/brauereien_welt.json", import.meta.url)));
  const ids = new Set(welt.brauereien.map((b) => b.id));
  assert.equal(biere.length, 50);
  for (const b of biere) {
    assert.ok(ids.has(b.brauerei_id), b.name);
    assert.equal(welt.brauereien.find((x) => x.id === b.brauerei_id).land, b.herkunftsland, b.name);
  }
});

test("Cold Start: beliebteste zuerst", () => {
  const top = beliebteste(biere, [], 3);
  assert.ok(top[0].popularity >= top[1].popularity);
});

test("Alterscheck ab 16: Geburtstag heute zählt, morgen noch nicht", () => {
  const jetzt = new Date(2026, 9, 7, 12, 0).getTime(); // 07.10.2026, 12:00 lokal
  assert.equal(pruefeGeburtsdatum("07", "10", "2010", jetzt).altGenug, true);   // heute 16 geworden
  assert.equal(pruefeGeburtsdatum("06", "10", "2010", jetzt).altGenug, true);   // gestern 16 geworden
  assert.equal(pruefeGeburtsdatum("08", "10", "2010", jetzt).altGenug, false);  // wird morgen 16
  assert.equal(pruefeGeburtsdatum("31", "12", "2010", jetzt).altGenug, false);  // wird Silvester 16
  assert.equal(pruefeGeburtsdatum("1", "1", "1990", jetzt).alter, 36);
});

test("Alterscheck kurz nach Mitternacht nutzt das lokale Datum", () => {
  const kurzNach = new Date(2026, 9, 7, 0, 1).getTime();
  const kurzVor = new Date(2026, 9, 6, 23, 59).getTime();
  assert.equal(pruefeGeburtsdatum("07", "10", "2010", kurzNach).altGenug, true);
  assert.equal(pruefeGeburtsdatum("07", "10", "2010", kurzVor).altGenug, false);
});

test("Geboren am 29.02.: in Nicht-Schaltjahren ab 01.03. älter", () => {
  assert.equal(berechneAlter(29, 2, 2008, new Date(2024, 1, 28).getTime()), 15);
  assert.equal(berechneAlter(29, 2, 2008, new Date(2024, 1, 29).getTime()), 16);
  assert.equal(berechneAlter(29, 2, 2010, new Date(2026, 1, 28).getTime()), 15);
  assert.equal(berechneAlter(29, 2, 2010, new Date(2026, 2, 1).getTime()), 16);
});

test("Ungültige Eingaben werden abgelehnt", () => {
  const jetzt = new Date(2026, 9, 7).getTime();
  assert.equal(pruefeGeburtsdatum("31", "02", "2000", jetzt).ok, false);   // gibt es nicht
  assert.equal(pruefeGeburtsdatum("29", "02", "2001", jetzt).ok, false);   // kein Schaltjahr
  assert.equal(pruefeGeburtsdatum("29", "02", "2000", jetzt).ok, true);
  assert.equal(pruefeGeburtsdatum("08", "10", "2026", jetzt).ok, false);   // Zukunft
  assert.equal(pruefeGeburtsdatum("", "10", "2000", jetzt).ok, false);
  assert.equal(pruefeGeburtsdatum("10", "13", "2000", jetzt).ok, false);
  assert.equal(pruefeGeburtsdatum("10", "10", "99", jetzt).ok, false);
  assert.equal(pruefeGeburtsdatum("10", "10", "1899", jetzt).ok, false);
});

test("Bewertung nur 1 bis 5 ganze Sterne", () => {
  for (const s of [1, 2, 3, 4, 5]) assert.ok(istGueltigeBewertung(s));
  for (const s of [0, 6, -1, 2.5, "3", null]) assert.ok(!istGueltigeBewertung(s));
});

test("Biertyp: stärkstes Merkmal entscheidet, flaches Profil = Allround-Eule", async () => {
  const { biertyp } = await import("../js/biertyp.js");
  assert.equal(biertyp(P(8, 3, 2, 2, 1, 4)).name, "Hopfenfuchs");
  assert.equal(biertyp(P(2, 4, 8, 4, 2, 4)).name, "Fruchtfink");
  assert.equal(biertyp(P(3, 8, 2, 4, 1, 6)).name, "Malzbär");
  assert.equal(biertyp(P(4, 5, 4, 4, 4, 5)).name, "Allround-Eule");
});
