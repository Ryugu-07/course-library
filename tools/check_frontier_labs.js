#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const lab=require("../course-shared/labs/frontier-lab.js");
let checks=0;
function close(a,b,tol=1e-10){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);checks++;}
function yes(value){assert.ok(value);checks++;}
// Entropic coupling: feasibility and stationarity against feasible competitors.
for(const epsilon of [.05,.2,1,2,4]){
  const r=lab.compute("bridge",{epsilon}).numeric;
  close(r.diag+r.off,.5);yes(r.diag>r.off&&r.off>0);
  function objective(d){const o=.5-d,term=x=>x===0?0:x*Math.log(4*x);return 2*o+epsilon*(2*term(d)+2*term(o));}
  for(let i=0;i<=100;i++)yes(objective(i/200)>=r.objective-1e-10);
}
// Independent Gaussian quadrature checks Wick centering and second moment.
function integrate(fn){const n=12000,h=16/n;let sum=0;for(let i=0;i<=n;i++){const z=-8+h*i;sum+=(i===0||i===n?1:i%2?4:2)*fn(z)*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);}return sum*h/3;}
for(const C of [1,4,16]){const r=lab.compute("spde",{C,z:1.5}).numeric;close(integrate(z=>C*(z*z-1)),r.wickMean,1e-10);close(integrate(z=>(C*(z*z-1))**2),r.variance,1e-9);}
// Explicit cyclic permutation acting on a complex Fourier vector.
for(let k=0;k<3;k++)for(let m=0;m<3;m++){
 const r=lab.compute("langlands",{mode:k,shift:m}).numeric;
 for(let j=0;j<3;j++){
  const phase=2*Math.PI*k*j/3,re=Math.cos(phase)/Math.sqrt(3),im=Math.sin(phase)/Math.sqrt(3),next=2*Math.PI*k*((j+m)%3)/3;
  close(r.eigenReal*re-r.eigenImag*im,Math.cos(next)/Math.sqrt(3));
  close(r.eigenImag*re+r.eigenReal*im,Math.sin(next)/Math.sqrt(3));
 }
}
// Product/Bell limits, and A<->B symmetry of Schmidt entropy.
close(lab.compute("entanglement",{theta:0}).numeric.entropy,0);
close(lab.compute("entanglement",{theta:45}).numeric.entropy,1);
close(lab.compute("entanglement",{theta:90}).numeric.entropy,0);
for(let theta=0;theta<=90;theta++)close(lab.compute("entanglement",{theta}).numeric.entropy,lab.compute("entanglement",{theta:90-theta}).numeric.entropy);
// Enumerate all 8 noise patterns rather than reusing the majority formula.
for(const p of [0,.01,.1,.5,.8])for(const correlation of [0,.3,1]){
 let error=0;for(let bits=0;bits<8;bits++){const ones=(bits&1)+((bits>>1)&1)+((bits>>2)&1);if(ones>=2)error+=p**ones*(1-p)**(3-ones);}
 const r=lab.compute("qec",{p,correlation}).numeric;close(r.independent,error);close(r.mixed,(1-correlation)*error+correlation*p);
}
// Pure-state dimensional entropy bound and complement symmetry.
for(let radiation=0;radiation<=12;radiation++){
 const r=lab.compute("holography",{radiation}).numeric;yes(r.bound<=r.radiation&&r.bound<=r.remaining);close(r.bound,lab.compute("holography",{radiation:12-radiation}).numeric.bound);
}
// Numerical continuity equation for the conditional flow velocity.
for(const t of [.1,.3,.5,.8])for(const x of [-1,0,2]){
 const mu=2,dt=1e-5,dx=1e-5;
 function density(time,z){const variance=time*time+(1-time)**2;return Math.exp(-((z-time*mu)**2)/(2*variance))/Math.sqrt(2*Math.PI*variance);}
 function flux(z){const r=lab.compute("flow",{t,mu}).numeric;return density(t,z)*(r.velocityAtMean+r.slope*(z-r.mean));}
 close((density(t+dt,x)-density(t-dt,x))/(2*dt)+(flux(x+dx)-flux(x-dx))/(2*dx),0,2e-8);
}
close(lab.compute("flow",{t:.5,mu:2}).numeric.variance,.5);
// First-accepted selection via recursive probability mass bookkeeping.
for(const p of [0,.2,1])for(const alpha of [0,.1,1])for(const k of [1,8,64]){
 let active=1,correct=0,wrong=0;for(let i=0;i<k;i++){correct+=active*p;wrong+=active*(1-p)*alpha;active*=(1-p)*(1-alpha);}
 const r=lab.compute("reasoning",{p,alpha,k}).numeric;
 close(r.selectedCorrect,correct);close(r.selectedWrong,wrong);close(r.rejected,active);close(r.selectedCorrect+r.selectedWrong+r.rejected,1);
 if(alpha===0)close(r.coverage,r.selectedCorrect);
}
// Redundancy counterexample: individual necessity differs from joint necessity.
for(const input of [0,1])for(const ablate1 of [0,1])for(const ablate2 of [0,1]){
 const r=lab.compute("circuits",{input,ablate1,ablate2}).numeric;
 close(r.y,Number(Boolean(input)&&(!ablate1||!ablate2)));
}
for(const topic of lab.topics){const r=lab.compute(topic);yes(r.chart.series.every(s=>s.points.every(p=>p.every(Number.isFinite))));}
assert.throws(()=>lab.compute("reasoning",{p:-.1}));checks++;
console.log(`PASS: ${checks} checks across ${lab.topics.length} frontier mechanisms`);
