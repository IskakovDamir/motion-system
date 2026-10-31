"""Drawn front of one S02 lattice connector, per frame.

usage: edge_front.py j1 k1 j2 k2 start end name
The connector runs between the badge edges of nodes (j1,k1) and (j2,k2) (plane distance 141 px from a node
centre along a row, 145 px along a diagonal, scaled by S(f)). It is sampled every 0.25 px (min luma over
offsets -3..3 px across the line); samples >= 7 luma below the background (246) are drawn. drawn_px = length
of the drawn run that starts at the badge edge of node 1 (gaps up to 1.5 px tolerated); also the run from
node 2 and the total drawn length.  Writes scratch/<name>.csv with columns frame, plane_scale, length_px,
from_1_px, from_2_px, drawn_px, frac_from_1 (= from_1_px / length_px).
"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video
D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
j1, k1, j2, k2, a, b = map(int, sys.argv[1:7]); name = sys.argv[7]
S = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv"))}
AL = {-2, 0, 1, 3}
def plane(j, k):
    return np.array(((960.5 if j in AL else 1290.5) + 660 * k, 250.5 + 580 * j))
p1, p2 = plane(j1, k1), plane(j2, k2)
edge = 141.0 if j1 == j2 else 145.0
rd = WorkReader(get_video("v3"))
rows = []
for f in range(a, b + 1):
    g = rd.read(f).astype(np.float32)
    c = np.array([960.0, 540.0]); s = S[f]
    q1 = c + (p1 - c) * s; q2 = c + (p2 - c) * s
    L = np.linalg.norm(q2 - q1); d = (q2 - q1) / L; perp = np.array([-d[1], d[0]])
    r0, r1 = edge * s, L - edge * s
    rs = np.arange(r0, r1, 0.25)
    vals = []
    for o in np.arange(-3, 3.01, 0.5):
        pts = q1[None, :] + rs[:, None] * d[None, :] + o * perp[None, :]
        vals.append(cv2.remap(g, pts[:, 0].astype(np.float32).reshape(1, -1), pts[:, 1].astype(np.float32).reshape(1, -1),
                              cv2.INTER_LINEAR, borderValue=246).ravel())
    lo = np.min(vals, 0)
    drawn = lo <= 239
    def run(seq):
        last, gap = 0, 0
        for i, x in enumerate(seq):
            if x:
                last, gap = i + 1, 0
            else:
                gap += 1
                if gap > 6:
                    break
        return last * 0.25
    f1, f2 = run(drawn), run(drawn[::-1])
    length = r1 - r0
    rows.append([f, f"{s:.6f}", f"{length:.2f}", f"{f1:.2f}", f"{f2:.2f}", f"{drawn.sum() * 0.25:.2f}", f"{f1 / length:.4f}"])
rd.close()
with open(D + name + ".csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["frame", "plane_scale", "length_px", "from_1_px", "from_2_px", "drawn_px", "frac_from_1"]); w.writerows(rows)
for r in rows:
    print(" ".join(map(str, r)))
