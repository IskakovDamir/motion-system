"""Critic issue 4 (noise run f740-f776): where the flickering 1-px column at x 1154 sits in the
S04 reply bubble text, and how it follows the source's picture types.
  * ink column runs (luma < 128) of the bubble text rows y 640-700 at f760, x 1100-1240
    (work.mp4, full res);
  * per frame f728-f780: mean luma of x 1154 / y 656-671 in work.mp4 and in source.mp4
    (source converted to gray with the same BT.601 weights as cv2), the source picture type
    (ffprobe), and the luma of the neighbouring columns x 1153 and x 1155.
Writes scratch/rv4_bubble_column.csv and prints the column runs."""
import csv
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

v = get_video("v1")
src = v.dir / "source.mp4"
types = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pict_type",
                        "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.split()
rd = WorkReader(v)
g = rd.read(760)
band = g[640:700, 1100:1240] < 128
cols = band.any(axis=0)
runs, start = [], None
for i, on in enumerate(list(cols) + [False]):
    if on and start is None:
        start = i
    if not on and start is not None:
        runs.append((start + 1100, i - 1 + 1100))
        start = None
print("ink column runs at f760 (x0-x1):", runs)
cap = cv2.VideoCapture(str(src))
cap.set(cv2.CAP_PROP_POS_FRAMES, 728)
rows = []
for f in range(728, 781):
    ok, img = cap.read()
    s = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    w = rd.read(f).astype(np.float32)
    rows.append([f, types[f], round(float(w[656:672, 1154].mean()), 1), round(float(s[656:672, 1154].mean()), 1),
                 round(float(w[656:672, 1153].mean()), 1), round(float(w[656:672, 1155].mean()), 1)])
out = v.dir / "scratch" / "rv4_bubble_column.csv"
with open(out, "w", newline="") as fh:
    wr = csv.writer(fh)
    wr.writerow(["frame", "source_pict_type", "work_x1154", "source_x1154", "work_x1153", "work_x1155"])
    wr.writerows(rows)
print(out)
