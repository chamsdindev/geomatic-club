# Geomatic Club — three directions (27 October 2026)

Same brief for all three: a phone-first registration (Prénom, Nom, date, heure, Envoyer), in French, with a
rich intro, an unforgettable success moment, and quiet synthesised sounds. Nothing here reuses the first version
(pale contour map, Archivo, triangle logo, navy/sage/orange). Mockups: `design/concepts/*.html`, screenshots in
`design/concepts/shots/` (390 × 844). Motion is written as GSAP master timelines with their labels.

Kept from before, whichever direction wins: the personal seed from the name, unique coordinates near Tunis, the
« Bienvenue sur la carte, {Prénom}. » sheet with its countdown, « Enregistrer ma carte » / « Partager », the
sound toggle (on by default, remembered), the reduced-motion version, Lighthouse mobile ≥ 90 / ≥ 95.

---

## A. « Fausses couleurs »: the false-colour satellite scene

The site is a Sentinel-2 scene of the Tunis area in infrared false colour (bands 8-4-3: vegetation red, water deep
teal, soil ochre, city cyan-grey). **The form composes the image**: each field you complete adds a band; the last
one turns it into the full composite. Success classifies the scene, and one 10 m pixel becomes yours.

**Palette** (contrast on « Nuit capteur »)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Nuit capteur | `#0A0C0E` | panels, sensor black | — |
| Blanc radiométrique | `#F1EEE6` | text | 16.9 : 1 |
| Rouge PIR (near infrared) | `#EF3B4A` | vegetation, the action, « your pixel » | 5.0 : 1 (black text on it 5.0 : 1) |
| Ocre sol | `#D9A25B` | labels, band keys | 8.6 : 1 |
| Cyan eau | `#3FB8C9` | focus, water, links | 8.3 : 1 |

**Type**: Anybody (variable width 50–150): condensed 62 for headlines, wide 125 for the name; Martian Mono (wdth
87.5) for every metadata key, coordinate and count.

```
┌────────────────────────────────────┐
│ ▦ Geomatic Club      GC 2026-10-27 │  scene ID, top right
│┌                                  ┐│
│  [ false-colour scene, full bleed ] │
│  fields red, lagoon teal, city grey │
│ ┌─────────────────────┐   ┌──────┐ │
│ │■ R B08 proche IR    │   │500 m │ │  band legend, scale
│ │■ V B04 rouge        │   └──────┘ │
│ │□ B B03 en attente   │            │
│▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚│  swath edge
│ Réserve ta place.                  │
│ Indique ton nom et choisis …       │
│ ■ B08  Prénom   Amine       acquis │  each row = a band
│ ■ B04  Nom      Ben Salah   acquis │
│ □ B03  Date     jeu. 14 nov.       │
│ □ SUN  Heure    --:--       soleil │
│ ┌────────────────────────────────┐ │
│ │ Envoyer                  3 / 4 │ │
└────────────────────────────────────┘
```

**Intro** (`tl.intro`, 2.6 s, tap to skip)
- `pass` 0–0.9 s: a push-broom sensor builds the scene row by row, grey (panchromatic).
- `bands` 0.9–1.8 s: the R, G and B layers arrive separately, each tinted and misaligned (−14/6, 10/−4, 4/12 px).
- `register` 1.8–2.2 s: co-registration: they snap into the false-colour composite (CustomEase with a short
  overshoot); the scene ID scrambles into place (ScrambleText); the raster logo fills cell by cell.
- `panel` 2.2–2.6 s: the metadata panel rises; its rows are typed.

**Form**: Prénom → B08, Nom → B04, Date → B03: each valid field tints the scene with its band, so the image goes
from grey to full false colour as the form fills. Heure sets the sun elevation (shadows and haze on the scene). An
invalid field shows a dropout: a stripe of dead pixels across the image, the row's band swatch flickering, the
French message under the row.

**Success** (`tl.success`)
- `hold` 0–0.4 s: everything stops; the scene dims.
- `classify` 0.4–1.4 s: unsupervised classification: the scene posterises into classes, the pixels grow (1 → 6 px).
- `locate` 1.4–2.2 s: a search box closes on one 10 m pixel; the camera zooms into it (nearest-neighbour, × 8);
  it turns red, « membre »; their name arrives letter by letter (SplitText) with their coordinates.
