# P5 class check, second part: the viewer strip that returns at the left edge during the recoil and the
# push-out (f3631-f3670) against the viewer as it was before it left the frame (f3600 / f3604 / f3609).
# Each pair is registered with ECC (affine) on the product UI (panel header labels, window edges and backdrop;
# the viewer, the top bar with the lit button and the pointer, the level-meter bars and the speaker icon
# masked out), then the mean abs difference (luma) is measured on the viewer strip, plus the same with the
# source moved by 5 / 10 px (what a small change of the picture would give).
# usage: viewer_frozen2.py OUT.csv
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video

out_csv = sys.argv[1]
v = get_video('v7')
W, H = 1622, 918
r = WorkReader(v)
G = {}
def img(f):
    if f not in G:
        G[f] = r.read(f).astype(np.float32)
    return G[f]

def viewer_right_edge(f):
    # the viewer picture's right edge: largest luma drop along a row band near the bottom of the frame
    g = img(f)
    col = g[700:900, 0:400].mean(axis=0)
    d = np.diff(col)
    i = int(np.argmin(d))
    return i + 0.5, float(d[i])

LAB = {int(row['frame']): (float(row['cx']), float(row['cy']), float(row['scale']))
       for row in csv.DictReader(open(v.dir / 'scratch' / 'v7c5_p5_label_fine.csv'))}
MASTER_Y = {f: t[1] for f, t in LAB.items()}

def reg_mask(f):
    m = np.zeros((H, W), np.uint8)
    xr, _ = viewer_right_edge(f)
    m[:, int(xr) + 40:] = 1                 # right of the viewer
    m[:, 1100:] = 0                          # meter bars, pointer path, lit button and its glow
    # top bar (the button lights and its glow spreads along the bar): keep only rows from just above the
    # panel header labels (label centre from scratch/v7c5_p5_label_fine.csv)
    m[:int(MASTER_Y[f] - 45), :] = 0
    m[837 - 10:, 1545 - 10:] = 0
    m[:6, :] = 0; m[-6:, :] = 0; m[:, :6] = 0; m[:, -6:] = 0
    return m

def register(src, dst):
    sc = 0.5
    T = cv2.resize(img(dst), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    I = cv2.resize(img(src), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    Ms = cv2.resize(reg_mask(src), None, fx=sc, fy=sc, interpolation=cv2.INTER_NEAREST)
    best = None
    # start from the tracked panel label (centre and scale, scratch/v7c5_p5_label_fine.csv): dst -> src
    (csx, csy, ss), (cdx, cdy, sd) = LAB[src], LAB[dst]
    k0 = ss / sd
    inits = [np.array([[k0, 0, sc * (csx - k0 * cdx)], [0, k0, sc * (csy - k0 * cdy)]], np.float32)]
    for s0 in [1.0, 0.97, 1.03]:
        inits.append(np.array([[s0, 0, (1 - s0) * T.shape[1] / 2], [0, s0, (1 - s0) * T.shape[0] / 2]], np.float32))
    for Wi in inits:
        try:
            cc, Wf = cv2.findTransformECC(T.astype(np.float32), I.astype(np.float32), Wi, cv2.MOTION_AFFINE,
                                          (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), Ms, 3)
        except cv2.error:
            continue
        if best is None or cc > best[0]:
            best = (cc, Wf)
    cc, Wf = best
    Wf = Wf.copy(); Wf[:, 2] /= sc
    return cc, Wf

def warped(src, Wf, dx=0.0, dy=0.0):
    Wd = Wf.copy().astype(np.float32)
    # move the source picture by (dx, dy) target px: sample src at W(x - d)
    Wd[:, 2] -= Wd[:, :2] @ np.array([dx, dy], np.float32)
    out = cv2.warpAffine(img(src), Wd, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = cv2.warpAffine(np.ones((H, W), np.float32), Wd, (W, H), flags=cv2.INTER_NEAREST + cv2.WARP_INVERSE_MAP,
                           borderValue=0) > 0.5
    return out, valid

def strip_mask(dst, src_edge_in_dst):
    xr, _ = viewer_right_edge(dst)
    x1 = int(min(xr, src_edge_in_dst)) - 6
    m = np.zeros((H, W), bool)
    # viewer picture top edge sits about 0.66 H at these zooms; use the lower part only
    m[700:H - 6, 6:max(6, x1)] = True
    m[837 - 4:905 + 4, 1545 - 4:1613 + 4] = False
    return m

pairs = [(3600, 3649), (3604, 3649), (3609, 3649), (3600, 3654), (3600, 3644), (3600, 3639), (3600, 3659),
         (3644, 3649), (3649, 3654), (3649, 3659), (3654, 3661), (3649, 3664), (3659, 3666), (3664, 3670)]
rows = []
for a, b in pairs:
    cc, Wf = register(a, b)
    A = Wf[:, :2]
    s = 1.0 / np.sqrt(abs(np.linalg.det(A)))    # src -> dst scale
    xa, _ = viewer_right_edge(a)
    # src viewer edge mapped into dst coords: x_dst solves W(x_dst) = x_src (row y = 800)
    Ainv = np.linalg.inv(np.vstack([Wf, [0, 0, 1]]))
    edge_dst = (Ainv @ np.array([xa, 800, 1.0]))[0]
    m = strip_mask(b, edge_dst)
    vals = []
    for dx, dy in [(0, 0), (5, 0), (10, 0), (0, 5), (0, 10)]:
        ws, valid = warped(a, Wf, dx, dy)
        mm = m & valid & cv2.erode(valid.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        n = int(mm.sum())
        vals.append(float(np.abs(ws[mm] - img(b)[mm]).mean()) if n > 100 else float('nan'))
    raw = float(np.abs(img(a) - img(b))[m].mean()) if m.sum() > 100 else float('nan')
    xb, _ = viewer_right_edge(b)
    rows.append([a, b, f'{cc:.4f}', f'{s:.4f}', f'{xa:.1f}', f'{edge_dst:.1f}', f'{xb:.1f}', n, f'{img(b)[m].std():.1f}',
                 f'{raw:.2f}'] + [f'{x:.2f}' for x in vals])
    print(*rows[-1])
with open(out_csv, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['src', 'dst', 'ecc_cc', 'scale_src_to_dst', 'viewer_edge_src', 'viewer_edge_src_in_dst', 'viewer_edge_dst',
                'strip_px', 'strip_std', 'strip_raw', 'strip_registered', 'shift_x5', 'shift_x10', 'shift_y5', 'shift_y10'])
    w.writerows(rows)
r.close()
print('wrote', out_csv)
