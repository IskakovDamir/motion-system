"""Technique data straight from the timelines (step 6): the catalogue architect's digest and the builders'
per-technique view. Nothing is re-typed: rows come out of timeline.md as the inspectors wrote them.

  python techniques.py digest            -> analysis/techniques_digest.md, one line per technique index row
  python techniques.py show <id> [...]   -> index row, every movement row naming the technique (all
                                            segments), the typography rows of those segments, the curve
                                            sidecar and its ease token

Other scripts import index(), blocks(), technique_moves() and typography() (gen_type.py, gen_timing.py).
"""
import re
import sys
from functools import lru_cache

from common import ANALYSIS, load_json, load_registry
import validate_analysis

HEAD = re.compile(r"^###\s+(S\d+)\s+·\s+f(\d+)-f(\d+)\s+·\s+(\w+)", re.M)


def table(body: str, title: str):
    m = re.search(r"\*\*" + title + r"\*\*\s*\n((?:\|.*\n?)+)", body)
    if not m:
        return [], []
    lines = [l for l in m.group(1).splitlines() if l.strip().startswith("|")]
    head = [c.strip().lower() for c in lines[0].strip().strip("|").split("|")]
    return head, [[c.strip() for c in l.strip().strip("|").split("|")] for l in lines[2:]]


@lru_cache(maxsize=None)
def blocks(key: str):
    """Segment blocks of a video's timeline: [{segment, start, end, cls, body}]."""
    v = next(x for x in load_registry() if x.key == key)
    md = (v.dir / "timeline.md").read_text()
    hs = list(HEAD.finditer(md))
    out = []
    for i, h in enumerate(hs):
        end = hs[i + 1].start() if i + 1 < len(hs) else len(md)
        body = md[h.end():end]
        cut = re.search(r"^##\s", body, re.M)
        out.append({"segment": h.group(1), "start": int(h.group(2)), "end": int(h.group(3)), "cls": h.group(4),
                    "body": body[:cut.start()] if cut else body})
    return out


@lru_cache(maxsize=None)
def index():
    """technique id -> {video, stem, category, segments, frames, curve, summary}."""
    out = {}
    for v in load_registry():
        for tid, cells in validate_analysis.technique_rows((v.dir / "timeline.md").read_text()) or []:
            m = re.search(r"curves/([^\s|`]+)\.csv", " ".join(cells))
            out[tid] = {"video": v.key, "stem": v.stem, "category": cells[1] if len(cells) > 1 else "",
                        "segments": cells[2] if len(cells) > 2 else "", "frames": cells[3] if len(cells) > 3 else "",
                        "curve": m.group(1) if m else None, "summary": cells[-1]}
    return out


def technique_moves(tid: str):
    """[(segment, {column: cell})] for every movement row whose technique column names tid."""
    key = index()[tid]["video"]
    out = []
    for b in blocks(key):
        head, rows = table(b["body"], "Movements")
        for r in rows:
            if f"`{tid}`" in (r[-1] if r else ""):
                out.append((b["segment"], dict(zip(head, r))))
    return out


def typography():
    """Every typography row of every timeline, parsed: [{video, segment, event, role, closest_free, weight,
    size_pct_h, tracking_em, case, reveal_unit, reveal_method, frames_per_unit, raw}]. A field the row
    does not give as a number stays None."""
    import type_metrics
    out = []
    for v in load_registry():
        rows = [(b["segment"], dict(zip(head, r))) for b in blocks(v.key) for head, rs in [table(b["body"], "Typography")] for r in rs]
        named = {}  # segment -> first (family name, weight) a row of it names
        for seg, c in rows:
            f = font_name(c.get("font (free / original)", ""))
            if family_key(f):
                named.setdefault(seg, (f, weight_of(c)))
        prev = (None, None)
        for seg, c in rows:
            cell = c.get("font (free / original)", "")
            font, w = font_name(cell), weight_of(c)
            if not family_key(font):
                # "same", "as above", "as S05 word 3", "see S20", "as the title lockup (S14)": the row names no
                # family itself, so it takes the family of the segment it points to, else of the row before it
                ref = re.search(r"\b(S\d+)", cell)
                src = named.get(ref.group(1)) if ref and ref.group(1) != seg else None
                if not src and re.match(r"(same|as |see |sans \()", cell.strip().lower()):
                    src = prev
                if src and src[0]:
                    font, w = f"{src[0]} (as {ref.group(1) if ref else 'the row before'})", w or src[1]
            cap_cell = c.get("cap h %", "")
            cap = measured_number(cap_cell, 0.5, 40)
            out.append({"video": v.key, "segment": seg, "event": c.get("event", ""),
                        "role": role_of(c.get("event", ""), cap), "closest_free": font, "weight": w,
                        "size_pct_h": cap, "tracking_em": tracking_em(c.get("tracking", ""), cap_cell, font, w, type_metrics),
                        "case": c.get("case", ""), "reveal_unit": c.get("unit", ""), "reveal_method": c.get("method", ""),
                        "frames_per_unit": frames_per_unit(c.get("speed f/unit", "")), "raw": c})
            if family_key(font):
                prev = (font, w)
    return out


