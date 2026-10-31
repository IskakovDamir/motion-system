"""Step 2a: cut candidates from PySceneDetect (ContentDetector, AdaptiveDetector) and the ffmpeg
scene score, merged into analysis/<video>/cuts.json. Every per-frame metric is kept in
scene_metrics.csv so soft transitions can be found by hand later.

Usage: python cuts.py [v1 v2 ...]
"""
import csv
import re
import subprocess
import sys

import numpy as np
from scenedetect import AdaptiveDetector, ContentDetector, SceneManager, StatsManager, open_video

from common import load_registry, packet_pts, save_json, load_json

CONTENT_T = 27.0       # PySceneDetect default
CONTENT_WEAK_T = 14.0  # local maxima above this are kept as weak candidates
ADAPTIVE_T = 3.0       # PySceneDetect default
FFMPEG_T = 0.30
FFMPEG_WEAK_T = 0.12


def scenedetect_metrics(v, analysis_frame):
    """Run both detectors in one pass; returns per-decoded-frame metrics and detected cut indices."""
    video = open_video(str(v.source), backend="opencv")
    stats = StatsManager()
    sm = SceneManager(stats_manager=stats)
    min_len = 4 if v.kind == "cfr60" else 2  # 4 frames at 60 fps; 2 captured frames for screen recordings
    sm.add_detector(ContentDetector(threshold=CONTENT_T, min_scene_len=min_len))
    sm.add_detector(AdaptiveDetector(adaptive_threshold=ADAPTIVE_T, min_scene_len=min_len))
    if v.crop:
        x, y, w, h = v.crop
        try:
            sm.crop = (x, y, x + w - 1, y + h - 1)
        except Exception:
            pass
    sm.detect_scenes(video, show_progress=False)
    n = len(analysis_frame)
    keys = ["content_val", "delta_lum", "adaptive_ratio (w=2)"]
    rows = []
    for i in range(n):
        rec = {}
        for k in keys:
            try:
                val = stats.get_metrics(i, [k])[0]
            except Exception:
                val = None
            rec[k] = val
        rows.append(rec)
    # cut list per detector: re-run detectors separately to know who fired
    fired = {}
    for name, det in (("content", ContentDetector(threshold=CONTENT_T, min_scene_len=min_len)),
                      ("adaptive", AdaptiveDetector(adaptive_threshold=ADAPTIVE_T, min_scene_len=min_len))):
        video = open_video(str(v.source), backend="opencv")
        m = SceneManager()
        m.add_detector(det)
        m.detect_scenes(video, show_progress=False)
        fired[name] = [s[0].frame_num for s in m.get_scene_list()[1:]]
    return rows, fired


def ffmpeg_scene(v):
    vf = []
    if v.crop:
        x, y, w, h = v.crop
        vf.append(f"crop={w}:{h}:{x}:{y}")
    vf.append("select='gte(scene,0)',metadata=print:file=-")
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(v.source), "-an", "-vf", ",".join(vf), "-f", "null", "-"],
                         capture_output=True, text=True, check=True).stdout
    scores = []
    for m in re.finditer(r"pts_time:([0-9.]+)\s+lavfi\.scene_score=([0-9.]+)", out):
        scores.append((float(m.group(1)), float(m.group(2))))
    return scores


def local_max(arr, i, r=2):
    lo, hi = max(0, i - r), min(len(arr), i + r + 1)
    window = [a for a in arr[lo:hi] if a is not None]
    return arr[i] is not None and arr[i] >= max(window)


