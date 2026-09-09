'use strict';const assert=require('assert'),fs=require('fs'),path=require('path'),m=require('../course-shared/labs/nucleosynthesis-network.js');let checks=0;
function check(v,msg){assert(v,msg);checks++;}function near(a,b,t=3e-13){check(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} vs ${b}`);}
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1;this.ownerDocument=doc;}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n;}}
const doc={createElementNS:(ns,t)=>new Node(t),createTextNode:t=>({nodeType:3,text:t})};
function points(d){let v=d.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);return Array.from({length:v.length/2},(_,i)=>[v[i*2],v[i*2+1]]);}
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/nucleosynthesis-reference.json')));let maxError=0,maxTerms=0;
for(const row of fixture.rows){let prev=Infinity;for(const substeps of [1,2,4,8]){
 const result=m.simulate({...row.params,substeps});
 m.SPECIES.forEach((sp,i)=>{near(result.reference[sp.id],row.reference[i]);maxError=Math.max(maxError,Math.abs(result.reference[sp.id]-row.reference[i]));});
 check(result.splittingError<prev,'subdivision reduces error on fixture');prev=result.splittingError;
 near(result.abundance.H,.72*Math.exp(-.5*result.history.reduce((s,p)=>s+.012*p.theta**4,0)));
 check(result.referenceTailBound<=row.params.steps*1e-15,'truncation budget');maxTerms=Math.max(maxTerms,result.maxTerms);
 for(const pt of result.history){near(pt.total,1);for(let j=0;j<6;j++){const sp=m.SPECIES[j].id;near(pt.abundance[sp]-pt.before[sp],(j?pt.fluxes[j-1].amount:0)-(j<5?pt.fluxes[j].amount:0));}for(const sp of m.SPECIES){check(pt.abundance[sp.id]>=0&&pt.abundance[sp.id]<=1,'positive split');check(pt.reference[sp.id]>=0&&pt.reference[sp.id]<=1,'positive reference');}}
 const svg=m.drawChart(doc,result);for(const node of svg.children.filter(n=>n.tag==='path')){let ps=points(node.attrs.d);check(ps.length===row.params.steps+1,'initial point included');let id=node.attrs['data-species'],method=node.attrs['data-method'];for(let j=0;j<ps.length;j++){check(Math.abs(ps[j][0]-(52+j/row.params.steps*650))<=.00501,"x coordinate");const val=j===0?result.initial[id]:(method==='split'?result.history[j-1].abundance[id]:result.history[j-1].reference[id]);check(Math.abs(ps[j][1]-(268-230*val))<=.00501,"y coordinate");}}
}}
// Simultaneous two-pool analytic solution embedded in full chain, one-hot positivity.
for(const theta of [.12,.4,.75,1,1.35])for(let i=0;i<6;i++){
 const y=Object.fromEntries(m.SPECIES.map((sp,j)=>[sp.id,+(i===j)])),r=m.referenceStep(y,theta,.5);near(m.abundanceTotal(r.abundance),1,3e-15);
 if(i===4){const e=Math.exp(-.022*theta**6*.5);near(r.abundance.O,e,3e-15);near(r.abundance.Fe,1-e,3e-15);}
 if(i===5)near(r.abundance.Fe,1,3e-15);
}
for(const input of [null,[],{theta:'1'},{theta:NaN},{theta:1.36},{steps:0},{steps:3.5},{mode:'typo'},{preset:'__proto__'},{coolingRate:.15},{substeps:3},{dt:1},{freezeThreshold:0},{typo:1}]){assert.throws(()=>m.simulate(input));checks++;}
near(+m.format(10,0),10,0);check(m.format(1e-18)!=='0','small nonzero visible');check(m.simulate({theta:.4}).freezeOutStep===0,'cold steady triggers from zero');
// Static curve coordinates independently checked against their formulas.
const svg=fs.readFileSync(path.join(__dirname,'../physics-course/images/ap-03-gamow.svg'),'utf8'),kt=1.3,eg=500,e0=Math.cbrt(eg*kt*kt/4),delta=4*Math.sqrt(e0*kt/3);
for(const id of ['thermal-cost','tunnel-cost','total-cost','kernel','gaussian']){const ps=points(svg.match(new RegExp('<path id="'+id+'" d="([^"]+)"'))[1]);for(const [x,y] of ps){const e=(x-85)/40;let v,bottom,height,max;
 if(id.endsWith('cost')){v=id==='thermal-cost'?e/kt:id==='tunnel-cost'?Math.sqrt(eg/e):e/kt+Math.sqrt(eg/e);bottom=285;height=180;max=40;}else{v=id==='kernel'?(e===0?0:Math.exp(3*e0/kt-e/kt-Math.sqrt(eg/e))):Math.exp(-(((e-e0)/(delta/2))**2));bottom=590;height=190;max=1;}near(y,bottom-height*v/max,1e-8);}}


for(const level of [0,.5,1]){const bad=Object.fromEntries(m.SPECIES.map(sp=>[sp.id,level]));assert.throws(()=>m.stepNetwork(bad,1,.5));assert.throws(()=>m.referenceStep(bad,1,.5));checks+=2;}

// Accepted near-normalized states must survive repeated transfers into Fe.
for(const method of [m.stepNetwork,m.referenceStep])for(const theta of [.12,.4,1,1.35]){
 let state={H:0,He:0,Be8:0,C:0,O:5e-13,Fe:1};
 for(let i=0;i<80;i++){state=method(state,theta,.5).abundance;check(Object.values(state).every(v=>v>=0&&v<=1+1e-12),'component tolerance');near(m.abundanceTotal(state),1+5e-13,5e-14);}
}
console.log('nucleosynthesis independent: PASS',{checks,cases:fixture.rows.length,maxError,maxTerms});
