"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { INTRO_KEY } from "@/lib/config";
import { buildIntro } from "./build-intro";

/**
 * The opening (DESIGN.md §6.A): graticule, satellite pass, raster to vector, trilateration, the
 * fix, the wordmark, the zoom out to the form. Once per tab; a tap, Escape, Enter or Space
 * skips to the end. Not rendered at all with reduced motion or once seen (see the inline
 * script in the layout, which decides before the first paint).
 */
export function Intro() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const overlay = overlayRef.current;
    if (!overlay || root.dataset.intro === "skip" || root.dataset.intro === "done") return;
    root.dataset.intro = "running";

    const intro = buildIntro(overlay);
    let skipped = false;
    let cancelled = false;
    const skip = () => {
      if (skipped) return;
      skipped = true;
      intro.timeline.skip();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    overlay.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", onKey);

    intro.timeline.play().then(() => {
      if (cancelled) return;
      root.dataset.intro = "done";
      intro.cleanUp();
      if (skipped) document.body.classList.add("intro-skipped");
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {}
    });

    return () => {
      // React's development double run: start again from scratch on the second run.
      cancelled = true;
      intro.timeline.cancel();
      intro.cleanUp();
      overlay.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
      if (root.dataset.intro === "running") delete root.dataset.intro;
    };
  }, []);

  return (
    <div ref={overlayRef} className="intro fixed inset-0 z-40" aria-hidden="false">
      <button type="button" className="sr-only focus:not-sr-only intro-skip" onClick={(e) => e.currentTarget.blur()}>
        {copy.intro.skip}
      </button>
      <div className="intro-scan" data-intro-scan aria-hidden="true">
        <span className="intro-scan-band" />
        <span className="intro-scan-line" />
      </div>
      <svg className="intro-signals pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-intro-signals />
      <p className="intro-coords marginalia tabular absolute text-ink" aria-hidden="true" data-intro-coords>
        <span data-lat>00.0000° N</span>
        <span data-lon>00.0000° E</span>
      </p>
    </div>
  );
}