def main():
    names = sys.argv[1:]
    for v in load_registry():
        if names and v.key not in names and v.stem not in names:
            continue
        pts = packet_pts(v.source)
        pts = pts - pts[0]
        af = np.round(pts * 60).astype(int)  # decoded index -> analysis frame
        rows, fired = scenedetect_metrics(v, af)
        ff = ffmpeg_scene(v)
        ff_by_idx = [None] * len(af)
        t0 = ff[0][0] if ff else 0.0
        for k, (t, s) in enumerate(ff):
            if k < len(ff_by_idx):
                ff_by_idx[k] = s
        content = [r["content_val"] for r in rows]
        lum = [r["delta_lum"] for r in rows]
        adapt = [r["adaptive_ratio (w=2)"] for r in rows]

        # per-frame metrics csv (decoded frames; analysis frame column for lookup)
        with open(v.dir / "scene_metrics.csv", "w", newline="") as fh:
            wr = csv.writer(fh)
            wr.writerow(["decoded_index", "frame", "time_s", "content_val", "delta_lum", "adaptive_ratio", "ffmpeg_scene"])
            for i in range(len(af)):
                wr.writerow([i, int(af[i]), f"{pts[i]:.4f}",
                             "" if content[i] is None else f"{content[i]:.3f}",
                             "" if lum[i] is None else f"{lum[i]:.3f}",
                             "" if adapt[i] is None else f"{adapt[i]:.3f}",
                             "" if ff_by_idx[i] is None else f"{ff_by_idx[i]:.4f}"])

        cands = []  # (decoded index, source, strength)
        for i in fired["content"]:
            cands.append((i, "content", "strong"))
        for i in fired["adaptive"]:
            cands.append((i, "adaptive", "strong"))
        for i in range(1, len(af)):
            if ff_by_idx[i] is not None and ff_by_idx[i] >= FFMPEG_WEAK_T and local_max(ff_by_idx, i):
                cands.append((i, "ffmpeg_scene", "strong" if ff_by_idx[i] >= FFMPEG_T else "weak"))
            if content[i] is not None and CONTENT_WEAK_T <= content[i] < CONTENT_T and local_max(content, i):
                cands.append((i, "content_weak", "weak"))
        cands.sort()
        merged = []
        radius = 2 if v.kind == "cfr60" else 1  # decoded frames
        for i, src, strength in cands:
            if merged and i - merged[-1]["_idx_hi"] <= radius:
                g = merged[-1]
                g["_idx_hi"] = i
                g["_members"].append((i, src, strength))
            else:
                merged.append({"_idx_hi": i, "_members": [(i, src, strength)]})
        cuts = []
        for g in merged:
            members = g["_members"]
            # the cut frame: the member decoded index with the highest content_val (first frame of new shot)
            idxs = sorted({m[0] for m in members})
            best = max(idxs, key=lambda k: (content[k] or 0) + 100 * (ff_by_idx[k] or 0))
            sources = sorted({m[1] for m in members})
            strong = [m for m in members if m[2] == "strong"]
            n_det = len({m[1] for m in strong})
            conf = "high" if n_det >= 2 else ("medium" if n_det == 1 else "low")
            cuts.append({
                "frame": int(af[best]),
                "time_s": round(float(pts[best]), 4),
                "last_frame_before": int(af[best - 1]) if best > 0 else None,
                "sources": sources,
                "content_val": None if content[best] is None else round(content[best], 2),
                "delta_lum": None if lum[best] is None else round(lum[best], 2),
                "adaptive_ratio": None if adapt[best] is None else round(adapt[best], 2),
                "ffmpeg_scene": None if ff_by_idx[best] is None else round(ff_by_idx[best], 4),
                "confidence": conf,
                "origin": "auto",
                "status": "candidate",
            })
        for k, c in enumerate(cuts):
            c["id"] = f"c{k + 1:03d}"
        old = load_json(v.dir / "cuts.json", {})
        save_json(v.dir / "cuts.json", {
            "video": v.stem,
            "key": v.key,
            "fps": 60,
            "frame_convention": "analysis frame = round((pts - first_video_pts) * 60); 'frame' is the first frame of the new shot",
            "detectors": {
                "content": {"tool": "PySceneDetect ContentDetector", "threshold": CONTENT_T, "weak_threshold": CONTENT_WEAK_T},
                "adaptive": {"tool": "PySceneDetect AdaptiveDetector", "adaptive_threshold": ADAPTIVE_T, "window_width": 2, "min_content_val": 15},
                "ffmpeg_scene": {"tool": "ffmpeg select scene score", "threshold": FFMPEG_T, "weak_threshold": FFMPEG_WEAK_T},
                "merge_radius_decoded_frames": radius,
            },
            "cuts": cuts,
            "soft_transitions": old.get("soft_transitions", []),
            "notes": old.get("notes", []),
        })
        hi = sum(c["confidence"] == "high" for c in cuts)
        print(v.key, "candidates", len(cuts), "high", hi, "content", len(fired["content"]), "adaptive", len(fired["adaptive"]))


if __name__ == "__main__":
    main()
