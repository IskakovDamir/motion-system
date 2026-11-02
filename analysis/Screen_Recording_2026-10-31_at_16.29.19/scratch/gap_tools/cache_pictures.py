"""Cache the captured pictures (640 px wide gray, as coverage_gaps.py sees them) of the gap runs.

python cache_pictures.py  -> scratch/gap_review/pictures.npz {frames, imgs} + per-picture diff stats csv
"""
import csv
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import get_video, iter_unique  # noqa: E402

WIDTH, LEVEL = 640, 12
v = get_video("v7")
gaps = json.load(open(v.dir / "scratch" / "coverage_gaps.json"))["gaps"]
wins = [(g["start"] - 40, g["end"] + 40) for g in gaps]
keep = lambda f: any(a <= f <= b for a, b in wins)
masks = []
frames, imgs, rows = [], [], []
prev = prev_f = None
for f, _, img in iter_unique(v, gray=True, width=WIDTH):
    if not masks:
        sx = WIDTH / v.crop[2]
        masks = [(int(x * sx), int(y * sx), int(np.ceil(w * sx)) + 1, int(np.ceil(h * sx)) + 1) for x, y, w, h in v.masks]
    if prev is not None:
        d = cv2.absdiff(img, prev) > LEVEL
        for x, y, w, h in masks:
            d[y:y + h, x:x + w] = False
        k = int(d.sum())
        bb = ""
        if k:
            ys, xs = np.nonzero(d)
            H, W = d.shape
            bb = f"{100*xs.min()/W:.1f} {100*ys.min()/H:.1f} {100*(xs.max()+1)/W:.1f} {100*(ys.max()+1)/H:.1f}"
        rows.append((f, prev_f, k, bb))
    if keep(f):
        frames.append(f)
        imgs.append(img)
    prev, prev_f = img, f
out = v.dir / "scratch" / "gap_review"
np.savez_compressed(out / "pictures.npz", frames=np.array(frames), imgs=np.stack(imgs))
with open(out / "picture_diffs.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "prev", "changed_px", "bbox_pct"])
    w.writerows(rows)
print(len(frames), "pictures cached;", len(rows), "diff rows")
