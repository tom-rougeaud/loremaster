/* ═══════════════════════════════════════════════════════════════
   EFFETS VISUELS : tampons, bulles, confettis, podium,
   scènes animées (course de bannières, combat contre le MJ, classement)
═══════════════════════════════════════════════════════════════ */
var FX_COLORS=["#B8892F","#D9B45A","#5C7A46","#4D6F9A","#7A5E96","#A5483F","#F2E6C8"];
var SOFTC={};   /* (couleurs déjà adoucies dans le code) */
function softc(c){return SOFTC[c]||c;}
function fxLayer(){var l=$("fx-layer");if(!l){l=document.createElement("div");l.id="fx-layer";l.className="fx-layer";document.body.appendChild(l);}return l;}
function fxReduced(){try{return window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
/* grand tampon au centre : « Bravo ! », « Éclair ! »… */
function fxStamp(text,bg,icon,dur){
  var l=fxLayer(),d=document.createElement("div");
  d.className="fx-stamp";d.style.background=softc(bg)||"var(--violet)";
  d.innerHTML=(icon?ICO[icon]||"":"")+"<span>"+esc(text)+"</span>";
  l.appendChild(d);setTimeout(function(){d.remove();},dur||1600);
}
/* petite bulle qui monte (événements en direct sur l’écran du MJ) */
var FX_BUB=0;
function fxBubble(text,bg,icon,side){
  var l=fxLayer(),d=document.createElement("div"),small=window.innerWidth<760||document.body.classList.contains("v-mob");
  bg=softc(bg);if(small){Array.prototype.forEach.call(l.querySelectorAll(".fx-bubble"),function(x){x.remove();});d.className="fx-bubble sm";d.style.background=bg||"var(--violet)";d.innerHTML=(icon?ICO[icon]||"":"")+"<span>"+esc(text)+"</span>";l.appendChild(d);setTimeout(function(){d.remove();},2400);return;}
  d.className="fx-bubble";d.style.background=bg||"var(--violet)";
  var slot=(FX_BUB++)%5;
  d.style.bottom=(8+slot*9)+"%";
  if(side==="left")d.style.left=(2+Math.random()*10)+"%";else d.style.right=(2+Math.random()*10)+"%";
  d.innerHTML=(icon?ICO[icon]||"":"")+"<span>"+esc(text)+"</span>";
  l.appendChild(d);setTimeout(function(){d.remove();},2700);
}
function fxFlash(color){var l=fxLayer(),d=document.createElement("div");d.className="fx-flash";d.style.background=color;l.appendChild(d);setTimeout(function(){d.remove();},750);}
function fxPts(text,x,y,color){var l=fxLayer(),d=document.createElement("div");d.className="fx-pts";d.textContent=text;d.style.left=x+"px";d.style.top=y+"px";if(color)d.style.color=color;l.appendChild(d);setTimeout(function(){d.remove();},1450);}

/* confettis : burst depuis un point, ou pluie */
var CONF={c:null,p:[],raf:0};
function confetti(opt){
  if(fxReduced())return;
  opt=opt||{};
  if(!CONF.c){CONF.c=document.createElement("canvas");CONF.c.className="fx-confetti";document.body.appendChild(CONF.c);}
  var cv=CONF.c,W=cv.width=window.innerWidth,H=cv.height=window.innerHeight,n=opt.n||140;
  for(var i=0;i<n;i++){
    var rain=opt.rain,x=rain?Math.random()*W:(opt.x!==undefined?opt.x:W/2),y=rain?-20-Math.random()*H*0.5:(opt.y!==undefined?opt.y:H*0.45);
    var a=Math.random()*Math.PI*2,s=rain?1+Math.random()*2:4+Math.random()*9;
    CONF.p.push({x:x,y:y,vx:rain?(Math.random()-0.5)*2:Math.cos(a)*s,vy:rain?2+Math.random()*3:Math.sin(a)*s-6,r:4+Math.random()*6,c:(opt.colors||FX_COLORS)[i%(opt.colors||FX_COLORS).length],rot:Math.random()*6,vr:(Math.random()-0.5)*0.3,life:rain?260:150+Math.random()*60,shape:i%3});
  }
  if(!CONF.raf)CONF.raf=requestAnimationFrame(confStep);
}
function confStep(){
  var cv=CONF.c,g=cv.getContext("2d");g.clearRect(0,0,cv.width,cv.height);
  CONF.p=CONF.p.filter(function(p){return p.life>0&&p.y<cv.height+30;});
  CONF.p.forEach(function(p){
    p.vy+=0.18;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--;
    g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.life/40);
    if(p.shape===0)g.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);
    else if(p.shape===1){g.beginPath();g.arc(0,0,p.r/2.4,0,6.3);g.fill();}
    else{g.beginPath();g.moveTo(0,-p.r/2);g.lineTo(p.r/2,p.r/2);g.lineTo(-p.r/2,p.r/2);g.fill();}
    g.restore();
  });
  if(CONF.p.length)CONF.raf=requestAnimationFrame(confStep);else{CONF.raf=0;g.clearRect(0,0,cv.width,cv.height);}
}

