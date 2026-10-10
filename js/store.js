// Daten laden (JSON) und Nutzerzustand verwalten (localStorage).
// JSON-Dateien sind read-only. Alles Veränderliche liegt im localStorage.
import { MAX_FAVORITEN, STORAGE_PREFIX } from "./config.js";
import { istGueltigeBewertung } from "./rules.js";

export const daten = {
  biere: [],
  bierById: new Map(),
  welt: { laender: {}, brauereien: [] },
  weltById: new Map(),
  weltkarte: null,
  quiz: null,
  startFavoriten: [],
};

const GAST = "Gast";
const listeners = new Set();

/* ---------- localStorage, defensiv ---------- */
function lesen(key, fallback) {
  try {
    const roh = localStorage.getItem(STORAGE_PREFIX + key);
    return roh === null ? fallback : JSON.parse(roh);
  } catch {
    return fallback;
  }
}
function schreiben(key, wert) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(wert)); } catch { /* privat/voll */ }
}

/* ---------- Daten laden ---------- */
async function json(pfad) {
  const res = await fetch(pfad);
  if (!res.ok) throw new Error(`${pfad} konnte nicht geladen werden (${res.status})`);
  return res.json();
}

export async function ladeDaten() {
  const [biere, quiz, fav, welt, weltkarte] = await Promise.all([
    json("data/biere.json"), json("data/quiz.json"), json("data/favoriten.json"),
    json("data/brauereien_welt.json"), json("data/weltkarte.json"),
  ]);
  daten.biere = biere;
  daten.bierById = new Map(biere.map((b) => [b.id, b]));
  daten.quiz = quiz;
  daten.welt = welt;
  daten.weltById = new Map(welt.brauereien.map((b) => [b.id, b]));
  daten.weltkarte = weltkarte;
  daten.startFavoriten = fav.favoriten.filter((id) => daten.bierById.has(id));
}

/* ---------- Änderungen melden ---------- */
export function beiAenderung(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function melden() { listeners.forEach((fn) => fn()); }

/* ---------- Alterscheck ---------- */
export const alterBestaetigt = () => lesen("age", false) === true;
export const bestaetigeAlter = () => schreiben("age", true);

/* ---------- Profile ---------- */
const leeresProfil = (favoriten = []) => ({ favoriten, historie: [], quiz_profil: null });

function alleProfile() { return lesen("profile", {}); }
export function aktuellerName() { return lesen("current", GAST); }
export const istGast = () => aktuellerName() === GAST;

export function profil() {
  const alle = alleProfile();
  const name = aktuellerName();
  return alle[name] ?? leeresProfil(name === GAST ? [...daten.startFavoriten] : []);
}
function speichere(p) {
  const alle = alleProfile();
  alle[aktuellerName()] = p;
  schreiben("profile", alle);
  melden();
}

/* ---------- Favoriten ---------- */
export function istFavorit(id) { return profil().favoriten.includes(id); }

export function favoritHinzufuegen(id) {
  const p = profil();
  if (p.favoriten.includes(id)) return { ok: true };
  if (p.favoriten.length >= MAX_FAVORITEN) {
    return { ok: false, fehler: `Du hast schon ${MAX_FAVORITEN} Favoriten. Entferne zuerst ein Bier.` };
  }
  p.favoriten.push(id);
  speichere(p);
  return { ok: true };
}
export function favoritEntfernen(id) {
  const p = profil();
  p.favoriten = p.favoriten.filter((f) => f !== id);
  speichere(p);
}
export function favoritVerschieben(von, nach) {
  const p = profil();
  if (nach < 0 || nach >= p.favoriten.length || von === nach) return;
  const [id] = p.favoriten.splice(von, 1);
  p.favoriten.splice(nach, 0, id);
  speichere(p);
}

/* ---------- Historie ---------- */
export function bewertung(id) { return profil().historie.find((h) => h.bier_id === id)?.sterne ?? 0; }

export function bewerten(id, sterne) {
  if (!istGueltigeBewertung(sterne)) return { ok: false, fehler: "Bewertung nur mit 1 bis 5 Sternen." };
  const p = profil();
  const vorhanden = p.historie.find((h) => h.bier_id === id);
  if (vorhanden) { vorhanden.sterne = sterne; vorhanden.datum = new Date().toISOString(); }
  else p.historie.push({ bier_id: id, sterne, datum: new Date().toISOString() });
  speichere(p);
  return { ok: true };
}
export function bewertungLoeschen(id) {
  const p = profil();
  p.historie = p.historie.filter((h) => h.bier_id !== id);
  speichere(p);
}

/* ---------- Quiz ---------- */
export function quizSpeichern(quizProfil) { const p = profil(); p.quiz_profil = quizProfil; speichere(p); }
export function quizLoeschen() { const p = profil(); p.quiz_profil = null; speichere(p); }

/* ---------- Konten (nur lokal, Demo) ---------- */
async function hash(text) {
  if (!globalThis.crypto?.subtle) throw new Error("Anmeldung braucht https oder localhost (Live Server).");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function registrieren(name, passwort) {
  name = name.trim();
  if (!/^[\wäöüÄÖÜß.-]{3,20}$/.test(name)) return { ok: false, fehler: "Benutzername: 3–20 Zeichen, keine Leerzeichen." };
  if (name.toLowerCase() === GAST.toLowerCase()) return { ok: false, fehler: "Dieser Name ist reserviert." };
  if (passwort.length < 6) return { ok: false, fehler: "Passwort: mindestens 6 Zeichen." };
  const konten = lesen("konten", {});
  if (konten[name]) return { ok: false, fehler: "Diesen Benutzernamen gibt es schon. Melde dich an." };
  konten[name] = await hash(name + ":" + passwort);
  schreiben("konten", konten);
  schreiben("current", name);
  melden();
  return { ok: true };
}

export async function anmelden(name, passwort) {
  name = name.trim();
  const konten = lesen("konten", {});
  if (!konten[name] || konten[name] !== (await hash(name + ":" + passwort))) {
    return { ok: false, fehler: "Benutzername oder Passwort stimmt nicht." };
  }
  schreiben("current", name);
  melden();
  return { ok: true };
}

/** Löscht alles, was Bierkompass in diesem Browser gespeichert hat (Datenschutz-Seite). */
export function alleDatenLoeschen() {
  for (const speicher of [globalThis.localStorage, globalThis.sessionStorage]) {
    try {
      Object.keys(speicher).filter((k) => k.startsWith(STORAGE_PREFIX)).forEach((k) => speicher.removeItem(k));
    } catch { /* blockiert */ }
  }
}

export function abmelden() { schreiben("current", GAST); melden(); }
