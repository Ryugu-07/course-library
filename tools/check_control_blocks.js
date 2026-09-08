"use strict";
const assert=require("node:assert/strict"),blocks=require("../course-shared/labs/research-blocks.js"),control=require("../course-shared/labs/research-control.js"),ref=require("./fixtures/control-blocks-reference.json");let count=0;
function near(a,b,s,tol=1e-10){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${s}: ${a} != ${b}`);count++;}
for(const r of ref.blocks){const c=blocks.block(r.h,r.z,r.N);near(c.g,r.partial,"High precision block partial");near(c.d,r.dpartial,"High precision derivative partial");near(blocks.certificate(r.h,r.N).alpha,r.alpha,"Direct third derivative hypergeometric reference");assert.ok(r.remainder<=c.tail+1e-75);assert.ok(r.dremainder<=c.dtail+1e-73);count+=2;
 assert.ok(Math.abs(c.g-r.g)<=c.tail+2e-12*Math.max(1,Math.abs(r.g)));assert.ok(Math.abs(c.d-r.d)<=c.dtail+2e-12*Math.max(1,Math.abs(r.d)));count+=2;}
for(const r of ref.controls){const c=control.calculate(r.a,r.b,r.epsilon,r.T);near(c.KL,r.KL,"12-time joint Gaussian KL");near(c.energy,r.KL,"Control energy independently equals joint path KL",2e-9);near(c.mean,r.mean,"Tilted mean");near(c.variance,r.variance,"Tilted covariance");near(control.moments(r.a,r.b,r.epsilon,r.T,0).variance,0,"Common initial delta");}
for(const z of [.1,.5,.9]){const r=blocks.block(1,z,256);near(r.g,-Math.log(1-z),"h1 log block");near(r.d,1/(1-z),"h1 derivative");}
for(let h=4;h<=8;h+=.125){const r=blocks.certificate(h,128);assert.ok(r.ratio>=r.lower-1e-8);assert.ok(r.lower>0);count+=2;}
// Exact factor inequalities prove the tail half-axis analytically; these probes
// test implementation, not the universal positivity theorem in the lesson.
for(const h of [4,10,100,1000]){const lower=16*(h-3)*h*(h-1)-16*h+8;assert.ok(lower>=16*(h*h-2*h)+8);count++;}
for(const a of [-2,0,2]){const c=control.calculate(a,0,1,2);near(c.KL,a*a,"Constant drift entropy");near(c.variance,2,"Unchanged variance at b0");}
for(const v of [{h:0},{N:63},{z:1},{N:64.5}]){assert.throws(()=>blocks.compute('positive',v));count++;}
for(const v of [{b:-1},{epsilon:0},{T:0}]){assert.throws(()=>control.compute('gaussian',v));count++;}
console.log(`Control/block checks: PASS (${count}; 63 high precision hypergeometric references, 108 full Gaussian path KL references)`);
