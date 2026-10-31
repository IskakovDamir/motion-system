# P6 capsule collapse (v7c5): pill width at the rest camera scale. The camera push-in about (2315, 992) px creeps
# during the collapse (scale 1.0017 at f3792 -> 1.0524 at f3816, scratch/v7c5_p6_pushin_fp.csv, 1.0 = f3780), so the
# screen width (scratch/v7c5_p6_capsule_shrink_nodup.csv, dark component bbox width) is divided by that scale.
# usage: capsule_camcorr.py -> scratch/v7c5_p6_capsule_shrink_camcorr.csv
import csv
D = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/scratch/'
sc = {int(r['frame']): float(r['scale']) for r in csv.DictReader(open(D + 'v7c5_p6_pushin_fp.csv'))}
rows = []
for r in csv.DictReader(open(D + 'v7c5_p6_capsule_shrink_nodup.csv')):
    f = int(r['frame'])
    s = sc[f]
    w = float(r['width_px'])
    rows.append({'frame': f, 'unique': 1, 'width_px': int(w), 'cam_scale': f"{s:.5f}", 'width_rest_px': f"{w / s:.2f}"})
with open(D + 'v7c5_p6_capsule_shrink_camcorr.csv', 'w', newline='') as fh:
    w_ = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w_.writeheader(); w_.writerows(rows)
for r in rows: print(r)
