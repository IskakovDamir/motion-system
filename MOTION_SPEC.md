# Motion spec

The style guide for new work in the style of the eight reference videos. Every number below was
measured. Each table names its source, and anything that was not measured is in section 9, not here.

**Conventions.** Time is in frames at 60 fps (`REF_FPS = 60`); 60 f = 1 s. Positions are % of frame
width (% W) or height (% H). A "px" value from a v1-v4 row is a 1080p pixel; a "px" value from a
v5-v8 row is a pixel of the 918 px high recorded picture (x 1.176 for 1080p). Scales are factors,
rotations degrees, luma 0-255. "Active" frames are a curve's active window (2% rule, section 1);
"built" frames are the length of the motion token that reproduces it (`measured.ts`). An ease written
`outStrong 20/23` means token `EASE.outStrong`, 20 f active, 23 f built. Technique ids
(`v4.text-word-rise-fade`) open with `cd scripts/analysis && ../../.venv/bin/python techniques.py show <id>`.

Source tags: **[syn]** `analysis/synthesis.json` · **[tok]** `analysis/tokens.json` ·
**[timing.ts] [easing.ts] [type.ts] [measured.ts]** `src/motion/tokens/` · **[rows]** technique
records (`analysis/techniques_digest.md`, `techniques.py show`, `techniques.typography()`) ·
**[tl]** grep of section lines in `analysis/*/timeline.md` · **[seg]** `analysis/*/segments.json` ·
**[dec]** `analysis/DECISIONS.md`.

---

## 1. Sources

| key | kind | picture | frames (s) | segments G / M / L | shots | boundaries | techniques | curves |
|---|---|---|---|---|---|---|---|---|
| v1 | promo | 1920 x 1080, constant 60 fps | 1069 (17.82) | 6 / 0 / 0 | 6 | 5 | 24 | 20 |
| v2 | promo | 1920 x 1080, constant 60 fps | 1971 (32.85) | 22 / 0 / 0 | 22 | 21 | 26 | 21 |
| v3 | promo | 1920 x 1080, constant 60 fps | 1469 (24.48) | 9 / 0 / 0 | 9 | 8 | 23 | 26 |
| v4 | promo | 1920 x 1080, constant 60 fps | 1688 (28.13) | 8 / 0 / 0 | 8 | 7 | 32 | 42 |
| v5 | screen recording | 1622 x 918 crop, variable rate, 24 fps material (3:2 cadence) | 4609 (76.82) | 7 / 19 / 5 | 26 | 29 | 96 | 115 |
| v6 | screen recording | 1622 x 918 crop, variable rate, 24 fps material (3:2 cadence) | 1809 (30.15) | 10 / 7 / 0 | 17 | 16 | 61 | 45 |
| v7 | screen recording | 1622 x 918 crop, variable rate, 24 fps with 30/60 fps runs | 4766 (79.43) | 26 / 8 / 3 | 34 | 36 | 98 | 110 |
| v8 | screen recording | 1622 x 918 crop, variable rate, 24 fps with 30/60 fps runs | 3627 (60.45) | 11 / 16 / 0 | 27 | 26 | 108 | 110 |
| all | | | 21008 (350.1) | 99 / 50 / 8 | 149 | 148 | 468 | 489 |

*Source: frames [seg] `frame_count`; classes, shots, boundaries [syn] `per_video`; techniques [rows]
digest headers; curves [tok] `curves` by video; picture and cadence [dec].* Classes: GRAPHICS = designed
graphics only, MIXED = graphics over or around footage, LIVE = footage only. LIVE segments are left
out of every tempo number.

**How it was measured.** All eight videos sit on one 60 fps analysis grid (frame = round((pts - first
pts) x 60)); v5-v8 are web-player captures cropped to the 1622 x 918 picture below a static bar, with
the player's burned-in volume icon masked out. Cut candidates were over-collected by three detectors
and confirmed or rejected by eye; each video was cut into ~800-frame chunks (26 in all), every chunk
was inspected frame by frame, reviewed by an independent critic and fixed, then merged per video into
`segments.json`, `timeline.md` and `curves/`; a coded coverage scan then listed every run of changed
pictures that no row named (154 runs, 1929 frames at first scan) and each got a verdict and a second
review. Curves were fitted with a Python port of Remotion's own `spring`, `Easing.bezier` and
`interpolate` (matched to 4e-16) and clustered into 44 shared ease shapes. *Source: [dec].*

| method choice | what it means for a builder | source |
|---|---|---|
| Duration = active window | from the last sample within 2% of rest before the half-way point to the first sample after which progress stays within 2% of the end | [dec] Curves |
| Integer durations | every token is whole frames at 60 fps; bezier y control points stay in 0..1 unless the data overshoots | [dec] Curves |
| Shared ease shapes | a measured curve = one of 44 shapes + an integer duration; it must match within 1 f and normalised RMSE <= 0.05 | [dec] Build, [tok] `rmse_max` 0.049 |
| Spring tokens | stretched to the duration with `durationInFrames`, so only the damping ratio matters | [dec] Build |
| Recording accuracy | v5-v8 durations carry +-1 f capture jitter and 2-3 f quantisation; x positions +-0.7% | [dec] Frames |
| No second copy | technique numbers are read straight from the timelines (`techniques.py`), never re-typed | [dec] Build |

---

## 2. Graphics tempo

<!-- tempo {"median_shot_frames": 117.0, "p10": 53.8, "p25": 80.0, "p75": 192.0, "p90": 233.4, "n": 149, "cuts_per_second": 0.436} -->

Shot = one GRAPHICS or MIXED segment.

| statistic | frames | seconds |
|---|---|---|
| n | 149 shots | |
| p10 | 53.8 | 0.90 |
| p25 | 80.0 | 1.33 |
| median | 117.0 | 1.95 |
| mean | 136.66 | 2.28 |
| p75 | 192.0 | 3.20 |
| p90 | 233.4 | 3.89 |
| min / max | 1 / 418 | 0.02 / 6.97 |
| cuts per second | 0.436 | 148 boundaries over 339.37 graphics s |

*Source: [syn] `graphics_tempo`.*

### Per video

| key | shots | median | p25 | p75 | min | max | cuts / s | graphics s |
|---|---|---|---|---|---|---|---|---|
| v1 | 6 | 203.0 | 130.25 | 224.0 | 96 | 230 | 0.281 | 17.82 |
| v2 | 22 | 94.0 | 57.0 | 113.0 | 1 | 170 | 0.639 | 32.85 |
| v3 | 9 | 119.0 | 113.0 | 218.0 | 59 | 293 | 0.327 | 24.48 |
| v4 | 8 | 228.5 | 168.5 | 233.5 | 152 | 279 | 0.249 | 28.13 |
| v5 | 26 | 186.0 | 87.25 | 232.5 | 22 | 418 | 0.398 | 72.93 |
| v6 | 17 | 99.0 | 81.0 | 129.0 | 1 | 302 | 0.531 | 30.15 |
| v7 | 34 | 106.0 | 75.5 | 156.0 | 40 | 367 | 0.496 | 72.55 |
| v8 | 27 | 130.0 | 78.5 | 191.0 | 32 | 329 | 0.430 | 60.45 |

*Source: [syn] `per_video[].shot_frames`, `cuts_per_second`, `graphics_seconds`.* The promos span the
whole range (v4 0.249 to v2 0.639 cuts/s); the recordings sit between 0.398 and 0.531.

### Accelerations and holds

| item | measured | source |
|---|---|---|
| Accelerating runs (>= 3 short shots) | one: v6 f0-f12, shots of 7 / 1 / 5 f. These are v6 S01-S03, the player's capture pre-roll, not designed material. No acceleration run exists in the designed footage. | [syn] `accelerations`, [seg] v6 S01-S03 |
| Holds (flagged shots) | 15: v3 S08 278, S09 293 · v4 S02 279, S04 238 · v5 S06 235, S08 418, S09 242, S16 363, S19 302 · v6 S09 302 · v7 S17 251, S29 367, S32 327 · v8 S03 329, S08 260 (frames) | [syn] `holds` |

### Motion inside holds

A held shot still moves. v5 and v6 have no dead-still hold ("holds are never still", `v5.cam-hold-drift`,
`v6.cam-slow-zoom-drift`). v1 has still stretches (camera at rest f195-f225 in S02, motion difference 0
over f499-f551 in S03).

| hold motion | rate | technique |
|---|---|---|
| linear camera drift | 0.2-1.1 px/f, or scale drift -0.09 to +0.03 %/f | `v5.cam-hold-drift` |
| constant zoom-out on lockups and stat layouts | -0.037 to -0.057 %/f; push-in +0.05 to +0.06 %/f on the 3D stack | `v6.cam-slow-zoom-drift` |
| group scale creep over a static background | x1.016 over 82 f (0.020 %/f) | `v8.layout-scale-creep` |
| title creep that runs into the exit | 1.000 -> 1.035 over f237-f300 (~0.055 %/f), unaffected by a footage cut under it | `v5.logo-scale-creep` |
| slow push-in during holds | +3.5% over 107 f (ease-out, `springFirm` 97/197); +1.9% over 80 f linear into a zoom-through | `v1.cam-slow-push-in` |
| UI layer push-in (the headline beside it does not scale) | +2.0-5.0% about a point on the UI | `v2.ui-slow-push-in` |
| linear recede after landing | the whole group keeps shrinking about the frame centre | `v5.layout-slow-recede` |
| icon idle float | sine, amplitude 0.93% H, period 156.9 f, own phase per icon | `v1.icon-idle-float` |

*Source: [rows].*

---

## 3. Timing, easing and stagger tokens

A motion token is `{duration, delay, ease}` in frames at 60 fps (`easing.ts`). `measured.ts` holds one
motion per measured curve: 489 curves, 488 reproduced by the 44 shared shapes, 1 uncovered
(`v7.text-caption-fade-out.i2`, section 9). *Source: [tok], [measured.ts].*

### SHOT: shot lengths

| token | frames | seconds | meaning |
|---|---|---|---|
| `SHOT.flash` | 54 | 0.90 | p10, the shortest cuts |
| `SHOT.quick` | 80 | 1.33 | p25 |
| `SHOT.base` | 117 | 1.95 | median: the base shot length |
| `SHOT.long` | 192 | 3.20 | p75 |
| `SHOT.hold` | 233 | 3.88 | p90: holds |

*Source: [timing.ts] `SHOT`.*

### DURATION: how long a movement takes, by technique family

Values are **active windows**. Default ease = the shape most used by that family's measured curves.

