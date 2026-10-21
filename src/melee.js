/* ═══════════════════════════════════════════════════════════════
   MÊLÉE — partie entre amis, sans MJ
   Le téléphone du créateur fait tourner la partie (à la place du MJ) et joue aussi.
   Il envoie aux autres les mêmes messages que le MJ : l’écran de question, de correction
   et de podium est donc celui de la page joueur. Rien n’est stocké en base : seul le pseudo
   est connu de la salle, comme pour les autres modes.
═══════════════════════════════════════════════════════════════ */
var MEL={pending:false,eng:null,pick:false,dark:false,qr:"",wl:null};
var MEL_MAX=8,MEL_NQ=[5,10,15,20],MEL_IN={hi:1,an:1,bye:1,aw:1,mp:1,nx:1,rm:1};
var MEL_PAL=["#B8892F","#8C8C96","#A5693F","#5C7A46","#7A5E96","#4D6F9A","#D9606A","#2E9E7E"];
function melUrl(code){return location.href.split("#")[0].split("?")[0]+"?c="+code;}

/* ─── canal : le créateur reçoit aussi ses propres messages (envoyés par lui à lui-même) ─── */
function melWrap(ch){
  return {
    send:function(m){
      ch.send(m);
      if(!MEL.eng)return;
      setTimeout(function(){
        if(!MEL.eng||!S.ch)return;
        if(MEL_IN[m.t])melRecv(m);else onMsg(m);
      },0);
    },
    close:function(){ch.close();}
  };
}
function melOn(){var E=MEL.eng;return E?Object.keys(E.players).map(function(k){return E.players[k];}).filter(function(p){return p.on;}):[];}
function melAct(){return melOn().filter(function(p){return Date.now()-p.last<35000;});}
function melPl(){var E=MEL.eng;return Object.keys(E.players).map(function(k){return E.players[k];});}
function melNq(){
  var v=melOn().map(function(p){return p.nq;}).sort(function(a,b){return a-b;});
  if(!v.length)return 10;
  var n=v.length,m=n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2;
  return Math.max(5,Math.min(20,Math.ceil(m/5)*5));
}

