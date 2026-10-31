# Faster multi-scale template tracker for v7 (captured pictures only), same CSV columns as track.py template.
# usage: tmpl.py START END --bbox X Y W H --ref F --scales A B STEP [--pad P | --global] [--roi X Y W H] --name N
# coarse search at half resolution for every scale, then refine at full resolution around the best hit.
import sys, csv, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

ap = argparse.ArgumentParser()
ap.add_argument('start', type=int); ap.add_argument('end', type=int)
ap.add_argument('--bbox', type=int, nargs=4, required=True)
ap.add_argument('--ref', type=int, required=True)
ap.add_argument('--scales', type=float, nargs=3, default=[1, 1, 0.01])
ap.add_argument('--pad', type=int, default=250)
ap.add_argument('--global', dest='glob', action='store_true')
ap.add_argument('--roi', type=int, nargs=4)
ap.add_argument('--frames', type=str, help='comma list of frames instead of all unique')
ap.add_argument('--name', required=True)
a = ap.parse_args()
v = get_video('v7')
W, H = 1622, 918
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
frames = [int(x) for x in a.frames.split(',')] if a.frames else [f for f in uniq if a.start <= f <= a.end]
r = WorkReader(v)
x, y, w, h = a.bbox
ref = r.read(a.ref).astype(np.float32)
t0 = ref[y:y + h, x:x + w]
scales = list(np.arange(a.scales[0], a.scales[1] + 1e-9, a.scales[2]))
cx, cy = x + w / 2, y + h / 2
rows = []
for f in frames:
    g = r.read(f).astype(np.float32)
    if a.roi:
        rx0, ry0, rw, rh = a.roi; X0, Y0, X1, Y1 = rx0, ry0, rx0 + rw, ry0 + rh
    elif a.glob:
        X0, Y0, X1, Y1 = 0, 0, W, H
    else:
        X0 = int(max(0, cx - a.pad - w)); Y0 = int(max(0, cy - a.pad - h)); X1 = int(min(W, cx + a.pad + w)); Y1 = int(min(H, cy + a.pad + h))
    reg = g[Y0:Y1, X0:X1]
    regs = cv2.resize(reg, (reg.shape[1] // 2, reg.shape[0] // 2), interpolation=cv2.INTER_AREA)
    best = None
    for s in scales:
        tw, th = max(6, int(round(w * s))), max(6, int(round(h * s)))
        if tw > reg.shape[1] or th > reg.shape[0]:
            continue
        ts = cv2.resize(t0, (max(3, tw // 2), max(3, th // 2)), interpolation=cv2.INTER_AREA)
        if ts.shape[0] > regs.shape[0] or ts.shape[1] > regs.shape[1]:
            continue
        res = cv2.matchTemplate(regs, ts, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if best is None or sc > best[0]:
            best = (sc, loc[0] * 2, loc[1] * 2, s, tw, th)
    if best is None:
        continue
    # refine at full res for the best scale and its neighbours
    sc0, bx, by, s0, tw0, th0 = best
    best2 = None
    for s in [s0 - a.scales[2], s0, s0 + a.scales[2]]:
        if s <= 0: continue
        tw, th = max(6, int(round(w * s))), max(6, int(round(h * s)))
        t = cv2.resize(t0, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        xa = max(0, bx - 8); ya = max(0, by - 8); xb = min(reg.shape[1], bx + tw + 8); yb = min(reg.shape[0], by + th + 8)
        sub = reg[ya:yb, xa:xb]
        if sub.shape[0] < th or sub.shape[1] < tw: continue
        res = cv2.matchTemplate(sub, t, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if best2 is None or sc > best2[0]:
            best2 = (sc, X0 + xa + loc[0], Y0 + ya + loc[1], s, tw, th)
    sc, bx, by, s, tw, th = best2 if best2 else (sc0, X0 + bx, Y0 + by, s0, tw0, th0)
    mx, my = bx + tw / 2, by + th / 2
    if sc >= 0.5:
        cx, cy = mx, my
    rows.append([f, f'{f / 60:.4f}', 1, bx, by, f'{mx:.2f}', f'{my:.2f}', f'{100 * mx / W:.3f}', f'{100 * my / H:.3f}', f'{s:.4f}', tw, th,
                 f'{100 * tw / W:.3f}', f'{100 * th / H:.3f}', f'{sc:.4f}'])
r.close()
out = v.dir / 'scratch' / f'{a.name}.csv'
with open(out, 'w', newline='') as fh:
    wr = csv.writer(fh)
    wr.writerow(['frame', 'time_s', 'unique', 'x', 'y', 'cx', 'cy', 'cx_pct', 'cy_pct', 'scale', 'w', 'h', 'w_pct', 'h_pct', 'score'])
    wr.writerows(rows)
print(out)
for rr in rows:
    print(rr[0], rr[5], rr[6], rr[9], rr[15 - 1])
