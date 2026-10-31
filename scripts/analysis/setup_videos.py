"""Register the reference videos and make working copies inside analysis/.

reference/ is never touched: source.mp4 is an APFS clone (byte-identical copy) and work.mp4 is a
grayscale 60 fps constant-rate re-encode with a short GOP for frame-accurate random access.
Screen recordings are cropped to the picture (their top 18 rows are a black capture bar).
"""
import subprocess
import sys

import cv2
import numpy as np

from common import ANALYSIS, REF, Video, load_registry, packet_pts, save_json

VIDEOS = [
    ("v1", "OiI9hOSLr0yYLKnq.mp4", "cfr60", None),
    ("v2", "U34UrnYU5VT-pRXi.mp4", "cfr60", None),
    ("v3", "yI-1xclfzqMRrqfA.mp4", "cfr60", None),
    ("v4", "Z4upJDBR5KbFtmrL.mp4", "cfr60", None),
    ("v5", "Screen Recording 2026-10-31 at 16.20.37.mp4", "vfr-screen", [0, 18, 1622, 918]),
    ("v6", "Screen Recording 2026-10-31 at 16.25.03.mp4", "vfr-screen", [0, 18, 1622, 918]),
    ("v7", "Screen Recording 2026-10-31 at 16.29.19.mp4", "vfr-screen", [0, 18, 1622, 918]),
    ("v8", "Screen Recording 2026-10-31 at 16.31.33.mp4", "vfr-screen", [0, 18, 1622, 918]),
]


def stem_of(name: str) -> str:
    return name.rsplit(".", 1)[0].replace(" ", "_")


def find_static_overlay(v: Video) -> list[list[int]]:
    """A player icon burned into the bottom-right of the screen recordings stays still while the
    picture moves. Find pixels whose value barely changes over 150 sampled frames in the
    bottom-right 140x140 corner and return their padded bounding box."""
    cap = cv2.VideoCapture(str(v.source))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    x, y, w, h = v.crop
    stack = []
    for i in np.linspace(0, n - 1, 150).astype(int):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(i))
        ok, img = cap.read()
        if ok:
            g = cv2.cvtColor(img[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY).astype(np.float32)
            stack.append(g[-140:, -140:])
    cap.release()
    a = np.stack(stack)
    sd = a.std(0)
    still = sd < 2.0
    # the background in a corner can be still too: keep only still pixels that are bright or dark
    # relative to the corner median in most frames (the icon), then take the largest blob.
    still = still.astype(np.uint8)
    n_lab, lab, stats, _ = cv2.connectedComponentsWithStats(still, 8)
    if n_lab <= 1:
        return []
    best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    bx, by, bw, bh, area = stats[best]
    if area < 30:
        return []
    pad = 6
    ox, oy = w - 140, h - 140
    return [[int(ox + bx - pad), int(oy + by - pad), int(bw + 2 * pad), int(bh + 2 * pad)]]


def main():
    ANALYSIS.mkdir(exist_ok=True)
    reg = []
    for key, name, kind, crop in VIDEOS:
        src = REF / name
        if not src.exists():
            sys.exit(f"missing {src}")
        stem = stem_of(name)
        d = ANALYSIS / stem
        d.mkdir(parents=True, exist_ok=True)
        source = d / "source.mp4"
        if not source.exists():
            subprocess.run(["cp", "-c", str(src), str(source)], check=True)
            source.chmod(0o644)
        reg.append({"key": key, "stem": stem, "ref_name": name, "kind": kind, "crop": crop, "masks": []})
    save_json(ANALYSIS / "videos.json", {"grid_fps": 60, "videos": reg})

    vids = load_registry()
    for v, entry in zip(vids, reg):
        if v.kind == "vfr-screen":
            entry["masks"] = find_static_overlay(v)
        work = v.work
        if work.exists():
            continue
        vf = []
        if v.crop:
            x, y, w, h = v.crop
            vf.append(f"crop={w}:{h}:{x}:{y}")
        vf += ["setpts=PTS-STARTPTS", "fps=60", "format=gray"]
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(v.source), "-an", "-vf", ",".join(vf),
               "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-g", "15", "-bf", "0",
               "-pix_fmt", "yuv420p", "-fps_mode", "cfr", str(work)]
        print(" ".join(cmd))
        subprocess.run(cmd, check=True)
    save_json(ANALYSIS / "videos.json", {"grid_fps": 60, "videos": reg})
    for v in load_registry():
        cap = cv2.VideoCapture(str(v.work))
        print(v.key, v.stem, "work frames", int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
              "size", int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), "x", int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
              "masks", v.masks, "unique frames", len(packet_pts(v.source)))
        cap.release()


if __name__ == "__main__":
    main()
