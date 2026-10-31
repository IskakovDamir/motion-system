"""Nearest beat and strong onset for graphic events (sound sync).

  python sync.py <video> <frame> [<frame> ...]
prints, per event frame: nearest beat frame and offset (event - beat, in analysis frames),
nearest strong onset and offset. Positive offset = the picture is late against the sound.
"""
import sys

from common import get_video, load_json


def main():
    v = get_video(sys.argv[1])
    a = load_json(v.dir / "audio.json")
    if not a or not a.get("present"):
        sys.exit("no audio")
    beats = [b["frame"] for b in a["beats"]]
    strong = [o["frame"] for o in a["onsets"] if o["strong"]]
    print(f"tempo {a['tempo_bpm']} bpm = {a['beat_period_frames_60']} frames per beat")
    for s in sys.argv[2:]:
        f = int(s)
        nb = min(beats, key=lambda b: abs(b - f)) if beats else None
        no = min(strong, key=lambda o: abs(o - f)) if strong else None
        print(f"event f{f}: beat f{nb} offset {f - nb:+d} | strong onset f{no} offset {f - no:+d}")


if __name__ == "__main__":
    main()
