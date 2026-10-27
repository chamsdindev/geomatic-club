/**
 * The receiver's sounds, synthesised with the Web Audio API (no files, no library). Quiet and instrument-like:
 * master gain 0.25 through a low-pass and a compressor, a short synthetic reverb, and a minimum gap per sound
 * so nothing piles up. Browsers refuse audio before a gesture: the context starts on the first tap or key.
 */
import { STORAGE } from "./config";

type Ctx = { ac: AudioContext; out: GainNode; verb: GainNode };
let ctx: Ctx | null = null;
let enabled = true;
const lastPlayed: Record<string, number> = {};

function readPreference() {
  try {
    const v = localStorage.getItem(STORAGE.sound);
    if (v === "off") enabled = false;
  } catch {}
}

function build(): Ctx | null {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ac = new AC();
  const out = ac.createGain(); out.gain.value = 0.25;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
  out.connect(lp).connect(comp).connect(ac.destination);
  // reverb: a decaying noise impulse, 1.1 s
  const len = Math.floor(ac.sampleRate * 1.1); const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  const conv = ac.createConvolver(); conv.buffer = ir;
  const verb = ac.createGain(); verb.gain.value = 0.6; verb.connect(conv).connect(out);
  return { ac, out, verb };
}

/**
 * Wakes the audio inside a gesture. iPhones only count a tap's end (touchend, pointerup, click) or a key as a
 * gesture, and they suspend the context again after a call, the lock screen or a while in the background: so this
 * runs on every gesture, not once, and does nothing while the sound is already running.
 */
function wake() {
  if (!enabled) return;
  if (ctx?.ac.state === "closed") ctx = null;
  ctx ??= build();
  if (!ctx || ctx.ac.state === "running") return;
  void ctx.ac.resume().catch(() => {});
  // a one-sample silent buffer started inside the gesture completes the unlock on iOS
  const src = ctx.ac.createBufferSource();
  src.buffer = ctx.ac.createBuffer(1, 1, 22050);
  src.connect(ctx.ac.destination);
  src.start(0);
}

/** Call once on the client: reads the preference and wakes the sound on every tap or key. */
export function initSound() {
  readPreference();
  listeners.forEach((fn) => fn());
  for (const type of ["pointerdown", "pointerup", "touchend", "click", "keydown"]) addEventListener(type, wake, { passive: true, capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.ac.state !== "running") void ctx.ac.resume().catch(() => {});
  });
}

const listeners = new Set<() => void>();
/** For useSyncExternalStore: the toggle re-renders when the preference changes. */
export function subscribeSound(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const soundEnabled = () => enabled;
export function setSoundEnabled(v: boolean) {
  enabled = v;
  listeners.forEach((fn) => fn());
  try { localStorage.setItem(STORAGE.sound, v ? "on" : "off"); } catch {}
  if (v) wake();
}

function play(name: string, minGapMs: number, fn: (c: Ctx, t: number) => void) {
  if (!enabled || !ctx) return;
  const now = performance.now();
  if (now - (lastPlayed[name] ?? 0) < minGapMs) return;
  lastPlayed[name] = now;
  const c = ctx;
  if (c.ac.state === "running") { fn(c, c.ac.currentTime + 0.005); return; }
  // suspended or interrupted (iOS): ask again, then play if it came back within a beat
  void c.ac.resume().then(() => { if (c.ac.state === "running" && performance.now() - now < 300) fn(c, c.ac.currentTime + 0.005); }).catch(() => {});
}

type ToneOpts = { type?: OscillatorType; gain?: number; attack?: number; release?: number; detune?: number; glide?: number; verb?: number };
function tone(c: Ctx, freq: number, t: number, dur: number, o: ToneOpts = {}) {
  const osc = c.ac.createOscillator(); const g = c.ac.createGain();
  osc.type = o.type ?? "sine"; osc.frequency.setValueAtTime(freq, t); osc.detune.value = o.detune ?? 0;
  if (o.glide) osc.frequency.exponentialRampToValueAtTime(freq * o.glide, t + dur);
  const a = o.attack ?? 0.004, peak = o.gain ?? 0.3, rel = o.release ?? dur;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel);
  osc.connect(g).connect(c.out);
  if (o.verb) { const s = c.ac.createGain(); s.gain.value = o.verb; g.connect(s).connect(c.verb); }
  osc.start(t); osc.stop(t + a + rel + 0.05);
}
function noise(c: Ctx, t: number, dur: number, type: BiquadFilterType, freq: number, gain: number, q = 1) {
  const len = Math.max(1, Math.floor(c.ac.sampleRate * dur)); const buf = c.ac.createBuffer(1, len, c.ac.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.ac.createBufferSource(); src.buffer = buf;
  const f = c.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.ac.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(c.out); src.start(t);
}

export const sound = {
  /** A satellite acquired: a soft, short tick. */
  tick: () => play("tick", 45, (c, t) => { noise(c, t, 0.003, "bandpass", 4200, 0.5, 2); tone(c, 1800, t, 0.025, { gain: 0.08 }); }),
  /** The status climbs one step: a short two-tone beep. */
  stepUp: () => play("step", 160, (c, t) => { tone(c, 880, t, 0.07, { gain: 0.12 }); tone(c, 1175, t + 0.11, 0.07, { gain: 0.12 }); }),
  /** All four fields valid: a rising two-note chime. */
  chime: () => play("chime", 600, (c, t) => { tone(c, 1319, t, 0.6, { gain: 0.14, attack: 0.006, verb: 0.35 }); tone(c, 1760, t + 0.09, 0.6, { gain: 0.14, attack: 0.006, verb: 0.35 }); }),
  /** « Envoyer » pressed: a tactile click. */
  click: () => play("click", 80, (c, t) => { noise(c, t, 0.004, "highpass", 2500, 0.6); tone(c, 140, t, 0.03, { gain: 0.25 }); }),
  /** Sending: a GPS ping with each pulse. */
  ping: () => play("ping", 300, (c, t) => tone(c, 1046, t, 0.7, { gain: 0.12, glide: 0.98, verb: 0.4 })),
  /** FIX: the receiver's crisp double beep. */
  fix: () => play("fix", 400, (c, t) => {
    for (const [f, dt] of [[1568, 0], [2093, 0.09]] as const) { tone(c, f, t + dt, 0.06, { gain: 0.2 }); tone(c, f * 3, t + dt, 0.05, { gain: 0.03 }); }
  }),
  /** The fiche printing: soft rhythmic ticks (n of them, every 70 ms). */
  printer: (n = 14) => play("printer", 500, (c, t) => { for (let i = 0; i < n; i++) noise(c, t + i * 0.07, 0.006, "bandpass", i % 2 ? 1300 : 1100, 0.18, 3); }),
  /** Error: a short descending, slightly detuned tone. */
  error: () => play("error", 400, (c, t) => { tone(c, 880, t, 0.12, { gain: 0.12, attack: 0.02 }); tone(c, 659, t + 0.13, 0.16, { gain: 0.12, attack: 0.02, detune: -12 }); }),
};
