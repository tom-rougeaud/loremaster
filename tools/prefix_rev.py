# -*- coding: utf-8 -*-
"""python3 tools/prefix_rev.py <theme> "<préfixe>" "<regex déjà contextualisé>" -> écrit revision/<theme>.json à partir du quiz courant (q préfixée, reste inchangé)"""
import json,re,sys,os
t,pre,skip=sys.argv[1],sys.argv[2],sys.argv[3]
H=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(H,'..','quiz',t+'.json'),encoding='utf-8'))
LOW=('Quel','Quelle','Quels','Quelles','Qui','Que ','Qu’','Comment','Combien','À ','Selon','En ','Le ','La ','Les ','L’','Un ','Une ','De ','Dans ','Sous ','Où','Pourquoi','Lequel','Laquelle','Parmi','Avec','Pour ','Sur ','Chez','Au ','Aux ','Du ','Des ','Ces ','Ce ','Cette ')
rev={}
for q in d['questions']:
    s=q['q']
    if not re.search(skip,s):
        if s.startswith(LOW): s=s[0].lower()+s[1:]
        s=pre+s
    e=q['expl'] if len(q['expl'])>=10 else q['expl']+' (voir la source)'
    rev[q['id']]={'q':s,'expl':e,'src':q.get('src_detail') or q['src']}
json.dump(rev,open(os.path.join(H,'revision',t+'.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(t,len(rev))
