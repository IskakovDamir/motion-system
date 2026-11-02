"""Critic fix (v1): centre of the end-card mark through T05 and its settle (f864-f905).

f878-f905: the mark is visible; its top and bottom edges are the 50% crossings of the mean row profile of
the column band x 945-975 (inside the flat top and bottom sides, clear of the eye bars) in a window around
the mark bbox of t5_mark_comp.csv; centre = (top + bottom) / 2, sub-pixel. Left / right edges likewise on
the row band y 370-390 (through the side vertices).
f864-f877: the mark is hidden in the text band (fading back in from f872), so its centre is the grid-patch
value of t5_layer.csv (network patch 200 px below the mark).
Writes ../fix_t5_mark_centre.csv.  Run from this folder: ../../../../.venv/bin/python t5_mark_centre.py
"""
import csv
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

S = Path(__file__).resolve().parents[1]
v = get_video("v1")
comp = {int(r["frame"]): r for r in csv.DictReader(open(S / "t5_mark_comp.csv"))}
layer = {int(r["frame"]): r for r in csv.DictReader(open(S / "t5_layer.csv"))}


def crossing(prof, first=True):
    lo, hi = float(prof.min()), float(prof.max())
    lvl = (lo + hi) / 2
    above = prof >= lvl
    ch = np.nonzero(above[1:] != above[:-1])[0]
    if len(ch) == 0:
        return None
    i = int(ch[0] if first else ch[-1])
    p0, p1 = prof[i], prof[i + 1]
    return i + (lvl - p0) / (p1 - p0)


r = WorkReader(v)
rows = []
for f in range(864, 906):
    if f >= 878:
        g = r.read(f).astype(np.float64)
        b = comp[f]
        y0, y1 = int(b["y0"]), int(b["y0"]) + int(b["h"]) - 1
        x0, x1 = int(b["x0"]), int(b["x0"]) + int(b["w"]) - 1
        top = crossing(g[y0 - 8:y0 + 12, 945:976].mean(1)) + y0 - 8
        bot = crossing(g[y1 - 12:y1 + 9, 945:976].mean(1), first=False) + y1 - 12
        cyr = int(round((top + bot) / 2))
        left = crossing(g[cyr - 10:cyr + 11, x0 - 8:x0 + 12].mean(0)) + x0 - 8
        right = crossing(g[cyr - 10:cyr + 11, x1 - 12:x1 + 9].mean(0), first=False) + x1 - 12
        rows.append([f, f"{(top + bot) / 2:.2f}", f"{(left + right) / 2:.2f}", f"{top:.2f}", f"{bot:.2f}", f"{left:.2f}", f"{right:.2f}",
                     f"{bot - top:.2f}", f"{right - left:.2f}", "mark edges (50% crossings)"])
    else:
        rows.append([f, f"{float(layer[f]['mark_y']):.2f}", "", "", "", "", "", "", "", "grid-patch template (t5_layer.csv); mark hidden in the band"])
r.close()
with open(S / "fix_t5_mark_centre.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "mark_cy", "mark_cx", "top", "bottom", "left", "right", "height", "width", "source"])
    w.writerows(rows)
for row in rows:
    print(" ".join(str(c) for c in row[:9]))
