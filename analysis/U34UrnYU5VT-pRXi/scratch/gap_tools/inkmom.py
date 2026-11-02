"""Sub-pixel ink moments of a light (or dark) element on a flat ground inside a ROI, per frame (source.mp4).

  inkmom.py <A> <B> --roi X Y W H --lo L --hi H [--dark] [--name N]
ink = clip((luma - lo) / (hi - lo), 0, 1) (or the inverse with --dark); prints sum (px), centroid x/y,
sqrt(sum), and the 2nd-moment width/height (std x/y * sqrt(12), = the box size for a uniform bar).
"""
import argparse, csv, sys
from pathlib import Path
import cv2
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))
from common import get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--roi", type=int, nargs=4, required=True)
ap.add_argument("--lo", type=float, required=True); ap.add_argument("--hi", type=float, required=True)
ap.add_argument("--dark", action="store_true")
ap.add_argument("--name")
a = ap.parse_args()
v = get_video("v2")
cap = cv2.VideoCapture(str(v.source))
seek = max(0, a.a - 60)
cap.set(cv2.CAP_PROP_POS_FRAMES, seek)
x, y, w, h = a.roi
yy, xx = np.mgrid[y:y + h, x:x + w].astype(np.float64)
rows = []
pos = seek
while pos <= a.b:
    ok, img = cap.read()
    if not ok:
        break
    if pos >= a.a:
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)[y:y + h, x:x + w].astype(np.float64)
        ink = np.clip((g - a.lo) / (a.hi - a.lo), 0, 1)
        if a.dark:
            ink = 1 - ink
        s = ink.sum()
        if s > 0:
            cx = (ink * xx).sum() / s; cy = (ink * yy).sum() / s
            sx = np.sqrt((ink * (xx - cx) ** 2).sum() / s) * np.sqrt(12); sy = np.sqrt((ink * (yy - cy) ** 2).sum() / s) * np.sqrt(12)
        else:
            cx = cy = sx = sy = float("nan")
        rows.append([pos, round(s, 1), round(cx, 3), round(cy, 3), round(np.sqrt(s), 3), round(sx, 3), round(sy, 3)])
    pos += 1
cap.release()
for r in rows:
    print(*r)
if a.name:
    p = v.dir / "scratch" / f"{a.name}.csv"
    with open(p, "w", newline="") as fh:
        wr = csv.writer(fh); wr.writerow(["frame", "ink_px", "cx", "cy", "sqrt_ink", "w2", "h2"]); wr.writerows(rows)
    print(p)
