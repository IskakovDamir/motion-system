"""Step 1: analysis/<video>/meta.json for every reference video."""
from collections import Counter
from fractions import Fraction

import cv2
import numpy as np

from common import GRID_FPS, load_registry, packet_pts, save_json, ffprobe_json


def ratio(num: str) -> float:
    try:
        return float(Fraction(num))
    except (ValueError, ZeroDivisionError):
        return 0.0


def aspect_label(w: int, h: int) -> str:
    r = w / h
    for name, val in (("16:9", 16 / 9), ("9:16", 9 / 16), ("4:3", 4 / 3), ("1:1", 1.0), ("21:9", 21 / 9)):
        if abs(r - val) / val < 0.012:
            return name
    return f"{r:.4f}:1"


def main():
    for v in load_registry():
        probe = ffprobe_json(v.ref, "-show_streams", "-show_format")
        vs = next(s for s in probe["streams"] if s["codec_type"] == "video")
        aud = [s for s in probe["streams"] if s["codec_type"] == "audio"]
        pts = packet_pts(v.source)
        deltas_ms = np.diff(pts) * 1000
        w, h = int(vs["width"]), int(vs["height"])
        pw, ph = (v.crop[2], v.crop[3]) if v.crop else (w, h)
        cap = cv2.VideoCapture(str(v.work))
        grid_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        meta = {
            "video": v.stem,
            "key": v.key,
            "reference_file": f"reference/{v.ref_name}",
            "kind": v.kind,
            "codec": vs["codec_name"],
            "profile": vs.get("profile"),
            "pix_fmt": vs.get("pix_fmt"),
            "resolution": [w, h],
            "aspect_ratio": aspect_label(w, h),
            "fps": round(ratio(vs["r_frame_rate"]), 3) if v.kind == "cfr60" else None,
            "fps_nominal_container": vs["r_frame_rate"],
            "fps_average": round(ratio(vs["avg_frame_rate"]), 3),
            "frame_count": int(vs.get("nb_frames") or len(pts)),
            "duration_s": round(float(probe["format"]["duration"]), 3),
            "video_stream_duration_s": round(float(vs.get("duration", 0)), 3),
            "audio": {
                "present": bool(aud),
                "codec": aud[0]["codec_name"] if aud else None,
                "sample_rate": int(aud[0]["sample_rate"]) if aud else None,
                "channels": aud[0].get("channels") if aud else None,
                "duration_s": round(float(aud[0].get("duration", 0)), 3) if aud else None,
            },
            "analysis": {
                "grid_fps": GRID_FPS,
                "frame_convention": "analysis frame = round((pts - first_video_pts) * 60)",
                "grid_frame_count": grid_frames,
                "picture_crop_xywh": list(v.crop) if v.crop else None,
                "picture_resolution": [pw, ph],
                "picture_aspect_ratio": aspect_label(pw, ph),
                "masks_xywh": [list(m) for m in v.masks],
            },
        }
        if v.kind == "vfr-screen":
            c = Counter(int(round(d / (1000 / 60))) for d in deltas_ms)
            hist = {f"{k * 1000 / 60:.1f}ms": n for k, n in sorted(c.items())}
            two, three, one = c.get(2, 0), c.get(3, 0), c.get(1, 0)
            meta["fps"] = None
            meta["vfr"] = {
                "unique_frames": int(len(pts)),
                "frame_interval_histogram": hist,
                "timestamps_on_60hz_grid": bool(np.mean(np.abs(deltas_ms / (1000 / 60) - np.round(deltas_ms / (1000 / 60))) < 0.1) > 0.98),
                "content_fps_estimate": (
                    "24 (3:2 cadence: 33.3/50 ms intervals alternate)" if one < 0.1 * len(deltas_ms)
                    else "mixed: 24 fps 3:2 cadence plus runs of 16.7/33.3 ms intervals (30 or 60 fps material or UI overlays); see motion.csv local_fps"
                ),
                "timing_uncertainty": "+-1 analysis frame (16.7 ms) from display-refresh capture; content steps are 2-3 analysis frames apart in 24 fps material",
            }
        save_json(v.dir / "meta.json", meta)
        print(v.key, v.stem, meta["resolution"], meta["fps"], meta["frame_count"], meta["duration_s"],
              "audio" if meta["audio"]["present"] else "no-audio", meta.get("vfr", {}).get("content_fps_estimate", ""))


if __name__ == "__main__":
    main()
