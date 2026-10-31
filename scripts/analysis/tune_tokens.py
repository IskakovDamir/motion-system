"""Turn every measured curve into a Remotion motion token that verify.py will accept.

For each analysis/<v>/curves/<id>.csv (primary curves, no .i2/.i3 instances) the measured
duration and progress shape are matched by both model families, scored with the same rule as
verify.py (curvekit.shape_rmse and the built duration within 1 frame):
  bezier  Easing.bezier(x1, y1, x2, y2) over an integer duration D
  spring  spring({stiffness, damping, mass: 1}) at 60 fps (natural duration)
The best passing token is written to analysis/tokens_fit.json:
  {"<id>": {"model", "params", "duration", "measured_frames", "built_frames", "rmse", "pass"}}

  python tune_tokens.py [v1 v2 ...]
"""
import json
import math
import sys

import numpy as np
from scipy.optimize import minimize

from common import ANALYSIS, load_json, load_registry, save_json
from curvekit import TOL, active_window, shape_rmse
from remotion_math import bezier, eased, spring_series

FPS = 60


def bezier_curve(D, x1, y1, x2, y2, pad=40):
    e = bezier(x1, y1, x2, y2)
    return np.array([eased(i, D, e) for i in range(int(D) + pad)])


def score_bezier(mf, mp, md, q, D):
    x1, y1, x2, y2 = q
    if not (0 <= x1 <= 1 and 0 <= x2 <= 1):
        return 9.0, None
    b = bezier_curve(D, x1, y1, x2, y2)
    try:
        r, _, bd = shape_rmse(mf, mp, np.arange(len(b)), b)
    except ValueError:
        return 9.0, None
    return r, bd


def tune_bezier(mf, mp, md, start):
    """Search the control points on the shape alone, then the integer duration that lands the
    thresholded duration on the measured one."""
    def f(q):
        # a time-normalised shape: evaluate with a long D so integer sampling barely matters
        r, _ = score_bezier(mf, mp, md, q, 240)
        return r
    best = None
    for q0 in [start, (0.42, 0, 0.58, 1), (0.25, 0.1, 0.25, 1), (0.33, 1, 0.68, 1), (0.16, 1, 0.3, 1),
               (0.7, 0, 0.84, 0), (0.2, 0.9, 0.3, 1.1), (0.6, 0, 0.4, 1)]:
        r = minimize(f, q0, method="Nelder-Mead", options={"xatol": 1e-4, "fatol": 1e-6, "maxiter": 1200})
        if best is None or r.fun < best.fun:
            best = r
    q = [min(1, max(0, best.x[0])), best.x[1], min(1, max(0, best.x[2])), best.x[3]]
    # duration: the thresholded window of the shape is a fixed fraction of D
    _, ratio_bd = score_bezier(mf, mp, md, q, 240)
    frac = ratio_bd / 240 if ratio_bd else 1
    cands = []
    D0 = md / max(frac, 1e-3)
    for D in range(max(1, int(math.floor(D0)) - 3), int(math.ceil(D0)) + 4):
        r, bd = score_bezier(mf, mp, md, q, D)
        if bd is not None:
            cands.append((abs(bd - md) > 1, r, D, bd))
    cands.sort()
    bad, r, D, bd = cands[0]
    return {"model": "bezier", "params": {"x1": round(q[0], 4), "y1": round(q[1], 4), "x2": round(q[2], 4), "y2": round(q[3], 4)},
            "duration": int(D), "built_frames": int(round(bd)), "rmse": round(float(r), 4)}


def spring_curve(k, c, n):
    return spring_series(n, FPS, c, 1.0, k)


def tune_spring(mf, mp, md, start):
    """Shape depends on the damping ratio only; the stiffness then sets the time scale."""
    k0, c0 = start
    def shape(zeta):
        w0 = 10.0
        k, c = w0 ** 2, 2 * zeta * w0
        s = spring_curve(k, c, 4000)
        try:
            r, _, _ = shape_rmse(mf, mp, np.arange(len(s)), s)
        except ValueError:
            return 9.0
        return r
    zs = np.linspace(0.15, 1.6, 59)
    vals = [shape(z) for z in zs]
    z = float(zs[int(np.argmin(vals))])
    r = minimize(lambda q: shape(q[0]), [z], method="Nelder-Mead", options={"xatol": 1e-4, "maxiter": 200})
    zeta = float(max(0.05, r.x[0]))
    # time scale: find omega0 so the thresholded duration matches
    best = None
    for w0 in np.geomspace(1.0, 400.0, 900):
        k, c = w0 ** 2, 2 * zeta * w0
        n = int(min(6000, max(60, 40 * FPS / w0 * 4)))
        s = spring_curve(k, c, n)
        try:
            rr, _, bd = shape_rmse(mf, mp, np.arange(len(s)), s)
        except ValueError:
            continue
        key = (abs(bd - md) > 1, abs(bd - md), rr)
        if best is None or key < best[0]:
            best = (key, k, c, bd, rr)
    _, k, c, bd, rr = best
    return {"model": "spring", "params": {"stiffness": round(float(k), 3), "damping": round(float(c), 3), "mass": 1},
            "duration": None, "built_frames": int(round(bd)), "rmse": round(float(rr), 4), "damping_ratio": round(zeta, 4)}


def main():
    names = sys.argv[1:]
    out = load_json(ANALYSIS / "tokens_fit.json", {})
    for v in load_registry():
        if names and v.key not in names and v.stem not in names:
            continue
        idx = load_json(v.dir / "curves" / "index.json", {"curves": {}})["curves"]
        for cid, e in sorted(idx.items()):
            data = np.genfromtxt(v.dir / "curves" / f"{cid}.csv", delimiter=",", names=True)
            mf, mp = data["frame"].astype(float), data["progress"].astype(float)
            _, _, md = active_window(mf, mp)
            b = e["bezier"]
            tb = tune_bezier(mf, mp, md, (b["x1"], b["y1"], b["x2"], b["y2"]))
            ts = tune_spring(mf, mp, md, (e["spring"]["stiffness"], e["spring"]["damping"]))
            for t in (tb, ts):
                t["pass"] = abs(t["built_frames"] - md) <= 1 and t["rmse"] <= 0.05
            pick = min((tb, ts), key=lambda t: (not t["pass"], t["rmse"]))
            out[cid] = dict(pick, measured_frames=int(round(md)), video=v.key, property=e["property"],
                            alternatives={"bezier": tb, "spring": ts})
            print(f"{cid:55s} measured {md:4.0f}  {pick['model']:6s} built {pick['built_frames']:4d} rmse {pick['rmse']:.4f} {'PASS' if pick['pass'] else 'FAIL'}")
    save_json(ANALYSIS / "tokens_fit.json", out)


if __name__ == "__main__":
    main()