- `sheet` 2.2–2.9 s: the sheet rises (ScrollTrigger reveals its sections if it's taller than the screen).

**Sound**: each band arrives with a filtered-noise sweep at its own pitch; co-registration is one dry click; a field
validated is a short FM « data packet » blip; the classification is a descending quantised arpeggio; finding the
pixel is a bright sine ping over a low pad chord.

**Risks**
- *Performance*: a single fragment shader over one texture: light. A real Sentinel-2 crop (AVIF, ~150–250 KB) looks
  far better than procedural (Copernicus data is free and open, with attribution).
- *Readability*: saturated red behind text, so every text sits on opaque panels or plates.
- *Colour blindness*: the bands are red and green; each band is labelled, never colour alone.
- *Build time*: medium.

---

## B. « Le relief »: Djebel Boukornine in 3D

The real mountain above Hammam-Lif (576 m, « the one with two horns »), from real elevation data baked at build
time (AWS Terrain Tiles, Terrarium PNG, z12–13, a ~256 × 256 heightmap in the repo), drawn as a **TIN**: the
triangulated network surveyors build from measured points. You turn it with a finger. **Each field plants a
ranging rod (jalon) higher on the path to the summit**; success plants a flag with your name on top.

**Palette** (contrast on « Pin d'Alep »)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Pin d'Alep | `#0D2420` | night, forest, panels | — |
| Blanc | `#F5F3EC` | text | 14.7 : 1 |
| Calcaire (limestone) | `#D8D3C4` | lit rock, secondary text | 10.9 : 1 |
| Brume | `#8FA59F` | labels | 6.2 : 1 |
| Jalon | `#F25E45` | ranging rods, the flag, the action | pine text on it 5.0 : 1 |

**Type**: Bricolage Grotesque (optical size + width axes: 96 opsz / 85 wdth headlines, 20 opsz values); Spline
Sans Mono for elevations and coordinates.

```
┌────────────────────────────────────┐
│ ◎ Geomatic Club                    │
│          Djebel Boukornine         │
│          576 m  36.70 N  10.35 E   │
│             │                  576 │
│            /▲\ ▲              ┃    │  elevation scale
│          /  ╱╲╱ \             ┃    │
│     ╱╲ /  jalons  \     ╱╲    0    │
│   TIN relief, turn with a finger   │
│               ↻ Tourne le relief…  │
│ Réserve ta place.                  │
│ ▮ Prénom   Amine          J1 148 m │  each row = a jalon
│ ▮ Nom      Ben Salah      J2 296 m │
│ ▯ Date     jj/mm/aaaa     J3 431 m │
│ ▯ Heure    --:--          J4 576 m │
│ ┌────────────────────────────────┐ │
│ │▮ Envoyer                       │ │
└────────────────────────────────────┘
```

**Intro** (`tl.intro`, 3.0 s)
- `flat` 0–0.6 s: the area seen from straight above, flat, a shaded plan.
- `extrude` 0.6–1.8 s: the camera tilts 0 → 55° while the heights grow 0 → 1; the TIN's edges draw.
- `summits` 1.8–2.4 s: both horns are labelled; the elevation counts 0 → 576 m.
- `carnet` 2.4–3.0 s: the panel rises; the emblem draws itself (DrawSVG rings, the rim text scrambles).

**Form**: drag turns the mountain (Draggable + Inertia on the camera's yaw, Observer for swipes). Each valid field
plants a jalon one station higher (J1 148 m … J4 576 m) with a small drop. Heure moves the sun across the facets.
An invalid field: the jalon wobbles and falls (CustomWiggle), with the message under the row.

**Success** (`tl.success`)
- `hold` 0–0.4 s: frozen, dimmed.
- `climb` 0.4–1.6 s: the camera flies up the path to the summit (orbit + dolly).
- `plant` 1.6–2.2 s: the pole drops in, the flag unfurls with their name (SplitText).
- `rise` 2.2–3.0 s: the micro-relief around the summit reshapes from their seed (their own hilltop); the
  coordinates scramble into place.
- `sheet` 3.0 s →.

**Sound**: a very low wind bed (filtered noise); planting a jalon is a wooden « tock »; the extrusion is a rising
granular rumble; the summit is an open-fifth swell; the flag is a short noise flutter; an error is a hollow
descending tone.

**Risks**
- *Performance*: Three.js (~150 KB gzip) or OGL (~25 KB); ~20 k triangles is fine on a mid-range Android, but it
  heats the phone and costs battery. A static poster image must show before WebGL, for LCP.
- *Data*: AWS Terrain Tiles (SRTM and others, attribution required); the build step downloads one or two tiles.
- *Readability*: good (dark panel). Rotation with one finger competes with page scroll: the 3D area must own its
  gestures and the form must stay outside it.
- *Build time*: the longest (3D camera, gestures, no-WebGL fallback image).

---

## C. « L'instrument »: the phone becomes a GNSS receiver

The screen is a survey receiver: a housing, a transflective LCD, a **sky plot** (satellites by constellation:
GPS squares, Galileo circles, GLONASS triangles, BeiDou diamonds), a **bubble level** that follows the phone's real
tilt, and the fix ladder AUTONOME → DGPS → FLOAT → FIX. **Each field acquires satellites** (the plot fills, PDOP
drops from 9.9 to 0.9); « Envoyer » is the key that records the point. Success is the moment every surveyor
waits for: **FIX**. Then the receiver prints your *fiche signalétique* (the record card of a geodetic point).

**Palette** (contrast as used)

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Boîtier (housing) | `#1B1C1E` | the body | — |
| Écran (LCD) | `#E3E0CC` | screen, field wells | 12.8 : 1 on the body |
| Encre LCD | `#20231C` | screen text, segments | 12.0 : 1 on the screen |
| Ambre | `#FFA62B` | the keys, focus, backlight | 8.7 : 1 (body text on it 8.7 : 1) |
| Bulle (vial liquid) | `#BFD98A` | the level, « fix » state | 11.0 : 1 on the body |

**Type**: Doto (dot-matrix) for the big readouts only (FIX, counts); Chivo for labels and buttons; Chivo Mono for
data. Values typed in the fields are Chivo 18, never dot-matrix (readability).

```
┌────────────────────────────────────┐
│ ⊕G Geomatic Club                ⊖  │  screw
│╭──────────────────────────────────╮│
││ RTK FLOAT               PDOP 1.8 ││  LCD
││ [AUTONOME][DGPS][FLOAT][  FIX  ] ││  fix ladder
││        N                 ╭───╮   ││
││   ▲ R17   ■G24          │ ◯ │   ││  bubble level
││ O ─── ◆ ● ── E         ╰───╯   ││
││   ■G13  ●E11       Satellites   ││
││        S              09/14     ││
│╰──────────────────────────────────╯│
│ Prénom                             │
│ [ Amine                          ] │  LCD wells
│ Nom                                │
│ [ Ben Salah                      ] │
│ Date              Heure            │
│ [ 14.11.2026   ] [ --:--  (focus)] │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃            Envoyer             ┃ │  amber key
└────────────────────────────────────┘
```

**Intro** (`tl.intro`, 2.4 s)
- `power` 0–0.4 s: the LCD's backlight flickers on; the self-test lights every segment (« 88:88 »).
- `search` 0.4–1.4 s: « Recherche satellites… »: the sky plot's rings draw (DrawSVG); the first satellites
  appear, dashed (seen, not used).
- `level` 1.4–1.9 s: the bubble settles, then follows the real tilt.
- `ready` 1.9–2.4 s: status AUTONOME; the reticle G draws itself; the fields and the key arrive.

**Form**: each valid field acquires 3–4 satellites (they turn solid one after another), PDOP drops, the ladder
climbs. Heure is the epoch of the measurement. The bubble follows DeviceOrientation (`gsap.quickTo`, values mapped
with `mapRange`/`clamp`). « Envoyer » is a physical key (4 px travel, its edge collapses, `vibrate(10)`). An invalid
field: « Signal perdu », its satellites blink out, the message under the field.

**Success** (`tl.success`)
- `hold` 0–0.4 s: silence; the LCD dims.
- `fix` 0.4–1.0 s: **FIX** lands in dot-matrix (segments fill), RTK ± 0,012 m.
- `record` 1.0–1.6 s: « Point GC-0427 enregistré » scrolls in the point list.
- `print` 1.6–2.8 s: the *fiche signalétique* comes out of the slot line by line, like a thermal printer;
  ScrollTrigger reveals its sections if it's taller than the screen; the countdown ticks.

**Sound**: a power-on chirp; each satellite acquired is a tiny high blip on a pentatonic note, so filling the plot is
melodic; the fix is the classic two-tone beep (1568 → 2093 Hz); keys click; the printer is a short stepped
filtered-noise buzz; an error is a low double buzz.

**Risks**
- *Performance*: the lightest by far: DOM and SVG, no WebGL. Lighthouse ≥ 90 is easiest here.
- *Taste*: it can tip into a gadget « skin » if overdone; the housing must stay flat (no fake reflections, no
  drop shadows), the realism comes from the data (real constellation names, PDOP, fix states).
- *Tilt*: iOS asks permission for DeviceOrientation (on the first tap); without it the bubble follows the finger.
- *Build time*: the shortest.

---

## My recommendation

**C, with logo A (Réticule).** It's the only direction where the person *does* geomatics while filling the form
(acquiring satellites, levelling the instrument, getting a fix), it's the most readable in the sun, and the
fastest on a mid-range Android. A is the most striking visually and the boldest on Instagram; B is the most
spectacular but the most expensive to build and to run. Mixing works too: C's instrument whose success prints a
fiche with A's false-colour crop of their pixel, for example.
