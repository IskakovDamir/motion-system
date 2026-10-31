import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7'); rd = WorkReader(v)
# args: frame name:x0,y0,x1,y1[,thresh] ...
f = int(sys.argv[1])
g = rd.read(f).astype(np.float32)
for s in sys.argv[2:]:
    n, vals = s.split(':')
    p = [int(t) for t in vals.split(',')]
    x0, y0, x1, y1 = p[:4]
    reg = g[y0:y1, x0:x1]
    bg = float(np.median(reg))
    th = p[4] if len(p) > 4 else 40
    m = (reg - bg) > th
    ys, xs = np.nonzero(m)
    if len(ys) == 0:
        print(n, 'no ink'); continue
    # rows with substantial ink
    rows = m.sum(1)
    ry = np.nonzero(rows >= 1)[0]
    print(f"{n}: ink x {x0 + xs.min()}-{x0 + xs.max()} y {y0 + ys.min()}-{y0 + ys.max()} h {ys.max() - ys.min() + 1} px = {100 * (ys.max() - ys.min() + 1) / 918:.2f}% H; w {xs.max() - xs.min() + 1}; bg {bg:.0f} ink max {reg.max():.0f}")
