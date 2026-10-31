"""Viewer shot changes during the P5 pull-back, with the pull-back compensated.

A ROI fixed in close-up coordinates (the f2116 framing, timecode label at (130, 202.5) px) is
placed on every captured picture with the scale s and label centre (cx, cy) of
scratch/v7c3_p5_pullback.csv (p_screen = (cx, cy) + s * (p_close - (130, 202.5))), resampled to a
fixed small size (5 close-up px per sample) and compared with the previous captured picture
(mean absolute difference, luma 0-255). Frames after the last pull-back row reuse its last row.
usage: viewer_cut_comp.py A B out.csv  X0 X1 Y0 Y1 [X0 X1 Y0 Y1 ...]
"""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
a, b = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
rois = [tuple(map(float, sys.argv[i:i + 4])) for i in range(4, len(sys.argv), 4)]
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
pb = {int(r['frame']): (float(r['scale']), float(r['cx']), float(r['cy']))
      for r in csv.DictReader(open(base + 'scratch/v7c3_p5_pullback.csv'))}
last = max(pb)
L0 = (130.0, 202.5)
v = get_video('v7'); rd = WorkReader(v)
prev = [None] * len(rois); rows = []
for f in range(a, b + 1):
    if uniq.get(f) != '1':
        continue
    s, cx, cy = pb.get(f, pb[last])
    g = rd.read(f).astype(np.float32)
    row = [f, s]
    for k, (x0, x1, y0, y1) in enumerate(rois):
        ow, oh = int(round((x1 - x0) / 5)), int(round((y1 - y0) / 5))
        # affine map from output sample (u, v) to screen: X = x0 + 5u, Y = y0 + 5v (close-up px)
        M = np.array([[s * 5, 0, cx + s * (x0 - L0[0])], [0, s * 5, cy + s * (y0 - L0[1])]], np.float32)
        # area-average: blur the screen picture to the sample pitch first
        sig = max(0.5, 0.5 * s * 5)
        gb = cv2.GaussianBlur(g, (0, 0), sig)
        patch = cv2.warpAffine(gb, M, (ow, oh), flags=cv2.WARP_INVERSE_MAP | cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
        # screen extent of the ROI, to say whether it is fully on screen
        sx0, sy0 = cx + s * (x0 - L0[0]), cy + s * (y0 - L0[1])
        sx1, sy1 = cx + s * (x1 - L0[0]), cy + s * (y1 - L0[1])
        onscreen = sx0 >= 0 and sy0 >= 0 and sx1 <= g.shape[1] and sy1 <= g.shape[0]
        valid = patch >= 0
        if prev[k] is not None:
            m = valid & (prev[k] >= 0)
            d = float(np.abs(patch - prev[k])[m].mean()) if m.sum() > 20 else float('nan')
            cover = float(m.mean())
        else:
            d, cover = float('nan'), float(valid.mean())
        row += [round(d, 2), round(float(patch[valid].mean()) if valid.any() else float('nan'), 2),
                round(cover, 2), int(onscreen), f'{sx0:.0f}-{sx1:.0f}x{sy0:.0f}-{sy1:.0f}']
        prev[k] = patch
    rows.append(row)
hdr = ['frame', 'scale']
for k in range(len(rois)):
    hdr += [f'r{k+1}_diff', f'r{k+1}_mean', f'r{k+1}_cover', f'r{k+1}_onscreen', f'r{k+1}_screen_box']
with open(out, 'w') as fh:
    w = csv.writer(fh); w.writerow(hdr); w.writerows(rows)
for r in rows:
    print(*r)
