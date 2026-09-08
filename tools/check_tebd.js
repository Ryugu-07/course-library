"use strict";
const assert=require('node:assert/strict'),lab=require('../course-shared/labs/research-tebd'),refs=require('./fixtures/tebd-numpy.json');let count=0;
function near(a,b,label,tol=2e-8){assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);count++;}
function id(A){A.forEach((r,i)=>r.forEach((z,j)=>{near(z[0],+(i===j),'isometry real',2e-9);near(z[1],0,'isometry imag',2e-9);}));}
for(const f of refs.matrices){const s=lab.svdLeft(f.M);f.weights.forEach((w,i)=>near(s.weights[i],w,'NumPy singular weight'));id(lab.mm(lab.dag(s.U),s.U));for(const direction of [-1,1])for(let chi=1;chi<=Math.min(f.M.length,f.M[0].length);chi++){
 const r=lab.split(f.M,chi,direction),P=lab.mm(r.A,r.B),norm=lab.norm2(f.M.flat()),overlap=lab.dot(f.M.flat().map(z=>lab.scale(z,1/Math.sqrt(norm))),P.flat());near(lab.norm2(P.flat()),1,'compressed norm');near(lab.abs2(overlap),1-r.epsilon,'Schmidt fidelity');near(lab.distance(f.M.flat().map(z=>lab.scale(z,1/Math.sqrt(norm))),P.flat()),r.delta,'phase-fixed truncation distance');}}
let updates=0;
for(const f of refs.cases){const r=lab.run(f.n,f.g,f.chi,f.T,f.steps,({ts,j,split})=>{near(split.total,1,'gate normalization');
 for(let k=0;k<=j;k++){const A=ts[k],M=Array.from({length:2*A[0].length},(_,i)=>A[i%2][Math.floor(i/2)]);id(lab.mm(lab.dag(M),M));}
 for(let k=j+2;k<ts.length;k++){const A=ts[k],M=A[0].map((_,l)=>[...A[0][l],...A[1][l]]);id(lab.mm(M,lab.dag(M)));}updates++;
});r.history.forEach((h,i)=>{for(const k of ['norm','E','magnet','trotter','compression','total','sumDelta','sumEpsilon'])near(h[k],f.history[i][k],'NumPy trajectory '+k);assert.ok(h.compression<=h.sumDelta+2e-9);assert.ok(h.trotter<=h.trotterBound+2e-9);count+=2;});r.truncations.forEach((s,i)=>near(s.epsilon,f.epsilon[i],'NumPy per-gate discard'));}
const a=lab.run(4,1,4,1,8).final,b=lab.run(4,1,4,1,16).final,c=lab.run(4,1,4,1,32).final;assert.ok(a.trotter/b.trotter>3.9&&a.trotter/b.trotter<4.1);assert.ok(b.trotter/c.trotter>3.9&&b.trotter/c.trotter<4.1);assert.ok(c.compression<1e-10);count+=3;
assert.throws(()=>lab.run(4,1,0,1,10));assert.throws(()=>lab.compute('evolution',{steps:0}));count+=2;
console.log(`Complex TEBD checks: PASS (${count}; ${refs.cases.length} SciPy/NumPy trajectories, ${updates} canonical gate updates, complex SVD and Strang second order)`);
