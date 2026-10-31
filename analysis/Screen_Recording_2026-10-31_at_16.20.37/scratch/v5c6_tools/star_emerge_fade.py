"""Peak luma of two stars that emerge / fade in place (v5c6 P2), measured at their tracked
positions and, where they are not visible, at the position carried by the star-field model
(scratch/v5c6_starfield_fit.csv). Peak = brightest raw pixel within +-12 px; background = 30th
percentile of a 61 px box. Writes scratch/v5c6_star_emerge_fade.csv."""
import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "scripts" / "analysis"))
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402

C = np.array([811.0, 459.0])
v = get_video("v5")
model = {}
for r in csv.DictReader(open(HERE.parents[1] / "v5c6_starfield_fit.csv")):
    if r["pair_scale"]:
        model[(int(r["prev_frame"]), int(r["frame"]))] = (float(r["pair_scale"]), np.array([float(r["pair_tx_px"]), float(r["pair_ty_px"])]))


def step(p, fa, fb):
    if (fa, fb) in model:
        s, t = model[(fa, fb)]
        return C + s * (p - C) + t
    if (fb, fa) in model:
        s, t = model[(fb, fa)]
        return C + (p - C - t) / s
    raise KeyError((fa, fb))


# anchor positions measured on visible pictures (scratch/v5c6_star_tracks.csv style refinement)
cases = {"emerging_star": (3990, np.array([917.7, 45.8]), [3990, 3985, 3982], [3992, 3995, 3997]),
         "fading_star": (3995, np.array([1041.1, 175.7]), [3995, 3992, 3990], [3997, 4000, 4002])}
rd = WorkReader(v)
rows = []
for name, (f0, p0, back, fwd) in cases.items():
    pos = {f0: p0}
    for fa, fb in zip(back[:-1], back[1:]):
        pos[fb] = step(pos[fa], fa, fb)
    for fa, fb in zip([f0] + fwd[:-1], fwd):
        if (fa, fb) not in model:
            break  # no field model after f4000 (too few stars)
        pos[fb] = step(pos[fa], fa, fb)
    for f in sorted(pos):
        p = pos[f]
        g = rd.read(f)
        x, y = int(round(p[0])), int(round(p[1]))
        sub = g[max(0, y - 12):y + 13, max(0, x - 12):x + 13]
        box = g[max(0, y - 30):y + 31, max(0, x - 30):x + 31]
        iy, ix = np.unravel_index(np.argmax(sub), sub.shape)
        rows.append([name, f, f"{p[0]:.1f}", f"{p[1]:.1f}", int(sub.max()), max(0, x - 12) + ix, max(0, y - 12) + iy, int(np.percentile(box, 30))])
rd.close()
out = HERE.parents[1] / "v5c6_star_emerge_fade.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["star", "frame", "model_x", "model_y", "peak_luma_12px", "peak_x", "peak_y", "local_bg"])
    w.writerows(rows)
print(out)
for r in rows:
    print(r)
