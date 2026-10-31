"""One y series for the ghost grid across the punch-in cut f2091 (review fix).

Feature: the gutter between ghost rows 2 and 3 (midpoint of row 2's bottom edge and row 3's top
edge), as an offset from the large timecode label, in P4-framing px (close-up px / 1.762).
P4 (f2061-f2089): template track of the top-right box (v7c3_p4_ghost_box_r2059.csv, cy_rel_label)
  + 288.0 px; the offset was calibrated on the clean row-edge peaks of f2069-f2089 (287.9-288.9 px).
P5 (f2094-f2114): profile peaks of picture minus f2116 (v7c3_p45_ghost_rows.csv), associated
  backwards from f2114 (row 2 bottom about +105.8, row 3 top about +132.5 P4 px).
Also writes the feature in % of frame height at the P4 framing (gutter_rel_label_p4_pct) and, for
P5, in close-up px (gutter_rel_label_closeup).
Output: scratch/v7c3_p45_ghost_y.csv
"""
import csv

base = '/Users/damir/dev/motion-system/analysis/Screen_Recording_2026-10-31_at_16.29.19/'
SCALE = 1 / 0.5675
K = 288.0
box = [r for r in csv.DictReader(open(base + 'scratch/v7c3_p4_ghost_box_r2059.csv')) if int(r['frame']) >= 2061]
peaks = {}
for r in csv.DictReader(open(base + 'scratch/v7c3_p45_ghost_rows.csv')):
    if r['segment'] != 'P5':
        continue
    peaks.setdefault(int(r['frame']), []).append((float(r['rel_label_p4px']), float(r['prominence'])))

rows = []
for r in box:
    f = int(r['frame'])
    g = float(r['cy_rel_label']) + K
    rows.append([f, r['unique'], 'P4', round(g, 1), round(100 * g / 918, 3), '', round(float(r['cy_rel_label']), 1), r['score']])

# P5: associate row-2 bottom (c) and row-3 top (d) backwards from f2114
c_prev, d_prev = 105.8, 132.5
p5 = []
for f in sorted(peaks, reverse=True):
    if f < 2094:
        continue
    cand = [p for p in peaks[f] if p[1] >= 8]
    c = min(cand, key=lambda p: abs(p[0] - c_prev))
    d = min(cand, key=lambda p: abs(p[0] - d_prev))
    if abs(c[0] - c_prev) > 16 or abs(d[0] - d_prev) > 16:
        continue
    c_prev, d_prev = c[0], d[0]
    g = (c[0] + d[0]) / 2
    p5.append([f, '1', 'P5', round(g, 1), round(100 * g / 918, 3), round(g * SCALE, 1), f'{c[0]:.1f}/{d[0]:.1f}', ''])
rows += sorted(p5)
with open(base + 'scratch/v7c3_p45_ghost_y.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['frame', 'unique', 'segment', 'gutter_rel_label_p4px', 'gutter_rel_label_p4_pct', 'gutter_rel_label_closeup', 'source_value', 'score'])
    w.writerows(rows)
for r in rows:
    print(r)
