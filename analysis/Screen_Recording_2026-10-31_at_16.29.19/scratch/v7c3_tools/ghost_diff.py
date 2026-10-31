import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
win = {int(r['frame']): r for r in csv.DictReader(open(base + 'scratch/v7c3_p4_window.csv'))}
v = get_video('v7'); rd = WorkReader(v)
ref_f = 2061
clean = rd.read(ref_f).astype(np.float32)
y_ref = float(win[ref_f]['mid_y'])
rows = []
last = None
for f in range(2061, 2090):
    if f in win: last = win[f]
    dy = int(round(float(last['mid_y']) - y_ref))
    g = rd.read(f).astype(np.float32)
    sh = np.roll(clean, dy, axis=0)
    d = g - sh
    ymax = 918 + min(0, dy) - 6
    m = np.zeros_like(d, bool)
    m[:ymax, 470:1622] = d[:ymax, 470:1622] > 12   # ghost outlines are lighter than the content under them
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(bool)
    ys, xs = np.nonzero(m)
    if len(xs) < 50:
        rows.append([f, dy, 0, '', '', '', '', '', '']); continue
    x0, x1 = np.percentile(xs, 1), np.percentile(xs, 99)
    y0, y1 = np.percentile(ys, 1), np.percentile(ys, 99)
    rows.append([f, dy, len(xs), round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1), round(xs.mean(), 1), round(ys.mean(), 1)])
    if f in (2066, 2071, 2076, 2081, 2086, 2089):
        vis = (m * 255).astype(np.uint8)
        cv2.imwrite(f'/private/tmp/claude-501/-Users-damir-dev-agentmash/7f5a5b1b-5154-4025-8cac-f1a7ff571102/scratchpad/ghost_{f}.png', cv2.resize(vis, (811, 459)))
with open(base + 'scratch/v7c3_p4_ghost_diff.csv', 'w') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'win_dy', 'npix', 'x0', 'y0', 'x1', 'y1', 'cx', 'cy'])
    w.writerows(rows)
for r in rows: print(r)
