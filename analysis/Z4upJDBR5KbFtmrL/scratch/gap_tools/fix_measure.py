"""Measurements for the fixes after the coverage-gap critic (round 1) of v4.
Run from scripts/analysis/ with ../../.venv/bin/python; every number is read from source.mp4
(full-res gray, cv2 BGR -> GRAY), the file the coverage scan reads.

  fix_measure.py pulse      -> scratch/fix_icon_pulse_scale.csv
      per icon and frame: the scale that best maps the icon's rest frame (3 f before its first
      change) onto the frame, scaled about the cell centre (least squares over a 250 x 224 px box,
      scales 0.990-1.080 in 0.0005 steps, parabolic refinement), and the box's changed px > 8 levels
  fix_measure.py ring4      -> scratch/fix_icon4_ring_onset.csv
      icon 4: changed px > 8 levels on the ring 85-125 px from its centre and inside 60 px of it
  fix_measure.py hopends    -> scratch/fix_s05_hop_ends_source.csv, scratch/fix_s05_hop321_onset.csv
      S05 hold hops A-G: changed px > 8 levels and max diff in an 80 x 70 px box on each hop's
      source and target node; the grey 321 px hop's onset pixel (1090, 574)
  fix_measure.py census     -> scratch/fix_s05_dot_census.csv
      dots on screen per frame f1016-f1113 from the hop table below (first changed frame at the
      source .. frame before the pop-off, or last change where the dot sinks out of sight), the
      hidden frames read off the crops, and the dark-blob detector count of c2_s2_packets.csv
  fix_measure.py hopfits    -> scratch/fix_s05_hop_fits.json
      the two added hold hops: distance along the connector (c2_s2_packets.csv detections via
      scratch/gap_s05_hop_speeds.csv) fitted with the shape of curves/v4.particle-edge-packets.i2
      (free start and duration), and with a free bezier
  fix_measure.py term       -> scratch/fix_s02_terminal_rows.csv
      S02 terminal: ink row runs (luma > 60, x 1036-1790) and ink-weighted centres per frame;
      the prompt box outline rows, prompt sign and cursor rows
  fix_measure.py brtile     -> scratch/fix_s04_br_tile_source.csv
      S04 bottom-right tile box x 1400-1600 / y 780-880: changed px > 8 levels per frame f797-f815
  fix_measure.py chatspin   -> scratch/fix_s03_spinner_cells_source.csv
      S03 chat status glyph cell (240-272 x 750-786) and terminal working-line glyph cell
      (1030-1058 x 762-792): changed px > 30 levels per frame f572-f679
  fix_measure.py f1         -> scratch/fix_f0001_source.csv
      f0-f5: changed px > 8 levels per frame, split by icon; frame types from ffprobe
"""
import csv
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
SCRATCH = HERE.parent
VDIR = SCRATCH.parent
SRC = VDIR / "source.mp4"


def frames(a, b):
    cap = cv2.VideoCapture(str(SRC))
    out, i = {}, 0
    while i <= b:
        if not cap.grab():
            break
        if i >= a:
            _, img = cap.retrieve()
            out[i] = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16)
        i += 1
    cap.release()
    return out


