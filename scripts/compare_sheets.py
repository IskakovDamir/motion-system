#!/usr/bin/env python3
"""Side-by-side grayscale comparison sheets: reference moment left, primitive right.

  .venv/bin/python scripts/compare_sheets.py [--only <technique> ...] [--no-render]

For every technique in every timeline.md technique index:
  - reference: 8 moments spread over the technique's reference frames (work.mp4, grayscale)
  - built: the same normalised moments of the primitive variant the code maps the technique to,
    rendered in isolation by the PrimitiveProbe composition (scripts/render_probe.mjs)
  - when the technique has a measured curve: the measured and built progress curves, drawn under
    the frames
Output: analysis/compare/<technique>/sheet.jpg (+ built/ frames). Frame numbers are burned in:
reference frames on the 60 fps analysis grid, built frames of the probe composition.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
sys.path.insert(0, str(ROOT / "scripts"))
from common import WorkReader, label, load_registry  # noqa: E402
from curvekit import active_window  # noqa: E402
import verify  # noqa: E402

COMPARE = ROOT / "analysis" / "compare"
N = 8
TW, TH = 640, 360


def curve_panel(mf, mp, bp, w=TW * 2, h=220):
    img = np.full((h, w), 255, np.uint8)
    pad = 30
    cv2.rectangle(img, (pad, 10), (w - 10, h - pad), 200, 1)
    def draw(xs, ys, col, thick):
        pts = [(int(pad + x * (w - pad - 10)), int(h - pad - y * (h - pad - 20))) for x, y in zip(xs, ys)]
        for a, b in zip(pts, pts[1:]):
            cv2.line(img, a, b, col, thick, cv2.LINE_AA)
    s, e, _ = active_window(mf, mp)
    xm = (mf[s:e + 1] - mf[s]) / max(1, mf[e] - mf[s])
    draw(xm, np.clip(mp[s:e + 1], -0.2, 1.2), 0, 2)
    bs, be, _ = active_window(np.arange(len(bp)), bp)
    xb = (np.arange(bs, be + 1) - bs) / max(1, be - bs)
    draw(xb, np.clip(bp[bs:be + 1], -0.2, 1.2), 140, 2)
    cv2.putText(img, "measured (black) vs built (grey), normalised time", (pad, h - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, 0, 1, cv2.LINE_AA)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--no-render", action="store_true")
    a = ap.parse_args()
    techs = verify.timeline_techniques()
    built = json.loads((ROOT / "analysis" / "verify" / "built.json").read_text()) if (ROOT / "analysis" / "verify" / "built.json").exists() else verify.run_sampler()
    cat = built["catalogue"]
    probe_fps = 60
    jobs = []
    plan = {}
    for tid, t in sorted(techs.items()):
        if a.only and tid not in a.only:
            continue
        if tid not in cat or not t["reference_frames"]:
            print(f"skip {tid}: {'no catalogue entry' if tid not in cat else 'no reference frames'}")
            continue
        r0, r1 = t["reference_frames"]
        lead = built["probeLead"]
        prog = built["techniques"].get(tid, {}).get("progress")
        if prog:
            bs, be, _ = active_window(np.arange(len(prog)), np.array(prog))
            span = (bs, be)
        else:
            span = (0, max(1, r1 - r0))
        plan[tid] = {"ref": (r0, r1), "built": (lead + span[0], lead + span[1])}
        jobs.append({"id": tid, "composition": "PrimitiveProbe", "inputProps": {"technique": tid},
                     "frames": [0, lead + span[1] + 12], "outDir": str(COMPARE / tid / "built")})
    if not a.no_render and jobs:
        jf = ROOT / ".tmp" / "probe_jobs.json"
        jf.parent.mkdir(exist_ok=True)
        jf.write_text(json.dumps(jobs))
        p = subprocess.run(["node", "scripts/render_probe.mjs", str(jf)], cwd=ROOT)
        if p.returncode != 0:
            print("some probe renders failed; sheets for them are skipped")
    regs = {v.key: v for v in load_registry()}
    readers = {}
    made = 0
    for tid, pl in plan.items():
        t = techs[tid]
        v = regs[t["video"]]
        rd = readers.setdefault(v.key, WorkReader(v))
        bdir = COMPARE / tid / "built"
        files = sorted(bdir.glob("*.jp*g"))
        if not files:
            continue
        r0, r1 = pl["ref"]
        b0, b1 = pl["built"]
        rows = []
        for i in range(N):
            u = i / (N - 1)
            rf = int(round(r0 + u * (r1 - r0)))
            bf = int(round(b0 + u * (b1 - b0)))
            ref = rd.read(rf)
            ref = cv2.resize(ref, (TW, int(round(ref.shape[0] * TW / ref.shape[1]))), interpolation=cv2.INTER_AREA)
            ref = cv2.copyMakeBorder(ref, 0, max(0, TH - ref.shape[0]), 0, 0, cv2.BORDER_CONSTANT, value=40)[:TH]
            bimg = cv2.imread(str(files[min(bf, len(files) - 1)]), cv2.IMREAD_GRAYSCALE)
            bimg = cv2.resize(bimg, (TW, TH), interpolation=cv2.INTER_AREA)
            rows.append(np.hstack([label(ref, f"ref {v.key} f{rf}", 0.6), np.full((TH, 6), 0, np.uint8), label(bimg, f"built f{bf}", 0.6)]))
        sheet = np.vstack(rows)
        head = np.full((44, sheet.shape[1]), 255, np.uint8)
        b = built["techniques"].get(tid, {})
        title = f"{tid} -> {cat[tid]['primitive']} [{cat[tid]['variant']}]"
        cv2.putText(head, title, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, 2, cv2.LINE_AA)
        parts = [head, sheet]
        if t["curve"] and b.get("progress"):
            data = np.genfromtxt(v.dir / "curves" / f"{t['curve']}.csv", delimiter=",", names=True)
            panel = curve_panel(data["frame"].astype(float), data["progress"].astype(float), np.array(b["progress"]), w=sheet.shape[1])
            parts.append(panel)
        out = COMPARE / tid / "sheet.jpg"
        cv2.imwrite(str(out), np.vstack(parts), [cv2.IMWRITE_JPEG_QUALITY, 88])
        made += 1
    for r in readers.values():
        r.close()
    print(f"{made} comparison sheets in {COMPARE}")


if __name__ == "__main__":
    main()