| token | frames | n | p25-p75 | range | default ease (count) |
|---|---|---|---|---|---|
| `DURATION.text` | 18 | 74 | 13.25-25 | 5-52 | `outFirm` (12) |
| `DURATION.ui` | 16 | 77 | 10-24 | 4-217 | `outFirm` (9) |
| `DURATION.transition` | 21 | 97 | 16-29 | 7-84 | `outStrong`, `inAccelerate` (13 each) |
| `DURATION.camera` | 28 | 68 | 22-39.75 | 12-97 | `inOutWhipOver` (13) |
| `DURATION.icon` | 14 | 26 | 11-21.75 | 5-65 | `outFirm` (5) |
| `DURATION.card` | 16 | 24 | 10.75-22.25 | 9-60 | `outStrong` (5) |
| `DURATION.layout` | 14 | 20 | 10.75-20.25 | 7-44 | `inGentleOver` (3) |
| `DURATION.logo` | 15 | 19 | 10-22.5 | 6-89 | `inOutWhipOver` (6) |
| `DURATION.object3d` | 22 | 18 | 17-29.25 | 12-53 | 4 shapes tied at 2 |
| `DURATION.particle` | 17 | 15 | 15-25.5 | 7-56 | `inOutWhipOver` (5) |
| `DURATION.cursor` | 20 | 14 | 15-25 | 5-43 | `outFirm2` (3) |
| `DURATION.effect` | 21 | 14 | 16-34 | 15-72 | `springFirm`, `inOutGlideOver`, `inGentleOver` (3 each) |
| `DURATION.shape` | 20 | 13 | 13-23 | 6-27 | `outStrong2` (3) |
| `DURATION.grid` | 8 | 3 | 7.5-15.5 | 7-23 | `outStrong2` (2) |
| `DURATION.footage` | 18 | 3 | 17.5-22 | 17-26 | none repeats |
| `DURATION.mask` | 26 | 2 | 20.75-32.25 | 15-38 | none repeats |
| `DURATION.counter` | 65 | 2 | 51.5-78.5 | 38-92 | none repeats |
| `DURATION.background` | 55 | 1 | - | 55 | `outStrong` (1) |

*Source: tokens [timing.ts] `DURATION`; n, quartiles, ranges [syn] `curves_by_category` (camera 28.5,
layout 14.5, mask 26.5 there, rounded in timing.ts); default ease [tok] `curves` grouped by technique
category.*

**Active window -> token length.** A token's built length is longer than its active window because
eases spend time within 2% of rest. Active fraction `a` per shape is in the easing table below; set
`duration = active / a`. Check: `v1.trans-dip-to-bg` is 9 f active on `inGentleOver` (a 0.72) and built
at 13 f; `v1.cam-slow-push-in` is 97 f active on `springFirm` (a 0.48) and built at 197 f.

### TRANSITION: boundary lengths

| token | frames | n | range |
|---|---|---|---|
| `hardCut` | 0 | 64 | 0 |
| `whip` | 53 | 30 | 30-91 |
| `morph` | 32 | 14 | 16-99 |
| `dipToBg` | 26 | 11 | 12-49 |
| `push` | 40 | 9 | 27-74 |
| `zoomThrough` | 32 | 6 | 22-66 |
| `whipTilt` | 24 | 4 | 18-47 |
| `flash` | 30 | 2 | 26-35 |
| `maskWipe` | 25 | 2 | 25 |
| `meltImplode`, `panelSwap`, `pullBackMorph`, `pullBackReveal` | 33, 31, 71, 77 | 1 each | - |
| `punchInStutter`, `sphereCollapse`, `whipPan` | 21, 20, 38 | 1 each | - |

*Source: [timing.ts] `TRANSITION`; n and range [syn] `transitions`. Frames run from the first to the
last frame of the boundary. Behaviour of each type: section 5.*

### STAGGER: frames between successive units

| token | frames | n | range |
|---|---|---|---|
| `STAGGER.char` | 2 | 53 | 0.15-25 |
| `STAGGER.word` | 7 | 48 | 2-17 |
| `STAGGER.line` | 13 | 18 | 2-48 |
| `STAGGER.item` | 4 | 5 | 3-6 |

*Source: [timing.ts] `STAGGER`.*

### EASE: the 44 shapes

Families: **out** = fast start, long settle (things arriving); **in** = slow start, fast end (things
leaving); **inOut** = S curve (A-to-B moves, camera); **spring**. `inOutWhipOver` is the house
ease-in-out of v1-v4 (logo slides, packet hops, morphs, camera pull-backs).

| name | bezier x1, y1, x2, y2 | shape | uses | top categories | a |
|---|---|---|---|---|---|
| `inOutWhipOver` | 0.7, 0, 0.2, 1.1 | S, half at 46%, peak 4.2x avg, to 101% | 49 | cam 13, trans 9, logo 6, particle 5 | 0.59 |
| `outStrong` | 0.2, 0.8, 0.6, 1 | out, half at 19% | 41 | trans 13, ui 5, card 5, text 5 | 0.79 |
| `outFirm` | 0.2, 0.4, 0.3, 1 | out, half at 22% | 41 | text 12, ui 9, icon 5, card 3 | 0.78 |
| `outStrong2` | 0.2, 0.8, 0.2, 1 | out, half at 13% | 37 | trans 8, text 6, ui 5, icon 4 | 0.65 |
| `inAccelerate` | 0.7, 0, 0.9, 0.6 | in, half at 82% | 31 | trans 13, cam 5, card 3, text 3 | 0.79 |
| `inOutGlideOver` | 0.5, 0.4, 0.7, 1.1 | S, half at 44%, peak 1.4x, to 101% | 26 | text 7, ui 3, fx 3, cam 2 | 0.82 |
| `outSnap` | 0.0719, 1.1383, 0.7849, 0.9422 | out, half at 10% | 23 | trans 5, icon 4, ui 4, text 3 | 0.77 |
| `inLaunch` | 0.8, 0, 1, 0.6 | in, half at 89% | 19 | trans 12, cam 6, 3d 1 | 0.76 |
| `inOutWhip` | 0.6, 0, 0.2, 1 | S, half at 42%, peak 3.4x | 18 | ui 7, cam 5, trans 2, layout 2 | 0.69 |
| `springFirm` | spring 100 / 16 / 1, ratio 0.80 | small overshoot | 18 | ui 4, trans 3, fx 3, cam 2 | 0.48 |
| `inGentleOver` | 0.8, 0, 0.7, 1.1 | in, half at 67%, to 101% | 17 | layout 3, trans 3, fx 3, text 2 | 0.72 |
| `outFirm2` | 0.3, 0.4, 0.1, 1 | out, half at 22% | 14 | cursor 3, text 3, icon 2, ui 2 | 0.73 |
| `outFirmOver` | 0.3, 0.4, 0.2, 1.1 | out, half at 23%, to 101% | 13 | ui 6, text 4, trans 2, logo 1 | 0.62 |
| `inOutWhip2` | 0.8736, 0.0731, 0, 0.9495 | S, half at 45%, peak 14.8x | 11 | cam 5, trans 1, layout 1, shape 1 | 0.69 |
| `inOutWhip3` | 0.9, 0, 0.2, 1 | S, half at 54%, peak 6.7x | 11 | cam 6, trans 2, cursor 1, counter 1 | 0.63 |
| `inOutWhip4` | 0.7, 0, 0.1, 0.8 | S, half at 44%, peak 4.6x | 10 | cam 5, ui 2, 3d 1, trans 1 | 0.76 |
| `inOutWhip5` | 1, -0.0027, 0, 0.9943 | S, half at 50%, peak 50.7x | 8 | trans 2, layout 2, cam 1, card 1 | 0.58 |
| `outSoft` | 0.5, 0, 0.1, 1 | out, half at 35% | 7 | text 2, ui 2, cursor 2, fx 1 | 0.69 |
| `inOutGlide` | 0.6, 0, 0.7, 1 | S, half at 61%, peak 1.9x | 7 | ui 3, trans 2, shape 1, fx 1 | 0.79 |
| `outSnap2` | 0, 1, 0.1, 1 | out, half at 2% | 7 | text 3, ui 2, shape 1, trans 1 | 0.43 |
| `outStrong3` | 0.2, 0.8, 0.1, 0.8 | out, half at 12% | 7 | card 2, trans 2, text 1, cam 1 | 0.91 |
| `outSnapOver` | 0.1, 0.8, 0.2, 1.25 | out, half at 8%, to 107% | 6 | ui 5, text 1 | 0.93 |
| `outStrongOver` | 0.2, 1.2, 0.8, 1.1 | out, half at 13%, to 106% | 6 | text 5, shape 1 | 0.95 |
| `outStrongOver2` | 0, 0.6, 0.9, 1.1 | out, half at 20%, to 101% | 6 | cam 1, card 1, text 1, trans 1 | 0.83 |
| `inAccelerate2` | 0.6, 0.2, 1, 0.6 | in, half at 80% | 6 | trans 5, cam 1 | 0.94 |
| `inOutSweepOver` | 0.4, 0, 0.4, 1.25 | S, half at 38%, peak 2.4x, to 103% | 5 | ui 2, fx 1, text 1, icon 1 | 0.86 |
| `inOutGlideOver2` | 0.3, 0, 0.8, 1.25 | S, half at 48%, peak 1.5x, to 103% | 5 | particle 1, cam 1, fx 1, text 1 | 0.91 |
| `inGentle` | 0.2, 0, 0.9, 0.6 | in, half at 69% | 4 | counter 1, text 1, cam 1, particle 1 | 0.91 |
| `outSnapOver2` | 0.3, 1.4, 0.3, 1.25 | out, half at 11%, to 116% | 4 | icon 3, trans 1 | 0.94 |
| `inLaunch2` | 0, 0.1572, 0.9908, -0.304 | in, half at 93% | 4 | trans 3, layout 1 | 0.99 |
| `inGentle2` | 0.12, 0, 0.39, 0 | in, half at 66% | 4 | ui 1, text 1, layout 1, 3d 1 | 0.85 |
| `outSoft2` | 0.6325, 0.0004, 0, 0.9049 | out, half at 37% | 4 | fx 1, logo 1, 3d 1, cam 1 | 0.72 |
| `outFirm3` | 0.4171, 0.6267, 0.0299, 0.9184 | out, half at 22% | 4 | text 2, logo 1, cam 1 | 0.80 |
| `outSnapOver3` | 0, 1.2, 0.4, 1.1 | out, half at 4%, to 106% | 3 | text 2, card 1 | 0.88 |
| `outSoft3` | 0.9, 1.2, 0.1, 0.8 | out, half at 34% | 3 | ui 2, cam 1 | 0.89 |
| `inOutWhip6` | 0.9, 0.2, 0.4, 1 | S, half at 59%, peak 3.8x | 2 | 3d 1, ui 1 | 0.78 |
| `outSoftOver` | 0.6, 0, 0.1, 1.25 | out, half at 37%, to 103% | 1 | text 1 | 0.80 |
| `outSnapOver4` | 0.2, 1.4, 0.2, 1.25 | out, half at 8%, to 116% | 1 | text 1 | 0.93 |
| `outSoft4` | 0, 0.4, 0.6, 0.6 | out, half at 35% | 1 | cursor 1 | 0.98 |
| `inOutWhipOver2` | 0.9, 0.2, 0.1, 1.25 | S, half at 48%, peak 10.2x, to 104% | 1 | trans 1 | 0.84 |
| `outFirmOver2` | 0.5, 1, 0.2, 1.1 | out, half at 22%, to 103% | 1 | ui 1 | 0.82 |
| `inOutWhipOver3` | 0.8328, 0.5308, 0.2144, 1.5918 | S, half at 41%, peak 5.5x, to 117% | 1 | particle 1 | 0.94 |
| `outSnapOver5` | 0.3607, 2.1104, 0.4157, 0.7379 | out, half at 10%, to 120% | 1 | icon 1 | 0.94 |
| `inOutWhipOverAnticipate` | 0.7345, -0.3999, 0.3409, 1.9956 | S, half at 49%, peak 5.6x, to 124%, pulls back to -5% first | 1 | cam 1 | 0.69 |

