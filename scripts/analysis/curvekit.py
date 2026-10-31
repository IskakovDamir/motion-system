"""Curve maths shared by fit_easing.py (measurement side) and scripts/verify.py (build side).

Duration rule (both sides): normalise a curve to progress p (0 = at rest before, 1 = settled
after). The active window starts at the last sample with p <= TOL before p first reaches 0.5,
and ends at the first sample from which every later sample stays within TOL of 1.
duration = end frame - start frame, in analysis frames (60 fps).

Shape rule: map each curve's active window to normalised time 0..1, linearly interpolate the
built curve at the measured sample times, RMSE of progress over the measured active samples.
"""
import numpy as np

TOL = 0.02


def normalise(values, v0=None, v1=None):
    values = np.asarray(values, float)
    if v0 is None:
        v0 = float(np.median(values[:3]))
    if v1 is None:
        v1 = float(np.median(values[-3:]))
    if abs(v1 - v0) < 1e-9:
        raise ValueError("start and end values are equal; nothing moves")
    return (values - v0) / (v1 - v0), v0, v1


def active_window(frames, p, tol=TOL):
    frames = np.asarray(frames, float)
    p = np.asarray(p, float)
    half = np.nonzero(p >= 0.5)[0]
    if len(half) == 0:
        raise ValueError("progress never reaches 0.5")
    h = int(half[0])
    before = np.nonzero(p[:h] <= tol)[0]
    s = int(before[-1]) if len(before) else 0
    e = len(p) - 1
    for i in range(h, len(p)):
        if np.all(np.abs(p[i:] - 1) <= tol):
            e = i
            break
    return s, e, float(frames[e] - frames[s])


def shape_rmse(m_frames, m_p, b_frames, b_p, tol=TOL):
    ms, me, md = active_window(m_frames, m_p, tol)
    bs, be, bd = active_window(b_frames, b_p, tol)
    mf = np.asarray(m_frames, float)[ms:me + 1]
    mp = np.asarray(m_p, float)[ms:me + 1]
    bf = np.asarray(b_frames, float)[bs:be + 1]
    bp = np.asarray(b_p, float)[bs:be + 1]
    xm = (mf - mf[0]) / max(1e-9, mf[-1] - mf[0])
    xb = (bf - bf[0]) / max(1e-9, bf[-1] - bf[0])
    pred = np.interp(xm, xb, bp)
    return float(np.sqrt(np.mean((pred - mp) ** 2))), md, bd
