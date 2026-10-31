"""Label-aligned vertical luma profiles of the P5 close-up (review fix, evidence image).

One column block (20 px wide) per captured picture f2091-f2120: the mean luma of rows over
x 460-1500 (timeline area), shifted so that the large timecode label (v7c3_p5_tc.csv) sits on
row 300. Lines that belong to the timeline run straight across; the ghost outline edges slant
downward (they move down relative to the timeline) until f2114 and are gone at f2116.
Output: scratch/v7c3_p5_ghost_kymo.png (contrast x4 above luma 10) and scratch/v7c3_p5_profile_peaks.csv
(peaks of the high-passed raw row profile per picture, as offsets from the label: the timeline's own lines
keep constant offsets, the ghost edges grow until f2114 and are absent from f2116).
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2
import numpy as np
from scipy.ndimage import median_filter
from scipy.signal import find_peaks

from common import WorkReader, get_video, label

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
tc = {int(r['frame']): float(r['cy']) for r in csv.DictReader(open(base + 'scratch/v7c3_p5_tc.csv'))}
uniq = [int(r['frame']) for r in csv.DictReader(open(base + 'motion.csv'))
        if r['unique'] == '1' and 2091 <= int(r['frame']) <= 2120]
v = get_video('v7')
rd = WorkReader(v)
OFF, H, W = 300, 1300, 20
img = np.zeros((H, len(uniq) * W), np.uint8)
peak_rows = []
for i, f in enumerate(uniq):
    prof = rd.read(f).astype(np.float32)[:, 460:1500].mean(1)
    hp = prof - median_filter(prof, 31)
    pk, pr = find_peaks(hp, prominence=2.0, distance=8)
    peak_rows.append([f, tc[f], ' '.join(f'{p - tc[f]:+.1f}:{pr["prominences"][j]:.1f}' for j, p in enumerate(pk))])
    col = np.zeros(H)
    sh = int(round(OFF - tc[f]))
    for y in range(len(prof)):
        if 0 <= y + sh < H:
            col[y + sh] = prof[y]
    img[:, i * W:(i + 1) * W] = np.clip((col - 10) * 4, 0, 255)[:, None].astype(np.uint8)
rd.close()
img = cv2.resize(img, (img.shape[1] * 3, H), interpolation=cv2.INTER_NEAREST)
for i, f in enumerate(uniq):
    cv2.putText(img, str(f), (i * W * 3 + 4, 1290 - (i % 2) * 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)
cv2.imwrite(base + 'scratch/v7c3_p5_ghost_kymo.png', img)
with open(base + 'scratch/v7c3_p5_profile_peaks.csv', 'w', newline='') as fh:
    wr = csv.writer(fh)
    wr.writerow(['frame', 'label_cy', 'peaks_rel_label_closeup_px:prominence'])
    wr.writerows(peak_rows)
print(base + 'scratch/v7c3_p5_ghost_kymo.png', uniq)
