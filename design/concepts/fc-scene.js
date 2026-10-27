// Concept A: a false-colour infrared scene (NIR-R-G composite), drawn procedurally for the mockups.
// Vegetation red, water deep teal, soil ochre, city cyan-grey, a salt flat near white.
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { let t = 0, a = 0.5; for (let i = 0; i < 5; i++) { t += a * vnoise(x, y, s + i); x *= 2.03; y *= 2.03; a *= 0.5; } return t / 0.97; }
const CLASS = {
  forest: [214, 24, 52], crop: [255, 58, 82], sparse: [178, 78, 92], soil: [217, 162, 91], fallow: [190, 140, 120],
  urban: [126, 176, 190], water: [9, 38, 46], shallow: [24, 104, 120], salt: [222, 236, 236], road: [196, 214, 220],
};
function classify(x, y, seeds) {
  const W = fbm(x / 70, y / 70, 7);
  const lake = fbm(x / 210 + 3, y / 210, 11) + (x / 1400) - 0.06;
  if (lake > 0.6) return "water";
  if (lake > 0.575) return "shallow";
  const city = fbm(x / 90, y / 90, 31) - (y / 2600);
  if (city > 0.63) return (hash(Math.floor(x / 3), Math.floor(y / 3), 8) > 0.55 ? "road" : "urban");
  // fields: nearest seed (Voronoi parcels), rotated slightly like the Medjerda plain
  let best = 1e9, k = 0;
  for (let i = 0; i < seeds.length; i++) { const dx = (x - seeds[i][0]) * 0.8 + (y - seeds[i][1]) * 0.35, dy = (y - seeds[i][1]) * 1.5 - (x - seeds[i][0]) * 0.2; const d = dx * dx + dy * dy; if (d < best) { best = d; k = i; } }
  const r = hash(k, 1, 5);
  if (W > 0.7) return "forest";
  return r < 0.3 ? "crop" : r < 0.46 ? "forest" : r < 0.6 ? "sparse" : r < 0.8 ? "soil" : "fallow";
}
function drawScene(canvas, opts = {}) {
  const dpr = 2, w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d"); const img = ctx.createImageData(canvas.width, canvas.height);
  const seeds = []; for (let i = 0; i < 420; i++) seeds.push([hash(i, 2, 9) * w * 1.1, hash(i, 3, 9) * h * 1.1]);
  const block = opts.block || 1; // classified look: big pixels
  const fade = opts.mono || 0;
  for (let py = 0; py < canvas.height; py++) for (let px = 0; px < canvas.width; px++) {
    const bx = Math.floor(px / (block * dpr)) * block, by = Math.floor(py / (block * dpr)) * block;
    const x = block > 1 ? bx : px / dpr, y = block > 1 ? by : py / dpr;
    const c = classify(x, y, seeds); let [r, g, b] = CLASS[c];
    if (!opts.flat) { const n = (fbm(x / 6, y / 6, 41) - 0.5) * 64; const t = (hash(Math.floor(x * 2), Math.floor(y * 2), 3) - 0.5) * 34; r += n + t; g += (n + t) * 0.5; b += (n + t) * 0.55; }
    if (fade) { const l = 0.3 * r + 0.59 * g + 0.11 * b; r = r + (l - r) * fade; g = g + (l - g) * fade; b = b + (l - b) * fade; }
    const i = (py * canvas.width + px) * 4; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // roads: two straight-ish lines
  ctx.strokeStyle = "rgba(170,205,212,.85)"; ctx.lineWidth = 1.4 * dpr; ctx.beginPath();
  ctx.moveTo(0, h * 0.62 * dpr); ctx.bezierCurveTo(w * 0.4 * dpr, h * 0.55 * dpr, w * 0.6 * dpr, h * 0.7 * dpr, w * dpr, h * 0.48 * dpr);
  ctx.moveTo(w * 0.28 * dpr, 0); ctx.lineTo(w * 0.36 * dpr, h * dpr); ctx.stroke();
}
