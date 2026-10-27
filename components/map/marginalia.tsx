"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { formatLat, formatLon, scaleLabel, toLatLon } from "@/lib/geo";
import { onFrame, terrain } from "@/lib/terrain/state";

/** The sheet's edge: a double rule inside the safe area. */
export function Neatline() {
  return <div aria-hidden="true" className="neatline pointer-events-none fixed z-10" />;
}

export function NorthArrow() {
  return (
    <svg
      role="img"
      aria-label={copy.map.northArrow}
      viewBox="0 0 28 40"
      width="28"
      height="40"
      className="north-arrow shrink-0 text-ink"
      data-intro-hide
    >
      <path d="M14 3 L21 27 L14 22.5 Z" fill="currentColor" />
      <path d="M14 3 L7 27 L14 22.5 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <text x="14" y="38.5" textAnchor="middle" className="marginalia" fill="currentColor" fontSize="10.5">
        N
      </text>
    </svg>
  );
}

/** 64 px of map, labelled with what they measure at the current zoom. */
export function ScaleBar() {
  const labelRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let last = "";
    return onFrame((t) => {
      const text = scaleLabel(t.zoom);
      if (text !== last && labelRef.current) {
        last = text;
        labelRef.current.textContent = text;
      }
    });
  }, []);
  return (
    <div className="marginalia flex flex-col gap-1 text-ink-2" data-intro-hide aria-label={copy.map.scale}>
      <span className="flex justify-between tabular" style={{ width: 64 }}>
        <span>0</span>
        <span ref={labelRef}>500 m</span>
      </span>
      <svg viewBox="0 0 64 8" width="64" height="8" aria-hidden="true" className="text-ink">
        <path d="M0.5 0V8M32 2V6M63.5 0V8M0 4H64" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M0.5 3H32V5H0.5Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Where the finger (or the mouse) is, in degrees; the fix point when nobody points. */
export function Readout() {
  const latRef = useRef<HTMLSpanElement>(null);
  const lonRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const pointer = { x: NaN, y: NaN };
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    let last = "";
    const stop = onFrame((t) => {
      const at = Number.isNaN(pointer.x) ? t.fix : pointer;
      const { lat, lon } = toLatLon(at.x, at.y, t.fix, t.zoom);
      const a = formatLat(lat);
      const b = formatLon(lon);
      if (a + b === last) return;
      last = a + b;
      if (latRef.current) latRef.current.textContent = a;
      if (lonRef.current) lonRef.current.textContent = b;
    });
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, []);
  return (
    <p className="marginalia tabular flex flex-col items-end gap-0.5 text-ink-2" aria-hidden="true" data-intro-hide>
      <span ref={latRef}>{formatLat(36.8065)}</span>
      <span ref={lonRef}>{formatLon(10.1815)}</span>
    </p>
  );
}

/** Keeps the terrain's fix point on the centre of an element (the map window) as the page scrolls. */
export function useFixOn(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (x !== terrain.fix.x || y !== terrain.fix.y) {
        terrain.fix.x = x;
        terrain.fix.y = y;
        terrain.dirty = true;
      }
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [ref]);
}
