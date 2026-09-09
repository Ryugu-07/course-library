'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/sampling-estimators.js')),ref=require('./fixtures/sampling-reference.json');let checks=0,maxDensityRelative=0;
function ok(v,msg){checks++;assert(v,msg);}function near(a,b,t=2e-10){ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length,var0=a=>a.reduce((s,x)=>s+(x-avg(a))**2,0)/a.length;
for(const modelId of ['normal','skewed','clustered','heavy'])for(const estimator of ['mean','variance'])for(const n of [5,20,55,100]){
 const p={modelId,estimator,n,repetitions:240,bootstrap:240},e=m.compute(p),small=m.compute({...p,repetitions:40,bootstrap:40});
 ok(JSON.stringify(e.values.slice(0,40))===JSON.stringify(small.values),'R prefix');ok(JSON.stringify(e.bootstrapValues.slice(0,40))===JSON.stringify(small.bootstrapValues),'B prefix');ok(JSON.stringify(e.observed)===JSON.stringify(small.observed),'observed fixed');
 near(e.samplingMean,avg(e.values));near(e.samplingVariance,var0(e.values));near(e.bootstrapSE,Math.sqrt(var0(e.bootstrapValues)*240/239));
 if(e.target!==null){near(e.bias,avg(e.values)-e.target);near(e.mse,avg(e.values.map(v=>(v-e.target)**2)));}
 const bt=m.bootstrapTheory(e.observed,estimator),mu=avg(e.observed),m2=avg(e.observed.map(v=>(v-mu)**2)),m4=avg(e.observed.map(v=>(v-mu)**4));near(bt.mean,estimator==='mean'?mu:m2);near(bt.variance,estimator==='mean'?m2/n:(m4-(n-3)/(n-1)*m2*m2)/n);
 if(modelId==='heavy'){ok(e.theory.variance===Infinity,'ideal tail variance');if(estimator==='mean'){ok(e.theory.bias===0&&e.theory.mse===Infinity,'finite mean infinite MSE');ok(e.consistency.includes('强LLN'),'finite mean still LLN');}}
 if(modelId==='clustered'){near(e.theory.mean,estimator==='mean'?0:1);near(e.theory.variance,estimator==='mean'?1+1/n:2/(n-1));near(e.theory.bias,estimator==='mean'?0:-1);}
}
// Enumerate every resample, independent of the fourth-moment implementation.
for(const values of [[-1,2],[0,1,4],[-2,0,3,7]])for(const estimator of ['mean','variance']){
 const results=[];function rec(a){if(a.length===values.length){const mu=avg(a);results.push(estimator==='mean'?mu:a.reduce((s,x)=>s+(x-mu)**2,0)/(a.length-1));return;}for(const x of values)rec(a.concat(x));}rec([]);
 const exact=m.bootstrapTheory(values,estimator);near(exact.mean,avg(results));near(exact.variance,var0(results));
}
near(m.sampleMean([1e308,1e308]),1e308);near(m.sampleVariance([1e308,1e308]),0);near(m.sampleVariance([1e9,1e9+1,1e9+2]),1);
for(const bad of [[],[1],[NaN,1],[Infinity,2],['1',2]]){checks++;assert.throws(()=>m.sampleVariance(bad));}
for(const bad of [null,[],{n:0},{n:4},{n:101},{n:'20'},{n:5.5},{modelId:'unknown'},{estimator:'typo'},{bootstrap:39},{repetitions:241},{repetitions:false}]){checks++;assert.throws(()=>m.compute(bad));}
for(const v of [-.1,1,NaN]){checks++;assert.throws(()=>m.sampleReplicate('normal',5,()=>v));}
ok(m.sampleReplicate('heavy',5,()=>0).every(x=>x===1),'inverse CDF includes lower support without clipping');
for(const row of ref.rows){const d=m.compute({modelId:row.model,estimator:row.estimator,n:row.n,repetitions:40,bootstrap:40});for(let i=0;i<row.x.length;i++){const v=m.densityAt(d,row.x[i]),rel=Math.abs(v/row.pdf[i]-1);maxDensityRelative=Math.max(maxDensityRelative,rel);ok(rel<2e-11,'exact sampling PDF against SciPy');}}
// Replicate population sampling directly; no reliance on the compute fixture.
for(const modelId of ['normal','skewed','clustered']){const rng=m.rngFrom(99173),means=[],variances=[];for(let i=0;i<20000;i++){const a=m.sampleReplicate(modelId,20,rng);means.push(avg(a));variances.push(var0(a)*20/19);}const tm=m.theory(modelId,'mean',20),tv=m.theory(modelId,'variance',20);near(avg(means),tm.mean,.06);near(var0(means),tm.variance,.04);near(avg(variances),tv.mean,.04);near(var0(variances),tv.variance,.1);}
class Node{constructor(tag,doc){this.tag=tag;this.nodeType=1;this.ownerDocument=doc;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n;}}
const doc={createElementNS(ns,t){return new Node(t,this)},createTextNode(t){return{nodeType:3,text:t}}};const points=d=>[...d.matchAll(/[ML]([-\d.e]+),([-\d.e]+)/g)].map(x=>[+x[1],+x[2]]);
for(const modelId of ['normal','skewed','clustered','heavy'])for(const estimator of ['mean','variance'])for(const n of [5,20,100]){
 const e=m.compute({modelId,estimator,n,repetitions:80,bootstrap:120}),svg=m.drawSvg(doc,e,'test'),ns=svg.children,all=e.values.concat(e.bootstrapValues,m.statistic(e.observed,estimator));if(e.target!==null)all.push(e.target);let min=Math.min(...all),max=Math.max(...all),pad=(max-min)*.04||1;min-=pad;max+=pad;if(estimator==='variance')min=Math.max(0,min);const bw=(max-min)/24;
 const rc=Array(24).fill(0),bc=Array(24).fill(0);e.values.forEach(v=>rc[Math.min(23,Math.floor((v-min)/bw))]++);e.bootstrapValues.forEach(v=>bc[Math.min(23,Math.floor((v-min)/bw))]++);
 const theory=Array.from({length:401},(_,i)=>m.densityAt(e,min+(max-min)*i/400)).filter(x=>x!==null),yMax=Math.max(...rc.map(c=>c/(80*bw)),...bc.map(c=>c/(120*bw)),...theory)*1.13;
 const bars=ns.filter(n=>n.tag==='rect');ok(bars.length===24,'all bins');let mass=0;for(let j=0;j<24;j++){const a=bars[j].attrs;near(+a.x,70+j*650/24);near(+a.width,650/24);const density=(380-(+a.y))*yMax/270;near(density,rc[j]/(80*bw));mass+=density*bw;}near(mass,1);
 const bp=ns.find(n=>n.attrs&&Object.hasOwn(n.attrs,'data-bootstrap')),ps=points(bp.attrs.d);ok(ps.length===48,'bootstrap step points');for(let j=0;j<24;j++){near(ps[2*j][0],70+j*650/24,.0001);near(ps[2*j][1],380-bc[j]/(120*bw)/yMax*270,.0001);}
 for(const n of ns.filter(n=>n.tag==='path'))for(const[x,y]of points(n.attrs.d))ok(x>=69.99&&x<=720.01&&y>=109.99&&y<=380.01,'SVG contains all curves without clipping');
 const target=ns.find(n=>n.attrs&&n.attrs.class==='se-target');ok((e.target!==null)===!!target,'target is never silently omitted');if(target)near(+target.attrs.x1,70+(e.target-min)/(max-min)*650);
}
const svg=fs.readFileSync(path.join(root,'math-course/images/stat-01-sampling-dists.svg'),'utf8');
for(const f of ref.figures){const tag=svg.match(new RegExp('<path[^>]*data-curve="'+f.id+'"[^>]*/>'))[0],ps=points(tag.match(/d="([^"]+)"/)[1]);ok(ps.length===601,'static resolution');for(let i=0;i<ps.length;i++){near(ps[i][0],60+350*f.panel+285*i/600,1e-9);near(ps[i][1],440-300*f.pdf[i]/f.ymax,2e-9);}}
near(ref.chiTail,.03414362165714,1e-13);console.log('sampling estimators independent: PASS',{checks,maxDensityRelative});
