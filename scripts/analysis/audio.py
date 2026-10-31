"""Step 2c: onsets and beats with librosa -> analysis/<video>/audio.json.

Times are relative to the first video frame (audio start_time offset applied) and mapped to the
60 fps analysis grid. Usage: python audio.py [v1 v2 ...]
"""
import subprocess
import sys

import librosa
import numpy as np

from common import ffprobe_json, load_registry, save_json

SR = 22050
HOP = 256


def main():
    names = sys.argv[1:]
    for v in load_registry():
        if names and v.key not in names and v.stem not in names:
            continue
        probe = ffprobe_json(v.source, "-show_streams")
        vs = next(s for s in probe["streams"] if s["codec_type"] == "video")
        aus = [s for s in probe["streams"] if s["codec_type"] == "audio"]
        if not aus:
            save_json(v.dir / "audio.json", {"video": v.stem, "present": False})
            print(v.key, "no audio")
            continue
        offset = float(aus[0].get("start_time", 0)) - float(vs.get("start_time", 0))
        wav = v.dir / "audio.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(v.source), "-vn", "-ac", "1", "-ar", str(SR), str(wav)], check=True)
        y, sr = librosa.load(str(wav), sr=SR, mono=True)
        env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
        onset_idx = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=HOP, backtrack=False, units="frames")
        onset_t = librosa.frames_to_time(onset_idx, sr=sr, hop_length=HOP)
        tempo, beat_idx = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=HOP, units="frames")
        tempo = float(np.atleast_1d(tempo)[0])
        beat_t = librosa.frames_to_time(beat_idx, sr=sr, hop_length=HOP)
        # strong onsets: top quartile of onset strength
        strengths = env[onset_idx] if len(onset_idx) else np.array([])
        q75 = float(np.percentile(strengths, 75)) if len(strengths) else 0.0
        rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
        silent = float(np.mean(rms < 1e-3))

        def fr(t):
            return int(round((t + offset) * 60))

        save_json(v.dir / "audio.json", {
            "video": v.stem,
            "present": True,
            "sample_rate_analysis": SR,
            "hop_length": HOP,
            "audio_offset_s": round(offset, 4),
            "time_base": "seconds from the first video frame; frame = round(time_s * 60)",
            "duration_s": round(len(y) / sr, 3),
            "silent_fraction": round(silent, 3),
            "tempo_bpm": round(tempo, 2),
            "beat_period_frames_60": round(60 * 60 / tempo, 3) if tempo > 0 else None,
            "beats": [{"time_s": round(float(t + offset), 4), "frame": fr(t)} for t in beat_t],
            "onsets": [{"time_s": round(float(t + offset), 4), "frame": fr(t), "strength": round(float(s), 3),
                        "strong": bool(s >= q75)} for t, s in zip(onset_t, strengths)],
            "notes": [
                "librosa onset_detect (no backtrack) and beat_track on the onset envelope; hop 256 @ 22050 Hz = 11.6 ms",
                "screen recordings carry the captured system audio of the player",
            ],
        })
        print(v.key, f"tempo {tempo:.1f} bpm, beats {len(beat_t)}, onsets {len(onset_t)}, offset {offset:+.3f}s")


if __name__ == "__main__":
    main()
