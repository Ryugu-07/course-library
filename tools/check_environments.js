"use strict";
const assert=require('assert'),lab=require('../course-shared/labs/research-environments.js');let count=0;
const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]];
const T=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const mul=(A,B)=>A.map(r=>T(B).map(c=>r.reduce((s,v,i)=>s+v*c[i],0)));
const kron=(A,B)=>A.flatMap(row=>B.map(br=>row.flatMap(a=>br.map(b=>a*b))));
const add=(...xs)=>xs[0].map((r,i)=>r.map((_,j)=>xs.reduce((s,A)=>s+A[i][j],0)));
const scale=(A,c)=>A.map(r=>r.map(v=>c*v));
function near(a,b,msg){assert.ok(Math.abs(a-b)<1e-9,`${msg}: ${a} != ${b}`);count++;}
function matrix(A,B,msg){A.forEach((r,i)=>r.forEach((x,j)=>near(x,B[i][j],msg)));}
function h(n,g){const out=Array.from({length:2**n},()=>Array(2**n).fill(0));
 for(let j=0;j<n;j++){let z=[[1]];for(let k=0;k<n;k++)z=kron(z,j===k?Z:I);matrixAdd(out,z,-g);}
 for(let j=0;j<n-1;j++){let xx=[[1]];for(let k=0;k<n;k++)xx=kron(xx,k===j||k===j+1?X:I);matrixAdd(out,xx,-1);}return out;}
function matrixAdd(A,B,c){A.forEach((r,i)=>r.forEach((_,j)=>A[i][j]+=c*B[i][j]));}
const reference=new Map([[0,[-4.23606797749979,Math.SQRT2]],[30,[-4.172515058372035,1.4839128537064672]],[45,[-3.4174069398118334,1.9912923909797848]],[60,[-2.60576649749675,1.2109490537851078]],[90,[-2.4939592074349335,1]]]);
const full=new Map([[.2,-3.061734803953744],[.5,-3.427034088908076],[1,-4.758770483143631],[1.5,-6.503891557126417],[2,-8.376798636850365]]);
for(const g of full.keys())for(const alpha of [0,15,30,45,60,75,90]){
 const m=lab.calculate(alpha,g),W=kron(kron(I,I),m.env.R),H=h(4,g),G=mul(T(W),W),direct=mul(mul(T(W),H),W);
 matrix(G,kron(kron(I,I),I),'Orthonormal center basis');matrix(m.Heff,direct,'Environment equals W^T H W');matrix(lab.hamiltonian(g),H,'Full Kronecker Hamiltonian');
 near(m.norm,1,'Physical norm');near(m.localResidual,0,'Local residual');near(m.physicalEnergy,m.E,'Full physical energy');near(m.ground,full.get(g),'Independent full spectrum');
 assert.ok(m.E>=m.ground-1e-9);count++;
 // A projected eigenvector need not be a full eigenvector, but its full residual projects to zero.
 const psi=m.psi.map(x=>[x]),r=add(mul(H,psi),scale(psi,-m.E));
 matrix(mul(T(W),r),Array.from({length:8},()=>[0]),'Residual perpendicular to search space');
 if(g===1&&reference.has(alpha)){near(m.E,reference.get(alpha)[0],'Independent numpy restricted energy');near(m.physicalResidual,reference.get(alpha)[1],'Independent numpy residual');}
 if(alpha===0)near(m.E,-2*g-Math.sqrt(1+4*g*g),'Analytic fixed-site endpoint');
}
// General nonorthogonal old block and rectangular tensors: test the recursion beyond the lesson's canonical example.
for(let seed=1;seed<=7;seed++){
 const V=Array.from({length:4},(_,r)=>Array.from({length:2},(_,b)=>Math.sin(seed+2*r+3*b)));
 const B=Array.from({length:2},(_,s)=>Array.from({length:3},(_,b)=>Array.from({length:2},(_,r)=>Math.cos(seed+s+2*b+3*r))));
 const g=.3+seed*.2,G=mul(T(V),V),K=mul(mul(T(V),h(2,g)),V),C=mul(mul(T(V),kron(X,I)),V);
 const result=lab.growRight(G,K,C,B,g),Vnew=Array.from({length:8},(_,row)=>Array.from({length:3},(_,b)=>{const s=Math.floor(row/4),rphys=row%4;return V[rphys].reduce((sum,v,r)=>sum+v*B[s][b][r],0);}));
 matrix(result.G,mul(T(Vnew),Vnew),'General Gram recursion');matrix(result.K,mul(mul(T(Vnew),h(3,g)),Vnew),'General internal Hamiltonian recursion');matrix(result.C,mul(mul(T(Vnew),kron(X,kron(I,I))),Vnew),'General boundary recursion');
}
assert.throws(()=>lab.compute('center',{alpha:-1}));assert.throws(()=>lab.compute('center',{g:NaN}));count+=2;
console.log(`environment checks: PASS (${count}; full-state projection, independent spectra, nonorthogonal rectangular contractions)`);
