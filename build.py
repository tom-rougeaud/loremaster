# Assemble les pages finales de Lore Master (concaténation simple, pas de f-string : accolades CSS/JS intactes)
# Usage : python3 build.py [SUPABASE_URL SUPABASE_ANON_KEY]   → dossier dist/ (+ build/quiz.json pour les tests)
import io,os,sys,json,base64,re
here=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,os.path.join(here,'tools'))
from pack_quiz import pack
NM=os.environ.get('LM_NODE_MODULES') or os.path.join(here,'node_modules')
if not NM.endswith('/'): NM+='/'
def rd(p): return io.open(os.path.join(here,p),encoding='utf-8').read()
def b64(p): return base64.b64encode(open(p,'rb').read()).decode('ascii')
def A(n): return os.path.join(here,'assets',n)
def safe_js(s): return s.replace('</script','<\\/script').replace('<!--','<\\!--')
VERSION=re.search(r'LM_VERSION="([^"]+)"',rd('src/common.js')).group(1)

# polices : sous-ensemble français en woff2/base64, produit par build_assets.py (OFL, @fontsource)
import build_assets
fonts=build_assets.fonts_css()
theme=rd('src/theme.css').replace('/*@@FONTS@@*/',fonts)

# banque de questions
bank=pack(os.path.join(here,'quiz'),os.path.join(here,'src','royaumes.json'))
quiz=json.dumps(bank,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
os.makedirs(os.path.join(here,'build'),exist_ok=True)
io.open(os.path.join(here,'build','quiz.json'),'w',encoding='utf-8').write(json.dumps(bank,ensure_ascii=False,separators=(',',':')))

supa=safe_js(io.open(NM+'@supabase/supabase-js/dist/umd/supabase.js',encoding='utf-8').read())
qrjs=safe_js(io.open(NM+'qrcode-generator/dist/qrcode.js',encoding='utf-8').read())
fav=('<link rel="icon" type="image/png" sizes="64x64" href="data:image/png;base64,%s">\n'%b64(A('fav64.png'))+
     '<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,%s">\n'%b64(A('fav32.png'))+
     '<link rel="apple-touch-icon" href="data:image/png;base64,%s">'%b64(A('apple180.png')))
MANIFEST='<link rel="manifest" href="manifest.json">'
LOGO='data:image/png;base64,'+b64(A('lm/icon128.png'))     # icône à fond transparent
LOGOFULL='data:image/webp;base64,'+b64(A('lm/banner.webp'))   # logo à fond transparent
common=safe_js(rd('src/common.js').replace('/*@@LOGOURI@@*/',LOGO).replace('/*@@LOGOFULL@@*/',LOGOFULL))
fx=safe_js(rd('src/fx.js'))
look=safe_js(rd('src/look.js'))
bankjs=safe_js(rd('src/bank_quiz.js').replace('"use strict";','').split('if(typeof module!=="undefined")module.exports')[0]+'\n'+rd('src/qview.js'))
progress=safe_js(rd('src/progress.js'))
iconsjs=safe_js(rd('src/icons.js')) if os.path.exists(os.path.join(here,'src','icons.js')) else ''

out=os.path.join(here,'dist'); os.makedirs(out,exist_ok=True)
for fn in os.listdir(out): os.remove(os.path.join(out,fn))
def w(name,txt):
    assert '/*@@' not in txt and '<!--@@' not in txt, name+' : marqueur non remplacé : '+re.search(r'(/\*@@|<!--@@)\w+',txt).group(0)
    io.open(os.path.join(out,name),'w',encoding='utf-8').write(txt)
def base(h): return h.replace('<!--@@FAVICON@@-->',fav).replace('<!--@@MANIFEST@@-->',MANIFEST).replace('/*@@THEMECSS@@*/',theme)
def js(h): return h.replace('/*@@COMMONJS@@*/',common).replace('/*@@LOOKJS@@*/',look)
for pg in ['index.html','contact.html','confidentialite.html']:
    w(pg,js(base(rd('src/'+pg))))
def game(h):
    return (js(base(h)).replace('/*@@FXCSS@@*/',rd('src/fx.css')).replace('/*@@QUIZ@@*/',quiz)
            .replace('/*@@SUPABASE@@*/',supa).replace('/*@@FXJS@@*/',fx).replace('/*@@BANK@@*/',bankjs).replace('/*@@ICONSJS@@*/',iconsjs))
prof=game(rd('src/prof.html')).replace('/*@@PROFCSS@@*/',rd('src/prof.css')).replace('/*@@QRJS@@*/',qrjs)
profjs='\n'.join(safe_js(rd('src/'+n)) for n in ['prof_pick.js','prof_preview.js','prof_room.js','prof_game.js','prof_end.js','prof_players.js','prof_init.js'])
w('mj.html',prof.replace('/*@@PROFJS@@*/',profjs))
el=game(rd('src/eleve.html')).replace('/*@@ELEVECSS@@*/',rd('src/eleve.css')).replace('/*@@PROGRESS@@*/',progress).replace('/*@@ELEVEJS@@*/',safe_js(rd('src/eleve.js')))
w('joueur.html',el)
cfg=rd('src/config.js')
if len(sys.argv)>2:
    cfg='var LORE_CONFIG={SUPABASE_URL:%s,SUPABASE_ANON_KEY:%s};\n'%(json.dumps(sys.argv[1]),json.dumps(sys.argv[2]))
w('config.js',cfg)
w('lore_master.sql',rd('src/lore_master.sql'))
w('manifest.json',rd('src/manifest.json'))
w('sw.js',rd('src/sw.js').replace('@@VERSION@@',VERSION))
for n in ['icon-192.png','icon-512.png','icon-maskable-512.png']:
    open(os.path.join(out,n),'wb').write(open(A(n),'rb').read())
for fn in sorted(os.listdir(out)): print('%-24s %9d'%(fn,os.path.getsize(os.path.join(out,fn))))
