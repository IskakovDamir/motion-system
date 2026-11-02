"""Measurements for the v4 coverage-gap review (run from scripts/analysis/ with ../../.venv/bin/python).

  gap_measure.py region X Y W H A B OUT.csv [--level 8]
      full-res |diff to previous frame| inside a box (work.mp4): changed px above level, max, mean, bbox
  gap_measure.py cell X Y W H A B OUT.csv
      small glyph cell: sum and max of |diff to previous frame| (spinner / digit steps)
  gap_measure.py ink X Y W H A B OUT.csv [--polarity dark|light] [--bg 246] [--ref F]
      ink of a box: dark = sum(bg - luma) with centroid y; light = mean luma of the pixels that are
      ink in frame --ref (text that appears on a dark card)
  gap_measure.py edges XA XB Y0 Y1 A B OUT.csv
      sub-pixel x of the left and right 50% crossings of the mean row profile (a dark shape on light)
  gap_measure.py comps A B OUT.csv
      the coverage scan's own rule (source.mp4, 640 px wide, > 12 levels): every changed component
      per captured picture, in full-res px (dilated 5 px at 640 px wide to group a glyph or dot)
  gap_measure.py diffsheet X Y W H A B ZOOM GAIN OUT.jpg
      rows of [frame crop | |diff to previous| x gain, dark = changed]
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "scripts" / "analysis"))

import cv2  # noqa: E402
import numpy as np  # noqa: E402

from common import WorkReader, get_video, iter_unique, label, tile, write_jpg  # noqa: E402

V = get_video("v4")


def _write(out, header, rows):
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(out, len(rows), "rows")


def _opt(args, name, default):
    if name in args:
        i = args.index(name)
        v = args[i + 1]
        del args[i:i + 2]
        return v
    return default


def region(args):
    level = int(_opt(args, "--level", 8))
    x, y, w, h, a, b = map(int, args[:6])
    r = WorkReader(V)
    prev = r.read(a - 1).astype(int)[y:y + h, x:x + w]
    rows = []
    for f in range(a, b + 1):
        g = r.read(f).astype(int)[y:y + h, x:x + w]
        d = np.abs(g - prev)
        m = d > level
        if m.any():
            ys, xs = np.nonzero(m)
            bb = [x + int(xs.min()), y + int(ys.min()), x + int(xs.max()), y + int(ys.max())]
        else:
            bb = ["", "", "", ""]
        rows.append([f, int(m.sum()), int(d.max()), round(float(d.mean()), 4), *bb])
        prev = g
    _write(args[6], ["frame", f"changed_px_gt{level}", "max_diff", "mean_abs_diff", "x0", "y0", "x1", "y1"], rows)


def cell(args):
    x, y, w, h, a, b = map(int, args[:6])
    r = WorkReader(V)
    prev = r.read(a - 1).astype(int)[y:y + h, x:x + w]
    rows = []
    for f in range(a, b + 1):
        g = r.read(f).astype(int)[y:y + h, x:x + w]
        d = np.abs(g - prev)
        rows.append([f, int(d.sum()), int(d.max())])
        prev = g
    _write(args[6], ["frame", "sum_abs_diff", "max_diff"], rows)


def ink(args):
    pol = _opt(args, "--polarity", "dark")
    bg = float(_opt(args, "--bg", 246))
    ref = _opt(args, "--ref", None)
    x, y, w, h, a, b = map(int, args[:6])
    r = WorkReader(V)
    rows = []
    if pol == "light":
        R = r.read(int(ref)).astype(float)[y:y + h, x:x + w]
        mask = R > np.median(R) + 60
        for f in range(a, b + 1):
            g = r.read(f).astype(float)[y:y + h, x:x + w]
            rows.append([f, round(float(g[mask].mean()), 3), round(float(np.median(g)), 1), int(mask.sum())])
        _write(args[6], ["frame", "ink_mean_luma", "box_median_luma", "ink_mask_px"], rows)
        return
    for f in range(a, b + 1):
        g = r.read(f).astype(float)[y:y + h, x:x + w]
        k = np.clip(bg - g, 0, None)
        s = float(k.sum())
        cy = float((k.sum(axis=1) * np.arange(h)).sum() / s + y) if s else float("nan")
        rows.append([f, round(s), round(cy, 3)])
    _write(args[6], ["frame", "ink_sum", "ink_centroid_y"], rows)


def edges(args):
    xa, xb, y0, y1, a, b = map(int, args[:6])
    r = WorkReader(V)
    rows = []
    for f in range(a, b + 1):
        prof = r.read(f).astype(float)[y0:y1, xa:xb].mean(axis=0)
        lvl = (np.percentile(prof, 95) + prof.min()) / 2
        dark = prof < lvl
        i = int(np.argmax(dark))
        j = len(prof) - 1 - int(np.argmax(dark[::-1]))
        xl = xa + (i - 1) + (prof[i - 1] - lvl) / (prof[i - 1] - prof[i])
        xr = xa + j + (prof[j] - lvl) / (prof[j] - prof[j + 1])
        rows.append([f, round(xl, 3), round(xr, 3), round((xl + xr) / 2, 3)])
    _write(args[6], ["frame", "left_x", "right_x", "centre_x"], rows)


def comps(args):
    a, b = int(args[0]), int(args[1])
    rows = []
    prev = None
    for f, _, img in iter_unique(V, gray=True, width=640):
        if f > b:
            break
        if prev is not None and f >= a:
            ad = cv2.absdiff(img, prev)
            d = (ad > 12).astype(np.uint8)
            if d.any():
                n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(d, np.ones((5, 5), np.uint8)), 8)
                found = []
                for i in range(1, n):
                    m = (lab == i) & (d > 0)
                    k = int(m.sum())
                    if k:
                        cx, cy, cw, ch = st[i][:4]
                        found.append([3 * int(cx), 3 * int(cy), 3 * int(cx + cw), 3 * int(cy + ch), k, int(ad[m].max())])
                found.sort(key=lambda c: -c[4])
                total = int(d.sum())
                for c in found:
                    rows.append([f, total, *c])
        prev = img
    _write(args[2], ["frame", "frame_changed_px_640", "x0", "y0", "x1", "y1", "comp_px_640", "comp_max_diff"], rows)


def diffsheet(args):
    x, y, w, h, a, b = map(int, args[:6])
    zoom, gain, out = float(args[6]), float(args[7]), Path(args[8])
    r = WorkReader(V)
    prev = r.read(a - 1)[y:y + h, x:x + w].astype(np.int16)
    ims = []
    for f in range(a, b + 1):
        g = r.read(f)[y:y + h, x:x + w]
        d = 255 - np.clip(np.abs(g.astype(np.int16) - prev) * gain, 0, 255).astype(np.uint8)
        W, H = int(w * zoom), int(h * zoom)
        it = cv2.INTER_NEAREST if zoom >= 1 else cv2.INTER_AREA
        ims.append(np.hstack([label(cv2.resize(g, (W, H), interpolation=it), f"f{f}", 0.5),
                              np.full((H, 4), 128, np.uint8),
                              label(cv2.resize(d, (W, H), interpolation=it), f"d{f - 1}-{f} x{gain:g}", 0.5)]))
        prev = g.astype(np.int16)
    tw, th = ims[0].shape[1], ims[0].shape[0]
    out.parent.mkdir(parents=True, exist_ok=True)
    write_jpg(out, tile(ims, max(1, min(len(ims), 1920 // tw)), tw, th), 90)
    print(out, len(ims))


if __name__ == "__main__":
    cmd, rest = sys.argv[1], sys.argv[2:]
    {"region": region, "cell": cell, "ink": ink, "edges": edges, "comps": comps, "diffsheet": diffsheet}[cmd](rest)
