"""Fit one measured movement and store it as analysis/<v>/curves/<technique>.csv + curves/index.json.

  python fit_easing.py <video> <technique_id> --csv <samples.csv> --col <column>
         [--start F] [--end F] [--from-value X] [--to-value Y]
         --property position-y --unit "% of frame height" [--note "..."]

Samples: a CSV with a `frame` column (analysis frames, 60 fps grid) and the chosen value
column, e.g. from track.py. For screen recordings only captured pictures (unique == 1) are used.
Choose --start/--end so the range holds a few still frames before and after the movement.

Two models are fitted to the normalised progress (0 = rest before, 1 = settled after):
  bezier: interpolate(frame - delay, [0, D], [0, 1], Easing.bezier(x1, y1, x2, y2)), D integer
  spring: Remotion spring({frame: frame - delay, fps: 60, config: {stiffness, damping, mass: 1}})
Each model is then rendered per frame, its duration measured with the same rule as the samples
(curvekit.active_window) and its shape compared with curvekit.shape_rmse.
"""
import argparse
import csv
import math

import numpy as np
from scipy.optimize import least_squares

from common import get_video, load_json, save_json
from curvekit import TOL, active_window, normalise, shape_rmse
from remotion_math import bezier, eased, spring_series

FPS = 60


def bezier_curve(n, D, x1, y1, x2, y2):
    e = bezier(x1, y1, x2, y2)
    return np.array([eased(i, D, e) for i in range(n)])


def spring_at(frames, s0, k, c):
    """spring value at (frame - s0) for many frames; fractional offsets interpolate the per-frame
    series (exact at integer frames; the fractional step error is < 1e-3 at 60 fps)."""
    rel = np.asarray(frames, float) - s0
    n = int(max(2, math.ceil(rel.max()) + 2))
    ser = spring_series(n, FPS, c, 1.0, k)
    out = np.interp(np.clip(rel, 0, n - 1), np.arange(n), ser)
    out[rel <= 0] = 0.0
    return out


def _pen(y1, y2):
    """Mild pull of the y control points into 0..1 so equivalent fits come out as plain eases;
    a real overshoot in the data still wins (the penalty is small next to the residuals)."""
    return 0.03 * np.array([max(0.0, y1 - 1), max(0.0, -y1), max(0.0, y2 - 1), max(0.0, -y2)])


def fit_bezier(f, p, s_frame, dur):
    best = None
    for x1, y1, x2, y2 in [(0.42, 0, 0.58, 1), (0.25, 0.1, 0.25, 1), (0.33, 1, 0.68, 1), (0.6, 0, 0.4, 1),
                           (0.16, 1, 0.3, 1), (0.7, 0, 0.84, 0), (0.2, 0.9, 0.3, 1.1), (0.5, 0, 0.1, 1)]:
        for s_off in (-1.5, -0.5, 0.5):
            def res(q):
                s0, D, a1, b1, a2, b2 = q
                e = bezier(a1, b1, a2, b2)
                return np.concatenate([np.array([eased(ff - s0, D, e) for ff in f]) - p, _pen(b1, b2)])
            q0 = [s_frame + s_off, max(2.0, dur * 1.15), x1, y1, x2, y2]
            lo = [s_frame - 8, 1.0, 0, -1.0, 0, -1.0]
            hi = [s_frame + max(4, dur * 0.5), dur * 3 + 10, 1, 2.5, 1, 2.5]
            q0 = [min(max(v, l + 1e-6), h - 1e-6) for v, l, h in zip(q0, lo, hi)]
            try:
                r = least_squares(res, q0, bounds=(lo, hi), max_nfev=400)
            except Exception:
                continue
            if best is None or r.cost < best.cost:
                best = r
    return best.x


def refit_bezier_int(f, p, q):
    """Fix D to an integer (tokens are whole frames) and refit the rest."""
    s0, D, a1, b1, a2, b2 = q
    best = None
    for Di in sorted({max(1, int(math.floor(D))), max(1, int(math.ceil(D)))}):
        def res(r):
            ss, x1, y1, x2, y2 = r
            e = bezier(x1, y1, x2, y2)
            return np.concatenate([np.array([eased(ff - ss, Di, e) for ff in f]) - p, _pen(y1, y2)])
        lo = [s0 - 4, 0, -1.0, 0, -1.0]
        hi = [s0 + 4, 1, 2.5, 1, 2.5]
        r0 = [min(max(v, l + 1e-6), h - 1e-6) for v, l, h in zip([s0, a1, b1, a2, b2], lo, hi)]
        r = least_squares(res, r0, bounds=(lo, hi), max_nfev=400)
        if best is None or r.cost < best[0].cost:
            best = (r, Di)
    r, Di = best
    return r.x[0], Di, r.x[1], r.x[2], r.x[3], r.x[4]


