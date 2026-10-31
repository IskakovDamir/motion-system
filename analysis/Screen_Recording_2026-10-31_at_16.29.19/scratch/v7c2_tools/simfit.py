import sys
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
import numpy as np, cv2
from common import WorkReader, get_video
v = get_video('v7')
frames = [int(x) for x in sys.argv[1].split(',')]
r = WorkReader(v)
imgs = {f: r.read(f) for f in frames}
r.close()
def prep(g):
    g = g[:800, :1500]  # exclude bottom captions/speaker
    return cv2.resize(g, (750, 400), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
for a, b in zip(frames, frames[1:]):
    A, B = prep(imgs[a]), prep(imgs[b])
    best = None
    for s0 in (1.0, 1.1, 1.25, 1.4):
        warp = np.array([[s0, 0, (1 - s0) * 375], [0, s0, (1 - s0) * 200]], np.float32)
        try:
            cc, w = cv2.findTransformECC(A, B, warp.copy(), cv2.MOTION_AFFINE,
                                         (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
        except cv2.error:
            continue
        if best is None or cc > best[0]:
            best = (cc, w)
    if best is None:
        print(a, b, 'fail'); continue
    cc, w = best
    s = np.sqrt(abs(np.linalg.det(w[:, :2])))
    print(f'{a}->{b}: ecc {cc:.3f} scale {1/s:.3f} (B relative to A)  tx {w[0,2]:.1f} ty {w[1,2]:.1f}')
