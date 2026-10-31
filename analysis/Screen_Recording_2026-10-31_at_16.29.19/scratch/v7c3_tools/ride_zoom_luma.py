"""Mean luma of ROIs that ride a centred zoom: p = O + s(f) (p0 - O), plus an optional x offset.
usage: ride_zoom_luma.py <scale_csv> <scale_col> <Ox> <Oy> <start> <end> <out_csv> name:x,y,w,h ...
ROI corners given at scale 1; the ROI size is scaled too. Frames without a scale row use the last one."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
sc_csv, col, Ox, Oy, start, end, out = sys.argv[1:8]
Ox, Oy = float(Ox), float(Oy)
rois = []
for s in sys.argv[8:]:
    n, v = s.split(':'); x, y, w, h = map(int, v.split(',')); rois.append((n, x, y, w, h))
sc = {int(r['frame']): float(r[col]) for r in csv.DictReader(open(sc_csv))}
v = get_video('v7')
uniq = {int(r['frame']): (r['unique'], float(r['diff_mean'])) for r in csv.DictReader(open(v.dir / 'motion.csv'))}
rd = WorkReader(v)
s = 1.0
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'diff', 'scale'] + [n for n, *_ in rois])
    for f in range(int(start), int(end) + 1):
        if f in sc: s = sc[f]
        g = rd.read(f).astype(np.float32)
        H, W = g.shape
        vals = []
        for n, x, y, ww, hh in rois:
            x0 = Ox + s * (x - Ox); y0 = Oy + s * (y - Oy)
            x0, y0 = int(round(x0)), int(round(y0)); ww2, hh2 = int(round(ww * s)), int(round(hh * s))
            patch = g[max(0, y0):max(0, y0) + hh2, max(0, x0):max(0, x0) + ww2]
            vals.append(f"{patch.mean():.2f}" if patch.size else "")
        u, d = uniq.get(f, ('0', 0))
        w.writerow([f, u, f"{d:.5f}", f"{s:.4f}"] + vals)
rd.close()
print(out)
