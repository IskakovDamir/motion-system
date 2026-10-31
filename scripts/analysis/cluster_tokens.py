"""Find a small set of shared ease tokens that reproduces every measured curve.

A token is a shape: Easing.bezier(x1, y1, x2, y2), or a spring config stretched to the motion's
duration with Remotion's spring({durationInFrames}). A use of a token adds an integer duration D
(60 fps frames). A curve is reproduced by a token when some D gives verify.py's pass: the built
duration (curvekit duration rule) within 1 frame of the measured one and the time-normalised shape
RMSE <= 0.05.

Candidates are the common named eases plus every curve's own best bezier and spring fit. A greedy
set cover keeps the fewest candidates that reproduce all curves (named eases win ties), then each
curve takes the kept token that fits it best.

  python cluster_tokens.py [--techniques]   # --techniques: only the curves timeline.md cites
Writes analysis/tokens.json:
  {"eases": {name: {"kind", ...params, "uses", "categories"}},
   "curves": {curve_id: {"video", "property", "ease", "duration", "measured_frames", "built_frames", "rmse"}},
   "uncovered": [...]}
"""
from __future__ import annotations

import argparse
import math
import re
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor

import numpy as np

from common import ANALYSIS, load_json, load_registry, save_json
from curvekit import active_window, shape_rmse
from remotion_math import bezier
from tune_tokens import tune_bezier

FPS = 60
RMSE_MAX = 0.049  # verify allows 0.05; keep a hair of headroom for float differences
DUR_TOL = 1
SHAPE_D = 240     # long duration for duration-free shape comparison
PAD = 60

LIBRARY = {
    "linear": (0.0, 0.0, 1.0, 1.0),
    "ease": (0.25, 0.1, 0.25, 1.0),
    "inOutSine": (0.37, 0.0, 0.63, 1.0), "inOutQuad": (0.45, 0.0, 0.55, 1.0),
    "inOutCubic": (0.65, 0.0, 0.35, 1.0), "inOutQuart": (0.76, 0.0, 0.24, 1.0),
    "inOutQuint": (0.83, 0.0, 0.17, 1.0), "inOutExpo": (0.87, 0.0, 0.13, 1.0),
    "outSine": (0.61, 1.0, 0.88, 1.0), "outQuad": (0.5, 1.0, 0.89, 1.0), "outCubic": (0.33, 1.0, 0.68, 1.0),
    "outQuart": (0.25, 1.0, 0.5, 1.0), "outQuint": (0.22, 1.0, 0.36, 1.0), "outExpo": (0.16, 1.0, 0.3, 1.0),
    "outCirc": (0.0, 0.55, 0.45, 1.0), "outBack": (0.34, 1.56, 0.64, 1.0),
    "inSine": (0.12, 0.0, 0.39, 0.0), "inQuad": (0.11, 0.0, 0.5, 0.0), "inCubic": (0.32, 0.0, 0.67, 0.0),
    "inQuart": (0.5, 0.0, 0.75, 0.0), "inQuint": (0.64, 0.0, 0.78, 0.0), "inExpo": (0.7, 0.0, 0.84, 0.0),
}
SPRING_K = 100.0  # canonical stiffness; with durationInFrames only the damping ratio shapes the curve


# ------------------------------------------------------------------ built curves
def spring_x(t, k, c, m=1.0):
    """Remotion's springCalculation from rest to 1, closed form (equal to the port to 2e-16)."""
    t = np.asarray(t, float)
    w0 = math.sqrt(k / m)
    z = c / (2 * math.sqrt(k * m))
    if z < 1:
        w1 = w0 * math.sqrt(1 - z * z)
        env = np.exp(-z * w0 * t)
        return 1 - env * (np.sin(w1 * t) * (z * w0 / w1) + np.cos(w1 * t))
    env = np.exp(-w0 * t)
    return 1 - env * (1 + w0 * t)


def natural_frames(k, c, m=1.0, threshold=0.005):
    """measureSpring at 60 fps."""
    n = 4000
    x = spring_x(np.arange(n) / FPS, k, c, m)
    off = np.abs(x - 1) >= threshold
    frame = int(np.argmax(~off)) if (~off).any() else n
    finished = frame
    i = 0
    while i < 20:
        frame += 1
        if frame >= n or off[frame]:
            i = 0
            finished = frame + 1
        i += 1
        if frame > n + 50:
            break
    return finished


_T = np.linspace(0.0, 1.0, 4001)


