"""Full-res frame-to-frame change inside one region (work.mp4, gray): per frame the count of pixels
that changed by more than 12 levels, the max change, the mean signed change and the region's mean
luma; with --img also an amplified diff strip (x8, mid-gray = no change) saved under crops/.
  python region_diff.py <video> X Y W H A B [--img NAME]
"""
import argparse
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np
from common import WorkReader, get_video, label, tile, write_jpg

ap = argparse.ArgumentParser()
ap.add_argument("video"); [ap.add_argument(k, type=int) for k in ("x", "y", "w", "h", "a", "b")]
ap.add_argument("--img"); ap.add_argument("--zoom", type=float, default=4.0)
a = ap.parse_args()
v = get_video(a.video)
r = WorkReader(v)
prev = r.read(a.a - 1).astype(np.int16)
ims = []
for f in range(a.a, a.b + 1):
    g = r.read(f).astype(np.int16)
    d = (g - prev)[a.y:a.y + a.h, a.x:a.x + a.w]
    reg = g[a.y:a.y + a.h, a.x:a.x + a.w]
    big = np.abs(d) > 12
    print(f"f{f}: px>12 {int(big.sum()):5d}  max {int(np.abs(d).max()):3d}  mean signed {d.mean():+.3f}  mean luma {reg.mean():.2f}")
    if a.img:
        amp = np.clip(128 + 8 * d, 0, 255).astype(np.uint8)
        amp = cv2.resize(amp, None, fx=a.zoom, fy=a.zoom, interpolation=cv2.INTER_NEAREST)
        cur = cv2.resize(reg.astype(np.uint8), None, fx=a.zoom, fy=a.zoom, interpolation=cv2.INTER_NEAREST)
        pair = np.hstack([cur, np.full((cur.shape[0], 4), 0, np.uint8), amp])
        ims.append(label(pair, f"f{f} | diff x8 vs f{f-1}", 0.5))
    prev = g
r.close()
if a.img:
    hh, ww = ims[0].shape[:2]
    sheet = tile(ims, 2, ww, hh)
    p = v.dir / "crops" / f"{a.img}.jpg"
    write_jpg(p, sheet, 92)
    print(p)
