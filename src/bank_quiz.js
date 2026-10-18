/* ═══════════════════════════════════════════════════════════════
   LORE MASTER — banque de questions
   Les questions viennent du bloc JSON « lm-quiz » de la page (voir tools/pack_quiz.py).
   Une « notion » du moteur (BANK) est ici un THÈME ; les thèmes sont rangés par ROYAUME (NIVEAUX).
   Format compact d’une question : i id · n niveau 1-3 · t c|v|s · q énoncé · x explication · s n° de source
     c : c[] propositions, r index juste ·  v : r = 1 (vrai) ou 0 (faux)
     s : r valeur, mn/mx bornes, p pas, u unité, tl tolérance
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
function loadQuiz(obj){
  if(!obj||!obj.th)return;
  NIVEAUX.length=0;BANK.length=0;ROY_BY_ID={};ITEM_BY_ID={};QBY_ID={};QUIZ_META.total=0;
  obj.roy.forEach(function(r){var o={id:r.id,court:r.court,label:r.nom,nom:r.nom,color:r.couleur,icone:r.icone};NIVEAUX.push(o);ROY_BY_ID[r.id]=o;});
  obj.th.forEach(function(t){
    var sum=0;t.Q.forEach(function(q){sum+=q.n;q.th=t.id;q.src=t.S[q.s]||"";QBY_ID[q.i]=q;});
    var it={id:t.id,titre:t.nom,chap:ROY_BY_ID[t.roy]?ROY_BY_ID[t.roy].nom:"",niv:[t.roy],roy:t.roy,ico:t.ico,dark:!!t.dk,
            d:Math.max(1,Math.min(3,Math.round(sum/Math.max(1,t.Q.length)))),tags:[],nvar:t.Q.length,Q:t.Q,
            gen:function(r,ctx){return drawOne(it,r,ctx);}};
    BANK.push(it);ITEM_BY_ID[it.id]=it;QUIZ_META.total+=t.Q.length;
  });
}
(function(){
  try{
    if(typeof document!=="undefined"){var el=document.getElementById("lm-quiz");if(el)loadQuiz(JSON.parse(el.textContent));}
    else if(typeof require!=="undefined"){loadQuiz(JSON.parse(require("fs").readFileSync(require("path").join(__dirname,"..","build","quiz.json"),"utf8")));}
  }catch(e){if(typeof console!=="undefined")console.error("Banque de questions illisible",e);}
})();
function indexBank(){}

/* ─── filtres de partie : types de questions, difficultés, contenus sombres ─── */
var ALL_TYPES={c:1,v:1,s:1};
function ctxOk(q,ctx){
  if(!ctx)return true;
  if(ctx.types&&!ctx.types[q.t])return false;
  if(ctx.diffs&&ctx.diffs.length&&ctx.diffs.indexOf(q.n)<0)return false;
  return true;
}
function themeOk(it,ctx){return !it.dark||(ctx&&ctx.dark);}
function poolOf(it,ctx){return it.Q.filter(function(q){return ctxOk(q,ctx);});}

