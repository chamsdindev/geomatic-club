# Geomatic Club: brand

**The idea.** Raster to vector, the core of geomatics: the G's left half is drawn in pixel cells, its right half
in clean vector curves. The bar ends on a survey point.

**Construction.** A 256 grid, a 16-unit pixel cell, a 32-unit stroke (two cells), corners of radius 80 (outside)
and 48 (inside), flat terminals cut on the grid. The wordmark is B612 Bold (Airbus's cockpit-display typeface),
outlined, tracked −12, with the i's dot replaced by a square raster cell.

## Colours

| Name | Hex | RGB | Use |
|---|---|---|---|
| Jaune trépied | `#F2C230` | 242 194 48 | the app tile, the default background |
| Encre | `#16201A` | 22 32 26 | the G and the wordmark |
| Rouge prisme | `#D7262E` | 215 38 46 | a red G, **only on yellow or on white** |
| Blanc | `#FFFFFF` | 255 255 255 | reversed on ink or dark photos |

Ink on yellow: 10.0 : 1. Never a red circle behind the G (it reads as another company's G).

## Clear space and sizes

- **Clear space**: the height of the survey point (one tenth of the mark) on every side; for the lockups, the
  height of the wordmark's capital G.
- **Minimum size**: the mark 16 px (screen) / 5 mm (print); the horizontal lockup 120 px / 30 mm wide; below
  that, use the mark alone.
- **Containers**: the default is the yellow rounded square (`icon.svg`, corner radius 22 %); a circle (Instagram)
  crops the same yellow square.

## Files

| File | What |
|---|---|
| `mark.svg`, `mark-black.svg`, `mark-white.svg`, `mark-red.svg` | the G alone |
| `logo-horizontal*.svg` | mark + wordmark on one line (ink, black, white) |
| `logo-stacked*.svg` | mark above « Geomatic / Club » |
| `wordmark.svg` | the name alone, outlined |
| `icon.svg` | the app tile (favicon) |
| `icon-maskable.svg` | full-bleed tile for phones that mask corners |
| `favicon.ico` | 16, 32 and 48 px |
| `apple-touch-icon.png` | 180 px |
| `icon-192.png`, `icon-512.png`, `icon-*-maskable.png` | web app manifest |
| `*-2000.png` | every logo at 2000 px wide, transparent |

Sources: `design/logo3/mark.py` (the G) and `design/logo3/build.mjs` (wordmark, lockups). B612 is under the SIL
Open Font License 1.1.

**Not done**: a trademark search (INNORPI in Tunisia, WIPO) before anything is printed.
