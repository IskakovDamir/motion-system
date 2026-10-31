import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
win = {int(r['frame']): r for r in csv.DictReader(open(base + 'scratch/v7c3_p4_window.csv'))}
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
v = get_video('v7'); rd = WorkReader(v)
clean = rd.read(2061).astype(np.float32); y_ref = float(win[2061]['mid_y'])
def diffimg(f, last):
    dy = int(round(float(last['mid_y']) - y_ref))
    g = rd.read(f).astype(np.float32)
    d = np.clip(g - np.roll(clean, dy, axis=0), 0, 255)
    d[918 + min(0, dy) - 6:, :] = 0
    return cv2.GaussianBlur(d, (5, 5), 0), dy
last = win[2076]
dref, _ = diffimg(2076, last)
x, y, w, h = 1060, 325, 225, 205      # top-right ghost box at f2076 (outline + margin)
tmpl = dref[y:y + h, x:x + w]
rows = {}
def track(frames, start_xy, pad=70):
    px, py = start_xy
    for f in frames:
        lw = win[max(k for k in win if k <= f)]
        d, dy = diffimg(f, lw)
        x0 = int(max(0, px - w / 2 - pad)); y0 = int(max(0, py - h / 2 - pad))
        x1 = int(min(1622, px + w / 2 + pad)); y1 = int(min(918, py + h / 2 + pad))
        reg = d[y0:y1, x0:x1]
        if reg.shape[0] < h or reg.shape[1] < w: continue
        res = cv2.matchTemplate(reg, tmpl, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        cx, cy = x0 + loc[0] + w / 2, y0 + loc[1] + h / 2
        if sc > 0.5: px, py = cx, cy
        rows[f] = [f, uniq.get(f, '0'), dy, round(cx, 1), round(cy, 1), round(cy - dy, 1), round(100 * cx / 1622, 3), round(100 * cy / 918, 3), round(100 * (cy - dy) / 918, 3), round(sc, 3)]
track(range(2076, 2090), (x + w / 2, y + h / 2))
track(range(2076, 2063, -1), (x + w / 2, y + h / 2))
rows = [rows[k] for k in sorted(rows)]
with open(base + 'scratch/v7c3_p4_ghost_box.csv', 'w') as fh:
    wr = csv.writer(fh); wr.writerow(['frame', 'unique', 'win_dy', 'cx', 'cy', 'cy_win', 'cx_pct', 'cy_pct', 'cy_win_pct', 'score']); wr.writerows(rows)
for r in rows:
    if r[1] == '1': print(r)
