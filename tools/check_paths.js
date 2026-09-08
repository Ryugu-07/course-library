"use strict";
const assert=require('node:assert/strict'),lab=require('../course-shared/labs/research-paths.js');let checks=0;
const close=(a,b,tol=1e-9)=>{assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);checks++;};
function fermionSpectrum(L,g,parity){
  // Independent free-fermion occupation enumeration. Keep signed unpaired 0,π modes.
  const weights=Array.from({length:L},(_,m)=>{const k=(2*m+(parity===0?1:0))*Math.PI/L;
    if(parity===1&&m===0)return 2*(g-1);if(parity===1&&m===L/2)return 2*(g+1);
    return 2*Math.sqrt(1+g*g-2*g*Math.cos(k));});
  const result=[];
  for(let mask=0;mask<2**L;mask++){const bits=Array.from({length:L},(_,j)=>(mask>>j)&1);if(bits.reduce((a,b)=>a+b,0)%2===parity)result.push(bits.reduce((e,b,j)=>e+weights[j]*(b-.5),0));}
  return result.sort((a,b)=>a-b);
}
for(const L of [4,6])for(const g of [0,.05,.3,.8,1,1.2,2]){
  const r=lab.compute('ising',{L,g}).numeric;
  for(const [p,key] of [[0,'even'],[1,'odd']]){const expected=fermionSpectrum(L,g,p);expected.forEach((x,i)=>close(r[key][i],x));}
  close(r.evenGap,2*r.epsilon);close(r.even.reduce((s,x)=>s+x,0)+r.odd.reduce((s,x)=>s+x,0),0);
  // Tr H² / dim = L(J²+h²), from orthogonality of Pauli strings.
  close(r.even.concat(r.odd).reduce((s,x)=>s+x*x,0)/2**L,L*(1+g*g));
  if(g===1)close(r.gap,2*Math.tan(Math.PI/(4*L)));if(g===0){close(r.gap,0);close(r.evenGap,4);}
}
// Verify the KL minimizer by an independent endpoint cycle perturbation and arbitrary conditional bridges.
for(const r of [.05,.25,.45])for(const w of [.25,1,2,4])for(const u of [.1,.5,.9]){
 const a=lab.compute('markov',{r,w,u}).numeric;close(a.paths.reduce((s,p)=>s+p.P,0),1);close(a.pathKL,a.endpointKL);
 for(const K of a.transforms)for(const row of K)close(row[0]+row[1],1);
 // Forward dynamics, not direct path enumeration, recovers marginals.
 let mu=[u,1-u];for(let t=0;t<2;t++){const K=a.transforms[t];mu=[mu[0]*K[0][0]+mu[1]*K[1][0],mu[0]*K[0][1]+mu[1]*K[1][1]];close(mu[0],a.marg[t+1][0]);close(mu[1],a.marg[t+1][1]);}
 for(let i=0;i<2;i++)for(let k=0;k<2;k++){
  const rows=a.paths.filter(p=>p.i===i&&p.k===k);rows.forEach(p=>close(p.P/a.pi[i][k],p.R/a.ref[i][k]));
 }
 const d=.1*Math.min(...a.pi.flat());
 for(const sign of [-1,1]){let kl=0;for(let i=0;i<2;i++)for(let k=0;k<2;k++){const p=a.pi[i][k]+sign*d*(i===k?1:-1);kl+=p*Math.log(p/a.ref[i][k]);}assert.ok(kl>=a.endpointKL-1e-12);checks++;}
 // Replace each conditional middle-state law by (1/2,1/2): entropy chain rule then measures the extra cost.
 let pathKL=0,conditionalKL=0;for(let i=0;i<2;i++)for(let k=0;k<2;k++)for(const row of a.paths.filter(p=>p.i===i&&p.k===k)){const p=a.pi[i][k]/2;pathKL+=p*Math.log(p/row.R);conditionalKL+=p*Math.log(.5/(row.R/a.ref[i][k]));}close(pathKL,a.endpointKL+conditionalKL);
 if(w===1){close(a.pathKL,u*Math.log(2*u)+(1-u)*Math.log(2*(1-u)));close(a.transforms[0][0][1],r);}
}
for(const t of lab.topics){for(const c of lab.configs[t].controls){for(const v of [c[2],c[3]]){const a=lab.compute(t,{[c[0]]:v});assert.ok(a.chart.series.every(s=>s.points.every(p=>p.every(Number.isFinite))));checks++;}assert.throws(()=>lab.compute(t,{[c[0]]:NaN}));checks++;}}
assert.throws(()=>lab.compute('ising',{L:5}));checks++;
console.log(`paths checks: PASS (${checks}; spin blocks vs fermionic occupations, Pauli traces, conditional KL and forward propagation)`);
