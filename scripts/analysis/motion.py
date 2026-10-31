"""Step 2b: per-frame motion energy -> analysis/<video>/motion.csv, motion.png, motion_peaks.json.

Columns (one row per analysis frame on the 60 fps grid):
  unique       1 if a new picture arrives on this frame (always 1 for the 60 fps videos)
  diff_mean    mean |gray difference| to the previous picture, 0..1, divided by the frame gap
  diff_p95     95th percentile of that difference, 0..1, divided by the gap
  flow_mag     Farneback flow magnitude, mean over the frame, % of picture width per analysis frame
  flow_p95     95th percentile of the magnitude, same unit
  flow_dx/dy   mean flow components, % of picture width per analysis frame (+x right, +y down)
  flow_radial  mean flow along the ray from the picture centre (+ = expanding / zoom in)
  flow_rot     mean flow perpendicular to that ray (+ = clockwise)
  local_fps    pictures per second around this frame (screen recordings only differ from 60)
Duplicate frames of the screen recordings repeat the velocity of the picture that ends their gap.
Masked overlay regions (videos.json masks) are excluded.

Usage: python motion.py [v1 v2 ...]
"""
import csv
import sys

import cv2
import matplotlib
import numpy as np
from scipy.signal import find_peaks

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from common import load_json, load_registry, save_json, iter_unique  # noqa: E402

DIFF_W = 640
FLOW_W = 480


def mask_for(v, shape, full_w):
    m = np.ones(shape, bool)
    s = shape[1] / full_w
    for (x, y, w, h) in v.masks:
        m[int(y * s):int((y + h) * s) + 1, int(x * s):int((x + w) * s) + 1] = False
    return m


