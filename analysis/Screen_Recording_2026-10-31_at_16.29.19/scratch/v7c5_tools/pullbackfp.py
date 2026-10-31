# P4 pull-back (v7c5): one fixed point (fx, fy) for the whole move from the per-picture horizontal registration
# (scratch/v7c5_p4_pullback_x.csv: x' = s_x * x + t) and row 2's vertical ink centroid (scratch/v7c5_p4_pullback_rowy.csv).
# Pure zoom about (fx, fy): t = (1 - s) * fx and y' = fy + s * (y0 - fy). Least squares over the sharp pictures,
# then the position error of the pure-zoom prediction (with the stored y-derived scale s_y) for three row-2 points.
import csv
D = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
X = {int(r['frame']): r for r in csv.DictReader(open(D + 'v7c5_p4_pullback_x.csv'))}
Y = {int(r['frame']): r for r in csv.DictReader(open(D + 'v7c5_p4_pullback_rowy.csv'))}
Y0 = 455.84  # row 2 centroid y at f3254
sharp = [f for f in X if (3256 <= f <= 3266 or 3284 <= f <= 3299)]
num = den = numy = 0.0
for f in sharp:
    s = float(X[f]['s_x']); t = float(X[f]['t']); y = float(Y[f]['row2_cy'])
    num += t * (1 - s); den += (1 - s) ** 2
    numy += (y - s * Y0) * (1 - s)
fx = num / den; fy = numy / den
print(f"pure zoom fixed point from the sharp pictures {sharp[0]}-{sharp[-1]} ({len(sharp)}): fx {fx:.1f} px = {fx / 1622 * 100:.1f}% W, fy {fy:.1f} px = {fy / 918 * 100:.1f}% H")
pts = {'word 6 left edge': 129.4, 'word 7 left edge': 450.2, 'word 8 left edge': 981.0}
out = []
for f in sorted(X):
    if f < 3254: continue
    s_x = float(X[f]['s_x']); t = float(X[f]['t']); s_y = float(Y[f]['scale'])
    row = {'frame': f, 's_y': s_y, 's_x': s_x}
    for k, x0 in pts.items():
        meas = s_x * x0 + t
        pred = fx + s_y * (x0 - fx)
        row[k + ' meas'] = round(meas, 1); row[k + ' pred'] = round(pred, 1)
    yp = fy + s_y * (Y0 - fy)
    row['row2 y meas'] = float(Y[f]['row2_cy']); row['row2 y pred'] = round(yp, 1)
    out.append(row)
    print(f, ' | '.join(f"{k}: {row[k + ' meas']:.1f} vs {row[k + ' pred']:.1f}" for k in pts), f"| y {row['row2 y meas']:.1f} vs {yp:.1f}")
with open(D + 'v7c5_p4_pullback_fp.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
