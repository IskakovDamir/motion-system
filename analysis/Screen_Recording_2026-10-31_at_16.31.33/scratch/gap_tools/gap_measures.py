"""Measurements behind the v8 coverage-gap review (scratch/coverage_gaps_review.json), one CSV each.
All values come from source.mp4 pictures (iter_unique: one row per captured picture), full resolution
1622 x 918 px, luma 0-255.

  ../../.venv/bin/python ../../analysis/Screen_Recording_2026-10-31_at_16.31.33/scratch/gap_tools/gap_measures.py [name ...]

names (default: all):
  card_edges      S03 f196-f210  white page rows / columns left at each picture edge while the footage card fills the frame
  pill_entry      S03 f226-f240  first row whose mean over x 300-1000 exceeds 150 (the white pill's top edge entering)
  trail           S03 f256-f352  darkest pixel and mean ink of each sentence's final period (trail clearing)
  smear           S03 f384-f430  darkening of the white pill background against the clean pill f429
  dropout         S03 f438-f458  rows of the white pill body (more than 600 of x 136-1202 brighter than 200)
  s14_card        S14 f1852-f1884 landing card's bottom / top edge (row mean over x 430-1190 crossing 140)
  s22_settle      S22 f2852-f2880 phone card edges (top row mean, left / right column means crossing 140)
  s22_pushin      S22 f2894-f2930 the same edges at the start of the camera push-in
  s22_pushin_ecc  S22 f2898-f2920 ECC affine fit of the card region against the rest picture f2898
  s25_gaps        S25 f3276-f3312 white gaps between the portrait cards and the row's leftward step
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import get_video, iter_unique

V = get_video("v8")
OUT = V.dir / "scratch"


def pictures(a, b, f32=False):
    for f, _, g in iter_unique(V, gray=True):
        if f > b:
            break
        if f >= a:
            yield f, (g.astype(np.float32) if f32 else g)


def write(name, rows):
    p = OUT / name
    with open(p, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(p.relative_to(V.dir), len(rows), "rows")


def cross(seg, off, falling, level=140.0):
    for i in range(len(seg) - 1):
        a, b = seg[i], seg[i + 1]
        if (a >= level > b) if falling else (a < level <= b):
            return round(off + i + (level - a) / (b - a), 2)
    return ""


def lead_run(arr):
    n = 0
    for x in arr:
        if x > 200:
            n += 1
        else:
            break
    return n


def card_edges():
    rows = []
    for f, g in pictures(196, 210):
        g = g.astype(float)
        rm = g[:, 200:1400].mean(axis=1)
        cm = g[100:800, :].mean(axis=0)
        rows.append({"frame": f, "white_rows_top": lead_run(rm), "white_rows_bottom": lead_run(rm[::-1]),
                     "white_cols_left": lead_run(cm), "white_cols_right": lead_run(cm[::-1]),
                     "row0_mean": round(rm[0], 1), "row1_mean": round(rm[1], 1), "row2_mean": round(rm[2], 1)})
    write("gaps_S03_card_edges_196-210.csv", rows)


def pill_entry():
    rows = []
    for f, g in pictures(226, 240):
        m = g[:, 300:1000].astype(float).mean(axis=1)
        above = np.nonzero(m > 150)[0]
        top = int(above.min()) if len(above) else ""
        rows.append({"frame": f, "first_row_over_150": top, "first_row_pct_h": round(100 * top / 918, 2) if top != "" else "",
                     "row_means_y912_917": " ".join(str(int(x)) for x in m[912:918])})
    write("gaps_S03_pill_entry_top_226-240.csv", rows)


def trail():
    pics = dict(pictures(256, 352))

    def blob(g, x0, x1, y0, y1):
        ys, xs = np.nonzero(g[y0:y1, x0:x1].astype(float) < 160)
        return x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1

    p1 = blob(pics[272], 626, 646, 645, 664)   # sentence 1's final period region, settled
    p2 = blob(pics[350], 970, 992, 645, 664)   # sentence 2's final period region, settled
    rows = []
    for f in sorted(pics):
        if not (256 <= f <= 276 or 334 <= f <= 352):
            continue
        g = pics[f].astype(float)
        r = {"frame": f}
        for n, (x0, y0, x1, y1) in (("s1_period", p1), ("s2_period", p2)):
            roi = g[y0 - 1:y1 + 1, x0 - 1:x1 + 1]
            r[f"{n}_box"] = f"x{x0}-{x1} y{y0}-{y1}"
            r[f"{n}_min"] = int(roi.min())
            r[f"{n}_ink"] = round(255 - roi.mean(), 1)
        rows.append(r)
    write("gaps_S03_trail_luma_256-352.csv", rows)


def smear():
    pics = dict(pictures(384, 430))
    ref = pics[429].astype(float)
    x0, x1, y0, y1 = 300, 1060, 585, 710
    bg = np.zeros(ref.shape, bool)
    bg[y0:y1, x0:x1] = ref[y0:y1, x0:x1] > 240
    bg = cv2.erode(bg.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
    rows = []
    for f in sorted(pics):
        d = ref[bg] - pics[f][bg].astype(float)
        rows.append({"frame": f, "bg_px": int(bg.sum()), "darkening_mean": round(float(d.mean()), 2),
                     "darkening_p99": round(float(np.percentile(d, 99)), 1), "darkening_max": int(d.max())})
    write("gaps_S03_smear_tail_energy_384-430.csv", rows)


def dropout():
    rows = []
    for f, g in pictures(438, 458):
        cnt = (g[:, 136:1202] > 200).sum(axis=1)
        r = np.nonzero(cnt > 600)[0]
        rows.append({"frame": f, "white_row_top": int(r.min()) if len(r) else "", "white_row_bottom": int(r.max()) if len(r) else "",
                     "white_rows": int(len(r)), "bottom_row_bright_px": int(cnt[-1])})
    write("gaps_S03_pill_dropout_rows_438-458.csv", rows)


def s14_card():
    rows = []
    prev = None
    for f, g in pictures(1852, 1884):
        m = g[:, 430:1190].astype(float).mean(axis=1)
        bot = cross_rising(m[700:900], 700)      # dark card above -> light page below
        top = cross(m[0:300], 0, True)            # light page above -> dark card below
        rows.append({"frame": f, "bottom_px": bot, "bottom_pct_h": round(100 * bot / 918, 2),
                     "step_px": "" if prev is None else round(bot - prev, 1), "top_px": top})
        prev = bot
    write("gaps_S14_card_bottom_1852-1884.csv", rows)


def cross_rising(seg, off, level=140.0):
    for i in range(len(seg) - 1):
        a, b = seg[i], seg[i + 1]
        if a < level <= b:
            return round(off + i + (level - a) / (b - a), 2)
    return float("nan")


def card_box(a, b, name):
    rows = []
    for f, g in pictures(a, b):
        g = g.astype(float)
        top = cross(g[40:220, 650:950].mean(axis=1), 40, True)          # light page above -> dark card
        left = cross(g[300:800, 400:650].mean(axis=0), 400, True)        # light page left -> dark card
        right = cross_rising(g[300:800, 980:1250].mean(axis=0), 980)     # dark card -> light page right
        rows.append({"frame": f, "top_px": top, "left_px": left, "right_px": right, "width_px": round(right - left, 2),
                     "width_pct_w": round(100 * (right - left) / 1622, 2)})
    write(name, rows)


def s22_pushin_ecc():
    pics = dict(pictures(2898, 2920, f32=True))
    ref = pics[2898] / 255.0
    mask = np.zeros(ref.shape, np.uint8)
    mask[100:918, 520:1100] = 255
    rows = []
    for f in sorted(pics):
        warp = np.eye(2, 3, dtype=np.float32)
        cc, warp = cv2.findTransformECC(ref, pics[f] / 255.0, warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-7), mask, 5)
        c = warp @ np.array([534.0, 110.0, 1.0])
        rows.append({"frame": f, "ecc_cc": round(float(cc), 5), "scale": round(float(np.sqrt(abs(np.linalg.det(warp[:, :2])))), 5),
                     "corner_dx_px": round(float(c[0] - 534), 3), "corner_dy_px": round(float(c[1] - 110), 3)})
    write("gaps_S22_pushin_ecc_2898-2920.csv", rows)


def s25_gaps():
    rows = []
    prev = None
    for f, g in pictures(3276, 3312):
        col = g[120:780, :].min(axis=0) > 225
        runs, start = [], None
        for x, c in enumerate(col):
            if c and start is None:
                start = x
            if not c and start is not None:
                runs.append((start, x - 1))
                start = None
        if start is not None:
            runs.append((start, len(col) - 1))
        gaps = [((a + b) / 2, b - a + 1) for a, b in runs if 10 <= b - a + 1 <= 60]
        step = ""
        if prev is not None and gaps:
            d = [min((p - c for p in prev if 0 <= p - c <= 40), default=None) for c, _ in gaps]
            d = [x for x in d if x is not None]
            step = float(np.median(d)) if d else ""
        rows.append({"frame": f, "gap_centres_px": " ".join(f"{c:.1f}" for c, _ in gaps), "gap_widths_px": " ".join(str(w) for _, w in gaps),
                     "leftward_step_px": step})
        prev = [c for c, _ in gaps]
    write("gaps_S25_row_gaps_3276-3312.csv", rows)


JOBS = {
    "card_edges": card_edges, "pill_entry": pill_entry, "trail": trail, "smear": smear, "dropout": dropout,
    "s14_card": s14_card,
    "s22_settle": lambda: card_box(2852, 2880, "gaps_S22_card_settle_2852-2880.csv"),
    "s22_pushin": lambda: card_box(2894, 2930, "gaps_S22_pushin_edges_2894-2930.csv"),
    "s22_pushin_ecc": s22_pushin_ecc, "s25_gaps": s25_gaps,
}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(JOBS):
        JOBS[n]()
