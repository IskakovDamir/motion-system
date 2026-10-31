"""Toast pill at the top edge, per captured picture (S02, f2296-f2380): its bottom edge, the fill of its
visible lower part and the page below it, against the flattened page band's bottom edge
(scratch/v8c4_S2_flatpage_edges.csv). Row profile = median over x 440-690 (inside the pill, clear of
its rounded ends and of the check icon). bottom_y = 50% crossing between the fill (rows bottom-10 ..
bottom-4) and the page (rows bottom+4 .. bottom+14), refined twice; opacity = (fill - page) /
(fill_ref - page) with fill_ref = the mean fill of f2330-f2356 (pill fully shown)."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v8')
D = v.dir / 'scratch'
band = {int(r['frame']): r['bottom_y'] for r in csv.DictReader(open(D / 'v8c4_S2_flatpage_edges.csv'))}
uniq = []
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    f = int(r['frame'])
    if 2296 <= f <= 2380 and r['unique'] == '1' and float(r['diff_mean']) >= 1e-4:
        uniq.append(f)
rd = WorkReader(v)
res = []
e = 63.0
for f in uniq:
    g = rd.read(f).astype(np.float32)
    prof = np.median(g[0:120, 440:691], axis=1)
    for _ in range(3):
        ei = int(round(e))
        fill = float(np.median(prof[max(0, ei - 10):max(1, ei - 3)]))
        page = float(np.median(prof[ei + 4:ei + 15]))
        if fill - page < 2:
            break
        lvl = (fill + page) / 2
        k = None
        for y in range(max(0, ei - 15), min(118, ei + 15)):
            if prof[y] >= lvl > prof[y + 1]:
                k = y + (prof[y] - lvl) / (prof[y] - prof[y + 1])
        if k is None:
            break
        e = k
    res.append([f, round(e, 1), round(fill, 1), round(page, 1), band.get(f, '')])
fill_ref = np.mean([r[2] for r in res if 2330 <= r[0] <= 2356])
out = []
for f, e, fill, page, b in res:
    op = (fill - page) / (fill_ref - page)
    rel = round(e - float(b), 1) if b not in ('', None) else ''
    out.append([f, 1, e, round(100 * e / 918, 3), fill, page, round(op, 3), b, rel])
    print(out[-1])
with open(D / 'v8c4_S2_toast_out.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'toast_bottom_y', 'toast_bottom_pct', 'fill', 'page_below', 'opacity', 'band_bottom_y', 'toast_minus_band'])
    w.writerows(out)
print('fill_ref', round(float(fill_ref), 2))
