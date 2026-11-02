"""Voice-badge level bars per captured picture (S32): white-pixel count (luma > 190) and the per-column
white heights inside the badge disc (centre 809, 744 px, radius 22 px), plus the mean abs difference of
the disc interior to the previous captured picture. Writes scratch/gap_review/s32_badge_bars.csv.
"""
import csv
import sys

import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import WorkReader, get_video  # noqa: E402

v = get_video("v7")
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
A, B = int(sys.argv[1]), int(sys.argv[2])
rd = WorkReader(v)
cx, cy, R = 809, 744, 22
yy, xx = np.mgrid[cy - R:cy + R + 1, cx - R:cx + R + 1]
disc = (xx - cx) ** 2 + (yy - cy) ** 2 <= R * R
rows, prev = [], None
for f in [u for u in uniq if A <= u <= B]:
    g = rd.read(f)[cy - R:cy + R + 1, cx - R:cx + R + 1].astype(np.int16)
    white = (g > 190) & disc
    cols = white.sum(0)
    heights = [int(c) for c in cols if c > 0]
    mad = float(np.abs(g - prev)[disc].mean()) if prev is not None else 0.0
    rows.append([f, int(white.sum()), max(heights) if heights else 0, len(heights), f"{mad:.2f}"])
    prev = g
out = v.dir / "scratch" / "gap_review" / f"s32_badge_bars_{A}-{B}.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["frame", "white_px", "max_col_height_px", "white_cols", "disc_mad_vs_prev"]); w.writerows(rows)
print(out)
for r in rows:
    print(*r)
