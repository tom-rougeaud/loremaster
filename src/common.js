/* ═══════════════════════════════════════════════════════════════
   LORE MASTER — commun à toutes les pages
   Outils, stockage protégé, zoom, fenêtres, sons, rendu du texte,
   guildes, pseudos, et connexion à la base Supabase.
   Les textes français utilisent l’apostrophe typographique ’.
═══════════════════════════════════════════════════════════════ */
"use strict";
var LM_VERSION="1.5";
function $(id){return document.getElementById(id);}
function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
function esc(s){return String(s===undefined||s===null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function genId(){return Math.random().toString(36).slice(2,10);}
function fmtInt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function vibrate(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function nowMs(){return Date.now();}

/* ─── Stockage local protégé (try/catch + repli en mémoire) ───
   Clés préfixées « lm1_ » : plusieurs applis d’un même compte GitHub Pages
   partagent le même stockage, le préfixe évite toute collision. */
var store=(function(){
  var mem={},P="lm1_";
  function ok(){try{var k="__lm1_t";localStorage.setItem(k,"1");localStorage.removeItem(k);return true;}catch(e){return false;}}
  var LS=ok();
  return {
    get:function(k,def){var raw=null;try{raw=LS?localStorage.getItem(P+k):(mem[k]===undefined?null:mem[k]);}catch(e){raw=mem[k]===undefined?null:mem[k];}
      if(raw===null||raw===undefined)return def;try{return JSON.parse(raw);}catch(e){return def;}},
    set:function(k,v){var s=JSON.stringify(v);mem[k]=s;try{if(LS)localStorage.setItem(P+k,s);}catch(e){}},
    del:function(k){delete mem[k];try{if(LS)localStorage.removeItem(P+k);}catch(e){}},
    raw:function(fullKey){try{return LS?localStorage.getItem(fullKey):null;}catch(e){return null;}},
    persistent:LS,
    clearAll:function(){mem={};try{if(LS){for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf(P)===0)localStorage.removeItem(k);}}}catch(e){}}
  };
})();
function ssGet(k){try{return JSON.parse(sessionStorage.getItem("lm1_"+k)||"null");}catch(e){return null;}}
function ssSet(k,v){try{sessionStorage.setItem("lm1_"+k,JSON.stringify(v));}catch(e){}}

/* ─── Icônes (SVG en ligne, identiques sur tous les navigateurs) ─── */
var ICO={
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.6" height="16" rx="1.5"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.5"/></svg>',
  door:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H6v16h8M10 12h11M17 8l4 4-4 4"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M3 12h18"/><circle cx="14" cy="12" r="3.2" fill="currentColor"/><path d="M3 8v8M21 8v8"/></svg>',
  tiles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="2.5" y="4" width="7" height="6" rx="2"/><rect x="14.5" y="14" width="7" height="6" rx="2"/><path d="M9.5 7c4 0 2 10 5 10"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 4 13.6h6.4L9.6 22 20 9.7h-6.6z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="13" r="8.5"/><path d="M12 8.5V13l3 2M9 2.5h6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
  cross:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  crown:'<svg viewBox="0 0 48 48"><path d="M6 16l9 9 9-15 9 15 9-9-4 22H10z" fill="#FFC233" stroke="#C98E1A" stroke-width="2.5" stroke-linejoin="round"/><circle cx="6" cy="15" r="3.5" fill="#D9606A"/><circle cx="24" cy="9" r="3.5" fill="#5B55C4"/><circle cx="42" cy="15" r="3.5" fill="#2E9E7E"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v3h3.5v2.2A4.8 4.8 0 0 1 16.4 13 5.5 5.5 0 0 1 13 15.6V18h3.5v3h-9v-3H11v-2.4A5.5 5.5 0 0 1 7.6 13 4.8 4.8 0 0 1 3.5 8.2V6H7zm0 5H5.5a2.8 2.8 0 0 0 1.7 2.6A8 8 0 0 1 7 8m10 0q0 1.4-.2 2.6A2.8 2.8 0 0 0 18.5 8z"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.2 6.6.7-5 4.5 1.5 6.6L12 17.1l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 2c.6 3.3-1.5 5-3 6.8C8.2 10.4 7 12 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.2c0-2-.8-3.4-1.7-4.6-.2 1.3-.9 2.4-2 2.8.8-3.6-.3-8.4-.7-11M12 22a7 7 0 0 1-7-7.2C5 9.2 11.4 7 10.4 1c4.3 1.6 8.6 6.8 8.6 13.4A7.2 7.2 0 0 1 12 22"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.6"/><path d="M2 20c0-4 3.2-6.5 7-6.5s7 2.5 7 6.5z"/><circle cx="17" cy="9" r="2.8" opacity=".55"/><path d="M15.5 13.6c3.4-.4 6.5 1.6 6.5 5.4h-4.3c0-2-.8-4-2.2-5.4" opacity=".55"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c0-4.6 3.8-7.3 8.5-7.3s8.5 2.7 8.5 7.3z"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4.5v15L15 12zM16.5 4.5h3v15h-3z"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/></svg>',
  eyeoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.3 6.3C3.6 8 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.6-1.7M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  swords:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l12 12M19 5L7 17M13.500 16.500l3-3M7.500 13.500l3 3M17 17l3 3M7 17l-3 3"/></svg>',
  dice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  grip:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  sound:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5h4L12 5v14l-5-4.5H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5h4L12 5v14l-5-4.5H3z"/><path d="m16 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  full:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5M3.5 4v4.5H8M12 8v4.5l3 1.8"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4.2"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>',
  keyb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/></svg>',
  rocket:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.6 3.2c2.4-.9 4.8-1 6.2-.9.1 1.4 0 3.8-.9 6.2-.9 2.3-2.6 4.6-5.4 6.4l.3 3.7-3.3 3.1-1.4-3.6-3-3-3.6-1.4 3.1-3.3 3.7.3c1.8-2.8 4-4.5 6.3-5.5M16 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6M5.8 15.6l2.6 2.6c-1 1.4-3 2.4-5.2 2.6.2-2.2 1.2-4.2 2.6-5.2"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6.2c0 5 3.4 9.4 8 10.8 4.6-1.4 8-5.8 8-10.8V5z"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.3-8.5-11.4A4.9 4.9 0 0 1 12 6.4a4.9 4.9 0 0 1 8.5 3.2C20.5 15.7 12 21 12 21"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5v11h-13V10zm2.5 0h5V8a2.5 2.5 0 0 0-5 0z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2.5 11h2.8v9.5h5v-6h3.4v6h5V11h2.8z"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 2.5h2.2V22H5zM8.5 3.5c3.6-1.6 6.4 1.7 11 0v10c-4.6 1.7-7.4-1.6-11 0z"/></svg>'
};
/* logo : emblème Lore Master (image PNG transparente intégrée à la page) */
var LOGO_URI="/*@@LOGOURI@@*/";
var LOGO_FULL_URI="/*@@LOGOFULL@@*/";
var LOGO_WORD_URI="/*@@LOGOWORD@@*/";
function logoSvg(){return '<img class="logo" src="'+LOGO_URI+'" alt="" width="64" height="64">';}
/* niveau d’une question : étoiles + nom (1 Débutant · 2 Initié · 3 Expert) */
var LVL_NOM=["","Débutant","Initié","Expert"];
function starsHtml(n){n=Math.max(1,Math.min(3,n|0||1));return '<span class="stars" aria-hidden="true">'+"★★★".slice(0,n)+'<span class="off">'+"★★★".slice(n)+"</span></span>";}
function lvlTag(n){n=Math.max(1,Math.min(3,n|0||1));return '<span class="tag t-lvl l'+n+'" title="Niveau '+n+" sur 3 : "+LVL_NOM[n]+'" aria-label="Niveau '+LVL_NOM[n]+'">'+starsHtml(n)+"<small>"+LVL_NOM[n]+"</small></span>";}
var TH_COL=["#B5523B","#C08A2B","#6B8E3A","#2F8F83","#3E7CB1","#5B5BAA","#8F5BA8","#B04F7E","#7A6A4A","#4E8A5E","#C26A2E","#4A7F9C","#9A5B3C","#8A8F2F","#A33F4F","#5E7C99","#B36B9A","#6F9A3A"];
var TH_MAP={"dragons-dnd":0,"classes-dnd":1,"fees-sylvains":2,"creatures-marines":3,"plans-elementaires":4,"sorts-magie-dnd":5,"aberrations-dnd":6,"demons-diables-dnd":7,"golems-constructions":8,"terre-du-milieu":9,"geants-dnd":10,"mythologie-grecque":11,"monstres-donjon":12,"gobelinoides-humanoides":13,"morts-vivants-dnd":14,"races-dnd":15,"lycanthropes-metamorphes":16,"betes-monstruosites":17};
/* couleur d’un thème de questions : table fixe pour les thèmes d’origine, déterministe (hachage) pour les futurs */
function themeColor(id){id=String(id||"");if(TH_MAP[id]!==undefined)return TH_COL[TH_MAP[id]];var h=0;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;return TH_COL[h%TH_COL.length];}
function themeChip(titre,id){return titre?'<span class="tag t-theme" style="--tc:'+themeColor(id)+'" title="Thème de la question">'+esc(titre)+"</span>":"";}
function brandHtml(sub,href){return '<a class="brand" href="'+(href||"index.html")+'" title="Accueil Lore Master">'+logoSvg()+'<img class="wm" src="'+LOGO_WORD_URI+'" alt="Lore Master" height="28">'+(sub?'<small>'+esc(sub)+'</small>':"")+'</a>';}
function footHtml(){return '<div class="foot"><nav class="foot-l"><a href="index.html">Accueil</a><a href="index.html#apropos">À propos</a><a href="contact.html">Contact</a><a href="confidentialite.html">Confidentialité</a></nav><div class="foot-t">Lore Master v'+LM_VERSION+' · outil libre CC BY-NC 4.0 · D&amp;D est une marque de Wizards of the Coast, sans lien avec cet outil.</div></div>';}

/* ─── Équipes, réponses, modes ─── */
var TEAMS=[
  {n:"Les Lames Rouges",   c:"#A5483F",d:"#7E332C",l:"#F1DDD6",s:"●"},
  {n:"Les Sentinelles",    c:"#4D6F9A",d:"#385476",l:"#DCE4EE",s:"●"},
  {n:"Les Lanternes d’Or", c:"#B8892F",d:"#8C6620",l:"#F2E6C8",s:"●"},
  {n:"Les Ronces",         c:"#5C7A46",d:"#435C32",l:"#DFE7D2",s:"●"},
  {n:"Les Brumes",         c:"#7A5E96",d:"#5C4575",l:"#E6DDEE",s:"●"},
  {n:"Les Corbeaux",       c:"#5A5A66",d:"#3E3E48",l:"#DEDEE3",s:"●"}
];
var BOSS_TEAM={n:"Les Aventuriers",c:"#6A4B8A",d:"#4E3668",l:"#E8DFEF",s:"●"};
var ANS=[{l:"A",s:"▲"},{l:"B",s:"◆"},{l:"C",s:"●"},{l:"D",s:"■"}];
/* v3.4 : des lettres A B C D (comme sur une grille de QCM) à la place des formes */
var SHAPES=["A","B","C","D","E","F"];
var MODES={
  solo:{id:"solo",nom:"Chacun sa quête",court:"Chacun sa quête",desc:"Chacun joue pour soi : pas de guilde, un classement individuel et le podium des 3 meilleurs."},
  duel:{id:"duel",nom:"Duel de guildes",court:"Duel",desc:"Les aventuriers rejoignent une guilde en glissant leur jeton. Score de guilde = moyenne de ses membres."},
  boss:{id:"boss",nom:"Les Aventuriers contre le MJ",court:"Aventuriers VS MJ",desc:"Tout le donjon affronte le MJ, qui joue depuis son téléphone : la moyenne des points des aventuriers est comparée à celle du MJ."}
};
var MAX_PLAYERS=30;
/* pari : points perdus en cas d’erreur (la bonne réponse vaut le double) · bonus de rapidité en Aventuriers VS MJ */
var BET_LOSS=300,BOSS_BONUS=10,BOSS_VIRT=525,BOSS_CAP=400,DD_WIN=300,MANCHE=10;
var VOC={salle:"donjon",joueur:"aventurier",joueurs:"aventuriers",mj:"le MJ"};

/* ─── règles affichées avant chaque partie (MJ et aventuriers) ─── */
var RULES={
  common:[["bolt","De 500 à 1 000 points par bonne réponse : plus on répond vite, plus on gagne."],["flame","Série : +50 points par bonne réponse d’affilée (jusqu’à +250)."],["target","Estimation au curseur : zone verte = tous les points, zone orange = la moitié."],["cross","Erreur ou pas de réponse : 0 point, mais aucune pénalité."]],
  solo:[["user","Chacun joue pour soi, sans guilde."],["trophy","Le classement change à chaque question ; à la fin, le podium couronne les 3 meilleurs."]],
  duel:[["users","Points de la guilde à chaque question = moyenne des points de ses membres (un membre qui ne répond pas compte 0)."],["star","Bonus de 200 points si tous les membres de la guilde trouvent la bonne réponse."],["flag","Les bannières avancent : la guilde en tête à la fin gagne."]],
  boss:[["users","Les aventuriers jouent ensemble contre le MJ : à chaque question, on compare la MOYENNE des points des aventuriers aux points du MJ."],["shield","Le MJ répond sur son téléphone avec le même barème (mêmes points, même vitesse, même série). Sans téléphone connecté, un MJ virtuel marque 525 points par question."],["bolt","Bonus : +10 points pour chaque aventurier qui trouve la bonne réponse avant le MJ."],["heart","Le camp qui mène au cumul fait perdre de la vie à l’autre : les jauges montrent l’avantage."],["trophy","À la fin, le camp en tête au cumul des points gagne (égalité : les aventuriers)."]]
};
/* o = {sm:"juste"|"vite", rd:secondes de lecture} (réglages de la partie) */
function rulesHtml(mode,o){
  o=o||{};
  var M=MODES[mode],li=function(r){return '<li><span class="ri">'+ICO[r[0]]+"</span><span>"+esc(r[1])+"</span></li>";};
  var com=RULES.common.slice();
  if(o.sm==="juste")com[0]=["check","1 000 points par bonne réponse, quelle que soit la vitesse : prends le temps de bien réfléchir."];
  if(o.rd>0)com.splice(1,0,["eye","Les propositions apparaissent après "+o.rd+" secondes : lis bien l’énoncé d’abord."]);
  if(o.fk===false)com=com.filter(function(r){return r[0]!=="target";});
  if(o.ml)com.splice(com.length-1,0,["star","Réponses multiples, ordre, association : tout juste = tous les points ; presque tout juste = une partie des points."]);
  if(o.pr)com.splice(com.length-1,0,["dice","Pari : sur une question « Pari », tu peux miser avant de répondre : points ×2 si tu as juste, −"+BET_LOSS+" points si tu te trompes."]);
  var R=RULES[mode].slice();
  if(mode==="duel"&&o.dd)R.splice(R.length-1,0,["swords","Duel direct (au plus une fois toutes les "+MANCHE+" questions) : les deux guildes en tête votent pour leur champion ; le plus rapide des deux qui a juste offre "+DD_WIN+" points à sa guilde."]);
  if(mode==="boss"){
    if(o.hd>0)R.splice(R.length-1,0,["clock","Handicap du MJ : la question s’affiche sur son téléphone "+o.hd+" s après les vôtres."]);
    if(o.hpen)R.splice(R.length-1,0,["heart","Handicap du MJ : chaque erreur (ou absence de réponse) du MJ abîme sa propre jauge."]);
  }
  return '<div class="rules-mode">'+esc(M.nom)+'</div><h2>Les règles</h2><div class="rules-cols"><div><h3>Ce mode</h3><ul>'+R.map(li).join("")+'</ul></div><div><h3>Les points</h3><ul>'+com.map(li).join("")+"</ul></div></div>";
}


function setBodyMode(m){try{document.body.setAttribute("data-mode",m||"");}catch(e){}}

/* ─── Pseudos ─── */
var FN_M=["Aldric","Bran","Caelan","Dorn","Eldrin","Faelar","Garrick","Hadrik","Ivar","Joryn","Kaelen","Lothar","Merrick","Norin","Orin","Perrin","Rodrik","Soren","Thalor","Ulric","Varyn","Wulfric","Yorick","Zephyr","Gorak","Thrain","Baldur","Alaric","Eryndor","Fenris"];
var FN_F=["Aelith","Brisa","Cassia","Delwyn","Elowen","Freya","Gwen","Hilda","Isolde","Jora","Kira","Lyra","Maelis","Nyra","Orsha","Petra","Rhea","Sylva","Thessa","Una","Vesper","Wynn","Yselda","Zara","Elara","Sigrid","Rowena","Alia"];
var EP_M=["le Brave","le Sage","le Rusé","l’Errant","le Mage","le Rôdeur","le Preux","le Barde","Sombrelame","Brisefer","Cœur-Lige","Mille-Lames","Pierre-Vive","le Sans-Peur","Lancedor","Flammevive","Œil-de-Lynx","Barbe-Rousse","Tonnerre","Corbeau"];
var EP_F=["la Brave","la Sage","la Rusée","l’Errante","l’Archère","la Mage","la Rôdeuse","la Barde","Sombrelame","Aube-Claire","Cœur-Lige","Mille-Lames","Lune-Vive","Sans-Peur","Flammevive","Œil-de-Lynx","Rose-Épine","Tempête","Corbeau","l’Enchanteresse"];
function genPseudo(){
  for(var i=0;i<40;i++){
    var f=Math.random()<0.5,N=f?FN_F:FN_M,E=f?EP_F:EP_M;
    var n=N[Math.floor(Math.random()*N.length)],e=E[Math.floor(Math.random()*E.length)],s=n+" "+e;
    if(s.length<=16)return s;
  }
  return FN_M[Math.floor(Math.random()*FN_M.length)];
}
var BANNED=["con","conne","connard","connasse","pute","salope","encule","enculé","bite","couille","merde","nique","niquer","ntm","fdp","pd","batard","bâtard","nazi","hitler","negro","negre","nègre","bougnoul","bougnoule","chienne","putain","cul","teub","zizi","enfoire","enfoiré","abruti","debile","débile","gogol","mongol"];
function normWord(s){return s.toLowerCase().normalize?s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""):s.toLowerCase();}
/* → {ok:true, p:pseudo propre} ou {ok:false, why:"…"} */
function checkPseudo(raw){
  var p=String(raw||"").replace(/\s+/g," ").replace(/'/g,"’").trim();
  if(p.length<2)return {ok:false,why:"Au moins 2 caractères."};
  if(p.length>16)return {ok:false,why:"16 caractères au maximum."};
  if(!/^[A-Za-z0-9À-ÖØ-öø-ÿŒœ _.’\-]+$/.test(p))return {ok:false,why:"Lettres, chiffres, espace, apostrophe, point, tiret ou _ uniquement."};
  var w=normWord(p).split(/[ _.\-]+/),flat=normWord(p).replace(/[^a-z0-9]/g,"");
  for(var i=0;i<BANNED.length;i++){var b=normWord(BANNED[i]);if(w.indexOf(b)>=0||(b.length>=5&&flat.indexOf(b)>=0))return {ok:false,why:"Ce nom n’est pas accepté. Choisis-en un autre."};}
  return {ok:true,p:p};
}

/* ─── Zoom A− / A+ (taille du texte de toute la page) ─── */
function initZoom(key,host){
  var z=store.get("zoom_"+key,1);
  function apply(){z=clamp(Math.round(z*10)/10,0.7,1.8);document.documentElement.style.setProperty("--fz",z);store.set("zoom_"+key,z);var s=host&&host.querySelector("span");if(s)s.textContent=Math.round(z*100)+" %";if(typeof FIT!=="undefined"&&FIT.on){FIT.max=FIT.base*z;fitSoon(0);}}
  if(host){
    host.innerHTML='<button type="button" data-z="-1" title="Réduire le texte" aria-label="Réduire le texte">A−</button><span>100 %</span><button type="button" data-z="1" title="Agrandir le texte" aria-label="Agrandir le texte">A+</button>';
    host.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;z+=0.1*(+b.getAttribute("data-z"));apply();});
  }
  apply();
}

