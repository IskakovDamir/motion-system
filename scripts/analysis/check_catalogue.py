"""Check analysis/catalogue.json (technique -> primitive / variant) against every timeline.md.

catalogue.json:
  {"groups": [{"name": "camera", "dir": "camera", "primitives": ["WhipPan", ...]}],
   "primitives": [{"name": "WhipPan", "group": "camera", "kind": "camera", "description": "...",
                   "api": "...", "default_variant": "left",
                   "variants": [{"name": "left", "techniques": ["v7.trans-whip-push-left"],
                                 "curve": {"technique": "v7.trans-whip-push-left", "curve_id": "...", "property": "x"} | null,
                                 "params": {...}, "notes": "..."}]}]}
Rules: every technique of every technique index appears in exactly one variant; a variant reproduces at
most one curve; a technique whose index row cites a curve sits in a variant whose "curve" names it;
names are PascalCase (primitives) / camelCase (variants) and unique; groups partition the primitives.

  python check_catalogue.py
"""
import re
import sys

from common import ANALYSIS, load_json, load_registry
import validate_analysis

KINDS = {"text", "transition", "ui", "3d", "footage", "shape", "camera", "fx", "layout"}


def timeline_index():
    out = {}
    for v in load_registry():
        p = v.dir / "timeline.md"
        if not p.exists():
            continue
        for tid, cells in validate_analysis.technique_rows(p.read_text()) or []:
            m = re.search(r"curves/([^\s|`]+)\.csv", " ".join(cells))
            out[tid] = m.group(1) if m else None
    return out


def main():
    techs = timeline_index()
    cat = load_json(ANALYSIS / "catalogue.json")
    errs = []
    seen: dict[str, str] = {}
    names = set()
    for p in cat.get("primitives", []):
        n = p.get("name", "")
        if not re.fullmatch(r"[A-Z][A-Za-z0-9]+", n):
            errs.append(f"primitive name {n!r} is not PascalCase")
        if n in names:
            errs.append(f"primitive {n} listed twice")
        names.add(n)
        if p.get("kind") not in KINDS:
            errs.append(f"{n}: kind {p.get('kind')!r} not in {sorted(KINDS)}")
        vnames = set()
        for var in p.get("variants", []):
            vn = var.get("name", "")
            if not re.fullmatch(r"[a-z][A-Za-z0-9]*", vn):
                errs.append(f"{n}: variant name {vn!r} is not camelCase")
            if vn in vnames:
                errs.append(f"{n}: variant {vn} listed twice")
            vnames.add(vn)
            for tid in var.get("techniques", []):
                if tid in seen:
                    errs.append(f"{tid} in {seen[tid]} and {n}/{vn}")
                seen[tid] = f"{n}/{vn}"
                if tid not in techs:
                    errs.append(f"{n}/{vn}: {tid} is not in any technique index")
            c = var.get("curve")
            curve_techs = [t for t in var.get("techniques", []) if techs.get(t)]
            if len(curve_techs) > 1:
                errs.append(f"{n}/{vn}: {len(curve_techs)} curve techniques {curve_techs}; one per variant")
            if curve_techs:
                t = curve_techs[0]
                if not c or c.get("technique") != t or c.get("curve_id") != techs[t] or not c.get("property"):
                    errs.append(f"{n}/{vn}: curve must be {{technique: {t}, curve_id: {techs[t]}, property: <name>}}")
            elif c:
                errs.append(f"{n}/{vn}: names a curve but has no curve technique")
        if p.get("default_variant") not in vnames:
            errs.append(f"{n}: default_variant {p.get('default_variant')!r} is not one of its variants")
    grouped = {}
    for g in cat.get("groups", []):
        for n in g.get("primitives", []):
            if n in grouped:
                errs.append(f"{n} in groups {grouped[n]} and {g['name']}")
            grouped[n] = g["name"]
    for n in names:
        if n not in grouped:
            errs.append(f"{n} is in no group")
    for p in cat.get("primitives", []):
        if grouped.get(p["name"]) and p.get("group") != grouped[p["name"]]:
            errs.append(f"{p['name']}: group field {p.get('group')} but listed under {grouped[p['name']]}")
    missing = sorted(set(techs) - set(seen))
    errs += [f"{t} is in no variant" for t in missing]
    print(f"{len(techs)} techniques, {len(seen)} placed, {len(names)} primitives in {len(cat.get('groups', []))} groups")
    for e in errs[:80]:
        print("ERROR", e)
    if len(errs) > 80:
        print(f"... {len(errs) - 80} more")
    print("OK" if not errs else f"{len(errs)} errors")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
