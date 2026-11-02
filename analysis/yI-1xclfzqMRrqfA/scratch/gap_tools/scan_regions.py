"""Changed regions exactly as coverage_gaps.py computes them (source.mp4 via iter_unique, gray, 640 px
wide, INTER_AREA, > 12 levels), split into connected components (7x7 dilation), in full-res px.
  python scan_regions.py <video> <A> <B>
"""
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np
from common import get_video, iter_unique

v = get_video(sys.argv[1]); A, B = int(sys.argv[2]), int(sys.argv[3])
prev = None
for f, _, img in iter_unique(v, gray=True, width=640):
    if f > B:
        break
    if prev is not None and f >= A:
        d = cv2.absdiff(img, prev) > 12
        k = int(d.sum()); sc = 1920 / 640
        regs = []
        if k:
            dd = cv2.dilate(d.astype(np.uint8), np.ones((7, 7), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(dd)
            for i in range(1, n):
                x, y, w, h, _a = st[i]
                ys, xs = np.nonzero(d & (lab == i))
                if len(xs) == 0:
                    continue
                regs.append((len(xs), f"[{len(xs)}px x{xs.min()*sc:.0f}-{(xs.max()+1)*sc:.0f} y{ys.min()*sc:.0f}-{(ys.max()+1)*sc:.0f}]"))
            regs.sort(reverse=True)
        print(f"f{f}: {k} px " + " ".join(t for _, t in regs[:8]))
    prev = img
