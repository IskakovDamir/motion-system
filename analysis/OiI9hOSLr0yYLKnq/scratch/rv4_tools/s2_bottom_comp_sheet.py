"""Picture for scratch/rv4_s2_bottom_cells.csv: the bottom strip x 440-1340 / y 960-1080 at
f222, f229, f240, f260, f280, f300, f328, each shown twice: as filmed (left) and with the
push-in removed (right; the frame scaled back to f225 about the frame centre, so a cell sits
in the same place in every tile and only its visibility can change).  Zoom 1.
Writes crops/rv4_s2_bottom_comp_00222-00328.jpg."""
import csv
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video, label, write_jpg  # noqa: E402

v = get_video("v1")
scale = {}
with open(v.dir / "scratch" / "s2_pushin_cells.csv") as fh:
    for r in csv.DictReader(fh):
        scale[int(r["frame"])] = float(r["scale"])
s0 = scale[225]
cx, cy = 959.5, 539.5
x0, y0, w, h = 440, 960, 900, 120
rd = WorkReader(v)
rows = []
for f in (222, 229, 240, 260, 280, 300, 328):
    g = rd.read(f)
    k = scale[f] / s0
    M = np.array([[k, 0, cx - cx * k], [0, k, cy - cy * k]], dtype=np.float64)
    comp = cv2.warpAffine(g, M, (g.shape[1], g.shape[0]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=40)
    a = cv2.cvtColor(g[y0:y0 + h, x0:x0 + w], cv2.COLOR_GRAY2BGR)
    b = cv2.cvtColor(comp[y0:y0 + h, x0:x0 + w], cv2.COLOR_GRAY2BGR)
    a = label(a, f"f{f}")
    b = label(b, f"f{f} push-in removed (k {k:.4f})")
    sep = np.full((h, 8, 3), 40, np.uint8)
    rows.append(np.hstack([a, sep, b]))
    rows.append(np.full((6, rows[-1].shape[1], 3), 40, np.uint8))
img = np.vstack(rows[:-1])
out = v.dir / "crops" / "rv4_s2_bottom_comp_00222-00328.jpg"
write_jpg(out, img)
print(out)
