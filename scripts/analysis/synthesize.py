"""Step 6 numbers: pool every video's final analysis into analysis/synthesis.json.

Tempo uses GRAPHICS and MIXED segments only (LIVE excluded). A "shot" is a segment; its length
is end - start + 1 analysis frames at 60 fps.
  - per video and pooled: count, mean, median, p10, p25, p75, p90 shot length, cuts per second
    (boundaries whose earlier or later side is GRAPHICS/MIXED, per second of GRAPHICS/MIXED time)
  - acceleration and holds: runs of >= 3 consecutive graphics shots shorter than 0.6 x the pooled
    median (the edit accelerates) and single shots longer than 2 x the pooled median (holds)
  - transitions: type counts and length statistics (frames), hard cuts counted as 0 frames
  - curves: per technique category, measured durations and the fitted easing parameters
  - sound sync: offset (frames) from each boundary inside graphics to the nearest beat, against
    the offset a random frame would get (uniform within +- half a beat)
"""
import json
import re

import numpy as np

from common import ANALYSIS, load_json, load_registry, save_json


def stats(a):
    a = np.asarray(a, float)
    if not len(a):
        return None
    return {"n": int(len(a)), "mean": round(float(a.mean()), 2), "median": round(float(np.median(a)), 2),
            "p10": round(float(np.percentile(a, 10)), 2), "p25": round(float(np.percentile(a, 25)), 2),
            "p75": round(float(np.percentile(a, 75)), 2), "p90": round(float(np.percentile(a, 90)), 2),
            "min": round(float(a.min()), 2), "max": round(float(a.max()), 2)}


def main():
    vids = []
    pooled, pooled_bounds, pooled_secs = [], 0, 0.0
    trans_all = {}
    curves_by_cat = {}
    sync_all, sync_rand = [], []
    for v in load_registry():
        seg = load_json(v.dir / "segments.json")
        segs = sorted(seg["segments"], key=lambda s: s["start"])
        g = [s for s in segs if s["class"] in ("GRAPHICS", "MIXED")]
        lengths = [s["end"] - s["start"] + 1 for s in g]
        secs = sum(lengths) / 60
        bounds = 0
        for a, b in zip(segs, segs[1:]):
            if a["class"] != "LIVE" or b["class"] != "LIVE":
                bounds += 1
        pooled += lengths
        pooled_bounds += bounds
        pooled_secs += secs
        # transitions
        for t in seg.get("transitions", []):
            typ = t.get("type", "unknown")
            n = 0 if typ == "hard-cut" else int(t.get("frames") or (t["end"] - t["start"] + 1))
            trans_all.setdefault(typ, []).append({"video": v.key, "frames": n, "start": t.get("start")})
        # curves
        idx = load_json(v.dir / "curves" / "index.json", {"curves": {}})["curves"]
        for cid, e in idx.items():
            m = re.match(rf"{v.key}\.([a-z0-9]+)-", cid)
            cat = m.group(1) if m else "other"
            best = e["bezier"] if e["recommended"] == "bezier" else e["spring"]
            curves_by_cat.setdefault(cat, []).append({
                "id": cid, "property": e["property"], "measured_frames": e["measured_duration_frames"],
                "bezier": [e["bezier"][k] for k in ("x1", "y1", "x2", "y2")], "bezier_D": e["bezier"]["durationInFrames"],
                "spring": {"stiffness": e["spring"]["stiffness"], "damping": e["spring"]["damping"], "zeta": e["spring"]["damping_ratio"]},
                "recommended": e["recommended"], "rmse": min(e["bezier"]["rmse"], e["spring"]["rmse"])})
        # sound sync
        audio = load_json(v.dir / "audio.json", {})
        beats = [b["frame"] for b in audio.get("beats", [])]
        period = audio.get("beat_period_frames_60")
        offs = []
        if beats and period:
            for a, b in zip(segs, segs[1:]):
                if a["class"] == "LIVE" and b["class"] == "LIVE":
                    continue
                f = b["start"]
                nb = min(beats, key=lambda x: abs(x - f))
                offs.append(f - nb)
            sync_all += [abs(o) for o in offs]
            sync_rand += list(np.abs(np.random.default_rng(len(sync_rand)).uniform(-period / 2, period / 2, 400)))
        # acceleration / holds within this video (decided against the pooled median later)
        vids.append({"key": v.key, "stem": v.stem, "segments": len(segs),
                     "classes": {c: sum(s["class"] == c for s in segs) for c in ("GRAPHICS", "MIXED", "LIVE")},
                     "live_ranges": [f"f{s['start']}-f{s['end']}" for s in segs if s["class"] == "LIVE"],
                     "graphics_seconds": round(secs, 3), "boundaries": bounds,
                     "cuts_per_second": round(bounds / secs, 3) if secs else None,
                     "shot_frames": stats(lengths),
                     "shots": [{"id": s["id"], "start": s["start"], "end": s["end"], "frames": s["end"] - s["start"] + 1, "class": s["class"]} for s in g],
                     "tempo_bpm": audio.get("tempo_bpm"), "beat_period_frames": period,
                     "boundary_beat_offsets": offs})
    med = float(np.median(pooled))
    for vd in vids:
        shots = vd["shots"]
        runs, cur = [], []
        for s in shots:
            if s["frames"] < 0.6 * med:
                cur.append(s)
            else:
                if len(cur) >= 3:
                    runs.append(cur)
                cur = []
        if len(cur) >= 3:
            runs.append(cur)
        vd["accelerations"] = [{"from": r[0]["start"], "to": r[-1]["end"], "shots": len(r), "frames": [s["frames"] for s in r]} for r in runs]
        vd["holds"] = [{"id": s["id"], "start": s["start"], "end": s["end"], "frames": s["frames"]} for s in shots if s["frames"] > 2 * med]
    out = {
        "fps": 60,
        "graphics_tempo": dict(stats(pooled), cuts_per_second=round(pooled_bounds / pooled_secs, 3),
                               graphics_seconds=round(pooled_secs, 2), boundaries=pooled_bounds,
                               median_shot_frames=round(med, 2), mean_shot_frames=round(float(np.mean(pooled)), 2)),
        "per_video": vids,
        "transitions": {k: dict(stats([x["frames"] for x in v]) or {}, instances=v) for k, v in sorted(trans_all.items())},
        "curves_by_category": {k: {"durations": stats([x["measured_frames"] for x in v]), "curves": v} for k, v in sorted(curves_by_cat.items())},
        "sound_sync": {"boundary_abs_offset_frames": stats(sync_all), "random_abs_offset_frames": stats(sync_rand),
                       "within_2_frames": round(float(np.mean(np.array(sync_all) <= 2)), 3) if sync_all else None,
                       "random_within_2_frames": round(float(np.mean(np.array(sync_rand) <= 2)), 3) if sync_rand else None},
    }
    save_json(ANALYSIS / "synthesis.json", out)
    gt = out["graphics_tempo"]
    print(f"graphics shots {gt['n']}: median {gt['median']} f, mean {gt['mean']} f, {gt['cuts_per_second']} cuts/s over {gt['graphics_seconds']} s")
    for vd in vids:
        print(vd["key"], vd["classes"], "median", (vd["shot_frames"] or {}).get("median"), "cuts/s", vd["cuts_per_second"],
              "accel", len(vd["accelerations"]), "holds", len(vd["holds"]))


if __name__ == "__main__":
    main()
