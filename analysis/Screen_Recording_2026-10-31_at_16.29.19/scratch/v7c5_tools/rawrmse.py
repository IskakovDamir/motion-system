# raw-time RMSE of the stored bezier and spring fits vs measured progress (all samples, and active samples only)
import csv, json, math, sys, glob
for p in sorted(glob.glob('curves/*.v7c5.csv')):
    rows = list(csv.DictReader(open(p)))
    j = json.load(open(p[:-4] + '.json'))
    def rm(col, act):
        rr = [r for r in rows if (not act or r['in_active'] == '1')]
        return math.sqrt(sum((float(r[col]) - float(r['progress'])) ** 2 for r in rr) / len(rr))
    print(f"{j['technique_id']:52s} shape bez {j['bezier']['rmse']:.4f} spr {j['spring']['rmse']:.4f} | raw all bez {rm('bezier_fit',0):.4f} spr {rm('spring_fit',0):.4f} | raw active bez {rm('bezier_fit',1):.4f} spr {rm('spring_fit',1):.4f} | rec {j['recommended']}")
