// Builds the Geomatic Club brand files from mark.svg and B612 Bold: outlined wordmark (the i's dot is a raster
// cell), horizontal and stacked lockups, colour and mono variants. Run: node build.mjs <dir with node_modules/opentype.js>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire(process.argv[2] + "/package.json");
const opentype = require("opentype.js");
const OUT = "../../public/brand";
const INK = "#16201A", YELLOW = "#F2C230", RED = "#D7262E";
const r2 = (v) => +v.toFixed(2);
const font = opentype.parse(readFileSync("../../assets/fonts/B612-Bold.ttf").buffer.slice(0));
const markInner = readFileSync("mark.svg", "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>.*?<\/title>/, "").replace(/ data-part="[^"]*"/g, "");

function line(text, size = 100, track = -12) {
  const s = size / font.unitsPerEm; let x = 0, d = "", x1 = Infinity, x2 = -Infinity;
  const gs = font.stringToGlyphs(text);
  gs.forEach((g, i) => {
    const ch = text[i]; const gl = g;
    const p = gl.getPath(x, 0, size); let bb = p.getBoundingBox();
    if (ch === "i") {
      // B612 has no dotless ı: split the i into its contours, drop the dot (the topmost), keep the stem,
      // and put a square raster cell where the dot was, the width of the stem.
      const parts = []; let cur = [];
      for (const c of p.commands) { if (c.type === "M" && cur.length) { parts.push(cur); cur = []; } cur.push(c); }
      if (cur.length) parts.push(cur);
      const box = (cs) => { const P = new opentype.Path(); P.commands = cs; return P.getBoundingBox(); };
      parts.sort((a, b2) => box(a).y2 - box(b2).y2);
      const dot = box(parts[0]); const stem = new opentype.Path(); stem.commands = parts.slice(1).flat();
      bb = stem.getBoundingBox(); d += stem.toPathData(2);
      const w = bb.x2 - bb.x1; d += `M${r2(bb.x1)} ${r2(dot.y2 - w)}h${r2(w)}v${r2(w)}h${r2(-w)}Z`;
    } else d += p.toPathData(2);
    if (ch !== " ") { x1 = Math.min(x1, bb.x1); x2 = Math.max(x2, bb.x2); }
    const n = gs[i + 1]; x += gl.advanceWidth * s + (n ? font.getKerningValue(g, n) * s : 0) + track * size / 1000;
  });
  return { d, x1, x2, w: x2 - x1, cap: font.tables.os2.sCapHeight * s, asc: font.ascender * s * 0.8, desc: -font.descender * s * 0.5 };
}
const svg = (vb, body, fill, title = "Geomatic Club") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="${fill}"><title>${title}</title>${body}</svg>\n`;
const L = line("Geomatic Club");
// horizontal: mark 1.9 cap heights, centred on the caps, gap 0.36 mark
const mh = L.cap * 1.9, gap = mh * 0.36, my = -L.cap / 2 - mh / 2;
const hBody = (fill) => `<g transform="translate(0 ${r2(my)}) scale(${r2(mh / 256)})">${markInner}</g><path transform="translate(${r2(mh + gap - L.x1)} 0)" d="${L.d}"/>`;
const hTop = Math.min(my, -L.cap), hBot = Math.max(my + mh, 0);
const hVB = `0 ${r2(hTop)} ${r2(mh + gap + L.w)} ${r2(hBot - hTop)}`;
// stacked: mark above « Geomatic » / « Club »
const A = line("Geomatic"), B = line("Club"); const W = Math.max(A.w, B.w), sm = W * 0.6, lead = 108;
const y1 = sm + 40 + A.cap, y2 = y1 + lead;
const sBody = `<g transform="translate(${r2((W - sm) / 2)} 0) scale(${r2(sm / 256)})">${markInner}</g><path transform="translate(${r2((W - A.w) / 2 - A.x1)} ${r2(y1)})" d="${A.d}"/><path transform="translate(${r2((W - B.w) / 2 - B.x1)} ${r2(y2)})" d="${B.d}"/>`;
const sVB = `0 0 ${r2(W)} ${r2(y2 + 4)}`;
const files = {
  "mark.svg": svg("0 0 256 256", markInner, INK),
  "mark-black.svg": svg("0 0 256 256", markInner, "#000000"),
  "mark-white.svg": svg("0 0 256 256", markInner, "#FFFFFF"),
  "mark-red.svg": svg("0 0 256 256", markInner, RED),
  "logo-horizontal.svg": svg(hVB, hBody(), INK),
  "logo-horizontal-black.svg": svg(hVB, hBody(), "#000000"),
  "logo-horizontal-white.svg": svg(hVB, hBody(), "#FFFFFF"),
  "logo-stacked.svg": svg(sVB, sBody, INK),
  "logo-stacked-black.svg": svg(sVB, sBody, "#000000"),
  "logo-stacked-white.svg": svg(sVB, sBody, "#FFFFFF"),
  "wordmark.svg": svg(`${r2(L.x1)} ${r2(-L.cap - 2)} ${r2(L.w)} ${r2(L.cap + 30)}`, `<path d="${L.d}"/>`, INK),
  // the app tile: the G in ink on tripod yellow, rounded square (favicon and browsers)
  "icon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Geomatic Club</title><rect width="256" height="256" rx="56" fill="${YELLOW}"/><g transform="translate(36 36) scale(.72)" fill="${INK}">${markInner}</g></svg>\n`,
  // full bleed (iOS and Android mask the corners), the G inside the 80 % safe zone
  "icon-maskable.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Geomatic Club</title><rect width="256" height="256" fill="${YELLOW}"/><g transform="translate(56 56) scale(.5625)" fill="${INK}">${markInner}</g></svg>\n`,
};
for (const [n, c] of Object.entries(files)) writeFileSync(`${OUT}/${n}`, c);
console.log(Object.keys(files).length, "files", hVB, sVB);
