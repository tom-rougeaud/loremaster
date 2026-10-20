/* ═══════════════════════════════════════════════════════════════
   APPARENCE (thème + police, mémorisés sur l’appareil) et INSTALLATION (PWA)
═══════════════════════════════════════════════════════════════ */
var LOOK_THEMES=[
  ["parchemin","Parchemin","Clair, chaleureux (défaut)"],["sepia","Vieux grimoire","Clair, ton sépia"],
  ["clair","Papier clair","Très lisible, vidéoprojecteur"],["hiver","Givre du Nord","Clair, bleuté"],
  ["azur","Lac d’argent","Clair, bleu-vert"],["aurore","Aube des royaumes","Clair, rose cuivré"],["lavande","Brume d’améthyste","Clair, violet doux"],
  ["sombre","Veillée","Sombre, doux"],["foret","Forêt elfique","Sombre, vert"],
  ["crypte","Crypte","Sombre, violet"],["forge","Forge naine","Sombre, braise"],["dragon","Antre du dragon","Sombre, rouge"]
];
var LOOK_FONTS=[
  ["chronique","Chronique","Cinzel + Garamond (défaut)","Cinzel","EB Garamond"],["enluminure","Enluminure","Onciale + Almendra","Uncial Antiqua","Almendra"],
  ["grimoire","Grimoire","MedievalSharp + IM Fell","MedievalSharp","IM Fell English"],["lisible","Lisible","Titres Cinzel, texte système","Cinzel","system-ui"],
  ["royale","Royale","Cinzel Decorative + Cormorant","Cinzel Decorative","Cormorant Garamond"],["gothique","Gothique","Pirata One + Garamond","Pirata One","EB Garamond"],
  ["conteur","Conteur","Metamorphous + Garamond","Metamorphous","EB Garamond"],["scribe","Scribe","Onciale + Garamond","Uncial Antiqua","EB Garamond"],
  ["ancien","Chronique ancienne","Cinzel + IM Fell","Cinzel","IM Fell English"],["taverne","Taverne","MedievalSharp + Cormorant","MedievalSharp","Cormorant Garamond"]
];
var LOOK=(function(){var l=store.get("look",null);return {theme:(l&&l.theme)||"parchemin",font:(l&&l.font)||"chronique"};})();
function applyLook(){
  var h=document.documentElement;h.setAttribute("data-theme",LOOK.theme);h.setAttribute("data-font",LOOK.font);
  var m=document.querySelector('meta[name="theme-color"]'),bg=null;
  try{bg=getComputedStyle(document.body).getPropertyValue("--bg").trim();}catch(e){}
  if(m&&bg)m.setAttribute("content",bg);
}
function fcss(n){return n==="system-ui"?"system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif":"'"+n+"',Georgia,serif";}
function lookChip(kind,v,name,sub,on,fam){
  return '<button type="button" class="look-chip'+(on?" on":"")+'" data-k="'+kind+'" data-v="'+v+'"'+(kind==="theme"?"":"")+'>'+
    (kind==="theme"?'<span class="sw"><i></i><i></i><i></i></span>':'<span class="lk-prev" style="font-family:'+(fam?fam[1]:"serif")+'">Les dragons dorment</span>')+
    '<span class="lk-name"'+(fam?' style="font-family:'+fam[0]+'"':"")+'>'+esc(name)+'</span><small class="muted">'+esc(sub)+'</small></button>';
}
function renderLook(){
  var b=$("look-body");if(!b)return;
  b.innerHTML='<h3 class="small-h">Thème</h3><div class="look-grid">'+LOOK_THEMES.map(function(t){return lookChip("theme",t[0],t[1],t[2],LOOK.theme===t[0]);}).join("")+
    '</div><h3 class="small-h">Police</h3><div class="look-grid">'+LOOK_FONTS.map(function(t){return lookChip("font",t[0],t[1],t[2],LOOK.font===t[0],[fcss(t[3]),fcss(t[4])]);}).join("")+
    '</div><p class="muted small">Ce choix est mémorisé sur cet appareil uniquement. Les thèmes sombres conviennent aux pièces peu éclairées ; « Papier clair » et « Lisible » sont les plus confortables en vidéoprojection.</p>';
}
function openLook(){
  if(!$("m-look")){
    var d=document.createElement("div");d.className="modal hidden";d.id="m-look";
    d.innerHTML='<div class="box wide"><button type="button" class="x" aria-label="Fermer">✕</button><h2>Apparence</h2><div id="look-body"></div></div>';
    document.body.appendChild(d);
  }
  renderLook();openModal("m-look");
}
document.addEventListener("click",function(e){
  var c=e.target.closest(".look-chip[data-k]");if(!c)return;
  LOOK[c.getAttribute("data-k")]=c.getAttribute("data-v");store.set("look",LOOK);applyLook();renderLook();
  try{if(typeof fitSoon==="function")fitSoon(0);}catch(x){}
});
applyLook();

/* ─── installation sur l’écran d’accueil ─── */
var PWA_EVT=null;
function pwaInit(){
  try{if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register("sw.js").catch(function(){});}catch(e){}
  var standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
  if(standalone||store.get("pwa_no",0))return;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
  function bar(html,onInstall){
    if($("pwa-bar"))return;
    var d=document.createElement("div");d.id="pwa-bar";
    d.innerHTML='<img src="'+(typeof LOGO_URI!=="undefined"?LOGO_URI:"")+'" alt=""><span>'+html+'</span>'+(onInstall?'<button type="button" class="btn btn-go" id="pwa-ok">Installer</button>':"")+'<button type="button" class="btn btn-ghost" id="pwa-no">Plus tard</button>';
    document.body.appendChild(d);
    $("pwa-no").addEventListener("click",function(){store.set("pwa_no",Date.now());d.remove();});
    if(onInstall)$("pwa-ok").addEventListener("click",function(){onInstall();d.remove();});
  }
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();PWA_EVT=e;
    bar("Installe <b>Lore Master</b> sur ton appareil : accès direct, plein écran.",function(){PWA_EVT.prompt();});});
  if(ios)setTimeout(function(){bar("Sur iPhone / iPad : touche <b>Partager</b> puis <b>Sur l’écran d’accueil</b> pour installer Lore Master.",null);},2500);
}
