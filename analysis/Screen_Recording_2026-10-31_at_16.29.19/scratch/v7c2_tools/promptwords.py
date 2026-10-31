import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np
from common import WorkReader, get_video
v = get_video('v7')
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
cum = {int(r['frame']): float(r['cum_x']) for r in csv.DictReader(open(base + 'v7c2_ui_scroll_phase.csv'))}
ref = cum[1126]
words = [(425, 506), (523, 594), (613, 882), (901, 951), (970, 993), (1012, 1036), (1054, 1220)]
y0, y1 = 432, 486
r = WorkReader(v)
fr = sorted(f for f in cum if 1079 <= f <= 1130)
data = []
for f in fr:
    g = r.read(f).astype(np.float32)
    sh = int(round(cum[f] - ref))
    vals = []
    for a, b in words:
        roi = g[y0:y1, a + sh - 3:b + sh + 4]
        vals.append(float(roi.mean()))
    data.append((f, vals))
r.close()
arr = np.array([d[1] for d in data])
lo = arr.min(0); hi = np.median(arr[-4:], 0)
for i in range(len(words)):
    p = (arr[:, i] - lo[i]) / (hi[i] - lo[i])
    print(f'w{i+1}:', ' '.join(f'{f}:{x:.2f}' for (f, _), x in zip(data, p)))
with open(base + 'v7c2_prompt_words.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['frame', 'unique'] + [f'w{i+1}' for i in range(len(words))])
    for f, vals in data: w.writerow([f, 1] + [f'{x:.2f}' for x in vals])
