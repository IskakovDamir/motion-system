"""Draw-on of the S02 lattice connectors during the pull-back.

Nodes as in lattice_onsets.py. Candidate connectors: row neighbours, diagonals between an aligned row and the
next offset row, verticals between rows 0 and 1. For every connector and frame f in [a, b]: sample the straight
line between the predicted node centres at f (bilinear, 0.5 px steps) over the part outside both badges
(distance > 0.62 * badge width / 2 ... from each centre: t in [t0, 1 - t0]); per sample take the min luma over
offsets -1.5..1.5 px across the line; a sample is drawn when it is >= 7 luma below the background (246).
Outputs per connector and frame: visible fraction of the sampled part inside the picture, drawn fraction,
drawn run touching end A (node 1) and end B (node 2) as fractions.  scratch/v3c1_lattice_edges_<a>-<b>.csv
"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video

D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
a, b = int(sys.argv[1]), int(sys.argv[2])
S = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv"))}
ALIGNED = {-2, 0, 1, 3}
def plane(j, k):
    return ((960.5 if j in ALIGNED else 1290.5) + 660 * k, 250.5 + 580 * j)
nodes = [(j, k) for j in range(-2, 4) for k in range(-6, 6)
         if -60 <= 960 + (plane(j, k)[0] - 960) * S[209] <= 1980]
edges = []
for j, k in nodes:
    if (j, k + 1) in nodes:
        edges.append(((j, k), (j, k + 1), "row"))
for j in range(-2, 3):
    for k in range(-6, 6):
        if (j, k) not in nodes:
            continue
        if j == 0:
            if (1, k) in nodes:
                edges.append(((0, k), (1, k), "vertical"))
            continue
        nj = j + 1
        if j in ALIGNED and nj not in ALIGNED:   # aligned k -> offset k-1 and k
            for kk in (k - 1, k):
                if (nj, kk) in nodes:
                    edges.append(((j, k), (nj, kk), "diag"))
        elif j not in ALIGNED and nj in ALIGNED:  # offset k -> aligned k and k+1
            for kk in (k, k + 1):
                if (nj, kk) in nodes:
                    edges.append(((j, k), (nj, kk), "diag"))
v = get_video("v3"); rd = WorkReader(v)
out = []
for f in range(a, b + 1):
    g = rd.read(f).astype(np.float32)
    s = S[f]
    for (n1, n2, kind) in edges:
        p1 = np.array(plane(*n1)); p2 = np.array(plane(*n2))
        c = np.array([960.0, 540.0])
        q1 = c + (p1 - c) * s; q2 = c + (p2 - c) * s
        L = float(np.linalg.norm(q2 - q1))
        rexcl = 155 * s if kind != "vertical" else 140 * s   # badge edge along the connector (+ 2-4 px)
        t0 = min(0.45, rexcl / L)
        n = max(8, int((1 - 2 * t0) * L * 2))
        ts = np.linspace(t0, 1 - t0, n)
        pts = q1[None, :] + ts[:, None] * (q2 - q1)[None, :]
        dvec = (q2 - q1) / L; perp = np.array([-dvec[1], dvec[0]])
        vals = []
        for o in np.arange(-3.0, 3.01, 0.5):
            pp = pts + o * perp[None, :]
            mx = pp[:, 0].astype(np.float32); my = pp[:, 1].astype(np.float32)
            vals.append(cv2.remap(g, mx.reshape(1, -1), my.reshape(1, -1), cv2.INTER_LINEAR, borderValue=-1).ravel())
        vals = np.array(vals)
        inside = (pts[:, 0] >= 1) & (pts[:, 0] <= 1918) & (pts[:, 1] >= 1) & (pts[:, 1] <= 1078)
        lo = vals.min(0)
        drawn = (lo <= 239) & inside
        vis = inside.mean()
        frac = drawn[inside].mean() if inside.any() else float("nan")
        # contiguous drawn run from each end (only meaningful where that end is inside)
        def run(seq):
            # drawn extent from one end, tolerating gaps of up to 3 samples (1.5 px)
            last, gap = 0, 0
            for i, d in enumerate(seq):
                if d:
                    last, gap = i + 1, 0
                else:
                    gap += 1
                    if gap > 3:
                        break
            return last
        runA = run(drawn)
        runB = run(drawn[::-1])
        out.append([f, f"{n1[0]},{n1[1]}", f"{n2[0]},{n2[1]}", kind, f"{L:.1f}", f"{vis:.3f}", f"{frac:.3f}",
                    f"{runA / n:.3f}", f"{runB / n:.3f}", f"{np.median(lo[inside]) if inside.any() else float('nan'):.0f}"])
rd.close()
p = D + f"v3c1_lattice_edges_{a}-{b}.csv"
with open(p, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "node_a", "node_b", "kind", "length_px", "visible_frac", "drawn_frac", "run_from_a", "run_from_b", "median_min_luma"])
    w.writerows(out)
print(p, len(edges), "edges")