/* ─── Ajustement automatique des écrans de jeu (v3.5) ───
   Pendant une question ou une correction, la taille de base (rem) est cherchée par dichotomie
   pour que le contenu occupe toute la fenêtre, sans défilement ni débordement horizontal.
   Les figures (SVG à viewBox) et tous les blocs étant en rem, tout grandit ou rétrécit ensemble,
   sans déformation. Le zoom A− / A+ règle la taille maximale autorisée. */
var FIT={on:false,min:0.6,max:1.9,base:1.9,T:null,busy:false};
/* Téléphone affiché en « version ordinateur » (Chrome « Site pour ordinateur », certains navigateurs intégrés) :
   la page est mise en page sur ~980 px puis réduite, tout devient minuscule. On compense par --dz. */
var DZ=1,COARSE=false;try{COARSE=window.matchMedia("(pointer:coarse)").matches;}catch(e){}
function dzCalc(){
  var d=document.documentElement,cw=d.clientWidth||window.innerWidth,sw=screen.width||cw,sh=screen.height||cw,coarse=false;
  try{coarse=window.matchMedia("(pointer:coarse)").matches;}catch(e){}
  var dev=window.innerWidth>window.innerHeight?Math.max(sw,sh):Math.min(sw,sh),z=1;
  if(coarse&&dev>0&&dev<1100&&cw>dev*1.3)z=Math.min(3.2,cw/dev);
  DZ=z;d.style.setProperty("--dz",String(Math.round(z*1000)/1000));
  d.classList.toggle("narrow",cw/z<=480);d.classList.toggle("dzon",z>1);
}
dzCalc();
function fitSet(f){var d=document.documentElement.style;d.setProperty("--fit",String(Math.round(f*1000)/1000));d.setProperty("--tz",String(f>1?Math.round(1000/f)/1000:1));}
function visible(e){return !!(e&&e.getClientRects().length);}
/* une formule (KaTeX) dépasse-t-elle du bloc qui la contient (ou de l’écran) ? */
function fitKatexCut(){
  var ks=document.querySelectorAll(".katex"),W=document.documentElement.clientWidth;
  for(var i=0;i<ks.length;i++){
    var k=ks[i];if(!visible(k))continue;var r=k.getBoundingClientRect();if(!r.width)continue;
    if(r.right>W+1||r.left<-1)return true;
    var c=k.parentElement;
    while(c&&c!==document.body){var cs=getComputedStyle(c);if(cs.display.indexOf("inline")!==0)break;c=c.parentElement;}
    if(c&&c!==document.body){var cr=c.getBoundingClientRect();if(r.right>cr.right+2||r.left<cr.left-2)return true;}
  }
  return false;
}
function fitOverflows(){
  var d=document.documentElement,b=document.body,h=window.innerHeight,w=d.clientWidth||window.innerWidth;
  if(Math.max(d.scrollHeight,b.scrollHeight)>h+1||Math.max(d.scrollWidth,b.scrollWidth)>w+1)return true;
  var xs=document.querySelectorAll("[data-fit]");
  for(var i=0;i<xs.length;i++){var e=xs[i];if(visible(e)&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1))return true;}
  return fitKatexCut();
}
function fitSearch(){
  var lo=FIT.min,hi=Math.max(FIT.min,FIT.max),best=lo;
  fitSet(hi);
  if(!fitOverflows())best=hi;
  else for(var i=0;i<9;i++){var mid=(lo+hi)/2;fitSet(mid);if(fitOverflows())hi=mid;else{lo=mid;best=mid;}}
  fitSet(best*0.985);return best;
}
function fitNow(){
  clearTimeout(FIT.T);
  var b=document.body;
  if(!FIT.on){fitSet(1);b.classList.remove("fit","kwrap");return;}
  if(FIT.busy)return;FIT.busy=true;
  var sy=window.scrollY;b.classList.add("fit");b.classList.remove("kwrap");
  if(FIT.unfill)FIT.unfill();
  if(FIT.pre)FIT.pre();
  var A=fitSearch();
  /* formule longue : si la garder d’un seul tenant oblige à trop réduire (ou si elle dépasse encore),
     on autorise la coupure aux signes = + − × (jamais au milieu d’un nombre) */
  if(fitKatexCut()){b.classList.add("kwrap");fitSearch();}
  else if(A<FIT.max*0.95&&[].some.call(document.querySelectorAll(".katex"),visible)){
    b.classList.add("kwrap");var K=fitSearch();
    if(A>=K*0.8){b.classList.remove("kwrap");fitSet(A*0.985);if(fitOverflows())fitSearch();}
  }
  /* place restante en bas : la page la répartit (réponses plus hautes, contenu centré) */
  if(FIT.fill){var mn=document.querySelector("main")||b,gap=window.innerHeight-(mn.getBoundingClientRect().bottom+parseFloat(getComputedStyle(mn).marginBottom||0));if(gap>8){FIT.fill(gap-6);if(fitOverflows()&&FIT.unfill)FIT.unfill();}}
  window.scrollTo(0,sy);FIT.busy=false;
}
function fitSoon(ms){clearTimeout(FIT.T);FIT.T=setTimeout(fitNow,ms===undefined?30:ms);clearTimeout(FIT.T2);FIT.T2=setTimeout(function(){if(FIT.on)fitNow();},850);}
/* on = écran ajusté ; o = {min, max} */
function fitScreen(on,o){
  FIT.on=!!on;if(o){if(o.min)FIT.min=o.min;if(o.max)FIT.base=o.max;}
  var z=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fz"))||1;FIT.max=FIT.base*z;
  if(!on){fitSet(1);document.body.classList.remove("fit","kwrap");return;}
  fitNow();fitSoon(250);
  clearTimeout(FIT.T2);FIT.T2=setTimeout(function(){if(FIT.on)fitNow();},850);   /* après les animations (secousse, apparition) */
}
/* le contenu d’un écran change (aventurier qui arrive, correction, liste…) : on réajuste ; les simples changements de texte (chrono) sont ignorés */
function fitWatch(root){
  if(!root||!window.MutationObserver)return;
  new MutationObserver(function(ms){
    if(!FIT.on||FIT.busy)return;
    for(var i=0;i<ms.length;i++){var m=ms[i],n=[].slice.call(m.addedNodes).concat([].slice.call(m.removedNodes));
      for(var j=0;j<n.length;j++)if(n[j].nodeType===1){fitSoon(60);return;}
      if(m.type==="attributes"&&m.attributeName==="class"&&/(^| )hidden( |$)/.test(String(m.oldValue||""))!==m.target.classList.contains("hidden")){fitSoon(60);return;}}
  }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["class"],attributeOldValue:true});
}
function typing(){var a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.type!=="checkbox"&&a.type!=="radio"&&a.type!=="range");}
window.addEventListener("resize",function(){dzCalc();if(FIT.on&&!(typing()&&COARSE))fitSoon(120);});
window.addEventListener("orientationchange",function(){setTimeout(dzCalc,200);if(FIT.on)fitSoon(300);});
try{if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(FIT.on)fitSoon(0);});}catch(e){}

