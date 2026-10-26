# Geomatic Club — design plan

The page is a **topographic map sheet** with a registration form printed on it. The visuals
come from the map, and the motion from what surveyors actually do: scan, fix, traverse, plot.

## 1. Palette — "Feuille 36°48′ N"

Six colours, named the way a map legend would name them. Contrast was measured against `Papier`.

| Token | Name | Hex | Role | Contrast on paper |
|---|---|---|---|---|
| `--paper` | Papier | `#E9EEE7` | The sheet: cool, slightly green grey (not cream) | — |
| `--ink` | Encre de levé | `#13233B` | Text, the wordmark, the pin's outline, the neatline | 13.4 : 1 |
| `--ink-2` | Encre légère | `#46566A` | Secondary text, labels, marginalia | 6.4 : 1 |
| `--contour` | Isohypse | `#7F9A7C` (index lines `#5E7A5B`) | Contour lines, the traverse | lines only (2.6 / 4.1) |
| `--water` | Hydro | `#3F74A3` | Graticule, signal circles, the focus outline | 4.2 : 1 (≥ 3 : 1 for UI parts) |
| `--marker` | Balise | `#F5A100` | **Only** the primary action and the location pin | 1.8 : 1, so always with navy text or a navy outline (navy on balise = 7.5 : 1) |
| `--fault` | Faille | `#A33B22` | Error text and the "lost signal" stroke | 5.6 : 1 |

Colour carries meaning. Hydro means signal or geometry, Balise means "act here / you are
here", and Faille means "fix this".

## 2. Typography — one family, three widths

**Archivo** (variable, `wght` + `wdth`), self-hosted with `next/font`. The width axis sets the
hierarchy, the way map lettering does:

| Role | Width | Weight | Size / line height | Notes |
|---|---|---|---|---|
| Wordmark | 125 (expanded) | 800 | 34 / 1.0 | letter-spacing −0.03em |
| Ticket title | 112 | 700 | 24 / 1.15 | |
| Lead line | 100 | 400 | 17 / 1.45 | |
| Input value | 100 | 500 | 17 / 1 | ≥ 16 px, so iOS never zooms; `tabular-nums` for date and time |
| Field label | 87 | 500 | 14 / 1.2 | sentence case, never all caps |
| Error | 100 | 500 | 14 / 1.35 | in Faille |
| Marginalia (coordinates, scale bar, map label) | 75 (condensed) | 500 | 12 / 1 | `tabular-nums`; decorative copies are `aria-hidden` |

Real maps also mix widths this way: expanded for regions, normal for text, condensed for the
grid numbers in the margin.

## 3. Mobile wireframe (390 × 844)

```
┌──────────────────────────────────────────┐ ← neatline (double hairline, degree ticks)
│ ▵ Geomatic Club                       N  │   wordmark + glyph        north arrow
│                                       ↑  │
│ ~~~~~~~~~~~~~ contours ~~~~~~~~~~~~~~~~~ │
│    ~~ A m i n e   B e n   S a l a h ~~   │ ← their name as a place label on a contour
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ┌ cartouche (contours knocked out) ────┐ │
│ │ Réserve ta place : indique ton nom   │ │
│ │ et choisis un créneau.               │ │
│ │                                      │ │
│ │ •1  Prénom                           │ │   •1–•4 = survey stations
│ │  \  ________________________________ │ │   (a traverse runs down the left edge)
│ │   •2 Nom                             │ │
│ │  /  ________________________________ │ │
│ │ •3  Date              ┌stamp──────┐  │ │
│ │  \  ____________      │ jeu. 14   │  │ │
│ │   •4 Heure            └───────────┘  │ │
│ │     ____________   ◠ sun arc         │ │
│ │                                      │ │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│ │ ┃            Envoyer               ┃ │ │ ← survey plate, corner brackets
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│ └──────────────────────────────────────┘ │
│ 0 ─── 500 m              36.8065° N      │ ← scale bar        live coordinates
│                          10.1815° E      │
└──────────────────────────────────────────┘
```

On a computer: the same column (max 430 px) stays centred, and the terrain, graticule and
marginalia fill the window.

## 4. Principles

1. **Every movement is a survey act.** If an animation can't be named after a real operation
   (scan, fix, traverse, plot, stamp, drop), it doesn't ship.
