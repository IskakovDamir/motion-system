"""Per-frame position / scale / luminance samples of one graphic element.

All coordinates are pixels of the analysed picture (work.mp4) unless a column ends in _pct
(% of picture width for x and w, % of picture height for y and h). Output CSV goes to
analysis/<v>/scratch/<name>.csv; then run fit_easing.py on one column.

  template <video> <start> <end> --bbox X Y W H [--ref F] [--scales 0.5 1.5 0.02] [--pad 250] [--name N]
      normalized cross-correlation of a template cut from frame --ref (default start); with
      --scales the template is also scaled, so the column `scale` tracks zooms.
  bbox <video> <start> <end> --roi X Y W H [--polarity dark|light|any] [--thresh 40] [--bg auto|0-255]
      bounding box and ink centroid of pixels that differ from the background inside the ROI
      (text reveals, wipes, growing shapes, objects sliding through a region).
  luma <video> <start> <end> --roi X Y W H
      mean / std luminance of the ROI (fades, flashes, opacity).
  edge <video> <start> <end> --roi X Y W H --axis x|y [--level 0.5]
      position along the axis where the ROI's mean profile crosses the level between its min and
      max (wipe fronts, mask edges, bars).
  flow <video> <start> <end> --roi X Y W H
      Farneback flow inside the ROI between consecutive pictures, integrated to cumulative
      position (px) and scale (when an element is too blurred for a template).
"""
import argparse
import csv

import cv2
import numpy as np

from common import WorkReader, get_video, load_json


def frames_for(v, start, end):
    """All analysis frames in range with a flag telling if a new picture arrives there."""
    if v.kind == "cfr60":
        return [(f, 1) for f in range(start, end + 1)]
    uniq = set()
    with open(v.dir / "motion.csv") as fh:
        for r in csv.DictReader(fh):
            if r["unique"] == "1":
                uniq.add(int(r["frame"]))
    return [(f, int(f in uniq)) for f in range(start, end + 1)]


def picture_size(v):
    meta = load_json(v.dir / "meta.json")
    return meta["analysis"]["picture_resolution"]


def write(v, name, header, rows):
    p = v.dir / "scratch" / f"{name}.csv"
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(p)
    return p