/* ═══ 1. CRÉATION (côté créateur) ═══ */
MEL.create=function(pseudo,btn){
  var out=null,pid=null;
  function fail(msg){
    btn.disabled=false;btn.textContent="Créer la mêlée";psErr(msg);
    if(out)rpc("lm_close_room",{p_code:out.code,p_token:out.token}).catch(function(){});
    if(S.ch){try{S.ch.close();}catch(e){}S.ch=null;}
    MEL.eng=null;
  }
  btn.disabled=true;btn.textContent="Création…";
  rpc("lm_create_room",{p_mode:"melee",p_max:MEL_MAX}).then(function(r){
    if(!r||!r.ok)throw new Error(r&&r.err==="too_many_rooms"?"Trop de parties en cours : réessaie dans un moment.":"Impossible de créer la mêlée.");
    out=r;return rpc("lm_check",{p_code:r.code});
  }).then(function(c){
    if(!c||c.mode!=="melee")throw new Error("La base n’est pas à jour : relance le script lore_master.sql dans Supabase (mode « Mêlée »).");
    return rpc("lm_join",{p_code:out.code,p_pseudo:pseudo,p_player:null});
  }).then(function(j){
    if(!j||!j.ok)throw new Error(JOIN_ERR[j&&j.err]||"Impossible d’entrer dans la mêlée.");
    pid=j.id;
    S.host=false;S.code=out.code;S.pid=j.id;S.pseudo=j.pseudo;S.mode="solo";S.melee=true;S.team=-1;S.score=0;
    S.mel={th:null,nq:MEL_NQ[1],rd:false};MEL.pick=false;
    store.set("pseudo",j.pseudo);store.del("sess");
    if(S.ch){S.ch.close();S.ch=null;}
    var E={code:out.code,token:out.token,hid:j.id,phase:"lobby",lk:false,er:"",players:{},qs:[],i:-1,ans:{},nxt:{},hist:[]};
    E.players[j.id]=melNewPlayer(j.id,j.pseudo);
    MEL.eng=E;
    return openChannel(out.code,onMsg,onNet);
  }).then(function(ch){
    S.ch=melWrap(ch);S.phase="lobby";
    $("m-leave").classList.remove("hidden");
    MEL.pending=false;btn.disabled=false;btn.textContent="Entrer dans le donjon";
    var E=MEL.eng;
    E.hb=setInterval(function(){if(S.ch)S.ch.send({t:"hb"});melPrune();},10000);
    E.ping=setInterval(function(){
      rpc("lm_host_ping",{p_code:E.code,p_token:E.token,p_status:E.phase==="lobby"?"open":"playing",p_mode:null}).catch(function(){});
      rpc("lm_player_ping",{p_player:S.pid}).catch(function(){});
    },40000);
    try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(l){MEL.wl=l;},function(){});}catch(e){}
    hello();renderLobby();show("s-lobby");
    setTimeout(melSendMp,300);
  }).catch(function(e){
    var m=e&&e.message;
    fail(m&&!/^(config|timeout)$/.test(m)&&!/Failed|Network|Load failed/.test(m)&&/[ a-zé]{12}/.test(m)?m:netErrText(e));
  });
};
MEL.stop=function(){
  var E=MEL.eng;if(!E)return;
  MEL.eng=null;
  try{if(S.ch)S.ch.send({t:"x"});}catch(e){}
  clearInterval(E.tick);clearInterval(E.hb);clearInterval(E.ping);clearTimeout(E.early);clearTimeout(E.nxtT);clearTimeout(E.pushT);
  rpc("lm_close_room",{p_code:E.code,p_token:E.token}).catch(function(){});
  try{if(MEL.wl){MEL.wl.release();MEL.wl=null;}}catch(e){}
};
function melNewPlayer(id,p){return {id:id,p:p,on:true,th:null,nq:MEL_NQ[1],rd:false,score:0,ok:0,na:0,streak:0,best:0,wire:0,fast:0,joined:Date.now(),last:Date.now(),away:false};}
/* joueurs silencieux depuis plus d’une minute : retirés du salon (pas en pleine partie) */
function melPrune(){
  var E=MEL.eng;if(!E||E.phase!=="lobby"||E.lk)return;
  var ch=false;melPl().forEach(function(p){if(p.on&&p.id!==E.hid&&Date.now()-p.last>70000){p.on=false;ch=true;}});
  if(ch){melPush();melCheckStart();}
}

