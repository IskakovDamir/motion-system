#!/usr/bin/env python3
"""Side-by-side grayscale comparison sheets: reference moment left, primitive right.

  .venv/bin/python scripts/compare_sheets.py [--only <technique> ...] [--keep]
  .venv/bin/python scripts/compare_sheets.py --group <group> [--only ...]     (a builder's own sheets)

For every technique in every timeline.md technique index:
  - reference: 8 moments spread over the technique's reference frames (work.mp4, grayscale); for a
    technique with a measured curve, over the curve's active window
  - built: the same normalised moments of the primitive variant the code maps the technique to,
    rendered in isolation (ProbeFrame layout: PROBE_LEAD rest frames, then the motion); for a curve
    technique, over the built curve's active window
  - when the technique has a measured curve: the measured and built progress curves, drawn under
    the frames
Output: analysis/compare/<technique>/sheet.jpg. Renders are shared per variant (only the frames its
sheets show, from the first to the last) and made BATCH variants at a time into .tmp/compare_built/;
each batch's frames are deleted once its sheets are written (--keep leaves them).
With --group, only that group's techniques, bundled on their own (scripts/probe_entry.py), into
.tmp/probe/<group>/compare/. Frame numbers are burned in: reference frames on the 60 fps analysis
grid, built frames of the probe composition.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
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
from probe_entry import write_group_entry  # noqa: E402
from probe_group import group_sample  # noqa: E402
import verify  # noqa: E402

COMPARE = ROOT / "analysis" / "compare"
N = 8
TW, TH = 640, 360
BATCH = 12


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


def frame_files(d: Path) -> dict[int, Path]:
    """Rendered frame number -> file (renderFrames numbers files by the composition frame)."""
    out = {}
    for f in d.glob("*.jp*g"):
        m = re.search(r"(\d+)\.jpe?g$", f.name)
        if m:
            out[int(m.group(1))] = f
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--group")
    ap.add_argument("--keep", action="store_true", help="keep the rendered frames in .tmp after the sheets are made")
    a = ap.parse_args()
    techs = verify.timeline_techniques()
    if a.group:
        built = group_sample(a.group)
        out_root = ROOT / ".tmp" / "probe" / a.group / "compare"
        render_root = out_root / "_built"
        entry = str(write_group_entry(a.group).relative_to(ROOT))
    else:
        built = verify.run_sampler()
        out_root = COMPARE
        render_root = ROOT / ".tmp" / "compare_built"
        entry = None
    cat = built["catalogue"]
    lead = built["probeLead"]
    plan = {}
    renders: dict[tuple[str, str], tuple[int, int]] = {}
    for tid, t in sorted(techs.items()):
        if a.only and tid not in a.only:
            continue
        if tid not in cat or not t["reference_frames"]:
            if not a.group or tid in cat:
                print(f"skip {tid}: {'no catalogue entry' if tid not in cat else 'no reference frames'}")
            continue
        r0, r1 = t["reference_frames"]
        prog = built["techniques"].get(tid, {}).get("progress")
        v = next(x for x in load_registry() if x.key == t["video"])
        cfile = v.dir / "curves" / f"{t['curve']}.csv" if t["curve"] else None
        if prog and cfile and cfile.exists():
            # curve techniques: both sides over their own active window, so row i is the same phase
            d = np.genfromtxt(cfile, delimiter=",", names=True)
            mf = d["frame"].astype(float)
            ms, me, _ = active_window(mf, d["progress"].astype(float))
            r0, r1 = int(mf[ms]), int(mf[me])
            bs, be, _ = active_window(np.arange(len(prog)), np.array(prog))
            span = (bs, be)
        else:
            span = (0, max(1, r1 - r0))
        key = (cat[tid]["primitive"], cat[tid]["variant"])
        b0, b1 = lead + span[0], lead + span[1]
        plan[tid] = {"ref": (r0, r1), "built": (b0, b1), "key": key}
        lo, hi = renders.get(key, (b0, b1))
        renders[key] = (min(lo, b0), max(hi, b1))
    regs = {v.key: v for v in load_registry()}
    readers = {}
    made = []
    keys = sorted(renders)
    for k0 in range(0, len(keys), BATCH):
        batch = keys[k0:k0 + BATCH]
        bdirs = {k: render_root / f"{k[0]}--{k[1]}" for k in batch}
        jobs = []
        for prim, var in batch:
            lo, hi = renders[(prim, var)]
            job = {"id": f"{prim}--{var}", "frames": [lo, hi], "outDir": str(bdirs[(prim, var)]), "scale": 0.5}
            if entry:
                job.update(composition=f"{prim}--{var}")
            else:
                job.update(composition="PrimitiveProbe", inputProps={"primitive": prim, "variant": var})
            jobs.append(job)
        jf = render_root / "_jobs.json"
        jf.parent.mkdir(parents=True, exist_ok=True)
        jf.write_text(json.dumps({"entry": entry, "jobs": jobs} if entry else jobs))
        p = subprocess.run(["node", "scripts/render_probe.mjs", str(jf)], cwd=ROOT)
        if p.returncode != 0:
            print("some probe renders failed; sheets for them are skipped")
        for tid, pl in plan.items():
            if pl["key"] not in bdirs:
                continue
            t = techs[tid]
            v = regs[t["video"]]
            rd = readers.setdefault(v.key, WorkReader(v))
            files = frame_files(bdirs[pl["key"]])
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
                bf = min(files, key=lambda n: abs(n - bf)) if bf not in files else bf
                bimg = cv2.imread(str(files[bf]), cv2.IMREAD_GRAYSCALE)
                bimg = cv2.resize(bimg, (TW, TH), interpolation=cv2.INTER_AREA)
                rows.append(np.hstack([label(ref, f"ref {v.key} f{rf}", 0.6), np.full((TH, 6), 0, np.uint8),
                                       label(bimg, f"built p{bf} m{bf - lead}", 0.6)]))
            sheet = np.vstack(rows)
            head = np.full((44, sheet.shape[1]), 255, np.uint8)
            b = built["techniques"].get(tid, {})
            title = f"{tid} -> {pl['key'][0]} [{pl['key'][1]}]"
            cv2.putText(head, title, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, 2, cv2.LINE_AA)
            parts = [head, sheet]
            if t["curve"] and b.get("progress"):
                data = np.genfromtxt(v.dir / "curves" / f"{t['curve']}.csv", delimiter=",", names=True)
                parts.append(curve_panel(data["frame"].astype(float), data["progress"].astype(float), np.array(b["progress"]), w=sheet.shape[1]))
            out = out_root / tid / "sheet.jpg"
            out.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(out), np.vstack(parts), [cv2.IMWRITE_JPEG_QUALITY, 88])
            made.append(out)
        if not a.keep:
            for d in bdirs.values():
                shutil.rmtree(d, ignore_errors=True)
        print(f"batch {k0 // BATCH + 1}/{(len(keys) + BATCH - 1) // BATCH}: {len(made)} sheets so far")
    for r in readers.values():
        r.close()
    print(f"{len(made)} comparison sheets in {out_root.relative_to(ROOT)}")
    for m in made if a.group or a.only else []:
        print(" ", m.relative_to(ROOT))


if __name__ == "__main__":
    main()
