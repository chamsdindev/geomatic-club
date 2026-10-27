import { FIX } from "@/lib/config";
import { formatLat, formatLon } from "@/lib/geo";
import { Timeline, lock, mix, needle, pan, survey } from "@/lib/motion";
import { setFix, terrain, wake } from "@/lib/terrain/state";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Times in ms, from DESIGN.md §6.A. */
export const INTRO = {
  graticule: 0,
  scan: 400,
  scanEnd: 1300,
  vectorise: 1300,
  vectoriseEnd: 1750,
  signals: 1400,
  signalsMeet: 2200,
  search: 1700,
  lock: 2500,
  wordmark: 2550,
  zoom: 3000,
  zoomEnd: 3600,
  plot: 3200,
} as const;

/**
 * Builds the intro's timeline over the page as it is. Everything the intro moves is written
 * as inline style, and `cleanUp` removes those styles once the page has its `data-intro="done"`
 * state, so the resting look always comes from the stylesheet.
 */
export function buildIntro(overlay: HTMLElement) {
  const touched = new Set<HTMLElement | SVGElement>();
  const created: Element[] = [];
  const style = (el: HTMLElement | SVGElement) => {
    touched.add(el);
    return el.style;
  };
  const all = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
  const one = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

  const W = innerWidth;
  const H = innerHeight;
  const win = one<HTMLElement>("[data-map-window]");
  if (win) {
    const r = win.getBoundingClientRect();
    setFix(r.left + r.width / 2, r.top + r.height / 2);
  }
  const fix = { ...terrain.fix };
  const tl = new Timeline();

  // The terrain starts as blank paper, close in.
  Object.assign(terrain, { scan: 0, pixel: 16, vector: 0, zoom: 2.4 });
  wake(4000);

  // 1. Graticule, drawn outwards from the fix.
  const gratGroup = one<SVGGElement>('[data-intro-part="graticule"]');
  if (gratGroup) style(gratGroup).setProperty("--grat-o", "0.55");
  const lines = all<SVGPathElement>("[data-grat-line]");
  const far = Math.max(1, ...lines.map((l) => Number(l.dataset.dist)));
  for (const line of lines) {
    const delay = INTRO.graticule + (Number(line.dataset.dist) / far) * 240;
    style(line).strokeDasharray = "1";
    line.style.strokeDashoffset = "1";
    tl.tween(delay, 420, (v) => (line.style.strokeDashoffset = String(1 - v)), survey);
  }

  // 2. Satellite pass: the scan line and the raster behind it.
  const scan = one<HTMLElement>("[data-intro-scan]", overlay);
  if (scan) {
    style(scan).transform = "translate3d(0,-40px,0)";
    tl.tween(INTRO.scan, INTRO.scanEnd - INTRO.scan, (v) => {
      scan.style.transform = `translate3d(0,${(v * (H + 2)).toFixed(1)}px,0)`;
      terrain.scan = v;
      wake(200);
    });
    tl.tween(INTRO.scanEnd, 120, (v) => (scan.style.opacity = String(1 - v)));
  }

  // 3. Raster to vector: cells halve in steps, then the lines sharpen.
  const cells = [16, 8, 4, 2, 1];
  tl.tween(INTRO.vectorise, INTRO.vectoriseEnd - INTRO.vectorise, (v) => {
    terrain.pixel = cells[Math.min(cells.length - 1, Math.floor(v * cells.length))];
    wake(200);
  });
  tl.tween(1600, 220, (v) => {
    terrain.vector = v;
    wake(200);
  }, survey);

  // 4. Trilateration: three signals from off-screen satellites meet at the fix.
  const signals = one<SVGSVGElement>("[data-intro-signals]", overlay);
  if (signals) {
    const sats = [
      { x: -0.4 * W, y: fix.y - 0.35 * H },
      { x: 1.45 * W, y: fix.y - 0.1 * H },
      { x: 0.35 * W, y: H * 1.35 },
    ];
    sats.forEach((s, i) => {
      const r = Math.hypot(fix.x - s.x, fix.y - s.y);
      for (const [extra, alpha] of [[0, 0.85], [-14, 0.35]] as const) {
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", s.x.toFixed(1));
        c.setAttribute("cy", s.y.toFixed(1));
        c.setAttribute("r", (r + extra).toFixed(1));
        c.setAttribute("class", "intro-signal");
        c.style.transform = "scale(0.55)";
        c.style.opacity = "0";
        signals.appendChild(c);
        created.push(c);
        const at = INTRO.signals + i * 70;
        const meet = INTRO.signalsMeet - at;
        tl.tween(at, meet, (v) => (c.style.transform = `scale(${mix(0.55, 1, v)})`), survey);
        tl.tween(at, 200, (v) => (c.style.opacity = String(v * alpha)));
        tl.tween(INTRO.signalsMeet, 450, (v) => {
          c.style.transform = `scale(${mix(1, 1.05, v)})`;
          c.style.opacity = String(alpha * (1 - v));
        }, survey);
      }
    });
  }

  // 5. The reticle searches, the coordinates count, then the fix locks.
  const reticle = one<SVGSVGElement>('[data-intro-part="reticle"]');
  const brackets = all<SVGPathElement>("[data-bracket]");
  const coords = one<HTMLElement>("[data-intro-coords]", overlay);
  const lat = coords ? one<HTMLElement>("[data-lat]", coords) : null;
  const lon = coords ? one<HTMLElement>("[data-lon]", coords) : null;
  let jitter = { x: 0, y: 0 };
  let reticleScale = 1.12;
  const placeReticle = () => {
    if (reticle) reticle.style.transform = `translate(${jitter.x.toFixed(2)}px,${jitter.y.toFixed(2)}px) scale(${reticleScale})`;
  };
  if (reticle) {
    style(reticle).opacity = "0";
    placeReticle();
    tl.tween(INTRO.search, 150, (v) => (reticle.style.opacity = String(v)));
    tl.tween(INTRO.search, INTRO.lock - INTRO.search, (v, ms) => {
      const a = 7 * Math.pow(1 - v, 1.4);
      jitter = {
        x: a * (Math.sin(ms * 0.021) * Math.cos(ms * 0.013 + 2) + 0.5 * Math.sin(ms * 0.067)),
        y: a * (Math.cos(ms * 0.017 + 1) * Math.sin(ms * 0.011) + 0.5 * Math.cos(ms * 0.059)),
      };
      placeReticle();
    });
    for (const b of brackets) {
      const [sx, sy] = (b.dataset.bracket ?? "0,0").split(",").map(Number);
      style(b).transform = `translate(${sx * 7}px,${sy * 7}px)`;
      tl.tween(INTRO.lock, lock.duration, (v) => {
        b.style.transform = `translate(${(sx * 7 * (1 - v)).toFixed(2)}px,${(sy * 7 * (1 - v)).toFixed(2)}px)`;
      }, lock.ease);
    }
    tl.tween(INTRO.lock, lock.duration, (v) => {
      jitter = { x: 0, y: 0 };
      reticleScale = mix(1.12, 1, v);
      placeReticle();
    }, lock.ease);
    tl.tween(INTRO.wordmark, 220, (v) => (reticle.style.opacity = String(mix(1, 0.35, v))));
    tl.tween(INTRO.zoom, INTRO.zoomEnd - INTRO.zoom, (v) => {
      reticleScale = mix(1, 0.5, v);
      reticle.style.opacity = String(mix(0.35, 0.6, v));
      placeReticle();
    }, pan);
  }
  if (coords && lat && lon) {
    style(coords).left = `${fix.x}px`;
    coords.style.top = `${fix.y + 44}px`;
    coords.style.opacity = "0";
    tl.tween(INTRO.search, 150, (v) => (coords.style.opacity = String(v)));
    tl.tween(INTRO.search, INTRO.lock - INTRO.search, (v, ms) => {
      const spread = 0.09 * Math.pow(1 - v, 2);
      const step = Math.floor(ms / 45);
      const n1 = Math.sin(step * 12.9898) * 43758.5453;
      const n2 = Math.sin(step * 78.233) * 43758.5453;
      lat.textContent = formatLat(FIX.lat + (n1 - Math.floor(n1) - 0.5) * spread);
      lon.textContent = formatLon(FIX.lon + (n2 - Math.floor(n2) - 0.5) * spread);
    });
    tl.cue(INTRO.lock, () => {
      lat.textContent = formatLat(FIX.lat);
      lon.textContent = formatLon(FIX.lon);
    }, true);
    tl.tween(INTRO.zoom, 250, (v) => (coords.style.opacity = String(1 - v)));
  }

  // 6. The wordmark resolves on the fix, then travels to the header.
  const mark = one<HTMLElement>('[data-intro-part="wordmark"]');
  if (mark) {
    const r = mark.getBoundingClientRect();
    const scale = Math.min(1.2, (W - 32) / r.width);
    const dx = fix.x - (r.left + r.width / 2);
    const dy = fix.y - (r.top + r.height / 2);
    style(mark).transformOrigin = "50% 50%";
    mark.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;

    const triangle = one<SVGPathElement>("[data-glyph-triangle]", mark);
    const dot = one<SVGCircleElement>("[data-glyph-dot]", mark);
    if (triangle) {
      style(triangle).strokeDasharray = "1";
      triangle.style.strokeDashoffset = "1";
      tl.tween(INTRO.lock, 10, () => (triangle.style.opacity = "1"));
      tl.tween(INTRO.lock, 320, (v) => (triangle.style.strokeDashoffset = String(1 - v)), survey);
    }
    if (dot) {
      style(dot).transformOrigin = "16px 18.9px";
      tl.tween(INTRO.lock + 300, lock.duration, (v) => {
        dot.style.opacity = String(Math.min(1, v * 3));
        dot.style.transform = `scale(${v})`;
      }, lock.ease);
    }
    all<HTMLElement>("[data-letter]", mark).forEach((letter, i) => {
      style(letter).transformOrigin = "0 50%";
      letter.style.transform = "scaleX(0.3)";
      const at = INTRO.wordmark + i * 22;
      tl.tween(at, 260, (v) => (letter.style.transform = `scaleX(${mix(0.3, 1, v)})`), survey);
      tl.tween(at, 90, (v) => (letter.style.opacity = String(v)));
    });
    tl.tween(INTRO.zoom, INTRO.zoomEnd - INTRO.zoom, (v) => {
      mark.style.transform = `translate(${dx * (1 - v)}px,${dy * (1 - v)}px) scale(${mix(scale, 1, v)})`;
    }, pan);
  }

  // 7. Zoom out to the sheet; the marginalia settle; the form is plotted.
  tl.tween(INTRO.zoom, INTRO.zoomEnd - INTRO.zoom, (v) => {
    terrain.zoom = mix(2.4, 1, v);
    wake(200);
    if (gratGroup) gratGroup.style.setProperty("--grat-o", String(mix(0.55, 0.3, v)));
  }, pan);

  const arrow = one<SVGSVGElement>(".north-arrow");
  if (arrow) {
    style(arrow).transform = "rotate(-32deg)";
    tl.tween(3150, 200, (v) => (arrow.style.opacity = String(v)));
    tl.tween(3150, needle.duration, (v) => (arrow.style.transform = `rotate(${mix(-32, 0, v)}deg)`), needle.ease);
  }
  const fadeIn = (sel: string, at: number, dur = 300, to = 1) => {
    for (const el of all<HTMLElement>(sel)) {
      style(el);
      tl.tween(at, dur, (v) => (el.style.opacity = String(v * to)));
    }
  };
  fadeIn("footer [data-intro-hide]", 3150);
  fadeIn(".graticule-labels", 3300);
  fadeIn(".halo", INTRO.zoom, 400, 0.8);
  fadeIn(".lead", 3150);

  all<HTMLElement>("[data-field]").forEach((field, i) => {
    const at = INTRO.plot + i * 70;
    const base = one<HTMLElement>("[data-baseline]", field);
    if (base) {
      style(base).transformOrigin = "0 50%";
      base.style.transform = "scaleX(0)";
      tl.tween(at, 10, () => (base.style.opacity = "1"));
      tl.tween(at, 360, (v) => (base.style.transform = `scaleX(${v})`), survey);
    }
    const label = one<HTMLElement>("label", field);
    const input = one<HTMLElement>("input", field);
    if (label) {
      style(label);
      tl.tween(at + 60, 240, (v) => (label.style.opacity = String(v)));
    }
    if (input) {
      style(input);
      tl.tween(at + 120, 240, (v) => (input.style.opacity = String(v)));
    }
  });
  const plate = one<HTMLElement>(".plate");
  if (plate) {
    style(plate);
    tl.tween(INTRO.plot + 280, 260, (v) => (plate.style.opacity = String(v)));
  }

  tl.cue(tl.duration, () => {
    Object.assign(terrain, { scan: 1, pixel: 1, vector: 1, zoom: 1 });
    wake(300);
  }, true);

  return {
    timeline: tl,
    cleanUp() {
      for (const el of touched) {
        for (const prop of ["opacity", "transform", "transform-origin", "stroke-dasharray", "stroke-dashoffset", "left", "top", "--grat-o"]) {
          el.style.removeProperty(prop);
        }
      }
      for (const el of created) el.remove();
      Object.assign(terrain, { scan: 1, pixel: 1, vector: 1, zoom: 1 });
      wake(300);
    },
  };
}
