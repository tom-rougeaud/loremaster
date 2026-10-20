/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — Duel direct : au plus une fois par manche (MANCHE questions), entre les deux guildes en tête.
   Chaque guilde vote pour son champion ; les deux champions répondent seuls à une question ;
   le plus rapide des deux qui a juste offre DD_WIN points à sa guilde.
═══════════════════════════════════════════════════════════════ */
var VOTE_MS=15000;
/* numéro de manche de la question i (les questions de duel direct ne comptent pas) */
function mancheOf(i){var n=0;for(var k=0;k<=i&&k<G.qs.length;k++)if(!G.qs[k].dd)n++;return Math.max(0,Math.ceil(n/MANCHE)-1);}
function ddTeams(){
  /* les deux guildes en tête qui ont au moins un aventurier connecté */
  return G.teams.map(function(t,k){return {k:k,s:G.tscore[k]||0,n:online().filter(function(p){return p.team===k;}).length};}).filter(function(c){return c.n>0;}).sort(function(a,b){return b.s-a.s||a.k-b.k;}).slice(0,2);
}
function ddAvailable(){
  if(!G||G.mode!=="duel"||G.phase!=="rv"||!G.qs[G.i]||G.qs[G.i].dd)return false;
  if(G.ddAt&&G.ddAt[mancheOf(G.i)])return false;
  return ddTeams().length>=2;
}
function ddButton(){
  var b=$("g-dd-btn");if(!b)return;
  var show=!!G&&G.mode==="duel"&&(G.phase==="rv"||G.phase==="q");
  b.classList.toggle("hidden",!show);if(!show)return;
  var used=G.ddAt&&G.ddAt[mancheOf(Math.max(0,G.i))];
  b.disabled=!ddAvailable();
  b.innerHTML=ICO.swords+"Duel direct"+(used?" (fait pour cette manche)":"");
  b.title="Une fois par manche de "+MANCHE+" questions : les deux guildes en tête désignent chacune un champion.";
}
/* une question de duel : format simple (pas d’ordre ni d’association), jamais déjà posée dans la partie */
function ddQuestion(){
  var ids=P.sel&&P.sel.length?P.sel:Object.keys(G.qs.reduce(function(o,q){o[q.id]=1;return o;},{}));
  var ctx=drawCtx(),t={};Object.keys(ctx.types).forEach(function(k){if(ctx.types[k]&&"cvsihwp".indexOf(k)>=0)t[k]=true;});
  if(!Object.keys(t).length)t={c:true,v:true};
  ctx.types=t;
  var here={};G.qs.forEach(function(q){here[q.qid]=1;});
  var avoid=recentSet();G.qs.forEach(function(q){avoid.n++;avoid.t[histKey(q)]=avoid.n;});
  var seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0,list=drawQuestions(ids,30,ctx,seed,avoid).filter(function(q){return !here[q.qid];});
  if(!list.length)list=drawQuestions(ids,30,{types:{c:true,v:true},dark:ctx.dark},seed,avoid).filter(function(q){return !here[q.qid];});
  var q=list[0];if(!q)return null;
  q.seed=seed;q.uid=genId();return q;
}
function startDuel(){
  if(!ddAvailable())return;
  var q=ddQuestion();if(!q){toast("Plus de question disponible pour un duel avec cette sélection.","ko");return;}
  var T=ddTeams();
  clearInterval(G.autoT);
  G.ddAt[mancheOf(G.i)]=true;
  G.phase="dv";G.dv={a:T[0].k,b:T[1].k,votes:{},end:Date.now()+VOTE_MS,q:q};
  send({t:"dv",i:G.i+1,a:G.dv.a,b:G.dv.b,na:[G.teams[G.dv.a].n,G.teams[G.dv.b].n],dur:VOTE_MS});
  SND.go();ddButton();renderDuelVote();
  clearInterval(G.dvT);G.dvT=setInterval(duelVoteTick,250);
}
function ddVoters(k){return online().filter(function(p){return p.team===k;});}
function recvVote(p,m){
  if(!G||G.phase!=="dv"||!G.dv)return;
  var d=G.dv;if(p.team!==d.a&&p.team!==d.b)return;
  var c=G.players[String(m.k)];if(!c||c.team!==p.team)return;
  d.votes[p.id]=c.id;renderDuelVote();SND.pop();
  if(ddVoters(d.a).concat(ddVoters(d.b)).every(function(x){return d.votes[x.id];})&&!d.early){d.early=setTimeout(endVote,900);}
}
function voteCounts(k){
  var cnt={};Object.keys(G.dv.votes).forEach(function(v){var c=G.dv.votes[v],cp=G.players[c];if(cp&&cp.team===k)cnt[c]=(cnt[c]||0)+1;});return cnt;
}
function renderDuelVote(){
  var box=$("g-dd"),d=G.dv;if(!d)return;
  box.classList.remove("hidden");
  var col=function(k){
    var T=TEAMS[k],cnt=voteCounts(k),mem=G.players?plist().filter(function(p){return p.team===k&&(p.on||cnt[p.id]);}):[],voted=ddVoters(k).filter(function(p){return d.votes[p.id];}).length;
    mem.sort(function(a,b){return (cnt[b.id]||0)-(cnt[a.id]||0)||a.p.localeCompare(b.p,"fr");});
    var mx=Math.max.apply(null,[1].concat(mem.map(function(p){return cnt[p.id]||0;})));
    return '<div class="dd-col" style="--tc:'+T.c+';--tl:'+T.l+'"><h3>'+T.s+" "+esc(G.teams[k].n)+'</h3><div class="dd-v small muted">'+voted+" / "+ddVoters(k).length+" ont voté</div>"+
      mem.map(function(p){var n=cnt[p.id]||0;return '<div class="dd-row"><span class="nm">'+esc(p.p)+'</span><span class="bar"><i style="width:'+(100*n/mx)+'%"></i></span><b>'+n+"</b></div>";}).join("")+"</div>";
  };
  box.innerHTML='<div class="dd-box"><div class="dd-h">'+ICO.swords+'<span>Duel direct !</span></div><p class="dd-sub" id="dd-sub">Chaque guilde vote pour son champion sur les téléphones.</p><div class="dd-cols">'+col(d.a)+'<div class="dd-vs">VS</div>'+col(d.b)+'</div><div class="dd-t" id="dd-t"></div></div>';
  duelVoteTick();
}
function duelVoteTick(){
  if(!G||G.phase!=="dv"||!G.dv){return;}
  var rem=Math.max(0,Math.ceil((G.dv.end-Date.now())/1000)),t=$("dd-t");
  if(t)t.textContent=rem>0?"Fin du vote dans "+rem+" s":"…";
  if(rem<=0&&!G.dv.done){G.dv.done=true;endVote();}
}
function pickChampion(k){
  var cnt=voteCounts(k),mem=ddVoters(k);if(!mem.length)mem=plist().filter(function(p){return p.team===k;});
  var best=-1,list=[];
  mem.forEach(function(p){var n=cnt[p.id]||0;if(n>best){best=n;list=[p];}else if(n===best)list.push(p);});
  return list[Math.floor(Math.random()*list.length)];
}
function endVote(){
  if(!G||G.phase!=="dv"||!G.dv||G.dv.over)return;
  var d=G.dv;d.over=true;clearInterval(G.dvT);clearTimeout(d.early);
  var A=pickChampion(d.a),B=pickChampion(d.b);
  if(!A||!B){G.phase="rv";$("g-dd").classList.add("hidden");G.dv=null;ddButton();toast("Duel annulé : une guilde n’a plus d’aventurier connecté.");return;}
  var q=d.q;
  q.dd={ch:[A.id,B.id],pn:[A.p,B.p],na:[A.p+" ("+G.teams[d.a].n+")",B.p+" ("+G.teams[d.b].n+")"],t:[d.a,d.b]};
  G.qs.splice(G.i+1,0,q);
  rememberPlayed([q]);
  G.phase="dvr";
  $("g-dd").innerHTML='<div class="dd-box"><div class="dd-h">'+ICO.swords+'<span>Les champions</span></div><div class="dd-champs"><div style="--tc:'+TEAMS[d.a].c+'"><small>'+esc(G.teams[d.a].n)+"</small><b>"+esc(A.p)+'</b></div><div class="dd-vs">VS</div><div style="--tc:'+TEAMS[d.b].c+'"><small>'+esc(G.teams[d.b].n)+"</small><b>"+esc(B.p)+"</b></div></div></div>";
  SND.fanfare();
  setTimeout(function(){
    if(!G||G.phase!=="dvr")return;
    $("g-dd").classList.add("hidden");G.dv=null;G.phase="rv";nextQuestion();
  },3200);
}
$("g-dd-btn").addEventListener("click",startDuel);