2. **The page is the map.** No floating card, no shadow. The form sits in a **cartouche**: the
   shader fades the contours behind it to about 25 %, the way cartographers mask lines under a
   legend. Readability comes from cartography, not from a white box.
3. **Marginalia tell the truth.** The coordinates follow your finger, the scale bar changes
   with the zoom, the sun follows the time you pick. Nothing in the margin is decoration.

## 5. Logo

`public/logo.svg`: the **triangulation-point symbol** from topographic maps (a triangle with a
dot at its centre) drawn in navy, then "Geomatic Club" in Archivo, expanded, 800. One colour,
no accent. The same glyph is the favicon.

## 6. Motion plan

### Easings (in `lib/motion.ts`, the only place they're defined)

| Name | Curve | Use |
|---|---|---|
| `survey` | `cubic-bezier(0.16, 1, 0.3, 1)` | Lines drawing, labels arriving: fast start, decisive stop |
| `pan` | `cubic-bezier(0.65, 0, 0.35, 1)` | Zoom and the camera move |
| `fall` | `cubic-bezier(0.55, 0, 1, 0.45)` | The pin's drop (gravity) |
| `lock` | spring, stiffness 600, damping 32 | Reticle lock, button lock, stamp press |
| `scan` | linear | **Only** the satellite scan line |

Only `transform`, `opacity`, SVG stroke (`stroke-dashoffset`) and shader uniforms are animated.
The wordmark's "width" entrance uses `scaleX` per letter, not the `wdth` axis: changing the axis
forces the browser to redo the layout.

### A. Intro (≈ 3.6 s; tap to skip; once per session via `sessionStorage`)

| t (ms) | What happens | Tech |
|---|---|---|
| 0 – 600 | **Graticule**: lat/long lines draw outwards from the centre, staggered 40 ms | SVG `pathLength` + dashoffset, `survey` |
| 400 – 1300 | **Satellite pass**: a 1 px Hydro scan line sweeps top to bottom. Above it, the terrain appears as a **coarse raster** (16 px cells) | shader `uScan` 0→1 (linear), `uPixel` 16 |
| 1300 – 1750 | **Raster → vector**: the cells halve in steps (16→8→4→2→1, every 90 ms), then the contours sharpen into anti-aliased lines | `uPixel` stepped, `uVector` 0→1 |
| 1400 – 2200 | **Trilateration**: three Hydro signal circles grow from three points off-screen and meet at the fix point | SVG circles, `scale`, `survey` |
| 1700 – 2500 | **Reticle searches**: jitter that dies away (±6 px → 0); the coordinates count down to **36.8065° N, 10.1815° E** (`tabular-nums`, fixed width, no jitter) | rAF, noise × decay |
| 2500 | **Lock**: the corner brackets close in, scale 1.12 → 1 | `lock` spring |
| 2550 – 3000 | **Wordmark** resolves on the fix: letters `scaleX` 0.3 → 1 from their left edge, staggered 22 ms | `survey` |
| 3000 – 3600 | **Zoom out**: the shader's zoom 2.4 → 1 (contours tighten, as they would), the graticule scales down, the wordmark travels to the header (FLIP), the north arrow and the scale bar settle in (the scale bar's label goes 200 m → 500 m), the fields are **plotted**: each baseline draws left to right, staggered 70 ms | `pan` |

A tap at any moment jumps to the end state in 250 ms. With reduced motion, there's no intro.

### B. Living background

- **Breathing**: the noise field drifts about 0.003 units per second. Nobody notices it until they look away.
- **Touch**: each finger adds a Gaussian elevation bump (up to 4 at once). The contours bend
  around it, then relax over 1.2 s.
- **Tilt**: DeviceOrientation (asked for on iOS at the first tap; the pointer is the fallback). The graticule moves ±6 px and
  the contours ±10 px. The form never moves.
- **Readout**: in the bottom-right corner, the finger's position mapped to lat/long around Tunis, condensed and tabular.
- **Rendering**: the frame rate is capped by rAF, the pixel ratio at 2; it pauses when the tab is hidden; a static SVG of contours if there's no WebGL.

### C. Form

- **Focus**: the field's outline draws itself from its station point around the field (240 ms,
  `survey`), Hydro, 1.5 px; the label rises 4 px.
