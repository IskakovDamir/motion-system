"""Frame inspection material (all grayscale, analysis frame numbers burned in).

  overview <video> [--start F] [--end F] [--step 3]
      4x4 contact sheets, every 3rd analysis frame -> analysis/<v>/sheets/overview_<a>-<b>.jpg
  detail <video> <frame> [--before 12] [--after 12] [--name NAME]
      every picture around an event -> analysis/<v>/detail/<NAME>/f<frame>.jpg + sheet.jpg (5x5)
      (screen recordings: 12 captured pictures each side, labelled with analysis frames)
  dense <video> <start> <end> [--step 1] [--cols 6]
      every frame of a range, 6 per row -> analysis/<v>/detail/dense_<a>-<b>_<part>.jpg
  stills <video> <frame> [<frame> ...] [--tag TAG]
      full-resolution grayscale PNG stills -> analysis/<v>/type/<TAG>_f<frame>.png
  crop <video> <x> <y> <w> <h> <start> <end> [--step 1] [--zoom 2]
      zoomed crops of one region over a range -> analysis/<v>/crops/crop_<x>_<y>_<w>x<h>_<a>-<b>.jpg
  auto <video>
      overview of the whole video + detail windows for every cut candidate and off-cut motion peak
"""
import argparse
import csv
from pathlib import Path

import cv2
import numpy as np

from common import WorkReader, get_video, label, load_json, tile, write_jpg


def unique_frames(v) -> list[int]:
    p = v.dir / "motion.csv"
    if not p.exists():
        return []
    with open(p) as fh:
        return [int(r["frame"]) for r in csv.DictReader(fh) if r["unique"] == "1"]


def overview(v, start=0, end=None, step=3):
    r = WorkReader(v)
    end = r.n - 1 if end is None else min(end, r.n - 1)
    frames = list(range(start, end + 1, step))
    out = []
    for k in range(0, len(frames), 16):
        chunk = frames[k:k + 16]
        ims = []
        for f in chunk:
            g = r.read(f)
            g = cv2.resize(g, (480, int(round(g.shape[0] * 480 / g.shape[1]))), interpolation=cv2.INTER_AREA)
            ims.append(label(g, f"f{f}", 0.6))
        sheet = tile(ims, 4, 480, 270)
        p = v.dir / "sheets" / f"overview_{chunk[0]:05d}-{chunk[-1]:05d}.jpg"
        write_jpg(p, sheet, 88)
        out.append(p)
    r.close()
    return out


def detail(v, frame, before=12, after=12, name=None):
    r = WorkReader(v)
    if v.kind == "cfr60":
        frames = [f for f in range(frame - before, frame + after + 1) if 0 <= f < r.n]
    else:
        u = unique_frames(v)
        i = int(np.searchsorted(u, frame))
        frames = u[max(0, i - before): i + after + 1]
    d = v.dir / "detail" / (name or f"f{frame:05d}")
    d.mkdir(parents=True, exist_ok=True)
    ims = []
    for f in frames:
        g = r.read(f)
        small = cv2.resize(g, (960, int(round(g.shape[0] * 960 / g.shape[1]))), interpolation=cv2.INTER_AREA)
        tag = f"f{f}" + (" *" if f == frame else "")
        write_jpg(d / f"f{f:05d}.jpg", label(small, tag, 0.8), 90)
        ims.append(label(cv2.resize(g, (384, int(round(g.shape[0] * 384 / g.shape[1]))), interpolation=cv2.INTER_AREA), tag, 0.5))
    write_jpg(d / "sheet.jpg", tile(ims, 5, 384, 216), 88)
    r.close()
    return d


