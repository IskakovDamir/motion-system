# Technique records, catalogue and MOTION_SPEC (step 6)

How the final timelines become the data the primitives are built from. Inputs are final: every
`analysis/<stem>/timeline.md` (merged, reviewed, coverage-checked), `curves/`, `segments.json`,
`analysis/tokens.json`, `analysis/synthesis.json`. The hard rules of `PROTOCOL.md` still hold: no
people, grayscale (luminance; colour only when it drives motion), never guess, no on-screen words,
no brand names, nothing written to `reference/`.

## 1. Technique records: `analysis/<stem>/techniques.json`

One record per row of the video's technique index, in index order: `{"video": "v5", "techniques": [...]}`.
Large videos are written in parts (`scratch/techniques_part<k>.json`, same format, only the part's ids)
and merged with `check_techniques.py <key> --merge`. `scripts/analysis/check_techniques.py` is the
format check; its docstring is the contract.

| field | content |
|---|---|
| `id` | the technique id of the index row |
| `concept` | 2-5 neutral words naming the device: "word pop-in", "stepped zoom-out", "dip to background". No content words. |
| `segments` | segment ids from the index row |
| `reference_frames` | `[first, last]` exactly as the index row's reference-frames column (a single frame `fN` is `[N, N]`) |
| `curve_id`, `curve_property` | the curve the index row cites and its sidecar `property` (`curves/<id>.json`), else `null` |
| `moves` | every movement row of the timeline that names the technique, in every segment (below) |
| `geometry` | optional: rest positions and sizes of the elements, `{element: {"x0", "y0", "x1", "y1", "radius_pct_h", "stroke_px1080", ...}}` in % of the picture |
| `look` | neutral description of the elements: shapes, layer order, text roles, blur, mask, shadow, corner radius, stroke. No content, brands or people. |
| `typography` | `null`, or the text record below |
| `sound` | the sync note of the technique's moves (offset in frames to the nearest beat or onset), else `null` |
| `uncertain` | every `UNCERTAIN` item of the timeline about this technique, with reason and range, else `null` |

**A move** is `{"element", "property", "from", "to", "unit", "frames", "start", "delay", "stagger", "ease", "note"}`:
element in neutral role words ("card", "headline word", "icon badge", "cursor", "footage plate");
from / to numbers; frames = duration; start = first analysis frame; delay = frames after the
technique's first move; stagger = frames between instances (a number or the measured list); ease =
the measured fit as the timeline writes it (`bezier(x1, y1, x2, y2) D=n`, `spring damping ratio z`,
`linear`, `step`, or the sample list); note = sub-steps, holds, envelopes, speed changes. Copy numbers
exactly. A number the timeline does not give stays `null` and goes to `uncertain`.

**Units.** Pixels become % of the picture: x and widths in % of W, y and heights in % of H, or
`px1080` = px x 1080 / H for strokes, radii and small offsets. Keep the px value in the note when the
timeline gives px. Pictures: v1-v4 are 1920 x 1080; v5-v8 (screen recordings, cropped) are 1622 x 918.
Scales are factors, rotations degrees, opacity 0-1, luminance 0-255, blur in % of W (radius px / W x
100), speeds in % of W (or H) per frame.

**Typography** (text techniques):

| field | content |
|---|---|
| `role` | one of display, headline, subhead, body, ui, label, caption, counter, code |
| `closest_free` | Inter / Inter Tight / Archivo wdth N / Unbounded / JetBrains Mono, as the timeline names it |
| `original` | "not identified" unless the timeline identifies it |
| `weight` | a number from the stem ratio: `type_metrics.py weights <family> [--set upper|digits] [--wdth N]` lists stem / cap per weight of the local font; take the weight whose ratio is closest to the measured one (timeline, or measure it: stem width at the 50% ink level / flat cap height on the still) |
| `size_pct_h`, `size_range_pct_h` | flat cap height in % of H, a number measured on a still; the range over the technique's events |
| `tracking_em` | a number: measure the median gap between adjacent letters at the 50% ink level on a still, then `type_metrics.py tracking <family> --cap-px C --gap-px G --weight W [--set upper]`. `null` + uncertain only when no still shows separable letters |
| `case`, `align` | upper / lower / sentence / title / mixed; left / centre / right |
| `reveal_unit`, `reveal_method` | char, word, line, block; typewriter, fade, slide, blur, scale, mask, scramble, swap, count ... |
| `frames_per_unit`, `stagger` | frames, or `null` |

Tools run from `scripts/analysis/` with `../../.venv/bin/python`. Write only inside `analysis/<stem>/`.

## 2. The catalogue: `analysis/catalogue.json`

The map from every technique to the primitive that rebuilds it. `scripts/analysis/check_catalogue.py`
is the format check (its docstring and rules are the contract); `analysis/techniques_digest.md`
(`digest_techniques.py`) is the one-line-per-technique overview.

- **A primitive is one motion device**, rebuilt by one React component: a text reveal method, a
  transition type, a camera move, a UI behaviour, a counter, a 3D object move, an effect. The same
  device measured in several videos is one primitive; each measured instance is a variant. Different
  devices are different primitives, even when they move the same kind of element.
- **Variants.** Every technique sits in exactly one variant. A variant reproduces at most one measured
  curve, because a curve fixes its duration: each technique whose index row cites a curve has a
  variant whose `curve` is `{technique, curve_id, property}`, where `property` is what the component
  animates with that curve (x, y, scale, opacity, rotate, blur, progress, value ...). Techniques
  without a curve join the variant they are an instance of, or get their own variant when they are a
  distinct instance. Variant names are camelCase words about the motion (`snapLeft`, `slowPush`,
  `stepped`), unique in the primitive; no video ids, brands or content words.
- **Params.** Per primitive, the measured parameters the component reads: `"params": [{"name",
  "unit", "meaning"}]`. Per variant, `"params": {}` with values when they are at hand (the builders
  fill the rest from the records). `api` gives the component's props (content in: text, items,
  children, footage, tone; timing never).