/* ─── une question compacte → objet de jeu ─── */
function buildQ(raw,it,r){
  var q={q:raw.q,expl:raw.x||"",qid:raw.i,src:raw.src||"",id:it.id,d:raw.n,titre:it.titre,chap:it.chap};
  if(raw.t==="v"){
    q.choices=[{t:"Vrai",err:null},{t:"Faux",err:null}];q.ans=raw.r?0:1;q.vf=true;
  }else if(raw.t==="s"){
    var dec=Math.max(decOf(raw.p),decOf(raw.mn),decOf(raw.mx),decOf(raw.r));
    q.kind="slider";q.choices=[];q.ans=0;
    q.sl={min:raw.mn,max:raw.mx,step:raw.p,ans:raw.r,tol:raw.tl||0,u:raw.u||"",d:dec};
  }else{
    var order=shuffle(r||Math.random,[0,1,2,3].slice(0,raw.c.length));
    q.choices=order.map(function(k){return {t:raw.c[k],err:null};});
    q.ans=order.indexOf(raw.r);
  }
  return q;
}
function drawOne(it,r,ctx){
  var pool=poolOf(it,ctx);if(!pool.length)pool=it.Q;
  return buildQ(pick(r,pool),it,r);
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
   3. pas plus de deux questions du même type d’affilée quand c’est évitable. */
function drawQuestions(itemIds,n,ctx,seed,avoid){
  var H=normHist(avoid),r=mulberry32(seed>>>0),out=[],used={},cnt={};
  var lists=[];
  itemIds.forEach(function(id){
    var it=ITEM_BY_ID[id];if(!it||!themeOk(it,ctx))return;
    var pool=poolOf(it,ctx);if(!pool.length)return;
    var arr=shuffle(r,pool).map(function(q){return {q:q,rank:H.t[q.i]||0};});
    arr.sort(function(a,b){return a.rank-b.rank;});
    lists.push({it:it,arr:arr,pos:0});cnt[it.id]=0;
  });
  var lastT=[];
  while(out.length<n){
    var best=null,bestS=1e9;
    lists.forEach(function(L){
      while(L.pos<L.arr.length&&used[L.arr[L.pos].q.i])L.pos++;
      if(L.pos>=L.arr.length)return;
      var c=L.arr[L.pos],sc=(c.rank?100000+c.rank:0)+cnt[L.it.id]*1000+r()*500;
      /* évite 3 fois le même type de suite */
      if(lastT.length>=2&&lastT[lastT.length-1]===c.q.t&&lastT[lastT.length-2]===c.q.t)sc+=200000;
      if(sc<bestS){bestS=sc;best={L:L,c:c};}
    });
    if(!best)break;
    var raw=best.c.q;used[raw.i]=1;cnt[best.L.it.id]++;lastT.push(raw.t);
    out.push(buildQ(raw,best.L.it,r));
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
  var base=q.d===1?15:q.d===3?25:20,L=String(q.q||"").length+(q.choices||[]).reduce(function(s,c){return s+String(c.t).length;},0);
  if(L>170)base+=5;
  if(q.kind==="slider")base+=5;
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

/* ═══ FORMATS : nature, réponse officielle, données envoyées aux joueurs, correction ═══ */
function qKind(q){if(!q)return "qcm";if(q.kind)return q.kind;return q.vf?"vf":"qcm";}
var KIND_TAG={vf:["Vrai ou faux ?","t-sun"],slider:["Estime avec le curseur","t-sun"]};
function kindTagHtml(q){var t=KIND_TAG[qKind(q)];return t?'<span class="tag '+t[1]+'">'+t[0]+"</span>":"";}
function sliderText(sl,v){return f(v,sl.d)+(sl.u?" "+sl.u:"");}
function answerText(q){
  if(qKind(q)==="slider")return "≈ "+f(q.sl.ans,Math.max(q.sl.d,Math.min(3,decOf(q.sl.ans))))+(q.sl.u?" "+q.sl.u:"");
  return q.choices&&q.choices[q.ans]?q.choices[q.ans].t:"";
}
/* données transmises aux joueurs (jamais la réponse) */
function qPublic(q){
  var k=qKind(q),o={q:q.q,kd:k};
  if(q.id&&ITEM_BY_ID[q.id])o.id=q.id;
  if(k==="slider")o.sl={min:q.sl.min,max:q.sl.max,step:q.sl.step,u:q.sl.u,d:q.sl.d};
  else{o.ch=q.choices.map(function(c){return c.t;});if(q.vf)o.vf=1;}
  return o;
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
  }else{
    var kk=a.k|0;res.k=kk;res.ok=kk===q.ans;
  }
  if(res.ok)res.part=1;
  return res;
}
function kindMult(){return 1;}
function qCorr(q){return qKind(q)==="slider"?{a:q.sl.ans,t:q.sl.tol}:null;}

if(typeof module!=="undefined")module.exports={loadQuiz:loadQuiz,judge:judge,qPublic:qPublic,qKind:qKind,qCorr:qCorr,answerText:answerText,mulberry32:mulberry32,BANK:BANK,NIVEAUX:NIVEAUX,ITEM_BY_ID:ITEM_BY_ID,QBY_ID:QBY_ID,makeQuestion:makeQuestion,questionById:questionById,drawQuestions:drawQuestions,freshCount:freshCount,buildTree:buildTree,dureeQuestion:dureeQuestion,f:f,normHist:normHist,validQ:validQ,histKey:histKey};
