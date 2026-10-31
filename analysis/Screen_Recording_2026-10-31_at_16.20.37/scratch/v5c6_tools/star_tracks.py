"""Per-star tracks in the P2 star field (v5c6) and the field scale over longer spans.

Seeds: every star blob (same detector as starfield_fit.py, peak luma >= 170) on the pictures
f3980 and f3992. Each seed is followed picture by picture forwards and backwards over f3960-f4002:
the next position is predicted with the per-pair model in scratch/v5c6_starfield_fit.csv, then
refined to the brightest pixel within 6 px and the luma-weighted centroid of its connected
half-maximum blob. A track stops at the frame edge or when the peak falls below 120.
Duplicates (two seeds on one star) are merged. Writes scratch/v5c6_star_tracks.csv
(star, frame, x, y, r from the frame centre, peak luma, area of the star's connected blob above
luma 140, local background) and prints the field
scale between pictures from a similarity fit (scale about the frame centre + shift) on the stars
present at both ends, and per-star radius ratios.
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
R = 6
v = get_video("v5")
uniq = sorted(int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1")
frames = [f for f in uniq if 3960 <= f <= 4002]
model = {}
for r in csv.DictReader(open(HERE.parents[1] / "v5c6_starfield_fit.csv")):
    if r["pair_scale"]:
        model[(int(r["prev_frame"]), int(r["frame"]))] = (float(r["pair_scale"]), float(r["pair_tx_px"]), float(r["pair_ty_px"]))
# starfield_fit.py links f3985 -> f3990 directly (f3987 is not a chain link); derive f3987 -> f3990 for stepping
if (3985, 3990) in model and (3985, 3987) in model:
    s2, tx2, ty2 = model[(3985, 3990)]
    s1, tx1, ty1 = model[(3985, 3987)]
    sm = s2 / s1
    model[(3987, 3990)] = (sm, tx2 - sm * tx1, ty2 - sm * ty1)
rd = WorkReader(v)
G = {f: rd.read(f) for f in frames}
rd.close()
Hh, Ww = G[frames[0]].shape
GB = {f: cv2.GaussianBlur(g, (3, 3), 0) for f, g in G.items()}


def seeds(g):
    m = (g > 140).astype(np.uint8)
    m[837:906, 1545:1614] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 3 or a > 600 or max(w, h) > 45:
            continue
        x0, y0 = max(0, x - 12), max(0, y - 12)
        x1, y1 = min(Ww, x + w + 12), min(Hh, y + h + 12)
        pad = g[y0:y1, x0:x1].astype(float)
        inner = np.zeros_like(pad, bool)
        inner[y - y0:y - y0 + h, x - x0:x - x0 + w] = True
        if np.percentile(pad[~inner], 90) > 120:
            continue
        ys, xs = np.nonzero(lab[y:y + h, x:x + w] == i)
        ys, xs = ys + y, xs + x
        wt = g[ys, xs].astype(float)
        if wt.max() < 170:
            continue
        out.append(np.array([(xs * wt).sum() / wt.sum(), (ys * wt).sum() / wt.sum()]))
    return out


def refine(f, p):
    g, gb = G[f], GB[f]
    x0, x1 = int(max(0, p[0] - R)), int(min(Ww, p[0] + R + 1))
    y0, y1 = int(max(0, p[1] - R)), int(min(Hh, p[1] + R + 1))
    if x1 <= x0 or y1 <= y0:
        return None
    sub = gb[y0:y1, x0:x1]
    iy, ix = np.unravel_index(np.argmax(sub), sub.shape)
    cx, cy = x0 + ix, y0 + iy
    pk = int(g[cy, cx])
    wx0, wx1 = max(0, cx - 15), min(Ww, cx + 16)
    wy0, wy1 = max(0, cy - 15), min(Hh, cy + 16)
    w = g[wy0:wy1, wx0:wx1].astype(float)
    bg = float(np.percentile(w, 10))
    m = (w > bg + 0.5 * (pk - bg)).astype(np.uint8)
    _, lab = cv2.connectedComponents(m, connectivity=8)
    ys, xs = np.nonzero(lab == lab[cy - wy0, cx - wx0])
    wt = w[ys, xs] - bg
    if wt.sum() <= 0:
        return None
    q = np.array([wx0 + (xs * wt).sum() / wt.sum(), wy0 + (ys * wt).sum() / wt.sum()])
    edge = cx <= 2 or cy <= 2 or cx >= Ww - 3 or cy >= Hh - 3
    area = 0
    if pk > 140:
        bx0, bx1 = max(0, cx - 40), min(Ww, cx + 41)
        by0, by1 = max(0, cy - 40), min(Hh, cy + 41)
        mb = (g[by0:by1, bx0:bx1] > 140).astype(np.uint8)
        _, lb = cv2.connectedComponents(mb, connectivity=8)
        area = int((lb == lb[cy - by0, cx - bx0]).sum())
    return q, pk, bg, edge, area


def follow(f0, p0):
    tr = {}
    r0 = refine(f0, p0)
    if r0 is None:
        return tr
    tr[f0] = r0
    for direction in (1, -1):
        p = r0[0]
        i = frames.index(f0)
        while 0 <= i + direction < len(frames):
            j = i + direction
            fa, fb = frames[min(i, j)], frames[max(i, j)]
            if (fa, fb) not in model:
                break
            s, tx, ty = model[(fa, fb)]
            t = np.array([tx, ty])
            pred = C + s * (p - C) + t if direction == 1 else C + (p - C - t) / s
            if pred[0] < 0 or pred[1] < 0 or pred[0] > Ww - 1 or pred[1] > Hh - 1:
                break
            r = refine(frames[j], pred)
            if r is None or r[1] < 120:
                break
            tr[frames[j]] = r
            p = r[0]
            i = j
            if r[3]:
                break
    return tr


tracks = []
for f0 in (3980, 3992):
    for p0 in seeds(G[f0]):
        tr = follow(f0, p0)
        if len(tr) < 3:
            continue
        dup = False
        for other in tracks:
            common = [f for f in tr if f in other]
            if common and all(np.linalg.norm(tr[f][0] - other[f][0]) < 3 for f in common):
                dup = True
                if len(tr) > len(other):
                    other.clear(); other.update(tr)
                break
        if not dup:
            tracks.append(tr)
out = HERE.parents[1] / "v5c6_star_tracks.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["star", "frame", "x", "y", "r_from_centre", "peak_luma", "area_gt140", "local_bg", "at_edge"])
    for k, tr in enumerate(tracks):
        for f in sorted(tr):
            q, pk, bg, edge, area = tr[f]
            w.writerow([f"s{k:02d}", f, f"{q[0]:.1f}", f"{q[1]:.1f}", f"{np.linalg.norm(q - C):.1f}", pk, area, f"{bg:.0f}", int(edge)])
print(out, len(tracks), "tracks")


def span(fa, fb):
    P1, P2 = [], []
    for tr in tracks:
        if fa in tr and fb in tr and tr[fa][2] < 60 and tr[fb][2] < 60:
            P1.append(tr[fa][0]); P2.append(tr[fb][0])
    P1, P2 = np.array(P1), np.array(P2)
    if len(P1) < 4:
        return None
    Q1, Q2 = P1 - C, P2 - C
    Am = np.zeros((2 * len(Q1), 3)); bb = np.zeros(2 * len(Q1))
    Am[0::2] = np.c_[Q1[:, 0], np.ones(len(Q1)), np.zeros(len(Q1))]
    Am[1::2] = np.c_[Q1[:, 1], np.zeros(len(Q1)), np.ones(len(Q1))]
    bb[0::2] = Q2[:, 0]; bb[1::2] = Q2[:, 1]
    keep = np.ones(len(Q1), bool)
    for _ in range(4):
        idx = np.repeat(keep, 2)
        sol, *_ = np.linalg.lstsq(Am[idx], bb[idx], rcond=None)
        e = np.linalg.norm((Am @ sol - bb).reshape(-1, 2), axis=1)
        nk = e < max(3.0, 3.0 * np.median(e[keep]))
        if nk.sum() < 4:
            break
        keep = nk
    ratio = np.linalg.norm(Q2, axis=1) / np.linalg.norm(Q1, axis=1)
    far = np.linalg.norm(Q1, axis=1) > 150
    return len(P1), int(keep.sum()), sol[0], sol[1], sol[2], float(np.median(e[keep])), float(np.median(ratio[far])), float(np.percentile(ratio[far], 25)), float(np.percentile(ratio[far], 75))


print("span          stars inl  scale   tx     ty    res | median r ratio (q25-q75)")
for fa, fb in [(3960, 3965), (3965, 3970), (3970, 3976), (3960, 3976), (3976, 3980), (3980, 3985), (3985, 3990), (3990, 3995), (3995, 4000),
               (3976, 3985), (3985, 3992), (3992, 4000), (3976, 3992), (3976, 4000), (3982, 4000)]:
    r = span(fa, fb)
    if r is None:
        print(f"{fa}-{fb}: too few stars")
        continue
    n, k, s, tx, ty, e, mr, q1, q3 = r
    print(f"{fa}-{fb}  {n:3d} {k:3d}  {s:.4f} {tx:+6.1f} {ty:+6.1f} {e:5.2f} | {mr:.4f} ({q1:.4f}-{q3:.4f})")
