"""Status-line counter of P5, cut out of every captured picture and resampled to the close-up
size, so its digit changes can be read through the settle and the pull-back (review fix).

The status line rides with the window: box = label centre + s * (offset at the close-up scale),
with the large timecode label's centre and scale from v7c3_p5_tc.csv (f2091-f2120),
v7c3_p5_tc_pull.csv (f2122-f2181, scale relative to the close-up) and v7c3_p5_tc_late.csv
(f2184 on, its scale x 0.402 = relative to the close-up). Offset at the close-up scale
(measured on f2120, crops/crop_0_870_520x48_02114-02124.jpg): x +30 .. +300 px, y +688 .. +727 px
from the label centre. Parts outside the picture are filled with grey 60.
usage: counter_aligned.py <out.jpg> <frame> ...   (frames that are not captured pictures are skipped)
Also prints, per picture, the mean absolute difference of the aligned counter box to the
previous picture (luma), for the digit-change check.
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2
import numpy as np

from common import WorkReader, get_video, label, tile

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
track = {}
for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc.csv')):
    f = int(r['frame'])
    if f <= 2120:
        track[f] = (float(r['cx']), float(r['cy']), 1.0)
for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc_pull.csv')):
    f = int(r['frame'])
    if 2120 < f <= 2181:
        track[f] = (float(r['cx']), float(r['cy']), float(r['scale']))
for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc_late.csv')):
    f = int(r['frame'])
    if f > 2181:
        track[f] = (float(r['cx']), float(r['cy']), 0.402 * float(r['scale']))
X0, X1, Y0, Y1 = 30, 300, 688, 727
Z = 3
out = sys.argv[1]
frames = [int(a) for a in sys.argv[2:] if uniq.get(int(a)) == '1']
v = get_video('v7')
rd = WorkReader(v)
tiles = []
prev = None
for f in frames:
    k = max(t for t in track if t <= f)
    cx, cy, s = track[k]
    g = rd.read(f).astype(np.float32)
    # affine map: output pixel (u, v) -> picture (cx + s * (X0 + u / Z), cy + s * (Y0 + v / Z))
    m = np.float32([[s / Z, 0, cx + s * X0], [0, s / Z, cy + s * Y0]])
    w, h = (X1 - X0) * Z, (Y1 - Y0) * Z
    patch = cv2.warpAffine(g, m, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=60)
    d = '' if prev is None else f'{np.abs(patch - prev).mean():.1f}'
    print(f, f'label ({cx:.1f}, {cy:.1f}) s {s:.3f}', 'diff to previous picture', d)
    prev = patch
    tiles.append(label(np.clip(patch, 0, 255).astype(np.uint8), f'f{f} s{s:.2f}', 0.6))
sheet = tile(tiles, 2, tiles[0].shape[1], tiles[0].shape[0])
cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 92])
rd.close()
print(out)
