"""review helper: read frames of v4 work.mp4, make crops/strips, measure."""
import sys, cv2, numpy as np
sys.path.insert(0, '/Users/damir/dev/motion-system/scripts/analysis')
from common import WorkReader, get_video, label, tile, write_jpg
V = get_video('v4')
OUT = V.dir / 'scratch' / 'review_v4c1_r2'

def frames(a, b, step=1):
    r = WorkReader(V)
    out = {}
    for f in range(a, b + 1, step):
        out[f] = r.read(f)
    r.close()
    return out

def crop_sheet(name, x, y, w, h, a, b, step=1, zoom=2, cols=8):
    fr = frames(a, b, step)
    ims = []
    for f, g in fr.items():
        c = g[y:y+h, x:x+w]
        c = cv2.resize(c, (w*zoom, h*zoom), interpolation=cv2.INTER_NEAREST)
        ims.append(label(c, f"f{f}", 0.5))
    sheet = tile(ims, cols, w*zoom, h*zoom)
    p = OUT / f"{name}.jpg"
    write_jpg(p, sheet, 90)
    print(p)
