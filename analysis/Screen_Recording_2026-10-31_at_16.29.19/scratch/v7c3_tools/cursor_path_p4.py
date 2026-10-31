"""P4 cursor path (f2012-f2090): arrow-tip positions per captured picture, screen px.

Same two templates as cursor_path_p5.py, scaled to the P4 framing (0.5675 of the close-up = 1.419 x
the P5 rest framing; scratch/v7c3_p4_cam_scale.csv): 'dark' over the whole picture
(scratch/v7c3_p4_cursor_darktpl.csv, f2007-f2090) and 'light' inside x 300-1300, y 200-850
(scratch/v7c3_p4_cursor_lighttpl.csv, f2007-f2046). Tip = box top-left + (3, 3) x template scale.
Per picture the better score is kept if >= 0.70 (or checked on a crop). Crop reads (+-5 px):
f2012 / f2013 faint first pictures (crops/crop_380_230_300x170_02009-02019.jpg), f2089 at the
frame's bottom edge (crops/crop_950_640_200x278_02079-02091.jpg).
"""
import csv
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
L = {int(r['frame']): r for r in csv.DictReader(open(base + 'v7c3_p4_cursor_lighttpl.csv'))}
D = {int(r['frame']): r for r in csv.DictReader(open(base + 'v7c3_p4_cursor_darktpl.csv'))}
crop = {2012: (480, 287, 'faint first picture'), 2013: (490, 287, 'faint'), 2089: (1018, 880, 'at the bottom edge; templates lose it')}
checked = {2026: 'light 0.675; between f2024 and f2029 on the crop path', 2034: 'dark 0.639; crop_300_200_1100x718_02009-02041 f2033 about (990, 644) box',
           2071: 'dark 0.613; between f2069 and f2074', 2076: 'dark 0.656; crop_400_150_1222x768_02059-02089', 2086: 'dark 0.622; crop f2086 tip about (1018, 880)'}
rows = []
for f in sorted(set(L) | set(D) | set(crop)):
    if f < 2012 or f > 2090:
        continue
    if f in crop:
        x, y, note = crop[f]; src, sc = 'crop', ''
    else:
        l, d = L.get(f), D.get(f)
        cand = [(float(r['score']), k, r) for k, r in (('template_light', l), ('template_dark', d)) if r is not None]
        sc_f, src, r = max(cand)
        if f == 2034:   # the light template's best match lies off the path (414, 628); the dark one follows it
            sc_f, src, r = float(d['score']), 'template_dark', d
        if sc_f < 0.70 and f not in checked:
            continue
        ts = float(r['tscale'])
        x, y = float(r['tip_x']) + 3 * ts, float(r['tip_y']) + 3 * ts
        sc = r['score']; note = ('checked: ' + checked[f]) if f in checked else ''
    rows.append([f, 1, src, sc, round(x, 1), round(y, 1), note])
out = []; prev = None
for r in rows:
    spd = '' if prev is None else round(((r[4] - prev[4]) ** 2 + (r[5] - prev[5]) ** 2) ** 0.5 / (r[0] - prev[0]), 1)
    out.append(r[:6] + [spd, r[6]]); prev = r
with open(base + 'v7c3_p4_cursor_path.csv', 'w') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'source', 'score', 'tip_x', 'tip_y', 'speed_px_per_f', 'note']); w.writerows(out)
for r in out:
    print(*r)
