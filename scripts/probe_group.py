#!/usr/bin/env python3
"""Render one primitive group on its own and lay every variant out as contact sheets, so a builder can
look at its own motion while other groups' files are still being written.

  .venv/bin/python scripts/probe_group.py <group> [--only Name | Name--variant ...] [--frames A B] [--scale 0.5]

Bundles .tmp/probe/<group>/entry.tsx (scripts/probe_entry.py), renders each variant's probe
(PROBE_LEAD rest frames holding motion frame 0, then the motion) and writes
.tmp/probe/<group>/sheets/<Name>--<variant>_<k>.jpg: grayscale tiles, probe frame and motion frame
burned in, at most 36 tiles per sheet and 2 sheets per variant (every frame of a short probe, every
n-th frame of a long one). --frames A B tiles every probe frame of A..B instead (zoom into a fast moment).
"""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
sys.path.insert(0, str(ROOT / "scripts"))
from common import label, tile, write_jpg  # noqa: E402
from probe_entry import write_group_entry  # noqa: E402

TILES = 36


def group_sample(group: str) -> dict:
    p = subprocess.run(["npx", "tsx", "scripts/sample_curves.ts", "--group", group], cwd=ROOT, capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit(f"sample_curves.ts --group {group} failed:\n{p.stderr[-3000:]}")
    return json.loads(p.stdout)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("group")
    ap.add_argument("--only", nargs="*", help="primitive names or <Name>--<variant> ids")
    ap.add_argument("--frames", nargs=2, type=int, metavar=("A", "B"))
    ap.add_argument("--scale", type=float, default=0.5)
    a = ap.parse_args()
    built = group_sample(a.group)
    for p in built["problems"]:
        print("PROBLEM", p)
    lead = built["probeLead"]
    entry = write_group_entry(a.group)
    ids = [f"{s['name']}--{v}" for s in built["specs"] for v in s["variants"]]
    if a.only:
        ids = [i for i in ids if i in a.only or i.split("--")[0] in a.only]
    if not ids:
        raise SystemExit("nothing to render")
    base = ROOT / ".tmp" / "probe" / a.group
    first, last = (a.frames[0], a.frames[1]) if a.frames else (0, 100_000)
    jobs = [{"id": i, "composition": i, "frames": [first, last], "outDir": str(base / "frames" / i),
             "scale": a.scale, "concurrency": 3} for i in ids]
    jf = base / "jobs.json"
    jf.write_text(json.dumps({"entry": str(entry.relative_to(ROOT)), "jobs": jobs}))
    r = subprocess.run(["node", "scripts/render_probe.mjs", str(jf)], cwd=ROOT)
    sheets = base / "sheets"
    for old in sheets.glob("*.jpg") if not a.only else []:
        old.unlink()
    made = []
    for i in ids:
        files = sorted((base / "frames" / i).glob("*.jp*g"))
        if not files:
            print(f"no frames for {i}")
            continue
        frames = list(range(first, first + len(files)))
        step = 1 if a.frames else max(1, math.ceil(len(files) / (2 * TILES)))
        picks = list(range(0, len(files), step))
        if picks[-1] != len(files) - 1:
            picks.append(len(files) - 1)
        tiles = []
        for k in picks:
            img = cv2.imread(str(files[k]), cv2.IMREAD_GRAYSCALE)
            f = frames[k]
            tiles.append(label(cv2.resize(img, (320, 180), interpolation=cv2.INTER_AREA), f"p{f} m{f - lead}", 0.45))
        for n in range(0, len(tiles), TILES):
            out = sheets / f"{i}{'_f%d-%d' % (first, first + len(files) - 1) if a.frames else ''}_{n // TILES + 1}.jpg"
            write_jpg(out, tile(tiles[n:n + TILES], 6, 320, 180))
            made.append(out)
        shutil.rmtree(base / "frames" / i, ignore_errors=True)
    print(f"{len(made)} sheets (p = probe frame, m = motion frame = p - {lead}; every {'' if a.frames else 'n-th '}frame):")
    for m in made:
        print(" ", m.relative_to(ROOT))
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
