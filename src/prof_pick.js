/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — 1. Choisir les thèmes et régler la partie
═══════════════════════════════════════════════════════════════ */
var P={lvl:"all",sel:[],mode:"duel",nq:10,dur:0,ord:"rand",tp:"cvs",df:"123",dark:false,nt:2,tnames:null,hide:false,auto:false,early:true,names:true,view:null,mute:false,read:3,pts:"vite",hd:3,hpen:false};
function loadSetup(){var s=store.get("mj",null);if(s&&typeof s==="object")for(var k in P)if(s[k]!==undefined)P[k]=s[k];P.sel=(P.sel||[]).filter(function(id){return !!ITEM_BY_ID[id];});if(!P.dark)P.sel=P.sel.filter(function(id){return !ITEM_BY_ID[id].dark;});if(!P.tp)P.tp="cvs";if(!P.df)P.df="123";}
function saveSetup(){store.set("mj",P);}
function teamNames(){var a=P.tnames&&P.tnames.length?P.tnames:[];return TEAMS.map(function(t,i){return a[i]||t.n;});}

var DURS=[[0,"Auto"],[15,"15 s"],[30,"30 s"],[60,"1 min"],[120,"2 min"]];
var NQS=[5,10,15,20];
var ORDS=[["rand","Mélangé"],["prog","Progressif"]];
var TPS=[["c","QCM"],["v","Vrai ou faux"],["s","Curseur"]];
var DFS=[["1","★ Débutant"],["2","★★ Initié"],["3","★★★ Expert"]];
var READS=[[0,"Aucun"],[3,"3 s"],[5,"5 s"]];
var HDS=[[0,"Aucun"],[3,"+3 s"],[5,"+5 s"],[10,"+10 s"]];
var PTSM=[["vite","Justesse et rapidité"],["juste","Justesse seule"]];
var OPEN_CH={};      /* royaumes ouverts */
var TREE_SEL={};     /* clé de royaume → thèmes affichés */
var OPEN_IT=null;    /* thème dont l’exemple est déplié */

function normS(s){s=String(s||"").toLowerCase();return s.normalize?s.normalize("NFD").replace(/[̀-ͯ]/g,""):s;}
function dStars(d){return '<span class="dstars" title="Difficulté '+d+'/3">'+"★★★".slice(0,d)+'<span style="opacity:.25">'+"★★★".slice(d)+"</span></span>";}
function fmtDur(s){return s>=60?(s%60?Math.floor(s/60)+" min "+(s%60)+" s":(s/60)+" min"):s+" s";}
function themeIcon(it){var t=(typeof TICO!=="undefined"&&TICO)?(TICO[it.ico]||TICO.des||""):"";return t?'<span class="tico" aria-hidden="true">'+t+"</span>":"";}
/* filtres de tirage : types de questions, difficultés, contenus sombres */
function drawCtx(){
  var types={c:P.tp.indexOf("c")>=0,v:P.tp.indexOf("v")>=0,s:P.tp.indexOf("s")>=0};
  var diffs=P.df.split("").map(Number).filter(function(n){return n>=1&&n<=3;});
  return {types:types,diffs:diffs.length===3?null:diffs,dark:!!P.dark};
}

/* ─── royaumes ─── */
function renderLevels(){
  var h='<button type="button" data-l="all"'+(P.lvl==="all"?' class="on"':"")+'>Tous</button>';
  NIVEAUX.forEach(function(n){h+='<button type="button" data-l="'+n.id+'" style="--lc:'+n.color+'"'+(P.lvl===n.id?' class="on"':"")+'>'+esc(n.court)+"</button>";});
  $("lvls").innerHTML=h;
}
$("lvls").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;P.lvl=b.getAttribute("data-l");saveSetup();renderLevels();renderTree();});

