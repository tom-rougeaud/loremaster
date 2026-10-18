/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — 3. Le donjon : base Supabase, temps réel, guildes
═══════════════════════════════════════════════════════════════ */
var G=null;
var MAXP=MAX_PLAYERS;
function studentUrl(code){
  var u=location.href.split("#")[0].split("?")[0];
  u=/mj\.html$/i.test(u)?u.replace(/mj\.html$/i,"joueur.html"):u.replace(/\/?$/,"/")+"joueur.html";
  return code?u+"?c="+code:u;
}
function shortUrl(){return studentUrl("").replace(/^https?:\/\//,"").replace(/\?.*$/,"");}
function netPill(state,txt){var p=$("netpill");p.className="pill "+state;p.querySelector("span").textContent=txt;}
function plist(){return G?Object.keys(G.players).map(function(k){return G.players[k];}):[];}
function online(){return plist().filter(function(p){return p.on;});}
function teamOf(p){return G.mode==="duel"&&p.team>=0?G.teams[p.team]:G.mode==="boss"?BOSS_TEAM:null;}

/* ─── ouverture du donjon ─── */
function openRoom(){
  QS=QS.filter(function(q){return !q.fresh&&q.q;});
  if(!QS.length)return;
  if(G&&G.ch&&G.phase!=="closed"){relaunchSameRoom();return;}
  var c=lmConfig();
  if(!c||c.bad){openDiag();return;}
  var b=$("b-open");b.disabled=true;b.innerHTML="Ouverture du donjon…";
  rpc("lm_create_room",{p_mode:P.mode,p_max:MAXP}).then(function(r){
    if(!r||!r.ok)throw new Error(r&&r.err==="too_many_rooms"?"Trop de donjons ouverts en même temps sur cette base. Réessayez dans quelques minutes.":"Impossible de créer le donjon.");
    return openChannel(r.code,onMsg,onNet).then(function(ch){return {r:r,ch:ch};});
  }).then(function(x){
    G=newGame(x.r.code,x.r.token,x.ch);
    afterOpen();
  }).catch(function(e){toast(e&&e.message&&!/^(config|timeout)$/.test(e.message)&&e.message.indexOf(" ")>0?e.message:netErrText(e),"ko");})
  .then(function(){b.disabled=false;b.innerHTML=ICO.door+"Ouvrir le donjon";});
}
function newGame(code,token,ch){
  return {code:code,token:token,ch:ch,mode:P.mode,phase:"lobby",players:{},teams:P.mode==="duel"?teamNames().slice(0,P.nt).map(function(n,i){return {n:n,k:i};}):[],
    lk:false,qs:[],i:-1,hist:[],boss:null,tscore:[],opened:Date.now()};
}
function afterOpen(){
  netPill("ok","Donjon "+G.code+" ouvert");
  $("lb-code").textContent=G.code;$("lb-url").textContent=shortUrl();$("lb-max").textContent=MAXP;
  renderQR();renderLobby();show("s-lobby");
  startBeat();snapshot();SND.go();
  $("b-open").innerHTML=ICO.door+"Relancer dans le donjon "+G.code;
}
function renderQR(){
  try{var qr=qrcode(0,"M");qr.addData(studentUrl(G.code));qr.make();$("lb-qr").innerHTML=qr.createSvgTag({cellSize:4,margin:0,scalable:true});}
  catch(e){$("lb-qr").innerHTML="";}
}
function onNet(st){
  if(!G)return;
  if(st==="up"){netPill("ok","Donjon "+G.code);if(G.wasDown){G.wasDown=false;send({t:"rh"});}}
  else{G.wasDown=true;netPill("ko","Connexion perdue… reconnexion");}
}
function send(m){if(G&&G.ch)G.ch.send(m);}

/* ─── battement de cœur : gardu donjon en vie et vérifie les aventuriers ─── */
function startBeat(){
  stopBeat();
  G.beat=setInterval(function(){hostPing(false);},40000);
}
function stopBeat(){if(G&&G.beat){clearInterval(G.beat);G.beat=null;}}
function hostPing(verify){
  if(!G)return Promise.resolve();
  var st=G.phase==="lobby"?"open":G.phase==="end"?"ended":"playing";
  return rpc("lm_host_ping",{p_code:G.code,p_token:G.token,p_status:st,p_mode:G.mode}).then(function(r){
    if(!r||!r.ok){netPill("ko","Donjon introuvable dans la base");return;}
    var inDb={};(r.players||[]).forEach(function(x){inDb[x.id]=x.p;});
    var changed=false;
    plist().forEach(function(p){
      if(!inDb[p.id]){
        if(verify&&Date.now()-p.joined<60000&&Date.now()-p.joined>1500){kickPlayer(p.id,true);changed=true;}
        else if(G.phase==="lobby"&&Date.now()-p.last>90000){delete G.players[p.id];changed=true;}
      }
    });
    if(changed){renderLobby();pushLobby();}
  }).catch(function(){});
}
var VERIFY_T=null;
function scheduleVerify(){clearTimeout(VERIFY_T);VERIFY_T=setTimeout(function(){hostPing(true);},2500);}

/* ─── messages des aventuriers ─── */
/* ─── fermeture automatique du donjon après 20 min d’inactivité ─── */
var IDLE_MS=20*60000,IDLE_LAST=Date.now(),IDLE_WARN=false;
function markActive(){IDLE_LAST=Date.now();IDLE_WARN=false;}
["pointerdown","keydown","touchstart"].forEach(function(ev){document.addEventListener(ev,markActive,{passive:true});});
setInterval(function(){
  if(!G)return;
  var idle=Date.now()-IDLE_LAST;
  if(idle>IDLE_MS-60000&&!IDLE_WARN){IDLE_WARN=true;toast("Aucune activité depuis 19 min : le donjon se fermera dans 1 minute. Touchez l’écran pour la garder.");}
  if(idle>IDLE_MS){var c=G.code;if(G.phase==="q"||G.phase==="rv"||G.phase==="cd"){try{shorten();}catch(e){}}closeRoom();show("s-pick");renderTree();toast("Donjon "+c+" fermé après 20 minutes d’inactivité.","ko");}
},20000);
function onMsg(m){
  if(m&&(m.t==="an"||m.t==="hi"))markActive();
  if(!G||!m||typeof m!=="object")return;
  var id=typeof m.id==="string"?m.id.slice(0,40):null;
  if(m.t==="hi"&&id&&m.host)return onHostHi(id);
  if(m.t==="hi"&&id)return onHi(id,m.p);
  if(id&&G.host&&G.host.id===id)return onHostMsg(m);
  var p=id&&G.players[id];if(!p)return;
  p.last=Date.now();
  if(m.t==="tm"){if(G.mode==="duel"&&!G.lk&&m.k>=0&&m.k<G.teams.length){p.team=m.k|0;renderLobby();pushLobby();}}
  else if(m.t==="an"){recvAnswer(p,m);}
  else if(m.t==="bye"){p.on=false;p.away=false;awayUpdate();renderLobby();pushLobby();updateAnswered();}
  else if(m.t==="aw"){setAway(p,!!m.v);}
}
function onHi(id,raw){
  var c=checkPseudo(raw),p=G.players[id];
  if(!c.ok){send({t:"no",to:id,why:"pseudo"});return;}
  if(p){p.p=p.forced||c.p;p.on=true;p.away=false;p.last=Date.now();welcome(p);awayUpdate();renderLobby();pushLobby();updateAnswered();renderPlayers();return;}
  if(G.phase==="end"){send({t:"no",to:id,why:"ended"});return;}
  var dup=plist().some(function(x){return x.p.toLowerCase()===c.p.toLowerCase();});
  if(dup){send({t:"no",to:id,why:"pseudo"});return;}
  if(plist().length>=MAXP){send({t:"no",to:id,why:"full"});return;}
  p={id:id,p:c.p,team:-1,on:true,joined:Date.now(),last:Date.now(),score:0,ok:0,na:0,streak:0,best:0,free:0,wire:0,fast:0,ans:{}};
  if(G.mode==="duel"&&G.lk)p.team=smallestTeam();
  G.players[id]=p;
  welcome(p);renderLobby();pushLobby();updateAnswered();scheduleVerify();renderPlayers();
  if(G.phase==="lobby")SND.pop();
  else if(G.phase!=="end")joinNotice(p.p);
  qrBigCount();
}
/* arrivées en cours de partie : une seule bulle regroupée */
var JOIN_Q=[],JOIN_T=null;
function joinNotice(name){
  JOIN_Q.push(name);clearTimeout(JOIN_T);
  JOIN_T=setTimeout(function(){var q=JOIN_Q;JOIN_Q=[];if(!q.length)return;fxBubble(q.length===1?q[0]+" rejoint la partie":q.slice(0,2).join(", ")+(q.length>2?" et "+(q.length-2)+" autre"+(q.length>3?"s":""):"")+" rejoignent la partie","#2E9E7E","user","left");},700);
}
/* QR code en plein écran (projection) */
function openQrBig(){
  if(!G)return;
  try{var qr=qrcode(0,"M");qr.addData(studentUrl(G.code));qr.make();$("qf-qr").innerHTML=qr.createSvgTag({cellSize:8,margin:0,scalable:true});}catch(e){$("qf-qr").innerHTML="";}
  $("qf-url").textContent=shortUrl();$("qf-code").textContent=G.code;qrBigCount();
  $("m-qrbig").classList.remove("hidden");SND.pop();
}
function closeQrBig(){$("m-qrbig").classList.add("hidden");}
function qrBigCount(){if(G&&$("qf-n"))$("qf-n").textContent=online().length+" / "+MAXP+" aventuriers connectés";}
$("lb-qr").addEventListener("click",openQrBig);
$("lb-qrbig").addEventListener("click",openQrBig);
$("qf-x").addEventListener("click",closeQrBig);
$("m-qrbig").addEventListener("click",function(e){if(e.target===this)closeQrBig();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("m-qrbig").classList.contains("hidden"))closeQrBig();});
function smallestTeam(){var n=G.teams.map(function(){return 0;});plist().forEach(function(p){if(p.team>=0&&p.team<n.length)n[p.team]++;});var k=0;n.forEach(function(v,i){if(v<n[k])k=i;});return k;}
function lobbyMsg(){
  return {t:"lb",m:G.mode,tn:G.teams.map(function(t){return t.n;}),pl:plist().filter(function(p){return p.on;}).map(function(p){return [p.id,p.p,p.team];}),lk:G.lk,mx:MAXP,ph:G.phase};
}
var PUSH_T=null;
function pushLobby(){clearTimeout(PUSH_T);PUSH_T=setTimeout(function(){if(G)send(lobbyMsg());},200);}
function welcome(p){
  var w={t:"wt",to:p.id,ph:G.phase,m:G.mode,p:p.p,sc:p.score,team:p.team,lb:lobbyMsg(),host:p.isHost?1:0};
  if(G.phase==="q"&&G.cur){var q=G.qs[G.i];w.q=qPayload(q,G.i);w.q.rem=Math.max(0,G.dur+G.extra-(Date.now()-G.qStart));w.done=p.isHost?!!G.hostAns:!!G.ans[p.id];}
  if(G.phase==="rv"&&G.lastRv)w.rv=G.lastRv;
  if(G.phase==="end"&&G.lastEn)w.en=G.lastEn;
  send(w);
}
function kickPlayer(id,silent){
  if(!G)return;
  send({t:"kick",to:id});
  rpc("lm_kick",{p_code:G.code,p_token:G.token,p_player:id}).catch(function(){});
  delete G.players[id];
  if(!silent)toast("Aventurier retiré du donjon.");
  awayUpdate();renderLobby();pushLobby();updateAnswered();renderPlayers();
}

/* ─── affichage du donjon ─── */
function chip(p,kick){
  var T=teamOf(p);
  return '<span class="pchip'+(p.on?"":" off")+(p.away?" away":"")+'" data-id="'+esc(p.id)+'" style="--tl:'+(T?T.l:"#EEEBFF")+'"'+(p.away?' title="A quitté la page du jeu"':"")+'>'+(p.away?"⚠ ":"")+esc(p.p)+(kick?'<button type="button" data-kick="'+esc(p.id)+'" title="Retirer du donjon" aria-label="Retirer '+esc(p.p)+'">✕</button>':"")+"</span>";
}
var LOBBY_T=null;
function renderLobby(){
  if(!G)return;
  /* pendant un glisser-déposer, on rafraîchit juste après (sinon le déplacement ne s’affiche pas côté MJ) */
  if(DRAGGING){clearTimeout(LOBBY_T);LOBBY_T=setTimeout(renderLobby,80);return;}
  /* un nom de guilde en cours d’édition est conservé (valeur, curseur) même si un aventurier arrive ou change de guilde */
  var ed=document.activeElement&&document.activeElement.matches&&document.activeElement.matches("#lb-zone [data-tn]")?document.activeElement:null;
  var edK=ed?ed.getAttribute("data-tn"):null,edV=ed?ed.value:"",edS=ed?ed.selectionStart:0,edE=ed?ed.selectionEnd:0;
  var ps=plist().sort(function(a,b){return a.joined-b.joined;}),n=ps.filter(function(p){return p.on;}).length;
  $("lb-n").textContent=n;
  var h="",tools="";
  if(G.mode==="duel"){
    $("lb-title").textContent="Les guildes";
    tools='<button type="button" class="btn btn-sm btn-soft" data-lt="rand">'+ICO.dice+'Répartir au hasard</button><button type="button" class="btn btn-sm btn-soft" data-lt="less"'+(G.teams.length<=2||G.lk?" disabled":"")+'>− guilde</button><button type="button" class="btn btn-sm btn-soft" data-lt="more"'+(G.teams.length>=6||G.lk?" disabled":"")+">+ guilde</button>";
    var pool=ps.filter(function(p){return p.team<0||p.team>=G.teams.length;});
    h='<div class="muted small" style="margin-bottom:.5rem">Les aventuriers glissent leur pseudo dans une guilde sur leur téléphone. Vous pouvez aussi déplacer les pseudos ici et renommer les guildes.</div><div class="teams">';
    if(pool.length||!G.lk)h+='<div class="team pool" data-team="-1"><div class="th"><span style="flex:1">Sans guilde</span><small>'+pool.length+'</small></div><div class="tb">'+(pool.map(function(p){return chip(p,true);}).join("")||'<span class="muted small">Les nouveaux arrivent ici.</span>')+"</div></div>";
    G.teams.forEach(function(t,k){
      var T=TEAMS[k],mem=ps.filter(function(p){return p.team===k;});
      h+='<div class="team" data-team="'+k+'" style="--tc:'+T.c+'"><div class="th"><span>'+T.s+'</span><input value="'+esc(t.n)+'" maxlength="22" data-tn="'+k+'" aria-label="Nom de l’guilde"><small>'+mem.length+'</small></div><div class="tb">'+mem.map(function(p){return chip(p,true);}).join("")+"</div></div>";
    });
    h+="</div>";
  }else{
    $("lb-title").textContent=G.mode==="boss"?"Les Aventuriers contre le MJ":"Chacun sa quête";
    h=(G.mode==="boss"?hostStatusHtml():"")+'<div class="players">'+(ps.length?ps.map(function(p){return chip(p,true);}).join(""):'<div class="wait-big"><div class="dots"><span></span><span></span><span></span></div><p>En attente des aventuriers… Ils tapent le code <b>'+G.code+"</b> sur la page joueur.</p></div>")+"</div>";
  }
  $("lb-tools").innerHTML=tools;
  $("lb-zone").innerHTML=h;
  if(edK!==null){var ni=$("lb-zone").querySelector('[data-tn="'+edK+'"]');if(ni){ni.value=edV;ni.focus({preventScroll:true});try{ni.setSelectionRange(edS,edE);}catch(x){}}}
  $("lb-start").disabled=!n;
  $("lb-start").innerHTML=ICO.play+(G.phase==="lobby"?"Lancer la partie":"Reprendre");
  $("lb-hostcode").classList.toggle("hidden",G.mode!=="boss");
  $("lb-players").innerHTML=ICO.users+"Gérer les joueurs ("+n+")";
}
$("lb-zone").addEventListener("click",function(e){var k=e.target.closest("[data-kick]");if(k)kickPlayer(k.getAttribute("data-kick"));});
function applyTeamName(i){
  var k=+i.getAttribute("data-tn");if(!G||!G.teams[k])return;
  var v=i.value.replace(/[<>]/g,"").trim().slice(0,22);if(!v)return;
  G.teams[k].n=v;var tn=teamNames();tn[k]=v;P.tnames=tn;saveSetup();pushLobby();
}
$("lb-zone").addEventListener("input",function(e){var i=e.target.closest("[data-tn]");if(i)applyTeamName(i);});
$("lb-zone").addEventListener("change",function(e){
  var i=e.target.closest("[data-tn]");if(!i)return;
  var k=+i.getAttribute("data-tn"),v=i.value.replace(/[<>]/g,"").trim().slice(0,22)||TEAMS[k].n;
  G.teams[k].n=v;var tn=teamNames();tn[k]=v;P.tnames=tn;saveSetup();pushLobby();
});
$("lb-zone").addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.matches("[data-tn]"))e.target.blur();});
$("lb-tools").addEventListener("click",function(e){
  var b=e.target.closest("[data-lt]");if(!b||!G)return;var a=b.getAttribute("data-lt");
  if(a==="rand"){var ps=shuffle(Math.random,plist());ps.forEach(function(p,i){p.team=i%G.teams.length;});}
  if(a==="less"&&G.teams.length>2){var gone=G.teams.length-1;G.teams.pop();plist().forEach(function(p){if(p.team===gone)p.team=-1;});}
  if(a==="more"&&G.teams.length<6){var k=G.teams.length;G.teams.push({n:teamNames()[k],k:k});}
  P.nt=G.teams.length;saveSetup();renderLobby();pushLobby();
});
dragDrop({root:$("lb-zone"),item:".pchip",zone:".team",onDrop:function(it,zone){
  var p=G&&G.players[it.getAttribute("data-id")];if(!p)return;
  p.team=+zone.getAttribute("data-team");renderLobby();pushLobby();SND.pop();
}});
$("lb-close").addEventListener("click",function(){
  var b=this;
  if(b.getAttribute("data-arm")!=="1"){b.setAttribute("data-arm","1");b.textContent="Confirmer la fermeture ?";setTimeout(function(){b.removeAttribute("data-arm");b.textContent="Fermer le donjon";},3000);return;}
  closeRoom();show("s-prev");
});
function closeRoom(){
  if(!G)return;
  send({t:"x"});stopBeat();clearInterval(G.tick);
  var g=G;rpc("lm_close_room",{p_code:g.code,p_token:g.token}).catch(function(){});
  setTimeout(function(){g.ch.close();},400);
  G=null;clearSnapshot();
  netPill("ok","Base connectée");
  $("b-open").innerHTML=ICO.door+"Ouvrir le donjon";
}
function relaunchSameRoom(){
  G.hostAns=null;G.qs=[];G.i=-1;G.hist=[];G.phase="lobby";G.lk=false;G.boss=null;G.lastRv=null;G.lastEn=null;
  plist().forEach(function(p){p.score=0;p.ok=0;p.na=0;p.streak=0;p.best=0;p.free=0;p.wire=0;p.fast=0;p.ans={};if(!p.on)delete G.players[p.id];});
  if(G.mode!==P.mode){G.mode=P.mode;G.teams=P.mode==="duel"?teamNames().slice(0,P.nt).map(function(n,i){return {n:n,k:i};}):[];}
  hostPing(false);renderLobby();pushLobby();show("s-lobby");snapshot();
}

