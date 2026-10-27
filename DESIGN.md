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
2. **The page is the map.** No floating card, no shadow. The form sits in a **cartouche**: a
   paper "halo" layer fades the contours behind it to about 22 %, the way cartographers mask
   lines under a legend. It's a DOM layer above the terrain, not a shader effect, so it works
   the same with WebGL, with the static SVG fallback and with reduced motion. Readability comes
   from cartography, not from a white box.
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
forces the browser to redo the layout. **At rest the letters are the real expanded glyphs**
(Archivo `wdth` 125): each letter is already set in the expanded width from the first frame,
and only its `scaleX` goes 0.3 → 1. At the end every transform is `none`, so nothing is
swapped and nothing jumps. The letters keep `font-kerning: none` in both states for the same reason.

The intro runs on a small timeline of our own (`lib/timeline.ts`: tweens on one rAF clock, our
easings, a spring). "Tap to skip" seeks every track to its last frame in one step.

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
- **Success**: see §7. **Error**: the reticle **loses its fix** (it jitters again, the signal
  circles shrink to nothing), every value is kept, a clear message appears (`role="alert"`)
  with « Réessayer ».

### Reduced motion

No intro, no tilt, no ripple, no drift (one still frame of the terrain). States change instantly
or with a 150 ms fade. The traverse and the stamp still appear, without moving. The cartouche's
halo is the same layer as everywhere else.

## 7. Success: "you are now a point on the map"

The emotional idea: the person becomes a point on the map, its highest point. Cartographic,
confident, warm. No confetti, no « Félicitations !!! », no emoji.

| t (ms) from the server's `ok` | What happens | Sound |
|---|---|---|
| 0 | **Everything stops**: the terrain's clock freezes, the ping rings stop where they are, the background dims (`uDim` 0 → 1, 240 ms: paper × 0.92) | the ping stops; **silence** |
| 0 – 400 | **Stillness.** Nothing moves for 400 ms | silence (on purpose) |
| 400 – 750 | The traverse polygon shrinks to its centroid; a pin grows out of that point (`survey`) | — |
| 750 – 1250 | The pin rises 24 px (120 ms, `survey`), then **drops** (380 ms, `fall`) onto the crosshair in the map window | — |
| 1250 | **Impact**: the pin squashes (scaleY 0.86 → 1, `lock`), its shadow ellipse grows; a ripple runs through the terrain (900 ms); `navigator.vibrate([12, 60, 24])` | low thud |
| 1250 – 2650 | **The summit rises** under the pin: a Gaussian elevation (`uSummit`) climbs (1400 ms, `survey`), the contours tighten into rings around it: their point becomes the highest on the sheet. At the same time the terrain turns into **theirs**: the noise seed blends from the club's to a hash of their name (`uSeedMix` 0 → 1, 1800 ms, `pan`). The clock starts again, slowly | rising tone… |
| 1400 – 2600 | **Their name**, in map lettering beside the pin (Archivo `wdth` 125, 600, letter-spaced 0.18em, as summit names are lettered): each letter's outline is **drawn** (`stroke-dashoffset`), then filled | …resolves into a warm major chord as the last letter fills (≈ 2600) |
| 2300 – 2800 | **Their coordinates** settle under the name, digit by digit (`36.8412° N · 10.2207° E`, from a hash of name + date) | — |
| 2900 – 3500 | **The survey sheet** (« feuille de levé ») rises from the bottom: its neatline draws first, then its contents are plotted | — |

**The survey sheet** (a bottom sheet, the same neatline as the page):
- Large: « Bienvenue sur la carte, {Prénom}. »
- « Ton point est fixé. Le {jeudi 14 novembre} à {14 h 30}, on t'attend. »
- A legend: name, coordinates, date, time, reference `GC-…`, and a small render of **their**
  terrain with their summit (SVG contours from the same seed, `lib/terrain/contours.ts`).
