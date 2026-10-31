"""Summarise scratch/v3c1_lattice_edges_140-215.csv into scratch/v3c1_lattice_edges_summary.txt.

Per connector (node ids j,k as in lattice_onsets.py; final screen positions in the header): the draw-on window =
first frame of the final rise (drawn fraction > 0.03 after the last frame <= 0.03, sampled part >= 90% in the
picture) to the first frame >= 0.95; the end it grows from (run from node a or b during the rise); 'entered drawn'
when the connector is already >= 0.85 drawn in its first three frames in the picture. One-frame readings on the
picture's first/last pixel row (f154, f173-f174) are an edge artefact and are skipped by the rule above.
"""
import csv, collections, math
D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
S209 = 0.290696
AL = {-2, 0, 1, 3}
def final(nid):
    j, k = map(int, nid.split(","))
    px = (960.5 if j in AL else 1290.5) + 660 * k
    return f"({960 + (px - 960) * S209:.1f}, {540 + (250.5 + 580 * j - 540) * S209:.1f})"
def fl(x):
    try: return float(x)
    except: return float("nan")
by = collections.defaultdict(list)
for r in csv.DictReader(open(D + "v3c1_lattice_edges_140-215.csv")):
    by[(r["node_a"], r["node_b"], r["kind"])].append(r)
out = []
for key, rs in by.items():
    rs.sort(key=lambda r: int(r["frame"]))
    fin = [fl(r["drawn_frac"]) for r in rs if int(r["frame"]) >= 209]
    finv = sum(fin) / len(fin) if fin else float("nan")
    name = f"{key[2]:8s} {final(key[0])} -> {final(key[1])}"
    if not (finv >= 0.8):
        out.append((999, f"{name}: final drawn {finv:.2f}, absent or under the knock-out glow"))
        continue
    vis = [r for r in rs if fl(r["visible_frac"]) >= 0.9]
    first3 = [fl(r["drawn_frac"]) for r in vis[:3]]
    if first3 and min(first3) >= 0.85:
        out.append((int(vis[0]["frame"]), f"{name}: entered the picture already drawn (f{vis[0]['frame']})"))
        continue
    end = next((i for i, r in enumerate(vis) if fl(r["drawn_frac"]) >= 0.95 and
                all(fl(x["drawn_frac"]) >= 0.85 for x in vis[i:i + 3])), None)
    if end is None:
        out.append((998, f"{name}: no complete draw-on found"))
        continue
    st = end
    while st > 0 and fl(vis[st - 1]["drawn_frac"]) > 0.03:
        st -= 1
    ra = sum(fl(r["run_from_a"]) for r in vis[st:end]); rb = sum(fl(r["run_from_b"]) for r in vis[st:end])
    frm = key[0] if ra > 2 * rb else key[1] if rb > 2 * ra else "both"
    frm = final(frm) if frm != "both" else "both ends"
    tr = " ".join(f"{r['frame']}:{fl(r['drawn_frac']):.2f}" for r in vis[max(0, st - 1):end + 1])
    out.append((int(vis[st]["frame"]), f"{name}: draws f{vis[st]['frame']}-f{vis[end]['frame']} from {frm} | {tr}"))
with open(D + "v3c1_lattice_edges_summary.txt", "w") as fh:
    fh.write(__doc__.strip() + "\n\n")
    for s, txt in sorted(out):
        fh.write(txt + "\n")
print(len(out), "connectors")