def write(name, header, rows):
    p = SCRATCH / name
    with open(p, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(p, len(rows), "rows")


ICONS = {1: (1240, 332, 22), 2: (1600, 332, 47), 3: (1420, 644, 72), 4: (1780, 644, 97), 5: (1240, 748, 123), 6: (1600, 748, 148)}


def pulse():
    F = frames(10, 175)
    grid = np.arange(0.990, 1.080, 0.0005)
    by = {}
    for k, (cx, cy, s0) in ICONS.items():
        ref = F[s0 - 3].astype(np.float32)
        x0, x1, y0, y1 = cx - 125, cx + 125, cy - 112, cy + 112
        warped = []
        for s in grid:
            M = np.float32([[s, 0, cx - s * cx], [0, s, cy - s * cy]])
            warped.append(cv2.warpAffine(ref, M, (1920, 1080), flags=cv2.INTER_LINEAR)[y0:y1, x0:x1])
        for f in range(s0 - 6, s0 + 26):
            g = F[f].astype(np.float32)[y0:y1, x0:x1]
            errs = np.array([float(np.mean((w - g) ** 2)) for w in warped])
            i = int(np.argmin(errs))
            off = 0.0
            if 0 < i < len(grid) - 1:
                den = errs[i - 1] - 2 * errs[i] + errs[i + 1]
                off = 0.5 * (errs[i - 1] - errs[i + 1]) / den if den > 0 else 0.0
            d = np.abs(F[f] - F[f - 1])[y0:y1, x0:x1]
            by.setdefault(f, {})[k] = (round(float(grid[i] + off * 0.0005), 4), int((d > 8).sum()))
    rows = []
    for f in sorted(by):
        d = by[f]
        rows.append([f] + [d[k][0] if k in d else "" for k in range(1, 7)] + [d[k][1] if k in d else "" for k in range(1, 7)])
    write("fix_icon_pulse_scale.csv", ["frame"] + [f"icon{k}_scale" for k in range(1, 7)] + [f"icon{k}_changed_px_gt8" for k in range(1, 7)], rows)


def ring4():
    F = frames(86, 100)
    cx, cy = 1780, 644
    yy, xx = np.mgrid[0:1080, 0:1920]
    r = np.hypot(xx - cx, yy - cy)
    ring, centre = (r > 85) & (r < 125), r < 60
    rows = []
    for f in range(88, 100):
        d = np.abs(F[f] - F[f - 1])
        rows.append([f, int(((d > 8) & ring).sum()), int(d[ring].max()), int(((d > 8) & centre).sum())])
    write("fix_icon4_ring_onset.csv", ["frame", "ring_85_125_px_gt8", "ring_max_diff", "centre_lt60_px_gt8"], rows)


HOPS = {  # id: (description, source node, target node, first changed frame, last frame on screen)
    "A": ("grey T04 first hop (160.7,410)->(1757,410)", None, (1757, 410), None, 1024),
    "B": ("dark (1097,410)->(162,575)", None, (162, 575), None, 1037),
    "C": ("grey 320 px (822,575)->(1097,740)", (822, 575), (1097, 740), 1027, 1056),
    "D": ("dark 935 px (1427,575)->(492,575)", (1427, 575), (492, 575), 1037, 1072),
    "E": ("grey ~1595 px (162,740)->(1757,740)", (162, 740), (1757, 740), 1055, 1086),
    "F": ("grey 321 px (1097,575)->(822,740)", (1097, 575), (822, 740), 1069, 1103),
    "G": ("dark 949 px (822,410)->(1757,575)", (822, 410), (1757, 575), 1086, 1117),
}
HIDDEN = {"A": range(1022, 1025), "B": [1019, 1031, 1032, 1033], "C": [1027, 1028], "E": [1055, 1084, 1085, 1086],
          "F": range(1069, 1073), "G": [1109, 1110]}
BOXES = [("A_target", 1757, 410, 1012, 1026), ("B_target", 162, 575, 1028, 1042), ("C_source", 822, 575, 1020, 1032),
         ("C_target", 1097, 740, 1048, 1060), ("D_source", 1427, 575, 1032, 1042), ("D_target", 492, 575, 1060, 1077),
         ("E_source", 162, 740, 1050, 1062), ("E_target", 1757, 740, 1078, 1092), ("F_source", 1097, 575, 1062, 1078),
         ("F_target", 822, 740, 1094, 1108), ("G_source", 822, 410, 1080, 1095), ("G_target", 1757, 575, 1102, 1122)]


def hopends():
    F = frames(1008, 1125)
    rows = []
    for name, cx, cy, a, b in BOXES:
        for f in range(a, b + 1):
            d = np.abs(F[f] - F[f - 1])[cy - 35:cy + 35, cx - 40:cx + 40]
            rows.append([name, f, int((d > 8).sum()), int(d.max())])
    write("fix_s05_hop_ends_source.csv", ["box", "frame", "changed_px_gt8", "max_diff"], rows)
    rows = []
    for f in range(1063, 1077):
        d = np.abs(F[f] - F[f - 1])[545:615, 1060:1140]
        rows.append([f, int(F[f][574, 1090]), int(F[f][574, 1090] - F[f - 1][574, 1090]), int((d > 8).sum()), int(d.max())])
    write("fix_s05_hop321_onset.csv", ["frame", "luma_1090_574", "diff_1090_574", "box_1060_545_80x70_px_gt8", "box_max_diff"], rows)


def census():
    det = {}
    for r in csv.DictReader(open(SCRATCH / "c2_s2_packets.csv")):
        if int(r["w"]) >= 6 and int(r["h"]) >= 6:
            det.setdefault(int(r["frame"]), []).append((float(r["cx"]), float(r["cy"])))

    def merged(pts):
        out = []
        for p in pts:
            if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > 16 ** 2 for q in out):
                out.append(p)
        return len(out)

    rows = []
    for f in range(1016, 1114):
        on = [k for k, (_, _, _, a, b) in HOPS.items() if (a is None or a <= f) and f <= b]
        hid = [k for k in on if f in HIDDEN.get(k, [])]
        rows.append([f, "".join(on), len(on), "".join(hid), len(on) - len(hid), merged(det.get(f, []))])
    write("fix_s05_dot_census.csv", ["frame", "hops_on_screen", "n_on_screen", "hops_hidden", "n_visible", "detector_dots_c2_s2_packets"], rows)
    for i, name in ((2, "on screen"), (4, "visible"), (5, "detector")):
        v = [r[i] for r in rows]
        print(f"{name}: {min(v)}-{max(v)}, mean {sum(v) / len(v):.2f}, frames with 3: {[r[0] for r in rows if r[i] == 3]}")
    print("hops:", {k: h[0] for k, h in HOPS.items()})


