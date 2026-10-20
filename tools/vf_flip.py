# -*- coding: utf-8 -*-
"""Rééquilibre vrai/faux : remplace des affirmations vraies par des affirmations fausses (id -> énoncé, explication)."""
import json,os
U="Dans l’univers de Tolkien, ";G="Dans la mythologie grecque, ";D="Dans D&D 5e, "
F={
'terre-du-milieu':{
'tol-033':(U+"Bilbon fête son 99e anniversaire au début du Seigneur des Anneaux.","Faux : Bilbon fête ses 111 ans (le « onze-un »), et Frodon ses 33 ans."),
'tol-035':(U+"Radagast est l’un des trois Istari envoyés en Terre du Milieu.","Faux : il y a cinq Istari, dont Gandalf, Saruman et Radagast."),
'tol-036':(U+"Le Seigneur des Anneaux a été publié avant Le Hobbit.","Faux : Le Hobbit paraît en 1937, le Seigneur des Anneaux en 1954-1955."),
'tol-037':(U+"Gollum s’appelait Déagol avant de trouver l’Anneau.","Faux : il s’appelait Sméagol ; Déagol est son cousin, celui qui trouve l’Anneau."),
'tol-039':(U+"les Hobbits portent toujours de solides bottes de cuir.","Faux : ils vont généralement pieds nus, aux pieds poilus."),
'tol-041':(U+"Sauron est un Istari.","Faux : Sauron est un Maia ; les Istari sont les magiciens envoyés au Troisième Âge."),
'tol-045':(U+"J.R.R. Tolkien a enseigné à l’université de Cambridge.","Faux : il a enseigné à Oxford (et à Leeds avant)."),
'tol-047':(U+"Boromir est le frère d’Éomer.","Faux : Boromir est le frère de Faramir ; Éomer est le frère d’Éowyn."),
'tol-050':(U+"Galadriel porte Vilya, l’Anneau de saphir.","Faux : Galadriel porte Nenya, l’Anneau de diamant ; Vilya est à Elrond."),
},
'mythologie-grecque':{
'gre-032':(G+"Zeus est le fils d’Ouranos.","Faux : Zeus est le fils de Cronos et de Rhéa ; Ouranos est son grand-père."),
'gre-035':(G+"la capture de Cerbère est le premier des douze travaux d’Héraclès.","Faux : c’est le douzième ; le premier est le lion de Némée."),
'gre-037':(G+"Pégase est né du sang de la Chimère.","Faux : Pégase jaillit du cou tranché de Méduse."),
'gre-038':(G+"Ulysse est roi de Sparte.","Faux : Ulysse règne sur Ithaque ; Sparte est la cité de Ménélas."),
'gre-042':(G+"Aphrodite est mariée à Arès.","Faux : elle est l’épouse d’Héphaïstos ; Arès est son amant."),
'gre-044':(G+"Artémis est la sœur jumelle d’Athéna.","Faux : Artémis est la sœur jumelle d’Apollon ; Athéna naît de la tête de Zeus."),
'gre-050':(G+"Dionysos est le fils de Zeus et d’Héra.","Faux : sa mère est la mortelle Sémélé."),
},
'dragons-dnd':{
'dra-034':(D+"Bahamut est surnommé le Dragon d’or.","Faux : Bahamut est le Dragon de platine ; le dragon d’or est un dragon métallique parmi d’autres."),
'dra-039':(D+"le pseudo-dragon n’a aucune résistance à la magie.","Faux : il possède Résistance à la magie, qui donne l’avantage aux jets de sauvegarde contre les sorts."),
'dra-044':(D+"le dragon noir vit dans les déserts.","Faux : le dragon noir vit dans les marais et marécages."),
'dra-051':(D+"le souffle du dragon bleu est un cône de froid.","Faux : le dragon bleu souffle de la foudre en ligne ; le froid est l’affaire du dragon blanc."),
'dra-052':(D+"le souffle du dragon rouge est une ligne d’acide.","Faux : le dragon rouge souffle un cône de feu ; l’acide est la spécialité du dragon noir."),
},
'lycanthropes-metamorphes':{
'lyc-033':(D+"le loup-garou est de FP 8.","Faux : le loup-garou est de FP 3."),
'lyc-041':(D+"le mimique est un mort-vivant.","Faux : le mimique est une monstruosité métamorphe qui imite des objets."),
'lyc-046':(D+"le worg est la monture favorite des elfes.","Faux : le worg est surtout la monture des gobelins et des gobelinoïdes."),
'lyc-050':(D+"les changelins sont des morts-vivants.","Faux : les changelins sont un peuple jouable d’Eberron, capable de changer d’apparence."),
},
'golems-constructions':{
'gol-032':(D+"le golem de fer est vulnérable au feu.","Faux : le golem de fer absorbe le feu, qui le soigne."),
'gol-040':(D+"le tapis étouffeur est un mort-vivant.","Faux : c’est une construction qui étouffe ses victimes."),
'gol-043':(D+"le golem de fer est de FP 10.","Faux : le golem de fer est de FP 16 ; le golem de pierre est de FP 10."),
'gol-070':(D+"le golem de pierre est de FP 14.","Faux : le golem de pierre est de FP 10, avec une CA de 17."),
},
'aberrations-dnd':{
'abe-027':(D+"le tyran de la mort (death tyrant) est un flagelleur mental mort-vivant.","Faux : c’est un tyrannœil mort-vivant."),
'abe-035':(D+"l’umber hulk est incapable de creuser la roche.","Faux : ses mandibules et ses griffes lui permettent de creuser la pierre."),
},
'betes-monstruosites':{
'bet-034':("Dans la mythologie nordique, le cheval d’Odin, Sleipnir, a six pattes.","Faux : Sleipnir a huit pattes."),
'bet-045':(G+"Argos Panoptès a cinquante yeux.","Faux : Argos Panoptès a cent yeux, d’où son nom « qui voit tout »."),
},
'classes-dnd':{'cla-067':(D+"le rôdeur utilise un d6 comme dé de vie.","Faux : le rôdeur a un d10, comme le guerrier et le paladin.")},
'creatures-marines':{'mar-052':(D+"le requin géant a un FP inférieur à celui de la pieuvre géante.","Faux : le requin géant est de FP 5, la pieuvre géante de FP 1.")},
'gobelinoides-humanoides':{
'gob-050':(D+"le gobelin standard porte une hache à deux mains.","Faux : il porte un cimeterre et un arc court."),
'gob-034':(D+"Gruumsh est un dieu aveugle.","Faux : Gruumsh est borgne, il a perdu un œil face à Corellon."),
},
'monstres-donjon':{
'don-034':(D+"la tarasque a un FP de 20.","Faux : la tarasque a un FP de 30, le plus élevé du Manuel des Monstres."),
'don-040':(D+"Dungeon of the Mad Mage est paru en 2015.","Faux : il est paru en 2018."),
},
'races-dnd':{
'rac-049':(D+"les halfelins ont une taille moyenne de 2 m.","Faux : ils mesurent environ 90 cm."),
'rac-038':(D+"les elfes vivent généralement moins de 100 ans.","Faux : un elfe peut atteindre 750 ans."),
},
'sorts-magie-dnd':{'sor-039':(D+"Souhait est un sort de niveau 7.","Faux : Souhait est un sort de niveau 9.")},
}
H=os.path.dirname(os.path.abspath(__file__));n=0
for t,m in F.items():
    p=os.path.join(H,'..','quiz',t+'.json');d=json.load(open(p,encoding='utf-8'))
    for q in d['questions']:
        if q['id'] in m:
            assert q['type']=='vf' and q['rep'] is True,(q['id'],'déjà faux ?')
            q['q'],q['expl']=m[q['id']];q['rep']=False;n+=1
    json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(n,'affirmations inversées')
