"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),lab=require('../course-shared/labs/change-of-variables.js');let checks=0;
function check(v,m){checks++;assert(v,m)}function close(a,b,m,t=1e-10){check(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),m+': '+a+' vs '+b)}
function node(tag,doc){return{nodeType:1,tag,ownerDocument:doc,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v},appendChild(c){this.children.push(c)}}}const doc={createElementNS(ns,tag){return node(tag,this)},createTextNode(t){return{nodeType:3,text:t}}};function all(n,key){return(n.attrs&&Object.hasOwn(n.attrs,key)?[n]:[]).concat(...(n.children||[]).map(c=>all(c,key)));}
function simpson(f,a,b,n=512){let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+(b-a)*i/n);return sum*(b-a)/n/3;}
function area(p){return p.reduce((v,a,i)=>{const b=p[(i+1)%p.length];return v+(a[0]*b[1]-a[1]*b[0])/2},0)}
function points(n){return n.attrs.points.split(' ').map(p=>p.split(',').map(Number))}
for(const presetId of lab.PRESETS.map(p=>p.id))for(let i=0;i<=45;i++){
 const radius=.25+i*.05,d=lab.compute({presetId,radius}),c=d.config,svg=lab.drawSvg(doc,d,'test');
 const signed=c.mode==='polar'?simpson(r=>r,0,radius)*2*Math.PI*c.turns:c.mode==='reflection'?-1:1;
 close(d.signedJacobianIntegral,signed,'quadrature parameter integral');close(d.absoluteJacobianIntegral,Math.abs(signed),'unsigned');close(d.correctedArea,d.imageArea,'corrected');
 const pre=all(svg,'data-preimage'),im=all(svg,'data-image-point');check(pre.length===c.turns&&im.length===1,'actual number of marked points');
 d.preimages.forEach((p,j)=>{const q=lab.mapPoint(c.mode,...p);close(q[0],d.markedImage[0],'same image x');close(q[1],d.markedImage[1],'same image y');if(c.mode==='polar'){close((+pre[j].attrs.cx-55)/250*radius,p[0],'actual radial record');close((345-+pre[j].attrs.cy)/250*2*Math.PI*c.turns,p[1],'actual angular record');}else{close((+pre[j].attrs.cx-170)/85,p[0],'square record x');close((265-+pre[j].attrs.cy)/85,p[1],'square record y');}});
 const scale=c.mode==='polar'?43:85,cy=c.mode==='polar'?235:265;close((+im[0].attrs.cx-550)/scale,d.markedImage[0],'actual mapped point x');close((cy-+im[0].attrs.cy)/scale,d.markedImage[1],'actual mapped point y');
 if(c.mode==='polar'){
  close(+all(svg,'data-image-disk')[0].attrs.r,43*radius,'fixed spatial scale follows R');
  const pieces=all(svg,'data-sector-input');check(pieces.length===c.turns,'two parameter sectors');pieces.forEach((e,j)=>{close((+e.attrs.x-55)/250*radius,radius/2,'sector r lower');close(+e.attrs.width/250*radius,radius/2,'sector r width');close((345-+e.attrs.y)/250*2*Math.PI*c.turns,Math.PI/3+2*Math.PI*j,'sector theta upper');close(+e.attrs.height/250*2*Math.PI*c.turns,Math.PI/6,'sector theta width');});
  const polygon=points(all(svg,'data-sector-image')[0]).map(p=>[(p[0]-550)/43,(235-p[1])/43]);check(polygon.length===130,'two sampled arcs');
  polygon.forEach((p,j)=>{const index=j<=64?j:129-j,rr=j<=64?radius:radius/2,theta=Math.PI/6+index*Math.PI/6/64;close(p[0],rr*Math.cos(theta),'sector actual x',.00005/43);close(p[1],rr*Math.sin(theta),'sector actual y',.00005/43);});
  close(d.sectorArea,simpson(r=>r,radius/2,radius)*Math.PI/6,'sector integral');close(Math.abs(area(polygon)),d.sectorArea,'polygon area converges',.00003);
 }else{
  const poly=all(svg,'data-polygon');close(area(points(poly[0]))/85**2,-1,'screen flips y');close(area(points(poly[1]))/85**2,-signed,'reflection polygon orientation');if(c.mode==='reflection')check(points(poly[1]).every(p=>p[0]<=550),'reflection really maps negative x');
 }
}
for(const bad of [null,[],1,'polar']){checks++;assert.throws(()=>lab.compute(bad))}for(const radius of [NaN,Infinity,-1,0,.24,2.51,'1',null]){checks++;assert.throws(()=>lab.compute({radius}))}for(const presetId of ['',null,'unknown']){checks++;assert.throws(()=>lab.compute({presetId}))}for(const fn of [()=>lab.mapPoint('bad',0,0),()=>lab.mapPoint('polar',NaN,1),()=>lab.jacobian('bad',0),()=>lab.jacobian('polar','1'),()=>lab.polarDiskArea(-1),()=>lab.polarDiskArea(Infinity)]){checks++;assert.throws(fn)}check(lab.format(100,0)==='100','integer trailing zeros');check(lab.format(.000001)!=='0','small nonzero');
// Independent one-dimensional boundary integrals for the worked examples.
close(simpson(y=>y*Math.exp(-y*y),0,1),(1-Math.exp(-1))/2,'triangular Fubini');
const arc=simpson(t=>{const x=Math.cos(t),y=Math.sin(t);return (x*x-y)*(-y)+(x+Math.sin(y))*x},0,Math.PI);close(arc,Math.PI-2/3,'Green arc',1e-9);close(simpson(x=>x*x,-1,1),2/3,'closing segment');
for(const r of [.25,1,2,2.5]){close(simpson(t=>r**3*Math.sin(t),0,Math.PI)*2*Math.PI,4*Math.PI*r**3,'sphere flux',1e-9);for(const sign of [-1,1])close(simpson(t=>sign/2,0,2*Math.PI),sign*Math.PI,'Stokes boundary orientation');}
for(const r of [1,2])for(const sign of [-1,1])close(simpson(t=>{const x=r*Math.cos(sign*t),y=r*Math.sin(sign*t);return ((-y)*(-sign*y)+x*(sign*x))/(x*x+y*y)},0,2*Math.PI),sign*2*Math.PI,'annulus orientation');
close(simpson(x=>1/(1+x*x),0,1),Math.PI/4,'conditional dy dx');close(simpson(y=>-1/(1+y*y),0,1),-Math.PI/4,'conditional dx dy');
const lecture=fs.readFileSync(path.join(__dirname,'../math-course/lectures/analysis-06-multivar-int.md'),'utf8');check(!/[\x00-\x09\x0b\x0c\x0e-\x1f]/.test(lecture),'no TeX control damage');check(!/^\+(?:$|\*\*)/m.test(lecture),'no patch residue');for(const m of lecture.replace(/\$\$[\s\S]*?\$\$/g,'').matchAll(/(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$(?!\$)/g))check(!m[1].includes('\n'),'inline TeX intact');
check(/<\/div>\s*### 5\. 定理假设/.test(lecture),'theorem conditions outside replaced lab');
const svg=fs.readFileSync(path.join(__dirname,'../math-course/images/analysis-06-double-integral.svg'),'utf8');const tri=svg.match(/data-triangle="true" points="([^"]+)"/)[1].split(' ').map(x=>x.split(',').map(Number));close(Math.abs(area(tri))/220**2,.5,'static triangle area');const semi=svg.match(/data-semicircle="true" d="([^"]+)"/)[1];const pairs=[...semi.matchAll(/([\d.]+),([\d.]+)/g)].map(m=>[+m[1],+m[2]]);check(pairs.length===129,'static arc points');pairs.forEach((p,i)=>{close((p[0]-680)/145,Math.cos(i*Math.PI/128),'static arc x',1e-7);close((300-p[1])/145,Math.sin(i*Math.PI/128),'static arc y',1e-7)});close(Math.abs(area(pairs))/145**2,Math.PI/2,'static semicircle area',.00011);
console.log(`change of variables: PASS (${checks} independent checks; ${lab.selfTest().checks} self checks)`);
