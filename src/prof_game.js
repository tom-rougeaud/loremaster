/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — 4. Le jeu : questions, chrono, correction, scènes
═══════════════════════════════════════════════════════════════ */
function qPayload(q,i){
  var o=qPublic(q);o.t="q";o.i=i;o.N=G.qs.length;o.dur=G.dur;
  if(G.rd)o.rd=G.rd;if(G.pts==="juste")o.sm="juste";if(G.hd)o.hd=G.hd*1000;
  if(q.dd)o.dd={ch:q.dd.ch,na:q.dd.na};
  return o;
}
function wideKind(q){return qKind(q)==="slider";}
function showGameScreen(){
  show("s-game");
  var sc=$("g-scene");
  if(G.mode==="duel"){sc.innerHTML='<h3>La course des guildes</h3>'+raceHtml(G.teams.map(function(t,k){var T=TEAMS[k];return {n:t.n,c:T.c,d:T.d};}));raceUpdate(sc,G.tscore,(G.i+1)/G.qs.length);}
  else if(G.mode==="boss"){sc.innerHTML=bossHtml();bossUpdate(sc,G.boss);}
  else{sc.innerHTML='<h3>Top 5</h3>'+leaderHtml();leaderUpdate(sc,rankList(),null);}
}
function startGame(){
  if(!G)return;
  if(G.phase!=="lobby"){showGameScreen();return;}
  if(!online().length){toast("Aucun aventurier connecté.");return;}
  if(G.mode==="duel"){plist().forEach(function(p){if(p.team<0||p.team>=G.teams.length)p.team=smallestTeam();});G.lk=true;}
  G.qs=QS.map(function(q){return JSON.parse(JSON.stringify(q));});
  rememberPlayed(G.qs);
  G.i=-1;G.hist=[];G.tscore=G.teams.map(function(){return 0;});
  G.boss={pc:100,pp:100,mc:100,mp:100,A:0,M:0};G.hostStreak=0;G.ddAt={};
  /* mode automatique : activé d’office en « Aventuriers VS MJ », sinon selon le réglage ; modifiable en jeu */
  G.auto=G.mode==="boss"?true:!!P.auto;autoBtn();
  G.pts=P.pts==="juste"?"juste":"vite";G.read=Math.max(0,Math.min(10,+P.read||0));
  G.hd=G.mode==="boss"?Math.max(0,Math.min(10,+P.hd||0)):0;G.hpen=false;
  plist().forEach(function(p){p.score=0;p.ok=0;p.na=0;p.streak=0;p.best=0;p.free=0;p.wire=0;p.fast=0;p.ans={};});
  G.phase="cd";pushLobby();hostPing(false);
  showGameScreen();
  showRules(function(){countdown(function(){nextQuestion();});});
}
/* départ : les trois torches s’allument une à une */
function countdown(cb){
  var cd=$("g-cd"),n=3,g=G,bs=$$("#g-cdb i");cd.classList.remove("hidden");
  bs.forEach(function(b){b.classList.remove("on");});
  send({t:"cd",n:3,N:G.qs.length});
  function step(){
    if(!G||G!==g||G.phase!=="cd"){cd.classList.add("hidden");return;}   /* partie écourtée ou fermée pendant le compte à rebours */
    if(n>0){if(bs[3-n])bs[3-n].classList.add("on");$("g-cdt").textContent=n===3?"Prêts ?":n===2?"On se concentre…":"C’est parti !";SND.tock();n--;setTimeout(step,850);}
    else{cd.classList.add("hidden");SND.go();cb();}
  }
  step();
}
/* ─── colonne en direct : les pseudos s’empilent à mesure que les réponses arrivent ─── */
function liveReset(){$("gl-list").innerHTML="";$("g-live").classList.remove("lit","two");liveCount();}
function liveCount(){
  if(!G)return;
  var n=Object.keys(G.ans||{}).length,on=online().length;
  $("gl-n").textContent=n;$("gl-t").textContent=(n>1?"réponses":"réponse")+" sur "+on;
  $("g-live").classList.toggle("lit",n>0);$("g-live").classList.toggle("two",n>14);
}
function liveAdd(p){
  var T=G.mode==="duel"&&p.team>=0&&p.team<TEAMS.length?TEAMS[p.team]:null,li=document.createElement("li");
  li.setAttribute("data-id",p.id);
  if(T){li.style.setProperty("--tc",T.d);li.style.setProperty("--tl",T.l);}
  li.innerHTML="<i></i><span>"+esc(p.p)+"</span>";
  $("gl-list").appendChild(li);liveCount();
  var box=$("g-live");if(box.scrollHeight>box.clientHeight)box.scrollTop=box.scrollHeight;
}
function liveReveal(){
  if(P.names===false)return;
  $$("#gl-list li").forEach(function(li){var a=G.ans[li.getAttribute("data-id")];if(!a)return;li.classList.add(a.ok?"ok":a.part>0?"pa":"ko");});
}
function metaHtml(q){return themeChip(q.titre,q.id)+lvlTag(q.d)+kindTagHtml(q);}
function nextQuestion(){
  if(!G||G.phase==="end"||G.phase==="lobby")return;
  clearInterval(G.autoT);clearTimeout(G.autoT);
  G.i++;
  if(G.i>=G.qs.length){endGame(false);return;}
  ddButton();
  var q=G.qs[G.i];
  G.rd=(G.read||0)*1000;
  G.phase="q";G.cur=true;G.ans={};G.hostAns=null;G.qStart=Date.now()+G.rd;G.dur=qDur(q)*1000;G.extra=0;G.bub=0;G.lowS=-1;
  liveReset();
  $("g-qn").textContent="Question "+(G.i+1)+" / "+G.qs.length;
  $("g-meta").innerHTML=metaHtml(q);
  setGameQ(q);
  var kd=qKind(q);
  if(wideKind(q))$("g-choices").innerHTML='<div class="g-wide">'+scaleHtml(q.sl,{big:true})+'<div class="g-how">Estimez avec le curseur sur votre téléphone'+(tolText(qPublic(q).sl)?" · "+esc(tolText(qPublic(q).sl)):"")+'</div></div>';
  else if(P.hide)$("g-choices").innerHTML='<div class="g-hidden" style="grid-column:1/-1">'+ICO.eyeoff+"Les propositions sont sur vos téléphones</div>";
  else $("g-choices").innerHTML=liveChoicesHtml(q);
  $("g-choices").style.gridTemplateColumns=(!wideKind(q)&&!P.hide&&q.choices.length===2)?"repeat(2,minmax(0,1fr))":"";
  $("g-choices").classList.toggle("one",!wideKind(q)&&!P.hide&&(q.kind==="assoc"||q.choices.some(function(c){return String(c.t).length>26;})));
  $("g-rev").classList.add("hidden");$("g-rev").innerHTML="";$("g-qbox").classList.remove("rv");
  $("g-timer").classList.remove("hidden","low");
  $("g-next").innerHTML=ICO.check+"Corriger maintenant";$("g-plus").disabled=false;
  $("g-scene").classList.add("small");
  $("g-choices").classList.toggle("veil",G.rd>0);$("g-timer").classList.toggle("read",G.rd>0);
  updateAnswered();
  send(qPayload(q,G.i));snapshot();fitSoon(0);
  clearInterval(G.tick);G.tick=setInterval(tick,200);tick();
}
/* propositions affichées sur l’écran de projection pendant la question */
function liveChoicesHtml(q){
  var k=qKind(q);
  if(k==="assoc"){
    return '<div class="g-assoc" style="grid-column:1/-1"><div class="ga-col">'+q.left.map(function(l,i){return '<div class="ga-it"><span class="sh n">'+(i+1)+"</span><span>"+rt(l)+"</span></div>";}).join("")+"</div>"+
      '<div class="ga-col">'+q.choices.map(function(c,j){return '<div class="ga-it r"><span class="sh">'+SHAPES[j]+"</span><span>"+rt(c.t)+"</span></div>";}).join("")+"</div></div>";
  }
  return q.choices.map(function(c,k2){return '<div class="gch a'+k2+'"><span class="sh">'+SHAPES[k2]+"</span><span>"+rt(c.t)+"</span></div>";}).join("")+
    (k==="multi"?'<div class="g-how" style="grid-column:1/-1">Plusieurs réponses sont justes : cochez-les toutes sur votre téléphone</div>':k==="ordre"?'<div class="g-how" style="grid-column:1/-1">Touchez les éléments dans le bon ordre sur votre téléphone</div>':"");
}
function remaining(){return G.dur+G.extra-(Date.now()-G.qStart);}
function tick(){
  if(!G||G.phase!=="q")return;
  var rem=remaining(),tot=G.dur+G.extra,s=Math.max(0,Math.ceil(rem/1000));
  /* temps de lecture : énoncé seul, propositions voilées, chrono plein */
  if(rem>tot){$("g-sec").textContent=Math.ceil((rem-tot)/1000);$("g-ring").style.strokeDashoffset="0";$("g-timer").classList.add("read");return;}
  if($("g-timer").classList.contains("read")){$("g-timer").classList.remove("read");$("g-choices").classList.remove("veil");SND.pop();}
  $("g-sec").textContent=s;
  $("g-ring").style.strokeDashoffset=String(276.5*(1-Math.max(0,rem)/tot));
  var low=rem<=5000;$("g-timer").classList.toggle("low",low);
  if(low&&s!==G.lowS&&s>0){G.lowS=s;SND.tick();}
  if(rem<=0)reveal();
}
/* joueurs dont on attend une réponse (les deux champions pendant un duel direct) */
function expected(){
  var q=G&&G.qs[G.i];
  if(q&&q.dd)return online().filter(function(p){return q.dd.ch.indexOf(p.id)>=0;});
  return online();
}
function updateAnswered(){
  hostIndicator();liveCount();
  if(G&&$("g-players"))$("g-players").innerHTML=ICO.users+"Joueurs ("+online().length+")";
  if(!G||(G.phase!=="q"&&G.phase!=="rv"))return;
  var on=expected(),n=on.filter(function(p){return G.ans[p.id];}).length;
  var el=$("g-ans");el.textContent=n+" / "+on.length+" ont répondu";
  el.classList.remove("pulse");void el.offsetWidth;el.classList.add("pulse");
  if(G.phase==="q"&&P.early!==false&&on.length&&n>=on.length&&!(G.mode==="boss"&&G.host&&G.host.on&&!G.hostAns)&&!G.earlyT)G.earlyT=setTimeout(function(){G.earlyT=null;if(G.phase==="q")reveal();},900);
}
function recvAnswer(p,m){
  if(G.phase!=="q"||m.i!==G.i||G.ans[p.id])return;
  var q=G.qs[G.i],el=Math.max(0,Date.now()-G.qStart),lim=G.dur+G.extra;
  if(q.dd&&q.dd.ch.indexOf(p.id)<0)return;   /* duel direct : seuls les deux champions répondent */
  if(el>lim+1500)return;
  var ms=+m.ms;if(!(ms>=0))ms=el;
  var t=clamp(Math.min(el,Math.max(ms,el-2500)),0,lim);
  var res=judgeMsg(q,m);
  res.t=t;res.rem=lim-el;
  G.ans[p.id]=res;
  /* effets en direct (sans dévoiler la justesse) */
  var T=G.mode==="duel"&&p.team>=0&&p.team<TEAMS.length?TEAMS[p.team]:null,col=T?T.c:"var(--violet)";
  liveAdd(p);
  if(G.pts==="juste")SND.pop();
  else if(t<Math.min(0.25*lim,6000)&&G.bub<4){G.bub++;fxBubble(p.p+" : réponse éclair !","#D59A2E","bolt",G.bub%2?"left":"right");SND.bolt();}
  else if(res.rem<=3000&&lim>=10000){fxBubble(p.p+" : sur le fil !",col==="var(--violet)"?"#D9606A":col,"clock",Math.random()<0.5?"left":"right");}
  else SND.pop();
  updateAnswered();
}
/* nettoie la réponse reçue (jamais confiance au réseau) puis la corrige */
function judgeMsg(q,m){
  var v=cleanAns(q,m.v),j=judge(q,{k:m.k|0,v:v});
  return {k:j.k,ok:j.ok,part:j.part||0,err:j.err||"",v:v,c:j.c,bet:q.pari&&m.bet?1:0};
}
function vText(q,v){
  var k=qKind(q);
  if(k==="slider"&&typeof v==="number")return fmtSl(q.sl,v);
  return "";
}
function extendTime(){if(!G||G.phase!=="q")return;G.extra+=30000;send({t:"tx",i:G.i,add:30000});toast("+30 secondes");}

