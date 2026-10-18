import asyncio,sys
from playwright.async_api import async_playwright
B='http://127.0.0.1:8770/';OUT='/tmp/claude-0/e3/'
import os
MOCK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'mock_rt.js')).read()
errs=[]
def watch(p,n):
    p.on('pageerror',lambda e:errs.append(n+' PAGEERROR '+str(e)))
    p.on('console',lambda m:errs.append(n+' '+m.type+' '+m.text) if m.type in('error',) else None)
IMPORT="""# Test import
Combien font $7 \\\\times 8$ ?
* 56
54
15

Quel est 10 % de 250 € ?
= 25 €

Développer $3(x + 4)$
= 3x + 12

Le produit de deux négatifs est :
* positif
négatif
> Moins par moins donne plus.
@ 20"""
async def students(ctx,code,names):
    out=[]
    for k,ps in enumerate(names):
        s=await ctx.new_page();watch(s,ps);await s.set_viewport_size({'width':390,'height':844})
        await s.add_init_script('try{localStorage.removeItem("fm3_sess")}catch(e){}')
        await s.goto(B+'eleve.html?c='+code);await s.wait_for_timeout(350)
        await s.fill('#ps-in',ps);await s.click('#ps-go');await s.wait_for_timeout(500)
        out.append(s)
    return out
async def play(prof,studs,tag,shorten_at=None):
    N=await prof.evaluate('G.qs.length')
    for qi in range(N):
        await prof.wait_for_timeout(500)
        if shorten_at is not None and qi==shorten_at:
            await prof.click('#g-short');await prof.click('#g-short');return
        q=await prof.evaluate('(function(){var q=G.qs[G.i];return {libre:!!q.libre,ans:q.ans,lit:q.lit||null,num:q.num===undefined?null:q.num,unit:q.unit||"",shown:q.choices[q.ans].t,n:q.choices.length}})()')
        for k,s in enumerate(studs):
            good=(k*7+qi*3)%10<6
            if q['libre']:
                if q['lit']: txt=q['shown'].replace('$','').replace(' ','') if good else '2x'
                else: txt=('%g'%q['num']).replace('.',',') if good else '777'
                for ch in txt:
                    key={'-':'−'}.get(ch,ch)
                    await s.click('#kpad button[data-key="%s"]'%key)
                await s.click('#kpad button.ok')
            elif await s.is_visible('#q-ans .ab[data-k="0"]'):
                await s.click('#q-ans .ab[data-k="%d"]'%(q['ans'] if good else (q['ans']+1)%q['n']))
            else: print('   (pas de QCM visible :',await s.evaluate('S.screen+" "+(document.querySelector("#q-wid:not(.hidden)")?"tuiles":"")'),')')
        await prof.wait_for_timeout(1800)
        if qi<2: await prof.screenshot(path=OUT+tag+'_rv%d.png'%qi)
        if qi==1: await studs[0].screenshot(path=OUT+tag+'_s_rv.png')
        await prof.click('#g-next')
