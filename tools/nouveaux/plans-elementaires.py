# -*- coding: utf-8 -*-
from _lib import *
MM='Manuel des Monstres 5e (2014)'
DMG='Dungeon Master’s Guide 5e (2014), chapitre « Les plans »'
I(1,'Dans D&D, lequel de ces plans n’est pas un plan élémentaire ?','Plan Éthéré',['Plan de l’Air','Plan du Feu','Plan de l’Eau'],'Le Plan Éthéré est un plan de transition. Air, feu, eau et terre sont les quatre plans élémentaires.',DMG)
I(2,'Dans D&D 5e, lequel de ces êtres n’est pas un génie ?','Mephit',['Éfrit','Djinn','Marid'],'Les mephits sont de petits élémentaires. Éfrit, djinn et marid sont des génies.',MM+', entrées correspondantes')
I(3,'Lequel de ces personnages n’est pas un prince élémentaire du mal ?','Asmodeus',['Imix','Ogremoch','Olhydra'],'Asmodeus règne sur les Neuf Enfers. Imix, Ogremoch et Olhydra sont des princes élémentaires.','Princes of the Apocalypse (2015) et Manuel des Monstres 5e')
T(1,'Dans D&D, le plan où vivent les mortels est le Plan ____.','Matériel',['Astral','Éthéré','Élémentaire'],'Le Plan Matériel est le monde des mortels, point de départ de tous les voyages planaires.',DMG)
T(2,'Dans Planescape, la ville de Sigil est dirigée par la Dame de la ____.','Douleur',['Nuit','Mort','Lune'],'La Dame de la Douleur règne sur Sigil, la Cité des Portes, sans jamais parler.','Planescape (1994) et Dungeon Master’s Guide 5e')
T(3,'Dans D&D, les githyanki chevauchent des dragons ____.','rouges',['bleus','d’argent','noirs'],'Les githyanki montent des dragons rouges au service de la reine liche Vlaakith.',MM+', entrée « Githyanki »')
M(2,'Dans D&D 5e, lesquels de ces êtres sont des génies ? (plusieurs bonnes réponses)',['Djinn','Éfrit','Marid'],['Mephit','Xorn'],'Djinn, éfrit et marid sont des génies. Le mephit et le xorn sont des créatures élémentaires.',MM+', entrées correspondantes')
M(1,'Dans D&D, lesquels de ces plans sont des plans élémentaires ? (plusieurs bonnes réponses)',['Plan de l’Air','Plan du Feu','Plan de l’Eau'],['Plan Astral','Féerie'],'Air, feu, eau et terre sont les quatre plans élémentaires ; Plan Astral et Féerie sont d’autres plans.',DMG)
M(3,'Dans D&D 5e, lesquels de ces êtres sont des anges ? (plusieurs bonnes réponses)',['Deva','Planétaire','Solar'],['Couatl','Pégase'],'Deva, planétaire et solar sont les trois anges du Manuel des Monstres. Couatl et pégase sont d’autres célestes.',MM+', entrée « Ange »')
O(3,'Classe ces êtres par FP croissant.',['Élémentaire d’air','Deva','Djinn','Planétaire','Solar'],'FP : élémentaire d’air 5, deva 10, djinn 11, planétaire 16, solar 21.',MM+', blocs de caractéristiques')
O(3,'Classe ces élémentaires par points de vie moyens croissants.',['Élémentaire d’air','Élémentaire de feu','Élémentaire d’eau','Élémentaire de terre'],'PV moyens : air 90, feu 102, eau 114, terre 126.',MM+', blocs de caractéristiques')
A(1,'Associe chaque génie à son élément.',[('Éfrit','Feu'),('Djinn','Air'),('Dao','Terre'),('Marid','Eau')],'Éfrit : feu ; djinn : air ; dao : terre ; marid : eau.',MM+', entrées correspondantes')
A(3,'Associe chaque prince élémentaire à son élément.',[('Imix','Feu'),('Ogremoch','Terre'),('Olhydra','Eau'),('Yan-C-Bin','Air')],'Imix (feu), Ogremoch (terre), Olhydra (eau) et Yan-C-Bin (air) sont les quatre princes du mal élémentaire.','Princes of the Apocalypse (2015)')
W(2,['Je suis un guerrier du Plan Astral.','Je chevauche des dragons rouges.','Mon peuple est en guerre contre les flagelleurs mentaux et les githzerai.'],'Githyanki',['Githzerai','Drow','Yuan-ti'],'Les githyanki sont des pillards astraux, ennemis jurés des flagelleurs mentaux.',MM+', entrée « Githyanki »')
W(3,['Je suis un être mystérieux, vêtu de lames.','Je règne sur la Cité des Portes.','Personne n’ose me défier : j’envoie les imprudents dans un labyrinthe.'],'Dame de la Douleur',['Asmodeus','Vecna','Tiamat'],'La Dame de la Douleur gouverne Sigil et punit ses opposants en les exilant dans des labyrinthes.','Planescape (1994) et Dungeon Master’s Guide 5e')
W(2,['Je suis un génie lié à l’élément de l’air.','Je peux me transformer en tourbillon.','Je vis dans des palais de nuages.'],'Djinn',['Éfrit','Marid','Dao'],'Le djinn est un génie de l’air, capable de se muer en tornade.',MM+', entrée « Djinn »')
save('plans-elementaires','pla')
