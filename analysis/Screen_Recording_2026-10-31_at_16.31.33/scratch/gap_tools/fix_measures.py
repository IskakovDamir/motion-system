"""Re-measurements behind the second critic round of the v8 coverage-gap review (scratch/coverage_gaps_review.json).

  ../../.venv/bin/python ../../analysis/Screen_Recording_2026-10-31_at_16.31.33/scratch/gap_tools/fix_measures.py [name ...]

names (default: all):
  s03_trail       S03 f256-f352  darkest pixel and mean luma of each sentence's last two letters and final period, each on
                                 its own glyph mask (pixels darker than 160 in the settled picture: f272 for sentence 1, f350
                                 for sentence 2), one row per captured picture of source.mp4. The older box of
                                 scratch/gaps_S03_trail_luma_256-352.csv started at the last letter's right stroke.
  s14_centre      S14 f1840-f1926 left / right 50% edges of the landed post card in the band y 450-700 (column means of
                                 work.mp4, as track.py edge does), each found inside a window of +-60 px around the coarse
                                 scratch/v8c3_reel_card_x_1840-1926.csv edge and taking the crossing nearest to it, and the
                                 centre between them (the coarse tracker drifts 1 px on the right edge while the card is still)
  s22_pushin      S22 f2890-f2920 first pictures of the camera push-in on the phone card: pixels over 12 levels against the
                                 previous picture at the coverage scan's 640 px width; a first-order gradient fit of a scale
                                 about the push-in's fixed point (1507, 1927) px over the card (x 525-1094, y 105-917) against
                                 f2898, as the shift of the card's top-left corner (534, 110); the change against the previous
                                 picture inside the card (x 520-1099, y 100-917); the top edge (row means crossing 140) in five
                                 column bands and the left edge (column means crossing 140) in four row bands; and the phase
                                 correlation of the card's upper region (x 550-949, y 120-519, Hanning window, on copies) against
                                 the rest picture f2898
"""
import csv
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import WorkReader, get_video, iter_unique

V = get_video("v8")
OUT = V.dir / "scratch"


def pictures(a, b):
    for f, _, g in iter_unique(V, gray=True):
        if f > b:
            break
        if f >= a:
            yield f, g


