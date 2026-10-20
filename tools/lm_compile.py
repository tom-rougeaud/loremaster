# -*- coding: utf-8 -*-
"""LORE MASTER — compilateur de contenu (v1.5).
Lit content/registre.tsv, content/royaumes.tsv, la base gelée quiz_base/<id>.json (thèmes historiques)
et les fichiers de rédaction content/NNN/*.lm (triés par nom) ; écrit quiz/<id>.json + quiz/index.json
et content/PROGRESS.md (tableau de suivi). Arrête tout en cas d’erreur ; affiche les avertissements.

Format .lm (une question = une ligne-type, puis « = explication », puis « % sources » (facultatif : reprend la précédente)
  Q2 Énoncé ? | Bonne | Fausse | Fausse | Fausse                 QCM (la bonne en premier : l’ordre est mélangé au jeu)
  V1 Affirmation. | V        (ou | F)                            vrai / faux
  S3 Énoncé ? | réponse | min | max | pas | tolérance | unité      curseur
  H2 Phrase avec ____ . | Bonne | Fausse | Fausse | Fausse        texte à trous
  I2 Lequel… ? | Intrus | Autre | Autre | Autre                   intrus
  W2 [intro facultative] indice ; indice ; indice | Bonne | F | F | F   qui suis-je ?
  M2 Énoncé ? | Bonne ; Bonne (; Bonne) | Fausse ; Fausse (; …)   réponses multiples (4 à 6 propositions)
  O2 Consigne (critère explicite) | premier > deuxième > … > dernier   ordre (3 à 5)
  A2 Consigne | gauche = droite ; gauche = droite ; …            association (3 à 5)
  - id id …                                                      retire des questions de la base
  ~id = explication   /   ~id % source                          remplace l’explication / la source d’une question de la base
  # commentaire
Le chiffre après la lettre = niveau (1 Apprenti, 2 Aventurier, 3 Maître)."""
import io, os, re, sys, json, glob, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, 'content')
TARGET = {'qcm': 56, 'vf': 22, 'slider': 10, 'trou': 12, 'intrus': 11, 'multi': 11, 'ordre': 9, 'assoc': 9, 'qui': 10}
FULL = 150
CLASSIC = ('qcm', 'vf')
VISIBLE_MIN = 60          # un thème n’apparaît dans le jeu qu’à partir de ce nombre de questions
LEGACY = {'terre-du-milieu': (3, 'Terre du Milieu (questions générales)', 'anneau', 0)}   # thèmes historiques hors registre
CRIT = re.compile(r'croissant|décroissant|chronolog|du plus|de la plus|du moins|de la moins|ordre d|dans l’ordre|premier|parution|apparition|taille|du nord|de l’ouest|du haut|du bas|par ordre|ancien|récent|grand|petit|tôt|tard|naissance|date|du début', re.I)
OVR = {}
LETTER = {'Q': 'qcm', 'V': 'vf', 'S': 'slider', 'H': 'trou', 'I': 'intrus', 'W': 'qui', 'M': 'multi', 'O': 'ordre', 'A': 'assoc'}

def tsv(p):
    out = []
    for l in io.open(p, encoding='utf-8'):
        l = l.rstrip('\n')
        if l.strip() and not l.startswith('#'): out.append(l.split('\t'))
    return out

def typo(s):
    s = s.strip().replace("'", '’').replace(' ?', ' ?').replace(' !', ' !').replace(' ;', ' ;')
    s = re.sub(r'\s+([?!;])', ' \\1', s)
    return re.sub(r' {2,}', ' ', s)

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in s if unicodedata.category(c) != 'Mn')).strip()

