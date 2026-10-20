# -*- coding: utf-8 -*-
"""Corrections ponctuelles de la base gelée (quiz_base), tracées ici pour transparence. Idempotent."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = {
 'geants-dnd': {
   'gea-048': {'q': 'Dans D&D 5e, l’ogre est une créature de type géant.', 'rep': True, 'expl': 'Vrai : en 5e, l’ogre, le troll et l’ettin sont classés dans le type géant, comme les six grands géants de l’Ordning.'},
   'gea-050': {'q': 'Dans D&D 5e, des dégâts d’acide empêchent un troll de se régénérer au début de son tour suivant.', 'rep': True, 'expl': 'Vrai : le feu ou l’acide bloquent la Régénération du troll pour un tour. Le troll n’a pourtant aucune vulnérabilité aux dégâts dans son profil.'}},
 'morts-vivants-dnd': {
   'mor-008': {'q': 'Dans D&D 5e, sous quelles formes un vampire peut-il se métamorphoser ?', 'choix': ['Chauve-souris ou brume', 'Loup ou corbeau', 'Serpent ou chat', 'Hibou ou rat'], 'rep': 0,
               'expl': 'Le vampire du Manuel des Monstres peut prendre la forme d’une chauve-souris Très petite ou d’un nuage de brume. Il appelle des loups ou des rats à son aide, mais ne s’y transforme pas.'},
   'mor-044': {'q': 'Dans D&D 5e, un vampire peut se transformer en corbeau.', 'expl': 'Faux : en 5e, le vampire se change en chauve-souris ou en brume. Il peut appeler des nuées de chauves-souris ou de rats et des loups, sans prendre leur forme.'},
   'mor-006': {'q': 'Dans D&D 5e, que provoque la lumière du soleil sur un vampire ?'},
   'mor-033': {'q': 'Dans D&D 5e, les zombies sont immunisés contre le poison.'},
   'mor-041': {'q': 'Dans D&D 5e, la banshee peut tuer d’un hurlement.'}},
 'fees-sylvains': {'fee-072': {'q': 'Dans D&D 5e, quelle guenaude n’est pas de type « fée » ?', 'choix': ['Guenaude nocturne', 'Guenaude verte', 'Guenaude des mers', 'Annis'],
     'expl': 'La guenaude nocturne (night hag) est un fiélon venu des plans inférieurs ; les guenaudes verte et des mers, comme l’annis du Guide de Volo, sont des fées.'}},
 'lycanthropes-metamorphes': {'lyc-076': {'q': 'Dans D&D 5e, la capacité du druide qui lui permet de se changer en animal s’appelle ____ sauvage.'}},
 'betes-monstruosites': {'bet-081': {'q': 'Classe ces monstres du plus faible au plus redoutable (FP croissant).'}},
 'sorts-magie-dnd': {'sor-001': {'q': 'Dans D&D 5e, quel sort de niveau 3 provoque une explosion de flammes de 6 m (20 pieds) de rayon ?'}},
}
DROP = {'geants-dnd': ['gea-029'], 'monstres-donjon': ['don-014'], 'races-dnd': ['rac-011']}
for th in set(FIX) | set(DROP):
    p = os.path.join(R, 'quiz_base', th + '.json'); d = json.load(open(p, encoding='utf-8'))
    d['questions'] = [q for q in d['questions'] if q['id'] not in DROP.get(th, [])]
    for q in d['questions']:
        q.update(FIX.get(th, {}).get(q['id'], {}))
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('corrections appliquées')
