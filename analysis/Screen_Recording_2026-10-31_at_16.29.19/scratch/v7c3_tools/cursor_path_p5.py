"""P5 cursor path (f2106-f2264): arrow-tip positions per captured picture, screen px, plus the
close-up-window position during the pull-back (X = 130 + (x - cx) / s, Y = 202.5 + (y - cy) / s with
s, cx, cy from scratch/v7c3_p5_pullback.csv; after f2185 the last row, s 0.40).

Sources: cursor_track_scaled.py runs over the timeline area (ROI y 380-720, whole width) with two
templates scaled by s / 0.40: 'light' = cursor on a lit clip (ref f2208, box 838,545,30,32, tip at
(3, 3) in the box) -> scratch/v7c3_p5_cursor_lighttpl.csv, 'dark' = cursor on the dark track (ref
f2261, box 1225,628,30,34, tip (3, 3)) -> scratch/v7c3_p5_cursor_darktpl.csv (their tip_x / tip_y
columns hold the box's top-left corner; the tip is that corner + (3, 3) x the template scale); per picture the
better score is kept. Pictures where neither locks (pull-back motion blur, f2134-f2149) carry tip
positions read off crops/crop_800_520_300x110_02134-02151.jpg (zoom 2, +-5 px). Accepted template
rows have score >= 0.70, or were checked on a crop (marked 'checked').
"""
import csv
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
L = {int(r['frame']): r for r in csv.DictReader(open(base + 'v7c3_p5_cursor_lighttpl.csv'))}
D = {int(r['frame']): r for r in csv.DictReader(open(base + 'v7c3_p5_cursor_darktpl.csv'))}
pb = {int(r['frame']): (float(r['scale']), float(r['cx']), float(r['cy'])) for r in csv.DictReader(open(base + 'v7c3_p5_pullback.csv'))}
last = max(pb)
crop = {2134: (1015, 550), 2136: (960, 555), 2139: (917, 560), 2141: (887, 565), 2145: (860, 570), 2146: (837, 572),
        2147: (837, 572), 2148: (837, 572), 2149: (815, 575), 2150: (815, 575)}
checked = {2131: 'crop_500_360_1000x300_02114-02160 (1117, 556) centre', 2181: 'crop_250_520_600x120_02172-02190 (400, 575) centre',
           2151: 'crop_800_520_300x110_02134-02151 tip about (800, 577)', 2153: 'repeat of f2151',
           2251: 'dark template 0.685, next to f2249 (0.707)', 2254: 'crop_200_525_1422x65_02172-02262, about (1553, 565) centre'}
gone_from = 2264
rows = []
for f in sorted(set(L) | set(D)):
    if f < 2106 or f > gone_from:
        continue
    s, cx, cy = pb.get(f, pb[last]) if f >= 2116 else (1.0, 130.0, 202.5)
    if f >= gone_from:
        rows.append([f, 1, 'none', '', '', '', '', '', '', 'no cursor: best match below 0.60 in the window area to f2341'])
        continue
    if f in crop:
        x, y = crop[f]; src, sc, note = 'crop', '', 'motion-blurred under the pull-back; no template lock'
    else:
        l, d = L.get(f), D.get(f)
        r, src = (l, 'template_light') if (d is None or (l and float(l['score']) >= float(d['score']))) else (d, 'template_dark')
        sc = r['score']; ts = float(r['tscale'])
        x, y = float(r['tip_x']) + 3 * ts, float(r['tip_y']) + 3 * ts
        if f == 2254:   # global searches lock elsewhere; local dark-template search around the crop position
            src, sc, x, y = 'template_dark_local', '0.532', 1548.7 - 3 * 0.9 + 3 * 0.9, 546.6
        note = ('checked: ' + checked[f]) if f in checked else ''
        if float(sc) < 0.70 and f not in checked:
            continue
    X = round(130 + (x - cx) / s, 1) if 2116 <= f <= 2185 else ''
    Y = round(202.5 + (y - cy) / s, 1) if 2116 <= f <= 2185 else ''
    rows.append([f, 1, src, sc, round(x, 1), round(y, 1), s, X, Y, note])
prev = None
out = []
for r in rows:
    if r[2] != 'none' and prev is not None and prev[2] != 'none':
        d = ((r[4] - prev[4]) ** 2 + (r[5] - prev[5]) ** 2) ** 0.5
        spd = round(d / (r[0] - prev[0]), 1)
    else:
        spd = ''
    out.append(r[:9] + [spd] + r[9:])
    if r[2] != 'none':
        prev = r
with open(base + 'v7c3_p5_cursor_path.csv', 'w') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'source', 'score', 'tip_x', 'tip_y', 'cam_scale', 'tip_X_closeup', 'tip_Y_closeup', 'speed_px_per_f', 'note'])
    w.writerows(out)
for r in out:
    print(*r)
