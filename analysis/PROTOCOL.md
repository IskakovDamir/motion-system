# Inspection protocol (steps 3-5)

This is the working contract for everyone who inspects the reference videos. Read it fully before
touching a video. The goal is a motion system that reproduces the *style* of these videos with a new
palette and new footage. We extract techniques; we never rebuild their scenes, order, layouts or text.

## Hard rules

1. **People do not exist for this job.** Never describe, track, measure or name a person, face, body,
   hand, gesture, clothing, expression, or what the footage shows. Live-action footage is "footage".
   A masked window, card or frame that *carries* footage is a graphic element and is analysed
   (its position, scale, crop, corner radius, mask, motion). The camera move inside the footage is not.
2. **Grayscale only.** All material is grayscale. Mention colour only when it drives motion
   (a flash, a luminance wipe, an inversion), and describe it as luminance.
3. **Never guess.** Every number comes from measured frames: a tracker CSV, a curve fit, or
   coordinates read off frame-numbered stills (say which). If something cannot be measured, write
   `UNCERTAIN: <range> because <reason>` instead of a number.
4. **Record how text behaves, never what it says.** No quotes of on-screen words. Say "2-line
   headline, 5 words + 3 words", "single word", "UI label", "counter digits".
5. **Missing a graphic cut, a text behaviour, a speed change or a transition is a failure.** When a
   moment moves too fast to read on the overview, go denser (`sheets.py dense`, `crop`) until it is
   readable. No graphic element may go unseen.
6. **Never modify `reference/`.** Work only on the copies in `analysis/`. Write only inside
   `analysis/<video>/` of the video you were given (and nowhere in `src/`).
7. Do not quote, describe or reproduce the brand names, slogans or logos as content. Describe
   them as "brand mark", "app icon", "agent logo icon", "product UI".

## The material

`analysis/videos.json` lists the videos. Each video directory `analysis/<stem>/` holds:

| file | what |
|---|---|
| `meta.json` | fps, frames, resolution, audio, crop, masks (step 1) |
| `work.mp4` | grayscale 60 fps copy, cropped to the picture. Frame n of work.mp4 = analysis frame n |
| `cuts.json` | cut candidates from 3 detectors (PySceneDetect content + adaptive, ffmpeg scene), `status: candidate` until someone decides |
| `scene_metrics.csv` | per-frame detector metrics (find soft transitions here too) |
| `motion.csv`, `motion.png` | per-frame motion energy: gray diff, Farneback flow magnitude, dx, dy, radial (zoom), rot |
| `motion_peaks.json` | motion energy peaks (`at_cut: false` ones have detail windows) |
| `audio.json` | tempo, beats, onsets (frames on the 60 fps grid) |
| `sheets/overview_<a>-<b>.jpg` | 4x4 contact sheets, every 3rd frame, frame numbers burned in |
| `detail/cut_<id>_f<frame>/` | every picture 12 before .. 12 after a cut candidate: `f<frame>.jpg` (960 px) + `sheet.jpg` |
| `detail/peak_f<frame>/` | the same around each off-cut motion peak |

**Frame convention.** Analysis frame = round((pts - first video pts) x 60). All four 1080p60 videos
(v1-v4) are constant 60 fps, so analysis frame = decoded frame. The four screen recordings (v5-v8)
are variable frame rate: the player's 24 fps material arrives on a 60 Hz grid with a 3:2 cadence
(pictures 2 or 3 analysis frames apart); v7/v8 also contain runs at 30/60 fps (`motion.csv`
`local_fps`). Their work.mp4 repeats pictures to fill the 60 fps grid; `unique == 1` in motion.csv
marks frames where a new picture arrives. Measured durations in v5-v8 carry +-1 analysis frame of
capture jitter and the 2-3 frame quantisation of 24 fps material: say so where it matters.
The screen recordings are cropped to the 1622x918 picture (the top 18 rows were a black capture
bar). **The round speaker icon at the bottom right of v5-v8 (x 1545-1613, y 837-905) is the
X player's overlay, not part of the design: ignore it.**

