"use strict";
const assert=require("node:assert/strict");
const lab=require("../course-shared/labs/research-geometry.js");
const qwz=require("../course-shared/labs/physics-topological-band.js");
let checks=0;
function equal(a,b){assert.deepEqual(a,b);checks++;}
function near(a,b,t=1e-8){assert.ok(Math.abs(a-b)<=t,`${a} != ${b} (tol ${t})`);checks++;}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const conj=a=>[a[0],-a[1]];
const scale=(a,s)=>[a[0]*s,a[1]*s];
const phase=x=>[Math.cos(x),Math.sin(x)];
const inner=(a,b)=>a.reduce((sum,x,i)=>add(sum,mul(conj(x),b[i])),[0,0]);
const norm2=a=>inner(a,a)[0];
function state(t,p,g=0){return [[-Math.sin(t/2)*Math.cos(p),Math.sin(t/2)*Math.sin(p)],[Math.cos(t/2),0]].map(z=>mul(phase(g),z));}
function loop(states){let v=[1,0];for(let i=0;i<states.length;i++){let o=inner(states[i],states[(i+1)%states.length]);const n=Math.hypot(...o);assert.ok(n>1e-10);v=mul(v,scale(o,1/n));}return -Math.atan2(v[1],v[0]);}
function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a));}

// Enumerate kernel, image and cosets without using gcd / the closed-form result.
for(let m=1;m<=24;m++)for(let n=2;n<=24;n++){
  const r=lab.compute("tensor",{m,n}).numeric,ker=[],img=new Set();
  for(let a=0;a<n;a++){let b=0;for(let i=0;i<m;i++)b=(b+a)%n;img.add(b);if(!b)ker.push(a);}
  const representatives=[];const seen=new Set();
  for(let a=0;a<n;a++)if(!seen.has(a)){representatives.push(a);img.forEach(b=>seen.add((a+b)%n));}
  equal(r.kernel,ker);equal(r.image,[...img].sort((a,b)=>a-b));equal(r.torOrder,ker.length);equal(r.tensorOrder,representatives.length);
}
// Cech: construct finite matrices with enough padding to contain every possible
// kernel/obstruction in k=-6..6. Rank is found by elimination, not interval counts.
function rank(matrix){const a=matrix.map(r=>r.slice());let row=0;for(let col=0;col<(a[0]||[]).length&&row<a.length;col++){
 let p=row;while(p<a.length&&Math.abs(a[p][col])<1e-10)p++;if(p===a.length)continue;
 [a[p],a[row]]=[a[row],a[p]];const z=a[row][col];a[row]=a[row].map(x=>x/z);
 for(let i=0;i<a.length;i++)if(i!==row){const c=a[i][col];a[i]=a[i].map((x,j)=>x-c*a[row][j]);}row++;
}return row;}
for(let k=-6;k<=6;k++){
 const exponents=Array.from({length:41},(_,i)=>i-20);
 const columns=[];
 for(let j=0;j<=20;j++)columns.push(exponents.map(e=>e===j?-1:0));
 for(let a=0;a<=20+k;a++)columns.push(exponents.map(e=>e===k-a?1:0));
 const matrix=exponents.map((_,i)=>columns.map(c=>c[i]));const r=rank(matrix);
 const val=lab.compute("cech",{k}).numeric;equal(val.h0,columns.length-r);equal(val.h1,exponents.length-r);
 for(let j=-8;j<=8;j++){
  const extended=matrix.map((row,i)=>[...row,exponents[i]===j?1:0]);
  equal(lab.compute("cech",{k,j}).numeric.survives,rank(extended)>r);
 }
 equal(val.euler,k+1);
}

