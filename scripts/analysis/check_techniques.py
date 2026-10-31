"""Check analysis/<video>/techniques.json against that video's timeline.md technique index.

techniques.json: {"video": "v5", "techniques": [record, ...]}, one record per index row:
  id                 the technique id of the row
  concept            2-5 neutral words naming the motion technique ("whip pan", "word pop-in")
  segments           segment ids, e.g. ["S04"]
  reference_frames   [first, last] analysis frames
  curve_id           the curve the row cites (curves/<id>.csv) or null
  curve_property     the curve sidecar's property (x, scale, opacity ...) or null
  moves              [{"element", "property", "from", "to", "unit", "frames", "delay", "stagger", "ease"}]
                     every movement of the technique with the timeline's measured numbers
  look               neutral description of the elements involved (shapes, text roles, layering, blur)
  typography         null, or {"role", "closest_free", "original", "weight", "size_pct_h", "size_range_pct_h",
                     "tracking_em", "case", "align", "reveal_unit", "reveal_method", "frames_per_unit", "stagger"}:
                     role one of ROLES; size_pct_h = cap height in % of frame height (number, from a still);
                     tracking_em a number (negative = tight); frames_per_unit / stagger in frames or null
  sound              null or the sync note
  uncertain          null or what is uncertain, with the reason and range

  python check_techniques.py v1 [v2 ...]
  python check_techniques.py v5 --part scratch/techniques_part2.json --expect id1,id2,...   # one part
  python check_techniques.py v5 --merge     # merge scratch/techniques_part*.json (index order), then check
reference_frames must equal the index row's reference-frames column as verify.py reads it.
"""
import argparse
import re
import sys
from pathlib import Path

from common import load_json, load_registry, save_json
import validate_analysis

REQ = ["id", "concept", "segments", "reference_frames", "curve_id", "curve_property", "moves", "look"]
ROLES = {"display", "headline", "subhead", "body", "ui", "label", "caption", "counter", "code"}


def index_rows(v) -> dict:
    md = (v.dir / "timeline.md").read_text() if (v.dir / "timeline.md").exists() else ""
    return {tid: cells for tid, cells in (validate_analysis.technique_rows(md) or [])}


def ref_frames(cells) -> list[int] | None:
    """The reference-frames column the way verify.py reads it (a single frame fN is [N, N])."""
    m = re.search(r"f(\d+)(?:\s*-\s*f?(\d+))?", cells[3] if len(cells) > 3 else "")
    return [int(m.group(1)), int(m.group(2) or m.group(1))] if m else None


def check(v, part: Path | None = None, expect: list[str] | None = None) -> list[str]:
    errs = []
    rows = index_rows(v)
    data = load_json(part or v.dir / "techniques.json", None)
    if data is None:
        return [f"{v.key}: {(part or v.dir / 'techniques.json').name} missing"]
    recs = data.get("techniques", [])
    ids = [r.get("id") for r in recs]
    for tid in (expect if expect is not None else ([] if part else rows)):
        if ids.count(tid) != 1:
            errs.append(f"{v.key}: {tid} appears {ids.count(tid)} times (expected 1)")
    if part:
        errs += [f"{v.key}: {t} appears {ids.count(t)} times in the part" for t in sorted(set(ids)) if ids.count(t) > 1]
        if expect is not None:
            errs += [f"{v.key}: {t} is not one of this part's ids" for t in ids if t not in expect]
    for r in recs:
        tid = r.get("id")
        if tid not in rows:
            errs.append(f"{v.key}: {tid} is not in the technique index")
            continue
        for k in REQ:
            if k not in r:
                errs.append(f"{tid}: missing {k}")
        m = re.search(r"curves/([^\s|`]+)\.csv", " ".join(rows[tid]))
        want = m.group(1) if m else None
        if r.get("curve_id") != want:
            errs.append(f"{tid}: curve_id {r.get('curve_id')!r}, index row cites {want!r}")
        if want:
            side = load_json(v.dir / "curves" / f"{want}.json", {})
            if r.get("curve_property") != side.get("property"):
                errs.append(f"{tid}: curve_property {r.get('curve_property')!r}, sidecar says {side.get('property')!r}")
        if not isinstance(r.get("moves"), list):
            errs.append(f"{tid}: moves must be a list")
        c = r.get("concept") or ""
        if not (1 <= len(c.split()) <= 6):
            errs.append(f"{tid}: concept {c!r} should be 2-5 words")
        ty = r.get("typography")
        if ty is not None:
            if not isinstance(ty, dict):
                errs.append(f"{tid}: typography must be null or an object")
            else:
                if ty.get("role") not in ROLES:
                    errs.append(f"{tid}: typography.role {ty.get('role')!r} not in {sorted(ROLES)}")
                for k in ("size_pct_h", "tracking_em"):
                    if ty.get(k) is not None and not isinstance(ty.get(k), (int, float)):
                        errs.append(f"{tid}: typography.{k} must be a number or null")
        rf = r.get("reference_frames")
        if not (isinstance(rf, list) and len(rf) == 2 and all(isinstance(x, int) for x in rf) and rf[0] <= rf[1]):
            errs.append(f"{tid}: reference_frames must be [first, last] ints")
        elif ref_frames(rows[tid]) and rf != ref_frames(rows[tid]):
            errs.append(f"{tid}: reference_frames {rf}, the index row's reference frames column gives {ref_frames(rows[tid])}")
    return errs


def merge(v) -> None:
    """scratch/techniques_part*.json -> techniques.json, records in technique index order."""
    recs = {}
    for p in sorted((v.dir / "scratch").glob("techniques_part*.json")):
        for r in load_json(p)["techniques"]:
            recs[r["id"]] = r
    order = list(index_rows(v))
    out = [recs[t] for t in order if t in recs] + [r for t, r in recs.items() if t not in order]
    save_json(v.dir / "techniques.json", {"video": v.key, "techniques": out})
    print(f"{v.key}: merged {len(out)} records from {len(list((v.dir / 'scratch').glob('techniques_part*.json')))} parts")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="*")
    ap.add_argument("--part", help="check one part file (path relative to analysis/<stem>/) instead of techniques.json")
    ap.add_argument("--expect", help="comma-separated ids the part must hold, each once")
    ap.add_argument("--merge", action="store_true", help="first merge scratch/techniques_part*.json into techniques.json")
    a = ap.parse_args()
    errs = []
    for v in load_registry():
        if a.videos and v.key not in a.videos:
            continue
        if a.merge:
            merge(v)
        errs += check(v, v.dir / a.part if a.part else None, a.expect.split(",") if a.expect else None)
    for e in errs[:60]:
        print("ERROR", e)
    print("OK" if not errs else f"{len(errs)} errors")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