/* ─── correction ─── */
function reveal(){
  if(!G||G.phase!=="q")return;
  clearInterval(G.tick);clearTimeout(G.earlyT);G.earlyT=null;
  G.phase="rv";G.cur=false;
  var q=G.qs[G.i],lim=G.dur+G.extra,dur=lim/1000,on=online(),N=q.choices.length,dd=q.dd||null;
  send({t:"lk",i:G.i});
  var kd=qKind(q),dist=q.choices.map(function(){return 0;}),nAns=0,nOk=0,nPart=0,fast=null,rs={},sv=[],errC={},bonusN=0,nBet=0;
  var tPts=G.teams.map(function(){return {s:0,n:0,all:true};});
  var ha=G.hostAns,hostOn=G.mode==="boss"&&(!!(G.host&&G.host.on)||!!ha);
  var hostAbs=ha?ha.t+(G.hd||0)*1000:Infinity;   /* instant de la réponse du MJ, compté depuis l’ouverture de la question pour les aventuriers */
  var sumPts=0,nPl=0;
  plist().forEach(function(p){
    if(dd&&dd.ch.indexOf(p.id)<0){p.ans[G.i]={k:-1,ok:false,t:null,pts:0,an:0,pa:0,e:"",sp:1};return;}   /* spectateur d’un duel direct */
    var a=G.ans[p.id],pts=0,ok=false,bonus=0;
    if(a){
      nAns++;ok=a.ok;
      if(isPick(kd)&&a.k>=0&&a.k<N)dist[a.k]++;
      if(kd==="multi"&&a.v)a.v.forEach(function(t){if(t>=0&&t<N)dist[t]++;});
      if(kd==="slider"&&typeof a.v==="number")sv.push({v:a.v,c:a.ok?"ok":a.part>0?"pa":"ko"});
      if(!ok&&a.err)errC[a.err]=(errC[a.err]||0)+1;
      if(a.bet)nBet++;
      if(!ok&&a.part>0&&!a.bet){nPart++;pts=Math.round(ptsFor(a.t/1000,dur,0,G.pts)*kindMult(q)*a.part);}
      if(ok){
        p.streak++;nOk++;p.ok++;
        pts=Math.round(ptsFor(a.t/1000,dur,p.streak,G.pts)*kindMult(q))*(a.bet?2:1);
        if(a.rem<=3000&&lim>=10000)p.wire++;
        if(a.t<Math.min(0.25*lim,6000))p.fast++;
        if(!fast||a.t<fast.t)fast={p:p.p,t:a.t,team:p.team};
        /* Aventuriers VS MJ : +BOSS_BONUS pour qui a juste avant que le MJ ne réponde */
        if(hostOn&&a.t<hostAbs){bonus=BOSS_BONUS;bonusN++;pts+=bonus;}
      }else{
        p.streak=0;
        if(a.bet)pts=-Math.min(BET_LOSS,p.score);   /* pari perdu : on ne descend jamais sous zéro */
      }
      p.best=Math.max(p.best,p.streak);
    }else if(p.on){p.streak=0;}
    if(a||p.on){p.na++;}
    p.score+=pts;
    if(a||p.on){sumPts+=pts;nPl++;}
    p.ans[G.i]={k:a?a.k:-1,v:a?a.v:undefined,ok:ok,t:a?a.t:null,pts:pts,an:a?1:0,pa:a&&!ok&&a.part>0&&!a.bet?1:0,e:a&&!ok?a.err:"",bet:a&&a.bet?1:0,bo:bonus};
    if(G.mode==="duel"&&!dd&&p.team>=0&&p.team<tPts.length&&(a||p.on)){var tp=tPts[p.team];tp.s+=pts;tp.n++;if(!ok)tp.all=false;}
  });
  var denom=dd?dd.ch.length:on.length,rate=nAns?nOk/Math.max(nAns,denom):0;
  var boost=null,dmg=null,ddRes=null;
  if(G.mode==="duel"){
    if(dd){
      /* duel direct : le champion qui a juste, et le plus vite, offre à sa guilde DD_WIN points */
      var ca=G.ans[dd.ch[0]],cb=G.ans[dd.ch[1]],wa=ca&&ca.ok,wb=cb&&cb.ok,w=-1;
      if(wa&&wb)w=ca.t<=cb.t?0:1;else if(wa)w=0;else if(wb)w=1;
      boost=G.teams.map(function(){return 0;});
      ddRes={w:-1,nw:"",pw:"",a:dd.t[0],b:dd.t[1],na:dd.na};
      if(w>=0){var wt=dd.t[w];G.tscore[wt]+=DD_WIN;boost[wt]=DD_WIN;ddRes.w=wt;ddRes.nw=G.teams[wt].n;ddRes.pw=dd.pn[w];}
    }else boost=tPts.map(function(tp,k){var g=tp.n?Math.round(tp.s/tp.n)+(tp.all&&tp.n>=2?200:0):0;G.tscore[k]+=g;return g;});
  }
  if(G.mode==="boss"){
    /* v4.0 : même barème pour les deux camps. On compare la MOYENNE des points des aventuriers (bonus compris)
       aux points du MJ sur chaque question ; l’écart cumulé fait pencher les jauges, et la partie se joue sur ce cumul.
       Sans téléphone connecté, un MJ virtuel marque BOSS_VIRT points par question. */
    var b=G.boss,A=nPl?sumPts/nPl:0,M=0;
    if(hostOn){
      if(ha&&(ha.ok||ha.part>0)){
        var tabs=Math.min(lim,hostAbs)/1000;
        if(ha.ok){G.hostStreak=(G.hostStreak||0)+1;M=Math.round(ptsFor(tabs,dur,G.hostStreak,G.pts)*kindMult(q));}
        else{G.hostStreak=0;M=Math.round(ptsFor(tabs,dur,0,G.pts)*kindMult(q)*ha.part);}
      }else G.hostStreak=0;
    }else M=BOSS_VIRT;
    A=Math.round(A);
    var pc0=b.pc,pp0=b.pp;
    b.A+=A;b.M+=M;
    var cap=Math.max(1,G.qs.length)*BOSS_CAP;
    b.pc=100-100*clamp((b.M-b.A)/cap,0,1);b.pp=100-100*clamp((b.A-b.M)/cap,0,1);
    dmg={toProf:Math.max(0,pp0-b.pp),toClass:Math.max(0,pc0-b.pc),host:ha?(ha.ok?1:0):-1,a:A,m:M,bn:bonusN,virt:hostOn?0:1};
  }
  var ranks={};rankList().forEach(function(x,i){ranks[x.id]=i+1;});
  var stOf=function(a){return !a.an?-1:a.ok?1:a.pa?2:0;};
  var cur=plist().filter(function(p){return !dd||dd.ch.indexOf(p.id)>=0;});
  plist().forEach(function(p){var a=p.ans[G.i];rs[p.id]=[stOf(a),a.pts,p.score,p.streak,ranks[p.id],a.e||"",a.bet||0,a.bo||0];});
  if(G.host)rs[G.host.id]=[G.hostAns?(G.hostAns.ok?1:0):-1,0,0,0,0];
  var who=cur.map(function(p){var a=p.ans[G.i];return [p.p,stOf(a),p.team,vText(q,a.v)];});
  var h={who:who,host:G.host?(G.hostAns?(G.hostAns.ok?1:0):-1):null,i:G.i,q:q.q,qid:q.qid||"",titre:q.titre,id:q.id||"",kd:kd,ans:answerText(q),rate:rate,nAns:nAns,nOn:denom,nPart:nPart,dist:dist,fast:fast,choices:q.choices.map(function(c){return c.t;}),ansIdx:q.ans,expl:q.expl||"",src:q.src||"",errs:errC,
    sv:sv,nBet:nBet,dd:ddRes,boss:dmg};
  G.hist[G.i]=h;
  var rv={t:"rv",i:G.i,ans:q.ans,at:h.ans,ex:q.expl||"",sr:q.src||"",rate:Math.round(rate*100),rs:rs,cor:qCorr(q),pr:q.pari?1:0};
  if(ddRes)rv.dd={w:ddRes.w,nw:ddRes.nw,pw:ddRes.pw};
  if(G.mode==="duel"){rv.tm=G.tscore.slice();rv.tn=G.teams.map(function(t){return t.n;});}
  if(G.mode==="boss")rv.boss={pc:Math.round(G.boss.pc),pp:Math.round(G.boss.pp),dc:dmg.toClass,dp:dmg.toProf,h:dmg.host,a:dmg.a,m:dmg.m};
  if(G.mode==="solo")rv.top=rankList().slice(0,3).map(function(x){return [x.p,x.s];});
  G.lastRv=rv;send(rv);
  renderReveal(h,boost,dmg);liveReveal();
  snapshot();
}
function rankList(){
  if(!G)return [];
  return plist().map(function(p){var a=p.ans&&p.ans[G.i];return {id:p.id,p:p.p,s:p.score,dl:a?a.pts:0,ok:p.ok};}).sort(function(a,b){return b.s-a.s||b.ok-a.ok||a.p.localeCompare(b.p);});
}
/* correction projetée : la bonne réponse selon le format (avec la répartition des réponses quand elle a un sens) */
function revealChoicesHtml(q,h){
  var k=qKind(q),na=Math.max(1,h.nAns);
  if(k==="assoc"){
    return '<div class="g-assoc rv" style="grid-column:1/-1"><div class="ga-col">'+q.left.map(function(l,i){return '<div class="ga-it good"><span class="sh n">'+(i+1)+"</span><span>"+rt(l)+'</span><span class="eq">=</span><span class="sh">'+SHAPES[q.map[i]]+"</span><span>"+rt(q.choices[q.map[i]].t)+"</span></div>";}).join("")+"</div></div>";
  }
  if(k==="ordre"){
    return q.seq.map(function(d,j){return '<div class="gch a'+d+' good"><span class="sh n">'+(j+1)+"</span><span>"+rt(q.choices[d].t)+"</span></div>";}).join("");
  }
  return q.choices.map(function(c,j){var good=k==="multi"?q.set.indexOf(j)>=0:j===q.ans;return '<div class="gch a'+j+(good?" good":" dim")+'" style="--p:'+Math.round(100*h.dist[j]/na)+'%"><span class="sh">'+SHAPES[j]+"</span><span>"+rt(c.t)+'</span><span class="bar">'+h.dist[j]+"</span></div>";}).join("");
}
function renderReveal(h,boost,dmg){
  var q=G.qs[h.i];dmg=dmg||h.boss||null;
  $("g-timer").classList.add("hidden");$("g-choices").classList.remove("veil");
  var kd=qKind(q);
  if(wideKind(q)){
    $("g-choices").innerHTML='<div class="g-wide">'+scaleHtml(q.sl,{big:true,zone:{a:q.sl.ans,t:q.sl.tol},ans:q.sl.ans,dots:h.sv||[]})+"</div>";
    $("g-choices").style.gridTemplateColumns="";
  }else{
    $("g-choices").innerHTML=revealChoicesHtml(q,h);
    $("g-choices").style.gridTemplateColumns=q.choices.length===2?"repeat(2,minmax(0,1fr))":"";
  }
  var pct=Math.round(h.rate*100),r='<div class="rv-grid"><div class="rv-rate" style="--p:'+pct+'">'+pct+'%<small>de réussite</small></div><div>'+
    '<div class="rv-ans"><span class="lbl2">Bonne réponse</span><span class="val">'+rt(h.ans)+"</span></div>"+
    (h.nPart?'<div class="rv-part">'+ICO.star+h.nPart+" réponse"+(h.nPart>1?"s":"")+" presque juste"+(h.nPart>1?"s":"")+" (points partiels)</div>":"")+
    (h.nBet?'<div class="rv-part">'+ICO.dice+h.nBet+" pari"+(h.nBet>1?"s":"")+" posé"+(h.nBet>1?"s":"")+" sur cette question</div>":"")+
    (h.dd?'<div class="rv-part">'+ICO.swords+(h.dd.w<0?"Duel nul : personne ne marque.":esc(h.dd.pw)+" ("+esc(h.dd.nw)+") remporte le duel : +"+DD_WIN+" pts pour sa guilde")+"</div>":"")+
    (G.mode==="boss"&&dmg&&dmg.a!==undefined?'<div class="rv-part">'+ICO.shield+"Moyenne des aventuriers : <b>"+fmtInt(dmg.a)+"</b> pts · MJ : <b>"+fmtInt(dmg.m)+"</b> pts"+(dmg.virt?" (MJ virtuel : téléphone non connecté)":"")+(dmg.bn?" · bonus +"+BOSS_BONUS+" pour "+dmg.bn+" aventurier"+(dmg.bn>1?"s":"")+" plus rapide"+(dmg.bn>1?"s":"")+" que le MJ":"")+"</div>":"")+
    (kd==="slider"&&h.sv&&h.sv.length?'<div class="rv-part">Estimation médiane des aventuriers : <b>'+esc(fmtSl(q.sl,medianOf(h.sv.map(function(d){return d.v;}))))+"</b></div>":"")+errTopHtml(h.errs,h.nAns);
  if(h.expl)r+='<div class="rv-x">'+rt(h.expl)+(h.src?'<div class="rv-src">Source : '+esc(h.src)+"</div>":"")+"</div>";
  if(P.names!==false)r+=whoHtml(h);
  r+='<div class="rv-btns"><button type="button" class="btn btn-sm btn-soft" id="g-ansall">'+ICO.users+"Voir la réponse de chaque joueur"+(G.mode==="duel"?" (par guilde)":"")+"</button></div>";
  if(h.fast)r+='<div class="rv-fast"><span class="chip" style="background:var(--sun-l);color:#8A5A00">'+ICO.bolt+"Le plus rapide : "+esc(h.fast.p)+" ("+f(h.fast.t/1000,1)+" s)</span></div>";
  r+="</div></div>";
  $("g-rev").innerHTML=r;$("g-rev").classList.remove("hidden");$("g-qbox").classList.add("rv");
  $("g-scene").classList.remove("small");
  /* effets de la correction */
  if(h.nAns){
    if(pct>=80){fxStamp(pct===100?"Quête parfaite !":"Bravo, aventuriers !","#5C7A46","star");confetti({n:120});SND.good();}
    else if(pct>=50){fxStamp(pct+" % de réussite","#4D6F9A","check",1300);SND.pop();}
    else{fxStamp("Aïe… le donjon résiste","#A5483F","cross",1400);SND.bad();}
  }
  var sc=$("g-scene");
  if(G.mode==="duel")raceUpdate(sc,G.tscore,(h.i+1)/G.qs.length,boost);
  else if(G.mode==="boss"){bossUpdate(sc,G.boss,dmg);if(G.boss.pp<=0&&dmg&&dmg.toProf>0)setTimeout(function(){fxStamp("K.O. !","#7A5E96","star");confetti({rain:true,n:140});},1300);}
  else{leaderUpdate(sc,rankList(),G.prevRanks);var pr={};rankList().forEach(function(x,i){pr[x.id]=i;});G.prevRanks=pr;}
  var last=h.i+1>=G.qs.length;
  $("g-next").innerHTML=ICO.next+(last?"Voir les gagnants":"Question suivante");$("g-plus").disabled=true;
  updateAnswered();
  if(G.auto&&!ddAvailable())startAuto();
  ddButton();fitSoon(0);
}
function startAuto(){
  clearInterval(G.autoT);
  if(!G||G.phase!=="rv")return;
  var last=G.i+1>=G.qs.length,s=10;$("g-next").innerHTML=ICO.next+(last?"Gagnants":"Suivante")+" ("+s+")";
  G.autoT=setInterval(function(){s--;if(!G||G.phase!=="rv"||!G.auto){clearInterval(G&&G.autoT);return;}if(s<=0){clearInterval(G.autoT);nextQuestion();}else $("g-next").innerHTML=ICO.next+(last?"Gagnants":"Suivante")+" ("+s+")";},1000);
}
function autoBtn(){var b=$("g-auto");if(!b||!G)return;b.classList.toggle("on",!!G.auto);b.innerHTML=(G.auto?ICO.play:ICO.pause||ICO.clock)+"Auto : "+(G.auto?"oui":"non");}
$("g-auto").addEventListener("click",function(){
  if(!G)return;G.auto=!G.auto;autoBtn();
  if(G.phase==="rv"){if(G.auto)startAuto();else{clearInterval(G.autoT);var last=G.i+1>=G.qs.length;$("g-next").innerHTML=ICO.next+(last?"Voir les gagnants":"Question suivante");}}
  toast(G.auto?"Enchaînement automatique activé (10 s après chaque correction).":"Enchaînement automatique désactivé : vous passez à la suite quand vous voulez.");
});
/* fenêtre : réponse de chaque joueur (individuel, ou groupé par guilde en duel) */
function ansText(q,a){
  if(!a||!a.an)return "—";
  var kk=qKind(q);
  if(kk==="slider")return typeof a.v==="number"?"≈ "+fmtSl(q.sl,a.v):"";
  if(kk==="multi")return a.v&&a.v.length?a.v.map(function(x){return letterOf(x);}).join(", "):"—";
  if(kk==="ordre")return a.v&&a.v.length?a.v.map(function(x){return letterOf(x);}).join(" → "):"—";
  if(kk==="assoc")return a.v?a.v.map(function(x,i){return (i+1)+"→"+(x>=0?letterOf(x):"?");}).join("  "):"—";
  return q.choices[a.k]?q.choices[a.k].t:"—";
}
function openAnswers(i){
  if(!G)return;i=i===undefined?G.i:i;
  var q=G.qs[i],h=G.hist[i];if(!q||!h)return;
  $("ma-h").textContent="Réponses — question "+(i+1)+" / "+G.qs.length;
  $("ma-q").innerHTML=rt(q.q)+'<div class="small muted" style="margin-top:.3rem">Bonne réponse : '+rt(h.ans)+(h.nBet?" · ✦ = pari":"")+"</div>";
  var row=function(p){var a=p.ans&&p.ans[i],st=!a||!a.an?"na":a.ok?"ok":a.pa?"pa":"ko",lab={ok:"✓ juste",ko:"✗ faux",pa:"★ presque",na:"— pas de réponse"}[st];
    return '<tr class="'+st+'"><td><b>'+esc(p.p)+'</b></td><td>'+rt(ansText(q,a))+'</td><td class="st">'+lab+'</td><td class="pt">'+(a&&a.t!==null&&a.an?f(a.t/1000,1)+" s":"")+'</td><td class="pt">'+(a&&a.pts?(a.pts>0?"+":"−")+fmtInt(Math.abs(a.pts))+(a.bet?" ✦":"")+(a.bo?" (dont +"+a.bo+")":""):"0")+"</td></tr>";};
  var head='<table class="ma-t"><tr><th>Joueur</th><th>Réponse</th><th>Résultat</th><th>Temps</th><th>Points</th></tr>';
  var ps=plist().sort(function(a,b){var x=a.ans&&a.ans[i],y=b.ans&&b.ans[i];return ((y&&y.pts)||0)-((x&&x.pts)||0)||a.p.localeCompare(b.p,"fr");});
  var html="";
  if(G.mode==="duel"){
    G.teams.forEach(function(t,k){var mem=ps.filter(function(p){return p.team===k;});if(!mem.length)return;var ok=mem.filter(function(p){return p.ans[i]&&p.ans[i].ok;}).length;
      html+='<div class="ma-team"><h3><i style="background:'+TEAMS[k].c+'"></i>'+esc(t.n)+' <small class="muted">'+ok+" / "+mem.length+" justes</small></h3>"+head+mem.map(row).join("")+"</table></div>";});
    var none=ps.filter(function(p){return p.team<0||p.team>=G.teams.length;});if(none.length)html+='<div class="ma-team"><h3>Sans guilde</h3>'+head+none.map(row).join("")+"</table></div>";
  }else html=head+ps.map(row).join("")+"</table>";
  if(G.host&&h.host!==null&&h.host!==undefined)html+='<p class="small muted" style="margin-top:.6rem">Téléphone du MJ : '+(h.host===1?"juste":h.host===0?"faux":"pas de réponse")+".</p>";
  $("ma-list").innerHTML=html||'<p class="muted">Aucun joueur.</p>';
  openModal("m-ans");
}
$("g-rev").addEventListener("click",function(e){if(e.target.closest("#g-ansall"))openAnswers();});
function renderRevealFromHist(i){var h=G.hist[i];if(!h)return;showGameScreen();$("g-qn").textContent="Question "+(i+1)+" / "+G.qs.length;setGameQ(G.qs[i]);$("g-meta").innerHTML=metaHtml(G.qs[i]);renderReveal(h,null,null);}
function medianOf(a){var s=a.slice().sort(function(x,y){return x-y;}),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):0;}
/* erreur type la plus fréquente sur cette question (diagnostic pour le MJ) */
function errTopHtml(errs,nAns){
  var ks=Object.keys(errs||{}).filter(function(k){return ERR[k]&&k!=="autre";}).sort(function(a,b){return errs[b]-errs[a];});
  if(!ks.length)return "";
  var k=ks[0];if(errs[k]<2&&nAns>4)return "";
  return '<div class="rv-diag">'+ICO.bolt+"<span><b>Erreur la plus fréquente</b> ("+errs[k]+" aventurier"+(errs[k]>1?"s":"")+") : "+esc(ERR[k].l)+"</span></div>";
}
$("g-plus").addEventListener("click",extendTime);
$("g-next").addEventListener("click",function(){
  if(!G)return;
  if(G.phase==="q"){reveal();return;}
  if(G.phase==="rv"){clearInterval(G.autoT);nextQuestion();}
});
var SHORT_T=null;
$("g-short").addEventListener("click",function(){
  var b=this;
  if(b.getAttribute("data-arm")!=="1"){
    b.setAttribute("data-arm","1");b.classList.add("armed");b.textContent="Confirmer : terminer";
    clearTimeout(SHORT_T);SHORT_T=setTimeout(function(){b.removeAttribute("data-arm");b.classList.remove("armed");b.textContent="Écourter";},5000);return;
  }
  clearTimeout(SHORT_T);b.removeAttribute("data-arm");b.classList.remove("armed");b.textContent="Écourter";
  shorten();
});
function shorten(){
  if(!G||G.phase==="end"||G.phase==="lobby")return;
  clearInterval(G.tick);clearInterval(G.autoT);clearTimeout(G.autoT);clearTimeout(G.earlyT);G.earlyT=null;
  if(G.dvT){clearInterval(G.dvT);G.dvT=null;}if(G.dv){clearTimeout(G.dv.early);G.dv.over=true;G.dv=null;if(G.phase==="dv"||G.phase==="dvr")G.phase="rv";}$("g-dd").classList.add("hidden");
  $("g-cd").classList.add("hidden");$("g-rules").classList.add("hidden");
  if(G.phase==="q"){G.i--;G.cur=false;send({t:"lk",i:G.i+1});}   /* la question en cours ne compte pas */
  G.phase="rv";
  if(!G.hist.filter(function(h){return h;}).length){   /* rien n’a été joué : retour au donjon */
    G.phase="lobby";G.lk=false;G.i=-1;pushLobby();renderLobby();show("s-lobby");toast("Partie arrêtée avant la première correction : retour au donjon.");return;
  }
  endGame(true);
}

