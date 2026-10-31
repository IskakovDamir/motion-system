"""Toast pill fill luma per captured picture during its fade-in (S02, f2244-f2266).
Position and scale from scratch/v8c4_S2_toast_in_tmpl.csv (template of f2258 at bbox 380 628 362 70,
scales 0.80-1.04; the toast itself spans template offsets x 9-352, y 9-62 at scale 1.0).
fill = median luma of the toast's text-free bands (offsets y 12-22 and 47-58, x 60-340, scaled);
page = median luma of the bands 6-16 px above and below the toast (offsets y -7..3 and 66..76, same x);
opacity = (fill - page) / (fill_ref - page), fill_ref = mean fill of f2258-f2262 (pill fully shown).
f2244 and f2246: the template does not lock (score 0.31-0.35); the pill is measured at a placement
extrapolated from f2248-f2252 (x +4 px/f, y -2.5 px/f, scale -0.035/f backwards): f2244 shows no pill
(opacity <= 0, written 0), f2246 a faint patch within the photo's own variation (+3..+11 luma)."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v8')
D = v.dir / 'scratch'
t = {int(r['frame']): r for r in csv.DictReader(open(D / 'v8c4_S2_toast_in_tmpl.csv'))}
rd = WorkReader(v)
out = []
for f in sorted(t):
    r = t[f]
    if r['unique'] != '1':
        continue
    x, y, s = float(r['x']), float(r['y']), float(r['scale'])
    if f < 2248:  # template not locked (score < 0.4): placement extrapolated from f2248-f2252
        x, y, s = {2246: (406, 629, 0.74), 2244: (414, 624, 0.67)}[f]
    g = rd.read(f).astype(np.float32)
    def band(oy0, oy1, ox0=60, ox1=340):
        return g[int(round(y + oy0 * s)):int(round(y + oy1 * s)), int(round(x + ox0 * s)):int(round(x + ox1 * s))]
    fill = np.median(np.concatenate([band(12, 22).ravel(), band(47, 58).ravel()]))
    right = np.median(band(12, 58, 300, 345).ravel())
    page = np.median(np.concatenate([band(-7, 3).ravel(), band(66, 76).ravel()]))
    out.append([f, r['score'], round(x), round(y), s, round(float(fill), 1), round(float(right), 1), round(float(page), 1)])
ref = np.mean([r[5] for r in out if 2258 <= r[0] <= 2262])
rows = []
for r in out:
    det = 1 if r[0] >= 2248 else (0.5 if r[0] == 2246 else 0)
    op = max(0.0, (r[5] - r[7]) / (ref - r[7]))
    rows.append([r[0], 1] + r[1:] + [det, round(op, 3)])
    print(rows[-1])
with open(D / 'v8c4_S2_toast_fadein.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'tmpl_score', 'tmpl_x', 'tmpl_y', 'scale', 'fill_median', 'fill_right_end', 'page_around', 'detected', 'opacity'])
    w.writerows(rows)
print('fill_ref', ref)
