#!/usr/bin/env python3
"""Step 8: verify the motion system against the measured references. Exits 0 and prints PASS only
when every check passes.

  .venv/bin/python scripts/verify.py [--skip-render] [--skip-pixels]

Checks
  classification  every segment of every video classified, LIVE segments confirmed on overview
                  sheets (scripts/analysis/validate_analysis.py rules)
  coverage        every technique in every timeline.md maps (the primitive specs, via sample_curves.ts) to a named
                  primitive that exists in the primitive registry and plays in MotionShowcase
  timing          every technique with a measured curve: the built curve sampled from the code
                  (scripts/sample_curves.ts -> progressAt, the function the primitives render with)
                  has a duration within 1 frame of the measured one and normalised RMSE <= 0.05
  tempo           StyleDemo median shot length within 15% of the graphics median in MOTION_SPEC.md
                  (and MOTION_SPEC's numbers equal what segments.json gives)
  clean           nothing in src/ or public/ points at reference/ or analysis/; no file in src/,
                  public/ or out/ is a copy of a reference video or an extracted frame; no rendered
                  frame matches a reference frame; no person detected in any render
  renders         npx remotion render finishes with zero errors for MotionShowcase and StyleDemo
  compare         analysis/compare/<technique>/sheet.jpg exists for every technique
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "analysis"))
from common import load_json, load_registry  # noqa: E402
from curvekit import active_window, shape_rmse  # noqa: E402
import validate_analysis  # noqa: E402

OUT = ROOT / "out"
VERIFY = ROOT / "analysis" / "verify"
RENDERS = {"MotionShowcase": OUT / "MotionShowcase.mp4", "StyleDemo": OUT / "StyleDemo.mp4"}
RMSE_MAX = 0.05
DUR_TOL = 1
TEMPO_TOL = 0.15

results: list[tuple[str, bool, str]] = []


def report(name: str, ok: bool, detail: str) -> None:
    results.append((name, ok, detail))
    print(f"[{'ok' if ok else 'FAIL'}] {name}: {detail}")


# ---------------------------------------------------------------- inputs
def timeline_techniques() -> dict[str, dict]:
    """technique id -> {video, reference_frames, curve} from every timeline.md technique index."""
    out = {}
    for v in load_registry():
        md = (v.dir / "timeline.md").read_text() if (v.dir / "timeline.md").exists() else ""
        rows = validate_analysis.technique_rows(md) or []
        for tid, cells in rows:
            # columns: technique | category | segments | reference frames | curve | summary; a single
            # frame (f830) is a one-frame reference
            ref = re.search(r"f(\d+)(?:\s*-\s*f?(\d+))?", cells[3] if len(cells) > 3 else "")
            curve = re.search(r"curves/([^\s|`]+)\.csv", " ".join(cells))
            out[tid] = {"video": v.key, "stem": v.stem,
                        "reference_frames": [int(ref.group(1)), int(ref.group(2) or ref.group(1))] if ref else None,
                        "curve": curve.group(1) if curve else None}
    return out


def run_sampler() -> dict:
    VERIFY.mkdir(parents=True, exist_ok=True)
    dst = VERIFY / "built.json"
    p = subprocess.run(["npx", "tsx", "scripts/sample_curves.ts"], cwd=ROOT, capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit(f"sample_curves.ts failed:\n{p.stderr[-3000:]}")
    dst.write_text(p.stdout)
    return json.loads(p.stdout)


# ---------------------------------------------------------------- checks
def check_classification() -> None:
    errs = []
    counts = {"GRAPHICS": 0, "MIXED": 0, "LIVE": 0}
    for v in load_registry():
        e, _ = validate_analysis.check(v)
        errs += e
        seg = load_json(v.dir / "segments.json", {"segments": []})
        for s in seg["segments"]:
            counts[s["class"]] = counts.get(s["class"], 0) + 1
    report("classification", not errs, f"{counts}" + (f"; {len(errs)} errors, first: {errs[0]}" if errs else ""))


def check_coverage(techs: dict, built: dict) -> None:
    # the technique -> primitive map comes from the primitive specs themselves (sample_curves.ts),
    # so a mapping cannot exist without the code that implements it
    cat = built["catalogue"]
    prims = set(built["primitives"])
    shown = set(built["showcase"])
    missing = [t for t in techs if t not in cat]
    unknown = [t for t in techs if t in cat and cat[t]["primitive"] not in prims]
    unshown = sorted({cat[t]["primitive"] for t in techs if t in cat and cat[t]["primitive"] not in shown})
    errors = [f"{t}: no catalogue entry" for t in missing] + [f"{t}: primitive {cat[t]['primitive']} not in registry" for t in unknown]
    errors += [f"primitive {p} missing from MotionShowcase" for p in unshown]
    pct = 100.0 * (len(techs) - len(missing) - len(unknown)) / max(1, len(techs))
    report("coverage", not errors, f"{len(techs)} techniques -> {len({cat[t]['primitive'] for t in techs if t in cat})} primitives, {pct:.1f}% mapped"
           + (f"; {len(errors)} problems, first: {errors[0]}" if errors else ""))


def check_timing(techs: dict, built: dict) -> list[dict]:
    rows, bad = [], []
    for tid, t in sorted(techs.items()):
        if not t["curve"]:
            continue
        v = next(x for x in load_registry() if x.key == t["video"])
        f = v.dir / "curves" / f"{t['curve']}.csv"
        if not f.exists():
            bad.append(f"{tid}: curve file missing")
            continue
        data = np.genfromtxt(f, delimiter=",", names=True)
        mf, mp = data["frame"].astype(float), data["progress"].astype(float)
        b = built["techniques"].get(tid)
        if not b or not b.get("progress"):
            bad.append(f"{tid}: no built curve ({(b or {}).get('error', 'not sampled')})")
            continue
        bp = np.array(b["progress"], float)
        rmse, md, bd = shape_rmse(mf, mp, np.arange(len(bp)), bp)
        ok = abs(bd - md) <= DUR_TOL and rmse <= RMSE_MAX
        rows.append({"technique": tid, "primitive": b["primitive"], "variant": b.get("variant"), "property": b.get("property"),
                     "measured_frames": md, "built_frames": bd, "rmse": round(rmse, 4), "ok": ok})
        if not ok:
            bad.append(f"{tid}: measured {md:.0f} f, built {bd:.0f} f, rmse {rmse:.3f}")
    VERIFY.mkdir(parents=True, exist_ok=True)
    (VERIFY / "timing.json").write_text(json.dumps(rows, indent=1))
    report("timing", not bad and bool(rows), f"{len(rows)} measured curves, {sum(r['ok'] for r in rows)} within 1 frame and RMSE <= {RMSE_MAX}"
           + (f"; first problem: {bad[0]}" if bad else ""))
    return rows


def graphics_tempo_from_segments() -> dict:
    lengths = []
    total_frames = 0
    for v in load_registry():
        seg = load_json(v.dir / "segments.json", {"segments": []})["segments"]
        for s in seg:
            if s["class"] in ("GRAPHICS", "MIXED"):
                n = s["end"] - s["start"] + 1
                lengths.append(n)
                total_frames += n
    a = np.array(lengths, float)
    return {"segments": len(a), "median_shot_frames": float(np.median(a)), "mean_shot_frames": float(a.mean())}


def check_tempo(built: dict) -> None:
    spec = (ROOT / "MOTION_SPEC.md").read_text()
    m = re.search(r"<!--\s*tempo\s*(\{.*?\})\s*-->", spec, re.S)
    if not m:
        report("tempo", False, "MOTION_SPEC.md has no <!-- tempo {...} --> block")
        return
    t = json.loads(m.group(1))
    seg = graphics_tempo_from_segments()
    consistent = abs(seg["median_shot_frames"] - t["median_shot_frames"]) <= 0.5
    shots = [s["durationInFrames"] for s in built["styleDemo"]["shots"]]
    demo_median = float(np.median(shots))
    dev = abs(demo_median - t["median_shot_frames"]) / t["median_shot_frames"]
    ok = consistent and dev <= TEMPO_TOL
    report("tempo", ok, f"StyleDemo median {demo_median:.1f} f over {len(shots)} shots vs references {t['median_shot_frames']:.1f} f "
           f"({100 * dev:.1f}% off, limit {100 * TEMPO_TOL:.0f}%); MOTION_SPEC matches segments.json: {consistent}")


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for b in iter(lambda: fh.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def dhash(gray: np.ndarray) -> int:
    s = cv2.resize(gray, (9, 8), interpolation=cv2.INTER_AREA)
    bits = (s[:, 1:] > s[:, :-1]).flatten()
    return int(sum(1 << i for i, b in enumerate(bits) if b))


def reference_fingerprints() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """dHash, 32x18 thumbnail and (video index, frame) of every captured reference picture (cached)."""
    cache = VERIFY / "ref_fingerprints.npz"
    if cache.exists():
        z = np.load(cache)
        if "where" in z.files:
            return z["hashes"], z["thumbs"], z["where"]
    hashes, thumbs, where = [], [], []
    for k, v in enumerate(load_registry()):
        cap = cv2.VideoCapture(str(v.work))
        prev = None
        f = -1
        while True:
            ok, img = cap.read()
            if not ok:
                break
            f += 1
            g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            th = cv2.resize(g, (32, 18), interpolation=cv2.INTER_AREA).astype(np.float32)
            if prev is not None and np.abs(th - prev).mean() < 0.5:
                continue  # 60 fps duplicate of the previous picture
            prev = th
            hashes.append(dhash(g))
            thumbs.append(th)
            where.append((k, f))
        cap.release()
    VERIFY.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(cache, hashes=np.array(hashes, dtype=np.uint64), thumbs=np.array(thumbs), where=np.array(where))
    return np.array(hashes, dtype=np.uint64), np.array(thumbs), np.array(where)


def content_ncc(a: np.ndarray, b: np.ndarray, level: float = 10) -> float:
    """Normalised correlation of two grayscale pictures over their content: pixels that differ from their
    picture's own background (median) by more than `level` in either. Two pictures that only share an
    empty field score near 0; a copy scores near 1."""
    a = a - np.median(a)
    b = b - np.median(b)
    m = (np.abs(a) > level) | (np.abs(b) > level)
    if m.sum() < 10:
        return 0.0
    a, b = a[m], b[m]
    return float((a * b).sum() / np.sqrt((a * a).sum() * (b * b).sum() + 1e-6))


def popcount64(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.uint64)
    c = np.zeros(x.shape, np.int64)
    for _ in range(64):
        c += (x & np.uint64(1)).astype(np.int64)
        x = x >> np.uint64(1)
    return c


def check_clean(skip_pixels: bool) -> None:
    problems = []
    names = [v.ref_name for v in load_registry()] + [v.stem for v in load_registry()]
    pat = re.compile(r"(reference/|analysis/|\.\./reference|\.\./analysis)")
    for base in (ROOT / "src", ROOT / "public"):
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_file() and p.suffix in (".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".html"):
                s = p.read_text(errors="ignore")
                if pat.search(s) or any(n in s for n in names):
                    problems.append(f"{p.relative_to(ROOT)} refers to reference/analysis material")
    # byte copies
    protected = {sha256(v.ref) for v in load_registry() if v.ref.exists()}
    for v in load_registry():
        for sub in ("sheets", "detail", "type", "crops", "scratch"):
            d = v.dir / sub
            if d.exists():
                protected |= {sha256(p) for p in d.rglob("*") if p.is_file() and p.suffix in (".jpg", ".png")}
        for p in (v.source, v.work):
            if p.exists():
                protected.add(sha256(p))
    for base in (ROOT / "src", ROOT / "public", OUT):
        if base.exists():
            for p in base.rglob("*"):
                if p.is_file() and sha256(p) in protected:
                    problems.append(f"{p.relative_to(ROOT)} is a copy of reference material")
    frames_checked = people = matches = 0
    if not skip_pixels:
        hashes, thumbs, where = reference_fingerprints()
        regs = load_registry()
        ref_caps: dict[int, cv2.VideoCapture] = {}

        def ref_picture(n: int) -> np.ndarray:
            k, f = int(where[n][0]), int(where[n][1])
            cap = ref_caps.setdefault(k, cv2.VideoCapture(str(regs[k].work)))
            cap.set(cv2.CAP_PROP_POS_FRAMES, f)
            _, img = cap.read()
            return cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (128, 72), interpolation=cv2.INTER_AREA).astype(np.float32)

        face = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        profile = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
        eye = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        upper = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_upperbody.xml")
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        raw_people = 0
        for comp, path in RENDERS.items():
            if not path.exists():
                problems.append(f"{path.relative_to(ROOT)} missing (render first)")
                continue
            cap = cv2.VideoCapture(str(path))
            i = 0
            while True:
                ok, img = cap.read()
                if not ok:
                    break
                if i % 3 == 0:
                    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    frames_checked += 1
                    th = cv2.resize(g, (32, 18), interpolation=cv2.INTER_AREA).astype(np.float32)
                    if th.std() > 6:  # blank or near-blank frames cannot be "copies" of anything
                        d = popcount64(hashes ^ np.uint64(dhash(g)))
                        cand = np.nonzero(d <= 8)[0]
                        # a near-blank reference picture cannot be copied either
                        cand = cand[thumbs[cand].reshape(len(cand), -1).std(axis=1) > 6] if len(cand) else cand
                        if len(cand):
                            err = np.abs(thumbs[cand] - th).mean(axis=(1, 2))
                            close = cand[err < 6.0]
                            if len(close):
                                # second stage at 128x72: do the two pictures share their content, not just an
                                # empty field? (calibration: centred words and lone marks <= 0.57, copies >= 0.70)
                                mine = cv2.resize(g, (128, 72), interpolation=cv2.INTER_AREA).astype(np.float32)
                                ncc = max(content_ncc(mine, ref_picture(int(n))) for n in close[np.argsort(err[err < 6.0])[:5]])
                                if ncc >= 0.6:
                                    matches += 1
                                    problems.append(f"{comp} frame {i} matches a reference picture (content correlation {ncc:.2f})")
                    if i % 6 == 0:
                        small = cv2.resize(g, (960, 540), interpolation=cv2.INTER_AREA)
                        faces = list(face.detectMultiScale(small, 1.1, 8, minSize=(48, 48))) + list(profile.detectMultiScale(small, 1.1, 8, minSize=(48, 48)))
                        rects, weights = hog.detectMultiScale(small, winStride=(8, 8), scale=1.05)
                        bodies = [r for r, w in zip(rects, np.ravel(weights)) if w > 1.0] if len(rects) else []
                        if faces or bodies:
                            raw_people += 1
                        # a detection counts when a second, independent cue agrees: an eye inside the upper part
                        # of a face box, or an upper body (or a confirmed face) inside a body box. Digits, rain
                        # streaks, dot grids and orbit rings fire the first stage alone on these graphics.
                        def has(cascade, x, y, w, h, frac=1.0, mn=24):
                            roi = small[max(0, y):y + int(h * frac), max(0, x):x + w]
                            return roi.size > 0 and len(cascade.detectMultiScale(roi, 1.1, 6, minSize=(mn // 2, mn // 2))) > 0
                        conf_faces = [f for f in faces if has(eye, *f, frac=0.6, mn=16)]
                        conf_bodies = [b for b in bodies if has(upper, *b, mn=48) or any(
                            b[0] <= f[0] and f[0] + f[2] <= b[0] + b[2] and b[1] <= f[1] and f[1] + f[3] <= b[1] + b[3] for f in conf_faces)]
                        if conf_faces or conf_bodies:
                            people += 1
                            problems.append(f"{comp} frame {i}: person detector fired (faces {len(conf_faces)}, bodies {len(conf_bodies)})")
                i += 1
            cap.release()
        for c in ref_caps.values():
            c.release()
    report("clean", not problems, f"src/public/out scanned; {frames_checked} render frames compared with every reference picture; "
           f"reference matches {matches}, person detections {people}"
           + (f" (first-stage detector hits {raw_people}, none confirmed)" if not skip_pixels and not people else "")
           + (f"; first problem: {problems[0]}" if problems else ""))


def run_render(comp: str) -> tuple[bool, str]:
    tmp = ROOT / ".tmp" / "remotion"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, TMPDIR=str(tmp) + "/")
    OUT.mkdir(exist_ok=True)
    p = subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(RENDERS[comp].relative_to(ROOT))],
                       cwd=ROOT, env=env, capture_output=True, text=True)
    log = p.stdout + p.stderr
    (VERIFY / f"render_{comp}.log").write_text(log)
    shutil.rmtree(tmp, ignore_errors=True)
    errors = [l for l in log.splitlines() if re.search(r"\b(error|Error|ERROR)\b", l) and "0 errors" not in l]
    return p.returncode == 0 and not errors, f"exit {p.returncode}, {len(errors)} error lines" + (f": {errors[0][:160]}" if errors else "")


def check_renders(skip: bool) -> None:
    VERIFY.mkdir(parents=True, exist_ok=True)
    for comp in RENDERS:
        if skip:
            log = VERIFY / f"render_{comp}.log"
            ok = RENDERS[comp].exists() and log.exists()
            report(f"render {comp}", ok, "skipped; using the last render" if ok else "no previous render")
            continue
        ok, detail = run_render(comp)
        report(f"render {comp}", ok, detail)


def check_compare(techs: dict) -> None:
    missing = [t for t in techs if not (ROOT / "analysis" / "compare" / t / "sheet.jpg").exists()]
    report("compare", not missing, f"{len(techs) - len(missing)}/{len(techs)} techniques have analysis/compare/<technique>/sheet.jpg"
           + (f"; missing e.g. {missing[0]}" if missing else ""))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-render", action="store_true", help="reuse out/*.mp4 from the last run")
    ap.add_argument("--skip-pixels", action="store_true", help="skip the render-frame scans (fast iteration only)")
    a = ap.parse_args()
    techs = timeline_techniques()
    check_classification()
    built = run_sampler()
    check_coverage(techs, built)
    check_timing(techs, built)
    check_tempo(built)
    check_renders(a.skip_render)
    check_clean(a.skip_pixels)
    check_compare(techs)
    ok = all(r[1] for r in results) and not a.skip_pixels
    (VERIFY / "report.json").write_text(json.dumps([{"check": n, "ok": o, "detail": d} for n, o, d in results], indent=1))
    print("PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
