"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-mps-cache.js"),fixtures=require("./fixtures/mps-cache-numpy.json");let count=0;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>A.map(r=>T(B).map(c=>dot(r,c)));
function near(a,b,label,tol=2e-8){assert.ok(Math.abs(a-b)<tol,`${label}: ${a} != ${b}`);count++;}
function matrix(A,B,label){assert.equal(A.length,B.length);assert.equal(A[0].length,B[0].length);count+=2;A.forEach((r,i)=>r.forEach((v,j)=>near(v,B[i][j],label)));}
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
function leftBasis(ts){let B=[[1]];for(const A of ts){let N=[];for(const row of B)for(let s=0;s<2;s++)N.push(A[s][0].map((_,r)=>row.reduce((v,x,l)=>v+x*A[s][l][r],0)));B=N;}return B;}
function rightBasis(ts){let B=[[1]];for(const A of ts.slice().reverse()){let N=[];for(let s=0;s<2;s++)for(const row of B)N.push(A[s].map(r=>dot(r,row)));B=N;}return B;}
function physicalH(W,n,g){return W.map((row,b)=>row.map((v,c)=>{let z=0;for(let i=0;i<n;i++)z+=1-2*((b>>i)&1);let out=-g*z*v;for(let i=0;i<n-1;i++)out-=W[b^(3<<i)][c];return out;}));}
function inspect({tensors,H,j,step}){
 const n=tensors.length,L=leftBasis(tensors.slice(0,j)),R=rightBasis(tensors.slice(j+2)),W=[];
 for(let p=0;p<L.length;p++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)for(let q=0;q<R.length;q++){
  let row=[];for(let l=0;l<L[0].length;l++)for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let r=0;r<R[0].length;r++)row.push(a===s&&b===t?L[p][l]*R[q][r]:0);W.push(row);
 }
 matrix(mul(T(W),W),eye(H.length),"Physical block basis metric");
 matrix(mul(T(W),physicalH(W,n,1)),H,"Cache effective H versus independent physical spin action");
 const psi=leftBasis(tensors),hp=physicalH(psi,n,1);near(dot(psi.flat(),psi.flat()),1,"Physical norm");near(dot(psi.flat(),hp.flat()),step.E,"Physical energy after every update");
 const center=step.center-1;
 tensors.forEach((A,k)=>{if(k===center)return;const dl=A[0].length,dr=A[0][0].length;
  if(k<center){let M=Array.from({length:2*dl},(_,i)=>A[i%2][Math.floor(i/2)]);matrix(mul(T(M),M),eye(dr),"Left canonical tensor");}
  else {let M=A[0].map((r,l)=>r.concat(A[1][l]));matrix(mul(M,T(M)),eye(dl),"Right canonical tensor");}
 });
}
for(const f of fixtures){const m=lab.run(f.length,f.g,f.chi,f.rounds);
 for(const k of ["E","ground"])near(m[k],f[k],"Independent NumPy "+k);near(m.norm,1,"Final norm");near(m.maxMetricError,0,"Cached metric");near(m.start,-.75*(f.length-1)-.5*f.g*f.length,"Product energy");
 assert.equal(m.history.length,2*f.rounds*(f.length-1));count++;
 m.history.forEach((s,i)=>{const ref=f.history[i];for(const k of ["before","optimized","E","epsilon"])near(s[k],ref[k],"NumPy history "+k);for(const k of ["bond","direction","dimension"]){assert.equal(s[k],ref[k]);count++;}assert.ok(s.optimized<=s.before+2e-8);assert.ok(s.E>=m.ground-2e-8);count+=2;});
 assert.equal(m.environmentSteps,f.length+m.history.length);assert.equal(m.naiveEnvironmentSteps,m.history.length*(f.length-2));assert.equal(m.measurementSteps,f.length);count+=3;
 for(const A of m.tensors){assert.ok(A[0].length<=f.chi&&A[0][0].length<=f.chi);count++;}
}
for(const n of [4,6,8])for(const chi of [1,2,4])lab.run(n,1,chi,2,inspect);
for(let n=4;n<=12;n+=2)near(lab.exactGround(n,1),1-1/Math.sin(Math.PI/(4*n+2)),"Critical open-chain closed form");
const d=lab.run(8,1,2,2);assert.equal(d.storage,56);assert.equal(d.environmentSteps,36);assert.equal(d.naiveEnvironmentSteps,168);assert.ok(d.rises>0);count+=4;
for(const chi of [1,2,4]){let m=lab.run(4,1,chi,2);if(chi===4)near(m.E,m.ground,"Complete four-site rank");}
for(const args of [[3.5,1,2,1],[4,NaN,2,1],[4,1,1.5,1],[4,1,2,0]]){assert.throws(()=>lab.run(...args));count++;}
console.log(`MPS cache checks: PASS (${count}; 29 independent NumPy histories, physical projected H at every step, canonical tensors, cache accounting)`);
