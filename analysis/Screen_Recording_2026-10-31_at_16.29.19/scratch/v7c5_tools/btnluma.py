# luma around the export button, in a box that follows the tracked label (scaled with the template scale)
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
d = v.dir / 'scratch'
T = list(csv.DictReader(open(d / 'v7c5_p5_export_3600-3672.csv')))
r = WorkReader(v)
rows = []
for t in T:
    f = int(t['frame']); s = float(t['scale']); cx = float(t['cx']); cy = float(t['cy'])
    g = r.read(f).astype(np.float32)
    # label box at ref: 195 x 62 centred; pill region = label box grown by 30 px (scaled); exclude text via threshold
    hw, hh = 0.5 * 195 * s, 0.5 * 62 * s
    def box(x0, y0, x1, y1):
        x0, y0, x1, y1 = [int(round(q)) for q in (x0, y0, x1, y1)]
        return g[max(0, y0):max(0, y1), max(0, x0):max(0, x1)]
    pill = box(cx - hw - 25 * s, cy - hh - 10 * s, cx + hw + 25 * s, cy + hh + 10 * s)
    pill_bg = pill[pill < 110]  # drop the white label pixels
    left = box(cx - hw - 420 * s, cy - hh - 10 * s, cx - hw - 40 * s, cy + hh + 10 * s)  # top bar left of the button
    rows.append([f, f'{cx:.1f}', f'{cy:.1f}', f'{s:.3f}', f'{pill_bg.mean():.2f}', f'{np.percentile(pill_bg, 90):.1f}', f'{left.mean():.2f}', f'{left.max():.1f}'])
r.close()
with open(d / 'v7c5_p5_button_luma.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'cx', 'cy', 'scale', 'pill_mean', 'pill_p90', 'left_mean', 'left_max']); w.writerows(rows)
for x in rows: print(' '.join(x if isinstance(x, str) else str(x) for x in x))
