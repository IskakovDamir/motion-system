"""Signed difference of every frame against one rest frame inside a region (work.mp4, gray), to see an
overshoot settle: a scaled-up dark outline leaves a ring of dark (negative) pixels just outside its rest
edges and light (positive) pixels just inside its white gaps; the ring fades as the element returns to
rest. Prints per frame the pixels over 12 levels, the max change and the summed |change| (sum_abs, in
gray levels), and saves an amplified sheet (x6, mid-gray = equal to the rest frame) under crops/.
  python fix_vs_rest.py <video> X Y W H A B REF NAME [--gain 6] [--zoom 3]
"""
import argparse
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np
from common import WorkReader, get_video, label, tile, write_jpg

ap = argparse.ArgumentParser()
ap.add_argument("video"); [ap.add_argument(k, type=int) for k in ("x", "y", "w", "h", "a", "b", "ref")]
ap.add_argument("name"); ap.add_argument("--gain", type=float, default=6.0); ap.add_argument("--zoom", type=float, default=3.0)
a = ap.parse_args()
v = get_video(a.video)
r = WorkReader(v)
rest = r.read(a.ref).astype(np.int16)[a.y:a.y + a.h, a.x:a.x + a.w]
ims = []
for f in range(a.a, a.b + 1):
    g = r.read(f).astype(np.int16)[a.y:a.y + a.h, a.x:a.x + a.w]
    d = g - rest
    print(f"f{f}: px>12 {int((np.abs(d) > 12).sum()):5d}  max {int(np.abs(d).max()):3d}  sum_abs {int(np.abs(d).sum()):7d}")
    amp = np.clip(128 + a.gain * d, 0, 255).astype(np.uint8)
    amp = cv2.resize(amp, None, fx=a.zoom, fy=a.zoom, interpolation=cv2.INTER_NEAREST)
    ims.append(label(amp, f"f{f} - f{a.ref} x{a.gain:g}", 0.5))
r.close()
hh, ww = ims[0].shape[:2]
cols = max(1, min(len(ims), 1920 // ww))
p = v.dir / "crops" / f"{a.name}.jpg"
write_jpg(p, tile(ims, cols, ww, hh), 92)
print(p)
