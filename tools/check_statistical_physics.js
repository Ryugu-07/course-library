'use strict';
// Independent enumeration, quadrature and limiting identities for sm-01..04.
const assert=require('assert'),tp=require('../course-shared/labs/thermodynamic-paths'),ce=require('../course-shared/labs/canonical-ensemble'),qo=require('../course-shared/labs/quantum-occupancy'),kt=require('../course-shared/labs/physics-kinetic-transport');let checks=0;
function close(a,b,tol=2e-9){checks++;assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);}
function yes(x,m){checks++;assert(x,m);}
function simpson(f,a,b,n=4000){let sum=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
for(const gamma of [1.4,5/3,1.8])for(const V2 of [1.2,1.5,2,2.9,3.5])for(const pathId of Object.keys(tp.PATHS)){
 const c={gamma,V2,pathId},r=tp.processLedger(c),points=tp.pathProfile(c,2000);close(r.deltaU,r.heat+r.workOn);close(r.deltaS,Math.log(V2)+(1/(gamma-1))*Math.log(r.T2));
 if(pathId==='free'){yes(r.profileWorkOn===null&&!r.profileWorkValid,'non-equilibrium path rejected');close(r.entropyGenerated,Math.log(V2));continue;}
 // Midpoint integral of p dV and reversible heat/T, not the production trapezoid.
 let w=0,s=0;for(let i=1;i<points.length;i++){const p=tp.pathPoint(c,(i-.5)/2000),dv=points[i].V-points[i-1].V,dt=points[i].T-points[i-1].T;w-=p.p*dv;s+=(dt/(gamma-1)+p.p*dv)/p.T;}
 close(w,r.workOn,2e-6);close(s,r.deltaS,2e-6);close(r.entropyGenerated,0);yes(points.every(p=>Math.abs(p.p*p.V-p.T)<1e-12),'EOS');
}
// Enumerate individual microscopic states, including degeneracies, for small systems.
for(const g0 of [1,2,3])for(const g1 of [1,2,3])for(const x of [0,.2,1,3,8])for(const N of [1,2,3,4]){
 const energies=Array(g0).fill(0).concat(Array(g1).fill(1)),hist=Array(N+1).fill(0);let z=0,e=0,e2=0,entropySum=0;
 function visit(depth,k){if(depth===N){const w=Math.exp(-x*k);hist[k]+=w;z+=w;e+=k*w;e2+=k*k*w;entropySum+=w*Math.log(w);return;}for(const bit of energies)visit(depth+1,k+bit);}
 visit(0,0);const r=ce.canonicalModel({g0,g1,x,N});close(r.logZ1*N,Math.log(z));close(r.meanK,e/z);close(r.varianceK,e2/z-(e/z)**2);close(r.entropyPerUnit*N,Math.log(z)-entropySum/z);close(r.heatCapacityPerUnit*N,x*x*(e2/z-(e/z)**2));r.distribution.rows.forEach(row=>close(row.probability,hist[row.k]/z));
}
for(const g0 of [1,2,8])for(const g1 of [1,3,8]){const peak=ce.heatCapacityPeak(g0,g1),h=1e-5;close((ce.heatCapacity(peak+h,g0,g1)-ce.heatCapacity(peak-h,g0,g1))/(2*h),0,1e-8);yes(ce.heatCapacity(peak,g0,g1)>ce.heatCapacity(peak+.1,g0,g1),'peak maximum');}
// A different stable binomial construction: repeated Bernoulli convolution.
for(const N of [1,25,200,400])for(const p of [0,.0004,.1,.5,.9,.9996,1]){let a=[1];for(let j=0;j<N;j++){let b=Array(j+2).fill(0);a.forEach((v,i)=>{b[i]+=v*(1-p);b[i+1]+=v*p;});a=b;}ce.binomialDistribution(N,p).rows.forEach(r=>close(r.probability,a[r.k],2e-11));}
// Single-mode grand sums and energy-zero invariance.
for(const kind of ['bose','fermi'])for(const x of [.1,.5,1,3,10]){
 let z=0,num=0;const max=kind==='fermi'?1:1000;for(let n=0;n<=max;n++){const w=Math.exp(-x*n);z+=w;num+=n*w;}close(qo.occupation(kind,x,0,1),num/z);close(qo.classicalRelativeError(kind,x),Math.abs(num/z-Math.exp(-x))/(num/z));
 for(const T of [.08,.6,2])for(const shift of [-7,0,12])close(qo.occupation(kind,x*T+shift,shift,T),num/z);
}
for(const kind of ['bose','fermi'])for(const x of [30,50,100,700])close(qo.classicalRelativeError(kind,x)/Math.exp(-x),1);
yes(Number.isNaN(qo.occupation('bose',0,.1,1)),'invalid Bose chemical potential is not a divergence');yes(qo.occupation('bose',0,0,1)===Infinity,'boundary limit');yes(Number.isNaN(qo.occupation('fermi',1,0,0)),'zero T not finite-T formula');
for(const T of [.08,.6,2])for(const mu of [-1.5,-.02,.5,2]){const r=qo.finiteLevelLedger(mu<0?'bose':'fermi',T,mu);close(r.particles,r.rows.reduce((a,b)=>a+b.particles,0));yes(r.rows.every(x=>Number.isFinite(x.energyContribution)),'finite energy');}
// Maxwell speed probability integral and moments, independent of production means.
close(simpson(kt.maxwellSpeed,0,10),1,1e-10);close(simpson(u=>u*kt.maxwellSpeed(u),0,10),2/Math.sqrt(Math.PI),1e-10);close(simpson(u=>u*u*kt.maxwellSpeed(u),0,10),1.5,1e-10);
for(const densityLog of [-3,-1,.398,.8])for(const temperature of [80,300,1200])for(const sigma of [1,4.3,12])for(const length of [.005,1,10])for(const gradient of [0,.5,2]){
 const r=kt.transportModel({densityLog,temperature,sigma,length,gradient}),v=simpson(u=>u*kt.maxwellSpeed(u),0,10,1000)*Math.sqrt(2*kt.KB*temperature/kt.MOLECULE_MASS),rate=Math.sqrt(2)*r.numberDensity*(sigma*1e-19)*v;
 close(r.meanSpeed,v,1e-8);close(r.collisionTime*rate,1,1e-8);close(r.meanFreePath,r.collisionTime*v);close(r.diffusion/(v*v/(3*rate)),1,1e-8);close(r.viscosity/(kt.MOLECULE_MASS*v/(3*Math.sqrt(2)*sigma*1e-19)),1,1e-8);close(r.numberFlux,-r.diffusion*gradient*1e27);close(r.knudsen,r.meanFreePath/(length*.001));
}
yes(kt.transportModel(kt.PRESETS.find(p=>p.id==='vacuum')).knudsen>10,'ballistic preset actually exceeds 10');
for(const kind of ['bose','fermi','classical'])yes(qo.occupation(kind,710,0,1)>0,'representable subnormal tail retained');
// Independent positive roots for two spectral-density peaks.
function root(k){let a=1e-6,b=k;for(let i=0;i<60;i++){let m=(a+b)/2;if(k*(-Math.expm1(-m))-m>0)a=m;else b=m;}return(a+b)/2;}
close(root(3),2.821439372122079);close(root(5),4.965114231744276);close(1-2**(-1.5),.6464466094067263);
console.log(`statistical physics independent checks: PASS (${checks} checks)`);
