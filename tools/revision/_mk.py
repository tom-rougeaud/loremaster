# petit assistant : python3 revision/_mk.py <theme> < fichier "id|q|expl|src" -> revision/<theme>.json
import sys,json,os
t=sys.argv[1];out={};cur=None
for line in sys.stdin.read().split('\n'):
    if not line.strip() or line.startswith('#'): continue
    p=line.split('|')
    if len(p)<4: raise SystemExit('ligne invalide : '+line[:80])
    i=p[0].strip();q=p[1].strip();e=p[2].strip();s='|'.join(p[3:]).strip()
    out[i]={'q':q,'expl':e,'src':s}
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),t+'.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(t,len(out),'lignes')