/* ─── qui a bien / mal répondu (après chaque question) ─── */
function whoHtml(h){
  var ok=[],ko=[],na=[],pa=[];
  (h.who||[]).forEach(function(w){var T=G.mode==="duel"&&w[2]>=0&&G.teams[w[2]]?TEAMS[w[2]]:null,c='<span class="wchip'+(w[1]===1?" ok":w[1]===2?" pa":w[1]===0?" ko":" na")+'"'+(T?' style="border-color:'+T.c+'"':"")+">"+esc(w[0])+(w[3]&&h.kd==="slider"?' <small>'+esc(w[3])+"</small>":"")+"</span>";(w[1]===1?ok:w[1]===2?pa:w[1]===0?ko:na).push(c);});
  var hs="";
  if(h.host!==null&&h.host!==undefined)hs='<span class="wchip host '+(h.host===1?"ok":h.host===0?"ko":"na")+'">Le MJ</span>';
  return '<div class="who"><div class="wl"><b class="wt ok">'+ICO.check+"Juste ("+ok.length+")</b>"+(ok.join("")||'<span class="muted small">personne</span>')+'</div><div class="wl"><b class="wt ko">'+ICO.cross+"Faux ("+ko.length+")</b>"+(ko.join("")||'<span class="muted small">personne</span>')+"</div>"+
    (pa.length?'<div class="wl"><b class="wt pa">'+ICO.star+"Presque ("+pa.length+")</b>"+pa.join("")+"</div>":"")+
    (na.length?'<div class="wl"><b class="wt na">'+ICO.clock+"Sans réponse ("+na.length+")</b>"+na.join("")+"</div>":"")+(hs?'<div class="wl"><b class="wt">Téléphone du MJ</b>'+hs+"</div>":"")+"</div>";
}
/* ─── écran des règles avant la partie ─── */
function showRules(cb){
  var box=$("rules-box");
  $("g-qn").textContent="Question 1 / "+G.qs.length;$("g-q").innerHTML="";$("g-fig").innerHTML="";$("g-qbox").classList.remove("hasfig");$("g-media").classList.add("hidden");$("g-choices").innerHTML="";$("g-meta").innerHTML="";$("g-rev").classList.add("hidden");
  $("g-timer").classList.add("hidden");$("g-next").innerHTML=ICO.play+"Démarrer";$("g-ans").textContent="";
  /* formats présents dans la partie : seules leurs règles sont affichées */
  var fk=G.qs.some(function(q){return qKind(q)==="slider";}),pr=G.qs.some(function(q){return q.pari;}),ml=G.qs.some(function(q){return isList(qKind(q));}),dd=G.mode==="duel";
  box.innerHTML=rulesHtml(G.mode,{sm:G.pts,rd:G.read,hd:G.hd,hpen:G.hpen,fk:fk,pr:pr,ml:ml,dd:dd})+'<div class="rules-act"><button type="button" class="btn btn-ghost" id="ru-back">Retour au donjon</button><button type="button" class="btn btn-go btn-xl" id="ru-go">'+ICO.play+"C’est parti !</button></div>";
  $("g-rules").classList.remove("hidden");
  send({t:"ru",m:G.mode,sm:G.pts,rd:G.read,hd:G.hd,hpen:0,fk:fk?1:0,pr:pr?1:0,ml:ml?1:0,dd:dd?1:0});fitSoon(0);
  $("ru-go").onclick=function(){$("g-rules").classList.add("hidden");fitSoon(0);cb();};
  $("ru-back").onclick=function(){$("g-rules").classList.add("hidden");G.phase="lobby";G.lk=false;pushLobby();renderLobby();show("s-lobby");};
}