def font_name(cell: str) -> str:
    """The free family a font cell names: its 'closest free X' clause, else the part before ' / '."""
    m = re.search(r"closest free\s+(?!for\b)([^/;]+)", cell)
    return (m.group(1) if m else cell.split(" / ")[0]).strip()


def weight_of(c: dict):
    return next((float(x) for x in re.findall(r"\b(\d{3})\b", c.get("weight", "")) if 100 <= float(x) <= 1000), None)


ROLE_WORDS = [  # first match wins: the inspectors' event names
    ("counter", r"counter|\bdigits\b|timer|percent"),
    ("caption", r"caption|subtitle"),
    ("label", r"\blabel|\btag\b|chip|badge|pill|button"),
    ("code", r"\bcode|monospace|terminal"),
    ("headline", r"headline|heading|title"),
    ("ui", r"\bui\b|placeholder|prompt|input|menu|status|message|chat|reply|list|row|field|tab"),
    ("body", r"body|paragraph|answer|text block|sentence"),
]


def role_of(event: str, cap):
    s = event.lower()
    for role, rx in ROLE_WORDS:
        if re.search(rx, s):
            if role == "headline" and cap and cap >= 8:
                return "display"
            return role
    if cap is None:
        return "ui"
    return "display" if cap >= 8 else "headline" if cap >= 5 else "subhead" if cap >= 3 else "ui"


def tracking_em(cell: str, cap_cell: str, font: str, weight, tm):
    """A tracking the row states in em, else one computed from the measured letter gap and flat cap in px
    (type_metrics: gap / font size - the family's default gap). None when the row gives neither."""
    m = re.search(r"tracking\s*([+-]?\d+(?:\.\d+)?)\s*em", cell)
    if m:
        return float(m.group(1))
    g = re.search(r"median\s+(\d+(?:\.\d+)?)\s*px", cell)
    gap = float(g.group(1)) if g else None
    if gap is None:
        g = re.search(r"gaps?\s+(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*px", cell)
        gap = (float(g.group(1)) + float(g.group(2))) / 2 if g else None
    c = re.search(r"\((\d+(?:\.\d+)?)\s*px", cap_cell)
    fam = family_key(font)
    if gap is None or not c or not fam:
        return None
    try:
        mm = tm.metrics(fam, int(weight or 400), None, tm.SETS["lower"])
    except Exception:
        return None
    return round(gap / (float(c.group(1)) / mm["cap_ratio"]) - mm["gap_em"], 3)


def family_key(name: str):
    s = name.lower()
    for key, word in FAMILY_WORDS:
        if word in s:
            return key
    return None


# FONT key -> the word that names its family in a font cell (first match wins: "inter tight" before "inter")
FAMILY_WORDS = (("mono", "mono"), ("round", "unbounded"), ("wide", "archivo"), ("square", "saira"),
                ("display", "inter tight"), ("ui", "inter"))


def frames_per_unit(cell: str):
    """Frames per unit when the speed cell is in frames (not counts or pixels per frame)."""
    return None if re.search(r"counts?\s*/\s*f|per frame", cell) else measured_number(cell, 0, 120)


NUMBER = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?(?![\d.])")
NOT_A_SIZE_BEFORE = re.compile(r"(?:\bf|\bS|\bx|\blines? |\bscale |\bwords? |\bphrase |\bclip |->\s*)$")


