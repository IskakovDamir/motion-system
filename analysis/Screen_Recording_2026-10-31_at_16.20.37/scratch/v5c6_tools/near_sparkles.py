"""Two large (near) 4-point sparkles of the P2 star field (v5c6): centroid of the luma > 150 blob
with a star shape (fill of its bounding box < 0.45, area 150-6000 px) nearest to the previous
position, inside a search region. Writes scratch/v5c6_near_sparkles.csv with the radius from the
frame centre, to compare with the field scale in scratch/v5c6_starfield_fit.csv (depth parallax).
"""
import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "scripts" / "analysis"))
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402

C = np.array([811.0, 459.0])
v = get_video("v5")
uniq = sorted(int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1")
field = {int(r["frame"]): float(r["cum_scale"]) for r in csv.DictReader(open(HERE.parents[1] / "v5c6_starfield_fit.csv")) if r["cum_scale"]}
sparkles = {"near_A_upper_left": (3976, np.array([339.0, 278.0]), (0, 0, 600, 450)),
            "near_B_bottom": (3978, np.array([1001.0, 812.0]), (850, 650, 450, 268))}
rd = WorkReader(v)
G = {f: rd.read(f) for f in uniq if 3976 <= f <= 3992}
rd.close()
rows = []
for name, (f0, p0, (x, y, w, h)) in sparkles.items():
    p = p0
    for f in [u for u in sorted(G) if u >= f0]:
        sub = G[f][y:y + h, x:x + w]
        m = (sub > 150).astype(np.uint8)
        n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
        best = None
        for i in range(1, n):
            xx, yy, ww, hh, a = st[i]
            if a < 150 or a > 6000 or a / float(ww * hh) >= 0.45:
                continue
            c = np.array([x + cen[i][0], y + cen[i][1]])
            d = np.linalg.norm(c - p)
            if d < 60 and (best is None or d < best[0]):
                best = (d, c, a)
        if best is None:
            break
        p = best[1]
        rows.append([name, f, f"{p[0]:.1f}", f"{p[1]:.1f}", f"{np.linalg.norm(p - C):.1f}", best[2], f"{field.get(f, float('nan')):.4f}"])
out = HERE.parents[1] / "v5c6_near_sparkles.csv"
with open(out, "w", newline="") as fh:
    wr = csv.writer(fh)
    wr.writerow(["sparkle", "frame", "x", "y", "r_from_centre", "area_gt150", "field_scale"])
    wr.writerows(rows)
print(out)
for r in rows:
    print(r)
