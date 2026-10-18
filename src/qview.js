/* ═══════════════════════════════════════════════════════════════
   AFFICHAGE DES FORMATS (commun prof / élève) :
   curseur d’estimation (le jeu n’a plus ni figures, ni tuiles).
   Tout le texte passe par rt() (échappé).
═══════════════════════════════════════════════════════════════ */
var PAIR_C=["#8C3B3B","#7A6A2E","#4F6B3A","#3F5E8C","#7A3F7A"];
function figBlock(fig){var h=figHtml(fig);return h?'<div class="fig">'+h+"</div>":"";}
function fmtSl(sl,v){return f(v,sl.d)+(sl.u?" "+sl.u:"");}
/* graduation « ronde » d’un curseur : 5 repères */
function slTicks(sl){var o=[];for(var i=0;i<=4;i++)o.push(rd(sl.min+(sl.max-sl.min)*i/4,6));return o;}
/* curseur statique : o = {zone:{a,t}, ans:valeur, dots:[{v,c}], me:valeur, big} */
function scaleHtml(sl,o){
  o=o||{};
  var W=sl.max-sl.min||1,pc=function(v){return Math.max(0,Math.min(100,(v-sl.min)/W*100));},h='<div class="scale'+(o.big?" big":"")+(o.ans!==undefined?" wa":"")+'">';
  if(o.dots&&o.dots.length){
    var bins={},rows=0;
    h+='<div class="sc-dots">';
    o.dots.forEach(function(d){var b=Math.round(pc(d.v)/2.2),r=bins[b]||0;bins[b]=r+1;rows=Math.max(rows,r+1);h+='<i class="sc-dot '+(d.c||"")+'" style="left:'+rd(pc(d.v),2)+"%;bottom:"+(r*(o.big?0.95:0.62))+'rem" title="'+esc(fmtSl(sl,d.v))+'"></i>';});
    h+="</div>";
    h=h.replace('<div class="sc-dots">','<div class="sc-dots" style="height:'+(Math.min(rows,8)*(o.big?0.95:0.62)+0.4)+'rem">');
  }
  h+='<div class="sc-track">';
  if(o.zone){var a=o.zone.a,t=o.zone.t;
    h+='<i class="sc-near" style="left:'+rd(pc(a-2.5*t),2)+"%;width:"+rd(pc(a+2.5*t)-pc(a-2.5*t),2)+'%"></i><i class="sc-zone" style="left:'+rd(pc(a-t),2)+"%;width:"+rd(pc(a+t)-pc(a-t),2)+'%"></i>';}
  if(o.me!==undefined&&o.me!==null&&isFinite(o.me))h+='<span class="sc-me" style="left:'+rd(pc(o.me),2)+'%"><em>'+esc(o.meLab||"toi")+" : "+esc(fmtSl(sl,o.me))+"</em></span>";
  if(o.ans!==undefined)h+='<span class="sc-ans" style="left:'+rd(pc(o.ans),2)+'%"><em>≈ '+esc(fmtSl(sl,o.ans))+"</em></span>";
  h+="</div>";
  h+='<div class="sc-ticks">'+slTicks(sl).map(function(v,i){return '<span style="left:'+(i*25)+'%">'+esc(f(v,sl.d))+"</span>";}).join("")+"</div>";
  if(sl.u)h+='<div class="sc-u">'+esc(sl.u)+"</div>";
  return h+"</div>";
}
/* compatibilité : plus de tuiles ni d’ordre à remettre */
function assocHtml(){return "";}
function ordreHtml(){return "";}
function corrOf(q){return qCorr(q);}