/* ═══ 2. MESSAGES REÇUS PAR L’HÔTE ═══ */
function melRecv(m){
  var E=MEL.eng;if(!E||!m||typeof m!=="object")return true;
  var id=typeof m.id==="string"?m.id.slice(0,40):null;if(!id)return true;
  if(m.t==="hi"){melHi(id,m.p);return true;}
  var p=E.players[id];if(!p)return true;
  p.last=Date.now();
  if(m.t==="mp"){
    if(E.phase==="lobby"&&!E.lk){
      var th=String(m.th||"");
      p.th=(th==="?"||(ITEM_BY_ID[th]&&!HIDDEN[th]))?th:null;
      var nq=+m.nq;if(MEL_NQ.indexOf(nq)>=0)p.nq=nq;
      p.rd=!!m.rd&&!!p.th;
      melPush();melCheckStart();
    }
  }else if(m.t==="an")melAnswer(p,m);
  else if(m.t==="nx")melNext(p,m);
  else if(m.t==="bye"){p.on=false;p.away=false;melPush();melAfterLeave();}
  else if(m.t==="aw"){p.away=!!m.v;p.on=true;}
  else if(m.t==="rm"){if(E.phase==="end")melRematch();}
  return true;
}
function melHi(id,raw){
  var E=MEL.eng,c=checkPseudo(raw),p=E.players[id];
  if(!c.ok){S.ch.send({t:"no",to:id,why:"pseudo"});return;}
  if(p){p.p=c.p;p.on=true;p.away=false;p.last=Date.now();melWelcome(p);melPush();return;}
  if(E.phase!=="lobby"||E.lk){S.ch.send({t:"no",to:id,why:"started"});return;}
  if(melPl().some(function(x){return x.on&&x.p.toLowerCase()===c.p.toLowerCase();})){S.ch.send({t:"no",to:id,why:"pseudo"});return;}
  if(melOn().length>=MEL_MAX){S.ch.send({t:"no",to:id,why:"full"});return;}
  p=melNewPlayer(id,c.p);E.players[id]=p;
  melWelcome(p);melPush();
  if(E.phase==="lobby")SND.pop();
}
function melWelcome(p){
  var E=MEL.eng,w={t:"wt",to:p.id,ph:(E.phase==="prep"||E.phase==="cd")?"lobby":E.phase,m:"solo",p:p.p,sc:p.score,team:-1,lb:melLb()};
  if(E.phase==="q"){
    var q=E.qs[E.i];w.q=melQPayload(q,E.i);w.q.rem=Math.max(0,E.dur-(Date.now()-E.qStart));w.done=!!E.ans[p.id];
  }
  if(E.phase==="rv"&&E.lastRv)w.rv=E.lastRv;
  if(E.phase==="end"&&E.lastEn)w.en=E.lastEn;
  S.ch.send(w);
}
function melLb(){
  var E=MEL.eng;
  return {t:"lb",m:"solo",ml:1,hid:E.hid,pl:melOn().map(function(p){return [p.id,p.p,-1,p.th||"",p.nq,p.rd?1:0];}),mx:MEL_MAX,lk:E.lk?1:0,nq:melNq(),er:E.er||"",ph:(E.phase==="lobby"||E.phase==="prep")?"lobby":E.phase};
}
function melPush(){var E=MEL.eng;if(!E)return;clearTimeout(E.pushT);E.pushT=setTimeout(function(){if(MEL.eng&&S.ch)S.ch.send(melLb());},150);}

/* ═══ 3. DÉPART : quand tous les aventuriers sont prêts ═══ */
function melCheckStart(){
  var E=MEL.eng;if(!E||E.phase!=="lobby"||E.lk)return;
  var on=melOn();
  if(on.length<2||!on.every(function(p){return p.rd&&p.th;}))return;
  E.lk=true;E.er="";E.phase="prep";melPush();
  setTimeout(function(){if(MEL.eng===E)melPrepare();},1200);   /* laisse le temps de voir « Prêt » chez chacun */
}
function melUnlock(msg){var E=MEL.eng;if(!E)return;E.lk=false;E.phase="lobby";E.er=msg||"";melPush();}
function melPrepare(){
  var E=MEL.eng,on=melOn(),real={};
  on.forEach(function(p){if(p.th&&p.th!=="?")real[p.th]=1;});
  var pool=BANK.filter(function(it){return !HIDDEN[it.id]&&!it.dark;}).map(function(it){return it.id;});
  on.forEach(function(p){
    if(p.th==="?"){var c=pool.filter(function(id){return !real[id];});if(!c.length)c=pool;real[c[Math.floor(Math.random()*c.length)]]=1;}
  });
  var ids=Object.keys(real),n=melNq();
  ensureThemes(ids,function(err){
    if(MEL.eng!==E)return;
    if(err){melUnlock("Chargement des questions impossible : vérifie la connexion.");return;}
    var ctx={types:{c:1,v:1,s:1,i:1,h:1,w:1,m:1,o:1,a:1},diffs:null,dark:ids.some(function(id){return !!(ITEM_BY_ID[id]&&ITEM_BY_ID[id].dark);})};
    var seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0,list=drawQuestions(ids,n,ctx,seed,null);
    if(!list.length){melUnlock("Aucune question avec ces thèmes.");return;}
    list.forEach(function(q,i){q.seed=seed+i;});
    E.qs=list;E.i=-1;E.hist=[];E.lastRv=null;E.lastEn=null;
    melPl().forEach(function(p){p.score=0;p.ok=0;p.na=0;p.streak=0;p.best=0;p.wire=0;p.fast=0;});
    E.phase="cd";
    S.ch.send({t:"cd",n:3,N:list.length});
    rpc("lm_host_ping",{p_code:E.code,p_token:E.token,p_status:"playing",p_mode:null}).catch(function(){});
    setTimeout(function(){if(MEL.eng===E&&E.phase==="cd")melNextQuestion();},3500);
  });
}

