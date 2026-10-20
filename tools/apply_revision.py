# -*- coding: utf-8 -*-
"""Applique une révision de questions : tools/revision/<theme>.json = {id: {"q":…, "expl":…, "src":…, "choix":[…], "rep":n, "unite":…}}
Chaque question du thème DOIT figurer dans la révision (q, expl et src obligatoires) ; les autres champs sont facultatifs.
Usage : python3 tools/apply_revision.py <theme-id> [--dump]"""
import json,sys,os
HERE=os.path.dirname(os.path.abspath(__file__));Q=os.path.join(HERE,'..','quiz')
def load(t): return json.load(open(os.path.join(Q,t+'.json'),encoding='utf-8'))
def dump(t):
    d=load(t);print(d['theme']['nom'],'|',len(d['questions']),'questions')
    for q in d['questions']:
        if q['type']=='slider': a='SLIDER %s..%s pas %s unité=%s tol=%s rép=%s'%(q['min'],q['max'],q['pas'],q.get('unite'),q.get('tolerance'),q['rep'])
        elif q['type']=='vf': a='VF rép=%s'%q['rep']
        else: a='QCM %s -> %s'%(' / '.join(q['choix']),q['rep'])
        print('%s n%d | %s | %s | %s | %s'%(q['id'],q['niveau'],q['q'],a,q['expl'],q.get('src_detail') or q.get('src')))
def apply(t):
    d=load(t);rev=json.load(open(os.path.join(HERE,'revision',t+'.json'),encoding='utf-8'));ids=[q['id'] for q in d['questions']]
    miss=[i for i in ids if i not in rev];extra=[i for i in rev if i not in ids]
    assert not miss,'questions non révisées : %s'%miss
    assert not extra,'ids inconnus : %s'%extra
    srcs=[]
    for q in d['questions']:
        r=rev[q['id']]
        for k in ('q','expl','src'): assert r.get(k) and len(r[k].strip())>1,(q['id'],k)
        assert len(r['expl'].strip())>=10,'explication trop courte '+q['id']
        q['q']=r['q'];q['expl']=r['expl'];q['src']=r['src'];q.pop('src_detail',None)
        for k in ('choix','rep','unite','min','max','pas','tolerance','niveau'):
            if k in r: q[k]=r[k]
        assert q['niveau'] in (1,2,3),q['id']
        if q['type']=='vf': assert isinstance(q['rep'],bool),q['id']
        if 'choix' in r: assert q['type']=='qcm','type incompatible (choix) '+q['id']
        if 'min' in r: assert q['type']=='slider','type incompatible (curseur) '+q['id']
        if q['type']=='qcm': assert len(q['choix'])==4 and 0<=q['rep']<4 and len(set(q['choix']))==4,q['id']
        if q['type']=='slider': assert q['min']<=q['rep']<=q['max'],q['id']
        if r['src'] not in srcs: srcs.append(r['src'])
    d['sources']=srcs
    json.dump(d,open(os.path.join(Q,t+'.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print(t,'révisé :',len(ids),'questions,',len(srcs),'sources distinctes')
if __name__=='__main__':
    (dump if '--dump' in sys.argv else apply)(sys.argv[1])
