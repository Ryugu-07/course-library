"use strict";
// Independent finite enumeration, boundary matrices, quadrature and Fock signs.
const assert=require('node:assert/strict');
const lab=require('../course-shared/labs/research-foundations.js');
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const close=(a,b,t=1e-10)=>ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
for(let m=2;m<=24;m++)for(let a=0;a<=24;a++){
  const r=lab.compute('module',{m,a}).numeric;
  // Fibres of a homomorphism all have the same size as its kernel.
  const fibres=new Map();
  for(let x=0;x<m;x++){const y=a*x%m;fibres.set(y,(fibres.get(y)||0)+1);}
  eq(r.image.length,fibres.size);
  fibres.forEach(size=>eq(size,r.kernel.length));
  eq(r.kernel.length*r.image.length,m);
}
// Enumerate powers of s modulo m and the localization equivalence relation,
// without factorization or the implementation's repeated gcd rule.
for(let m=2;m<=36;m++)for(let s=1;s<=12;s++){
  const powers=new Set();let p=1;
  while(!powers.has(p)){powers.add(p);p=p*s%m;}
  const killed=x=>[...powers].some(u=>u*x%m===0);
  const kernel=Array.from({length:m},(_,x)=>x).filter(killed);
  const r=lab.compute('localization',{m,s}).numeric;
  eq(r.kernel,kernel);eq(r.remaining*kernel.length,m);
  for(let x=0;x<m;x++)for(let y=0;y<m;y++)eq(killed((x-y+m)%m),x%r.remaining===y%r.remaining);
}
function rank(input){
  const a=input.map(r=>r.slice());let row=0;
  for(let col=0;col<a[0].length&&row<a.length;col++){
    const pivot=a.findIndex((r,i)=>i>=row&&Math.abs(r[col])>1e-10);
    if(pivot<0)continue;[a[row],a[pivot]]=[a[pivot],a[row]];
    const scale=a[row][col];a[row]=a[row].map(x=>x/scale);
    for(let i=0;i<a.length;i++)if(i!==row){const s=a[i][col];a[i]=a[i].map((x,j)=>x-s*a[row][j]);}row++;
  }return row;
}
const d1=[[-1,0,-1],[1,-1,0],[0,1,1]];
for(const filled of [0,1])for(const wrong of [0,1]){
  const r=lab.compute('complex',{filled,wrong}).numeric;
  const twice=d1.map(row=>row.reduce((s,x,j)=>s+x*r.boundary[j],0));
  r.twice.forEach((value,i)=>close(value,twice[i]));eq(r.valid,twice.every(x=>x===0));
  eq(r.h1,r.valid?3-rank(d1)-rank(r.boundary.map(x=>[x])):null);
}
for(const g12 of [0,1])for(const g23 of [0,1])for(const g31 of [0,1]){
  const r=lab.compute('sheaf',{g12,g23,g31}).numeric,[a,b,c]=r.signs;
  eq(r.dimension,3-rank([[-a,1,0],[0,-b,1],[1,0,-c]]));
  // A change of local signs preserves holonomy and section dimension.
  for(const e of [[-1,1,1],[1,-1,1],[1,1,-1]]){
    const t=[e[1]*a*e[0],e[2]*b*e[1],e[0]*c*e[2]];
    eq(t.reduce((a,b)=>a*b),r.holonomy);
  }
}
for(let legs=0;legs<=4;legs++)for(const delta of [.05,.1,.4,1]){
  const r=lab.compute('lsz',{legs,delta,lambda:.3}).numeric;
  let product=.3;for(let j=0;j<4;j++)product/=delta;for(let j=0;j<legs;j++)product*=delta;
  close(r.value,product);close(r.amplitude,-.3);
}
// Adaptive midpoint quadrature uses an independent integration rule, including
// the radial integral that the browser evaluates analytically.
function integrate(f,a,b,n=20000){let sum=0;for(let i=0;i<n;i++)sum+=f(a+(i+.5)*(b-a)/n);return sum*(b-a)/n;}
for(const cutoff of [2,10,40]){
  const r=lab.compute('loop',{cutoff,q:2,q0:0}).numeric;
  close(r.radial,integrate(k=>k**3/(k*k+1)**2,0,cutoff),2e-9);
}
for(const q of [0,.25,2,4])for(const q0 of [0,1,4]){
  const r=lab.compute('loop',{q,q0,cutoff:10}).numeric;
  const truth=-integrate(x=>Math.log((1+x*(1-x)*q*q)/(1+x*(1-x)*q0*q0)),0,1)/(16*Math.PI**2);
  close(r.limit,truth,5e-9);
  close(lab.compute('loop',{q:q0,q0:q,cutoff:10}).numeric.difference,-r.difference);
  const farther=lab.compute('loop',{q,q0,cutoff:40}).numeric;
  ok(Math.abs(farther.error)<=Math.abs(r.error)+1e-12,'cutoff convergence');
}
// Four ordered fermion orbitals. Apply operators on occupation bitsets,
// independently reproducing every entry of the new Hubbard action table.
function fermion(mask,orbital,create){
  const bit=1<<orbital,occupied=!!(mask&bit);
  if(occupied===create)return null;
  let count=0;for(let j=0;j<orbital;j++)if(mask&(1<<j))count++;
  return [mask^bit,count%2?-1:1];
}
function hop(mask,to,from){const a=fermion(mask,from,false);if(!a)return null;const b=fermion(a[0],to,true);return b?[b[0],-a[1]*b[1]]:null;}
const states=[9,6,3,12]; // A,B,D1,D2
const terms=[[0,2],[2,0],[1,3],[3,1]];
const table=[[null,[3,1],null,[9,-1]],[[12,-1],null,[6,1],null],[[3,-1],null,null,[6,1]],[null,[12,1],[9,-1],null]];
terms.forEach(([to,from],i)=>states.forEach((mask,j)=>eq(hop(mask,to,from),table[i][j])));
for(const mask of [5,10])terms.forEach(([to,from])=>eq(hop(mask,to,from),null));
const H=states.map(target=>states.map(source=>terms.reduce((s,[a,b])=>{const p=hop(source,a,b);return s+(p&&p[0]===target?p[1]:0);},0)));
H.forEach((row,i)=>row.forEach((v,j)=>eq(v,H[j][i])));
const mv=v=>H.map(row=>row.reduce((s,x,j)=>s+x*v[j],0));
const s=1/Math.sqrt(2);
mv([s,-s,0,0]).forEach((v,i)=>close(v,[0,0,-2*s,-2*s][i]));
mv([s,s,0,0]).forEach(v=>close(v,0));
for(const topic of lab.topics){
  lab.compute(topic);
  for(const c of lab.configs[topic].controls){
    for(const value of [c[2],c[3]])lab.compute(topic,{[c[0]]:value});
    for(const value of [NaN,Infinity,c[2]-1,c[3]+1]){assert.throws(()=>lab.compute(topic,{[c[0]]:value}));checks++;}
  }
}
console.log(`PASS: ${checks} foundation checks (enumeration, ranks, quadrature, Fock signs, boundaries)`);