- A live countdown: « dans 3 jours, 4 h » (minutes on the last day, « c'est maintenant »).
- Two actions: **« Enregistrer ma carte »** (a 1080 × 1920 image) and **« Partager »**
  (Web Share API with that image when the browser can share files, else a download).
  « Nouvelle inscription » is a quiet text link under them, and plays everything backwards.

**The share image** (`app/carte/route.tsx`, `next/og` `ImageResponse`): story format, paper
background, their terrain as SVG contours from **the same seed and the same noise** as the
shader (`lib/terrain/field.ts` is shared: an integer hash both sides, so the lattice is the same
bit for bit), their summit, their name in map lettering, their coordinates, date and time, the
wordmark.

**One noise, two languages.** The GLSL shader and `lib/terrain/field.ts` implement the same
value noise: a PCG integer hash on the lattice (WebGL2 has `uint`; TypeScript uses `Math.imul`),
quintic interpolation, five octaves, the same rotation between octaves. The fallback SVG, the
sheet's thumbnail and the share image are drawn by marching squares on that function.

**Reduced motion**: no freeze, drop, rise or ripple, but all the content: their terrain (one
still frame), their summit, their name in map lettering, the sheet, the countdown, the image.

## 8. Sound (`lib/sound.ts`, Web Audio only)

Instrument-like and quiet: survey gear, not a game. Everything is synthesised: oscillators,
filtered noise, gain envelopes, and one light convolution reverb made from a decaying noise
buffer. No audio file, no library.

- **Master** 0.25, through a gentle low-pass (7 kHz) and a compressor, so nothing is harsh.
- **Unlocking**: browsers refuse audio before a gesture. The `AudioContext` is created or
  resumed on the first `pointerdown`/`keydown` (the tap that skips the intro counts). The intro
  is silent unless that tap came first.
- **Toggle**: a small speaker drawn in the map's style, next to the north arrow. On by default,
  remembered in `localStorage` (inside try/catch). With reduced motion the sounds stay (they
  aren't motion), at the same level.
- **No pile-ups**: each sound has a minimum gap (debounce) and the ping's voices are capped.

| # | Moment (see §6) | Sound | Recipe |
|---|---|---|---|
| 1 | A field becomes valid, its station lights up | theodolite tick | 2 ms noise burst through a 4.2 kHz band-pass, plus a 1.8 kHz sine for 25 ms; gain 0.35 |
| 2 | The traverse closes (all four valid) | two-note rising chime | sines E6 then A6 (1319 → 1760 Hz), 90 ms apart, 6 ms attack, 600 ms release, a little reverb |
| 3 | « Envoyer » pressed | tactile click | 4 ms noise through a 2.5 kHz high-pass + a 140 Hz sine for 30 ms |
| 4 | Sending, with each ping ring (1.2 s) | GPS ping | sine 1046 Hz, 4 ms attack, 700 ms exponential decay, pitch glides −2 %, reverb send 0.4 |
| 5 | Intro lock / fix | confirmation beep | two short square-ish tones (sine + 3rd harmonic at 0.15), 1568 then 2093 Hz, 60 ms each, 30 ms apart |
| 6 | The 400 ms freeze | silence | everything ringing is faded out in 80 ms |
| 7 | Pin impact (t = 1250) | soft low thud | sine 92 → 48 Hz over 180 ms + 20 ms of noise through a 300 Hz low-pass |
| 8 | Summit rising (1250 → 2600) | rising tone into a chord | two detuned sines (±4 cents) glide A3 → E4 over 1.3 s, gentle 300 ms attack; at 2600 they resolve into a major chord (A3, C♯4, E4, A4), each voice two sines ±5 cents, 200 ms attack, 2.6 s release, reverb 0.5 |
| 9 | Error / signal lost | descending two-note | sines 880 → 659 Hz, the second detuned −12 cents, 120 ms each, soft attack |

## 9. Build order

1. The terrain shader (with the personal seed) and the intro. **Then a GitHub push and a Vercel
   preview, and a stop: Chams tests the performance on a real phone.**
2. Then: the form, its interactions and sounds; the send and success sequence; the survey sheet
   and the share image; the API stub; QA; the production deploy.

## 10. Review: what looked generic, and what changed

| First idea | Why it read as generic | Now |
|---|---|---|
| A white card with a soft shadow behind the form | Any landing page | A cartouche: contours knocked out, a neatline frame |
| A rounded orange pill button | A stock UI-kit look | A rectangular survey plate (2 px radius) with corner brackets that lock |
| Fields fading in one after another | "Fade-and-slide on everything" | Fields **plotted**: baselines draw like a pen plotter |
| A mono font for the coordinates | The default "techy" pairing | Archivo condensed: one family, width as hierarchy |
| The success ticket as a toast/card | Generic confirmation | A map legend with symbols, the same language as the sheet |
| Animating the `wdth` axis for the wordmark | Looks clever, forces a relayout every frame | `scaleX` per letter: the same effect on the GPU |

## 11. Decisions (confirmed by Chams on 27 October 2026)

- **Today and a time already past**: a date can be today, but then the time must be later than
  now (Tunis time). Otherwise the brief's "no past date" would accept 08:00 at 17:00.
- **The button stays pressable** before everything is valid (accessibility), styled as "not locked".
- **Hours**: `lib/config.ts` → `SLOT = { start: "08:00", end: "18:00", stepMinutes: 30 }`.
