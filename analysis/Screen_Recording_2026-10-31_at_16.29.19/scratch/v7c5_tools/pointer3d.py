# P6 (v7c5): the dark 3D pointer after the file tile settles, every captured picture f3716-f3790.
# (a) dark ink component: pixels with luma < 45 in x 880-1300, y 480-760, connected components; the pointer is
#     the largest component whose pixels lie below the thumbnail's bottom edge (y > 548) or, while it overlaps the
#     thumbnail, the component touching the reference position; centroid, bbox, area.
# (b) masked template match of the pointer cut from f3780 (at rest, sharp; mask = its luma < 45 ink eroded 3 px),
#     squared difference inside the mask, search x 640-1300, y 360-780, scale 1 (the camera is still f3716-f3782).
# usage: pointer3d.py -> scratch/v7c5_p6_pointer3d.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
frames = [f for f in uniq if 3716 <= f <= 3790]
r = WorkReader(v)
X0, Y0, X1, Y1 = 880, 480, 1300, 760
ref = r.read(3780).astype(np.float32)
roi = ref[Y0:Y1, X0:X1]
dark = (roi < 45).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(dark, 8)
k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
x, y, w, h, area = st[k]
pad = 8
tx0, ty0 = X0 + x - pad, Y0 + y - pad
tw, th = w + 2 * pad, h + 2 * pad
T = ref[ty0:ty0 + th, tx0:tx0 + tw].copy()
# mask = the pointer's opaque interior only (ink eroded 3 px), so the background under it (wallpaper, thumbnail) does not count
M = cv2.erode(((ref[ty0:ty0 + th, tx0:tx0 + tw] < 45)).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32)
ref_cx, ref_cy = X0 + cen[k][0], Y0 + cen[k][1]
print(f"reference f3780: pointer ink bbox x {X0 + x}-{X0 + x + w - 1}, y {Y0 + y}-{Y0 + y + h - 1} ({w} x {h} px), area {area}, centroid ({ref_cx:.1f}, {ref_cy:.1f})")
# template centre offset relative to the ink centroid
off_x, off_y = ref_cx - tx0, ref_cy - ty0
SX0, SY0, SX1, SY1 = 640, 360, 1300, 780
rows = []
prev = None
for f in frames:
    g = r.read(f).astype(np.float32)
    if prev is not None and np.abs(g - prev).mean() < 0.05:
        prev = g
        continue
    prev = g
    sub = g[Y0:Y1, X0:X1]
    d = (sub < 45).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(d, 8)
    best = None
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < 300:
            continue
        top = Y0 + st[i, cv2.CC_STAT_TOP]
        if top < 549:  # touches the thumbnail (bottom edge y 545-548)
            continue
        if best is None or a > st[best, cv2.CC_STAT_AREA]:
            best = i
    if best is not None:
        bx, by, bw, bh, ba = st[best]
        icx, icy = X0 + cen[best][0], Y0 + cen[best][1]
        ink = dict(ink_cx=round(icx, 1), ink_cy=round(icy, 1), ink_x0=X0 + bx, ink_x1=X0 + bx + bw - 1, ink_y0=Y0 + by, ink_y1=Y0 + by + bh - 1, ink_area=int(ba))
    else:
        ink = dict(ink_cx='', ink_cy='', ink_x0='', ink_x1='', ink_y0='', ink_y1='', ink_area='')
    S = g[SY0:SY1, SX0:SX1]
    res = cv2.matchTemplate(S, T, cv2.TM_SQDIFF, mask=M)
    mn, _, ml, _ = cv2.minMaxLoc(res)
    # normalised: mean squared difference per masked pixel
    msd = mn / M.sum()
    # sub-pixel parabola
    px, py = ml
    dx = dy = 0.0
    if 0 < px < res.shape[1] - 1:
        l, c, rr = res[py, px - 1], res[py, px], res[py, px + 1]
        den = l - 2 * c + rr
        if den > 1e-9: dx = 0.5 * (l - rr) / den
    if 0 < py < res.shape[0] - 1:
        u, c, dd = res[py - 1, px], res[py, px], res[py + 1, px]
        den = u - 2 * c + dd
        if den > 1e-9: dy = 0.5 * (u - dd) / den
    tcx = SX0 + px + dx + off_x
    tcy = SY0 + py + dy + off_y
    row = dict(frame=f, unique=1, tmpl_cx=round(tcx, 1), tmpl_cy=round(tcy, 1), tmpl_rms=round(float(np.sqrt(msd)), 1), **ink)
    rows.append(row)
    print(row)
out = v.dir / 'scratch' / 'v7c5_p6_pointer3d.csv'
with open(out, 'w', newline='') as fh:
    w_ = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w_.writeheader(); w_.writerows(rows)
print('->', out)
