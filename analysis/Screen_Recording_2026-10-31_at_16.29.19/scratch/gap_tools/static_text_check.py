"""Is an overlay text static while footage moves under it? For every captured picture of a range: mean abs
difference on the glyph pixels (luma > THR in the reference picture, inside ROI) against the reference
picture, and the changed-pixel count (> 12 levels vs the previous picture) on glyph pixels and on the rest
of the ROI. python static_text_check.py <start> <end> X Y W H --ref F [--thr 200] --name N
"""
import argparse
import csv
import sys

import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
from common import WorkReader, get_video  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("start", type=int); ap.add_argument("end", type=int); ap.add_argument("roi", type=int, nargs=4)
ap.add_argument("--ref", type=int, required=True); ap.add_argument("--thr", type=int, default=200); ap.add_argument("--name", required=True)
a = ap.parse_args()
v = get_video("v7")
uniq = [int(r["frame"]) for r in csv.DictReader(open(v.dir / "motion.csv")) if r["unique"] == "1"]
rd = WorkReader(v)
x, y, w, h = a.roi
ref = rd.read(a.ref)[y:y + h, x:x + w].astype(np.int16)
glyph = ref > a.thr
rows, prev = [], None
for f in [u for u in uniq if a.start <= u <= a.end]:
    g = rd.read(f)[y:y + h, x:x + w].astype(np.int16)
    mad_ref = float(np.abs(g - ref)[glyph].mean())
    ch_g = int((np.abs(g - prev) > 12)[glyph].sum()) if prev is not None else 0
    ch_r = int((np.abs(g - prev) > 12)[~glyph].sum()) if prev is not None else 0
    rows.append([f, f"{mad_ref:.2f}", ch_g, ch_r, int(glyph.sum())])
    prev = g
out = v.dir / "scratch" / "gap_review" / f"{a.name}.csv"
with open(out, "w", newline="") as fh:
    wr = csv.writer(fh); wr.writerow(["frame", "glyph_mad_vs_ref", "glyph_px_changed_vs_prev", "nonglyph_px_changed_vs_prev", "glyph_px"]); wr.writerows(rows)
arr = np.array([[float(r[1]), r[2], r[3]] for r in rows])
print(out, "pictures", len(rows), "glyph px", int(glyph.sum()))
print("glyph MAD vs ref: min %.2f median %.2f max %.2f" % (arr[:, 0].min(), np.median(arr[:, 0]), arr[:, 0].max()))
print("glyph px changed vs prev: max %d (median %d); non-glyph px changed: max %d" % (arr[:, 1].max(), np.median(arr[:, 1]), arr[:, 2].max()))
worst = sorted(rows, key=lambda r: -float(r[1]))[:5]
print("worst:", worst)
