#!/usr/bin/env python3
"""A builder's own check for one primitive group, against analysis/catalogue.json and the measured curves.

  .venv/bin/python scripts/check_group.py <group>

  - every primitive the catalogue puts in <group> has src/motion/primitives/<group>/<Name>.spec.ts and
    <Name>.tsx (exporting <Name> and Demo), with the catalogue's kind, default variant and variant names;
    no other primitive in the directory
  - every technique of a catalogue variant is mapped by that spec variant: the variant's curve technique in
    reproduces[<property>], every other technique in covers; nothing else is mapped
  - timing: each curve technique's built progress (sample_curves.ts --group) lasts within 1 frame of the
    measured curve and has normalised RMSE <= 0.05 (the scripts/verify.py rule)
  - tsc --noEmit reports no error in the group's files
Prints OK or the problems; exit 1 on any problem.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
sys.path.insert(0, str(ROOT / "scripts"))
from common import ANALYSIS, load_json, load_registry  # noqa: E402
from curvekit import shape_rmse  # noqa: E402
from probe_group import group_sample  # noqa: E402
import verify  # noqa: E402


def main() -> None:
    group = sys.argv[1]
    cat = load_json(ANALYSIS / "catalogue.json")
    prims = [p for p in cat["primitives"] if p["group"] == group]
    if not prims:
        raise SystemExit(f"the catalogue has no primitive in group {group}")
    gdir = ROOT / "src" / "motion" / "primitives" / group
    errs: list[str] = []
    for p in prims:
        n = p["name"]
        comp = gdir / f"{n}.tsx"
        if not (gdir / f"{n}.spec.ts").exists():
            errs.append(f"{n}: {group}/{n}.spec.ts missing")
        if not comp.exists():
            errs.append(f"{n}: {group}/{n}.tsx missing")
        else:
            t = comp.read_text()
            for sym in (n, "Demo"):
                if not re.search(rf"export const {sym}\b", t):
                    errs.append(f"{n}: {group}/{n}.tsx does not export {sym}")
    built = group_sample(group)
    errs += [f"sampler: {x}" for x in built["problems"]]
    specs = {s["name"]: s for s in built["specs"]}
    want = {p["name"] for p in prims}
    errs += [f"{n}: in {group}/ but not in the catalogue's {group} group" for n in specs if n not in want]
    techs = verify.timeline_techniques()
    regs = {v.key: v for v in load_registry()}
    timing_rows = 0
    for p in prims:
        s = specs.get(p["name"])
        if not s:
            continue
        if s["kind"] != p["kind"]:
            errs.append(f"{p['name']}: kind {s['kind']}, catalogue says {p['kind']}")
        if s["defaultVariant"] != p["default_variant"]:
            errs.append(f"{p['name']}: defaultVariant {s['defaultVariant']}, catalogue says {p['default_variant']}")
        cvars = {v["name"]: v for v in p["variants"]}
        for vn in cvars.keys() - s["variants"].keys():
            errs.append(f"{p['name']}: variant {vn} missing")
        for vn in s["variants"].keys() - cvars.keys():
            errs.append(f"{p['name']}: variant {vn} is not in the catalogue")
        for vn, cv in cvars.items():
            sv = s["variants"].get(vn)
            if not sv:
                continue
            rep = {t: prop for prop, ids in (sv.get("reproduces") or {}).items() for t in ids}
            cov = set(sv.get("covers") or [])
            curve_t = (cv.get("curve") or {}).get("technique")
            for t in cv["techniques"]:
                if t == curve_t:
                    if t not in rep:
                        errs.append(f"{p['name']}/{vn}: curve technique {t} must be in reproduces[<property>]")
                elif t not in cov:
                    errs.append(f"{p['name']}/{vn}: {t} must be in covers" + (" (it has no curve, so not in reproduces)" if t in rep else ""))
            for t in set(rep) | cov:
                if t not in cv["techniques"]:
                    errs.append(f"{p['name']}/{vn}: maps {t}, which the catalogue puts elsewhere")
            if curve_t and curve_t in rep:
                tt = techs.get(curve_t)
                b = built["techniques"].get(curve_t)
                if not tt or not tt["curve"]:
                    errs.append(f"{curve_t}: no curve in its timeline index row")
                    continue
                f = regs[tt["video"]].dir / "curves" / f"{tt['curve']}.csv"
                d = np.genfromtxt(f, delimiter=",", names=True)
                bp = np.array(b["progress"], float)
                rmse, md, bd = shape_rmse(d["frame"].astype(float), d["progress"].astype(float), np.arange(len(bp)), bp)
                timing_rows += 1
                if abs(bd - md) > verify.DUR_TOL or rmse > verify.RMSE_MAX:
                    errs.append(f"{curve_t}: measured {md:.0f} f, built {bd:.0f} f, rmse {rmse:.3f} "
                                f"(use measured('{tt['curve']}') unchanged for {p['name']}/{vn} {rep[curve_t]})")
    tsc = subprocess.run(["npx", "tsc", "--noEmit", "--pretty", "false"], cwd=ROOT, capture_output=True, text=True)
    mine = [l for l in tsc.stdout.splitlines() if l.startswith(f"src/motion/primitives/{group}/")]
    errs += [f"tsc: {l}" for l in mine]
    print(f"{group}: {len(prims)} primitives, {sum(len(p['variants']) for p in prims)} variants, {timing_rows} curves timed, "
          f"tsc errors in {group}/: {len(mine)}")
    for e in errs:
        print("ERROR", e)
    print("OK" if not errs else f"{len(errs)} problems")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
