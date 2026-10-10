// Zentrale Konstanten. Hier ändern, nicht im Code verstreut.

export const AGE_LIMIT = 16; // Österreich: Bier ab 16
export const UNDERAGE_REDIRECT = "https://www.smythstoys.com/at/de-at";

export const MAX_FAVORITEN = 5;
export const EMPFEHLUNGEN_ANZAHL = 5;

// Reihenfolge = Reihenfolge im Radar und in den Balken.
export const ATTRIBUTE = ["bitter", "malzig", "fruchtig", "suess", "sauer", "koerper"];

export const ATTRIBUT_LABEL = {
  bitter: "bitter",
  malzig: "malzig",
  fruchtig: "fruchtig",
  suess: "süß",
  sauer: "sauer",
  koerper: "Körper",
};

// Für den Begründungssatz: "…, weil es ähnlich <adjektiv> ist"
export const ATTRIBUT_ADJEKTIV = {
  bitter: "herb",
  malzig: "malzig",
  fruchtig: "fruchtig",
  suess: "süß",
  sauer: "säuerlich",
  koerper: "vollmundig",
};

// Vergleichsformen für Begründungen: "…, aber kräftiger" / "…, nur milder"
export const ATTRIBUT_MEHR = {
  bitter: "herber", malzig: "malziger", fruchtig: "fruchtiger",
  suess: "süßer", sauer: "säuerlicher", koerper: "kräftiger",
};
export const ATTRIBUT_WENIGER = {
  bitter: "milder", malzig: "weniger malzig", fruchtig: "weniger fruchtig",
  suess: "trockener", sauer: "weniger sauer", koerper: "leichter",
};
// "Hat <x> von deinem …"
export const ATTRIBUT_NOMEN = {
  bitter: "die Herbe", malzig: "das Malzige", fruchtig: "das Fruchtige",
  suess: "die Süße", sauer: "die Säure", koerper: "den vollen Körper",
};

export const SORTEN = [
  "Pils", "Helles", "Lager", "Märzen", "Zwickl", "Weizen", "Witbier", "Dunkel",
  "Bock", "Doppelbock", "Amber", "Pale Ale", "IPA", "Stout", "Rauchbier",
  "Sauerbier", "Fruchtbier", "Radler", "Starkbier", "Trappist",
];

// Gewichte der Historie (Sterne -> Gewicht im Profil). 3 Sterne = neutral.
export const HISTORIE_GEWICHT = { 5: 3, 4: 2 };
// Abwertung ähnlicher Biere bei schlechter Bewertung (Sterne -> Faktor)
export const ABWERTUNG = { 1: 0.85, 2: 0.92 };
export const ABWERTUNG_SCHWELLE = 0.9;

export const QUIZ_STANDARDWERT = 4;

// Strenge des Matchings (Gauß-Breite in Geschmackspunkten): kleiner = strenger, Werte spreizen stärker
export const MATCH_STRENGE = 2.5;

export const STORAGE_PREFIX = "bk.";
