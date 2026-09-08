"use strict";
const assert=require('node:assert/strict'),gz=require('../course-shared/labs/girsanov-weights'),rm=require('../course-shared/labs/research-math');
let checks=0;function ok(v,m){checks++;assert(v,m)}function near(a,b,t=2e-11){ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`)}
// Integer polynomial multiplication gives a third Delta implementation.
const degree=120,coeff=Array(degree).fill(0n);coeff[0]=1n;
for(let k=1;k<degree;k++) {const next=Array(degree).fill(0n);let binom=1n;for(let j=0;j<=24&&k*j<degree;j++){if(j>0)binom=binom*BigInt(25-j)/BigInt(j);const factor=j%2?-binom:binom;for(let n=0;n+k*j<degree;n++)next[n+k*j]+=factor*coeff[n];}coeff.splice(0,degree,...next);}
for(let step=35;step<=250;step+=5){const y=step/100,q=Math.exp(-2*Math.PI*y);let v=0;for(let j=degree-1;j>=0;j--)v=v*q+Number(coeff[j]);const reference=q*v,r=rm.compute('nt-modular',{y,N:60});near(r.numeric.delta/reference,1,8e-14);near(r.numeric.eisensteinDelta/reference,1,4e-10);for(const s of r.chart.series)for(const point of s.points||s.data||[])ok(point.every(Number.isFinite),'finite residual chart');}
// Reconstruct each path integral with independent endpoint trapezoid weights.
for(const theta of [-5,-2,0,1,5])for(const T of [0,.5,2])for(const sigma of [.5,2])for(const steps of [1,12,48]){
 const r=gz.evaluate({theta,T,sigma,steps,sampleCount:16,seed:51}),dt=T/steps;const ws=r.paths.map(path=>Math.exp(-theta*path.at(-1).brownian-theta*theta*T/2)),sum=ws.reduce((a,b)=>a+b,0),weights=ws.map(w=>w/sum);let mx=0,mx2=0,ma=0,ma2=0;
 r.paths.forEach((path,i)=>{const x=path.at(-1).drifted,area=dt*path.reduce((sum,p,j)=>sum+(j===0||j===steps?.5:1)*p.drifted,0);near(r.weights[i],weights[i]);mx+=weights[i]*x;mx2+=weights[i]*x*x;ma+=weights[i]*area;ma2+=weights[i]*area*area;});
 near(r.terminal.weightedMean,mx);near(r.terminal.weightedSecond,mx2);near(r.area.weightedMean,ma);near(r.area.weightedSecond,ma2);near(r.weightSummary.rawMean,sum/16);near(r.weightSummary.ess,1/weights.reduce((s,w)=>s+w*w,0));
 let cov=0;for(let i=0;i<=steps;i++)for(let j=0;j<=steps;j++)cov+=(i===0||i===steps?.5:1)*(j===0||j===steps?.5:1)*Math.min(i,j)*dt*dt*dt*sigma*sigma;
 near(r.area.exactSecond,cov);near(cov,sigma*sigma*T*T*T*(1/3-1/(12*steps*steps)));if(T>0)ok(cov<sigma*sigma*T*T*T/3,'discrete area variance differs from continuum');
}
// Direct Gaussian integration of RN density, X and X^2 under P.
for(const theta of [-3,0,2])for(const T of [.5,2])for(const sigma of [.5,2]){let mass=0,first=0,second=0;const n=12000,h=40/n;for(let i=0;i<=n;i++){const z=-20+i*h,w=(i===0||i===n?1:i%2?4:2)*h/3,bt=Math.sqrt(T)*z,x=sigma*(theta*T+bt),density=Math.exp(gz.logRadonNikodym(theta,bt,T)-z*z/2)/Math.sqrt(2*Math.PI);mass+=w*density;first+=w*density*x;second+=w*density*x*x;}near(mass,1);near(first,0);near(second,sigma*sigma*T);}
console.log(`measure/modular independent checks: PASS (${checks})`);
