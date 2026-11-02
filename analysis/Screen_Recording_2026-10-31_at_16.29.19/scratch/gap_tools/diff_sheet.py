"""Sheet of the changed pixels (> 12 gray levels vs the previous captured picture, 640 px wide, as
coverage_gaps.py counts them) for every captured picture of a range: picture on the left, its
change mask (white = changed) on the right. Uses scratch/gap_review/pictures.npz.

python diff_sheet.py <start> <end> [--name N] [--cols 2]
"""
import argparse
import sys

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import get_video, label, tile, write_jpg  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("start", type=int); ap.add_argument("end", type=int)
ap.add_argument("--name"); ap.add_argument("--cols", type=int, default=2)
a = ap.parse_args()
v = get_video("v7")
d = np.load(v.dir / "scratch" / "gap_review" / "pictures.npz")
frames, imgs = list(d["frames"]), d["imgs"]
sx = 640 / v.crop[2]
masks = [(int(x * sx), int(y * sx), int(np.ceil(w * sx)) + 1, int(np.ceil(h * sx)) + 1) for x, y, w, h in v.masks]
tiles = []
for i, f in enumerate(frames):
    if f < a.start or f > a.end or i == 0:
        continue
    cur, prev = imgs[i], imgs[i - 1]
    m = cv2.absdiff(cur, prev) > 12
    for x, y, w, h in masks:
        m[y:y + h, x:x + w] = False
    vis = np.where(m, 255, 0).astype(np.uint8)
    pair = np.hstack([cur, np.full((cur.shape[0], 4), 128, np.uint8), vis])
    tiles.append(label(pair, f"f{f} (prev f{frames[i-1]}) {int(m.sum())} px", 0.45))
th, tw = tiles[0].shape[:2]
out = v.dir / "scratch" / "gap_review" / f"{a.name or f'diff_{a.start}-{a.end}'}.jpg"
write_jpg(out, tile(tiles, a.cols, tw, th), 88)
print(out, len(tiles), "pictures")
