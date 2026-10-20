# -*- coding: utf-8 -*-
"""Fusionne tools/nouveaux/<theme>.json (nouveaux formats) dans quiz/<theme>.json.
Idempotent : les anciennes entrées de ces formats (id ≥ 071) sont remplacées. Usage : python3 tools/add_formats.py <theme-id> | --all"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
NEW = ('intrus', 'trou', 'qui', 'multi', 'ordre', 'assoc')
def merge(theme):
    qp = os.path.join(root, 'quiz', theme + '.json'); npth = os.path.join(here, 'nouveaux', theme + '.json')
    if not os.path.exists(npth): return
    d = json.load(open(qp, encoding='utf-8')); new = json.load(open(npth, encoding='utf-8'))
    keep = [q for q in d['questions'] if q['type'] not in NEW]
    d['questions'] = keep + new
    json.dump(d, open(qp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(theme, ':', len(keep), 'anciennes +', len(new), 'nouveaux formats')
if __name__ == '__main__':
    if sys.argv[1] == '--all':
        for f in sorted(os.listdir(os.path.join(here, 'nouveaux'))):
            if f.endswith('.json'): merge(f[:-5])
    else: merge(sys.argv[1])
