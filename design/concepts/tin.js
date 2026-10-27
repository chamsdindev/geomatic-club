// Concept B: Djebel Boukornine ("the one with two horns") as a TIN, drawn in canvas 2D for the mockups.
// The real site will use a heightmap baked from AWS Terrain Tiles; this stand-in only mimics its shape.
function hsh(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vn(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hsh(ix, iy), b = hsh(ix + 1, iy), c = hsh(ix, iy + 1), d = hsh(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fb(x, y) { let t = 0, a = .5; for (let i = 0; i < 4; i++) { t += a * vn(x, y); x *= 2.1; y *= 2.1; a *= .5; } return t; }
const g = (x, y, cx, cy, s) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
function height(x, y) {
  let h = 0.42 * g(x, y, 0, 0, 0.5) + 1.0 * g(x, y, -0.2, 0.04, 0.17) + 0.86 * g(x, y, 0.17, -0.03, 0.16) + 0.25 * g(x, y, 0, 0.0, 0.25);
  h += (fb(x * 3 + 5, y * 3 + 2) - 0.47) * 0.16;
  return Math.max(0, h);
}
const PEAK = [-0.2, 0.04];
function renderTIN(canvas, o) {
  const dpr = 2, W = canvas.clientWidth, H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
  const N = o.n || 34, yaw = o.yaw ?? 0.55, S = o.scale || 210, HS = o.hs || 150, cx = o.cx ?? W / 2, cy = o.cy ?? H * 0.62, tilt = o.tilt || 0.5;
  const span = o.span || 1.2, ox = o.ox || 0, oy = o.oy || 0;
  const P = (x, y) => { const h = height(x, y); const rx = x - ox, ry = y - oy; const sx = rx * Math.cos(yaw) - ry * Math.sin(yaw); const d = rx * Math.sin(yaw) + ry * Math.cos(yaw); return { x: cx + sx * S, y: cy + d * S * tilt - h * HS, d, h, wx: x, wy: y }; };
  const pts = []; for (let j = 0; j <= N; j++) { pts.push([]); for (let i = 0; i <= N; i++) { const jit = (k) => (hsh(i * 7 + k, j * 13) - .5) * (span * 2 / N) * 0.55; const x = -span + (i / N) * span * 2 + (i > 0 && i < N ? jit(1) : 0), y = -span + (j / N) * span * 2 + (j > 0 && j < N ? jit(2) : 0); pts[j].push(P(x, y)); } }
  const tris = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1]; if ((i + j) % 2) { tris.push([a, b, d], [a, d, c]); } else { tris.push([a, b, c], [b, d, c]); } }
  tris.sort((t1, t2) => (t1[0].d + t1[1].d + t1[2].d) - (t2[0].d + t2[1].d + t2[2].d));
  const L = [-0.55, 0.45, 0.7]; const ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
  const low = [22, 66, 56], high = [216, 211, 196], dark = [13, 36, 32];
  for (const t of tris) {
    const [a, b, c] = t; const ux = b.wx - a.wx, uy = b.wy - a.wy, uz = (b.h - a.h) * 1.4, vx = c.wx - a.wx, vy = c.wy - a.wy, vz = (c.h - a.h) * 1.4;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; } const nl = Math.hypot(nx, ny, nz);
    const lit = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nl); const hh = (a.h + b.h + c.h) / 3; const slope = 1 - nz / nl;
    const rock = Math.min(1, Math.max(0, hh * 1.25 + slope * 1.6 - 0.35));
    const base = low.map((v, k) => v + (high[k] - v) * rock); const sh = 0.38 + lit * 0.75;
    const col = base.map((v, k) => Math.round(Math.min(255, dark[k] + (v - dark[k]) * sh)));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    ctx.fillStyle = `rgb(${col})`; ctx.fill(); ctx.strokeStyle = o.edges || "rgba(13,36,32,.38)"; ctx.lineWidth = 0.5; ctx.stroke();
  }
  return P; // projector, to place jalons and flags
}
function jalon(ctx, x, y, h, ghost) {
  const seg = h / 5; for (let i = 0; i < 5; i++) { ctx.fillStyle = ghost ? "transparent" : (i % 2 ? "#F5F3EC" : "#F25E45"); ctx.strokeStyle = ghost ? "rgba(245,243,236,.6)" : "transparent"; ctx.lineWidth = 1; ctx.fillRect(x - 1.5, y - h + i * seg, 3, seg); if (ghost) ctx.strokeRect(x - 1.5, y - h + i * seg, 3, seg); }
  ctx.fillStyle = ghost ? "rgba(245,243,236,.5)" : "#F5F3EC"; ctx.beginPath(); ctx.ellipse(x, y, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
}
