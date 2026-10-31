# Register every captured picture of a range to one reference picture with ECC (affine), masking out regions.
# usage: eccref.py A B REF out.csv [--mask x,y,w,h ...] [--init chain.csv col] ; scale = sqrt(det(A)) of ref->frame
import sys, csv, math, argparse
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
ap = argparse.ArgumentParser()
ap.add_argument('a', type=int); ap.add_argument('b', type=int); ap.add_argument('ref', type=int); ap.add_argument('out')
ap.add_argument('--mask', nargs='*', default=[])
ap.add_argument('--s0', type=float, nargs='*', help='initial scale guesses (ref->frame)')
ap.add_argument('--S', type=float, default=0.5)
a = ap.parse_args()
v = get_video('v7')
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
fr = [f for f in uniq if a.a <= f <= a.b]
r = WorkReader(v)
S = a.S
def prep(g):
    g = g[:, :1540]  # drop the speaker-icon column band
    return cv2.resize(g, (int(g.shape[1] * S), int(g.shape[0] * S)), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
ref = prep(r.read(a.ref))
mask = np.ones(ref.shape, np.uint8)
for m in a.mask:
    x, y, w, h = [int(t) for t in m.split(',')]
    mask[int(y * S):int((y + h) * S), int(x * S):int((x + w) * S)] = 0
H, W = ref.shape
cx, cy = W / 2, H / 2
rows = []
prev_warp = None
prev = None
for f in fr:
    g0 = r.read(f)
    cur = prep(g0)
    if prev is not None and np.abs(cur - prev).mean() < 0.0002:
        prev = cur; continue
    prev = cur
    best = None
    guesses = list(a.s0 or [1.0])
    inits = []
    if prev_warp is not None: inits.append(prev_warp.copy())
    for s0 in guesses:
        inits.append(np.array([[s0, 0, (1 - s0) * cx], [0, s0, (1 - s0) * cy]], np.float32))
    for w0 in inits:
        try:
            cc, wq = cv2.findTransformECC(ref, cur, w0, cv2.MOTION_AFFINE,
                                          (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-7), mask, 5)
        except cv2.error:
            continue
        if best is None or cc > best[0]:
            best = (cc, wq)
    if best is None:
        rows.append([f, 1, '', '', '', '', '']); continue
    cc, wq = best
    prev_warp = wq.copy()
    A = wq[:, :2]
    s = math.sqrt(abs(np.linalg.det(A))); rot = math.degrees(math.atan2(A[1, 0] - A[0, 1], A[0, 0] + A[1, 1]))
    # fixed point of the map ref->frame (in full-res px): solve (I - A) p = t
    try:
        p = np.linalg.solve(np.eye(2) - A, wq[:, 2])
        fx, fy = p[0] / S, p[1] / S
    except np.linalg.LinAlgError:
        fx = fy = float('nan')
    rows.append([f, 1, f'{s:.5f}', f'{rot:.3f}', f'{fx:.1f}', f'{fy:.1f}', f'{cc:.4f}'])
r.close()
with open(a.out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'scale_ref_to_frame', 'rot_deg', 'fixed_x', 'fixed_y', 'ecc']); w.writerows(rows)
for x in rows: print(*x)
