"""10-90% transition width of the strongest light->dark (or dark->light) edge along x (or y) in a band.
usage: edge_blur.py axis(x|y) band0 band1 search0 search1 frames..."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
axis = sys.argv[1]; b0, b1, s0, s1 = map(int, sys.argv[2:6]); frames = [int(f) for f in sys.argv[6:]]
v = get_video('v7'); rd = WorkReader(v)
for f in frames:
    g = rd.read(f).astype(np.float32)
    prof = g[b0:b1, s0:s1].mean(0) if axis == 'x' else g[s0:s1, b0:b1].mean(1)
    sm = np.convolve(prof, np.ones(3) / 3, mode='same')
    d = np.diff(sm)
    d[:4] = 0; d[-4:] = 0
    i = int(np.argmax(np.abs(d)))
    # walk outwards to the plateaus: take the 25 px-window min/max around i
    lo_i, hi_i = max(0, i - 120), min(len(sm) - 1, i + 120)
    seg = sm[lo_i:hi_i + 1]
    vmin, vmax = float(seg.min()), float(seg.max())
    a = vmin + 0.1 * (vmax - vmin); b = vmin + 0.9 * (vmax - vmin)
    # positions where seg crosses a and b nearest to i
    j = i - lo_i
    def cross(level):
        best = None
        for k in range(len(seg) - 1):
            if (seg[k] - level) * (seg[k + 1] - level) <= 0:
                if best is None or abs(k - j) < abs(best - j): best = k
        return best
    ca, cb = cross(a), cross(b)
    w = abs(cb - ca) if ca is not None and cb is not None else None
    print(f"f{f}: edge at {s0 + i}, 10-90% width {w} px, plateau {vmin:.0f}-{vmax:.0f}")