def parse(path, errs):
    qs, drops, cur, src = [], [], None, None
    for no, raw in enumerate(io.open(path, encoding='utf-8'), 1):
        l = raw.strip()
        where = '%s:%d' % (os.path.relpath(path, ROOT), no)
        if not l or l.startswith('#'): continue
        if l.startswith('- '): drops += l[2:].split(); continue
        mo = re.match(r'~([a-z0-9]+-\d{3})\s*([=%])\s*(.*)$', l)
        if mo: OVR.setdefault(mo.group(1), {})['expl' if mo.group(2) == '=' else 'src'] = typo(mo.group(3)); continue
        if l.startswith('='):
            if not cur: errs.append(where + ' : explication sans question'); continue
            cur['expl'] = typo(l[1:]); continue
        if l.startswith('%'):
            src = typo(l[1:])
            if cur: cur['src'] = src
            continue
        m = re.match(r'([QVSHIWMOA])([123])\s+(.*)$', l)
        if not m: errs.append(where + ' : ligne illisible : ' + l[:60]); continue
        ty, n, body = LETTER[m.group(1)], int(m.group(2)), m.group(3)
        parts = [p.strip() for p in body.split(' | ')]
        q = {'type': ty, 'niveau': n, '_where': where}
        try:
            if ty in ('qcm', 'trou', 'intrus', 'qui'):
                if len(parts) != 5: raise ValueError('il faut 1 énoncé + 4 propositions')
                st = parts[0]
                if ty == 'qui':
                    mi = re.match(r'\[(.*?)\]\s*(.*)$', st)
                    intro, ind = (mi.group(1), mi.group(2)) if mi else ('Qui suis-je ?', st)
                    ind = [typo(x) for x in ind.split(' ; ') if x.strip()]
                    if len(ind) < 3: raise ValueError('qui suis-je : 3 indices minimum')
                    st = typo(intro) + '\n' + '\n'.join('%d. %s' % (k + 1, x) for k, x in enumerate(ind))
                else: st = typo(st)
                q.update(q=st, choix=[typo(x) for x in parts[1:]], rep=0)
            elif ty == 'vf':
                if len(parts) != 2 or parts[1] not in ('V', 'F'): raise ValueError('vrai/faux : « | V » ou « | F »')
                q.update(q=typo(parts[0]), rep=parts[1] == 'V')
            elif ty == 'slider':
                if len(parts) != 7: raise ValueError('curseur : énoncé | réponse | min | max | pas | tolérance | unité')
                num = lambda x: float(x.replace(',', '.')) if '.' in x or ',' in x else int(x)
                q.update(q=typo(parts[0]), rep=num(parts[1]), min=num(parts[2]), max=num(parts[3]), pas=num(parts[4]), tolerance=num(parts[5]), unite=typo(parts[6]))
            elif ty == 'multi':
                if len(parts) != 3: raise ValueError('multi : énoncé | bonnes ; … | fausses ; …')
                b = [typo(x) for x in parts[1].split(' ; ')]; f = [typo(x) for x in parts[2].split(' ; ')]
                q.update(q=typo(parts[0]), choix=b + f, reps=list(range(len(b))))
            elif ty == 'ordre':
                if len(parts) != 2: raise ValueError('ordre : consigne | a > b > c')
                q.update(q=typo(parts[0]), items=[typo(x) for x in parts[1].split(' > ')])
            elif ty == 'assoc':
                if len(parts) != 2: raise ValueError('association : consigne | g = d ; g = d')
                pr = []
                for x in parts[1].split(' ; '):
                    g, d = x.split(' = ')
                    pr.append([typo(g), typo(d)])
                q.update(q=typo(parts[0]), paires=pr)
        except Exception as e:
            errs.append(where + ' : ' + str(e)); continue
        if src: q['src'] = src
        qs.append(q); cur = q
    return qs, drops

