'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/compact-connected.js'));
let checks=0,cases=0;function ok(v,msg){checks++;assert(v,msg)}
// Independent interval-union sweep in integer units, rather than endpoint/midpoint probes.
function covers(M,k,selected){
 let reach=null;
 for(const j of selected.slice().sort((a,b)=>a-b)){
  const lo=20*j-k,hi=20*j+k;
  if(reach===null){if(lo<0&&hi>0)reach=hi;else return false;}
  else if(lo<reach)reach=Math.max(reach,hi);
  else return reach>20*M;
 }
 return reach!==null&&reach>20*M;
}
for(let M=1;M<=12;M++)for(let k=1;k<=30;k++){
 const all=Array.from({length:M+1},(_,j)=>j);
 ok(m.coverReport(M,k).covers===(k>10),'all-neighborhood threshold excludes exact touching k=10');
 for(let mask=0;mask<2**(M+1);mask++){
  const selected=all.filter(j=>mask>>j&1),r=m.coverReport(M,k,selected);cases++;
  ok(r.covers===covers(M,k,selected),'all subsets vs independent sweep');
  if(!r.covers){
   const w=r.witness;ok(w.numerator>=0&&w.numerator<=w.denominator,'witness in closed domain');
   ok(selected.every(j=>!(2*(20*j-k)<w.numerator&&w.numerator<2*(20*j+k))),'exact witness outside each selected open set');
  }
 }
 const pruned=m.pruneCover(M,k);
 ok(pruned.covers===(k>10),'prune preserves coverage');
 if(pruned.covers)for(const j of pruned.selected)ok(!covers(M,k,pruned.selected.filter(x=>x!==j)),'each retained member essential');
}
ok(JSON.stringify(m.pruneCover(6,26).selected)==='[1,3,5]','static figure actual greedy subcover');
for(let N=2;N<=100;N++){
 const r=m.openCoverReport(N);ok(r.witness>0&&r.witness<r.left&&r.left<1,'finite open-cover witness');
}
for(let n=1;n<=8;n++){
 const r=m.rationalApproximation(n),P=BigInt(r.numerator),D=BigInt(r.denominator);
 ok(D===10n**BigInt(n)&&2n*P*P<D*D&&D*D<2n*(P+1n)**2n,'exact decimal floor of irrational 1/sqrt2');
 ok(r.decimal===r.value.toFixed(n),'decimal formatting');
}
class Node{
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1}
 setAttribute(k,v){this.attrs[k]=String(v)}
 appendChild(n){this.children.push(n);return n}
 get firstChild(){return this.children[0]}
 removeChild(n){this.children.splice(this.children.indexOf(n),1)}
}
const doc={createElementNS(ns,t){return new Node(t)},createTextNode(t){return {nodeType:3,text:String(t)}}};
const allNodes=n=>[n,...(n.children||[]).flatMap(allNodes)];
for(const eps of [.1,.05,.02,.01,.005]){
 const s=m.sineSamples(eps),svg=new Node('svg');m.renderModelSvg(doc,svg,m.modelById('sine-closure'),'test',{epsilon:eps});
 const nodes=allNodes(svg),curve=nodes.find(n=>Object.hasOwn(n.attrs||{},'data-sine-curve')),points=curve.attrs.points.split(' ').map(p=>p.split(',').map(Number));
 ok(s.maxPhaseStep<=Math.PI/16,'phase resolution bound');ok(points.length===s.points.length,'all samples rendered');
 for(let i=0;i<points.length;i++){
  const [X,Y]=points[i],p=s.points[i];ok(Math.abs(X-(60+640/p.phase))<5.1e-8,'actual reciprocal phase x');
  ok(Math.abs(Y-(184-96*Math.sin(p.phase)))<5.1e-8,'actual sin(1/x), not sin(6/x)');
 }
 ok(Math.abs(s.points.at(-1).x-eps)<1e-15,'true cutoff endpoint');
 ok(+nodes.find(n=>Object.hasOwn(n.attrs||{},'data-omitted-tail')).attrs.width===640*eps,'tail width uses same coordinate scale');
 const v=nodes.find(n=>Object.hasOwn(n.attrs||{},'data-vertical-segment'));
 ok(+v.attrs.x1===60&&+v.attrs.x2===60&&+v.attrs.y1===280&&+v.attrs.y2===88,'included vertical segment at x=0');
}
for(const model of m.models){
 ok(Object.isFrozen(model),'immutable theorem models');
 for(const id of ['square','reciprocal','constant']){
  const r=m.imageReport(model,id);ok(r.applicable===r.known,'unsupported map is not false theorem');
  if(id==='constant')ok(r.compact,'all constant images compact');
  if(model.compact&&r.applicable)ok(r.compact,'continuous image of compact model remains compact');
 }
}
for(const fn of [()=>m.modelById('bad'),()=>m.imageReport(m.models[0],'bad'),()=>m.coverReport('6',26),()=>m.coverReport(0,2),()=>m.coverReport(13,2),()=>m.coverReport(6,NaN),()=>m.coverReport(6,26,[0,0]),()=>m.coverReport(6,26,[7]),()=>m.coverReport(6,26,[null]),()=>m.sineSamples(0),()=>m.sineSamples('0.02'),()=>m.rationalApproximation(9),()=>m.rationalApproximation(1.5),()=>m.openCoverReport(1)]){
 checks++;assert.throws(fn);
}
const svg=fs.readFileSync(path.join(root,'math-course/images/top-02-compact-cover.svg'),'utf8');
function tagged(name,value,tag='line'){return svg.match(new RegExp('<'+tag+'[^>]*'+name+'="'+value+'"[^>]*/>'))[0]}
function attr(s,k){return +s.match(new RegExp(k+'="([^"]+)"'))[1]}
for(let j=0;j<=6;j++){
 const s=tagged('data-cover-j',j),lo=Math.max(0,20*j-26)/120,hi=Math.min(120,20*j+26)/120;
 ok(Math.abs(attr(s,'x1')-(150+990*lo))<1e-8&&Math.abs(attr(s,'x2')-(150+990*hi))<1e-8,'static interval true endpoints');
}
for(const N of [2,4,8,16]){
 const s=tagged('data-open-N',N),w=tagged('data-witness-N',N,'circle');
 ok(Math.abs(attr(s,'x1')-(150+990/N))<1e-8&&attr(s,'x2')===1140,'static exact finite union');
 ok(Math.abs(attr(w,'cx')-(150+990/(2*N)))<1e-8,'static exact omitted point');
}
console.log('compact-connected independent: PASS',{checks,subsets:cases,models:m.models.length,self:m.selfTest()});
