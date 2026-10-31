# locate the bright vertical scan band inside the full-frame card: column luma excess over the larger of the
# column profiles of a picture before and a picture after the sweep (rows 60-860, card x 47-1577)
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
a, b, fb, fa, name = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
r = WorkReader(v)
def prof(f):
    g = r.read(f).astype(np.float32)[60:860, :]
    return g.mean(0)
pb, pa = prof(fb), prof(fa)
base = np.maximum(pb, pa)
rows = []
for f in [u for u in uniq if a <= u <= b]:
    p = prof(f)
    ex = p - base
    ex[:47] = 0; ex[1577:] = 0
    # smooth
    k = np.ones(9) / 9
    exs = np.convolve(ex, k, mode='same')
    i = int(np.argmax(exs)); peak = float(exs[i])
    # band extent: columns where smoothed excess > half the peak, contiguous around i
    if peak > 3:
        lo = i
        while lo > 47 and exs[lo - 1] > peak / 2: lo -= 1
        hi = i
        while hi < 1576 and exs[hi + 1] > peak / 2: hi += 1
    else:
        lo = hi = ''
    # which side has changed: compare to before/after (mean abs diff of columns left / right of the band)
    rows.append([f, 1, i, f'{100 * i / 1622:.2f}', f'{100 * (i - 47) / 1530:.2f}', f'{peak:.2f}', lo, hi, (hi - lo + 1) if peak > 3 else ''])
r.close()
out = v.dir / 'scratch' / f'{name}.csv'
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'band_x', 'band_x_pct', 'band_x_card_pct', 'peak_excess', 'lo', 'hi', 'width_px']); w.writerows(rows)
for x in rows: print(*x)
