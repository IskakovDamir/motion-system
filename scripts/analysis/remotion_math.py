"""Python port of Remotion 4.0.539 spring(), measureSpring(), Easing.bezier() and a clamped
interpolate(), line for line from node_modules/remotion/dist/cjs. Checked against Node by
scripts/analysis/check_remotion_port.mjs (max abs error printed there)."""
import math

import numpy as np

DEFAULT = {"damping": 10.0, "mass": 1.0, "stiffness": 100.0}


def _advance(anim, now, c, m, k):
    to, last, cur, vel = anim
    dt = min(now - last, 64)
    v0 = -vel
    x0 = to - cur
    zeta = c / (2 * math.sqrt(k * m))
    omega0 = math.sqrt(k / m)
    t = dt / 1000
    if zeta < 1:
        omega1 = omega0 * math.sqrt(1 - zeta ** 2)
        sin1, cos1 = math.sin(omega1 * t), math.cos(omega1 * t)
        env = math.exp(-zeta * omega0 * t)
        frag = env * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1)
        pos = to - frag
        v = zeta * omega0 * frag - env * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1)
    else:
        env = math.exp(-omega0 * t)
        pos = to - env * (x0 + (v0 + omega0 * x0) * t)
        v = env * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0)
    return (to, now, pos, v)


def spring_calc(frame, fps, damping=10.0, mass=1.0, stiffness=100.0):
    fc = max(0.0, float(frame))
    anim = (1.0, 0.0, 0.0, 0.0)
    for f in range(0, int(math.floor(fc)) + 1):
        anim = _advance(anim, f / fps * 1000, damping, mass, stiffness)
    rest = fc % 1
    if rest > 0:
        anim = _advance(anim, fc / fps * 1000, damping, mass, stiffness)
    return anim[2]


def spring_series(n, fps, damping=10.0, mass=1.0, stiffness=100.0):
    """spring value at integer frames 0..n-1 in one pass (same numbers as spring_calc)."""
    out = np.empty(n)
    anim = (1.0, 0.0, 0.0, 0.0)
    for f in range(n):
        anim = _advance(anim, f / fps * 1000, damping, mass, stiffness)
        out[f] = anim[2]
    return out


def measure_spring(fps, damping=10.0, mass=1.0, stiffness=100.0, threshold=0.005):
    frame = 0
    diff = abs(spring_calc(frame, fps, damping, mass, stiffness) - 1)
    while diff >= threshold:
        frame += 1
        diff = abs(spring_calc(frame, fps, damping, mass, stiffness) - 1)
        if frame > 100000:
            raise RuntimeError("spring never settles")
    finished = frame
    i = 0
    while i < 20:  # JS: for (i = 0; i < 20; i++) with i = 0 on a reset, then i++
        frame += 1
        diff = abs(spring_calc(frame, fps, damping, mass, stiffness) - 1)
        if diff >= threshold:
            i = 0
            finished = frame + 1
        i += 1
    return finished


def spring(frame, fps, damping=10.0, mass=1.0, stiffness=100.0, duration_in_frames=None, delay=0.0,
           overshoot_clamping=False, threshold=0.005):
    delayed = frame - delay
    processed = delayed
    if duration_in_frames is not None:
        natural = measure_spring(fps, damping, mass, stiffness, threshold)
        processed = delayed / (duration_in_frames / natural)
        if delayed > duration_in_frames:
            return 1.0
    v = spring_calc(processed, fps, damping, mass, stiffness)
    return min(v, 1.0) if overshoot_clamping else v


# ---- Easing.bezier (bezier-easing as shipped in Remotion) ----
_K = 11
_STEP = 1.0 / (_K - 1)


def _a(a1, a2):
    return 1.0 - 3.0 * a2 + 3.0 * a1


def _b(a1, a2):
    return 3.0 * a2 - 6.0 * a1


def _c(a1):
    return 3.0 * a1


def _calc(t, a1, a2):
    return ((_a(a1, a2) * t + _b(a1, a2)) * t + _c(a1)) * t


def _slope(t, a1, a2):
    return 3.0 * _a(a1, a2) * t * t + 2.0 * _b(a1, a2) * t + _c(a1)


def bezier(x1, y1, x2, y2):
    if not (0 <= x1 <= 1 and 0 <= x2 <= 1):
        raise ValueError("bezier x values must be in [0, 1] range")
    samples = np.array([_calc(i * _STEP, x1, x2) for i in range(_K)], dtype=np.float32).astype(float)

    def t_for_x(ax):
        start = 0.0
        cur = 1
        last = _K - 1
        while cur != last and samples[cur] <= ax:
            start += _STEP
            cur += 1
        cur -= 1
        dist = (ax - samples[cur]) / (samples[cur + 1] - samples[cur])
        guess = start + dist * _STEP
        s0 = _slope(guess, x1, x2)
        if s0 >= 0.001:
            g = guess
            for _ in range(4):
                sl = _slope(g, x1, x2)
                if sl == 0.0:
                    return g
                g -= (_calc(g, x1, x2) - ax) / sl
            return g
        if s0 == 0.0:
            return guess
        a, b = start, start + _STEP
        i = 0
        while True:
            ct = a + (b - a) / 2.0
            cx = _calc(ct, x1, x2) - ax
            if cx > 0.0:
                b = ct
            else:
                a = ct
            i += 1
            if not (abs(cx) > 1e-7 and i < 10):
                return ct

    def f(x):
        x = min(1.0, max(0.0, x))
        if x1 == y1 and x2 == y2:
            return x
        if x == 0:
            return 0.0
        if x == 1:
            return 1.0
        return _calc(t_for_x(x), y1, y2)

    return f


def eased(frame, duration, ease, delay=0.0):
    """interpolate(frame, [delay, delay + duration], [0, 1], {easing, clamp both sides})."""
    t = (frame - delay) / duration
    t = min(1.0, max(0.0, t))
    return ease(t)
