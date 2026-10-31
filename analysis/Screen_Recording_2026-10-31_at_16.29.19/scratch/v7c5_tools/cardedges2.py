# P4 picture card: left / right edge per captured picture along rows in the card's middle band.
# The band comes from the card template track (centre + scale; card centre = tmpl centre + s*(-130.2, 285.1),
# half-size = s*(700.3, 394.5), calibrated on the rest picture f3376). Edge = sub-pixel crossing of the level
# halfway between the canvas (17) and the card luma 15-45 px inside the edge; median over the rows.
# usage: cardedges2.py tmpl.csv out.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
T = list(csv.DictReader(open(sys.argv[1])))
out = sys.argv[2]
r = WorkReader(v)
CAN = 17.0
def edge_from_left(row, x_guess):
    # coarse: first x >= 0 with luma > 30 scanning right from max(0, x_guess-120)
    x0 = int(max(0, x_guess - 120))
    idx = np.nonzero(row[x0:] > 30)[0]
    if len(idx) == 0: return None
    xc = x0 + int(idx[0])
    inner = float(np.median(row[min(len(row) - 1, xc + 15):min(len(row), xc + 45)]))
    lvl = 0.5 * (CAN + inner)
    seg = row[max(0, xc - 40):min(len(row), xc + 40)]
    j = np.nonzero(seg >= lvl)[0]
    if len(j) == 0: return None
    j = int(j[0]); base = max(0, xc - 40)
    if j == 0: return float(base)
    return base + (j - 1) + (lvl - seg[j - 1]) / max(1e-6, seg[j] - seg[j - 1])
res = []
for t in T:
    f = int(t['frame']); s = float(t['scale']); tx = float(t['cx']); ty = float(t['cy'])
    ccx, ccy = tx - 130.2 * s, ty + 285.1 * s
    hw, hh = 700.3 * s, 394.5 * s
    g = r.read(f).astype(np.float32)[:, :1540] if False else r.read(f).astype(np.float32)
    lefts, rights = [], []
    for yy in np.linspace(ccy - 0.3 * hh, ccy + 0.3 * hh, 15):
        yy = int(round(yy))
        if yy < 0 or yy >= g.shape[0]: continue
        row = g[yy]
        L = edge_from_left(row, ccx - hw)
        Rr = edge_from_left(row[::-1].copy(), (len(row) - 1) - (ccx + hw))
        if L is not None: lefts.append(L)
        if Rr is not None: rights.append(len(row) - 1 - Rr)
    L = float(np.median(lefts)) if lefts else float('nan'); R = float(np.median(rights)) if rights else float('nan')
    sdL = float(np.std(lefts)) if lefts else float('nan'); sdR = float(np.std(rights)) if rights else float('nan')
    res.append([f, 1, f'{L:.2f}', f'{R:.2f}', f'{R - L:.2f}', f'{sdL:.2f}', f'{sdR:.2f}', f'{ccx - hw:.1f}', f'{ccx + hw:.1f}'])
r.close()
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'left', 'right', 'width', 'sd_left', 'sd_right', 'pred_left', 'pred_right']); w.writerows(res)
for x in res: print(*x)