/* ─── Fin de partie : torches du podium (3ᵉ, puis 2ᵉ, puis 1ᵉʳ s’allument) ───
   entries = [{name, sub, color, ini}] (ordre : 1er, 2e, 3e) */
function podiumHtml(entries){
  var order=[1,0,2],h='<div class="podium" role="list"><span class="wire" aria-hidden="true"></span>';
  order.forEach(function(i){
    var e=entries[i];
    h+='<div class="pod p'+(i+1)+(e?"":" empty")+'" data-r="'+(i+1)+'" role="listitem"><span class="cord"></span><span class="bulb" aria-hidden="true"><span class="cap"></span><span class="glass">'+(i+1)+"</span></span>"+
      (e?'<div class="who">'+(i===0?'<div class="crown">'+ICO.crown+"</div>":"")+'<div class="av" style="background:'+esc(e.color||"#6A4B8A")+'">'+esc(e.ini||"?")+'</div><div class="nm">'+esc(e.name)+'</div><div class="sc">'+esc(e.sub||"")+"</div></div>":'<div class="who"></div>')+"</div>";
  });
  return h+"</div>";
}
function playPodium(root,onDone,silent){
  var p3=root.querySelector(".pod.p3"),p2=root.querySelector(".pod.p2"),p1=root.querySelector(".pod.p1");
  if(!silent)SND.drum(14);
  setTimeout(function(){if(p3){p3.classList.add("show");if(!silent)SND.pop();}},400);
  setTimeout(function(){if(p2){p2.classList.add("show");if(!silent)SND.pop();}},1500);
  setTimeout(function(){
    if(p1)p1.classList.add("show");
    if(!silent)SND.fanfare();
    var r=p1?p1.getBoundingClientRect():null;
    confetti({n:180,x:r?r.left+r.width/2:undefined,y:r?r.top:undefined});
    setTimeout(function(){confetti({rain:true,n:160});},700);
    if(onDone)setTimeout(onDone,1400);
  },2700);
}
function initials(s){var w=String(s||"?").replace(/^Les\s+/i,"").trim().split(/\s+/);return ((w[0]||"?").charAt(0)+(w[1]?w[1].charAt(0):"")).toUpperCase();}

