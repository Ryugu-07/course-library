"use strict";
const assert=require('assert'),structure=require('../course-shared/labs/physics-nuclear-decay.js'),detector=require('../course-shared/labs/physics-nuclear-detector.js');
let checks=0;function ok(v,m){checks++;assert(v,m);}function close(a,b,t=1e-10){ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);}
// Reconstruct the liquid-drop quadratic by its continuous vertex, rather than
// reusing the term-by-term implementation. Check parity separately.
for(let A=8;A<=240;A++) {
 const a23=Math.cbrt(A)**2,C=.711/Math.cbrt(A)+92/A;
 const vertex=(92*A+.711*a23)/(184+1.422*a23);
 const intercept=15.75*A-17.8*a23-23*A;
 const peak=intercept+C*vertex*vertex;
 for(const Z of new Set([2,Math.floor(vertex),Math.ceil(vertex),Math.floor(A/2),A-2,A-1,A])) {
  const pairing=A%2?0:(Z%2?-1:1)*11.2/Math.sqrt(A);
  const ref=peak-C*(Z-vertex)**2+pairing,r=structure.binding(A,Z);
  close(r.total,ref);close(r.total/A,r.perNucleon);close(r.pairing,pairing);
  ok(r.A===r.Z+r.N,'nucleon bookkeeping');
 }
}
const f=structure.binding(56,26),n=structure.binding(56,28);
ok(n.asymmetry<f.asymmetry&&n.total<f.total,'asymmetry improvement need not improve total binding');
close(f.total,495.58637255199426);close(structure.alphaQ(238,92),4.491305719935326);
// Independent mass balance in units where c²=1; arbitrary common proton/neutron
// mass choices cancel exactly because each reaction conserves nucleon counts.
function mass(A,Z){return Z*938.272+(A-Z)*939.565-structure.binding(A,Z).total;}
for(const [A,Z]of[[56,26],[58,26],[131,53],[238,92]]){
 const ma=2*938.272+2*939.565-28.2957;
 close(structure.alphaQ(A,Z),mass(A,Z)-mass(A-4,Z-2)-ma,1e-10);
}
// Repeated convolution of independent survival Bernoulli variables.
for(const t of [0,.5,1,2,5]) {
 const p=structure.decayFraction(t);let pmf=[1];
 for(let i=0;i<100;i++){const q=Array(pmf.length+1).fill(0);pmf.forEach((v,k)=>{q[k]+=v*(1-p);q[k+1]+=v*p;});pmf=q;}
 const mean=pmf.reduce((v,q,k)=>v+k*q,0),variance=pmf.reduce((v,q,k)=>v+(k-mean)**2*q,0);
 close(pmf.reduce((a,b)=>a+b,0),1);close(mean,100*p);close(variance,100*p*(1-p));
 close(structure.decayFraction(t+1),p/2);
}
// Integrate exp(-x) over optical depth using a convergent power series,
// independently of the implementation's expm1 call (tau is at most 0.5).
function probability(tau){let term=tau,sum=term;for(let k=2;k<=24;k++){term*=-tau/k;sum+=term;}return sum;}
for(const reaction of detector.REACTIONS)for(const sigmaBarn of [.01,.5,5])for(const arealDensity of [1e20,1e21,1e23])for(const area of [.1,1,100])for(const efficiency of [.1,.3,.65,1]) {
 const threshold=detector.reactionLedger({reaction:reaction.id}).threshold;
 for(const energy of [0,Math.max(0,threshold-1e-8),threshold,3,12]) {
  const r=detector.reactionLedger({reaction:reaction.id,energy,sigmaBarn,arealDensity,illuminatedArea:area,efficiency,flux:1e6,liveTime:10});
  const P=energy>=threshold?probability(sigmaBarn*arealDensity/1e24):0;
  close(r.interactionProbability,P,1e-13);close(r.incomingRate,area*1e6);close(r.incidentRate,area*1e6*P);close(r.detectedRate,area*1e6*P*efficiency);close(r.expectedCounts,area*1e7*P*efficiency);close(r.poissonRms**2,r.expectedCounts);ok(P>=0&&P<=1,'probability');
 }
}
const r=detector.reactionLedger({});close(r.detectedRate,324.9187635399739);close(r.expectedCounts,3249.187635399739,1e-9);
close(Math.sqrt(r.expectedCounts+400),60.408506,1e-7);close(Math.sqrt(r.expectedCounts+800),63.633228,1e-7);
close(Math.exp(-(-Math.log(.05))),.05);
// Recover a two-body exact threshold from the invariant, with masses in MeV/c².
for(const q of [-1.644,-20,-100]){const ma=938, mA=6500,finalMass=ma+mA-q;
 const K=-q*(1+ma/mA)+q*q/(2*mA);
 close((ma+mA)**2+2*mA*K,finalMass**2);
}
console.log(`nuclear independent ledgers: PASS (${checks})`);
