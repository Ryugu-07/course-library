"use strict";
const assert=require('node:assert/strict'),lib=require('../course-shared/labs/research-scattering-loop.js'),ref=require('./fixtures/scattering-mpmath.json');
let count=0;
function near(a,b,t=2e-11){count++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
for(const r of ref.bubbles){const f=lib.bubble(r.r);near(f.re,r.value[0]);near(f.im,r.value[1]);}
for(const r of ref.scattering){const a=lib.scattering(r.r,r.z,r.mu,r.lambda);near(a.loopRe,r.loop[0]);near(a.loopIm,r.loop[1]);near(a.nloSquared,r.nloSquared);near(a.dsNlo,r.dsNlo,1e-13);}
for(const s of [4,4.2,8,16])for(const z of [-1,-.3,0,.4,1])for(const mu of [.5,1,4])for(const l of [.2,1,2]){
 const a=lib.scattering(s,z,mu,l),b=lib.scattering(s,-z,mu,l);
 near(a.re,b.re);near(a.im,b.im);near(a.t+a.u+a.s,4);near(a.dsNlo,b.dsNlo);
 // Relativistic two-body phase space with identical-state factor, independently normalized.
 near(2*a.im,.5*Math.sqrt(1-4/s)/(8*Math.PI)*l*l);
 near(a.dsTree*4*Math.PI,l*l/(32*Math.PI*s));
 const scaled=lib.scattering(s,z,3*mu,l,3);near(scaled.re,a.re);near(scaled.im,a.im);near(scaled.dsNlo*9,a.dsNlo);
 near(a.dsNlo/a.dsTree-1,a.relativeCorrection);
 count++;assert.ok(a.nloSquared>0);
}
// Off-shell symmetric subtraction condition: M(-mu²,-mu²,-mu²)=-lambda.
for(const mu of [.5,1,2,4]){const a=lib.amplitude(-mu*mu,-mu*mu,-mu*mu,mu,1);near(a.re,-1);near(a.im,0);}
for(const mu of [.5,2,4]){
 const a=lib.matching(.2,mu),b=lib.matching(.1,mu),c=lib.matching(.05,mu);
 near(a.fixedDifference/b.fixedDifference,4,1e-10);
 count++;assert.ok(Math.abs(b.difference/c.difference-8)<.03);
 count++;assert.ok(a.difference<a.fixedDifference);
}
for(const l of [.1,1,2])near(lib.matching(l,1).difference,0);
// UV beta coefficient from finite subtraction, and massive low-energy decoupling.
const h=1e-4,l=.2,derivative=mu=>(lib.matchedCoupling(l,mu,mu*Math.exp(h))-lib.matchedCoupling(l,mu,mu*Math.exp(-h)))/(2*h);
near(derivative(500)/(3*l*l/(16*Math.PI**2)),1,2e-4);
count++;assert.ok(derivative(.001)<1e-6*3*l*l/(16*Math.PI**2));
for(const r of [3.999999,4,4.000001]){count++;assert.ok(Math.abs(lib.bubble(r).re+2)<.002);}
assert.throws(()=>lib.scattering(3,0,1,1));assert.throws(()=>lib.scattering(8,2,1,1));assert.throws(()=>lib.bubble(Infinity));count+=3;
for(const value of [Infinity,NaN,-1]){assert.throws(()=>lib.matchedCoupling(value,1,2));count++;}
for(const topic of lib.topics){lib.compute(topic);count++;
 for(const control of lib.configs[topic].controls)for(const value of [control[2],control[3]]){lib.compute(topic,{[control[0]]:value});count++;}}
console.log(`PASS ${count} scattering-loop checks; ${ref.bubbles.length} high-precision bubbles, ${ref.scattering.length} independent amplitudes`);
