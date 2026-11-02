"""Brand-mark stroke inside the S01 / S36 title label: light-ink mask, area, bbox, skeleton path length
and stroke width per captured picture.

  ../../.venv/bin/python <this file> <v> <A> <B> <x> <y> <w> <h> <thresh> <out_csv>   (run from scripts/analysis/)

The mask is pixels lighter than the ROI's box fill (median of the ROI) by more than <thresh> luma, the
largest 8-connected component kept with every component of >= 15 px; skeleton = Zhang-Suen thinning;
path length = skeleton pixels (8-connected steps, diagonal steps counted sqrt 2); stroke width =
area / path length. Duplicate captures are flagged unique 0 (motion.csv) and still measured.
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402


def zhang_suen(img):
    im = (img > 0).astype(np.uint8).copy()
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            p = np.pad(im, 1)
            P2, P3, P4 = p[:-2, 1:-1], p[:-2, 2:], p[1:-1, 2:]
            P5, P6, P7 = p[2:, 2:], p[2:, 1:-1], p[2:, :-2]
            P8, P9 = p[1:-1, :-2], p[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(int) for n in nb)
            seq = nb + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                c = (P2 * P4 * P6 == 0) & (P4 * P6 * P8 == 0)
            else:
                c = (P2 * P4 * P8 == 0) & (P2 * P6 * P8 == 0)
            m = (im == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if m.any():
                im[m] = 0
                changed = True
    return im


def path_length(sk):
    ys, xs = np.nonzero(sk)
    pts = set(zip(ys.tolist(), xs.tolist()))
    L = 0.0
    for y, x in pts:  # each edge counted from both ends -> halve
        for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            if (y + dy, x + dx) in pts:
                L += 0.5
        for dy, dx in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
            if (y + dy, x + dx) in pts and (y + dy, x) not in pts and (y, x + dx) not in pts:
                L += 0.5 * 2 ** 0.5
    return L


v = get_video(sys.argv[1])
A, B, x, y, w, h, th = (int(s) for s in sys.argv[2:9])
out = sys.argv[9]
uniq = set()
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    if r['unique'] == '1':
        uniq.add(int(r['frame']))
rd = WorkReader(v)
rows = []
for f in range(A, B + 1):
    g = rd.read(f)[y:y + h, x:x + w].astype(np.int16)
    fill = float(np.median(g))
    m = (g - fill > th).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 15:
            keep[lab == i] = 1
    area = int(keep.sum())
    if area == 0:
        rows.append([f, int(f in uniq), f'{fill:.1f}', 0, '', '', '', '', '', '', ''])
        continue
    ys, xs = np.nonzero(keep)
    sk = zhang_suen(keep)
    L = path_length(sk)
    rows.append([f, int(f in uniq), f'{fill:.1f}', area, xs.min() + x, ys.min() + y, xs.max() + x, ys.max() + y,
                 int(sk.sum()), f'{L:.1f}', f'{area / L:.2f}' if L else ''])
rd.close()
with open(out, 'w', newline='') as fh:
    wr = csv.writer(fh)
    wr.writerow(['frame', 'unique', 'fill_luma', 'area', 'x0', 'y0', 'x1', 'y1', 'skeleton_px', 'path_len_px', 'stroke_w_px'])
    wr.writerows(rows)
print(out)
