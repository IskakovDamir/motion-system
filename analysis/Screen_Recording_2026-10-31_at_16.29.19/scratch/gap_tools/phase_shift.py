"""Sub-pixel shift of a region between captured pictures (phase correlation on work.mp4, Hann window).

python phase_shift.py <start> <end> X Y W H [--ref F] [--name N]
  For every captured picture in [start, end]: shift of the region against the reference picture
  (default: the first picture of the range) and against the previous picture, with the response.
  Writes scratch/gap_review/<N>.csv when --name is given.
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
ap.add_argument("--ref", type=int); ap.add_argument("--name")
a = ap.parse_args()
v = get_video("v7")
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
fr = [f for f in uniq if a.start <= f <= a.end]
rd = WorkReader(v)
x, y, w, h = a.roi
win = cv2.createHanningWindow((w, h), cv2.CV_64F)
get = lambda f: rd.read(f)[y:y + h, x:x + w].astype(np.float64)
ref_f = a.ref if a.ref is not None else fr[0]
ref = get(ref_f)
rows, prev, prev_f = [], None, None
for f in fr:
    g = get(f)
    (dx, dy), resp = cv2.phaseCorrelate(ref.copy(), g.copy(), win)  # phaseCorrelate windows its inputs in place
    if prev is not None:
        (px, py), pr = cv2.phaseCorrelate(prev.copy(), g.copy(), win)
    else:
        px = py = pr = 0.0
    mad = float(np.abs(g - ref).mean())
    rows.append([f, prev_f if prev_f is not None else "", f"{dx:.2f}", f"{dy:.2f}", f"{resp:.3f}", f"{px:.2f}", f"{py:.2f}", f"{pr:.3f}", f"{mad:.2f}"])
    prev, prev_f = g, f
hdr = ["frame", "prev", "dx_vs_ref", "dy_vs_ref", "resp_ref", "dx_vs_prev", "dy_vs_prev", "resp_prev", "mad_vs_ref"]
if a.name:
    out = v.dir / "scratch" / "gap_review" / f"{a.name}.csv"
    with open(out, "w", newline="") as fh:
        wr = csv.writer(fh); wr.writerow(hdr); wr.writerows(rows)
    print(out)
print(*hdr)
for r in rows:
    print(*r)
