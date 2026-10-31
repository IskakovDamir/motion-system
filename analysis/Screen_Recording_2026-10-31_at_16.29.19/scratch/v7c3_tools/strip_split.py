"""Clip-strip split after the dock (P5, f2139-f2190).

Column profile = mean luma of screen rows 538-572 (the clip bodies; the strip stays at y about
528-578 through the pull-back because the zoom origin is at y 561) from the strip's left end
(scratch/v7c3_p5_strip_left.csv) to the right frame edge. Reported per captured picture:
- dips: local minima of the profile below 0.85 x the strip's median fill (clip boundaries), with
  their minimum luma;
- dark runs: columns below 70 luma (track background 20-35, clip fill 100-135), with screen x and
  width, and the width at the close-up scale (width / s, s from scratch/v7c3_p5_pullback.csv).
usage: strip_split.py A B out.csv
"""
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
pb = {int(r['frame']): float(r['scale']) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_pullback.csv'))}
left = {int(r['frame']): float(r['strip_left_px']) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_strip_left.csv')) if r['strip_left_px']}
v = get_video('v7'); rd = WorkReader(v)
rows = []
for f in range(a, b + 1):
    if uniq.get(f) != '1':
        continue
    s = pb.get(f, 0.4)
    lx = int(left.get(f, min(left.values()) if f > max(left) else 0)) + 6
    g = rd.read(f).astype(np.float32)
    prof = g[538:573, :].mean(axis=0)
    seg = prof[lx:1622]
    fill = float(np.median(seg))
    # dips (clip boundaries)
    dips = []
    thr = 0.85 * fill
    i = 0
    while i < len(seg):
        if seg[i] < thr:
            j = i
            while j < len(seg) and seg[j] < thr:
                j += 1
            k = i + int(np.argmin(seg[i:j]))
            dips.append((lx + k, float(seg[k])))
            i = j
        else:
            i += 1
    runs = []
    i = 0
    while i < len(seg):
        if seg[i] < 70:
            j = i
            while j < len(seg) and seg[j] < 70:
                j += 1
            if j - i >= 2:
                runs.append((lx + i, lx + j - 1, j - i))
            i = j
        else:
            i += 1
    rows.append([f, s, lx, round(fill, 1), len(dips), ';'.join(f'{x}:{m:.0f}' for x, m in dips),
                 len(runs), ';'.join(f'{x0}-{x1}' for x0, x1, w in runs),
                 ';'.join(str(w) for _, _, w in runs), ';'.join(f'{w / s:.1f}' for _, _, w in runs)])
with open(out, 'w') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'scale', 'strip_x0', 'fill_median', 'n_dips', 'dips_x_minluma',
                'n_dark_runs', 'dark_runs_px', 'run_widths_px', 'run_widths_closeup_px'])
    w.writerows(rows)
for r in rows:
    print(*r)
