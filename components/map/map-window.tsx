"use client";

import { useRef } from "react";
import { useFixOn } from "./marginalia";

/**
 * The strip of open map between the header and the form. Its centre is the fix point: the
 * intro locks onto it, and the pin will land on it.
 */
export function MapWindow() {
  const ref = useRef<HTMLDivElement>(null);
  useFixOn(ref);
  return (
    <div ref={ref} className="map-window relative" data-map-window>
      <Reticle />
    </div>
  );
}

export function Reticle() {
  return (
    <svg
      viewBox="-32 -32 64 64"
      width="64"
      height="64"
      aria-hidden="true"
      className="reticle pointer-events-none absolute left-1/2 top-1/2 -ml-8 -mt-8 text-ink"
      data-intro-part="reticle"
      data-intro-hide
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle r="13" />
        <path d="M0 -24V-7M0 7V24M-24 0H-7M7 0H24" strokeWidth="1" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
        <path data-bracket="-1,-1" d="M-29 -20V-29H-20" />
        <path data-bracket="1,-1" d="M20 -29H29V-20" />
        <path data-bracket="1,1" d="M29 20V29H20" />
        <path data-bracket="-1,1" d="M-20 29H-29V20" />
      </g>
      <circle r="1.6" fill="currentColor" />
    </svg>
  );
}