/* ─── arborescence : royaume › thèmes ─── */
function itemRow(it){
  var on=P.sel.indexOf(it.id)>=0;
  var h='<div class="it'+(on?" sel":"")+'" data-id="'+it.id+'"><input type="checkbox" '+(on?"checked ":"")+'aria-label="'+esc(it.titre)+'">'+
    '<div class="nm" data-tog="1">'+themeIcon(it)+'<span>'+esc(it.titre)+"</span>"+(it.dark?' <span class="tag t-coral" title="Contenu sombre (horreur, démons…)">sombre</span>':"")+'</div>'+
    '<div class="tg"><span class="tag" title="Questions dans ce thème">'+it.nvar+' q.</span>'+dStars(it.d)+'<button type="button" class="more" data-more="'+it.id+'" title="Voir un exemple" aria-label="Exemple">⋯</button></div>';
  if(OPEN_IT===it.id){
    var q=makeQuestion(it.id,(Date.now()&0xffff)+7,drawCtx());
    if(q)h+='<div class="it-ex">'+kindTagHtml(q)+'<div class="ex-q">'+rt(q.q)+"</div>"+exAnswers(q)+'<button type="button" class="btn btn-sm btn-soft" data-ex="'+it.id+'">'+ICO.refresh+"Un autre exemple</button></div>";
  }
  return h+"</div>";
}
function exAnswers(q){
  if(qKind(q)==="slider")return scaleHtml(q.sl,{zone:{a:q.sl.ans,t:q.sl.tol},ans:q.sl.ans});
  return '<div class="ex-c">'+q.choices.map(function(c2,i){return '<span'+(i===q.ans?' class="ok"':"")+">"+rt(c2.t)+"</span>";}).join("")+"</div>";
}
function matchQ(it,q){return !q||normS(it.titre+" "+it.chap).indexOf(q)>=0;}
function cntHtml(n,t){return '<span class="cnt'+(n?"":" z")+'">'+n+" / "+t+"</span>";}
function renderTree(){
  var tree=buildTree({dark:P.dark}),q=normS($("q-search").value.trim()),h="",any=false,lv=P.lvl;
  TREE_SEL={};
  tree.forEach(function(br){
    if(lv!=="all"&&br.niv.id!==lv)return;
    var items=[];br.chaps.forEach(function(ch){items=items.concat(ch.items.filter(function(it){return matchQ(it,q);}));});
    if(!items.length)return;
    any=true;
    var key=br.niv.id;TREE_SEL[key]=items;
    var ns=items.filter(function(it){return P.sel.indexOf(it.id)>=0;}).length,open=q||(OPEN_CH[key]!==undefined?OPEN_CH[key]:(lv!=="all"||ns>0));
    h+='<details class="acc chap" data-k="'+esc(key)+'" style="--lc:'+br.niv.color+'"'+(open?" open":"")+'><summary><input type="checkbox" class="chk" data-key="'+esc(key)+'" '+(ns===items.length?"checked":"")+' aria-label="Tout le royaume « '+esc(br.niv.nom)+' »">'+
      '<span class="cn">'+esc(br.niv.label)+"</span>"+cntHtml(ns,items.length)+'</summary><div class="subs"><div class="items">'+items.map(itemRow).join("")+"</div></div></details>";
  });
  $("tree").innerHTML=any?h:'<div class="none">Aucun thème ne correspond à « '+esc($("q-search").value)+' ».</div>';
  updateSel();
}
function chapItems(key){return TREE_SEL[key]||[];}
function toggleSel(id,on){var i=P.sel.indexOf(id);if(on&&i<0)P.sel.push(id);if(!on&&i>=0)P.sel.splice(i,1);}
$("tree").addEventListener("click",function(e){
  var t=e.target;
  var chk=t.closest("input.chk");
  if(chk){e.stopPropagation();chapItems(chk.getAttribute("data-key")).forEach(function(it){toggleSel(it.id,chk.checked);});saveSetup();renderTree();return;}
  var row=t.closest(".it");
  if(row&&t.matches(".it input[type=checkbox]")){toggleSel(row.getAttribute("data-id"),t.checked);saveSetup();row.classList.toggle("sel",t.checked);updateSel();updateChapCounts();return;}
  if(row&&t.closest("[data-tog]")){var cb=row.querySelector("input[type=checkbox]");cb.checked=!cb.checked;toggleSel(row.getAttribute("data-id"),cb.checked);saveSetup();row.classList.toggle("sel",cb.checked);updateSel();updateChapCounts();return;}
  var b=t.closest("button");if(!b)return;
  if(b.hasAttribute("data-more")){var id=b.getAttribute("data-more");OPEN_IT=OPEN_IT===id?null:id;renderTree();return;}
  if(b.hasAttribute("data-ex")){renderTree();return;}
});
$("tree").addEventListener("toggle",function(e){var d=e.target;if(d.matches&&d.matches("details.chap"))OPEN_CH[d.getAttribute("data-k")]=d.open;},true);
function updateChapCounts(){
  $$("#tree details.chap").forEach(function(d){
    var its=$$(".it",d),n=its.filter(function(r){return r.classList.contains("sel");}).length,sm=d.querySelector("summary"),c=sm.querySelector(".cnt"),k=sm.querySelector(".chk");
    c.textContent=n+" / "+its.length;c.classList.toggle("z",!n);k.checked=n===its.length;
  });
}
function updateSel(){
  var n=P.sel.length,ctx=drawCtx(),fc=freshCount(P.sel,ctx,recentSet());
  $("sel-count").textContent=n?n+" thème"+(n>1?"s":"")+" · "+fc.total+" questions possibles"+(fc.total?" ("+fc.fresh+" jamais jouée"+(fc.fresh>1?"s":"")+")":""):"Aucun thème coché";
  $("b-gen").disabled=!n||!fc.total;$("b-gen").classList.toggle("pulse",n>0&&fc.total>0);
  var tpn=TPS.filter(function(x){return P.tp.indexOf(x[0])>=0;}).map(function(x){return x[1];}).join(" + ");
  $("set-sum").textContent=P.nq+" questions, "+(P.dur?fmtDur(P.dur):"temps auto")+", "+tpn+(P.read?", lecture "+P.read+" s":"")+(P.pts==="juste"?", justesse seule":"");
}
$("q-search").addEventListener("input",function(){clearTimeout(this._t);this._t=setTimeout(renderTree,150);});
$("b-clear").addEventListener("click",function(){P.sel=[];saveSetup();renderTree();});