/* ─── Fenêtres, messages ─── */
function openModal(id){var m=$(id);if(!m)return;m.classList.remove("hidden");var f=m.querySelector("[autofocus]");if(f)setTimeout(function(){f.focus();},50);}
function closeModal(id){var m=$(id);if(m)m.classList.add("hidden");}
document.addEventListener("click",function(e){
  var x=e.target.closest(".modal .x,[data-close]");
  if(x){var m=x.closest(".modal");if(m)m.classList.add("hidden");return;}
  if(e.target.classList&&e.target.classList.contains("modal")&&!e.target.hasAttribute("data-sticky"))e.target.classList.add("hidden");
});
document.addEventListener("keydown",function(e){if(e.key==="Escape")$$(".modal:not(.hidden)").forEach(function(m){if(!m.hasAttribute("data-sticky"))m.classList.add("hidden");});});
var toastT=null;
function toast(msg,kind){
  var t=$("toast");if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);}
  t.className="toast"+(kind?" "+kind:"");t.textContent=msg;t.style.display="";
  clearTimeout(toastT);toastT=setTimeout(function(){t.style.display="none";},3200);
}
function download(name,text,type){
  var a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:type||"application/json"}));
  a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},800);
}
function readFileText(file,cb){var r=new FileReader();r.onload=function(){cb(String(r.result||""));};r.onerror=function(){cb(null);};r.readAsText(file);}