*Source: names, parameters, shape notes, uses and top categories [easing.ts] (generated from [tok]
`eases`); a = active window / full duration, computed for this spec from each shape with the
`curvekit.active_window` 2% rule and `remotion_math` (2000-step sampling).*

**Measured direction rule.** Across the transition and text records, an element that arrives decelerates
(an out shape), an element that leaves accelerates (an in shape), and a move between two rests uses an
S curve (sections 4 and 5).

---

## 4. Text reveal recipes

### REVEAL tokens

| token | method | unit | techniques | frames per unit (median) | range |
|---|---|---|---|---|---|
| `popWord` | pop | word | 31 | 7.0 | 2-13 |
| `popBlock` | pop | block | 13 | 11.5 | 3-18 |
| `popLine` | pop | line | 5 | 2.0 | 2-3 |
| `popChar` | pop | char | 2 | 3.65 | 3.6-3.7 |
| `riseBlock` | rise | block | 36 | 14.0 | 2.2-28 |
| `riseWord` | rise | word | 12 | 10.0 | 4.2-17 |
| `riseChar` | rise | char | 9 | 1.9 | 0.3-16 |
| `riseLine` | rise | line | 7 | 16.0 | 10-20 |
| `typewriterChar` | typewriter | char | 30 | 1.6 | 0.32-25 |
| `typewriterLine` | typewriter | line | 1 | 15.0 | - |
| `blurBlock` | blur | block | 11 | 20.5 | 6-33 |
| `blurChar` | blur | char | 9 | 2.05 | 1.8-21.2 |
| `blurWord` | blur | word | 3 | 10.0 | 5-13 |
| `blurLine` | blur | line | 1 | 48.0 | - |
| `fadeBlock` | fade | block | 7 | 17.5 | 12-25 |
| `fadeChar` | fade | char | 4 | 2.23 | 1.5-5 |
| `fadeLine` | fade | line | 1 | 28.0 | - |
| `maskBlock` | mask | block | 4 | 12.0 | - |
| `maskChar` | mask | char | 2 | 4.35 | 3.7-5 |
| `scaleBlock` | scale | block | 5 | 12.0 | 12 |
| `scaleLine` | scale | line | 1 | 13.0 | - |
| `countChar`, `countLine` | count | char, line | 1 each | 2.0, 11.0 | - |
| `countBlock`, `swapBlock`, `swapLine`, `typewriterBlock` | count, swap, typewriter | | 1-2 each | not measured | - |

*Source: [type.ts] `REVEAL` (stagger is null in every entry; use `STAGGER` or the recipes below).*

### Entrances

| recipe | unit, speed, stagger | what moves | ease | technique |
|---|---|---|---|---|
| Word pop | word; one frame per word; 4-9 f between words, steady inside a line, kept across a line break | the line is laid out first; each word appears at full ink in its final place, left to right; no fade, slide or scale | step | `v2.text-word-pop`, `v3.text-word-pop`, `v1.text-word-pop` |
| Word stream | word; 2-3 f per word, wrapping lines | a bullet first, then words pop | step | `v1.text-stream-words`, `v3.ui-text-stream` |
| Word rise-fade | word; 20 f each; 4.2 f constant stagger across the line break | rise 18 px (1.67% H) in whole-pixel steps + opacity 0 -> 1 | `outStrong` 20/23 (critically damped springs, stiffness 247-329, also fit) | `v4.text-word-rise-fade` |
| Letter rise-fade | letter; 19 f each; 2.1 f apart | rise 17 px + fade; no x move, scale or blur | `outFirm` 19/24 | `v4.text-letter-rise-fade` |
| Block rise-fade | block; 20-21 f | rise 13 px + fade | `outFirm` 21/24 | `v4.text-tagline-rise-in` |
| Headline drop-in | line; 14-15 f; 2-12 f after its layout appears | drop 10-12 px + fade; stays screen-fixed while the canvas zooms | `outStrong` 14/18 | `v4.text-headline-drop-in` |
| Caption word blur-rise | word; 11-20 f each; stagger follows the voice, 10-30 f | opacity 0 -> 1, rise 0.8-1.9% H, de-blur from sigma ~3 px; words land in a pre-centred line (no reflow) | `outFirmOver` 16/22 | `v7.text-word-blur-rise` |
| Input word stream | word; 10-16 f each; ~3.5 f apart (several fading at once) | fade, de-blur from sigma 5 px, rise 5 px | `outStrong` 21/25 | `v7.ui-prompt-word-stream` |
| Caption letter sweep | letter; 10-25 f per letter; 1.2-2 f between letter starts; 30-40 f per word or line; lines 8-21 f apart | each letter goes from blurred and transparent to sharp, left to right, while the block drifts (below) | `outFirmOver` 33/50 | `v5.text-caption-word-fade` |
| Focus roll | word; in 23 f defocused, focus peak, out 10 f starting 5 f after the peak; peaks 10-11 f apart | the next word peaks as the previous defocuses; stacked lines indent further right | `inOutSweepOver` 23/25 | `v5.text-caption-focus-roll` |
| Typewriter with caret | char; 1.5-1.76 f per char, uniform | solid caret | step | `v1.text-typewriter-char` |
| Typewriter, no caret | char; 0.85-1.2 f per char linear with 1-2 f pauses every 2-5 letters, or 2.5 f with 2-5 f jitter | placeholder clears in one frame; text past the field width is clipped | step; typed width `inOutGlideOver` 52/62 | `v4.text-typewriter-input`, `v2.text-typewriter-char` |
| Typewriter, letter fade | char; 2.6-3.0 f per char (ramps 5 -> 0.4 f, stalls up to 21 f) | each letter fades in place to 0.83-0.86 of white and steps to white ~10 f later, so the newest 3-4 letters are grey | `outSoft` 19/28 | `v7.text-type-letter-fade` |
| Typewriter, fade trail | char; 0.85-1.0 f per char | newest 2-3 characters light grey, darkening over 2-4 f | step | `v8.text-type-on-fade-trail` |
| Stream reveal | front; 40-85 px/f in chat blocks, 11.6-13 px/f (1.45-2.1 f per letter), 78-155 px/f in headlines; lines parallel or 2-7 f apart | letters arrive light (and blurred) and darken behind the front, a gradient of 1-2 letters to 2-3 words | `inOutGlideOver` 14/15 | `v8.text-stream-reveal` |
| Feathered front | letter; 3.5-3.7 f per letter (front 3.9-6.6 px/f) | a soft feathered front reveals left to right | - | `v8.text-status-type-on` |
| Label fade-slide | front 9-12 px/f (1 word) or 20-60 px/f; 2nd line 3-4 f later | keeps darkening 14-56 f and slides 11-40 px right | `outStrong2` 51/78 | `v8.text-label-fade-slide` |
| Line slide-blur | line; 10-14 f each; 2nd line 0-14 f later | lines enter from opposite frame edges as horizontal motion-blur streaks and lock without overshoot | `outStrong2` 11/14 | `v5.text-line-slide-blur` |
| Line slide-blur, short | line; ~15 f; 2nd line ~5 f later | slides 2.9-8.1% W in from the right, stops flush left, near-critical spring (ratio 1.03) | `outFirm` 13/15 | `v6.text-line-slide-blur` |
| Line slide with overshoot | line; 18-20 f; 5 f apart | from opposite edges, overshoot 0.9-1.3% W, then the perspective swing (section 6) | `outStrongOver` 18/17 | `v5.text-line-slide-overshoot` |
| Converge slide | word; 5 f | heavy motion blur, small words from the right, the big word from the left one picture later with a +9 px overshoot | `outSnap2` 5/10 | `v5.text-converge-slide` |
| Letter converge | letter; by side: left f15, top f18, bottom f18-21, right f28 | letters fly in from all four edges with blur, land at ~x1.15 spacing (overshoot 12-13 px), then the line rises 9.0% H in 20 f | `outFirm2` 20/28 | `v6.text-letter-converge` |
| Oversized scale-down | block; 10-40 f | enters x1.2-1.5 (often blurred, cut by the frame edge) and scales to rest about its baseline | `outStrong2` 25/37 | `v6.text-scale-down-settle` |
| Word shrink-in | word; 10 f | from ~x3.6 with zoom blur, 63% of the shrink in the first picture step | `outFirm3` 10/10 | `v6.text-word-shrink-in` |
| Word whip-in | word; 16 f; 15 f apart | words whip in from the right in reading order and decelerate (may land 4 px past rest) | `outSnap2` 15/37 | `v6.text-word-whip-in` |
| Word rise stagger | word; 15-18 f; 5-6 f apart | words rise from below the frame | `inOutWhip2` 18/22 | `v6.text-word-rise-stagger` |
| Spring rise | block; settle ~20 f; 2nd element 8 f later | rises from below the frame, overshoot 4.3-4.6% H | `outSnapOver` 17/18 | `v8.text-spring-rise` |
| Word drop bounce | word; 15-17 f; 2 f apart | drops from above the frame with vertical blur, overshoot 5.2% H below rest | `outSnapOver4` 15/15 | `v8.text-word-drop-bounce` |
| Type + rise | char; ~1.6 chars per f, or 2.2 f per char | rises 14.4% H with a 4 px overshoot, or 7.7% H soft; centred only once complete | `outStrongOver` 27/27 | `v8.text-tag-type-rise` |
| Letter pop, tightening | letter; 3.6-3.7 f per letter, out of order | letters pop at loose spacing that tightens; a glyph grows from a dot to x1.04 | `outSnapOver3` 23/24 | `v8.text-letter-pop-tighten` |
| Scramble decode | letter; 2.7 f per letter, out of order | resolves through placeholder bars and dots | step | `v7.text-scramble-decode` |
| Tracking settle | line; 15 f | lands horizontally stretched (gaps up to +51 px) and tightens leftward | `outFirm` 12/15 | `v5.text-tracking-settle` |
| Type-on swing | 2 letters per picture; 10 f | the line swings flat from an 8 deg perspective tilt, sharpens, cap height doubles to 8.8% H | `outSnap2` 10/21 | `v5.text-type-swing-in` |
| Ghost word type | word; ~8 f apart (4-11) | each word shows 1-2 pictures as a dim ghost ~2% H below, then snaps up | step | `v5.text-word-ghost-type` |
| Liquid fly-in | line; 10 f in x, 18 f rise | wavy smears from opposite sides resolve into letters | `outFirm3` 10/11 | `v5.text-liquid-flyin` |
| Block rise-in | block; 23 f (92% opacity in 15 f) | rises 3.3% H relative to its UI | `outStrong2` 23/35 | `v8.text-block-rise-in` |
| List cascade | item; 8-10 f apart | fades in while sliding with its block | `outFirmOver` 28/44 | `v8.text-list-cascade-fade` |
| Label blur-fade | block; 33 f | fades and de-blurs in place, middle characters first | `outFirm2` 33/43 | `v8.text-label-blur-fade-in` |
| Label fade in place | block; 14 f, 6 f after the mark settles | no slide or scale | `outFirm` 14/18 | `v2.text-label-fade-in` |
| Counter-motion label drop | block; 14 f | drops 11.5% H into its slot against a rising wordmark | ease-out, no curve | `v6.text-label-drop` |
| Bracket spring-in | pair; 17 f | slides in from both sides, faint and blurred near the edges, overshoot 1.1% W | `outStrongOver` 17/17 | `v6.text-bracket-spring-in` |

