"""Zoomed picture + change mask (> 12 gray levels vs the previous captured picture) of one region, for every
captured picture of a range, at full resolution from work.mp4. Changed pixels are drawn white on the right.

python diff_crop.py <start> <end> X Y W H [--zoom 2] [--cols 2] --name N   -> scratch/gap_review/<N>.jpg
"""
import argparse
import csv
import sys

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import WorkReader, get_video, label, tile, write_jpg  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("start", type=int); ap.add_argument("end", type=int)
ap.add_argument("roi", type=int, nargs=4)
ap.add_argument("--zoom", type=float, default=2.0); ap.add_argument("--cols", type=int, default=2)
ap.add_argument("--name", required=True)
a = ap.parse_args()
v = get_video("v7")
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
fr = [f for f in uniq if a.start <= f <= a.end]
before = [f for f in uniq if f < a.start]
if before:
    fr = [before[-1]] + fr
rd = WorkReader(v)
x, y, w, h = a.roi
tiles, prev, prev_f = [], None, None
for f in fr:
    g = rd.read(f)[y:y + h, x:x + w]
    if prev is not None:
        m = (cv2.absdiff(g, prev) > 12).astype(np.uint8) * 255
        pair = np.hstack([g, np.full((h, 3), 128, np.uint8), m])
        pair = cv2.resize(pair, (int(pair.shape[1] * a.zoom), int(pair.shape[0] * a.zoom)), interpolation=cv2.INTER_NEAREST)
        tiles.append(label(pair, f"f{f} (prev f{prev_f}) {int((m > 0).sum())} px", 0.5))
    prev, prev_f = g, f
th, tw = tiles[0].shape[:2]
out = v.dir / "scratch" / "gap_review" / f"{a.name}.jpg"
write_jpg(out, tile(tiles, a.cols, tw, th), 90)
print(out, len(tiles))
