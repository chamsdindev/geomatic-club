"use client";

import { useEffect, useRef } from "react";
import { UNIT_PX, clubHeight } from "@/lib/terrain/field";
import { traceContours, type Contour } from "@/lib/terrain/contours";
import { onFrame, startBareLoop, terrain } from "@/lib/terrain/state";

const STYLE: Record<Contour["kind"], string> = {
  minor: 'stroke="#7F9A7C" stroke-width="0.9" stroke-opacity="0.5"',
  index: 'stroke="#5E7A5B" stroke-width="1.5" stroke-opacity="0.78"',
  water: 'stroke="#3F74A3" stroke-width="0.9" stroke-opacity="0.32"',
  shore: 'stroke="#3F74A3" stroke-width="1.3" stroke-opacity="0.55"',
};

/**
 * The fallback map (no WebGL2): the club's terrain at rest, traced once as SVG over the whole
 * page around the view, so it scrolls with it. The cartouche's halo works on it like on the canvas.
 */
export function StaticContours() {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;
    let origin = { x: 0, y: 0 };
    let lastKey = "";

    // Traced once over three screens of height around the view, then moved with the fix point
    // (which follows the page's scroll), inside the same clip as the canvas.
    const draw = () => {
      const w = innerWidth;
      const h = innerHeight;
      origin = { x: terrain.fix.x, y: terrain.fix.y };
      const lines = traceContours(w, h * 3, 9, (x, y) =>
        clubHeight((x - origin.x) / UNIT_PX, (y - h - origin.y) / UNIT_PX),
      );
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      group.innerHTML = `<g transform="translate(0 ${-h})">${lines
        .map((c) => `<path d="${c.d}" ${STYLE[c.kind]} fill="none" />`)
        .join("")}</g>`;
      lastKey = "";
    };

    let pending = 0;
    const later = () => {
      clearTimeout(pending);
      pending = window.setTimeout(draw, 150);
    };
    // The fix point is measured by the map window's effect; draw once it has run.
    const first = requestAnimationFrame(draw);
    window.addEventListener("resize", later);

    let lastVector = -1;
    const stopFrame = onFrame((t) => {
      const key = `${t.fix.x}|${t.fix.y}|${t.zoom}`;
      if (key !== lastKey) {
        lastKey = key;
        const dx = t.fix.x - origin.x;
        const dy = t.fix.y - origin.y;
        group.setAttribute(
          "transform",
          `translate(${dx} ${dy}) translate(${origin.x} ${origin.y}) scale(${t.zoom}) translate(${-origin.x} ${-origin.y})`,
        );
      }
      if (t.vector !== lastVector) {
        lastVector = t.vector;
        svg.style.opacity = String(t.vector);
      }
    });
    const stopLoop = startBareLoop();

    return () => {
      cancelAnimationFrame(first);
      clearTimeout(pending);
      window.removeEventListener("resize", later);
      stopFrame();
      stopLoop();
    };
  }, []);

  return (
    <svg ref={svgRef} aria-hidden="true" className="sheet-clip pointer-events-none fixed inset-0 h-full w-full"
      preserveAspectRatio="none"
      data-fallback-map>
      <g ref={groupRef} />
    </svg>
  );
}