Percentages: x and widths in % of picture width, y and heights in % of picture height, rotation in
degrees, scale as a factor (1.0 = rest size), opacity 0-1, luma 0-255, blur in % of picture width.

## Tools (run from `scripts/analysis/` with `../../.venv/bin/python`)

```
sheets.py overview <v> --start A --end B [--step 3]      # contact sheets for a range
sheets.py detail <v> <frame> [--before 12 --after 12] --name soft_<id>   # every picture around an event
sheets.py dense <v> <A> <B> [--step 1] [--cols 6]        # every frame of a range (fast moments)
sheets.py stills <v> <f1> <f2> ... --tag <segment>-<event>   # full-res PNG stills -> type/
sheets.py crop <v> X Y W H <A> <B> [--step 1] [--zoom 2] # zoomed region over a range -> crops/
track.py template <v> <A> <B> --bbox X Y W H [--ref F] [--scales 0.5 1.5 0.02] [--pad 250 | --global] --name N
track.py bbox <v> <A> <B> --roi X Y W H [--polarity dark|light|any] [--thresh 40] [--bg auto|0-255] --name N
track.py luma <v> <A> <B> --roi X Y W H --name N
track.py edge <v> <A> <B> --roi X Y W H --axis x|y [--level 0.5] --name N
track.py flow <v> <A> <B> --roi X Y W H --name N
fit_easing.py <v> <technique_id> --csv ../../analysis/<stem>/scratch/<N>.csv --col <column> \
    [--start A --end B] --property <position-x|position-y|scale|rotation|opacity|blur|mask|crop|width|height|...> \
    --unit "<% of frame width|% of frame height|scale factor|degrees|luma 0-255|...>" --note "<what was tracked>"
curves_tool.py list|index|rename|drop <v> ...
sync.py <v> <frame> [<frame> ...]                        # nearest beat / strong onset offsets
```

Video names: use the key (`v1`..`v8`). Tracker CSVs land in `analysis/<stem>/scratch/`.
`track.py template` needs the element visible and sharp in frame `--ref`; pick `--ref` where the
element is fully formed, and a range where it stays recognisable (use `--scales` for zooms, `--global`
if it jumps). Check the `score` column (above ~0.6 is a lock). When an element is blurred or morphs,
use `bbox` (ink bounding box, centroid, area), `edge` (wipe or mask fronts), `luma` (fades, flashes)
or `flow` (integrated motion).

`fit_easing.py` normalises the samples (0 = rest before, 1 = settled after), measures the duration
(last frame within 2% of the start before the half-way point, to the first frame from which it stays
within 2% of the end), fits a cubic-bezier (Remotion `Easing.bezier`, integer duration) and a Remotion
`spring` config, and writes `curves/<id>.csv` + `curves/<id>.json`. Give it a range with a few still
frames before and after the movement. Read its printout: if both RMSEs are above 0.05 the samples
are noisy or the range is wrong; re-track. It prints exactly what goes into the timeline.

## Definitions

- **Hard cut**: the picture is replaced between two consecutive pictures.
- **Soft transition**: one composition turns into the next over several frames: dissolve, luminance
  wipe, mask wipe, push/slide, zoom-through, morph (shared element transforms into the next layout),
  blur-through, flash, whip. Detectors often miss these; find them on the sheets and in
  `scene_metrics.csv` / `motion.csv`.
- **Segment**: the span between two boundaries (hard cuts and soft transitions), during which one
  composition/layout holds (elements may animate, be added or leave, the frame may move). A new
  segment starts when the composition is replaced. Segments tile the whole video with no gaps:
  a hard cut at frame f ends the previous segment at f-1; a soft transition [a, b] ends the
  previous segment at floor((a+b)/2) and starts the next at floor((a+b)/2)+1. The transition
  itself is recorded separately with its full range.
