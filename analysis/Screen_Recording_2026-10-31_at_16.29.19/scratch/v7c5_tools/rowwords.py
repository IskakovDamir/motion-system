# Word extents of one text row from its ink column profile (v7, work.mp4): columns with any pixel above
# --thresh inside the row band y0..y1, grouped into words by gaps wider than --gap px.
# usage: rowwords.py F Y0 Y1 [--thresh 120] [--gap 14]
import sys, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
ap = argparse.ArgumentParser()
ap.add_argument('frame', type=int); ap.add_argument('y0', type=int); ap.add_argument('y1', type=int)
ap.add_argument('--thresh', type=float, default=120); ap.add_argument('--gap', type=int, default=14)
ap.add_argument('--x0', type=int, default=0); ap.add_argument('--x1', type=int, default=1622)
a = ap.parse_args()
r = WorkReader(get_video('v7'))
g = r.read(a.frame).astype(np.float32)
band = g[a.y0:a.y1, a.x0:a.x1]
col = (band > a.thresh).any(axis=0)
xs = np.nonzero(col)[0]
words = []
if len(xs):
    s = xs[0]; p = xs[0]
    for x in xs[1:]:
        if x - p > a.gap:
            words.append((s, p)); s = x
        p = x
    words.append((s, p))
for i, (s, e) in enumerate(words):
    # sub-pixel edges: half-level crossing of the column max profile
    prof = band.max(axis=0)
    def cross(i0, i1, lvl):
        # linear interpolation of the crossing between columns i0 and i1
        a0, a1 = prof[i0], prof[i1]
        if a1 == a0: return float(i1)
        return i0 + (lvl - a0) / (a1 - a0) * (i1 - i0)
    bg = float(np.median(prof)); lvl = (bg + a.thresh) / 2 if False else a.thresh
    ls = cross(s - 1, s, lvl) if s > 0 else float(s)
    re = cross(e, e + 1, lvl) if e + 1 < len(prof) else float(e)
    print(f"f{a.frame} word {i}: x {a.x0 + ls:.1f} - {a.x0 + re:.1f}  width {re - ls:.1f}")
