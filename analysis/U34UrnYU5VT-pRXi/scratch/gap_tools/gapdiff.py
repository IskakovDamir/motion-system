"""Frame-to-frame change of source.mp4 (as coverage_gaps.py sees it) over a range, plus diff strips.

  gapdiff.py <A> <B> [--roi X Y W H] [--zoom 2] [--name N] [--strip]
Prints per frame: changed px (>12 levels) at 640 wide, bbox %, and at full res inside the ROI:
changed px, max |diff|, mean |diff|, the bbox of the change (full-res px).
With --strip writes scratch/gap_review/<N>.jpg: for each frame the ROI (top) and its |diff| x4 (bottom).
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))
from common import get_video, label, tile, write_jpg  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--roi", type=int, nargs=4)
ap.add_argument("--zoom", type=float, default=2.0)
ap.add_argument("--name")
ap.add_argument("--strip", action="store_true")
ap.add_argument("--level", type=int, default=12)
args = ap.parse_args()
v = get_video("v2")
cap = cv2.VideoCapture(str(v.source))
start = max(0, args.a - 1)
seek = max(0, start - 60)
cap.set(cv2.CAP_PROP_POS_FRAMES, seek)
pos = seek
frames = {}
while pos <= args.b:
    ok, img = cap.read()
    if not ok:
        break
    if pos >= start:
        frames[pos] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    pos += 1
cap.release()
x, y, w, h = args.roi if args.roi else (0, 0, 1920, 1080)
ims = []
for f in range(args.a, args.b + 1):
    if f not in frames or f - 1 not in frames:
        continue
    g, p = frames[f], frames[f - 1]
    s = cv2.resize(g, (640, 360), interpolation=cv2.INTER_AREA)
    sp = cv2.resize(p, (640, 360), interpolation=cv2.INTER_AREA)
    d6 = cv2.absdiff(s, sp) > args.level
    k6 = int(d6.sum())
    bb6 = ""
    if k6:
        ys, xs = np.nonzero(d6)
        bb6 = f"[{100*xs.min()/640:.1f},{100*ys.min()/360:.1f},{100*(xs.max()+1)/640:.1f},{100*(ys.max()+1)/360:.1f}]"
    dd = cv2.absdiff(g[y:y+h, x:x+w], p[y:y+h, x:x+w])
    m = dd > args.level
    kf = int(m.sum())
    bbf = ""
    if kf:
        ys, xs = np.nonzero(m)
        bbf = f"x {x+xs.min()}-{x+xs.max()} y {y+ys.min()}-{y+ys.max()}"
    print(f"f{f}: 640w {k6:5d} px {bb6:28s} | roi full-res >{args.level}: {kf:6d} px, max {int(dd.max()):3d}, mean {dd.mean():.3f} {bbf}")
    if args.strip:
        z = args.zoom
        top = cv2.resize(g[y:y+h, x:x+w], (int(w*z), int(h*z)), interpolation=cv2.INTER_NEAREST)
        bot = cv2.resize(np.clip(dd.astype(np.int32)*4, 0, 255).astype(np.uint8), (int(w*z), int(h*z)), interpolation=cv2.INTER_NEAREST)
        both = np.vstack([label(top, f"f{f}", 0.5), label(255 - bot, f"d{f}", 0.5)])
        ims.append(both)
if args.strip and ims:
    tw, th = ims[0].shape[1], ims[0].shape[0]
    cols = max(1, min(len(ims), 1920 // tw))
    out = v.dir / "scratch" / "gap_review" / f"{args.name or f'diff_{args.a}-{args.b}'}.jpg"
    write_jpg(out, tile(ims, cols, tw, th), 90)
    print(out)
