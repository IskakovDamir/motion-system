"""Font metrics of the local free fonts, for turning measured type into numbers (step 6).

  python type_metrics.py weights <family> [--set lower|upper|digits]
      per available weight: stem width / cap height (vertical stem of l, I or 1) and the median ink gap
      between adjacent letters at tracking 0, both from the glyph outlines; pick the weight whose stem
      ratio matches the one measured on a still
  python type_metrics.py tracking <family> --cap-px C --gap-px G [--weight W] [--wdth X] [--set lower]
      tracking in em = G / font size - default gap of that set, with font size = C / cap ratio.
      C: flat cap height in px on the still; G: median gap between adjacent letters at the 50% ink level

families: ui (Inter), display (Inter Tight), wide (Archivo), round (Unbounded), mono (JetBrains Mono).
The default gap is right side bearing + next left side bearing, median over every ordered pair of the
set (kerning is not applied, so a value within about +-0.01 em of 0 means "the family's own spacing").
No on-screen text is needed: the gaps are measured on the still and compared with the family's own.
"""
import argparse
import string
from functools import lru_cache

import numpy as np
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

from common import ROOT

NODE = ROOT / "node_modules"
FILES = {
    "ui": ("var", "@fontsource-variable/inter/files/inter-latin-standard-normal.woff2"),
    "display": ("static", "@fontsource/inter-tight/files/inter-tight-latin-{w}-normal.woff2"),
    "wide": ("var", "@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2"),
    "round": ("static", "@fontsource/unbounded/files/unbounded-latin-{w}-normal.woff2"),
    "mono": ("static", "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-{w}-normal.woff2"),
}
SETS = {"lower": string.ascii_lowercase, "upper": string.ascii_uppercase, "digits": string.digits}
STEM = {"lower": "l", "upper": "I", "digits": "1"}


@lru_cache(maxsize=None)
def font(family: str, weight: int, wdth: float | None) -> TTFont:
    kind, path = FILES[family]
    if kind == "static":
        f = TTFont(NODE / path.format(w=weight))
    else:
        f = TTFont(NODE / path)
        axes = {a.axisTag: a for a in f["fvar"].axes}
        loc = {}
        if "wght" in axes:
            loc["wght"] = min(max(weight, axes["wght"].minValue), axes["wght"].maxValue)
        if "wdth" in axes and wdth is not None:
            loc["wdth"] = min(max(wdth, axes["wdth"].minValue), axes["wdth"].maxValue)
        for tag, a in axes.items():
            loc.setdefault(tag, a.defaultValue)
        f = instancer.instantiateVariableFont(f, loc)
    return f


def weights(family: str) -> list[int]:
    kind, path = FILES[family]
    if kind == "var":
        f = TTFont(NODE / path)
        a = next(x for x in f["fvar"].axes if x.axisTag == "wght")
        return [w for w in range(100, 1000, 100) if a.minValue <= w <= a.maxValue]
    return [w for w in range(100, 1000, 100) if (NODE / path.format(w=w)).exists()]


def bounds(f: TTFont, ch: str):
    gs = f.getGlyphSet()
    name = f.getBestCmap().get(ord(ch))
    if name is None:
        return None
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    if pen.bounds is None:
        return None
    x0, y0, x1, y1 = pen.bounds
    return x0, y0, x1, y1, f["hmtx"][name][0]


def metrics(family: str, weight: int, wdth: float | None, chars: str):
    f = font(family, weight, wdth)
    upm = f["head"].unitsPerEm
    b = {c: bounds(f, c) for c in chars}
    b = {c: v for c, v in b.items() if v}
    gaps = [(b[a][4] - b[a][2]) + b[c][0] for a in b for c in b]
    h = bounds(f, "H")
    cap = (h[3] if h else f["OS/2"].sCapHeight) / upm
    s = bounds(f, STEM[[k for k, v in SETS.items() if v == chars][0]] if chars in SETS.values() else "l")
    return {"cap_ratio": round(cap, 4), "gap_em": round(float(np.median(gaps)) / upm, 4),
            "stem_over_cap": round(((s[2] - s[0]) / upm) / cap, 4) if s else None}


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a1 = sub.add_parser("weights")
    a1.add_argument("family", choices=FILES)
    a1.add_argument("--set", default="lower", choices=SETS)
    a1.add_argument("--wdth", type=float)
    a2 = sub.add_parser("tracking")
    a2.add_argument("family", choices=FILES)
    a2.add_argument("--cap-px", type=float, required=True)
    a2.add_argument("--gap-px", type=float, required=True)
    a2.add_argument("--weight", type=int, default=400)
    a2.add_argument("--wdth", type=float)
    a2.add_argument("--set", default="lower", choices=SETS)
    a = ap.parse_args()
    if a.cmd == "weights":
        print(f"{a.family} ({a.set}): weight, stem/cap, default gap em, cap ratio")
        for w in weights(a.family):
            m = metrics(a.family, w, a.wdth, SETS[a.set])
            print(f"  {w}: stem/cap {m['stem_over_cap']}, gap {m['gap_em']} em, cap ratio {m['cap_ratio']}")
    else:
        m = metrics(a.family, a.weight, a.wdth, SETS[a.set])
        size = a.cap_px / m["cap_ratio"]
        tr = a.gap_px / size - m["gap_em"]
        print(f"font size {size:.1f} px (cap {a.cap_px} px / cap ratio {m['cap_ratio']}); default gap {m['gap_em']} em; "
              f"measured gap {a.gap_px / size:.4f} em -> tracking {tr:+.3f} em")


if __name__ == "__main__":
    main()
