"""Dominant edge direction inside the P5 viewer footage window, pull-back compensated.

The window part x 1550-2600, y -230..-60 in close-up coordinates (the f2116 framing; the window's
bottom edge is at y -45) is resampled per captured picture as in viewer_cut_comp.py (5 close-up px per
sample), then the structure tensor gives the dominant edge angle (degrees, image axes, 0 = horizontal)
and its coherence (0-1). A shot change shows as a jump of angle and/or mean luma.
usage: viewer_orient.py A B out.csv
"""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
pb = {int(r['frame']): (float(r['scale']), float(r['cx']), float(r['cy']))
      for r in csv.DictReader(open(base + 'scratch/v7c3_p5_pullback.csv'))}
last = max(pb)
x0, x1, y0, y1 = 1550, 2600, -230, -60
v = get_video('v7'); rd = WorkReader(v)
rows = []
for f in range(a, b + 1):
    if uniq.get(f) != '1':
        continue
    s, cx, cy = pb.get(f, pb[last])
    g = rd.read(f).astype(np.float32)
    ow, oh = int((x1 - x0) / 5), int((y1 - y0) / 5)
    M = np.array([[s * 5, 0, cx + s * (x0 - 130)], [0, s * 5, cy + s * (y0 - 202.5)]], np.float32)
    patch = cv2.warpAffine(cv2.GaussianBlur(g, (0, 0), max(0.5, 0.5 * s * 5)), M, (ow, oh),
                           flags=cv2.WARP_INVERSE_MAP | cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = patch >= 0
    cover = float(valid.mean())
    if cover < 0.6:
        rows.append([f, s, '', '', '', round(cover, 2)]); continue
    p = np.where(valid, patch, patch[valid].mean())
    gx = cv2.Sobel(p, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(p, cv2.CV_32F, 0, 1, ksize=3)
    m = valid.copy(); m[:2, :] = m[-2:, :] = False; m[:, :2] = m[:, -2:] = False
    Jxx, Jyy, Jxy = (gx * gx)[m].sum(), (gy * gy)[m].sum(), (gx * gy)[m].sum()
    theta = 0.5 * np.degrees(np.arctan2(2 * Jxy, Jxx - Jyy))
    edge = (theta + 90 + 90) % 180 - 90
    coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-9)
    rows.append([f, s, round(float(edge), 1), round(float(coh), 2), round(float(patch[valid].mean()), 1), round(cover, 2)])
with open(out, 'w') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'scale', 'edge_angle_deg', 'coherence', 'mean_luma', 'cover']); w.writerows(rows)
print(len(rows), 'rows ->', out)
