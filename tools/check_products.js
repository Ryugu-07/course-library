"use strict";
const assert=require('node:assert/strict'),lab=require('../course-shared/labs/research-products');let count=0;
function near(a,b,label,tol=1e-10){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);count++;}
// Direct trapezoidal integration resolves all frequencies through 2N (no aliasing).
for(const N of [2,8,32,64])for(const A of [.5,1,2])for(const B of [.5,1,2])for(const phase of [0,1/3,.5,1]){
 const m=lab.frequency(N,A,B,phase),M=8*N+1;let u=0,v=0,uv=0,re=0,im=0;
 for(let j=0;j<M;j++){const x=2*Math.PI*j/M,a=A*Math.cos(N*x),b=B*Math.cos(N*x+Math.PI*phase);u+=a/M;v+=b/M;uv+=a*b/M;re+=b*Math.cos(N*x)/M;im-=b*Math.sin(N*x)/M;}
 near(u,0,'u zero mode');near(v,0,'v zero mode');near(uv,m.mean,'product zero mode');near(re,m.vRe,'v real coefficient');near(im,m.vIm,'v imaginary coefficient');
}
// 3-node Gauss-Hermite for standard normals exactly integrates degree <=5.
const gauss=[[-Math.sqrt(3),1/6],[0,2/3],[Math.sqrt(3),1/6]];
for(const N of [2,8,32]){let mean=0,second=0,error=0;for(const [a,wa] of gauss)for(const [b,wb] of gauss){let space=0,rem=0;const C=a*a+b*b-2;for(let j=0;j<8*N+1;j++){const x=2*Math.PI*j/(8*N+1),z=Math.sqrt(2)*(a*Math.cos(N*x)+b*Math.sin(N*x)),wick=z*z-2;space+=wick/(8*N+1);rem+=(wick-C)**2/(8*N+1);}
 near(space,C,'Wick pairing via quadrature');mean+=wa*wb*space;second+=wa*wb*space*space;error+=wa*wb*rem/(1+4*N*N);}
 near(mean,0,'Wick mean');near(second,4,'Wick variance');near(error,4/(1+4*N*N),'negative Sobolev Wick error');}
for(let i=1;i<=40;i++){const lambda=i/40,m=lab.jet(lambda);let max=0,avg=0;const M=2000;for(let j=0;j<=M;j++){const x=-lambda+2*lambda*j/M,e=1-Math.cos(x);max=Math.max(max,e);avg+=e*(j===0||j===M?1:2)/(2*M);}near(m.error,max,'sampled maximum');assert.ok(m.error<=m.bound+1e-14);count++;near(avg,1-Math.sin(lambda)/lambda,'window average',1e-7);assert.ok(m.ratio<=.5&&m.ratio>.45);count++;}
for(const x of [-2,-.4,0,.2,1.7])for(const y of [-1.1,-.3,.1,.8]){const dx=x-y;assert.ok(Math.abs(Math.cos(x)-Math.cos(y)+Math.sin(y)*dx)<=dx*dx/2+1e-14);assert.ok(Math.abs(Math.sin(x)-Math.sin(y))<=Math.abs(dx)+1e-14);count+=2;}
near(lab.jet(.25).error,.031087578289355267,'default Taylor');near(lab.frequency(8,2,3,1/3).mean,1.5,'transfer phase');
for(const topic of lab.topics){for(const c of lab.configs[topic].controls){for(const end of [c[2],c[3]]){lab.compute(topic,{[c[0]]:end});count++;}}assert.throws(()=>lab.compute(topic,{[lab.configs[topic].controls[0][0]]:NaN}));count++;}
console.log(`Products/reconstruction checks: PASS (${count}; direct Fourier quadrature, Gaussian Wick moments, Taylor bounds and jet compatibility)`);
