# E, Nuage de points: self-critique

Frames: `../_out/e-nuage/` (r0 = first build, r1 = after round 1, r2 = after round 2).

## Round 1 (r0 → r1)
1. The camera was too close and the lens shift too strong: the village was cut at the top, no cliff, no sea. Pulled
   back, lower pitch, a gentler shift, so the skyline sits in the open part of the screen.
2. Points were too big: walls read as snow. Smaller points, and walls quantised into **horizontal laser rows**, the
   way a terrestrial scanner records a façade (ref: Dyer building scan).
3. The countdown was set in Workbench (scanline type) and was hard to read: Workbench stays for the point count and
   the name only; the countdown is in Atkinson Hyperlegible Next.
4. The header floated over the points: it now sits on its own band.

## Round 2 (r1 → r2)
1. **The name never appeared**: the name's shader program failed to link (`uP` declared `highp` in the vertex
   shader, `mediump` in the fragment shader), then drew three times too many vertices. Both fixed; the GL error log
   is now clean.
2. Once visible, the name floated in the sky like a billboard and looked like a sticker: it now stands among the
   houses, in front of the minaret, sampled in laser rows like the walls, so it reads as scanned.
3. The member's tag touched the header's edge: placed under it.

Still open: the lower half of the main screen is dark ground with sparse points (the panel covers most of it, but
the composition is top-heavy); the scan rings are only visible in motion; performance measured on a Mac only
(~150 k points), not yet on a mid-range Android.
