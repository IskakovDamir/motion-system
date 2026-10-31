# Decisions

Calls made where the brief left room, with the reason. Newest at the bottom of each section.

## Project and files

- **Separate repository.** The work lives in `~/dev/motion-system` (git `main`, private GitHub repo
  `IskakovDamir/motion-system`). The session started in `~/dev/agentmash`, whose checkout had 979
  staged changes unrelated to this job; committing this there would have swept them in.
- **reference/ is never committed.** The eight videos are third-party promos. They are APFS clones of
  the files in ~/Downloads (byte-identical, made read-only, SHA-256 recorded in `reference/README.md`).
  `.gitignore` also keeps every frame-derived image (contact sheets, detail frames, stills,
  comparison sheets) and the working copies out of git; the scripts rebuild them.
- **Working copies.** `analysis/<video>/source.mp4` is a byte-identical clone of the reference file;
  `work.mp4` is a grayscale, 60 fps constant-rate, short-GOP (15) x264 CRF 14 copy for frame-accurate
  random access. Nothing reads `reference/` after the clone.
- **Python 3.12 (Homebrew) in `.venv`.** The system default is 3.14; 3.12 has wheels for every package.
  **OpenCV pinned below 5**: opencv-python 5.0 dropped `CascadeClassifier` and the HOG people detector
  that the "no person in any render" check uses. Installed: opencv-python 4.14, numpy 2.5,
  scenedetect 0.7.2, librosa 1.0, matplotlib 3.11, scipy 1.18, pillow.

## Frames and time

- **One frame grid for all videos: 60 fps.** v1-v4 are 1920x1080 constant 60 fps. v5-v8 are macOS
  screen recordings of a web player: 1622x936, variable frame rate, every timestamp on the 60 Hz display
  grid. Analysis frame = round((pts - first pts) x 60) everywhere, so durations from all eight videos
  are in the same unit and the tokens are written at 60 fps directly.
- **Content frame rate of the recordings.** Frame intervals alternate 33.3/50 ms (3:2 cadence) in v5 and
  v6: 24 fps material. v7 and v8 add runs of 16.7/33.3 ms intervals (30 or 60 fps material inside the
  promo, or UI overlays); `motion.csv` `local_fps` shows where. Their durations carry +-1 frame capture
  jitter and 2-3 frame quantisation; detail windows use the captured pictures (12 pictures each side).
- **Picture crop of the recordings.** Rows 0-17 are a static black capture bar; the picture is
  1622x918 from y=18 (aspect 1.767; 16:9 would be 1.778, so the web player crops or scales the video by
  under 1%). Percent positions in v5-v8 are of this visible picture. Uncertainty: +-0.7% on x values.
- **Speaker icon.** A 56 px disc with a speaker glyph sits at the bottom right of every v5-v8 picture
  (the X player's volume control, burned in by the capture). It is masked out of motion statistics
  (x 1545-1613, y 837-905) and is not a graphic element of the references.
- **Audio time.** audio.json times are relative to the first video frame (stream start offsets
  applied: 0 for v1-v4, +0.026 .. +0.167 s for v5-v8).

## Detection

- **Cut candidates are deliberately over-collected.** PySceneDetect ContentDetector (threshold 27, plus
  local maxima >= 14 as weak candidates), AdaptiveDetector (3.0), ffmpeg scene score (0.30, weak 0.12),
  merged within +-2 frames (+-1 captured picture for v5-v8). Inspectors confirm or reject each one.
  The v1-v4 promos change scenes almost only through animated transitions on white, so the detectors
  find 1-4 candidates each; their boundaries come from frame inspection.
- **Motion energy**: gray difference at 640 px width, Farneback flow at 480 px width, both per analysis
  frame (screen-recording gaps are divided by the gap so the unit stays "per 60 fps frame").

## Curves

- **Remotion maths ported to Python** (`scripts/analysis/remotion_math.py`) for fitting. It matches
  Remotion 4.0.539's own `spring`, `measureSpring`, `Easing.bezier` and `interpolate` to 4e-16
  (`check_remotion_port.mjs`).
- **Duration rule** (`curvekit.py`, used by the measurements and later by `verify.py`): normalise
  progress; the active window runs from the last sample within 2% of rest before the half-way point
  to the first sample after which progress stays within 2% of the end. 2% because 1% sits inside
  tracker noise on 24 fps material.
- **Bezier fits use integer durations** (tokens are whole frames) and a small penalty that keeps the
  y control points in 0..1 unless the data overshoots, so equivalent fits come out as plain eases.

## Inspection

- **Chunks.** Each video is cut into chunks of ~800 analysis frames on a confirmed-looking cut or the
  quietest frame nearby (`analysis/chunks.json`, 26 chunks). Each chunk is inspected, reviewed by an
  independent critic and fixed; a merge per video then writes the final `cuts.json`, `segments.json`,
  `timeline.md` and `curves/index.json`. Protocol: `analysis/PROTOCOL.md`.
