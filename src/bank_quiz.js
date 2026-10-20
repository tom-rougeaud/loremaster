/* ═══════════════════════════════════════════════════════════════
   LORE MASTER — banque de questions
   Les questions viennent du bloc JSON « lm-quiz » de la page (voir tools/pack_quiz.py).
   Une « notion » du moteur (BANK) est ici un THÈME ; les thèmes sont rangés par ROYAUME (NIVEAUX).
   Format compact d’une question : i id · n niveau 1-3 · t c|v|s · q énoncé · x explication · s n° de source
     c : c[] propositions, r index juste ·  v : r = 1 (vrai) ou 0 (faux)
     s : r valeur, mn/mx bornes, p pas, u unité, tl tolérance
     i : intrus (c 4 propositions, r index de l’intrus) · h : texte à trous (« ____ » dans l’énoncé, c, r)
     w : « Qui suis-je ? » (indices dans l’énoncé, c 4 noms, r) · m : réponses multiples (c 5-6, r = liste d’index justes)
     o : remettre dans l’ordre (c = éléments dans le bon ordre) · a : association (c = termes de gauche, d = termes de droite correspondants)
═══════════════════════════════════════════════════════════════ */
"use strict";

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rnd(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,arr){return arr[Math.floor(r()*arr.length)];}
function shuffle(r,arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function rd(x,d){var m=Math.pow(10,d);return Math.round(x*m+(x>=0?1e-7:-1e-7))/m;}
function decOf(x){var s=String(rd(x,6));var i=s.indexOf(".");return i<0?0:s.length-i-1;}
/* nombre au format français : virgule, espace pour les milliers, vrai signe moins */
function f(x,d){
  if(d===undefined)d=2;
  var v=rd(x,d);if(v===0)v=0;
  var s=Math.abs(v).toFixed(d);
  if(s.indexOf(".")>=0)s=s.replace(/0+$/,"").replace(/\.$/,"");
  var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");
  s=p[1]?i+","+p[1]:i;
  return (v<0?"−":"")+s;
}

/* compatibilité avec le code de jeu hérité : pas de diagnostic d’erreurs types, pas de figures */
var HIDDEN={},TIMES={},METIERS={},ERR={};
function figHtml(){return "";}
function toSlider(){return null;}
function isFree(){return false;}

/* ─── royaumes (= anciens « niveaux ») ─── */
var NIVEAUX=[],ROY_BY_ID={},BANK=[],ITEM_BY_ID={},QBY_ID={},QUIZ_META={sources:0,total:0};
/* banque chargée à la demande (v1.5) : la page n’embarque que la liste des thèmes ; les questions d’un thème
   arrivent par q/<id>.json au moment où on le coche (puis restent en cache hors ligne). Les tests Node lisent la banque complète. */
function attachTheme(it,t){
  var sum=0;t.Q.forEach(function(q){sum+=q.n;q.th=it.id;q.src=t.S[q.s]||"";QBY_ID[q.i]=q;});
  it.Q=t.Q;it.nvar=t.Q.length;it.d=Math.max(1,Math.min(3,Math.round(sum/Math.max(1,t.Q.length))));
}
function loadQuiz(obj){
  if(!obj||!obj.th)return;
  NIVEAUX.length=0;BANK.length=0;ROY_BY_ID={};ITEM_BY_ID={};QBY_ID={};QUIZ_META.total=0;
  obj.roy.forEach(function(r){var o={id:r.id,court:r.court,label:r.nom,nom:r.nom,color:r.couleur,icone:r.icone};NIVEAUX.push(o);ROY_BY_ID[r.id]=o;});
  obj.th.forEach(function(t){
    var it={id:t.id,titre:t.nom,chap:ROY_BY_ID[t.roy]?ROY_BY_ID[t.roy].nom:"",niv:[t.roy],roy:t.roy,ico:t.ico,dark:!!t.dk,
            d:t.d||2,tags:[],nvar:t.nb||0,Q:null,gen:function(r,ctx){return drawOne(it,r,ctx);}};
    if(t.Q)attachTheme(it,t);
    BANK.push(it);ITEM_BY_ID[it.id]=it;QUIZ_META.total+=it.nvar;
  });
}
var QUIZ_DIR="q/",THEME_LOADING={};
function themeLoaded(id){var it=ITEM_BY_ID[id];return !!(it&&it.Q);}
function fetchTheme(id){
  if(THEME_LOADING[id])return THEME_LOADING[id];
  var v=typeof LM_VERSION!=="undefined"?LM_VERSION:"";
  THEME_LOADING[id]=fetch(QUIZ_DIR+id+".json?v="+encodeURIComponent(v)).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
    .then(function(t){var it=ITEM_BY_ID[id];if(it&&!it.Q)attachTheme(it,t);})
    .catch(function(e){delete THEME_LOADING[id];throw e;});
  return THEME_LOADING[id];
}
/* charge les thèmes demandés puis appelle cb(erreur ou null) ; synchrone si tout est déjà là */
function ensureThemes(ids,cb){
  var need=(ids||[]).filter(function(id){return ITEM_BY_ID[id]&&!ITEM_BY_ID[id].Q;});
  if(!need.length){cb(null);return;}
  if(typeof fetch==="undefined"){cb(new Error("chargement impossible"));return;}
  Promise.all(need.map(fetchTheme)).then(function(){cb(null);},function(e){cb(e||new Error("chargement impossible"));});
}
(function(){
  try{
    if(typeof document!=="undefined"){var el=document.getElementById("lm-quiz");if(el)loadQuiz(JSON.parse(el.textContent));}
    else if(typeof require!=="undefined"){loadQuiz(JSON.parse(require("fs").readFileSync(require("path").join(__dirname,"..","build","quiz.json"),"utf8")));}
  }catch(e){if(typeof console!=="undefined")console.error("Banque de questions illisible",e);}
})();
function indexBank(){}

/* ─── filtres de partie : types de questions, difficultés, contenus sombres ─── */
var ALL_TYPES={c:1,v:1,s:1,i:1,h:1,w:1,m:1,o:1,a:1,p:1};
/* « p » (pari) n’est pas un format de plus : c’est une mise que l’on peut poser sur un QCM ou un vrai/faux */
function isPari(q,ctx){return !!(ctx&&ctx.types&&ctx.types.p&&(q.t==="c"||q.t==="v"));}
function ctxOk(q,ctx){
  if(!ctx)return true;
  if(ctx.types&&!ctx.types[q.t]&&!isPari(q,ctx))return false;
  if(ctx.diffs&&ctx.diffs.length&&ctx.diffs.indexOf(q.n)<0)return false;
  return true;
}
function themeOk(it,ctx){return !it.dark||(ctx&&ctx.dark);}
function poolOf(it,ctx){return (it.Q||[]).filter(function(q){return ctxOk(q,ctx);});}

/* ─── une question compacte → objet de jeu ─── */
function buildQ(raw,it,r,pari){
  var q={q:raw.q,expl:raw.x||"",qid:raw.i,src:raw.src||"",id:it.id,d:raw.n,titre:it.titre,chap:it.chap};
  r=r||Math.random;
  if(raw.t==="v"){
    q.choices=[{t:"Vrai",err:null},{t:"Faux",err:null}];q.ans=raw.r?0:1;q.vf=true;
  }else if(raw.t==="s"){
    var dec=Math.max(decOf(raw.p),decOf(raw.mn),decOf(raw.mx),decOf(raw.r));
    q.kind="slider";q.choices=[];q.ans=0;
    q.sl={min:raw.mn,max:raw.mx,step:raw.p,ans:raw.r,tol:raw.tl||0,u:raw.u||"",d:dec};
  }else if(raw.t==="m"){
    var om=shuffle(r,raw.c.map(function(_,k){return k;}));
    q.kind="multi";q.choices=om.map(function(k){return {t:raw.c[k],err:null};});q.ans=0;
    q.set=raw.r.map(function(k){return om.indexOf(k);}).sort(function(a,b){return a-b;});
  }else if(raw.t==="o"){
    var n=raw.c.length,oo=shuffle(r,raw.c.map(function(_,k){return k;})),tries=0;
    while(oo.every(function(v,k){return v===k;})&&tries++<9)oo=shuffle(r,oo);
    q.kind="ordre";q.choices=oo.map(function(k){return {t:raw.c[k],err:null};});q.ans=0;
    q.seq=raw.c.map(function(_,j){return oo.indexOf(j);});   /* seq[j] = indice affiché de l’élément qui doit arriver en position j */
  }else if(raw.t==="a"){
    var oa=shuffle(r,raw.d.map(function(_,k){return k;})),ta=0;
    while(oa.every(function(v,k){return v===k;})&&ta++<9)oa=shuffle(r,oa);
    q.kind="assoc";q.left=raw.c.slice();q.choices=oa.map(function(k){return {t:raw.d[k],err:null};});q.ans=0;
    q.map=raw.c.map(function(_,i){return oa.indexOf(i);});   /* map[i] = indice affiché de la bonne réponse pour le terme de gauche i */
  }else{
    var order=shuffle(r,[0,1,2,3].slice(0,raw.c.length));
    q.choices=order.map(function(k){return {t:raw.c[k],err:null};});
    q.ans=order.indexOf(raw.r);
    if(raw.t==="i")q.kind="intrus";else if(raw.t==="h")q.kind="trou";else if(raw.t==="w")q.kind="qui";
  }
  if(pari&&(raw.t==="c"||raw.t==="v"))q.pari=true;
  return q;
}
function drawOne(it,r,ctx){
  var pool=poolOf(it,ctx);if(!pool.length)pool=it.Q||[];
  if(!pool.length)return null;
  var raw=pick(r,pool);
  return buildQ(raw,it,r,isPari(raw,ctx)&&(!ctx.types[raw.t]||r()<0.2));
}
function makeQuestion(itemId,seed,ctx){
  var it=ITEM_BY_ID[itemId];if(!it)return null;
  return drawOne(it,mulberry32(seed>>>0),ctx);
}
function questionById(qid,seed){
  var raw=QBY_ID[qid];if(!raw)return null;
  return buildQ(raw,ITEM_BY_ID[raw.th],mulberry32((seed||1)>>>0));
}
function validQ(q){
  if(q.kind==="multi")return q.choices.length>=4&&q.set&&q.set.length>=2&&q.set.length<q.choices.length;
  if(q.kind==="ordre")return q.choices.length>=3&&q.seq&&q.seq.length===q.choices.length;
  if(q.kind==="assoc")return q.left&&q.left.length===q.choices.length&&q.choices.length>=3&&q.map&&q.map.every(function(x){return x>=0;});
  if(q.kind==="slider")return q.sl&&q.sl.max>q.sl.min&&q.sl.ans>=q.sl.min&&q.sl.ans<=q.sl.max;
  return q.choices&&q.choices.length>=2&&q.choices.length<=4&&q.ans>=0&&q.ans<q.choices.length;
}
function qShape(){return "";}
/* historique : {t:{id de question:rang}, s:{}, i:{thème:rang}} (rang élevé = joué récemment) */
function normHist(h){
  h=h||{};
  if(h.t||h.s||h.i)return {t:h.t||{},s:h.s||{},i:h.i||{},n:h.n||1};
  return {t:h,s:{},i:{},n:1};
}
function histKey(q){return q.qid||q.q;}
/* n questions tirées dans les thèmes cochés :
   1. jamais (ou le moins récemment) jouées d’abord → on ne répète une question que si tout le reste a été joué ;
   2. réparties équitablement entre les thèmes ;
   3. pas plus de deux questions du même type d’affilée quand c’est évitable ;
   4. part des questions « classiques » (QCM + vrai/faux) entre 45 % et 60 % de la salve, quand les types cochés le permettent. */
var NEW_T={i:1,h:1,w:1,m:1,o:1,a:1},CLASSIC_T={c:1,v:1},CLASSIC_MIN=0.45,CLASSIC_MAX=0.60;
function drawQuestions(itemIds,n,ctx,seed,avoid){
  var H=normHist(avoid),r=mulberry32(seed>>>0),out=[],used={},cnt={};
  var lists=[];
  itemIds.forEach(function(id){
    var it=ITEM_BY_ID[id];if(!it||!themeOk(it,ctx))return;
    var pool=poolOf(it,ctx);if(!pool.length)return;
    var arr=pool.map(function(q){return {q:q,rank:H.t[q.i]||0,j:r()};});
    arr.sort(function(a,b){return a.rank-b.rank||a.j-b.j;});
    /* une file par type de question dans chaque thème */
    var by={};arr.forEach(function(x){(by[x.q.t]=by[x.q.t]||[]).push(x);});
    var qs=Object.keys(by).sort().map(function(t){return by[t];});
    lists.push({it:it,qs:qs,pos:qs.map(function(){return 0;})});cnt[it.id]=0;
  });
  var lastT=[],nCl=0,hiCl=Math.ceil(CLASSIC_MAX*n),loCl=Math.ceil(CLASSIC_MIN*n);
  while(out.length<n){
    var best=null,bestS=1e9,k=out.length;
    lists.forEach(function(L){
      for(var f=0;f<L.qs.length;f++){
        var A=L.qs[f];
        while(L.pos[f]<A.length&&used[A[L.pos[f]].q.i])L.pos[f]++;
        if(L.pos[f]>=A.length)continue;
        var c=A[L.pos[f]],sc=(c.rank?100000+c.rank:0)+cnt[L.it.id]*1000+r()*500;
        var isCl=!!CLASSIC_T[c.q.t];
        if(isCl&&nCl+1>hiCl)sc+=50000;                        /* trop de classiques */
        if(!isCl&&(k+1-nCl)>n-loCl)sc+=50000;                 /* pas assez de classiques */
        if(lastT.length>=2&&lastT[lastT.length-1]===c.q.t&&lastT[lastT.length-2]===c.q.t)sc+=20000;
        if(sc<bestS){bestS=sc;best={L:L,c:c,cl:isCl};}
      }
    });
    if(!best)break;
    var raw=best.c.q;used[raw.i]=1;cnt[best.L.it.id]++;lastT.push(raw.t);if(best.cl)nCl++;
    out.push(buildQ(raw,best.L.it,r,isPari(raw,ctx)&&(!ctx.types[raw.t]||r()<0.2)));
  }
  /* pas assez de questions au niveau demandé : on complète avec les niveaux voisins */
  if(out.length<n&&ctx&&ctx.diffs&&ctx.diffs.length&&ctx.diffs.length<3){
    var wide=ctx.diffs.slice();
    ctx.diffs.forEach(function(d){[d-1,d+1].forEach(function(e){if(e>=1&&e<=3&&wide.indexOf(e)<0)wide.push(e);});});
    var c2={types:ctx.types,dark:ctx.dark,diffs:wide.length>=3?null:wide};
    out=out.concat(drawQuestions(itemIds,n*2,c2,(seed>>>0)+7,avoid).filter(function(q){return !used[q.qid];}).slice(0,n-out.length));
  }
  return out;
}
/* nombre de questions encore jamais jouées dans une sélection (pour informer le MJ) */
function freshCount(itemIds,ctx,avoid){
  var H=normHist(avoid),n=0,tot=0;
  itemIds.forEach(function(id){var it=ITEM_BY_ID[id];if(!it||!themeOk(it,ctx))return;poolOf(it,ctx).forEach(function(q){tot++;if(!H.t[q.i])n++;});});
  return {fresh:n,total:tot};
}
/* durée : réglage global > automatique (difficulté et longueur de l’énoncé) */
function dureeQuestion(q,mode){
  if(q.dur>0)return q.dur;
  if(mode&&mode>0)return mode;
  var base=q.d===1?15:q.d===3?25:20,L=String(q.q||"").length+(q.choices||[]).concat((q.left||[]).map(function(t){return {t:t};})).reduce(function(s,c){return s+String(c.t).length;},0);
  if(L>170)base+=5;
  if(q.kind==="slider")base+=5;
  else if(q.kind==="multi")base+=8;
  else if(q.kind==="ordre")base+=12;
  else if(q.kind==="assoc")base+=15;
  else if(q.kind==="qui")base+=8;
  else if(q.kind==="trou")base+=3;
  if(q.pari)base+=3;
  return base;
}

/* ─── arborescence royaume › thèmes (même forme que l’ancien niveau › chapitre › notions) ─── */
function buildTree(ctx){
  var tree=[];
  NIVEAUX.forEach(function(nv){
    var items=BANK.filter(function(it){return it.roy===nv.id&&!HIDDEN[it.id]&&(!ctx||themeOk(it,ctx));});
    tree.push({niv:nv,chaps:items.length?[{nom:nv.nom,items:items,subs:[{nom:nv.nom,items:items}]}]:[]});
  });
  return tree;
}

/* ═══ FORMATS : nature, réponse officielle, données envoyées aux joueurs, correction ═══
   Familles : choix unique (qcm, vf, intrus, trou, qui), curseur, réponses multiples, ordre, association.
   La réponse d’un joueur est a = {k, v, bet} : k = choix unique ; v = nombre (curseur) ou liste d’index (multi, ordre, assoc). */
function qKind(q){if(!q)return "qcm";if(q.kind)return q.kind;return q.vf?"vf":"qcm";}
function isPick(k){return k==="qcm"||k==="vf"||k==="intrus"||k==="trou"||k==="qui";}
function isList(k){return k==="multi"||k==="ordre"||k==="assoc";}
var KIND_TAG={vf:["Vrai ou faux ?","t-sun"],slider:["Estime avec le curseur","t-sun"],intrus:["Trouve l’intrus","t-rose"],trou:["Texte à trous","t-mint"],qui:["Qui suis-je ?","t-grape"],
  multi:["Plusieurs bonnes réponses","t-rose"],ordre:["Remets dans l’ordre","t-mint"],assoc:["Associe","t-grape"]};
function kindTagHtml(q){var t=KIND_TAG[qKind(q)];return (t?'<span class="tag '+t[1]+'">'+t[0]+"</span>":"")+(q.pari||q.pr?'<span class="tag t-sun">Pari</span>':"");}
function sliderText(sl,v){return f(v,sl.d)+(sl.u?" "+sl.u:"");}
function letterOf(k){return "ABCDEF".charAt(k)||String(k+1);}
function answerText(q){
  var k=qKind(q);
  if(k==="slider")return "≈ "+f(q.sl.ans,Math.max(q.sl.d,Math.min(3,decOf(q.sl.ans))))+(q.sl.u?" "+q.sl.u:"");
  if(k==="multi")return q.set.map(function(i){return q.choices[i].t;}).join(" · ");
  if(k==="ordre")return q.seq.map(function(d,j){return (j+1)+". "+q.choices[d].t;}).join("\n");
  if(k==="assoc")return q.left.map(function(l,i){return l+"  =  "+q.choices[q.map[i]].t;}).join("\n");
  return q.choices&&q.choices[q.ans]?q.choices[q.ans].t:"";
}
/* données transmises aux joueurs (jamais la réponse) */
function qPublic(q){
  var k=qKind(q),o={q:q.q,kd:k};
  if(q.id&&ITEM_BY_ID[q.id])o.id=q.id;
  if(q.d)o.n=q.d;
  if(q.pari)o.pr=1;
  if(k==="slider")o.sl={min:q.sl.min,max:q.sl.max,step:q.sl.step,u:q.sl.u,d:q.sl.d};
  else{o.ch=q.choices.map(function(c){return c.t;});if(q.vf)o.vf=1;if(k==="assoc")o.lf=q.left.slice();}
  return o;
}
/* nettoie une réponse reçue du réseau (jamais confiance) : renvoie un nombre, une liste d’index valides, ou null */
function cleanAns(q,v){
  var k=qKind(q);
  if(k==="slider"){var x=+v;return isFinite(x)?Math.max(q.sl.min,Math.min(q.sl.max,x)):null;}
  if(!isList(k)||!Array.isArray(v))return null;
  var N=q.choices.length,out=[];
  for(var i=0;i<v.length&&i<12;i++){var t=Math.floor(+v[i]);out.push(t>=0&&t<N?t:-1);}
  if(k==="multi"){var u=[];out.forEach(function(t){if(t>=0&&u.indexOf(t)<0)u.push(t);});return u.sort(function(a,b){return a-b;});}
  if(k==="ordre"){var seen={},ok=true;out.forEach(function(t){if(t<0||seen[t])ok=false;seen[t]=1;});return ok&&out.length===N?out:null;}
  /* assoc : une valeur par terme de gauche ; -1 = pas de choix ; un même choix ne peut servir qu’une fois */
  var s2={},res=[];
  for(var j=0;j<q.left.length;j++){var t2=j<out.length?out[j]:-1;if(t2>=0&&s2[t2])t2=-1;if(t2>=0)s2[t2]=1;res.push(t2);}
  return res;
}
/* correction d’une réponse a = {k, v} → {ok, part (0 à 1 : part des points), k} */
function judge(q,a){
  var k=qKind(q),v=a?a.v:undefined,res={ok:false,part:0,k:-1,err:""};
  if(!a)return res;
  if(k==="slider"){
    var x=+v;
    if(isFinite(x)){
      var dd=Math.abs(x-q.sl.ans);
      res.ok=dd<=q.sl.tol+1e-9;res.part=res.ok?1:dd<=2.5*q.sl.tol+1e-9?0.5:0;
      res.close=!res.ok&&res.part>0;
    }
  }else if(k==="multi"){
    var sel=Array.isArray(v)?v:[],hit=0,bad=0;
    sel.forEach(function(t){if(q.set.indexOf(t)>=0)hit++;else bad++;});
    res.ok=bad===0&&hit===q.set.length;
    res.part=res.ok?1:Math.max(0,Math.round((hit-bad)/q.set.length*100)/100);
    if(res.part<0.5)res.part=0;   /* il faut au moins la moitié des bonnes réponses, sans fausses notes, pour toucher des points partiels */
  }else if(k==="ordre"||k==="assoc"){
    var want=k==="ordre"?q.seq:q.map,got=Array.isArray(v)?v:[],right=0;
    want.forEach(function(w,j){if(got[j]===w)right++;});
    res.ok=right===want.length;
    res.part=res.ok?1:right>=2&&right<want.length?Math.round((right-1)/(want.length-1)*100)/100:0;
    if(!res.ok&&res.part<0.3)res.part=0;
  }else{
    var kk=a.k|0;res.k=kk;res.ok=kk===q.ans;
  }
  if(res.ok)res.part=1;
  res.close=!res.ok&&res.part>0;
  return res;
}
function kindMult(){return 1;}
function qCorr(q){return qKind(q)==="slider"?{a:q.sl.ans,t:q.sl.tol}:null;}

if(typeof module!=="undefined")module.exports={ensureThemes:ensureThemes,themeLoaded:themeLoaded,isPick:isPick,isList:isList,cleanAns:cleanAns,loadQuiz:loadQuiz,judge:judge,qPublic:qPublic,qKind:qKind,qCorr:qCorr,answerText:answerText,mulberry32:mulberry32,BANK:BANK,NIVEAUX:NIVEAUX,ITEM_BY_ID:ITEM_BY_ID,QBY_ID:QBY_ID,makeQuestion:makeQuestion,questionById:questionById,drawQuestions:drawQuestions,freshCount:freshCount,buildTree:buildTree,dureeQuestion:dureeQuestion,f:f,normHist:normHist,validQ:validQ,histKey:histKey};