/* ═══ Scène « Duel » : course de bannières ═══ */
function rocketSvg(color){
  /* une lance portant la bannière de la guilde ; les étincelles (.flm) s’animent derrière */
  return '<svg viewBox="0 0 80 40" class="rk"><g class="flm"><path d="M12 20c-5-5-9-4-11 0 2 4 6 5 11 0z" fill="#B8892F"/><path d="M12 20c-3-2-6-2-7 0 1 2 4 2 7 0z" fill="#F2E6C8"/></g>'+
    '<rect x="14" y="18.5" width="58" height="3" rx="1.5" fill="#5A4632"/><path d="M72 15.5 80 20l-8 4.5z" fill="#C9CCD2" stroke="#8A8D94" stroke-width=".8" stroke-linejoin="round"/>'+
    '<path d="M64 20 28 11l7 9-7 9z" fill="'+color+'" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-linejoin="round"/><path d="M60 20 38 14.5" stroke="rgba(255,255,255,.35)" stroke-width="1.6" stroke-linecap="round"/></svg>';
}
function raceHtml(teams){
  var h='<div class="race">';
  teams.forEach(function(t,i){
    h+='<div class="lane" data-t="'+i+'"><div class="ln-name" style="color:'+t.d+'">'+esc(t.n)+'</div><div class="track"><div class="finish">'+ICO.flag+'</div>'+
      '<div class="rocket" style="left:4%">'+rocketSvg(t.c)+'<b class="rk-sc">0</b></div></div></div>';
  });
  return h+"</div>";
}
/* scores : tableau ; progress : 0..1 avancement de la partie */
function raceUpdate(root,scores,progress,boost){
  var mx=Math.max.apply(null,scores.concat([1])),lead=8+80*clamp(progress,0,1);
  $$(".lane",root).forEach(function(l){
    var i=+l.getAttribute("data-t"),r=l.querySelector(".rocket"),s=scores[i]||0;
    r.style.left=(4+(lead-4)*(s/mx))+"%";
    r.querySelector(".rk-sc").textContent=fmtInt(s);
    if(boost&&boost[i]>0){r.classList.remove("boost");void r.offsetWidth;r.classList.add("boost");}
    l.classList.toggle("lead",s===mx&&s>0);
  });
}

