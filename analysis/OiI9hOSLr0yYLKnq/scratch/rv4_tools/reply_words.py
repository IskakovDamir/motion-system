"""Bullet and word pops of the three agent-reply rows (critic issue 3): S03 card 2 reply,
S03 card 1 reply, S04 card 1 reply.  On the dark terminal cards new text is lighter than
the card, so for every frame the script counts the pixels of the full-res work.mp4 picture
that got lighter by more than 12 levels since the previous frame inside the reply's region
and gives their box; packet dots (darker than what they cover on these cards) do not count.
Writes scratch/rv4_reply_words.csv (one row per frame and region)."""
import csv
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

v = get_video("v1")
REGIONS = {  # name: (x0, y0, x1, y1, first, last)
    "S03_card2_reply": (990, 500, 1870, 890, 444, 476),  # below the sub-label row the return dot crosses (y 444-471)
    "S03_card1_reply": (50, 600, 930, 890, 474, 506),
    "S04_card1_reply": (50, 600, 930, 890, 713, 745),
}
rd = WorkReader(v)
rows = []
for name, (x0, y0, x1, y1, a, b) in REGIONS.items():
    prev = rd.read(a - 1).astype(np.int16)
    for f in range(a, b + 1):
        g = rd.read(f).astype(np.int16)
        d = g[y0:y1, x0:x1] - prev[y0:y1, x0:x1]
        ys, xs = np.nonzero(d > 12)
        if len(xs):
            rows.append([name, f, len(xs), int(xs.min() + x0), int(xs.max() + x0), int(ys.min() + y0), int(ys.max() + y0)])
        else:
            rows.append([name, f, 0, "", "", "", ""])
        prev = g
out = v.dir / "scratch" / "rv4_reply_words.csv"
with open(out, "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["region", "frame", "lighter_px", "x0", "x1", "y0", "y1"])
    w.writerows(rows)
print(out)
