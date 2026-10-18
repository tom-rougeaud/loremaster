/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — démarrage, en-tête, menu
═══════════════════════════════════════════════════════════════ */
function setView(v){
  P.view=v;document.body.classList.remove("v-proj","v-mob");document.body.classList.add("v-"+v);
  $$("#vsw button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-v")===v);});
  saveSetup();
  if(FIT.on)fitScreen(true,{max:v==="mob"?1.7:2.3});
}
$("vsw").addEventListener("click",function(e){var b=e.target.closest("button");if(b)setView(b.getAttribute("data-v"));});
function soundBtn(){$("b-sound").innerHTML=P.mute?ICO.mute:ICO.sound;$("b-sound").title=P.mute?"Son coupé":"Son activé";SND.setMute(P.mute);}
$("b-sound").addEventListener("click",function(){P.mute=!P.mute;saveSetup();soundBtn();SND.unlock();SND.pop();});
$("b-full").addEventListener("click",function(){
  var d=document,el=d.documentElement;
  try{
    if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);}
    else{(el.requestFullscreen||el.webkitRequestFullscreen).call(el);}
  }catch(e){}
});
$("b-menu").addEventListener("click",function(e){e.stopPropagation();$("menu").classList.toggle("hidden");});
document.addEventListener("click",function(e){if(!e.target.closest(".menu-w"))$("menu").classList.add("hidden");});
$("menu").addEventListener("click",function(e){
  var b=e.target.closest("[data-m]");if(!b)return;$("menu").classList.add("hidden");
  var m=b.getAttribute("data-m");
  if(m==="hist"){openModal("m-hist");renderHist("local");}
  else if(m==="look")openLook();
  else if(m==="diag")openDiag();
  else if(m==="help")openModal("m-help");
});
function dbBanner(){
  var c=lmConfig(),w=$("dbwarn");
  if(!c||c.bad){
    netPill("ko","Base non branchée");
    w.className="warn";w.innerHTML="<b>La base de données n’est pas encore branchée.</b> Vous pouvez préparer vos questions dès maintenant ; pour ouvrir un donjon, suivez les 4 étapes du <a href=\"#\" id=\"dbw-go\">diagnostic</a> (5 minutes, une seule fois).";
    $("dbw-go").addEventListener("click",function(e){e.preventDefault();openDiag();});
    return;
  }
  w.className="hidden";
  rpc("lm_ping",{},8000).then(function(r){
      if(r&&r.ok)netPill("ok","Base connectée");else netPill("ko","Base : réponse inattendue");
    })
    .catch(function(e){netPill("ko","Base injoignable");w.className="err";w.innerHTML=esc(netErrText(e))+' <a href="#" id="dbw-go">Ouvrir le diagnostic</a>';$("dbw-go").addEventListener("click",function(ev){ev.preventDefault();openDiag();});});
}
/* bouton « Ouvrir le donjon » et compagnie : icônes */
$("b-gen").innerHTML=ICO.bolt+"Tirer les questions";
$("b-open").innerHTML=ICO.door+"Ouvrir le donjon";
$("b-surprise").innerHTML=ICO.dice+"Surprends-moi";
$("pv-regen").innerHTML=ICO.refresh+"Tout retirer au sort";
$("b-full").innerHTML=ICO.full;$("b-menu").innerHTML=ICO.menu;
$("lb-hostcode").innerHTML=ICO.lock+"Afficher le code MJ";
$("g-players").innerHTML=ICO.users+"Joueurs";
(function init(){
  $("brand").outerHTML=brandHtml("Espace MJ","index.html");
  $("foot").innerHTML=footHtml();
  initZoom("mj",$("zoom"));fitWatch($("s-game"));
  loadSetup();soundBtn();
  setView(P.view||(window.innerWidth<720?"mob":"proj"));
  refreshAll();dbBanner();try{pwaInit();}catch(e){}
  var snap=readSnapshot();
  if(snap&&lmConfig()&&!lmConfig().bad){
    var r=$("resume");
    r.innerHTML='<div class="warn" style="margin-bottom:1rem">Une partie était en cours (donjon <b>'+esc(snap.code)+"</b>"+(snap.phase!=="lobby"?", question "+(snap.i+1)+" / "+(snap.qs||[]).length:"")+') — <button type="button" class="btn btn-sm btn-mint" id="rs-go">Reprendre</button> <button type="button" class="btn btn-sm" id="rs-no">Ignorer</button></div>';
    $("rs-go").onclick=function(){r.innerHTML="";resumeGame(snap);};
    $("rs-no").onclick=function(){r.innerHTML="";var s=snap;rpc("lm_close_room",{p_code:s.code,p_token:s.token}).catch(function(){});clearSnapshot();};
  }
  window.addEventListener("beforeunload",function(e){if(G&&G.phase!=="lobby"&&G.phase!=="end"){snapshot();e.preventDefault();e.returnValue="";}});
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&G)hostPing(false);});
})();

/* ─── rideau : masque l’écran projeté (la partie continue sur les téléphones) ─── */
$("b-curtain").innerHTML=ICO.eyeoff;$("bh-ic").innerHTML=ICO.eyeoff;
try{$("cu-logo").src=LOGO_URI;}catch(e){}
function curtain(on){$("curtain").classList.toggle("hidden",!on);}
$("b-curtain").addEventListener("click",function(){curtain(true);});
$("curtain").addEventListener("click",function(){curtain(false);});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("curtain").classList.contains("hidden"))curtain(false);});
$("bh-duel").addEventListener("click",function(){
  if(!G||G.phase!=="lobby")return;
  P.mode="duel";P.nt=2;saveSetup();relaunchSameRoom();
  toast("Duel de guildes : le MJ rejoint la guilde 1 avec son téléphone, tous les autres la guilde 2.");
});
