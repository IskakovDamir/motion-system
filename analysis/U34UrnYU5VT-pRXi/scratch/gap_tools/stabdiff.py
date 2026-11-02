"""Zoom-compensated change map: register each frame of a range to a reference frame (ECC, affine on
the full picture), warp, and report where the picture still differs from the reference (|diff| > 24).

  stabdiff.py <REF> <A> <B> [--step 4] [--name N]
Prints per frame: ECC correlation, scale, changed px and their bbox; writes scratch/gap_review/<N>.jpg
(warped frame over its change mask, every --step frames).
"""
import argparse, sys
from pathlib import Path
import cv2
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))
from common import get_video, label, tile, write_jpg  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("ref", type=int); ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--step", type=int, default=4)
ap.add_argument("--name")
ap.add_argument("--thr", type=int, default=24)
a = ap.parse_args()
v = get_video("v2")
cap = cv2.VideoCapture(str(v.source))
lo = min(a.ref, a.a)
cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, lo - 60))
pos = max(0, lo - 60)
fr = {}
while pos <= max(a.b, a.ref):
    ok, img = cap.read()
    if not ok:
        break
    if pos >= lo:
        fr[pos] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    pos += 1
ref = fr[a.ref].astype(np.float32)
small = lambda g: cv2.resize(g, (960, 540), interpolation=cv2.INTER_AREA)
rs = small(ref)
ims = []
for f in range(a.a, a.b + 1):
    g = fr[f].astype(np.float32)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        cc, warp = cv2.findTransformECC(rs, small(g), warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    except cv2.error:
        cc = float("nan")
    W = warp.copy(); W[:, 2] *= 2  # back to full res
    al = cv2.warpAffine(g, W, (1920, 1080), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderValue=250)
    d = np.abs(al - ref)
    m = d > a.thr
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    k = int(m.sum())
    bb = ""
    if k:
        ys, xs = np.nonzero(m)
        bb = f"x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}"
    s = float(np.sqrt(abs(np.linalg.det(W[:, :2]))))
    print(f"f{f}: cc {cc:.4f} scale {1/s:.5f} changed(open3) {k:6d} {bb}")
    if (f - a.a) % a.step == 0:
        vis = al.astype(np.uint8).copy()
        vis[m] = 0
        ims.append(label(cv2.resize(vis, (640, 360), interpolation=cv2.INTER_AREA), f"f{f}", 0.5))
if a.name and ims:
    out = v.dir / "scratch" / "gap_review" / f"{a.name}.jpg"
    write_jpg(out, tile(ims, 3, 640, 360), 90)
    print(out)
