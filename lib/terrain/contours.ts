import { INDEX_EVERY, LEVELS, WATER } from "./field";

export type Contour = {
  /** Height of the line (0..1). */
  level: number;
  kind: "minor" | "index" | "water" | "shore";
  /** SVG path data. */
  d: string;
};

/**
 * Contour lines of a height field by marching squares, joined into polylines so the SVG stays
 * small. `heightAt` takes CSS pixels inside the `width` × `height` box.
 */
export function traceContours(
  width: number,
  height: number,
  step: number,
  heightAt: (x: number, y: number) => number,
): Contour[] {
  const nx = Math.ceil(width / step) + 1;
  const ny = Math.ceil(height / step) + 1;
  const grid = new Float32Array(nx * ny);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const v = heightAt(i * step, j * step);
      grid[j * nx + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const out: Contour[] = [];
  const first = Math.ceil(min * LEVELS);
  const last = Math.floor(max * LEVELS);
  for (let k = first; k <= last; k++) {
    const level = k / LEVELS;
    if (Math.abs(level - WATER) < 1e-6) continue;
    const d = trace(grid, nx, ny, step, level);
    if (!d) continue;
    const kind = level < WATER ? "water" : k % INDEX_EVERY === 0 ? "index" : "minor";
    out.push({ level, kind, d });
  }
  if (min < WATER && max > WATER) {
    const d = trace(grid, nx, ny, step, WATER);
    if (d) out.push({ level: WATER, kind: "shore", d });
  }
  return out;
}

// Edges of a cell, as pairs of sides: L(eft), B(ottom), R(ight), T(op).
type Side = "L" | "B" | "R" | "T";
const CASES: Record<number, [Side, Side][]> = {
  1: [["L", "B"]],
  2: [["B", "R"]],
  3: [["L", "R"]],
  4: [["T", "R"]],
  6: [["T", "B"]],
  7: [["L", "T"]],
  8: [["L", "T"]],
  9: [["T", "B"]],
  11: [["T", "R"]],
  12: [["L", "R"]],
  13: [["B", "R"]],
  14: [["L", "B"]],
};

function trace(grid: Float32Array, nx: number, ny: number, step: number, level: number): string {
  const at = (i: number, j: number) => grid[j * nx + i];
  // Edge ids: horizontal edge from (i,j) to (i+1,j) = 2·(j·nx+i); vertical (i,j)→(i,j+1) = +1.
  const hEdge = (i: number, j: number) => (j * nx + i) * 2;
  const vEdge = (i: number, j: number) => (j * nx + i) * 2 + 1;
  const segments: number[] = [];

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = at(i, j);
      const tr = at(i + 1, j);
      const br = at(i + 1, j + 1);
      const bl = at(i, j + 1);
      const c = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const edge = (s: Side) =>
        s === "T" ? hEdge(i, j) : s === "B" ? hEdge(i, j + 1) : s === "L" ? vEdge(i, j) : vEdge(i + 1, j);
      let pairs = CASES[c];
      if (c === 5 || c === 10) {
        const centreHigh = (tl + tr + br + bl) / 4 > level;
        const highJoined = c === 5 ? centreHigh : !centreHigh;
        pairs = highJoined ? [["L", "T"], ["B", "R"]] : [["L", "B"], ["T", "R"]];
      }
      for (const [a, b] of pairs) segments.push(edge(a), edge(b));
    }
  }
  if (segments.length === 0) return "";

  const point = (id: number): [number, number] => {
    const cell = id >> 1;
    const i = cell % nx;
    const j = (cell - i) / nx;
    if ((id & 1) === 0) {
      const a = at(i, j);
      const b = at(i + 1, j);
      return [(i + (level - a) / (b - a)) * step, j * step];
    }
    const a = at(i, j);
    const b = at(i, j + 1);
    return [i * step, (j + (level - a) / (b - a)) * step];
  };

  const byEdge = new Map<number, number[]>();
  const segCount = segments.length / 2;
  for (let s = 0; s < segCount; s++) {
    for (const e of [segments[2 * s], segments[2 * s + 1]]) {
      const list = byEdge.get(e);
      if (list) list.push(s);
      else byEdge.set(e, [s]);
    }
  }
  const used = new Uint8Array(segCount);
  const next = (edge: number): number => {
    for (const s of byEdge.get(edge) ?? []) if (!used[s]) return s;
    return -1;
  };
  const walk = (from: number, chain: number[]) => {
    let edge = from;
    for (;;) {
      const s = next(edge);
      if (s < 0) return;
      used[s] = 1;
      edge = segments[2 * s] === edge ? segments[2 * s + 1] : segments[2 * s];
      chain.push(edge);
    }
  };

  const r = (n: number) => Math.round(n * 10) / 10;
  let d = "";
  for (let s = 0; s < segCount; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const forward = [segments[2 * s], segments[2 * s + 1]];
    walk(forward[1], forward);
    const backward: number[] = [];
    walk(forward[0], backward);
    const chain = [...backward.reverse(), ...forward];
    chain.forEach((e, n) => {
      const [x, y] = point(e);
      d += `${n === 0 ? "M" : "L"}${r(x)} ${r(y)}`;
    });
  }
  return d;
}
