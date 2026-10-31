import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
x, y, w, h, a, b = map(int, sys.argv[1:7]); out = sys.argv[7]
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
v = get_video('v7'); rd = WorkReader(v)
prev = None; rows = []
for f in range(a, b + 1):
    if uniq.get(f) != '1': continue
    g = rd.read(f)[y:y + h, x:x + w].astype(np.float32)
    d = float(np.abs(g - prev).mean()) if prev is not None else 0.0
    rows.append([f, 1, round(d, 3), round(float(g.mean()), 2)])
    prev = g
with open(out, 'w') as fh:
    wr = csv.writer(fh); wr.writerow(['frame', 'unique', 'roi_diff', 'roi_mean']); wr.writerows(rows)
for r in rows:
    if r[2] > 6: print(r)
