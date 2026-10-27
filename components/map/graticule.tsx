"use client";

import { useEffect, useRef } from "react";
import { FIX, GRATICULE_STEP } from "@/lib/config";
import { degreeToPx } from "@/lib/geo";
import { onFrame } from "@/lib/terrain/state";

type Line = { key: string; d: string; dist: number; axis: "lat" | "lon"; value: number; offset: number; dir: number };

const SVG_NS = "http://www.w3.org/2000/svg";
const MARGIN = 14;

/**
 * Lines of latitude and longitude every 0.01°, through real values around the fix point, and
 * their degrees in the margin. Each line is two halves drawn outwards from the fix, so the intro
 * can draw the sheet from its centre.
 */
export function Graticule() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gridRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const grid = gridRef.current;
    const labelGroup = labelsRef.current;
    if (!svg || !grid || !labelGroup) return;

    let lines: Line[] = [];
    let labels: { el: SVGTextElement; line: Line }[] = [];

    const build = () => {
      const reach = Math.hypot(innerWidth, innerHeight) * 1.2;
      const px = degreeToPx(GRATICULE_STEP);
      lines = [];
      const lonFirst = Math.ceil((FIX.lon - reach / px.lon * GRATICULE_STEP) / GRATICULE_STEP);
      const lonLast = Math.floor((FIX.lon + reach / px.lon * GRATICULE_STEP) / GRATICULE_STEP);
      for (let k = lonFirst; k <= lonLast; k++) {
        const value = k * GRATICULE_STEP;
        const x = ((value - FIX.lon) / GRATICULE_STEP) * px.lon;
        for (const dir of [-1, 1]) {
          lines.push({ key: `lon${k}${dir}`, d: `M${x.toFixed(1)} 0V${dir * reach}`, dist: Math.abs(x), axis: "lon", value, offset: x, dir });
        }
      }
      const latFirst = Math.ceil((FIX.lat - reach / px.lat * GRATICULE_STEP) / GRATICULE_STEP);
      const latLast = Math.floor((FIX.lat + reach / px.lat * GRATICULE_STEP) / GRATICULE_STEP);
      for (let k = latFirst; k <= latLast; k++) {
        const value = k * GRATICULE_STEP;
        const y = -((value - FIX.lat) / GRATICULE_STEP) * px.lat;
        for (const dir of [-1, 1]) {
          lines.push({ key: `lat${k}${dir}`, d: `M0 ${y.toFixed(1)}H${dir * reach}`, dist: Math.abs(y), axis: "lat", value, offset: y, dir });
        }
      }
      grid.replaceChildren(
        ...lines.map((l) => {
          const p = document.createElementNS(SVG_NS, "path");
          p.setAttribute("d", l.d);
          p.setAttribute("pathLength", "1");
          p.setAttribute("data-grat-line", "");
          p.setAttribute("data-dist", String(Math.round(l.dist)));
          return p;
        }),
      );
      labels = lines
        .filter((l) => l.dir === 1)
        .map((line) => {
          const el = document.createElementNS(SVG_NS, "text");
          el.textContent = `${line.value.toFixed(2)}°`;
          el.setAttribute("text-anchor", line.axis === "lon" ? "middle" : "start");
          return { el, line };
        });
      labelGroup.replaceChildren(...labels.map((l) => l.el));
      lastKey = "";
    };

    let lastKey = "";
    build();
    const stopFrame = onFrame((t) => {
      const ox = t.fix.x + t.parallax.x * 0.6;
      const oy = t.fix.y + t.parallax.y * 0.6;
      const key = `${ox.toFixed(2)}|${oy.toFixed(2)}|${t.zoom.toFixed(4)}`;
      if (key === lastKey) return;
      lastKey = key;
      grid.setAttribute("transform", `translate(${ox} ${oy}) scale(${t.zoom})`);
      const w = innerWidth;
      const h = innerHeight;
      // Like any label on a map, the degrees are masked under the cartouche.
      const legend = document.querySelector(".cartouche")?.getBoundingClientRect();
      for (const { el, line } of labels) {
        const pos = line.axis === "lon" ? ox + line.offset * t.zoom : oy + line.offset * t.zoom;
        const underLegend = line.axis === "lat" && legend && pos > legend.top - 24 && pos < legend.bottom + 16;
        const inside =
          line.axis === "lon" ? pos > 48 && pos < w - 76 : pos > 64 && pos < h - 64 && !underLegend;
        el.style.display = inside ? "" : "none";
        if (!inside) continue;
        if (line.axis === "lon") {
          el.setAttribute("x", pos.toFixed(1));
          el.setAttribute("y", String(MARGIN + 7));
        } else {
          el.setAttribute("x", String(MARGIN - 1));
          el.setAttribute("y", (pos - 3).toFixed(1));
        }
      }
    });
    let pending = 0;
    const onResize = () => {
      clearTimeout(pending);
      pending = window.setTimeout(build, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      stopFrame();
      clearTimeout(pending);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <svg ref={svgRef} aria-hidden="true" className="graticule sheet-clip pointer-events-none fixed inset-0 h-full w-full">
      <g ref={gridRef} className="graticule-lines" data-intro-part="graticule" />
      <g ref={labelsRef} className="graticule-labels marginalia" data-intro-hide />
    </svg>
  );
}
