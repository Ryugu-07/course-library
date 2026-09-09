'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/clt.js')),ref=require('./fixtures/clt-reference.json');let checks=0,maxCdfError=0;
function ok(v,msg){checks++;assert(v,msg);}
function near(a,b,t=2e-11){ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
for(const row of ref.rows){const e=m.runExperiment(row.model,row.n,8000),small=m.runExperiment(row.model,row.n,500);ok(JSON.stringify(small.values)===JSON.stringify(e.values.slice(0,500)),'common seed prefix');
 let sum=0,sum2=0,central=0,outside=0;const hist=Array(32).fill(0);
 e.values.forEach(z=>{ok(Number.isFinite(z),'finite sample');sum+=z;sum2+=z*z;central+=Math.abs(z)<=1;if(z< -4||z>=4)outside++;else hist[Math.floor((z+4)/.25)]++;});
 near(e.empiricalMean,sum/8000);near(e.empiricalSd,Math.sqrt(sum2/8000-(sum/8000)**2));near(e.centralCoverage,central/8000);ok(e.outside===outside,'outside retained');ok(JSON.stringify(hist)===JSON.stringify(e.counts),'bin counts');near(e.rawMeanSd,Math.sqrt(m.DISTRIBUTIONS[row.model].variance/row.n));
 const sorted=e.values.slice().sort((a,b)=>a-b);for(let i=0;i<ref.zs.length;i++){let lo=0,hi=sorted.length;while(lo<hi){let mid=(lo+hi)>>1;if(sorted[mid]<=ref.zs[i])lo=mid+1;else hi=mid;}const error=Math.abs(lo/8000-row.cdf[i]);maxCdfError=Math.max(error,maxCdfError);ok(error<.04,'simulation matches independent finite-distribution CDF, not a normal assumption');}
}
for(const n of [1,2,3,10,30,100,128])for(const model of ['uniform','skewed','bimodal']){const e=m.runExperiment(model,n,100);near(e.counts.reduce((a,b)=>a+b,0)+e.outside,100);near(e.berryEsseen,Math.min(1,.4748*m.DISTRIBUTIONS[model].beta3/Math.sqrt(n)));}
for(const [model,n,r]of [['x',1,100],['__proto__',1,100],['uniform',0,100],['uniform',129,100],['uniform',1.5,100],['uniform','1',100],['uniform',1,99],['uniform',1,8001],['uniform',1,NaN],['uniform',1,null]]){checks++;assert.throws(()=>m.runExperiment(model,n,r));}
// Raw and standardized plots encode the same count probability, with different units.
class Node{constructor(tag){this.tag=tag;this.nodeType=1;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]}appendChild(n){this.children.push(n);return n}removeChild(n){this.children.splice(this.children.indexOf(n),1)}get firstChild(){return this.children[0]}}
global.document={createTextNode(t){return {nodeType:3,text:t}}};
const api={svg(tag,attrs,children){let n=new Node(tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);for(const v of children||[])n.appendChild(v&&v.nodeType?v:{nodeType:3,text:v});return n;},format(v,d){return v.toFixed(d)}};
for(const model of ['uniform','skewed','bimodal'])for(const n of [1,2,8,128])for(const raw of [false,true]){
 const e=m.runExperiment(model,n,500),svg=new Node('svg');svg.setAttribute('data-plot-id','test');m.drawPlot(api,svg,e,raw);
 const bars=svg.children.filter(x=>x.attrs&&x.attrs['data-bin']!==undefined);ok(bars.length===32,'32 bins');const scale=raw?e.rawMeanSd:1,axisScale=raw?Math.sqrt(e.distribution.variance):1,yMax=Math.max(.45,e.maxDensity*1.2)/scale;
 let mass=0;for(let j=0;j<32;j++){const b=bars[j],density=(258-Number(b.attrs.y))*yMax/230,binWidth=Number(b.attrs.width)*8*axisScale/600;near(binWidth,.25*scale);near(density,e.counts[j]/(e.trials*.25*scale));near(Number(b.attrs.x),58+((-4+.25*j)*scale/axisScale+4)*75);mass+=density*binWidth;ok(Number(b.attrs.y)>=27.99&&Number(b.attrs.height)>=0,'no ordinate clamp');}near(mass,1-e.outside/e.trials);
 const curve=svg.children.find(x=>x.tag==='polyline');for(const pair of curve.attrs.points.split(' ')){const[x,y]=pair.split(',').map(Number),z=((x-58)/75-4)*axisScale/scale;near((258-y)*yMax/230,Math.exp(-z*z/2)/(Math.sqrt(2*Math.PI)*scale));}
}
const svg=fs.readFileSync(path.join(root,'math-course/images/prob-05-clt.svg'),'utf8');
for(const f of ref.figures){const tag=svg.match(new RegExp('<path[^>]*data-n="'+f.n+'"[^>]*/>'))[0],d=tag.match(/d="([^"]+)"/)[1],points=[...d.matchAll(/[ML]([-\d.e]+),([-\d.e]+)/g)].map(t=>[+t[1],+t[2]]),j=[10,30,100].indexOf(f.n),left=60+j*350;
 let pi=1;for(let k=0;k<f.z.length;k++)if(f.z[k]>=-4&&f.z[k]<=4){const a=points[pi++],b=points[pi++];near((a[0]-left)*8/285-4,f.z[k],2e-9);near((430-a[1])/300,f.before[k],2e-9);near((430-b[1])/300,f.after[k],2e-9);}ok(pi===points.length-1,'every jump represented');ok(svg.includes(`n = ${f.n}; D = ${f.distance.toFixed(5)}`),'CDF distance label');}
near(ref.rareTail,.00550116706252,1e-14);
console.log('clt independent: PASS',{checks,referenceCases:ref.rows.length,maxCdfError});