*Source: [rows]; eases and frames [tok] / [measured.ts].*

### Exits

| recipe | timing | what moves | ease | technique |
|---|---|---|---|---|
| Fade out in place | 5-14 f, all words together | no move, no scale | `inGentleOver` 9/12 | `v3.text-fade-out` |
| Headline fade-out | 11-12 f | no move, no blur | `inAccelerate` 11/15 | `v4.text-headline-fade-out` |
| Fade under a push | 1.0 -> 0.27 in 25 f, then covered | no blur | `inGentleOver` 26/33 | `v8.text-fade-out` |
| Caption line exit | 8.5-19 f per line, lines 8-16 f apart, reading order | each line fades and defocuses in place while the block drifts; long captions roll first-in-first-out, each line living 40-60 f | `springFirm` 12/22 | `v5.text-caption-line-fade-out` |
| Single-word caption fade | near-linear, 5-7% per frame; removed at ~27% after 11 f, or crossfades with the next word in 19 f | sentence captions are cleared by hard cuts instead | `inOutGlideOver` 19/23 | `v7.text-caption-fade-out` |
| Letter-wise dissolve | 19 f, left parts first, sub-lines 2-4 f ahead | the block drifts up meanwhile | `inOutGlideOver` 19/23 | `v8.text-dissolve-out` |
| Block exit up | ease-in to ~13 px/f, growing vertical blur, no settle | its card zooms away | `inAccelerate` 33/42 | `v8.text-block-exit-up` |
| Un-type | 2.4 f per character from the end | the pill narrows 370 -> 6 px around it | - | `v7.shape-pill-to-line-out` |
| Edge peek exit | held 23 f cut by the top edge (43-46 px visible), then gone in 2 pictures | | step | `v5.text-edge-peek-exit` |

### Settled text: emphasis and idle

| device | measured | technique |
|---|---|---|
| Caption drift | the block moves at constant velocity for its whole life: left-side captions -0.10 to -0.37 %W/f and up to -0.40 %H/f, right-side +0.15 to +0.33 %W/f | `v5.text-caption-drift` |
| Tone sweep | ink luma 26 -> 90 by a left-to-right sweep in 16 f while sliding | `v6.text-tone-sweep` |
| Dim out | ink luma 95 -> 175, near-linear, 18 f, before the exit | `v6.text-dim-out` |
| Word dim toggle | to luma 151-167 in 8-11 f, hold 2-6 f, back in 8-11 f | `v8.text-word-dim-toggle` |
| Shimmer sweep | one lighter band (ink 0.48-0.58 of final) at 18-23 px/f, once | `v8.text-shimmer-sweep` |
| Looping fade sweep | band 3.5-4.4 px/f, letters fall to 0.28-0.5 of ink; loops every 62-63 f; FWHM 0.87 word widths | `v8.text-status-fade-sweep` |
| Stepped shimmer | darker band in 12 f, about every 36 f, stepped at 2-3 f | `v2.ui-status-text-shimmer` |
| Focus dim | older lines fade back (darkest ink 165 -> 235, 106 -> 136) while the new line darkens 168 -> 15 | `v8.text-focus-dim` |
| Line counter-shift | two lines kick apart 3-4 %W in one blurred picture, lock in 7 f | `v5.text-line-counter-shift` (`outStrong2` 7/9) |
| Lift to header | x0.68 and 25 %H up in 17 f; or x0.88 and 15.6 %H in 30 f with a small overshoot | `v5.text-lift-to-header` (`inOutWhipOver` 17/27) |

*Source: [rows].*

---

## 5. Transition catalogue

149 boundaries: hard cut 64 (43%), whip 30 (20%), morph 14, dip-to-bg 11, push 9, zoom-through 6,
whip-tilt 4, flash 2, mask-wipe 2, and seven types seen once. Many whips and pushes hide a hard cut at
peak speed. *Source: [syn] `transitions`; videos per type [seg] `transitions`.*

| type | n (where) | frames median (range) | outgoing side | incoming side | curves: ease active/built | technique |
|---|---|---|---|---|---|---|
| hard cut | 64 (v1 1, v2 17, v4 1, v5 20, v6 6, v7 12, v8 7) | 0 | picture replaced between two frames; often still accelerating: pull-back cut at x0.69, whip exit at 1.5-2.6% H per f, both on `inLaunch`/`inAccelerate` | complete in the cut frame, or built from the empty canvas after 1-6 empty frames (v2), or arriving mid-move and settling: punch-in x2.38-2.5 in 20-24 f, slide-in 2.9% W in 25 f, whip-in from 60% H low in 26 f | `v8.cam-punch-in-cut-settle` `outSnap` 21/27; `v8.cam-whip-in-settle` `outStrong3` 26/27; `v8.cam-cut-in-settle` `outStrong2` 39/60 | `v2.trans-hard-cut`, `v6.cam-pull-back-cut`, `v7.cam-whip-exit-up`, `v5.trans-motion-match-cut` |
| whip | 30 (v6 2, v7 21, v8 7) | 53 (30-91) | eases in from a drift or rest (12-51 f) with growing directional blur; replaced at speed; or stops dead on one crisp picture just before the cut | arrives still moving with more blur and decelerates on a strong ease-out (15-59 f); variants jump scale through the cut (x2.37, x0.455, pull-backs x0.398-0.535, push-in x1.86, punch-in x1.4-2.33) or spin (-9.5 deg out, +9.7 deg in) | `v7.trans-whip-push-left` `outStrong2` 29/46; `v7.trans-whip-push-up` `outStrong` 15/18; `v8.trans-whip-up` `outStrong2` 20/29; `v8.trans-whip-down` `outSnap` 29/36; `v6.trans-whip-left` (outgoing) `inAccelerate` 23/28 | `v7.trans-whip-push-left`, `v7.trans-punch-in-whip-up`, `v7.trans-spin-zoom-whip`, `v8.trans-blur-whip-reframe` |
| morph | 14 (v2 2, v3 2, v4 1, v5 1, v6 2, v8 6) | 31.5 (16-99) | elements travel on straight lines into the next layout's slots on one shared ease, shrinking or growing to fit | the new layout forms around them; old text swaps 1 f before the morph ends | `v2.trans-icon-converge-morph` `inOutWhipOver` 13/20 (x1.00 -> 0.64, peak 47 px/f); `v3.trans-hex-gather` `inOutWhipOver` 24/41 (starts 2.4 f apart); `v4.trans-tile-hex-morph` `springFirm` 18/33 (radial wave 62 px/f); `v6.trans-split-morph` `inOutWhipOver` 12/20; `v8.trans-card-zoom-to-center` `inOutWhip3` 48/77 (x2.0); `v8.trans-card-zoom-fill` `inOutWhip` 21/29 (x1.41) | `v2.trans-hex-fly-into-ui`, `v8.trans-mascot-converge-fly`, `v8.trans-stack-push-flatten` |
| dip-to-bg | 11 (v1 3, v3 6, v4 2) | 26 (12-49) | fades out in place on an ease-in, 7-11 f; panels shrink to 0.944-0.97 or the layout zooms up 3-6% | 0-3 empty background frames, then the next layout pops in one frame or builds in on an ease-out; the headline drops in last | `v1.trans-dip-to-bg` `inGentleOver` 9/13; `v3.trans-dip-to-bg` `inGentleOver` 8/11 | `v1.trans-dip-to-bg`, `v3.trans-dip-to-bg`, `v4.trans-dip-to-bg` |
| push | 9 (v2 1, v6 4, v8 4) | 40 (27-74) | accelerates out of the top edge on a strong ease-in (17-35 f, to 27-170 px/f) with vertical blur; v6 after an anticipation dip of 3.8-3.9% H | rises from below the frame and brakes (15-34 f); v6 adds an opacity blink; v2 scrolls one strip 111% H | `v6.trans-push-up` `inOutWhip4` 23/28; `v8.trans-push-up` `outStrong2` 19/29; `v8.trans-push-up-columns` `outSnap2` 26/58; `v2.trans-scroll-push` `inOutWhipOver` 17/29; anticipation `inGentle2` 12/14 | `v6.trans-push-up`, `v8.trans-push-up`, `v6.layout-anticipate-exit-up` |
| zoom-through | 6 (v1, v5, v6, v7, v8 2) | 31.5 (22-66) | accelerates toward the camera about a point (x1.0 -> 1.4; 1.035 -> 1.521 in 12 f; x1.02 -> x3.14 in 17 f, ease-in on log2 scale) with radial streaks or zoom blur | continues the forward motion: lands oversized (x1.14 -> 1.0 in 10 f), or keeps zooming to x1.43, or a 7 f cross-dissolve into a tunnel; v5 passes one dark vignetted picture (frame luma 20.8) | `v1.trans-zoom-through-mark` `inOutWhipOver` 23/36; `v5.trans-zoom-through-radial` `outStrong2` 7/9; `v6.trans-zoom-through` `outStrongOver2` 10/11; `v7.trans-zoom-through-cut` `outSnap` 21/27; `v8.trans-zoom-through-dissolve` `inAccelerate2` 17/16 | as named |
| whip-tilt | 4 (v5) | 24 (18-47) | the camera moves down a rigid canvas; the old layout exits up on a strong ease-in | blur peaks mid-move; the next layout arrives from below and decelerates (17-46 f); one hides a cut at the speed peak | `inOutWhip5` 46/78 | `v5.trans-whip-tilt` |
| whip-pan | 1 (v5) | 38 | accelerates left, horizontal blur 13 -> 148 px/f; 10 f of blended shots | lands decelerating in 12 f; the caption layer above is not whipped | `outStrong` 12/13 | `v5.trans-whip-pan` |
| flash | 2 (v5) | 30.5 (26-35) | mirror-image stars slide apart (spacing 2.7 -> 54.4% W in 7 pictures) as frame luma goes 43 -> 138 -> 42; or a ring blooms into a radial white-out (luma 37 -> 216 in 18 f) | the next composition opens between the stars, or comes down from white in 10 f with a focus rack | `v5.trans-star-flash` `inOutWhip` 10/14; `v5.trans-flash-white` `inOutGlide` 18/23 | `v5.fx-exposure-recover` |
| mask-wipe | 2 (v7, one is the replay) | 25 | a soft-edged white disc grows from the hero point on an exponential ease-in until the frame is white in 16-18 f; white holds 7 f | the next layout drops onto the white zoomed (x1.59) and blurred and settles | `inLaunch` 16/22; settle `outSnap` 26/35 | `v7.trans-iris-white`, `v7.cam-zoom-out-settle-in` |
| sphere-collapse | 1 (v2) | 20 | a flat honeycomb wraps into a globe (sides curl first, round from f108) and shrinks to a 22 px dot at the frame centre | the dot vanishes in one frame and the next layout appears in that frame, no empty frame | `inOutGlide` 13/13 | `v2.trans-sphere-collapse` |
| melt-implode | 1 (v5) | 33 | liquid displacement and bloom to near white (luma 41 -> 144 in 10 f); one glowing blob rotates clockwise and collapses (26.8% W -> 0 in 15 f, critically damped) | a point flare with a full-width horizontal streak dies on black | `springFirm` 15/30 | `v5.trans-melt-implode`, `v5.fx-anamorphic-flare` |
| punch-in-stutter | 1 (v6) | 21 | stepped, differently centred crops x1.25 / 1.25 / 1.97 / 3.85 / 2.30, each held to the next picture | 4 empty frames, then the next text | keyframes in the curve sidecar; `inLaunch2` 10/9 is only an envelope | `v6.trans-punch-in-stutter` |
| panel-swap | 1 (v4) | 31 | one window slides 21 px right while fading, removed at ~11% opacity; the headline fades out | the new window and headline drop in; the other window is untouched | `v4.card-slide-swap` 11/14 | `v4.trans-panel-swap` |
| pull-back-morph | 1 (v4) | 71 | the headline fades; the canvas pulls back 1.000 -> 0.553 with a left pan | a second group fades in from the right; card contents cross-dissolve into one icon at peak speed; the new headline drops in | `v4.cam-pullback` `inOutWhipOver` 39/63 | `v4.trans-pullback-morph` |
| pull-back-reveal | 1 (v4) | 77 | the headline fades; the canvas pulls back about a fixed point | ten groups ripple in 3 f apart; the new headline stays in front of the tiles passing under it | as above | `v4.trans-pullback-reveal` |

