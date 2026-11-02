"""Compare the pop-in instances of v3 (four S01 nodes, one S02 lattice node, the S05 brand mark) on
their sub-pixel samples: each instance is normalised from its first visible frame (progress 0) to rest
(1.0), fitted with fit_easing.py's bezier fitter (integer D), and every instance's samples are compared
with every instance's built curve by curvekit.shape_rmse (the duration and shape rule of fit_easing.py).
Also: first-visible opacity, peak (parabola vertex through the three highest samples), overshoot over
start offset, and the peak the main (top-right) curve gives when built from the mark's own first scale.
  python pop_crossfit.py   -> scratch/r3_pop_crossfit.json
"""
import csv
import json
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import numpy as np
from fit_easing import fit_bezier, refit_bezier_int
from curvekit import normalise, active_window, shape_rmse
from remotion_math import bezier, eased

S = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
SETS = {
    "S01 top-right node (main curve)": ("gap_f14_pop_TR.csv", "scale", "alpha", 1, 20),
    "S01 top-left node": ("gap_f14_pop_TL.csv", "scale", "alpha", 1, 20),
    "S01 bottom-left node": ("gap_f14_pop_BL.csv", "scale", "alpha", 3, 22),
    "S01 bottom-right node": ("gap_f14_pop_BR.csv", "scale", "alpha", 6, 25),
    "S02 lattice node (384.6, 961.7)": ("v3c1_lattice_popfine_j3km3.csv", "pop_scale", "alpha_core", 178, 198),
    "S05 brand mark": ("gap_f518_mark_scale_fine.csv", "scale", "alpha", 508, 530),
}


def load(name, col, acol, a, b):
    f, v, al = [], [], []
    for r in csv.DictReader(open(S + name)):
        fr = int(r["frame"])
        if a <= fr <= b and r.get(col, "") != "":
            f.append(fr); v.append(float(r[col])); al.append(float(r[acol]))
    return np.array(f, float), np.array(v, float), np.array(al, float)


out = {"rule": "samples normalised from the first visible frame to 1.0; fit_easing.fit_bezier + refit_bezier_int; curvekit.shape_rmse",
       "instances": {}, "cross_shape_rmse": {"rows": "samples", "cols": "built curve"}}
data, fits = {}, {}
for k, (fn, col, acol, a, b) in SETS.items():
    f, raw, al = load(fn, col, acol, a, b)
    p, v0, v1 = normalise(raw, raw[0], 1.0)
    s, e, dur = active_window(f, p)
    q = fit_bezier(f, p, f[s], dur)
    s0, Di, x1, y1, x2, y2 = refit_bezier_int(f, p, q)
    efn = bezier(x1, y1, x2, y2)
    built = np.array([eased(i, Di, efn) for i in range(int(Di + 40))])
    r_self, _, _ = shape_rmse(f, p, np.arange(len(built)), built)
    pk = int(np.argmax(raw))
    y0_, y1_, y2_ = raw[pk - 1], raw[pk], raw[pk + 1]
    off = 0.5 * (y0_ - y2_) / (y0_ - 2 * y1_ + y2_)
    data[k] = (f, p)
    fits[k] = (np.arange(len(built)), built)
    out["instances"][k] = {
        "samples": "scratch/" + fn, "column": col,
        "first_visible_frame": int(f[0]), "first_visible_scale": round(float(raw[0]), 4),
        "first_visible_opacity": round(float(al[0]), 3), "opacity_first_5": [round(float(x), 3) for x in al[:5]],
        "peak_scale": round(float(raw.max()), 4), "peak_frame": int(f[pk]),
        "peak_vertex_frames_after_first_visible": round(float(f[pk] + off - f[0]), 2),
        "start_offset": round(float(1 - raw[0]), 4), "overshoot": round(float(raw.max() - 1), 4),
        "overshoot_over_start_offset": round(float((raw.max() - 1) / (1 - raw[0])), 3),
        "normalised_peak": round(float(p.max()), 3),
        "active_frames": [int(f[s]), int(f[e])], "active_duration_frames": int(round(dur)),
        "bezier": [round(x1, 3), round(y1, 3), round(x2, 3), round(y2, 3)], "D": int(Di),
        "built_peak_progress": round(float(built.max()), 3), "self_shape_rmse": round(r_self, 4),
    }
keys = list(SETS)
for a in keys:
    out["cross_shape_rmse"][a] = {b: round(shape_rmse(*data[a], *fits[b])[0], 3) for b in keys}
main = out["instances"]["S01 top-right node (main curve)"]
mark = out["instances"]["S05 brand mark"]
out["main_curve_built_from_mark_first_scale"] = {
    "first_scale": mark["first_visible_scale"], "built_peak_progress": main["built_peak_progress"],
    "built_peak_scale": round(mark["first_visible_scale"] + main["built_peak_progress"] * (1 - mark["first_visible_scale"]), 4),
    "measured_peak_scale": mark["peak_scale"]}
json.dump(out, open(S + "r3_pop_crossfit.json", "w"), indent=1)
for k, e in out["instances"].items():
    print(k, e)
for a in keys:
    print(a, out["cross_shape_rmse"][a])
print(out["main_curve_built_from_mark_first_scale"])