class Token:
    def __init__(self, name, kind, params, origin):
        self.name, self.kind, self.params, self.origin = name, kind, params, origin
        self._cache: dict[tuple[int, bool], np.ndarray] = {}
        if kind == "bezier":
            x1, y1, x2, y2 = params
            # the curve as dense (x(t), y(t)) samples: a fast stand-in for Remotion's solver while
            # scoring candidates (within 1e-6 of it); final numbers use the exact port
            self._xs = 3 * (1 - _T) ** 2 * _T * x1 + 3 * (1 - _T) * _T ** 2 * x2 + _T ** 3
            self._ys = 3 * (1 - _T) ** 2 * _T * y1 + 3 * (1 - _T) * _T ** 2 * y2 + _T ** 3
            self._f = None
        else:
            self.natural = natural_frames(SPRING_K, params[0])

    def series(self, D: int, exact: bool = False) -> np.ndarray:
        """Built progress at frames 0..D+PAD for a motion of duration D (what progressAt gives)."""
        s = self._cache.get((D, exact))
        if s is not None:
            return s
        i = np.arange(D + PAD, dtype=float)
        if self.kind == "bezier":
            x = np.minimum(1.0, i / D)
            if exact:
                if self._f is None:
                    self._f = bezier(*self.params)
                s = np.array([self._f(v) for v in x])
            else:
                s = np.interp(x, self._xs, self._ys)
        else:
            s = spring_x(i * (self.natural / D) / FPS, SPRING_K, self.params[0])
            s[i > D] = 1.0
        self._cache[(D, exact)] = s
        return s

    def spec(self) -> dict:
        if self.kind == "bezier":
            x1, y1, x2, y2 = self.params
            return {"kind": "bezier", "x1": round(x1, 4), "y1": round(y1, 4), "x2": round(x2, 4), "y2": round(y2, 4)}
        c = self.params[0]
        return {"kind": "spring", "stiffness": SPRING_K, "damping": round(c, 3), "mass": 1,
                "damping_ratio": round(c / (2 * math.sqrt(SPRING_K)), 4)}


# ------------------------------------------------------------------ inputs
def technique_curves() -> set[str]:
    sys.path.insert(0, str(ANALYSIS.parent / "scripts" / "analysis"))
    import validate_analysis
    out = set()
    for v in load_registry():
        p = v.dir / "timeline.md"
        if not p.exists():
            continue
        for _tid, cells in validate_analysis.technique_rows(p.read_text()) or []:
            m = re.search(r"curves/([^\s|`]+)\.csv", " ".join(cells))
            if m:
                out.add(m.group(1))
    return out


def load_curves(only: set[str] | None):
    curves = []
    for v in load_registry():
        idx = load_json(v.dir / "curves" / "index.json", {"curves": {}})["curves"]
        for cid, e in sorted(idx.items()):
            if only is not None and cid not in only:
                continue
            f = v.dir / "curves" / f"{cid}.csv"
            if not f.exists():
                continue
            d = np.genfromtxt(f, delimiter=",", names=True)
            mf, mp = d["frame"].astype(float), d["progress"].astype(float)
            try:
                _, _, md = active_window(mf, mp)
            except ValueError as err:
                print(f"skip {cid}: {err}")
                continue
            curves.append({"id": cid, "video": v.key, "property": e.get("property"), "mf": mf, "mp": mp, "md": md,
                           "category": cid.split(".")[1].split("-")[0], "fit": e})
    return curves


# ------------------------------------------------------------------ scoring
def shape_score(tok: Token, c) -> float:
    b = tok.series(SHAPE_D)
    try:
        r, _, _ = shape_rmse(c["mf"], c["mp"], np.arange(len(b)), b)
    except ValueError:
        return 9.0
    return r


def fit_duration(tok: Token, c, exact: bool = False):
    """Best integer D: built duration within DUR_TOL of measured, lowest RMSE. None if no D passes."""
    b = tok.series(SHAPE_D)
    try:
        _, _, bd240 = active_window(np.arange(len(b)), b)
    except ValueError:
        return None
    frac = max(bd240 / SHAPE_D, 1e-3)
    D0 = c["md"] / frac
    best = None
    for D in range(max(1, int(math.floor(D0)) - 3), int(math.ceil(D0)) + 4):
        s = tok.series(D, exact)
        try:
            r, md, bd = shape_rmse(c["mf"], c["mp"], np.arange(len(s)), s)
        except ValueError:
            continue
        if abs(bd - md) <= DUR_TOL and r <= RMSE_MAX and (best is None or r < best[1]):
            best = (D, r, bd)
    return best