def check(theme, qs, errs, warns):
    seen = {}
    for q in qs:
        w = q.get('_where', q.get('id', '?'))
        if len(q.get('expl', '')) < 40: (errs if q.get('_where') else warns).append(w + ' : explication absente ou trop courte')
        if not q.get('src'): errs.append(w + ' : source absente')
        k = norm(q['q'])
        if k in seen: errs.append(w + ' : énoncé en double avec ' + seen[k])
        seen[k] = w
        ty = q['type']
        if ty in ('qcm', 'trou', 'intrus', 'qui', 'multi'):
            ch = q['choix']
            if len({norm(c) for c in ch}) != len(ch): errs.append(w + ' : propositions en double')
            good = [ch[q['rep']]] if ty != 'multi' else [ch[i] for i in q['reps']]
            if ty in ('qcm', 'trou', 'qui'):
                for g in good:
                    ng = norm(g)
                    if len(ng) > 3 and re.search(r'\b' + re.escape(ng) + r'\b', norm(q['q'])): errs.append(w + ' : la bonne réponse apparaît dans l’énoncé (« ' + g + ' »)')
            if ty == 'qcm' and q.get('_where'):
                L = [len(c) for c in ch]; g = L[q['rep']]
                if g > 1.7 * max([x for i, x in enumerate(L) if i != q['rep']] + [1]) and g > 25: warns.append(w + ' : bonne réponse nettement plus longue que les autres (indice involontaire)')
        if ty == 'trou' and '____' not in q['q']: errs.append(w + ' : texte à trous sans « ____ »')
        if ty == 'multi' and not (4 <= len(q['choix']) <= 6 and 2 <= len(q['reps']) < len(q['choix'])): errs.append(w + ' : multi : 4 à 6 propositions, au moins 2 bonnes et 1 fausse')
        if ty == 'ordre':
            if not 3 <= len(q['items']) <= 5: errs.append(w + ' : ordre : 3 à 5 éléments')
            if q.get('_where') and not CRIT.search(q['q']): warns.append(w + ' : ordre : critère de classement peu explicite')
        if ty == 'assoc' and not 3 <= len(q['paires']) <= 5: errs.append(w + ' : association : 3 à 5 paires')
        if ty == 'slider':
            if not (q['min'] <= q['rep'] <= q['max']) or q['max'] <= q['min'] or q['pas'] <= 0: errs.append(w + ' : curseur : bornes incohérentes')
            if q['tolerance'] > (q['max'] - q['min']) / 4: warns.append(w + ' : curseur : tolérance très large')

def stats(qs):
    st = {k: 0 for k in TARGET}
    for q in qs: st[q['type']] += 1
    return st

