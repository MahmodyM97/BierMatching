// Validierungsregeln. Rein (ohne DOM), damit sie in Node testbar sind.
import { AGE_LIMIT } from "./config.js";

/**
 * Exaktes Alter in ganzen Jahren am Tag `jetzt` (lokale Zeit).
 * Der Geburtstag selbst zählt schon: Wer heute 16 wird, ist heute 16.
 * Geboren am 29.02.: In Nicht-Schaltjahren zählt der Geburtstag ab 01.03.
 */
export function berechneAlter(tag, monat, jahr, jetzt = Date.now()) {
  const heute = new Date(jetzt);
  let alter = heute.getFullYear() - jahr;
  const hM = heute.getMonth() + 1;
  const hT = heute.getDate();
  if (hM < monat || (hM === monat && hT < tag)) alter--;
  return alter;
}

/**
 * Prüft Tag, Monat und Jahr aus dem Alters-Pop-up.
 * @returns {{ok: boolean, fehler?: string, alter?: number, altGenug?: boolean}}
 */
export function pruefeGeburtsdatum(tagEingabe, monatEingabe, jahrEingabe, jetzt = Date.now()) {
  const t = String(tagEingabe ?? "").trim();
  const m = String(monatEingabe ?? "").trim();
  const j = String(jahrEingabe ?? "").trim();
  if (!/^\d{1,2}$/.test(t) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(j)) {
    return { ok: false, fehler: "Bitte Tag, Monat und Jahr eingeben, z. B. 07 03 2001." };
  }
  const tag = Number(t), monat = Number(m), jahr = Number(j);
  const heute = new Date(jetzt);

  // Gibt es das Datum wirklich? (31.02. oder 29.02.2001 fallen hier raus)
  const datum = new Date(jahr, monat - 1, tag);
  if (jahr < 1900 || datum.getFullYear() !== jahr || datum.getMonth() !== monat - 1 || datum.getDate() !== tag) {
    return { ok: false, fehler: "Dieses Datum gibt es nicht. Bitte prüfe Tag und Monat." };
  }
  const heuteMitternacht = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  if (datum > heuteMitternacht) {
    return { ok: false, fehler: "Das Geburtsdatum liegt in der Zukunft." };
  }
  const alter = berechneAlter(tag, monat, jahr, jetzt);
  return { ok: true, alter, altGenug: alter >= AGE_LIMIT };
}

/** Sterne: nur ganze Zahlen 1 bis 5. */
export function istGueltigeBewertung(sterne) {
  return Number.isInteger(sterne) && sterne >= 1 && sterne <= 5;
}
