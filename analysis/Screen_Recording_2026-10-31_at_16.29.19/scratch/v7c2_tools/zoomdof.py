# Is the f746-f766 footage zoom a post scale of the f741 picture?
# 1) maps a background step edge of f741 through the measured zoom (scratch/v7c2_zoom_ecc.csv chain)
#    and measures its 10-90% width along the mapped edge normal in every captured picture;
#    a post scale can only multiply the f741 width by the scale (width / scale stays ~constant);
# 2) whole-frame mean gradient and strongest gradients (top 680 rows, no overlays) of each picture vs the f741 picture
#    warped by the same transform (bicubic upscale); a blur added to the whole layer would cap the strongest gradients.
# usage: zoomdof.py  -> prints a table, writes scratch/v7c2_zoom_dof.csv
import sys, csv, math
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
chain = {int(r['frame']): r for r in csv.DictReader(open(v.dir / 'scratch' / 'v7c2_zoom_ecc.csv'))}
REF = 741
def T(f):
    """2x3 map f734-coords -> frame f coords (chain: p' = c0 + s R (p - (750, 380)))."""
    r = chain[f]; s = float(r['scale_cum']); th = math.radians(float(r['rot_cum_deg']))
    c0 = np.array([float(r['c0_x']), float(r['c0_y'])])
    A = s * np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    b = c0 - A @ np.array([750.0, 380.0])
    return np.hstack([A, b[:, None]])
def compose_ref_to(f):
    """map f741 coords -> frame f coords."""
    Tr = np.vstack([T(REF), [0, 0, 1]]); Tf = np.vstack([T(f), [0, 0, 1]])
    return (Tf @ np.linalg.inv(Tr))[:2]
def width_1090(prof, step=0.25):
    """10-90% rise width in px of f741 (profile sampled every `step` px)."""
    a, b = prof[:4].mean(), prof[-4:].mean()
    if abs(b - a) < 8:
        return None
    l10, l90 = a + 0.1 * (b - a), a + 0.9 * (b - a)
    sg = 1 if b > a else -1
    def cross(L):
        for i in range(len(prof) - 1):
            p, q = (prof[i] - L) * sg, (prof[i + 1] - L) * sg
            if p < 0 <= q:
                return i + (L - prof[i]) / (prof[i + 1] - prof[i])
        return None
    c10, c90 = cross(l10), cross(l90)
    return None if c10 is None or c90 is None else abs(c90 - c10) * step
# edge: f741 step at y ~373 over x 900-960 (bright above, dark below)
EX0, EX1, EY, HALF = 900.0, 960.0, 373.0, 18.0
r = WorkReader(v)
ref = r.read(REF).astype(np.float32)
rows = []
prev = None
for f in sorted(chain):
    if f < REF:
        continue
    g = r.read(f).astype(np.float32)
    M = compose_ref_to(f)
    s = math.sqrt(abs(np.linalg.det(M[:, :2])))
    # sample the edge in f741 coordinates by inverse-mapping a fine grid (keeps the profile in f741 units)
    ys = np.arange(EY - HALF, EY + HALF + 0.001, 0.25)
    xs = np.arange(EX0, EX1 + 0.001, 1.0)
    X, Y = np.meshgrid(xs, ys)
    P = M @ np.vstack([X.ravel(), Y.ravel(), np.ones(X.size)])
    mx = P[0].reshape(X.shape).astype(np.float32); my = P[1].reshape(X.shape).astype(np.float32)
    inside = (mx >= 0) & (mx < g.shape[1] - 1) & (my >= 0) & (my < g.shape[0] - 1)
    samp = cv2.remap(g, mx, my, cv2.INTER_LINEAR)
    samp[~inside] = np.nan
    prof = np.nanmean(samp, axis=1)
    w_ref_units = width_1090(prof) if np.isfinite(prof).all() else None
    w_screen = None if w_ref_units is None else w_ref_units * s
    # whole-frame mean gradient (top 680 rows: no caption, badge or speaker icon) vs the f741 picture warped by M
    up = cv2.warpAffine(ref, M.astype(np.float32), (g.shape[1], g.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    def mg(im):
        gx = cv2.Sobel(im, cv2.CV_32F, 1, 0, ksize=3) / 8.0; gy = cv2.Sobel(im, cv2.CV_32F, 0, 1, ksize=3) / 8.0
        return float(np.mean(np.hypot(gx, gy)[:680]))
    def strong(im):
        # strongest gradients (luma per px) after a sigma-1 Gaussian (suppresses single-pixel grain): p99.9 and max
        gs = cv2.GaussianBlur(im[:680], (0, 0), 1.0)
        m = np.hypot(cv2.Sobel(gs, cv2.CV_32F, 1, 0, ksize=3) / 8.0, cv2.Sobel(gs, cv2.CV_32F, 0, 1, ksize=3) / 8.0)
        return f'{np.percentile(m, 99.9):.1f}/{m.max():.1f}'
    fp = ''
    if prev is not None:
        Mp = np.vstack([compose_ref_to(prev), [0, 0, 1]]); Mc = np.vstack([M, [0, 0, 1]])
        St = (Mc @ np.linalg.inv(Mp))[:2]
        if abs(np.linalg.det(St[:, :2]) - 1) > 0.02:
            fx = np.linalg.solve(np.eye(2) - St[:, :2], St[:, 2])
            fp = f'{100 * fx[0] / g.shape[1]:.1f}/{100 * fx[1] / g.shape[0]:.1f}'
    prev = f
    rows.append([f, round(s, 3), None if w_ref_units is None else round(w_ref_units, 2),
                 None if w_screen is None else round(w_screen, 1), round(mg(g), 2), round(mg(up), 2), strong(g), strong(up), fp])
r.close()
with open(v.dir / 'scratch' / 'v7c2_zoom_dof.csv', 'w', newline='') as fh:
    wr = csv.writer(fh); wr.writerow(['frame', 'scale', 'edge_w1090_f741px', 'edge_w1090_screen_px', 'meangrad_actual', 'meangrad_f741_upscaled', 'grad_p999_max_actual', 'grad_p999_max_f741_upscaled', 'step_fixed_point_pctW_pctH'])
    wr.writerows(rows)
print('frame scale | edge 10-90% width in f741 px (screen px) | mean gradient actual vs f741 warped | strongest gradients p99.9/max actual vs f741 warped | step fixed point %W/%H')
for x in rows:
    print(*x)
