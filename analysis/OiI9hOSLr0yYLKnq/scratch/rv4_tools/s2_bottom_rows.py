"""Per-row ink depth of two late bottom-edge S02 cells with the push-in removed (critic issue
on f223-f225).  Frames f229, f260, f300 and f328 of work.mp4 are scaled back to f225 about the
frame centre (k = scale(f) / scale(f225) from scratch/s2_pushin_cells.csv), so each cell row
y below is the same part of the cell in every frame.  depth = 246 (background) - the darkest
pixel of that row inside the cell's columns.  A uniform opacity fade would scale every row by
the same factor; in x 499-557 the lowest row keeps its depth while the rows nearer the label
gain ink, i.e. a soft mask that stays with the label uncovers the cell as it moves down.
Writes scratch/rv4_s2_bottom_rows.csv."""
import csv
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

v = get_video("v1")
scale = {}
with open(v.dir / "scratch" / "s2_pushin_cells.csv") as fh:
    for r in csv.DictReader(fh):
        scale[int(r["frame"])] = float(r["scale"])
s0 = scale[225]
cx, cy = 959.5, 539.5
rd = WorkReader(v)
FRAMES = (229, 260, 300, 328)
comp = {}
for f in FRAMES:
    g = rd.read(f).astype(np.float32)
    k = scale[f] / s0
    M = np.array([[k, 0, cx - cx * k], [0, k, cy - cy * k]], dtype=np.float64)
    comp[f] = cv2.warpAffine(g, M, (g.shape[1], g.shape[0]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                             borderMode=cv2.BORDER_REPLICATE)
rows = []
for name, (x0, x1) in {"x499-557": (499, 557), "x1219-1282": (1219, 1282)}.items():
    for y in range(1012, 1061):
        rows.append([name, y] + [round(246.0 - float(comp[f][y, x0:x1].min()), 1) for f in FRAMES])
out = v.dir / "scratch" / "rv4_s2_bottom_rows.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["cell", "y_at_f225"] + [f"depth_f{f}" for f in FRAMES])
    w.writerows(rows)
print(out)
