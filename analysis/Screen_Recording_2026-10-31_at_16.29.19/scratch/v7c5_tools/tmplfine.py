# Multi-scale template tracker with sub-step precision (v7, captured pictures only, capture duplicates skipped).
# Coarse: half-resolution search over --scales A B STEP (global or padded window around the last lock).
# Fine: full resolution, scales s0 +- 6 fine steps (--fine, default 0.002); parabola through the best score
# and its neighbours gives the scale, a parabola on the match map gives sub-pixel position.
# usage: tmplfine.py START END --bbox X Y W H --ref F --scales A B STEP [--fine 0.002] [--pad P | --global] --name N
import sys, csv, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

ap = argparse.ArgumentParser()
ap.add_argument('start', type=int); ap.add_argument('end', type=int)
ap.add_argument('--bbox', type=int, nargs=4, required=True)
ap.add_argument('--ref', type=int, required=True)
ap.add_argument('--scales', type=float, nargs=3, default=[1, 1, 0.01])
ap.add_argument('--fine', type=float, default=0.002)
ap.add_argument('--pad', type=int, default=250)
ap.add_argument('--global', dest='glob', action='store_true')
ap.add_argument('--keepdups', action='store_true')
ap.add_argument('--name', required=True)
a = ap.parse_args()
v = get_video('v7')
W, H = 1622, 918
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
frames = [f for f in uniq if a.start <= f <= a.end]
r = WorkReader(v)
x, y, w, h = a.bbox
t0 = r.read(a.ref).astype(np.float32)[y:y + h, x:x + w]
scales = list(np.arange(a.scales[0], a.scales[1] + 1e-9, a.scales[2]))
cx, cy = x + w / 2, y + h / 2
rows = []
prev = None

def sub(res, loc):
    # parabolic sub-pixel peak
    px, py = loc
    dx = dy = 0.0
    if 0 < px < res.shape[1] - 1:
        l, c, rr = res[py, px - 1], res[py, px], res[py, px + 1]
        den = l - 2 * c + rr
        if abs(den) > 1e-9: dx = 0.5 * (l - rr) / den
    if 0 < py < res.shape[0] - 1:
        u, c, d = res[py - 1, px], res[py, px], res[py + 1, px]
        den = u - 2 * c + d
        if abs(den) > 1e-9: dy = 0.5 * (u - d) / den
    return px + dx, py + dy

for f in frames:
    g = r.read(f).astype(np.float32)
    if prev is not None and not a.keepdups and np.abs(g - prev).mean() < 0.05:
        prev = g
        continue
    prev = g
    if a.glob:
        X0, Y0, X1, Y1 = 0, 0, W, H
    else:
        X0 = int(max(0, cx - a.pad - w)); Y0 = int(max(0, cy - a.pad - h)); X1 = int(min(W, cx + a.pad + w)); Y1 = int(min(H, cy + a.pad + h))
    reg = g[Y0:Y1, X0:X1]
    regs = cv2.resize(reg, (reg.shape[1] // 2, reg.shape[0] // 2), interpolation=cv2.INTER_AREA)
    best = None
    for s in scales:
        tw, th = max(6, int(round(w * s))), max(6, int(round(h * s)))
        ts = cv2.resize(t0, (max(3, tw // 2), max(3, th // 2)), interpolation=cv2.INTER_AREA)
        if ts.shape[0] > regs.shape[0] or ts.shape[1] > regs.shape[1]:
            continue
        res = cv2.matchTemplate(regs, ts, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if best is None or sc > best[0]:
            best = (sc, loc[0] * 2, loc[1] * 2, s)
    if best is None:
        continue
    sc0, bx, by, s0 = best
    fine = []
    for k in range(-6, 7):
        s = s0 + k * a.fine
        if s <= 0: continue
        tw, th = max(6, int(round(w * s))), max(6, int(round(h * s)))
        t = cv2.resize(t0, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        xa = max(0, bx - 12); ya = max(0, by - 12); xb = min(reg.shape[1], bx + tw + 12); yb = min(reg.shape[0], by + th + 12)
        sb = reg[ya:yb, xa:xb]
        if sb.shape[0] < th or sb.shape[1] < tw: continue
        res = cv2.matchTemplate(sb, t, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        spx, spy = sub(res, loc)
        fine.append((s, sc, X0 + xa + spx + tw / 2, Y0 + ya + spy + th / 2, tw, th))
    if not fine:
        continue
    i = int(np.argmax([q[1] for q in fine]))
    s_best, sc_best, mx, my, tw, th = fine[i]
    s_ref = s_best
    if 0 < i < len(fine) - 1:
        (s1, c1, *_), (s2, c2, *_), (s3, c3, *_) = fine[i - 1], fine[i], fine[i + 1]
        den = c1 - 2 * c2 + c3
        if abs(den) > 1e-12:
            s_ref = s2 + 0.5 * (c1 - c3) / den * a.fine
    if sc_best >= 0.5:
        cx, cy = mx, my
    rows.append([f, f'{f / 60:.4f}', 1, f'{mx:.2f}', f'{my:.2f}', f'{100 * mx / W:.3f}', f'{100 * my / H:.3f}', f'{s_ref:.5f}', f'{s_best:.4f}', f'{sc_best:.4f}'])
r.close()
out = v.dir / 'scratch' / f'{a.name}.csv'
with open(out, 'w', newline='') as fh:
    wr = csv.writer(fh)
    wr.writerow(['frame', 'time_s', 'unique', 'cx', 'cy', 'cx_pct', 'cy_pct', 'scale', 'scale_grid', 'score'])
    wr.writerows(rows)
print(out)
for rr in rows:
    print(rr[0], rr[3], rr[4], rr[7], rr[9])
