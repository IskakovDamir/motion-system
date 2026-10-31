import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2])
y0, y1 = int(sys.argv[3]), int(sys.argv[4])
words = [tuple(int(t) for t in w.split('-')) for w in sys.argv[5].split(',')]
uniq = set(int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1')
r = WorkReader(v)
rows = []
for f in range(a, b + 1):
    if f not in uniq: continue
    g = r.read(f)
    vals = []
    for (x0, x1) in words:
        roi = g[y0:y1, x0:x1 + 1].astype(np.float32)
        vals.append(float(np.percentile(roi, 99) - np.median(roi)))
    rows.append((f, vals))
r.close()
fr = np.array([f for f, _ in rows]); arr = np.array([v for _, v in rows])
hi = np.median(arr[-4:], axis=0)
for i, w in enumerate(words):
    p = arr[:, i] / hi[i]
    s = ' '.join(f'{int(f)}:{x:.2f}' for f, x in zip(fr, p))
    print(f'word {i+1} {w} hi {hi[i]:.0f}:', s)
    print()
