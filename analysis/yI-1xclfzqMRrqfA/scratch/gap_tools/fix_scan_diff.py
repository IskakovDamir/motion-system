"""What coverage_gaps.py sees: every frame of source.mp4 resized to 640 px wide (INTER_AREA, gray), the
pixels that changed by more than 12 levels against the previous frame drawn white on a dimmed copy of
the frame (x2 nearest-neighbour), one tile per frame. Prints the count and the full-res positions.
  python fix_scan_diff.py <video> A B NAME
"""
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np
from common import get_video, iter_unique, label, tile, write_jpg

video, A, B, name = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
v = get_video(video)
prev = None
ims = []
for f, _, img in iter_unique(v, gray=True, width=640):
    if f > B:
        break
    if prev is not None and f >= A:
        d = cv2.absdiff(img, prev) > 12
        ys, xs = np.nonzero(d)
        sx = 1920 / 640
        print(f"f{f}: {int(d.sum())} px", sorted({(int(x * sx), int(y * sx)) for x, y in zip(xs, ys)})[:12])
        show = (img.astype(np.float32) * 0.45).astype(np.uint8)
        show[d] = 255
        show = cv2.resize(show, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
        ims.append(label(show, f"f{f} vs f{f - 1}: {int(d.sum())} px > 12", 0.6))
    prev = img
hh, ww = ims[0].shape[:2]
p = v.dir / "crops" / f"{name}.jpg"
write_jpg(p, tile(ims, 2, ww, hh), 92)
print(p)
