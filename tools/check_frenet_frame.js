'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/frenet-frame.js')),ref=require('./fixtures/frenet-reference.json');
let checks=0;function ok(x,s){checks++;assert(x,s)}
function near(a,b,label,tol=2e-10){ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(Math.abs(b),1e-15),label+': '+a+' vs '+b)}
function vec(a,b,label){if(b===null){ok(a===null,label);return;}ok(a.length===b.length,label);a.forEach((v,i)=>near(v,b[i],label,1e-8))}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
for(const r of ref){
 const a=m.evaluateCurve(r.id,r.t,r.rate);
 for(const k of ['speed','curvature','arcLength'])near(a[k],r[k],r.id+' '+k, k==='arcLength'?3e-10:1e-9);
 if(r.torsion===null)ok(a.torsion===null,'undefined torsion');else near(a.torsion,r.torsion,'torsion',1e-9);
 for(const k of ['point','tangent','normal','binormal'])vec(a[k],r[k],r.id+' '+k);
 ok(a.frenetDefined===r.defined,'exact zero set, including ±1e-12');
 ok(a.arcLengthConverged,'quadrature stopping condition');
 const p=m.parameterizationReport(r.id,r.t,r.rate);
 ok(p.samePoint&&p.curvatureInvariant,'same point and curvature also at zero');
 near(p.speedRatio,Math.abs(r.rate),'speed ratio');
 if(r.defined){
  ok(p.torsionInvariant,'torsion preserved under positive AND negative parameterization');
  near(dot(a.tangent,a.normal),0,'T dot N',1e-1);near(dot(a.tangent,a.binormal),0,'T dot B',1e-1);near(dot(a.normal,a.binormal),0,'N dot B',1e-1);
  vec(a.tangent,p.base.tangent.map(x=>x*Math.sign(r.rate)),'T orientation');
  vec(a.normal,p.base.normal,'N unchanged');
  vec(a.binormal,p.base.binormal.map(x=>x*Math.sign(r.rate)),'B orientation');
 }else ok(p.torsionInvariant===null,'undefined is not numerical zero');
}
const p=m.parameterizationReport('inflection',.5,2);
near(p.changed.curvature,3/(5*Math.sqrt(10)),'same point exercise');
near(p.sameClock.curvature,192/125,'different point exercise');
ok(p.sameClock.curvature!==p.changed.curvature,'old same-clock bug has explicit witness');
for(const value of [NaN,Infinity,'1',null,0,.01,-.01,6]){checks++;assert.throws(()=>m.evaluateCurve('circle',.2,value));}
for(const value of [NaN,Infinity,'0.2',null,101]){checks++;assert.throws(()=>m.evaluateCurve('circle',value,1));}
for(const f of [()=>m.evaluateCurve('unknown',0,1),()=>m.evaluateCurve('circle',30,5),()=>m.curveSample('circle',1,-1,20,1),()=>m.curveSample('circle',-1,1,1e9,1)]){checks++;assert.throws(f)}
ok(Object.isFrozen(m.PRESETS)&&m.PRESETS.every(Object.isFrozen),'immutable definitions');
// Orthographic projection rows must be orthonormal, not an oblique map followed
// by independent axis scales. Recover the two rows from the standard basis.
const projections=[[1,0,0],[0,1,0],[0,0,1]].map(m.projection),rows=[0,1].map(i=>projections.map(p=>p[i]));
near(dot(rows[0],rows[0]),1,'projection row norm');near(dot(rows[1],rows[1]),1,'projection row norm');near(dot(rows[0],rows[1]),0,'projection row orthogonality',1e-1);
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n}}
const doc={createElementNS(ns,t){return new Node(t)},createTextNode(t){return {nodeType:3,text:String(t)}}},all=n=>[n,...(n.children||[]).flatMap(all)];
for(const preset of m.PRESETS)for(const t of [preset.minimum,0,preset.maximum])for(const rate of [-3,.5,3]){
 const a=m.evaluateCurve(preset.id,t,rate),svg=m.curveSvg(doc,a,preset,'proof'),nodes=all(svg),samples=m.curveSample(a.id,preset.minimum,preset.maximum,240,rate);
 const bounds=samples.concat([a.point]);[a.tangent,a.normal,a.binormal].filter(Boolean).forEach(v=>bounds.push(a.point.map((x,i)=>x+.6*v[i])));
 const map=m.makeProjection(bounds),curve=nodes.find(n=>Object.hasOwn(n.attrs||{},'data-curve-sample')),actual=curve.attrs.d.match(/[-+]?\d+(?:\.\d+)?/g).map(Number);
 for(let i=0;i<samples.length;i++){const q=map(samples[i]);ok(Math.abs(actual[2*i]-q[0])<5.1e-8&&Math.abs(actual[2*i+1]-q[1])<5.1e-8,'all sampled curve positions');}
 for(const n of nodes.filter(n=>n.tag==='line'))for(const k of ['x1','x2','y1','y2'])ok(+n.attrs[k]>=0&&+n.attrs[k]<= (k[0]==='x'?760:420),'all vectors inside viewport');
 for(const name of ['tangent','normal','binormal']){
  const v=a[name],arrow=nodes.find(n=>n.attrs?.['data-world-vector']===name);
  if(!v){ok(!arrow,'no fake undefined vector');continue;}
  const end=map(a.point.map((x,i)=>x+.6*v[i]));
  near(+arrow.attrs.x2,end[0],'same-scale vector x');near(+arrow.attrs.y2,end[1],'same-scale vector y');
  ok(arrow.attrs['marker-end']==='url(#proof-'+name+')','actual marker');
 }
}
const svg=fs.readFileSync(path.join(root,'math-course/images/dg-01-curvature.svg'),'utf8');
const circle=svg.match(/<circle[^>]*data-osculating-circle=""[^>]*>/)[0];
const attr=k=>+circle.match(new RegExp(k+'="([^"]+)"'))[1];
ok(attr('cx')===330&&attr('cy')===490&&attr('r')===170,'true osculating center and radius');
const d=svg.match(/<path d="([^"]+)"[^>]*data-parabola/)[1].match(/[-+]?\d+(?:\.\d+)?/g).map(Number);
for(let i=0;i<d.length;i+=2){const x=(d[i]-330)/340;ok(Math.abs(d[i+1]-(660-340*x*x))<1e-7,'every parabola vertex in common scale');}
console.log('Frenet independent: PASS',{checks,highPrecisionCases:ref.length,self:m.selfTest()});
