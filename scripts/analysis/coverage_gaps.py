"""Find picture changes that no movement row of timeline.md accounts for (step 5 completeness check).

For every GRAPHICS and MIXED segment, a captured picture is active when at least MIN_PX pixels (at WIDTH
px wide, masks excluded) differ by more than LEVEL gray levels from the previous captured picture; the
change is placed on the analysis frames from the previous picture + 1 to this one. A frame is covered
when a movement row of its segment block names it: [start, start + dur] of the row, every fA-fB range
the row mentions, and start to the segment end when the row is continuous (loop, idle, throughout,
to the end ...). Transitions in segments.json cover [start, end]. Uncovered active runs are gaps.

  python coverage_gaps.py [v1 ...]
Writes analysis/<stem>/scratch/coverage_gaps.json: {"level", "min_px", "width", "gaps": [{"segment",
"class", "start", "end", "frames", "peak_px", "peak_frame", "bbox_pct"}]} and prints a summary.
"""
import re
import sys

import cv2
import numpy as np

from common import iter_unique, load_json, load_registry, save_json

WIDTH = 640
LEVEL = 12
MIN_PX = 4
CONTINUOUS = re.compile(r"continuous|throughout|to the end|until the end|whole segment|loop|idle|constant(ly)?\b|keeps? (running|drifting|spinning|moving)", re.I)
HEAD = re.compile(r"^###\s+(S\d+)\s+·\s+f(\d+)-f(\d+)\s+·\s+(\w+)", re.M)


def blocks(md: str):
    hs = list(HEAD.finditer(md))
    for i, h in enumerate(hs):
        body = md[h.end(): hs[i + 1].start() if i + 1 < len(hs) else len(md)]
        yield h.group(1), int(h.group(2)), int(h.group(3)), h.group(4), body


def movement_rows(body: str):
    m = re.search(r"\*\*Movements\*\*\s*\n((?:\|.*\n?)+)", body)
    if not m:
        return [], None
    lines = [l for l in m.group(1).splitlines() if l.strip().startswith("|")]
    head = [c.strip().lower() for c in lines[0].strip().strip("|").split("|")]
    rows = [[c.strip() for c in l.strip().strip("|").split("|")] for l in lines[2:]]
    return rows, head


def covered_frames(seg_start: int, seg_end: int, rows, head) -> np.ndarray:
    n = seg_end - seg_start + 1
    cov = np.zeros(n, bool)

    def mark(a, b):
        a, b = max(a, seg_start), min(b, seg_end)
        if a <= b:
            cov[a - seg_start: b - seg_start + 1] = True

    si = next((i for i, c in enumerate(head or []) if c.startswith("start")), None)
    di = next((i for i, c in enumerate(head or []) if c.startswith("dur")), None)
    for r in rows:
        text = " | ".join(r)
        start = dur = None
        if si is not None and si < len(r):
            m = re.search(r"f?(\d+)", r[si])
            start = int(m.group(1)) if m else None
        if di is not None and di < len(r):
            m = re.search(r"(\d+(?:\.\d+)?)", r[di])
            dur = float(m.group(1)) if m else None
        if start is not None:
            mark(start, start + int(np.ceil(dur or 0)))
            if CONTINUOUS.search(text):
                mark(start, seg_end)
        for a, b in re.findall(r"\bf(\d+)\s*[-–]\s*f?(\d+)\b", text):
            a, b = int(a), int(b)
            if b >= a:
                mark(a, b)
        if start is None and CONTINUOUS.search(text):
            mark(seg_start, seg_end)
    return cov


def changes(v):
    """analysis frame -> (changed px, bbox) for every captured picture after the first."""
    masks = []
    out = {}
    prev = prev_f = None
    for f, _, img in iter_unique(v, gray=True, width=WIDTH):
        if not masks:
            sx = WIDTH / (v.crop[2] if v.crop else 1920)
            masks = [(int(x * sx), int(y * sx), int(np.ceil(w * sx)) + 1, int(np.ceil(h * sx)) + 1) for x, y, w, h in v.masks] or [None]
        if prev is not None:
            d = cv2.absdiff(img, prev) > LEVEL
            for m in masks:
                if m:
                    x, y, w, h = m
                    d[y:y + h, x:x + w] = False
            k = int(d.sum())
            bbox = None
            if k:
                ys, xs = np.nonzero(d)
                H, W = d.shape
                bbox = [round(100 * float(xs.min()) / W, 1), round(100 * float(ys.min()) / H, 1), round(100 * float(xs.max() + 1) / W, 1), round(100 * float(ys.max() + 1) / H, 1)]
            out[f] = (k, bbox, prev_f)
        prev, prev_f = img, f
    return out


def scan(v):
    md = (v.dir / "timeline.md").read_text()
    seg = load_json(v.dir / "segments.json")
    trans = [(t["start"], t["end"]) for t in seg.get("transitions", [])]
    ch = changes(v)
    gaps = []
    for sid, a, b, cls, body in blocks(md):
        if cls not in ("GRAPHICS", "MIXED"):
            continue
        rows, head = movement_rows(body)
        cov = covered_frames(a, b, rows, head)
        for ta, tb in trans:
            lo, hi = max(ta, a), min(tb, b)
            if lo <= hi:
                cov[lo - a: hi - a + 1] = True
        # an active picture is uncovered when none of the frames it spans (prev + 1 .. f) is covered
        active = []
        for f, (k, bbox, pf) in sorted(ch.items()):
            if f < a or f > b or k < MIN_PX:
                continue
            lo = max(a, (pf if pf is not None else f - 1) + 1)
            if not cov[lo - a: f - a + 1].any():
                active.append((f, k, bbox))
        run = []
        for item in active + [None]:
            if item and run and item[0] - run[-1][0] <= 3:
                run.append(item)
                continue
            if run:
                pk = max(run, key=lambda x: x[1])
                xs = [x[2] for x in run if x[2]]
                bb = [float(min(x[0] for x in xs)), float(min(x[1] for x in xs)), float(max(x[2] for x in xs)), float(max(x[3] for x in xs))]
                gaps.append({"segment": sid, "class": cls, "start": run[0][0], "end": run[-1][0], "frames": run[-1][0] - run[0][0] + 1,
                             "pictures": len(run), "peak_px": pk[1], "peak_frame": pk[0], "bbox_pct": bb})
            run = [item] if item else []
    (v.dir / "scratch").mkdir(exist_ok=True)
    save_json(v.dir / "scratch" / "coverage_gaps.json", {"level": LEVEL, "min_px": MIN_PX, "width": WIDTH, "gaps": gaps})
    return gaps


def main():
    keys = sys.argv[1:]
    for v in load_registry():
        if keys and v.key not in keys:
            continue
        gaps = scan(v)
        big = [g for g in gaps if g["peak_px"] >= 40 or g["pictures"] >= 3]
        print(f"{v.key}: {len(gaps)} uncovered change runs ({sum(g['frames'] for g in gaps)} frames), {len(big)} with >= 40 px or >= 3 pictures")
        for g in sorted(big, key=lambda g: -g["peak_px"])[:12]:
            print(f"   {g['segment']} {g['class']:8s} f{g['start']}-f{g['end']} ({g['pictures']} pictures) peak {g['peak_px']} px at f{g['peak_frame']} bbox {g['bbox_pct']}")


if __name__ == "__main__":
    main()
