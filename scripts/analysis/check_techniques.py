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
"""
import json
import re
import sys

from common import load_json, load_registry
import validate_analysis

REQ = ["id", "concept", "segments", "reference_frames", "curve_id", "curve_property", "moves", "look"]
ROLES = {"display", "headline", "subhead", "body", "ui", "label", "caption", "counter", "code"}


def check(v) -> list[str]:
    errs = []
    md = (v.dir / "timeline.md").read_text() if (v.dir / "timeline.md").exists() else ""
    rows = {tid: cells for tid, cells in (validate_analysis.technique_rows(md) or [])}
    data = load_json(v.dir / "techniques.json", None)
    if data is None:
        return [f"{v.key}: techniques.json missing"]
    recs = data.get("techniques", [])
    ids = [r.get("id") for r in recs]
    for tid in rows:
        if ids.count(tid) != 1:
            errs.append(f"{v.key}: {tid} appears {ids.count(tid)} times (expected 1)")
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
    return errs


def main():
    keys = sys.argv[1:]
    errs = []
    for v in load_registry():
        if keys and v.key not in keys:
            continue
        errs += check(v)
    for e in errs[:60]:
        print("ERROR", e)
    print("OK" if not errs else f"{len(errs)} errors")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