def fit_spring(f, p, s_frame, dur):
    best = None
    for zeta in (0.35, 0.6, 0.85, 1.0, 1.3):
        # natural settle ~ 4.6 / (zeta * omega0) seconds for 1% -> pick omega0 from the duration
        T = max(dur, 2) / FPS
        w0 = 4.6 / (max(zeta, 0.5) * T)
        k0 = w0 ** 2
        c0 = 2 * zeta * w0
        for s_off in (-1.0, 0.0):
            def res(q):
                s0, lk, lc = q
                return spring_at(f, s0, math.exp(lk), math.exp(lc)) - p
            q0 = [s_frame + s_off, math.log(k0), math.log(c0)]
            lo = [s_frame - 8, math.log(1.0), math.log(0.5)]
            hi = [s_frame + max(4, dur * 0.5), math.log(20000.0), math.log(2000.0)]
            q0 = [min(max(v, l + 1e-6), h - 1e-6) for v, l, h in zip(q0, lo, hi)]
            try:
                r = least_squares(res, q0, bounds=(lo, hi), max_nfev=300)
            except Exception:
                continue
            if best is None or r.cost < best.cost:
                best = r
    s0, lk, lc = best.x
    return s0, math.exp(lk), math.exp(lc)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("technique")
    ap.add_argument("--csv", required=True)
    ap.add_argument("--col", required=True)
    ap.add_argument("--start", type=int)
    ap.add_argument("--end", type=int)
    ap.add_argument("--from-value", type=float)
    ap.add_argument("--to-value", type=float)
    ap.add_argument("--property", required=True, help="position-x, position-y, scale, rotation, opacity, blur, mask, crop, width, height ...")
    ap.add_argument("--unit", required=True, help='e.g. "% of frame height", "scale factor", "degrees", "luma 0-255"')
    ap.add_argument("--note", default="")
    a = ap.parse_args()
    v = get_video(a.video)

    rows = list(csv.DictReader(open(a.csv)))
    pts = []
    for r in rows:
        f = int(r["frame"])
        if a.start is not None and f < a.start:
            continue
        if a.end is not None and f > a.end:
            continue
        if v.kind != "cfr60" and r.get("unique", "1") != "1":
            continue
        if r.get(a.col, "") in ("", None):
            continue
        pts.append((f, float(r[a.col])))
    if len(pts) < 5:
        raise SystemExit("need at least 5 samples")
    f = np.array([x[0] for x in pts], float)
    raw = np.array([x[1] for x in pts], float)
    p, v0, v1 = normalise(raw, a.from_value, a.to_value)
    s, e, dur = active_window(f, p)
    s_frame = f[s]

    # bezier
    q = fit_bezier(f, p, s_frame, dur)
    s0, Di, x1, y1, x2, y2 = refit_bezier_int(f, p, q)
    e_fn = bezier(x1, y1, x2, y2)
    pad = int(Di + 40)
    bez_built = np.array([eased(i, Di, e_fn) for i in range(pad)])
    bez_rmse, _, bez_dur = shape_rmse(f, p, np.arange(pad), bez_built)
    bez_fit = np.array([eased(ff - s0, Di, e_fn) for ff in f])

    # spring
    ss0, k, c = fit_spring(f, p, s_frame, dur)
    n = int(dur * 4 + 120)
    spr_built = spring_series(n, FPS, c, 1.0, k)
    spr_rmse, _, spr_dur = shape_rmse(f, p, np.arange(n), spr_built)
    spr_fit = spring_at(f, ss0, k, c)
    zeta = c / (2 * math.sqrt(k))

    best = "bezier" if bez_rmse <= spr_rmse else "spring"
    out_dir = v.dir / "curves"
    out_dir.mkdir(exist_ok=True)
    out_csv = out_dir / f"{a.technique}.csv"
    with open(out_csv, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["frame", "rel_frame", "time_s", "raw_value", "progress", "in_active", "bezier_fit", "spring_fit"])
        for i, ff in enumerate(f):
            w.writerow([int(ff), int(ff - f[s]), f"{ff / FPS:.4f}", f"{raw[i]:.4f}", f"{p[i]:.5f}", int(s <= i <= e),
                        f"{bez_fit[i]:.5f}", f"{spr_fit[i]:.5f}"])
    entry = {
        "technique_id": a.technique,
        "file": f"curves/{a.technique}.csv",
        "property": a.property,
        "unit": a.unit,
        "source_samples": a.csv,
        "column": a.col,
        "sampled_frames": [int(f[0]), int(f[-1])],
        "sampling": "every frame (60 fps)" if v.kind == "cfr60" else "captured pictures only (24/30 fps cadence on the 60 fps grid)",
        "from_value": round(v0, 4),
        "to_value": round(v1, 4),
        "active_frames": [int(f[s]), int(f[e])],
        "measured_duration_frames": int(round(dur)),
        "bezier": {"x1": round(x1, 4), "y1": round(y1, 4), "x2": round(x2, 4), "y2": round(y2, 4),
                   "durationInFrames": int(Di), "delay": round(s0 - f[s], 3),
                   "built_duration_frames": int(round(bez_dur)), "rmse": round(bez_rmse, 4)},
        "spring": {"stiffness": round(k, 3), "damping": round(c, 3), "mass": 1, "damping_ratio": round(zeta, 4),
                   "built_duration_frames": int(round(spr_dur)), "rmse": round(spr_rmse, 4)},
        "recommended": best,
        "note": a.note,
    }
    # one sidecar per curve (parallel writers never share a file); curves_tool.py index builds index.json
    save_json(out_dir / f"{a.technique}.json", entry)
    print(f"{a.technique}: {a.property} {v0:.2f}->{v1:.2f} {a.unit}; active f{int(f[s])}-f{int(f[e])} = {dur:.0f} frames")
    print(f"  bezier({x1:.3f}, {y1:.3f}, {x2:.3f}, {y2:.3f}) D={Di} -> built {bez_dur:.0f} f, rmse {bez_rmse:.4f}")
    print(f"  spring(stiffness {k:.1f}, damping {c:.2f}, mass 1; zeta {zeta:.2f}) -> built {spr_dur:.0f} f, rmse {spr_rmse:.4f}")
    print(f"  recommended: {best}; wrote {out_csv}")


if __name__ == "__main__":
    main()
