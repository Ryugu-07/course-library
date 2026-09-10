(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("weak-derivative",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"pairing",slope:0,corner:0,jump:1,c:0,test:"even",m:0,r:.8,n:128,epsilon:.1,a:.7,A:0,B:0});
 const PRESETS=Object.freeze([
  {id:"step",label:"阶跃的一阶导数",jump:1},
  {id:"corner",label:"尖角的二阶导数",jump:0,corner:1},
  {id:"relu",label:"ReLU",jump:0,slope:.5,corner:.5},
  {id:"down",label:"向下跳跃",jump:-1,slope:1},
  {id:"blind",label:"奇测试测不到这个 δ",jump:1,test:"odd"},
  {id:"shifted",label:"移动测试函数",jump:1,test:"odd",m:.3},
  {id:"box",label:"盒核：配对收敛与范数",mode:"box"},
  {id:"poisson",label:"盒源的 Poisson 解",mode:"poisson"},
  {id:"affine",label:"同一源的另一解",mode:"poisson",A:1,B:.5}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["对 H(x−c) 求一次分布导数，会得到什么？",["δc；系数是右值减左值","几乎处处导数0，所以分布导数也是0"],0,"分段分部积分保留内部跳点的边界项。"],
  ["一支测试函数满足 φ(c)=0，就足以排除 δc 吗？",["不够，它恰好测不到这个点质量","足够，配对0说明分布0"],0,"分布相等要求对所有测试函数的配对相等。"],
  ["盒核平均的 Hε 逼近 H，哪一种误差不趋于0？",["L∞误差保持1/2","L1误差保持1/2"],0,"误差所在区间变窄，但跳点两侧的最大偏差不消失。"],
  ["全直线上 −u″=f，尚未给定其他条件，解是否唯一？",["可加 Ax+B，仍是同一个方程的解","基本解已经让解唯一"],0,"仿射函数的二阶导数为0；边界或增长条件才可能排除它。"]
 ];
 function number(v,k,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(k+" 必须填写有限数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(k+" 必须在 "+lo+"–"+hi+" 内");return x;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode,test:p.test};
  if(!["pairing","box","poisson"].includes(s.mode))throw Error("未知模式");
  if(!["even","tilted","odd"].includes(s.test))throw Error("未知测试函数");
  s.m=number(p.m,"测试中心",-1,1);s.r=number(p.r,"测试半宽",.2,.8);
  s.n=number(p.n,"每段子区间数",16,256);if(!Number.isInteger(s.n)||s.n%2)throw Error("每段子区间数必须为16–256的偶数");
  s.c=number(p.c,"跳点或源中心",s.mode==="poisson"?-.5:-1,s.mode==="poisson"?.5:1);
  if(s.mode==="pairing")for(const key of ["slope","corner","jump"])s[key]=number(p[key],key,-2,2);
  if(s.mode==="box")s.epsilon=number(p.epsilon,"盒核半宽",.0125,.8);
  if(s.mode==="poisson"){s.a=number(p.a,"源半宽",.2,1);s.A=number(p.A,"附加斜率",-2,2);s.B=number(p.B,"附加常数",-2,2);}
  return s;
 }
 function testJet(s,x){
  const z=(x-s.m)/s.r,q=1-z*z;
  if(q<=0)return {phi:0,dphi:0,ddphi:0};
  const bump=Math.exp(1-1/q);if(bump===0)return {phi:0,dphi:0,ddphi:0};
  const a=s.test==="odd"?0:1,b=s.test==="odd"?1:s.test==="tilted"?.5:0,p=a+b*z;
  const l=-2*z/(q*q),ll=-2/(q*q)-8*z*z/(q*q*q);
  return {phi:bump*p,dphi:bump*(l*p+b)/s.r,ddphi:bump*((l*l+ll)*p+2*l*b)/(s.r*s.r)};
 }
 function grid(lo,hi,n=200){return Array.from({length:n+1},(_,i)=>i===n?hi:lo+(hi-lo)*i/n);}
 function cuts(s,extra=[]){
  const lo=s.m-s.r,hi=s.m+s.r;
  return Array.from(new Set([...grid(lo,hi,8),...extra.filter(x=>x>lo&&x<hi)])).sort((a,b)=>a-b);
 }
 // Each segment supplies exact one-sided branch values at its endpoints.
 function quadrature(s,breaks,fn,keep=true){
  const nodes=[],segments=[],sums=[];let count=0;
  for(let k=0;k<breaks.length-1;k++){
   const lo=breaks[k],hi=breaks[k+1],h=(hi-lo)/s.n,mid=(lo+hi)/2,total=[];
   for(let i=0;i<=s.n;i++){
    const x=i===s.n?hi:lo+h*i,w=i===0||i===s.n?1:i%2?4:2,jet=testJet(s,x),values=fn(x,mid,jet),terms=values.map(v=>h*w*v/3);
    terms.forEach((v,j)=>total[j]=(total[j]||0)+v);
    if(keep)nodes.push({segment:k,i,x,h,w,...jet,values,terms});count++;
   }
   total.forEach((v,j)=>sums[j]=(sums[j]||0)+v);segments.push({k,lo,hi,h,total});
  }
  return {nodes,segments,sums,count};
 }
 function piece(s,x,side){const sign=side<s.c?-1:1;return {u:s.slope*x+s.corner*sign*(x-s.c)+s.jump*(sign>0?1:0),v:s.slope+s.corner*sign};}
 function pairing(s,keep=true){
  const q=quadrature(s,cuts(s,[s.c]),(x,side,j)=>{const p=piece(s,x,side);return [p.u*j.dphi,-p.v*j.phi,p.u*j.ddphi];},keep),j=testJet(s,s.c);
  const jump=-s.jump*j.phi,rhs=q.sums[1]+jump,second=2*s.corner*j.phi-s.jump*j.dphi;
  return {quadrature:q,phi:j.phi,dphi:j.dphi,lhs:q.sums[0],regular:q.sums[1],jump,rhs,residual:q.sums[0]-rhs,omitted:q.sums[0]-q.sums[1],secondLhs:q.sums[2],secondRhs:second,secondResidual:q.sums[2]-second};
 }
 function box(s,epsilon=s.epsilon,keep=true){
  const q=quadrature(s,cuts(s,[s.c-epsilon,s.c+epsilon]),(x,side,j)=>Math.abs(side-s.c)<epsilon?[j.phi/(2*epsilon),-j.dphi/(2*epsilon)]:[0,0],keep),j=testJet(s,s.c);
  return {epsilon,quadrature:q,action:q.sums[0],delta:j.phi,error:q.sums[0]-j.phi,prime:q.sums[1],deltaPrime:-j.dphi,primeError:q.sums[1]+j.dphi,primeBoundary:-(testJet(s,s.c+epsilon).phi-testJet(s,s.c-epsilon).phi)/(2*epsilon),H_L1:epsilon/2,H_L2:Math.sqrt(epsilon/6),H_Linf:.5,delta_L1:1,delta_L2:1/Math.sqrt(2*epsilon),delta_Linf:1/(2*epsilon)};
 }
 function poissonPoint(s,x,side=x){
  const z=x-s.c,inside=side>=s.c-s.a&&side<s.c+s.a;
  return {u:(inside?-(z*z+s.a*s.a)/2:-s.a*Math.abs(z))+s.A*x+s.B,v:-Math.max(-s.a,Math.min(s.a,z))+s.A,f:inside?1:0};
 }
 function poisson(s,keep=true){
  const q=quadrature(s,cuts(s,[s.c-s.a,s.c+s.a]),(x,side,j)=>{const p=poissonPoint(s,x,side);return [-p.u*j.ddphi,p.f*j.phi];},keep);
  const interfaces=[s.c-s.a,s.c+s.a].map(x=>({x,left:poissonPoint(s,x,x-s.a/2),right:poissonPoint(s,x,x+s.a/2)}));
  return {quadrature:q,lhs:q.sums[0],rhs:q.sums[1],residual:q.sums[0]-q.sums[1],interfaces,mass:2*s.a,leftSlope:s.a+s.A,rightSlope:-s.a+s.A};
 }
 function snapshot(raw={}){
  const s=config(raw),d={config:s};
  if(s.mode==="pairing"){d.current=pairing(s);d.convergence=[16,32,64,128,256].map(n=>({n,...pairing(Object.assign({},s,{n}),false)}));}
  if(s.mode==="box"){d.current=box(s);d.convergence=Array.from(new Set([.0125,.025,.05,.1,.2,.4,.8,s.epsilon])).sort((a,b)=>a-b).map(e=>box(s,e,false));}
  if(s.mode==="poisson"){d.current=poisson(s);d.convergence=[16,32,64,128,256].map(n=>({n,...poisson(Object.assign({},s,{n}),false)}));}
  return d;
 }
 function series(key,label,color,points,extra={}){return Object.assign({key,label,color,points,line:true},extra);}
 function plot(title,xlabel,ylabel,ss,xmin=-2,xmax=2,markers=[]){
  const ys=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
  return {title,x:xlabel,y:ylabel,xmin,xmax,ymin:lo-pad,ymax:hi+pad,series:ss,markers};
 }
 function plots(d){
  const s=d.config,c=s.c,blue="#268bd2",orange="#cb6a16",green="#29966c",purple="#9966bb",out=[];
  const tests=series("phi","测试函数 φ",green,grid(-2,2,400).map(x=>[x,testJet(s,x).phi]));
  if(s.mode==="pairing"){
   const left=grid(-2,c,100),right=grid(c,2,100);
   out.push(plot("函数的跳跃与普通斜率分开画","x；Ω=(-2,2)","u、普通导数、φ",[
    series("u-left","u 左支",blue,left.map(x=>[x,piece(s,x,c-1).u]),{endOpen:true}),
    series("u-right","u 右支",blue,right.map(x=>[x,piece(s,x,c+1).u])),
    series("v-left","普通导数左支",orange,left.map(x=>[x,piece(s,x,c-1).v]),{endOpen:true}),
    series("v-right","普通导数右支",orange,right.map(x=>[x,piece(s,x,c+1).v])),tests],-2,2,[{x:c,label:"c；δ 系数 J="+fmt(s.jump)}]));
   out.push(plot("移动测量中心：零配对不代表零分布","测试中心 m；半宽与形状固定","分布对测试函数的精确配对",[
    series("delta","Jδc 的配对",blue,grid(-1,1).map(m=>[m,s.jump*testJet(Object.assign({},s,{m}),c).phi])),
    series("second","D²u 的配对",orange,grid(-1,1).map(m=>{const j=testJet(Object.assign({},s,{m}),c);return[m,2*s.corner*j.phi-s.jump*j.dphi];}))],-1,1,[{x:s.m,label:"当前测量中心"}]));
  }else if(s.mode==="box"){
   const e=s.epsilon,left=grid(-2,c,100),right=grid(c,2,100);
   out.push(plot("连续斜坡逼近阶跃；盒核仍是普通函数","x；ε="+fmt(e),"H、Hε、φ",[
    series("H-left","H 左支",blue,left.map(x=>[x,0]),{endOpen:true}),series("H-right","H 右支",blue,right.map(x=>[x,1])),
    series("He","Hε",orange,Array.from(new Set([...grid(-2,2,400),c-e,c,c+e])).sort((a,b)=>a-b).map(x=>[x,Math.max(0,Math.min(1,(x-c+e)/(2*e)))])),tests],-2,2,[{x:c,label:"跳点 c"}]));
   out.push(plot("盒核配对趋近点采样；范数结论另列","log₁₀ ε；向左变窄","δε 与 δ 的测试配对",[
    series("box","δε(φ)",blue,d.convergence.map(q=>[Math.log10(q.epsilon),q.action])),
    series("delta","δc(φ)",orange,d.convergence.map(q=>[Math.log10(q.epsilon),q.delta]))],Math.log10(.0125),Math.log10(.8),[{x:Math.log10(e),label:"当前半宽"}]));
  }else{
   const xs=Array.from(new Set([...grid(-2,2,400),c-s.a,c+s.a])).sort((a,b)=>a-b);
   out.push(plot("同一个盒源，解可相差一条直线","x；全线问题的显示窗口","u 与 u′",[
    series("u","u",blue,xs.map(x=>[x,poissonPoint(s,x).u])),
    series("v","u′",orange,xs.map(x=>[x,poissonPoint(s,x).v])),
    series("affine","附加 Ax+B",purple,xs.map(x=>[x,s.A*x+s.B]))],-2,2,[{x:c-s.a,label:"源左边界"},{x:c+s.a,label:"源右边界"}]));
   out.push(plot("源的边界没有额外的点质量","x；单侧支线分别显示","f 与 φ",[
    series("f-left","f 外左",blue,[[-2,0],[c-s.a,0]],{endOpen:true}),
    series("f-inner","f 内部",blue,[[c-s.a,1],[c+s.a,1]],{endOpen:true,area:true}),
    series("f-right","f 外右",blue,[[c+s.a,0],[2,0]]),tests],-2,2,[{x:c-s.a,label:"u′ 连续"},{x:c+s.a,label:"u′ 连续"}]));
  }
  return out;
 }
 function fmt(x){
  if(x===null||x===undefined)return "—";if(typeof x!=="number")return String(x);
  if(!Number.isFinite(x))throw Error("非有限计算值");if(x===0)return "0";
  return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 function ledgers(d){
  const s=d.config,p=d.current,q=p.quadrature;
  let summary,conv,values;
  if(s.mode==="pairing"){
   summary=[["φ(c)",p.phi],["φ′(c)",p.dphi],["∫uφ′",p.lhs],["−∫vreg φ",p.regular],["−Jφ(c)",p.jump],["一阶右侧合计",p.rhs],["一阶有符号残差",p.residual],["漏δ的有符号残差",p.omitted],["∫uφ″",p.secondLhs],["2Kφ(c)−Jφ′(c)",p.secondRhs],["二阶有符号残差",p.secondResidual]];
   conv={headers:["每段n","∫uφ′","一阶RHS","一阶残差","漏δ残差","∫uφ″","二阶RHS","二阶残差"],rows:d.convergence.map(p=>[p.n,p.lhs,p.rhs,p.residual,p.omitted,p.secondLhs,p.secondRhs,p.secondResidual])};
   values=["uφ′","−vreg φ","uφ″"];
  }else if(s.mode==="box"){
   summary=[["半宽 ε",p.epsilon],["δε(φ)",p.action],["δc(φ)",p.delta],["配对差",p.error],["δε′(φ) 数值",p.prime],["δε′(φ) 边界精确式",p.primeBoundary],["δc′(φ)",p.deltaPrime],["导数配对差",p.primeError],["||Hε−H||1",p.H_L1],["||Hε−H||2",p.H_L2],["||Hε−H||∞",p.H_Linf],["||δε||1",p.delta_L1],["||δε||2",p.delta_L2],["||δε||∞",p.delta_Linf]];
   conv={headers:["ε","δε(φ)","δc(φ)","配对差","δε′(φ)","δc′(φ)","导数配对差","H的L1误差","H的L2误差","H的L∞误差"],rows:d.convergence.map(p=>[p.epsilon,p.action,p.delta,p.error,p.prime,p.deltaPrime,p.primeError,p.H_L1,p.H_L2,p.H_Linf])};
   values=["δεφ","−δεφ′"];
  }else{
   summary=[["−∫uφ″",p.lhs],["∫fφ",p.rhs],["有符号残差",p.residual],["总源质量",p.mass],["左侧远处斜率",p.leftSlope],["右侧远处斜率",p.rightSlope],["右斜率−左斜率",p.rightSlope-p.leftSlope]];
   conv={headers:["每段n","−∫uφ″","∫fφ","有符号残差"],rows:d.convergence.map(p=>[p.n,p.lhs,p.rhs,p.residual])};
   values=["−uφ″","fφ"];
  }
  const out=[{key:"summary",title:"当前配对与解析贡献",headers:["量","值"],rows:summary},
   {key:"convergence",title:s.mode==="box"?"改变盒核宽度：保持当前积分网格":"五种网格：恒等式残差不是严格误差上界",...conv},
   {key:"segments",title:"实际分段与各段贡献合计",headers:["段","左端","右端","h",...values.map(v=>"Σ "+v+"权重贡献")],rows:q.segments.map(p=>[p.k,p.lo,p.hi,p.h,...p.total])},
   {key:"nodes",title:"全部 Simpson 节点与权重贡献",headers:["段","i","x","h","整数权重","φ","φ′","φ″",...values,...values.map(v=>v+"·h·权重/3")],rows:q.nodes.map(p=>[p.segment,p.i,p.x,p.h,p.w,p.phi,p.dphi,p.ddphi,...p.values,...p.terms])}];
  if(s.mode==="poisson")out.push({key:"interfaces",title:"接口的准确单侧极限",headers:["位置","u左","u右","u′左","u′右","f左","f右"],rows:p.interfaces.map(p=>[p.x,p.left.u,p.right.u,p.left.v,p.right.v,p.left.f,p.right.f])});
  return out;
 }

 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function svg(q){
  const left=100,width=750,height=250,top=85,bottom=335,x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>bottom-height*(v-q.ymin)/(q.ymax-q.ymin);
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
  for(let i=0;i<5;i++){
   const v=q.ymin+(q.ymax-q.ymin)*i/4;
   s+='<path d="M'+left+' '+y(v)+'H'+(left+width)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-12)+'" y="'+(y(v)+5)+'" text-anchor="end">'+fmt(Number(v.toPrecision(4)))+'</text>';
  }
  const ticks=q.xTicks||Array.from({length:5},(_,i)=>q.xmin+(q.xmax-q.xmin)*i/4);
  for(const v of ticks)s+='<text x="'+x(v)+'" y="'+(bottom+28)+'" text-anchor="middle">'+fmt(Number(v.toPrecision(4)))+'</text>';
  if(q.ymin<=0&&q.ymax>=0)s+='<line data-zero="true" x1="'+left+'" x2="'+(left+width)+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke="currentColor" opacity=".7"/>';
  s+='<text x="'+left+'" y="65">'+esc(q.y)+'</text><text x="'+(left+width/2)+'" y="'+(bottom+63)+'" text-anchor="middle">'+esc(q.x)+'</text>';
  for(const series of q.series){
   if(series.area)s+='<rect data-area="'+series.key+'" x="'+x(series.points[0][0])+'" y="'+y(series.points[0][1])+'" width="'+(x(series.points[1][0])-x(series.points[0][0]))+'" height="'+(y(0)-y(series.points[0][1]))+'" fill="'+series.color+'" opacity=".12"/>';
   if(series.line)s+='<polyline data-series="'+series.key+'" points="'+series.points.map(p=>x(p[0])+','+y(p[1])).join(" ")+'" stroke="'+series.color+'" stroke-width="2" fill="none"/>';
   series.points.forEach((p,i)=>{const open=series.endOpen&&i===series.points.length-1;s+='<circle data-series="'+series.key+'" data-index="'+i+'" data-open="'+!!open+'" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="'+(series.endOpen?3.5:series.line?1.8:3.5)+'" fill="'+(open?"var(--bg,#faf7ef)":series.color)+'" stroke="'+series.color+'"/>';});
  }
  for(const [i,m]of (q.markers||[]).entries()){
   const px=x(m.x),right=px>700;
   s+='<line data-marker="'+i+'" x1="'+px+'" x2="'+px+'" y1="'+top+'" y2="'+bottom+'" stroke="currentColor" stroke-dasharray="5 5" opacity=".65"/><text x="'+(px+(right?-4:4))+'" y="'+(80+25*q.markers.slice(0,i).filter(p=>Math.abs(px-x(p.x))<110).length)+'" font-size="13" text-anchor="'+(right?'end':'start')+'">'+esc(m.label)+'</text>';
  }
  return s+"</svg>";
 }

 const STYLE=".distributions135{color:var(--fg,#273646)}.distributions135 .dist-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.distributions135 label{display:flex;flex-direction:column;gap:6px}.distributions135 input,.distributions135 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.distributions135 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.distributions135 button[aria-pressed=true]{outline:3px solid #478aaa}.distributions135 .dist-scroll{overflow:auto;max-width:100%;margin:16px 0}.distributions135 .dist-scroll:focus{outline:3px solid #478aaa}.distributions135 .dist-ledger{max-height:420px}.distributions135 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.distributions135 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.distributions135 th,.distributions135 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.distributions135 .dist-error{color:#c74b39}.distributions135 [hidden]{display:none!important}.distributions135 fieldset{margin:16px 0;padding:12px}.distributions135 details{margin:16px 0}.distributions135 summary{cursor:pointer;font-weight:600}.distributions135 .dist-legend{font-size:.95em}.distributions135 .dist-note{line-height:1.7}.distributions135 [hidden]{display:none!important}.distributions135 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("distributions135-style")){const style=doc.createElement("style");style.id="distributions135-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="distributions135"><h3>测试函数怎样看见跳跃、尖角和点源？</h3><p>先预测再揭示。所有测试函数支集都严格包含于 Ω=(-2,2)。数值积分只能检查选定测试；解析分部积分负责证明对全部测试成立。</p><div class="dist-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="dist-controls"><label>实验模式<select data-key="mode"><option value="pairing">跳跃与尖角的配对</option><option value="box">盒核逼近与范数</option><option value="poisson">一维 Poisson 盒源</option></select></label><label>测试函数形状<select data-key="test"><option value="even">偶 bump：B(z)</option><option value="tilted">倾斜 bump：B(z)(1+z/2)</option><option value="odd">奇 bump：zB(z)</option></select></label>'+
   field("c","跳点/源中心 c（Poisson±0.5，其余±1）","pairing box poisson")+field("m","测试中心 m（−1–1）","pairing box poisson")+field("r","测试半宽 r（0.2–0.8）","pairing box poisson")+field("n","每段 Simpson 子区间数（16–256偶数）","pairing box poisson")+
   field("slope","普通斜率 s（−2–2）","pairing")+field("corner","尖角系数 K（−2–2）","pairing")+field("jump","跳跃系数 J（−2–2）","pairing")+
   field("epsilon","盒核半宽 ε（0.0125–0.8）","box")+field("a","单位盒源半宽 a（0.2–1）","poisson")+field("A","附加斜率 A（−2–2）","poisson")+field("B","附加常数 B（−2–2）","poisson")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="dist-error" role="alert"></p><p role="status"></p><div class="dist-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".dist-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={pairing:"模型 u=sx+K|x−c|+JH(x−c)。一阶分布导数含 Jδc，二阶含 2Kδc+Jδc′。图中跳点两侧分别连线，H(c)取1；孤立点取值不改变分布。δ 本身没有被画成有限高度的函数。",box:"使用质量为1的盒核，不是 C∞ 磨光核。它把 H 变成连续斜坡。配对及 L1/L2/L∞ 是不同的比较方式；表中 H 的范数误差是解析值，不从屏幕像素估计。δ′ 的边界公式也不是任意两个分布相乘。",poisson:"单位盒源 f 在 [c−a,c+a) 内为1、外部为0，端点代表值不影响分布。图示特解加 Ax+B；没有边界条件时这些都是解。接口 u 与 u′ 连续，所以二阶导数无额外 δ。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="dist-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="dist-scroll dist-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>测试支集先等分为8段，再加入内部断点。每个实际分段使用当前 n 个偶数子区间，Simpson 权重为1、4、2、…、4、1；每个节点贡献=被积函数×h×权重/3。内部断点拆段，端点采用所在分支的准确单侧值；没有把端点挪开来掩盖跳跃。五种网格的残差是数值诊断，不能替代所有测试函数的证明。图形使用有限节点；完整计算节点在账本中。图表可聚焦后用方向键横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+QUESTIONS.map(q=>q[3]).join(" "):"";
  }
  fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.parentElement.dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
  }));
  container.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{
   const s=Object.assign({},DEFAULTS,PRESETS.find(p=>p.id===b.dataset.preset));fields.forEach(e=>e.value=s[e.dataset.key]);update();
  }));
  reveal.addEventListener("click",()=>{if(!reveal.disabled){revealed=true;update();}});
  container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
  update();
 }




 function selfTest(){
  let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};
  const p=snapshot().current;ck(p.phi===1,"height-one bump");ck(Math.abs(p.lhs+1)<1e-7,"step pairing");ck(p.jump===-1,"jump sign");
  const b=snapshot({test:"odd"}).current;ck(b.phi===0&&b.dphi===1/.8,"blind delta");ck(b.secondRhs===-1/.8,"visible delta prime");
  const k=snapshot({jump:0,corner:1}).current;ck(k.secondRhs===2,"corner second derivative");
  const e=snapshot({mode:"box"}).current;ck(e.H_Linf===.5&&e.H_L1===.05,"norm distinction");ck(e.delta_L1===1,"mass one");
  const f=snapshot({mode:"poisson"}).current;ck(Math.abs(f.residual)<1e-6,"Poisson pairing");ck(f.interfaces.every(p=>p.left.u===p.right.u&&p.left.v===p.right.v),"continuous interfaces");
  ck(fmt(1e-30)!=="0","small value");ck(testJet(config(),2).phi===0,"support inside domain");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,testJet,grid,cuts,quadrature,piece,pairing,box,poissonPoint,poisson,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
