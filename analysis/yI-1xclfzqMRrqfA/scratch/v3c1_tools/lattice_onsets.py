"""Per-node visibility of the S02 lattice during the pull-back.

Plane coordinates (scale 1 = S01 layout): node x = 960.5 + 660*k (rows 0, 1, -2, 3: aligned)
or 1290.5 + 660*k (rows -1, 2: half-step offset); row y = 250.5 + 580*j, j = -2..3.
Screen position at frame f = (960, 540) + (P - (960, 540)) * S(f), S from scratch/v3c1_zoom_scale.csv.
For every node and frame: centre, badge half-size (141*S, 128.5*S), fraction of the badge box inside
the picture, and the 2nd-percentile luma inside a disc of radius 0.30*badge width around the centre.
Writes scratch/v3c1_lattice_nodes_140-215.csv.
"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import numpy as np
from common import WorkReader, get_video

D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
S = {}
for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv")):
    S[int(r["frame"])] = float(r["scale"])
W, H = 1920, 1080
rows = {-2: ("aligned", 118.5), -1: ("offset", 287.1), 0: ("aligned", 455.7), 1: ("aligned", 624.3), 2: ("offset", 792.9), 3: ("aligned", 961.5)}
nodes = []
for j, (kind, yfin) in rows.items():
    py = 250.5 + 580 * j
    for k in range(-6, 6):
        px = (960.5 if kind == "aligned" else 1290.5) + 660 * k
        xf = 960 + (px - 960) * S[209]
        if -60 <= xf <= 1980:
            nodes.append((j, k, px, py, xf, 540 + (py - 540) * S[209]))
v = get_video("v3")
rd = WorkReader(v)
out = []
yy, xx = np.mgrid[0:H, 0:W]
for f in range(140, 216):
    g = rd.read(f).astype(np.float32)
    s = S[f]
    for j, k, px, py, xf, yf in nodes:
        cx, cy = 960 + (px - 960) * s, 540 + (py - 540) * s
        hw, hh = 141 * s, 128.5 * s
        bx0, bx1, by0, by1 = cx - hw, cx + hw, cy - hh, cy + hh
        ix = max(0.0, min(bx1, W) - max(bx0, 0)); iy = max(0.0, min(by1, H) - max(by0, 0))
        inside = (ix * iy) / (4 * hw * hh)
        rad = 0.30 * 2 * hw
        x0, x1 = int(max(0, cx - rad)), int(min(W, cx + rad + 1)); y0, y1 = int(max(0, cy - rad)), int(min(H, cy + rad + 1))
        if x1 <= x0 or y1 <= y0:
            out.append([f, j, k, f"{xf:.1f}", f"{yf:.1f}", f"{cx:.1f}", f"{cy:.1f}", f"{inside:.3f}", "", "", ""])
            continue
        sub = g[y0:y1, x0:x1]
        m = (xx[y0:y1, x0:x1] - cx) ** 2 + (yy[y0:y1, x0:x1] - cy) ** 2 <= rad ** 2
        vals = sub[m]
        if vals.size < 10:
            out.append([f, j, k, f"{xf:.1f}", f"{yf:.1f}", f"{cx:.1f}", f"{cy:.1f}", f"{inside:.3f}", "", "", ""])
            continue
        out.append([f, j, k, f"{xf:.1f}", f"{yf:.1f}", f"{cx:.1f}", f"{cy:.1f}", f"{inside:.3f}",
                    f"{np.percentile(vals, 2):.0f}", f"{vals.min():.0f}", f"{vals.mean():.1f}"])
rd.close()
with open(D + "v3c1_lattice_nodes_140-215.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "row_j", "col_k", "final_x", "final_y", "cx", "cy", "badge_inside_frac", "p2_luma", "min_luma", "mean_luma"])
    w.writerows(out)
print(len(nodes), "nodes;", len(out), "rows")
