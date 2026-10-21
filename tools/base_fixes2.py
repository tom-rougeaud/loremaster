# -*- coding: utf-8 -*-
"""v1.6 : chasse aux questions trop évidentes dans la base (réponse devinable depuis l’énoncé). Idempotent, appliqué après base_fixes.py."""
import json, os, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DROP = set('''dra-002 dra-005 dra-024 dra-027 dra-033 dra-035 dra-040 dra-048
mor-011 mor-012 mor-027 mor-030 mor-036 mor-037 mor-040 mor-042 mor-045 mor-049 mor-050
dem-031 dem-033 dem-035 dem-036 dem-042 dem-043 dem-044 dem-045 dem-047 dem-051 dem-052 dem-075 dem-076
gea-002 gea-003 gea-009 gea-030 gea-031 gea-032 gea-033 gea-035 gea-036 gea-037 gea-038 gea-039 gea-041 gea-044 gea-051 gea-073
abe-001 abe-021 abe-023 abe-026 abe-028 abe-030 abe-032 abe-033 abe-034 abe-037 abe-038 abe-061 abe-063 abe-065 abe-066 abe-067 abe-068 abe-069 abe-070 abe-074 abe-075 abe-076
fee-004 fee-016 fee-021 fee-031 fee-033 fee-035 fee-036 fee-039 fee-040 fee-042 fee-043 fee-044
gob-007 gob-027 gob-028 gob-029 gob-030 gob-031 gob-033 gob-035 gob-036 gob-038 gob-040 gob-041 gob-043 gob-045 gob-046 gob-047 gob-048 gob-049 gob-052 gob-074 gob-075
don-002 don-009 don-010 don-013 don-020 don-023 don-024 don-026 don-028 don-030 don-032 don-033 don-034 don-037 don-039 don-041 don-042 don-044 don-045 don-047 don-074 don-075
pla-004 pla-005 pla-006 pla-017 pla-020 pla-021 pla-025 pla-030 pla-031 pla-032 pla-034 pla-035 pla-036 pla-037 pla-039 pla-041 pla-043 pla-045 pla-046 pla-048 pla-049 pla-050 pla-051 pla-074 pla-075 pla-076
lyc-009 lyc-031 lyc-032 lyc-035 lyc-036 lyc-037 lyc-038 lyc-039 lyc-041 lyc-042 lyc-044 lyc-045 lyc-046 lyc-048 lyc-050 lyc-051 lyc-074 lyc-075 lyc-076
mar-007 mar-032 mar-039 mar-041 mar-042 mar-043 mar-044 mar-045 mar-046 mar-048 mar-050 mar-051 mar-074
bet-023 bet-025 bet-027 bet-028 bet-029 bet-030 bet-031 bet-032 bet-033 bet-034 bet-035 bet-036 bet-037 bet-038 bet-039 bet-040 bet-041 bet-043 bet-044 bet-046 bet-047 bet-048 bet-074 bet-075 bet-076
gol-001 gol-004 gol-005 gol-006 gol-020 gol-023 gol-028 gol-030 gol-031 gol-032 gol-033 gol-034 gol-035 gol-036 gol-037 gol-038 gol-039 gol-040 gol-041 gol-042 gol-043 gol-046 gol-047 gol-049 gol-051 gol-070 gol-074 gol-075 gol-076'''.split()) | set('dra-017 mor-015 lyc-001 lyc-005 lyc-008 lyc-010 lyc-011 lyc-013 lyc-014 lyc-019 lyc-030 gea-001 gea-004 gea-007 gea-021 gob-012 gob-024 gol-018 don-001 don-004 don-036 pla-016 pla-047 mar-011'.split())
FIX = {
 'dra-087': {'q': 'Qui suis-je ?\n1. Je suis de type dragon, mais je n’ai pas d’ailes.\n2. Je vis dans les profondeurs océaniques et j’adore l’or.\n3. Mon souffle est un cône de vapeur brûlante.'},
 'mor-017': {'q': 'Dans D&D 5e, quelle maladie magique empêche de récupérer des PV et réduit chaque jour le maximum de points de vie ?', 'choix': ['La pourriture de momie', 'La lycanthropie', 'La peste grise', 'La fièvre des marais']},
 'mor-023': {'q': 'Dans D&D 5e, quel ancien paladin déchu, maudit après sa mort, lance des boules de feu infernal ?'},
 'mor-024': {'q': 'Dans D&D 5e, quel mort-vivant de FP 15 renaît tant que son cœur, conservé dans un vase canope, n’est pas détruit ?', 'choix': ['La liche', 'Le seigneur momie', 'Le chevalier de la mort', 'Le vampire']},
 'mor-028': {'q': 'Dans D&D 5e, comment appelle-t-on la victime d’un vampire qui se relève à son service ?', 'choix': ['Une goule vampirique', 'Un seigneur vampire', 'Un rejeton vampirique', 'Un vampire ancien']},
 'mor-087': {'q': 'Qui suis-je ?\n1. Je suis une âme qui a refusé de partir.\n2. Je poursuis un seul but, la vengeance.\n3. Je ne m’arrête que lorsque mon meurtrier est mort.'},
 'dem-006': {'q': 'Dans D&D, quel seigneur démon aux deux têtes rivales, Aameul et Hathradiah, règne sur la Gueule béante ?'},
 'dem-016': {'q': 'Dans D&D 5e, quelle aventure de 2019 entraîne les héros dans la première strate des Neuf Enfers ?'},
 'dem-026': {'q': 'Dans D&D 5e, quel sort de niveau 1 gêne les attaques des fiélons, des fées et des morts-vivants qui visent la créature touchée ?'},
 'dem-027': {'q': 'Dans D&D 5e, quel diable fantassin manie un glaive et frappe aussi de son menton hérissé de pointes ?'},
 'dem-028': {'q': 'Dans D&D 5e, quel diable fait tournoyer autour de lui des fers hérissés de crochets ?'},
 'dem-084': {'q': 'Qui suis-je ?\n1. Je suis minuscule, ailé et cruel.\n2. Je suis un fiélon de bas rang venu des Neuf Enfers.\n3. On me trouve souvent comme familier d’un occultiste.'},
 'mar-003': {'choix': ['Une frénésie meurtrière', 'Une invisibilité temporaire', 'Une téléportation vers sa cité', 'Un dédoublement en deux sahuagins']},
 'mar-008': {'q': 'Dans D&D 5e, quel sort de niveau 3 permet à dix créatures de rester 24 heures sous les flots sans remonter ?'},
 'mar-012': {'q': 'Dans D&D 5e, quel anneau magique donne une vitesse de 12 m (40 pieds) dans l’eau ?', 'choix': ['L’anneau de nage', 'L’anneau de marche sur l’eau', 'L’anneau de résistance', 'L’anneau de feuille morte']},
 'mar-028': {'q': 'Dans D&D 5e, quel géant, au sommet de l’Ordning, vit souvent au fond des mers ?'},
 'mar-075': {'q': 'Dans D&D 5e, le sort ____ aquatique fonctionne 24 heures pour dix créatures au maximum.'},
 'don-012': {'q': 'Dans D&D 5e, quelle vase sombre de FP 4 se divise sous les coups tranchants et ronge aussi le bois ?'},
 'don-084': {'q': 'Qui suis-je ?\n1. Je suis presque invisible.\n2. Je glisse dans les couloirs en avalant tout sur mon passage.\n3. Mon corps forme un bloc parfait de 3 m de côté.'},
 'don-086': {'q': 'Qui suis-je ?\n1. Je suis le monstre le plus redoutable du Manuel des Monstres.\n2. Ma légende vient d’une ville de Provence.\n3. Mon FP est de 30.'},
 'don-087': {'q': 'Qui suis-je ?\n1. Je suis le fruit d’un croisement magique.\n2. J’ai un bec, des plumes et la carrure d’un fauve des forêts.\n3. J’étreins mes victimes avec mes pattes avant.'},
 'gea-027': {'q': 'Dans D&D 5e, quelle capacité permet au géant de pierre de saisir au vol un projectile lancé vers lui ?'},
 'gea-085': {'q': 'Qui suis-je ?\n1. Je suis le plus puissant des six grands géants.\n2. Je règne au sommet de l’Ordning.\n3. Je commande la foudre et je vis parfois sous la mer.'},
 'gob-016': {'q': 'Dans D&D 5e, quelle aventure du coffret d’initiation de 2014 oppose les héros à la tribu Cragmaw ?'},
 'gob-084': {'q': 'Qui suis-je ?\n1. Je suis petit, vert et malin.\n2. Je me déplace avec agilité et je me cache en un clin d’œil.\n3. Je sers souvent des cousins plus grands, à la discipline militaire.'},
 'abe-004': {'q': 'Dans D&D 5e, quelle zone couvre l’explosion mentale du flagelleur mental ?', 'choix': ['Un cône de 18 m', 'Une sphère de 6 m', 'Une ligne de 30 m', 'Un cube de 3 m']},
 'abe-022': {'q': 'Dans D&D 5e, comment s’appelle l’attaque mortelle du flagelleur mental contre une créature qu’il agrippe ?'},
 'abe-086': {'q': 'Qui suis-je ?\n1. Je ressemble à un cerveau qui marche sur quatre pattes.\n2. Je réduis à néant l’esprit de ma proie.\n3. Ensuite, je m’installe dans son crâne et je pilote son corps.'},
 'fee-010': {'q': 'Dans D&D 5e, quelle sous-classe de rôdeur de Tasha ajoute des dégâts psychiques et une présence envoûtante ?'},
 'fee-013': {'q': 'Dans l’aventure de 2021 qui emmène les héros en Féerie, quel lieu sert de point de départ ?'},
 'fee-018': {'choix': ['Partager des sorts plus puissants', 'Voler sans balai', 'Être invisible en permanence', 'Ressusciter les morts']},
 'fee-019': {'q': 'Dans D&D 5e, quel petit reptile aux ailes de papillon souffle un gaz d’euphorie ?'},
 'gol-011': {'q': 'Dans D&D 5e, quelle construction, gardienne fréquente des châteaux, est une coquille de métal vide qui se met à combattre ?'},
 'gol-012': {'q': 'Dans D&D 5e, quel objet animé s’enroule autour de ses victimes jusqu’à les asphyxier ?'},
 'gol-017': {'q': 'Dans D&D 5e, quel sort de niveau 5 donne vie à dix petits bibelots qui combattent pour le lanceur ?'},
 'pla-009': {'q': 'Dans D&D, quel cadre de campagne de 1994 est centré sur la cité de Sigil ?'},
 'pla-013': {'q': 'Dans D&D, quel plan loyal bon est formé de sept terrasses superposées ?'},
 'pla-023': {'q': 'Dans D&D 5e, quelle aventure de 2015 oppose les héros aux cultes de l’Œil élémentaire ancien ?'},
 'lyc-003': {'choix': ['En étant mordu par un lycanthrope', 'En mangeant la chair d’un lycanthrope', 'En regardant un lycanthrope sous la pleine lune', 'En portant la peau d’un lycanthrope']},
}
REWRITE = {'sorts-magie-dnd', 'races-dnd', 'classes-dnd'}   # thèmes entièrement réécrits : la base est écartée
for p in glob.glob(os.path.join(R, 'quiz_base', '*.json')):
    d = json.load(open(p, encoding='utf-8')); n0 = len(d['questions'])
    if d['theme']['id'] in REWRITE: d['questions'] = []
    d['questions'] = [dict(q, **FIX.get(q['id'], {})) for q in d['questions'] if q['id'] not in DROP]
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('corrections v1.6 appliquées')
