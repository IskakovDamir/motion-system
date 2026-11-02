"""Changed pixels inside the S03 prompt pill shape (filled white capsule found on a rest picture, eroded),
per captured picture vs the previous captured picture, at full resolution (1622 px), level > 12.

  python pill_mask_diff.py v8 A B REF out.csv [erode_px]
Columns: frame, prev, in_px, in_bbox (x0 y0 x1 y1 px), in_maxabs, out_px (outside the dilated pill), mean_out
"""
import csv
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import get_video, iter_unique, WorkReader

LEVEL = 12


def main():
    v = get_video(sys.argv[1])
    a, b, ref = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    out = sys.argv[5]
    er = int(sys.argv[6]) if len(sys.argv) > 6 else 4
    r = WorkReader(v)
    g = r.read(ref)
    r.close()
    white = (g > 225).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(white, 8)
    # the pill = the largest white component in the lower half
    best = max(range(1, n), key=lambda i: stats[i, cv2.CC_STAT_AREA] if stats[i, cv2.CC_STAT_TOP] > g.shape[0] * 0.5 else 0)
    comp = (lab == best).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    fill = np.zeros_like(comp)
    cv2.drawContours(fill, cnts, -1, 255, -1)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * er + 1, 2 * er + 1))
    inner = cv2.erode(fill, k) > 0
    outer = ~(cv2.dilate(fill, k) > 0)
    x, y, w, h = cv2.boundingRect(fill)
    print(f"pill shape on f{ref}: x {x}-{x + w} px, y {y}-{y + h} px, area {int((fill > 0).sum())} px, eroded {er} px")
    rows = []
    prev = prev_f = None
    for f, _, img in iter_unique(v, gray=True):
        if f > b:
            break
        if prev is not None and f >= a:
            diff = cv2.absdiff(img, prev)
            d = diff > LEVEL
            din = d & inner
            k_in = int(din.sum())
            bbox = ""
            if k_in:
                ys, xs = np.nonzero(din)
                bbox = f"{xs.min()} {ys.min()} {xs.max() + 1} {ys.max() + 1}"
            rows.append({"frame": f, "prev": prev_f, "in_px": k_in, "in_bbox": bbox,
                         "in_maxabs": int(diff[inner].max()), "out_px": int((d & outer).sum()),
                         "mean_out": round(float(diff[outer].mean()), 2)})
        prev, prev_f = img, f
    with open(out, "w", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    for rw in rows:
        print(" ".join(f"{k}={rw[k]}" for k in rw))


if __name__ == "__main__":
    main()