*Source: n, frames [syn] `transitions`; behaviour and curves [rows] + [tok].*

### Halves used around dip-to-bg and cuts

| half | measured | ease | technique |
|---|---|---|---|
| panel shrink-fade out | fade 9-10 f while shrinking to ~0.97 about its own centre; a headline goes 1 f ahead | `inGentleOver` 9/10 | `v3.ui-panel-shrink-fade-out` |
| window shrink-fade out | fade + scale to 0.944 about its centre | `inAccelerate` 11/15 | `v4.layout-shrink-fade-out` |
| layout zoom-fade out | fade + scale 1.000 -> 1.032 about the frame centre, gone after 11 f | `inGentleOver` 10/11 | `v4.layout-zoom-fade-out` |
| card shrink-fade out | scale to 0.966, cut at 87% | `inAccelerate` 9/12 | `v1.card-shrink-fade-out` |
| panel grow-fade in | 0.973 -> 1.000 about its centre, 13 f, 2-3 f stagger | `outFirm2` 12/16 | `v3.ui-panel-grow-fade-in` |
| window rise-scale-fade in | rise 30 px (2.8% H), 0.970 -> 1.000, second window +3 f | `outStrong` 14/18 | `v4.card-rise-scale-fade-in` |
| layout zoom-settle in | appears at 1.112 and settles to 1.000 | `outFirm` 26/32 | `v4.layout-zoom-settle-in` |
| card slide-fade in | from +8.6% W, second card +3 f | `outStrong2` 13/19 | `v1.card-slide-fade-in` |

*Source: [rows], [tok].*

---

## 6. Rules

### 3D

3D is rare. Of 143 segment-level 3D lines, 114 say none. v1, v3 and v4 have no 3D; v2 has one
(the globe wrap of its T02 exit). v5 has 14 segments with 3D content, v7 8, v8 4, v6 2. *Source: [tl]
`**3D:**`.*

| rule | measured | ease | technique |
|---|---|---|---|
| A 3D slab turns once, then settles | half turn about the vertical axis, entered mid-spin on a cut with horizontal blur, braking to frontal rest in 18 f | `outFirm` 18/23 | `v5.3d-card-spin-y` |
| Then it recedes | 1.53 -> 1.00 of rest size in 21 f, centre fixed, small landing dip to 0.9875 | not fitted (section 9) | `v5.3d-card-recede` |
| And leaves straight up | after a 22 f hover, ease-in through the top edge, shrinking to 0.96; cut mid-exit with ~82% still in frame | `inAccelerate` 40/51 | `v5.3d-card-exit-up` |
| A device explodes into layers | push-in +18%, turn ~44 deg about the vertical axis, 4 parallel layers along a diagonal | `outSoft2` 20/26 | `v6.3d-layer-explode` |
| Layers collapse and fan out the other way | back into one stack in 12 f, abrupt end, then fan out in 7 f | `inLaunch` 12/16 | `v6.3d-stack-collapse` |
| A stack fans out | far end +15% W in 39 f with a slight overshoot; 10-12 flat layers, weak perspective | `outStrong` 39/48 | `v8.3d-stack-fan-out` |
| A card yaws, then recedes | yaw 0 -> 26.5 deg (left edge to camera) in 53 f, then x0.80 while sliding left 3 -> 11 px/f | `inOutWhip6` 53/68 | `v8.3d-card-turn-recede` |
| A globe rises, then spins | dome rises 50.9% H, then constant spin 0.18% W/f about its vertical axis | `outStrong2` 25/38 | `v6.3d-globe-rise` |
| Objects fly into depth | toward a central vanishing point, scale 1.45-1.48 -> 0.72-0.90, decelerating, each with a particle trail | `outFirm` 27/34 | `v5.3d-origami-converge` |
| Tunnel fly-through | one-point perspective dolly; flat sprites float out of the vanishing point to a ring, x0.35 -> x1.05 | `outStrong` 27/33 | `v8.3d-tunnel-flythrough` |
| Type gets pseudo-perspective after it lands | flat -> fixed linear size taper (keystone; e.g. 13.9 -> 7.3 %H left to right), 12-19 f, staggered right behind the entrance; line pairs taper in opposite directions | `inOutWhip4` 17/21 | `v5.3d-perspective-swing` |
| Card rows sit on a cylinder | side cards turn toward the centre (outer edge ~7% taller); the headline shares the curve; a tree layout turns its outer cards to a far/near edge ratio of 0.82 | static | [tl] v5 S17, S18; v5 S15 |
| Mirrored tilt | outer cards turn as a mirrored pair, top edges +-9.8 deg | `inGentleOver` 23/30 | `v5.card-mirror-tilt` |
| Camera swings the UI plane into 3D | push to x2.50 and recoil to x2.17 | `inOutWhipOverAnticipate` 45/63 | `v5.cam-swing-3d-push` |
| Orbit drift on close-ups | slides -0.12 to -0.13 %W/f, tilt changes ~5 deg per 10-20 f, no ease | linear | `v5.cam-orbit-drift` |
| Field of view | one fitted pinhole: focal ~2618 px, about 34 deg horizontal | - | [tl] v8 S08 |
| Depth of field | the background is unreadably soft behind 3D pointers and soft spheres; near layers blur during an orbit push | - | [tl] v7 S01, S11; `v6.cam-orbit-push` |
| Materials | described in luminance: satin light-grey slabs, glossy dark pointers with specular rims, matte flat-shaded shards | - | [tl] v5, v7 |

*Source: [rows], [tl], [tok]. Token: `DURATION.object3d` 22 f (12-53).*

### Typography

**Roles.** What the references set per text role. Size is cap height in % of frame height; font size
on a frame `H` px high = `capHeight / 100 x H / CAP_RATIO`. Font size at 1080 is computed here from
those two values.

| role | family | weight | cap % H | font px at 1080 | tracking em | case | rows |
|---|---|---|---|---|---|---|---|
| display | Inter Tight | 400 | 10.6 | 157.4 | -0.019 | sentence | 42 |
| headline | Inter Tight | 400 | 5.2 | 77.2 | 0.002 | sentence | 42 |
| subhead | Inter | 400 | 4.4 | 65.3 | family default | mixed | 5 |
| body | Inter | 400 | 2.4 | 35.6 | -0.004 | sentence | 1 |
| ui | Inter | 400 | 2.83 | 42.0 | -0.007 | sentence | 48 |
| label | Inter | 400 | 3.3 | 49.0 | 0.003 | title | 73 |
| caption | Inter | 500 | 4.44 | 65.9 | 0.014 | sentence | 32 |
| counter | Inter | 400 | 2.18 | 32.4 | family default | mixed | 12 |
| code | JetBrains Mono | 400 | 2.35 | 34.8 | family default | sentence | 9 |

*Source: [type.ts] `TYPE`, `CAP_RATIO` (Inter / Inter Tight 0.7275, JetBrains Mono 0.73, Archivo
0.686, Unbounded 0.75, Saira 0.688).*

**Families.** The role medians are dominated by Inter rows. The heavy display families appear only in
v5-v7 and have their own measured weights, cases and spacing.

| family (FONT key) | rows | where | weight | cap % H | tracking em (n) | case | measured use |
|---|---|---|---|---|---|---|---|
| Inter (`ui`) | 155 | v2, v5-v8 | 400-700, median 400 | 1.1-13.5, median 4.1 | -0.046 to 0.276, median -0.009 (16) | sentence, title | UI text, captions (600-700 in v5), labels |
| Inter Tight (`display`) | 55 | v1-v4 (49 rows), v5, v6, v8 | 400-800, median 400 | 0.8-14.9, median 4.7 | -0.024 to 0.042, median -0.002 (13) | sentence (31), title | headlines that pop word by word |
| Archivo (`wide`) | 20 | v5, v6, v7 | 600-900, median 800 | 2.3-27.1 (median 5.95; parser min 1.0 is the residual artifact, section 9) | -0.002 to 0.073, median 0.023 (5) | caps or upper (17 of 20) | wide heavy caps at wdth 125; condensed cuts named for v6 words and v7 |
| Saira (`square`) | 8 | v6 | 500-800, median 650 | 3.8-20.2, median 16.0 | -0.053 to 0.021, median -0.021 (4) | caps (8 of 8) | squarish display; one caption at about +0.18 em |
| Unbounded (`round`) | 8 | v5 | 800-900 named | 3.3-12.3, median 7.55 (tapered lines reach 16.3 inside a line) | -0.04 to -0.009 (2) | upper (8 of 8) | extended heavy display; every row says "Archivo wdth 125 or Unbounded" |
| JetBrains Mono (`mono`) | 16 | v1-v4, v6 | 400-800, median 400 | 1.1-13.9, median 3.0 | monospaced | sentence, caps | terminal lines, code, small digits |
| no local family | 2 (+1 line) | v5, v6 | 500-700 | 2.8-13.1 | - | - | section 9 |

*Source: [rows] `techniques.typography()` (fixed parser) grouped by `family_key`, 264 rows.*

| typography rule | measured | source |
|---|---|---|
| Weight floor | no row below 400 among the 237 rows that give a weight | [rows] |
| Wide, square and round faces are caps display | 33 of 36 rows caps or upper | [rows] |
| Display text is huge in v6 | cap height up to 27.1% H (close-up), 14-20% H at rest | [rows] v6 S04-S13 |
| Tracking is tight to normal | Inter Tight median -0.002 em, Inter -0.009 em; loose spacing is the exception (about 0.3 em on one wordmark) | [rows] |
| Ink is graded | new letters arrive light and darken (0.83-0.86 of white in v7; ink 168 -> 15 in v8); secondary lines sit at mid grey | section 4 |
| Serif type | one line in 264 rows | section 9 |

### Composition

