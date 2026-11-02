"""Sub-pixel scale and opacity of an element that pops about a fixed centre (no translation).

usage: mark_pop_fine.py <video> <cx> <cy> <half> <start> <end> <ref> <name> [--bg 246]
Template = patch of the rest frame <ref> centred on (cx, cy), half-size <half>. For frame f and candidate
p (0.80 .. 1.06, step 0.0005) the frame is resampled with warpAffine about (cx, cy) at scale p into a
patch of half-size half + 6 and the template is matched inside it (TM_CCOEFF_NORMED, integer offsets
up to +-6 px; gain/offset invariant, so a fade does not bias the scale); the best p is refined with a
parabola through the scores of its neighbours. alpha = least-squares slope of (patch - bg) on
(template - bg) at the best p and offset (opacity relative to rest). Writes scratch/<name>.csv.
"""
import argparse
import csv
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np
from common import WorkReader, get_video

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("cx", type=float); ap.add_argument("cy", type=float); ap.add_argument("half", type=int)
ap.add_argument("start", type=int); ap.add_argument("end", type=int); ap.add_argument("ref", type=int); ap.add_argument("name")
ap.add_argument("--bg", type=float, default=246.0)
a = ap.parse_args()
v = get_video(a.video)
rd = WorkReader(v)
frames = {f: rd.read(f).astype(np.float32) for f in sorted(set(range(a.start, a.end + 1)) | {a.ref})}
rd.close()
M = 6
R = a.half


def patch(g, scale, half):
    n = 2 * half + 1
    A = np.array([[scale, 0, a.cx - half * scale], [0, scale, a.cy - half * scale]], np.float32)
    return cv2.warpAffine(g, A, (n, n), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


T = patch(frames[a.ref], 1.0, R)
Tc = (T - a.bg).ravel()
ps = np.round(np.arange(0.80, 1.06 + 1e-9, 0.0005), 4)
rows = []
for f in range(a.start, a.end + 1):
    g = frames[f]
    scores = []
    locs = []
    for p in ps:
        P = patch(g, p, R + M)
        res = cv2.matchTemplate(P, T, cv2.TM_CCOEFF_NORMED)
        _, s, _, loc = cv2.minMaxLoc(res)
        scores.append(s if np.isfinite(s) else -1.0)
        locs.append(loc)
    scores = np.array(scores)
    i = int(np.argmax(scores))
    p = float(ps[i])
    if 0 < i < len(ps) - 1:
        s0, s1, s2 = scores[i - 1], scores[i], scores[i + 1]
        den = s0 - 2 * s1 + s2
        if den < 0:
            p += 0.5 * (s0 - s2) / den * 0.0005
    loc = locs[i]
    P = patch(g, float(ps[i]), R + M)[loc[1]:loc[1] + 2 * R + 1, loc[0]:loc[0] + 2 * R + 1]
    Pc = (P - a.bg).ravel()
    alpha = float((Pc @ Tc) / (Tc @ Tc))
    dx, dy = loc[0] - M, loc[1] - M
    rows.append([f, f"{p:.5f}", f"{scores[i]:.5f}", dx, dy, f"{alpha:.4f}"])
p = v.dir / "scratch" / f"{a.name}.csv"
with open(p, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "scale", "score", "dx", "dy", "alpha"])
    w.writerows(rows)
print(p)
for r in rows:
    print(*r)