def _ease(t, x1, y1, x2, y2):
    t = np.clip(t, 0, 1)
    u = t.copy()
    for _ in range(40):
        x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3 - t
        dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2)
        u = np.clip(u - x / np.where(np.abs(dx) < 1e-9, 1e-9, dx), 0, 1)
    return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3


def hopfits():
    from scipy.optimize import least_squares
    i2 = json.load(open(VDIR / "curves" / "v4.particle-edge-packets.i2.json"))["bezier"]
    shape = (i2["x1"], i2["y1"], i2["x2"], i2["y2"])
    rows = list(csv.DictReader(open(SCRATCH / "gap_s05_hop_speeds.csv")))
    cases = {
        "grey_321": ("hop6", (1097.0, 575.0), (822.1, 739.4), lambda f, a: 1078 <= f <= 1103),
        "dark_949": ("hop7", (822.0, 410.0), (1757.0, 575.0), lambda f, a: a >= 80),
    }
    out = {"shape": {"from": "curves/v4.particle-edge-packets.i2.json", "bezier": shape}}
    for name, (h, p0, p1, use) in cases.items():
        R = [r for r in rows if r["hop"].startswith(h)]
        P0, P1 = np.array(p0), np.array(p1)
        L = float(np.linalg.norm(P1 - P0))
        u = (P1 - P0) / L
        fr = np.array([int(r["frame"]) for r in R])
        ar = np.array([float(r["area"]) for r in R])
        s = (np.array([[float(r["cx"]), float(r["cy"])] for r in R]) - P0) @ u
        m = np.array([use(f, a) for f, a in zip(fr, ar)])
        r1 = least_squares(lambda p: L * _ease((fr[m] - p[0]) / p[1], *shape) - s[m], [fr[m][0] - 8, 31])
        rm1 = math.sqrt(float(np.mean(r1.fun ** 2)))
        r2 = least_squares(lambda p: L * _ease((fr[m] - p[4]) / p[5], *p[:4]) - s[m], [*shape, r1.x[0], r1.x[1]],
                           bounds=([0, -0.5, 0, 0.5, 1000, 10], [1, 0.5, 1, 1.5, 1200, 60]))
        rm2 = math.sqrt(float(np.mean(r2.fun ** 2)))
        ex = ~m
        out[name] = {
            "length_px": round(L, 1), "samples": [int(f) for f in fr[m]],
            "shape_fit": {"start_frame": round(float(r1.x[0]), 2), "D": round(float(r1.x[1]), 2),
                          "end_frame": round(float(r1.x[0] + r1.x[1]), 2), "rmse_px": round(rm1, 2), "rmse_of_length": round(rm1 / L, 4)},
            "free_bezier": {"bezier": [round(float(v), 3) for v in r2.x[:4]], "start_frame": round(float(r2.x[4]), 2),
                            "D": round(float(r2.x[5]), 2), "rmse_px": round(rm2, 2), "rmse_of_length": round(rm2 / L, 4)},
            "excluded": {str(int(f)): {"measured_px": round(float(v), 1), "shape_fit_px": round(float(L * _ease(np.array([(f - r1.x[0]) / r1.x[1]]), *shape)[0]), 1)}
                         for f, v in zip(fr[ex], s[ex])},
        }
    p = SCRATCH / "fix_s05_hop_fits.json"
    p.write_text(json.dumps(out, indent=1))
    print(p)
    print(json.dumps(out, indent=1))


def _runs(ys):
    if len(ys) == 0:
        return []
    out, s, p = [], ys[0], ys[0]
    for y in ys[1:]:
        if y != p + 1:
            out.append((int(s), int(p)))
            s = y
        p = y
    out.append((int(s), int(p)))
    return out


