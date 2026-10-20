/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — 2. « Tirer les questions » : aperçu, remplacement, ordre
═══════════════════════════════════════════════════════════════ */
var QS=[];
function show(id){["s-pick","s-prev","s-lobby","s-game","s-end"].forEach(function(s){$(s).classList.toggle("hidden",s!==id);});document.body.classList.toggle("ingame",id==="s-game");setBodyMode((id==="s-pick"||id==="s-prev"||typeof G==="undefined"||!G)?P.mode:G.mode);window.scrollTo(0,0);fitScreen(id==="s-game",{min:0.55,max:document.body.classList.contains("v-mob")?1.7:2.3});}
function qDur(q){return dureeQuestion(q,P.dur);}
/* mémoire des questions déjà jouées : un même MJ ne retombe sur une question qu’une fois toutes les autres épuisées
   (clé = identifiant de la question ; rang = ordre de jeu, le plus grand est le plus récent) */
function trimMap(o,keep){var k=Object.keys(o);if(k.length<=keep)return o;k.sort(function(a,b){return o[a]-o[b];});k.slice(0,k.length-keep).forEach(function(x){delete o[x];});return o;}
function recentSet(){
  var h=store.get("hist_lm",null);
  if(!h||typeof h!=="object")h={n:1,t:{},s:{},i:{}};
  return normHist(h);
}
function rememberPlayed(qs){
  var h=recentSet();
  qs.forEach(function(q){h.n++;h.t[histKey(q)]=h.n;if(q.id)h.i[q.id]=h.n;});
  trimMap(h.t,6000);trimMap(h.i,200);
  store.set("hist_lm",h);
}
/* le MJ peut repartir de zéro (menu › Historique) */
function resetPlayed(){store.del("hist_lm");updateSel();}
function generate(){
  var seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0;
  var avoid=recentSet();QS.forEach(function(q){avoid.n++;avoid.t[histKey(q)]=avoid.n;});
  var ctx=drawCtx();
  var list=drawQuestions(P.sel,P.nq,ctx,seed,avoid);
  if(P.ord==="prog")list=list.map(function(q,i){return {q:q,i:i};}).sort(function(a,b){return (a.q.d-b.q.d)||(a.i-b.i);}).map(function(x){return x.q;});
  list.forEach(function(q,i){q.seed=seed+i;q.uid=genId();});
  QS=list;
  if(!QS.length){toast("Aucune question avec cette sélection : élargissez les types, les difficultés ou les thèmes.","ko");return;}
  $("pv-show").checked=false;$("pv-list").classList.add("hideans");
  renderPreview();show("s-prev");SND.whoosh();
  var rep=QS.filter(function(q){return avoid.t[histKey(q)];}).length;
  if(QS.length<P.nq)toast("Seulement "+QS.length+" questions avec cette sélection : cochez d’autres thèmes pour en avoir plus.");
  else if(rep)toast(rep+" question"+(rep>1?"s ont":" a")+" déjà été posée"+(rep>1?"s":"")+" : tout le reste de la sélection a été joué. Ajoutez un thème pour du neuf.");
}
/* propositions d’une question dans l’aperçu (la bonne réponse n’apparaît que dans les zones « ans-show ») */
function previewChoicesHtml(q){
  var k=qKind(q);
  if(k==="ordre")return '<div class="chs">'+q.choices.map(function(c,j){return '<div class="ch a'+j+'"><span class="sh">'+SHAPES[j]+"</span><span>"+rt(c.t)+'</span><span class="ans-show ordn">n° '+(q.seq.indexOf(j)+1)+"</span></div>";}).join("")+"</div>";
  if(k==="assoc")return '<div class="chs">'+q.left.map(function(l,i){return '<div class="ch"><span class="sh">'+(i+1)+"</span><span>"+rt(l)+'</span><span class="ans-show ordn">= '+SHAPES[q.map[i]]+"</span></div>";}).join("")+q.choices.map(function(c,j){return '<div class="ch a'+j+'"><span class="sh">'+SHAPES[j]+"</span><span>"+rt(c.t)+"</span></div>";}).join("")+"</div>";
  return '<div class="chs">'+q.choices.map(function(c,j){var good=k==="multi"?q.set.indexOf(j)>=0:j===q.ans;return '<div class="ch a'+j+(good?" ok":"")+'"><span class="sh">'+SHAPES[j]+"</span><span>"+rt(c.t)+"</span></div>";}).join("")+"</div>";
}
function previewCard(q,i){
  var t=qKind(q),tag=t==="qcm"?'<span class="tag">QCM</span>':kindTagHtml(q);
  var h='<div class="pq" data-i="'+i+'"><div class="grip" title="Glisser pour déplacer"><span class="num">'+(i+1)+"</span>"+ICO.grip+'</div><div>'+
    '<div class="meta">'+tag+'<span class="tag t-mint">'+fmtDur(qDur(q))+'</span></div><div class="meta">'+themeChip(q.titre,q.id)+lvlTag(q.d)+"</div>"+
    '<div class="qt">'+rt(q.q)+"</div>";
  if(t==="slider")h+='<div class="ansz"><div class="ans-hide">'+scaleHtml(q.sl)+'</div><div class="ans-show">'+scaleHtml(q.sl,{zone:{a:q.sl.ans,t:q.sl.tol},ans:q.sl.ans})+"</div></div>";
  else h+=previewChoicesHtml(q);
  h+='<div class="pq-x ans-show">'+(q.expl?rt(q.expl):"")+(q.src?'<div class="rv-src">Source : '+esc(q.src)+"</div>":"")+"</div>";
  h+='<div class="acts"><button type="button" class="btn btn-sm btn-soft" data-a="redraw">'+ICO.refresh+"Remplacer</button>"+
    '<button type="button" class="btn btn-sm btn-ghost del" data-a="del">'+ICO.trash+"Retirer</button></div></div></div>";
  return h;
}
function renderPreview(){
  $("pv-list").innerHTML=QS.map(previewCard).join("");
  var tot=QS.reduce(function(s,q){return s+qDur(q);},0),ths={};QS.forEach(function(q){ths[q.id]=1;});
  $("pv-title").textContent=QS.length+" question"+(QS.length>1?"s":"")+" prête"+(QS.length>1?"s":"");
  $("pv-sub").textContent=MODES[P.mode].nom+" · "+Object.keys(ths).length+" thème"+(Object.keys(ths).length>1?"s":"")+" · durée de jeu ≈ "+Math.max(1,Math.round((tot+QS.length*12)/60))+" min";
  $("pv-count").textContent=QS.length+" questions · "+MODES[P.mode].court;
  $("b-open").disabled=!QS.length;
}
$("pv-show").addEventListener("change",function(){$("pv-list").classList.toggle("hideans",!this.checked);});
$("pv-back").addEventListener("click",function(){show("s-pick");renderTree();});
$("pv-regen").addEventListener("click",generate);
$("b-gen").addEventListener("click",function(){SND.unlock();generate();});
/* remplace la question i par une autre, de préférence du même thème et jamais jouée */
function replaceAt(i){
  var q=QS[i],avoid=recentSet(),here={};
  QS.forEach(function(x){avoid.n++;avoid.t[histKey(x)]=avoid.n+1;here[x.qid]=1;});
  var ctx=drawCtx(),seed=(Date.now()^q.seed)>>>0,nq=null;
  [[q.id],P.sel].forEach(function(ids){
    if(nq)return;
    var c=drawQuestions(ids,Math.min(40,QBY_COUNT(ids,ctx)),ctx,seed,avoid).filter(function(x){return !here[x.qid];});
    if(c.length)nq=c[0];
  });
  if(!nq){toast("Pas d’autre question disponible avec cette sélection.");return;}
  nq.seed=q.seed+7;nq.uid=q.uid;QS[i]=nq;renderPreview();SND.pop();
}
function QBY_COUNT(ids,ctx){return freshCount(ids,ctx,{}).total;}
$("pv-list").addEventListener("click",function(e){
  var card=e.target.closest(".pq");if(!card)return;
  var i=+card.getAttribute("data-i"),b=e.target.closest("button[data-a]");
  if(!b)return;
  var a=b.getAttribute("data-a");
  if(a==="redraw")replaceAt(i);
  else if(a==="del"){
    if(QS.length<=1){toast("Il faut garder au moins une question.");return;}
    if(b.getAttribute("data-arm")!=="1"){b.setAttribute("data-arm","1");b.innerHTML=ICO.trash+"Confirmer ?";setTimeout(function(){if(b.isConnected){b.removeAttribute("data-arm");b.innerHTML=ICO.trash+"Retirer";}},3000);return;}
    QS.splice(i,1);renderPreview();
  }
});
dragDrop({root:$("pv-list"),item:".pq",handle:".grip",zone:"#pv-list",sort:true,onDrop:function(it,zone,before){
  var from=+it.getAttribute("data-i"),q=QS.splice(from,1)[0],to=before?+before.getAttribute("data-i"):QS.length+1;
  if(before&&to>from)to--;
  QS.splice(Math.min(to,QS.length),0,q);renderPreview();
}});