/* ─── Sons (synthétisés, aucun fichier) ─── */
var SND=(function(){
  var ctx=null,muted=false;
  function ac(){if(!ctx){try{var C=window.AudioContext||window.webkitAudioContext;if(C)ctx=new C();}catch(e){}}if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}return ctx;}
  function tone(f,d,type,vol,when,slide){
    var c=ac();if(!c||muted)return;var t=c.currentTime+(when||0);
    var o=c.createOscillator(),g=c.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.18,t+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.05);
  }
  return {
    unlock:function(){ac();},
    setMute:function(m){muted=!!m;},isMuted:function(){return muted;},
    tick:function(){tone(880,0.06,"square",0.05);},
    tock:function(){tone(660,0.08,"square",0.06);},
    pop:function(){tone(520,0.12,"sine",0.15,0,980);},
    good:function(){tone(660,0.12,"triangle",0.2);tone(880,0.14,"triangle",0.2,0.1);tone(1320,0.22,"triangle",0.18,0.2);},
    bad:function(){tone(300,0.18,"sawtooth",0.1);tone(220,0.3,"sawtooth",0.1,0.15);},
    bolt:function(){tone(1200,0.18,"sine",0.12,0,2400);},
    whoosh:function(){tone(200,0.35,"triangle",0.08,0,900);},
    go:function(){tone(523,0.12,"triangle",0.2);tone(659,0.12,"triangle",0.2,0.12);tone(784,0.3,"triangle",0.22,0.24);},
    hit:function(){tone(150,0.2,"square",0.14,0,60);},
    fanfare:function(){[523,659,784,1047,784,1047].forEach(function(f,i){tone(f,i===5?0.6:0.16,"triangle",0.2,i*0.15);});},
    drum:function(n){for(var i=0;i<(n||10);i++)tone(110+Math.random()*30,0.07,"square",0.07,i*0.09);}
  };
})();

