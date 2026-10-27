"use client";

import { useEffect, useRef, useState } from "react";
import { TerrainRenderer } from "@/lib/terrain/renderer";
import { onFrame, terrain, wake } from "@/lib/terrain/state";
import { StaticContours } from "./static-contours";

const introWillPlay = () => {
  const state = document.documentElement.dataset.intro;
  return state !== "skip" && state !== "done";
};

/**
 * The living map: a WebGL2 canvas, or static SVG contours when WebGL2 isn't there (or when the
 * address has `?gl=0`, to test the fallback). Fingers raise the ground; the phone's tilt (or
 * the pointer) gives a little parallax.
 */
export function Terrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    terrain.still = reduced;
    if (!reduced && introWillPlay()) {
      terrain.scan = 0;
      terrain.pixel = 16;
      terrain.vector = 0;
      terrain.zoom = 2.4;
    }

    const forced = new URLSearchParams(location.search).get("gl") === "0";
    const renderer = forced ? null : TerrainRenderer.create(canvas);
    if (!renderer) {
      queueMicrotask(() => setFallback(true));
      return;
    }

    renderer.resize();
    renderer.render();
    renderer.start();

    const onResize = () => renderer.resize();
    const onVisibility = () => (document.hidden ? renderer.stop() : renderer.start());
    const onLost = (e: Event) => {
      e.preventDefault();
      renderer.stop();
      setFallback(true);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    const stopMotion = reduced ? () => {} : liveInteraction();

    return () => {
      renderer.stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      stopMotion();
    };
  }, []);

  if (fallback) return <StaticContours />;
  return <canvas ref={canvasRef} aria-hidden="true" className="sheet-clip pointer-events-none fixed inset-0 h-full w-full" />;
}

/** Finger bumps and tilt parallax. Returns the cleanup. */
function liveInteraction(): () => void {
  const target = { x: 0, y: 0 };
  let tilt = false;
  let asked = false;
  let baseBeta: number | null = null;

  const slotFor = (id: number) =>
    terrain.bumps.find((b) => b.pointer === id) ??
    terrain.bumps.find((b) => b.target === 0 && b.s < 0.002) ??
    terrain.bumps.reduce((a, b) => (a.s < b.s ? a : b));

  const down = (e: PointerEvent) => {
    askForTilt();
    const b = slotFor(e.pointerId);
    b.pointer = e.pointerId;
    b.x = e.clientX;
    b.y = e.clientY;
    b.target = e.pointerType === "mouse" ? 0.1 : 0.14;
    b.r = e.pointerType === "mouse" ? 60 : 72;
    wake(800);
  };
  const move = (e: PointerEvent) => {
    const b = terrain.bumps.find((x) => x.pointer === e.pointerId && x.target > 0);
    if (b) {
      b.x = e.clientX;
      b.y = e.clientY;
      wake(400);
    }
    if (!tilt && e.pointerType === "mouse") {
      target.x = (e.clientX / innerWidth - 0.5) * -16;
      target.y = (e.clientY / innerHeight - 0.5) * -16;
    }
  };
  const up = (e: PointerEvent) => {
    const b = terrain.bumps.find((x) => x.pointer === e.pointerId);
    if (b) {
      b.target = 0;
      b.pointer = -1;
      wake(1400);
    }
  };
  const orient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    tilt = true;
    baseBeta ??= e.beta;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    target.x = clamp(e.gamma / 30) * -10;
    target.y = clamp((e.beta - baseBeta) / 30) * -10;
  };
  function askForTilt() {
    if (asked) return;
    asked = true;
    const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (D?.requestPermission) {
      D.requestPermission()
        .then((r) => r === "granted" && window.addEventListener("deviceorientation", orient))
        .catch(() => {});
    }
  }
  if (!(window.DeviceOrientationEvent as unknown as { requestPermission?: unknown })?.requestPermission) {
    window.addEventListener("deviceorientation", orient);
  }

  let last = 0;
  const stopFrame = onFrame((t, now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const k = Math.min(1, dt * 4);
    const dx = (target.x - t.parallax.x) * k;
    const dy = (target.y - t.parallax.y) * k;
    if (Math.abs(dx) + Math.abs(dy) > 0.003) {
      t.parallax.x += dx;
      t.parallax.y += dy;
      t.dirty = true;
    }
  });

  window.addEventListener("pointerdown", down, { passive: true });
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", up, { passive: true });
  window.addEventListener("pointercancel", up, { passive: true });
  return () => {
    stopFrame();
    window.removeEventListener("pointerdown", down);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    window.removeEventListener("deviceorientation", orient);
  };
}
