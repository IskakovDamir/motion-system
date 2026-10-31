# estimate Gaussian blur sigma (px) of a region vs a sharp reference frame, after aligning by integer shift
import sys, csv
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
x, y, w, h = [int(t) for t in sys.argv[1].split(',')]
ref_f = int(sys.argv[2]); frames = [int(t) for t in sys.argv[3].split(',')]
axis = sys.argv[4] if len(sys.argv) > 4 else 'iso'  # iso or x (horizontal motion blur)
r = WorkReader(v)
ref = r.read(ref_f).astype(np.float32)
R = ref[y:y + h, x:x + w]
for f in frames:
    g = r.read(f).astype(np.float32)
    best = None
    for dy in range(-14, 15):
        for dx in range(-6, 7):
            C = g[y + dy:y + dy + h, x + dx:x + dx + w]
            if C.shape != R.shape: continue
            for s in [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]:
                if s == 0: B = R
                elif axis == 'iso': B = cv2.GaussianBlur(R, (0, 0), s)
                else:
                    k = int(2 * s + 1); ker = np.ones((1, k), np.float32) / k; B = cv2.filter2D(R, -1, ker)
                a = (B - B.mean()).ravel(); c = (C - C.mean()).ravel()
                cc = float(a @ c / (np.linalg.norm(a) * np.linalg.norm(c) + 1e-6))
                if best is None or cc > best[0]: best = (cc, s, dx, dy)
    cc, s, dx, dy = best
    print(f'f{f}: sigma {s} px ({100*s/1622:.2f}% W) shift dx {dx} dy {dy} corr {cc:.3f}')
r.close()