/* ─── Surprends-moi : 4 thèmes au hasard (dans le royaume choisi, ou partout) ─── */
$("b-surprise").addEventListener("click",function(){
  var pool=BANK.filter(function(it){return (P.lvl==="all"||it.roy===P.lvl)&&(P.dark||!it.dark);});
  if(!pool.length){toast("Aucun thème disponible.");return;}
  P.sel=shuffle(Math.random,pool).slice(0,Math.min(4,pool.length)).map(function(it){return it.id;});
  saveSetup();OPEN_CH={};
  renderTree();SND.pop();
  toast(P.sel.length+" thèmes tirés au sort"+(P.lvl==="all"?"":" dans ce royaume")+".");
});

/* ─── réglages ─── */
function segHtml(list,cur){return list.map(function(x){var v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return '<button type="button" data-v="'+v+'"'+(String(cur)===String(v)?' class="on"':"")+">"+esc(l)+"</button>";}).join("");}
/* sélection multiple (types, difficultés) : au moins une case reste cochée */
function multiHtml(list,cur){return list.map(function(x){return '<button type="button" data-v="'+x[0]+'"'+(cur.indexOf(x[0])>=0?' class="on"':"")+">"+esc(x[1])+"</button>";}).join("");}
var MODE_IC={solo:ICO.user,duel:ICO.users,boss:ICO.shield},MODE_C={solo:"var(--mode-solo)",duel:"var(--mode-duel)",boss:"var(--mode-boss)"};
function renderSettings(){
  $("modes").innerHTML=["solo","duel","boss"].map(function(m){var M=MODES[m];return '<button type="button" class="mode'+(P.mode===m?" on":"")+'" data-m="'+m+'"><span class="mi" style="--mc:'+MODE_C[m]+'">'+MODE_IC[m]+'</span><span><b>'+esc(M.nom)+"</b><small>"+esc(M.desc)+"</small></span></button>";}).join("");
  $("seg-nq").innerHTML=segHtml(NQS,P.nq);
  $("seg-dur").innerHTML=segHtml(DURS,P.dur);
  $("seg-ord").innerHTML=segHtml(ORDS,P.ord);
  $("seg-tp").innerHTML=multiHtml(TPS,P.tp);
  $("seg-df").innerHTML=multiHtml(DFS,P.df);
  $("seg-read").innerHTML=segHtml(READS,P.read);
  $("seg-pts").innerHTML=segHtml(PTSM,P.pts);
  $("seg-nt").innerHTML=segHtml([2,3,4,5,6],P.nt);
  $("w-teams").classList.toggle("hidden",P.mode!=="duel");
  $("w-boss").classList.toggle("hidden",P.mode!=="boss");$("seg-hd").innerHTML=segHtml(HDS,P.hd);$("o-hpen").checked=!!P.hpen;
  $("o-hide").checked=!!P.hide;$("o-auto").checked=!!P.auto;$("o-early").checked=P.early!==false;$("o-names").checked=P.names!==false;
  $("o-dark").checked=!!P.dark;
  updateSel();
}
$("modes").addEventListener("click",function(e){var b=e.target.closest(".mode");if(!b)return;P.mode=b.getAttribute("data-m");setBodyMode(P.mode);saveSetup();renderSettings();});
[["seg-nq","nq",true],["seg-dur","dur",true],["seg-ord","ord",false],["seg-nt","nt",true],["seg-read","read",true],["seg-pts","pts",false],["seg-hd","hd",true]].forEach(function(x){
  $(x[0]).addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var v=b.getAttribute("data-v");P[x[1]]=x[2]?+v:v;saveSetup();renderSettings();});
});
[["seg-tp","tp"],["seg-df","df"]].forEach(function(x){
  $(x[0]).addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;var v=b.getAttribute("data-v"),cur=P[x[1]];
    if(cur.indexOf(v)>=0){if(cur.length<=1){toast("Gardez au moins une case cochée.");return;}cur=cur.replace(v,"");}else cur=(cur+v).split("").sort().join("");
    P[x[1]]=cur;saveSetup();renderSettings();
  });
});
$("o-hide").addEventListener("change",function(){P.hide=this.checked;saveSetup();});
$("o-auto").addEventListener("change",function(){P.auto=this.checked;saveSetup();});
$("o-early").addEventListener("change",function(){P.early=this.checked;saveSetup();});
$("o-names").addEventListener("change",function(){P.names=this.checked;saveSetup();});
$("o-hpen").addEventListener("change",function(){P.hpen=this.checked;saveSetup();});
$("o-dark").addEventListener("change",function(){
  P.dark=this.checked;
  if(!P.dark)P.sel=P.sel.filter(function(id){return !ITEM_BY_ID[id].dark;});
  saveSetup();renderTree();renderSettings();
  toast(P.dark?"Contenus sombres affichés (morts-vivants, démons, aberrations…).":"Contenus sombres masqués.");
});

function refreshAll(){renderLevels();renderTree();renderSettings();}
