"""One line per technique, all videos: the catalogue architect's overview (analysis/techniques_digest.md).

Reads analysis/<video>/techniques.json (check_techniques.py format) and analysis/tokens.json.
Columns: id | concept | segments | reference frames | curve (property, measured frames, ease token) |
moves (element: property from -> to, frames) | look | typography (role, font, cap %, method).

  python digest_techniques.py
"""
from common import ANALYSIS, load_json, load_registry


def cell(s, n):
    s = " ".join(str(s or "").split()).replace("|", "/")
    return s if len(s) <= n else s[: n - 1] + "…"


def main():
    tokens = load_json(ANALYSIS / "tokens.json", {"curves": {}})["curves"]
    out = ["# Technique digest", "",
           "One line per technique of every timeline.md technique index (full records: analysis/<stem>/techniques.json).", ""]
    total = 0
    for v in load_registry():
        data = load_json(v.dir / "techniques.json")
        if not data:
            out += [f"## {v.key} ({v.stem}): techniques.json missing", ""]
            continue
        recs = data["techniques"]
        total += len(recs)
        out += [f"## {v.key} ({v.stem}): {len(recs)} techniques", "",
                "| id | concept | segments | frames | curve | moves | look | type |", "|---|---|---|---|---|---|---|---|"]
        for r in recs:
            cid = r.get("curve_id")
            tk = tokens.get(cid or "", {})
            curve = f"{r.get('curve_property')} {tk.get('measured_frames', '?')} f {tk.get('ease', '?')}" if cid else "-"
            moves = "; ".join(f"{m.get('element')}: {m.get('property')} {m.get('from')}->{m.get('to')} {m.get('frames')}f"
                              for m in (r.get("moves") or [])[:4])
            if len(r.get("moves") or []) > 4:
                moves += f"; +{len(r['moves']) - 4} more"
            ty = r.get("typography")
            tys = f"{ty.get('role')} {ty.get('closest_free')} {ty.get('size_pct_h')}% {ty.get('reveal_method')}" if ty else "-"
            rf = r.get("reference_frames") or ["?", "?"]
            out.append(f"| `{r['id']}` | {cell(r.get('concept'), 40)} | {','.join(r.get('segments') or [])} | f{rf[0]}-f{rf[1]} "
                       f"| {cell(curve, 48)} | {cell(moves, 220)} | {cell(r.get('look'), 160)} | {cell(tys, 60)} |")
        out.append("")
    (ANALYSIS / "techniques_digest.md").write_text("\n".join(out) + "\n")
    print(f"{total} techniques -> analysis/techniques_digest.md")


if __name__ == "__main__":
    main()
