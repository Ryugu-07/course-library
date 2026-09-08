"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-sweeps.js"),env=require("../course-shared/labs/research-environments.js"),fixtures=require("./fixtures/sweeps-numpy.json");let count=0;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>A.map(r=>T(B).map(c=>dot(r,c))),mv=(A,v)=>A.map(r=>dot(r,v));
function near(a,b,label,tol=1e-8){assert.ok(Math.abs(a-b)<tol,`${label}: ${a} != ${b}`);count++;}
function matrix(A,B,label){A.forEach((r,i)=>r.forEach((x,j)=>near(x,B[i][j],label)));}
function identity(n){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));}
for(const f of fixtures){
 const m=lab.run(f.g,f.chi,2,f.guard);near(m.E,f.E,"Independent NumPy final energy");near(m.residual,f.residual,"Independent NumPy residual");near(m.ground,f.ground,"Independent ground");near(m.norm,1,"Final norm");
 near(m.start,-2.25-2*f.g,"Analytic initial energy");let old=lab.initial();
 for(let i=0;i<m.history.length;i++){
  const s=m.history[i],r=f.history[i];for(const key of ["before","optimized","trial","after","epsilon"])near(s[key],r[key],"Independent step "+key);
  assert.equal(s.accepted,r.accepted);assert.equal(s.W[0].length,r.dimension);count+=2;
  matrix(mul(T(s.W),s.W),identity(s.W[0].length),"Orthonormal block coordinates");
  near(s.representedError,0,"Old state in refreshed search space");
  near(dot(s.candidate,s.candidate),1,"Candidate norm");near(dot(s.candidate,mv(m.H,s.candidate)),s.trial,"Candidate physical energy");
  near(dot(s.optimizedState,s.candidate)**2,1-s.epsilon,"Physical Schmidt fidelity");
  assert.ok(s.optimized<=s.before+1e-8);assert.ok(s.trial>=m.ground-1e-8);count+=2;
  if(f.guard){assert.ok(s.after<=s.before+1.01e-10);count++;}
  if(!s.accepted){s.state.forEach((v,k)=>near(v,old[k],"Rejected candidate leaves old state intact"));}
  for(let cut=1;cut<4;cut++){
   const A=Array.from({length:2**cut},(_,k)=>s.state.slice(k*2**(4-cut),(k+1)*2**(4-cut))),rho=mul(A,T(A)),e=env.eigen(rho).values;
   assert.ok(e.filter(x=>x>1e-10).length<=f.chi);count++;
  }
  old=s.state;
 }
}
// Longer run: energy guard can stagnate with a nonzero physical residual.
const trapped=lab.run(1,1,5,1);near(trapped.E,-4.385966246730643,"Stagnation witness");assert.ok(trapped.residual>.8);assert.ok(trapped.rejected>0);count+=2;
const noGuard=lab.run(1,1,2,0);assert.ok(noGuard.history.some(x=>x.after>x.before+1e-6));count++;
for(const g of [.2,1,2]){const full=lab.run(g,4,5,1);near(full.E,full.ground,"Full four-site cap");near(full.residual,0,"Full-cap residual");}
assert.throws(()=>lab.compute("roundtrip",{chi:1.5}));assert.throws(()=>lab.compute("roundtrip",{rounds:0}));assert.throws(()=>lab.compute("roundtrip",{guard:2}));count+=3;
console.log(`sweep checks: PASS (${count}; 40 NumPy histories, refreshed supports, all-bond ranks, rejection identity, stagnation)`);
