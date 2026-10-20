# Affiche la base d’un thème (énoncé => réponse), pour éviter les doublons en rédigeant : python3 tools/lm_show.py <id> [...]
import json, sys, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for t in sys.argv[1:]:
    p = os.path.join(R, 'quiz', t + '.json')
    if not os.path.exists(p): p = os.path.join(R, 'quiz_base', t + '.json')
    for q in json.load(open(p, encoding='utf-8'))['questions']:
        ty = q['type']
        a = q['choix'][q['rep']] if ty in ('qcm', 'trou', 'intrus', 'qui') else q.get('rep') if ty in ('vf', 'slider') else \
            [q['choix'][i] for i in q['reps']] if ty == 'multi' else q.get('items') or q.get('paires')
        print(q['id'][-3:], q['niveau'], ty[:3], q['q'][:130].replace('Dans D&D 5e, ', '').replace('\n', ' / '), '=>', a)
