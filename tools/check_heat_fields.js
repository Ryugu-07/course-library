"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-heat-fields.js");let count=0;
function near(a,b,s,tol=1e-9){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),s);count++;}
const d=lab.calculate(0,-.75,16,.05);near(d.partial,3.267141087,"Default partial");near(d.shell,.282552038,"Default shell");near(d.tail,1,"Analytic tail");
near(lab.calculate(0,-.5,16,.05).shell,1.354173150,"Critical shell");
// Independent integral bounds, exact finite cases, and complementary Fourier coupling.
for(const alpha of [0,.5,1,2])for(const s of [-1.5,-.75,-.5,0,1])for(const N of [8,16,64,128]){
 const a=lab.calculate(alpha,s,N,.05),b=lab.calculate(alpha,s,2*N,.05);near(b.partial-a.partial,a.shell,"Orthogonal increment identity");assert.ok(a.smoothed<=a.partial+1e-12);count++;
 let tail=0;for(let k=N+1;k<=32768;k++)tail+=2*Math.exp(s*Math.log(1+k*k)-2*alpha*Math.log(k));
 if(a.converges){assert.ok(tail<=a.tail*(1+1e-10));count++;}else {assert.equal(a.tail,null);count++;}
 const small=lab.calculate(alpha,s,N,.01);assert.ok(small.error<=a.error+1e-12);assert.ok(small.smoothed>=a.smoothed-1e-12);count+=2;
 if(s===0&&alpha===0)near(a.partial,2*N,"White-noise point variance");
}
for(const alpha of [0,.5,1,2])near(lab.calculate(alpha,alpha-.5,16384,.01).shell,2*Math.log(2),"Asymptotic critical shell",3e-5);
// cos(x) has coordinate1/sqrt2 in first cosine mode, zero elsewhere.
near((1/Math.sqrt(2))**2,.5,"Cosine test variance");
for(const v of [{alpha:-1},{s:2},{power:3.5},{epsilon:0}]){assert.throws(()=>lab.compute('sobolev',v));count++;}
console.log(`Heat-field checks: PASS (${count}; exact finite identities, integral tail bounds, critical shells, shared-noise errors)`);