| rule | measured | source |
|---|---|---|
| Alignment | of 264 typography rows: left 126, centre 110, right 3, other 25 (staircases, lockups). Centre leads in v2 (19 / 9), v3 (15 / 3), v5 (18 / 12), v6 (21 / 4); left leads in v4 (15 / 10), v7 (27 / 16), v8 (49 / 4) | [rows] `align` |
| Staircase captions | each line offset 3-12.8 %W from the line above; left-side captions step right, right-side captions step left toward the centre; baseline pitch 5.4-6.75 %H | `v5.layout-caption-staircase`, [rows] v5 typography |
| Text is screen-locked over a moving canvas (v2-v4) | headline and glow stay fixed while the network pulls back 1.000 -> 0.291; headlines stay fixed while the canvas zooms; the UI layer scales, never the headline beside it. v5-v7 do move titles with the camera (title creep, pans across huge type, push-ins on a title) | `v3.cam-network-pullback`, `v4.text-headline-drop-in`, `v2.ui-slow-push-in`; `v5.logo-scale-creep`, `v6.cam-text-pan`, `v7.cam-push-in-accelerating` |
| Overlays ignore footage cuts | the title overlay's creep continues through a footage cut (no flash, no jump); captions are not whipped with the footage | `v5.layout-overlay-holds-across-cut`, `v5.trans-whip-pan` |
| Text sits in a cleared zone | a feather-edged zone around text hides the network cells and dots beneath it; a background-coloured glow leaves 52% of connector contrast | `v1.layout-text-knockout`, `v3.bg-headline-knockout` |
| Moving dots go on top | packet dots are drawn in front of cards, icons and their text | `v1.particle-packet-hop`, [tl] v1 S03 layers |
| Make room, don't cut | a finished block rises 10.9-33.0 %H in 14-22 f, or shrinks x0.64 and slides 26.4% W in 25 f, or a lockup re-centres 14.9% W in 21 f, before new content arrives | `v6.layout-rise-make-room` (`inOutWhip` 17/21), `v6.layout-slide-make-room` (`inOutWhip5` 25/40), `v8.layout-lockup-recenter` (`inOutWhip` 21/28) |
| Counter-motion | a label drops while the wordmark rises; a pill drifts against its card (42 px down while the card rises 9 px) | `v6.text-label-drop`, `v8.ui-status-pill-drift` |
| Element scale, measured examples | prompt box 78.0% W x 20.2% H, radius 3.8% H (v1); two windows 44.8% W and 41.7% W x 70.4% H, 40 px apart, outer margins 110 px (v4); footage card 71% of the frame (v8); 3D pointer 15.3% W x 28.0% H (v7) | [tl] layer lines; `v8.trans-card-zoom-fill` |
| Layer stack | front to back: headline > cards or windows > soft shadows > background; of 149 layer lines, 29 name outlines, 21 shadows, 15 halftone dots, 10 glows, 10 dot grids, 10 gradients | [tl] `**Layers**` |
| Background luminance | v1-v4 light (v4 ground luma 246 under 253 cards; v2 250); v5 near black (0-15) with halftone dot ornaments; v6 near-white with soft grey blobs and a dot grid; v7 light fields and dark UI panels; v8 light page (248) with soft blobs | [rows], [tl] |

### Sound sync

| key | BPM | beat (f) | boundaries | median abs offset (f) | within +-2 f | after / before the beat |
|---|---|---|---|---|---|---|
| v1 | 126.05 | 28.56 | 5 | 10.0 | 0% | 4 / 1 |
| v2 | 126.05 | 28.56 | 21 | 8.0 | 5% | 16 / 5 |
| v3 | 126.05 | 28.56 | 8 | 12.0 | 0% | 3 / 5 |
| v4 | 126.05 | 28.56 | 7 | 6.0 | 0% | 5 / 2 |
| v5 | 109.96 | 32.74 | 29 | 10.0 | 10% | 14 / 15 |
| v6 | 117.45 | 30.65 | 16 | 8.5 | 19% | 10 / 5 (1 on) |
| v7 | 114.84 | 31.35 | 36 | 5.0 | 31% | 16 / 17 (3 on) |
| v8 | 117.45 | 30.65 | 26 | 4.0 | 35% | 13 / 10 (3 on) |
| all | | | 148 | 7.0 (random 7.63) | 18.2% (random 13.5%) | |

*Source: BPM, beat period, pooled and random rows [syn] `per_video`, `sound_sync`; per-video median,
share and sign computed for this spec from [syn] `boundary_beat_offsets`.*

| sound rule | measured | source |
|---|---|---|
| Do not beat-lock every boundary | pooled boundaries sit at chance distance from the beat (median 7.0 f against 7.63 f for random times) | [syn] |
| Recordings sit closer to the beat | v7 and v8 put 31-35% of boundaries within +-2 f of a beat; v1, v3, v4 none of 20 | [syn] |
| Cut ahead of the hit (v2 manner) | every boundary of f1-f901 comes 3-5 f before a detected onset; from f339 every cut lands 5-10 f after a beat | `v2.trans-hard-cut` |
| Captions follow the voice, not the beat | caption lines 8-21 f apart following the voice-over; caption word stagger 10-30 f following the voice; caption onsets not beat-locked | `v5.text-caption-word-fade`, `v7.text-word-blur-rise`, [tl] v5 S19 |
| Loops and builds keep their own clock | icon pulse period 25.2 f against a 28.56 f beat; a row build at an 11.3 f cadence (~0.4 beat), no beat lock; idle marks not on the beat; packet hops keep their own clock | [tl] v4 S01, v2 S13, v4 S05; `v8.icon-mascot-idle-bounce` |
| Off-beat steps | list-step peaks 15 f after the beat (half a 30.65 f beat) | [tl] v8 S06 |
| Open on the strongest onset | the opening label widen (v7) and label slide peak (v8) land on the strongest onset of their first 709-733 f (+0 / +1 f) | [tl] v7 S01, v8 S01 |

### Footage

Footage appears only in v5-v8 (v1-v4 are all GRAPHICS). LIVE ranges: v5 f313-f414, f650-f701,
f1767-f1824, f4588-f4608; v7 f631-f705, f1786-f2006, f2824-f2940. Motion inside footage was not
analysed. *Source: [syn] `live_ranges`, [tl] v5 S29.*

| carrier | how it moves | ease | technique |
|---|---|---|---|
| Full-frame plate under captions | captions drift at constant velocity over it; overlays hold across its cuts | linear | `v5.text-caption-drift`, `v5.layout-overlay-holds-across-cut` |
| Dim under text | to 0.37-0.39 of its luma in 16 f under a title (held to the exit); to ~0.27 in 15 f under an end caption; to about half under a closing headline | `inOutSweepOver` 16/16 | `v5.fx-footage-dim`, `v7.text-static-headline-dim-footage` |
| Card fly-in | rounded card from beyond a corner on a straight diagonal: 2 pictures of drift, then a blurred snap and a long hard ease-out (28 f) | `outSnap` 17/21 | `v5.footage-card-fly-in` |
| Card zoom to full frame | 5.1% W -> 99.1% W in 26 f, full width at 28 f, edges blurred in proportion to speed | `outStrong` 26/33 | `v8.footage-card-zoom-to-full` |
| Card zoom-fill | a frame-aspect card at 71% zooms x1.41 about the frame centre until it fills the frame, still moving at the edges | `inOutWhip` 21/29 | `v8.trans-card-zoom-fill` |
| Content fade-in | the card's recording fades in from its black fill in 15-18 f, near-linear | `inOutGlideOver` 18/20 | `v8.footage-card-content-fade-in` |
| Curved panel | straight sides, top and bottom bowed 1.6-2.6 %H, corner radius ~2.2 %W; static, enters and leaves with whips | - | `v5.footage-curved-panel` |
| Strip open | a strip opens right from a 4 px line to 374 px in 13 f, accelerating | - | `v5.footage-strip-open` |
| Window swap | the footage in a window changes by a plain cut while the layout keeps moving | step | `v5.footage-window-swap` |
| Cut burst in a window | 5 cuts in 15 f (shots 5 / 2 / 5 / 3 f) under the fastest part of a camera move, then a 47 f hold | step | `v7.footage-viewer-cut-burst` |
| Mask reveals | a glowing dot-matrix ring expands from a chip to the card corners in 38 f (clear inside, dim outside); a vertical scan band 8-12% W sweeps in 15 f, 3 sweeps 55-58 f apart | `inOutGlideOver` 38/47; `inOutWhipOver` 15/24 | `v7.mask-dot-ring-reveal`, `v7.mask-scan-band-reveal` |
| Card row with a speed ramp | lands already gliding, scrolls 46.6% W with 0.4 -> 4.2 -> 0.4 %W per picture over 70 f | `inOutWhipOver` 60/99 | `v6.card-carousel-speed-ramp` |
| Marquee | a row arrives at 291 px/f and brakes to a constant 7.37 px/f (0.455% W/f) in 44 f | `outSnap` 44/56 | `v8.layout-marquee-whip-in` |
| Whip pan between shots | blur 13 -> 148 px/f, 10 f blend, 12 f landing | `outStrong` 12/13 | `v5.trans-whip-pan` |
| Down from white | the new shot comes down from white and racks soft -> sharp in the same 10 f | ease-out, no curve | `v5.fx-exposure-recover` |

Build footage only through `FootageSlot` (the `plate` variant) and the primitives that carry it.

---

## 7. Per-video signatures

### v1: slow build, one network

| trait | measured | source |
|---|---|---|
| Tempo | 6 shots, median 203 f, 0.281 cuts/s; 3 of 5 boundaries are dip-to-bg | [syn] |
| Text | words pop 4-8 f apart; typing 1.5-1.76 f per char with a solid caret | `v1.text-word-pop`, `v1.text-typewriter-char` |
| Camera | a pull-back to 0.32 in 12 quick 1-5 f steps (-21.5% to -1.7% each) between near-holds | `v1.cam-stepped-zoom-out` |
| Build | lattice cells fade in over 8-9 f in step with an accelerating count (0.09 -> 1.6 counts per frame); connectors draw on 10-11 f after each cell | `v1.grid-hex-network-grow`, `v1.counter-accelerating-count` |
| End | zoom-through 1.0 -> 1.4 onto the mark, eye glyphs shut to 4 px for 7 f, lockup slide 13.5% W | `v1.trans-zoom-through-mark`, `v1.logo-blink`, `v1.logo-lockup-slide` |

### v2: fastest promo, cut-driven

| trait | measured | source |
|---|---|---|
| Tempo | 22 shots, median 94 f, 0.639 cuts/s (highest); 17 of 21 boundaries are hard cuts | [syn], [seg] |
| Text | one-frame word pops 5-9 f apart, steady per line (5.4 f or 8.3 f) | `v2.text-word-pop` |
| Fills | a honeycomb fills the frame from one cell on a radial front at 19.6 px/f | `v2.grid-hex-radial-pop` |
| Rings | 16 icons pop as opposite pairs every 1.57 f and orbit a 2:1 ellipse | `v2.icon-ring-pop-in`, `v2.icon-ring-orbit` |
| Sync | cuts lead onsets by 3-5 f | `v2.trans-hard-cut` |
| Exit | sphere collapse to a 22 px dot in 20 f | `v2.trans-sphere-collapse` |

### v3: dips to white, one marquee

