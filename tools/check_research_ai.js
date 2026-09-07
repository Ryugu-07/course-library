#!/usr/bin/env node
"use strict";
// Independent oracles: quadrature, direct matrices, exhaustive constrained search,
// recurrence, and phase integration. No network, packages, or training required.
const assert=require("node:assert/strict");
const lib=require("../course-shared/labs/research-ai.js");
let checks=0;
function near(a,b,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} (tol ${tol})`);checks++;}
function finite(x){if(typeof x==="number")assert.ok(Number.isFinite(x));else if(Array.isArray(x))x.forEach(finite);else if(x&&typeof x==="object")Object.values(x).forEach(finite);}
assert.equal(lib.topics.length,8);
for(const topic of lib.topics){
 const d=lib.compute(topic);finite(d);assert.deepEqual(d,lib.compute(topic));
 for(const c of lib.configs[topic].controls){
   for(const v of [c[2],c[3]]){finite(lib.compute(topic,{[c[0]]:v}));checks++;}
   for(const v of [NaN,Infinity,c[2]-1,c[3]+1]){assert.throws(()=>lib.compute(topic,{[c[0]]:v}));checks++;}
 }
}
assert.throws(()=>lib.compute("fourier",{N:10}));
assert.throws(()=>lib.compute("world",{H:1.5}));
assert.throws(()=>lib.compute("missing"));
// Heat: direct midpoint integration, contraction and composing two times.
for(const t of [0,.4,1,2])for(const k of [2,4,8])for(const b of [0,.7,2]){
 const r=lib.compute("operator",{t,k,b}).numeric;
 let sum=0;for(let j=0;j<4096;j++){const x=2*Math.PI*(j+.5)/4096,d=b*Math.exp(-.1*k*k*t)*Math.sin(k*x);sum+=d*d;}
 near(r.rmse,Math.sqrt(sum/4096));assert.ok(r.outputEnergy<=r.inputEnergy+1e-14);
 const half=lib.compute("operator",{t:t/2,k,b}).numeric;near(half.high*half.high,r.high);checks++;
}
// Spectral oracle from exact trigonometric sampling, not another DFT.
for(const N of [8,16,32])for(const k of [1,3,7,9,16,20])for(const K of [1,7,12]){
 const r=lib.compute("fourier",{N,k,K}),n=r.numeric;
 const folded=k%N,alias=folded>N/2?folded-N:folded;
 const observable=folded!==0&&folded!==N/2,retained=observable&&Math.abs(alias)<=Math.min(K,N/2-1);
 for(const [x,y] of r.chart.series[1].points)near(y,retained?Math.sin(alias*x):0,2e-13);
 near(n.sensorRMS,retained||!observable?0:Math.SQRT1_2,1e-12);
 near(n.denseRMS,!retained?Math.SQRT1_2:alias===k?0:1,1e-12);
}
const fno=lib.compute("fourier").numeric;near(fno.sensorRMS,0);near(fno.denseRMS,1);
// Matrix multiplication oracle: compare ARx with RAx explicitly.
const mv=(A,x)=>A.map(row=>row.reduce((s,a,i)=>s+a*x[i],0));
for(const angle of [0,15,45,90,180])for(const a of [0,1,2,3]){
 const p=angle*Math.PI/180,R=[[Math.cos(p),-Math.sin(p)],[Math.sin(p),Math.cos(p)]],A=[[1,0],[0,a]],x=[1,0];
 const left=mv(A,mv(R,x)),right=mv(R,mv(A,x));
 near(lib.compute("equivariance",{angle,a}).numeric.defect,Math.hypot(left[0]-right[0],left[1]-right[1]));
}
// Bayes posterior: independent likelihood ratios and symmetry, not neural proxy.
for(const y of [-1,0,1,3,5])for(const sigma of [.2,.5,1]){
 const n=lib.compute("inference",{y,sigma}).numeric,p=n.posterior;
 near(p.reduce((a,b)=>a+b),1);near(p[0],p[4]);near(p[1],p[3]);near(n.mean,0);
 const ratio=Math.exp(((y-1)**2-y*y)/(2*sigma*sigma));
 if(p[1]>1e-100)near(p[2]/p[1],ratio,Math.max(1,ratio)*1e-12);
 assert.ok(n.credibleMass>=.8-1e-12);assert.ok(n.coverage>=0&&n.coverage<=1);checks++;
}
// Independent finer midpoint integral; determine inclusion using all probability
// strictly greater than the candidate. Ties are retained together by definition.
function coverageOracle(sigma){let total=0,norm=0;const ts=[-2,-1,0,1,2],dz=.005;
 for(let j=0;j<2400;j++){
  const z=-6+(j+.5)*dz,w=Math.exp(-z*z/2);norm+=w;
  for(const t of ts){const y=t*t+.5*z,logs=ts.map(q=>-((y-q*q)**2)/(2*sigma*sigma)),m=Math.max(...logs),weights=logs.map(l=>Math.exp(l-m)),sum=weights.reduce((a,b)=>a+b),own=weights[ts.indexOf(t)];
   const greater=weights.filter(v=>v>own+1e-14).reduce((a,b)=>a+b,0)/sum;
   if(greater<.8-1e-14)total+=w;
  }
 }
 return total/(5*norm);
}
for(const sigma of [.2,.5,1])near(lib.compute("inference",{sigma}).numeric.coverage,coverageOracle(sigma),.006);
assert.ok(lib.compute("inference").numeric.coverage>=.8);
// World model: repeated multiplication versus closed form, and exact model limit.
for(const a of [.8,1,1.1])for(const delta of [-.1,0,.03,.1])for(const H of [1,10,20]){
 let x=1,y=1;for(let j=0;j<H;j++){x*=a;y*=a+delta;}
 const n=lib.compute("world",{a,delta,H}).numeric;near(n.truth,x,1e-12);near(n.pred,y,1e-12);near(n.error,Math.abs(y-x),1e-12);
}
// MPC: brute-force grid objective on BOTH action variables, independently of
// symmetric closed form; also search remaining one-step problem after feedback.
for(const bhat of [.3,1,1.3,2])for(const target of [.5,1,2])for(const umax of [.1,.6,1]){
 const n=lib.compute("planning",{bhat,target,umax}).numeric;
 const cost=(u,v)=>(bhat*(u+v)-target)**2+.1*(u*u+v*v);
 let best=Infinity,bestRe=Infinity;const steps=200;
 for(let i=0;i<=steps;i++){
  const u=-umax+2*umax*i/steps;
  bestRe=Math.min(bestRe,(n.u+bhat*u-target)**2+.1*u*u);
  for(let j=0;j<=steps;j++)best=Math.min(best,cost(u,-umax+2*umax*j/steps));
 }
 near(n.J,cost(n.u,n.u));assert.ok(n.J<=best+1e-12);assert.ok(best-n.J<=.0003);
 const reCost=(n.u+bhat*n.uRe-target)**2+.1*n.uRe*n.uRe;
 assert.ok(reCost<=bestRe+1e-12);assert.ok(bestRe-reCost<=.0002);
 assert.ok(Math.abs(n.u)<=umax&&Math.abs(n.uRe)<=umax);
 near(n.open,2*n.u);near(n.closed,n.u+n.uRe);checks++;
}
// Exact plant with feedback must reproduce its remaining optimal action.
for(const target of [.5,1,2])for(const umax of [.1,.6,1]){
 const n=lib.compute("planning",{bhat:1,target,umax}).numeric;near(n.u,n.uRe);
}
// Timing: uniform phase midpoint integration is independent of analytic moments.
for(const speed of [0,.5,1])for(const latency of [0,.2,.8])for(const period of [.05,.1,.5]){
 let mean=0,sq=0,corr=0;const N=10000;
 for(let j=0;j<N;j++){const phase=(j+.5)*period/N,e=speed*(latency+phase);mean+=e/N;sq+=e*e/N;corr+=(speed*phase)**2/N;}
 const n=lib.compute("vla",{speed,latency,period}).numeric;
 near(n.mean,mean);near(n.rms,Math.sqrt(sq),2e-9);near(n.correctedRMS,Math.sqrt(corr),2e-9);
}
// Fixed bank, mixture endpoints, ranking reversal and contamination assumption.
const e=lib.compute("embodied").numeric;assert.equal(e.easyCount,95);assert.equal(e.hardCount,35);near(e.balanced,.65);near(e.clean,.83);near(e.baseline,.74);
for(const mix of [0,.2,.5,.8,1])for(const hard of [.1,.35,.9])for(const leak of [0,.4,.8]){
 const n=lib.compute("embodied",{mix,hard,leak}).numeric;
 near(n.clean,mix*.95+(1-mix)*hard);near(n.observed-n.clean,leak*(1-n.clean));checks++;
}
const low=lib.compute("embodied",{mix:.2}).numeric;assert.ok(e.clean>e.baseline&&low.clean<low.baseline);
let chain=1;for(let j=0;j<10;j++)chain*=.9;near(e.stageChain,chain);
console.log(`PASS research-ai: 8 topics; ${checks} numerical assertions / domain cases, deterministic outputs, finite charts; zero dependencies.`);
