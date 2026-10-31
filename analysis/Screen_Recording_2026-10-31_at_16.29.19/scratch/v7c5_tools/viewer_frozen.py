# P5 class check: does the editor's viewer play footage, or show one frozen picture?
# The camera never rests while the viewer is in frame, so each pair of captured pictures is first put
# into one coordinate frame:
#   (1) "model": the chunk's own zoom about (1799, -113) px with the stored scales (f3600 = 1.0);
#   (2) "ecc":   ECC (affine) registration of the pair on the product-UI chrome and labels only
#                (viewer, level-meter bars, pointer and speaker icon masked out), started from (1).
# Then the mean abs difference (luma) is measured inside the viewer picture (its box mapped from f3600
# coordinates, 6 px inside its edges and the frame edges), on the UI labels (control), and on the viewer
# again with the source moved 2 px (sensitivity: what a 2 px change of the footage would give).
# usage: viewer_frozen.py OUT.csv OUT.jpg
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video, label

out_csv, out_jpg = sys.argv[1], sys.argv[2]
v = get_video('v7')
W, H = 1622, 918
FX, FY = 1799.0, -113.0
# stored scales of the incoming zoom (chunk v7c5, P5 table; f3600 = 1.0)
S = {3581: 0.270, 3584: 0.556, 3586: 0.685, 3589: 0.778, 3591: 0.850, 3594: 0.910, 3596: 0.959,
     3600: 1.000, 3602: 1.034, 3604: 1.063, 3607: 1.089, 3609: 1.109, 3611: 1.127}
# viewer picture box in f3600 coordinates (edges measured on f3581 / f3584 / f3586 / f3600 and mapped)
VB = (-2625.8, 594.4, 229.0, 2201.8)
# UI label boxes in f3600 coordinates (x0, y0, x1, y1): top-bar button label, panel header labels, meter letters
UI = [(892, 340, 1084, 398), (370, 498, 744, 546), (894, 498, 1038, 546), (900, 640, 992, 680)]
METER = (890, 680, 1100, 2000)   # level-meter bars (may move): masked out of the registration

r = WorkReader(v)
G = {}
def img(f):
    if f not in G:
        G[f] = r.read(f).astype(np.float32)
    return G[f]

def fwd(s):
    # f3600 coords -> picture coords at scale s
    return np.array([[s, 0, (1 - s) * FX], [0, s, (1 - s) * FY]], np.float64)

def box_at(b, s):
    x0, y0, x1, y1 = b
    return (FX + s * (x0 - FX), FY + s * (y0 - FY), FX + s * (x1 - FX), FY + s * (y1 - FY))

def rect_mask(b, margin=0):
    m = np.zeros((H, W), bool)
    x0, y0, x1, y1 = b
    xa, ya = max(0, int(np.ceil(x0 + margin))), max(0, int(np.ceil(y0 + margin)))
    xb, yb = min(W, int(np.floor(x1 - margin))), min(H, int(np.floor(y1 - margin)))
    if xb > xa and yb > ya:
        m[ya:yb, xa:xb] = True
    return m

def frame_mask(margin):
    m = np.zeros((H, W), bool)
    m[margin:H - margin, margin:W - margin] = True
    m[837 - 4:905 + 4, 1545 - 4:1613 + 4] = False   # player speaker icon
    return m

