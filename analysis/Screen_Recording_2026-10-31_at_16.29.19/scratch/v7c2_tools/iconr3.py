import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
cx0, cy0 = 810, 743
uniq = set(int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1')
r = WorkReader(v)
rows = []
yy, xx = np.mgrid[0:91, 0:91].astype(np.float32); rr = np.sqrt((xx - 45) ** 2 + (yy - 45) ** 2)
for f in range(a, b + 1):
    if f not in uniq: continue
    g = r.read(f).astype(np.float32)
    roi = g[cy0 - 45:cy0 + 46, cx0 - 45:cx0 + 46]
    prof = np.array([roi[(rr >= k - 0.5) & (rr < k + 0.5)].mean() for k in range(0, 45)])
    best = None
    for k in range(8, 42):
        if prof[k] >= prof[k - 1] and prof[k] >= prof[k + 1]:
            inner = prof[max(0, k - 7):k].min()
            outer = prof[k + 1:min(45, k + 6)].min() if k + 1 < 45 else prof[k]
            prom = prof[k] - inner
            if prom > 10 and prof[k] - outer > 1.5:
                best = k  # keep outermost
    # sub-pixel peak
    if best is not None:
        y0, y1, y2 = prof[best - 1], prof[best], prof[best + 1]
        d = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2) if (y0 - 2 * y1 + y2) != 0 else 0
        rad = best + d
    else:
        rad = float('nan')
    rows.append([f, 1, f'{rad:.2f}'])
r.close()
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'ring_r_px']); w.writerows(rows)
print(' '.join(f'{x[0]}:{x[2]}' for x in rows))
