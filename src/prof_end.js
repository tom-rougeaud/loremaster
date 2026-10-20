/* ═══════════════════════════════════════════════════════════════
   PAGE MJ — 5. Fin de partie : podium, bilan, exports, historique
═══════════════════════════════════════════════════════════════ */
var PALETTE=["#B8892F","#8C8C96","#A5693F","#5C7A46","#7A5E96","#4D6F9A"];
function endGame(early){
  if(!G)return;
  clearInterval(G.tick);clearInterval(G.autoT);
  G.phase="end";G.cur=false;
  var played=G.hist.filter(function(h){return h;}),nq=played.length;
  var ranking=rankList(),pod=[],win=null,title="",sub="";
  if(G.mode==="duel"){
    var ts=G.teams.map(function(t,k){return {k:k,n:t.n,s:G.tscore[k]||0};}).sort(function(a,b){return b.s-a.s;});
    pod=ts.slice(0,3).map(function(t){return {name:t.n,sub:fmtInt(t.s)+" pts",color:TEAMS[t.k].c,ini:initials(t.n)};});
    win=ts.length?ts[0].k:null;
    title=ts.length&&ts.length>1&&ts[0].s===ts[1].s?"Égalité au sommet !":(ts[0]?ts[0].n+" gagnent !":"Fin de la partie");
  }else if(G.mode==="boss"){
    var b=G.boss,cw=b.pp<=0&&b.pc>0?true:b.pc<=0&&b.pp>0?false:(b.pc/b.mc>=b.pp/b.mp);
    win=cw?"class":"prof";
    title=cw?"Les aventuriers ont battu le MJ !":"Le MJ gagne… cette fois !";
    pod=ranking.slice(0,3).map(function(x,i){return {name:x.p,sub:fmtInt(x.s)+" pts",color:PALETTE[i],ini:initials(x.p)};});
  }else{
    pod=ranking.slice(0,3).map(function(x,i){return {name:x.p,sub:fmtInt(x.s)+" pts",color:PALETTE[i],ini:initials(x.p)};});
    title=pod.length?"Bravo "+pod[0].name+" !":"Fin de la partie";
  }
  var rate=nq?played.reduce(function(s,h){return s+h.rate;},0)/nq:0;
  sub=(early?"Partie écourtée · ":"")+nq+" question"+(nq>1?"s":"")+" · "+plist().length+" aventurier"+(plist().length>1?"s":"")+" · "+Math.round(rate*100)+" % de réussite";
  var rk={};ranking.forEach(function(x,i){var p=G.players[x.id];rk[x.id]=[i+1,p.score,p.ok,nq,p.best,p.free,p.wire];});
  var en={t:"en",m:G.mode,pod:pod,rk:rk,win:win,nq:nq,np:plist().length,title:title};
  if(G.mode==="duel")en.tn=G.teams.map(function(t){return t.n;}),en.ts=G.tscore.slice();
  if(G.mode==="boss"){en.ba=Math.round(G.boss.A/Math.max(1,nq));en.bm=Math.round(G.boss.M/Math.max(1,nq));sub+=" · par question : aventuriers "+fmtInt(en.ba)+" pts en moyenne, MJ "+fmtInt(en.bm)+" pts";}
  G.lastEn=en;send(en);
  saveHistory(early,nq,rate,title);
  hostPing(false);snapshot();
  /* écran de fin */
  show("s-end");
  $("end-title").textContent=G.mode==="boss"?"Fin du combat !":"Qui montera sur le podium ?";
  $("end-sub").textContent=sub;$("end-body").classList.add("hidden");
  var anim=$("end-anim");
  if(G.mode==="boss"){
    anim.innerHTML='<div class="card boss-end"><div class="big" style="color:'+(win==="class"?"var(--mint-d)":"var(--grape)")+'">'+esc(title)+"</div>"+bossHtml()+'</div><h2 style="text-align:center;margin-top:1.2rem">Les meilleurs aventuriers</h2>'+podiumHtml(pod);
    var ar=anim.querySelector(".arena");bossUpdate(ar.parentNode,G.boss);
    if(win==="class"){ar.querySelector(".boss-ko").classList.remove("hidden");SND.fanfare();confetti({rain:true,n:200});}
    else{ar.querySelector(".f-boss").classList.add("hit");SND.bad();}
    setTimeout(function(){playPodium(anim,endShowBody);},1600);
  }else{
    anim.innerHTML=podiumHtml(pod)+(G.mode==="duel"?'<h2 style="text-align:center;margin-top:1.2rem">Les meilleurs aventuriers</h2><div class="card" style="max-width:40rem;margin:.6rem auto 0">'+leaderHtml()+"</div>":"");
    if(G.mode==="duel")leaderUpdate(anim,ranking.map(function(x){return {id:x.id,p:x.p,s:x.s};}),null);
    playPodium(anim,function(){$("end-title").textContent=title;endShowBody();});
  }
  renderEndTables(ranking,played);
}
function endShowBody(){$("end-body").classList.remove("hidden");}
function renderEndTables(ranking,played){
  var h='<table class="rank-t"><tr><th>#</th><th>Aventurier</th>'+(G.mode==="duel"?"<th>Guilde</th>":"")+"<th>Points</th><th>Bonnes rép.</th><th>Meilleure série</th></tr>";
  ranking.forEach(function(x,i){var p=G.players[x.id];h+='<tr class="r"><td>'+(i+1)+"</td><td>"+esc(p.p)+"</td>"+(G.mode==="duel"?"<td>"+(p.team>=0&&G.teams[p.team]?esc(G.teams[p.team].n):"—")+"</td>":"")+"<td>"+fmtInt(p.score)+"</td><td>"+p.ok+" / "+played.length+"</td><td>"+p.best+"</td></tr>";});
  $("end-rank").innerHTML=h+"</table>";
  $("end-qs").innerHTML=played.map(function(hq,i){var pc=Math.round(hq.rate*100);return '<div class="qbil"><b>'+(i+1)+'</b><div><div>'+rt(hq.q)+'</div><div class="small muted">Réponse : '+rt(hq.ans)+"</div>"+'</div><div><div class="qb"><i style="width:'+pc+'%"></i></div><div class="small" style="text-align:right;font-weight:900">'+pc+" %</div></div></div>";}).join("")||'<p class="muted">Aucune question jouée.</p>';
  $("end-diag").innerHTML=diagHtml(played);
}
/* diagnostic de fin de partie : réussite par thème, questions les plus ratées */
function diagStats(played){
  var N={};
  played.forEach(function(h){var t=h.titre||"Thème";N[t]=N[t]||{s:0,n:0};N[t].s+=h.rate;N[t].n++;});
  var nots=Object.keys(N).map(function(t){return {t:t,r:N[t].s/N[t].n,n:N[t].n};}).sort(function(a,b){return a.r-b.r;});
  var hard=played.filter(function(h){return h.nAns>0;}).slice().sort(function(a,b){return a.rate-b.rate;}).slice(0,5);
  return {nots:nots,hard:hard};
}
function diagHtml(played){
  if(!played.length)return '<p class="muted">Aucune question jouée.</p>';
  var d=diagStats(played);
  var a='<div class="dg"><h4>Les questions les plus ratées</h4>'+d.hard.map(function(h){var pc=Math.round(h.rate*100);return '<div class="dr"><span>'+rt(h.q)+' <small class="muted">→ '+rt(h.ans)+'</small></span><b>'+pc+' %</b><div class="dbar '+(pc>=75?"g":pc>=50?"m":"")+'"><i style="width:'+Math.max(3,pc)+'%"></i></div></div>';}).join("")+
    '<p class="small muted" style="margin:.5rem 0 0">Une bonne occasion de raconter l’histoire derrière la réponse.</p></div>';
  var b='<div class="dg"><h4>Réussite par thème</h4>'+d.nots.slice(0,8).map(function(n){var pc=Math.round(n.r*100);return '<div class="dr"><span>'+esc(n.t)+' <small class="muted">('+n.n+" q.)</small></span><b>"+pc+' %</b><div class="dbar '+(pc>=75?"g":pc>=50?"m":"")+'"><i style="width:'+Math.max(3,pc)+'%"></i></div></div>';}).join("")+
    (d.nots.length>1&&d.nots[0].r<0.5?'<p class="small" style="margin:.5rem 0 0">Thème le plus difficile : <b>'+esc(d.nots[0].t)+"</b>.</p>":"")+"</div>";
  return '<div class="diag">'+a+b+"</div>";
}
function csvCell(s){s=String(s===undefined||s===null?"":s);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function csv(rows){return "﻿"+rows.map(function(r){return r.map(csvCell).join(";");}).join("\r\n");}
$("end-csv1").addEventListener("click",function(){
  if(!G)return;var played=G.hist.filter(function(h){return h;});
  var rows=[["Rang","Aventurier"].concat(G.mode==="duel"?["Guilde"]:[]).concat(["Points","Bonnes réponses","Questions"]).concat(played.map(function(h,i){return "Q"+(i+1);}))];
  rankList().forEach(function(x,i){var p=G.players[x.id];rows.push([i+1,p.p].concat(G.mode==="duel"?[p.team>=0&&G.teams[p.team]?G.teams[p.team].n:""]:[]).concat([p.score,p.ok,played.length]).concat(played.map(function(h){var a=p.ans[h.i];return !a||!a.an?"—":a.ok?"juste":a.pa?"presque":"faux";})));});
  download("lore_master_resultats_"+G.code+".csv",csv(rows),"text/csv;charset=utf-8");
});
$("end-csv2").addEventListener("click",function(){
  if(!G)return;
  var rows=[["N°","Thème","Question","Bonne réponse","Réussite (%)","Réponses","Source"]];
  G.hist.filter(function(h){return h;}).forEach(function(h,i){rows.push([i+1,h.titre||"",plain(h.q),plain(h.ans),Math.round(h.rate*100),h.nAns,h.src||""]);});
  download("lore_master_questions_"+G.code+".csv",csv(rows),"text/csv;charset=utf-8");
});
$("end-again").addEventListener("click",function(){if(!P.sel.length){show("s-pick");return;}generate();});
$("end-new").addEventListener("click",function(){closeRoom();show("s-pick");renderTree();});

/* ─── historique : sur cet ordinateur + en ligne (clé du MJ) ─── */
function teacherKey(){var k=store.get("tkey",null);if(!k||k.length<16){k="lm-"+genId()+genId()+genId();store.set("tkey",k);}return k;}
function histSummary(early,nq,rate,title){
  var played=G.hist.filter(function(h){return h;});
  return {v:3,at:Date.now(),code:G.code,mode:G.mode,title:title,early:!!early,n:plist().length,nq:nq,rate:Math.round(rate*100)/100,
    teams:G.mode==="duel"?G.teams.map(function(t,k){return {n:t.n,s:G.tscore[k]||0};}):null,boss:G.mode==="boss"?G.boss:null,
    players:rankList().map(function(x){var p=G.players[x.id];return {p:p.p,s:p.score,ok:p.ok,team:p.team,best:p.best};}),
    qs:played.map(function(h){return {q:h.q,ans:h.ans,rate:Math.round(h.rate*100)/100,n:h.nAns,t:h.titre||"",id:h.qid||""};})};
}
function saveHistory(early,nq,rate,title){
  if(!nq)return;
  var s=histSummary(early,nq,rate,title),hist=store.get("hist",[]);
  hist.unshift(s);store.set("hist",hist.slice(0,40));
  rpc("lm_save_result",{p_code:G.code,p_token:G.token,p_key:teacherKey(),p_mode:G.mode,p_title:MODES[G.mode].nom+" · "+title,p_summary:s}).catch(function(){});
}
function histRow(s,i,src){
  var d=new Date(s.at);
  return '<div class="hrow"><div><b>'+esc(MODES[s.mode]?MODES[s.mode].nom:s.mode)+" · "+esc(s.title||"")+'</b><small>'+d.toLocaleDateString("fr-FR")+" "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+" · "+(s.n||0)+" aventuriers · "+(s.nq||0)+" questions · "+Math.round((s.rate||0)*100)+' % de réussite</small></div>'+
    '<button type="button" class="btn btn-sm btn-soft" data-hcsv="'+i+'" data-src="'+src+'">'+ICO.download+'CSV</button><button type="button" class="btn btn-sm btn-ghost" data-hdel="'+i+'" data-src="'+src+'">'+ICO.trash+"</button></div>";
}
var HIST_DB=[];
function renderHist(tab){
  $$("#h-tabs button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-h")===tab);});
  if(tab==="local"){
    var hist=store.get("hist",[]);
    $("h-body").innerHTML=(hist.length?hist.map(function(s,i){return histRow(s,i,"local");}).join(""):'<p class="muted">Aucune partie enregistrée sur cet ordinateur.</p>')+'<p class="small muted">Gardé uniquement dans ce navigateur (40 dernières parties).</p>';
    return;
  }
  var k=teacherKey();
  $("h-body").innerHTML='<div class="info small">Les bilans pseudonymes sont gardés <b>30 jours</b> dans votre base, rattachés à votre <b>clé du MJ</b>. Pour les retrouver sur un autre ordinateur, copiez cette clé là-bas.<div style="display:flex;gap:.4rem;margin-top:.5rem;flex-wrap:wrap"><input class="inp" id="h-key" value="'+esc(k)+'" style="flex:1;min-width:12rem;font-family:monospace"><button type="button" class="btn btn-sm btn-soft" id="h-copy">Copier</button><button type="button" class="btn btn-sm btn-soft" id="h-use">Utiliser cette clé</button></div></div><div id="h-db" style="margin-top:.8rem"><div class="dots"><span></span><span></span><span></span></div></div>';
  rpc("lm_list_results",{p_key:k}).then(function(list){
    HIST_DB=list||[];
    $("h-db").innerHTML=HIST_DB.length?HIST_DB.map(function(s,i){return histRow({at:Date.parse(s.at),mode:s.mode,title:(s.title||"").replace(/^[^·]*·\s*/,""),n:s.n,nq:s.nq,rate:s.rate},i,"db");}).join(""):'<p class="muted">Aucune partie en ligne pour cette clé.</p>';
  }).catch(function(e){$("h-db").innerHTML='<div class="err">'+esc(netErrText(e))+"</div>";});
}
$("h-tabs").addEventListener("click",function(e){var b=e.target.closest("button");if(b)renderHist(b.getAttribute("data-h"));});
$("h-body").addEventListener("click",function(e){
  var t=e.target;
  if(t.closest("#h-copy")){var i=$("h-key");i.select();try{navigator.clipboard.writeText(i.value).then(function(){toast("Clé copiée.","ok");},function(){document.execCommand("copy");toast("Clé copiée.","ok");});}catch(x){document.execCommand("copy");}return;}
  if(t.closest("#h-use")){var v=$("h-key").value.trim();if(v.length<16){toast("Clé trop courte.","ko");return;}store.set("tkey",v);renderHist("db");return;}
  var c=t.closest("[data-hcsv]"),d=t.closest("[data-hdel]");
  if(c){
    var i2=+c.getAttribute("data-hcsv");
    var go=function(s){if(!s){toast("Bilan introuvable.","ko");return;}var rows=[["Rang","Aventurier","Points","Bonnes réponses"]];(s.players||[]).forEach(function(p,i){rows.push([i+1,p.p,p.s,p.ok]);});rows.push([]);rows.push(["Question","Bonne réponse","Réussite (%)"]);(s.qs||[]).forEach(function(q){rows.push([plain(q.q),plain(q.ans),Math.round(q.rate*100)]);});download("lore_master_bilan_"+(s.code||"")+".csv",csv(rows),"text/csv;charset=utf-8");};
    if(c.getAttribute("data-src")==="local")go(store.get("hist",[])[i2]);
    else rpc("lm_get_result",{p_key:teacherKey(),p_id:HIST_DB[i2].id}).then(go).catch(function(e2){toast(netErrText(e2),"ko");});
    return;
  }
  if(d){
    var j=+d.getAttribute("data-hdel");
    if(d.getAttribute("data-src")==="local"){var hs=store.get("hist",[]);hs.splice(j,1);store.set("hist",hs);renderHist("local");}
    else rpc("lm_delete_result",{p_key:teacherKey(),p_id:HIST_DB[j].id}).then(function(){renderHist("db");}).catch(function(e3){toast(netErrText(e3),"ko");});
  }
});

