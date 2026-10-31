import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
thr = float(sys.argv[4]) if len(sys.argv) > 4 else 90
uniq = set(int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1')
r = WorkReader(v)
rows = []
for f in range(a, b + 1):
    if f not in uniq: continue
    g = r.read(f).astype(np.float32)
    # find the pill row: search band 380..560 for rows; use column-wise max over band
    band = g[380:580, :1540]
    colmax = band.max(0)
    on = colmax > thr
    runs = []; i = 0; n = len(on)
    while i < n:
        if on[i]:
            j = i
            while j + 1 < n and on[j + 1]: j += 1
            runs.append((i, j)); i = j + 1
        else: i += 1
    runs = [ru for ru in runs if ru[1] - ru[0] >= 4]
    if not runs:
        rows.append([f, 1, '', '', '', '', '', '']); continue
    x0, x1 = runs[-1]
    sub = band[:, x0:x1 + 1]
    rowsmax = sub.max(1)
    ys = np.nonzero(rowsmax > thr)[0]
    y0, y1 = 380 + ys.min(), 380 + ys.max()
    rows.append([f, 1, x0, x1, x1 - x0 + 1, y0, y1, y1 - y0 + 1])
r.close()
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'x0', 'x1', 'w', 'y0', 'y1', 'h']); w.writerows(rows)
print(' '.join(f'{x[0]}:x{x[2]}-{x[3]}(w{x[4]},h{x[7]})' for x in rows))
