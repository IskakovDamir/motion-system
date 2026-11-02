"""Global similarity transform between consecutive captured pictures (ORB matches + RANSAC,
cv2.estimateAffinePartial2D), whole picture minus the player mask. Scale = how much the picture
grows about its own content between the two pictures (1.0 = no zoom); tx, ty in px of the 1622 px picture.

  python global_sim.py v8 A B out.csv [x0 y0 x1 y1 exclusion box, px]
"""
import csv
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import get_video, iter_unique


def main():
    v = get_video(sys.argv[1])
    a, b = int(sys.argv[2]), int(sys.argv[3])
    out = sys.argv[4]
    excl = [int(s) for s in sys.argv[5:9]] if len(sys.argv) > 8 else None
    orb = cv2.ORB_create(4000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    mask = None
    rows = []
    prev = prev_f = None
    for f, _, img in iter_unique(v, gray=True):
        if f > b:
            break
        if mask is None:
            mask = np.full(img.shape, 255, np.uint8)
            for x, y, w, h in v.masks:
                mask[y:y + h, x:x + w] = 0
            if excl:
                mask[excl[1]:excl[3], excl[0]:excl[2]] = 0
        if f >= a and prev is not None:
            k1, d1 = orb.detectAndCompute(prev, mask)
            k2, d2 = orb.detectAndCompute(img, mask)
            row = {"frame": f, "prev": prev_f, "matches": 0, "inliers": 0, "scale": "", "rot_deg": "", "tx": "", "ty": ""}
            if d1 is not None and d2 is not None:
                m = bf.match(d1, d2)
                if len(m) >= 8:
                    p1 = np.float32([k1[x.queryIdx].pt for x in m])
                    p2 = np.float32([k2[x.trainIdx].pt for x in m])
                    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=1.5)
                    if M is not None:
                        s = float(np.hypot(M[0, 0], M[1, 0]))
                        # translation of the picture centre
                        c = np.array([img.shape[1] / 2, img.shape[0] / 2, 1.0])
                        mc = M @ c
                        row.update({"matches": len(m), "inliers": int(inl.sum()), "scale": round(s, 5),
                                    "rot_deg": round(float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), 3),
                                    "tx": round(float(mc[0] - c[0]), 2), "ty": round(float(mc[1] - c[1]), 2)})
            rows.append(row)
        prev, prev_f = img, f
    with open(out, "w", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    for r in rows:
        print(" ".join(f"{k}={r[k]}" for k in r))


if __name__ == "__main__":
    main()
