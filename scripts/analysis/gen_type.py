"""Write src/motion/tokens/type.ts (step 7): the font families, per text role the family, weight, cap
height, tracking and case the references set, and per reveal method the unit, frames per unit and stagger.

  python gen_type.py

Medians over the typography records of analysis/<video>/techniques.json; each comment gives n and the
range. Cap height is in % of frame height (measured on full-res stills). CAP_RATIO (cap height / font size
of each family, read from the local font files) turns it into a font size: fontSize(role, frameHeight).
A family the inspectors named that none of the five local families stands for is reported, not guessed.
"""
import re
from collections import Counter

import numpy as np
from fontTools.ttLib import TTFont

from common import ROOT, load_registry, load_json

NODE = ROOT / "node_modules"
FAMILIES = {  # FONT key -> (CSS family list, file the cap height is read from, what it sets)
    "ui": ("'Inter Variable', system-ui, sans-serif", "@fontsource-variable/inter/files/inter-latin-standard-normal.woff2",
           "interface text: chips, prompts, labels, body"),
    "display": ("'Inter Tight', 'Inter Variable', sans-serif", "@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff2",
                "headlines"),
    "wide": ("'Archivo Variable', 'Inter Tight', sans-serif", "@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2",
             "wide black display (Archivo, wdth up to 125)"),
    "round": ("'Unbounded', 'Inter Tight', sans-serif", "@fontsource/unbounded/files/unbounded-latin-600-normal.woff2",
              "rounded geometric display"),
    "mono": ("'JetBrains Mono', ui-monospace, monospace", "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
             "code, counters, timers"),
}
ROLES = ["display", "headline", "subhead", "body", "ui", "label", "caption", "counter", "code"]
UNIT = {"char": "char", "letter": "char", "character": "char", "glyph": "char", "word": "word", "line": "line", "block": "block"}


def family_of(name):
    s = str(name or "").lower()
    for key, word in (("mono", "mono"), ("round", "unbounded"), ("wide", "archivo"), ("display", "inter tight"), ("ui", "inter")):
        if word in s:
            return key
    return None


def num(x):
    if isinstance(x, (int, float)):
        return float(x)
    m = re.search(r"-?\d+(?:\.\d+)?", str(x or ""))
    return float(m.group()) if m else None


def case_of(x):
    s = str(x or "").lower()
    for c in ("upper", "lower", "sentence", "title"):
        if c in s:
            return c
    return "mixed" if s else None


def med(vals, nd):
    return round(float(np.median(vals)), nd) if vals else None


def rng(vals):
    return f"{min(vals):g}-{max(vals):g}" if vals and min(vals) != max(vals) else (f"{vals[0]:g}" if vals else "none")


