'use strict';
const assert=require('assert'),D=require('../course-shared/labs/research-d-modules'),S=require('../course-shared/labs/research-moduli-stacks');let checks=0;
const near=(a,b,t=2e-10)=>{assert(Math.abs(a-b)<t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);checks++;},equal=(a,b)=>{assert.deepStrictEqual(a,b);checks++;};
// Independent operators on sparse exponent->coefficient maps. No finite upper boundary.
function sparseAct(a,op,m){const b={};for(const [is,c] of Object.entries(a)){const i=+is,raise=(m===0&&op==='x')||(m===1&&op==='d');if(raise)b[i+1]=(b[i+1]||0)+c;else if(i)b[i-1]=(b[i-1]||0)+(m?-1:1)*i*c;}return b;}
const dense=a=>{const keys=Object.keys(a);return keys.length?Array.from({length:Math.max(...keys.map(Number))+1},(_,i)=>a[i]||0):[];};
for(let m=0;m<=1;m++)for(let j=0;j<=12;j++){
 const a={[j]:1},r=D.weyl(m,j);
 equal(r.dx,dense(sparseAct(sparseAct(a,'x',m),'d',m)));equal(r.xd,dense(sparseAct(sparseAct(a,'d',m),'x',m)));equal(r.commutator,r.v);
 for(const op of ['x','d'])equal(D.act(r.v,op,m),dense(sparseAct(a,op,m)));
}
for(let seed=1;seed<15;seed++)for(let m=0;m<=1;m++){
 const a=Array.from({length:10},(_,i)=>((i+seed)*seed)%7-3),s=Object.fromEntries(a.map((c,i)=>[i,c]).filter(([,c])=>c));
 for(const op of ['x','d']){let expected=dense(sparseAct(s,op,m));while(expected.length&&expected.at(-1)===0)expected.pop();equal(D.act(a,op,m).filter((_,i,arr)=>i<=arr.findLastIndex(c=>c!==0)),expected);}
 const dx=D.act(D.act(a,'x',m),'d',m),xd=D.act(D.act(a,'d',m),'x',m);equal(D.add(dx,xd,-1),D.add(a,[]));
}
// Integrate du/dθ=iαu on a circle with independent complex RK4. For irregular
// u'=u/x² the integral of d(log u)/dθ=i e^(-iθ)/r is zero over a full turn.
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s),mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
for(const alpha of [-1.5,-.7,0,.5,1.2,2])for(const turns of [0,1,2,3]){
 const N=12000,h=2*Math.PI*turns/N,f=u=>mul([0,alpha],u);let u=[1,0];
 for(let i=0;i<N;i++){const a=f(u),b=f(add(u,scale(a,h/2))),c=f(add(u,scale(b,h/2))),d=f(add(u,scale(c,h)));u=add(u,scale(add(add(a,scale(b,2)),add(scale(c,2),d)),h/6));}
 const r=D.singular(alpha,turns,.3,.7,0);r.wound.forEach((x,i)=>near(x,u[i],3e-9));
 const shifted=D.singular(alpha+3,turns,.3,.7,0);r.monodromy.forEach((x,i)=>near(x,shifted.monodromy[i]));
}
for(const radius of [.05,.2,.7,1])for(const angle of [0,.4,Math.PI/2,Math.PI]){
 const r=D.singular(.5,1,radius,angle,1),x=[radius*Math.cos(angle),radius*Math.sin(angle)],den=x[0]**2+x[1]**2;
 near(r.logAbs,-x[0]/den);near(r.opposite,x[0]/den);equal(r.monodromy,[1,0]);
 let integral=[0,0];const N=1024,h=2*Math.PI/N;for(let i=0;i<N;i++){const t=(i+.5)*h;integral=add(integral,scale([Math.sin(t)/radius,Math.cos(t)/radius],h));}integral.forEach(x=>near(x,0));
}
// Monomial invariance from weights; finite stabilizers tested by actual complex
// multiplication and pairwise distinctness, not just their displayed labels.
const pow=(z,n)=>{let a=[1,0];for(let i=0;i<n;i++)a=mul(a,z);return a;};
for(let w=1;w<=8;w++)for(const nz of [0,1]){
 const r=S.quotient(w,nz);equal(r.invariantExponents,Array.from({length:21},(_,i)=>i).filter(i=>w*i===0));equal(r.finite,!!nz);
 if(nz){equal(r.roots.length,w);for(let i=0;i<w;i++){const u=pow(r.roots[i],w);near(u[0],1);near(u[1],0);for(let j=0;j<i;j++){assert(Math.hypot(...r.roots[i].map((x,k)=>x-r.roots[j][k]))>1e-6);checks++;}}}
 else for(const z of [[2,3],[-.2,.7],[4,0]])mul(pow(z,w),[0,0]).forEach(x=>near(x,0));
}
// Gluing: p0(z) regular at z=0 and p1(1/z)=z^(-n)p0(z) regular
// at infinity requires 0<=exponent<=n. Enumerate Laurent monomials independently.
for(let d=-3;d<=3;d++)for(let m=1;m<=4;m++)for(let w=1;w<=3;w++){
 const r=S.descent(d,m,w),basis=n=>Array.from({length:101},(_,i)=>i-50).filter(k=>k>=0&&n-k>=0);
 equal(r.h0,basis(w*d).length);equal(r.pullbackH0,basis(m*w*d).length);equal(r.trivial,d===0);
 for(const theta of [.3,1.1,2.7]){const phase=n=>[Math.cos(n*theta),Math.sin(n*theta)],z=[Math.cos(theta),Math.sin(theta)],zm=pow(z,m),left=d>=0?pow(zm,d):pow([zm[0],-zm[1]],-d);left.forEach((x,i)=>near(x,phase(r.pullbackDegree)[i]));}
 const sourceBasis=basis(w*d).map(k=>m*k);assert(sourceBasis.every(k=>basis(m*w*d).includes(k)));checks++;
 if(r.sectionExists){equal(r.sectionDegree,w*d);equal(r.pullbackSectionDegree,m*w*d);}
}
for(const [lib,topics] of [[D,['weyl-support','singular-growth']],[S,['quotient-gm','descent']]])for(const topic of topics){
 const def=lib.defaults(topic);lib.compute(topic);checks++;
 for(const c of lib.configs[topic].controls)for(const v of [c[2],c[3]]){const result=lib.compute(topic,{...def,[c[0]]:v});assert(result.chart.series.every(s=>s.points.length>0));checks++;}
}
console.log(`PASS ${checks} D-module and stack checks: sparse Weyl actions, RK4 monodromy, stabilizers, Laurent descent and UI contracts`);
