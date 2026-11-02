"""Critic fix (v1): what changes in the picture one frame before the S03 / S04 card exits (f552, f777).

For each step (and control steps) every changed glyph cluster (> 12 levels on source.mp4, full res) gets a
sub-pixel shift (dx, dy) from an iterated Lucas-Kanade fit of the cluster patch; the shifts are then compared
with a uniform scale about the card centre (dx = k (cx - x), dy = k (cy - y)) and with an x-only re-snap.
Card edges (left of card 1, right of card 2) come from the 50% crossing of the mean profile of three row bands
(in S04 the light card 2 has no clear edge in the top band, y 280-320: the crossing there lands in its faint shadow, about x 1897).
Writes ../fix_exit_resnap_glyphs.csv and ../fix_exit_resnap_edges.csv.
Run: ../../../../.venv/bin/python exit_resnap.py   (from this folder)
"""
import csv
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import get_video  # noqa: E402

OUT = Path(__file__).resolve().parents[1]
v = get_video("v1")
cap = cv2.VideoCapture(str(v.source))
cache = {}


def read(n):
    if n not in cache:
        cap.set(cv2.CAP_PROP_POS_FRAMES, n)
        ok, img = cap.read()
        cache[n] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float64)
    return cache[n]


CENTRE = {1: (490.0, 560.0), 2: (1430.0, 560.0)}


def lk_shift(A, B, iters=6):
    """shift (dx, dy) that maps patch A onto B: B(x) ~ A(x - d)."""
    d = np.zeros(2)
    gx = cv2.Sobel(A, cv2.CV_64F, 1, 0, ksize=3) / 8
    gy = cv2.Sobel(A, cv2.CV_64F, 0, 1, ksize=3) / 8
    M = np.array([[np.sum(gx * gx), np.sum(gx * gy)], [np.sum(gx * gy), np.sum(gy * gy)]])
    for _ in range(iters):
        W = np.float64([[1, 0, d[0]], [0, 1, d[1]]])
        As = cv2.warpAffine(A, W, (A.shape[1], A.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        dt = B - As
        step = np.linalg.solve(M, -np.array([np.sum(gx * dt), np.sum(gy * dt)]))
        d = d + step
        if np.abs(step).max() < 1e-4:
            break
    return d


def edge_x(img, x0, x1, y0, y1, rising):
    prof = img[y0:y1, x0:x1].mean(0)
    lo, hi = prof.min(), prof.max()
    lvl = (lo + hi) / 2
    above = prof >= lvl
    ch = np.nonzero(above[1:] != above[:-1])[0]
    i = int(ch[0] if rising else ch[-1])
    p0, p1 = prof[i], prof[i + 1]
    return x0 + i + (lvl - p0) / (p1 - p0)


rows, erows = [], []
steps = [("S03", 549, 550, "control"), ("S03", 550, 551, "control"), ("S03", 551, 552, "pre-exit"), ("S03", 552, 553, "exit"),
         ("S04", 774, 775, "control"), ("S04", 775, 776, "control"), ("S04", 776, 777, "pre-exit"), ("S04", 777, 778, "exit")]
summary = []
for seg, fp, f, kind in steps:
    P, G = read(fp), read(f)
    D = (np.abs(G - P) > 12).astype(np.uint8)
    m = cv2.dilate(D, np.ones((15, 15), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    pts = []
    for i in range(1, n):
        x, y, w, h, _ = st[i]
        if D[y:y + h, x:x + w].sum() < 3 or y < 220 or y + h > 905 or w > 160 or h > 160:
            continue
        x0, y0, x1, y1 = max(0, x - 6), max(0, y - 6), x + w + 6, y + h + 6
        card = 1 if (x0 + x1) / 2 < 960 else 2
        dx, dy = lk_shift(P[y0:y1, x0:x1], G[y0:y1, x0:x1])
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ux, uy = CENTRE[card][0] - cx, CENTRE[card][1] - cy
        rows.append([seg, fp, f, kind, card, x0, y0, x1, y1, int(D[y:y + h, x:x + w].sum()), f"{dx:+.3f}", f"{dy:+.3f}",
                     int(np.sign(dx) == np.sign(ux)), f"{ux:.0f}", f"{uy:.0f}"])
        pts.append((dx, dy, ux, uy))
    if pts:
        a = np.array(pts)
        tow = int((np.sign(a[:, 0]) == np.sign(a[:, 2])).sum())
        # uniform scale about the card centre: [dx, dy] = k [ux, uy]
        u = np.concatenate([a[:, 2], a[:, 3]]); dvec = np.concatenate([a[:, 0], a[:, 1]])
        k = float(u @ dvec / (u @ u))
        res_scale = float(np.sqrt(np.mean((dvec - k * u) ** 2)))
        res_xonly = float(np.sqrt(np.mean(np.concatenate([a[:, 0] - np.sign(a[:, 2]) * np.abs(a[:, 0]).mean(), a[:, 1]]) ** 2)))
        pred_dy = np.abs(k * a[:, 3])
        summary.append(f"{seg} f{fp}->f{f} ({kind}): {len(a)} changed clusters, {tow} shift toward the card centre in x; "
                       f"|dx| {np.abs(a[:, 0]).min():.3f}-{np.abs(a[:, 0]).max():.3f} px (median {np.median(np.abs(a[:, 0])):.3f}), "
                       f"|dy| max {np.abs(a[:, 1]).max():.3f} px; uniform-scale fit 1-k = {1 + k:.5f} would give |dy| up to {pred_dy.max():.3f} px, rms residual {res_scale:.3f} px")
    else:
        summary.append(f"{seg} f{fp}->f{f} ({kind}): no changed clusters")
    # card edges, three row bands each (50% crossing of the band's mean profile)
    e = []
    for y0 in (280, 580, 830):
        e.append(f"{edge_x(G, 20, 70, y0, y0 + 40, True):.3f}")       # card 1 left edge (bg -> card)
    for y0 in (280, 580, 830):
        e.append(f"{edge_x(G, 1850, 1900, y0, y0 + 40, False):.3f}")  # card 2 right edge (last crossing)
    erows.append([seg, f] + e)
with open(OUT / "fix_exit_resnap_glyphs.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["segment", "frame_prev", "frame", "kind", "card", "x0", "y0", "x1", "y1", "changed_px", "dx_px", "dy_px", "x_toward_centre", "to_centre_x_px", "to_centre_y_px"])
    w.writerows(rows)
with open(OUT / "fix_exit_resnap_edges.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["segment", "frame", "card1_left_y280-320", "card1_left_y580-620", "card1_left_y830-870",
                "card2_right_y280-320", "card2_right_y580-620", "card2_right_y830-870"])
    w.writerows(erows)
for s in summary:
    print(s)
for e in erows:
    print("edges", e)
