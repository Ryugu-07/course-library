'use strict';
const assert=require('assert'),oe=require('../course-shared/labs/ode-existence-uniqueness.js'),os=require('../course-shared/labs/ode-stability.js'),bc=require('../course-shared/labs/banach-contraction.js'),ot=require('../course-shared/labs/operator-tail.js');let checks=0;
const ok=(v,m)=>{checks++;assert(v,m)},near=(a,b,t=1e-10)=>ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
for(const kind of ['linear','sqrt','blowup'])for(const horizon of [.5,.9,1,1.5,3])for(const steps of [4,24,80]){
 const d=oe.chartData(kind,horizon,steps),end=kind==='blowup'?Math.min(.98,horizon):horizon;
 near(d.observationTime,end);ok(d.branches.length===(kind==='sqrt'?3:1),'all analytic branches');
 for(const branch of d.branches)for(const p of branch.points){
  const y=kind==='linear'?Math.exp(p.t):kind==='sqrt'?Math.max(0,p.t-branch.delay)**2/4:1/(1-p.t);
  near(p.y,y);ok(p.y>=0&&p.y<d.yMax,'no clipped plateau');ok(p.t<=d.xMax,'time in viewport');
 }
 if(kind==='linear')d.euler.forEach((p,i)=>near(p.y,(1+end/steps)**i));
 if(kind==='sqrt')ok(d.euler.every(p=>p.y===0),'Euler only chooses stationary branch');
}
// Independent scaling-and-squaring matrix exponential, no trace/discriminant formula.
const mul=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3]];
function exp(A,t){const norm=t*Math.max(Math.abs(A[0])+Math.abs(A[1]),Math.abs(A[2])+Math.abs(A[3])),s=Math.max(0,Math.ceil(Math.log2(norm/.25))),B=A.map(x=>x*t/2**s);let E=[1,0,0,1],term=E.slice();for(let k=1;k<=24;k++){term=mul(term,B).map(x=>x/k);E=E.map((x,i)=>x+term[i]);}for(let j=0;j<s;j++)E=mul(E,E);return E;}
for(const p of os.PRESETS)for(let angle=0;angle<=180;angle+=15)for(let k=0;k<=20;k++){
 const t=p.horizon*k/20,v=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)],E=exp(p.A,t),actual=os.matrixExpVector(p.A,t,v);
 near(actual[0],E[0]*v[0]+E[1]*v[1]);near(actual[1],E[2]*v[0]+E[3]*v[1]);
}
const transient=os.matrixExpVector([-1,8,0,-2],Math.log(2),[0,1]);near(transient[0],2);near(transient[1],.25);
for(const q of [-.9,-.5,0,.5,.9])for(const b of [0,.25,.75,1,2])for(const domain of ['real','open','closed'])for(const x0 of [-1,0,.5,1,2])for(const steps of [1,8,24]){
 const d=bc.compute({q,b,domain,x0,steps});const inside=x=>domain==='real'||(domain==='closed'?x>=0&&x<=1:x>0&&x<1);
 const invariant=domain==='real'||(q===0&&domain==='open'?b>0&&b<1:Math.min(b,b+q)>=0&&Math.max(b,b+q)<=1),certificate=domain!=='open'&&invariant;
 ok(d.certificate===certificate,'mapping certificate');ok(d.initialInDomain===inside(x0),'initial domain membership');ok(d.boundsCertified===(certificate&&inside(x0)),'trajectory certificate distinct');
 for(const row of d.rows){const exact=q**row.n*x0+b*(1-q**row.n)/(1-q);near(row.x,exact);near(row.actualError,Math.abs(exact-b/(1-q)));if(d.boundsCertified){ok(row.actualError<=row.aPriori+1e-10,'prior actual enclosure');if(row.n>0)ok(row.actualError<=row.aPosteriori+1e-10,'posterior actual enclosure');}}
}
// A concrete finite-dimensional compression witness, without reusing tailCertificate.
for(const N of [1,2,8,32,64])for(const operator of ['decay','flat','shift']){
 const M=N+3,d=ot.evaluate({operator,N}),A=Array.from({length:M},()=>Array(M).fill(0));
 for(let j=0;j<M;j++){if(operator==='shift'){if(j+1<M)A[j+1][j]=1;}else A[j][j]=operator==='decay'?1/(j+1):1;}
 const residual=A.map((row,i)=>row.map((x,j)=>i<N&&j<N?0:x));let max=0,rank=0;
 for(let j=0;j<M;j++){const length=Math.hypot(...residual.map(row=>row[j]));max=Math.max(max,length);if(j<N&&A.slice(0,N).some(row=>row[j]!==0))rank++;}
 near(d.finiteError,max);ok(d.finiteRank===rank,'actual compression rank');
}
console.log(`ODE/Banach: PASS (${checks} independent checks)`);
