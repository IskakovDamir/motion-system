"""S02 arrow cursor on the flattened page, per captured picture f2250-f2290 -> scratch/v8c4_S2_cursor_glide.csv.
cursor_x/y: centroid of the pixels inside x 1340-1500, rows button_edge-25 .. +70, whose luma exceeds the row
median over x 1300-1520 by > 60 (the white arrow; works through the scroll's vertical blur, where a template of
the sharp arrow drifts); f2252: template value (scratch/v8c4_S2_cursor_tmpl.csv, ref f2258, score 0.70), the
blob is too soft there; f2250: soft, not measured; f2284 on: gone above the frame top.
button_edge_y: bottom edge of the countdown card's light button (50% crossing of the row mean over x 1470-1520)
within +-30 px of chip_y - 333 (chip = selected thumbnail, scratch/v8c4_S2_page_y.csv); above the frame from
f2278, there chip_y - 337.4 (the mean measured offset f2262-f2276, +-0.5 px).
page_x: centre of the countdown digits (scratch/v8c4_S2_digits_anchor.csv, template of f2258) to f2272; the
digits leave the frame after f2272, from f2262 they hold at 1371 px and the thumbnail chip's x holds at
590-593 px to f2300, so 1371 is used for f2274-f2280 (held).
rel_x = cursor_x - page_x, rel_y = cursor_y - button_edge_y: the cursor's own motion on the page."""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v8')
D = v.dir / 'scratch'
T = 60.0
uniq = set()
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    if r['unique'] == '1' and float(r['diff_mean']) >= 1e-4:
        uniq.add(int(r['frame']))
chip = {int(r['frame']): float(r['page_y']) for r in csv.DictReader(open(D / 'v8c4_S2_page_y.csv'))}
dig = {int(r['frame']): (float(r['cx']), float(r['score'])) for r in csv.DictReader(open(D / 'v8c4_S2_digits_anchor.csv'))}
tmpl = {int(r['frame']): (float(r['cx']), float(r['cy']), float(r['score'])) for r in csv.DictReader(open(D / 'v8c4_S2_cursor_tmpl.csv'))}
rd = WorkReader(v)
rows = []
for f in range(2250, 2291):
    if f not in uniq or f not in chip:
        continue
    g = rd.read(f).astype(np.float32)
    H = g.shape[0]
    ye = chip[f] - 333
    prof = g[:, 1470:1521].mean(axis=1)
    edge, esrc = None, ''
    a, b = int(max(0, ye - 30)), int(min(H - 1, ye + 30))
    if f >= 2252 and b - a > 8:
        seg = prof[a:b + 1]
        if seg.max() - seg.min() > 40:
            lvl = (seg.max() + seg.min()) / 2
            for k in range(a, b):
                if prof[k] >= lvl > prof[k + 1]:
                    edge = k + (prof[k] - lvl) / (prof[k] - prof[k + 1]); esrc = 'measured'
                    break
    if edge is None and f >= 2278:
        edge, esrc = chip[f] - 337.4, 'chip-337.4'
    px = dig[f][0] if (f in dig and f <= 2272) else (1371.0 if 2274 <= f <= 2280 else None)
    psrc = 'digits' if (f in dig and f <= 2272) else ('held 1371' if px is not None else '')
    cx = cy = x0 = x1 = y0 = y1 = n = pk = None
    src = ''
    if f == 2252:
        cx, cy, _ = tmpl[f]; src = 'template'
    elif f >= 2255 and edge is not None:
        ref = edge
        r0, r1 = int(max(0, ref - 25)), int(min(H, ref + 70))
        if r1 - r0 >= 3:
            med = np.median(g[r0:r1, 1300:1521], axis=1, keepdims=True)
            exc = g[r0:r1, 1340:1501] - med
            m = exc > T
            if m.sum() >= 4:
                ys, xs = np.nonzero(m); w = exc[ys, xs]
                cx = 1340 + (xs * w).sum() / w.sum(); cy = r0 + (ys * w).sum() / w.sum()
                x0, x1, y0, y1 = 1340 + int(xs.min()), 1340 + int(xs.max()), r0 + int(ys.min()), r0 + int(ys.max())
                n, pk = int(m.sum()), round(float(exc.max()), 1); src = 'blob'
    if f == 2250:
        src = 'soft, not measured'
    if f >= 2284 and cx is None:
        src = 'gone (above the frame top)'
    relx = round(cx - px, 1) if (cx is not None and px is not None) else ''
    rely = round(cy - edge, 1) if (cy is not None and edge is not None and f != 2280) else ''
    fmt = lambda z, d=1: '' if z is None else round(float(z), d)
    rows.append([f, 1, fmt(cx), fmt(cy), fmt(None if cx is None else 100 * cx / 1622, 3), fmt(None if cy is None else 100 * cy / 918, 3),
                 '' if x0 is None else x0, '' if x1 is None else x1, '' if y0 is None else y0, '' if y1 is None else y1,
                 '' if n is None else n, '' if pk is None else pk, fmt(edge), esrc, fmt(px), psrc, relx, rely, src])
with open(D / 'v8c4_S2_cursor_glide.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'cursor_x', 'cursor_y', 'cursor_x_pct', 'cursor_y_pct', 'x0', 'x1', 'y0', 'y1', 'blob_px', 'peak_excess',
                'button_edge_y', 'edge_source', 'page_x', 'page_x_source', 'rel_x', 'rel_y', 'source'])
    w.writerows(rows)
for r in rows:
    print(r)
