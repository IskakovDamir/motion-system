# integrate translation between consecutive captured pictures with phase correlation (Hanning window)
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
x0, y0, w, h = [int(t) for t in sys.argv[4].split(',')]
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
fr = [f for f in uniq if a <= f <= b]
r = WorkReader(v)
win = cv2.createHanningWindow((w, h), cv2.CV_32F)
prev = None; cx = cy = 0.0; rows = []
for f in fr:
    g = r.read(f)[y0:y0 + h, x0:x0 + w].astype(np.float32)
    if prev is not None:
        (dx, dy), resp = cv2.phaseCorrelate(prev, g, win)
        cx += dx; cy += dy
    else:
        dx = dy = 0.0; resp = 1.0
    rows.append([f, 1, f'{dx:.2f}', f'{dy:.2f}', f'{cx:.2f}', f'{cy:.2f}', f'{resp:.3f}'])
    prev = g
r.close()
with open(out, 'w', newline='') as fh:
    wr = csv.writer(fh); wr.writerow(['frame', 'unique', 'dx', 'dy', 'cum_x', 'cum_y', 'response']); wr.writerows(rows)
print(' '.join(f'{x[0]}:{x[4]},{x[5]}({x[6]})' for x in rows))