- **Traverse**: four stations in the left edge, staggered sideways (x = 8, 22, 10, 24 px) so the
  closing line makes a real quadrilateral. A valid field turns its station solid and draws the
  leg to the next station (300 ms). When all four are valid, the closing leg 4 → 1 draws, the
  polygon fills with Isohypse at 15 %, and the button **locks**.
- **Name as a place label**: Prénom + Nom is set along a contour curve above the cartouche
  (SVG `textPath`, letter-spaced 0.28em, navy at 40 %), with a gap cut in the line under the
  text, as on a real map. It updates as they type.
- **Time sets the sun**: 08:00 → azimuth 100° (east), altitude 12°; 13:00 → 180°, 58°; 18:00 →
  260° (west), 10°. The hillshade's light moves over 600 ms (`pan`); a small sun arc under the
  field shows where the sun is.
- **Date stamp**: on choosing a date, a navy stamp (« jeu. 14 nov. », double border, −4°)
  presses in: scale 1.18 → 1 with the `lock` spring.
- **Invalid**: the field's line "loses signal" (dashed, Faille, 3 px horizontal jitter for 280 ms),
  with the French message below it (`aria-live="polite"`), shown after blur or a send.

### D. Send

- **Before the polygon closes** the button is still pressable (a disabled button hides what's
  missing), drawn in its outline only: navy hairline, paper fill. Pressing it shows every error.
- **Lock**: the Balise fill comes in, corner brackets snap in (`lock`).
- **Press**: scale 0.97, `navigator.vibrate(10)`.
- **Sending**: GPS ping rings leave the button (1.2 s, repeating), a small satellite glyph
  orbits it on an ellipse (1.6 s per orbit), « Envoi en cours… ». Double sends are blocked.
- **Success**:
  1. (0 – 350 ms) the traverse polygon shrinks to its centroid; a pin grows from that point.
  2. (350 – 900 ms) the pin rises, then **drops** (`fall`, 380 ms) onto the fix point above the
     cartouche, squashes, settles (`lock`), and a soft ellipse shadow grows under it. On impact,
     the shader sends a **ripple**: an elevation wave travelling outwards, so the contours ring like
     a shock wave (900 ms).
  3. (700 ms →) the **ticket**, a map legend: its neatline draws, then it rises from the bottom.
     « C'est envoyé, Amine. Rendez-vous le jeudi 14 novembre 2026 à 14 h 30. » Legend rows with
     their symbols (pin, sun), and the reference code `GC-3680N-1018E-1114`: a point near Tunis
     taken from the name, and the date as MMDD. The same function makes it for the email.
  4. « Nouvelle inscription » plays it backwards: the ticket goes down, the pin lifts away, the
     traverse reopens empty, the fields are plotted again.
- **Error**: the reticle **loses its fix** (it jitters again, the signal circles shrink to
  nothing), every value is kept, a clear message appears (`role="alert"`) with « Réessayer ».

### Reduced motion

No intro, no tilt, no ripple, no drift (one still frame of the terrain). States change instantly
or with a 150 ms fade. The traverse and the stamp still appear, without moving.

## 7. Review: what looked generic, and what changed

| First idea | Why it read as generic | Now |
|---|---|---|
| A white card with a soft shadow behind the form | Any landing page | A cartouche: contours knocked out, a neatline frame |
| A rounded orange pill button | A stock UI-kit look | A rectangular survey plate (2 px radius) with corner brackets that lock |
| Fields fading in one after another | "Fade-and-slide on everything" | Fields **plotted**: baselines draw like a pen plotter |
| A mono font for the coordinates | The default "techy" pairing | Archivo condensed: one family, width as hierarchy |
| The success ticket as a toast/card | Generic confirmation | A map legend with symbols, the same language as the sheet |
| Animating the `wdth` axis for the wordmark | Looks clever, forces a relayout every frame | `scaleX` per letter: the same effect on the GPU |

## 8. Decisions taken alone (to confirm)

- **Today and a time already past**: a date can be today, but then the time must be later than
  now (Tunis time). Otherwise the brief's "no past date" would accept 08:00 at 17:00.
- **The button stays pressable** before everything is valid (accessibility), styled as "not locked".
- **Hours**: `lib/config.ts` → `SLOT = { start: "08:00", end: "18:00", stepMinutes: 30 }`.
