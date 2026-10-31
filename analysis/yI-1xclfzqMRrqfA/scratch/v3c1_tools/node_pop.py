"""Pop-in of one S02 lattice node, measured relative to the pull-back.

usage: node_pop.py <row_j> <col_k> <start> <end> <ref> <name>
Node plane position as in lattice_onsets.py; predicted screen centre c(f) = (960,540) + (P-(960,540))*S(f).
A template cut at frame <ref> (box 2*141*S x 2*128.5*S around c(ref), node settled there) is matched in
every frame at scale p * S(f)/S(ref) for p = 0.70 .. 1.15 (step 0.0025) inside +-14 px of c(f):
p = node size relative to its settled size on the plane (1.000 = settled).
Opacity: core = 2nd-percentile luma in a disc of radius 0.30*badge width around the matched centre;
alpha_core = (246 - core) / (246 - core at ref).  ink = sum(max(0, 246 - L)) in the same disc;
alpha_ink = ink / ink(ref) / (S(f) p / S(ref))^2 (glyph area grows with the size).
Writes scratch/<name>.csv.
"""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video

D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
j, k, a, b, ref = map(int, sys.argv[1:6]); name = sys.argv[6]
S = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(D + "v3c1_zoom_scale.csv"))}
aligned = j in (-2, 0, 1, 3)
P = ((960.5 if aligned else 1290.5) + 660 * k, 250.5 + 580 * j)
def centre(f):
    return 960 + (P[0] - 960) * S[f], 540 + (P[1] - 540) * S[f]
v = get_video("v3"); rd = WorkReader(v)
frames = {f: rd.read(f).astype(np.float32) for f in range(a, b + 1)}
if ref not in frames:
    frames[ref] = rd.read(ref).astype(np.float32)
rd.close()
cx, cy = centre(ref); hw, hh = 141 * S[ref], 128.5 * S[ref]
x0, y0 = int(round(cx - hw)), int(round(cy - hh)); x1, y1 = int(round(cx + hw)), int(round(cy + hh))
tmpl = frames[ref][y0:y1, x0:x1]
toff = (cx - x0, cy - y0)  # node centre inside the template
H, W = 1080, 1920
def disc_stats(g, x, y, rad):
    xa, xb = int(max(0, x - rad)), int(min(W, x + rad + 1)); ya, yb = int(max(0, y - rad)), int(min(H, y + rad + 1))
    if xb <= xa or yb <= ya:
        return float("nan"), float("nan")
    sub = g[ya:yb, xa:xb]
    yy, xx = np.mgrid[ya:yb, xa:xb]
    m = (xx - x) ** 2 + (yy - y) ** 2 <= rad ** 2
    vals = sub[m]
    if vals.size < 10:
        return float("nan"), float("nan")
    return float(np.percentile(vals, 2)), float(np.clip(246 - vals, 0, None).sum())
rref = 0.30 * 2 * 141 * S[ref]
core_ref, ink_ref = disc_stats(frames[ref], cx, cy, rref)
rows = []
for f in range(a, b + 1):
    g = frames[f]; px, py = centre(f); rel = S[f] / S[ref]
    best = None
    for p in np.arange(0.70, 1.15 + 1e-9, 0.0025):
        s = p * rel
        tw, th = int(round(tmpl.shape[1] * s)), int(round(tmpl.shape[0] * s))
        if tw < 8 or th < 8:
            continue
        t = cv2.resize(tmpl, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        ex, ey = px - toff[0] * s, py - toff[1] * s  # expected top-left
        sx0, sy0 = int(max(0, ex - 14)), int(max(0, ey - 14))
        sx1, sy1 = int(min(W, ex + tw + 14)), int(min(H, ey + th + 14))
        region = g[sy0:sy1, sx0:sx1]
        if region.shape[0] < th or region.shape[1] < tw:
            continue
        res = cv2.matchTemplate(region, t, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if best is None or sc > best[0]:
            best = (sc, p, sx0 + loc[0] + toff[0] * s, sy0 + loc[1] + toff[1] * s)
    rad = 0.30 * 2 * 141 * S[f] * (best[1] if best else 1)
    mx, my = (best[2], best[3]) if best and best[0] > 0.5 else (px, py)
    core, ink = disc_stats(g, mx, my, rad)
    a_core = (246 - core) / (246 - core_ref)
    a_ink = ink / ink_ref / ((S[f] * (best[1] if best else 1)) / S[ref]) ** 2
    inside = (min(px + 141 * S[f], W) - max(px - 141 * S[f], 0)) / (2 * 141 * S[f])
    rows.append([f, f"{S[f]:.6f}", f"{rel:.4f}", f"{px:.1f}", f"{py:.1f}", f"{min(1, inside):.3f}",
                 f"{best[1]:.4f}" if best else "", f"{best[0]:.4f}" if best else "", f"{mx:.1f}", f"{my:.1f}",
                 f"{core:.0f}", f"{a_core:.3f}", f"{a_ink:.3f}"])
with open(D + name + ".csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "plane_scale", "plane_rel_ref", "pred_cx", "pred_cy", "badge_x_inside", "pop_scale", "score", "cx", "cy",
                "core_p2_luma", "alpha_core", "alpha_ink"])
    w.writerows(rows)
print(f"node j={j} k={k} plane {P}, ref f{ref} core {core_ref:.0f}")
for r in rows:
    print(" ".join(str(x) for x in (r[0], r[5], r[6], r[7], r[10], r[11], r[12])))
