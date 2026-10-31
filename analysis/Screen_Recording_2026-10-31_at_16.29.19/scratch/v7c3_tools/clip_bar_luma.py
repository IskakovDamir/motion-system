"""Luma of the clip bars themselves through the P5 glow (review fix).

Clip 1 (the first bar of the clip strip) is sampled in columns x 262-328 at rest (inside clip 1 from
the dock f2146 to the cut: its bar spans at least x 250-574 at f2146, 208-447 at f2172, 202-352
after the edits from f2206), shifted by the exit drift from f2246 on (transport-controls x of
v7c3_p5_transport.csv minus 986.5). In those columns the bar rows are found per picture as the
rows brighter than halfway between the track background (10th percentile of rows y 500-610) and
the bar (90th percentile); the label band background is rows 44-56 % of the bar height (between
the clip-name text and the lower band; no text there) and the lower band rows 68-90 %. Medians
per band; the halo band above the bar (rows 4-12 px above
the bar top, same columns) is also given for comparison with v7c3_p5_v1_haloabove.csv.
For comparison, clip 2 is sampled the same way in the 40 columns right of the first dark gap
after clip 1 (median of its lower band).
Output: scratch/v7c3_p5_clip_bands.csv
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np

from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
tr = {int(r['frame']): float(r['cx']) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_transport.csv'))}
v = get_video('v7')
rd = WorkReader(v)
rows = []
for f in range(2140, 2342):
    if uniq.get(f) != '1':
        continue
    dx = 0.0
    if f >= 2246:
        dx = tr[max(k for k in tr if k <= f)] - 986.5
    x0, x1 = int(round(262 + dx)), int(round(328 + dx))
    g = rd.read(f).astype(np.float32)
    col = g[500:610, x0:x1]
    prof = np.median(col, axis=1)
    bg, hi = np.percentile(prof, 10), np.percentile(prof, 90)
    on = np.nonzero(prof > bg + 0.5 * (hi - bg))[0]
    if len(on) < 8:
        rows.append([f, round(dx, 1), '', '', '', '', '', '', '']); continue
    # longest run of bar rows
    runs = np.split(on, np.nonzero(np.diff(on) > 1)[0] + 1)
    run = max(runs, key=len)
    top, bot = 500 + run[0], 500 + run[-1]
    hgt = bot - top + 1
    up = g[int(top + 0.44 * hgt):int(top + 0.56 * hgt) + 1, x0:x1]
    lo = g[int(top + 0.68 * hgt):int(top + 0.90 * hgt) + 1, x0:x1]
    halo = g[max(0, top - 12):top - 4, x0:x1]
    # clip 2: first dark gap right of clip 1's columns along the lower band
    yl = int(top + 0.8 * hgt)
    line = np.median(g[yl - 1:yl + 2, :], axis=0)
    thr = bg + 0.5 * (np.median(lo) - bg)
    c2 = ''
    xs = int(x1)
    while xs < 1500 and line[xs] > thr:
        xs += 1
    while xs < 1500 and line[xs] <= thr:
        xs += 1
    if xs < 1450:
        c2 = round(float(np.median(g[int(top + 0.68 * hgt):int(top + 0.90 * hgt) + 1, xs + 6:xs + 46])), 1)
    rows.append([f, round(dx, 1), int(top), int(bot), round(float(np.median(up)), 1), round(float(np.median(lo)), 1),
                 round(float(np.median(halo)), 1), round(float(bg), 1), c2])
rd.close()
with open(base + 'scratch/v7c3_p5_clip_bands.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'drift_dx', 'bar_top', 'bar_bottom', 'clip1_labelband', 'clip1_lower', 'halo_above', 'track_bg', 'clip2_lower'])
    w.writerows(rows)
for r in rows:
    print(*r)
