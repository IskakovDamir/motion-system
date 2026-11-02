"""Sub-pixel ink centroid of a dark (or light) element inside a fixed ROI, per captured picture.

  python ink_centroid.py v8 A B X Y W H out.csv [dark|light] [thresh]
weight = (thresh - luma) for luma < thresh (dark) or (luma - thresh) for luma > thresh (light).
Columns: frame, cx, cy (picture px), mass, x0, y0, x1, y1 (bbox of weighted pixels)
"""
import csv
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import numpy as np

from common import get_video, iter_unique


def main():
    v = get_video(sys.argv[1])
    a, b = int(sys.argv[2]), int(sys.argv[3])
    x, y, w, h = (int(s) for s in sys.argv[4:8])
    out = sys.argv[8]
    pol = sys.argv[9] if len(sys.argv) > 9 else "dark"
    th = float(sys.argv[10]) if len(sys.argv) > 10 else 128
    rows = []
    for f, _, img in iter_unique(v, gray=True):
        if f > b:
            break
        if f < a:
            continue
        roi = img[y:y + h, x:x + w].astype(np.float64)
        wt = np.clip(th - roi, 0, None) if pol == "dark" else np.clip(roi - th, 0, None)
        m = wt.sum()
        if m <= 0:
            rows.append({"frame": f, "cx": "", "cy": "", "mass": 0, "x0": "", "y0": "", "x1": "", "y1": ""})
            continue
        ys, xs = np.mgrid[0:h, 0:w]
        cx = (wt * xs).sum() / m + x
        cy = (wt * ys).sum() / m + y
        nz = np.nonzero(wt > 0)
        rows.append({"frame": f, "cx": round(cx, 3), "cy": round(cy, 3), "mass": round(m / 255, 1),
                     "x0": int(nz[1].min()) + x, "y0": int(nz[0].min()) + y, "x1": int(nz[1].max()) + 1 + x, "y1": int(nz[0].max()) + 1 + y})
    with open(out, "w", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    for r in rows:
        print(" ".join(f"{k}={r[k]}" for k in r))


if __name__ == "__main__":
    main()
