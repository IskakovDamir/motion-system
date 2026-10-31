# Card edges on the dark canvas (P4): top edge from column profiles, then left/right edges along rows just
# below the top edge (bright sky band of the picture); sub-pixel 50% crossings between canvas and card luma.
# usage: cardedges.py A B out.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
rows_m = list(csv.DictReader(open(v.dir / 'motion.csv')))
uniq = [int(r['frame']) for r in rows_m if r['unique'] == '1']
r = WorkReader(v)
CANVAS = 17.0
def cross(prof, level, from_left=True):
    # first index where prof >= level scanning from one side; sub-pixel linear interpolation
    p = prof if from_left else prof[::-1]
    idx = np.nonzero(p >= level)[0]
    if len(idx) == 0: return None
    i = int(idx[0])
    if i == 0: x = 0.0
    else:
        x = (i - 1) + (level - p[i - 1]) / max(1e-6, p[i] - p[i - 1])
    return x if from_left else (len(prof) - 1 - x)
res = []
prev = None
for f in [u for u in uniq if a <= u <= b]:
    g = r.read(f).astype(np.float32)[:, :1540]
    if prev is not None and np.abs(g - prev).mean() < 0.05:
        prev = g; continue  # capture duplicate
    prev = g
    # top edge: median over central columns of the first crossing from the top of the level 0.5*(canvas+sky)
    cols = g[:, 400:1100]
    tops = []
    for c in range(0, cols.shape[1], 10):
        prof = cols[:, c]
        y = cross(prof, 0.5 * (CANVAS + 120.0))
        if y is not None: tops.append(y)
    top = float(np.median(tops)) if tops else float('nan')
    # rows 15..45 px below the top edge: left / right crossings at level 0.5*(canvas + band luma)
    lefts, rights = [], []
    for dy in range(15, 46, 3):
        yy = int(round(top + dy))
        if yy >= g.shape[0]: break
        prof = g[yy, :]
        band = float(np.percentile(prof, 75))
        lvl = 0.5 * (CANVAS + band)
        L = cross(prof, lvl, True); R = cross(prof, lvl, False)
        if L is not None: lefts.append(L)
        if R is not None: rights.append(R)
    L = float(np.median(lefts)) if lefts else float('nan'); R = float(np.median(rights)) if rights else float('nan')
    res.append([f, 1, f'{top:.2f}', f'{L:.2f}', f'{R:.2f}', f'{R - L:.2f}'])
r.close()
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'top', 'left', 'right', 'width']); w.writerows(res)
for x in res: print(*x)
