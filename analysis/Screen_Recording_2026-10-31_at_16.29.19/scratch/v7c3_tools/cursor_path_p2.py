"""P2 cursor path (f1724-f1785) from three measurements, in screen px and push-in compensated.

Sources per captured picture:
  template_early : scratch/v7c3_p2_cursor_early.csv (track.py template, ref f1731, box 50x53, --global)
  streak         : scratch/v7c3_p2_cursor_streak_t10.csv (track.py bbox, dark ink, thresh 10) on the
                   motion-blurred pictures f1736 / f1740 / f1742: ink centroid of the streak
  template_late  : scratch/v7c3_p2_cursor_late.csv (track.py template, ref f1764, box 62x78, --global)
Template centres of the two templates agree within 3 px where both lock (f1744-f1785); streak ink
centroids sit 5-7 px up-left of the template centre (f1729 / f1734 / f1744 compared).
Window-relative position at the f1690 framing removes the push-in: p_win = O + (p - O) / s with
O = (816, 457) px and s from scratch/v7c3_p2_rise_scale.csv (label distance / 719).
"""
import csv
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
def rd(name):
    return {int(r['frame']): r for r in csv.DictReader(open(base + name))}
early, late, streak = rd('v7c3_p2_cursor_early.csv'), rd('v7c3_p2_cursor_late.csv'), rd('v7c3_p2_cursor_streak_t10.csv')
scale = {int(r['frame']): float(r['scale']) for r in csv.DictReader(open(base + 'v7c3_p2_rise_scale.csv'))}
O = (816.0, 457.0)
rows = []
prev = None; path = 0.0
for f in sorted(set(early) | set(late) | set(streak)):
    if not (1724 <= f <= 1785):
        continue
    if f in (1736, 1740, 1742):
        r = streak.get(f); src = 'streak'
        if r is None or r['ink_cx'] == '':
            continue
        x, y, sc = float(r['ink_cx']), float(r['ink_cy']), ''
    elif f <= 1734:
        r = early.get(f); src = 'template_early'
        if r is None or r['unique'] != '1':
            continue
        x, y, sc = float(r['cx']), float(r['cy']), r['score']
    else:
        r = late.get(f); src = 'template_late'
        if r is None or r['unique'] != '1':
            continue
        x, y, sc = float(r['cx']), float(r['cy']), r['score']
    s = scale.get(f)
    if s is None:
        ks = sorted(scale); s = scale[min(ks, key=lambda k: abs(k - f))]
    xw, yw = O[0] + (x - O[0]) / s, O[1] + (y - O[1]) / s
    if prev is not None:
        d = ((x - prev[1]) ** 2 + (y - prev[2]) ** 2) ** 0.5
        dw = ((xw - prev[3]) ** 2 + (yw - prev[4]) ** 2) ** 0.5
        spd, spdw = d / (f - prev[0]), dw / (f - prev[0])
        if f >= 1731:
            path += dw if prev[0] >= 1731 else 0.0
    else:
        spd = spdw = ''
    rows.append([f, 1, src, sc, round(x, 1), round(y, 1), round(s, 4), round(xw, 1), round(yw, 1),
                 round(100 * xw / 1622, 3), round(100 * yw / 918, 3),
                 '' if spd == '' else round(spd, 1), '' if spdw == '' else round(spdw, 1), round(path, 1)])
    prev = (f, x, y, xw, yw)
with open(base + 'v7c3_p2_cursor_path.csv', 'w') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'source', 'score', 'x', 'y', 'pushin_scale', 'x_win', 'y_win', 'x_win_pct', 'y_win_pct',
                'speed_px_per_f', 'speed_win_px_per_f', 'path_win_px_from_f1731'])
    w.writerows(rows)
for r in rows:
    print(*r)
