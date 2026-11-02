"""Coverage-gap review (v1): the picture before the S03 and S04 card exits (f552, f777).

Writes two CSVs next to this folder (analysis/OiI9hOSLr0yYLKnq/scratch/):
  covgap_exit_precursor_cards.csv   per frame and card: affine ECC scale against a rest frame, Sobel
                                    sharpness and mean luma of the card interior (source.mp4, full res)
  covgap_exit_precursor_glyphs.csv  every glyph that changes by more than 12 levels in the step
                                    f551 -> f552 (S03) and f776 -> f777 (S04), and as a control in the
                                    first visible exit step f552 -> f553: light/dark-ink centroid shift
                                    and its component toward the card's own centre
Run: ../../../.venv/bin/python exit_precursor.py   (from this folder; it imports scripts/analysis/common.py)
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


def read(n):
    cap.set(cv2.CAP_PROP_POS_FRAMES, n)
    ok, img = cap.read()
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)


CARDS = {1: (20, 200, 940, 720), 2: (960, 200, 940, 720)}      # ECC ROIs x y w h
INNER = {1: (50, 230, 880, 660), 2: (990, 230, 880, 660)}      # card interiors for sharpness / mean
CENTRE = {1: (490.0, 560.0), 2: (1430.0, 560.0)}


def sharp(g):
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    return float((gx * gx + gy * gy).mean())


rows = []
for seg, ref, lo, hi in (("S03", 548, 546, 556), ("S04", 772, 771, 781)):
    R = read(ref)
    for f in range(lo, hi + 1):
        G = read(f)
        for c in (1, 2):
            x, y, w, h = CARDS[c]
            warp = np.eye(2, 3, dtype=np.float32)
            _, warp = cv2.findTransformECC(R[y:y + h, x:x + w], G[y:y + h, x:x + w], warp, cv2.MOTION_AFFINE,
                                           (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-8), None, 1)
            sx = float(np.hypot(warp[0, 0], warp[1, 0]))
            sy = float(np.hypot(warp[0, 1], warp[1, 1]))
            ix, iy, iw, ih = INNER[c]
            inner = G[iy:iy + ih, ix:ix + iw]
            rows.append([seg, f, c, f"{sx:.5f}", f"{sy:.5f}", f"{sharp(inner):.1f}", f"{inner.mean():.3f}"])
with open(OUT / "covgap_exit_precursor_cards.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["segment", "frame", "card", "ecc_scale_x", "ecc_scale_y", "sharpness", "mean_luma"])
    w.writerows(rows)

grows = []
for seg, fp, f in (("S03", 551, 552), ("S04", 776, 777), ("S03", 552, 553)):
    P, G = read(fp).astype(np.float64), read(f).astype(np.float64)
    m = (np.abs(G - P) > 12).astype(np.uint8)
    m2 = cv2.dilate(m, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m2)
    for i in range(1, n):
        x, y, w, h, _ = st[i]
        if int(m[lab == i].sum()) < 15 or y < 220 or y + h > 905 or w > 120 or h > 120:
            continue
        x0, y0, x1, y1 = max(0, x - 3), max(0, y - 3), x + w + 3, y + h + 3
        card = 1 if x1 < 960 else 2
        cs = []
        for img in (P, G):
            g = img[y0:y1, x0:x1]
            bg = np.median(np.concatenate([g[0], g[-1], g[:, 0], g[:, -1]]))
            ink = np.clip(g - bg, 0, None) if bg < 128 else np.clip(bg - g, 0, None)
            s = ink.sum()
            yy, xx = np.mgrid[y0:y1, x0:x1]
            cs.append(((ink * xx).sum() / s, (ink * yy).sum() / s))
        dx, dy = cs[1][0] - cs[0][0], cs[1][1] - cs[0][1]
        tx, ty = CENTRE[card][0] - cs[0][0], CENTRE[card][1] - cs[0][1]
        dist = float(np.hypot(tx, ty))
        grows.append([seg, fp, f, card, x0, y0, x1, y1, f"{dx:+.3f}", f"{dy:+.3f}", f"{(dx * tx + dy * ty) / dist:+.3f}", f"{dist:.0f}"])
with open(OUT / "covgap_exit_precursor_glyphs.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["segment", "frame_prev", "frame", "card", "x0", "y0", "x1", "y1", "shift_x_px", "shift_y_px", "toward_card_centre_px", "distance_to_centre_px"])
    w.writerows(grows)
cap.release()
for seg, fp, f in (("S03", 551, 552), ("S04", 776, 777), ("S03", 552, 553)):
    t = np.array([float(r[10]) for r in grows if r[0] == seg and r[2] == f])
    print(f"{seg} f{fp}->f{f}: {len(t)} changed glyphs, toward-centre shift median {np.median(t):+.3f} px, {int((t > 0).sum())} toward / {int((t < 0).sum())} away")
