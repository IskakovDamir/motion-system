# For each stored v7c5 curve: the integer D that makes the stored bezier's 2%-window match the measured duration,
# and that curve's shape RMSE (curvekit.shape_rmse), so a build can hit the downstream timing check.
import sys, csv, json, glob
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from curvekit import shape_rmse
from remotion_math import bezier, eased
CD = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/curves/'
for p in sorted(glob.glob(CD + '*.v7c5.json')):
    j = json.load(open(p)); b = j['bezier']
    rows = list(csv.DictReader(open(p[:-5] + '.csv')))
    f = np.array([float(r['frame']) for r in rows]); pr = np.array([float(r['progress']) for r in rows])
    e = bezier(b['x1'], b['y1'], b['x2'], b['y2'])
    m = j['measured_duration_frames']
    best = None
    for D in range(max(2, b['durationInFrames'] - 6), b['durationInFrames'] + 20):
        n = D + 40
        bp = np.array([eased(i, D, e) for i in range(n)])
        rm, md, bd = shape_rmse(f, pr, np.arange(n), bp)
        key = (abs(bd - md), rm)
        if best is None or key < best[0]:
            best = (key, D, rm, bd)
    _, D, rm, bd = best
    print(f"{j['technique_id']:44s} measured {m:3d} | stored D={b['durationInFrames']} built {b['built_duration_frames']} shape {b['rmse']:.4f} | matched D={D} built {int(bd)} shape {rm:.4f}")