/* ─── v3.6 : énoncé + figure ; « Agrandir le média » ─── */
function setGameQ(q){
  closeMedia();try{$("g-qbox").style.setProperty("--tc",themeColor(q.id));}catch(e){}
  $("g-q").innerHTML=rt(q.q);
  var fb=figBlock(q.fig);$("g-fig").innerHTML=fb;
  $("g-qbox").classList.toggle("hasfig",!!fb);
  $("g-media").classList.remove("hidden");
  G.mq=q;
}
$("g-media").innerHTML=ICO.full+"Agrandir la question";
$("g-media").addEventListener("click",openMedia);
$("g-fig").addEventListener("click",openMedia);
$("mm-x").addEventListener("click",closeMedia);
$("m-media").addEventListener("click",function(e){if(e.target===this||e.target.id==="mm-b")closeMedia();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("m-media").classList.contains("hidden"))closeMedia();});
window.addEventListener("resize",function(){if(!$("m-media").classList.contains("hidden"))fitMedia();});
function openMedia(){
  var q=G&&G.mq;if(!q)return;
  $("mm-n").textContent=$("g-qn").textContent;
  $("mm-t").innerHTML="<div>"+rt(q.q)+"</div>";
  var fb=figBlock(q.fig);$("mm-f").innerHTML=fb;
  $("mm-b").classList.toggle("nofig",!fb);
  $("mm-b").classList.toggle("svg",!!(fb&&fb.indexOf("<svg")>=0));
  $("m-media").classList.remove("hidden");
  fitMedia();setTimeout(fitMedia,120);
}
function closeMedia(){var m=$("m-media");if(m)m.classList.add("hidden");}
/* le texte (et un tableau ou un programme) prend la plus grande taille qui tient dans sa zone, formules entières */
function fitBox(el,lo,hi){
  if(!el||!el.innerHTML)return;
  var ok=function(){
    if(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)return false;
    var r=el.getBoundingClientRect(),ks=el.querySelectorAll(".katex");
    for(var i=0;i<ks.length;i++){var k=ks[i].getBoundingClientRect();if(k.right>r.right+1||k.left<r.left-1)return false;}
    return true;};
  var best=lo;
  for(var i=0;i<12;i++){var mid=(lo+hi)/2;el.style.fontSize=mid+"px";if(ok()){best=mid;lo=mid;}else hi=mid;}
  el.style.fontSize=best+"px";
}
function fitMedia(){
  if($("m-media").classList.contains("hidden"))return;
  /* figure : la colonne prend la largeur que permet la hauteur disponible (sans déformation) */
  var b=$("mm-b"),sv=$("mm-f").querySelector("svg");b.style.gridTemplateColumns="";b.style.gridTemplateRows="";
  if(sv&&!b.classList.contains("nofig")){
    var vb=(sv.getAttribute("viewBox")||"0 0 4 3").split(/\s+/),ar=(+vb[2]||4)/(+vb[3]||3),W=b.clientWidth,H=b.clientHeight;
    if(W>=H){var fw=Math.min(H*ar,W*0.74);b.style.gridTemplateColumns="minmax(0,1fr) "+Math.round(fw)+"px";}
    else{var fh=Math.min(W/ar,H*0.72);b.style.gridTemplateRows="minmax(0,1fr) "+Math.round(fh)+"px";}
  }
  fitBox($("mm-t"),12,Math.max(40,window.innerHeight*($("mm-b").classList.contains("nofig")?0.16:0.09)));
  if(!$("mm-b").classList.contains("svg"))fitBox($("mm-f"),12,Math.max(40,window.innerHeight*0.12));
}
/* place restante en bas pendant une question : les propositions s’agrandissent */
FIT.unfill=function(){var c=$("g-choices");if(c)c.style.minHeight="";};
FIT.fill=function(gap){
  if(!G||G.phase!=="q"||!$("g-rules").classList.contains("hidden"))return;
  var c=$("g-choices");if(!c||!c.children.length||!visible(c))return;
  c.style.minHeight=(c.getBoundingClientRect().height+Math.min(gap,window.innerHeight*0.35))+"px";
};
/* barre d’outils du jeu sur une seule ligne : elle rétrécit un peu si la fenêtre est étroite */
FIT.pre=function(){
  var t=document.querySelector("#s-game .g-top");if(!t||!visible(t))return;
  var st=document.documentElement.style,z=1;st.setProperty("--gz","1");
  var row=function(){var k=[].filter.call(t.children,visible);if(!k.length)return true;var c=function(e){var r=e.getBoundingClientRect();return (r.top+r.bottom)/2;},y=c(k[0]);return k.every(function(e){return Math.abs(c(e)-y)<10;});};
  while(!row()&&z>0.66){z-=0.06;st.setProperty("--gz",String(z));}
};
