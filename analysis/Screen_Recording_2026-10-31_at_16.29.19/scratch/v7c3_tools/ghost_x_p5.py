"""x of the ghost boxes' vertical edges in the P5 close-up (review fix): picture minus f2116 (the first
ghost-free picture) shifted to the timecode label (x and scale are constant in the close-up), column
profile over the middle ghost row (label - 40 .. label + 120 px), high-passed, peaks.
Output: scratch/v7c3_p5_ghost_x.csv (frame, label_cx, peaks as x:prominence)."""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2
import numpy as np
from scipy.ndimage import median_filter
from scipy.signal import find_peaks

from common import WorkReader, get_video

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
tc5 = {int(r['frame']): (float(r['cx']), float(r['cy'])) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc.csv'))}
uniq = {int(r['frame']): r['unique'] for r in csv.DictReader(open(base + 'motion.csv'))}
v = get_video('v7')
rd = WorkReader(v)


def shift_y(img, dy):
    m = np.float32([[1, 0, 0], [0, 1, dy]])
    return cv2.warpAffine(img, m, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


ref = rd.read(2116).astype(np.float32)
rows = []
for f in [k for k in range(2094, 2116) if uniq.get(k) == '1']:
    dy = tc5[f][1] - tc5[2116][1]
    d = rd.read(f).astype(np.float32) - shift_y(ref, dy)
    y0, y1 = max(0, int(tc5[f][1] - 40)), min(905, int(tc5[f][1] + 120))
    prof = np.clip(d[y0:y1, 450:1600], 0, 255).mean(0)
    hp = prof - median_filter(prof, 41)
    pk, pr = find_peaks(hp, prominence=3, distance=10)
    peaks = [f'{int(p) + 450}:{pr["prominences"][i]:.1f}' for i, p in enumerate(pk) if pr['prominences'][i] >= 15]
    rows.append([f, tc5[f][0], ' '.join(peaks)])
rd.close()
with open(base + 'scratch/v7c3_p5_ghost_x.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'label_cx', 'edge_x_peaks'])
    w.writerows(rows)
for r in rows:
    print(*r)
