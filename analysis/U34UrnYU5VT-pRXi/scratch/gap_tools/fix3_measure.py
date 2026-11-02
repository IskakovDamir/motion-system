"""Second coverage pass of v2 (2026-11-02): the measurements behind the fixes, written as CSVs to
analysis/U34UrnYU5VT-pRXi/scratch/fix3_*.csv. Frames are decoded from source.mp4 with cv2 and converted to gray
exactly as scripts/analysis/coverage_gaps.py does; '640w' counts use its 640 px INTER_AREA downscale and 12-level threshold.
  python fix3_measure.py"""
import csv
from pathlib import Path
import cv2
import numpy as np

VDIR = Path("/Users/damir/dev/motion-system/analysis/U34UrnYU5VT-pRXi")
SRC = VDIR / "source.mp4"
OUT = VDIR / "scratch"
RANGES = [(243, 300), (1173, 1242), (1345, 1368), (1555, 1607), (1620, 1637)]


def decode():
    hi = max(b for _, b in RANGES)
    cap = cv2.VideoCapture(str(SRC)); fr = {}; i = 0
    while i <= hi:
        ok, img = cap.read()
        if not ok:
            break
        if any(a <= i <= b for a, b in RANGES):
            fr[i] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        i += 1
    return fr


F = decode()
def g(f): return F[f].astype(np.float64)
def small(f): return cv2.resize(F[f], (640, 360), interpolation=cv2.INTER_AREA).astype(np.int16)
def d640(f, mask=None):
    m = np.abs(small(f) - small(f - 1)) > 12
    return int((m & ~mask).sum()) if mask is not None else int(m.sum())
def dfull(f, box=None):
    d = np.abs(g(f) - g(f - 1))
    if box:
        x0, y0, x1, y1 = box; d = d[y0:y1, x0:x1]
    return int((d > 12).sum()), int(d.max())
