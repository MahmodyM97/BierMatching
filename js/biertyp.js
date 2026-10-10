// "Dein Biertyp": ordnet ein Geschmacksprofil einem von sieben Typen zu
// und malt eine teilbare Karte (PNG, 1080 × 1350) auf ein Canvas.
import { ATTRIBUTE, ATTRIBUT_LABEL, ATTRIBUT_ADJEKTIV } from "./config.js";

export const TYPEN = {
  bitter:   { id: "hopfenfuchs", name: "Hopfenfuchs", text: "Herb, klar, kein Schnickschnack. Pils, IPA und Pale Ale sind dein Revier." },
  malzig:   { id: "malzbaer",    name: "Malzbär",     text: "Rund und malzig, gern mit Karamell. Märzen, Dunkel und Bock sind deine Höhle." },
  koerper:  { id: "roestrabe",   name: "Röstrabe",    text: "Je voller, desto besser. Stout, Porter und Doppelbock passen zu dir." },
  fruchtig: { id: "fruchtfink",  name: "Fruchtfink",  text: "Fruchtig und spritzig, gern mit Zitrus. Weizen, Witbier und Hopfenaroma machen dich froh." },
  suess:    { id: "honigdachs",  name: "Honigdachs",  text: "Mild und eher süß. Helles, Radler und Fruchtbiere sind deine Wahl." },
  sauer:    { id: "sauerluchs",  name: "Sauerluchs",  text: "Du suchst das Besondere: Sauerbiere, Gose und Kriek wecken dich auf." },
  ausgewogen: { id: "allroundeule", name: "Allround-Eule", text: "Ausgewogen und offen für alles. Du findest in jedem Regal ein gutes Glas." },
};

/** Typ aus einem Profil (6 Attribute, 0–10). Rein, ohne DOM. */
export function biertyp(profil) {
  const werte = ATTRIBUTE.map((a) => profil[a]);
  const spanne = Math.max(...werte) - Math.min(...werte);
  if (spanne < 2.5) return { ...TYPEN.ausgewogen, merkmale: [] };
  const sortiert = [...ATTRIBUTE].sort((a, b) => profil[b] - profil[a]);
  return { ...TYPEN[sortiert[0]], merkmale: sortiert.slice(0, 3).filter((a) => profil[a] >= 4).map((a) => ATTRIBUT_ADJEKTIV[a]) };
}

/* ---------- Teilbare Karte ---------- */
const F = { bg: "#241A14", amber: "#E9A620", beige: "#EFDEBD", text2: "#B2A38A", linie: "#4D4136", flaeche: "#342A22" };

function bildLaden(src) {
  return new Promise((ok, fehler) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fehler; i.src = src; });
}

function umbrechen(ctx, text, maxBreite) {
  const zeilen = [];
  let zeile = "";
  for (const wort of text.split(" ")) {
    const test = zeile ? `${zeile} ${wort}` : wort;
    if (ctx.measureText(test).width > maxBreite && zeile) { zeilen.push(zeile); zeile = wort; } else zeile = test;
  }
  if (zeile) zeilen.push(zeile);
  return zeilen;
}

/** Malt die Karte und gibt einen PNG-Blob zurück. top3: [{bier, score}] */
export async function teilKarte(profil, typ, top3) {
  await Promise.all(["400 100px Bevan", "500 30px Oswald", "400 30px 'Source Sans 3'", "600 30px 'Source Sans 3'"]
    .map((f) => document.fonts.load(f).catch(() => null)));
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // Hintergrund mit Amber-Licht
  ctx.fillStyle = F.bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 640, 40, W / 2, 640, 620);
  glow.addColorStop(0, "rgba(233,166,32,.28)"); glow.addColorStop(1, "rgba(233,166,32,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = F.amber; ctx.lineWidth = 4; ctx.strokeRect(36, 36, W - 72, H - 72);

  try { ctx.drawImage(await bildLaden("assets/logo-256.png"), W / 2 - 70, 80, 140, 140); } catch { /* ohne Logo */ }

  ctx.textAlign = "center";
  ctx.fillStyle = F.amber; ctx.font = "500 30px Oswald";
  ctx.letterSpacing = "8px";
  ctx.fillText("MEIN BIERTYP", W / 2, 278);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = F.beige; ctx.font = `400 ${typ.name.length > 11 ? 92 : 110}px Bevan`;
  ctx.fillText(typ.name, W / 2, 400);
  ctx.fillStyle = F.text2; ctx.font = "400 34px 'Source Sans 3'";
  umbrechen(ctx, typ.text, 820).forEach((z, i) => ctx.fillText(z, W / 2, 466 + i * 46));

  // Radar
  const cx = W / 2, cy = 770, r = 160, n = ATTRIBUTE.length;
  const pt = (i, v) => { const w = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(w) * r * (v / 10), cy + Math.sin(w) * r * (v / 10)]; };
  ctx.strokeStyle = F.linie; ctx.lineWidth = 2;
  for (const ring of [2.5, 5, 7.5, 10]) {
    ctx.beginPath(); ATTRIBUTE.forEach((_, i) => { const [x, y] = pt(i, ring); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke();
  }
  ctx.beginPath(); ATTRIBUTE.forEach((a, i) => { const [x, y] = pt(i, profil[a]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = "rgba(134,96,26,.85)"; ctx.fill(); ctx.strokeStyle = F.amber; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = F.beige; ctx.font = "500 26px Oswald";
  ATTRIBUTE.forEach((a, i) => { const [x, y] = pt(i, 12.4); ctx.fillText(ATTRIBUT_LABEL[a].toUpperCase(), x, y + 9); });

  // Top 3
  ctx.fillStyle = F.amber; ctx.font = "500 28px Oswald"; ctx.letterSpacing = "6px";
  ctx.fillText("PROBIER ALS NÄCHSTES", W / 2, 1072);
  ctx.letterSpacing = "0px";
  ctx.font = "600 34px 'Source Sans 3'";
  top3.slice(0, 3).forEach(({ bier, score }, i) => {
    ctx.fillStyle = F.beige;
    ctx.fillText(`${i + 1}. ${bier.name}  ·  ${Math.round(score)} %`, W / 2, 1124 + i * 48);
  });

  ctx.fillStyle = F.text2; ctx.font = "400 26px 'Source Sans 3'";
  ctx.fillText("Bierkompass · Finde dein nächstes Lieblingsbier · Genieße verantwortungsvoll", W / 2, H - 64);

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

/** Teilen (Handy: Teilen-Menü) oder herunterladen (Desktop). */
export async function teilen(blob, typ) {
  const datei = new File([blob], `bierkompass-${typ.id}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei], title: `Mein Biertyp: ${typ.name}`, text: `Mein Biertyp: ${typ.name}. Und deiner?` });
      return "geteilt";
    } catch (e) {
      if (e.name === "AbortError") return "abgebrochen";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: datei.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "gespeichert";
}
