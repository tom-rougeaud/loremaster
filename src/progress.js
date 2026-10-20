/* ═══════════════════════════════════════════════════════════════
   POINTS · PALIERS · BADGES — stockés UNIQUEMENT sur l’appareil (localStorage)
   Aucun compte, aucun nom, aucun envoi : export/import JSON pour changer d’appareil.
═══════════════════════════════════════════════════════════════ */

var PALIERS=[
  {n:"Page",xp:0},{n:"Écuyer",xp:150},{n:"Vagabond",xp:400},{n:"Aventurier",xp:800},
  {n:"Éclaireur",xp:1400},{n:"Chevalier",xp:2200},{n:"Ménestrel",xp:3300},{n:"Maître d’armes",xp:4800},
  {n:"Archimage",xp:6800},{n:"Légende du donjon",xp:9500}
];
function today(){var d=new Date(),z=function(n){return (n<10?"0":"")+n;};return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());}
function emptyProg(){return {v:3,podium:0,wins:0,xp:0,games:0,ok:0,na:0,best:0,maxScore:0,perfect:0,expertOk:0,solo:0,days:[],badges:{},themes:{}};}
function loadProg(){
  var p=store.get("prog",null);
  if(!p){try{p=JSON.parse(store.raw("flash_prog")&&null||"null");}catch(x){p=null;}}   /* reprise de la version précédente */
  if(p&&typeof p==="object"){var e=emptyProg();for(var k in e)if(p[k]===undefined)p[k]=e[k];p.v=3;return p;}
  return emptyProg();
}
function saveProg(p){store.set("prog",p);}
function levelOf(xp){
  var i=0;for(var k=0;k<PALIERS.length;k++)if(xp>=PALIERS[k].xp)i=k;
  var cur=PALIERS[i],nx=PALIERS[i+1]||null;
  return {i:i,n:cur.n,xp:xp,from:cur.xp,to:nx?nx.xp:null,next:nx?nx.n:null,pct:nx?Math.round(100*(xp-cur.xp)/(nx.xp-cur.xp)):100};
}
function streakDays(days){   /* jours consécutifs jusqu’à aujourd’hui (ou hier) */
  var set={};days.forEach(function(d){set[d]=1;});
  var n=0,d=new Date();
  if(!set[today()])d.setDate(d.getDate()-1);
  for(;;){var z=function(x){return (x<10?"0":"")+x;},k=d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());if(set[k]){n++;d.setDate(d.getDate()-1);}else break;}
  return n;
}
var BADGES=[
  {id:"first",  n:"Premier pas",       d:"Terminer une première partie",                 t:function(s,p){return p.games>=1;}},
  {id:"s5",     n:"Série de 5",        d:"5 bonnes réponses d’affilée",                  t:function(s,p){return p.best>=5;}},
  {id:"s10",    n:"Série de 10",       d:"10 bonnes réponses d’affilée",                 t:function(s,p){return p.best>=10;}},
  {id:"perfect",n:"Sans faute",        d:"Une partie de 5 questions ou plus sans erreur",t:function(s,p){return s.nq>=5&&s.ok===s.nq;}},
  {id:"fast",   n:"Éclair",            d:"Moins de 5 s en moyenne (5 questions réussies min.)",t:function(s,p){return s.ok>=5&&s.tavg!==null&&s.tavg<=5;}},
  {id:"podium", n:"Sur le podium",     d:"Finir dans le top 3 d’une partie « Chacun sa quête »",t:function(s,p){return s.rank>0&&s.rank<=3&&s.nplayers>=3;}},
  {id:"champ",  n:"Champion·ne",       d:"Finir 1er d’une partie « Chacun sa quête »",   t:function(s,p){return s.rank===1&&s.nplayers>=3;}},
  {id:"wire",   n:"Sur le fil",        d:"Répondre juste dans les 3 dernières secondes", t:function(s,p){return !!s.wire;}},
  {id:"prog3",  n:"Au sommet",         d:"Atteindre le niveau 3 en mode progressif",     t:function(s,p){return !!s.reached3;}},
  {id:"reg3",   n:"Fidèle à la taverne",d:"Jouer 3 jours de suite",                      t:function(s,p){return streakDays(p.days)>=3;}},
  {id:"reg7",   n:"Habitué du donjon", d:"Jouer 7 jours de suite",                       t:function(s,p){return streakDays(p.days)>=7;}},
  {id:"g10",    n:"Vétéran",           d:"Terminer 10 parties",                          t:function(s,p){return p.games>=10;}},
  {id:"c100",   n:"Centurion",         d:"100 bonnes réponses au total",                 t:function(s,p){return p.ok>=100;}},
  {id:"c500",   n:"Machine de guerre", d:"500 bonnes réponses au total",                 t:function(s,p){return p.ok>=500;}},
  {id:"solo5",  n:"Voyageur solitaire",d:"5 entraînements en solo",                      t:function(s,p){return p.solo>=5;}},
  {id:"team",   n:"Esprit de guilde",  d:"Faire gagner sa guilde",                       t:function(s,p){return !!s.teamWin;}},
  {id:"boss",   n:"Terreur du MJ",     d:"Vaincre le MJ avec les autres aventuriers",    t:function(s,p){return !!s.bossWin;}},
  {id:"comeback",n:"Retour de flamme", d:"Gagner 30 points de réussite entre la 1ʳᵉ et la 2ᵉ moitié",t:function(s,p){return !!s.comeback;}},
  {id:"master", n:"Maître du thème",   d:"90 % de réussite sur un thème joué 10 fois",   t:function(s,p){for(var k in p.themes){var a=p.themes[k];if(a[1]>=10&&a[0]/a[1]>=0.9)return true;}return false;}},
  {id:"wide",   n:"Érudit",            d:"Avoir réussi des questions dans 10 thèmes différents",t:function(s,p){var n=0;for(var k in p.themes)if(p.themes[k][0]>0)n++;return n>=10;}},
  {id:"pts",    n:"Butin de légende",  d:"Plus de 6 000 points sur une partie",          t:function(s,p){return s.pts>=6000;}},
  {id:"lvl5",   n:"Chevalier",         d:"Atteindre le palier « Chevalier »",            t:function(s,p){return levelOf(p.xp).i>=5;}},
  {id:"lvl3",   n:"Aventurier confirmé",d:"Atteindre le palier « Aventurier »",           t:function(s,p){return levelOf(p.xp).i>=3;}},
  {id:"lvl7",   n:"Maître d’armes",    d:"Atteindre le palier « Maître d’armes »",       t:function(s,p){return levelOf(p.xp).i>=7;}},
  {id:"lvl9",   n:"Légende vivante",   d:"Atteindre le palier « Légende du donjon »",    t:function(s,p){return levelOf(p.xp).i>=9;}},
  {id:"s15",    n:"Série de 15",       d:"15 bonnes réponses d’affilée",                 t:function(s,p){return p.best>=15;}},
  {id:"s20",    n:"Imbattable",        d:"20 bonnes réponses d’affilée",                 t:function(s,p){return p.best>=20;}},
  {id:"c250",   n:"Chasseur de savoir",d:"250 bonnes réponses au total",                 t:function(s,p){return p.ok>=250;}},
  {id:"c1000",  n:"Mémoire de dragon", d:"1 000 bonnes réponses au total",               t:function(s,p){return p.ok>=1000;}},
  {id:"g25",    n:"Compagnon d’armes", d:"Terminer 25 parties",                          t:function(s,p){return p.games>=25;}},
  {id:"g50",    n:"Vieux briscard",    d:"Terminer 50 parties",                          t:function(s,p){return p.games>=50;}},
  {id:"reg14",  n:"Pilier de la taverne",d:"Jouer 14 jours de suite",                    t:function(s,p){return streakDays(p.days)>=14;}},
  {id:"wins5",  n:"Vainqueur",         d:"Gagner 5 parties (rang 1, guilde ou MJ vaincu)",t:function(s,p){return p.wins>=5;}},
  {id:"wins10", n:"Héros des royaumes",d:"Gagner 10 parties",                            t:function(s,p){return p.wins>=10;}},
  {id:"pod5",   n:"Habitué du podium", d:"5 podiums au total",                           t:function(s,p){return p.podium>=5;}},
  {id:"perf3",  n:"Triple sans-faute", d:"3 parties sans aucune erreur",                 t:function(s,p){return p.perfect>=3;}},
  {id:"solo20", n:"Ermite du donjon",  d:"20 entraînements en solo",                     t:function(s,p){return p.solo>=20;}},
  {id:"exp50",  n:"Cerveau du donjon", d:"50 bonnes réponses à des questions ★★★",       t:function(s,p){return (p.expertOk||0)>=50;}},
  {id:"wide15", n:"Encyclopédiste",    d:"Avoir réussi des questions dans 15 thèmes différents",t:function(s,p){var n=0;for(var k in p.themes)if(p.themes[k][0]>0)n++;return n>=15;}},
  {id:"master3",n:"Triple maître",     d:"90 % de réussite sur 3 thèmes joués 10 fois",  t:function(s,p){var n=0;for(var k in p.themes){var a=p.themes[k];if(a[1]>=10&&a[0]/a[1]>=0.9)n++;}return n>=3;}},
  {id:"pts10",  n:"Trésor du dragon",  d:"Plus de 10 000 points sur une partie",         t:function(s,p){return s.pts>=10000;}}
];
/* s = {pts,ok,na,nq,best,tavg,expert,solo,reached3,teamWin,bossWin,comeback,items:[[id,ok,n]]} */
function awardSession(s){
  var p=loadProg(),before=levelOf(p.xp);
  var xp=s.ok*10+Math.round(s.pts/50)+(s.nq>=5&&s.ok===s.nq?40:0)+(s.expertOk||0)*5+(s.teamWin||s.bossWin||s.rank===1?30:0);
  p.xp+=xp;p.games++;p.ok+=s.ok;p.na+=s.na;p.best=Math.max(p.best,s.best||0);p.maxScore=Math.max(p.maxScore,s.pts);
  if(s.nq>=5&&s.ok===s.nq)p.perfect++;
  p.expertOk+=s.expertOk||0;
  if(s.rank>0&&s.rank<=3)p.podium++;if(s.rank===1||s.teamWin||s.bossWin)p.wins++;
  if(s.solo)p.solo++;
  var t=today();if(p.days.indexOf(t)<0){p.days.push(t);if(p.days.length>90)p.days.shift();}
  /* par thème : [réussites, essais, 6 derniers résultats « 1/0 », jour du dernier essai] */
  (s.items||[]).forEach(function(x){if(!x[0])return;var a=p.themes[x[0]]||(p.themes[x[0]]=[0,0,"",0]);a[0]+=x[1];a[1]+=x[2];a[2]=(String(a[2]||"")+(x[1]?"1":"0")).slice(-6);a[3]=t;});
  var nb=[];
  BADGES.forEach(function(b){if(!p.badges[b.id]&&b.t(s,p)){p.badges[b.id]=Date.now();nb.push(b);}});
  saveProg(p);
  return {xp:xp,before:before,after:levelOf(p.xp),newBadges:nb,prog:p};
}
function progBlockHtml(r){
  var a=r.after,up=a.i>r.before.i;
  var h='<div class="pgb"><div class="pgh"><span class="pgx">+'+fmtInt(r.xp)+' XP</span>'+(up?'<span class="pgup">Nouveau palier : '+esc(a.n)+'</span>':"")+'</div>'+
    '<div class="pgl"><b>'+esc(a.n)+'</b><span>'+(a.next?fmtInt(a.xp)+" / "+fmtInt(a.to)+" XP → "+esc(a.next):fmtInt(a.xp)+" XP · palier maximal")+'</span></div><div class="pgbar"><i style="width:'+a.pct+'%"></i></div>'+(a.next?'<div class="small muted" style="margin-top:.25rem">Palier « '+esc(a.next)+' » à '+fmtInt(a.to)+" XP</div>":"");
  if(r.newBadges.length)h+='<div class="pgn">'+r.newBadges.map(function(b){return '<span class="bdg new" title="'+esc(b.d)+'">★ '+esc(b.n)+"</span>";}).join("")+"</div>";
  return h+"</div>";
}
function ladderHtml(xp){
  var l=levelOf(xp);
  return '<details class="acc" style="margin-top:.7rem"><summary>Échelle des paliers d’XP</summary><div class="acc-b"><ol class="xp-lad">'+PALIERS.map(function(p,i){return '<li class="'+(i<l.i?"ok":i===l.i?"cur":"")+'"><span>'+(i<l.i?"✓ ":i===l.i?"► ":"")+esc(p.n)+"</span><span>"+(i===0?"dès le départ":fmtInt(p.xp)+" XP")+"</span></li>";}).join("")+
    '</ol><p class="small muted">Tu gagnes de l’XP à chaque partie : 10 XP par bonne réponse, 1 XP tous les 50 points marqués, +40 pour un sans-faute, +30 pour une victoire, +5 par bonne réponse ★★★.</p></div></details>';
}
function carnetHtml(){
  var p=loadProg(),l=levelOf(p.xp),n=0;BADGES.forEach(function(b){if(p.badges[b.id])n++;});
  var h='<div class="pgb"><div class="pgl"><b>'+esc(l.n)+'</b><span>'+(l.next?fmtInt(l.xp)+" / "+fmtInt(l.to)+" XP → "+esc(l.next):fmtInt(l.xp)+" XP")+'</span></div><div class="pgbar"><i style="width:'+l.pct+'%"></i></div>'+(l.next?'<div class="small muted" style="margin-top:.25rem">Palier suivant à '+fmtInt(l.to)+" XP : encore "+fmtInt(l.to-l.xp)+" XP.</div>":"")+ladderHtml(p.xp)+
    '<div class="pgs"><span><b>'+p.games+'</b> parties</span><span><b>'+p.ok+'</b> bonnes rép.</span><span><b>'+(p.na?Math.round(100*p.ok/p.na):0)+' %</b> réussite</span><span><b>'+streakDays(p.days)+'</b> j. d’affilée</span></div></div>'+
    '<div class="pgt">Badges ('+n+" / "+BADGES.length+')</div><div class="bgrid">'+
    BADGES.map(function(b){var on=!!p.badges[b.id];return '<div class="bdg2'+(on?" on":"")+'"><b>'+(on?"★ ":"")+esc(b.n)+"</b><small>"+esc(b.d)+"</small></div>";}).join("")+"</div>";
  return weakHtml()+h;
}
/* révision espacée : thèmes « fragiles » (dernier essai raté ou moins de 70 % sur les derniers essais),
   les plus anciennes et les plus ratées d’abord ; un thème réussi 3 fois de suite sort de la liste */
