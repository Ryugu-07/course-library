"use strict";
const assert=require("node:assert/strict");
const lib=require("../course-shared/labs/research-math.js");
let checks=0;
function ok(x,message){assert.ok(x,message);checks++;}
function near(a,b,tol=1e-10){ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const mod=(x,p)=>((x%p)+p)%p;
const primes=[5,7,11,13,17,19];
// Independent Euler-criterion character sum, rather than production's pair enumeration.
for(let index=0;index<primes.length;index++)for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){
  const p=primes[index];let count=p+1;
  for(let x=0;x<p;x++){const n=mod(x*x*x+a*x+b,p);if(n){let power=1;for(let j=0;j<(p-1)/2;j++)power=power*n%p;count+=power===1?1:-1;}}
  const r=lib.compute("nt-counting",{prime:index,a,b}).numeric;
  near(r.N,count);if(!r.singular)ok(Math.abs(r.trace)<=2*Math.sqrt(p),"Hasse window");
}
// Exhaustive group orbit: every point on the curve occurs, and inverses match.
const points=new Set(["null"]);
for(let m=1;m<19;m++){
  const {P,Q,R}=lib.compute("nt-group",{m,n:19-m}).numeric;
  ok(P!==null,"nonzero orbit");near(mod(P[1]**2-P[0]**3-2*P[0]-2,17),0);
  points.add(JSON.stringify(P));ok(R===null,"inverse sum");near(P[0],Q[0]);near(mod(P[1]+Q[1],17),0);
}
near(points.size,19);
for(let x=0;x<17;x++)for(let y=0;y<17;y++)if(mod(y*y-x*x*x-2*x-2,17)===0)ok(points.has(JSON.stringify([x,y])),"complete group orbit");
for(let m=-19;m<=19;m++)for(let n=-19;n<=19;n++)ok(JSON.stringify(lib.compute("nt-group",{m,n}).numeric.R)===JSON.stringify(lib.compute("nt-group",{m:mod(m+n,19),n:0}).numeric.P),"group addition");
// Independent Delta evaluation via Eisenstein series (divisor sums), not the product.
function eisDelta(y){const q=Math.exp(-2*Math.PI*y);let e4=1,e6=1;for(let n=1;n<=160;n++){let s3=0,s5=0;for(let d=1;d<=n;d++)if(n%d===0){s3+=d**3;s5+=d**5;}e4+=240*s3*q**n;e6-=504*s5*q**n;}return (e4**3-e6**2)/1728;}
for(const y of [.35,.4,.55,.7,1,1.4,2]){const r=lib.compute("nt-modular",{y,N:60}).numeric;near(r.delta,eisDelta(y),2e-12);near(r.relativeError,0,4e-13);}
ok(Math.abs(lib.compute("nt-modular",{y:.4,N:3}).numeric.relativeError)>.001,"nontrivial truncation");
// F_p² = F_p[u]/(u²-d), with non-square d. Enumerate pairs in this actual field.
for(let index=0;index<4;index++){
  const p=primes[index];const sq=new Set(Array.from({length:p},(_,x)=>x*x%p));let d=2;while(sq.has(d))d++;
  const encode=(a,b)=>mod(a,p)+p*mod(b,p),decode=x=>[x%p,Math.floor(x/p)];
  const multiply=(x,y)=>{const[a,b]=decode(x),[c,e]=decode(y);return encode(a*c+d*b*e,a*e+b*c);};
  const add=(x,y)=>{const[a,b]=decode(x),[c,e]=decode(y);return encode(a+c,b+e);};
  const roots=Array(p*p).fill(0);for(let y=0;y<p*p;y++)roots[multiply(y,y)]++;
  let count=1;for(let x=0;x<p*p;x++)count+=roots[add(add(multiply(multiply(x,x),x),x),1)];
  near(lib.compute("nt-frobenius",{prime:index,r:2}).numeric.extensionCount,count);
}
// The covariance comes independently from a linear pushforward A Sigma A^T.
for(const t of [0,.3,1,4])for(const rho of [-.95,0,.5,.95]){
  const covariance=[[1,0,0,0],[0,1,0,0],[0,0,1,rho],[0,0,rho,1]],A=[[1,0,t,0],[0,1,0,t]];
  const C=A.map(a=>A.map(b=>a.reduce((s,x,i)=>s+x*b.reduce((q,y,j)=>q+y*covariance[i][j],0),0)));
  const r=lib.compute("kinetic-marginals",{t,rho}).numeric;near(r.variance,C[0][0]);near(r.covariance,C[0][1]);near(r.differenceVariance,C[0][0]+C[1][1]-2*C[0][1]);
  // Check nonnegative sampled density; this is not a normalization integral.
  const series=lib.compute("kinetic-marginals",{t,rho}).chart.series[0];ok(series.points.every(p=>p[1]>=0),"positive Gaussian density");
  for(const curve of lib.compute("kinetic-marginals",{t,rho}).chart.series){
    const peak=Math.max(...curve.points.map(p=>p[1]));
    ok(curve.points[0][1]/peak<=Math.exp(-8)+1e-12,"Gaussian left tail visible");
    ok(curve.points.at(-1)[1]/peak<=Math.exp(-8)+1e-12,"Gaussian right tail visible");
  }
}
for(const u of [.2,1.7,4])for(let angle=0;angle<=90;angle++){
  const r=lib.compute("kinetic-collisions",{u,angle}).numeric;
  near(r.momentum[0],u);near(r.momentum[1],0);near(r.energy,u*u/2);
  // Reflect the relative velocity a second time; the collision must be an involution.
  const n=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)],g=r.v.map((x,i)=>x-r.w[i]),dot=g[0]*n[0]+g[1]*n[1];
  near(g[0]-2*dot*n[0],u);near(g[1]-2*dot*n[1],0);
}
for(const epsilon of [.05,.5,1])for(const eta of [-.04,0,.04]){
  let prior=Infinity;for(const t of [0,.1,.5,1,3]){const r=lib.compute("kinetic-hydro",{epsilon,eta,t}).numeric;near(r.mass,1);near(r.momentum,0);near(r.energy,.7736382857095345);ok(r.f.every(x=>x>0),"positive BGK mass");ok(r.relativeEntropy<=prior+1e-14,"BGK entropy nonincrease");prior=r.relativeEntropy;}
  // Independent forward Euler integration of the four equations, small enough time step.
  const start=lib.compute("kinetic-hydro",{epsilon,eta,t:0}).numeric;let f=start.f.slice(),h=epsilon/20000;
  for(let j=0;j<20000;j++)f=f.map((x,i)=>x+h*(start.M[i]-x)/epsilon);
  const exact=lib.compute("kinetic-hydro",{epsilon,eta,t:epsilon}).numeric.f;f.forEach((x,i)=>near(x,exact[i],1e-6));
}
const waveCases=[[1,2,2,1],[.2,5,.2,5],[5,.2,5,.2],[.2,.2,.2,.2],[5,5,5,5],[.7,3.2,4.1,1.4]];
for(const n of waveCases){const r=lib.compute("kinetic-waves",{n1:n[0],n2:n[1],n3:n[2],n4:n[3]}).numeric;let prior=-Infinity;for(const row of r.states){const x=row.slice(1);ok(x.every(v=>v>0),"wave positivity");near(x.reduce((a,b)=>a+b,0),r.action);near(x.reduce((s,v,i)=>s+(i+1)*v,0),r.energy);near(x[0]-x[3],n[0]-n[3]);const S=x.reduce((s,v)=>s+Math.log(v),0);ok(S>=prior-1e-12,"wave entropy nondecrease");prior=S;}}
// Closed-form symmetric channel solution d(t)=3/sqrt(1+8 exp(18t)).
for(const row of lib.compute("kinetic-waves").numeric.states){const d=3/Math.sqrt(1+8*Math.exp(18*row[0]));near(row[1],(3-d)/2,2e-11);near(row[2],(3+d)/2,2e-11);}
for(const topic of lib.topics){const spec=lib.configs[topic];for(const control of spec.controls)for(const value of [control[2],control[3]]){const r=lib.compute(topic,{[control[0]]:value});ok(r.chart.series.every(s=>s.points.every(p=>p.every(Number.isFinite))),"finite chart");}const key=spec.controls[0][0];assert.throws(()=>lib.compute(topic,{[key]:NaN}));checks++;}
console.log(`PASS: ${checks} independent and invariant checks across ${lib.topics.length} research math models`);
