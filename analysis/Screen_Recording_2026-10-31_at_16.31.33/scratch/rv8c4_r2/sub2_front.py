"""S03 sub line 2 reveal front per captured picture (f2408-f2470), re-tracked with a wider ROI (x 250-1100)
so the trailing dots are seen. Band = line_cy -14 .. +22 px (the dots sit on the baseline, about +12..+20) with line_cy from scratch/v8c4_S3_sub2_typeon.csv.
front_any = rightmost column with ink (luma < 236, i.e. 12 below the page 248, the light newest letters
included); front_dark = rightmost column with luma < 188; front_px = front_any, or 258 (the line's left
edge) while the line has no ink yet; front_letters = front_any limited to the letters (x <= 978; the dots
sit at 979-1006). chars = characters revealed, counted on crops/crop_250_520_760x180_02416-02450.jpg."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v8')
D = v.dir / 'scratch'
cy = {int(r['frame']): float(r['line_cy']) for r in csv.DictReader(open(D / 'v8c4_S3_sub2_typeon.csv'))}
uniq = {}
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    f = int(r['frame'])
    if 2400 <= f <= 2470:
        uniq[f] = 1 if (r['unique'] == '1' and float(r['diff_mean']) >= 1e-4) else 0
chars = {2418: 5, 2420: 11, 2422: 16, 2424: 21, 2426: 24, 2429: 28, 2430: 30, 2432: 33, 2434: 35, 2436: 36,
         2438: 39, 2440: 40, 2443: 42, 2444: 43, 2446: 44, 2448: 45, 2450: 46}
rd = WorkReader(v)
rows = []
last_cy = None
for f in range(2408, 2471):
    if f in cy:
        last_cy = cy[f]
    c = cy.get(f, last_cy)
    g = rd.read(f).astype(np.float32)
    y0, y1 = int(round(c - 14)), int(round(c + 22))
    band = g[max(0, y0):min(918, y1), 250:1101]
    def front(th):
        cols = np.nonzero((band < th).any(axis=0))[0]
        return int(250 + cols.max()) if len(cols) else ''
    fa, fd = front(236), front(188)
    fpx = fa if fa != '' else 258
    lett = band[:, :729]  # x 250-978
    cols = np.nonzero((lett < 236).any(axis=0))[0]
    fl = int(250 + cols.max()) if len(cols) else 258
    rows.append([f, uniq.get(f, 0), round(c, 1), fa, fd, fpx, round(100 * fpx / 1622, 3), fl, round(100 * fl / 1622, 3), chars.get(f, '')])
with open(D / 'v8c4_S3_sub2_front.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'line_cy', 'front_any', 'front_dark', 'front_px', 'front_pct', 'front_letters', 'front_letters_pct', 'chars'])
    w.writerows(rows)
for r in rows:
    if r[1] == 1:
        print(r)