/* ═══ Scène « Aventuriers VS MJ » ═══ */
function bossSvg(){
  /* le MJ : un mage à capuche, yeux luisants, bâton et orbe */
  return '<svg viewBox="0 0 160 170" class="boss-svg"><ellipse cx="80" cy="162" rx="52" ry="7" fill="rgba(0,0,0,.14)"/>'+
  '<path d="M34 156c0-34 8-64 22-82h48c14 18 22 48 22 82z" fill="#5C4575"/><path d="M80 74v82" stroke="rgba(0,0,0,.2)" stroke-width="3"/>'+
  '<path d="M52 82C48 50 60 24 80 24s32 26 28 58c-6 12-50 12-56 0z" fill="#3E3050"/><ellipse cx="80" cy="76" rx="26" ry="24" fill="#241A30"/>'+
  '<path d="M62 106c8 26 28 26 36 0-10 8-26 8-36 0z" fill="#E8E4DC"/>'+
  '<g class="eyes"><ellipse cx="68" cy="72" rx="9" ry="7" fill="#F2E6C8"/><ellipse cx="92" cy="72" rx="9" ry="7" fill="#F2E6C8"/><circle cx="69" cy="73" r="3.6" fill="#7A2A2A"/><circle cx="91" cy="73" r="3.6" fill="#7A2A2A"/></g>'+
  '<path d="M56 60l20 6M104 60 84 66" stroke="#C9B6DE" stroke-width="4" stroke-linecap="round" class="brows"/>'+
  '<path d="M68 92q12 8 24 0" fill="none" stroke="#C9B6DE" stroke-width="3.5" stroke-linecap="round" class="mouth"/>'+
  '<path d="M40 40 80 -8l40 48z" transform="translate(0 6)" fill="#3E3E58"/><path d="M42 44c24 8 52 8 76 0v8c-24 8-52 8-76 0z" fill="#3E3E58" stroke="#B8892F" stroke-width="3"/><path d="M80 14l3 7 7 .6-5.4 4.6 1.8 7L80 29.6 73.6 33.2l1.8-7L70 21.6l7-.6z" fill="#D9B45A"/>'+
  '<path d="M34 112c-10 2-18 8-22 16" stroke="#5C4575" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M126 112c10 2 14-4 18-14" stroke="#5C4575" stroke-width="11" stroke-linecap="round" fill="none"/>'+
  '<rect x="143" y="52" width="5" height="108" rx="2.5" fill="#5A4632"/><circle cx="145.5" cy="46" r="11" fill="#7A5E96" stroke="#D9B45A" stroke-width="3"/><circle cx="142" cy="42" r="3.2" fill="rgba(255,255,255,.65)"/>'+
  '<g class="boss-ko hidden"><path d="M60 66l16 12M76 66 60 78M84 66l16 12M100 66 84 78" stroke="#F2E6C8" stroke-width="4.5" stroke-linecap="round"/></g></svg>';
}
/* le groupe d’aventuriers : guerrier, mage, elfe, nain, voleur */
function classSvg(){
  var skin=["#E3BE94","#EBCDA6","#F0D8B8","#D9AE84","#E8C7A0"],h='<svg viewBox="0 0 200 120" class="class-svg"><ellipse cx="100" cy="114" rx="88" ry="6" fill="rgba(0,0,0,.12)"/>';
  [[30,70,24],[70,62,28],[112,66,26],[152,72,22],[92,92,20]].forEach(function(b,i){
    var x=b[0],y=b[1],r=b[2],acc="",back="";
    if(i===0)acc='<path d="M'+(x-r)+" "+(y-r*0.1)+"a"+r+" "+r+" 0 0 1 "+2*r+' 0z" fill="#9A9CA4" stroke="#6C6E76" stroke-width="2"/><path d="M'+x+" "+(y-r)+"q"+r*0.5+" -"+r*0.5+" "+r*0.8+" -"+r*0.1+'" fill="none" stroke="#A5483F" stroke-width="5" stroke-linecap="round"/>';
    if(i===1)acc='<path d="M'+(x-r*1.15)+" "+(y-r*0.45)+"L"+(x+r*0.1)+" "+(y-r*2)+"L"+(x+r*1.15)+" "+(y-r*0.45)+'z" fill="#4D6F9A" stroke="#385476" stroke-width="2" stroke-linejoin="round"/><circle cx="'+(x+r*0.05)+'" cy="'+(y-r*1.0)+'" r="3" fill="#D9B45A"/>';
    if(i===2)back='<path d="M'+(x-r)+" "+y+"l-"+r*0.55+" -"+r*0.55+" "+r*0.2+" "+r*0.8+"zM"+(x+r)+" "+y+"l"+r*0.55+" -"+r*0.55+" -"+r*0.2+" "+r*0.8+'z" fill="'+skin[i]+'"/>';
    if(i===2)acc='<path d="M'+(x-r)+" "+(y-r*0.3)+"q"+r+" -"+r*1.1+" "+2*r+' 0" fill="#5C7A46"/>';
    if(i===3)acc='<path d="M'+(x-r*0.8)+" "+(y+r*0.2)+"q"+r*0.8+" "+r*1.5+" "+r*1.6+' 0z" fill="#9A5B2E"/><path d="M'+(x-r)+" "+(y-r*0.15)+"a"+r+" "+r+" 0 0 1 "+2*r+' 0z" fill="#8A8D94" stroke="#6C6E76" stroke-width="2"/>';
    if(i===4)acc='<path d="M'+(x-r*1.05)+" "+(y+r*0.5)+"q-"+r*0.1+" -"+r*1.6+" "+r*1.05+" -"+r*1.6+"q"+r*1.15+" 0 "+r*1.05+" "+r*1.6+"q-"+r*0.5+" -"+r*0.9+" -"+r*1.05+" -"+r*0.9+"q-"+r*0.55+" 0 -"+r*1.05+" "+r*0.9+'z" fill="#4A4A55"/>';
    h+='<g class="kid" style="animation-delay:'+(i*0.15)+'s">'+back+'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+skin[i]+'"/>'+
      '<circle cx="'+(x-r*0.33)+'" cy="'+(y+r*0.05)+'" r="'+r*0.13+'" fill="#2B2A33"/><circle cx="'+(x+r*0.33)+'" cy="'+(y+r*0.05)+'" r="'+r*0.13+'" fill="#2B2A33"/>'+
      (i===3?"":'<path d="M'+(x-r*0.28)+' '+(y+r*0.4)+'q'+r*0.28+' '+r*0.26+' '+r*0.56+' 0" stroke="#2B2A33" stroke-width="2.6" fill="none" stroke-linecap="round"/>')+acc+'</g>';
  });
  return h+"</svg>";
}
function bossHtml(){
  return '<div class="arena"><div class="fighter f-class"><div class="hpw"><b>Les Aventuriers</b><div class="hp"><i class="hp-c" style="width:100%"></i></div><span class="hp-n hp-cn">100</span></div>'+classSvg()+'</div>'+
    '<div class="vs">VS</div><div class="fighter f-boss"><div class="hpw"><b>Le MJ</b><div class="hp boss"><i class="hp-p" style="width:100%"></i></div><span class="hp-n hp-pn">100</span></div>'+bossSvg()+'</div><div class="shots"></div></div>';
}
/* st = {pc,pp,mc,mp} ; dmg = {toProf, toClass} */
function bossUpdate(root,st,dmg){
  var pc=Math.max(0,st.pc),pp=Math.max(0,st.pp);
  var c=root.querySelector(".hp-c"),p=root.querySelector(".hp-p");
  if(!c||!p)return;
  c.style.width=(100*pc/st.mc)+"%";p.style.width=(100*pp/st.mp)+"%";
  root.querySelector(".hp-cn").textContent=Math.round(pc);root.querySelector(".hp-pn").textContent=Math.round(pp);
  root.querySelector(".boss-ko").classList.toggle("hidden",pp>0);
  var boss=root.querySelector(".f-boss"),cls=root.querySelector(".f-class"),shots=root.querySelector(".shots");
  if(!dmg)return;
  if(dmg.toProf>0){
    for(var i=0;i<Math.min(6,1+Math.round(dmg.toProf/6));i++){
      (function(k){setTimeout(function(){var s=document.createElement("div");s.className="shot star";s.innerHTML=ICO.star;s.style.top=(30+Math.random()*30)+"%";shots.appendChild(s);setTimeout(function(){s.remove();},800);},k*110);})(i);
    }
    setTimeout(function(){boss.classList.remove("hit");void boss.offsetWidth;boss.classList.add("hit");SND.hit();dmgNum(boss,"−"+Math.round(dmg.toProf),"#A5483F");},650);
  }
  if(dmg.toClass>0){
    setTimeout(function(){
      var s=document.createElement("div");s.className="shot zap";s.innerHTML=ICO.bolt;s.style.top=(35+Math.random()*20)+"%";shots.appendChild(s);setTimeout(function(){s.remove();},800);
      setTimeout(function(){cls.classList.remove("hit");void cls.offsetWidth;cls.classList.add("hit");dmgNum(cls,"−"+Math.round(dmg.toClass),"#7A5E96");},600);
    },dmg.toProf>0?900:100);
  }
}
function dmgNum(el,txt,color){var d=document.createElement("div");d.className="dmg";d.textContent=txt;d.style.color=softc(color);el.appendChild(d);setTimeout(function(){d.remove();},1300);}