def write(name, rows):
    p = OUT / name
    with open(p, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(p.relative_to(V.dir), len(rows), "rows")


def s03_trail():
    pics = dict(pictures(256, 352))
    glyphs = {  # bounding boxes (x0, y0, x1, y1, end exclusive) of the connected components darker than 160
        "s1_letter2": (272, (587, 637, 607, 667)),   # the letter before the last one
        "s1_letter": (272, (610, 637, 630, 667)),    # the last letter
        "s1_period": (272, (634, 653, 639, 659)),
        "s2_letter2": (350, (933, 637, 953, 659)),
        "s2_letter": (350, (955, 637, 973, 659)),
        "s2_period": (350, (976, 653, 982, 659)),
    }
    masks = {}
    for k, (f, (x0, y0, x1, y1)) in glyphs.items():
        m = np.zeros(pics[f].shape, bool)
        m[y0:y1, x0:x1] = pics[f][y0:y1, x0:x1] < 160
        masks[k] = m
    rows = []
    for f in sorted(pics):
        g = pics[f].astype(float)
        r = {"frame": f}
        for k, (_, (x0, y0, x1, y1)) in glyphs.items():
            r[f"{k}_box"] = f"x{x0}-{x1 - 1} y{y0}-{y1 - 1}"
            r[f"{k}_px"] = int(masks[k].sum())
            r[f"{k}_min"] = int(g[masks[k]].min())
            r[f"{k}_mean"] = round(float(g[masks[k]].mean()), 1)
        rows.append(r)
    write("fix_S03_trail_glyphs_256-352.csv", rows)


def _edge_near(prof, x0, near):
    lo, hi = float(prof.min()), float(prof.max())
    lvl = lo + 0.5 * (hi - lo)
    above = prof >= lvl
    best = None
    for i in np.nonzero(above[1:] != above[:-1])[0]:
        p0, p1 = prof[i], prof[i + 1]
        pos = x0 + i + (lvl - p0) / (p1 - p0)
        if best is None or abs(pos - near) < abs(best - near):
            best = pos
    return best


def s14_centre():
    coarse = {}
    with open(OUT / "v8c3_reel_card_x_1840-1926.csv") as fh:
        for r in csv.DictReader(fh):
            coarse[int(r["frame"])] = (float(r["left_x"]), float(r["right_x"]))
    uniq = set()
    with open(V.dir / "motion.csv") as fh:
        for r in csv.DictReader(fh):
            if r["unique"] == "1":
                uniq.add(int(r["frame"]))
    rd = WorkReader(V)
    rows = []
    seed = None
    for f in range(1840, 1927):
        seed = coarse.get(f, seed)
        prof = rd.read(f)[450:700].astype(np.float32).mean(axis=0)
        edges = []
        for c in seed:
            x0 = int(round(c)) - 60
            edges.append(_edge_near(prof[x0:x0 + 121], x0, c))
        left, right = edges
        rows.append({"frame": f, "unique": int(f in uniq), "left_x": round(left, 2), "right_x": round(right, 2),
                     "centre_x": round((left + right) / 2, 2), "centre_x_pct": round(100 * (left + right) / 2 / 1622, 4),
                     "width_px": round(right - left, 2)})
    rd.close()
    write("fix_S14_card_centre_y450-700_1840-1926.csv", rows)


def _cross(seg, off, level=140.0):
    for i in range(len(seg) - 1):
        a, b = seg[i], seg[i + 1]
        if a >= level > b:
            return round(off + i + (level - a) / (b - a), 3)
    return ""


def s22_pushin():
    pics = {f: g.astype(np.float32) for f, g in pictures(2890, 2920)}
    small = {}
    for f, _, g in iter_unique(V, gray=True, width=640):   # the coverage scan's picture size
        if f > 2920:
            break
        if f >= 2890:
            small[f] = g.astype(np.float32)
    ref = np.ascontiguousarray(pics[2898][120:520, 550:950]).copy()
    win = cv2.createHanningWindow((400, 400), cv2.CV_32F)
    # gradient (first-order) fit of a scale s about the push-in's fixed point (1507, 1927) px over the card
    px_, py_ = 1507.0, 1927.0
    y0, y1, x0, x1 = 105, 918, 525, 1095
    refb = cv2.GaussianBlur(pics[2898].astype(np.float64), (0, 0), 0.8)
    gy, gx = np.gradient(refb)
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(float)
    G = gx[y0:y1, x0:x1] * (xx - px_) + gy[y0:y1, x0:x1] * (yy - py_)
    rows = []
    prev = None
    for f in sorted(pics):
        g = pics[f]
        r = {"frame": f}
        if prev is not None:
            r["scan640_px_over_12"] = int((np.abs(small[f] - small[prev]) > 12).sum())
        else:
            r["scan640_px_over_12"] = ""
        d = (cv2.GaussianBlur(g.astype(np.float64), (0, 0), 0.8) - refb)[y0:y1, x0:x1]
        k = -float((d * G).sum() / (G * G).sum())
        r["gradfit_scale_minus_1"] = f"{k:.2e}"
        r["gradfit_topleft_dx"] = round(k * (534 - px_), 3)
        r["gradfit_topleft_dy"] = round(k * (110 - py_), 3)
        if prev is not None:
            d = np.abs(g - pics[prev])[100:918, 520:1100]
            m = d > 12
            r["vs_prev"] = prev
            r["card_px_over_12"] = int(m.sum())
            r["card_max_diff"] = int(d.max())
            if m.any():
                ys, xs = np.nonzero(m)
                r["changed_bbox"] = f"x {520 + xs.min()}-{520 + xs.max()} y {100 + ys.min()}-{100 + ys.max()}"
            else:
                r["changed_bbox"] = ""
        else:
            r.update({"vs_prev": "", "card_px_over_12": "", "card_max_diff": "", "changed_bbox": ""})
        for a, b in ((560, 650), (650, 750), (750, 850), (850, 950), (950, 1050)):
            r[f"top_x{a}-{b - 1}"] = _cross(g[40:220, a:b].mean(axis=1), 40)
        for a, b in ((130, 300), (300, 500), (500, 700), (700, 900)):
            r[f"left_y{a}-{b - 1}"] = _cross(g[a:b, 400:650].mean(axis=0), 400)
        cur = np.ascontiguousarray(g[120:520, 550:950]).copy()
        (dx, dy), resp = cv2.phaseCorrelate(ref.copy(), cur, win)
        r["phase_dx_vs_f2898"] = round(float(dx), 3)
        r["phase_dy_vs_f2898"] = round(float(dy), 3)
        r["phase_response"] = round(float(resp), 3)
        rows.append(r)
        prev = f
    write("fix_S22_pushin_start_2890-2920.csv", rows)


JOBS = {"s03_trail": s03_trail, "s14_centre": s14_centre, "s22_pushin": s22_pushin}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(JOBS):
        JOBS[n]()
