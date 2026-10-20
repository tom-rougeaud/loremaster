# Contrôle visuel : contraste du code de salle sur tous les thèmes + captures. Usage : python3 test/visual_lm.py
import asyncio,os,json
from playwright.async_api import async_playwright
B='http://127.0.0.1:8770/';OUT='/tmp/lm_vis/';os.makedirs(OUT,exist_ok=True)
MOCK=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'mock_rt.js')).read()
THEMES=['parchemin','sepia','clair','hiver','azur','aurore','lavande','sombre','foret','crypte','forge','dragon']
JS='''(sels)=>{
 function parse(c){var m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;var p=m[1].split(",").map(parseFloat);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};}
 function lum(c){function f(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);}
 function bgOf(el){var stack=[];while(el){var cs=getComputedStyle(el);var b=parse(cs.backgroundColor);if(b&&b.a>0)stack.push(b);if(b&&b.a>=.99)break;el=el.parentElement;}
  var base={r:255,g:255,b:255,a:1};if(!stack.length||stack[stack.length-1].a<.99)stack.push(base);
  var c=stack.pop();while(stack.length){var t=stack.pop();c={r:t.r*t.a+c.r*(1-t.a),g:t.g*t.a+c.g*(1-t.a),b:t.b*t.a+c.b*(1-t.a),a:1};}return c;}
 var out={};sels.forEach(function(s){var e=document.querySelector(s);if(!e||!e.offsetParent&&getComputedStyle(e).position!=="fixed"){out[s]=null;return;}
  var fg=parse(getComputedStyle(e).color),bg=bgOf(e),L1=lum(fg),L2=lum(bg),hi=Math.max(L1,L2),lo=Math.min(L1,L2);
  var img=getComputedStyle(e).backgroundImage;out[s]=Math.round((hi+.05)/(lo+.05)*10)/10+(img&&img!=="none"?" (dégradé)":"");});
 return out;}'''
async def main():
    res={}
    async with async_playwright() as pw:
        br=await pw.chromium.launch();ctx=await br.new_context();await ctx.add_init_script(MOCK)
        for th in THEMES:
            r={}
            j=await ctx.new_page();await j.set_viewport_size({'width':390,'height':780})
            await j.add_init_script('try{localStorage.setItem("lm1_look",JSON.stringify({theme:"%s",font:"chronique"}))}catch(e){}'%th)
            await j.goto(B+'joueur.html');await j.wait_for_timeout(500)
            await j.keyboard.type('4F2A');await j.wait_for_timeout(200)
            r.update(await j.evaluate(JS,['.slots span','.slots span.f']))
            await j.screenshot(path=OUT+th+'_joueur.png');await j.close()
            m=await ctx.new_page();await m.set_viewport_size({'width':1366,'height':860})
            await m.add_init_script('try{localStorage.setItem("lm1_look",JSON.stringify({theme:"%s",font:"chronique"}))}catch(e){}'%th)
            await m.goto(B+'mj.html');await m.wait_for_timeout(700)
            await m.evaluate('P.sel=BANK.filter(function(t){return !t.dark}).slice(0,2).map(function(t){return t.id});P.nq=5;saveSetup();updateSel();renderTree()')
            await m.click('#b-gen');await m.wait_for_timeout(400);await m.click('#b-open');await m.wait_for_timeout(1000)
            r.update(await m.evaluate(JS,['#lb-code','.jc-code']))
            await m.screenshot(path=OUT+th+'_lobby.png')
            await m.click('#lb-qrbig');await m.wait_for_timeout(300)
            r.update(await m.evaluate(JS,['.qf-code']));await m.click('#qf-x')
            await m.close();res[th]=r
        await br.close()
    for th,r in res.items():print(th.ljust(10),r)
asyncio.run(main())
