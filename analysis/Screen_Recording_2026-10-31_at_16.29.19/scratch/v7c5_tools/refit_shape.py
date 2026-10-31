# Refit a stored v7c5 curve on the shape metric when fit_easing.py's raw-time fits both stay above 0.05.
# Why: with 24 fps pictures (2-3 analysis frames apart) a 12-24 f move has 6-11 samples, and the measured 2% window
# (curvekit.active_window on the samples) can start or end up to one picture away from where a raw-time fit's own
# window does, so a fit that matches every sample in raw time (RMSE 0.006-0.019) still fails curvekit.shape_rmse.
# This script keeps the measured samples (curves/<id>.csv frame, raw_value, progress) unchanged and fits both models
# with the build-side rule (scripts/analysis/tune_tokens.py: tune_bezier / tune_spring = curvekit.shape_rmse with the
# built duration within 1 frame of the measured one), aligns each in raw time (delay by least squares), and stores:
#   bezier / spring  -> the shape-metric fits (rmse = shape RMSE, plus rmse_raw_time)
#   raw_time_fit     -> fit_easing.py's original fits, for reference
#   CSV bezier_fit / spring_fit columns -> the new fits at the sample frames
# usage: refit_shape.py <curve_id> [<curve_id> ...] [--note "<sentence appended to the note>"]
import sys, os, csv, json, math, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from scipy.optimize import minimize_scalar, minimize
from curvekit import active_window, shape_rmse
from remotion_math import bezier, eased, spring_series
from tune_tokens import tune_bezier, tune_spring
from fit_easing import spring_at

CD = os.environ.get('CURVE_DIR', '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/curves/')


def shapefit_search(f, p, md):
    # the same search as scratch/v7c5_tools/shapefit.py: bezier + integer D minimising curvekit.shape_rmse
    # with the built duration within 1 frame of the measured one
    def built(D, q):
        e_ = bezier(*q)
        return np.arange(D + 40), np.array([eased(i, D, e_) for i in range(D + 40)])
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
                return rm + (0.0 if abs(bdur - mdur) <= 1 else 1.0 + abs(bdur - mdur))
            r = minimize(obj, q0, method='Nelder-Mead', options={'maxiter': 300, 'xatol': 1e-3, 'fatol': 1e-5})
            if best is None or r.fun < best[0]:
                best = (r.fun, D, [min(max(r.x[0], 0), 1), r.x[1], min(max(r.x[2], 0), 1), r.x[3]])
    _, D, q = best
    bf, bp = built(D, q)
    rm, mdur, bdur = shape_rmse(f, p, bf, bp)
    return {"model": "bezier", "params": {"x1": round(q[0], 4), "y1": round(q[1], 4), "x2": round(q[2], 4), "y2": round(q[3], 4)},
            "duration": int(D), "built_frames": int(round(bdur)), "rmse": round(float(rm), 4)}


ap = argparse.ArgumentParser()
ap.add_argument('ids', nargs='+')
ap.add_argument('--note', default='')
a = ap.parse_args()

