// Outlined wordmarks and lockups for the three refined marks. Nothing is live text: every letter is a path.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const S = process.argv[2];
const require = createRequire(S + "/ot/package.json");
const opentype = require("opentype.js");
const f2 = (v) => +v.toFixed(2);

function setLine(font, text, size, track, custom) {
  const scale = size / font.unitsPerEm; let x = 0; let d = ""; const boxes = [];
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    const ch = text[i];
    const useDotless = ch === "i" && custom.tittle;
    const gl = useDotless ? font.charToGlyph("ı") : g;
    const p = gl.getPath(x, 0, size); d += p.toPathData(2);
    const bb = p.getBoundingBox(); boxes.push({ ch, x, bb, adv: gl.advanceWidth * scale });
    if (useDotless) {
      const full = g.getPath(x, 0, size).getBoundingBox(); const stem = bb.x2 - bb.x1; const cx = (bb.x1 + bb.x2) / 2;
      const top = full.y1; d += custom.tittle(cx, top, stem);
    }
    if (ch === "o" && custom.summit && !custom.summitDone) { custom.summitDone = true; const cx = (bb.x1 + bb.x2) / 2, cy = (bb.y1 + bb.y2) / 2; d += custom.summit(cx, cy, bb.x2 - bb.x1); }
    const next = glyphs[i + 1]; x += gl.advanceWidth * scale + (next ? font.getKerningValue(g, next) * scale : 0) + track * size / 1000;
  });
  const all = new opentype.Path(); // bounds from boxes
  const x1 = Math.min(...boxes.map((b) => b.bb.x1)), x2 = Math.max(...boxes.map((b) => b.bb.x2));
  const capH = font.tables.os2.sCapHeight * scale;
  return { d, x1, x2, width: x2 - x1, capH, asc: -Math.min(...boxes.map((b) => b.bb.y1)), desc: Math.max(...boxes.map((b) => b.bb.y2)) };
}
const circ = (x, y, r, sweep = 0) => `M${f2(x - r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 ${sweep} ${f2(x + r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 ${sweep} ${f2(x - r)} ${f2(y)}Z`;
const LOGOS = {
  a: { mark: "a-vectorisation", font: "Overpass.ttf", track: -14,
       tittle: (cx, top, stem) => { const s = stem * 1.3; return `M${f2(cx - s / 2)} ${f2(top - s * 0.18)}h${f2(s)}v${f2(s)}h${f2(-s)}Z`; } }, // a raster cell, deliberately bigger than the stem
  b: { mark: "b-cheminement", font: "AtkinsonHyperlegibleNext.ttf", track: -10,
       tittle: (cx, top, stem) => { const r = stem * 0.64, y = top + r * 0.95; return circ(cx, y, r) + circ(cx, y, r * 0.42, 1); } }, // a station ring
  c: { mark: "c-hachures", font: "Newsreader.ttf", track: 6, tittle: null,
       summit: (cx, cy, w) => circ(cx, cy, w * 0.085) }, // a summit point in the o's counter
};
const markInner = (n) => readFileSync(`final/${n}.svg`, "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>.*?<\/title>/, "");
for (const [k, L] of Object.entries(LOGOS)) {
  const font = opentype.parse(readFileSync(`${S}/fonts/${L.font}`).buffer.slice(0));
  const custom = { tittle: L.tittle, summit: L.summit };
  const size = 100;
  const line = setLine(font, "Geomatic Club", size, L.track, custom);
  const pad = 2;
  // wordmark alone
  const wmH = line.asc + line.desc;
  writeFileSync(`final/${k}-wordmark.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(line.x1 - pad)} ${f2(-line.asc - pad)} ${f2(line.width + pad * 2)} ${f2(wmH + pad * 2)}"><title>Geomatic Club</title><path d="${line.d}"/></svg>\n`);
  // horizontal: the mark is 1.9 cap heights tall, centred on the cap height, one half mark-height away
  const mh = line.capH * 1.9, ms = mh / 256, gap = mh * 0.42, my = -line.capH / 2 - mh / 2;
  const hx = mh + gap - line.x1;
  const hw = mh + gap + line.width, top = Math.min(my, -line.asc), bot = Math.max(my + mh, line.desc);
  writeFileSync(`final/${k}-horizontal.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(-pad)} ${f2(top - pad)} ${f2(hw + pad * 2)} ${f2(bot - top + pad * 2)}"><title>Geomatic Club</title><g transform="translate(0 ${f2(my)}) scale(${f2(ms)})">${markInner(L.mark)}</g><path transform="translate(${f2(hx)} 0)" d="${line.d}"/></svg>\n`);
  // stacked: mark above « Geomatic » / « Club », centred
  const custom2 = { tittle: L.tittle, summit: L.summit };
  const l1 = setLine(font, "Geomatic", size, L.track, custom2), l2 = setLine(font, "Club", size, L.track, {});
  const W = Math.max(l1.width, l2.width), mh2 = W * 0.62, lead = size * 1.02;
  const y1 = mh2 + size * 0.38 + l1.capH, y2 = y1 + lead;
  writeFileSync(`final/${k}-stacked.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(-pad)} ${f2(-pad)} ${f2(W + pad * 2)} ${f2(y2 + l2.desc + pad * 2)}"><title>Geomatic Club</title><g transform="translate(${f2((W - mh2) / 2)} 0) scale(${f2(mh2 / 256)})">${markInner(L.mark)}</g><path transform="translate(${f2((W - l1.width) / 2 - l1.x1)} ${f2(y1)})" d="${l1.d}"/><path transform="translate(${f2((W - l2.width) / 2 - l2.x1)} ${f2(y2)})" d="${l2.d}"/></svg>\n`);
  console.log(k, "ok", Math.round(line.width));
}