// Direct state overlaps with a nonconstant gauge; no analytic overlap shortcut.
for(const theta of [.1,.25,.5,.7,.9])for(const south of [0,1])for(const steps of [8,32,128]){
 const t=theta*Math.PI,states=Array.from({length:steps},(_,i)=>{const p=2*Math.PI*i/steps;return state(t,p,south*p);});
 const r=lab.compute("berry",{theta,south,steps}).numeric;
 near(wrap(loop(states)-r.discrete),0,2e-13);
 const gauged=states.map((u,i)=>u.map(z=>mul(phase(.43*Math.sin(i*1.7)+.17*i),z)));
 near(wrap(loop(gauged)-r.discrete),0,2e-13);
 near(r.error,wrap(r.discrete-r.exact),2e-13);
 if(steps===128)assert.ok(Math.abs(r.error)<.001);
}

// QGT from finite-difference derivatives, projection and complex inner products.
for(const theta of [.1,.3,.5,.85])for(const epsilon of [.05,.4,1,2]){
 const t=theta*Math.PI,p=.73,h=1e-5,u=state(t,p);
 const derivative=(a,b)=>a.map((x,i)=>scale(add(x,scale(b[i],-1)),1/(2*h)));
 const project=d=>{const along=inner(u,d);return d.map((x,i)=>add(x,scale(mul(u[i],along),-1)));};
 const dt=project(derivative(state(t+h,p),state(t-h,p))),dp=project(derivative(state(t,p+h),state(t,p-h)));
 const a=inner(dt,dt),b=inner(dp,dp),c=inner(dt,dp),r=lab.compute("metric",{theta,epsilon}).numeric;
 near(r.gtt,a[0]);near(r.gpp,b[0]);near(r.curvature,-2*c[1]);near(c[0],0);
 const overlap=inner(u,state(t,p+epsilon));near(r.exact,1-overlap[0]**2-overlap[1]**2,1e-12);
 near(r.det,a[0]*b[0]-c[0]*c[0]);near(r.bound,c[1]**2);
 assert.ok(r.approx>=r.exact-1e-12);checks++;
}

// Independent lattice Wilson plaquette tests catch a globally flipped curvature.
const qstate=(x,y,m)=>qwz.lowerEigenvector(x,y,m).map(z=>[z.re,z.im]);
for(const m of [-2.6,-1,.6,1.5,2.6])for(const [x,y] of [[.3,.7],[1.1,-.4],[-2,1.7]]){
 const h=1e-4,states=[[x-h,y-h],[x+h,y-h],[x+h,y+h],[x-h,y+h]].map(([a,b])=>qstate(a,b,m));
 near(loop(states)/(4*h*h),qwz.berryCurvature(x,y,m),3e-7);
}
function latticeChern(m,N){let sum=0;const h=2*Math.PI/N;for(let i=0;i<N;i++)for(let j=0;j<N;j++){
 const x=-Math.PI+i*h,y=-Math.PI+j*h;sum+=loop([[x,y],[x+h,y],[x+h,y+h],[x,y+h]].map(([a,b])=>qstate(a,b,m)));
}return sum/(2*Math.PI);}
for(const [m,c] of [[-2.6,0],[-1,1],[1,-1],[2.6,0]]){
 near(latticeChern(m,25),c,1e-10);near(qwz.chernNumber(m),c,1e-6);equal(qwz.qwzPhaseLabel(m),c);
 near(qwz.analyze({mass:m,ky:.7}).hallConductivity,-c,1e-6);
}
// Wilson slice derivative must equal minus the curvature integral.
for(const m of [-1,1]){const y=.7,h=.0001,N=2000,dx=2*Math.PI/N;let sum=0;
 for(let i=0;i<N;i++)sum+=qwz.berryCurvature(-Math.PI+(i+.5)*dx,y,m)*dx;
 const deriv=wrap(qwz.berryPhase(m,y+h,2048)-qwz.berryPhase(m,y-h,2048))/(2*h);near(deriv,-sum,2e-5);
}
for(const topic of lab.topics){const v=lab.defaults(topic);const key=Object.keys(v)[0];assert.throws(()=>lab.compute(topic,{[key]:NaN}));checks++;}
console.log(`geometry checks: PASS (${checks}; includes independent state overlaps, Cech ranks and lattice Chern integrals)`);
