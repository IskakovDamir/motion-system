"""Find lattice node badges at f209 (settled lattice): white badge components (>= 250) and dark glyph blobs."""
import sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2, numpy as np
from common import WorkReader, get_video
v = get_video("v3")
r = WorkReader(v)
g = r.read(209)
r.close()
print("bg median", np.median(g))
# badges: white >= 250
m = (g >= 250).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
rows = []
for i in range(1, n):
    x, y, w, h, a = st[i]
    if a < 1500 or w > 200 or h > 200:
        continue
    rows.append((cen[i][1], cen[i][0], x, y, w, h, a))
rows.sort()
for cy, cx, x, y, w, h, a in rows:
    print(f"badge c=({cx:7.1f},{cy:6.1f}) box x{x}-{x+w-1} y{y}-{y+h-1} {w}x{h} area {a}")
print(len(rows))
