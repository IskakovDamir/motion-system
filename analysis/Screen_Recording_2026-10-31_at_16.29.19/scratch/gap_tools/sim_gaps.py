"""Dry run of coverage_gaps.py on a draft timeline: same row parsing and run grouping, but the picture
changes come from scratch/gap_review/picture_diffs.csv (every captured picture of v7, as coverage_gaps.py
counts them) instead of a fresh decode. Does not write coverage_gaps.json.

python sim_gaps.py [timeline.md] [segments.json]
"""
import csv
import json
import sys

import numpy as np

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import coverage_gaps as cg  # noqa: E402
from common import get_video  # noqa: E402

v = get_video("v7")
md = open(sys.argv[1] if len(sys.argv) > 1 else v.dir / "timeline.md").read()
seg = json.load(open(sys.argv[2] if len(sys.argv) > 2 else v.dir / "segments.json"))
trans = [(t["start"], t["end"]) for t in seg.get("transitions", [])]
ch = {}
for r in csv.DictReader(open(v.dir / "scratch" / "gap_review" / "picture_diffs.csv")):
    bb = [float(t) for t in r["bbox_pct"].split()] if r["bbox_pct"] else None
    ch[int(r["frame"])] = (int(r["changed_px"]), bb, int(r["prev"]))
gaps = []
for sid, a, b, cls, body in cg.blocks(md):
    if cls not in ("GRAPHICS", "MIXED"):
        continue
    rows, head = cg.movement_rows(body)
    cov = cg.covered_frames(a, b, rows, head)
    for ta, tb in trans:
        lo, hi = max(ta, a), min(tb, b)
        if lo <= hi:
            cov[lo - a: hi - a + 1] = True
    active = []
    for f, (k, bbox, pf) in sorted(ch.items()):
        if f < a or f > b or k < cg.MIN_PX:
            continue
        lo = max(a, pf + 1)
        if not cov[lo - a: f - a + 1].any():
            active.append((f, k, bbox))
    run = []
    for item in active + [None]:
        if item and run and item[0] - run[-1][0] <= 3:
            run.append(item)
            continue
        if run:
            pk = max(run, key=lambda x: x[1])
            gaps.append((sid, cls, run[0][0], run[-1][0], len(run), pk[1], pk[0]))
        run = [item] if item else []
print(len(gaps), "runs,", sum(g[3] - g[2] + 1 for g in gaps), "frames")
for g in gaps:
    print(*g)
