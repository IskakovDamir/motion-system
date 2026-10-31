"""Split each video into inspection chunks of about TARGET analysis frames. Boundaries sit on a
high-confidence cut candidate near the target or, failing that, on the quietest frame
(lowest smoothed motion energy) within +-120 frames, so transitions are not split."""
import csv

import numpy as np

from common import ANALYSIS, load_json, load_registry, save_json

TARGET = 800


def main():
    plan = {"target_frames": TARGET, "videos": []}
    for v in load_registry():
        n = load_json(v.dir / "meta.json")["analysis"]["grid_frame_count"]
        rows = list(csv.DictReader(open(v.dir / "motion.csv")))
        e = np.zeros(n)
        for r in rows:
            f = int(r["frame"])
            if f < n:
                e[f] = float(r["diff_mean"]) + float(r["flow_mag"]) / 50
        e = np.convolve(e, np.ones(31) / 31, mode="same")
        cuts = [c["frame"] for c in load_json(v.dir / "cuts.json")["cuts"] if c["confidence"] == "high"]
        k = max(1, int(round(n / TARGET)))
        bounds = [0]
        for i in range(1, k):
            t = int(round(i * n / k))
            near = [c for c in cuts if abs(c - t) <= 120]
            if near:
                b = min(near, key=lambda c: abs(c - t))
            else:
                lo, hi = max(1, t - 120), min(n - 1, t + 120)
                b = lo + int(np.argmin(e[lo:hi]))
            bounds.append(b)
        bounds.append(n)
        chunks = [{"id": f"{v.key}c{i + 1}", "start": bounds[i], "end": bounds[i + 1] - 1} for i in range(len(bounds) - 1)]
        plan["videos"].append({"key": v.key, "stem": v.stem, "frames": n, "chunks": chunks})
        print(v.key, n, [(c["start"], c["end"]) for c in chunks])
    save_json(ANALYSIS / "chunks.json", plan)


if __name__ == "__main__":
    main()
