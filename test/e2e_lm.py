# Test de bout en bout : un MJ (page mj.html) et des joueurs (joueur.html), Postgres réel + canal temps réel simulé.
# Usage : bash test/start_env.sh puis python3 test/e2e_lm.py [solo|duel|boss ...]
import asyncio,sys,os,random
from playwright.async_api import async_playwright
B='http://127.0.0.1:8770/';OUT=os.environ.get('LM_OUT','/tmp/lm_e2e/');os.makedirs(OUT,exist_ok=True)
MOCK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'mock_rt.js')).read()
errs=[]
def watch(p,n):
    p.on('pageerror',lambda e:errs.append(n+' PAGEERROR '+str(e)))
    p.on('console',lambda m:errs.append(n+' console.error '+m.text[:200]) if m.type=='error' else None)
async def join(ctx,code,name,vw=390):
    s=await ctx.new_page();watch(s,name);await s.set_viewport_size({'width':vw,'height':844})
    await s.add_init_script('try{localStorage.removeItem("lm1_sess");localStorage.removeItem("lm1_pseudo")}catch(e){}')
    await s.goto(B+'joueur.html?c='+code);await s.wait_for_timeout(400)
    await s.fill('#ps-in',name);await s.click('#ps-go');await s.wait_for_timeout(500);return s
async def answer(s,good,q):
    kind=q['kind']
    if kind=='slider':
        ans=q['ans'];tol=q['tol'] or 1
        v=ans if good else ans+8*tol
        await s.evaluate('(function(v){WG.v=Math.max(WG.q.sl.min,Math.min(WG.q.sl.max,v));WG.moved=true;})(%r)'%v)
        await s.click('#w-ok')
    elif kind in ('multi','ordre','assoc'):
        # formats à liste : on remplit l’état du widget (bonne réponse ou réponse fausse) puis on valide
        await s.evaluate('(function(g,want){if(WG.k==="multi")WG.sel=g?want.slice():[0];else if(WG.k==="ordre")WG.seq=g?want.slice():want.slice().reverse();else WG.v=g?want.slice():want.map(function(){return 0;});submitWidget();})(%s,%r)'%('true' if good else 'false',q['want']))
    else:
        n=q['n'];k=q['ans'] if good else (q['ans']+1)%n
        await s.click('#q-ans .ab[data-k="%d"]'%k)
async def play(prof,studs,tag):
    N=await prof.evaluate('G.qs.length');kinds={}
    for qi in range(N):
        await prof.wait_for_timeout(700)
        q=await prof.evaluate('(function(){var q=G.qs[G.i];var k=qKind(q);return {kind:k,ans:k==="slider"?q.sl.ans:q.ans,tol:k==="slider"?q.sl.tol:0,n:q.choices?q.choices.length:0,id:q.qid,want:k==="multi"?q.set:k==="ordre"?q.seq:k==="assoc"?q.map:null}})()')
        kinds[q['kind']]=kinds.get(q['kind'],0)+1
        for k,s in enumerate(studs):
            try: await answer(s,(k*7+qi*3)%10<6,q)
            except Exception as e: errs.append('%s answer q%d %s : %s'%(tag,qi,q['kind'],str(e)[:120]))
        await prof.wait_for_timeout(1800)
        if qi==1: await prof.screenshot(path=OUT+tag+'_rv.png');await studs[0].screenshot(path=OUT+tag+'_s_rv.png')
        await prof.click('#g-next')
    print(tag,'types joués :',kinds)
async def run(mode):
    async with async_playwright() as pw:
        br=await pw.chromium.launch();ctx=await br.new_context();await ctx.add_init_script(MOCK)
        prof=await ctx.new_page();watch(prof,'MJ');await prof.set_viewport_size({'width':1366,'height':860})
        await prof.goto(B+'mj.html');await prof.wait_for_timeout(900)
        await prof.screenshot(path=OUT+mode+'_pick.png')
        ths=await prof.evaluate('BANK.slice(0,3).map(function(t){return t.id})')
        await prof.click('#acc-set summary');await prof.click('#modes .mode[data-m="%s"]'%mode);await prof.click('#seg-nq button[data-v="5"]')
        await prof.evaluate('P.sel=%r;P.read=0;saveSetup();updateSel();renderTree()'%ths)
        await prof.click('#b-gen');await prof.wait_for_timeout(500);await prof.screenshot(path=OUT+mode+'_preview.png',full_page=True)
        await prof.click('#b-open');await prof.wait_for_timeout(1200)
        code=(await prof.text_content('#lb-code')).strip();print(mode,'code',code)
        names=['Ysolde','Gimli','Aragorn','Eowyn','Faramir']
        studs=[await join(ctx,code,n) for n in names]
        await prof.wait_for_timeout(600);await prof.screenshot(path=OUT+mode+'_lobby.png');await studs[0].screenshot(path=OUT+mode+'_s_lobby.png')
        await prof.click('#lb-qrbig');await prof.wait_for_timeout(400);await prof.screenshot(path=OUT+mode+'_qrbig.png');await prof.click('#qf-x')
        if mode=='boss':
            await prof.click('#lb-hostcode');await prof.wait_for_timeout(300);await prof.screenshot(path=OUT+'boss_hostcode.png');await prof.keyboard.press('Escape')
            await prof.click('#bh-one summary');await prof.wait_for_timeout(200);await prof.screenshot(path=OUT+'boss_lobby_help.png')
            await prof.click('#b-curtain');await prof.wait_for_timeout(200);await prof.screenshot(path=OUT+'boss_curtain.png');await prof.click('#curtain')
        boss=None
        if mode=='boss':
            boss=await ctx.new_page();watch(boss,'BOSS');await boss.set_viewport_size({'width':390,'height':844})
            await boss.goto(B+'joueur.html?c='+code[::-1]);await boss.wait_for_timeout(900)
            await boss.fill('#ps-in','Le MJ') if await boss.is_visible('#ps-in') else None
            if await boss.is_visible('#ps-go'): await boss.click('#ps-go')
            await boss.wait_for_timeout(600)
        await prof.click('#lb-start');await prof.wait_for_timeout(500);await prof.click('#ru-go');await prof.wait_for_timeout(3800)
        await prof.screenshot(path=OUT+mode+'_q.png');await studs[1].screenshot(path=OUT+mode+'_s_q.png')
        await play(prof,studs+([boss] if boss else []),mode)
        await prof.wait_for_timeout(6000);await prof.screenshot(path=OUT+mode+'_end.png',full_page=True)
        await studs[0].screenshot(path=OUT+mode+'_s_end.png',full_page=True)
        print(mode,'classement',await prof.evaluate('rankList().map(function(x){return x.p+":"+x.s})'))
        await br.close()
modes=sys.argv[1:] or ['solo','duel','boss']
for m in modes: asyncio.run(run(m))
print('\n'.join(errs[:40]) or 'aucune erreur JS')