for cid in a.ids:
    j = json.load(open(CD + cid + '.json'))
    if 'raw_time_fit' in j:
        print(f"{cid}: already refitted; skipped"); continue
    rows = list(csv.DictReader(open(CD + cid + '.csv')))
    f = np.array([float(r['frame']) for r in rows]); p = np.array([float(r['progress']) for r in rows])
    s, e, md = active_window(f, p)
    old_b, old_s = dict(j['bezier']), dict(j['spring'])
    # raw-time RMSE of fit_easing's fits (its CSV columns, all samples)
    old_b['rmse_raw_time'] = round(float(np.sqrt(np.mean((np.array([float(r['bezier_fit']) for r in rows]) - p) ** 2))), 4)
    old_s['rmse_raw_time'] = round(float(np.sqrt(np.mean((np.array([float(r['spring_fit']) for r in rows]) - p) ** 2))), 4)
    cands = [tune_bezier(f, p, md, (old_b['x1'], old_b['y1'], old_b['x2'], old_b['y2'])), shapefit_search(f, p, md)]
    # keep the lower shape RMSE among fits whose built duration is within 1 f of the measured one
    tb = min(cands, key=lambda t: (abs(t['built_frames'] - md) > 1, t['rmse']))
    print('  candidates:', [(t['params'], t['duration'], t['built_frames'], t['rmse']) for t in cands])
    ts = tune_spring(f, p, md, (old_s['stiffness'], old_s['damping']))
    q = tb['params']; D = tb['duration']
    ef = bezier(q['x1'], q['y1'], q['x2'], q['y2'])
    def bz(s0):
        return np.array([eased(ff - s0, D, ef) for ff in f])
    rb = minimize_scalar(lambda s0: float(np.sum((bz(s0) - p) ** 2)), bounds=(f[s] - D, f[e]), method='bounded')
    b_fit = bz(rb.x); b_raw = float(np.sqrt(np.mean((b_fit - p) ** 2)))
    k = ts['params']['stiffness']; c = ts['params']['damping']
    rs = minimize_scalar(lambda s0: float(np.sum((spring_at(f, s0, k, c) - p) ** 2)), bounds=(f[s] - md, f[e]), method='bounded')
    s_fit = spring_at(f, rs.x, k, c); s_raw = float(np.sqrt(np.mean((s_fit - p) ** 2)))
    zeta = c / (2 * math.sqrt(k))
    new_b = {"x1": q['x1'], "y1": q['y1'], "x2": q['x2'], "y2": q['y2'], "durationInFrames": int(D),
             "delay": round(float(rb.x - f[s]), 3), "built_duration_frames": int(tb['built_frames']), "rmse": tb['rmse'],
             "rmse_raw_time": round(b_raw, 4), "fit": "shape metric (lower of tune_tokens.tune_bezier and the shapefit.py search, scratch/v7c5_tools/refit_shape.py)"}
    new_s = {"stiffness": round(float(k), 3), "damping": round(float(c), 3), "mass": 1, "damping_ratio": round(zeta, 4),
             "built_duration_frames": int(ts['built_frames']), "rmse": ts['rmse'], "rmse_raw_time": round(s_raw, 4),
             "fit": "shape metric (tune_tokens.tune_spring via scratch/v7c5_tools/refit_shape.py)"}
    b_ok = abs(new_b['built_duration_frames'] - md) <= 1 and new_b['rmse'] <= 0.05
    s_ok = abs(new_s['built_duration_frames'] - md) <= 1 and new_s['rmse'] <= 0.05
    rec = min([('bezier', new_b['rmse'], b_ok), ('spring', new_s['rmse'], s_ok)], key=lambda t: (not t[2], t[1]))[0]
    j['raw_time_fit'] = {"tool": "fit_easing.py", "bezier": old_b, "spring": old_s, "recommended": j['recommended']}
    j['bezier'] = new_b; j['spring'] = new_s; j['recommended'] = rec
    base = j['note'].rstrip()
    if base and not base.endswith('.'):
        base += '.'
    j['note'] = base + (' ' if base else '') + (
        f"Refit on the shape metric (scratch/v7c5_tools/refit_shape.py): fit_easing.py's raw-time fits match the samples "
        f"(raw-time RMSE bezier {old_b['rmse_raw_time']}, spring {old_s['rmse_raw_time']}) but both shape RMSEs stay above 0.05 "
        f"(bezier {old_b['rmse']}, spring {old_s['rmse']}) because the {int(e - s + 1)} pictures of the measured "
        f"{int(md)}-f window sit 2-4 frames apart, so the measured 2% window and a raw-time fit's own window differ by "
        f"1-3 frames; the stored bezier and spring are now fitted with the build-side rule (curvekit.shape_rmse, built "
        f"duration within 1 f of the measured {int(md)} f); the original fits are kept under raw_time_fit." +
        (' ' + a.note if a.note else ''))
    json.dump(j, open(CD + cid + '.json', 'w'), indent=2)
    with open(CD + cid + '.csv', 'w', newline='') as fh:
        w = csv.writer(fh)
        w.writerow(list(rows[0].keys()))
        for i, r in enumerate(rows):
            r = dict(r); r['bezier_fit'] = f"{b_fit[i]:.5f}"; r['spring_fit'] = f"{s_fit[i]:.5f}"
            w.writerow([r[k_] for k_ in rows[0].keys()])
    print(f"{cid}: measured {int(md)} f | bezier({q['x1']}, {q['y1']}, {q['x2']}, {q['y2']}) D={D} built {new_b['built_duration_frames']} shape {new_b['rmse']} raw {new_b['rmse_raw_time']} {'PASS' if b_ok else 'FAIL'}"
          f" | spring k {new_s['stiffness']} c {new_s['damping']} zeta {new_s['damping_ratio']} built {new_s['built_duration_frames']} shape {new_s['rmse']} raw {new_s['rmse_raw_time']} {'PASS' if s_ok else 'FAIL'} | recommended {rec}")