| trait | measured | source |
|---|---|---|
| Tempo | 9 shots, median 119 f, 0.327 cuts/s; 6 dip-to-bg + 2 morphs, no hard cut | [syn], [seg] |
| Text | word pops 3-13 f apart; fades out in place 5-14 f | `v3.text-word-pop`, `v3.text-fade-out` |
| Camera | network pull-back 1.000 -> 0.291 in 90 f, eased in log scale, text screen-locked | `v3.cam-network-pullback` (`inOutWhipOver` 72/123) |
| Motion graphics | packets hop node to node in ~20 f whatever the length; a constant 9.333 px/f marquee | `v3.particle-packet-relay`, `v3.ui-logo-marquee` |
| End | 8 hexagons gather into a honeycomb (starts 2.4 f apart), hold 7 f, collapse | `v3.trans-hex-gather`, `v3.shape-hex-collapse` |

### v4: long shots, composite transitions

| trait | measured | source |
|---|---|---|
| Tempo | 8 shots, median 228.5 f (longest), 0.249 cuts/s (lowest) | [syn] |
| Transitions | built from parts: pull-back morph 71 f, pull-back reveal 77 f, panel swap 31 f | `v4.trans-pullback-morph`, `v4.trans-pullback-reveal`, `v4.trans-panel-swap` |
| Text | word rise-fade 18 px, 4.2 f stagger; headline drop-in 10-12 px in 14-15 f; fade-out 11-12 f | section 4 |
| UI | lists jump by the inserted item's height in one frame; terminal lines appear whole at 2-23 f gaps | `v4.ui-chat-list-step-scroll`, `v4.ui-terminal-line-step` |
| Swarm | 84 hexagons fly to a disc (launch ripple ~65 px/f), then fold ring by ring 84 -> 1 | `v4.particle-swarm-converge`, `v4.particle-ring-collapse` |

### v5: dark, kinetic captions, chrome display type

| trait | measured | source |
|---|---|---|
| Tempo | 26 shots, median 186 f, 0.398 cuts/s, 110 BPM; 5 holds up to 418 f | [syn] |
| Captions | letter blur sweeps, constant drift, staircase lines, line-by-line defocus exits | section 4 |
| Display type | wide heavy caps that land and then swing into a perspective taper | `v5.3d-perspective-swing` |
| Boundaries | 20 hard cuts, 4 whip-tilts, 2 flashes, melt-implode | [seg] |
| 3D | slab spin, recede, exit up; objects flying into depth; cylinder card rows | section 6 |
| Holds | never still: drift 0.2-1.1 px/f or scale drift | `v5.cam-hold-drift` |

### v6: huge type, light field

| trait | measured | source |
|---|---|---|
| Tempo | 17 shots, median 99 f, 0.531 cuts/s; 4 pushes, 2 whips, 1 stutter | [syn], [seg] |
| Type | caps up to 27.1% H; letters converge from four edges; oversized x1.2-1.5 scale-down settles | `v6.text-letter-converge`, `v6.text-scale-down-settle` |
| Pushes | anticipation dip 3.8-3.9% H, then out of the top edge | `v6.layout-anticipate-exit-up` |
| 3D | a device explodes into 4 layers at ~44 deg | `v6.3d-layer-explode` |
| Holds | constant zoom-out -0.037 to -0.057 %/f | `v6.cam-slow-zoom-drift` |
| Material | includes capture pre-roll (S01-S03) and a player replay (S15-S17) | [seg] |

### v7: whip-driven product walkthrough

| trait | measured | source |
|---|---|---|
| Tempo | 34 shots, median 106 f, 0.496 cuts/s; 21 whips (most), 12 hard cuts | [syn], [seg] |
| Whips | 12 leftward whips through a hidden cut, often jumping scale (x0.398 to x2.37) | `v7.trans-whip-push-left` |
| Camera | push-ins x1.10-x1.79, pull-backs to x0.40, reframe pans; enters zoomed x1.19-1.59 and settles out in 26-30 f | section 6, `v7.cam-zoom-out-settle-in` |
| Text | letter-fade typing 2.6-3.0 f per char; word blur-rise captions | section 4 |
| Luminance moves | iris to white in 16-18 f; a ring inverts luminance inside it as it expands in 17 f | `v7.trans-iris-white`, `v7.fx-ripple-invert` |
| Material | ends with a player replay (S36-S37) | [seg] |

### v8: light UI, springy marks, streamed text

| trait | measured | source |
|---|---|---|
| Tempo | 27 shots, median 130 f, 0.43 cuts/s; 6 morphs, 7 whips, 4 pushes | [syn], [seg] |
| Marks | flat blob marks pop x1.17-1.22, dip to x0.96-0.98, rest in 20-26 f | `v8.icon-mascot-pop-in` (`outSnapOver5` 20/20) |
| Text | stream reveal at 40-155 px/f; shimmer and fade sweeps on settled labels | section 4 |
| Lists | step scroll one row (25-28% H) in 20-21 f over a slow base drift | `v8.ui-list-step-scroll` |
| 3D | card deck slams a card every 4 f; stack fan-out; card yaw 26.5 deg | `v8.card-deck-flip-stack`, section 6 |
| Sync | closest to the beat: 35% of boundaries within +-2 f | [syn] |

---

## 8. Avoid list

### What the references measurably never do

| never | evidence | source |
|---|---|---|
| A linear ease on a measured move | all 489 curves are bezier shapes or one spring; linear motion appears only as constant drifts and marquees | [tok] `eases` |
| Overshoot past ~124% | the largest overshoots are 124% and 120% (one curve each) | [easing.ts] |
| A full-frame crossfade as a boundary | none of the 16 boundary types is a dissolve; dissolves appear only inside composite moves (7 f in a zoom-through, card contents in a pull-back morph) | [syn], `v8.trans-zoom-through-dissolve`, `v4.card-content-crossfade` |
| A graphics shot over 418 f (7.0 s) | max 418, p90 233.4 | [syn] |
| Text lighter than weight 400 | 0 of the 237 rows that give a weight | [rows] |
| Fade, slide or scale on a word pop | word pops are one-frame, full ink, final place | `v2.text-word-pop`, `v3.text-word-pop` |
| Every boundary on the beat | 18.2% within +-2 f against 13.5% by chance; v1, v3, v4: 0 of 20 | [syn] |
| Footage in the promos | v1-v4 are 45 GRAPHICS segments, no MIXED or LIVE | [syn] `classes` |
| 3D in the promos | none in v1, v3, v4; one exit in v2 | [tl] |
| A dead-still hold in v5 or v6 | camera or group drift in every hold | section 2 |
| Accelerating cut runs | none in designed material (the only one is capture pre-roll) | [syn], [seg] |

### Forbidden tools and content (the brief)

| forbidden | covers |
|---|---|
| Higgsfield | any use, including image, video or motion presets |
| After Effects, Cinema 4D | any use; everything is built in Remotion code |
| Any paid app, plugin or API | including paid motion, 3D or font services |
| Cloud rendering | Remotion Lambda, Cloud Run, any hosted render farm; render locally |
| Paid stock | footage, music, sound effects, images |
| Paid fonts | use only the local free families: Inter, Inter Tight, Archivo (wdth 62-125), Unbounded, JetBrains Mono, Saira (wdth 50-125) |
| AI image or video generation | any model, any purpose |
| Recreating a reference | the specs are a style, never a shot-for-shot copy |
| Copying footage | no frame or clip of the references in any render |
| Any person | no person, face, body, hand or gesture in any render; footage slots stay plates |

---

## 9. Open questions

| item | why it is open | known range | source |
|---|---|---|---|
| Montserrat Bold (wordmark on a 3D card) | no local family named; the row's original is unidentified | weight 700, cap 4.9% H, caps, very loose (~0.3 em); revealed by a flash recovery and focus pull | [rows] v5 S26 |
| DM Serif Display (serif line of a lockup) | no local serif; the row names it as closest free | cap ~13.1% H, weight ~400, capitalised words; enters as a chrome smear from the left (head 13 f + capital 13 f) | [rows] v5 S02 |
| Small lowercase grotesque (unit label) | no family named at all | weight 500, x-height ~2.8% H, lower case, grey ink ~81; rides in with a dial | [rows] v6 S13 |
| Archivo and Saira width values | rows name cuts ("width 125", Narrow, SemiCondensed; Saira SemiExpanded, Condensed, SemiCondensed), never a measured wdth | Archivo 62-125, Saira 50-125 | [rows] v5-v7 |
| Unbounded vs Archivo | all 8 `round` rows say "Unbounded or Archivo wdth 125"; originals UNCERTAIN | weights 800-900, caps | [rows] v5 |
| Non-design segments in the tempo | v2 S01 (1 f poster), v6 S01-S03 (pre-roll), replays v6 S15-S17, v7 S36-S37, v8 S27 are in the pooled numbers; the tempo block keeps them because verify.py checks it against segments.json | without the 10: n 139, median 121, p10 56, p25 83, p75 196.5, p90 235.6 | [seg] |
| Uncovered curve | `v7.text-caption-fade-out.i2` (opacity, 11 f) matches no shared ease within RMSE 0.05 (own bezier 0.0526) | near-linear fade, removed at ~27% | [tok] `uncovered` |
| Pop-in start values | the first visible frame already shows a size: curves start there, the true start is unseen | scale 0.585-0.765 (logos, cells, marks), 0.316 (a mark), 0.62 (hexagons); one logo at 0.658, -17.1 deg, opacity 0.13 | [tl] v1 S02; v2 S02-S04, S22; v3 S08 |
| Caption blur amount (v5) | blur and opacity change together over busy footage and cannot be separated | v7 captions de-blur from sigma ~3 px; v7 input words from 5 px | [tl] v5 header, [rows] |
| 3D angles | solved by edge ratios or a fitted pinhole, or not at all | card yaw 26.5 deg (focal 2315-2800 px); device turn ~44 deg; stack yaw and pointer rotations unmeasured | [tl] v6 S09, v7, v8 S08, S17 |
| 3D slab recede ease | no single ease passes | 1.53 -> 1.00 in 21 f, dip to 0.9875 | `v5.3d-card-recede` |
| Margins and safe areas | never measured as a system | one reading: 110 px (5.7% W) left and right of a two-window layout (v4) | [tl] v4 S02 |
| Element scale | measured per technique only, not pooled | examples in section 6 | [rows] |
| Spinner rates | 8-fold spinners alias at the 1-3 f picture cadence | one arc spinner measured: 6.8 deg/f | [tl] v8 S10, `v7.ui-spinner-rotate` |
| Blur on cut-in settles | may be an effect or a tracker artefact | sigma 0.43% W, 5.3% H low, x0.94 | `v8.cam-cut-in-settle` |
| Stream reveal unit | the front moves 70-120 px between pictures 1-3 f apart | word or letter | [tl] v8 S12 |
| Level meter drive | correlation with the audio only 0.40-0.52 | bars 4-35 px | `v7.icon-voice-meter` |
| Colour | the references were analysed in grayscale on purpose; hues are unknown | luminance only; `colors.ts` is neutral | [dec], [colors.ts] |
| Recording timing | v5-v8 durations carry +-1 f jitter and 2-3 f quantisation; 24 fps material | +-1 f on every v5-v8 duration | [dec] |

---

## 10. Primitive map