/* ─── diagnostic de la base ─── */
function dl(ok,txt){return "<div>"+(ok?'<span class="g">'+ICO.check+"</span>":'<span class="b">'+ICO.cross+"</span>")+"<span>"+txt+"</span></div>";}
function openDiag(){openModal("m-diag");runDiag();}
function setupSteps(){
  return '<ol class="steps-db"><li>Utilisez votre projet <b>Supabase</b> (région Union européenne) ; les tables de Lore Master sont préfixées <code>lm_</code> et cohabitent avec celles d’autres applis.</li><li>Dans <b>SQL Editor</b>, collez le contenu du fichier <code>lore_master.sql</code> puis cliquez sur <b>Run</b>.</li><li>Dans <b>Project Settings › API</b>, copiez l’URL du projet et la clé <b>anon</b> (publique).</li><li>Collez-les dans le fichier <code>config.js</code> sur GitHub, puis rechargez cette page.</li></ol><p class="small muted">Tout est détaillé dans la notice PDF fournie avec l’application.</p>';
}
function runDiag(){
  var c=lmConfig(),h='<div class="diag-l">';
  if(!c){$("diag-body").innerHTML='<div class="diag-l">'+dl(false,"Le fichier <code>config.js</code> est vide ou absent : la base n’est pas encore branchée.")+"</div>"+setupSteps();return;}
  if(c.bad){$("diag-body").innerHTML='<div class="diag-l">'+dl(false,c.bad==="url"?"L’adresse SUPABASE_URL ne ressemble pas à <code>https://xxxx.supabase.co</code>.":"La clé SUPABASE_ANON_KEY semble incomplète.")+"</div>"+setupSteps();return;}
  h+=dl(true,"Fichier config.js trouvé : "+esc(c.url));
  h+=dl(!!(window.supabase&&window.supabase.createClient),"Bibliothèque temps réel intégrée à la page");
  $("diag-body").innerHTML=h+'<div id="diag-db">'+dl(true,"Test de la base en cours…")+"</div></div>";
  rpc("lm_ping",{}).then(function(r){
    var ok=r&&r.ok;
    var x=dl(ok,ok?"Base de données opérationnelle (version "+r.version+", "+r.rooms+" donjon(s) actif(s))":"Réponse inattendue de la base");
    $("diag-db").innerHTML=x+dl(true,"Test du temps réel en cours…");
    var code="T"+Math.floor(Math.random()*900+100);
    return openChannel("diag-"+code,function(){},null).then(function(ch){ch.close();$("diag-db").innerHTML=x+dl(true,"Temps réel opérationnel : tout est prêt pour jouer !");netPill("ok","Base connectée");})
      .catch(function(e){$("diag-db").innerHTML=x+dl(false,"Temps réel indisponible ("+esc(netErrText(e))+"). Vérifiez que Realtime est activé dans votre projet Supabase.");});
  }).catch(function(e){$("diag-db").innerHTML=dl(false,esc(netErrText(e)))+setupSteps();netPill("ko","Base injoignable");});
}
$("diag-run").addEventListener("click",runDiag);
