"""Changed pixels (> 12 gray levels vs the previous captured picture, 640 px wide gray from source.mp4, as
coverage_gaps.py counts them) inside named boxes, per captured picture of a range. Boxes are given in
full-resolution picture px (1622 x 918) and scaled to 640 px.

python region_changes.py <start> <end> name:X,Y,W,H [name:X,Y,W,H ...] [--csv N]
  The column 'rest' counts the changed pixels outside all boxes (speaker-icon mask excluded).
"""
import argparse
import csv
import sys

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import get_video, iter_unique  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("start", type=int); ap.add_argument("end", type=int)
ap.add_argument("boxes", nargs="+")
ap.add_argument("--csv")
a = ap.parse_args()
v = get_video("v7")
W = 640
sx = W / v.crop[2]
boxes = []
for b in a.boxes:
    n, r = b.split(":")
    x, y, w, h = [int(t) for t in r.split(",")]
    boxes.append((n, int(x * sx), int(y * sx), int(np.ceil((x + w) * sx)), int(np.ceil((y + h) * sx))))
masks = [(int(x * sx), int(y * sx), int(np.ceil(w * sx)) + 1, int(np.ceil(h * sx)) + 1) for x, y, w, h in v.masks]
rows, prev, prev_f = [], None, None
for f, _, img in iter_unique(v, gray=True, width=W):
    if f > a.end:
        break
    if prev is not None and f >= a.start:
        d = cv2.absdiff(img, prev) > 12
        for x, y, w, h in masks:
            d[y:y + h, x:x + w] = False
        rest = d.copy()
        vals = []
        for n, x0, y0, x1, y1 in boxes:
            vals.append(int(d[y0:y1, x0:x1].sum()))
            rest[y0:y1, x0:x1] = False
        rows.append([f, prev_f, int(d.sum())] + vals + [int(rest.sum())])
    prev, prev_f = img, f
hdr = ["frame", "prev", "total"] + [b[0] for b in boxes] + ["rest"]
if a.csv:
    out = v.dir / "scratch" / "gap_review" / f"{a.csv}.csv"
    with open(out, "w", newline="") as fh:
        wr = csv.writer(fh); wr.writerow(hdr); wr.writerows(rows)
    print(out)
print(*hdr)
for r in rows:
    print(*r)
