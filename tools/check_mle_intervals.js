"use strict";
const assert=require('node:assert/strict'),m=require('../course-shared/labs/mle-asymptotics');let checks=0;
function ok(v,s){checks++;assert(v,s)}function near(a,b,t=2e-12){ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`)}
const z=1.959963984540054;
for(const n of [1,5,30,80,200])for(const p of [0,5e-13,.01,.05,.3,.5,.99,1-5e-13,1]){
 let pmf=[1];for(let j=0;j<n;j++){const next=Array(j+2).fill(0);for(let k=0;k<=j;k++){next[k]+=pmf[k]*(1-p);next[k+1]+=pmf[k]*p;}pmf=next;}
 const l=m.bernoulliLedger(n,p);l.distribution.forEach((r,k)=>near(r.probability,pmf[k]));near(l.mean,p);near(l.variance,p*(1-p)/n);
 let wald=0,wilson=0;for(let k=0;k<=n;k++){const phat=k/n; // independent score inequality, avoiding Wilson endpoints
 if(n*(phat-p)**2<=z*z*p*(1-p))wilson+=pmf[k];
 if(Math.abs(phat-p)<=z*Math.sqrt(phat*(1-phat)/n))wald+=pmf[k];
 const wi=m.wilsonInterval(k,n,z);ok(wi[0]>=0&&wi[1]<=1&&wi[0]<=wi[1],'valid Wilson');
 }near(m.exactCoverage(n,p,'wilson'),wilson);near(m.exactCoverage(n,p,'wald'),wald);
}
// A tiny interior value must not inherit degenerate Wald coverage 1.
ok(m.exactCoverage(30,5e-13,'wald')<1e-8,'no tolerance-created coverage');
for(const n of [5,30,200]){const interval=m.wilsonInterval(0,n,z);const outside=interval[1]+1e-13;ok(!(outside>=interval[0]&&outside<=interval[1]),'no interval thickening');}
console.log(`MLE/interval independent checks: PASS (${checks})`);
