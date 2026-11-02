"""S02 late bottom-edge cells under the counter label's cleared zone (critic issue on f223-f225).

For every frame f214-f336 of work.mp4:
  * fixed-ROI mean luma of the three faint bottom-edge cells (the ROIs of
    scratch/fix_s2_cell_bot_x*.csv: x 499-556 / y 1029-1079, x 811-822 / y 1054-1079,
    x 1219-1281 / y 1042-1079) and of two control late cells away from the label
    (top edge x 1355-1428 / y 6-77, left edge x 59-133 / y 255-328);
  * push-in-compensated mean luma: frame f is warped by 1/k about the frame centre
    (k = scale(f) / scale(f225) from scratch/s2_pushin_cells.csv, the least-squares
    scale fit of the push-in) so the network sits where it sat at f225; a cell-relative
    ROI then holds the same part of the cell in every frame and only its visibility can
    change.  Rows kept: those that stay inside the picture for the whole push-in
    (y <= 1060 at the bottom, y >= 20 at the top), and the bottom ROIs start at
    y 1012, below the label's ink (y <= 1010), so the fixed label cannot enter them;
  * the counter label's dark-ink centroid and box (luma < 128 inside x 560-1360 /
    y 880-1015), to show that the label (and the zone around it) does not move with
    the push-in.
Writes scratch/rv4_s2_bottom_cells.csv.
"""
import csv
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

v = get_video("v1")
scr = v.dir / "scratch"
scale = {}
with open(scr / "s2_pushin_cells.csv") as fh:
    for r in csv.DictReader(fh):
        scale[int(r["frame"])] = float(r["scale"])
s0 = scale[225]

FIXED = {  # x, y, w, h
    "bot499": (499, 1029, 58, 51),
    "bot811": (811, 1054, 12, 26),
    "bot1219": (1219, 1042, 63, 38),
    "top1355": (1355, 6, 74, 72),
    "left59": (59, 255, 75, 74),
}
COMP = {  # cell-relative ROIs in f225 coordinates
    "bot499": (499, 1012, 58, 49),    # y 1012-1060: below the label ink (y <= 1010)
    "bot811": (785, 1012, 66, 49),    # the whole cell width around the visible tip
    "bot1219": (1219, 1012, 63, 49),
    "top1355": (1355, 20, 74, 58),    # y 20-77
    "left59": (59, 255, 75, 74),
}
cx, cy = 959.5, 539.5
rd = WorkReader(v)
rows = []
for f in range(214, 337):
    g = rd.read(f).astype(np.float32)
    k = scale.get(f, s0) / s0
    # output(x) = input(c + (x - c) * k): the network of frame f mapped back to f225's place
    M = np.array([[k, 0, cx - cx * k], [0, k, cy - cy * k]], dtype=np.float64)
    comp = cv2.warpAffine(g, M, (g.shape[1], g.shape[0]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REPLICATE)
    row = [f, round(k, 5)]
    for name, (x, y, w, h) in FIXED.items():
        row.append(round(float(g[y:y + h, x:x + w].mean()), 3))
    for name, (x, y, w, h) in COMP.items():
        row.append(round(float(comp[y:y + h, x:x + w].mean()), 3))
    lab = g[880:1015, 560:1360]
    ys, xs = np.nonzero(lab < 128)
    if len(xs):
        row += [round(float(xs.mean() + 560), 2), round(float(ys.mean() + 880), 2),
                int(xs.min() + 560), int(xs.max() + 560), int(ys.min() + 880), int(ys.max() + 880), int(len(xs))]
    else:  # label faded below the threshold (end of the T02 fade-out)
        row += ["", "", "", "", "", "", 0]
    rows.append(row)
hdr = ["frame", "k_vs_f225"] + [f"fixed_{n}" for n in FIXED] + [f"comp_{n}" for n in COMP] + \
      ["label_cx", "label_cy", "label_x0", "label_x1", "label_y0", "label_y1", "label_px"]
out = scr / "rv4_s2_bottom_cells.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(hdr)
    w.writerows(rows)
print(out)