/* ─── Rendu du texte : échappé, retours à la ligne conservés (plus de formules) ─── */
function rt(s){return esc(s).replace(/\n/g,"<br>");}
/* texte brut (pour les exports CSV) */
function plain(s){return String(s||"");}

/* points d’une bonne réponse : 500 à 1000 selon la vitesse (ou 1000 en mode « justesse seule ») + bonus de série */
function ptsFor(t,dur,streak,mode){
  var base=mode==="juste"?1000:Math.round(500+500*(1-clamp(t/dur,0,1)));
  return base+(streak>=2?Math.min(streak-1,5)*50:0);
}

/* ═══════════════════════════════════════════════════════════════
   BASE DE DONNÉES SUPABASE (salles, joueurs, historique) + TEMPS RÉEL
   La bibliothèque supabase-js est intégrée au fichier : aucun CDN.
═══════════════════════════════════════════════════════════════ */
var NET={sb:null};
function lmConfig(){
  var c=(typeof LORE_CONFIG!=="undefined")?LORE_CONFIG:null;
  if(!c||!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)return null;
  var u=String(c.SUPABASE_URL).trim(),k=String(c.SUPABASE_ANON_KEY).trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in|net)\/?$/i.test(u)&&!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(u))return {bad:"url",url:u};
  if(k.length<30)return {bad:"key",url:u};
  return {url:u.replace(/\/+$/,""),key:k};
}
function lmClient(){
  if(NET.sb)return NET.sb;
  var c=lmConfig();if(!c||c.bad)return null;
  if(!window.supabase||!window.supabase.createClient)return null;
  NET.sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:50}}});
  return NET.sb;
}
function rpc(fn,args,timeout){
  return new Promise(function(res,rej){
    var sb=lmClient();if(!sb)return rej(new Error("config"));
    var done=false,t=setTimeout(function(){if(!done){done=true;rej(new Error("timeout"));}},timeout||12000);
    sb.rpc(fn,args||{}).then(function(r){
      if(done)return;done=true;clearTimeout(t);
      if(r.error)rej(r.error);else res(r.data);
    },function(e){if(done)return;done=true;clearTimeout(t);rej(e);});
  });
}
function netErrText(e){
  var m=String((e&&(e.message||e.details||e.hint||e.code))||e||"");
  if(m==="config")return "Connexion à la base non configurée (fichier config.js).";
  if(m==="timeout")return "La base ne répond pas : vérifiez la connexion Internet.";
  if(/lm_|function|PGRST202|Could not find/i.test(m))return "Les fonctions de la base sont absentes : relancez le script lore_master.sql dans Supabase.";
  if(/Invalid API key|JWT|apikey|401/i.test(m))return "Clé Supabase refusée : vérifiez SUPABASE_ANON_KEY dans config.js.";
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))return "Impossible de joindre Supabase : adresse incorrecte, réseau filtré ou projet en pause.";
  return "Erreur de la base : "+m.slice(0,140);
}
/* Canal temps réel d’une salle : diffusion de messages éphémères (rien n’est stocké).
   onStatus("up"|"down") ; à chaque (re)connexion, « up » est rappelé. */
