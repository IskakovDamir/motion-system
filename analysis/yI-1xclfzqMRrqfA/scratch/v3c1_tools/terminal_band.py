"""Row highlight band behind the first line of the S03 bottom terminal.
Prints the luma column at x 940 and the row at y 754 (f400), and writes per-frame band / panel luma
(f340-f452) to scratch/v3c1_s03_band.csv: band = mean luma of x 900-950, y 735-773 (inside the band, no text);
panel = mean luma of x 900-950, y 790-830 (bare panel below the band); edges = first/last rows and columns
of the band at threshold panel + 8."""
import csv, sys
sys.path.insert(0, "/Users/damir/dev/motion-system/scripts/analysis")
import numpy as np
from common import WorkReader, get_video
D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
rd = WorkReader(get_video("v3"))
g = rd.read(400).astype(np.float32)
col = g[690:800, 940]
print("f400 column x940 y690-799:", " ".join(f"{int(v)}" for v in col))
row = g[754, :1000]
print("f400 row y754 x0-999 (every 5 px):", " ".join(f"{int(v)}" for v in row[::5]))
# band extents at f400
m = np.median(g[735:773, 0:1000], axis=0)
xs = np.nonzero(m >= 27)[0]
print("f400 band columns (median luma over y 735-772 >= 27):", xs.min(), xs.max(), "->", xs.max() - xs.min() + 1, "px")
cm = np.median(g[690:800, 900:950], axis=1)
ys = np.nonzero(cm >= 27)[0] + 690
print("f400 band rows (median luma over x 900-949 >= 27):", ys.min(), ys.max(), "->", ys.max() - ys.min() + 1, "px")
rows = []
for f in range(340, 453):
    h = rd.read(f).astype(np.float32)
    band = h[735:774, 900:951].mean(); panel = h[790:831, 900:951].mean(); left = h[735:774, 31:41].mean()
    cm = np.median(h[690:800, 900:950], axis=1); ys = np.nonzero(cm >= panel + 8)[0] + 690
    rows.append([f, f"{band:.1f}", f"{panel:.1f}", f"{left:.1f}", ys.min() if len(ys) else "", ys.max() if len(ys) else ""])
rd.close()
with open(D + "v3c1_s03_band.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["frame", "band_mean_x900-950", "panel_mean_x900-950_y790-830", "band_mean_x31-40", "band_top_y", "band_bottom_y"]); w.writerows(rows)
for r in rows:
    if r[0] <= 356 or r[0] % 10 == 0 or r[0] >= 438:
        print(*r)
