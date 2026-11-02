"""Side-by-side crops of consecutive captured pictures and their amplified abs difference.

  python diff_strip.py v8 X Y W H GAIN out.jpg f1 f2 f3 ...   (each row: f_i, f_{i+1}, |f_{i+1} - f_i| x GAIN)
"""
import sys

sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import cv2
import numpy as np

from common import get_video, WorkReader, label, write_jpg
from pathlib import Path


def main():
    v = get_video(sys.argv[1])
    x, y, w, h = (int(s) for s in sys.argv[2:6])
    gain = float(sys.argv[6])
    out = Path(sys.argv[7])
    fr = [int(s) for s in sys.argv[8:]]
    r = WorkReader(v)
    ims = {f: r.read(f)[y:y + h, x:x + w] for f in fr}
    r.close()
    rows = []
    for f0, f1 in zip(fr, fr[1:]):
        a, b = ims[f0], ims[f1]
        d = np.clip(cv2.absdiff(a, b).astype(np.float32) * gain, 0, 255).astype(np.uint8)
        rows.append(np.hstack([label(a.copy(), f"f{f0}", 0.5), np.full((h, 4), 128, np.uint8),
                               label(b.copy(), f"f{f1}", 0.5), np.full((h, 4), 128, np.uint8),
                               label(d, f"|f{f1}-f{f0}| x{gain:g} max {int(cv2.absdiff(a, b).max())}", 0.5)]))
        rows.append(np.full((4, rows[-1].shape[1]), 128, np.uint8))
    write_jpg(out, np.vstack(rows), 92)
    print(out)


if __name__ == "__main__":
    main()