def main():
    cap = {}
    for k, (_, f, _) in FAMILIES.items():
        t = TTFont(NODE / f)
        cap[k] = round(t["OS/2"].sCapHeight / t["head"].unitsPerEm, 4)
    recs = []
    for v in load_registry():
        for r in load_json(v.dir / "techniques.json", {"techniques": []})["techniques"]:
            if r.get("typography"):
                recs.append((v.key, r["id"], r["typography"]))
    unmapped = Counter(str(t.get("closest_free")) for _, _, t in recs if not family_of(t.get("closest_free")))
    styles = []
    for role in ROLES:
        rs = [(k, i, t) for k, i, t in recs if t.get("role") == role]
        if not rs:
            continue
        fams = Counter(f for f in (family_of(t.get("closest_free")) for _, _, t in rs) if f)
        if not fams:
            continue
        weights = [w for w in (num(t.get("weight")) for _, _, t in rs) if w and 100 <= w <= 1000]
        caps = [c for c in (num(t.get("size_pct_h")) for _, _, t in rs) if c]
        tracks = [x for x in (t.get("tracking_em") for _, _, t in rs) if isinstance(x, (int, float))]
        cases = Counter(c for c in (case_of(t.get("case")) for _, _, t in rs) if c)
        wdth = [float(m.group(1)) for _, _, t in rs for m in [re.search(r"wdth\s*(\d+)", str(t.get("closest_free")))] if m]
        if not caps:
            continue
        vids = Counter(k for k, _, _ in rs)
        doc = (f"{len(rs)} text techniques ({', '.join(f'{k} {n}' for k, n in sorted(vids.items()))}); "
               f"cap height {rng(caps)} % H, weight {rng(weights)}, tracking {rng(tracks)} em")
        fields = [f"font: '{fams.most_common(1)[0][0]}'", f"weight: {int(med(weights, 0)) if weights else 400}" if weights else "weight: null",
                  f"capHeight: {med(caps, 2)}", f"tracking: {med(tracks, 3) if tracks else 'null'}",
                  f"case: '{cases.most_common(1)[0][0] if cases else 'mixed'}'"]
        if wdth:
            fields.append(f"stretch: {int(med(wdth, 0))}")
        styles.append(f"\t/** {doc} */\n\t{role}: {{{', '.join(fields)}}},")
    reveals = {}
    for k, i, t in recs:
        meth = re.sub(r"[^a-z]+", "-", str(t.get("reveal_method") or "").lower()).strip("-")
        unit = UNIT.get(str(t.get("reveal_unit") or "").lower())
        if not meth or not unit:
            continue
        reveals.setdefault((meth.split("-")[0], unit), []).append(t)
    rev = []
    for (meth, unit), ts in sorted(reveals.items()):
        fpu = [x for x in (num(t.get("frames_per_unit")) for t in ts) if x is not None and x > 0]
        st = [x for x in (num(t.get("stagger")) for t in ts) if x is not None and x > 0]
        name = meth + unit[:1].upper() + unit[1:]
        rev.append(f"\t/** {len(ts)} techniques; frames per unit {rng(fpu)}, stagger {rng(st)} */\n"
                   f"\t{name}: {{method: '{meth}', unit: '{unit}', framesPerUnit: {med(fpu, 2) if fpu else 'null'}, "
                   f"stagger: {med(st, 2) if st else 'null'}}},")
    font_lines = "\n".join(f"\t/** {doc} */\n\t{k}: `{css}`," for k, (css, _, doc) in FAMILIES.items())
    cap_lines = "\n".join(f"\t{k}: {v}," for k, v in cap.items())
    body = (
        "// Typography tokens. Families are the closest free fonts to what the references set (MOTION_SPEC.md,\n"
        "// typography), loaded from local @fontsource files by src/motion/engine/loadFonts.ts. Roles and reveals are\n"
        "// medians of the measured text techniques. Generated by scripts/analysis/gen_type.py.\n\n"
        "export const FONT = {\n" + font_lines + "\n} as const;\n\n"
        "export type FontRole = keyof typeof FONT;\n\n"
        "/** Cap height / font size of each family (OS/2 sCapHeight / unitsPerEm of the local font file). */\n"
        "export const CAP_RATIO: Record<FontRole, number> = {\n" + cap_lines + "\n};\n\n"
        "export type TextCase = 'upper' | 'lower' | 'sentence' | 'title' | 'mixed';\n\n"
        "/** capHeight in % of frame height; tracking in em (null: not measured, use the family's own); stretch in %. */\n"
        "export type TypeStyle = {font: FontRole; weight: number | null; capHeight: number; tracking: number | null; case: TextCase; stretch?: number};\n\n"
        "/** Per text role, what the references set. */\n"
        "export const TYPE = {\n" + "\n".join(styles) + "\n} as const satisfies Record<string, TypeStyle>;\n\n"
        "export type TypeRole = keyof typeof TYPE;\n\n"
        "/** Font size (px) that gives `role` its measured cap height on a frame `height` px tall. */\n"
        "export const fontSize = (role: TypeRole, height: number): number => {\n"
        "\tconst t: TypeStyle = TYPE[role];\n"
        "\treturn ((t.capHeight / 100) * height) / CAP_RATIO[t.font];\n};\n\n"
        "/** Text reveals: unit, frames each unit takes and frames between units (null: not measured). */\n"
        "export const REVEAL = {\n" + "\n".join(rev) + "\n} as const;\n"
    )
    (ROOT / "src" / "motion" / "tokens" / "type.ts").write_text(body)
    print(f"type.ts: {len(styles)} roles, {len(rev)} reveals from {len(recs)} text techniques; cap ratios {cap}")
    if unmapped:
        print("families with no local stand-in (decide, do not guess):", dict(unmapped))


if __name__ == "__main__":
    main()
