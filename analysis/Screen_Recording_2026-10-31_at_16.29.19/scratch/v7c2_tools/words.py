import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
f = int(sys.argv[1]); y0, y1 = int(sys.argv[2]), int(sys.argv[3]); thr = int(sys.argv[4]) if len(sys.argv) > 4 else 200
r = WorkReader(v); g = r.read(f); r.close()
band = g[y0:y1, :1540]
m = band > thr
cols = m.any(0)
rows = m.any(1)
ys = np.nonzero(rows)[0]
print('ink rows', y0 + ys.min(), y0 + ys.max())
xs = np.nonzero(cols)[0]
segs = []
start = xs[0]; prev = xs[0]
for x in xs[1:]:
    if x - prev > 9:
        segs.append((start, prev)); start = x
    prev = x
segs.append((start, prev))
for a, b in segs:
    sub = m[:, a:b + 1]
    yy = np.nonzero(sub.any(1))[0]
    print(f'word x {a}-{b} (w {b-a+1}) y {y0+yy.min()}-{y0+yy.max()}')
