# P6 (v7c5): position of the dark 3D pointer while it still overlaps the thumbnail (f3726-f3744) and after.
# The pointer's ink (luma < 45) at rest (f3780, x 1070-1228, y 555-698) is shifted over the picture and compared with
# the picture's luma < 45 mask only below the thumbnail's bottom edge (y >= 552, where the background is wallpaper and
# label); the shift with the highest IoU there gives the pointer's full position (ink centroid = rest centroid + shift).
# Fully visible pictures (from f3744) give the same number as the plain ink centroid (check column).
# usage: pointermask.py -> scratch/v7c5_p6_pointer3d_mask.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
frames = [f for f in uniq if 3716 <= f <= 3790]
r = WorkReader(v)
W, H = 1622, 918
ref = r.read(3780).astype(np.float32)
X0, Y0, X1, Y1 = 1040, 530, 1260, 720
roi = (ref[Y0:Y1, X0:X1] < 45).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(roi, 8)
k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
pm = (lab == k)
ys, xs = np.nonzero(pm)
ys = ys + Y0; xs = xs + X0
rcx, rcy = xs.mean(), ys.mean()
VIS = 552
rows = []
prev = None
for f in frames:
    g = r.read(f).astype(np.float32)
    if prev is not None and np.abs(g - prev).mean() < 0.05:
        prev = g
        continue
    prev = g
    obs = (g < 45)
    obs[:VIS, :] = False
    obs[:, :700] = False
    obs[:, 1300:] = False
    best = None
    # coarse then fine search over shifts
    def score(dx, dy):
        x2 = np.round(xs + dx).astype(int); y2 = np.round(ys + dy).astype(int)
        ok = (x2 >= 0) & (x2 < W) & (y2 >= 0) & (y2 < H)
        vis = ok & (y2 >= VIS) & (x2 >= 700) & (x2 < 1300)
        if vis.sum() < 150:
            return -1, 0
        inter = obs[y2[vis], x2[vis]].sum()
        # observed pixels near the predicted pointer (its bbox grown 12 px), so the capsule far right does not count
        bx0, bx1 = int(x2.min()) - 12, int(x2.max()) + 12
        by0, by1 = max(VIS, int(y2.min()) - 12), int(y2.max()) + 12
        o = obs[by0:by1 + 1, max(0, bx0):bx1 + 1].sum()
        union = vis.sum() + o - inter
        return inter / max(1, union), int(vis.sum())
    for dx in range(-420, 41, 6):
        for dy in range(-200, 41, 6):
            s, nv = score(dx, dy)
            if best is None or s > best[0]:
                best = (s, dx, dy, nv)
    _, bx, by, _ = best
    for dx in range(bx - 6, bx + 7):
        for dy in range(by - 6, by + 7):
            s, nv = score(dx, dy)
            if s > best[0]:
                best = (s, dx, dy, nv)
    s, dx, dy, nv = best
    # plain ink centroid where the whole pointer is below the edge
    full = ''
    if f >= 3744:
        sub = (g[VIS:760, 700:1300] < 45).astype(np.uint8)
        n2, lab2, st2, cen2 = cv2.connectedComponentsWithStats(sub, 8)
        k2 = 1 + int(np.argmax(st2[1:, cv2.CC_STAT_AREA]))
        full = f"{700 + cen2[k2][0]:.1f};{VIS + cen2[k2][1]:.1f}"
    rows.append(dict(frame=f, unique=1, cx=round(rcx + dx, 1), cy=round(rcy + dy, 1), shift_x=dx, shift_y=dy, iou=round(s, 3),
                     visible_px=nv, visible_frac=round(nv / len(xs), 2), ink_centroid_check=full))
    print(rows[-1])
out = v.dir / 'scratch' / 'v7c5_p6_pointer3d_mask.csv'
with open(out, 'w', newline='') as fh:
    w_ = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w_.writeheader(); w_.writerows(rows)
print('rest centroid', round(rcx, 1), round(rcy, 1), '->', out)