def cmd_template(v, a):
    W, H = picture_size(v)
    r = WorkReader(v)
    x, y, w, h = a.bbox
    ref = r.read(a.ref if a.ref is not None else a.start).astype(np.float32)
    tmpl0 = ref[y:y + h, x:x + w]
    scales = [1.0] if not a.scales else list(np.arange(a.scales[0], a.scales[1] + 1e-9, a.scales[2]))
    rows = []
    cx, cy = x + w / 2, y + h / 2
    for f, uniq in frames_for(v, a.start, a.end):
        g = r.read(f).astype(np.float32)
        best = None
        for s in scales:
            tw, th = max(4, int(round(w * s))), max(4, int(round(h * s)))
            t = cv2.resize(tmpl0, (tw, th), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
            if a.global_search:
                x0, y0, x1, y1 = 0, 0, W, H
            else:
                x0 = int(max(0, cx - tw / 2 - a.pad)); y0 = int(max(0, cy - th / 2 - a.pad))
                x1 = int(min(W, cx + tw / 2 + a.pad)); y1 = int(min(H, cy + th / 2 + a.pad))
            region = g[y0:y1, x0:x1]
            if region.shape[0] < th or region.shape[1] < tw:
                continue
            res = cv2.matchTemplate(region, t, cv2.TM_CCOEFF_NORMED)
            _, score, _, loc = cv2.minMaxLoc(res)
            if best is None or score > best[0]:
                best = (score, x0 + loc[0], y0 + loc[1], s, tw, th)
        if best is None:
            continue
        score, bx, by, s, tw, th = best
        if score >= 0.5:  # keep the search window where the element was last seen clearly
            cx, cy = bx + tw / 2, by + th / 2
        mx, my = bx + tw / 2, by + th / 2
        rows.append([f, f"{f / 60:.4f}", uniq, bx, by, f"{mx:.2f}", f"{my:.2f}", f"{100 * mx / W:.3f}", f"{100 * my / H:.3f}",
                     f"{s:.4f}", tw, th, f"{100 * tw / W:.3f}", f"{100 * th / H:.3f}", f"{score:.4f}"])
    r.close()
    return write(v, a.name or f"template_{a.start}-{a.end}", ["frame", "time_s", "unique", "x", "y", "cx", "cy", "cx_pct", "cy_pct",
                                                              "scale", "w", "h", "w_pct", "h_pct", "score"], rows)


def cmd_bbox(v, a):
    W, H = picture_size(v)
    r = WorkReader(v)
    x, y, w, h = a.roi
    rows = []
    for f, uniq in frames_for(v, a.start, a.end):
        g = r.read(f)[y:y + h, x:x + w].astype(np.int16)
        if a.bg == "auto":
            border = np.concatenate([g[0], g[-1], g[:, 0], g[:, -1]])
            bg = float(np.median(border))
        else:
            bg = float(a.bg)
        d = g - bg
        if a.polarity == "dark":
            m = d < -a.thresh
        elif a.polarity == "light":
            m = d > a.thresh
        else:
            m = np.abs(d) > a.thresh
        ys, xs = np.nonzero(m)
        if len(xs) == 0:
            rows.append([f, f"{f / 60:.4f}", uniq] + [""] * 10 + [0, f"{g.mean():.2f}"])
            continue
        x0, x1, y0, y1 = xs.min() + x, xs.max() + x, ys.min() + y, ys.max() + y
        icx, icy = xs.mean() + x, ys.mean() + y
        rows.append([f, f"{f / 60:.4f}", uniq, x0, y0, x1, y1, x1 - x0 + 1, y1 - y0 + 1,
                     f"{(x0 + x1) / 2:.2f}", f"{(y0 + y1) / 2:.2f}", f"{icx:.2f}", f"{icy:.2f}", int(len(xs)), f"{g.mean():.2f}"])
    r.close()
    return write(v, a.name or f"bbox_{a.start}-{a.end}", ["frame", "time_s", "unique", "x0", "y0", "x1", "y1", "w", "h",
                                                          "cx", "cy", "ink_cx", "ink_cy", "area", "mean_lum"], rows)


def cmd_luma(v, a):
    r = WorkReader(v)
    x, y, w, h = a.roi
    rows = []
    for f, uniq in frames_for(v, a.start, a.end):
        g = r.read(f)[y:y + h, x:x + w].astype(np.float32)
        rows.append([f, f"{f / 60:.4f}", uniq, f"{g.mean():.3f}", f"{g.std():.3f}", int(g.min()), int(g.max())])
    r.close()
    return write(v, a.name or f"luma_{a.start}-{a.end}", ["frame", "time_s", "unique", "mean", "std", "min", "max"], rows)


def cmd_edge(v, a):
    W, H = picture_size(v)
    r = WorkReader(v)
    x, y, w, h = a.roi
    rows = []
    for f, uniq in frames_for(v, a.start, a.end):
        g = r.read(f)[y:y + h, x:x + w].astype(np.float32)
        prof = g.mean(0) if a.axis == "x" else g.mean(1)
        lo, hi = float(prof.min()), float(prof.max())
        lvl = lo + a.level * (hi - lo)
        above = prof >= lvl
        # first index where the profile changes side (the front), with sub-pixel interpolation
        ch = np.nonzero(above[1:] != above[:-1])[0]
        if len(ch) == 0 or hi - lo < 8:
            rows.append([f, f"{f / 60:.4f}", uniq, "", "", f"{lo:.1f}", f"{hi:.1f}"])
            continue
        i = int(ch[0])
        p0, p1 = prof[i], prof[i + 1]
        frac = (lvl - p0) / (p1 - p0) if p1 != p0 else 0.0
        pos = i + frac + (x if a.axis == "x" else y)
        pct = 100 * pos / (W if a.axis == "x" else H)
        rows.append([f, f"{f / 60:.4f}", uniq, f"{pos:.2f}", f"{pct:.3f}", f"{lo:.1f}", f"{hi:.1f}"])
    r.close()
    return write(v, a.name or f"edge_{a.axis}_{a.start}-{a.end}", ["frame", "time_s", "unique", "pos", "pos_pct", "lo", "hi"], rows)


def cmd_flow(v, a):
    W, H = picture_size(v)
    r = WorkReader(v)
    x, y, w, h = a.roi
    rows = []
    prev = None
    cum_x = cum_y = 0.0
    cum_s = 1.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rx, ry = xx - (w - 1) / 2, yy - (h - 1) / 2
    rn2 = rx ** 2 + ry ** 2 + 1e-6
    for f, uniq in frames_for(v, a.start, a.end):
        if not uniq and prev is not None:
            rows.append([f, f"{f / 60:.4f}", 0, "0", "0", f"{cum_x:.3f}", f"{cum_y:.3f}", "0", f"{cum_s:.5f}"])
            continue
        g = r.read(f)[y:y + h, x:x + w]
        if prev is None:
            rows.append([f, f"{f / 60:.4f}", uniq, "0", "0", "0", "0", "0", "1"])
            prev = g
            continue
        fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 4, 21, 3, 5, 1.2, 0)
        dx, dy = float(np.median(fl[..., 0])), float(np.median(fl[..., 1]))
        # scale rate: least-squares fit of radial flow = k * r around the ROI centre (after removing translation)
        ux, uy = fl[..., 0] - dx, fl[..., 1] - dy
        k = float(((ux * rx + uy * ry).sum()) / rn2.sum())
        cum_x += dx; cum_y += dy; cum_s *= (1 + k)
        rows.append([f, f"{f / 60:.4f}", uniq, f"{dx:.3f}", f"{dy:.3f}", f"{cum_x:.3f}", f"{cum_y:.3f}", f"{k:.5f}", f"{cum_s:.5f}"])
        prev = g
    r.close()
    return write(v, a.name or f"flow_{a.start}-{a.end}", ["frame", "time_s", "unique", "dx", "dy", "cum_x", "cum_y", "scale_rate", "cum_scale"], rows)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("template", "bbox", "luma", "edge", "flow"):
        p = sub.add_parser(name)
        p.add_argument("video"); p.add_argument("start", type=int); p.add_argument("end", type=int)
        p.add_argument("--name")
        if name == "template":
            p.add_argument("--bbox", type=int, nargs=4, required=True)
            p.add_argument("--ref", type=int)
            p.add_argument("--scales", type=float, nargs=3)
            p.add_argument("--pad", type=int, default=250)
            p.add_argument("--global", dest="global_search", action="store_true", help="search the whole picture every frame")
        else:
            p.add_argument("--roi", type=int, nargs=4, required=True)
        if name == "bbox":
            p.add_argument("--polarity", default="any", choices=["dark", "light", "any"])
            p.add_argument("--thresh", type=float, default=40)
            p.add_argument("--bg", default="auto")
        if name == "edge":
            p.add_argument("--axis", choices=["x", "y"], required=True)
            p.add_argument("--level", type=float, default=0.5)
    a = ap.parse_args()
    v = get_video(a.video)
    {"template": cmd_template, "bbox": cmd_bbox, "luma": cmd_luma, "edge": cmd_edge, "flow": cmd_flow}[a.cmd](v, a)


if __name__ == "__main__":
    main()
