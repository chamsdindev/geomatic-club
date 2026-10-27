/**
 * The terrain's height field, in TypeScript. The GLSL in `shader.ts` is the same function,
 * line for line: the lattice hash works on 32-bit integers on both sides (WebGL2 `uint`,
 * `Math.imul` here), so a seed gives the same hills in the shader, in the SVG fallback and in
 * the share image.
 */

/** CSS pixels per noise unit at zoom 1. */
export const UNIT_PX = 240;
/** Contour lines across the whole height range (0..1). */
export const LEVELS = 34;
/** Every fifth contour is an index contour (thicker, darker). */
export const INDEX_EVERY = 5;
/** Below this height the terrain is water. */
export const WATER = 0.3;
/** The club's own terrain. */
export const CLUB_SEED = 0x6c0b1e;
/** How fast the club's terrain drifts, in noise units per second. */
export const DRIFT = { x: 0.004, y: 0.0023 } as const;
/** The summit raised under a member's pin: height added, radius in noise units. */
export const SUMMIT = { height: 0.62, radius: 0.36 } as const;

export function pcg(v: number): number {
  const s = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
  const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0;
  return ((w >>> 22) ^ w) >>> 0;
}

function lattice(x: number, y: number, seed: number): number {
  return pcg((Math.imul(x, 1597334677) ^ pcg((y ^ seed) >>> 0)) >>> 0) / 4294967295;
}

function valueNoise(px: number, py: number, seed: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = lattice(ix, iy, seed);
  const b = lattice(ix + 1, iy, seed);
  const c = lattice(ix, iy + 1, seed);
  const d = lattice(ix + 1, iy + 1, seed);
  const top = a + (b - a) * ux;
  const bottom = c + (d - c) * ux;
  return top + (bottom - top) * uy;
}

/** Five octaves, rotated between octaves (the same matrix as the GLSL `mat2(0.8,-0.6,0.6,0.8)`). */
export function fbm(px: number, py: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let x = px;
  let y = py;
  for (let i = 0; i < 5; i++) {
    sum += amp * valueNoise(x, y, (seed + i * 101) >>> 0);
    const rx = 0.8 * x + 0.6 * y;
    const ry = -0.6 * x + 0.8 * y;
    x = rx * 2.03 + 17.1;
    y = ry * 2.03 + 9.3;
    amp *= 0.5;
  }
  return sum / 0.96875;
}

/**
 * A member's terrain around their summit, in noise units from the fix point (the summit sits
 * at 0,0). Used by the share image and the sheet's thumbnail; the shader does the same with
 * `uSeedMix` = 1.
 */
export function personalHeight(ux: number, uy: number, seed: number): number {
  const d2 = (ux * ux + uy * uy) / (SUMMIT.radius * SUMMIT.radius);
  return fbm(ux, uy, seed) + SUMMIT.height * Math.exp(-d2);
}

/** The club's terrain at rest (no drift), for the static fallback. */
export function clubHeight(ux: number, uy: number): number {
  return fbm(ux, uy, CLUB_SEED);
}

/** A 32-bit seed from any text (FNV-1a, then one PCG round to spread it). */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (const ch of text.normalize("NFC")) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return pcg(h >>> 0);
}