function openChannel(code,onMsg,onStatus){
  return new Promise(function(resolve,reject){
    var sb=lmClient();if(!sb)return reject(new Error("config"));
    var ch=sb.channel("lm1-"+code,{config:{broadcast:{self:false,ack:false}}}),first=true,closed=false;
    ch.on("broadcast",{event:"m"},function(p){try{onMsg(p.payload);}catch(e){if(window.console)console.error(e);}});
    var api={
      send:function(m){if(closed)return;try{var r=ch.send({type:"broadcast",event:"m",payload:m});if(r&&r.catch)r.catch(function(){});}catch(e){}},
      close:function(){closed=true;try{sb.removeChannel(ch);}catch(e){}}
    };
    var to=setTimeout(function(){if(first){first=false;reject(new Error("timeout"));}},15000);
    ch.subscribe(function(status){
      if(status==="SUBSCRIBED"){
        if(first){first=false;clearTimeout(to);resolve(api);}
        if(onStatus)onStatus("up");
      }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){
        if(onStatus&&!closed)onStatus("down");
      }
    });
  });
}

/* ─── Glisser-déposer universel (souris, doigt, stylet) ───
   o = {root, item, handle?, zone, onDrop(item, zone, before), onTap?(item), sort?:bool} */
var DRAGGING=false;
function dragDrop(o){
  var st=null;
  function cleanup(){
    if(!st)return;
    if(st.ghost)st.ghost.remove();
    st.it.classList.remove("dragging");
    $$(".over",document).forEach(function(z){z.classList.remove("over");});
    $$(".drop-before",document).forEach(function(z){z.classList.remove("drop-before");});
    st=null;setTimeout(function(){DRAGGING=false;},0);
    window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",cancel);
  }
  function target(x,y){
    var el=document.elementFromPoint(x,y),z=el&&el.closest(o.zone),before=null;
    if(z&&o.sort){
      var items=$$(o.item,z).filter(function(n){return n!==st.it;});
      for(var i=0;i<items.length;i++){var r=items[i].getBoundingClientRect();if(y<r.top+r.height/2){before=items[i];break;}}
    }
    return {z:z,before:before};
  }
  function mv(e){
    if(!st||e.pointerId!==st.id)return;
    var dx=e.clientX-st.x,dy=e.clientY-st.y;
    if(!st.ghost){
      if(dx*dx+dy*dy<64)return;
      DRAGGING=true;
      st.ghost=st.it.cloneNode(true);st.ghost.classList.add("drag-ghost");st.ghost.style.width=st.it.offsetWidth+"px";
      document.body.appendChild(st.ghost);st.it.classList.add("dragging");
    }
    e.preventDefault();
    st.ghost.style.left=e.clientX+"px";st.ghost.style.top=e.clientY+"px";
    var t=target(e.clientX,e.clientY);
    $$(".over",document).forEach(function(z){if(z!==t.z)z.classList.remove("over");});
    $$(".drop-before",document).forEach(function(z){if(z!==t.before)z.classList.remove("drop-before");});
    if(t.z)t.z.classList.add("over");
    if(t.before)t.before.classList.add("drop-before");
  }
  function up(e){
    if(!st||e.pointerId!==st.id)return;
    var it=st.it,was=!!st.ghost,t=was?target(e.clientX,e.clientY):null;
    cleanup();
    if(was){if(t.z&&o.onDrop)o.onDrop(it,t.z,t.before);}
    else if(o.onTap)o.onTap(it,e);
  }
  function cancel(){cleanup();}
  o.root.addEventListener("pointerdown",function(e){
    if(e.button)return;
    var it=e.target.closest(o.item);if(!it||!o.root.contains(it))return;
    if(o.handle&&!e.target.closest(o.handle))return;
    if(!o.handle&&e.target.closest("button,input,select,textarea,a"))return;
    st={it:it,x:e.clientX,y:e.clientY,id:e.pointerId,ghost:null};
    window.addEventListener("pointermove",mv,{passive:false});window.addEventListener("pointerup",up);window.addEventListener("pointercancel",cancel);
  });
}