/* ═══ 4. LES QUESTIONS ═══ */
function melQPayload(q,i){
  var E=MEL.eng,o=qPublic(q);o.t="q";o.i=i;o.N=E.qs.length;o.dur=E.dur;
  if(E.dbl&&i===E.i)o.dbl=1;
  return o;
}
function melNextQuestion(){
  var E=MEL.eng;if(!E||E.phase==="end")return;
  clearTimeout(E.nxtT);E.advancing=false;
  E.i++;
  if(E.i>=E.qs.length){melEnd();return;}
  var q=E.qs[E.i];
  E.phase="q";E.ans={};E.nxt={};E.early=null;
  E.dur=dureeQuestion(q,0)*1000;E.qStart=Date.now();
  E.dbl=E.qs.length>=3&&E.i===E.qs.length-1;
  S.ch.send(melQPayload(q,E.i));
  clearInterval(E.tick);E.tick=setInterval(melTick,250);
}
function melTick(){
  var E=MEL.eng;if(!E||E.phase!=="q")return;
  var el=Date.now()-E.qStart,act=melAct();
  if(!act.length||act.every(function(p){return E.ans[p.id];})){
    if(!E.early)E.early=setTimeout(function(){if(MEL.eng===E&&E.phase==="q")melReveal();},act.length?900:300);
  }
  if(el>=E.dur+800)melReveal();
}
function melAnswer(p,m){
  var E=MEL.eng;if(E.phase!=="q"||m.i!==E.i||E.ans[p.id])return;
  var q=E.qs[E.i],el=Math.max(0,Date.now()-E.qStart);
  if(el>E.dur+1500)return;
  var ms=+m.ms;if(!(ms>=0))ms=el;
  var t=clamp(Math.min(el,Math.max(ms,el-2500)),0,E.dur);
  var v=cleanAns(q,m.v),j=judge(q,{k:m.k|0,v:v});
  E.ans[p.id]={ok:j.ok,part:j.part||0,t:t,rem:E.dur-el,err:j.err||"",k:j.k,v:v};
  melTick();
}
function melReveal(){
  var E=MEL.eng;if(!E||E.phase!=="q")return;
  clearTimeout(E.early);E.early=null;clearInterval(E.tick);
  E.phase="rv";
  var q=E.qs[E.i],dur=E.dur/1000,mult=E.dbl?2:1,on=melOn(),nAns=0,nOk=0,fast=null;
  melPl().forEach(function(p){
    var a=E.ans[p.id],pts=0,st=-1;
    if(a){
      nAns++;
      if(a.ok){
        st=1;p.streak++;p.ok++;nOk++;p.best=Math.max(p.best,p.streak);
        pts=ptsFor(a.t/1000,dur,p.streak,"vite")*mult;
        if(a.t<Math.min(0.25*E.dur,6000))p.fast++;
        if(a.rem<=3000&&E.dur>=10000)p.wire++;
        if(!fast||a.t<fast.t)fast={p:p.p,t:a.t};
      }else if(a.part>0){st=2;p.streak=0;pts=Math.round(ptsFor(a.t/1000,dur,0,"vite")*a.part)*mult;}
      else{st=0;p.streak=0;}
    }else if(p.on)p.streak=0;
    if(a||p.on)p.na++;
    p.gain=Math.round(pts);p.st=st;p.score+=p.gain;
  });
  var rank=melRank(),rs={},ranks={};
  rank.forEach(function(p,i){ranks[p.id]=i+1;});
  melPl().forEach(function(p){var a=E.ans[p.id];rs[p.id]=[p.st,p.gain,p.score,p.streak,ranks[p.id],a&&!a.ok?a.err:"",0,0];});
  var rate=nAns?nOk/Math.max(nAns,on.length):0;
  E.hist[E.i]={rate:rate};
  var rv={t:"rv",i:E.i,ans:q.ans,at:answerText(q),ex:q.expl||"",sr:q.src||"",rate:Math.round(rate*100),rs:rs,cor:qCorr(q),pr:0,
    lbd:rank.map(function(p){return [p.p,p.score,p.gain,ranks[p.id],p.st,p.id];}),fast:fast?[fast.p,Math.round(fast.t/100)/10]:null,dbl:E.dbl?1:0,last:E.i+1>=E.qs.length?1:0};
  E.lastRv=rv;S.ch.send(rv);
  E.minAt=Date.now()+2500;
  clearTimeout(E.nxtT);E.nxtT=setTimeout(function(){if(MEL.eng===E&&E.phase==="rv")melNextQuestion();},25000);
}
function melRank(){return melPl().sort(function(a,b){return b.score-a.score||b.ok-a.ok||a.p.localeCompare(b.p);});}
function melNext(p,m){
  var E=MEL.eng;if(E.phase!=="rv"||m.i!==E.i)return;
  E.nxt[p.id]=1;melCheckNext();
}
function melCheckNext(){
  var E=MEL.eng;if(!E||E.phase!=="rv"||E.advancing)return;
  var act=melAct();
  if(act.every(function(p){return E.nxt[p.id];})){
    E.advancing=true;clearTimeout(E.nxtT);
    E.nxtT=setTimeout(function(){if(MEL.eng===E&&E.phase==="rv")melNextQuestion();},Math.max(300,E.minAt-Date.now()));
  }
}
function melAfterLeave(){
  var E=MEL.eng;if(!E)return;
  melPush();
  if(E.phase==="lobby")melCheckStart();else if(E.phase==="q")melTick();else if(E.phase==="rv")melCheckNext();
}

