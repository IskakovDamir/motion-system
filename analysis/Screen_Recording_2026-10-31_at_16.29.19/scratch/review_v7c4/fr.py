import cv2, numpy as np
V='/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/work.mp4'
_cache={}
def frames(a,b):
    cap=cv2.VideoCapture(V)
    cap.set(cv2.CAP_PROP_POS_FRAMES, a)
    out={}
    for f in range(a,b+1):
        ok,img=cap.read()
        if not ok: break
        out[f]=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    cap.release()
    return out
def bbox(img, x,y,w,h, thr):
    roi=img[y:y+h, x:x+w]
    m=roi>thr
    ys,xs=np.nonzero(m)
    if len(xs)==0: return None
    return (x+xs.min(), y+ys.min(), x+xs.max(), y+ys.max())
