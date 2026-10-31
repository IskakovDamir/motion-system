"""Every captured picture of the P5 viewer footage window, pull-back compensated (resampled to the
same close-up window region, x 1472-2900, y -400..-45 at the f2116 framing, shown at 0.4 scale), with
frame labels, so shot changes inside the window can be read during the pull-back.
Areas outside the picture are filled with luma 128 (mid grey) and outlined by the frame border.
usage: viewer_aligned.py A B out.jpg
"""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video, label, tile, write_jpg
from pathlib import Path

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
pb = {int(r['frame']): (float(r['scale']), float(r['cx']), float(r['cy']))
      for r in csv.DictReader(open(base + 'scratch/v7c3_p5_pullback.csv'))}
last = max(pb)
x0, x1, y0, y1 = 1472, 2900, -400, -45
k = 2.5  # close-up px per output px (output = 0.4 scale)
ow, oh = int((x1 - x0) / k), int((y1 - y0) / k)
v = get_video('v7'); rd = WorkReader(v)
ims = []
for f in range(a, b + 1):
    if uniq.get(f) != '1':
        continue
    s, cx, cy = pb.get(f, pb[last])
    g = rd.read(f)
    M = np.array([[s * k, 0, cx + s * (x0 - 130)], [0, s * k, cy + s * (y0 - 202.5)]], np.float32)
    p = cv2.warpAffine(g, M, (ow, oh), flags=cv2.WARP_INVERSE_MAP | cv2.INTER_AREA,
                       borderMode=cv2.BORDER_CONSTANT, borderValue=128)
    ims.append(label(p, f"f{f} s{s:.3f}", 0.5))
sheet = tile(ims, 4, ow, oh)
write_jpg(Path(out), sheet, 90)
print(out, len(ims), 'pictures', ow, 'x', oh)
