"""Sub-pixel widths of the first three gaps of the clip strip (P5 split after the dock).

Column profile = mean luma of screen rows 538-572. For each gap, the window +-40 px (close-up scale
x s) around the gap's close-up position (gap centres X 1053 / 1372 / 2009, from strip_split.py at
f2156-f2172, mapped with scratch/v7c3_p5_pullback.csv) is searched for the two crossings of the
level L = (22 + fill) / 2 (22 = track background, fill = median of the profile 20-60 px either side),
linearly interpolated. Width 0 when the dip does not reach L. Widths in screen px and at the close-up
scale (/ s).
usage: strip_split_subpx.py A B out.csv
"""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
pb = {int(r['frame']): (float(r['scale']), float(r['cx'])) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_pullback.csv'))}
last = max(pb)
GX = [1053, 1372, 2009]
v = get_video('v7'); rd = WorkReader(v)
rows = []
for f in range(a, b + 1):
    if uniq.get(f) != '1':
        continue
    s, cx = pb.get(f, pb[last])
    prof = rd.read(f).astype(np.float32)[538:573, :].mean(axis=0)
    ws = []; mins = []
    for X in GX:
        xc = cx + s * (X - 130)
        lo, hi = int(xc - 40 * s * 2.5), int(xc + 40 * s * 2.5)
        seg = prof[lo:hi]
        k = int(np.argmin(seg)); m = float(seg[k]); mins.append(round(m, 1))
        side = np.concatenate([prof[lo - int(60 * s * 2.5):lo - int(20 * s * 2.5)], prof[hi + int(20 * s * 2.5):hi + int(60 * s * 2.5)]])
        fill = float(np.median(side)); L = (22 + fill) / 2
        if m >= L:
            ws.append(0.0); continue
        i = k
        while i > 0 and seg[i] < L: i -= 1
        xl = i + (L - seg[i]) / (seg[i + 1] - seg[i])          # crossing between i and i+1 (falling edge)
        j = k
        while j < len(seg) - 1 and seg[j] < L: j += 1
        xr = (j - 1) + (L - seg[j - 1]) / (seg[j] - seg[j - 1])  # crossing between j-1 and j (rising edge)
        ws.append(float(xr - xl))
    rows.append([f, 1, s] + [round(w, 2) for w in ws] + [round(np.mean(ws), 2), round(np.mean(ws) / s, 2)] + mins)
with open(out, 'w') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'scale', 'gap1_px', 'gap2_px', 'gap3_px', 'mean_px', 'mean_closeup_px', 'gap1_min', 'gap2_min', 'gap3_min'])
    w.writerows(rows)
for r in rows:
    print(*r)
