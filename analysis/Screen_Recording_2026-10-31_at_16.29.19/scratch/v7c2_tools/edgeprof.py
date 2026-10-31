# vertical step-edge profile (column-averaged over an x range): 10-90% rise width in px
# usage: edgeprof.py FRAME X0 X1 Y0 Y1
import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
f, x0, x1, y0, y1 = [int(t) for t in sys.argv[1:6]]
r = WorkReader(v)
g = r.read(f).astype(np.float64)
r.close()
prof = g[y0:y1 + 1, x0:x1 + 1].mean(axis=1)
lo, hi = prof.min(), prof.max()
ilo, ihi = int(prof.argmin()), int(prof.argmax())
print(f'f{f} x {x0}-{x1} y {y0}-{y1}: min {lo:.1f} at y{y0+ilo}, max {hi:.1f} at y{y0+ihi}')
# use plateau levels: mean of the first/last 3 samples
a, b = prof[:3].mean(), prof[-3:].mean()
def cross(level):
    # first crossing of level going from a to b
    sgn = 1 if b > a else -1
    for i in range(len(prof) - 1):
        p, q = prof[i], prof[i + 1]
        if (p - level) * sgn <= 0 < (q - level) * sgn or (p - level) * sgn < 0 <= (q - level) * sgn:
            return y0 + i + (level - p) / (q - p)
    return None
l10 = a + 0.1 * (b - a); l90 = a + 0.9 * (b - a)
c10, c90 = cross(l10), cross(l90)
print(f'  plateaus {a:.1f} -> {b:.1f}; 10% at y {c10}, 90% at y {c90}; width {None if c10 is None or c90 is None else abs(c90 - c10):}')
print('  profile:', ' '.join(f'{y0+i}:{p:.0f}' for i, p in enumerate(prof)))
