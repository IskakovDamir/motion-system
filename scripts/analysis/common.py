"""Shared helpers for the reference analysis.

Frame numbering convention (all videos): analysis frame = round(pts * 60).
The four 1080p60 videos are constant 60 fps, so analysis frame == decoded frame index.
The four screen recordings are variable frame rate on a 60 Hz grid; their analysis frames
live on the same 60 fps grid and work.mp4 is a 60 fps constant-rate copy (duplicates fill gaps).
"""
from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "reference"
ANALYSIS = ROOT / "analysis"
GRID_FPS = 60


@dataclass
class Video:
    key: str            # short id used in technique ids: v1..v8
    stem: str           # analysis/<stem>/
    ref_name: str       # file name inside reference/
    kind: str           # "cfr60" or "vfr-screen"
    crop: tuple[int, int, int, int] | None  # x, y, w, h of the picture inside the recording
    masks: list[tuple[int, int, int, int]]  # x, y, w, h (in cropped picture px) excluded from motion stats

    @property
    def dir(self) -> Path:
        return ANALYSIS / self.stem

    @property
    def ref(self) -> Path:
        return REF / self.ref_name

    @property
    def source(self) -> Path:
        return self.dir / "source.mp4"

    @property
    def work(self) -> Path:
        return self.dir / "work.mp4"


def load_registry() -> list[Video]:
    data = json.loads((ANALYSIS / "videos.json").read_text())
    out = []
    for v in data["videos"]:
        out.append(Video(v["key"], v["stem"], v["ref_name"], v["kind"],
                         tuple(v["crop"]) if v.get("crop") else None,
                         [tuple(m) for m in v.get("masks", [])]))
    return out


def get_video(name: str) -> Video:
    for v in load_registry():
        if name in (v.key, v.stem, v.ref_name):
            return v
    raise SystemExit(f"unknown video {name!r}; use a key (v1..v8) or stem")


def ffprobe_json(path: Path, *args: str) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-of", "json", *args, str(path)],
                         check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def packet_pts(path: Path) -> np.ndarray:
    """Presentation times (s) of every video frame, sorted."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "packet=pts_time", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    ts = sorted(float(x) for x in out.split() if x.strip() and x.strip() != "N/A")
    return np.array(ts)


def crop_frame(img: np.ndarray, v: Video) -> np.ndarray:
    if v.crop is None:
        return img
    x, y, w, h = v.crop
    return img[y:y + h, x:x + w]


def iter_unique(v: Video, gray: bool = True, width: int | None = None) -> Iterator[tuple[int, float, np.ndarray]]:
    """Every decoded (unique) frame of source.mp4: (analysis_frame, pts_s, image).

    For constant 60 fps videos this is every frame. For screen recordings it is every captured
    frame (no 60 fps duplicates), cropped to the picture.
    """
    pts = packet_pts(v.source)
    pts = pts - pts[0]  # analysis time 0 = first video frame
    cap = cv2.VideoCapture(str(v.source))
    i = 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        t = float(pts[i]) if i < len(pts) else i / GRID_FPS
        img = crop_frame(img, v)
        if gray:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if width:
            h = int(round(img.shape[0] * width / img.shape[1]))
            img = cv2.resize(img, (width, h), interpolation=cv2.INTER_AREA)
        yield int(round(t * GRID_FPS)), t, img
        i += 1
    cap.release()


class WorkReader:
    """Random access to work.mp4 (60 fps, cropped). Sequential reads are cheap, seeks re-decode."""

    def __init__(self, v: Video):
        self.v = v
        self.cap = cv2.VideoCapture(str(v.work))
        self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.pos = 0

    def read(self, frame: int, gray: bool = True) -> np.ndarray | None:
        frame = max(0, min(frame, self.n - 1))
        if frame != self.pos:
            if frame < self.pos or frame - self.pos > 90:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
                self.pos = frame
            while self.pos < frame:
                self.cap.grab()
                self.pos += 1
        ok, img = self.cap.read()
        self.pos += 1
        if not ok:
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if gray else img

    def close(self):
        self.cap.release()


def label(img: np.ndarray, text: str, scale: float = 0.9, pos: str = "tl") -> np.ndarray:
    """Burn a frame label into a (gray or BGR) image, black box with white text."""
    out = img.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    th = max(1, int(round(scale * 2)))
    (tw, tht), base = cv2.getTextSize(text, font, scale, th)
    pad = 4
    x0 = 0 if pos.endswith("l") else out.shape[1] - tw - 2 * pad
    y0 = 0 if pos.startswith("t") else out.shape[0] - tht - base - 2 * pad
    white = 255 if out.ndim == 2 else (255, 255, 255)
    black = 0 if out.ndim == 2 else (0, 0, 0)
    cv2.rectangle(out, (x0, y0), (x0 + tw + 2 * pad, y0 + tht + base + 2 * pad), black, -1)
    cv2.putText(out, text, (x0 + pad, y0 + pad + tht), font, scale, white, th, cv2.LINE_AA)
    return out


def tile(images: list[np.ndarray], cols: int, tile_w: int, tile_h: int, bg: int = 40) -> np.ndarray:
    rows = (len(images) + cols - 1) // cols
    sheet = np.full((rows * tile_h, cols * tile_w), bg, np.uint8)
    for i, im in enumerate(images):
        r, c = divmod(i, cols)
        if im.ndim == 3:
            im = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        # letterbox into the tile keeping aspect
        h, w = im.shape[:2]
        s = min(tile_w / w, tile_h / h)
        im = cv2.resize(im, (max(1, int(w * s)), max(1, int(h * s))), interpolation=cv2.INTER_AREA)
        y = r * tile_h + (tile_h - im.shape[0]) // 2
        x = c * tile_w + (tile_w - im.shape[1]) // 2
        sheet[y:y + im.shape[0], x:x + im.shape[1]] = im
    # thin separators
    for c in range(1, cols):
        sheet[:, c * tile_w - 1] = 0
    for r in range(1, rows):
        sheet[r * tile_h - 1, :] = 0
    return sheet


def write_jpg(path: Path, img: np.ndarray, q: int = 90) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), img, [cv2.IMWRITE_JPEG_QUALITY, q])


def load_json(path: Path, default=None):
    return json.loads(path.read_text()) if path.exists() else default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2) + "\n")
    os.replace(tmp, path)
