'use strict';
const assert=require('node:assert/strict');
const mt=require('../course-shared/labs/moments-tail.js'),dm=require('../course-shared/labs/distribution-map.js'),ht=require('../course-shared/labs/hypothesis-testing.js'),rd=require('../course-shared/labs/regression-diagnostics.js'),bayes=require('../course-shared/labs/bayes.js');
let checks=0;
function check(value,msg){checks++;assert.ok(value,msg);}
function close(x,y,tol=1e-10,msg='comparison'){check(Number.isFinite(x)&&Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),msg+`: ${x} vs ${y}`);}
// Enumerate the actual atoms, independently of the experiment's branches.
for(const variant of ['rademacher','spike']){
 const atoms=variant==='spike'?[[0,.8],[-Math.sqrt(5),.1],[Math.sqrt(5),.1]]:[[-1,.5],[1,.5]];
 const moment=k=>atoms.reduce((s,[x,p])=>s+p*x**k,0);
 for(let k=1;k<=4;k++)close(mt.rawMoment('matched',k,variant),moment(k));
 for(const a of [...Array.from({length:97},(_,i)=>.2+.05*i),1,1-1e-12,1+1e-12,Math.sqrt(5),Math.sqrt(5)-1e-12,Math.sqrt(5)+1e-12]){
  const expected=atoms.reduce((s,[x,p])=>s+(Math.abs(x)>=a?p:0),0),v=mt.evaluate({modelId:'matched',variant,threshold:a,order:2,t:0});
  close(v.markovExact,expected);close(v.chebyshevExact,expected);check(expected<=v.markovBound+1e-12,'Markov certificate');check(expected<=v.chebyshevBound+1e-12,'Chebyshev certificate');
 }
 for(let i=-30;i<=30;i++){let t=i/20;close(mt.mgfValue('matched',t,variant),atoms.reduce((s,[x,p])=>s+p*Math.exp(t*x),0));}
}
// Integrate continuous densities after changing the infinite tail to log x.
function simpson(f,a,b,n=12000){let s=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
for(const id of ['uniform','exponential','pareto'])for(const a of [.2,.5,1,1.5,2,3,5]){
 const expected=id==='uniform'?Math.max(0,1-a/2):id==='exponential'?Math.exp(-a):Math.exp(-2.5*Math.log(Math.max(1,a)));
 close(mt.markovTail(id,a),expected);check(expected<=mt.markovBound(id,a)+1e-12,'continuous Markov');
 const mu=id==='pareto'?5/3:1,cdf=x=>id==='uniform'?Math.max(0,Math.min(1,x/2)):id==='exponential'?(x<=0?0:-Math.expm1(-x)):(x<1?0:-Math.expm1(-2.5*Math.log(x)));
 close(mt.centralTail(id,a),cdf(mu-a)+1-cdf(mu+a));check(mt.centralTail(id,a)<=mt.chebyshevBound(id,a)+1e-12,'continuous Chebyshev');
}
for(const t of [-1.5,-1,-.5,-.1,-.05])close(mt.mgfValue('pareto',t),simpson(u=>2.5*Math.exp(-2.5*u+t*Math.exp(u)),0,20),1e-9,'Pareto alternate integral');
// Interval membership is exact: an epsilon neighbourhood is not an atom.
const models={discrete:{atoms:[[0,.2],[1,.5],[2,.3]],ac:x=>0},mixture:{atoms:[[.4,.3]],ac:x=>.7*Math.max(0,Math.min(1,x))},uniform:{atoms:[],ac:x=>Math.max(0,Math.min(1,x))},square:{atoms:[],ac:x=>Math.sqrt(Math.max(0,Math.min(1,x)))}};
for(const [id,m] of Object.entries(models)){
 const F=x=>m.ac(x)+m.atoms.reduce((s,[v,p])=>s+(v<=x?p:0),0);
 const xs=Array.from({length:31},(_,i)=>-.5+i/10).concat(m.atoms.flatMap(([x])=>[x-1e-12,x,x+1e-12]));
 for(const x of xs){close(dm.cdf(id,x),F(x));close(dm.atomMass(id,x),m.atoms.reduce((s,[v,p])=>s+(v===x?p:0),0));}
 for(let i=0;i<xs.length;i++)for(let j=i;j<xs.length;j++){
  let [a,b]=[xs[i],xs[j]].sort((a,b)=>a-b);close(dm.intervalProbability(id,a,b),F(b)-F(a),1e-12,'interval actual mass');
 }
 for(let i=1;i<100;i++){let p=i/100,q=dm.quantile(id,p);check(F(q)>=p-2e-15,'quantile reaches p');check(F(q-1e-8)<p+2e-15,'quantile first reaching point');}
}
check(dm.quantile('discrete',.2+1e-12)===1,'quantile must cross jump');check(dm.atomMass('mixture',.4-1e-12)===0,'near atom is not atom');
// Bayes checked by enumerated joint probabilities, including impossible evidence.
for(const prevalence of [0,.1,1,10,50,100])for(const sensitivity of [0,50,99,100])for(const specificity of [0,50,95,99.9,100]){
 let a=prevalence/100,s=sensitivity/100,c=specificity/100,r=bayes.calculate({prevalence,sensitivity,specificity});
 let joint=[a*s,a*(1-s),(1-a)*(1-c),(1-a)*c];
 ['tp','fn','fp','tn'].forEach((key,i)=>close(r[key],joint[i]*10000));close(r.tp+r.fn+r.fp+r.tn,10000);
 let pos=joint[0]+joint[2],neg=joint[1]+joint[3];if(pos)close(r.ppv,joint[0]/pos);else check(Number.isNaN(r.ppv),'undefined positive posterior');if(neg)close(r.npv,joint[3]/neg);else check(Number.isNaN(r.npv),'undefined negative posterior');
}
// Modified Gram-Schmidt fit; compare Cook formula with actual leave-one-out fits.
function fit(points){let n=points.length,q0=Array(n).fill(1/Math.sqrt(n)),v=points.map(p=>p.x),r01=v.reduce((s,x,i)=>s+x*q0[i],0);v=v.map((x,i)=>x-r01*q0[i]);let r11=Math.hypot(...v),q1=v.map(x=>x/r11);let b1=q1.reduce((s,x,i)=>s+x*points[i].y,0)/r11,b0=(q0.reduce((s,x,i)=>s+x*points[i].y,0)-r01*b1)/Math.sqrt(n);return points.map(p=>b0+b1*p.x);}
for(const scale of [1,1e-8,100])for(const xstar of [1,5,13,20])for(const ystar of [-5,18,40]){
 let points=Array.from({length:8},(_,i)=>({x:i+1,y:scale*(2+i+.2*Math.sin(i*2))}));points.push({x:xstar,y:ystar*scale});let r=rd.analyze(points),pred=fit(points),sse=points.reduce((s,p,i)=>s+(p.y-pred[i])**2,0);
 close(r.sse,sse,1e-9);close(r.rows.reduce((s,p)=>s+p.leverage,0),2);
 r.rows.forEach((row,i)=>{close(row.fitted,pred[i],1e-9);const deleted=points.filter((_,j)=>j!==i),df=fit(deleted);let db1=(df[1]-df[0])/(deleted[1].x-deleted[0].x),db0=df[0]-db1*deleted[0].x;let diff=points.reduce((s,p,j)=>s+(pred[j]-(db0+db1*p.x))**2,0)/(2*sse/(points.length-2));close(row.cooks,diff,2e-8,'actual deletion Cook');});
}
let constant=rd.analyze([{x:0,y:7},{x:1,y:7},{x:2,y:7}]);check(Number.isNaN(constant.r2),'constant response R2 undefined');check(constant.rows.every(r=>r.cooks===null),'zero variance Cook undefined');check(constant.maxInfluence===null,'no fabricated maximum');
let high=rd.analyze([{x:0,y:0},{x:0,y:1},{x:1,y:2}]);check(high.rows[2].cooks===null,'unit leverage undefined');
let strings=rd.analyze([{x:'0',y:'1'},{x:'1',y:'2'},{x:'2',y:'4'}]);close(strings.slope,1.5);
// erfc references generated from Python's independent system libm below.
const tails=[[-10.0, 1.0], [-9.75, 1.0], [-9.5, 1.0], [-9.25, 1.0], [-9.0, 1.0], [-8.75, 1.0], [-8.5, 1.0], [-8.25, 0.9999999999999999], [-8.0, 0.9999999999999993], [-7.75, 0.9999999999999954], [-7.5, 0.9999999999999681], [-7.25, 0.9999999999997916], [-7.0, 0.9999999999987201], [-6.75, 0.9999999999926077], [-6.5, 0.99999999995984], [-6.25, 0.9999999997947736], [-6.0, 0.9999999990134123], [-5.75, 0.9999999955378276], [-5.5, 0.9999999810104375], [-5.25, 0.9999999239503948], [-5.0, 0.9999997133484281], [-4.75, 0.9999989829167575], [-4.5, 0.9999966023268753], [-4.25, 0.9999893114742251], [-4.0, 0.9999683287581669], [-3.75, 0.9999115827147992], [-3.5, 0.9997673709209645], [-3.25, 0.9994229749576092], [-3.0, 0.9986501019683699], [-2.75, 0.9970202367649454], [-2.5, 0.9937903346742238], [-2.25, 0.9877755273449553], [-2.0, 0.9772498680518208], [-1.75, 0.9599408431361829], [-1.5, 0.9331927987311419], [-1.25, 0.8943502263331448], [-1.0, 0.8413447460685429], [-0.75, 0.7733726476231317], [-0.5, 0.691462461274013], [-0.25, 0.5987063256829237], [0.0, 0.5], [0.25, 0.4012936743170763], [0.5, 0.30853753872598694], [0.75, 0.2266273523768682], [1.0, 0.15865525393145705], [1.25, 0.10564977366685528], [1.5, 0.06680720126885809], [1.75, 0.04005915686381708], [2.0, 0.022750131948179216], [2.25, 0.012224472655044704], [2.5, 0.0062096653257761375], [2.75, 0.002979763235054556], [3.0, 0.0013498980316300957], [3.25, 0.0005770250423907672], [3.5, 0.00023262907903552502], [3.75, 8.841728520080404e-05], [4.0, 3.167124183311996e-05], [4.25, 1.0688525774934427e-05], [4.5, 3.3976731247300615e-06], [4.75, 1.0170832425687063e-06], [5.0, 2.866515718791945e-07], [5.25, 7.604960516488729e-08], [5.5, 1.8989562465887738e-08], [5.75, 4.462172453901613e-09], [6.0, 9.865876450377014e-10], [6.25, 2.0522634252189523e-10], [6.5, 4.016000583859125e-11], [6.75, 7.392257778017864e-12], [7.0, 1.2798125438858348e-12], [7.25, 2.0838581586720775e-13], [7.5, 3.1908916729109203e-14], [7.75, 4.594627435778603e-15], [8.0, 6.22096057427182e-16], [8.25, 7.919726314642473e-17], [8.5, 9.479534822203356e-18], [8.75, 1.0667637375474945e-18], [9.0, 1.1285884059538425e-19], [9.25, 1.1224633591328053e-20], [9.5, 1.0494515075362721e-21], [9.75, 9.223413524939454e-23], [10.0, 7.619853024160593e-24]];
for(const [z,sf] of tails){close(ht.normalSF(z),sf,8e-8,'independent erfc tail');if(z>=8)check(ht.normalSF(z)>0,'small tail not lost to subtraction');}
for(const n of [4,16,80,400,10000])for(const mean of [-.5,-.05,0,.05,.5])for(const alpha of [.01,.05,.1])for(const tests of [1,20,100]){
 const r=ht.analyze({n,mean,alpha,sesoi:.2,tests});close(r.z,Math.sqrt(n)*mean);check(r.reject===!(r.ci[0]<=0&&r.ci[1]>=0),'CI duality');close(r.expectedFalse,tests*alpha);close(r.fwerIndependent,-Math.expm1(tests*Math.log1p(-alpha)));check(r.bonferroniReject=== (r.p<alpha/tests),'family decision');
}
const powers=[[4, 0.01, 0, 0.010000000000000026], [4, 0.01, 0.05, 0.010373585745454739], [4, 0.01, 0.2, 0.01624500058900239], [4, 0.01, 0.4, 0.038248495923559195], [4, 0.05, 0, 0.05000000000000011], [4, 0.05, 0.05, 0.051146302810810715], [4, 0.05, 0.2, 0.06852255087843459], [4, 0.05, 0.4, 0.1259221216228631], [4, 0.1, 0, 0.10000000000000028], [4, 0.1, 0.05, 0.10169601182284943], [4, 0.1, 0.2, 0.1270274252115898], [4, 0.1, 0.4, 0.2063418313607106], [16, 0.01, 0, 0.010000000000000026], [16, 0.01, 0.05, 0.011507835783568355], [16, 0.01, 0.2, 0.038248495923559195], [16, 0.01, 0.4, 0.1645893754476175], [16, 0.05, 0, 0.05000000000000011], [16, 0.05, 0.05, 0.0545946855272755], [16, 0.05, 0.2, 0.1259221216228631], [16, 0.05, 0.4, 0.3596224862612038], [16, 0.1, 0, 0.10000000000000028], [16, 0.1, 0.05, 0.10677891910577518], [16, 0.1, 0.2, 0.2063418313607106], [16, 0.1, 0.4, 0.4826995450229362], [80, 0.01, 0, 0.010000000000000026], [80, 0.01, 0.05, 0.01789426774297104], [80, 0.01, 0.2, 0.2156546388396988], [80, 0.01, 0.4, 0.8417990934893809], [80, 0.05, 0, 0.05000000000000011], [80, 0.05, 0.05, 0.07320971273248608], [80, 0.05, 0.2, 0.432157627594563], [80, 0.05, 0.4, 0.9471412096731693], [80, 0.1, 0, 0.10000000000000028], [80, 0.1, 0.05, 0.13374484367631975], [80, 0.1, 0.2, 0.5575477558874606], [80, 0.1, 0.4, 0.9733730653239715], [400, 0.01, 0, 0.010000000000000026], [400, 0.01, 0.05, 0.05770713327902796], [400, 0.01, 0.2, 0.9228014673372622], [400, 0.01, 0.4, 0.9999999708878891], [400, 0.05, 0, 0.05000000000000011], [400, 0.05, 0.05, 0.1700750457530877], [400, 0.05, 0.2, 0.9793266319025757], [400, 0.05, 0.4, 0.9999999992296008], [400, 0.1, 0, 0.10000000000000028], [400, 0.1, 0.05, 0.2635973359014777], [400, 0.1, 0.2, 0.9907423028925967], [400, 0.1, 0.4, 0.9999999998958858], [10000, 0.01, 0, 0.010000000000000026], [10000, 0.01, 0.05, 0.9923283041738541], [10000, 0.01, 0.2, 1.0], [10000, 0.01, 0.4, 1.0], [10000, 0.05, 0, 0.05000000000000011], [10000, 0.05, 0.05, 0.9988172507035044], [10000, 0.05, 0.2, 1.0], [10000, 0.05, 0.4, 1.0], [10000, 0.1, 0, 0.10000000000000028], [10000, 0.1, 0.05, 0.9996033850106497], [10000, 0.1, 0.2, 1.0], [10000, 0.1, 0.4, 1.0]];
for(const [n,alpha,d,power] of powers)close(ht.testPower(n,alpha,d),power,2e-6,"independent design power");
console.log('Probability and diagnostics independent checks: PASS ('+checks+' checks)');
