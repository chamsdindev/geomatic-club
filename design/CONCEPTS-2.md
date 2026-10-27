# Geomatic Club: round 2 (27 October 2026)

Round 1 was too generic. This round starts from real references (`design/refs/*/refs.md`: every image, its licence,
and the one detail borrowed from it) and from the frontend-design skill's calibration list. Round 1 fell into two of
its tells: A was "near-black with one vermilion accent", and all three set small data labels in a monospace face. Round 2
avoids both: monospace only where the data really is tabular (an instrument readout), and no tinted black standing in
for black.

## The five directions, judged

| | Strongest idea | Weakest point | Verdict |
|---|---|---|---|
| A. Fausses couleurs | Filling the form composes a Sentinel-2 image band by band | Visually it's a colour treatment over a flat page; the form is still a list beside a picture | **Folded into D**: the false-colour raster becomes D's base plate |
| B. Le relief | Real DEM of Djebel Boukornine; ranging rods planted up the slope | The heaviest to build and run (3D camera, gestures fighting scroll), and E gives the 3D "wow" for less | **Cut**; its ranging rods move to C as the progress gauge |
| C. L'instrument | You *do* geomatics while filling: satellites acquired, PDOP falls, FIX | Round 1 looked like a dark gadget skin | **Finalist**, rebuilt: a tripod-yellow instrument, Leica-style status bar, the fix as the climax |
| D. Les calques | The map is made the way maps were made: colour-separation plates (bistre contours, blue water, green woods, black names) registered on a light table | Needs care to stay legible in 3D | **Finalist** |
| E. Nuage de points | A LiDAR scan of a Sidi Bou Saïd hillside resolves from noise; your name is scanned into it | WebGL; must stay fast on a mid-range Android | **Finalist** |

## C. « L'instrument »: a GNSS receiver on yellow tripod legs

The whole screen is the instrument body, painted the yellow of survey tripods (ref: *Audrey checks the display*).
The LCD carries a Leica-style status bar (satellites, radio link, battery), the fix states Navigated → Float → Fixed
(ref: RTKdata on the GS18) in French, a sky plot by constellation, and a bubble level. Below the screen, the fields
are recessed LCD wells. A ranging rod of four equal red and white segments (ref: rod by a boundary stone) fills as
the fields are valid. « Envoyer » is a black key with the red ring of a total station's objective (ref: Leica TS16).

| Name | Hex | Role |
|---|---|---|
| Jaune trépied | `#F2C230` | the body (ink on it 10.0 : 1) |
| Écran | `#DCE3D5` | LCD and field wells (ink on it 12.7 : 1) |
| Encre | `#16201A` | text, keys, bezels |
| Rouge prisme | `#D7262E` | the ring, the rod, FIX (white on it 5.0 : 1) |
| Blanc jalon | `#FFFFFF` | rod segments, key text |

**Type**: B612 (designed by Airbus for cockpit displays: legibility on instrument screens) for labels and
text; B612 Mono only for numeric readouts that line up; Doto (dot-matrix) only for the one word FIX.

**The main event**: each valid field acquires 3–4 satellites (dashed → solid), PDOP and the precision readout
count down, the fix ladder climbs, one rod segment turns red. The bubble follows the phone's tilt. The intro
(1.6 s) only boots the screen: you can type from the first second.

**Success**: silence (0.4 s), **FIX** stamps on the LCD, « Point GC-0427 enregistré », then the *fiche
signalétique* comes out, written like a benchmark disk (« Point de rendez-vous. Ne pas déplacer. ») with a field
book's ruled columns.

## D. « Les calques »: the map made by colour separation

A light table (`#EEF1F3`). Floating above it, in an exploded 3D stack that tilts with the phone, four transparent
film plates, the way topographic maps were produced: **Fond** (green woodland tint and shaded relief), **Courbes**
(bistre contours, values set in the line's gap, ref: USGS quad), **Hydrographie** (blue coastline with water
lining, ref: IGN Autun), **Écritures** (black names: « Golfe de Tunis » in italic, as water is named on maps). Each
plate has its registration marks. The form is the map's legend (ref: printed legend): a swatch, the plate's name, the
field. Each valid field registers one plate. **Your name is lettered on the Écritures plate as you type it.** The
footer is a GIS status bar (ref: QGIS): « EPSG:4326  1:25 000  36.8065 N  10.1815 E ».

| Name | Hex | Role |
|---|---|---|
| Table lumineuse | `#EEF1F3` | the light table |
| Noir | `#000000` | names, text, the action (true black: the black plate) |
| Bistre | `#8A4F27` | contours (5.7 : 1 on the table) |
| Bleu hydro | `#1F6FB2` | water, focus (4.7 : 1) |
| Vert bois | `#BBD99B` | woodland tint (fill only) |

**Type**: Overpass (an open interpretation of Highway Gothic, the lettering of road signs and many map legends)
for the interface; Newsreader italic for water names and the member's label (maps name water in italic serif).

**Success**: the plates fall into register (the marks overlap exactly), the composite map lies flat, their point
appears as a labelled feature, and the attribute table (`prenom`, `nom`, `date`, `heure`, `x`, `y`) rises as the
sheet.