- **Kinds**: text, transition, ui, 3d, footage, shape, camera, fx, layout. A transition that overlaps
  two scenes also exports a `TransitionSeries` presentation (BUILD.md).
- **FootageSlot** already exists (group `footage`, variant `plate`, no techniques). It stays as it
  is; techniques about graphics that carry footage (masked windows, framed plates) get their own
  primitives, which put a FootageSlot inside.
- **Groups** are the builders' units: at most 8 primitives each, grouped by kind and shared helpers,
  20-40 variants per group where the material allows. A primitive belongs to one group.
- `default_variant` is the most typical instance.

## 3. MOTION_SPEC.md

The written style guide at the repo root. Every number comes from `analysis/synthesis.json`,
`analysis/tokens.json`, `src/motion/tokens/*.ts` (generated by `gen_tokens.py`, `gen_timing.py`,
`gen_type.py`) or the technique records, and each table says which. Sections:

1. **Sources**: the 8 references (key, kind, length, classes), how they were measured (one paragraph).
2. **Graphics tempo**: shot length statistics (pooled and per video), cuts per second, accelerations,
   holds, with the block `<!-- tempo {"median_shot_frames": <m>, "p10": .., "p25": .., "p75": ..,
   "p90": .., "n": .., "cuts_per_second": ..} -->` where `<m>` equals `graphics_tempo.median`
   (verify.py checks it against `segments.json`).
3. **Timing tokens** (`SHOT`, `DURATION`, `TRANSITION`, `STAGGER`), **easing tokens** (every shape:
   parameters, what it does, uses, categories) and **stagger tokens**.
4. **Text reveal recipes**: per reveal method, unit, frames per unit, stagger, ease, offsets, blur and
   scale amounts, with the techniques they come from.
5. **Transition catalogue**: per transition type, frames, curve, what each side does, where it occurs.
6. **3D rules**, **typography rules** (roles: family, weight, cap height, tracking, case),
   **composition rules** (margins, alignment, element scale, layering, measured), **sound-sync rules**
   (boundary offsets to beats against chance, BPMs), **footage rules** (how footage is carried and
   moved).
7. **Per-video signatures**: what makes each reference distinct, with numbers.
8. **Avoid list**: what the references never do (measured), plus the brief's forbidden tools and
   content.
9. **Open questions**: uncertain items that matter for building, uncovered curves, families with no
   local stand-in.
10. **Primitive map**: technique family -> primitive -> variants, from the final catalogue.
