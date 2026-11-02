"""Sub-pixel geometry and luma of a static-looking text line over moving footage, per captured picture.

python headline_geometry.py <start> <end> X Y W H --ref F [--name N]
  core: glyph-core pixels of the reference picture (luma > 225, eroded 1 px); their mean luma per picture.
  ink: luma-weighted centroid and spread (std) in x and y of the pixels > 200 inside the box.
  ecc: similarity transform (scale, dx, dy) that maps the reference box onto this picture, ECC with a
       mask of the dilated reference glyphs (so the footage between the words is ignored).
  p999: 99.9th percentile of the picture outside the box (dim level of the footage).
"""
import argparse
import csv
import sys

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import WorkReader, get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("start", type=int); ap.add_argument("end", type=int)
ap.add_argument("roi", type=int, nargs=4)
ap.add_argument("--ref", type=int, required=True); ap.add_argument("--name")
a = ap.parse_args()
v = get_video("v7")
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
rd = WorkReader(v)
x, y, w, h = a.roi
full_ref = rd.read(a.ref)
ref = full_ref[y:y + h, x:x + w].astype(np.float32)
core = cv2.erode((ref > 225).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
glyph = (ref > 200).astype(np.uint8)
mask = cv2.dilate(glyph, np.ones((7, 7), np.uint8))
outside = np.ones(full_ref.shape, bool)
outside[y:y + h, x:x + w] = False
outside[837:905, 1545:1613] = False  # speaker icon
rows = []
for f in [u for u in uniq if a.start <= u <= a.end]:
    full = rd.read(f)
    g = full[y:y + h, x:x + w].astype(np.float32)
    ink = g > 200
    wts = np.where(ink, g, 0)
    ys, xs = np.mgrid[0:h, 0:w]
    s = wts.sum()
    cx = float((wts * xs).sum() / s); cy = float((wts * ys).sum() / s)
    sx = float(np.sqrt((wts * (xs - cx) ** 2).sum() / s)); sy = float(np.sqrt((wts * (ys - cy) ** 2).sum() / s))
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        cc, warp = cv2.findTransformECC(ref, g, warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-8), mask, 3)
        scl = float(np.sqrt(abs(np.linalg.det(warp[:, :2]))))
        c = np.array([w / 2, h / 2, 1.0], np.float32)
        m = warp @ c
        e = [f"{scl:.5f}", f"{m[0] - c[0]:.3f}", f"{m[1] - c[1]:.3f}", f"{cc:.4f}"]
    except cv2.error:
        e = ["", "", "", ""]
    rows.append([f, f"{g[core].mean():.2f}", int(ink.sum()), f"{x + cx:.3f}", f"{y + cy:.3f}", f"{sx:.3f}", f"{sy:.3f}"] + e +
                [f"{np.percentile(full[outside], 99.9):.1f}", f"{full[outside].mean():.2f}"])
hdr = ["frame", "core_luma", "ink_px", "ink_cx", "ink_cy", "ink_sx", "ink_sy", "ecc_scale", "ecc_dx", "ecc_dy", "ecc_cc", "p999_outside", "mean_outside"]
if a.name:
    out = v.dir / "scratch" / "gap_review" / f"{a.name}.csv"
    with open(out, "w", newline="") as fh:
        wr = csv.writer(fh); wr.writerow(hdr); wr.writerows(rows)
    print(out)
print(*hdr)
for r in rows:
    print(*r)
