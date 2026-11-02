"""Sub-pixel translation of a region between consecutive frames (source.mp4), by phase correlation
on the region and by a 1-D profile cross-correlation along y (parabolic peak).

  shift.py <A> <B> --roi X Y W H
Prints per frame f: dy, dx of f against f-1 (phase correlation) and the cumulative dy.
"""
import argparse, sys
from pathlib import Path
import cv2
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))
from common import get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--roi", type=int, nargs=4, required=True)
ap.add_argument("--name")
a = ap.parse_args()
v = get_video("v2")
cap = cv2.VideoCapture(str(v.source))
seek = max(0, a.a - 61)
cap.set(cv2.CAP_PROP_POS_FRAMES, seek)
x, y, w, h = a.roi
win = cv2.createHanningWindow((w, h), cv2.CV_64F)
prev = None
cum = 0.0
rows = []
pos = seek
while pos <= a.b:
    ok, img = cap.read()
    if not ok:
        break
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)[y:y + h, x:x + w].astype(np.float64)
    if pos >= a.a and prev is not None:
        (dx, dy), resp = cv2.phaseCorrelate(prev.copy(), g.copy(), win)
        cum += dy
        d = np.abs(g - prev)
        rows.append([pos, round(dy, 3), round(dx, 3), round(resp, 3), round(cum, 3), int((d > 12).sum())])
        print(f"f{pos}: dy {dy:+.3f} dx {dx:+.3f} resp {resp:.3f} cum_dy {cum:+.3f} | changed>12 {int((d > 12).sum())} px")
    prev = g
    pos += 1
cap.release()
if a.name:
    import csv
    out = v.dir / "scratch" / f"{a.name}.csv"
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["frame", "dy", "dx", "resp", "cum_dy", "changed_gt12"]); w.writerows(rows)
    print(out)
