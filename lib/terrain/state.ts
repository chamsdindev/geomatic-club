import { CLUB_SEED } from "./field";

export type Bump = { x: number; y: number; s: number; r: number; target: number; pointer: number };

/**
 * Everything the terrain shows, as plain numbers. Components and the intro write here; the
 * renderer reads it every frame. No React state: nothing re-renders for a frame.
 */
export const terrain = {
  zoom: 1,
  scan: 1,
  pixel: 1,
  vector: 1,
  seedA: CLUB_SEED,
  seedB: CLUB_SEED,
  seedMix: 0,
  /** Default light: the cartographic convention, from the north-west, 45° high. */
  sun: { azimuth: 315, altitude: 45 },
  dim: 0,
  summit: 0,
  fix: { x: 0, y: 0 },
  ripple: { x: 0, y: 0, start: -1, amplitude: 0 },
  parallax: { x: 0, y: 0 },
  bumps: Array.from({ length: 4 }, (): Bump => ({ x: 0, y: 0, s: 0, r: 70, target: 0, pointer: -1 })),
  /** The drift clock stops while frozen (the success's silence). */
  frozen: false,
  /** Reduced motion: one still frame, drawn again only when something changes. */
  still: false,
  clock: 0,
  dirty: true,
  activeUntil: 0,
};

export type Terrain = typeof terrain;

/** Ask for full frame rate for a while (an animation, a finger). */
export function wake(ms = 600) {
  terrain.dirty = true;
  terrain.activeUntil = Math.max(terrain.activeUntil, performance.now() + ms);
}

type FrameListener = (t: Terrain, now: number) => void;
const listeners = new Set<FrameListener>();

/** Run something on the terrain's own frame (the graticule, the scale bar, the readout). */
export function onFrame(fn: FrameListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitFrame(now: number) {
  for (const fn of listeners) fn(terrain, now);
}

/** The fix point follows the map window as the page scrolls. */
export function setFix(x: number, y: number) {
  if (x !== terrain.fix.x || y !== terrain.fix.y) {
    terrain.fix.x = x;
    terrain.fix.y = y;
    terrain.dirty = true;
  }
}

/**
 * Without WebGL there is no renderer to drive the frame: this bare loop keeps the graticule,
 * the scale bar and the readout alive. Returns the cleanup.
 */
export function startBareLoop(): () => void {
  let raf = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    emitFrame(now);
  };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
