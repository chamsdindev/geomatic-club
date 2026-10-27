/**
 * The site's motion vocabulary (DESIGN.md §6): easings, a spring, and a small timeline that
 * can jump to its last frame. The only file with motion numbers in it.
 */

export type Ease = (t: number) => number;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) return sampleY(t);
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= err / slope;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

/** A spring from 0 to 1, simulated once and played back as an easing over its own duration. */
export function spring(stiffness: number, damping: number, mass = 1): { ease: Ease; duration: number } {
  const dt = 1 / 240;
  let x = 0;
  let v = 0;
  let calm = 0;
  const samples = [0];
  for (let i = 0; i < 240 * 3; i++) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    samples.push(x);
    calm = Math.abs(x - 1) < 0.0006 && Math.abs(v) < 0.006 ? calm + 1 : 0;
    if (calm > 12) break;
  }
  samples[samples.length - 1] = 1;
  const n = samples.length - 1;
  return {
    duration: n * dt * 1000,
    ease: (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const f = t * n;
      const i = Math.floor(f);
      return samples[i] + (samples[i + 1] - samples[i]) * (f - i);
    },
  };
}

export const linear: Ease = (t) => t;
/** Lines drawing, labels arriving: a fast start and a decisive stop. */
export const survey = cubicBezier(0.16, 1, 0.3, 1);
/** Zoom and camera moves. */
export const pan = cubicBezier(0.65, 0, 0.35, 1);
/** The pin's drop: gravity. */
export const fall = cubicBezier(0.55, 0, 1, 0.45);
/** Locks, stamps, presses. */
export const lock = spring(600, 32);
/** The north arrow settling, a little looser. */
export const needle = spring(260, 14);

export const CSS_EASE = {
  survey: "cubic-bezier(0.16, 1, 0.3, 1)",
  pan: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Track = { at: number; dur: number; ease: Ease; fn: (v: number, ms: number) => void; done: boolean };
type Cue = { at: number; fn: () => void; onSkip: boolean; fired: boolean };

/**
 * Tweens and cues on one rAF clock. `skip()` fires the cues marked `onSkip`, then sets every
 * track to its last frame in the order they would have ended, so the last writer wins.
 */
export class Timeline {
  private tracks: Track[] = [];
  private cues: Cue[] = [];
  private raf = 0;
  private start = 0;
  private resolve: (() => void) | null = null;
  private finished = false;
  duration = 0;

  tween(at: number, dur: number, fn: (v: number, ms: number) => void, ease: Ease = linear) {
    this.tracks.push({ at, dur, ease, fn, done: false });
    this.duration = Math.max(this.duration, at + dur);
    return this;
  }

  cue(at: number, fn: () => void, onSkip = false) {
    this.cues.push({ at, fn, onSkip, fired: false });
    this.duration = Math.max(this.duration, at);
    return this;
  }

  play(): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      const step = (now: number) => {
        if (!this.start) this.start = now;
        const t = now - this.start;
        this.apply(t);
        if (t >= this.duration) this.finish();
        else this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  private apply(t: number) {
    for (const c of this.cues) {
      if (!c.fired && t >= c.at) {
        c.fired = true;
        c.fn();
      }
    }
    for (const k of this.tracks) {
      if (k.done || t < k.at) continue;
      const p = k.dur <= 0 ? 1 : Math.min(1, (t - k.at) / k.dur);
      k.fn(k.ease(p), t - k.at);
      if (p >= 1) k.done = true;
    }
  }

  skip() {
    if (this.finished) return;
    cancelAnimationFrame(this.raf);
    for (const c of this.cues) {
      if (!c.fired) {
        c.fired = true;
        if (c.onSkip) c.fn();
      }
    }
    const pending = this.tracks.filter((k) => !k.done).sort((a, b) => a.at + a.dur - (b.at + b.dur));
    for (const k of pending) {
      k.fn(k.ease(1), k.dur);
      k.done = true;
    }
    this.finish();
  }

  /** Stop without settling (the tracks stay where they are, the promise never resolves). */
  cancel() {
    this.finished = true;
    cancelAnimationFrame(this.raf);
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    cancelAnimationFrame(this.raf);
    this.resolve?.();
  }
}
