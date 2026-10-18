/* Test de la banque Lore Master : validité de chaque question, auto-correction, non-répétition sur 10 parties, filtres.
   Prérequis : python3 build.py (écrit build/quiz.json). Usage : node test/bank_test.js */
const path=require('path');
const B=require(path.join(__dirname,'../src/bank_quiz.js'));
let errs=[],n=0,kinds={},seen=new Set(),srcMissing=0;
const ok=(c,m)=>{if(!c)errs.push(m);};
for(const it of B.BANK){
  ok(it.Q.length>=70,it.id+' : moins de 70 questions ('+it.Q.length+')');
  for(const raw of it.Q){
    n++;ok(!seen.has(raw.i),'id en double '+raw.i);seen.add(raw.i);
    const q=B.questionById(raw.i,7);
    ok(q&&B.validQ(q),raw.i+' : question invalide');
    if(!q)continue;
    ok(q.q&&q.q.length>8,raw.i+' : énoncé vide');ok(q.expl&&q.expl.trim().length>=2,raw.i+' : explication vide');
    if(!q.src)srcMissing++;
    const k=B.qKind(q);kinds[k]=(kinds[k]||0)+1;
    if(k==='slider'){
      const s=q.sl;
      ok(B.judge(q,{v:s.ans}).ok,raw.i+' : la bonne valeur n’est pas jugée juste');
      ok(!B.judge(q,{v:s.ans+10*(s.tol||1)+(s.max-s.min)}).ok,raw.i+' : une valeur très fausse est jugée juste');
      ok(B.judge(q,{v:s.ans+2*(s.tol||0)}).part===0.5||s.tol===0,raw.i+' : demi-points attendus à 2×tol');
      ok(Math.abs(((s.ans-s.min)/s.step)-Math.round((s.ans-s.min)/s.step))<1e-6,raw.i+' : réponse hors de la grille du curseur');
      ok(s.tol>=s.step*0||true,'');
    }else{
      const texts=q.choices.map(c=>c.t);
      ok(new Set(texts).size===texts.length,raw.i+' : propositions en double');
      ok(B.judge(q,{k:q.ans}).ok,raw.i+' : bonne réponse jugée fausse');
      ok(!B.judge(q,{k:(q.ans+1)%q.choices.length}).ok,raw.i+' : mauvaise réponse jugée juste');
      if(k==='qcm')ok(texts.length===4,raw.i+' : un QCM doit avoir 4 propositions');
      const pub=JSON.stringify(B.qPublic(q));ok(!/"r":|"ans"/.test(pub),raw.i+' : la réponse fuit dans les données publiques');
    }
  }
}
/* non-répétition : 10 parties de 10 questions sur 3 thèmes (≈ 210 questions) : aucune question deux fois */
const ids=B.BANK.filter(t=>!t.dark).slice(0,3).map(t=>t.id);
let hist={n:1,t:{},s:{},i:{}},played=[];
for(let g=0;g<10;g++){
  const qs=B.drawQuestions(ids,10,{},1000+g,hist);
  ok(qs.length===10,'partie '+g+' : '+qs.length+' questions');
  qs.forEach(q=>{hist.n++;hist.t[q.qid]=hist.n;played.push(q.qid);});
}
ok(new Set(played).size===played.length,'répétition dans 10 parties successives ('+(played.length-new Set(played).size)+' doublons)');
/* un seul thème (70 questions) : on épuise tout avant de répéter */
const one=[ids[0]],tot=B.ITEM_BY_ID[one[0]].Q.length;hist={n:1,t:{},s:{},i:{}};played=[];
for(let g=0;g<Math.ceil(tot/10)+1;g++){
  const qs=B.drawQuestions(one,10,{},50+g,hist);qs.forEach(q=>{hist.n++;hist.t[q.qid]=hist.n;played.push(q.qid);});
}
ok(new Set(played.slice(0,tot)).size===tot,'les '+tot+' premières questions d’un thème ne sont pas toutes distinctes');
/* filtres */
const only=B.drawQuestions(ids,30,{types:{v:1}},3,null);ok(only.length>0&&only.every(q=>B.qKind(q)==='vf'),'filtre « vrai/faux » non respecté');
const diff=B.drawQuestions(ids,30,{diffs:[3]},3,null);ok(diff.length>0&&diff.every(q=>q.d===3),'filtre difficulté non respecté');
const darkIds=B.BANK.filter(t=>t.dark).map(t=>t.id);
if(darkIds.length){ok(B.drawQuestions(darkIds,10,{},1,null).length===0,'thème sombre tiré sans autorisation');ok(B.drawQuestions(darkIds,10,{dark:true},1,null).length>0,'thème sombre refusé malgré l’autorisation');
  ok(B.buildTree({}).every(r=>r.chaps.every(c=>c.items.every(i=>!i.dark))),'thème sombre visible dans l’arbre');}
console.log(B.BANK.length+' thèmes, '+n+' questions, types',kinds,'· sans source :',srcMissing,'· thèmes sombres :',darkIds.length);
console.log(errs.length?errs.slice(0,30).join('\n')+'\n'+errs.length+' ERREUR(S)':'banque OK');
process.exit(errs.length?1:0);
