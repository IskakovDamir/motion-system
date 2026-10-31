# For a stored curve (curves/<id>.csv from fit_easing.py): find the cubic-bezier + integer D that minimises
# curvekit.shape_rmse against the measured progress while its built duration is within 1 frame of the
# measured one (the downstream timing check). Prints the best bezier and the stored fits' figures.
# usage: shapefit.py <curve_id> [<curve_id> ...]
import sys, csv, json
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from scipy.optimize import minimize
from curvekit import shape_rmse, active_window
from remotion_math import bezier, eased
CD = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/curves/'
def built(D, q):
    e = bezier(*q)
    n = D + 40
    return np.arange(n), np.array([eased(i, D, e) for i in range(n)])
for cid in sys.argv[1:]:
    rows = list(csv.DictReader(open(CD + cid + '.csv')))
    j = json.load(open(CD + cid + '.json'))
    f = np.array([float(r['frame']) for r in rows]); p = np.array([float(r['progress']) for r in rows])
    s, e, md = active_window(f, p)
    best = None
    starts = [(0.42, 0, 0.58, 1), (0.25, 0.1, 0.25, 1), (0.33, 1, 0.68, 1), (0.6, 0, 0.4, 1), (0.16, 1, 0.3, 1),
              (0.7, 0, 0.84, 0), (0.0, 0.5, 0.5, 1), (0.9, 0.2, 0.1, 0.8), (0.5, 0, 0.1, 1), (0.8, 0, 1, 0.8), (0, 0.8, 0.2, 1)]
    for D in range(max(2, int(md) - 6), int(md) + 25):
        for q0 in starts:
            def obj(q):
                q = [min(max(q[0], 0), 1), q[1], min(max(q[2], 0), 1), q[3]]
                bf, bp = built(D, q)
                try:
                    rm, mdur, bdur = shape_rmse(f, p, bf, bp)
                except Exception:
                    return 9.0
                pen = 0.0 if abs(bdur - mdur) <= 1 else 1.0 + abs(bdur - mdur)
                return rm + pen
            r = minimize(obj, q0, method='Nelder-Mead', options={'maxiter': 300, 'xatol': 1e-3, 'fatol': 1e-5})
            if best is None or r.fun < best[0]:
                q = [min(max(r.x[0], 0), 1), r.x[1], min(max(r.x[2], 0), 1), r.x[3]]
                best = (r.fun, D, q)
    rm, D, q = best
    bf, bp = built(D, q)
    rm2, mdur, bdur = shape_rmse(f, p, bf, bp)
    print(f"{cid}: measured {int(mdur)} f; best shape fit bezier({q[0]:.3f}, {q[1]:.3f}, {q[2]:.3f}, {q[3]:.3f}) D={D} built {int(bdur)} f shape {rm2:.4f}"
          f" | stored bezier D={j['bezier']['durationInFrames']} built {j['bezier']['built_duration_frames']} shape {j['bezier']['rmse']}; spring built {j['spring']['built_duration_frames']} shape {j['spring']['rmse']}")
