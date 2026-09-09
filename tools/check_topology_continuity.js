'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const m=require(path.join(root,'course-shared/labs/topology-continuity.js')),ref=require('./fixtures/topology-reference.json');
let checks=0;function ok(v,msg){checks++;assert(v,msg)}function eq(a,b,msg){ok(JSON.stringify(a)===JSON.stringify(b),msg)}const range=n=>Array.from({length:n},(_,i)=>i),points=['a','b','c'];
eq(m.THREE_TOPOLOGIES,ref.topologies.map(t=>t.opens),'all 29 topologies vs independent preorders');ok(Object.isFrozen(m.PRESETS[0].map)&&Object.isFrozen(m.THREE_TOPOLOGIES[0]),'immutable presets');
for(let i=0;i<29;i++){
 const t=ref.topologies[i];for(let U=0;U<8;U++){
  const r=m.subsetReport(points,t.opens,U);let interior=0,closure=0;
  for(let x=0;x<3;x++){if(range(3).every(y=>!t.relation[x][y]||!!(U>>y&1)))interior|=1<<x;if(range(3).some(y=>t.relation[x][y]&&U>>y&1))closure|=1<<x;}
  eq([r.interior,r.closure,r.boundary],[interior,closure,closure&~interior],'subset vs specialization order');
  for(let x=0;x<3;x++)eq(r.neighborhoods[x],range(3).reduce((mask,y)=>mask|(t.relation[x][y]?1<<y:0),0),'minimal neighborhood vs preorder');
 }
 for(let j=0;j<29;j++)for(let code=0;code<27;code++){
  const f=[code%3,Math.floor(code/3)%3,Math.floor(code/9)],r=m.continuityLedger(points,t.opens,points,ref.topologies[j].opens,f);
  ok(r.continuous===ref.continuousMapCodes[i*29+j].includes(code),'continuous iff monotone: all 22707 maps');
  for(const row of r.rows){const expected=range(3).reduce((mask,x)=>mask|((row.targetMask>>f[x]&1)?1<<x:0),0);ok(row.preimageMask===expected,'exact selected preimage');}
 }
}
for(const q of ref.quotients)eq(m.quotientTopology(points,ref.topologies[q.source].opens,['A','B'],q.map).openSets,q.opens,'quotient vs transitive closure of projected relation');
for(const p of ref.products)eq(m.productTopology(['a','b'],p.x,['u','v'],p.y).openSets,p.opens,'product vs product preorder');
const start=Date.now(),discrete=range(1024);ok(m.topologyReport(10,discrete).valid,'discrete10 completes without power-set-of-topology enumeration');
eq(m.productTopology(5,range(32),2,range(4)).openSets,range(1024),'discrete5×2 completes without 2^basis enumeration');
ok(Date.now()-start<10000,'bounded regression within 10s');
for(const bad of [[0,'1',3],[0,null,3],[0,NaN,3],[0,1.5,3],[0,4,3]])ok(!m.isTopology(2,bad),'invalid masks not silently discarded or converted');
for(const pts of [11,-1,'3',['a','a'],[''],Array.from({length:11},(_,i)=>String(i))]){checks++;assert.throws(()=>m.topologyReport(pts,[0]));}
for(const args of [[null,0],[[0,10],1],[[0,-1],1],[[0,1],1024],[[0,1],'1']]){checks++;assert.throws(()=>m.preimage(...args));}
checks++;assert.throws(()=>m.productTopology(4,[0,15],3,[0,7]));checks++;assert.throws(()=>m.quotientTopology(points,[0,7],['A','B'],[0,0,0]));
checks++;assert.throws(()=>m.subsetReport(points,[0,7],8));checks++;assert.throws(()=>m.subsetReport(points,[0,1],1));
ok(m.isTopology(0,[0]),'empty topology');eq(m.productTopology(0,[0],3,[0,7]).openSets,[0],'empty product factor');eq(m.quotientTopology([], [0], [], []).openSets,[0],'empty quotient');
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n}}
const doc={createElementNS(ns,t){return new Node(t)},createTextNode(t){return {nodeType:3,text:String(t)}}};const all=n=>[n,...(n.children||[]).flatMap(all)];
for(const preset of m.PRESETS){
 const svg=m.mapSvg(doc,m.analyze(preset.id),'independent'),nodes=all(svg),markers=nodes.filter(n=>n.tag==='marker');
 ok(markers.some(n=>n.attrs.id==='tc-arrow-independent'),'unique actual marker exists');
 for(const arrow of nodes.filter(n=>n.attrs?.class==='tc-arrow'))ok(arrow.attrs['marker-end']==='url(#tc-arrow-independent)','every map/quotient arrow references marker');
}
for(let code=0;code<27;code++)for(let U=0;U<8;U++){
 const f=[code%3,Math.floor(code/3)%3,Math.floor(code/9)],r=m.continuityLedger(points,[0,1,3,7],points,range(8),f),nodes=all(m.mapSvg(doc,{kind:'map',map:r},'mask',U));
 const selected=nodes.filter(n=>Object.hasOwn(n.attrs||{},'data-target-point')).map(n=>+n.attrs['data-target-point']);
 const inverse=nodes.filter(n=>Object.hasOwn(n.attrs||{},'data-preimage-point')).map(n=>+n.attrs['data-preimage-point']);
 eq(selected,range(3).filter(i=>U>>i&1),'all target highlights');eq(inverse,range(3).filter(i=>U>>f[i]&1),'all preimage highlights');
 const mask=m.preimage(f,U);for(const node of nodes.filter(n=>Object.hasOwn(n.attrs||{},'data-preimage-point')))ok(node.attrs.class===([0,1,3,7].includes(mask)?'tc-open':'tc-preimage-bad'),'preimage color means actual source openness');
}
const svg=fs.readFileSync(path.join(root,'math-course/images/top-01-homeomorphism.svg'),'utf8'),samples=require('./fixtures/topology-figure-points.json');
for(const row of samples){
 ok(Math.abs(row.t-(2*Math.PI-1/row.n))<1e-14,'actual sequence parameter');
 ok(Math.abs(row.source[0]-(90+460*row.t/(2*Math.PI)))<1e-12,'linear interval scale');
 ok(Math.abs(row.image[0]-(920+125*Math.cos(row.t)))<1e-12&&Math.abs(row.image[1]-(270-125*Math.sin(row.t)))<1e-12,'actual circle map');
 for(const [type,xy] of [['source',row.source],['image',row.image]]){
  const tag=svg.match(new RegExp('<circle[^>]+data-'+type+'-n="'+row.n+'"[^>]*>'))[0];
  ok(Math.abs(+tag.match(/cx="([^"]+)"/)[1]-xy[0])<1e-8&&Math.abs(+tag.match(/cy="([^"]+)"/)[1]-xy[1])<1e-8,'SVG exact point');
 }
}
ok((svg.match(/data-horizontal-pair=/g)||[]).length===2,'only torus glues horizontal pair');
for(const [i,dir]of [[0,1],[1,-1],[2,1]])ok(svg.includes('data-orientation="'+i+':'+dir+'"'),'actual paired parameter orientation');
ok(!svg.includes('data and control'),'placeholder removed');
console.log('topology continuity independent: PASS',{checks,topologies:29,maps:22707});
