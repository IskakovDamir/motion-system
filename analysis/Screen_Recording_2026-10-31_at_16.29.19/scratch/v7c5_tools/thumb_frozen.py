# P6 class check: does the file tile's thumbnail play footage, or show one frozen picture?
# (1) camera still (f3729-f3782): thumbnail interior of every captured picture against f3741 (x 600-1020, y 260-500;
#     the 3D pointer is below y 530 from f3741) and its left part against f3729 (x 560-790, y 250-500, never under
#     the pointer), with a label control (x 590-780, y 585-710) and NCC template matches (+-12 px search);
# (2) push-in (f3783-f3870): every captured picture registered to f3741 by ECC (affine) on the wallpaper, the
#     thumbnail's outer edges and the left part of the label (thumbnail interior, pointer / capsule / cursor area and
#     speaker icon masked out), then brought into f3741's coordinates (anti-aliased) and compared on the thumbnail
#     interior, also with the picture moved 2 / 5 / 10 px (what a small change of the footage would give);
# (3) the tile's entry (f3711-f3726): NCC of the f3729 thumbnail-left template.
# usage: thumb_frozen.py OUT.csv OUT.jpg
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video, label

out_csv, out_jpg = sys.argv[1], sys.argv[2]
v = get_video('v7')
W, H = 1622, 918
r = WorkReader(v)
G = {}
def img(f):
    if f not in G:
        G[f] = r.read(f).astype(np.float32)
    return G[f]

def box(x0, y0, x1, y1):
    m = np.zeros((H, W), bool); m[y0:y1, x0:x1] = True; return m

TH = box(600, 260, 1020, 500)      # thumbnail interior (pointer-free from f3741)
THL = box(560, 250, 790, 500)      # thumbnail left interior (pointer-free from f3726)
LABC = box(590, 585, 780, 710)     # label, left part (pointer-free)
pictures = []
prev = None
for f in range(3711, 3871):
    g = img(f)
    if prev is None or np.abs(g - prev).mean() > 0.02:
        pictures.append(f)
    prev = g

rows = []
def mad(a, b, m):
    return float(np.abs(img(a)[m] - img(b)[m]).mean())

# (1) camera still
print('still part: frame  TH_vs3741  THL_vs3729  LAB_vs3729  THL_consecutive')
last = None
for f in [p for p in pictures if 3726 <= p <= 3782]:
    th = mad(f, 3741, TH) if f >= 3741 else None
    thl = mad(f, 3729, THL)
    lab = mad(f, 3729, LABC)
    cons = mad(f, last, THL) if last is not None else None
    rows.append(['still', f, '' if th is None else f'{th:.2f}', f'{thl:.2f}', f'{lab:.2f}', '' if cons is None else f'{cons:.2f}',
                 '', '', '', '', '', ''])
    print(*rows[-1][1:6])
    last = f
print('std TH f3741', f'{img(3741)[TH].std():.1f}', 'THL f3729', f'{img(3729)[THL].std():.1f}')

