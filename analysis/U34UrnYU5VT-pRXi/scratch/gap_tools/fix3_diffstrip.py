"""Diff strips for the second coverage pass of v2 (scratch/gap_review/fix3_*.jpg).
  python fix3_diffstrip.py <x0> <y0> <w> <h> <frames,comma> <zoom> <gain> <out.jpg> [title]
Top row: the crop of each frame; bottom row: |f - (f-1)| x gain, pixels more than 12 levels apart in red (the scan's threshold).
Frames come from analysis/U34UrnYU5VT-pRXi/source.mp4, decoded with cv2 and converted to gray like coverage_gaps.py."""
import sys
import cv2
import numpy as np

SRC = "/Users/damir/dev/motion-system/analysis/U34UrnYU5VT-pRXi/source.mp4"
x0, y0, w, h = map(int, sys.argv[1:5])
frames = [int(x) for x in sys.argv[5].split(",")]
zoom, gain, out = float(sys.argv[6]), float(sys.argv[7]), sys.argv[8]
title = sys.argv[9] if len(sys.argv) > 9 else ""
need = set(frames) | {f - 1 for f in frames}
cap = cv2.VideoCapture(SRC); F = {}; i = 0
while i <= max(need):
    ok, img = cap.read()
    if not ok:
        break
    if i in need:
        F[i] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16)
    i += 1
tops, bots = [], []
for f in frames:
    c = F[f][y0:y0 + h, x0:x0 + w]
    d = np.abs(F[f] - F[f - 1])[y0:y0 + h, x0:x0 + w]
    top = cv2.cvtColor(c.astype(np.uint8), cv2.COLOR_GRAY2BGR)
    bot = cv2.cvtColor(np.clip(d * gain, 0, 255).astype(np.uint8), cv2.COLOR_GRAY2BGR)
    bot[d > 12] = (0, 0, 255)
    W, H = int(w * zoom), int(h * zoom)
    top = cv2.resize(top, (W, H), interpolation=cv2.INTER_NEAREST)
    bot = cv2.resize(bot, (W, H), interpolation=cv2.INTER_NEAREST)
    for im, lab in ((top, f"f{f}"), (bot, f"|f{f}-f{f-1}| x{gain:g}, red >12: {int((d > 12).sum())} px")):
        cv2.rectangle(im, (0, 0), (min(W, 12 + 9 * len(lab)), 22), (40, 40, 40), -1)
        cv2.putText(im, lab, (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    tops.append(top); bots.append(bot)
def row(ts):
    parts = []
    for t in ts:
        parts += [t, np.full((t.shape[0], 4, 3), 90, np.uint8)]
    return np.hstack(parts[:-1])
img = np.vstack([row(tops), np.full((4, row(tops).shape[1], 3), 90, np.uint8), row(bots)])
if title:
    bar = np.full((28, img.shape[1], 3), 30, np.uint8)
    cv2.putText(bar, title, (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    img = np.vstack([bar, img])
cv2.imwrite(out, img, [cv2.IMWRITE_JPEG_QUALITY, 92])
print(out, img.shape)
