"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-variance"),mpo=require("../course-shared/labs/research-mpo"),refs=require("./fixtures/variance-numpy.json");let count=0;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>A.map(r=>T(B).map(c=>dot(r,c)));
function near(a,b,label,tol=2e-9){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);count++;}
function expand(ts){let B=[[1]];for(const A of ts){const next=[];for(const row of B)for(let s=0;s<A.length;s++)next.push(A[s][0].map((_,r)=>row.reduce((v,x,l)=>v+x*A[s][l][r],0)));B=next;}return B.flat();}
function spin(psi,n,g){return psi.map((x,b)=>{let pop=0;for(let j=0;j<n;j++)pop+=(b>>j)&1;let v=-g*(n-2*pop)*x;for(let j=0;j<n-1;j++)v-=psi[b^(3<<j)];return v;});}
const A=[[[[1,2,3],[4,5,6]]]],B=[[[[2,3],[5,7],[11,13]]]];
const AB=lab.compose(A,B)[0][0],direct=mul(A[0][0],B[0][0]);AB.forEach((r,i)=>r.forEach((x,j)=>near(x,direct[i][j],'rectangular physical composition')));
const X=[[[[0,1],[1,0]]]],Z=[[[[1,0],[0,-1]]]];assert.notDeepEqual(lab.compose(X,Z),lab.compose(Z,X));count++;
// General rectangular operator bonds: compare every coefficient with an independent inner product.
const make=(a,b,d,e,offset)=>Array.from({length:a},(_,i)=>Array.from({length:b},(_,j)=>Array.from({length:d},(_,s)=>Array.from({length:e},(_,t)=>Math.sin(offset+3*i+7*j+11*s+t)))));
const W=make(2,3,2,3,1),V=make(3,2,3,2,2),C=lab.compose(W,V);
for(let a=0;a<2;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)for(let d=0;d<2;d++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)near(C[a*3+c][b*2+d][s][t],dot(W[a][b][s],V[c][d].map(r=>r[t])),'operator product index');
for(const f of refs){const m=lab.moments(f.tensors,f.g);for(const k of ['norm','E','H2','parity'])near(m[k],f[k],'NumPy '+f.label+' '+k);near(m.rawVariance,f.variance,'NumPy residual squared '+f.label);}
let steps=0;
for(const n of [4,6])for(const g of [.5,1,2])for(const chi of [1,2,4])for(const start of lab.starts(n)){
 const r=mpo.run(n,g,chi,2,32,({tensors,step})=>{
  const psi=expand(tensors),h=spin(psi,n,g),norm=dot(psi,psi),E=dot(psi,h)/norm,variance=dot(h.map((x,i)=>x-E*psi[i]),h.map((x,i)=>x-E*psi[i]))/norm,m=lab.moments(tensors,g);
  near(m.norm,norm,'physical norm');near(m.E,E,'physical E');near(m.H2,dot(h,h)/norm,'physical H squared');near(m.rawVariance,variance,'physical direct residual');near(step.E,E,'post-truncation global energy');assert.ok(step.optimized<=step.before+1e-8);count++;steps++;
 },start.angles);
 near(r.norm,1,'normalized sweep');assert.ok(r.E>=r.ground-1e-8);count++;
}
const rows=lab.compare(4,1,4,2),even=rows[1].m,odd=rows[2].m;assert.ok(odd.E-even.E>.6);near(even.parity,1,'even sector');near(odd.parity,-1,'odd sector');assert.ok(Math.abs(odd.rawVariance)<1e-10);assert.equal(odd.resolved,false);count+=3;
const poor=lab.compare(6,1,1,2)[1],better=lab.compare(6,1,4,2)[1];assert.ok(poor.m.rawVariance>4&&better.m.rawVariance<1e-5);assert.ok(poor.run.maxResidual<1e-10);count+=2;
assert.throws(()=>mpo.run(4,1,2,1,8,undefined,[0]));assert.throws(()=>lab.compose(B,B));count+=2;
console.log(`Variance checks: PASS (${count}; ${refs.length} NumPy full-spin references, ${steps} post-update full-chain checks, noncommutative MPO product and parity trap)`);
