import csv, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfiltfilt
base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
y, sr = sf.read(base + 'audio.wav')
if y.ndim > 1: y = y.mean(1)
sos = butter(4, [300, 3400], btype='band', fs=sr, output='sos')
yv = sosfiltfilt(sos, y)
off = 0.0423
win = float(sys.argv[3]) if len(sys.argv) > 3 else 0.08
n = int(len(y) / sr * 60) + 2
env = np.zeros(n)
for f in range(n):
    t = f / 60 - off
    a = int((t - win / 2) * sr); b = int((t + win / 2) * sr)
    if a < 0 or b > len(y): continue
    env[f] = np.sqrt(np.mean(yv[a:b] ** 2))
rows = [r for r in csv.DictReader(open(base + 'scratch/v7c2_icon_bars_bbox.csv')) if r['unique'] == '1']
fr = np.array([int(r['frame']) for r in rows]); h = np.array([float(r['h']) if r['h'] else 0 for r in rows])
lo, hi = int(sys.argv[1]), int(sys.argv[2])
m = (fr >= lo) & (fr <= hi)
fr, h = fr[m], h[m]
res = []
for lag in range(-45, 46):
    c = np.corrcoef(env[fr - lag], h)[0, 1]
    res.append((c, lag))
for c, lag in sorted(res, reverse=True)[:6]:
    print(f'lag {lag:+d} (bar height at f = voice envelope at f-{lag}): r = {c:.3f}')
