'use strict';const assert=require('node:assert/strict'),lab=require('../course-shared/labs/riemann-integrability.js');let checks=0;
function check(x,m){checks++;assert.ok(x,m);}function close(a,b,t=2e-12){check(Math.abs(a-b)<=t,`${a} != ${b}`);}function gcd(a,b){while(b){[a,b]=[b,a%b];}return a;}
// Enumerate all reduced rational heights first, independently of the cell search.
const rationals=[];for(let q=1;q<=128;q++)for(let p=0;p<=q;p++)if(gcd(p,q)===1)rationals.push({p,q});
for(let n=2;n<=64;n++){
 const maxq=Array(n).fill(Infinity);
 for(const {p,q}of rationals)for(let i=0;i<n;i++)if(p*n>=i*q && p*n<=(i+1)*q)maxq[i]=Math.min(maxq[i],q);
 const expectedU=maxq.reduce((s,q)=>s+1/q/n,0);
 for(const mode of ['midpoint','left','irrational','alternating'])for(const model of ['continuous','step','thomae','dirichlet']){
  const a=lab.diagnostic({modelId:model,n,tagMode:mode});
  check(a.lower<=a.tagged+1e-12&&a.tagged<=a.upper+1e-12,'Darboux bounds');
  if(model==='continuous'){close(a.lower,(n-1)*(2*n-1)/(6*n*n));close(a.upper,(n+1)*(2*n+1)/(6*n*n));close(a.gap,1/n);if(mode==='midpoint')close(a.tagged,1/3-1/(12*n*n));}
  if(model==='step'){close(a.lower,2-Math.ceil(n/2)/n);close(a.upper,2-(Math.ceil(n/2)-1)/n);close(a.gap,1/n);}
  if(model==='thomae'){close(a.lower,0);close(a.upper,expectedU);for(let i=0;i<n;i++){close(a.cells[i].upper,1/maxq[i]);check(a.cells[i].maxRational.denominator<=n,'endpoint search bound');}}
  if(model==='dirichlet'){close(a.lower,0);close(a.upper,1);}
  let tagged=0;
  for(let i=0;i<n;i++){
   const irrational=mode==='irrational'||(mode==='alternating'&&i%2===1);
   const num=mode==='left'?i:2*i+1,den=mode==='left'?n:2*n;
   const x=irrational?(i+Math.SQRT2/2)/n:num/den;
   const val=model==='continuous'?x*x:model==='step'?(x<.5?1:2):model==='dirichlet'?(irrational?0:1):(irrational?0:gcd(num,den)/den);
   tagged+=val/n;close(a.tags[i].x,x);close(a.tags[i].value,val);
  }close(a.tagged,tagged);
 }
 const p=lab.uniformPartition(n);for(let i=0;i<n;i++)close(lab.thomaeSupremum(p[i],p[i+1]),1/maxq[i]);
}
close(lab.diagnostic({modelId:'continuous',n:8}).tagged,85/256);
check(lab.diagnostic({modelId:'thomae',n:12}).upper>lab.diagnostic({modelId:'thomae',n:11}).upper,'non-nested rebound');
for(let n=2;n<=32;n*=2)check(lab.diagnostic({modelId:'thomae',n:2*n}).upper<=lab.diagnostic({modelId:'thomae',n}).upper,'nested refinement');
for(const f of [()=>lab.diagnostic({modelId:'missing'}),()=>lab.diagnostic({tagMode:'missing'}),()=>lab.diagnostic({n:Infinity}),()=>lab.diagnostic({n:3.5}),()=>lab.uniformPartition(8,-1,1),()=>lab.taggedRiemannSum('thomae',[0,.1,1],'midpoint'),()=>lab.thomaeSupremum(.123,.1230001),()=>lab.valueAt('thomae',{x:.5,kind:'rational',numerator:1,denominator:3}),()=>lab.valueAt('thomae',{x:.5,kind:'rational',numerator:1,denominator:0})]){checks++;assert.throws(f,RangeError);}
console.log(`Riemann integrability independent checks: PASS (${checks})`);
