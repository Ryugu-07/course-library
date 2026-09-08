"use strict";
// Course-route calculations: closed-form bubble integral, exact path perturbation,
// external-leg scaling, and fixed-channel limits independently check lesson numbers.
const assert=require('node:assert/strict');
const f=require('../course-shared/labs/research-foundations.js');
const ph=require('../course-shared/labs/research-physics.js');
const paths=require('../course-shared/labs/research-paths.js');
let checks=0;
const ok=(b,msg)=>{assert.ok(b,msg);checks++;};
const close=(a,b,tol=1e-10)=>ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const L=q=>q===0?0:2*Math.sqrt(4+q*q)/q*Math.asinh(q/2)-2;
const B=(q,q0)=>(L(q0)-L(q))/(16*Math.PI**2);
for(const q of [0,1,2,4])for(const q0 of [0,1,2]){
 close(f.compute('loop',{q,q0}).numeric.limit,B(q,q0),5e-9);
 for(const q1 of [0,1,3])close(B(q,q0),B(q,q1)+B(q1,q0));
}
const a=B(1,0),b=B(2,1),c=3;
close(a,-.000962834341182134,2e-16);close(b,-.0021584974552227,2e-16);
const expected=[2.991852237230e-7,3.740355575987e-8,4.675782144640e-9];
[.2,.1,.05].forEach((g,i)=>{
 const g1=g+c*g*g*a,F0=g+c*g*g*B(2,0),F1=g1+c*g1*g1*b;
 close(F1-F0,2*c*c*g**3*a*b+c**3*g**4*a*a*b,4e-17);
 close(F1-F0,expected[i],5e-17);
 const wrong=g+c*g*g*b;close(wrong-F0,-c*g*g*a,5e-17);
});
close(expected[0]/expected[1],8,0.003);close(expected[1]/expected[2],8,0.003);
// Q=Q0=0 leaves an elementary radial formula, so unmatched cutoffs can be
// checked without evaluating the lesson's parameter quadrature.
const radial=t=>(Math.log1p(t*t)-t*t/(1+t*t))/2;
for(const ratio of [.5,2,3]){
 const target=Math.log(ratio)/(8*Math.PI**2);
 const residuals=[100,1000,10000].map(t=>Math.abs((radial(ratio*t)-radial(t))/(8*Math.PI**2)-target));
 ok(residuals[2]<residuals[1]&&residuals[1]<residuals[0],'unmatched-cutoff convergence');
 ok(residuals[2]<4e-10,'unmatched-cutoff constant');
}
for(const [delta,raw,three] of [[.2,250,2],[.1,4000,4]]){
 close(f.compute('lsz',{lambda:.4,delta,legs:0}).numeric.value,raw,1e-11);
 close(f.compute('lsz',{lambda:.4,delta,legs:3}).numeric.value,three);
 close(f.compute('lsz',{lambda:.4,delta,legs:4}).numeric.value,.4);
}
for(const [Z,kernel,M] of [[.5,.4,-.1],[.8,.5,-.32],[.6,.5,-.18]])close(-(Math.sqrt(Z)**4)*kernel,M);
for(const contact of [0,2])for(const cosine of [-.5,.5]){
 const r=ph.compute('amplitude',{coupling:1,contact,cosine}).numeric;
 close(r.total,-13/3+contact);close(r.residue,1);close(r.s+r.t+r.u,0);
}
for(const contact of [-2,0,2]){
 const g3=1.2,t=-.7;
 const residue=s=>s*(g3*g3*(1/s+1/t+1/(-s-t))+contact);
 close(residue(1e-7),g3*g3,3e-7);
 // A fixed angle approaches all channels: this is deliberately not the residue.
 const s=1e-5,cos=.5,u=-s*(1+cos)/2,tt=-s*(1-cos)/2;
 close(s*g3*g3*(1/s+1/tt+1/u),-13*g3*g3/3);
}
const m=paths.compute('markov').numeric;
const kl=(P,R)=>P.reduce((s,p,i)=>s+(p===0?0:p*Math.log(p/R[i])),0);
const P=m.paths.map(x=>x.P),R=m.paths.map(x=>x.R),pi00=5/22;
close(P[0]+P[2],pi00);close(P[0]/pi00,.9);close(P[2]/pi00,.1);
for(const prob of [.1,.5,.8,.9]){
 const Q=P.slice();Q[0]=pi00*prob;Q[2]=pi00*(1-prob);
 for(let i=0;i<2;i++)for(let k=0;k<2;k++){
  const sum=Q.reduce((s,q,n)=>s+(m.paths[n].i===i&&m.paths[n].k===k?q:0),0);close(sum,m.pi[i][k]);
 }
 const cost=pi00*(prob*Math.log(prob/.9)+(1-prob)*Math.log((1-prob)/.1));
 close(kl(Q,R)-kl(P,R),cost);close(kl(Q,P),cost);
 if(prob===.5){close(cost,.1160967326740888,2e-15);close(kl(Q,R),.1697511688,5e-11);}
}
close(m.pathKL,m.endpointKL);close(m.pathKL,.0536544361,5e-11);

// The deferred Markov input is a hand calculation (r=1/3 is not a slider step).
const deferred=paths.compute('markov',{r:1/3,u:2/5,w:3/2}).numeric;
deferred.g1.forEach((x,i)=>close(x,[7/6,4/3][i]));
deferred.g0.forEach((x,i)=>close(x,[11/9,23/18][i]));close(deferred.marg[2][1],771/1265);
const exitKL=(5/22)*(.8*Math.log(8/9)+.2*Math.log(2));
close(exitKL,.01009159263,5e-12);close(m.pathKL+exitKL,.06374602878,5e-12);
const wick=require('../course-shared/labs/research-limits.js');
const small=wick.compute('wick',{N:2,s:.5}).numeric;
close(small.C,3/2);close(small.pointVariance,9/2);close(small.variance,5/4);close(small.difference,25/144);close(Math.sqrt(small.difference),5/12);
for(const [s,C,pv,V,D] of [[.5,3.380728993,22.858657051,1.584346533,.0298207294],[.25,6.663994608,88.817648277,3.380728993,.6777662022]]){
 const w=wick.compute('wick',{N:16,s}).numeric;
 [w.C,w.pointVariance,w.variance,w.difference].forEach((x,i)=>close(x,[C,pv,V,D][i],6e-10));
}
// Monotone integral comparison: independently bound the finite tail at s=3/8.
for(const N of [2,16,128]){
 let finite=0;for(let k=N+1;k<=100000;k++)finite+=1/(k*Math.sqrt(k));
 ok(finite<2/Math.sqrt(N),'integral tail upper bound');
 close(Math.sqrt(2/Math.sqrt(N)),Math.sqrt(2)/N**.25);
}
console.log(`coursework checks: PASS (${checks}; analytic bubble, scheme order, cutoff mismatch, LSZ, internal poles, conditional-path KL)`);