def dense(v, start, end, step=1, cols=6):
    r = WorkReader(v)
    frames = list(range(start, end + 1, step))
    if v.kind != "cfr60" and step == 1:
        u = set(unique_frames(v))
        frames = [f for f in frames if f in u] or frames
    tw = 1920 // cols
    th = int(round(tw * 9 / 16))
    per = cols * max(1, 1080 // th)
    out = []
    for k in range(0, len(frames), per):
        chunk = frames[k:k + per]
        ims = []
        for f in chunk:
            g = r.read(f)
            ims.append(label(cv2.resize(g, (tw, int(round(g.shape[0] * tw / g.shape[1]))), interpolation=cv2.INTER_AREA), f"f{f}", 0.5))
        p = v.dir / "detail" / f"dense_{start:05d}-{end:05d}_{k // per:02d}.jpg"
        write_jpg(p, tile(ims, cols, tw, th), 90)
        out.append(p)
    r.close()
    return out


def stills(v, frames, tag="t"):
    r = WorkReader(v)
    out = []
    for f in frames:
        g = r.read(int(f))
        p = v.dir / "type" / f"{tag}_f{int(f):05d}.png"
        p.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(p), label(g, f"f{int(f)}", 1.0))
        out.append(p)
    r.close()
    return out


def crop(v, x, y, w, h, start, end, step=1, zoom=2.0):
    r = WorkReader(v)
    ims = []
    for f in range(start, end + 1, step):
        g = r.read(f)[y:y + h, x:x + w]
        g = cv2.resize(g, (int(w * zoom), int(h * zoom)), interpolation=cv2.INTER_NEAREST if zoom >= 1 else cv2.INTER_AREA)
        ims.append(label(g, f"f{f}", 0.5))
    r.close()
    tw, th = ims[0].shape[1], ims[0].shape[0]
    cols = max(1, min(len(ims), 1920 // tw))
    p = v.dir / "crops" / f"crop_{x}_{y}_{w}x{h}_{start:05d}-{end:05d}.jpg"
    write_jpg(p, tile(ims, cols, tw, th), 90)
    return p


def auto(v):
    sheets = overview(v)
    cuts = load_json(v.dir / "cuts.json", {"cuts": []})["cuts"]
    peaks = load_json(v.dir / "motion_peaks.json", {"peaks": []})["peaks"]
    n = 0
    for c in cuts:
        detail(v, c["frame"], name=f"cut_{c['id']}_f{c['frame']:05d}")
        n += 1
    m = 0
    for p in peaks:
        if not p["at_cut"]:
            detail(v, p["frame"], name=f"peak_f{p['frame']:05d}")
            m += 1
    print(v.key, "overview sheets", len(sheets), "cut windows", n, "peak windows", m)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("overview"); a.add_argument("video"); a.add_argument("--start", type=int, default=0); a.add_argument("--end", type=int); a.add_argument("--step", type=int, default=3)
    a = sub.add_parser("detail"); a.add_argument("video"); a.add_argument("frame", type=int); a.add_argument("--before", type=int, default=12); a.add_argument("--after", type=int, default=12); a.add_argument("--name")
    a = sub.add_parser("dense"); a.add_argument("video"); a.add_argument("start", type=int); a.add_argument("end", type=int); a.add_argument("--step", type=int, default=1); a.add_argument("--cols", type=int, default=6)
    a = sub.add_parser("stills"); a.add_argument("video"); a.add_argument("frames", type=int, nargs="+"); a.add_argument("--tag", default="t")
    a = sub.add_parser("crop"); a.add_argument("video"); [a.add_argument(k, type=int) for k in ("x", "y", "w", "h", "start", "end")]; a.add_argument("--step", type=int, default=1); a.add_argument("--zoom", type=float, default=2.0)
    a = sub.add_parser("auto"); a.add_argument("video")
    args = ap.parse_args()
    v = get_video(args.video)
    if args.cmd == "overview":
        for p in overview(v, args.start, args.end, args.step):
            print(p)
    elif args.cmd == "detail":
        print(detail(v, args.frame, args.before, args.after, args.name))
    elif args.cmd == "dense":
        for p in dense(v, args.start, args.end, args.step, args.cols):
            print(p)
    elif args.cmd == "stills":
        for p in stills(v, args.frames, args.tag):
            print(p)
    elif args.cmd == "crop":
        print(crop(v, args.x, args.y, args.w, args.h, args.start, args.end, args.step, args.zoom))
    elif args.cmd == "auto":
        auto(v)


if __name__ == "__main__":
    main()
