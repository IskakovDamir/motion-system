import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
win = {int(r['frame']): float(r['cx']) for r in csv.DictReader(open(base + 'v7c2_fbz_window_tmpl.csv'))}
xs = [426, 675, 922, 1170, 1418]; ys = [175, 320, 470, 615, 753]
uniq = set(int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1')
r = WorkReader(v)
fr = [f for f in range(1546, 1612) if f in uniq]
res = {}
for f in fr:
    g = r.read(f).astype(np.float32)
    sh = int(round(win.get(f, 160) - 167))
    for i, y in enumerate(ys):
        for j, x in enumerate(xs):
            roi = g[y - 55:y + 75, x + sh - 105:x + sh + 106]
            # tile frame ring: the highlight is a lighter rounded rect; use the 90th percentile of luma in the ROI
            res.setdefault((i, j), []).append(float(np.percentile(roi, 75)))
r.close()
print('frames', fr[0], '..', fr[-1])
on = {}
for (i, j), vals in sorted(res.items()):
    vals = np.array(vals); lo = np.median(vals[:3]); hi = np.median(vals[-3:])
    p = (vals - lo) / (hi - lo + 1e-6)
    k = next((k for k in range(len(fr)) if p[k] > 0.5), None)
    on[(i, j)] = fr[k] if k is not None else None
    print(f'row{i+1} col{j+1}: lo {lo:.0f} hi {hi:.0f} half at f{on[(i,j)]}')
