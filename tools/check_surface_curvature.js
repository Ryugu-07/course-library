'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/surface-curvature.js')),ref=require('./fixtures/surface-reference.json');
let checks=0;function ok(v,s){checks++;assert(v,s)}
function near(a,b,s,rel=2e-8,abs=2e-13){ok(Number.isFinite(a)&&Math.abs(a-b)<=abs+rel*Math.abs(b),s+': '+a+' vs '+b)}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a),projection=p=>[(p[0]-p[1])/Math.SQRT2,(p[0]+p[1]-2*p[2])/Math.sqrt(6)];
for(const r of ref){
 const a=m.evaluateSurface(r.id,r.u,r.v,r.sign),g=a.first,h=a.second;
 [g.E,g.F,g.G,g.determinant].forEach((v,i)=>near(v,r.first[i],'first form '+i,2e-8,Math.abs(r.first[i])<1e-50?1e-13:0));
 [h.L,h.M,h.N].forEach((v,i)=>near(v,r.second[i],'second form '+i,2e-8,Math.abs(r.second[i])<1e-50?1e-13:0));
 near(a.K,r.K,'Gaussian curvature',2e-8,0);near(a.H,r.H,'mean curvature');
 a.principal.forEach((v,i)=>near(v,r.principal[i],'Cholesky generalized eigenvalue',2e-8,1e-14));
 near(norm(a.normal),1,'unit normal');near(dot(a.normal,a.ru),0,'normal dot ru');near(dot(a.normal,a.rv),0,'normal dot rv');
 for(let i=0;i<2;i++){
  const v=a.principalDirections[i],c=a.tangentFrame.map(e=>dot(e,v)),b=a.orthogonalSecond;
  near(norm(v),1,'unit principal vector');near(dot(v,a.normal),0,'principal vector tangent');
  for(let j=0;j<2;j++)near(b[j][0]*c[0]+b[j][1]*c[1],a.principal[i]*c[j],'actual direction eigen-equation',2e-8,5e-12);
 }
 near(dot(a.principalDirections[0],a.principalDirections[1]),0,'orthogonal principal directions');
 for(const q of r.directions){const v=m.normalCurvature(a,q.angle);near(v.value,q.value,'Euler vs independent II/I');near(v.direct,q.value,'direct orthogonal form');near(norm(v.direction),1,'unit chosen direction');}
 const flipped=m.evaluateSurface(r.id,r.u,r.v,-r.sign);
 near(flipped.K,a.K,'normal flip K',0,0);near(flipped.H,-a.H,'normal flip H',0,0);
 near(flipped.principal[0],-a.principal[1],'sorted eigenvalues swap on flip');near(flipped.principal[1],-a.principal[0],'sorted eigenvalues swap on flip');
 if(r.id==='saddle')ok(a.type==='双曲点'&&m.expectedAnswers(a).sign==='negative','tiny nonzero K never classified as zero');
 if(r.id==='sphere')ok(a.umbilic&&a.principal[0]===a.principal[1],'exact sphere double root');
}
const q=m.evaluateSurface('saddle',.5,.5,1);near(q.K,-4/9,'exercise K');near(q.H,0,'exercise H');near(m.normalCurvature(q,0).value,1/Math.sqrt(3),'parameter direction is not principal');
near(q.principalAngle,Math.PI/12,'15 degree principal direction');
for(const f of [()=>m.evaluateSurface('bad',0,0,1),()=>m.evaluateSurface('sphere',Math.PI/2,0),()=>m.evaluateSurface('sphere',-Math.PI/2,0),()=>m.evaluateSurface('plane','0',0),()=>m.evaluateSurface('plane',null,0),()=>m.evaluateSurface('plane',0,Infinity),()=>m.evaluateSurface('plane',101,0),()=>m.evaluateSurface('plane',0,0,0),()=>m.evaluateSurface('plane',0,0,'1'),()=>m.normalCurvature(q,'0')]){checks++;assert.throws(f)}
ok(Object.isFrozen(m.SURFACES)&&m.SURFACES.every(Object.isFrozen),'immutable presets');ok(m.surfacePoint('plane').every(x=>x===0),'default point is finite origin');
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n}}
const doc={createElementNS(ns,t){return new Node(t)},createTextNode(t){return {nodeType:3,text:String(t)}}},all=n=>[n,...(n.children||[]).flatMap(all)];
for(const model of m.SURFACES)for(const u of [model.uMin,model.u,model.uMax])for(const sign of [-1,1]){
 const a=m.evaluateSurface(model.id,u,model.v,sign),svg=m.renderSvg(doc,a,'verify',Math.PI/4),nodes=all(svg);
 ok(nodes.filter(n=>Object.hasOwn(n.attrs||{},'data-grid-line')).length===34,'all actual parameter grid lines');
 for(const n of nodes.filter(n=>n.tag==='line'))for(const k of ['x1','x2','y1','y2'])ok(+n.attrs[k]>=0&&+n.attrs[k]<=(k[0]==='x'?760:465),'all mesh vectors in bounds');
 const zero=nodes.find(n=>Object.hasOwn(n.attrs||{},'data-surface-probe'));ok(+zero.attrs.cx>=0&&+zero.attrs.cx<760&&+zero.attrs.cy>=0&&+zero.attrs.cy<465,'probe in bounds');
 // Recover the single linear viewing map from the actual grid's min/max plus
 // the fixed probe cube, independently of rendering internals.
 const grid=m.surfaceGrid(a),points=grid.lines.flat();
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])points.push(a.point.map((v,i)=>v+[x,y,z][i]));
 const pp=points.map(projection),xs=pp.map(p=>p[0]),ys=pp.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),scale=Math.min(435/(hiX-loX),285/(hiY-loY));
 const map=p=>{const q=projection(p);return [252+scale*(q[0]-(loX+hiX)/2),215-scale*(q[1]-(loY+hiY)/2)]};
 for(const n of nodes.filter(n=>Object.hasOwn(n.attrs||{},'data-grid-line'))){
  const row=grid.lines[+n.attrs['data-grid-line']],numbers=n.attrs.d.match(/[-+]?\d+(?:\.\d+)?/g).map(Number);
  for(let i=0;i<row.length;i++){const p=map(row[i]);ok(Math.abs(numbers[2*i]-p[0])<5.1e-8&&Math.abs(numbers[2*i+1]-p[1])<5.1e-8,'actual mesh vertices share one projection scale');}
 }
}
const svg=fs.readFileSync(path.join(root,'math-course/images/dg-02-gaussian-curvature.svg'),'utf8');
for(const name of ['sphere','cylinder','saddle']){
 const group=svg.match(new RegExp('<g data-model="'+name+'"([^>]*)>([\\s\\S]*?)</g>')),attrs=group[1],body=group[2],get=k=>+attrs.match(new RegExp(k+'="([^"]+)"'))[1],scale=get('data-scale'),ox=get('data-origin-x'),oy=get('data-origin-y');
 const ur=name==='sphere'?[-1.45,1.45]:name==='cylinder'?[-Math.PI,Math.PI]:[-.75,.75],vr=name==='sphere'?[-Math.PI,Math.PI]:name==='cylinder'?[-1.6,1.6]:[-.75,.75];
 function point(u,v){return name==='sphere'?[2*Math.cos(u)*Math.cos(v),2*Math.cos(u)*Math.sin(v),2*Math.sin(u)]:name==='cylinder'?[1.5*Math.cos(u),1.5*Math.sin(u),v]:[u,v,u*u-v*v]}
 const paths=[...body.matchAll(/<path d="([^"]+)"[^>]*data-grid-line="(\d+)"/g)];ok(paths.length===34,'static complete grid');
 for(const path of paths){const index=+path[2],axis=index>=17?1:0,j=index%17,xy=path[1].match(/[-+]?\d+(?:\.\d+)?/g).map(Number);
  for(let k=0;k<=60;k++){const u=ur[0]+(ur[1]-ur[0])*(axis===0?j/16:k/60),v=vr[0]+(vr[1]-vr[0])*(axis===0?k/60:j/16),q=projection(point(u,v));
   ok(Math.abs(xy[2*k]-(ox+scale*q[0]))<1e-7&&Math.abs(xy[2*k+1]-(oy-scale*q[1]))<1e-7,'every static mesh vertex corresponds to real surface');}
 }
}
console.log('Surface independent: PASS',{checks,highPrecisionCases:ref.length,self:m.selfTest()});