/* ─── sauvegarde pour reprendre après un rechargement ─── */
function snapshot(){
  if(!G)return;
  var s={code:G.code,token:G.token,mode:G.mode,phase:G.phase,teams:G.teams,lk:G.lk,i:G.i,qs:G.qs.length?G.qs:QS,hist:G.hist,boss:G.boss,tscore:G.tscore,at:Date.now(),
    players:plist().map(function(p){return {id:p.id,p:p.p,team:p.team,score:p.score,ok:p.ok,na:p.na,streak:p.streak,best:p.best,free:p.free,wire:p.wire,fast:p.fast,ans:p.ans,joined:p.joined};})};
  store.set("game",s);
}
function clearSnapshot(){store.del("game");}
function readSnapshot(){var s=store.get("game",null);if(!s||!s.code||Date.now()-s.at>3*3600e3)return null;return s;}
function resumeGame(s){
  netPill("wait","Reprise du donjon "+s.code+"…");
  rpc("lm_host_ping",{p_code:s.code,p_token:s.token,p_status:null,p_mode:null}).then(function(r){
    if(!r||!r.ok)throw new Error("gone");
    return openChannel(s.code,onMsg,onNet);
  }).then(function(ch){
    G=newGame(s.code,s.token,ch);G.mode=s.mode;G.teams=s.teams||[];G.lk=s.lk;G.hist=s.hist||[];G.boss=s.boss;G.tscore=s.tscore||[];
    QS=s.qs||[];G.qs=s.phase==="lobby"?[]:QS.slice();G.i=s.i;
    (s.players||[]).forEach(function(x){x.on=false;x.last=Date.now();G.players[x.id]=x;});
    afterOpen();
    send({t:"rh"});
    if(s.phase!=="lobby"&&s.phase!=="end"&&G.qs.length){
      G.phase="rv";showGameScreen();
      if(G.i>=0&&G.hist[G.i])renderRevealFromHist(G.i);
      else{G.i=Math.max(-1,G.i-1);}
      $("g-next").innerHTML=ICO.next+(G.i+1>=G.qs.length?"Voir les gagnants":"Question suivante");
      toast("Partie reprise : cliquez sur « Question suivante ».","ok");
    }
  }).catch(function(e){
    clearSnapshot();netPill("ok","Base connectée");
    toast(e&&e.message==="gone"?"Ce donjon a expiré : ouvrez-en une nouvelle.":netErrText(e),"ko");
  });
}
$("b-open").addEventListener("click",function(){SND.unlock();openRoom();});
$("lb-start").addEventListener("click",function(){SND.unlock();startGame();});
