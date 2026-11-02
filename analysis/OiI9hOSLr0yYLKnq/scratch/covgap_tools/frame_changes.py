"""Coverage-gap review (v1): per-picture change counts the way coverage_gaps.py counts them, plus full-res
numbers and the codec frame type, for one range and an optional ROI.

  ../../../../.venv/bin/python frame_changes.py <name> <A> <B> [X Y W H]
writes analysis/OiI9hOSLr0yYLKnq/scratch/<name>.csv with columns
  frame, pict_type, px640 (pixels > 12 levels at 640 px wide, whole picture), full_px (> 12 levels, full res,
  inside the ROI), full_max (max abs difference in the ROI), roi_mean (mean luma of the ROI), bbox of the
  full-res changed pixels in the ROI
"""
import csv
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import get_video  # noqa: E402

name, A, B = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
roi = [int(x) for x in sys.argv[4:8]] if len(sys.argv) >= 8 else [0, 0, 1920, 1080]
v = get_video("v1")
types = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pict_type",
                        "-of", "json", str(v.source)], capture_output=True, text=True, check=True)
pict = [fr.get("pict_type", "?") for fr in json.loads(types.stdout)["frames"]]
cap = cv2.VideoCapture(str(v.source))
cap.set(cv2.CAP_PROP_POS_FRAMES, A - 1)
prev = prev_s = None
rows = []
x, y, w, h = roi
for f in range(A - 1, B + 1):
    ok, img = cap.read()
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    s = cv2.resize(g, (640, 360), interpolation=cv2.INTER_AREA)
    if prev is not None:
        k640 = int((cv2.absdiff(s, prev_s) > 12).sum())
        D = cv2.absdiff(g, prev)[y:y + h, x:x + w]
        m = D > 12
        bb = ["", "", "", ""]
        if m.any():
            ys, xs = np.nonzero(m)
            bb = [int(xs.min()) + x, int(ys.min()) + y, int(xs.max()) + x, int(ys.max()) + y]
        rows.append([f, pict[f] if f < len(pict) else "?", k640, int(m.sum()), int(D.max()), f"{g[y:y + h, x:x + w].mean():.3f}"] + bb)
    prev, prev_s = g, s
cap.release()
out = Path(__file__).resolve().parents[1] / f"{name}.csv"
with open(out, "w", newline="") as fh:
    wr = csv.writer(fh)
    wr.writerow(["frame", "pict_type", "px640", "full_px", "full_max", "roi_mean", "x0", "y0", "x1", "y1"])
    wr.writerows(rows)
print(out)
