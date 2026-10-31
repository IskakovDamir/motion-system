"""Ghost outline grid of P4/P5, re-measured against a ghost-free reference (review fix).

The first version (ghost_diff.py / ghost_track.py) used f2061 as its ghost-free picture, but the
outlines are already there at f2061 (they appear between f2059 and f2061). This version:

P4 (f2054-f2089): difference = picture - f2059 shifted by the window's vertical pan
  (sub-pixel; the window does not move in x, mid_x 840.5-840.75 in v7c3_p4_window.csv).
  - npix_light: pixels at least 12 luma lighter than the shifted reference inside the project
    panel + timeline area (x 470-1600, y 120-905): the ghost layer (outlines + translucent fill).
  - box template: the top-right ghost box cut from the f2076 difference (as before), tracked
    on every difference image -> cx, cy (screen px), cy_win (cy - window pan since f2059).
  - row edges: peaks of the high-passed vertical profile of the difference over the ghost
    columns -> ghost horizontal edges, written relative to the large timecode label
    (label y = window mid_y + 763.5 px, checked at f2041, f2084, f2089).
P5 (f2094-f2114): difference = picture - f2116 (first ghost-free picture) shifted vertically so
  that the timecode label matches (x and scale are constant in the close-up; v7c3_p5_tc.csv);
  same profile peaks, relative to the label, close-up px and P4 px (/ 1.762, the punch-in scale
  measured on the timecode label: 0.5675).
Outputs: scratch/v7c3_p4_ghost_box_r2059.csv, scratch/v7c3_p45_ghost_rows.csv
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2
import numpy as np
from scipy.ndimage import median_filter
from scipy.signal import find_peaks

from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
win = {int(r['frame']): float(r['mid_y']) for r in csv.DictReader(open(base + 'scratch/v7c3_p4_window.csv'))}
tc5 = {int(r['frame']): float(r['cy']) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc.csv'))}
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
SCALE = 1 / 0.5675
REF4 = 2059
REF5 = 2116

v = get_video('v7')
rd = WorkReader(v)


def shift_y(img, dy):
    m = np.float32([[1, 0, 0], [0, 1, dy]])
    return cv2.warpAffine(img, m, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def mid_y(f):
    return win[max(k for k in win if k <= f)]


ref4 = rd.read(REF4).astype(np.float32)


def diff4(f):
    dy = mid_y(f) - mid_y(REF4)
    d = rd.read(f).astype(np.float32) - shift_y(ref4, dy)
    lim = int(918 + min(0.0, dy)) - 6       # rows the shifted reference cannot cover
    d[lim:, :] = 0
    return d, dy


def row_peaks(d, x0, x1, y_lo, y_hi):
    prof = np.clip(d[:, x0:x1], 0, 255).mean(1)
    hp = prof - median_filter(prof, 41)
    hp[:y_lo] = 0
    hp[y_hi:] = 0
    pk, pr = find_peaks(hp, prominence=1.5, distance=10)
    return [(int(p), float(pr['prominences'][i])) for i, p in enumerate(pk)]


# ---- P4: box template + appearance count
p4_frames = [f for f in range(2054, 2090) if uniq.get(f) == '1']
d76, _ = diff4(2076)
d76 = cv2.GaussianBlur(np.clip(d76, 0, 255), (5, 5), 0)
tx, ty, tw, th = 1060, 325, 225, 205
tmpl = d76[ty:ty + th, tx:tx + tw]
box_rows = []
row_rows = []
found = {}
passes = [sorted(f for f in p4_frames if f >= 2076), sorted((f for f in p4_frames if f < 2076), reverse=True)]
for f in [k for p in passes for k in p]:
    if f in (passes[0][0], passes[1][0]):   # each pass starts from the template's own position
        px, py = tx + tw / 2, ty + th / 2
    d, dy = diff4(f)
    light = d[120:905, 470:1600] > 12
    npix = int(light.sum())
    db = cv2.GaussianBlur(np.clip(d, 0, 255), (5, 5), 0)
    pad = 90
    x0 = int(max(0, px - tw / 2 - pad)); y0 = int(max(0, py - th / 2 - pad))
    x1 = int(min(1622, px + tw / 2 + pad)); y1 = int(min(918, py + th / 2 + pad))
    reg = db[y0:y1, x0:x1]
    res = cv2.matchTemplate(reg, tmpl, cv2.TM_CCOEFF_NORMED)
    _, sc, _, loc = cv2.minMaxLoc(res)
    cx, cy = x0 + loc[0] + tw / 2, y0 + loc[1] + th / 2
    if sc > 0.5:
        px, py = cx, cy
    label_y = mid_y(f) + 763.5
    found[f] = [f, uniq[f], round(dy, 2), npix, round(cx, 1), round(cy, 1), round(cy - dy, 1),
                round(100 * cx / 1622, 3), round(100 * cy / 918, 3), round(100 * (cy - dy) / 918, 3),
                round(cy - label_y, 1), round(sc, 3)]
    # row edges over the ghost columns (x range follows the tracked box: 3 columns to its left)
    gx1 = int(min(1600, cx + 105)); gx0 = int(max(470, cx - 105 - 2 * 198))
    for y, prom in row_peaks(d, gx0, gx1, 110, int(918 + min(0.0, dy)) - 8):
        row_rows.append([f, 'P4', round(y, 1), round(y - label_y, 1), round(y - label_y, 1), round(prom, 1)])
for f in sorted(found):
    box_rows.append(found[f])
with open(base + 'scratch/v7c3_p4_ghost_box_r2059.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'win_dy', 'npix_light', 'cx', 'cy', 'cy_win', 'cx_pct', 'cy_pct', 'cy_win_pct', 'cy_rel_label', 'score'])
    w.writerows(box_rows)
for r in box_rows:
    print(r)

# ---- P5: profile peaks against the first ghost-free picture
ref5 = rd.read(REF5).astype(np.float32)
for f in [k for k in range(2091, 2116) if uniq.get(k) == '1']:
    dy = tc5[f] - tc5[REF5]
    d = rd.read(f).astype(np.float32) - shift_y(ref5, dy)
    lo = int(max(0.0, dy)) + 6
    d[:lo, :] = 0
    for y, prom in row_peaks(d, 460, 1500, lo, 905):
        row_rows.append([f, 'P5', round(y, 1), round(y - tc5[f], 1), round((y - tc5[f]) / SCALE, 1), round(prom, 1)])
with open(base + 'scratch/v7c3_p45_ghost_rows.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'segment', 'y_screen', 'rel_label_px_here', 'rel_label_p4px', 'prominence'])
    w.writerows(row_rows)
rd.close()
print('rows written', len(row_rows))
