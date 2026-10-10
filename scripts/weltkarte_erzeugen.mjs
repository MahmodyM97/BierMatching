// Einmalig: npm i -D world-atlas@2 topojson-client@3 d3-geo@3
// Aufruf:   node scripts/weltkarte_erzeugen.mjs data/weltkarte.json  (dauert ca. 1-2 Minuten)
// Erzeugt data/weltkarte.json: grobes Weltraster + feines Europa-Raster + Ländergrenzen Europa
import { readFileSync, writeFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";
import { geoContains } from "d3-geo";
const lade = (f) => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${f}`, import.meta.url)));
const land110 = (t => feature(t, t.objects.land))(lade("land-110m.json"));
const land50 = (t => feature(t, t.objects.land))(lade("land-50m.json"));
const laender50 = lade("countries-50m.json");
const NORD = 75, SUED = -58;
const EU = { west: -30, ost: 62, nord: 72, sued: 28 };          // Bereich mit feinem Raster
const inEU = (lng, lat) => lng >= EU.west && lng <= EU.ost && lat >= EU.sued && lat <= EU.nord;
const X = (lng) => +(lng + 180).toFixed(2), Y = (lat) => +(NORD - lat).toFixed(2);

function raster(land, step, filter) {
  const zeilen = [];
  for (let lat = NORD - step / 2; lat > SUED; lat -= step) {
    const z = [];
    for (let lng = -180 + step / 2; lng < 180; lng += step) {
      if (filter(lng, lat) && geoContains(land, [lng, lat])) z.push([X(lng), Y(lat)]);
    }
    if (z.length) zeilen.push(z);
  }
  // kompakt: pro Zeile absolut starten, danach relative Sprünge
  let pfad = "", n = 0;
  for (const z of zeilen) {
    let [px, py] = z[0];
    pfad += `M${px} ${py}h0`; n++;
    for (const [x, y] of z.slice(1)) { pfad += `m${+(x - px).toFixed(2)} 0h0`; px = x; n++; }
  }
  return { pfad, n };
}
const grob = 1.8, fein = 0.4;
const rest = raster(land110, grob, (lng, lat) => !inEU(lng, lat));
const grobEU = raster(land110, grob, inEU);
const feinEU = raster(land50, fein, inEU);

// Ländergrenzen (nur innere Grenzen) im Europa-Bereich
const grenzen = mesh(laender50, laender50.objects.countries, (a, b) => a !== b);
let gpfad = "";
for (const linie of grenzen.coordinates) {
  let offen = false, letzter = null;
  for (const [lng, lat] of linie) {
    if (!inEU(lng, lat)) { offen = false; continue; }
    const p = [X(lng), Y(lat)];
    if (!offen) { gpfad += `M${p[0]} ${p[1]}`; offen = true; letzter = p; continue; }
    if (Math.hypot(p[0] - letzter[0], p[1] - letzter[1]) < 0.08) continue;
    gpfad += `L${p[0]} ${p[1]}`; letzter = p;
  }
}
writeFileSync(process.argv[2], JSON.stringify({
  _quelle: "Natural Earth 1:110m und 1:50m (Public Domain) über das npm-Paket world-atlas",
  projektion: "equirectangular: x = lng + 180, y = 75 - lat",
  breite: 360, hoehe: NORD - SUED,
  grob: { schritt: grob, punkte: rest.n + grobEU.n, rest: rest.pfad, europa: grobEU.pfad },
  fein: { schritt: fein, punkte: feinEU.n, bereich: EU, europa: feinEU.pfad },
  grenzen_europa: gpfad,
}));
console.log("grob", rest.n + grobEU.n, "fein EU", feinEU.n, "Grenzen", gpfad.length, "Zeichen");
