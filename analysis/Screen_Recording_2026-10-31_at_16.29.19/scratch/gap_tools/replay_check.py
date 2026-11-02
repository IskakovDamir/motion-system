"""Loop replay check: every captured picture of S36-S37 (f4535-f4765) against the S01-S02 picture 4535 frames
earlier (work.mp4, 640 px wide gray), mean abs difference at offset 0 and the best offset within -3..+3 f.
Writes scratch/gap_review/gap_s36_s37_replay.csv.
"""
import csv
import sys

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import WorkReader, get_video  # noqa: E402

v = get_video("v7")
LOOP = 4535
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
rd = WorkReader(v)
small = lambda f: cv2.resize(rd.read(f), (640, 362), interpolation=cv2.INTER_AREA).astype(np.int16)
A = {f: small(f) for f in range(0, 236)}
B = {f: small(f) for f in range(4535, 4766)}
rows = []
for f in [u for u in uniq if 4535 <= u <= 4765]:
    d0 = float(np.abs(B[f] - A[f - LOOP]).mean())
    cand = [o for o in range(-3, 4) if 0 <= f - LOOP + o <= 235]
    best = min(cand, key=lambda o: np.abs(B[f] - A[f - LOOP + o]).mean())
    rows.append([f, f - LOOP, f"{d0:.2f}", best, f"{float(np.abs(B[f] - A[f - LOOP + best]).mean()):.2f}"])
out = v.dir / "scratch" / "gap_review" / "gap_s36_s37_replay.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "frame_minus_4535", "mad_offset0", "best_offset", "mad_best"])
    w.writerows(rows)
b = np.array([float(r[4]) for r in rows])
print(out, len(rows), "pictures; best-offset MAD min %.2f max %.2f; offsets %s" % (b.min(), b.max(), sorted(set(r[3] for r in rows))))
s36 = [float(r[4]) for r in rows if r[0] <= 4691]
s37 = [float(r[4]) for r in rows if r[0] >= 4692]
print("S36 f4535-f4691: %.2f-%.2f; S37 f4692-f4765: %.2f-%.2f" % (min(s36), max(s36), min(s37), max(s37)))
