"use strict";
const assert=require('node:assert/strict');
const lab=require('../course-shared/labs/research-limits.js');
let checks=0;
function close(a,b,tol=1e-10){assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);checks++;}
const zeros=n=>Array.from({length:n},()=>Array(n).fill(0));
const trans=a=>a[0].map((_,j)=>a.map(r=>r[j]));
const mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r.reduce((s,x,k)=>s+x*b[k][j],0)));
const add=(a,b)=>a.map((r,i)=>r.map((x,j)=>x+b[i][j]));
const scale=(a,s)=>a.map(r=>r.map(x=>x*s));
const trace=a=>a.reduce((s,r,i)=>s+r[i],0);
const outer=v=>v.map(x=>v.map(y=>x*y));
function eig(a){ // Jacobi diagonalization, independent of the lesson's closed eigenvalues.
 const b=a.map(r=>r.slice()),n=b.length;
 for(let it=0;it<200;it++){
  let p=0,q=1;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(b[i][j])>Math.abs(b[p][q])){p=i;q=j;}
  if(Math.abs(b[p][q])<1e-14)break;
  const angle=.5*Math.atan2(2*b[p][q],b[q][q]-b[p][p]),c=Math.cos(angle),s=Math.sin(angle);
  const u=zeros(n);for(let i=0;i<n;i++)u[i][i]=1;u[p][p]=u[q][q]=c;u[p][q]=s;u[q][p]=-s;
  const r=mul(trans(u),mul(b,u));for(let i=0;i<n;i++)for(let j=0;j<n;j++)b[i][j]=r[i][j];
 }
 return b.map((r,i)=>r[i]).sort((x,y)=>x-y);
}
function choi(map){const j=zeros(4);for(let a=0;a<2;a++)for(let b=0;b<2;b++){const e=zeros(2);e[a][b]=1;const y=map(e);for(let c=0;c<2;c++)for(let d=0;d<2;d++)j[2*c+a][2*d+b]=y[c][d]/2;}return j;}
for(const p of [0,.05,.4,.5,.9,1]){
 const ks=[[[1,0],[0,Math.sqrt(1-p)]],[[0,Math.sqrt(p)],[0,0]]];
 const map=r=>ks.map(k=>mul(k,mul(r,trans(k)))).reduce(add);
 const j=choi(map),e=eig(j),v=lab.compute('damping',{p}).numeric;
 [0,0,v.choiSmall,v.choiLarge].sort((a,b)=>a-b).forEach((x,i)=>close(e[i],x));
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)close(j[a][b]+j[2+a][2+b],a===b?.5:0);
 for(const theta of [0,.15,.5,.75,1]){
  const x=[Math.cos(Math.PI*theta/2),Math.sin(Math.PI*theta/2)],r=map(outer(x)),v=lab.compute('damping',{p,theta}).numeric;
  close(trace(r),1);close(r[1][1],v.pe);close(Math.abs(r[0][1]),v.coherence);close(trace(mul(r,r)),v.purity);
 }
}
for(const q of [0,.1,.5,.6,.66,2/3,.67,.8,1]){
 const map=r=>add(scale(trans(r),1-q),[[q*trace(r)/2,0],[0,q*trace(r)/2]]);
 const j=choi(map),e=eig(j),v=lab.compute('choi',{q}).numeric;
 [v.minus,v.plus,v.plus,v.plus].sort((a,b)=>a-b).forEach((x,i)=>close(e[i],x));
 close(trace(j),1);const singlet=[0,1/Math.sqrt(2),-1/Math.sqrt(2),0];close(mul([singlet],mul(j,trans([singlet])))[0][0],v.minus);
 assert.equal(v.cp,q>=2/3);checks++;
 for(let i=0;i<12;i++){const a=i*.37,x=[Math.cos(a),Math.sin(a)],r=map(outer(x));assert.ok(eig(r)[0]>-1e-12);checks++;}
}
// Gaussian fourth moments via exact three-node Gaussian quadrature, not random sampling.
const nodes=[[-Math.sqrt(3),1/6],[0,2/3],[Math.sqrt(3),1/6]];
function averageSquare(coeff,s,N){let total=0;const count=64;for(let j=0;j<count;j++){let x=0;for(let k=1;k<=N;k++)x+=(coeff[2*k-2]*Math.cos(k*2*Math.PI*j/count)+coeff[2*k-1]*Math.sin(k*2*Math.PI*j/count))/k**s;total+=x*x/count;}return total;}
for(const s of [0,.25,.5,1]){
 let mean=0,second=0;
 for(const [a,wa] of nodes)for(const [b,wb] of nodes)for(const [c,wc] of nodes)for(const [d,wd] of nodes){
  const C=1+2**(-2*s),y=averageSquare([a,b,c,d],s,2)-C,w=wa*wb*wc*wd;mean+=w*y;second+=w*y*y;
 }
 const r=lab.compute('wick',{N:2,s}).numeric;close(mean,0);close(second,r.variance);
}
for(const s of [0,.25,.3,.5,.75,1])for(const N of [2,16,64,128]){
 const r=lab.compute('wick',{N,s}).numeric;
 // Difference is a sum of independent centered chi-square pairs, each variance 4.
 let oracle=0;for(let k=N+1;k<=2*N;k++){const coefficient=.5/k**(2*s);oracle+=4*coefficient*coefficient;}close(r.difference,oracle);
 if(s>.25){assert.ok(r.difference<=r.bound+1e-12);checks++;}else{assert.equal(r.bound,null);checks++;}
 assert.equal(r.converges,s>.25);checks++;
}
const critical=lab.compute('wick',{N:128,s:.25}).numeric.difference;assert.ok(Math.abs(critical-Math.log(2))<.003);checks++;
for(const topic of lab.topics){for(const control of lab.configs[topic].controls){for(const v of [control[2],control[3]]){const r=lab.compute(topic,{[control[0]]:v});assert.ok(r.chart.series.every(s=>s.points.every(p=>p.every(Number.isFinite))));checks++;}assert.throws(()=>lab.compute(topic,{[control[0]]:NaN}));checks++;}}
assert.throws(()=>lab.compute('wick',{N:2.5}));checks++;
console.log(`limits checks: PASS (${checks}; Kraus matrices, Choi diagonalization, Gaussian quadrature, Cauchy tails)`);