## E. « Nuage de points »: Sidi Bou Saïd, scanned

Night over the gulf (`#0E1B2B`). A terrestrial LiDAR scan of a cliff-top village (procedural: terraces,
lime-washed cubes, domes, the sea as flat grey points) resolves from noise. One hue for the whole cloud (ref: Dual
Network); colour is kept for the member. Each valid field is a new scan station: rings expand from the scanner
(ref: Ouster OS1), the cloud gains density until it reads as surfaces (ref: Dyer building scan). The point count
climbs. On success your name is scanned into the cloud in Sidi Bou Saïd blue (ref: the door), standing on the
terrace.

| Name | Hex | Role |
|---|---|---|
| Nuit du golfe | `#0E1B2B` | the night, panels |
| Chaux | `#F2F5F7` | text, lime-washed walls (15.8 : 1) |
| Bleu Sidi Bou Saïd | `#1C9AD6` | the member's points, the action (5.5 : 1 both ways) |
| Ocre | `#C99A5B` | ground, labels (6.8 : 1) |
| Brume | `#9FB0C2` | secondary text (7.8 : 1) |

**Type**: Atkinson Hyperlegible Next (designed for low vision: readable over a busy cloud, in the sun) for the
interface; Workbench (a variable font whose axes add scanlines and bleed) for the name and the counts: type that
looks scanned.

## Prototypes

`design/proto/<concept>/index.html`: GSAP 3.13 (CDN), no backend. Each one has a skippable intro under 2.5 s,
four working fields (French dates everywhere, `lang="fr"`), « Envoyer », and the success sequence. Recordings and
key frames: `design/proto/_out/`. Two self-critique rounds each: `design/proto/<concept>/CRITIQUE.md`.

## Logos, round 2 (`design/logo2/`)

Twenty thumbnails (`thumbs-board.png`, 64 px with 16 px beside each), judged on four criteria: one idea, a silhouette
that survives 16 px, not confusable with any existing sign, currency or brand, meaningful to a geomatics student.

- **Out for confusion**: 06 reads « CC » (Creative Commons), 07 a no-entry sign, 09 « © », 20 a car badge,
  05 a Google G with an arrow, 01 a Wi-Fi icon, 12 a photo tripod, 13 a download arrow or a map pin, 14 « EE ».
- **Out as too literal or too weak**: 11, 15, 16 (low-poly cliché), 17, 18, 19.
- **Six kept**: 02 Raster puis vecteur, 03 Cheminement, 04 Hachures, 08 Pixels et un point, 10 Lignes de
  balayage, 01 as a reserve. **Three refined**: 02, 03, 04 (three different ideas; 08 duplicates 02, 10 reads as IBM's
  stripes).

| | Idea | Wordmark (outlined) | Verdict after the context tests |
|---|---|---|---|
| **Vectorisation** | The G's left half is raster cells, its right half a clean vector: raster to vector | Overpass ExtraBold, tracked −14, the i's dot a raster cell 1.3× the stem | **Fails**: white G on a red circle reads as Google's G at 34 px and in the favicon |
| **Cheminement** | The G is an open survey traverse: stations on cardinal bearings (0°, 45°, 90°, 135°), closing on a known point at the bar | Atkinson Hyperlegible Next ExtraBold, tracked −10, the i's dot a station ring | **Passes** every context, 16 px included |
| **Hachures** | The G engraved in Swiss rock hachures: thin on the side lit from the north-west, thick in shadow | Newsreader 600 (opsz 72), tracked +6, a summit point in the o's counter | **Fails at 16 px** (a grey smudge) and can read as a loading spinner |

Context boards: `context-{a,b,c}.png` (home-screen icon, Instagram, T-shirt, sticker, rubber stamp, browser tab,
the animation's halfway frame). Animations: `anim/logo-{a,b,c}.gif` (GSAP, 2 s: cells in scan order then the vector
half; the traverse surveyed leg by leg; the hachures engraved one by one).

## Recommendation

**Site: D, Les calques.** The interaction while filling is the most geomatic of the three and it reads instantly:
a plate drifts into register when its field is right, exactly what a cartographer checked on a press proof. It's
the lightest to run (CSS 3D, four drawn plates, no WebGL), it's readable in the sun (black on a light table), and
its success (the plates fall into register, your point appears, the attribute table rises) could only belong to a
geomatics club. **C** is a close second (its FIX moment is the strongest single beat). **E** is the most
spectacular and the riskiest.

**Logo: Cheminement**, the only one that passes every test. It works on any of the three sites.

Honest risks:
- D: the plates' small tabs are unreadable at this angle (decorative only); 0.6 s of empty light table before the
  attribute table rises; less « wow » than WebGL on a desktop.
- C: can tip into a gadget skin; yellow everywhere is loud; iOS asks permission for the tilt.
- E: ~150 k points measured on a Mac only, not yet on a mid-range Android; dark and top-heavy; WebGL needs a
  still poster first for Lighthouse.
- Cheminement: its octagonal outline could recall a stop sign at a glance; the gap of the G and the stations break
  it, and the brand colour must not be red.
- Trademark: I can't clear a mark; a professional search (INNORPI in Tunisia, WIPO) is needed before printing.
