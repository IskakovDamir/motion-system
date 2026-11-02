# motion-system

A Remotion + TypeScript motion system reverse-engineered from 8 reference videos: measured timing,
easing and typography tokens, 75 primitives (one component per motion device, 455 measured variants),
a showcase of every primitive and an original 28 s style demo. Everything is local and free: ffmpeg,
Python (OpenCV, PySceneDetect, librosa), Remotion with local rendering, three.js, fonts from fontsource.

## Setup

```
uv venv --python 3.12 .venv
uv pip install -r scripts/requirements.txt
npm ci
npx remotion browser ensure
```

## Commands

| what | command |
|---|---|
| studio | `npm run studio` |
| render the showcase / the style demo | `npm run render:showcase`, `npm run render:demo` |
| typecheck | `npm run typecheck` |
| full check (prints PASS) | `.venv/bin/python scripts/verify.py` |
| one group's check, probes, comparison sheets | `scripts/check_group.py <group>`, `scripts/probe_group.py <group>`, `scripts/compare_sheets.py --group <group>` |
| all comparison sheets | `.venv/bin/python scripts/compare_sheets.py` |
| a technique's measured rows | `cd scripts/analysis && ../../.venv/bin/python techniques.py show <id>` |
| regenerate tokens | `cd scripts/analysis && ../../.venv/bin/python gen_tokens.py && ../../.venv/bin/python gen_timing.py && ../../.venv/bin/python gen_type.py` |
| regenerate the registry | `.venv/bin/python scripts/gen_registry.py` |

## Where things are

- `MOTION_SPEC.md`: the style guide (tempo, tokens, text recipes, transitions, rules, signatures, avoid
  list, open questions, primitive map).
- `src/motion/tokens/`: `easing.ts` (ease shapes), `measured.ts` (one motion per measured curve),
  `timing.ts`, `type.ts`, `colors.ts`.
- `src/motion/primitives/<group>/<Name>.spec.ts` (data: variants, measured params, which techniques they
  reproduce) and `<Name>.tsx` (the component and its Demo). `analysis/catalogue.md` lists them all.
- `src/compositions/`: `MotionShowcase`, `StyleDemo` (+ `styleDemo/`), `PrimitiveProbe`.
- `analysis/`: per video `timeline.md`, `segments.json`, `cuts.json`, `curves/`; `PROTOCOL.md`,
  `EXTRACT.md`, `BUILD.md` (how it was made), `DECISIONS.md` (every judgment call), `BUILD_REPORT.md`
  (what each primitive could not build from the measurements). `reference/` holds the untouched
  originals and is never read by `src/`.

## Swapping the palette and the footage

- Palette: `src/motion/tokens/colors.ts` is the only file with colours. Primitives ask for roles
  (`bg`, `ink`, `accent`, `plate`, `flash` ...) per tone, so a brand palette is new values for those roles;
  keep `flash` and the light/dark luminance order, since flashes and dips are measured as luminance.
- Footage: every footage goes through `FootageSlot` (`src/motion/primitives/footage/`). Pass
  `footage={{kind: 'video', src: 'clip.mp4'}}` (a file in `public/`) to any primitive or Demo that takes
  footage; without it the slot renders a gray plate. The card, frame or mask around the slot owns the motion.
- Fonts: `src/motion/tokens/type.ts` maps roles to families loaded locally by
  `src/motion/engine/loadFonts.ts`; swap a family there and in `gen_type.py`'s FAMILIES.
