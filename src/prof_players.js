/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — joueurs en cours de partie, téléphone du MJ,
   alertes « page quittée », renommage forcé, retardataires
═══════════════════════════════════════════════════════════════ */
/* code MJ (Aventuriers VS MJ) : le code du donjon lu à l’envers — jamais affiché aux aventuriers */
function hostCode(){return G?G.code.split("").reverse().join(""):"";}
function onHostHi(id){
  if(G.mode!=="boss"){send({t:"no",to:id,why:"hostmode"});return;}
  var was=G.host&&G.host.id===id;
  if(G.host&&!was&&G.host.on)send({t:"kick",to:G.host.id,why:"host"});   /* un seul téléphone du MJ : le dernier connecté */
  G.host={id:id,on:true,last:Date.now(),isHost:true,p:"Le MJ",score:0,team:-1};
  welcome(G.host);hostIndicator();renderLobby();renderPlayers();
  if(!was){toast("Votre téléphone est connecté : vous jouez contre les aventuriers.","ok");SND.pop();}
}
function onHostMsg(m){
  var h=G.host;h.last=Date.now();
  if(m.t==="an"){
    if(G.phase!=="q"||m.i!==G.i||G.hostAns)return;
    var q=G.qs[G.i],el=Date.now()-G.qStart,lim=G.dur+G.extra;if(el>lim+1500)return;
    var ms=+m.ms;if(!(ms>=0))ms=el;
    var t=clamp(Math.min(el,Math.max(ms,el-2500)),0,lim),ok;
    ok=judgeMsg(q,m).ok;
    G.hostAns={ok:ok,t:t};hostIndicator();updateAnswered();
  }else if(m.t==="bye"){h.on=false;hostIndicator();renderLobby();renderPlayers();}
  else if(m.t==="aw"){h.away=!!m.v;hostIndicator();}
}
function hostIndicator(){
  var el=$("g-host");if(!el)return;
  if(!G||G.mode!=="boss"){el.classList.add("hidden");return;}
  var h=G.host,on=h&&h.on;
  el.className="g-host"+(on?"":" off");
  el.innerHTML=ICO.shield+"<span>"+(!on?"Téléphone du MJ non connecté":G.phase==="q"?(G.hostAns?"Le MJ a répondu":"Le MJ réfléchit…"):"Téléphone du MJ connecté")+"</span>";
}
function hostStatusHtml(){
  var on=G&&G.host&&G.host.on;
  return '<div class="host-st'+(on?" on":"")+'">'+ICO.shield+"<span>"+(on?"<b>Votre téléphone est connecté</b> : vous jouez contre les aventuriers.":"<b>Jouez vous aussi</b> depuis votre téléphone : bouton « Afficher le code MJ », puis tapez ce code sur la page joueur.")+"</span></div>";
}
var HC_T=null;
function openHostCode(){
  if(!G)return;
  $("hc-code").textContent=hostCode();openModal("m-hostcode");
  var n=10;$("hc-t").textContent="Masqué automatiquement dans "+n+" s.";
  clearInterval(HC_T);HC_T=setInterval(function(){n--;if(n<=0||$("m-hostcode").classList.contains("hidden")){clearInterval(HC_T);closeModal("m-hostcode");$("hc-code").textContent="····";return;}$("hc-t").textContent="Masqué automatiquement dans "+n+" s.";},1000);
}

/* ─── aventurier qui quitte la page du jeu (aucune adresse n’est connue ni collectée) ─── */
function setAway(p,v){
  if(!!p.away===v)return;
  p.away=v;
  if(v&&G.phase!=="end"){fxBubble(p.p+" a quitté la page du jeu","#D9606A","eyeoff","right");SND.tock();}
  else if(!v){fxBubble(p.p+" est revenu sur le jeu","#2E9E7E","eye","right");}
  awayUpdate();renderLobby();renderPlayers();
}
function awayUpdate(){
  var el=$("g-away");if(!el||!G)return;
  var a=plist().filter(function(p){return p.on&&p.away;});
  if(!a.length){el.classList.add("hidden");return;}
  el.classList.remove("hidden");
  el.innerHTML=ICO.eyeoff+"<span><b>Hors de la page du jeu :</b> "+a.map(function(p){return esc(p.p);}).join(", ")+"</span>";
}

