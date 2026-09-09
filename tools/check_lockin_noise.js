'use strict';
const assert=require('assert'),a=require('../course-shared/labs/physics-lockin-noise');let checks=0;
function near(x,y,t=1e-10){checks++;assert(Number.isFinite(x)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} vs ${y}`)}
function simpson(fn,lo,hi,n=2000){let sum=0,h=(hi-lo)/n;for(let j=0;j<=n;j++)sum+=(j===0||j===n?1:j%2?4:2)*fn(lo+j*h);return sum*h/3;}
// Integrate the squared impulse response: one-sided ENBW = (1/2) integral h(t)^2 dt.
for(const tau of [.001,.003,.01,.1]){const area=simpson(s=>Math.exp(-2*s),0,20,2000)/(2*tau);near(a.lockinBandwidth(tau),area,1e-8);}
for(const tau of [.001,.01,.1])for(const f of [20,137,400])for(const deg of [-180,-90,-30,0,45,90,180])for(const A of [0,.0002,.001,.005]){
 const r=a.analyze({timeConstant:tau,frequency:f,phaseDegrees:deg,amplitude:A}),phi=deg*Math.PI/180;
 // Average actual products over a period, independently of the trig-product formula.
 const I=simpson(z=>2*A*Math.cos(z+phi)*Math.cos(z),0,2*Math.PI,200)/ (2*Math.PI),Q=simpson(z=>-2*A*Math.cos(z+phi)*Math.sin(z),0,2*Math.PI,200)/(2*Math.PI);
 near(r.inPhase,I,1e-14);near(r.quadrature,Q,1e-14);near(r.inPhase*r.inPhase+r.quadrature*r.quadrature,A*A,1e-15);
 near(r.lockinSNR,Math.abs(I)/r.lockinNoiseRms,1e-12);near(r.settling99/tau,Math.log(100));near(Math.exp(-r.settling99/tau),.01);
 if(A===0){assert.equal(r.improvement,null);checks++;}else near(r.improvement,r.lockinSNR/r.directSNR);
}
// Independent convolution of h(s) with a 2f tone, and h(s)^2 with the modulated white-noise covariance.
// Use dimensionless s/tau and resolve the shortest oscillation with >= 60 points per cycle.
for(const tau of [.001,.01,.1])for(const f of [20,137,400]){
 const w=2*Math.PI*f*tau,n=2*Math.ceil(Math.max(2000,20*2*w*60/(2*Math.PI))/2),r=a.analyze({timeConstant:tau,frequency:f});
 const hc=simpson(s=>Math.exp(-s)*Math.cos(2*w*s),0,25,n),hs=simpson(s=>Math.exp(-s)*Math.sin(2*w*s),0,25,n);
 near(Math.hypot(hc,hs),r.rippleFraction,2e-7);
 const vc=2*simpson(s=>Math.exp(-2*s)*Math.cos(2*w*s),0,25,n),vs=2*simpson(s=>Math.exp(-2*s)*Math.sin(2*w*s),0,25,n);
 near(Math.hypot(vc,vs),r.varianceModulation,2e-7);
 const mean=simpson(z=>{const varI=1+vc*Math.cos(z)+vs*Math.sin(z);assert(varI>=-1e-12);return varI;},0,2*Math.PI,200)/(2*Math.PI);near(mean,1);
}
for(const B of [50,1000,4000])for(const S of [1e-10,1e-8,5e-8]){const r=a.analyze({directBandwidth:B,noisePSD:S});near(r.directNoiseRms*r.directNoiseRms,S*B,1e-16);near(r.lockinNoiseRms*r.lockinNoiseRms,S/(2*r.timeConstant),1e-16);}
for(const fn of [()=>a.lockinBandwidth(0),()=>a.lockinBandwidth(-1),()=>a.lockinBandwidth(NaN),()=>a.lockinBandwidth(Infinity),()=>a.lockinBandwidth(Number.MIN_VALUE),()=>a.analyze({amplitude:-1}),()=>a.analyze({timeConstant:0}),()=>a.analyze({noisePSD:Infinity}),()=>a.analyze({phaseDegrees:181}),()=>a.analyze({frequency:'137'})]){assert.throws(fn,RangeError);checks++;}
assert(a.lockinBandwidth(Number.MAX_VALUE)>0);checks++;
console.log(`Lock-in independent checks: PASS (${checks})`);
