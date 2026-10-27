"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";
import { copy } from "@/lib/copy";
import { STORAGE } from "@/lib/config";
import { frMetres, frOne, frPrecision } from "@/lib/point";
import { sound } from "@/lib/sound";
import { tunisNow } from "@/lib/time";
import { MARK } from "@/components/brand/paths";
import { GROUPS, LEVELS, SKY } from "./sky";

gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin, ScrollTrigger, SplitText);
CustomEase.create("settle", "M0,0 C0.16,0.9 0.3,1 1,1");

export type MotionApi = {
  /** Field k became valid or not; `valid` is how many fields are valid now. */
  field(k: number, ok: boolean, valid: number): void;
  /** Field k has the focus (its satellites blink: the receiver listens), or none. */
  listen(k: number | null): void;
  /** The form was sent incomplete. */
  missing(text: string): void;
  /** « Envoyer »: the satellites converge, a ping per pulse. */
  sending(): void;
  /** The server answered: silence, FIX, the record, then the fiche prints. Resolves once printed. */
  fix(ref: string): Promise<void>;
  /** The server didn't answer: back to Autonome, data kept. */
  fail(): void;
  /** « Nouvelle inscription »: everything in reverse. */
  reset(): Promise<void>;
};

const STATE_CHARS = "ABCDEFGHIJKLMNOPRSTUVXYZ";

