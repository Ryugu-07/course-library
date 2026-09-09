'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),m=require(path.join(root,'course-shared/labs/multivariate-dependence.js'));
let checks=0;
function ok(v,msg){checks++;assert(v,msg);}
function close(a,b,t=2e-10){ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
function relative(a,b,t=5e-12){ok(Math.abs(a/b-1)<t,`${a}/${b}`);}
function integral(fn,a,b,n=1024){let v=fn(a)+fn(b);for(let i=1;i<n;i++)v+=(i%2?4:2)*fn(a+(b-a)*i/n);return v*(b-a)/(3*n);}
// A change to the unit interval independently integrates conditional moments,
// including extremely short supports, without subtracting nearly equal moments.
for(let i=1;i<100;i++){
 const x=i/100,c=m.conditional('triangle',x),density=t=>2*(x+(1-x)*t)/(1+x);
 close(integral(density,0,1),1);
 const mean=integral(t=>(x+(1-x)*t)*density(t),0,1);
 close(c.mean,mean);relative(c.variance,integral(t=>((x+(1-x)*t)-mean)**2*density(t),0,1));
 let jointIntegral=0; for(let j=0;j<256;j++)jointIntegral+=m.jointDensity('triangle',x,x+(1-x)*(j+.5)/256)*(1-x)/256; close(jointIntegral,m.marginalDensity('triangle','x',x));
 for(let j=1;j<10;j++){const y=x+(1-x)*j/10;relative(m.conditionalDensity('triangle',x,y),m.jointDensity('triangle',x,y)/m.marginalDensity('triangle','x',x));}
}
for(let k=1;k<=52;k++){
 const x=1-2**-k,c=m.conditional('triangle',x),d=t=>2*(x+(1-x)*t)/(1+x);
 const mt=integral(t=>t*d(t),0,1),vt=integral(t=>(t-mt)**2*d(t),0,1);
 relative(c.variance,(1-x)**2*vt);ok(c.mean>=x&&c.mean<=1,'mean in support');
}
for(let i=0;i<=34;i++){
 const rho=(-85+i*5)/100;
 for(const x of [-3,-1.3,0,.8,3]){
  const d=m.evaluate({modelId:'normal',probe:x,rho}),c=d.condition,sd=Math.sqrt(c.variance),a=c.mean-9*sd,b=c.mean+9*sd;
  close(integral(y=>m.conditionalDensity('normal',x,y,rho),a,b),1);
  close(integral(y=>y*m.conditionalDensity('normal',x,y,rho),a,b),rho*x);
  close(integral(y=>(y-c.mean)**2*m.conditionalDensity('normal',x,y,rho),a,b),1-rho*rho);
  ok(c.support[0]===-Infinity&&c.support[1]===Infinity,'normal support not viewport');
  for(const y of [-2,0,1.4])relative(m.jointDensity('normal',x,y,rho)/m.marginalDensity('normal','x',x),m.conditionalDensity('normal',x,y,rho));
 }
}
for(const rho of [Number.MIN_VALUE,1e-20,-1e-12,1e-9,.85])ok(!m.evaluate({modelId:'normal',rho}).independent,'exact independence');
ok(m.evaluate({modelId:'normal',rho:0}).independent,'rho zero');
close(m.jointDensity('normal',1e308,1e308,.85),0);
const triMoment=(a,b)=>integral(t=>8*t**(a+b+3)/(a+2),0,1,2048);
close(triMoment(0,0),1);close(triMoment(1,0),8/15);close(triMoment(0,1),4/5);close(triMoment(1,1),4/9);
close(triMoment(1,1)-triMoment(1,0)*triMoment(0,1),m.covariance('triangle'));
close(integral(x=>m.conditional('triangle',x).mean*4*x*(1-x*x),1e-8,1-1e-8),4/5);
close(integral(x=>.5*x**3,-1,1),m.covariance('parabola'));
ok(m.jointDensity('parabola',.5,.25)===null,'singular density');
for(const bad of [null,[],false,2,'x']){checks++;assert.throws(()=>m.evaluate(bad));}
for(const bad of [NaN,Infinity,-Infinity,null,'0',false])for(const key of ['probe','rho']){checks++;assert.throws(()=>m.evaluate({[key]:bad}));}
for(const params of [{modelId:'x'},{modelId:'triangle',probe:0},{modelId:'triangle',probe:1},{probe:2},{rho:1},{rho:-.851}]){checks++;assert.throws(()=>m.evaluate(params));}
ok(m.jointDensity('independent',1+1e-12,0)===0,'no epsilon support broadening');
// Inspect the actual SVG coordinates produced by the UI, with a minimal DOM.
class Node{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.nodeType=1;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);return n;}}
const doc={createElementNS(ns,tag){return new Node(tag,this)},createTextNode(text){return{nodeType:3,text}}};
function all(n){return[n,...(n.children||[]).flatMap(all)];}
function coords(d){return [...d.matchAll(/[ML]([-+\d.e]+),([-+\d.e]+)/g)].map(x=>[Number(x[1]),Number(x[2])]);}
for(const modelId of ['independent','parabola','triangle','normal'])for(const probe of modelId==='normal'?[-3,0,.8,3]:modelId==='triangle'?[.02,.5,.98]:[-1,0,1])for(const rho of [-.85,0,.85]){
 const d=m.evaluate({modelId,probe,rho}),nodes=all(m.drawSvg(doc,d,'test'));
 for(const n of nodes.filter(n=>n.tag==='path'))for(const [x,y]of coords(n.attrs.d))ok(x>=64.99&&x<=405.01&&y>=57.99&&y<=398.01,'joint plot point in true viewport');
 for(const n of nodes.filter(n=>n.attrs && n.attrs['data-q']))for(const [xp,yp]of coords(n.attrs.d)){const x=(xp-65)*7/340-3.5,y=3.5-(yp-58)*7/340;close((x*x-2*rho*x*y+y*y)/(1-rho*rho),Number(n.attrs['data-q']),.002);}
 const cnodes=all(m.drawCondition(doc,d,'test'));for(const n of cnodes.filter(n=>n.tag==='path'))for(const[x,y]of coords(n.attrs.d))ok(x>=64.99&&x<=705.01&&y>=67.99&&y<=253.01,'conditional coordinates');
}
const svg=fs.readFileSync(path.join(root,'math-course/images/prob-03-bivariate-normal.svg'),'utf8');
for(const tag of svg.matchAll(/<path\b[^>]*>/g)){
 const get=n=>(tag[0].match(new RegExp(n+'="([^"]+)"'))||[])[1];
 const points=coords(get('d'));
 if(get('data-q'))for(const[xp,yp]of points){const x=(xp-70)*6/340-3,y=3-(yp-125)*6/340;close((x*x-1.2*x*y+y*y)/.64,Number(get('data-q')),2e-7);}
 if(get('data-curve'))for(const[xp,yp]of points){const y=(xp-530)*8/460-4,f=(465-yp)*.55/340,phi=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),c=phi((y-.6)/.8)/.8;close(f,get('data-curve')==='marginal'?phi(y):get('data-curve')==='slice'?phi(1)*c:c,1e-8);}
}
console.log(`multivariate-dependence independent checks: PASS (${checks})`);
