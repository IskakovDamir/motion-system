"""Structural check of one video's final analysis (or all): python validate_analysis.py [v1 ...]

Errors (exit 1): segments do not tile the timeline, unknown class, LIVE segment without the
overview sheets that confirmed it, cut candidates left undecided, timeline.md missing a GRAPHICS
or MIXED segment, missing technique index or summary, technique index naming a curve that does
not exist, chunk-suffixed ids left over.
Warnings: words that may describe people, quoted on-screen text.
"""
import json
import re
import sys

from common import load_json, load_registry

CLASSES = {"GRAPHICS", "MIXED", "LIVE"}
PEOPLE = re.compile(r"\b(man|woman|men|women|person|people|actor|actress|guy|girl|boy|face|faces|his|her|hers|he|she|hand|hands|body|smil\w*|gestur\w*)\b", re.I)


def technique_rows(md: str):
    m = re.search(r"^##\s+Technique index\s*$(.*?)(^##\s|\Z)", md, re.S | re.M)
    if not m:
        return None
    rows = []
    for line in m.group(1).splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        ids = re.findall(r"`([^`]+)`", cells[0]) if cells else []
        if ids:
            rows.append((ids[0], cells))
    return rows


def check(v):
    errs, warns = [], []
    meta = load_json(v.dir / "meta.json")
    n = meta["analysis"]["grid_frame_count"]
    seg = load_json(v.dir / "segments.json")
    if not seg:
        return [f"{v.key}: segments.json missing"], warns
    segs = sorted(seg["segments"], key=lambda s: s["start"])
    expect = 0
    for s in segs:
        if s["start"] != expect:
            errs.append(f"{v.key}: gap/overlap before segment {s.get('id')} (starts {s['start']}, expected {expect})")
        if s["end"] < s["start"]:
            errs.append(f"{v.key}: segment {s.get('id')} ends before it starts")
        if s.get("class") not in CLASSES:
            errs.append(f"{v.key}: segment {s.get('id')} has class {s.get('class')!r}")
        if s.get("class") == "LIVE":
            conf = s.get("live_confirmed_on") or []
            if not conf:
                errs.append(f"{v.key}: LIVE segment {s.get('id')} lacks live_confirmed_on")
            for p in conf:
                if not (v.dir / p).exists():
                    errs.append(f"{v.key}: LIVE segment {s.get('id')} cites missing sheet {p}")
        expect = s["end"] + 1
    if expect != n:
        errs.append(f"{v.key}: segments end at {expect - 1}, video has {n} frames (last {n - 1})")

    cuts = load_json(v.dir / "cuts.json")
    for c in cuts.get("cuts", []):
        if c.get("status") not in ("confirmed", "rejected"):
            errs.append(f"{v.key}: cut candidate {c.get('id')} f{c.get('frame')} is still {c.get('status')!r}")
    for t in cuts.get("soft_transitions", []):
        for k in ("start", "end", "type"):
            if k not in t:
                errs.append(f"{v.key}: soft transition {t.get('id')} lacks {k}")

    tl = v.dir / "timeline.md"
    if not tl.exists():
        errs.append(f"{v.key}: timeline.md missing")
        return errs, warns
    md = tl.read_text()
    for s in segs:
        sid = s.get("id", "")
        if s["class"] in ("GRAPHICS", "MIXED") and not re.search(rf"\b{re.escape(sid)}\b", md):
            errs.append(f"{v.key}: timeline.md has no section for {s['class']} segment {sid}")
        if s["class"] == "LIVE" and not re.search(rf"\b{re.escape(sid)}\b.*skipped", md, re.I):
            errs.append(f"{v.key}: timeline.md lacks the 'skipped' line for LIVE segment {sid}")
    rows = technique_rows(md)
    if rows is None:
        errs.append(f"{v.key}: timeline.md has no '## Technique index' section")
        rows = []
    curves = {p.stem for p in (v.dir / "curves").glob("*.csv")} if (v.dir / "curves").exists() else set()
    for tid, cells in rows:
        if not tid.startswith(v.key + "."):
            errs.append(f"{v.key}: technique id {tid} must start with '{v.key}.'")
        if re.search(rf"\.{v.key}c\d+$", tid) or re.search(r"\.c\d+$", tid):
            errs.append(f"{v.key}: technique id {tid} still carries a chunk suffix")
        for ref in re.findall(r"curves/([^\s|`]+)\.csv", " ".join(cells)):
            if ref not in curves:
                errs.append(f"{v.key}: technique {tid} cites curves/{ref}.csv which does not exist")
    if not re.search(r"^##\s+Motion personality", md, re.M):
        errs.append(f"{v.key}: timeline.md lacks the closing '## Motion personality' summary")
    for i, line in enumerate(md.splitlines(), 1):
        if PEOPLE.search(line) and "typeface" not in line.lower():
            warns.append(f"{v.key}: timeline.md:{i} may describe a person: {line.strip()[:120]}")
        if re.search(r"\"[^\"]{4,}\"|“[^”]{4,}”", line):
            warns.append(f"{v.key}: timeline.md:{i} quotes text: {line.strip()[:120]}")
    return errs, warns


def main():
    names = sys.argv[1:]
    all_e = []
    for v in load_registry():
        if names and v.key not in names and v.stem not in names:
            continue
        e, w = check(v)
        all_e += e
        for x in e:
            print("ERROR", x)
        for x in w:
            print("WARN ", x)
        if not e:
            print(f"OK    {v.key} {v.stem}")
    sys.exit(1 if all_e else 0)


if __name__ == "__main__":
    main()