/* ─── fenêtre « Joueurs » : renommer, exclure, faire entrer un retardataire ─── */
var MP_EDIT=null;
function openPlayers(){
  if(!G)return;
  MP_EDIT=null;
  $("mp-code").textContent="· donjon "+G.code;$("mp-code2").textContent=G.code;
  try{var qr=qrcode(0,"M");qr.addData(studentUrl(G.code));qr.make();$("mp-qr").innerHTML=qr.createSvgTag({cellSize:3,margin:0,scalable:true});}catch(e){$("mp-qr").innerHTML="";}
  openModal("m-players");renderPlayers();
}
function renderPlayers(){
  if(!G||$("m-players").classList.contains("hidden"))return;
  var hb=$("mp-host");
  if(G.mode==="boss"){
    hb.classList.remove("hidden");
    hb.innerHTML=hostStatusHtml()+'<div class="mp-hb"><button type="button" class="btn btn-sm btn-soft" data-mp="hostcode">'+ICO.lock+"Afficher le code MJ</button>"+(G.host&&G.host.on?'<button type="button" class="btn btn-sm btn-ghost" data-mp="hostoff">Déconnecter le téléphone du MJ</button>':"")+"</div>";
  }else hb.classList.add("hidden");
  var ps=plist().sort(function(a,b){return a.p.localeCompare(b.p,"fr");});
  if(!ps.length){$("mp-list").innerHTML='<p class="muted">Aucun aventurier pour l’instant.</p>';return;}
  $("mp-list").innerHTML='<table class="mp-t"><tr><th>Aventurier</th>'+(G.mode==="duel"?"<th>Guilde</th>":"")+"<th>État</th><th>Points</th><th></th></tr>"+ps.map(function(p){
    var T=G.mode==="duel"&&p.team>=0&&G.teams[p.team]?G.teams[p.team].n:"—",st=!p.on?'<span class="st off">déconnecté</span>':p.away?'<span class="st away">⚠ hors de la page</span>':'<span class="st on">en jeu</span>';
    var nm=MP_EDIT===p.id?'<input class="inp mp-in" id="mp-in" maxlength="16" value="'+esc(p.p)+'"><button type="button" class="btn btn-sm btn-primary" data-mp="ok" data-id="'+esc(p.id)+'">OK</button><button type="button" class="btn btn-sm btn-ghost" data-mp="cancel">Annuler</button>':"<b>"+esc(p.p)+"</b>";
    return '<tr><td><div class="mp-nm">'+nm+"</div></td>"+(G.mode==="duel"?"<td>"+esc(T)+"</td>":"")+"<td>"+st+"</td><td>"+fmtInt(p.score||0)+'</td><td class="mp-act">'+
      (MP_EDIT===p.id?"":'<button type="button" class="btn btn-sm btn-soft" data-mp="ren" data-id="'+esc(p.id)+'">'+ICO.edit+'Renommer</button><button type="button" class="btn btn-sm btn-ghost mp-kick" data-mp="kick" data-id="'+esc(p.id)+'">'+ICO.cross+"Exclure</button>")+"</td></tr>";
  }).join("")+"</table>";
  if(MP_EDIT){var i=$("mp-in");if(i){i.focus();i.select();i.onkeydown=function(e){if(e.key==="Enter")forceRename(MP_EDIT,i.value);if(e.key==="Escape"){MP_EDIT=null;renderPlayers();e.stopPropagation();}};}}
}
$("m-players").addEventListener("click",function(e){
  var b=e.target.closest("[data-mp]");if(!b||!G)return;
  var a=b.getAttribute("data-mp"),id=b.getAttribute("data-id");
  if(a==="hostcode")openHostCode();
  else if(a==="hostoff"){if(G.host){send({t:"kick",to:G.host.id,why:"host"});G.host.on=false;hostIndicator();renderPlayers();renderLobby();}}
  else if(a==="ren"){MP_EDIT=id;renderPlayers();}
  else if(a==="cancel"){MP_EDIT=null;renderPlayers();}
  else if(a==="ok"){forceRename(id,$("mp-in").value);}
  else if(a==="kick"){
    if(b.getAttribute("data-arm")!=="1"){b.setAttribute("data-arm","1");b.innerHTML=ICO.cross+"Confirmer ?";setTimeout(function(){if(b.isConnected){b.removeAttribute("data-arm");b.innerHTML=ICO.cross+"Exclure";}},3000);return;}
    kickPlayer(id);
  }
});
function forceRename(id,raw){
  var p=G&&G.players[id];if(!p)return;
  var c=checkPseudo(raw);if(!c.ok){toast(c.why,"ko");return;}
  if(plist().some(function(x){return x.id!==id&&x.p.toLowerCase()===c.p.toLowerCase();})){toast("Ce nom est déjà utilisé dans le donjon.","ko");return;}
  var apply=function(){p.p=c.p;p.forced=c.p;send({t:"rn",to:id,p:c.p});MP_EDIT=null;renderPlayers();renderLobby();pushLobby();toast("Renommé en « "+c.p+" ».","ok");};
  rpc("lm_join",{p_code:G.code,p_pseudo:c.p,p_player:id}).then(function(r){
    if(r&&r.ok===false&&r.err==="pseudo_taken"){toast("Ce nom est déjà utilisé dans le donjon.","ko");return;}
    apply();
  }).catch(function(){apply();});
}
$("lb-players").addEventListener("click",openPlayers);
$("mp-qr").addEventListener("click",function(){closeModal("m-players");openQrBig();});
$("g-players").addEventListener("click",openPlayers);
$("lb-hostcode").addEventListener("click",openHostCode);
