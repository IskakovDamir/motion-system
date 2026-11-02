"""ECC affine registration of each captured picture of a range to one reference picture, with masks.

  ../../.venv/bin/python <this file> <v> <ref> <A> <B> <out_csv> [--mask X Y W H ...] [--backward]
  (run from scripts/analysis/)

Every content-new picture (mean abs difference to the previous frame > 0.05 luma; duplicate captures
are skipped) is registered to the reference picture with cv2.findTransformECC (MOTION_AFFINE, the
v.masks overlay and every --mask box excluded, Gaussian pre-filter 5 and 9, the better cc kept).
Initialisation: identity and, with --backward (pictures processed from B down to A), also the
solution of the picture after it, the better cc kept. The warp maps reference px -> picture px:
scale = sqrt(det A), fixed point = solve((I - A) p = t). Columns: frame, unique, scale, a11, a12,
a21, a22, tx, ty, fixed_x, fixed_y, cc.
"""
import argparse
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('v'); ap.add_argument('ref', type=int); ap.add_argument('A', type=int); ap.add_argument('B', type=int); ap.add_argument('out')
ap.add_argument('--mask', type=int, nargs=4, action='append', default=[])
ap.add_argument('--backward', action='store_true')
a = ap.parse_args()
v = get_video(a.v)
r = WorkReader(v)
ref = r.read(a.ref).astype(np.float32)
H, W = ref.shape
m = np.ones((H, W), np.uint8)
for x, y, w, h in a.mask + [list(mm) for mm in v.masks]:
    m[y:y + h, x:x + w] = 0
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-7)

pics, prev = [], None
for f in range(a.A, a.B + 1):
    g = r.read(f).astype(np.float32)
    new = prev is None or float(np.abs(g - prev).mean()) > 0.05
    prev = g
    pics.append((f, new, g if new else None))

order = [p for p in pics if p[1]]
if a.backward:
    order = order[::-1]
res = {}
last = None
for f, _, g in order:
    best = None
    inits = [np.eye(2, 3, dtype=np.float32)] + ([last] if (a.backward and last is not None) else [])
    for ini in inits:
        for blur in (5, 9):
            try:
                cc, Wm = cv2.findTransformECC(ref, g, ini.copy(), cv2.MOTION_AFFINE, crit, m, blur)
            except cv2.error:
                continue
            if best is None or cc > best[0]:
                best = (cc, Wm)
    cc, Wm = best
    last = Wm
    L, t = Wm[:, :2].astype(float), Wm[:, 2].astype(float)
    s = float(np.sqrt(abs(np.linalg.det(L))))
    try:
        fp = np.linalg.solve(np.eye(2) - L, t)
        fpx, fpy = f'{fp[0]:.1f}', f'{fp[1]:.1f}'
    except np.linalg.LinAlgError:
        fpx = fpy = ''
    res[f] = [f'{s:.6f}', f'{L[0, 0]:.6f}', f'{L[0, 1]:.6f}', f'{L[1, 0]:.6f}', f'{L[1, 1]:.6f}', f'{t[0]:.3f}', f'{t[1]:.3f}', fpx, fpy, f'{cc:.5f}']
with open(a.out, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'scale', 'a11', 'a12', 'a21', 'a22', 'tx', 'ty', 'fixed_x', 'fixed_y', 'cc'])
    for f, new, _ in pics:
        w.writerow([f, 1] + res[f] if new else [f, 0] + [''] * 10)
print(a.out)
