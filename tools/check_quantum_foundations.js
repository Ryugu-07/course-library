'use strict';
const assert = require('assert');
const m = require('../course-shared/labs/quantum-measurement.js');
const q = require('../course-shared/labs/quantum-oscillator.js');
let checks=0;
function near(a,b,t=2e-12){checks++;assert.ok(Math.abs(a-b)<=t,`${a} != ${b} tol ${t}`);}
// Independent spinor projection matrix, independent of the half-angle probability implementation.
for(let s=0;s<360;s+=7) for(let a=0;a<360;a+=11){
 const sr=s*Math.PI/180, ar=a*Math.PI/180;
 const v=[Math.cos(sr/2),Math.sin(sr/2)];
 const P=[[(1+Math.cos(ar))/2,Math.sin(ar)/2],[Math.sin(ar)/2,(1-Math.cos(ar))/2]];
 const Pv=P.map(row=>row[0]*v[0]+row[1]*v[1]);
 const prob=Pv.reduce((sum,x)=>sum+x*x,0), result=m.probabilities(ar,sr);
 near(result.plus,prob);near(result.plus+result.minus,1);
 if(prob>1e-8){ const w=Pv.map(x=>x/Math.sqrt(prob)); const Pw=P.map(row=>row[0]*w[0]+row[1]*w[1]);near(Pw[0],w[0]);near(Pw[1],w[1]); }
}
near(m.probabilities(Math.PI/3,0).minus,.25);near(m.probabilities(0,4*Math.PI/3).plus,.25);
near(m.probabilities(Math.PI/3,0).minus*m.probabilities(0,4*Math.PI/3).plus,1/16);
for(const d of [1e-6,1e-8,1e-10]){checks++;assert(m.probabilities(d,0).minus>0);}
near(m.probabilities(Math.PI,0).plus,0,0);near(m.probabilities(0,0).minus,0,0);
// Explicit dense finite matrices, not the production top-boundary formula.
function zero(n){return Array.from({length:n},()=>Array(n).fill(0));}
function mul(A,B){return A.map(row=>B[0].map((_,j)=>row.reduce((s,v,k)=>s+v*B[k][j],0)));}
for(let N=2;N<=32;N++){
 const a=zero(N); for(let j=1;j<N;j++)a[j-1][j]=Math.sqrt(j);
 const ad=a[0].map((_,j)=>a.map(row=>row[j])); const aa=mul(a,ad),ada=mul(ad,a);
 for(let n=0;n<N;n++){
  const f=q.finiteFock({N,n});
  near(f.truncatedEnergy,(aa[n][n]+ada[n][n])/2);
  near(f.projectedEnergy,n+.5);near(f.signedCommutatorResidual,aa[n][n]-ada[n][n]-1);
  near(f.commutatorResidual,Math.hypot(...aa.map((row,i)=>row[n]-ada[i][n]-(i===n?1:0))));
 }
}
// Hermite polynomials via explicit finite coefficients, independent of recurrence.
function fact(n){let z=1;for(let k=2;k<=n;k++)z*=k;return z;}
function explicitH(n,x){let z=0;for(let j=0;j<=Math.floor(n/2);j++)z+=(-1)**j*fact(n)*(2*x)**(n-2*j)/(fact(j)*fact(n-2*j));return z;}
function psi(n,x){return explicitH(n,x)*Math.exp(-x*x/2)/(Math.PI**.25*Math.sqrt(2**n*fact(n)));}
function deriv(n,x){const c=Math.exp(-x*x/2)/(Math.PI**.25*Math.sqrt(2**n*fact(n)));return c*((n?2*n*explicitH(n-1,x):0)-x*explicitH(n,x));}
for(let n=0;n<=16;n++) for(const x of [-4,-2,-.2,0,.3,1,2.5,5])near(q.wavefunction(n,x),psi(n,x),5e-10);
function simpson(fn,X){const steps=12000,h=2*X/steps;let s=0;for(let k=0;k<=steps;k++)s+=(k===0||k===steps?1:k%2?4:2)*fn(-X+k*h);return s*h/3;}
for(const n of [0,1,2,6,12,16])for(const X of [4,7,12]){
 const r=q.compute({n,N:32,X,grid:2401});
 near(r.grid.norm,simpson(x=>psi(n,x)**2,X),2e-5);
 near(r.grid.x2,simpson(x=>x*x*psi(n,x)**2,X),3e-4);
 near(r.grid.p2,simpson(x=>deriv(n,x)**2,X),.016);
 if(X===12){near(r.grid.norm,1,2e-10);near(r.grid.x2,n+.5,3e-9);near(r.grid.nodeCount,n,0);}
}
for(const n of [0,10,20,30]){checks++;assert.strictEqual(q.format(n,0),String(n));}
// A chirped Gaussian: integrate exact |p psi|² and symmetrized covariance.
for(const c of [-3,0,2])for(const s of [.5,1,2]){
 const density=x=>Math.exp(-x*x/(2*s*s))/(Math.sqrt(2*Math.PI)*s);
 const vx=simpson(x=>x*x*density(x),12*s);
 const vp=simpson(x=>(1+c*c)*x*x/(4*s**4)*density(x),12*s);
 const cov=simpson(x=>c*x*x/(2*s*s)*density(x),12*s);
 near(vx*vp-cov*cov,.25,2e-12);near(Math.sqrt(vx*vp),Math.sqrt(1+c*c)/2,2e-12);
}
console.log(`quantum foundations independent checks: ${checks} PASS`);