def ncc(tf, tbox, f, pad=12):
    x0, y0, x1, y1 = tbox
    t = img(tf)[y0:y1, x0:x1]
    s = img(f)[y0 - pad:y1 + pad, x0 - pad:x1 + pad]
    res = cv2.matchTemplate(s, t, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    return mx, loc[0] - pad, loc[1] - pad
for f in [3731, 3741, 3751, 3761, 3771, 3781]:
    mx, dx, dy = ncc(3729, (560, 250, 790, 500), f)
    mx2, dx2, dy2 = ncc(3741, (600, 260, 1020, 500), f) if f >= 3741 else (float('nan'), 0, 0)
    print('ncc', f, f'{mx:.4f}', dx, dy, '| TH f3741', f'{mx2:.4f}', dx2, dy2)
    rows.append(['ncc', f, f'{mx:.4f}', dx, dy, f'{mx2:.4f}', dx2, dy2, '', '', '', ''])

# (2) push-in: register each picture to f3741
A = 3741
regmask = np.ones((H, W), np.uint8)
regmask[238:537, 540:1082] = 0         # thumbnail interior
regmask[500:840, 840:1600] = 0         # pointer, capsule, 2D cursor area
regmask[837 - 10:, 1545 - 10:] = 0     # speaker icon
regmask[:6, :] = 0; regmask[-6:, :] = 0; regmask[:, :6] = 0; regmask[:, -6:] = 0
FXP, FYP = 2315.0, 992.0
def register(B, s0):
    sc = 0.5
    T = cv2.resize(img(B), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    I = cv2.resize(img(A), None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) / 255.0
    Ms = cv2.resize(regmask, None, fx=sc, fy=sc, interpolation=cv2.INTER_NEAREST)
    k = 1.0 / s0     # B coords -> A coords, about the push-in's fixed point
    Wi = np.array([[k, 0, sc * (1 - k) * FXP], [0, k, sc * (1 - k) * FYP]], np.float32)
    cc, Wf = cv2.findTransformECC(T.astype(np.float32), I.astype(np.float32), Wi, cv2.MOTION_AFFINE,
                                  (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7), Ms, 3)
    Wf = Wf.copy(); Wf[:, 2] /= sc
    return cc, Wf          # A(Wf x) ~ B(x)
def b_in_a(B, Wf, dx=0.0, dy=0.0):
    s = 1.0 / np.sqrt(abs(np.linalg.det(Wf[:, :2])))      # A -> B scale
    pre = cv2.GaussianBlur(img(B), (0, 0), max(0.01, 0.5 * (s - 1))) if s > 1.02 else img(B)
    M = Wf.copy().astype(np.float32); M[:, 2] += np.array([dx, dy], np.float32)
    out = cv2.warpAffine(pre, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    valid = cv2.warpAffine(np.ones((H, W), np.float32), M, (W, H), flags=cv2.INTER_NEAREST, borderValue=0) > 0.5
    return out, valid, s
scale0 = {int(rw['frame']): float(rw['scale']) for rw in csv.DictReader(open(v.dir / 'scratch' / 'v7c5_p6_pushin.csv'))}
print('push-in: frame cc scale TH LAB TH_dx2 TH_dx5 TH_dx10 TH_dy5')
evid = {}
s_prev = 1.0
for f in [p for p in pictures if 3783 <= p <= 3870]:
    s0 = scale0.get(f, s_prev)      # pictures missing from the push-in track start from the previous scale
    cc, Wf = register(f, s0)
    s_prev = 1.0 / np.sqrt(abs(np.linalg.det(Wf[:, :2])))
    vals = []
    for dx, dy in [(0, 0), (2, 0), (5, 0), (10, 0), (0, 5)]:
        out, valid, s = b_in_a(f, Wf, dx, dy)
        m = TH & valid
        vals.append(float(np.abs(out[m] - img(A)[m]).mean()))
    out, valid, s = b_in_a(f, Wf)
    labd = float(np.abs(out[LABC & valid] - img(A)[LABC & valid]).mean())
    rows.append(['push', f, f'{cc:.4f}', f'{s:.4f}', f'{vals[0]:.2f}', f'{labd:.2f}'] + [f'{x:.2f}' for x in vals[1:]] + [''])
    print(*rows[-1][1:])
    if f in (3866,):
        evid[f] = out
# direction of the review (f3741 brought up onto f3866, upscaled): thumbnail interior in f3866 coordinates
cc, Wf = register(3866, 1.209)
up = cv2.warpAffine(img(A), Wf, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
Minv = cv2.invertAffineTransform(Wf)
thB = cv2.warpAffine(TH.astype(np.uint8), Minv, (W, H), flags=cv2.INTER_NEAREST) > 0
d_up = float(np.abs(up[thB] - img(3866)[thB]).mean())
print('f3741 upscaled onto f3866: TH', f'{d_up:.2f}', 'px', int(thB.sum()), 'std', f'{img(3866)[thB].std():.1f}')
rows.append(['up3866', 3866, f'{cc:.4f}', '', f'{d_up:.2f}', '', '', '', '', '', '', ''])

# rest after the push-in
for a, b in [(3861, 3864), (3861, 3866), (3861, 3870)]:
    thr = box(170, 80, 820, 440)    # thumbnail interior at the pushed-in rest
    d = mad(a, b, thr)
    print('rest after push-in', a, b, f'{d:.2f}')
    rows.append(['rest', a, b, f'{d:.2f}', '', '', '', '', '', '', '', ''])

# (3) entry
for f in [p for p in pictures if 3711 <= p <= 3729]:
    x0, y0, x1, y1 = 560, 250, 790, 500
    t = img(3729)[y0:y1, x0:x1]
    res = cv2.matchTemplate(img(f)[150:650, 0:1100], t, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    print('entry ncc', f, f'{mx:.3f}', 'at', loc[0] - x0, loc[1] + 150 - y0)
    rows.append(['entry', f, f'{mx:.3f}', loc[0] - x0, loc[1] + 150 - y0, '', '', '', '', '', '', ''])

with open(out_csv, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['part', 'frame', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'])
    w.writerows(rows)

# evidence: thumbnail interior f3741 / f3761 / f3781 (camera still) and f3866 brought back to f3741 coordinates
tiles = []
for f, im in [(3741, img(3741)), (3761, img(3761)), (3781, img(3781)), (3866, evid[3866])]:
    c = np.clip(im[250:510, 590:1030], 0, 255).astype(np.uint8)
    tiles.append(label(c, f'f{f}' + (' (pushed-in, registered back)' if f == 3866 else ''), 0.5))
d = np.clip(np.abs(evid[3866][250:510, 590:1030] - img(3741)[250:510, 590:1030]) * 4, 0, 255).astype(np.uint8)
tiles.append(label(d, 'abs diff f3866 vs f3741 x4', 0.5))
d2 = np.clip(np.abs(img(3781)[250:510, 590:1030] - img(3741)[250:510, 590:1030]) * 4, 0, 255).astype(np.uint8)
tiles.append(label(d2, 'abs diff f3781 vs f3741 x4', 0.5))
sep = np.full((260, 4), 255, np.uint8)
row1 = np.hstack([tiles[0], sep, tiles[1], sep, tiles[2]])
row2 = np.hstack([tiles[3], sep, tiles[4], sep, tiles[5]])
cv2.imwrite(out_jpg, np.vstack([row1, np.full((4, row1.shape[1]), 255, np.uint8), row2]))
r.close()
print('wrote', out_csv, out_jpg)
