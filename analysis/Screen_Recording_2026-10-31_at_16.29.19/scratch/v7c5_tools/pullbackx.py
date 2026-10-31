# P4 pull-back (v7c5): horizontal registration of row 2 on every captured picture f3240-f3301.
# Reference: the column-mean luma profile of row 2's band at f3254 (rest close-up, band y 395-520).
# For each picture the band is mapped with the y-derived scale s_y (scratch/v7c5_p4_pullback_rowy.csv, fixed y -25 px),
# and the 1D map x' = s_x * x + t (plus a horizontal box smear of length b on the smeared pictures) is fitted
# to the picture's band profile by least squares. fx = t / (1 - s_x) is the fixed point x of a pure zoom.
# Also: word left edges (threshold 120) at f3254 and f3299, and the pure-zoom prediction of word 6's left edge.
# usage: pullbackx.py  -> scratch/v7c5_p4_pullback_x.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from scipy.optimize import least_squares
from common import WorkReader, get_video
v = get_video('v7')
SD = v.dir / 'scratch'
rowy = {int(r['frame']): r for r in csv.DictReader(open(SD / 'v7c5_p4_pullback_rowy.csv'))}
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
frames = [f for f in uniq if 3240 <= f <= 3301]
r = WorkReader(v)
FY = -25.0
Y0, Y1 = 395, 520
ref = r.read(3254).astype(np.float64)
P = ref[Y0:Y1].mean(axis=0)
xs = np.arange(1622, dtype=np.float64)

def model(q, xq, smear):
    s, t, a, c = q[:4]
    b = q[4] if smear else 0.0
    src = (xq - t) / s
    if b < 0.5:
        return a * np.interp(src, xs, P, left=np.nan, right=np.nan) + c
    # box smear of length b screen px = average of samples along the smear
    n = 9
    offs = np.linspace(-b / 2, b / 2, n)
    acc = np.zeros_like(xq)
    for o in offs:
        acc += np.interp((xq + o - t) / s, xs, P, left=np.nan, right=np.nan)
    return a * acc / n + c

rows = []
prev = None
for f in frames:
    g = r.read(f).astype(np.float64)
    if prev is not None and np.abs(g - prev).mean() < 0.05:
        prev = g
        continue
    prev = g
    sy = float(rowy[f]['scale']) if f in rowy else 1.0
    y0 = FY + sy * (Y0 - FY); y1 = FY + sy * (Y1 - FY)
    Q = g[int(round(y0)):int(round(y1))].mean(axis=0)
    best = None
    smear = 3266 < f < 3284
    for t0 in np.linspace(-50, 1200, 126):
        q0 = [sy, t0, 1.0, 0.0] + ([10.0] if smear else [])
        lo = [sy - 0.08, -400, 0.3, -60] + ([0.0] if smear else [])
        hi = [sy + 0.08, 1400, 2.0, 60] + ([200.0] if smear else [])
        def res(q):
            m = model(q, xs, smear)
            ok = ~np.isnan(m)
            if ok.sum() < 300:
                return np.full(1622, 50.0)
            out = np.zeros(1622); out[ok] = m[ok] - Q[ok]; out[~ok] = 0
            return out / np.sqrt(ok.mean())
        try:
            rr = least_squares(res, q0, bounds=(lo, hi), max_nfev=200)
        except Exception:
            continue
        if best is None or rr.cost < best.cost:
            best = rr
    s, t = best.x[0], best.x[1]
    b = best.x[4] if smear else 0.0
    m = model(best.x, xs, smear); ok = ~np.isnan(m)
    rms = float(np.sqrt(np.mean((m[ok] - Q[ok]) ** 2)))
    corr = float(np.corrcoef(m[ok], Q[ok])[0, 1])
    fx = t / (1 - s) if abs(1 - s) > 0.01 else float('nan')
    rows.append(dict(frame=f, s_y=round(sy, 5), s_x=round(s, 5), t=round(t, 2), fx=round(fx, 1), smear_px=round(b, 1),
                     resid_rms=round(rms, 2), corr=round(corr, 4)))
    print(rows[-1])
with open(SD / 'v7c5_p4_pullback_x.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
