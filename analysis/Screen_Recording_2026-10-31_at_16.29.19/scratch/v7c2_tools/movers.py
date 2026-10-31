import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
a, b = int(sys.argv[1]), int(sys.argv[2]); thr = float(sys.argv[3]) if len(sys.argv) > 3 else 25
uniq = [int(r['frame']) for r in csv.DictReader(open(v.dir / 'motion.csv')) if r['unique'] == '1']
fr = [f for f in uniq if a <= f <= b]
r = WorkReader(v); prev = None
for f in fr:
    g = r.read(f).astype(np.float32)
    g[837:905, 1545:1613] = 0
    if prev is not None:
        d = np.abs(g - prev) > thr
        d = cv2.morphologyEx(d.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(d)
        comps = sorted([(st[i, 4], cen[i], st[i, :4]) for i in range(1, n)], key=lambda t: -t[0])[:3]
        print(f, ' | '.join(f'area {c[0]} at ({c[1][0]:.0f},{c[1][1]:.0f}) box {tuple(int(t) for t in c[2])}' for c in comps))
    prev = g
r.close()
