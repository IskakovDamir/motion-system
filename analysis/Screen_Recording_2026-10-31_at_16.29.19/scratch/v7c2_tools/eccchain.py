# cumulative whole-frame similarity (scale + translation [+ rotation]) between consecutive captured pictures via ECC
import sys, csv, math
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]
roi = [int(t) for t in sys.argv[4].split(',')] if len(sys.argv) > 4 else [0, 0, 1500, 800]
mode = sys.argv[5] if len(sys.argv) > 5 else 'affine'
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
fr = [f for f in uniq if a <= f <= b]
r = WorkReader(v)
x0, y0, w, h = roi
S = 0.5
def prep(g):
    g = g[y0:y0 + h, x0:x0 + w]
    return cv2.resize(g, (int(w * S), int(h * S)), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
prev = None
M = np.eye(3)  # maps first-frame coords -> current-frame coords (in ROI-scaled px)
rows = []
for f in fr:
    g = r.read(f)
    cur = prep(g)
    if prev is not None:
        best = None
        for s0 in (1.0, 1.15, 0.87, 1.35, 0.74):
            cx, cy = cur.shape[1] / 2, cur.shape[0] / 2
            warp = np.array([[s0, 0, (1 - s0) * cx], [0, s0, (1 - s0) * cy]], np.float32)
            for tx in (0.0, 40.0, -40.0):
                ww = warp.copy(); ww[0, 2] += tx
                try:
                    cc, wq = cv2.findTransformECC(prev, cur, ww, cv2.MOTION_AFFINE if mode == 'affine' else cv2.MOTION_EUCLIDEAN,
                                                  (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), None, 5)
                except cv2.error:
                    continue
                if best is None or cc > best[0]:
                    best = (cc, wq)
        cc, wq = best
        W = np.vstack([wq, [0, 0, 1]])
        M = W @ M
        A = W[:2, :2]
        s_step = math.sqrt(abs(np.linalg.det(A))); rot_step = math.degrees(math.atan2(A[1, 0] - A[0, 1], A[0, 0] + A[1, 1]))
    else:
        cc = 1.0; s_step = 1.0; rot_step = 0.0
    A = M[:2, :2]
    s_cum = math.sqrt(abs(np.linalg.det(A))); rot_cum = math.degrees(math.atan2(A[1, 0] - A[0, 1], A[0, 0] + A[1, 1]))
    # where does the first frame's ROI centre land now (in full-res px)
    c0 = np.array([prev.shape[1] / 2 if prev is not None else cur.shape[1] / 2, cur.shape[0] / 2, 1.0])
    c0 = np.array([cur.shape[1] / 2, cur.shape[0] / 2, 1.0])
    p = M @ c0
    px = x0 + p[0] / S; py = y0 + p[1] / S
    rows.append([f, 1, f'{s_cum:.5f}', f'{rot_cum:.3f}', f'{px:.1f}', f'{py:.1f}', f'{s_step:.4f}', f'{rot_step:.3f}', f'{cc:.4f}'])
    prev = cur
r.close()
with open(out, 'w', newline='') as fh:
    wr = csv.writer(fh); wr.writerow(['frame', 'unique', 'scale_cum', 'rot_cum_deg', 'c0_x', 'c0_y', 'scale_step', 'rot_step_deg', 'ecc']); wr.writerows(rows)
for x in rows: print(' '.join(str(t) for t in x))