def main():
    names = sys.argv[1:]
    for v in load_registry():
        if names and v.key not in names and v.stem not in names:
            continue
        meta = load_json(v.dir / "meta.json")
        full_w = meta["analysis"]["picture_resolution"][0]
        n_grid = meta["analysis"]["grid_frame_count"]
        rows = {}
        prev_d = prev_f = None
        prev_frame = None
        md = mf = None
        rr = None
        for frame, t, g in iter_unique(v, gray=True):
            d = cv2.resize(g, (DIFF_W, int(round(g.shape[0] * DIFF_W / g.shape[1]))), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
            f = cv2.resize(g, (FLOW_W, int(round(g.shape[0] * FLOW_W / g.shape[1]))), interpolation=cv2.INTER_AREA)
            if md is None:
                md = mask_for(v, d.shape, full_w)
                mf = mask_for(v, f.shape, full_w)
                hh, ww = f.shape
                yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
                rx, ry = xx - (ww - 1) / 2, yy - (hh - 1) / 2
                rn = np.sqrt(rx ** 2 + ry ** 2) + 1e-6
                rr = (rx / rn, ry / rn)
            if prev_d is None:
                rows[frame] = dict(unique=1, diff_mean=0.0, diff_p95=0.0, flow_mag=0.0, flow_p95=0.0,
                                   flow_dx=0.0, flow_dy=0.0, flow_radial=0.0, flow_rot=0.0)
            else:
                gap = max(1, frame - prev_frame)
                ad = np.abs(d - prev_d)[md]
                fl = cv2.calcOpticalFlowFarneback(prev_f, f, None, 0.5, 3, 15, 3, 5, 1.2, 0)
                fx, fy = fl[..., 0][mf], fl[..., 1][mf]
                mag = np.sqrt(fx ** 2 + fy ** 2)
                k = 100.0 / FLOW_W / gap  # -> % of picture width per analysis frame
                radial = (fl[..., 0] * rr[0] + fl[..., 1] * rr[1])[mf]
                rot = (fl[..., 0] * -rr[1] + fl[..., 1] * rr[0])[mf]
                vals = dict(unique=1, diff_mean=float(ad.mean()) / gap, diff_p95=float(np.percentile(ad, 95)) / gap,
                            flow_mag=float(mag.mean()) * k, flow_p95=float(np.percentile(mag, 95)) * k,
                            flow_dx=float(fx.mean()) * k, flow_dy=float(fy.mean()) * k,
                            flow_radial=float(radial.mean()) * k, flow_rot=float(rot.mean()) * k)
                for fr in range(prev_frame + 1, frame):
                    rows[fr] = dict(vals, unique=0)
                rows[frame] = vals
            prev_d, prev_f, prev_frame = d, f, frame
        last = max(rows)
        for fr in range(last + 1, n_grid):
            rows[fr] = dict(rows[last], unique=0)
        frames = np.arange(0, max(rows) + 1)
        uniq = np.array([rows.get(fr, {}).get("unique", 0) for fr in frames])
        local_fps = np.convolve(uniq, np.ones(61), mode="same") * 60 / 61
        cols = ["unique", "diff_mean", "diff_p95", "flow_mag", "flow_p95", "flow_dx", "flow_dy", "flow_radial", "flow_rot"]
        with open(v.dir / "motion.csv", "w", newline="") as fh:
            wr = csv.writer(fh)
            wr.writerow(["frame", "time_s"] + cols + ["local_fps"])
            for i, fr in enumerate(frames):
                r = rows.get(fr)
                if r is None:
                    continue
                wr.writerow([fr, f"{fr / 60:.4f}"] + [r["unique"]] + [f"{r[c]:.5f}" for c in cols[1:]] + [f"{local_fps[i]:.1f}"])

        # peaks of motion energy away from cut candidates
        flow = np.array([rows[fr]["flow_mag"] if fr in rows else 0 for fr in frames])
        diff = np.array([rows[fr]["diff_mean"] if fr in rows else 0 for fr in frames])
        sm = np.convolve(flow, np.ones(3) / 3, mode="same")
        cuts = load_json(v.dir / "cuts.json", {"cuts": []})["cuts"]
        cut_frames = [c["frame"] for c in cuts if c["confidence"] in ("high", "medium")]
        pk, props = find_peaks(sm, prominence=max(0.05, float(np.percentile(sm, 75)) * 0.5), distance=6)
        peaks = []
        for p, prom in zip(pk, props["prominences"]):
            near = min((abs(p - c) for c in cut_frames), default=999)
            peaks.append({"frame": int(p), "time_s": round(p / 60, 4), "flow_mag": round(float(flow[p]), 4),
                          "diff_mean": round(float(diff[p]), 5), "prominence": round(float(prom), 4),
                          "near_cut_frames": int(near) if near < 999 else None, "at_cut": bool(near <= 3)})
        save_json(v.dir / "motion_peaks.json", {"video": v.stem, "smoothing": "3-frame box on flow_mag",
                                                 "peaks": peaks})

        fig, ax = plt.subplots(3, 1, figsize=(18, 9), sharex=True)
        ax[0].plot(frames, diff, lw=0.7, color="k")
        ax[0].set_ylabel("gray diff / frame")
        ax[1].plot(frames, flow, lw=0.7, color="k")
        ax[1].scatter([p["frame"] for p in peaks if not p["at_cut"]], [flow[p["frame"]] for p in peaks if not p["at_cut"]], s=8, color="tab:orange", zorder=3)
        ax[1].set_ylabel("flow mag (% W / frame)")
        ax[2].plot(frames, [rows[fr]["flow_radial"] if fr in rows else 0 for fr in frames], lw=0.6, label="radial (zoom)")
        ax[2].plot(frames, [rows[fr]["flow_dx"] if fr in rows else 0 for fr in frames], lw=0.6, label="dx")
        ax[2].plot(frames, [rows[fr]["flow_dy"] if fr in rows else 0 for fr in frames], lw=0.6, label="dy")
        ax[2].legend(loc="upper right", fontsize=8)
        ax[2].set_ylabel("% W / frame")
        ax[2].set_xlabel("analysis frame (60 fps grid)")
        for c in cuts:
            col = {"high": "tab:red", "medium": "tab:blue", "low": "0.7"}[c["confidence"]]
            for a in ax:
                a.axvline(c["frame"], color=col, lw=0.6, alpha=0.6)
        ax[0].set_title(f"{v.key} {v.stem}: motion energy (red/blue/grey lines = high/medium/low cut candidates)")
        sec = ax[0].secondary_xaxis("top", functions=(lambda x: x / 60, lambda s: s * 60))
        sec.set_xlabel("seconds")
        fig.tight_layout()
        fig.savefig(v.dir / "motion.png", dpi=110)
        plt.close(fig)
        print(v.key, "frames", len(frames), "peaks", len(peaks), "off-cut peaks", sum(not p["at_cut"] for p in peaks))


if __name__ == "__main__":
    main()
