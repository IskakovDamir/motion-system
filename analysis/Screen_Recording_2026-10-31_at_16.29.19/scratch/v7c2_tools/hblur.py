# horizontal box-blur length (px) of a region vs a sharp reference, region located by a per-frame x offset (+/- search)
import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
x, y, w, h = [int(t) for t in sys.argv[1].split(',')]
ref_f = int(sys.argv[2])
items = [tuple(int(u) for u in t.split(':')) for t in sys.argv[3].split(',')]  # frame:dx
r = WorkReader(v)
R = r.read(ref_f).astype(np.float32)[y:y + h, x:x + w]
for f, dx0 in items:
    g = r.read(f).astype(np.float32)
    best = None
    for dx in range(dx0 - 12, dx0 + 13):
        for dy in range(-4, 5):
            C = g[y + dy:y + dy + h, x + dx:x + dx + w]
            if C.shape != R.shape: continue
            for k in [1, 3, 5, 7, 9, 13, 17, 21, 25, 31, 41, 51, 61, 75, 91]:
                B = R if k == 1 else cv2.blur(R, (k, 1))
                a = (B - B.mean()).ravel(); c = (C - C.mean()).ravel()
                cc = float(a @ c / (np.linalg.norm(a) * np.linalg.norm(c) + 1e-6))
                if best is None or cc > best[0]: best = (cc, k, dx, dy)
    cc, k, dx, dy = best
    print(f'f{f}: horizontal blur ~{k} px ({100*k/1622:.2f}% W) at dx {dx} dy {dy}, corr {cc:.3f}')
r.close()
