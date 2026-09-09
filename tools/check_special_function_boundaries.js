'use strict';
const assert=require('assert'),a=require('../course-shared/labs/special-function-boundaries'),ref=require('./fixtures/special-functions-scipy.json');let checks=0;
function near(x,y,t=1e-11){checks++;assert(Number.isFinite(x)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} vs ${y}`)}
for(const row of ref.bessel){near(a.besselJ0(row.x),row.j0,2e-14);near(a.besselJ1(row.x),row.j1,2e-14)}
for(const [n,bc]of [[0,'dirichlet'],[1,'neumann']])for(let count=0;count<=6;count++){const roots=a.besselRoots(count,bc);assert.equal(roots.length,count);checks++;roots.forEach((x,i)=>near(x,ref.roots[n][i],1e-12));}
for(const row of ref.legendre)near(a.legendreP(row.n,row.x),row.value,2e-13);
for(let n=0;n<=6;n++)for(let m=0;m<=6;m++)near(a.legendreInnerProduct(n,m),n===m?2/(2*n+1):0,3e-9);
function simpson(fn,lo,hi,N=400){let sum=0,h=(hi-lo)/N;for(let i=0;i<=N;i++)sum+=(i===0||i===N?1:i%2?4:2)*fn(i===N?hi:i===0?lo:lo+h*i);return sum*h/3;}
// Radial orthogonality is weighted by r, not by uniform radius.
const roots=a.besselJ0Roots(4);for(let n=0;n<4;n++)for(let m=0;m<4;m++){let v=simpson(r=>r*a.besselJ0(roots[n]*r)*a.besselJ0(roots[m]*r),0,1,2000);near(v,n===m?.5*a.besselJ1(roots[n])**2:0,2e-11);}
// The Green integral must solve actual loads, not just its own piecewise definition.
for(const L of [.5,1,1.7,2])for(let i=1;i<20;i++){const x=L*i/20,cert=a.greenCertificate(x,L);near(cert.derivativeJump,-1);near(cert.leftBoundary,0);near(cert.rightBoundary,0);near(cert.continuityValue,x*(L-x)/L);for(const power of [0,1,2]){const fn=z=>{if(z===0||z===L)return 0;return a.greenValue(x,z,L)*z**power;};const value=simpson(fn,0,x)+simpson(fn,x,L);near(value,(L**(power+1)*x-x**(power+2))/((power+1)*(power+2)),1e-10);}for(let j=1;j<12;j++){const y=L*j/12;near(a.greenValue(x,y,L),a.greenValue(y,x,L));}}
for(const f of [()=>a.besselJ0(21),()=>a.besselJ1(NaN),()=>a.besselRoots(7,'dirichlet'),()=>a.besselRoots(1.5,'neumann'),()=>a.besselRoots(1,'bad'),()=>a.legendreP(-1,.2),()=>a.legendreP(2,Infinity),()=>a.legendreInnerProduct(1,2,0),()=>a.greenCertificate(0,1),()=>a.greenCertificate(1,1),()=>a.greenValue(-1,.4,1),()=>a.greenValue(.2,.4,0)]){assert.throws(f);checks++;}
console.log(`Special functions independent checks: PASS (${checks})`);
