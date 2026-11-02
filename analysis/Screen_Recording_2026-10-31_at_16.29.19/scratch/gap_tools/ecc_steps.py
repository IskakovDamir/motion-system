"""Per-picture similarity transform (scale, dx, dy) of a region between captured pictures (ECC, work.mp4).

python ecc_steps.py <start> <end> X Y W H [--ref F] [--name N]
  For every captured picture in [start, end]: transform that maps the region of the reference picture
  (default: the previous captured picture) onto this picture; also the cumulative transform against
  the first picture of the range. Writes scratch/gap_review/<N>.csv.
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
ap.add_argument("--name", default="ecc")
ap.add_argument("--motion", default="affine", choices=["affine", "translation", "euclidean"])
a = ap.parse_args()
v = get_video("v7")
uniq = []
with open(v.dir / "motion.csv") as fh:
    for r in csv.DictReader(fh):
        if r["unique"] == "1" and a.start <= int(r["frame"]) <= a.end:
            uniq.append(int(r["frame"]))
rd = WorkReader(v)
x, y, w, h = a.roi
mask = np.zeros((918, 1622), np.uint8)
mask[y:y + h, x:x + w] = 255
mode = {"affine": cv2.MOTION_AFFINE, "translation": cv2.MOTION_TRANSLATION, "euclidean": cv2.MOTION_EUCLIDEAN}[a.motion]


def ecc(ref, img):
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        cc, warp = cv2.findTransformECC(ref, img, warp, mode, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-7), mask, 5)
    except cv2.error:
        return None, None
    return cc, warp


def params(wp):
    s = float(np.sqrt(abs(np.linalg.det(wp[:, :2]))))
    # translation of the ROI centre
    c = np.array([x + w / 2, y + h / 2, 1.0], np.float32)
    m = wp @ c
    return s, float(m[0] - c[0]), float(m[1] - c[1])


pics = {f: rd.read(f).astype(np.float32) for f in uniq}
rows = []
first = uniq[0]
prev = None
for f in uniq:
    if prev is None:
        rows.append([f, "", "1.00000", "0.000", "0.000", "", "1.00000", "0.000", "0.000", ""])
        prev = f
        continue
    cc, wp = ecc(pics[prev], pics[f])
    cc0, wp0 = ecc(pics[first], pics[f])
    if wp is None or wp0 is None:
        rows.append([f, prev, "", "", "", "", "", "", "", ""])
    else:
        s, dx, dy = params(wp)
        s0, dx0, dy0 = params(wp0)
        rows.append([f, prev, f"{s:.5f}", f"{dx:.3f}", f"{dy:.3f}", f"{cc:.4f}", f"{s0:.5f}", f"{dx0:.3f}", f"{dy0:.3f}", f"{cc0:.4f}"])
    prev = f
out = v.dir / "scratch" / "gap_review" / f"{a.name}.csv"
with open(out, "w", newline="") as fh:
    wr = csv.writer(fh)
    wr.writerow(["frame", "prev", "step_scale", "step_dx", "step_dy", "step_cc", "cum_scale", "cum_dx", "cum_dy", "cum_cc"])
    wr.writerows(rows)
print(out)
for r in rows:
    print(*r)
