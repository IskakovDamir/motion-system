import csv, collections
D = "/Users/damir/dev/motion-system/analysis/yI-1xclfzqMRrqfA/scratch/"
by = collections.defaultdict(list)
for r in csv.DictReader(open(D + "v3c1_lattice_nodes_140-215.csv")):
    by[(int(r["row_j"]), int(r["col_k"]))].append(r)
rowy = {-2: 118.5, -1: 287.1, 0: 455.7, 1: 624.3, 2: 792.9, 3: 961.5}
print("row  k  final(x,y)      first_in  full_in  vis(p2<236)  settled_p2  p2 from (first partial frame) ...")
for (j, k), rs in sorted(by.items()):
    fin = rs[-1]
    fx, fy = float(fin["final_x"]), float(fin["final_y"])
    sett = sorted(float(r["p2_luma"]) for r in rs if int(r["frame"]) >= 209 and r["p2_luma"] != "")
    sett = sett[len(sett) // 2] if sett else None
    first_in = next((int(r["frame"]) for r in rs if float(r["badge_inside_frac"]) > 0.0 and r["p2_luma"] != ""), None)
    full_in = next((int(r["frame"]) for r in rs if float(r["badge_inside_frac"]) >= 0.999), None)
    vis = next((int(r["frame"]) for r in rs if r["p2_luma"] != "" and float(r["p2_luma"]) < 236), None)
    seq = [(int(r["frame"]), r["p2_luma"], float(r["badge_inside_frac"])) for r in rs if r["p2_luma"] != ""]
    s = " ".join(f"{f}:{p}{'' if fr >= 0.999 else '*'}" for f, p, fr in seq[:14])
    print(f"{j:3d} {k:3d} ({fx:6.1f},{fy:5.1f})  {first_in}  {full_in}  {vis}  {sett}  | {s}")