def measured_number(cell: str, lo: float, hi: float):
    """The first number of a free-text cell that is the cell's own measure: not a frame (f1932), a segment
    (S04), a factor (x0.66), a label index (line 1), a pixel value (36 px) or the end of a change (-> 1.52),
    and inside [lo, hi]."""
    for m in NUMBER.finditer(cell):
        before, after = cell[max(0, m.start() - 8):m.start()], cell[m.end():m.end() + 4]
        if NOT_A_SIZE_BEFORE.search(before) or re.match(r"\s*(?:px|x\b|%|-\s*(?:word|line|letter|char))", cell[m.end():m.end() + 10]):
            continue
        x = float(m.group(1))
        if lo <= x <= hi:
            return x
    return None


def num(x):
    m = re.search(r"-?\d+(?:\.\d+)?", str(x or ""))
    return float(m.group()) if m else None


def oneline(s):
    return " ".join(str(s or "").split()).replace("|", "/")


def digest():
    tokens = load_json(ANALYSIS / "tokens.json", {"curves": {}})["curves"]
    idx = index()
    out = ["# Technique digest", "",
           "One line per technique index row of every timeline.md (generated by scripts/analysis/techniques.py digest).",
           "curve: the property the curve measures and its measured frames (curves/<id>.json), its ease token (analysis/tokens.json).",
           "moves: how many movement rows name the technique. Full rows: `techniques.py show <id>`.", ""]
    for v in load_registry():
        ids = [t for t, r in idx.items() if r["video"] == v.key]
        out += [f"## {v.key} ({v.stem}): {len(ids)} techniques", "",
                "| id | segments | frames | curve | moves | summary |", "|---|---|---|---|---|---|"]
        for t in ids:
            r = idx[t]
            tk = tokens.get(r["curve"] or "", {})
            side = load_json(v.dir / "curves" / f"{r['curve']}.json", {}) if r["curve"] else {}
            curve = (f"{side.get('property', '?')} {side.get('measured_duration_frames', '?')} f {tk.get('ease', '?')}"
                     if r["curve"] else "-")
            out.append(f"| `{t}` | {oneline(r['segments'])} | {oneline(r['frames'])} | {curve} | {len(technique_moves(t))} | {oneline(r['summary'])} |")
        out.append("")
    (ANALYSIS / "techniques_digest.md").write_text("\n".join(out) + "\n")
    print(f"{len(idx)} techniques -> analysis/techniques_digest.md")


def show(tid: str):
    idx = index()
    if tid not in idx:
        print(f"{tid}: not in any technique index")
        return
    r = idx[tid]
    v = next(x for x in load_registry() if x.key == r["video"])
    print(f"## {tid} ({r['video']}, analysis/{r['stem']}/timeline.md)")
    print(f"index: segments {r['segments']} | frames {r['frames']} | curve {r['curve'] or '-'}\n  {r['summary']}")
    moves = technique_moves(tid)
    print(f"movement rows ({len(moves)}):")
    for seg, c in moves:
        print(f"  [{seg}] " + " | ".join(f"{k}: {val}" for k, val in c.items() if k != "technique"))
    segs = {s for s, _ in moves} | set(re.findall(r"S\d+", r["segments"]))
    for b in blocks(r["video"]):
        if b["segment"] not in segs:
            continue
        head, rows = table(b["body"], "Typography")
        for row in rows:
            print(f"  typography [{b['segment']}] " + " | ".join(f"{k}: {val}" for k, val in zip(head, row)))
    if r["curve"]:
        side = load_json(v.dir / "curves" / f"{r['curve']}.json", {})
        tk = load_json(ANALYSIS / "tokens.json", {"curves": {}})["curves"].get(r["curve"], {})
        print(f"curve {r['curve']}: property {side.get('property')} ({side.get('unit')}), {side.get('from_value')} -> "
              f"{side.get('to_value')}, active f{(side.get('active_frames') or ['?', '?'])[0]}-f{(side.get('active_frames') or ['?', '?'])[1]}, "
              f"measured {side.get('measured_duration_frames')} f; token: ease {tk.get('ease')}, built {tk.get('built_frames')} f, rmse {tk.get('rmse')}")
    print()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "digest":
        digest()
    elif len(sys.argv) > 2 and sys.argv[1] == "show":
        for t in sys.argv[2:]:
            show(t)
    else:
        print(__doc__)
