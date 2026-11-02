"""Similarity transform (scale, tx, ty) between two captured pictures fitted separately in named regions
(ORB + RANSAC), to tell a 2D zoom of the whole plate (same scale everywhere) from a camera move inside the
footage (parallax: regions disagree).

  python region_sim.py v8 out.csv "name:x0,y0,x1,y1" [...] -- f0 f1 f2 ...   (consecutive pairs of the list)
"""
import csv
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import get_video, WorkReader


def sim(a, b, mask):
    orb = cv2.ORB_create(3000)
    k1, d1 = orb.detectAndCompute(a, mask)
    k2, d2 = orb.detectAndCompute(b, mask)
    if d1 is None or d2 is None:
        return None
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2)
    if len(m) < 8:
        return None
    p1 = np.float32([k1[x.queryIdx].pt for x in m])
    p2 = np.float32([k2[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=1.5)
    if M is None:
        return None
    return float(np.hypot(M[0, 0], M[1, 0])), float(M[0, 2]), float(M[1, 2]), int(inl.sum()), len(m)


def main():
    v = get_video(sys.argv[1])
    out = sys.argv[2]
    i = sys.argv.index("--")
    regs = []
    for spec in sys.argv[3:i]:
        n, box = spec.split(":")
        regs.append((n, [int(x) for x in box.split(",")]))
    fr = [int(x) for x in sys.argv[i + 1:]]
    r = WorkReader(v)
    ims = {f: r.read(f) for f in fr}
    r.close()
    rows = []
    for f0, f1 in zip(fr, fr[1:]):
        row = {"f0": f0, "f1": f1}
        for n, (x0, y0, x1, y1) in regs:
            mask = np.zeros(ims[f0].shape, np.uint8)
            mask[y0:y1, x0:x1] = 255
            s = sim(ims[f0], ims[f1], mask)
            row[f"{n}_scale"] = round(s[0], 4) if s else ""
            row[f"{n}_inl"] = f"{s[3]}/{s[4]}" if s else ""
        rows.append(row)
    with open(out, "w", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    for row in rows:
        print(" ".join(f"{k}={row[k]}" for k in row))


if __name__ == "__main__":
    main()
