# -*- coding: utf-8 -*-
"""Aide d’écriture des nouveaux formats (v1.4). Chaque fonction ajoute une question à la liste courante ;
save(theme, prefixe) l’écrit dans tools/nouveaux/<theme>.json (ids <prefixe>-071, -072…).
  I  intrus      : I(n, énoncé, intrus, [3 autres], expl, src)
  T  texte à trous : T(n, énoncé avec « ____ », bonne, [3 fausses], expl, src)
  W  qui suis-je : W(n, [indices du plus vague au plus précis], bonne, [3 fausses], expl, src, intro=…)
  M  multiples   : M(n, énoncé, [bonnes (2 à 3)], [fausses (2 à 3)], expl, src)
  O  ordre       : O(n, consigne, [éléments dans le BON ordre], expl, src)
  A  association : A(n, consigne, [(gauche, droite), …], expl, src)"""
import json, os
L = []
def I(n, q, intrus, autres, e, s): L.append(dict(type='intrus', niveau=n, q=q, choix=[intrus] + list(autres), rep=0, expl=e, src=s))
def T(n, q, bonne, fausses, e, s): L.append(dict(type='trou', niveau=n, q=q, choix=[bonne] + list(fausses), rep=0, expl=e, src=s))
def W(n, indices, bonne, fausses, e, s, intro='Qui suis-je ?'):
    q = intro + '\n' + '\n'.join('%d. %s' % (k + 1, t) for k, t in enumerate(indices))
    L.append(dict(type='qui', niveau=n, q=q, choix=[bonne] + list(fausses), rep=0, expl=e, src=s))
def M(n, q, bonnes, fausses, e, s):
    L.append(dict(type='multi', niveau=n, q=q, choix=list(bonnes) + list(fausses), reps=list(range(len(bonnes))), expl=e, src=s))
def O(n, q, items, e, s): L.append(dict(type='ordre', niveau=n, q=q, items=list(items), expl=e, src=s))
def A(n, q, paires, e, s): L.append(dict(type='assoc', niveau=n, q=q, paires=[list(p) for p in paires], expl=e, src=s))
def save(theme, prefix):
    out = []
    for k, d in enumerate(L):
        d = dict(d); d['id'] = '%s-%03d' % (prefix, 71 + k); d['conf'] = 'probable'; d['concept'] = 'nv_' + d['type']
        if len(d['expl']) < 10: raise SystemExit(d['id'] + ' : explication trop courte')
        out.append(d)
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), theme + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(theme, len(out), 'questions nouveaux formats'); L.clear()
