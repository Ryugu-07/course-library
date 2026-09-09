'use strict';
const assert=require('node:assert/strict'),lab=require('../course-shared/labs/limit-quantifiers.js');let checks=0;
function check(b,m){checks++;assert.ok(b,m);}function close(a,b,t=1e-11){check(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} vs ${b}`);}
for(const model of ['linear','square','jump','reciprocal','oscillatory'])for(const rule of ['eps-over-3','min-one','eps','sqrt-eps','local-square'])for(let k=1;k<=200;k++) {
 const eps=k/20,a=lab.analyze({modelId:model,ruleId:rule,epsilon:eps,probeCount:6});
 const delta=rule==='eps-over-3'?eps/3:rule==='min-one'?Math.min(1,eps/3):rule==='eps'?eps:rule==='sqrt-eps'?Math.sqrt(eps):Math.min(.5,eps/3);
 close(a.delta,delta);
 const limit=model==='linear'?7:model==='square'?1:null;
 const expected=limit===null?null:model==='linear'?(rule!=='eps'&&(rule!=='sqrt-eps'||k>=180)):(rule==='min-one'||rule==='local-square'||(rule==='eps-over-3'&&k<=60));
 check(a.current.valid===expected,`analytic condition ${model} ${rule} ${eps}`);
 if(a.current.witness){const w=a.current.witness;check(w.x>a.model.x0&&w.x<a.model.x0+delta,'legal witness');check(w.error>eps,'witness violates epsilon');close(w.error,Math.abs(lab.evaluate(model,w.x)-limit));}
 for(const row of a.probes){check(row.x!==a.model.x0&&Math.abs(row.x-a.model.x0)<delta,'punctured domain');
  const x=row.x,expectedValue=model==='linear'?3*x+1:model==='square'?x*x:model==='jump'?Math.sign(x):model==='reciprocal'?1/x:Math.sin(1/x);
  close(row.value,expectedValue);if(limit!==null)close(row.error,Math.abs(expectedValue-limit));
 }
}
const hidden=lab.analyze({modelId:'square',ruleId:'eps-over-3',epsilon:4,probeCount:3});check(hidden.failed===0&&!hidden.current.valid,'all probes can pass while analytic criterion fails');
const edge=lab.analyze({modelId:'linear',ruleId:'eps',epsilon:.3,probeCount:5});check(edge.probes.filter(r=>r.boundary).length===2,'strict boundary is unresolved numerically');
for(const eps of [1e-8,.01,.25,1,3,10]){const N=Math.ceil(1/eps);for(const n of [N+1,N+10,N+100])check(1/n<eps,'sequence tail certificate');}
for(let n=1;n<200;n++){const x=1/(2*n*Math.PI),y=1/(2*n*Math.PI+Math.PI/2);close(Math.sin(1/x),0,5e-13);close(Math.sin(1/y),1,5e-13);}
for(const call of [()=>lab.analyze({probeCount:Infinity}),()=>lab.analyze({probeCount:0}),()=>lab.analyze({probeCount:3.5}),()=>lab.analyze({probeCount:1001}),()=>lab.analyze({epsilon:1e-20}),()=>lab.analyze({epsilon:11}),()=>lab.analyze({epsilon:'1'}),()=>lab.evaluate('reciprocal',0),()=>lab.evaluate('linear',NaN),()=>lab.probe('linear','eps',1e-100,6),()=>lab.sideEvidence('square',1e-100,6)]){checks++;assert.throws(call);}
console.log(`Limit quantifiers independent checks: PASS (${checks})`);
