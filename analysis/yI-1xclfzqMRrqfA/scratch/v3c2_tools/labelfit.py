"""Per-frame scale, centre and opacity of one badge label (third, fourth ... ) during the swap.
Template from the rest frame REF; multi-scale NCC; opacity = regression slope of the frame patch on the
scaled template (contrast relative to the rest frame), cross-checked by the integrated ink deficit
divided by scale^2.

Runs for chunk v3c2 (from the project root, writes scratch/v3c2_label<k>_scale_opacity.csv):
  .venv/bin/python -I analysis/yI-1xclfzqMRrqfA/scratch/v3c2_tools/labelfit.py \
      --x0 X0 --x1 X1 --y0 Y0 --y1 Y1 --start 1122 --end 1152 --name v3c2_label<k>_scale_opacity
  label k (badge order left to right at the stop): box X0 X1 Y0 Y1 at rest frame f1125
  1: 121 299 801 841   2: 362 659 801 838   3: 695 925 801 837
  4: 1052 1168 801 837 5: 1350 1470 801 838 6: 1613 1804 800 838
"""
import sys, csv, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

ap = argparse.ArgumentParser()
ap.add_argument('--x0', type=int, required=True); ap.add_argument('--x1', type=int, required=True)
ap.add_argument('--y0', type=int, default=800); ap.add_argument('--y1', type=int, default=840)
ap.add_argument('--start', type=int, default=1120); ap.add_argument('--end', type=int, default=1160)
ap.add_argument('--ref', type=int, default=1125)
ap.add_argument('--name', required=True)
ap.add_argument('--smin', type=float, default=0.40); ap.add_argument('--smax', type=float, default=1.04)
a = ap.parse_args()

v = get_video('v3')
W, H = 1920, 1080
r = WorkReader(v)
ref = r.read(a.ref).astype(np.float32)
T0 = ref[a.y0:a.y1, a.x0:a.x1]
tw0, th0 = T0.shape[1], T0.shape[0]
cx0, cy0 = a.x0 + tw0 / 2, a.y0 + th0 / 2
# fixed integration region: label column, y 760-848 (below the plates / hexagons)
hw = max(140, int(tw0 / 2 + 6)); ix0, ix1 = int(cx0 - hw), int(cx0 + hw)
iy0, iy1 = 760, 848
def ink(g):
    reg = g[iy0:iy1, ix0:ix1]
    border = np.concatenate([reg[0], reg[-1], reg[:, 0], reg[:, -1]])
    bg = float(np.median(border))
    d = bg - reg
    return float(d[d > 0].sum() - 0), bg   # positive deficit only
I_ref, bg_ref = ink(ref)
scales = np.arange(a.smin, a.smax + 1e-9, 0.005)
rows = []
for f in range(a.start, a.end + 1):
    g = r.read(f).astype(np.float32)
    sx0, sx1 = int(cx0 - tw0 / 2 - 40), int(cx0 + tw0 / 2 + 40)
    sy0, sy1 = 759, 850
    region = g[sy0:sy1, sx0:sx1]
    best = None
    for s in scales:
        tw, th = max(4, int(round(tw0 * s))), max(4, int(round(th0 * s)))
        t = cv2.resize(T0, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        if t.std() < 1e-3: continue
        res = cv2.matchTemplate(region, t, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if best is None or sc > best[0]:
            best = (sc, sx0 + loc[0], sy0 + loc[1], s, tw, th, t)
    sc, bx, by, s, tw, th, t = best
    P = g[by:by + th, bx:bx + tw]
    tc = t - t.mean(); pc = P - P.mean()
    slope = float((tc * pc).sum() / (tc * tc).sum())
    I, bg = ink(g)
    alpha_ink = I / (s * s * I_ref) if I_ref > 0 else float('nan')
    mx, my = bx + tw / 2, by + th / 2
    rows.append([f, f'{s:.3f}', f'{mx:.1f}', f'{my:.1f}', f'{100*mx/W:.2f}', f'{100*my/H:.2f}', tw, f'{100*tw/W:.2f}', f'{sc:.3f}', f'{slope:.3f}', f'{I/I_ref:.4f}', f'{alpha_ink:.3f}', f'{bg:.1f}', f'{g[iy0:iy1, ix0:ix1].min():.0f}'])
r.close()
hdr = ['frame', 'scale', 'cx', 'cy', 'cx_pct', 'cy_pct', 'w', 'w_pct', 'score', 'opacity_slope', 'ink_rel', 'opacity_ink', 'bg', 'min_luma']
out = f'/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/{a.name}.csv'
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(hdr); w.writerows(rows)
print(out)
print(','.join(hdr))
for row in rows: print(','.join(str(x) for x in row))
