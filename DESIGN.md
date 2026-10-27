# Geomatic Club: design

The site is a survey instrument: a GNSS receiver on tripod-yellow legs. Filling the form is the measurement
(satellites acquired, the position improving), « Envoyer » is the fix, and the confirmation is the point's record
card, printed out of the receiver. Chosen on 27 October 2026 from three prototypes (`design/CONCEPTS-2.md`); the
research and the earlier rounds are in `design/`.

## Principles

- **The visitor does geomatics**: every field changes what the receiver reads; nothing on screen is decoration.
- **Real instrument details**: the fix states (Autonome, DGNSS, Flottant, Fixe), PDOP, the sky plot by
  constellation, the bubble level, the ranging rod, the levelling staff, the stamped record.
- **One loud moment**: FIX. Everything else stays calm and readable in the sun.

## Tokens

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Jaune trépied | `#F2C230` | the body, the page | ink on it 10.0 : 1 |
| Écran | `#DCE3D5` | the LCD, the field wells | ink on it 12.7 : 1 |
| Encre | `#16201A` | text, keys, bezels, the G | white on it 16.9 : 1 |
| Rouge prisme | `#D7262E` | the key's target, the rod, errors' marker | white on it 5.0 : 1 |
| Blanc | `#FFFFFF` | the printed fiche, key text | |

**Type**: B612 (Airbus's cockpit-display face) for everything, 400 and 700, through `next/font`; « FIX » is drawn as
a 5 × 7 dot-matrix in SVG (no extra font). Scale: 30 (fiche title), 26 (receiver state), 18 (keys, field values),
16 (body), 15 (lead), 13–14 (labels, readouts), 10 (sky plot labels). Numbers use tabular figures; decimals the
French way (« 36,8245° N », « ± 0,012 m »), built with `Intl.NumberFormat`.

## Layout

One column, 440 px at most, centred on the yellow at every width. Top to bottom: the logo and the model plate, the
LCD (status bar, state, fix ladder, sky plot and level, message line), the lead, the four fields, the ranging rod,
« Envoyer ». On screens under 800 px tall the LCD tightens so « Envoyer » stays in view (checked at 360 × 780). The
fiche prints out of a slot under the LCD and takes the form's place in the page, which scrolls as one; phones keep
room under the last button so Safari's floating bar never covers it.

## Motion (GSAP, `components/receiver/Motion.tsx`)

One labelled timeline per sequence; reduced motion skips the boot and makes every change instant.

| Sequence | Labels | What happens |
|---|---|---|
| Boot (≤ 2.4 s, once per tab, a tap or a key skips it) | `power` 0 · `pixels` 0.25 · `vector` 0.8 · `sky` 1.55 · `done` 2.4 | backlight flicker; the G's left half arrives cell by cell, its right half as pixels that MorphSVG turns into vector; the sky plot's rings draw (DrawSVG); the first 4 satellites |
| A field becomes valid | (tweens) | its satellites turn solid (sound: tick), PDOP and H/V count down, the ladder climbs (sound: two-tone beep), a rod segment turns red; all four valid: the key's target fills (chime) |
| Typing | (loop) | the field's own satellites blink: the receiver listens |
| Sending | `in` (repeats) | the satellites converge on the centre and back, a GPS ping per pulse |
| Fix and print | `hold` 0 · `fix` 0.4 · `record` 1.0 · `print` 1.5 | 0.4 s of stillness; the LCD inverts, FIX in dot-matrix, `vibrate([12, 60, 24])`, the fix beep; « Point GC-XXXX enregistré »; the form leaves, the sky plot folds away, the fiche prints in 16 steps with printer ticks, the title types itself (SplitText), the staff fills; the page returns to its top; on a small phone, ScrollTrigger reveals the rest as the page is scrolled |
| Error | (tweens) | back to Autonome, « Signal perdu », the data kept, « Réessayer » |
| Nouvelle inscription | (reverse) | the fiche retracts into the slot, the LCD un-inverts, the form returns empty |

ScrambleText always ends on the exact final string (an `onComplete` writes it).

## Sound (`lib/sound.ts`)

Web Audio only, master 0.25 through a low-pass and a compressor, a short synthetic reverb, a minimum gap per
sound. On by default; the toggle sits in the LCD's status bar and is remembered on the device. The context starts
on the first tap or key.

| Moment | Sound |
|---|---|
| A satellite acquired | 3 ms band-passed noise + a 1.8 kHz blip |
| The status climbs | 880 then 1175 Hz, 70 ms each |
| All four fields valid | 1319 then 1760 Hz, 0.6 s, a little reverb |
| « Envoyer » | 4 ms high-passed noise + a 140 Hz thump |
| Sending | 1046 Hz ping, 0.7 s decay, with each pulse |
| FIX | 1568 then 2093 Hz, 60 ms each, with a third harmonic |
| Printing | 16 soft noise ticks, 70 ms apart |
| Error | 880 then 659 Hz (−12 cents), soft attack |

## The member's point

`lib/point.ts`: a hash of first name, name and date gives the point (± 0.04° of latitude, ± 0.05° of longitude
around Tunis) and the reference `GC-XXXX` (4 Crockford base-32 characters). The same registration always lands on
the same point.

## Logo (`public/brand/README.md`)

The G is half raster, half vector: raster to vector, the core of geomatics. Rounded-square construction on a 16-unit
pixel grid, the bar ending on a survey point; default container a yellow rounded square with the G in ink; never a
red circle (it read as another company's G, `design/logo3/google-test.png`). Wordmark: B612 Bold, outlined, the
i's dot a square raster cell. In the site: the header's lockup, the boot screen's G.

## A future mobile app

The same instrument carries over to React Native: the LCD becomes a native view, GSAP's timelines map to
Reanimated sequences, the bubble level reads the device's motion sensors directly (no permission prompt), and the
sounds become short bundled files. Not started.

## What the first version got wrong (never again)

A contour-map wallpaper, geomatics behind the form instead of in it, timid colour, type without a voice, and a logo
nobody could own.