def main():
    reg = tsv(os.path.join(C, 'registre.tsv')); roys = tsv(os.path.join(C, 'royaumes.tsv'))
    roy_name = {int(r[0]): r[1] for r in roys}
    errs_all, warns_all, rows, index = [], [], [], []
    for r in reg:
        n, tid, pre, rn, ico, dk, nom = int(r[0]), r[1], r[2], int(r[3]), r[4], r[5] == '1', r[6]
        errs, warns = [], []
        base = []
        bp = os.path.join(ROOT, 'quiz_base', tid + '.json')
        if os.path.exists(bp): base = json.load(open(bp, encoding='utf-8'))['questions']
        new, drops = [], []
        for f in sorted(glob.glob(os.path.join(C, '%03d' % n, '*.lm'))):
            a, b = parse(f, errs); new += a; drops += b
        base = [dict(q, **OVR.get(q['id'], {})) for q in base if q['id'] not in drops]
        mx = max([int(q['id'].split('-')[-1]) for q in base] + [70 if base else 0])
        for k, q in enumerate(new): q['id'] = '%s-%03d' % (pre, mx + 1 + k); q['conf'] = 'probable'
        qs = base + new
        check(tid, qs, errs, warns)
        st = stats(qs); tot = len(qs); cl = st['qcm'] + st['vf']
        vft = sum(1 for q in qs if q['type'] == 'vf' and q['rep'])
        lv = [sum(1 for q in qs if q['niveau'] == k) for k in (1, 2, 3)]
        nsrc = len({s.strip() for q in qs for s in re.split(r' ; ', q.get('src', ''))})
        if tot >= FULL:
            if not 0.45 <= cl / tot <= 0.60: errs.append('%s : %d %% de questions classiques (fourchette 45–60 %%)' % (tid, round(100 * cl / tot)))
            if st['vf'] and not 0.4 <= vft / st['vf'] <= 0.6: errs.append('%s : vrai/faux déséquilibrés (%d vrais sur %d)' % (tid, vft, st['vf']))
            for k in ('trou', 'intrus', 'multi', 'ordre', 'assoc'):
                if st[k] < 6: errs.append('%s : seulement %d questions « %s » (6 minimum)' % (tid, st[k], k))
            if min(lv) < 0.15 * tot: warns.append('%s : niveaux déséquilibrés %s' % (tid, lv))
        errs_all += errs; warns_all += warns
        state = 'terminé' if tot >= FULL and not errs else ('en cours' if new else ('base' if base else 'à faire'))
        rows.append((n, tid, nom, rn, tot, st, cl, vft, lv, nsrc, state))
        if tot >= VISIBLE_MIN and not errs:
            out = {'schema': 'quiz-bestiaire/1', 'theme': {'id': tid, 'nom': nom, 'royaume': roy_name[rn], 'icone': ico, 'sombre': dk},
                   'legende': {'niveau': '1 Apprenti, 2 Aventurier, 3 Maître', 'slider': 'bonne réponse si |réponse − rep| ≤ tolerance', 'conf': 'probable = rédigé de mémoire avec sources ; à auditer'},
                   'questions': [{k: v for k, v in q.items() if not k.startswith('_')} for q in qs], 'sources': []}
            json.dump(out, open(os.path.join(ROOT, 'quiz', tid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            index.append({'id': tid, 'nom': nom, 'royaume': roy_name[rn], 'icone': ico, 'sombre': dk, 'fichier': tid + '.json', 'nb': tot, 'num': n,
                          'types': {k: v for k, v in st.items() if v}, 'niveaux': {str(k + 1): lv[k] for k in range(3)}})
    for tid, (rn, nom, ico, dk) in LEGACY.items():
        bp = os.path.join(ROOT, 'quiz_base', tid + '.json')
        if os.path.exists(bp):
            d = json.load(open(bp, encoding='utf-8')); d['theme'].update(nom=nom, royaume=roy_name[rn], icone=ico)
            json.dump(d, open(os.path.join(ROOT, 'quiz', tid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            index.append({'id': tid, 'nom': nom, 'royaume': roy_name[rn], 'icone': ico, 'sombre': bool(dk), 'fichier': tid + '.json', 'nb': len(d['questions']), 'num': 900})
    index.append({'id': 'mix-eclair', 'nom': 'Mix Éclair : le Donjon Ultime', 'royaume': roy_name[10], 'icone': 'des', 'virtuel': True, 'num': 100})
    index.sort(key=lambda t: t['num'])
    json.dump({'schema': 'quiz-bestiaire-index/1', 'themes': index}, open(os.path.join(ROOT, 'quiz', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump({'ordre': [{'nom': r[1], 'court': r[2], 'couleur': r[3], 'icone': r[4]} for r in roys], 'defaut': {'couleur': '#6B6B5A', 'icone': 'des'}},
              open(os.path.join(ROOT, 'src', 'royaumes.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # tableau de suivi
    done = sum(1 for r in rows if r[10] == 'terminé'); totq = sum(r[4] for r in rows)
    L = ['# Lore Master — suivi de la rédaction', '',
         'Généré par `python3 tools/lm_compile.py`. Cible : %d questions par thème, %d–%d %% de classiques (QCM + vrai/faux).' % (FULL, 45, 60), '',
         '**%d / 99 thèmes terminés — %d questions au total.**' % (done, totq), '',
         '| N° | Thème | Q | QCM | V/F (vrais) | Curs. | Trou | Intrus | Multi | Ordre | Assoc | Qui | Classiques | Niv. 1/2/3 | Sources | État |',
         '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|']
    for n, tid, nom, rn, tot, st, cl, vft, lv, nsrc, state in rows:
        L.append('| %d | %s | %d | %d | %d (%d) | %d | %d | %d | %d | %d | %d | %d | %s | %s | %d | %s |' % (
            n, nom, tot, st['qcm'], st['vf'], vft, st['slider'], st['trou'], st['intrus'], st['multi'], st['ordre'], st['assoc'], st['qui'],
            ('%d %%' % round(100 * cl / tot)) if tot else '–', '/'.join(map(str, lv)), nsrc, state))
    if warns_all: L += ['', '## Avertissements', ''] + ['- ' + w for w in warns_all]
    io.open(os.path.join(C, 'PROGRESS.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    for w in warns_all: print('  avertissement :', w)
    if errs_all:
        print('ERREURS :'); [print(' -', e) for e in errs_all]; sys.exit(1)
    print('%d thèmes visibles, %d terminés, %d questions' % (len(index) - 1, done, totq))

if __name__ == '__main__': main()
