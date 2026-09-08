"use strict";
const assert=require("assert"),lab=require("../course-shared/labs/research-local.js");let checks=0;
function near(a,b,msg,tol=1e-10){assert.ok(Math.abs(a-b)<tol,msg+`: ${a} vs ${b}`);checks++;}
function yes(v,msg){assert.ok(v,msg);checks++;}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),mv=(A,v)=>A.map(r=>dot(r,v));
for(const theta of [15,20,35,60,85,90])for(const lambda of [0,.1,.5,1,2]){
 const m=lab.compute('metric',{theta,lambda}).numeric;
 // Build a 4D Hamiltonian and nonorthogonal embedding independently.
 const H=[[-1,0,0,-lambda],[0,0,0,0],[0,0,0,0],[-lambda,0,0,1]];
 const W=[[1,0,0,0],[Math.cos(theta*Math.PI/180),0,0,Math.sin(theta*Math.PI/180)]];
 for(let i=0;i<2;i++)for(let j=0;j<2;j++){near(m.N[i][j],dot(W[i],W[j]),'Gram');near(m.H[i][j],dot(W[i],mv(H,W[j])),'Projected H');}
 const psi=W[0].map((x,i)=>x*m.coords[0]+W[1][i]*m.coords[1]);
 near(dot(psi,psi),1,'Physical ground normalized');
 const hp=mv(H,psi);hp.forEach((x,i)=>near(x,m.exact*psi[i],'Full Hilbert eigen equation'));
 near(dot(psi,hp),-Math.sqrt(1+lambda*lambda),'Physical energy');
 mv(m.H,m.coords).forEach((x,i)=>near(x,m.exact*mv(m.N,m.coords)[i],'Generalized residual'));
 mv(m.H,m.a).forEach((x,i)=>near(x,m.wrong*m.a[i],'Ordinary residual'));
 const wrongPsi=W[0].map((x,i)=>x*m.a[0]+W[1][i]*m.a[1]);
 near(dot(wrongPsi,mv(H,wrongPsi))/dot(wrongPsi,wrongPsi),m.physical,'Wrong candidate physical quotient');
 yes(m.physical>=m.exact-1e-12,'Variational principle');
 near((1+m.c)/(1-m.c),m.condition,'Condition');
 for(let k=0;k<21;k++){
   const a=[Math.cos(k*.3),Math.sin(k*.3)],v=W[0].map((x,i)=>x*a[0]+W[1][i]*a[1]);
   near(dot(v,v),dot(a,mv(m.N,a)),'Coordinate norm');
   const E=dot(v,mv(H,v))/dot(v,v);yes(E>=m.exact-1e-12,'Arbitrary physical trial bound');
 }
 if(theta===90){near(m.wrong,m.exact,'Orthogonal basis');near(m.physical,m.exact,'Orthogonal trial');}
}
const d=lab.compute('metric').numeric;near(d.wrong,-1.5412752449289302,'Default wrong');near(d.physical,-1.0747688939828204,'Default trial');yes(d.wrong<d.exact,'Counterexample exposed');
// Dual numbers represented as coefficient pairs: exact first-order polynomial expansion.
const mul=(a,b)=>[a[0]*b[0],a[0]*b[1]+a[1]*b[0]],sub=(a,b)=>a.map((x,i)=>x-b[i]);
for(const curve of [0,1])for(const t of [-1,-.5,-.1,0,.1,.5,1]){
 const m=lab.compute('tangent',{curve,t}).numeric,[x,y]=m.point;
 near(curve?y*y-x*x*x:y-x*x,0,'Point on curve');
 for(const a of [-2,0,1])for(const b of [-1,0,3]){
  const X=[x,a],Y=[y,b],f=curve?sub(mul(Y,Y),mul(mul(X,X),X)):sub(Y,mul(X,X));
  near(f[1],dot(m.gradient,[a,b]),'Dual evaluation equals Jacobian');
 }
 const direction=curve?(t===0?[1,0]:[2*t,3*t*t]):[1,2*t];
 near(dot(m.gradient,direction),0,'Parametric derivative in kernel');
 near(m.dimension,curve&&t===0?2:1,'Dimension');
 if(curve&&t===0)near(dot(m.gradient,[0,1]),0,'Extra tangent direction at cusp');
}
// Every image e -> b*epsilon respects e^n=0 for n>=2: tangent space cannot see length.
for(const n of [2,3,4])for(const b of [-2,0,3]){let z=[1,0];for(let i=0;i<n;i++)z=mul(z,[0,b]);near(z[0],0,'Nilpotent constant');near(z[1],0,'Nilpotent tangent');}
for(const topic of ['metric','tangent'])assert.throws(()=>lab.compute(topic,topic==='metric'?{theta:0}:{curve:.5}));checks+=2;
assert.throws(()=>lab.compute('metric',{lambda:NaN}));checks++;
console.log(`local checks: PASS (${checks}; full-Hilbert variational checks, generalized residuals, dual-number polynomial expansions)`);
