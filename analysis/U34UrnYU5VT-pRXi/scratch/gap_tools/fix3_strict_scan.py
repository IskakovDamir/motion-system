"""fix3_strict_scan.py <timeline.md> <segments.json> [--strict]
Run from scripts/analysis/ (it imports coverage_gaps and common from there).
Same logic as scripts/analysis/coverage_gaps.py scan(), on a given markdown/segments file; the picture changes are
computed by coverage_gaps.changes(). --strict: 'to fN' dur cells read as end frames, and start-less rows never cover the whole segment."""
import sys, re, json
import numpy as np
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")  # coverage_gaps.py, common.py
import coverage_gaps as cg
from common import get_video
v = get_video("v2")
ch = cg.changes(v)
md = open(sys.argv[1]).read(); seg = json.load(open(sys.argv[2])); strict = "--strict" in sys.argv
trans = [(t["start"], t["end"]) for t in seg.get("transitions", [])]
def covered(a, b, rows, head):
    if not strict:
        return cg.covered_frames(a, b, rows, head)
    n = b - a + 1; cov = np.zeros(n, bool)
    def mark(x, y):
        x, y = max(x, a), min(y, b)
        if x <= y: cov[x - a: y - a + 1] = True
    si = next((i for i, c in enumerate(head or []) if c.startswith("start")), None)
    di = next((i for i, c in enumerate(head or []) if c.startswith("dur")), None)
    for r in rows:
        text = " | ".join(r); start = dur = None
        if si is not None and si < len(r):
            m = re.search(r"f?(\d+)", r[si]); start = int(m.group(1)) if m else None
        if di is not None and di < len(r):
            m = re.match(r"\s*to f(\d+)", r[di])
            if m and start is not None:
                dur = int(m.group(1)) - start
            else:
                m = re.search(r"(\d+(?:\.\d+)?)", r[di]); dur = float(m.group(1)) if m else None
        if start is not None:
            mark(start, start + int(np.ceil(dur or 0)))
            if cg.CONTINUOUS.search(text): mark(start, b)
        for x, y in re.findall(r"\bf(\d+)\s*[-–]\s*f?(\d+)\b", text):
            x, y = int(x), int(y)
            if y >= x: mark(x, y)
    return cov
gaps = []
for sid, a, b, cls, body in cg.blocks(md):
    if cls not in ("GRAPHICS", "MIXED"): continue
    rows, head = cg.movement_rows(body)
    cov = covered(a, b, rows, head)
    for ta, tb in trans:
        lo, hi = max(ta, a), min(tb, b)
        if lo <= hi: cov[lo - a: hi - a + 1] = True
    active = []
    for f, (k, bbox, pf) in sorted(ch.items()):
        if f < a or f > b or k < cg.MIN_PX: continue
        lo = max(a, (pf if pf is not None else f - 1) + 1)
        if not cov[lo - a: f - a + 1].any(): active.append((f, k, bbox))
    run = []
    for item in active + [None]:
        if item and run and item[0] - run[-1][0] <= 3:
            run.append(item); continue
        if run:
            pk = max(run, key=lambda x: x[1])
            xs = [x[2] for x in run if x[2]]
            bb = [min(x[0] for x in xs), min(x[1] for x in xs), max(x[2] for x in xs), max(x[3] for x in xs)]
            gaps.append((sid, run[0][0], run[-1][0], len(run), pk[1], pk[0], bb, [(x[0], x[1]) for x in run]))
        run = [item] if item else []
for g in gaps:
    flag = "PRINTED" if (g[4] >= 40 or g[3] >= 3) else ""
    print(f"{g[0]} f{g[1]}-f{g[2]} pictures {g[3]} peak {g[4]} px at f{g[5]} bbox {g[6]} {flag} frames {g[7]}")
print(len(gaps), "runs")
