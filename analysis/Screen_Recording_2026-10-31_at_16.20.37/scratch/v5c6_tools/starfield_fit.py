"""Whole-frame motion of the P2 star field (v5c6, f3955-f4002), measured on the 4-point stars.

Per picture: star blobs = connected components of luma > 140 with area 3-600 px, at most 45 px
across, isolated (90th percentile of a 12 px ring around the box <= 120); speaker icon masked.
Per pair of consecutive pictures: model p' = C + s (p - C) + t (scale about the frame centre
C = (811, 459) plus a shift t, i.e. a similarity without rotation). A coarse grid over (s, tx, ty)
picks the solution with the most stars matched within 8 px, then least squares on the matched
stars (re-matched at 6 px, outliers above max(2.5 px, 3 x median) dropped) refines it.
Cumulative scale and shift are composed relative to the picture f3976. The picture f3987 (ring 2
crosses the star field: stars under the ring fail the isolation test and their centroids are pulled)
is not used as a link of the chain: f3990 is composed from the direct pair f3985 -> f3990, and f3987
gets its own value from f3985 -> f3987 (column `note`).

Run from scripts/analysis:  ../../.venv/bin/python <this file>
Writes scratch/v5c6_starfield_fit.csv
"""
import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "scripts" / "analysis"))
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402

A, B, REF = 3955, 4002, 3976
C = np.array([811.0, 459.0])
v = get_video("v5")
uniq = sorted(int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1")
frames = [f for f in uniq if A <= f <= B]


def stars(g):
    m = (g > 140).astype(np.uint8)
    m[837:906, 1545:1614] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 3 or a > 600 or max(w, h) > 45:
            continue
        x0, y0 = max(0, x - 12), max(0, y - 12)
        x1, y1 = min(g.shape[1], x + w + 12), min(g.shape[0], y + h + 12)
        pad = g[y0:y1, x0:x1].astype(float)
        inner = np.zeros_like(pad, bool)
        inner[y - y0:y - y0 + h, x - x0:x - x0 + w] = True
        if np.percentile(pad[~inner], 90) > 120:
            continue
        ys, xs = np.nonzero(lab[y:y + h, x:x + w] == i)
        ys, xs = ys + y, xs + x
        wt = g[ys, xs].astype(float)
        out.append(((xs * wt).sum() / wt.sum(), (ys * wt).sum() / wt.sum()))
    return np.array(out) if out else np.zeros((0, 2))


def matches(B1, B2, s, t, tol):
    pred = C + s * (B1 - C) + t
    d = np.linalg.norm(pred[:, None, :] - B2[None, :, :], axis=2)
    pr = []
    for i in range(len(B1)):
        j = int(np.argmin(d[i]))
        if d[i, j] <= tol and int(np.argmin(d[:, j])) == i:
            pr.append((i, j))
    return pr


def refine(B1, B2, s, t):
    keep = None
    for _ in range(4):
        pr = matches(B1, B2, s, t, 6.0)
        if len(pr) < 4:
            return None
        P1 = np.array([B1[i] for i, j in pr]) - C
        P2 = np.array([B2[j] for i, j in pr]) - C
        Am = np.zeros((2 * len(P1), 3)); bb = np.zeros(2 * len(P1))
        Am[0::2] = np.c_[P1[:, 0], np.ones(len(P1)), np.zeros(len(P1))]
        Am[1::2] = np.c_[P1[:, 1], np.zeros(len(P1)), np.ones(len(P1))]
        bb[0::2] = P2[:, 0]; bb[1::2] = P2[:, 1]
        keep = np.ones(len(P1), bool)
        for _ in range(4):
            idx = np.repeat(keep, 2)
            sol, *_ = np.linalg.lstsq(Am[idx], bb[idx], rcond=None)
            e = np.linalg.norm((Am @ sol - bb).reshape(-1, 2), axis=1)
            nk = e < max(2.5, 3.0 * np.median(e[keep]))
            if nk.sum() < 4:
                break
            keep = nk
        s, t = sol[0], sol[1:]
    return s, t, len(pr), int(keep.sum()), float(np.median(e[keep]))


rd = WorkReader(v)
S = {f: stars(rd.read(f)) for f in frames}
rd.close()
SKIP = {3987}
links = list(zip(frames[:-1], frames[1:])) + [(3985, 3990)]
pairs = {}
for f1, f2 in links:
    B1, B2 = S[f1], S[f2]
    if len(B1) < 4 or len(B2) < 4:
        continue
    best = None
    for s in np.arange(0.90, 1.08, 0.005):
        for tx in range(-40, 41, 4):
            for ty in range(-260, 41, 4):
                pred = C + s * (B1 - C) + np.array([tx, ty])
                d = np.linalg.norm(pred[:, None, :] - B2[None, :, :], axis=2)
                m = int((d.min(1) < 8).sum())
                if best is None or m > best[0]:
                    best = (m, s, np.array([tx, ty], float))
    if best[0] < 5:
        continue
    r = refine(B1, B2, best[1], best[2])
    if r is not None:
        pairs[(f1, f2)] = r
# compose relative to REF: p_f = C + Sc (p_REF - C) + T
cum = {REF: (1.0, np.zeros(2))}
chain = [f for f in frames[frames.index(REF):] if f not in SKIP]
for f1, f2 in zip(chain[:-1], chain[1:]):
    if (f1, f2) not in pairs or f1 not in cum:
        break
    s, t = pairs[(f1, f2)][:2]
    Sc, T = cum[f1]
    cum[f2] = (s * Sc, s * T + t)
for f in SKIP:
    prev = frames[frames.index(f) - 1]
    if (prev, f) in pairs and prev in cum:
        s, t = pairs[(prev, f)][:2]
        Sc, T = cum[prev]
        cum[f] = (s * Sc, s * T + t)
for f1, f2 in reversed(list(zip(frames[:frames.index(REF)], frames[1:frames.index(REF) + 1]))):
    if (f1, f2) not in pairs or f2 not in cum:
        break
    s, t = pairs[(f1, f2)][:2]
    Sc, T = cum[f2]
    cum[f1] = (Sc / s, (T - t) / s)
out = HERE.parents[1] / "v5c6_starfield_fit.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "unique", "prev_frame", "stars", "pairs", "inliers", "pair_scale", "pair_tx_px", "pair_ty_px",
                "res_med_px", "cum_scale", "cum_tx_px", "cum_ty_px", "cum_ty_pct", "note"])
    prev = None
    for f in frames:
        if f == 3990:
            prev = 3985
        row = [f, 1, prev if prev is not None else "", len(S[f])]
        if prev is not None and (prev, f) in pairs:
            s, t, n, k, e = pairs[(prev, f)]
            row += [n, k, f"{s:.4f}", f"{t[0]:+.2f}", f"{t[1]:+.2f}", f"{e:.2f}"]
        else:
            row += ["", "", "", "", "", ""]
        if f in cum:
            Sc, T = cum[f]
            row += [f"{Sc:.4f}", f"{T[0]:+.1f}", f"{T[1]:+.1f}", f"{100 * T[1] / 918:+.2f}"]
        else:
            row += ["", "", "", ""]
        row.append("ring 2 crosses the field; not a chain link" if f in SKIP else "")
        w.writerow(row)
        prev = f
print(out)
for r in csv.reader(open(out)):
    print(",".join(r))