Generated from `analysis/catalogue.json` by `scripts/analysis/catalogue_md.py`; every variant with its
techniques and curve is in `analysis/catalogue.md`. Families are the technique id categories.

| group | primitive | kind | technique families | variants |
|---|---|---|---|---|
| text-reveal | Typewriter | text | text | 10: steadyCaret, jittered, linearRate, fastSteps, letterFade, fadeTrail, stretchFade, acceleratingDots, leadingEdge, flashLetter |
| text-reveal | WordPop | text | text, ui | 7: brisk, even, spaced, rapid, lineSteps, ghostSnap, allAtOnce |
| text-reveal | Scramble | text | text | 1: decode |
| text-reveal | LetterPopBuild | text | text | 2: mixedPops, tighten |
| text-reveal | SoftFrontReveal | text | text | 4: fastFront, featherFront, fadeSlide, dissolveOut |
| text-reveal | ShimmerSweep | fx | fx, grid, text, ui | 5: slantedBand, darkBand, looping, once, lineLight |
| text-motion | RiseFade | text | icon, shape, text | 9: wordRise, letterRise, softBlockRise, dropIn, steepStagger, blockRise, cascade, fadeInPlace, quickFade |
| text-motion | BlurIn | text | text, ui | 6: wordRise, overlapWords, inPlace, letterSweep, focusRoll, verticalBlur |
| text-motion | BlurSlideIn | text | text | 9: oppositeEdges, overshoot, converge, typeAlong, whipIn, trackingSettle, glyphConverge, edgeSpring, allEdges |
| text-motion | WarpFlyIn | text | logo, text | 4: liquid, rubbery, blobMorph, chromeSmear |
| text-motion | EdgeRise | text | text | 4: springUp, dropBounce, typeRise, popDrop |
| text-motion | TextFadeOut | text | text | 5: easeIn, accelerating, linear, slowFade, defocusLines |
| transition-cut | HardCut | transition | layout, trans | 3: plain, motionMatch, overlayHold |
| transition-cut | DipToBackground | transition | trans | 3: groupFade, quickDip, zoomBuild |
| transition-cut | WhipCut | transition | fx, trans | 14: pushLeft, pushRight, blendLeft, streakLeft, creepLeft, blurReframe, layerBlur, canvasDown, pushUp, riseUp, sinkDown, punchUp, punchZoom, diagonalZoom |
| transition-cut | PushSlide | transition | trans | 5: stacked, dipRise, easeInDrift, rippleRise, sharedStrip |
| transition-morph | ZoomThrough | transition | trans | 7: cutContinue, risingZoom, radialStreaks, oversizeLanding, dissolve, tunnelExit, spin |
| transition-morph | CollapseToPoint | shape | logo, particle, shape, trans | 6: cellsInward, sphereWrap, ringFold, meltImplode, blobMerge, clusterSnap |
| transition-morph | FlyToSlots | shape | particle, trans | 6: gather, converge, riseIntoSlots, swirl, arcToSlot, swoopAcross |
| transition-morph | ShapeSwap | shape | card, icon, trans, ui | 4: waveSwap, centreOutSwap, crossDissolve, shrinkGrow |
| transition-morph | ContentSwap | transition | card, trans, ui | 5: titleFade, slideThrough, dropThrough, crossfadeSlide, oneFrame |
| light-fx | LightFlash | transition | fx, trans | 5: iris, ringBloom, flareCut, starSplit, invertRipple |
| light-fx | StarFlare | fx | fx, particle, shape | 4: streakSweep, drop, anamorphic, depthField |
| light-fx | LumaPulse | fx | fx, ui | 7: slowBloom, bloomCover, haloPeak, layerFlash, opacityDip, flicker, fillGlow |
| light-fx | RadialBurst | fx | bg, particle, shape, ui | 5: tileRing, echoZoom, shockRings, shardSpray, dotRing |
| light-fx | PixelBlocks | fx | fx, shape | 3: parkSweep, smearSweep, pairConverge |
| light-fx | ToneShift | fx | text, ui | 6: twoStage, darkenIn, lighten, dimToggle, focusShift, sweep |
| camera-zoom | SlowZoom | camera | cam, layout, logo, ui | 7: layerPush, easeOutPush, easedPush, creep, linearDrift, groupCreep, recede |
| camera-zoom | PushIn | camera | cam, ui | 5: blurSettle, cornerSettle, pivotBelow, snap, layerPunch |
| camera-zoom | PullBack | camera | cam, trans | 13: reveal, logEase, panLead, centred, centreTail, closeUpOut, twoPulses, whipReveal, flatten, speedRamp, recoil, easeBack, reframe |
| camera-move | CanvasPan | camera | cam | 10: whipX, whipReframe, whipY, typingPan, panUpZoom, reframeOut, reveal, tiltTwoPhase, scrollUp, scrollSettle |
| camera-move | AccelerateExit | camera | 3d, cam, layout, text | 13: up, driftUp, left, drift, blockUp, anticipateUp, hoverUp, peekSnap, pushIntoCut, punchBreak, oversizeLanding, pullIntoCut, blurPullExit |
| camera-move | CutInSettle | camera | cam, layout, ui | 7: zoomOut, blurLow, throwUp, slideLeft, zoomDown, punchIn, ghostCarry |
| camera-move | SteppedZoom | camera | cam, trans | 2: pullBack, punchStutter |
| three | PerspectiveSwing | 3d | 3d, card, text | 3: taper, swingIn, mirrorPair |
| three | CardSpin3D | 3d | 3d | 4: halfTurn, yawRecede, pushBack, lightUp |
| three | LayerStack | 3d | 3d, card | 6: explode, fanOut, collapse, layerSink, fold, slamOn |
| three | Camera3D | 3d | 3d, cam, trans | 9: swingPush, orbitPush, dollyReframe, dollyParallax, pullWide, orbitDrift, pushFlatten, shrinkIntoStack, tunnelDolly |
| three | GlobeRise | 3d | 3d | 1: riseSpin |
| three | DepthFlyer | 3d | 3d | 2: converge, dive |
| three | OrbitRig | 3d | bg, shape | 2: rigidSpin, tumble |
| ui-controls | PressBounce | ui | ui | 8: quick, deep, held, springBack, pressSwap, glowRelease, longHold, dropPress |
| ui-controls | SeedGrow | ui | shape, ui | 11: seedPop, widenOvershoot, cornerFollow, speckStretch, edgeStretch, dotToPill, lineToPill, pillToLine, growType, chainIn, chainOut |
| ui-controls | Dropdown | ui | ui | 2: unfold, scaleIn |
| ui-controls | Counter | ui | counter | 5: accelerating, realTime, stepOnArrival, perPictureSwap, fastForward |
| ui-feed | ItemRiseIn | ui | ui | 8: riseFade, makeRoomRise, fadeInPlace, quickFade, popStagger, fadeAcross, lateFade, blurSlide |
| ui-feed | StepScroll | ui | ui | 4: eased, thread, jump, jumpBottom |
| ui-feed | PageScroll | ui | ui | 4: easeInOut, momentum, decelerate, slowBack |
| ui-feed | Marquee | ui | card, layout, ui | 4: constant, brakeIn, deadStop, speedRamp |
| ui-feed | BusyIndicator | ui | icon, logo, ui | 8: glyphCycle, dotCycle, cycleWithTimer, constantSpin, turning, tonePulse, onOff, fullTurn |
| ui-feed | FloatingPill | ui | fx, ui | 11: dropIn, riseLevel, whipUp, counterDrift, trackFootage, smearOut, edgeRise, overshootRise, liftDrop, toastIn, toastOut |
| cards | SlideSettle | layout | card, layout, ui | 8: fadeSlide, longThrow, onePicture, deblurRise, fadeRise, fanOut, dropSettle, riseBuild |
| cards | EdgeEnter | layout | card, shape, ui | 6: hardLand, smearRise, dropDecelerate, blurSlide, trailSlide, streakDrop |
| cards | ScaleFade | layout | card, layout, ui | 9: growIn, centreGrowIn, riseGrowIn, staggerIn, shrinkOut, shrinkCut, riseZoomOut, zoomOut, shrinkEach |
| cards | OversizeSettle | layout | card, icon, text, ui | 5: settle, hugeShrink, blurShrink, quickSettle, riseSettle |
| layout | MakeRoom | layout | layout, text, ui | 9: riseTop, riseShort, shrinkAside, openGap, reflow, liftShrink, recenter, centreSlide, groupSnap |
| layout | SplitApart | layout | grid, layout, particle, text, trans | 6: splitShift, splitMorph, whipOut, gridSpread, kickApart, mirrorPair |
| layout | LockupSlide | layout | logo | 4: medium, shrinkWide, wide, short |
| layout | CaptionDrift | layout | layout, text | 1: stairDrift |
| icons | ScalePop | ui | icon, logo, ui | 16: strongOut, fadeGrow, spinTilt, longTail, sliverGrow, rideIn, discGrow, glowGrow, cellByCell, threeStep, glowSettle, twoPicture, overshootPeak, springDip, blurOvershoot, spinSpring |
| icons | SpawnField | shape | grid, icon, particle | 7: radialFront, readingOrder, gridOrder, ringPairs, randomScatter, latticeGrow, burstRing |
| icons | AmbientLoop | shape | icon | 5: sineFloat, pulseTurns, squashPulse, audioLevel, ellipseOrbit |
| icons | IconFlyIn | shape | icon, logo, particle | 5: arcIn, dart, dropBounce, curvedStagger, chainArc |
| icons | MarkBars | shape | icon, logo | 7: slideSquash, squashShut, squashPair, openFromDash, openToPills, slideHoldReturn, glyphSwap |
| shapes | PacketHop | shape | particle | 6: easedHop, straightCarry, relay, dispatch, dwellHop, pingPong |
| shapes | LineDraw | shape | icon, logo, shape, ui | 9: edgeToEdge, roundedTurns, growInward, backToFront, rightToLeft, closeLoop, trimThicken, trimSteps, echoReveal |
| shapes | Backdrop | fx | bg, layout, shape | 12: breathe, clear, blobFadeIn, dotGridDrift, diagonalSplit, travellingGlow, cornerFadeUp, ribbonRise, ribbonDrift, beamGrow, clearZone, glowZone |
| cursor | CursorPath | ui | cursor | 8: flyUp, diagonalIn, dive, throw, glideClick, windUp, constant, flyOut |
| cursor | CursorState | ui | cursor | 3: glowMorph, hiddenSwap, pressRipple |
| cursor | DragDrop | ui | cursor, ui | 5: carryIn, ghostTrail, dragOut, stripDock, rippleEdit |
| cursor | SelectionHighlight | ui | ui | 6: fadeWiden, lift, rowSweep, holdSlot, jump, hop |
| footage-frames | FootageCard | footage | card, footage, trans | 7: zoomToFull, zoomFill, zoomToCentre, diagonalSnap, shrinkToNode, depthGrow, scatterZoom |
| footage-frames | FootageFrame | footage | footage, fx, text | 8: innerCuts, cutBurst, singleCut, curvedHold, wobbleExit, contentFade, dimIn, heldDim |
| footage-frames | MaskReveal | footage | card, footage, mask | 4: dotRing, scanBand, seamOpen, stripOpen |
| footage | FootageSlot | footage | - | 1: plate |
