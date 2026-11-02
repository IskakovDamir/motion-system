"""Positions and speeds of the two S05 hold hops that the S05 rows did not list, read from the dot
detector of the original analysis (scratch/c2_s2_packets.csv: one row per detected dot and frame).

  python hop_speeds.py OUT.csv
hop6: grey dot (1097,575) -> (822,740), detections f1072-f1103 (largest blob below-left of the source)
hop7: dark dot (822,410) -> (1757,575), detections f1087-f1112
"""
import csv
import math
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "c2_s2_packets.csv"
SEL = {
    "hop6_grey_1097-575_to_822-740": lambda f, x, y, a: 1072 <= f <= 1103 and 815 < x < 1100 and 570 < y < 745 and a > 40,
    "hop7_dark_822-410_to_1757-575": lambda f, x, y, a: 1087 <= f <= 1112 and 820 < x < 1760 and 400 < y < 575,
}

rows = list(csv.DictReader(open(SRC)))
out = []
for name, sel in SEL.items():
    best = {}
    for r in rows:
        f, x, y, a = int(r["frame"]), float(r["cx"]), float(r["cy"]), float(r["area"])
        if sel(f, x, y, a) and (f not in best or a > best[f][2]):
            best[f] = (x, y, a, float(r["luma"]))
    prev = None
    for f in sorted(best):
        x, y, a, lum = best[f]
        sp = ""
        if prev:
            sp = round(math.hypot(x - prev[1], y - prev[2]) / (f - prev[0]), 1)
        out.append([name, f, round(x, 1), round(y, 1), int(a), round(lum, 1), sp, (f - prev[0]) if prev else ""])
        prev = (f, x, y)
with open(sys.argv[1], "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["hop", "frame", "cx", "cy", "area", "luma", "speed_px_per_f", "over_frames"])
    w.writerows(out)
print(sys.argv[1], len(out), "rows")