/* ═══ 5. FIN, REVANCHE ═══ */
function melEnd(){
  var E=MEL.eng;if(!E)return;
  clearInterval(E.tick);clearTimeout(E.nxtT);
  E.phase="end";
  var rank=melRank(),nq=E.hist.filter(function(h){return h;}).length;
  var pod=rank.slice(0,3).map(function(p,i){return {name:p.p,sub:fmtInt(p.score)+" pts",color:MEL_PAL[i],ini:initials(p.p)};});
  var rk={};rank.forEach(function(p,i){rk[p.id]=[i+1,p.score,p.ok,nq,p.best,0,p.wire];});
  var tie=rank.length>1&&rank[0].score===rank[1].score;
  var en={t:"en",m:"solo",ml:1,pod:pod,rk:rk,nq:nq,np:rank.length,title:rank.length?(tie?"Égalité au sommet !":"Bravo "+rank[0].p+" !"):"Fin de la partie"};
  E.lastEn=en;S.ch.send(en);
}
function melRematch(){
  var E=MEL.eng;if(!E)return;
  E.phase="lobby";E.lk=false;E.er="";E.qs=[];E.i=-1;E.lastRv=null;E.lastEn=null;E.hist=[];
  melPl().forEach(function(p){
    if(!p.on){delete E.players[p.id];return;}
    p.score=0;p.ok=0;p.na=0;p.streak=0;p.best=0;p.wire=0;p.fast=0;p.rd=false;
  });
  S.ch.send(melLb());
  rpc("lm_host_ping",{p_code:E.code,p_token:E.token,p_status:"open",p_mode:null}).catch(function(){});
}

