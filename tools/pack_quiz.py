# -*- coding: utf-8 -*-
"""Lit les fichiers quiz/*.json (schéma quiz-bestiaire/1) et produit la banque compacte
embarquée dans les pages (bloc JSON « lm-quiz »). Valide chaque question ; arrête le build en cas d’erreur."""
import json, os, sys

def pack(quiz_dir, royaumes_path):
    idx = json.load(open(os.path.join(quiz_dir, 'index.json'), encoding='utf-8'))
    roy_cfg = json.load(open(royaumes_path, encoding='utf-8'))
    order = [r['nom'] for r in roy_cfg['ordre']]
    themes, errors, seen_ids = [], [], set()
    for t in idx['themes']:
        if t.get('virtuel'): continue
        d = json.load(open(os.path.join(quiz_dir, t['fichier']), encoding='utf-8'))
        th = d['theme']; S = []; Q = []
        for q in d['questions']:
            qid = q['id']
            if qid in seen_ids: errors.append('id en double : ' + qid)
            seen_ids.add(qid)
            src = q.get('src_detail') or q.get('src') or (d['sources'][0] if d.get('sources') else '')
            if src not in S: S.append(src)
            o = {'i': qid, 'n': q['niveau'], 'q': q['q'], 'x': q['expl'], 's': S.index(src)}
            ty = q['type']
            if ty == 'qcm':
                if len(q['choix']) != 4 or not (0 <= q['rep'] < 4): errors.append(qid + ' : qcm invalide')
                o.update(t='c', c=q['choix'], r=q['rep'])
            elif ty == 'vf':
                if not isinstance(q['rep'], bool): errors.append(qid + ' : vf invalide')
                o.update(t='v', r=1 if q['rep'] else 0)
            elif ty == 'slider':
                if not (q['min'] <= q['rep'] <= q['max']): errors.append(qid + ' : curseur hors bornes')
                o.update(t='s', r=q['rep'], mn=q['min'], mx=q['max'], p=q['pas'], u=q.get('unite', ''), tl=q['tolerance'])
            elif ty in ('intrus', 'trou', 'qui'):
                if len(q['choix']) != 4 or len(set(q['choix'])) != 4 or not (0 <= q['rep'] < 4): errors.append(qid + ' : ' + ty + ' invalide')
                if ty == 'trou' and '____' not in q['q']: errors.append(qid + ' : texte à trous sans « ____ »')
                o.update(t={'intrus': 'i', 'trou': 'h', 'qui': 'w'}[ty], c=q['choix'], r=q['rep'])
            elif ty == 'multi':
                ch, rr = q['choix'], q['reps']
                if not (4 <= len(ch) <= 6) or len(set(ch)) != len(ch): errors.append(qid + ' : multi : propositions invalides')
                if not (2 <= len(rr) < len(ch)) or len(set(rr)) != len(rr) or any(not (0 <= k < len(ch)) for k in rr): errors.append(qid + ' : multi : bonnes réponses invalides')
                o.update(t='m', c=ch, r=sorted(rr))
            elif ty == 'ordre':
                it = q['items']
                if not (3 <= len(it) <= 5) or len(set(it)) != len(it): errors.append(qid + ' : ordre invalide')
                o.update(t='o', c=it)
            elif ty == 'assoc':
                pr = q['paires']
                if not (3 <= len(pr) <= 5) or len({a for a, b in pr}) != len(pr) or len({b for a, b in pr}) != len(pr): errors.append(qid + ' : association invalide')
                o.update(t='a', c=[a for a, b in pr], d=[b for a, b in pr])
            else:
                errors.append(qid + ' : type inconnu ' + str(ty)); continue
            Q.append(o)
        themes.append({'id': th['id'], 'nom': th['nom'], 'roy': th['royaume'], 'ico': th['icone'],
                       'dk': 1 if (t.get('sombre') or th.get('sombre')) else 0, 'S': S, 'Q': Q})
    # royaumes : ordre voulu, puis les nouveaux dans l’ordre d’apparition
    used = []
    for th in themes:
        if th['roy'] not in used: used.append(th['roy'])
    cfg = {r['nom']: r for r in roy_cfg['ordre']}
    dflt = roy_cfg['defaut']
    roy = []
    for nom in [n for n in order if n in used] + [n for n in used if n not in order]:
        c = cfg.get(nom, {})
        roy.append({'id': 'r' + str(len(roy) + 1), 'nom': nom, 'court': c.get('court', nom),
                    'couleur': c.get('couleur', dflt['couleur']), 'icone': c.get('icone', dflt['icone'])})
    rid = {r['nom']: r['id'] for r in roy}
    for th in themes: th['roy'] = rid[th['roy']]
    if errors:
        print('ERREURS DANS LA BANQUE :'); [print(' -', e) for e in errors]; sys.exit(1)
    return {'v': 1, 'roy': roy, 'th': themes}

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
    b = pack(os.path.join(root, 'quiz'), os.path.join(root, 'src', 'royaumes.json'))
    print(len(b['th']), 'thèmes', sum(len(t['Q']) for t in b['th']), 'questions',
          len(json.dumps(b, ensure_ascii=False, separators=(',', ':'))) // 1024, 'Ko')