/* ═══ Scène « Chacun sa quête » : top 5 animé ═══ */
function leaderHtml(){return '<div class="leader"></div>';}
function leaderUpdate(root,list,prevRanks){
  /* list = [{id,p,s,dl}] trié ; prevRanks = {id:rang précédent} */
  var box=root.querySelector(".leader");if(!box)return;
  var top=list.slice(0,5),mx=Math.max.apply(null,top.map(function(x){return x.s;}).concat([1]));
  box.innerHTML=top.map(function(x,i){
    var pr=prevRanks&&prevRanks[x.id]!==undefined?prevRanks[x.id]:i,mv=pr-i;
    return '<div class="lrow'+(i===0?" first":"")+'" style="animation-delay:'+(i*0.08)+'s"><span class="lrk">'+(i+1)+'</span><span class="lnm">'+esc(x.p)+'</span>'+
      (mv>0?'<span class="lmv up">▲'+mv+'</span>':mv<0?'<span class="lmv dn">▼'+(-mv)+'</span>':'<span class="lmv"></span>')+
      '<span class="lbar"><i style="width:'+Math.max(4,100*x.s/mx)+'%"></i></span><span class="lsc">'+fmtInt(x.s)+(x.dl?'<small>+'+fmtInt(x.dl)+'</small>':"")+'</span></div>';
  }).join("")||'<div class="muted" style="text-align:center;padding:1rem">Le classement apparaîtra après la première question.</div>';
}