- **Classes**: `GRAPHICS` only designed elements (text, shapes, UI, 3D, particles, charts, logos).
  `MIXED` designed elements over or around live-action footage (any caption, lower third, logo, card,
  frame, sticker, UI or masked window counts). `LIVE` footage with no designed element at all;
  confirm on the overview sheets that there is truly nothing (small captions, logos, frames, overlays).
  The speaker icon of v5-v8 does not count.
- **Technique**: a distinct motion device (a way something enters, moves, reveals, transitions,
  counts, scrolls ...). Repeated uses of the same device inside a video share one technique id.
  Id format: `<key>.<category>-<name>`, kebab case, e.g. `v3.text-word-rise`, `v6.trans-blur-zoom`,
  `v2.ui-card-stack-slide`. Categories: `text`, `trans`, `cam` (whole-frame move), `layout`,
  `ui`, `card`, `logo`, `icon`, `shape`, `grid`, `counter`, `chart`, `cursor`, `particle`, `bg`,
  `3d`, `footage` (graphics that carry footage), `mask`, `fx` (flash, blur, glitch).
- **Hero movement**: the movement that carries the eye in a segment (main text reveal, main object
  entrance or exit, camera move). Every GRAPHICS/MIXED segment has at least one; every soft
  transition is treated as a hero movement.

## Inspection procedure for one chunk (frames A..B of one video)

1. Read `meta.json`, the chunk's part of `cuts.json`, `motion.png`, `motion_peaks.json` and
   `audio.json`. Note the `local_fps` for v5-v8.
2. **Overview pass.** Open every overview sheet that covers A..B (every 3rd frame), in order.
   Write running notes: what appears, moves, changes, leaves, and at which frames.
3. **Boundaries.** For every cut candidate in A..B open its `detail/cut_*/sheet.jpg` and decide
   `confirmed` (a hard cut or the anchor of a soft transition) or `rejected` (with the reason: camera
   move inside footage, text appearing, flash inside a shot ...). Then find every boundary the
   detectors missed (soft transitions, hard cuts between similar frames) on the sheets and in the
   metrics. For each soft transition make its detail window:
   `sheets.py detail <v> <a> --after <b-a+12> --name soft_<a>-<b>` (12 pictures before a and after b).
4. **Segments and classes.** List segments A..B with class. LIVE: name the overview sheets you
   checked to confirm nothing graphic is there, then skip it. MIXED: analyse the graphic layers only.
5. **Per GRAPHICS / MIXED segment**, using sheets, detail windows (also every `detail/peak_*` window
   inside the segment), `dense` and `crop` where needed:
   - graphic elements and their layer order (foreground, midground, background, parallax);
   - every movement: element, property (position, scale, rotation, opacity, blur, mask, crop),
     start and end values (%, degrees, factor), start frame, duration in frames, easing, delay,
     stagger between elements (frames between successive starts) — read values off frame-numbered
     stills or trackers, never estimate by eye without numbers;
   - typography (one row per text event): closest free font on Google Fonts or Fontsource (and the
     original if you can identify it), weight, cap height as % of frame height (measure a capital
     letter on a full-res still), tracking (tight/normal/loose and an em estimate from letter gaps),
     case, alignment, line breaks (words per line), reveal unit (letter, word, line, block), reveal
     method (mask, slide, scale, blur, warp, typewriter, fade), reveal speed in frames per unit and the
     stagger. Make full-res stills where text appears, fully settles and starts to leave:
     `sheets.py stills <v> <f_appear> <f_settled> <f_leave> --tag <segment>-<n>`;
   - 3D: which objects, rotation axis and degrees, camera move, perspective strength, depth of field,
     light behaviour, material feel (glossy, matte, glass, metal), entry and exit;
   - graphic elements and UI: shapes, lines, grids, particles, cards, cursors, icons, counters, charts,
     and how each one animates;
   - transition into the next segment: type, length in frames, and exactly what the last frame shares
     with the next first frame (shape, position, scale, motion direction);
   - sound sync: `sync.py` on the frames of graphic events (boundaries, text appear, hero move start);
     report the offsets in frames.