def write(name, head, rows):
    with open(OUT / name, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(head)
        for r in rows:
            w.writerow([f"{x:.3f}" if isinstance(x, float) else x for x in r])
    print("wrote", OUT / name, len(rows), "rows")


def xcross(row, lev):
    """sub-pixel x of the first up-crossing (dark->light) and the last down-crossing of a row segment"""
    idx = np.nonzero(row >= lev)[0]
    if len(idx) == 0 or idx[0] == 0 or idx[-1] >= len(row) - 1:
        return np.nan, np.nan
    i, j = idx[0], idx[-1]
    return i - 1 + (lev - row[i - 1]) / (row[i] - row[i - 1]), j + (row[j] - lev) / (row[j] - row[j + 1])


# 1. S04 eye bars f283-f299 (white bars on the black mascot, luma 17 / 250)
rows = []
for f in range(283, 300):
    im = g(f); out = [f]
    for x0, x1 in ((950, 1012), (1020, 1082)):
        L, R = [], []
        for y in range(520, 608):
            l, r = xcross(im[y, x0:x1], 133.5); L.append(x0 + l); R.append(x0 + r)
        p = np.clip(im[520:608, x0:x1] - 17.0, 0, None).sum(axis=0); x = np.arange(x0, x1)
        m = (p * x).sum() / p.sum(); wid = np.sqrt(12 * (p * (x - m) ** 2).sum() / p.sum())
        out += [float(np.nanmean(L)), float(np.nanmean(R)), float(wid)]
    T, B = [], []
    for x in range(970, 991):
        t, b = xcross(im[440:700, x], 133.5); T.append(440 + t); B.append(440 + b)
    out += [float(np.mean(T)), float(np.mean(B)), float(np.mean(B) - np.mean(T))]
    out += [int(round(im[y:y + 16, 962].mean())) for y in range(512, 624, 16)]
    out += [int(round(im[y:y + 16, 1069].mean())) for y in range(512, 624, 16)]
    out += [*dfull(f, (940, 480, 1100, 660)), d640(f)]
    rows.append(out)
write("fix3_S04_eyebars.csv",
      ["frame", "lbar_left_edge", "lbar_right_edge", "lbar_width_2nd_moment", "rbar_left_edge", "rbar_right_edge", "rbar_width_2nd_moment",
       "lbar_top", "lbar_bottom", "lbar_height"] + [f"x962_y{y}-{y+15}" for y in range(512, 624, 16)] + [f"x1069_y{y}-{y+15}" for y in range(512, 624, 16)]
      + ["eyebox_px_gt12_full", "eyebox_max_full", "frame_px_gt12_640w"], rows)

# 2. S04 mascot outline f244-f261 (vertex crossings rows 535-545; top/bottom on cols 860-939); outline-only diffs mask the eye bars
def cross_lr(row, x0, x1, lev=133.5):
    for x in range(x0, x1):
        if row[x] < lev <= row[x - 1]:
            return x - 1 + (row[x - 1] - lev) / (row[x - 1] - row[x])
    return np.nan
def cross_rl(row, x0, x1, lev=133.5):
    for x in range(x1, x0, -1):
        if row[x] < lev <= row[x + 1]:
            return x + (lev - row[x]) / (row[x + 1] - row[x])
    return np.nan
rows = []
for f in range(244, 262):
    im = g(f)
    L = np.nanmean([cross_lr(im[y], 700, 900) for y in range(535, 546)]); R = np.nanmean([cross_rl(im[y], 1020, 1220) for y in range(535, 546)])
    T = np.nanmean([cross_lr(im[:, x], 300, 500) for x in range(860, 940)]); B = np.nanmean([cross_rl(im[:, x], 600, 800) for x in range(860, 940)])
    eye = np.zeros(im.shape, bool)
    for h in (f - 1, f):
        e = np.zeros(im.shape, bool); e[380:700, 790:1130] = g(h)[380:700, 790:1130] > 60; eye |= e
    eye = cv2.dilate(eye.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    d = np.abs(g(f) - g(f - 1))
    e640 = cv2.resize(eye.astype(np.uint8) * 255, (640, 360), interpolation=cv2.INTER_AREA) > 0
    rows.append([f, float(L), float(R), float(R - L), float(T), float(B), float(B - T), int(((d > 12) & ~eye).sum()), int((d * ~eye).max()), d640(f, e640), d640(f)])
write("fix3_S04_outline.csv", ["frame", "left_vertex", "right_vertex", "width", "top", "bottom", "height", "outline_only_px_gt12_full", "outline_only_max_full",
                               "outline_only_px_gt12_640w", "frame_px_gt12_640w"], rows)

# 3. S15 T14 crossfade remnants f1174-f1190: mean luma of boxes where the logo strokes fade
boxes = {"slot2_lowleft_673-694_779-801": (673, 779, 695, 802), "slot2_lowright_774-796_778-800": (774, 778, 797, 801),
         "slot5_lowleft_1121-1142_761-796": (1121, 761, 1143, 797), "slot5_lowright_1227-1246_765-796": (1227, 765, 1247, 797),
         "slot3_916-941_702-740": (916, 702, 942, 741), "slot4_1082-1095_719-737": (1082, 719, 1096, 738)}
rows = []
for f in range(1174, 1191):
    im = g(f)
    rows.append([f] + [float(im[y0:y1, x0:x1].mean()) for (x0, y0, x1, y1) in boxes.values()] + [*dfull(f, (500, 680, 1420, 830)), d640(f)])
write("fix3_S15_T14_remnants.csv", ["frame"] + [f"luma_{k}" for k in boxes] + ["row_px_gt12_full", "row_max_full", "frame_px_gt12_640w"], rows)

# 4. S15 hex edges f1208-f1221: top and bottom edge crossings of each row hex (cols c-25..c+25), lev = (250 + fill) / 2
fills = [129, 105, 17, 133, 98, 131]
def vfirst(v, lev):
    for i in range(1, len(v)):
        if (v[i] - lev) * (v[i - 1] - lev) <= 0 and v[i] != v[i - 1]:
            return i - 1 + (v[i - 1] - lev) / (v[i - 1] - v[i])
    return np.nan
rows = []
for f in range(1208, 1222):
    im = g(f); out = [f]
    for k in range(6):
        c = int(round(584.5 + 150 * k)); lev = (250 + fills[k]) / 2
        T = np.nanmean([640 + vfirst(im[640:760, x], lev) for x in range(c - 25, c + 26)])
        B = np.nanmean([879 - vfirst(im[760:880, x][::-1], lev) for x in range(c - 25, c + 26)])
        out += [float(T), float(B)]
    out += [*dfull(f, (500, 680, 1420, 830)), d640(f)]
    rows.append(out)
write("fix3_S15_hex_edges.csv", ["frame"] + [f"hex{k+1}_{e}" for k in range(6) for e in ("top", "bottom")] + ["row_px_gt12_full", "row_max_full", "frame_px_gt12_640w"], rows)

# 5. S15 glance wave f1194-f1214: per hex, changed px (> 12 levels, full res) inside x c-48..c+48, y 712-800
rows = []
for f in range(1194, 1215):
    d = np.abs(g(f) - g(f - 1)); out = [f]
    for k in range(6):
        c = int(round(584.5 + 150 * k)); out.append(int((d[712:801, c - 48:c + 49] > 12).sum()))
    out.append(d640(f)); rows.append(out)
write("fix3_S15_glance_wave.csv", ["frame"] + [f"hex{k+1}_px_gt12_full" for k in range(6)] + ["frame_px_gt12_640w"], rows)

# 6. S15 single-column flickers on the new words f1183-f1196
rows = []
for f in range(1183, 1197):
    im = g(f)
    w = np.clip(250 - im[480:586, 421:685], 0, None); ys, xs = np.mgrid[480:586, 421:685]
    rows.append([f] + [int(round(im[y:y + 8, 541].mean())) for y in range(488, 552, 8)] + [float((w * xs).sum() / w.sum()), float((w * ys).sum() / w.sum())]
                + [int(round(im[y:y + 8, 866].mean())) for y in range(536, 568, 8)] + [d640(f)])
write("fix3_S15_flicker.csv", ["frame"] + [f"x541_y{y}-{y+7}" for y in range(488, 552, 8)] + ["word1_ink_cx", "word1_ink_cy"]
      + [f"x866_y{y}-{y+7}" for y in range(536, 568, 8)] + ["frame_px_gt12_640w"], rows)

# 7. S16 landing f1228-f1241: ink centroids (weight = bg - luma) of the tile logo and avatars 1 and 5
def ink(im, x0, y0, x1, y1, bg):
    w = np.clip(bg - im[y0:y1, x0:x1], 0, None); ys, xs = np.mgrid[y0:y1, x0:x1]
    return float((w * xs).sum() / w.sum()), float((w * ys).sum() / w.sum())
rows = []
for f in range(1228, 1242):
    im = g(f)
    rows.append([f, *ink(im, 900, 108, 1020, 222, 250), *ink(im, 700, 318, 785, 395, 245), *ink(im, 700, 805, 785, 880, 245), *dfull(f), d640(f)])
write("fix3_S16_landing.csv", ["frame", "tile_logo_cx", "tile_logo_cy", "avatar1_cx", "avatar1_cy", "avatar5_cx", "avatar5_cy", "frame_px_gt12_full", "frame_max_full", "frame_px_gt12_640w"], rows)

# 8. S19 page shift f1556-f1567 and f1594-f1606 (phase correlation of f-1 -> f, Hanning window)
def pc(a, b, roi):
    x0, y0, x1, y1 = roi
    w = cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_64F)
    (dx, dy), _ = cv2.phaseCorrelate(a[y0:y1, x0:x1], b[y0:y1, x0:x1], w)
    return float(dx), float(dy)
rois = [(460, 100, 1460, 900), (460, 150, 960, 500), (960, 300, 1460, 650), (460, 550, 1460, 900)]
rows = []
for f in list(range(1556, 1568)) + list(range(1594, 1607)):
    a, b = g(f - 1), g(f); p = pc(a, b, rois[0])
    rows.append([f, p[0], p[1]] + [pc(a, b, r)[1] for r in rois[1:]] + [*dfull(f), d640(f)])
write("fix3_S19_page_shift.csv", ["frame", "page_dx", "page_dy", "sub_x460-960_y150-500_dy", "sub_x960-1460_y300-650_dy", "sub_x460-1460_y550-900_dy",
                                  "frame_px_gt12_full", "frame_max_full", "frame_px_gt12_640w"], rows)

# 9. S17 line ink f1351-f1367 (encoder refinement at f1353)
rows = []
for f in range(1351, 1368):
    im = g(f); w = np.clip(250 - im[480:590, 640:1290], 0, None); ys, xs = np.mgrid[480:590, 640:1290]
    rows.append([f, float(w.sum() / 1000), float((w * xs).sum() / w.sum()), float((w * ys).sum() / w.sum()), *dfull(f), d640(f)])
write("fix3_S17_line_ink.csv", ["frame", "ink_mass_k", "ink_cx", "ink_cy", "frame_px_gt12_full", "frame_max_full", "frame_px_gt12_640w"], rows)

# 10. S20 strip at the end of T19 f1622-f1636: 1-D vertical-profile registration of static regions against f1636 (px; 0 = at rest)
R = {"laptop_ul": (290, 270, 470, 400), "laptop_ll": (290, 800, 470, 940), "laptop_lmid": (170, 540, 330, 660), "cloud_ur": (1450, 260, 1630, 390),
     "cloud_lr": (1450, 800, 1630, 930), "cloud_rmid": (1590, 530, 1750, 660), "labels": (150, 990, 1770, 1040), "hub": (870, 515, 1050, 690)}
def prof(im, roi, pad=8):
    x0, y0, x1, y1 = roi; return im[y0 - pad:y1 + pad, x0:x1].mean(axis=1)
def shift(pref, p, pad=8):
    ys = np.arange(len(p)); best = None
    for s in np.arange(-3, 3.0001, 0.005):
        e = ((np.interp(ys[pad:-pad] + s, ys, p) - pref[pad:-pad]) ** 2).mean()
        if best is None or e < best[0]:
            best = (e, s)
    return float(best[1])
ref = {k: prof(g(1636), r) for k, r in R.items()}
rows = [[f] + [shift(ref[k], prof(g(f), r)) for k, r in R.items()] for f in range(1624, 1637)]
write("fix3_S20_strip_rest.csv", ["frame"] + [f"{k}_offset_px" for k in R], rows)
