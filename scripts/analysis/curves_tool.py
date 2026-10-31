"""Manage measured curves of one video.

  index <video>                       rebuild analysis/<v>/curves/index.json from the sidecars
  rename <video> <old_id> <new_id>    rename a curve (csv + json) and its technique_id
  drop <video> <id>                   delete a curve
  list <video>                        print id, property, measured duration, best rmse
"""
import json
import sys

from common import get_video, load_json, save_json
from curvekit import TOL


def index(v):
    d = v.dir / "curves"
    curves = {}
    for p in sorted(d.glob("*.json")):
        if p.name == "index.json":
            continue
        e = json.loads(p.read_text())
        curves[e["technique_id"]] = e
    save_json(d / "index.json", {"video": v.stem, "key": v.key, "fps": 60,
                                 "duration_rule": f"curvekit.active_window tol={TOL}", "curves": curves})
    return curves


def main():
    cmd, name = sys.argv[1], sys.argv[2]
    v = get_video(name)
    d = v.dir / "curves"
    if cmd == "index":
        c = index(v)
        print(f"{len(c)} curves -> {d / 'index.json'}")
    elif cmd == "rename":
        old, new = sys.argv[3], sys.argv[4]
        e = load_json(d / f"{old}.json")
        if e is None:
            sys.exit(f"no curve {old}")
        (d / f"{old}.csv").rename(d / f"{new}.csv")
        (d / f"{old}.json").unlink()
        e["technique_id"] = new
        e["file"] = f"curves/{new}.csv"
        save_json(d / f"{new}.json", e)
        index(v)
        print(f"{old} -> {new}")
    elif cmd == "drop":
        cid = sys.argv[3]
        for ext in ("csv", "json"):
            (d / f"{cid}.{ext}").unlink(missing_ok=True)
        index(v)
        print(f"dropped {cid}")
    elif cmd == "list":
        for cid, e in index(v).items():
            best = min(e["bezier"]["rmse"], e["spring"]["rmse"])
            print(f"{cid:50s} {e['property']:14s} {e['measured_duration_frames']:4d} f  best rmse {best:.4f} ({e['recommended']})")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
