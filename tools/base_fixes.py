# -*- coding: utf-8 -*-
"""Corrections ponctuelles de la base gelée (quiz_base), tracées ici pour transparence. Idempotent."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = {
 'creatures-marines': {
   'mar-004': {'q': 'Dans D&D 5e, quelle créature des côtes peut réduire à 0 PV une créature déjà effrayée d’un simple regard ?', 'choix': ['La guenaude des mers', 'La harpie', 'Le merrow', 'Le sahuagin']}},
 'lycanthropes-metamorphes': {
   'lyc-006': {'q': 'Dans D&D 5e, quel fiélon métamorphe peut prendre l’apparence d’un gobelin ou d’un loup ?', 'expl': 'Le barghest (FP 4) est un fiélon qui se cache parmi les gobelins sous forme de gobelin ou de loup ; il dévore les âmes. Il est décrit dans le Guide de Volo (2016).', 'src': 'Volo’s Guide to Monsters (2016), « Barghest »'},
   'lyc-018': {'q': 'Dans D&D 5e, quel monstre de donjon est, comme les lycanthropes, un métamorphe (shapechanger) ?'},
   'lyc-024': {'q': 'Dans D&D 5e, quel loup de taille Grande, plus massif qu’un loup ordinaire, peut servir de monture ?', 'choix': ['Le loup sanguinaire', 'Le worg', 'Le loup arctique', 'Le loup-garou'], 'expl': 'Le loup sanguinaire (dire wolf, FP 1) est un grand loup de taille Grande, parfois monté par des hobgobelins ou des orques.'},
   'lyc-062': {'rep': 33, 'expl': 'Le rat-garou a 33 PV en moyenne (6d8 + 6) : c’est le plus fragile des lycanthropes du Manuel des Monstres.'},
   'lyc-076': {'q': 'Dans D&D 5e, la capacité du druide qui lui permet de se changer en animal s’appelle ____ sauvage.'},
   'lyc-081': {'items': ['Rat-garou', 'Loup-garou', 'Sanglier-garou', 'Tigre-garou', 'Ours-garou'], 'expl': 'PV moyens : rat-garou 33, loup-garou 58, sanglier-garou 78, tigre-garou 120, ours-garou 135.'}},
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
 'betes-monstruosites': {'bet-081': {'q': 'Classe ces monstres du plus faible au plus redoutable (FP croissant).'}},
 'sorts-magie-dnd': {'sor-001': {'q': 'Dans D&D 5e, quel sort de niveau 3 provoque une explosion de flammes de 6 m (20 pieds) de rayon ?'}},
}
DROP = {'creatures-marines': ['mar-017', 'mar-040', 'mar-055', 'mar-061', 'mar-062', 'mar-063', 'mar-066'], 'lycanthropes-metamorphes': ['lyc-028', 'lyc-029'], 'geants-dnd': ['gea-029'], 'monstres-donjon': ['don-014'], 'races-dnd': ['rac-011']}
import ast
for th in set(FIX) | set(DROP):
    p = os.path.join(R, 'quiz_base', th + '.json'); d = json.load(open(p, encoding='utf-8'))
    d['questions'] = [q for q in d['questions'] if q['id'] not in DROP.get(th, [])]
    for q in d['questions']:
        q.update(FIX.get(th, {}).get(q['id'], {}))
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('corrections appliquées')
