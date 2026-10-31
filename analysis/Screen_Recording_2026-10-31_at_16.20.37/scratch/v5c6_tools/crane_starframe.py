"""Right crane (v5c6 P2) on screen and relative to the star field.

On-screen body centre: scratch/v5c6_craneC_r2_locked.csv (locked pictures only).
Star-field motion: scratch/v5c6_starfield_fit.csv, p_f = C + S_f (p_3976 - C) + T_f.
Relative position (picture f3976 star-field coordinates): C + (p_f - C - T_f) / S_f, with and
without the shift term T_f (the shift is the noisier part of the field fit).
Writes scratch/v5c6_craneC_starframe.csv.
"""
import csv
from pathlib import Path

HERE = Path(__file__).resolve()
SCR = HERE.parents[1]
W, H = 1622.0, 918.0
CX, CY = 811.0, 459.0
field = {int(r["frame"]): r for r in csv.DictReader(open(SCR / "v5c6_starfield_fit.csv")) if r["cum_scale"]}
rows = []
for r in csv.DictReader(open(SCR / "v5c6_craneC_r2_locked.csv")):
    if r["unique"] != "1" or r["locked"] != "1":
        continue
    f = int(r["frame"])
    if f not in field:
        continue
    S = float(field[f]["cum_scale"]); tx = float(field[f]["cum_tx_px"]); ty = float(field[f]["cum_ty_px"])
    x, y = float(r["cx"]), float(r["cy"])
    xs = CX + (x - CX - tx) / S; ys = CY + (y - CY - ty) / S
    xo = CX + (x - CX) / S; yo = CY + (y - CY) / S
    rows.append([f, 1, f"{100 * x / W:.3f}", f"{100 * y / H:.3f}", f"{S:.4f}", f"{tx:+.1f}", f"{ty:+.1f}",
                 f"{100 * xs / W:.3f}", f"{100 * ys / H:.3f}", f"{100 * xo / W:.3f}", f"{100 * yo / H:.3f}", r["score"]])
out = SCR / "v5c6_craneC_starframe.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["frame", "unique", "screen_cx_pct", "screen_cy_pct", "field_scale", "field_tx_px", "field_ty_px",
                "starframe_cx_pct", "starframe_cy_pct", "starframe_scale_only_cx_pct", "starframe_scale_only_cy_pct", "template_score"])
    w.writerows(rows)
print(out)
for r in rows:
    print(r)
