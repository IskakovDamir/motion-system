"""Sample mean luma of several ROIs that ride with a tracked offset.
usage: ride_luma.py <offset_csv> <xcol> <x_rest> <ycol|-> <y_rest> <start> <end> <out_csv> name:x,y,w,h ...
offset = value(f) - rest; frames without an offset row use the last known offset."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
args = sys.argv[1:]
off_csv, xcol, xrest, ycol, yrest, start, end, out = args[:8]
rois = []
for s in args[8:]:
    n, v = s.split(':'); x, y, w, h = map(int, v.split(',')); rois.append((n, x, y, w, h))
xrest = float(xrest); yrest = float(yrest)
offs = {}
for r in csv.DictReader(open(off_csv)):
    f = int(r['frame'])
    ox = float(r[xcol]) - xrest if xcol != '-' else 0.0
    oy = float(r[ycol]) - yrest if ycol != '-' else 0.0
    offs[f] = (ox, oy)
v = get_video('v7')
uniq = {}
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    uniq[int(r['frame'])] = (r['unique'], float(r['diff_mean']))
rd = WorkReader(v)
last = (0.0, 0.0)
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'diff', 'off_x', 'off_y'] + [n for n, *_ in rois])
    for f in range(int(start), int(end) + 1):
        if f in offs: last = offs[f]
        g = rd.read(f).astype(np.float32)
        H, W = g.shape
        vals = []
        for n, x, y, ww, hh in rois:
            x0 = int(round(x + last[0])); y0 = int(round(y + last[1]))
            x0 = max(0, min(W - 1, x0)); y0 = max(0, min(H - 1, y0))
            patch = g[y0:y0 + hh, x0:x0 + ww]
            vals.append(f"{patch.mean():.2f}" if patch.size else "")
        u, d = uniq.get(f, ('0', 0))
        w.writerow([f, u, f"{d:.5f}", f"{last[0]:.1f}", f"{last[1]:.1f}"] + vals)
rd.close()
print(out)
