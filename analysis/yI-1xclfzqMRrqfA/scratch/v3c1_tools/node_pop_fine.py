"""Sub-pixel version of node_pop.py: size of a popping lattice node relative to its settled size on the plane.

usage: node_pop_fine.py <row_j> <col_k> <start> <end> <ref> <name>
Template = patch of the reference frame (node settled) centred on the predicted node centre, half-size
R = 141*S(ref) (the badge half-width). For frame f and candidate p (0.70 .. 1.15, step 0.0025) the frame is
resampled with warpAffine about the predicted centre c(f) at scale p*S(f)/S(ref) into a patch of half-size
R + 8, and the template is matched inside it (TM_CCOEFF_NORMED, integer offsets up to +-8 px); the best p is
the node size relative to its settled size on the plane, independent of the template's pixel size.
Opacity alpha_core as in node_pop.py (2nd-percentile luma in a disc of radius 0.30 * badge width).
Writes scratch/<name>.csv.
"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video

D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
j, k, a, b, ref = map(int, sys.argv[1:6]); name = sys.argv[6]
S = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv"))}
P = ((960.5 if j in (-2, 0, 1, 3) else 1290.5) + 660 * k, 250.5 + 580 * j)
def centre(f):
    return 960 + (P[0] - 960) * S[f], 540 + (P[1] - 540) * S[f]
rd = WorkReader(get_video("v3"))
frames = {f: rd.read(f).astype(np.float32) for f in sorted(set(range(a, b + 1)) | {ref})}
rd.close()
R = int(round(141 * S[ref])); M = 8
def patch(g, cx, cy, scale, half):
    n = 2 * half + 1
    A = np.array([[scale, 0, cx - half * scale], [0, scale, cy - half * scale]], np.float32)
    return cv2.warpAffine(g, A, (n, n), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=246)
cxr, cyr = centre(ref)
T = patch(frames[ref], cxr, cyr, 1.0, R)
def core(g, x, y, rad):
    xa, xb = int(max(0, x - rad)), int(min(1920, x + rad + 1)); ya, yb = int(max(0, y - rad)), int(min(1080, y + rad + 1))
    if xb <= xa or yb <= ya:
        return float("nan")
    yy, xx = np.mgrid[ya:yb, xa:xb]
    vals = g[ya:yb, xa:xb][(xx - x) ** 2 + (yy - y) ** 2 <= rad ** 2]
    return float(np.percentile(vals, 2)) if vals.size >= 10 else float("nan")
core_ref = core(frames[ref], cxr, cyr, 0.6 * 141 * S[ref])
rows = []
for f in range(a, b + 1):
    g = frames[f]; cx, cy = centre(f); rel = S[f] / S[ref]
    best = None
    for p in np.arange(0.70, 1.15 + 1e-9, 0.0025):
        sc = p * rel
        Pp = patch(g, cx, cy, sc, R + M)
        res = cv2.matchTemplate(Pp, T, cv2.TM_CCOEFF_NORMED)
        _, s, _, loc = cv2.minMaxLoc(res)
        if best is None or s > best[0]:
            best = (s, p, cx + (loc[0] - M) * sc, cy + (loc[1] - M) * sc)
    s, p, mx, my = best
    c = core(g, mx, my, 0.6 * 141 * S[f] * p)
    rows.append([f, f"{S[f]:.6f}", f"{rel:.4f}", f"{cx:.1f}", f"{cy:.1f}", f"{p:.4f}", f"{s:.4f}", f"{mx:.1f}", f"{my:.1f}",
                 f"{c:.0f}", f"{(246 - c) / (246 - core_ref):.3f}"])
with open(D + name + ".csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "plane_scale", "plane_rel_ref", "pred_cx", "pred_cy", "pop_scale", "score", "cx", "cy", "core_p2_luma", "alpha_core"])
    w.writerows(rows)
print(f"node j={j} k={k} ref f{ref} R={R} core_ref {core_ref:.0f}")
for r in rows:
    print(r[0], r[5], r[6], r[9], r[10])
