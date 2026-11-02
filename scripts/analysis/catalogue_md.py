"""Render analysis/catalogue.json as analysis/catalogue.md (generated; edit the JSON, not the markdown).

One section per group: each primitive with kind, description, api and param schema, then one line per
variant: its techniques (the curve technique first, with the curve and the property it drives) and
the measured ease and duration of that curve from analysis/tokens.json.

  python catalogue_md.py
"""
from common import ANALYSIS, load_json


def main():
    cat = load_json(ANALYSIS / "catalogue.json")
    tokens = load_json(ANALYSIS / "tokens.json", {"curves": {}})["curves"]
    prims = {p["name"]: p for p in cat["primitives"]}
    nvar = sum(len(p.get("variants", [])) for p in cat["primitives"])
    ntech = sum(len(v.get("techniques", [])) for p in cat["primitives"] for v in p.get("variants", []))
    out = ["# Primitive catalogue", "",
           f"Generated from `analysis/catalogue.json` by `scripts/analysis/catalogue_md.py`: {len(cat['groups'])} groups, "
           f"{len(prims)} primitives, {nvar} variants, {ntech} techniques.", ""]
    for g in cat["groups"]:
        gv = sum(len(prims[n].get("variants", [])) for n in g["primitives"] if n in prims)
        out += [f"## {g['name']} ({len(g['primitives'])} primitives, {gv} variants)", ""]
        for n in g["primitives"]:
            p = prims.get(n)
            if not p:
                out += [f"### {n}: missing from primitives", ""]
                continue
            out += [f"### {n} · {p.get('kind')}", "", p.get("description", ""), ""]
            if p.get("api"):
                out += [f"API: `{p['api']}`", ""]
            if p.get("params"):
                out += ["Params: " + "; ".join(f"`{x.get('name')}` ({x.get('unit')}) {x.get('meaning', '')}".strip() for x in p["params"]), ""]
            out += ["| variant | curve (property, ease, frames) | techniques |", "|---|---|---|"]
            for v in p.get("variants", []):
                c = v.get("curve") or {}
                tk = tokens.get(c.get("curve_id") or "", {})
                curve = (f"`{c['curve_id']}` {c.get('property')}, {tk.get('ease', '?')}, {tk.get('measured_frames', '?')} f"
                         if c.get("curve_id") else "-")
                techs = v.get("techniques", [])
                if c.get("technique") in techs:
                    techs = [c["technique"]] + [t for t in techs if t != c["technique"]]
                name = f"`{v['name']}`" + (" (default)" if v["name"] == p.get("default_variant") else "")
                out.append(f"| {name} | {curve} | {', '.join(f'`{t}`' for t in techs) or '-'} |")
            out.append("")
    (ANALYSIS / "catalogue.md").write_text("\n".join(out) + "\n")
    print(f"catalogue.md: {len(cat['groups'])} groups, {len(prims)} primitives, {nvar} variants, {ntech} techniques")


if __name__ == "__main__":
    main()