export default function Motion({ apiRef, rootRef, initial }: { apiRef: RefObject<MotionApi | null>; rootRef: RefObject<HTMLDivElement | null>; initial: () => boolean[] }) {
  useGSAP((_, contextSafe) => {
    const R = rootRef.current;
    if (!R || !contextSafe) return;
    const html = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = (s: number) => (reduce ? 0 : s);
    const one = <T extends Element = HTMLElement>(s: string) => R.querySelector<T>(s)!;
    const all = <T extends Element = HTMLElement>(s: string) => Array.from(R.querySelectorAll<T>(s));
    const lcd = one("[data-lcd]"), bodyEl = one("[data-body]"), boot = one("[data-boot]");
    const stateEl = one("[data-state]"), pdopEl = one("[data-pdop]"), precEl = one("[data-prec]"), msgEl = one("[data-msg]");
    const satnEl = one("[data-satn]"), epochEl = one("[data-epoch]"), fixEl = one("[data-fix]");
    const steps = all("[data-step]"), rods = all("[data-rod]"), sats = all<SVGGElement>("[data-sat]");
    const objective = one("[data-objective]"), mid = one(".mid"), slot = one("[data-slot]"), form = one("form");

    // ---------- writing on the LCD (always ends on the exact final string)
    const write = (el: Element, text: string, chars = "lowerCase") => {
      gsap.killTweensOf(el);
      if (reduce) { el.textContent = text; return; }
      gsap.to(el, { duration: 0.45, scrambleText: { text, chars, speed: 0.7 }, onComplete: () => { el.textContent = text; } });
    };
    const read = { pdop: LEVELS[0].pdop, h: LEVELS[0].h, v: LEVELS[0].v, n: GROUPS[0].length };
    const paint = () => {
      pdopEl.textContent = `PDOP ${frOne(read.pdop)}`;
      precEl.innerHTML = `H ${frMetres(read.h)}<br>V ${frMetres(read.v)}`;
      satnEl.textContent = String(Math.round(read.n));
    };

    // ---------- satellites
    const acquire = (i: number, on: boolean, quiet = false) => {
      const g = sats[i];
      if (g.classList.contains("on") === on) return;
      g.classList.toggle("on", on);
      gsap.killTweensOf(g, "opacity");
      gsap.set(g, { opacity: 1 });
      if (on) {
        if (!quiet) sound.tick();
        gsap.fromTo(g.querySelector("path"), { scale: 1.9, transformOrigin: "50% 50%" }, { scale: 1, duration: d(0.35), ease: "back.out(3)" });
      }
    };
    const group = (k: number, on: boolean, quiet = false) =>
      GROUPS[k].forEach((i, j) => (quiet || reduce ? acquire(i, on, true) : gsap.delayedCall(j * 0.09, () => acquire(i, on))));

    // ---------- the status: readouts, ladder, ranging rod, the key's target
    let level = 0;
    const setLevel = (n: number, quiet = false) => {
      const L = LEVELS[n], prev = LEVELS[level];
      gsap.to(read, { pdop: L.pdop, h: L.h, v: L.v, n: GROUPS.slice(0, n + 1).flat().length, duration: d(0.7), ease: "power2.out", onUpdate: paint });
      if (stateEl.textContent !== L.label) write(stateEl, L.label, STATE_CHARS);
      steps.forEach((s, k) => {
        s.classList.toggle("on", k <= L.state);
        gsap.to(s, { scaleX: k <= L.state ? 1 : 0, duration: d(0.35), ease: "steps(6)" });
        s.parentElement?.toggleAttribute("aria-current", k === L.state);
      });
      gsap.to(objective, { scale: n === 4 ? 1 : 0, duration: d(0.3), ease: "back.out(3)" });
      if (!quiet && L.state > prev.state) sound.stepUp();
      if (!quiet && n === 4 && level < 4) gsap.delayedCall(0.25, sound.chime);
      level = n;
    };
    const setRods = (valid: boolean[]) => rods.forEach((r, k) => gsap.to(r, { scaleX: valid[k] ? 1 : 0, duration: d(0.4), ease: "steps(5)" }));
    const validNow = initial();

    // ---------- the clock and the bubble level
    const tick = () => { const t = tunisNow().time; one("[data-clock]").textContent = t; };
    tick();
    const clock = setInterval(tick, 15_000);
    const bubble = one("[data-bubble]");
    const bx = gsap.quickTo(bubble, "x", { duration: 0.5, ease: "power3.out" }), by = gsap.quickTo(bubble, "y", { duration: 0.5, ease: "power3.out" });
    const tilt = gsap.utils.pipe(gsap.utils.mapRange(-20, 20, -24, 24), gsap.utils.clamp(-24, 24));
    const onOrient = (e: DeviceOrientationEvent) => { if (e.gamma != null && e.beta != null) { bx(tilt(e.gamma)); by(tilt(e.beta - 40)); } };
    const onPointer = (e: PointerEvent) => { if (e.pointerType === "mouse") { bx(tilt((e.clientX / innerWidth - 0.5) * 40)); by(tilt((e.clientY / innerHeight - 0.5) * 40)); } };
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    const askTilt = () => { DOE?.requestPermission?.().then((r) => r === "granted" && addEventListener("deviceorientation", onOrient)).catch(() => {}); };
    if (!reduce) {
      if (DOE?.requestPermission) addEventListener("pointerdown", askTilt, { once: true });
      else addEventListener("deviceorientation", onOrient);
      addEventListener("pointermove", onPointer, { passive: true });
    }

    // ---------- boot (≤ 2.4 s, once per tab, skippable): the G resolves from pixels to vector, then the sky
    const settled = () => {
      validNow.forEach((ok, k) => ok && group(k + 1, true, true));
      setLevel(validNow.filter(Boolean).length, true);
      setRods(validNow);
    };
    const bootTl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    if (html.dataset.boot !== "skip" && !reduce) {
      const cells = all("[data-boot-cells] rect").sort((a, b) => +a.getAttribute("y")! - +b.getAttribute("y")! || +a.getAttribute("x")! - +b.getAttribute("x")!);
      const right = all<SVGPathElement>("[data-boot-right]").sort((a, b) => b.getAttribute("d")!.length - a.getAttribute("d")!.length); // [bottom, top]
      const vec = (n: string) => one<SVGPathElement>(`[data-boot-vec="${n}"]`);
      gsap.set([vec("top"), vec("bottom"), vec("bar"), vec("point")], { autoAlpha: 0 });
      bootTl
        .addLabel("power", 0)
        .fromTo(lcd, { backgroundColor: "#56604F" }, { backgroundColor: "#DCE3D5", duration: 0.06 }, "power")
        .to(lcd, { backgroundColor: "#56604F", duration: 0.05 }, "power+=0.08")
        .to(lcd, { backgroundColor: "#DCE3D5", duration: 0.08 }, "power+=0.15")
        .addLabel("pixels", 0.25)
        .from(cells, { autoAlpha: 0, duration: 0.01, stagger: 0.45 / cells.length, ease: "none" }, "pixels")
        .from(right, { autoAlpha: 0, duration: 0.01, stagger: 0.12 }, "pixels+=0.3")
        .addLabel("vector", 0.8)
        .to(right[0], { morphSVG: { shape: MARK.bottom, type: "rotational" }, duration: 0.5, ease: "power3.inOut" }, "vector")
        .to(right[1], { morphSVG: MARK.top, duration: 0.5, ease: "power3.inOut" }, "vector")
        .fromTo([vec("bar"), vec("point")], { autoAlpha: 0, scale: 0, transformOrigin: "100% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)", stagger: 0.08 }, "vector+=0.35")
        .addLabel("sky", 1.55)
        .to(boot, { autoAlpha: 0, scale: 0.6, duration: 0.35, ease: "power2.in" }, "sky")
        .fromTo(bodyEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, "sky+=0.2")
        .from(all("[data-ring]"), { drawSVG: 0, duration: 0.55, stagger: 0.07, ease: "power3.inOut" }, "sky+=0.2")
        .from(all("[data-axis]"), { drawSVG: "50% 50%", duration: 0.4 }, "sky+=0.3")
        .from(GROUPS[0].map((i) => sats[i]), { autoAlpha: 0, scale: 1.8, transformOrigin: "50% 50%", duration: 0.3, stagger: 0.08, ease: "back.out(3)" }, "sky+=0.45")
        .add(() => write(stateEl, LEVELS[0].label, STATE_CHARS), "sky+=0.35")
        .addLabel("done", 2.4);
      const end = () => { if (bootTl.progress() < 1) bootTl.progress(1); };
      const key = (e: KeyboardEvent) => { if (["Escape", "Enter", " "].includes(e.key)) end(); };
      lcd.addEventListener("pointerdown", end);
      addEventListener("keydown", key, { once: true });
      bootTl.eventCallback("onComplete", () => {
        html.dataset.boot = "done";
        try { sessionStorage.setItem(STORAGE.boot, "1"); } catch {}
        lcd.removeEventListener("pointerdown", end);
        removeEventListener("keydown", key);
        settled();
      });
      bootTl.play();
    } else {
      html.dataset.boot = "done";
      settled();
    }

    // ---------- while filling: the receiver listens to the field that has the focus
    let listening: gsap.core.Tween | null = null;
    const finishBoot = () => { if (bootTl.isActive()) bootTl.progress(1); };
    const listen = contextSafe((k: number | null) => {
      finishBoot();
      listening?.kill();
      all("[data-sat]").forEach((g) => { if (!g.classList.contains("on")) gsap.set(g, { opacity: 1 }); });
      if (k === null || reduce) return;
      const idle = GROUPS[k + 1].map((i) => sats[i]).filter((g) => !g.classList.contains("on"));
      if (idle.length) listening = gsap.to(idle, { opacity: 0.2, duration: 0.28, repeat: -1, yoyo: true, ease: "steps(2)" });
    });

    const field = contextSafe((k: number, ok: boolean, valid: number) => {
      finishBoot();
      listening?.kill();
      group(k + 1, ok);
      validNow[k] = ok;
      setRods(validNow);
      setLevel(valid);
      const ids = GROUPS[k + 1];
      write(msgEl, ok ? copy.lcd.acquired(sats[ids[0]].querySelector("text")!.textContent!, ids.length - 1) : copy.lcd.lost);
    });

    const missing = contextSafe((text: string) => {
      finishBoot();
      write(msgEl, text);
      gsap.fromTo(one(".state-row"), { x: -4 }, { x: 0, duration: d(0.4), ease: "elastic.out(1, 0.3)" });
    });

    // ---------- sending: the satellites converge on the fix, a ping per pulse
    let converging: gsap.core.Timeline | null = null;
    const home = sats.map((g) => ({ x: gsap.getProperty(g, "x") as number, y: gsap.getProperty(g, "y") as number }));
    const sending = contextSafe(() => {
      finishBoot();
      write(msgEl, copy.lcd.converging);
      converging?.kill();
      converging = gsap.timeline({ repeat: -1, onRepeat: () => sound.ping() });
      sound.ping();
      converging.addLabel("in", 0)
        .to(sats.filter((g) => g.classList.contains("on")), {
          x: (_i: number, g: Element) => { const h = home[sats.indexOf(g as SVGGElement)]; return h.x + (SKY.c - h.x) * 0.35; },
          y: (_i: number, g: Element) => { const h = home[sats.indexOf(g as SVGGElement)]; return h.y + (SKY.c - h.y) * 0.35; },
          duration: d(0.6), ease: "power2.inOut", yoyo: true, repeat: 1,
        }, "in");
    });
    const settleSats = () => { converging?.kill(); converging = null; sats.forEach((g, i) => gsap.to(g, { x: home[i].x, y: home[i].y, duration: d(0.25) })); };

    // ---------- FIX and the print
    const fiche = () => R.querySelector<HTMLElement>("[data-fiche]");
    // The page goes back to its top so the FIX and the start of the printout are in view.
    const toTop = () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    let split: SplitText | null = null;
    const midH = () => mid.scrollHeight;

    const fix = contextSafe((ref: string) => new Promise<void>((resolve) => {
      const f = fiche();
      settleSats();
      const tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: () => { resolve(); afterPrint(); } });
      tl.addLabel("hold", 0)
        .to(lcd, { backgroundColor: "#C3CBBB", duration: d(0.2) }, "hold")
        .addLabel("fix", d(0.4))
        .add(() => {
          lcd.classList.add("locked");
          sats.forEach((g) => g.classList.add("on"));
          navigator.vibrate?.([12, 60, 24]);
          sound.fix();
        }, "fix")
        .set(lcd, { clearProps: "backgroundColor" }, "fix")
        .to(stateEl, { autoAlpha: 0, duration: 0.05 }, "fix")
        .fromTo(fixEl.querySelectorAll("[data-dot]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, stagger: { each: d(0.006), from: "random" } }, "fix")
        .to(steps[3], { scaleX: 1, duration: d(0.3), ease: "steps(6)" }, "fix")
        .add(() => { steps[3].parentElement?.setAttribute("aria-current", "step"); steps[2].parentElement?.removeAttribute("aria-current"); }, "fix")
        .to(read, { h: 0.012, v: 0.018, pdop: 0.9, duration: d(0.5), onUpdate: () => { paint(); precEl.innerHTML = `H ${frPrecision(read.h)}<br>V ${frPrecision(read.v)}`; } }, "fix")
        .addLabel("record", d(1.0))
        .add(() => write(msgEl, copy.lcd.recorded(ref)), "record")
        .addLabel("print", d(1.5))
        .add(toTop, "print")
        .to(form, { autoAlpha: 0, y: 40, duration: d(0.35), ease: "power2.in" }, "print")
        .set(form, { display: "none" }, `print+=${d(0.35)}`)
        .to(mid, { height: 0, marginTop: 0, autoAlpha: 0, duration: d(0.45), ease: "power3.inOut", onStart: () => gsap.set(mid, { height: midH() }) }, "print")
        .set(slot, { display: "block", autoAlpha: 1 }, `print+=${d(0.4)}`);
      if (f) {
        tl.set(f, { display: "block", visibility: "visible", clipPath: "inset(0 0 100% 0)" }, `print+=${d(0.45)}`)
          .add(() => sound.printer(16), `print+=${d(0.45)}`)
          .to(f, { clipPath: "inset(0 0 0% 0)", duration: d(1.2), ease: "steps(16)" }, `print+=${d(0.45)}`);
        const title = f.querySelector("[data-fiche-title]");
        if (title && !reduce) {
          split = SplitText.create(title, { type: "words,chars" });
          tl.from(split.chars, { autoAlpha: 0, duration: 0.01, stagger: 0.02 }, `print+=${d(0.65)}`);
        }
        tl.from(f.querySelectorAll("[data-staff]"), { scaleX: 0, transformOrigin: "0 50%", duration: d(0.12), stagger: d(0.03), ease: "steps(3)" }, `print+=${d(1.7)}`);
      }
    }));
    // Taller than the screen (a small phone): what lies below the fold reveals itself as the page is scrolled.
    const afterPrint = () => {
      const f = fiche();
      if (!f) return;
      f.focus({ preventScroll: true });
      if (reduce) return;
      const below = Array.from(f.querySelectorAll<HTMLElement>(".fiche-sec")).filter((s) => s.getBoundingClientRect().top > window.innerHeight);
      if (!below.length) return;
      gsap.set(below, { autoAlpha: 0, y: 14 });
      ScrollTrigger.batch(below, { start: "top 98%", once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.35 }) });
    };

    const fail = contextSafe(() => {
      settleSats();
      GROUPS.slice(1).forEach((_, k) => group(k + 1, false, true));
      setLevel(0, true);
      write(msgEl, copy.lcd.lost);
      gsap.fromTo(one(".state-row"), { x: -5 }, { x: 0, duration: d(0.45), ease: "elastic.out(1, 0.3)" });
    });

    const reset = contextSafe(() => new Promise<void>((resolve) => {
      const f = fiche();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      split?.revert(); split = null;
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: resolve });
      tl.add(toTop, 0);
      if (f) tl.to(f, { clipPath: "inset(0 0 100% 0)", duration: d(0.6), ease: "steps(10)" }, 0).set(f, { display: "none" }, d(0.6));
      tl.set(slot, { display: "none", autoAlpha: 0 }, d(0.6))
        .set(form, { display: "" }, d(0.6))
        .add(() => { lcd.classList.remove("locked"); gsap.set(fixEl.querySelectorAll("[data-dot]"), { autoAlpha: 0 }); gsap.set(stateEl, { autoAlpha: 1 }); }, d(0.6))
        .to(mid, { height: midH(), autoAlpha: 1, marginTop: "", duration: d(0.45), clearProps: "height,marginTop" }, d(0.6))
        .to(form, { autoAlpha: 1, y: 0, duration: d(0.4) }, d(0.8))
        .add(() => {
          sats.forEach((g, i) => { if (!(GROUPS[0] as readonly number[]).includes(i)) acquire(i, false, true); });
          validNow.fill(false);
          setRods(validNow);
          setLevel(0, true);
          write(msgEl, copy.lcd.searching);
          epochEl.textContent = `${copy.lcd.epoch} --:--`;
        }, d(0.6));
    }));

    // the epoch follows the time field
    const heure = R.querySelector<HTMLInputElement>("#heure");
    const onTime = () => { epochEl.textContent = `${copy.lcd.epoch} ${heure?.value || "--:--"}`; };
    heure?.addEventListener("input", onTime);

    apiRef.current = { field, listen, missing, sending, fix, fail, reset };
    return () => {
      clearInterval(clock);
      removeEventListener("deviceorientation", onOrient);
      removeEventListener("pointermove", onPointer);
      removeEventListener("pointerdown", askTilt);
      heure?.removeEventListener("input", onTime);
      apiRef.current = null;
    };
  }, { scope: rootRef });
  return null;
}