async def main():
    async with async_playwright() as pw:
        br=await pw.chromium.launch();ctx=await br.new_context();await ctx.add_init_script(MOCK)
        prof=await ctx.new_page();watch(prof,'PROF');await prof.set_viewport_size({'width':1366,'height':860})
        await prof.goto(B+'prof.html');await prof.wait_for_timeout(600)
        # import texte
        await prof.click('#b-import');await prof.fill('#imp-ta',IMPORT);await prof.wait_for_timeout(500)
        await prof.click('#imp-niv input[value="cap"]')
        await prof.screenshot(path=OUT+'m_import.png')
        await prof.click('#imp-go');await prof.wait_for_timeout(300)
        sel=await prof.evaluate('P.sel');print('sel apres import',sel)
        # + une notion de cours
        await prof.click('#lvls button[data-l="cap"]');await prof.fill('#q-search','pythagore');await prof.wait_for_timeout(400)
        await prof.click('.it[data-id="cc_pythagore"] input[type=checkbox]')
        await prof.fill('#q-search','');await prof.wait_for_timeout(300)
        await prof.click('#acc-set summary');await prof.click('#modes .mode[data-m="solo"]');await prof.click('#seg-nq button[data-v="10"]');await prof.click('#seg-dur button[data-v="15"]');await prof.click('#seg-fmt button[data-v="mix"]')
        await prof.click('label.sw:has(#o-hide) i')
        await prof.evaluate('P.read=0;saveSetup()');await prof.click('#b-gen');await prof.wait_for_timeout(500)
        await prof.screenshot(path=OUT+'m_preview.png',full_page=True)
        await prof.click('#b-open');await prof.wait_for_timeout(1000)
        code=(await prof.text_content('#lb-code')).strip()
        names=['Ana','Bilal','Chloé','Dylan','Emma','Farès']
        studs=await students(ctx,code,names)
        # pseudo déjà pris
        x=await ctx.new_page();await x.add_init_script('try{localStorage.removeItem("fm3_sess")}catch(e){}');await x.goto(B+'eleve.html?c='+code);await x.wait_for_timeout(300)
        await x.fill('#ps-in','ana');await x.click('#ps-go');await x.wait_for_timeout(600);print('pseudo pris ->',await x.text_content('#ps-err'))
        await x.fill('#ps-in','Ab<>');await x.click('#ps-go');await x.wait_for_timeout(200);print('pseudo invalide ->',await x.text_content('#ps-err'))
        await x.fill('#ps-in','connard');await x.click('#ps-go');await x.wait_for_timeout(200);print('pseudo grossier ->',await x.text_content('#ps-err'))
        await x.screenshot(path=OUT+'m_pseudo_err.png');await x.close()
        await prof.wait_for_timeout(500);await prof.screenshot(path=OUT+'m_lobby_solo.png')
        # exclusion de Farès
        await prof.click('[data-kick]:near(:text("Farès"))') if False else await prof.evaluate('kickPlayer(Object.keys(G.players).filter(function(k){return G.players[k].p==="Farès"})[0])')
        await prof.wait_for_timeout(500);print('Farès voit :',await studs[5].text_content('#code-err'))
        studs=studs[:5]
        await prof.click('#lb-start');await prof.wait_for_timeout(500);await prof.click('#ru-go');await prof.wait_for_timeout(3600)
        await prof.screenshot(path=OUT+'m_q_hidden.png')
        await studs[1].screenshot(path=OUT+'m_s_q.png')
        await play(prof,studs,'solo',shorten_at=6)
        await prof.wait_for_timeout(4200);await prof.screenshot(path=OUT+'m_end_solo.png',full_page=True)
        await studs[0].screenshot(path=OUT+'m_s_end_solo.png',full_page=True)
        print('solo: hist',await prof.evaluate('G.hist.filter(function(h){return h}).length'),'rank',await prof.evaluate('rankList().map(function(x){return x.p+":"+x.s})'))
        # rejouer même salle en mode boss
        await prof.click('#end-again');await prof.wait_for_timeout(400)
        await prof.click('#pv-back');await prof.click('#acc-set summary') if not await prof.is_visible('#modes') else None
        await prof.click('#modes .mode[data-m="boss"]');await prof.click('label.sw:has(#o-hide) i');await prof.click('#seg-nq button[data-v="5"]')
        await prof.evaluate('P.read=0;saveSetup()');await prof.click('#b-gen');await prof.wait_for_timeout(400);await prof.click('#b-open');await prof.wait_for_timeout(800)
        await prof.screenshot(path=OUT+'m_lobby_boss.png');await studs[2].screenshot(path=OUT+'m_s_lobby_boss.png')
        await prof.click('#lb-start');await prof.wait_for_timeout(500);await prof.click('#ru-go');await prof.wait_for_timeout(3600)
        await prof.click('#g-plus');await prof.wait_for_timeout(300)
        await play(prof,studs,'boss')
        await prof.wait_for_timeout(5500);await prof.screenshot(path=OUT+'m_end_boss.png',full_page=True)
        await studs[3].screenshot(path=OUT+'m_s_end_boss.png',full_page=True)
        print('boss',await prof.evaluate('G.boss'))
        # historique
        await prof.click('#b-menu');await prof.click('[data-m="hist"]');await prof.wait_for_timeout(300);await prof.screenshot(path=OUT+'m_hist.png')
        await prof.click('#h-tabs button[data-h="db"]');await prof.wait_for_timeout(800);await prof.screenshot(path=OUT+'m_hist_db.png')
        await br.close()
asyncio.run(main())
print('\n'.join(errs[:30]) or 'aucune erreur JS')
