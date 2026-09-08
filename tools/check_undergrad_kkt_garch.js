'use strict';
// Independent threshold projection, finite-state innovation expectations and
// exhaustive bounded resource allocations; no calls to the labs' self-tests.
const assert=require('assert');
const k=require('../course-shared/labs/kkt-active-set');
const g=require('../course-shared/labs/garch-volatility');
const lp=require('../course-shared/labs/lp-dp-certificates');
let checks=0;
function near(a,b,tol=2e-10){checks++;assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);}
function check(x,msg){checks++;assert(x,msg);}
// Projection via scalar dual threshold, independent of edge enumeration.
function projection(a,b,R){let lo=0,hi=Math.max(0,a,b);if(Math.max(0,a)+Math.max(0,b)<=R)return [Math.max(0,a),Math.max(0,b)];for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(Math.max(0,a-mid)+Math.max(0,b-mid)>R)lo=mid;else hi=mid;}return [Math.max(0,a-hi),Math.max(0,b-hi)];}
for(let ai=-15;ai<=65;ai+=2)for(let bi=-15;bi<=65;bi+=2)for(const R of [1,1.3,2,3,4.7,6]){
 const a=ai/10,b=bi/10,s=k.solve(a,b,R),ref=projection(a,b,R);
 near(s.point.x,ref[0]);near(s.point.y,ref[1]);near(s.stationarityResidual,0);near(s.complementaryResidual,0);check(s.okay,'KKT residual');
 // Projection variational inequality at all triangle vertices.
 for(const z of [[0,0],[R,0],[0,R]])check((a-s.point.x)*(z[0]-s.point.x)+(b-s.point.y)*(z[1]-s.point.y)<=1e-10,'normal cone orientation');
}
for(const d of [1e-8,1e-10,1e-12]){const s=k.solve(-d,.5,3);near(s.point.x,0,1e-14);near(s.lambda.x,d,1e-14);}
const touching=k.solve(1.2,1.8,3);check(touching.active[2]&&touching.lambda.R===0,'active constraint at zero price');
// A weighted quadratic migration: independently solve the equality constrained
// linear system and verify feasible perturbations raise the objective.
const x=1.8,y=1.2;near(4*(x-2),y-2);near(.5*(4*(x-2)**2+(y-2)**2),.4);
for(const d of [-.3,-.1,.1,.3])check(.5*(4*(x+d-2)**2+(y-d-2)**2)>.4,'weighted minimum');
near(.4-.4*(4-3.01)**2,.00796);
// GARCH forecasts as a finite tree with E epsilon²=1: epsilon=0 or sqrt(2),
// each with probability 1/2. Average all 2^h future variance states.
for(const alpha of [0,.08,.2,.35])for(const beta of [0,.5,.9,1,1.05])for(const omega of [1e-6,1e-5,.0001]){
 const c={alpha,beta,omega},v=.00013,r=-.037,F=g.forecastVariance(c,v,r,8);
 let states=[omega+alpha*r*r+beta*v];
 for(let h=0;h<8;h++){
   near(F[h],states.reduce((a,b)=>a+b,0)/states.length,1e-13);
   states=states.flatMap(w=>[omega+beta*w,omega+(2*alpha+beta)*w]);
 }
 const data=g.simulate(c),cf=data.config;
 for(let i=1;i<data.variances.length;i++)near(data.variances[i],cf.omega+cf.alpha*data.returns[i-1]**2+cf.beta*data.variances[i-1],1e-12);
 data.responseIncrement.forEach((v,i)=>near(v,data.response[i]-data.responseBaseline[i],1e-12));
 const hist=g.innovationHistogram(data);check(hist.total===179,'injected return excluded');check(hist.counts.reduce((a,b)=>a+b,0)+hist.under+hist.over===179,'all histogram observations accounted for');
}
const levels=g.forecastVariance({omega:1e-5,alpha:.08,beta:.9},.0001,-.03,3);near(levels[0],.000172,1e-14);check(levels[1]>levels[0],'low variance returns upward');
for(const i of [0,10,20,30])check(g.format(i,0)===String(i),'integer zero preservation');
const hist=g.innovationHistogram({config:{shockIndex:2},innovations:[-5,-4,100,4,5,0]});check(hist.under===1&&hist.over===1&&hist.counts[0]===1&&hist.counts[15]===1&&hist.total===5,'histogram endpoints and external tails');
// LP reference: each integer y fixes the maximal allowable x. Continuous
// objective is piecewise linear in y; check all breakpoints and endpoints.
for(let a=2;a<=8;a++)for(let b=8;b<=20;b++)for(let c=12;c<=30;c++){
 const q={a,b,c};let best=0;
 for(let y=0;y<=Math.min(b/2,c/2);y++)best=Math.max(best,5*y+3*Math.min(a,Math.floor((c-2*y)/3)));
 near(lp.solveDynamic(q).value,best);near(lp.solveInteger(q).value,best);
 const ys=[0,Math.min(b/2,c/2),Math.max(0,Math.min(b/2,c/2,(c-3*a)/2))];
 const continuous=Math.max(...ys.map(y=>5*y+3*Math.min(a,(c-2*y)/3)));
 near(lp.solvePrimal(q).value,continuous);near(lp.solveDual(q).value,continuous);
}
console.log(`undergrad KKT/GARCH/LP independent checks: ${checks} PASS`);
