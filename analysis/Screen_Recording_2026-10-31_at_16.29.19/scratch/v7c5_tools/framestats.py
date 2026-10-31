import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2])
out = sys.argv[3]
uniq = set()
for r in csv.DictReader(open(v.dir / 'motion.csv')):
    if r['unique'] == '1': uniq.add(int(r['frame']))
r = WorkReader(v)
prev = None
rows = []
for f in range(a, b + 1):
    g = r.read(f)
    m = g[:, :1540].astype(np.float32)  # exclude speaker icon column region roughly
    lum = float(m.mean())
    if prev is None:
        d = 0.0; hc = 1.0
    else:
        d = float(np.abs(m - prev).mean())
        h1 = cv2.calcHist([g[:, :1540]], [0], None, [64], [0, 256]); h0 = cv2.calcHist([prevg[:, :1540]], [0], None, [64], [0, 256])
        hc = float(cv2.compareHist(h0, h1, cv2.HISTCMP_CORREL))
    rows.append([f, int(f in uniq), f"{lum:.2f}", f"{d:.3f}", f"{hc:.4f}"])
    prev = m; prevg = g
r.close()
with open(out, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique', 'lum', 'absdiff', 'histcorr']); w.writerows(rows)
print('ok', len(rows))