6. **Curves.** Track every hero movement and every soft transition per frame (`track.py`) and fit
   it (`fit_easing.py`). Curve ids in a chunk: `<technique_id>.<chunk_id>` (for example
   `v6.trans-blur-zoom.v6c1`) so parallel chunks never write the same file. Pick a clean instance;
   add more instances only if they differ (different duration or easing: then it is probably a
   second technique, say so). Hard cuts have no curve (0 frames).
7. **Speed changes.** Watch for holds inside a move, a fast-in/slow-out that changes pace mid-way,
   speed ramps of the whole frame, and repeated elements whose pace accelerates (edits that
   accelerate). Record them with frames.

## What a chunk writes

`analysis/<stem>/chunks/<chunk_id>.md`: the timeline fragment for A..B in the timeline format
below, and `analysis/<stem>/chunks/<chunk_id>.json`:

```json
{
  "video": "<stem>", "key": "v1", "chunk": "v1c1", "frames": [A, B],
  "cut_decisions": [{"id": "c001", "frame": 788, "status": "confirmed|rejected", "reason": "..."}],
  "boundaries": [{"frame": 788, "type": "hard-cut"},
                 {"start": 340, "end": 358, "type": "zoom-through|dissolve|push|wipe|mask-wipe|morph|blur-through|flash|whip|...",
                  "frames": 19, "shared": "what the last frame shares with the next first frame",
                  "technique": "v1.trans-...", "curve": "v1.trans-....v1c1", "detail": "detail/soft_340-358"}],
  "segments": [{"start": 0, "end": 348, "class": "GRAPHICS|MIXED|LIVE", "continues_from_previous_chunk": false,
                "continues_into_next_chunk": false, "live_confirmed_on": ["sheets/overview_...jpg"],
                "summary": "one line: layout and what moves; no people, no quoted text"}],
  "techniques": [{"id": "v1.text-word-rise", "category": "text", "description": "...",
                  "instances": [[402, 431]], "reference_frames": [402, 431],
                  "measured": {"duration_frames": 18, "easing": "bezier(...) / spring(...)", "values": "..."},
                  "curves": ["v1.text-word-rise.v1c1"]}],
  "typography_stills": ["type/S02-1_f00402.png"],
  "uncertain": [{"what": "...", "range": "...", "reason": "..."}],
  "notes": ["..."]
}
```

## Timeline format (`timeline.md`, chunk fragments use the same blocks)

```
# <key> timeline: <stem>
60 fps analysis grid; <n> frames; <resolution>; classes: GRAPHICS x, MIXED y, LIVE z.

### S01 · f0-f348 · GRAPHICS · 5.82 s
**Layers (front to back):** ...
**Movements**
| element | property | from -> to | start f | dur f | easing (measured) | delay / stagger | technique |
|---|---|---|---|---|---|---|---|
**Typography**
| event | font (free / original) | weight | cap h % | tracking | case | align | lines | unit | method | speed f/unit | stills |
**3D:** ... (or "none")
**Graphic elements and UI:** ...
**Speed changes:** ...
**Transition out -> S02:** <type>, <n> frames (f340-f358); shares: ...; curve: curves/<id>.csv
**Sound sync:** ...
**Curves:** `curves/<id>.csv` bezier(x1, y1, x2, y2) D=..; spring {stiffness, damping, mass 1}; rmse ..

- S02 · f349-f610 · LIVE · skipped (confirmed on sheets/overview_00348-00393.jpg, sheets/overview_00396-00441.jpg ...)

## Technique index
| technique | category | segments | reference frames | curve | summary |
|---|---|---|---|---|---|
| `v1.text-word-rise` | text | S01, S04 | f402-f431 | curves/v1.text-word-rise.csv | words rise 3.1% H with ... |

## Motion personality
2-3 sentences.
```

Segment ids `S01, S02 ...` are given by the merge (chunks may use provisional ids).
The `curve` column names the final curve file; `-` when the technique has no per-frame curve.
