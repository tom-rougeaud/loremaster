import json,sys
for t in sys.argv[1:]:
    d=json.load(open('quiz/%s.json'%t,encoding='utf-8'))
    print('##',t)
    for q in d['questions']:
        if q['type']=='vf' and q['rep']: print(q['id'],q['q'],'|',q['expl'][:110])
