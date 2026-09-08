"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-mpo.js"),mps=require("../course-shared/labs/research-mps-cache.js"),refs=require("./fixtures/mps-cache-numpy.json");let count=0;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>A.map(r=>T(B).map(c=>dot(r,c))),mv=(A,v)=>A.map(r=>dot(r,v)),zeros=(n,m)=>Array.from({length:n},()=>Array(m).fill(0));
function near(a,b,label,tol=3e-8){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);count++;}
function matrix(A,B,label){assert.equal(A.length,B.length);assert.equal(A[0].length,B[0].length);count+=2;A.forEach((r,i)=>r.forEach((x,j)=>near(x,B[i][j],label)));}
function left(ts){let B=[[1]];for(const A of ts){let N=[];for(const row of B)for(let s=0;s<A.length;s++)N.push(A[s][0].map((_,r)=>row.reduce((v,x,l)=>v+x*A[s][l][r],0)));B=N;}return B;}
function right(ts){let B=[[1]];for(const A of ts.slice().reverse()){let N=[];for(let s=0;s<A.length;s++)for(const row of B)N.push(A[s].map(r=>dot(r,row)));B=N;}return B;}
function kron(A,B){return A.flatMap(r=>B.map(s=>r.flatMap(x=>s.map(y=>x*y))));}
function fullMPO(ws,lb,rb){let ops=lb.map(x=>[[x]]);for(const W of ws){let n=ops[0].length*W[0][0].length, next=Array.from({length:W[0].length},()=>zeros(n,n));for(let a=0;a<W.length;a++)for(let b=0;b<W[a].length;b++){const K=kron(ops[a],W[a][b]);next[b]=next[b].map((r,i)=>r.map((v,j)=>v+K[i][j]));}ops=next;}return ops[0].map((r,i)=>r.map((_,j)=>ops.reduce((s,A,a)=>s+rb[a]*A[i][j],0)));}
function basis(ts,j){const L=left(ts.slice(0,j)),R=right(ts.slice(j+2)),d=ts[j].length*ts[j+1].length,I=Array.from({length:d},(_,i)=>Array.from({length:d},(_,k)=>+(i===k)));return kron(kron(L,I),R);}
// Rectangular MPO bonds and non-qubit physical dimension; no Ising shortcuts.
const dims=[2,3,2],mb=[1,2,3,1],wb=[1,2,3,1];
const ts=dims.map((d,j)=>Array.from({length:d},(_,s)=>Array.from({length:mb[j]},(_,l)=>Array.from({length:mb[j+1]},(_,r)=>Math.sin(1+17*j+7*s+3*l+r)/2))));
const ws=dims.map((d,j)=>Array.from({length:wb[j]},(_,a)=>Array.from({length:wb[j+1]},(_,b)=>Array.from({length:d},(_,s)=>Array.from({length:d},(_,t)=>Math.cos(2+13*j+7*a+5*b+3*s+t))))));
const H=fullMPO(ws,[1],[1]),psi=left(ts).flat(),energy=dot(psi,mv(H,psi));let EL=[[[1]]],ER=[[[1]]];for(let j=0;j<3;j++)EL=lab.growLeft(EL,ts[j],ws[j]);for(let j=2;j>=0;j--)ER=lab.growRight(ER,ts[j],ws[j]);near(EL[0][0][0],energy,"General left expectation");near(ER[0][0][0],energy,"General right expectation");
for(let j=0;j<2;j++){let L=[[[1]]],R=[[[1]]];for(let k=0;k<j;k++)L=lab.growLeft(L,ts[k],ws[k]);for(let k=2;k>j+1;k--)R=lab.growRight(R,ts[k],ws[k]);const W=basis(ts,j),A=lab.action(L,R,ws[j],ws[j+1]),projected=mul(mul(T(W),H),W),actual=T(Array.from({length:projected.length},(_,i)=>A(Array.from({length:projected.length},(_,k)=>+(i===k)))));matrix(actual,projected,"Non-Ising rectangular physical projection");}
for(const f of refs){const r=lab.run(f.length,f.g,f.chi,f.rounds,64);near(r.E,f.E,"Independent NumPy sweep energy");near(r.norm,1,"MPS norm");r.history.forEach((s,i)=>{for(const k of ["before","optimized","E","epsilon"])near(s[k],f.history[i][k],"Independent NumPy history "+k);assert.ok(s.optimized<=s.before+2e-8);assert.ok(s.orthogonality<1e-10);count+=2;});}
const apply=v=>[-2*v[0],v[1],5*v[2]];
let last=Infinity;for(let k=1;k<=3;k++){const r=lab.krylov(apply,[1,1,1],k);assert.ok(r.energy<=last+1e-10);count++;last=r.energy;if(k===3){near(r.energy,-2,"Complete cyclic Krylov");near(r.residual,0,"Explicit residual");}}
const trapped=lab.krylov(apply,[0,1,0],3);near(trapped.energy,1,"Invariant excited-state trap");near(trapped.residual,0,"Zero residual not ground certificate");assert.equal(trapped.steps,1);count++;
const short=lab.run(8,1,2,2,2),full=lab.run(8,1,2,2,16);assert.ok(short.maxResidual>.1);assert.ok(full.maxResidual<1e-10);assert.ok(short.E>full.E);count+=3;
assert.throws(()=>lab.krylov(apply,[0,0,0],2));assert.throws(()=>lab.compute('operator',{steps:0}));count+=2;
console.log(`MPO/Krylov checks: PASS (${count}; general rectangular non-Ising contraction, 29 NumPy sweep trajectories, Krylov invariance trap)`);
