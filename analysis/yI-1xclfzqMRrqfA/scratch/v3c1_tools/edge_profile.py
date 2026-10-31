"""Print the luma profile along one predicted lattice connector (debug view, no file written).
usage: edge_profile.py j1 k1 j2 k2 frame [frame ...]"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video
D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
S = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv"))}
ALIGNED = {-2, 0, 1, 3}
def plane(j, k):
    return np.array(((960.5 if j in ALIGNED else 1290.5) + 660 * k, 250.5 + 580 * j))
j1, k1, j2, k2 = map(int, sys.argv[1:5])
rd = WorkReader(get_video("v3"))
for f in map(int, sys.argv[5:]):
    g = rd.read(f).astype(np.float32)
    c = np.array([960.0, 540.0]); s = S[f]
    q1 = c + (plane(j1, k1) - c) * s; q2 = c + (plane(j2, k2) - c) * s
    L = np.linalg.norm(q2 - q1); d = (q2 - q1) / L; perp = np.array([-d[1], d[0]])
    ts = np.linspace(0, 1, 41)
    prof = []
    for t in ts:
        best = 999
        for o in np.arange(-3, 3.01, 0.5):
            p = q1 + t * (q2 - q1) + o * perp
            x, y = p
            if 0 <= x < 1919 and 0 <= y < 1079:
                v = cv2.getRectSubPix(g, (1, 1), (float(x), float(y)))[0, 0]
                best = min(best, v)
        prof.append(best)
    print(f"f{f} {q1.round(1)} -> {q2.round(1)} L={L:.0f}: " + " ".join(f"{int(p):3d}" if p < 999 else "  ." for p in prof))
rd.close()
