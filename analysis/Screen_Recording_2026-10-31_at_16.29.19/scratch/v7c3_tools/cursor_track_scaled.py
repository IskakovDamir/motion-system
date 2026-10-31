"""Cursor track over a camera zoom: normalized cross-correlation of one cursor template, searched
over the whole picture on every captured picture, with the template scaled per frame.

usage: cursor_track_scaled.py A B REF X Y W H SCALE_CSV REF_SCALE out.csv [--rel 0.85 1.15 0.025]
  REF X Y W H : template frame and box (sharp cursor)
  SCALE_CSV   : csv with frame,scale (camera scale per frame; frames outside it use the nearest row)
  REF_SCALE   : camera scale at REF; template scale = scale(f) / REF_SCALE x rel
Columns: frame, unique, cx, cy (template-box centre, screen px), tip_x, tip_y (box top-left corner
+ the tip offset measured on REF), tscale, score.
"""
import sys, csv, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

ap = argparse.ArgumentParser()
ap.add_argument('a', type=int); ap.add_argument('b', type=int); ap.add_argument('ref', type=int)
ap.add_argument('x', type=int); ap.add_argument('y', type=int); ap.add_argument('w', type=int); ap.add_argument('h', type=int)
ap.add_argument('scale_csv'); ap.add_argument('ref_scale', type=float); ap.add_argument('out')
ap.add_argument('--rel', type=float, nargs=3, default=[0.85, 1.15, 0.025])
ap.add_argument('--tip', type=float, nargs=2, default=[0, 0], help='tip offset from the box top-left at REF')
ap.add_argument('--roi', type=int, nargs=4, default=None, help='search region X Y W H (default whole picture)')
a = ap.parse_args()
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
sc = {int(r['frame']): float(r['scale']) for r in csv.DictReader(open(a.scale_csv))}
keys = np.array(sorted(sc))
v = get_video('v7'); rd = WorkReader(v)
ref = rd.read(a.ref).astype(np.float32)
t0 = ref[a.y:a.y + a.h, a.x:a.x + a.w]
rows = []
for f in range(a.a, a.b + 1):
    if uniq.get(f) != '1':
        continue
    k = int(keys[np.argmin(np.abs(keys - f))])
    base_s = sc[k] / a.ref_scale
    g = rd.read(f).astype(np.float32)
    if a.roi:
        X, Y, W, H = a.roi; region = g[Y:Y + H, X:X + W]
    else:
        X, Y = 0, 0; region = g
    best = None
    for rel in np.arange(a.rel[0], a.rel[1] + 1e-9, a.rel[2]):
        s = base_s * rel
        tw, th = max(5, int(round(a.w * s))), max(5, int(round(a.h * s)))
        t = cv2.resize(t0, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        if region.shape[0] < th or region.shape[1] < tw:
            continue
        res = cv2.matchTemplate(region, t, cv2.TM_CCOEFF_NORMED)
        _, score, _, loc = cv2.minMaxLoc(res)
        if best is None or score > best[0]:
            best = (score, X + loc[0], Y + loc[1], s, tw, th)
    score, bx, by, s, tw, th = best
    rows.append([f, 1, round(bx + tw / 2, 1), round(by + th / 2, 1), round(bx + a.tip[0] * s, 1), round(by + a.tip[1] * s, 1),
                 round(s, 3), round(score, 4)])
with open(a.out, 'w') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'cx', 'cy', 'tip_x', 'tip_y', 'tscale', 'score']); w.writerows(rows)
for r in rows:
    print(*r)
