"""99.5th percentile of the Sobel gradient magnitude per captured picture in two boxes of S31:
the 2D cursor box (x 820-970, y 470-660) and the file-name label (x 220-780, y 500-680, static,
carried by the camera). Run from scripts/analysis/:
  ../../.venv/bin/python <this file> v7 3826 3870 <out_csv>
"""
import csv
import sys

sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from common import WorkReader, get_video  # noqa: E402

v = get_video(sys.argv[1]); A, B = int(sys.argv[2]), int(sys.argv[3]); out = sys.argv[4]
r = WorkReader(v)
rows, prev = [], None
for f in range(A, B + 1):
    g = r.read(f).astype(np.float32)
    new = prev is None or float(np.abs(g - prev).mean()) > 0.05
    prev = g
    if not new:
        continue
    mag = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))
    rows.append([f, f'{np.percentile(mag[470:660, 820:970], 99.5):.0f}', f'{np.percentile(mag[500:680, 220:780], 99.5):.0f}'])
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'cursor_grad_p995', 'label_grad_p995'])
    w.writerows(rows)
print(out)