def warp_model(src, dst, dx=0.0, dy=0.0):
    k = S[dst] / S[src]
    M = np.array([[k, 0, (1 - k) * FX + dx], [0, k, (1 - k) * FY + dy]], np.float32)
    out = cv2.warpAffine(img(src), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = cv2.warpAffine(np.ones((H, W), np.float32), M, (W, H), flags=cv2.INTER_NEAREST, borderValue=0) > 0.5
    return out, valid, M

def ui_mask_src(src):
    m = np.zeros((H, W), np.uint8)
    s = S[src]
    # window chrome: everything right of the viewer and above the meter, inside the frame
    wx0, wy0, wx1, wy1 = box_at((VB[2] + 10, -2000, 1700, 3000), s)
    m[max(0, int(wy0)):H, max(0, int(wx0)):W] = 1
    for b in [box_at(METER, s), box_at(VB, s)]:
        x0, y0, x1, y1 = b
        m[max(0, int(y0) - 8):max(0, min(H, int(y1) + 8)), max(0, int(x0) - 8):max(0, min(W, int(x1) + 8))] = 0
    m[837 - 10:H, 1545 - 10:W] = 0
    m[:6, :] = 0; m[-6:, :] = 0; m[:, :6] = 0; m[:, -6:] = 0
    return m

def warp_ecc(src, dst):
    k = S[dst] / S[src]
    # ECC: template = dst, input = src; W maps dst coords -> src coords
    Winit = np.array([[1 / k, 0, (1 - 1 / k) * FX], [0, 1 / k, (1 - 1 / k) * FY]], np.float32)
    sc = 0.5
    T = cv2.resize(img(dst), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    I = cv2.resize(img(src), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    Ms = cv2.resize(ui_mask_src(src), None, fx=sc, fy=sc, interpolation=cv2.INTER_NEAREST)
    Wi = Winit.copy(); Wi[:, 2] *= sc
    try:
        cc, Wf = cv2.findTransformECC(T.astype(np.float32), I.astype(np.float32), Wi, cv2.MOTION_AFFINE,
                                      (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7), Ms, 3)
    except cv2.error:
        return None
    Wf[:, 2] /= sc
    out = cv2.warpAffine(img(src), Wf, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = cv2.warpAffine(np.ones((H, W), np.float32), Wf, (W, H), flags=cv2.INTER_NEAREST + cv2.WARP_INVERSE_MAP,
                           borderValue=0) > 0.5
    A = Wf[:, :2].astype(np.float64)
    s_eff = 1.0 / np.sqrt(abs(np.linalg.det(A)))   # src -> dst scale
    return out, valid, cc, s_eff

def stats(wsrc, valid, dst, region):
    m = region & valid & frame_mask(6)
    m &= cv2.erode(valid.astype(np.uint8), np.ones((13, 13), np.uint8)).astype(bool)
    n = int(m.sum())
    if n < 200:
        return None, n, None
    d = np.abs(wsrc[m] - img(dst)[m])
    return float(d.mean()), n, float(img(dst)[m].std())

pairs = [(3581, 3584), (3581, 3589), (3584, 3586), (3584, 3589), (3584, 3596), (3586, 3589), (3586, 3596),
         (3586, 3600), (3589, 3591), (3591, 3594), (3594, 3596), (3596, 3600), (3600, 3602), (3600, 3604),
         (3586, 3611), (3596, 3611), (3604, 3607), (3607, 3609), (3609, 3611)]
rows = []
for a, b in pairs:
    vb = rect_mask(box_at(VB, S[b]), 6)
    ub = np.zeros((H, W), bool)
    for u in UI:
        ub |= rect_mask(box_at(u, S[b]), 0)
    ws, valid, M = warp_model(a, b)
    v_mod, n_v, sd = stats(ws, valid, b, vb)
    u_mod, n_u, _ = stats(ws, valid, b, ub)
    wsx, validx, _ = warp_model(a, b, dx=2.0)
    v_sx, _, _ = stats(wsx, validx, b, vb)
    wsy, validy, _ = warp_model(a, b, dy=2.0)
    v_sy, _, _ = stats(wsy, validy, b, vb)
    # raw (no compensation), same viewer region
    raw = np.abs(img(a) - img(b))[vb & frame_mask(6)]
    v_raw = float(raw.mean()) if raw.size > 200 else None
    e = warp_ecc(a, b)
    if e is not None:
        we, ve, cc, s_eff = e
        v_ecc, n_ve, _ = stats(we, ve, b, vb)
        u_ecc, _, _ = stats(we, ve, b, ub)
    else:
        v_ecc = u_ecc = cc = s_eff = None
    fmt = lambda x: '' if x is None else f'{x:.2f}'
    rows.append([a, b, f'{S[b] / S[a]:.4f}', '' if s_eff is None else f'{s_eff:.4f}', '' if cc is None else f'{cc:.4f}',
                 n_v, fmt(sd), fmt(v_raw), fmt(v_mod), fmt(v_ecc), fmt(u_mod), fmt(u_ecc), fmt(v_sx), fmt(v_sy)])
    print(*rows[-1])

# the rest at the end of the recoil: f3649 -> f3651 / f3654 (camera nearly still), strip at the left edge
for a, b in [(3649, 3651), (3649, 3654), (3646, 3649)]:
    strip = np.zeros((H, W), bool); strip[690:H - 6, 6:60] = True
    d = np.abs(img(a) - img(b))[strip]
    sh = np.abs(np.roll(img(a), 2, axis=1) - img(b))[strip]
    print('rest strip', a, b, f'{d.mean():.2f}', 'shift2', f'{sh.mean():.2f}', 'std', f'{img(b)[strip].std():.1f}')
    rows.append([a, b, 'rest', '', '', int(strip.sum()), f'{img(b)[strip].std():.1f}', f'{d.mean():.2f}', '', '', '', '', f'{sh.mean():.2f}', ''])

with open(out_csv, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['src', 'dst', 'k_model', 'k_ecc', 'ecc_cc', 'viewer_px', 'viewer_std', 'viewer_raw', 'viewer_model',
                'viewer_ecc', 'ui_model', 'ui_ecc', 'viewer_model_dx2', 'viewer_model_dy2'])
    w.writerows(rows)

# scale of a real content change: the same comparison with the source moved 5-80 px along the footage's smear (x)
# and across it (y), in target pixels
sweep_rows = []
for a, b in [(3584, 3586), (3586, 3600), (3584, 3596)]:
    vb = rect_mask(box_at(VB, S[b]), 6)
    vals = []
    for dx, dy in [(0, 0), (5, 0), (10, 0), (20, 0), (40, 0), (80, 0), (0, 5), (0, 10), (0, 20)]:
        ws, valid, _ = warp_model(a, b, dx=dx, dy=dy)
        m, n, _ = stats(ws, valid, b, vb)
        vals.append((dx, dy, m, n))
    print('shift sweep', a, b, ' '.join(f'({dx},{dy}):{m:.2f}' for dx, dy, m, n in vals))
    for dx, dy, m, n in vals:
        sweep_rows.append([a, b, dx, dy, f'{m:.2f}', n])

# f3581 in its own coordinates: later pictures scaled down onto it (anti-aliased), viewer box at s=0.270
def to_3581(src, dx=0.0, dy=0.0):
    k = S[3581] / S[src]
    pre = cv2.GaussianBlur(img(src), (0, 0), 0.5 / k)
    M = np.array([[k, 0, (1 - k) * FX + dx], [0, k, (1 - k) * FY + dy]], np.float32)
    out = cv2.warpAffine(pre, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = cv2.warpAffine(np.ones((H, W), np.float32), M, (W, H), flags=cv2.INTER_NEAREST, borderValue=0) > 0.5
    return out, valid
vb81 = rect_mask(box_at(VB, S[3581]), 3)
for src in [3584, 3586, 3589, 3596]:
    vals = []
    for dx, dy in [(0, 0), (2, 0), (5, 0), (0, 2), (0, 5)]:
        ws, valid = to_3581(src, dx, dy)
        m = vb81 & valid & cv2.erode(valid.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
        d = float(np.abs(ws[m] - img(3581)[m]).mean())
        vals.append((dx, dy, d, int(m.sum())))
    print('onto f3581', src, ' '.join(f'({dx},{dy}):{d:.2f}' for dx, dy, d, n in vals), 'px', vals[0][3])
    for dx, dy, d, n in vals:
        sweep_rows.append([src, 3581, dx, dy, f'{d:.2f}', n])
with open(out_csv.replace('.csv', '_shift.csv'), 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['src', 'dst', 'dx', 'dy', 'viewer_mad', 'viewer_px'])
    w.writerows(sweep_rows)

# evidence sheet: viewer content of f3581 / f3584 / f3596 / f3611 warped into f3586 / f3589 coordinates, with the target
tiles = []
for a, b in [(3581, 3589), (3584, 3586), (3596, 3586), (3584, 3596)]:
    ws, valid, M = warp_model(a, b)
    vb = rect_mask(box_at(VB, S[b]), 0)
    x0, y0, x1, y1 = [int(round(t)) for t in box_at(VB, S[b])]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    # common crop where both are valid
    m = vb & valid
    ys, xs = np.where(m)
    cx0, cx1, cy0, cy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    A_ = np.clip(ws[cy0:cy1, cx0:cx1], 0, 255).astype(np.uint8)
    B_ = img(b)[cy0:cy1, cx0:cx1].astype(np.uint8)
    D_ = np.clip(np.abs(ws[cy0:cy1, cx0:cx1] - img(b)[cy0:cy1, cx0:cx1]) * 4, 0, 255).astype(np.uint8)
    hh = 300
    sc = hh / A_.shape[0]
    rs = lambda x: cv2.resize(x, (max(1, int(x.shape[1] * sc)), hh), interpolation=cv2.INTER_AREA)
    t = np.hstack([label(rs(A_), f'f{a} warped to f{b}', 0.5), np.full((hh, 4), 255, np.uint8),
                   label(rs(B_), f'f{b}', 0.5), np.full((hh, 4), 255, np.uint8), label(rs(D_), 'abs diff x4', 0.5)])
    tiles.append(t)
wmax = max(t.shape[1] for t in tiles)
tiles = [np.hstack([t, np.zeros((t.shape[0], wmax - t.shape[1]), np.uint8)]) for t in tiles]
cv2.imwrite(out_jpg, np.vstack([np.vstack([t, np.full((4, wmax), 255, np.uint8)]) for t in tiles]))
r.close()
print('wrote', out_csv, out_jpg)