function weakNotions(){
  var p=loadProg(),t=today(),out=[];
  for(var id in p.themes){
    var a=p.themes[id],rec=String(a[2]||""),it=typeof ITEM_BY_ID!=="undefined"?ITEM_BY_ID[id]:null;
    if(!it||!rec.length)continue;
    var ok=rec.split("").filter(function(c){return c==="1";}).length,r=ok/rec.length,last=rec.slice(-1)==="0";
    if(/111$/.test(rec))continue;
    if(last||r<0.7)out.push({id:id,titre:it.titre,r:r,age:(a[3]&&a[3]<t)?1:0,n:a[1]});
  }
  return out.sort(function(x,y){return (x.r-y.r)||(y.age-x.age);});
}
function weakHtml(){
  var w=weakNotions();
  if(!w.length)return '<div class="pgt">À revoir</div><p class="muted small">Aucun thème fragile pour l’instant. Les thèmes ratés en partie ou à l’entraînement apparaîtront ici.</p>';
  return '<div class="pgt">À revoir ('+w.length+')</div><div class="wk">'+w.slice(0,8).map(function(x){return '<div><span>'+esc(x.titre)+"</span><b>"+Math.round(x.r*100)+" %</b></div>";}).join("")+'</div><p class="muted small">Entraîne-toi avec « ★ À revoir » dans le choix du thème.</p>';
}
function exportProg(){
  var txt=JSON.stringify(loadProg()),a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));a.download="lore_master_fiche.json";document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
}
function importProg(file,cb){
  var r=new FileReader();
  r.onload=function(){try{var o=JSON.parse(r.result);if(!o||typeof o.xp!=="number")throw 0;saveProg(o);cb(true);}catch(e){cb(false);}};
  r.readAsText(file);
}