/* ═══════════════════════════════════════════════════════════════
   CÔTÉ JOUEUR (tout le monde, créateur compris)
═══════════════════════════════════════════════════════════════ */
function melSendMp(){
  var m=S.mel;if(!m||!S.ch||!S.melee)return;
  ((S.lb&&S.lb.pl)||[]).forEach(function(x){if(x[0]===S.pid){x[3]=m.th||"";x[4]=m.nq;x[5]=m.rd?1:0;}});
  sendAns({t:"mp",th:m.th||"",nq:m.nq,rd:m.rd?1:0});
}
function melThName(id){var it=ITEM_BY_ID[id];return id==="?"?"Surprise":it?it.titre:"—";}
function melQrSvg(cell){
  try{var qr=qrcode(0,"M");qr.addData(melUrl(S.code));qr.make();return qr.createSvgTag({cellSize:cell,margin:0,scalable:true});}catch(e){return "";}
}
function melRenderLobby(){
  if(MEL.pick)return;
  var lb=S.lb||{pl:[],mx:MEL_MAX},me=S.mel||(S.mel={th:null,nq:MEL_NQ[1],rd:false}),pl=lb.pl||[],lk=!!lb.lk;
  $("lb-me").textContent=S.pseudo+" · mêlée "+S.code;
  $("lb-n").textContent=pl.length+" / "+(lb.mx||MEL_MAX);
  var h='<div class="card mel-inv"><div class="mel-qr" id="mel-qr" role="button" tabindex="0" aria-label="Agrandir le QR code">'+melQrSvg(4)+'</div><div><h2>Invite tes amis</h2><p class="muted small">Ils scannent ce QR code (touche-le pour l’agrandir) ou tapent <b class="mel-code">'+esc(S.code)+'</b> sur la page joueur.</p><button type="button" class="btn btn-soft btn-sm" id="mel-qrbtn">Agrandir le QR code</button></div></div>';
  var it=me.th&&me.th!=="?"?ITEM_BY_ID[me.th]:null;
  h+='<div class="card mel-me"><h2>Mon choix</h2>'+
    '<button type="button" class="mel-th'+(me.th?" set":"")+'" id="mel-th"'+(lk?" disabled":"")+'>'+(it?trIco(it):"")+"<span>"+(me.th?esc(melThName(me.th)):"Choisir mon thème")+"</span><small>"+(me.th?"changer":"touche ici")+"</small></button>"+
    '<div class="mel-lbl">Nombre de questions</div><div class="seg" id="mel-nq">'+MEL_NQ.map(function(n){return '<button type="button" data-n="'+n+'"'+(me.nq===n?' class="on"':"")+(lk?" disabled":"")+">"+n+"</button>";}).join("")+"</div>"+
    '<p class="muted small">Retenu pour la partie : <b>'+(lb.nq||me.nq)+" questions</b> (médiane des votes, arrondie à 5).</p>"+
    '<button type="button" class="btn btn-go btn-big btn-block mel-rdy'+(me.rd?" on":"")+'" id="mel-rdy"'+(!me.th||lk?" disabled":"")+">"+(me.rd?"Prêt ✓ (toucher pour annuler)":"Je suis prêt")+"</button></div>";
  h+='<div class="card mel-pl"><h2>Aventuriers</h2>'+pl.map(function(x,i){
    var mine=x[0]===S.pid,th=mine?me.th:x[3],nq=mine?me.nq:x[4],rd=mine?me.rd:x[5];
    return '<div class="mel-row'+(rd?" rdy":"")+'"><span class="mel-av" style="background:'+MEL_PAL[i%MEL_PAL.length]+'">'+esc(initials(x[1]))+'</span><span class="mel-nm">'+esc(x[1])+(mine?" (toi)":"")+(x[0]===lb.hid?' <span class="tag t-sun">créateur</span>':"")+'</span><span class="mel-tp">'+(th?esc(melThName(th)):"choisit…")+" · "+(nq||"?")+' q.</span><span class="mel-st">'+(rd?"✓":"")+"</span></div>";
  }).join("")+"</div>";
  var wait=pl.filter(function(x){return !(x[0]===S.pid?(me.rd&&me.th):(x[5]&&x[3]));}).map(function(x){return x[1];});
  h+='<p class="center muted mel-status">'+(lb.er?esc(lb.er):lk?"Préparation des questions…":pl.length<2?"Partage le code : il faut au moins 2 aventuriers.":wait.length?"En attente de : "+esc(wait.join(", ")):"Tout le monde est prêt…")+"</p>";
  if(MEL.eng)h+='<p class="muted small center">Garde cet écran allumé : ton téléphone fait tourner la partie. Si tu quittes, la mêlée s’arrête pour tout le monde.</p>';
  $("lb-body").innerHTML=h;
}
function melRenderPicker(){
  $("lb-body").innerHTML='<div class="card mel-pk"><h2>Choisis ton thème</h2><input class="inp" id="mp-s" type="search" placeholder="Rechercher un thème…" autocomplete="off" aria-label="Rechercher un thème">'+
    '<label class="mel-dk"><input type="checkbox" id="mp-dark"'+(MEL.dark?" checked":"")+"> Inclure les thèmes sombres</label>"+
    '<div class="mel-pkb"><button type="button" class="btn btn-soft" id="mp-surp">'+(ICO.dice||"")+'Surprise : un thème au hasard</button><button type="button" class="btn btn-ghost" id="mp-x">Annuler</button></div><div id="mp-l"></div></div>';
  melPickList();
}
function melPickList(){
  var q=trNorm($("mp-s").value||""),h="";
  buildTree({dark:MEL.dark}).forEach(function(br){
    var its=[];
    br.chaps.forEach(function(ch){its=its.concat(ch.items.filter(function(it){return !HIDDEN[it.id]&&(!q||trNorm(it.titre).indexOf(q)>=0);}));});
    if(!its.length)return;
    h+='<details class="acc mel-roy"'+(q?" open":"")+'><summary>'+esc(br.niv.nom)+" <small>"+its.length+'</small></summary><div class="mel-its">'+
      its.map(function(it){return '<button type="button" class="mel-it'+(S.mel.th===it.id?" on":"")+'" data-id="'+esc(it.id)+'">'+trIco(it)+"<span>"+esc(it.titre)+"</span></button>";}).join("")+"</div></details>";
  });
  $("mp-l").innerHTML=h||'<p class="muted">Aucun thème trouvé.</p>';
}
function melSetTheme(id){
  S.mel.th=id;S.mel.rd=false;MEL.pick=false;melSendMp();melRenderLobby();SND.pop();vibrate(15);
}
function melQrBig(){
  $("mq-q").innerHTML=melQrSvg(8);$("mq-c").textContent=S.code;
  $("mq-u").textContent=melUrl("").replace(/^https?:\/\//,"").replace(/\?.*$/,"");
  $("mq-n").textContent=((S.lb&&S.lb.pl)||[]).length+" / "+MEL_MAX+" aventuriers connectés";
  $("mel-qrbig").classList.remove("hidden");SND.pop();
}
/* tableau après chaque question */
function melBoard(m){
  var h='<div class="card rv-info mel-board"><h3>Classement'+(m.dbl?" · points doublés !":"")+"</h3>";
  (m.lbd||[]).forEach(function(x){
    var mine=x[5]===S.pid;
    h+='<div class="mel-brow'+(mine?" me":"")+'"><span class="mel-rk">'+x[3]+'</span><span class="mel-nm">'+esc(x[0])+(mine?" (toi)":"")+'</span><span class="mel-gn'+(x[4]===1?" ok":x[4]===2?" pa":"")+'">'+(x[2]>0?"+"+fmtInt(x[2]):x[4]===-1?"—":"0")+'</span><b class="mel-sc">'+fmtInt(x[1])+"</b></div>";
  });
  h+="</div>";
  if(m.fast)h+='<div class="center rv-info" style="margin:.5rem 0"><span class="chip" style="background:var(--sun-l);color:#8A5A00">'+(ICO.bolt||"")+"Le plus rapide : "+esc(m.fast[0])+" ("+m.fast[1]+" s)</span></div>";
  return h;
}

/* ─── liaisons de l’interface ─── */
$("go-melee").innerHTML=(ICO.swords||"")+"Mêlée entre amis (sans MJ)";
$("go-melee").addEventListener("click",function(){
  var cfg=lmConfig();
  if(!cfg||cfg.bad){toast("Le jeu en ligne n’est pas configuré (fichier config.js).","ko");return;}
  MEL.pending=true;CODE="";
  $("ps-lbl").textContent="Nouvelle";$("ps-code").textContent="mêlée";
  $("ps-in").value=store.get("pseudo","");$("ps-err").classList.add("hidden");
  $("ps-go").textContent="Créer la mêlée";
  show("s-pseudo");
  setTimeout(function(){try{$("ps-in").focus();}catch(e){}},80);
});
$("ps-back").addEventListener("click",function(){MEL.pending=false;$("ps-lbl").textContent="Donjon";$("ps-go").textContent="Entrer dans le donjon";});
$("lb-body").addEventListener("click",function(e){
  if(!S.melee)return;
  var t=e.target,b;
  if(t.closest("#mel-qr,#mel-qrbtn")){melQrBig();return;}
  if(t.closest("#mel-th")){MEL.pick=true;melRenderPicker();return;}
  if((b=t.closest("#mel-nq button"))){S.mel.nq=+b.getAttribute("data-n");S.mel.rd=false;melSendMp();melRenderLobby();vibrate(10);return;}
  if(t.closest("#mel-rdy")){if(!S.mel.th)return;S.mel.rd=!S.mel.rd;melSendMp();melRenderLobby();vibrate(20);SND.pop();return;}
  if(t.closest("#mp-x")){MEL.pick=false;melRenderLobby();return;}
  if(t.closest("#mp-surp")){melSetTheme("?");return;}
  if((b=t.closest(".mel-it"))){melSetTheme(b.getAttribute("data-id"));return;}
});
$("lb-body").addEventListener("input",function(e){if(S.melee&&e.target.id==="mp-s")melPickList();});
$("lb-body").addEventListener("change",function(e){if(S.melee&&e.target.id==="mp-dark"){MEL.dark=e.target.checked;melPickList();}});
$("mq-x").addEventListener("click",function(){$("mel-qrbig").classList.add("hidden");});
$("mel-qrbig").addEventListener("click",function(e){if(e.target===this)this.classList.add("hidden");});
$("mel-next").addEventListener("click",function(){
  if(!S.melee||!S.melRv)return;
  sendAns({t:"nx",i:S.melRv.i});
  this.disabled=true;this.textContent="En attente des autres…";SND.pop();
});
$("end-wait").addEventListener("click",function(e){
  if(!S.melee||!e.target.closest("#end-rm"))return;
  sendAns({t:"rm"});e.target.closest("#end-rm").disabled=true;
});
/* présence : chacun signale régulièrement qu’il est là ; l’hôte ignore les silencieux */
setInterval(function(){if(S.melee&&S.ch&&S.phase)sendAns({t:"aw",v:document.hidden?1:0});},10000);
/* le créateur ne répond plus : on prévient (écran verrouillé, réseau coupé…) */
setInterval(function(){
  if(!S.melee||!S.ch||MEL.eng||!S.phase||S.phase==="end"||!S.lastHost)return;
  if(Date.now()-S.lastHost>45000&&!S.hostWarn){S.hostWarn=true;toast("Le créateur de la mêlée ne répond plus (écran verrouillé ? réseau coupé ?). La partie est peut-être terminée : tu peux quitter.","ko");}
},5000);
document.addEventListener("visibilitychange",function(){
  if(MEL.eng&&!document.hidden){try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(l){MEL.wl=l;},function(){});}catch(e){}}
});
