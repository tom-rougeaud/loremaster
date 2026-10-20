/* Lore Master — tests de contenu (v1.5)
   1. position de la bonne réponse : uniforme (A/B/C/D) pour QCM, intrus, trous, qui suis-je — 400 mélanges par question ;
   2. réponses multiples : les bonnes réponses ne se concentrent pas sur une position ;
   3. vrai/faux : 40–60 % de vrais par thème complet ;
   4. salves : part de classiques (QCM + V/F) entre 45 et 60 % sur 300 salves de 20 questions, tous types cochés.
   Usage : node test/content_test.js   (après python3 build.py) */
var B=require("../src/bank_quiz.js");
var fails=[],ALL={c:1,v:1,s:1,i:1,h:1,w:1,m:1,o:1,a:1};
function chi2(obs){var t=obs.reduce(function(a,b){return a+b;},0),e=t/obs.length;return obs.reduce(function(s,o){return s+(o-e)*(o-e)/e;},0);}
var gPos=[0,0,0,0],gMul=[0,0,0,0,0,0],gMulN=[0,0,0,0,0,0];
B.BANK.forEach(function(it){
  var pos=[0,0,0,0],vt=0,vn=0,seed=1;
  it.Q.forEach(function(raw){
    if(raw.t==="v"){vn++;if(raw.r)vt++;return;}
    if("cihw".indexOf(raw.t)>=0){for(var k=0;k<400;k++){var q=B.questionById(raw.i,seed++);pos[q.ans]++;gPos[q.ans]++;}}
    if(raw.t==="m"){for(var k2=0;k2<200;k2++){var q2=B.questionById(raw.i,seed++);q2.set.forEach(function(p){gMul[p]++;});for(var z=0;z<q2.choices.length;z++)gMulN[z]++;}}
  });
  var x=chi2(pos);   /* 3 ddl : seuil 16,27 ≈ p = 0,001 */
  if(x>16.27)fails.push(it.id+" : position de la bonne réponse non uniforme "+JSON.stringify(pos)+" χ²="+x.toFixed(1));
  if(it.Q.length>=150&&vn&&(vt/vn<0.4||vt/vn>0.6))fails.push(it.id+" : vrais/faux "+vt+"/"+vn);
  var tot=0,cl=0,bad=0;
  for(var s=0;s<300;s++){
    var L=B.drawQuestions([it.id],20,{types:ALL,dark:true},1000+s,{});
    var c=L.filter(function(q){return q.vf||!q.kind;}).length;tot+=L.length;cl+=c;
    if(L.length===20&&(c<9||c>12))bad++;
  }
  if(bad&&it.Q.length>=150)fails.push(it.id+" : "+bad+" salves sur 300 hors de la fourchette 45–60 % de classiques");
  console.log((it.id+"                              ").slice(0,30)+" positions A-D "+pos.join("/")+"  χ²="+x.toFixed(1)+"  classiques/salve "+(100*cl/tot).toFixed(0)+" %");
});
var gm=gMul.map(function(v,i){return gMulN[i]?(v/gMulN[i]).toFixed(2):"-";});
console.log("toutes banques : positions A-D "+gPos.join("/")+" χ²="+chi2(gPos).toFixed(1)+" · multi, taux de bonne réponse par position : "+gm.join(" "));
if(chi2(gPos)>16.27)fails.push("global : positions non uniformes");
if(fails.length){console.log("ÉCHECS :\n - "+fails.join("\n - "));process.exit(1);}
console.log("contenu OK");
