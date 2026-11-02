"""Sub-pixel x positions of the vertical edges crossing a horizontal band (source.mp4), per frame.

  edges4.py <A> <B> --band X0 X1 Y0 Y1 [--level 0.5]
Averages the rows Y0..Y1 into one profile over X0..X1 and lists every 50% crossing (sub-pixel).
"""
import argparse, sys
from pathlib import Path
import cv2
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))
from common import get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--band", type=int, nargs=4, required=True)
ap.add_argument("--level", type=float, default=0.5)
ap.add_argument("--axis", default="x")
ap.add_argument("--name")
a = ap.parse_args()
v = get_video("v2")
cap = cv2.VideoCapture(str(v.source))
seek = max(0, a.a - 60)
cap.set(cv2.CAP_PROP_POS_FRAMES, seek)
x0, x1, y0, y1 = a.band
rows = []
pos = seek
while pos <= a.b:
    ok, img = cap.read()
    if not ok:
        break
    if pos >= a.a:
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)[y0:y1 + 1, x0:x1 + 1].astype(np.float64)
        prof = g.mean(0) if a.axis == "x" else g.mean(1)
        base = x0 if a.axis == "x" else y0
        lo, hi = prof.min(), prof.max()
        lvl = lo + a.level * (hi - lo)
        ab = prof >= lvl
        idx = np.nonzero(ab[1:] != ab[:-1])[0]
        xs = []
        for i in idx:
            p0, p1 = prof[i], prof[i + 1]
            xs.append(base + i + (lvl - p0) / (p1 - p0))
        print(pos, " ".join(f"{q:.3f}" for q in xs), f"| lo {lo:.1f} hi {hi:.1f}")
        rows.append([pos, round(lo, 1), round(hi, 1)] + [round(q, 3) for q in xs])
    pos += 1
cap.release()
if a.name:
    import csv
    out = v.dir / "scratch" / f"{a.name}.csv"
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["frame", "lo", "hi", "crossings_px..."]); w.writerows(rows)
    print(out)
