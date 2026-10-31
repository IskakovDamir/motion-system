import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
f = int(sys.argv[1]); y = int(sys.argv[2]); x0, x1 = int(sys.argv[3]), int(sys.argv[4]); thr = float(sys.argv[5])
r = WorkReader(v); g = r.read(f).astype(np.float32); r.close()
row = g[y - 1:y + 2, x0:x1].mean(0)
on = row > thr
runs = []; i = 0
while i < len(on):
    if on[i]:
        j = i
        while j + 1 < len(on) and on[j + 1]: j += 1
        runs.append((x0 + i, x0 + j, j - i + 1)); i = j + 1
    else: i += 1
print('runs (x0,x1,width) at y', y, ':', runs)