def term():
    F = frames(428, 500)
    rows = []
    for f in (431, 432, 446, 447, 448, 449, 470, 494, 496, 497):
        img = F[f]
        prof = (img[500:870, 1036:1790] > 60).sum(axis=1)
        for a, b in _runs(np.nonzero(prof > 0)[0]):
            w = prof[a:b + 1]
            c = float((np.arange(a, b + 1) * w).sum() / w.sum())
            rows.append([f, "ink_run", a + 500, b + 500, round(c + 500, 1), ""])
        sub = img[808:858, 1045:1110] > 60
        for x0, x1 in _runs(np.nonzero(sub.any(axis=0))[0] + 1045):
            yy = _runs(np.nonzero((img[808:858, x0:x1 + 1] > 60).any(axis=1))[0] + 808)
            rows.append([f, f"prompt_glyph_x{x0}-{x1}", yy[0][0], yy[-1][1], "", int(img[808:858, x0:x1 + 1].max())])
        for y in range(795, 870):
            n = int(((img[y, 1030:1790] > 40) & (img[y, 1030:1790] < 120)).sum())
            if n > 300:
                rows.append([f, "box_outline_row", y, y, "", n])
    for f in (432, 447, 448):
        d = np.abs(F[f] - F[f - 1])[740:850, 1030:1800] > 30
        ys = np.nonzero(d.any(axis=1))[0] + 740
        xs = np.nonzero(d.any(axis=0))[0] + 1030
        for a, b in _runs(ys):
            rows.append([f, f"diff_gt30_x{int(xs.min())}-{int(xs.max())}", a, b, "", ""])
    write("fix_s02_terminal_rows.csv", ["frame", "what", "y0", "y1", "ink_centre_y", "extra"], rows)


def brtile():
    F = frames(796, 816)
    rows = []
    for f in range(797, 816):
        d = np.abs(F[f] - F[f - 1])[780:880, 1400:1600]
        m = d > 8
        ys, xs = np.nonzero(m)
        bb = [int(xs.min()) + 1400, int(ys.min()) + 780, int(xs.max()) + 1400, int(ys.max()) + 780] if len(xs) else ["", "", "", ""]
        rows.append([f, int(m.sum()), int(d.max()), *bb])
    write("fix_s04_br_tile_source.csv", ["frame", "changed_px_gt8", "max_diff", "x0", "y0", "x1", "y1"], rows)


def chatspin():
    F = frames(570, 680)
    rows = []
    for f in range(572, 680):
        dc = np.abs(F[f] - F[f - 1])[750:786, 240:272]
        dt = np.abs(F[f] - F[f - 1])[762:792, 1030:1058]
        rows.append([f, int((dc > 30).sum()), int(dc.max()), int((dt > 30).sum()), int(dt.max())])
    write("fix_s03_spinner_cells_source.csv", ["frame", "chat_cell_px_gt30", "chat_cell_max", "term_cell_px_gt30", "term_cell_max"], rows)


def f1():
    F = frames(0, 5)
    types = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pict_type",
                            "-of", "csv=p=0", "-read_intervals", "%+#24", str(SRC)], capture_output=True, text=True).stdout.split()[:6]
    rows = []
    for i in range(1, 6):
        d = np.abs(F[i] - F[i - 1])
        ys, xs = np.nonzero(d > 8)
        cnt = {}
        for x, y in zip(xs, ys):
            k = min(ICONS, key=lambda j: (ICONS[j][0] - x) ** 2 + (ICONS[j][1] - y) ** 2)
            k = k if math.hypot(ICONS[k][0] - x, ICONS[k][1] - y) < 130 else "other"
            cnt[k] = cnt.get(k, 0) + 1
        dd = np.abs(F[i] - F[0])
        rows.append([i, types[i].strip(",") if i < len(types) else "", int((d > 8).sum()), int(d.max()),
                     json.dumps({str(k): v for k, v in sorted(cnt.items(), key=str)}), int((dd > 8).sum())])
    write("fix_f0001_source.csv", ["frame", "pict_type", "px_gt8_vs_previous", "max_diff", "px_gt8_by_icon", "px_gt8_vs_f0"], rows)
    print("pict types f0-f5:", types)


if __name__ == "__main__":
    {"pulse": pulse, "ring4": ring4, "hopends": hopends, "census": census, "hopfits": hopfits, "term": term,
     "brtile": brtile, "chatspin": chatspin, "f1": f1}[sys.argv[1]]()
