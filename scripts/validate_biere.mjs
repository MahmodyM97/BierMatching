// Prüft data/biere.json. Aufruf: npm run validate
import { readFileSync } from "node:fs";
import { ATTRIBUTE, SORTEN } from "../js/config.js";

const biere = JSON.parse(readFileSync(new URL("../data/biere.json", import.meta.url)));
const brauereien = new Set(JSON.parse(readFileSync(new URL("../data/brauereien_welt.json", import.meta.url))).brauereien.map((b) => b.id));
const fehler = [];
const ids = new Set();
const zahl = (v) => typeof v === "number" && Number.isFinite(v);

for (const b of biere) {
  const f = (msg) => fehler.push(`Bier ${b.id ?? "?"} (${b.name ?? "ohne Name"}): ${msg}`);
  if (!Number.isInteger(b.id)) f("id fehlt oder ist keine ganze Zahl");
  if (ids.has(b.id)) f("id doppelt"); ids.add(b.id);
  for (const k of ["name", "brauerei", "sorte", "herkunftsland", "beschreibung"]) if (!b[k]) f(`${k} fehlt`);
  if (b.sorte && !SORTEN.includes(b.sorte)) f(`Sorte "${b.sorte}" nicht in SORTEN (js/config.js)`);
  if (!zahl(b.abv) || b.abv < 0 || b.abv > 20) f("abv muss 0–20 sein");
  if (!zahl(b.ebc) || b.ebc < 2 || b.ebc > 200) f("ebc muss 2–200 sein");
  if (!zahl(b.volumen_ml)) f("volumen_ml fehlt");
  if (b.ibu != null && (!zahl(b.ibu) || b.ibu < 0 || b.ibu > 120)) f("ibu muss 0–120 oder null sein");
  if (b.form && !["longneck", "euro", "weizen", "bauchig", "dose"].includes(b.form)) f(`form "${b.form}" unbekannt (longneck, euro, weizen, bauchig, dose)`);
  if (b.etikett_farbe && !/^#[0-9a-fA-F]{6}$/.test(b.etikett_farbe)) f("etikett_farbe muss ein Hex-Wert wie #C8102E sein");
  if (!zahl(b.popularity) || b.popularity < 0 || b.popularity > 100) f("popularity muss 0–100 sein");
  if (b.brauerei_id != null && !brauereien.has(b.brauerei_id)) f(`brauerei_id ${b.brauerei_id} nicht in brauereien_welt.json`);
  for (const a of ATTRIBUTE) {
    const v = b.profil?.[a];
    if (!zahl(v) || v < 0 || v > 10) f(`profil.${a} muss 0–10 sein`);
  }
}
const sorten = new Set(biere.map((b) => b.sorte)).size;
console.log(`${biere.length} Biere, ${sorten} Sorten geprüft.`);
if (fehler.length) { console.error(fehler.join("\n")); process.exit(1); }
console.log("Alles in Ordnung.");