def own_fit(c):
    """(bezier params, damping) of one curve's own best fit."""
    try:
        tb = tune_bezier(c["mf"], c["mp"], c["md"], (0.42, 0.0, 0.58, 1.0))
        q = (tb["params"]["x1"], tb["params"]["y1"], tb["params"]["x2"], tb["params"]["y2"])
    except Exception:  # noqa: BLE001 - a failed fit only removes one candidate
        q = None
    best = None
    for z in np.linspace(0.12, 1.4, 65):
        tok = Token("tmp", "spring", (2 * z * math.sqrt(SPRING_K),), "fit")
        r = shape_score(tok, c)
        if best is None or r < best[0]:
            best = (r, 2 * z * math.sqrt(SPRING_K))
    return c["id"], q, best[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--techniques", action="store_true", help="only the curves that timeline.md technique rows cite")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--grid", action="store_true", help="add a coarse grid of bezier shapes as candidates")
    a = ap.parse_args()
    only = technique_curves() if a.techniques else None
    curves = load_curves(only)
    print(f"{len(curves)} curves")

    tokens = [Token(n, "bezier", p, "library") for n, p in LIBRARY.items()]
    tokens += [Token(f"springZ{z:.2f}", "spring", (2 * z * math.sqrt(SPRING_K),), "library") for z in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0)]
    # a coarse grid of shapes lets the cover find tokens that serve many curves at once
    if a.grid:
        for x1 in np.arange(0.0, 0.95, 0.1):
            for y1 in (0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4):
                for x2 in np.arange(0.1, 1.05, 0.1):
                    for y2 in (0.6, 0.8, 1.0, 1.1, 1.25):
                        tokens.append(Token(f"grid:{x1:.1f},{y1:.1f},{x2:.1f},{y2:.1f}", "bezier",
                                            (round(float(x1), 2), y1, round(float(x2), 2), y2), "grid"))
    # each curve's own fits from fit_easing.py (its sidecar) are candidates too
    for c in curves:
        b, sp = c["fit"].get("bezier") or {}, c["fit"].get("spring") or {}
        if {"x1", "y1", "x2", "y2"} <= b.keys() and 0 <= b["x1"] <= 1 and 0 <= b["x2"] <= 1:
            tokens.append(Token(f"fit:{c['id']}:bezier", "bezier", (b["x1"], b["y1"], b["x2"], b["y2"]), c["id"]))
        if sp.get("damping_ratio"):
            tokens.append(Token(f"fit:{c['id']}:spring", "spring", (2 * float(sp["damping_ratio"]) * math.sqrt(SPRING_K),), c["id"]))
    print(f"{len(tokens)} candidate tokens")

    passes: dict[int, dict[int, tuple]] = {}

    def score_all(tis, cis):
        for ti in tis:
            for ci in cis:
                if shape_score(tokens[ti], curves[ci]) > 0.06:
                    continue
                fd = fit_duration(tokens[ti], curves[ci])
                if fd:
                    passes.setdefault(ti, {})[ci] = fd

    score_all(range(len(tokens)), range(len(curves)))
    # curves no candidate reproduces get a freshly optimised fit of their own
    lonely = [ci for ci in range(len(curves)) if not any(ci in p for p in passes.values())]
    if lonely:
        print(f"{len(lonely)} curves need their own optimised fit")
        with ProcessPoolExecutor(max_workers=a.workers) as ex:
            fits = list(ex.map(own_fit, [curves[ci] for ci in lonely]))
        start = len(tokens)
        for cid, q, damping in fits:
            if q is not None:
                tokens.append(Token(f"fit:{cid}:bezier*", "bezier", q, cid))
            tokens.append(Token(f"fit:{cid}:spring*", "spring", (damping,), cid))
        score_all(range(start, len(tokens)), range(len(curves)))
    uncovered = set(range(len(curves)))
    chosen: list[int] = []
    while uncovered:
        def key(ti):
            got = [ci for ci in passes.get(ti, {}) if ci in uncovered]
            mean = np.mean([passes[ti][ci][1] for ci in got]) if got else 9
            rank = {"library": 2, "grid": 1}.get(tokens[ti].origin, 0)
            return (len(got), rank, -mean)
        best = max(range(len(tokens)), key=key)
        gain = [ci for ci in passes.get(best, {}) if ci in uncovered]
        if not gain:
            break
        chosen.append(best)
        uncovered -= set(gain)
        print(f"  + {tokens[best].name:60s} covers {len(gain):3d}, left {len(uncovered)}")

    out_curves = {}
    uses = Counter()
    cats: dict[int, Counter] = {}
    for ci, c in enumerate(curves):
        opts = sorted((passes[ti][ci][1], ti) for ti in chosen if ci in passes.get(ti, {}))
        hit = None
        for _, ti in opts:  # confirm with Remotion's exact bezier solver
            fd = fit_duration(tokens[ti], c, exact=True)
            if fd:
                hit = (ti, fd)
                break
        if not hit:
            uncovered.add(ci)
            continue
        ti, (D, r, bd) = hit
        uses[ti] += 1
        cats.setdefault(ti, Counter())[c["category"]] += 1
        out_curves[c["id"]] = {"video": c["video"], "property": c["property"], "ease": ti, "duration": int(D),
                               "measured_frames": int(round(c["md"])), "built_frames": int(round(bd)), "rmse": round(float(r), 4)}
    names = {}
    for ti in chosen:
        if uses[ti] == 0:
            continue
        tok = tokens[ti]
        names[ti] = tok.name if tok.origin in ("library", "grid") else f"{tok.kind}:{tok.origin}"
    for e in out_curves.values():
        e["ease"] = names[e["ease"]]
    eases = {names[ti]: dict(tokens[ti].spec(), uses=uses[ti], categories=dict(cats[ti].most_common()), origin=tokens[ti].origin)
             for ti in chosen if uses[ti]}
    save_json(ANALYSIS / "tokens.json", {"rmse_max": RMSE_MAX, "duration_tolerance": DUR_TOL, "eases": eases,
                                         "curves": out_curves, "uncovered": [curves[ci]["id"] for ci in sorted(uncovered)]})
    print(f"{len(eases)} ease tokens reproduce {len(out_curves)}/{len(curves)} curves; uncovered: {len(uncovered)}")


if __name__ == "__main__":
    main()
