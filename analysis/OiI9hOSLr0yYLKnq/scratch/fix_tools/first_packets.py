"""Critic fix (v1): when do the S02 packet dots start?

For f126-f195 the previous picture is scaled about the frame centre by the measured camera step
(s2_pullback_steps.csv) and subtracted; dark round blobs of packet size that newly appear (darker by more than
70 levels, 12-30 px wide, fill above 0.55) are listed. Blobs inside the counter label (x 690-1250, y > 880)
are its changing digits. Writes ../fix_s2_first_packets.csv.
Run from this folder: ../../../../.venv/bin/python first_packets.py
"""
import csv
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import WorkReader, get_video  # noqa: E402

S = Path(__file__).resolve().parents[1]
v = get_video("v1")
sc = {int(r["frame"]): float(r["scale"]) for r in csv.DictReader(open(S / "s2_pullback_steps.csv"))}
r = WorkReader(v)
fr = {f: r.read(f).astype(np.float32) for f in range(124, 196)}
r.close()
H, W = fr[124].shape
rows = []
for f in range(126, 196):
    s = sc[f] / sc[f - 1]
    M = np.array([[s, 0, (1 - s) * 960], [0, s, (1 - s) * 540]], np.float32)
    prev = cv2.warpAffine(fr[f - 1], M, (W, H), flags=cv2.INTER_LINEAR, borderValue=246)
    app = ((prev - fr[f]) > 70).astype(np.uint8)
    app = cv2.morphologyEx(app, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(app, 8)
    for i in range(1, n):
        x, y, w, h, ar = st[i]
        if 120 <= ar <= 600 and 12 <= w <= 30 and 12 <= h <= 30 and ar / (w * h) > 0.55:
            cx, cy = x + w / 2, y + h / 2
            where = "counter label" if (cy > 880 and 690 < cx < 1250) else "network"
            rows.append([f, f"{cx:.0f}", f"{cy:.0f}", w, h, ar, f"{fr[f][y:y + h, x:x + w].mean():.0f}", f"{100 * (s - 1):+.2f}", where])
with open(S / "fix_s2_first_packets.csv", "w", newline="") as fh:
    wr = csv.writer(fh)
    wr.writerow(["frame", "cx", "cy", "w", "h", "area_px", "blob_mean_luma", "camera_step_pct", "where"])
    wr.writerows(rows)
net = [x for x in rows if x[-1] == "network"]
print(f"{len(rows)} candidates, {len(net)} in the network; first network candidates:")
for x in net[:12]:
    print("  ", x)
