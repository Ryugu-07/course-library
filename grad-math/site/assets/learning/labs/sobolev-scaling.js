(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("sobolev-scaling",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"hat",n:3,p:2,qkind:"critical",q:8,epsilon:.1,L:10,ell:1,A:1,b:0,ratio:.1});
 const PRESETS=Object.freeze([
  {id:"critical",label:"三维 H¹：临界 L⁶"},
  {id:"sub",label:"低于临界指数",qkind:"sub"},
  {id:"super",label:"高于临界指数",qkind:"super"},
  {id:"two",label:"二维 W¹,¹⋅⁵",n:2,p:1.5},
  {id:"moser",label:"p=n：峰值仍可增大",mode:"moser",n:2},
  {id:"zero",label:"零迹正弦",mode:"poincare"},
  {id:"constant",label:"非零常数：梯度看不到",mode:"poincare",A:0,b:1},
  {id:"cancel",label:"减均值与零迹不同",mode:"poincare",b:-2/Math.PI},
  {id:"trace",label:"边界层的迹",mode:"trace"}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["uε=ε⁻ᵃφ(x/ε) 的梯度 Lp 范数怎样缩放？",["ε^(n/p−a−1)","ε^(1−a−n/p)"],0,"导数额外带1/ε，体积换元贡献εⁿ。"],
  ["p<n、梯度预算固定，q=p* 时缩小帽子会怎样？",["Lq范数保持，而峰值增大","峰值和Lq范数都保持"],0,"临界积分预算与逐点高度是不同量。"],
  ["n=p≥2 时，固定梯度预算是否保证统一峰值上界？",["不能，Moser 族给出反例","能，直接把 p* 写成∞"],0,"临界情况需要不同于有限幂次的结论；一维W¹,¹另有特殊性。"],
  ["函数在 L² 内趋于0，边界迹是否必定趋于0？",["不一定，窄边界层会付出很大的梯度代价","必定，边界也是函数的一部分"],0,"迹由Sobolev范数控制，单独L²没有这个能力。"]
 ];
 function number(v,k,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(k+" 必须填写有限数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(k+" 必须在 "+lo+"–"+hi+" 内");return x;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode};
  if(!["hat","moser","poincare","trace"].includes(s.mode))throw Error("未知模式");
  if(s.mode==="hat"||s.mode==="moser"){
   s.n=number(p.n,"维数",2,6);if(!Number.isInteger(s.n))throw Error("维数必须是2–6的整数");
  }
  if(s.mode==="hat"){
   s.p=number(p.p,"p",1,s.n-.1);s.qkind=p.qkind;
   if(!["sub","critical","super","custom"].includes(s.qkind))throw Error("未知 q 选择");
   if(s.qkind==="custom")s.q=number(p.q,"q",1,1000);
   s.epsilon=number(p.epsilon,"帽支撑半径",1e-6,1);
  }
  if(s.mode==="moser")s.L=number(p.L,"对数集中参数 L",1,40);
  if(s.mode==="poincare"||s.mode==="trace")s.ell=number(p.ell,"区间长度",.2,10);
  if(s.mode==="poincare"){s.A=number(p.A,"正弦振幅",-2,2);s.b=number(p.b,"常数偏置",-2,2);}
  if(s.mode==="trace")s.ratio=number(p.ratio,"边界层宽度/区间长度",.01,1);
  return s;
 }
 function omega(n){return [0,2,Math.PI,4*Math.PI/3,Math.PI**2/2,8*Math.PI**2/15,Math.PI**3/6][n];}
 function factorial(n){let v=1;for(let j=2;j<=n;j++)v*=j;return v;}
 function rational(x){
  const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);const bits=v.getBigUint64(0),m=(bits&((1n<<52n)-1n))+(1n<<52n),e=Number((bits>>52n)&2047n)-1075;
  return e>=0?[m<<BigInt(e),1n]:[m,1n<<BigInt(-e)];
 }
 function exponent(n,p,q){
  const [P,D]=rational(p),[Q,E]=rational(q),N=BigInt(n),num=P*Q-N*D*Q+N*E*P,den=P*Q;
  return {value:Number(num)/Number(den),classification:num===0n?"critical":num>0n?"subcritical":"supercritical"};
 }
 function hat(s,epsilon=s.epsilon,qkind=s.qkind){
  const n=s.n,p=s.p,w=omega(n),pStar=n*p/(n-p),q=qkind==="sub"?p:qkind==="critical"?pStar:qkind==="super"?pStar+2:s.q;
  const ex=qkind==="critical"?{value:0,classification:"critical"}:exponent(n,p,q);
  const betaTerms=Array.from({length:n},(_,j)=>({j:j+1,factor:q+j+1,log:Math.log(q+j+1)})),logBeta=Math.log(factorial(n-1))-betaTerms.reduce((a,b)=>a+b.log,0);
  const logEpsilon=Math.log(epsilon),logAmplitude=(1-n/p)*logEpsilon-Math.log(w)/p,logVolume=Math.log(w)+n*logEpsilon;
  const logCoefficient=-Math.log(w)/p+(Math.log(n*w)+logBeta)/q,logLq=logCoefficient+ex.value*logEpsilon,gradientLog=(p*(logAmplitude-logEpsilon)+logVolume)/p;
  return {epsilon,n,p,q,qkind,pStar,omega:w,logBeta,beta:Math.exp(logBeta),betaTerms,exponent:ex.value,classification:ex.classification,logAmplitude,amplitude:Math.exp(logAmplitude),logVolume,volume:Math.exp(logVolume),logLq,lq:Math.exp(logLq),gradient:Math.exp(gradientLog),gradientLog,logCoefficient};
 }
 function moser(s,L=s.L){
  const n=s.n,S=n*omega(n),x=n*L,terms=[];let term=1,total=1;
  terms.push({j:0,term});
  for(let j=1;j<n;j++){term*=x/j;total+=term;terms.push({j,term});}
  const tail=Math.exp(-x)*total,lnPower=factorial(n)/(n**(n+1)*L)*(1-tail);
  return {L,n,S,radius:Math.exp(-L),peak:L**(1-1/n)/S**(1/n),gradient:1,lnPower,lnNorm:lnPower**(1/n),tail,terms,corePower:Math.exp(-n*L)*L**(n-1)/n,alphaThreshold:n*S**(1/(n-1))};
 }
 // Positive series avoids subtracting nearly identical incomplete-gamma values.
 function moment(k,h,n){
  let term=1/(k+1),sum=term,j=0;
  do{j++;term*=n*h/(k+j+1);sum+=term;}while(term>sum*2e-16&&j<100);
  if(j===100)throw Error("正项矩级数未收敛");
  return {value:Math.exp(-n*h)*h**(k+1)*sum,terms:j+1};
 }
 function shellIntegral(n,a,b){
  const h=b-a,parts=[];let value=0;
  for(let k=0;k<=n;k++){
   const choose=factorial(n)/(factorial(k)*factorial(n-k)),m=moment(k,h,n),v=Math.exp(-n*a)*choose*a**(n-k)*m.value;
   parts.push({k,choose,moment:m.value,terms:m.terms,contribution:v});value+=v;
  }
  return {value,parts};
 }
 function poincare(s,ell=s.ell){
  const mean=s.b+2*s.A/Math.PI,variance=s.A*s.A*(.5-4/Math.PI**2),norm2=ell*(mean*mean+variance),gradient2=s.A*s.A*Math.PI**2/(2*ell),C=ell/Math.PI;
  return {ell,mean,variance,norm2,norm:Math.sqrt(norm2),gradient2,gradient:Math.sqrt(gradient2),meanZeroNorm:Math.sqrt(ell*variance),traceLeft:s.b,traceRight:s.b,C,ratio:gradient2===0?null:Math.sqrt(norm2/gradient2),ratioStatus:gradient2===0?(norm2===0?"0/0 未定义":"分母0且函数非零"): "finite",zeroTrace:s.b===0,inequalityGap:ell*(s.b*s.b+4*s.A*s.b/Math.PI)};
 }
 function trace(s,ratio=s.ratio){
  const epsilon=ratio*s.ell;return {ratio,epsilon,norm2:epsilon/3,norm:Math.sqrt(epsilon/3),gradient2:1/epsilon,gradient:1/Math.sqrt(epsilon),traceLeft:1,traceRight:0,w12:Math.sqrt(epsilon/3+1/epsilon)};
 }
 function grid(lo,hi,n=200,extra=[]){return Array.from(new Set([...Array.from({length:n+1},(_,i)=>i===n?hi:lo+(hi-lo)*i/n),...extra.filter(x=>x>=lo&&x<=hi)])).sort((a,b)=>a-b);}
 function snapshot(raw={}){
  const s=config(raw),d={config:s};
  if(s.mode==="hat"){
   d.current=hat(s);d.nodes=grid(-6,0,200,[Math.log10(s.epsilon)]).map(x=>({log10Epsilon:x,...hat(s,10**x)}));
   d.comparisons=["sub","critical","super"].map(kind=>({kind,nodes:d.nodes.map(p=>hat(s,p.epsilon,kind))}));
   if(s.qkind==="custom")d.comparisons.push({kind:"custom",nodes:d.nodes});
  }else if(s.mode==="moser"){
   d.current=moser(s);d.nodes=grid(1,40,200,[s.L]).map(L=>moser(s,L));const ts=grid(0,s.L,200);d.shells=[];
   for(let i=0;i<ts.length-1;i++){
    const a=ts[i],b=ts[i+1],q=shellIntegral(s.n,a,b);d.shells.push({i,a,b,rOuter:Math.exp(-a),rInner:Math.exp(-b),gradientPower:(b-a)/s.L,lnPower:q.value/s.L,parts:q.parts});
   }
   d.shellSum=d.shells.reduce((v,q)=>v+q.lnPower,0)+d.current.corePower;d.shellResidual=d.shellSum-d.current.lnPower;
  }else if(s.mode==="poincare"){d.current=poincare(s);d.nodes=grid(.2,10,200,[s.ell]).map(ell=>poincare(s,ell));}
  else{d.current=trace(s);d.nodes=grid(-2,0,200,[Math.log10(s.ratio)]).map(x=>({log10Ratio:x,...trace(s,10**x)}));}
  return d;
 }
 function series(key,label,color,points,extra={}){return Object.assign({key,label,color,points,line:true},extra);}
 function plot(title,x,y,ss,xmin,xmax,markers=[]){
  const ys=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
  return {title,x,y,xmin,xmax,ymin:lo-pad,ymax:hi+pad,series:ss,markers};
 }
 function plots(d){
  const s=d.config,p=d.current,B="#268bd2",O="#cb6a16",G="#29966c",V="#9966bb";
  if(s.mode==="hat")return [
   plot("当前帽的支撑内放大图：边缘不会被漏采样","x/ε；实际支撑半径 ε="+fmt(s.epsilon),"u/A；实际峰值 A="+fmt(p.amplitude),[series("profile","归一化帽形",B,[[-1.2,0],[-1,0],[0,1],[1,0],[1.2,0]])],-1.2,1.2),
   plot("同一梯度预算下比较三个临界位置","log₁₀ ε；向左收缩","log₁₀ ||uε||q",d.comparisons.map((q,i)=>series(q.kind,["q=p","q=p*","q=p*+2","自选q"][i],[B,G,O,V][i],q.nodes.map(p=>[Math.log10(p.epsilon),p.logLq/Math.LN10]))),-6,0,[{x:Math.log10(s.epsilon),label:"当前 ε"}])
  ];
  if(s.mode==="moser")return [
   plot("临界集中：对数坐标分辨极窄的平台","t=log(1/r)；向右靠近原点","u",[
    series("u","Moser 函数",B,grid(0,1.2*s.L,200,[s.L]).map(t=>[t,Math.min(t,s.L)/(p.S*s.L)**(1/s.n)]))
   ],0,1.2*s.L,[{x:s.L,label:"平台开始；r=e⁻ᴸ"}]),
   plot("梯度保持为1，峰值仍随集中参数增大","L=log(1/ε)","范数与峰值",[
    series("peak","峰值",B,d.nodes.map(p=>[p.L,p.peak])),series("ln","Ln 范数",O,d.nodes.map(p=>[p.L,p.lnNorm])),series("gradient","梯度 Ln 范数",G,d.nodes.map(p=>[p.L,1]))
   ],1,40,[{x:s.L,label:"当前 L"}])
  ];
  if(s.mode==="poincare")return [
   plot("固定偏置与减均值：两种不同的约束","x/区间长度","u 与 u−平均值",[
    series("u","u=b+A sin(πx/ℓ)",B,grid(0,1).map(t=>[t,s.b+s.A*(t===0||t===1?0:Math.sin(Math.PI*t))])),
    series("centered","u−平均值",O,grid(0,1).map(t=>[t,s.A*((t===0||t===1?0:Math.sin(Math.PI*t))-2/Math.PI)]))
   ],0,1),
   plot("长度变大时，Poincaré 常数也变大","区间长度 ℓ","L2 范数与 C||u′||2",[
    series("norm","||u||2",B,d.nodes.map(p=>[p.ell,p.norm])),series("bound","(ℓ/π)||u′||2",O,d.nodes.map(p=>[p.ell,p.C*p.gradient])),series("centered","||u−平均值||2",G,d.nodes.map(p=>[p.ell,p.meanZeroNorm]))
   ],.2,10,[{x:s.ell,label:"当前长度"}])
  ];
  return [
   plot("L² 质量可以消失，左端迹仍然等于1","x/区间长度；层宽比例="+fmt(s.ratio),"vε",[
    series("layer","边界层",B,[[0,1],[s.ratio,0],...(s.ratio<1?[[1,0]]:[])])
   ],0,1),
   plot("保持边界值的代价：梯度范数发散","log₁₀(ε/ℓ)；向左变窄","log₁₀ 范数",[
    series("norm","L2",B,d.nodes.map(p=>[p.log10Ratio,Math.log10(p.norm)])),
    series("gradient","梯度 L2",O,d.nodes.map(p=>[p.log10Ratio,Math.log10(p.gradient)])),
    series("trace","左端迹的绝对值",G,d.nodes.map(p=>[p.log10Ratio,0]))
   ],-2,0,[{x:Math.log10(s.ratio),label:"当前比例"}])
  ];
 }
 function fmt(x){
  if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
  if(!Number.isFinite(x))throw Error("非有限计算值");if(x===0)return "0";
  return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 function ledgers(d){
  const s=d.config,p=d.current;let summary,nodes,extra=[];
  if(s.mode==="hat"){
   summary=[["维数",s.n],["p",s.p.toString()],["当前q",p.q.toString()],["p*",p.pStar.toString()],["分类",p.classification],["ε指数",p.exponent],["球体积ωn",p.omega],["支撑体积",p.volume],["峰值",p.amplitude],["梯度范数",p.gradient],["Lq范数",p.lq],["Beta系数",p.beta],["log Beta",p.logBeta]];
   const row=p=>[p.epsilon,p.q.toString(),p.exponent,p.volume,p.amplitude,p.gradient,p.lq,p.logAmplitude,p.logLq];
   nodes={headers:["ε","q","指数","支撑体积","峰值","梯度范数","Lq","ln峰值","lnLq"],rows:d.nodes.map(row)};
   extra.push({key:"beta",title:"整数维度下的 Beta 乘积",headers:["j","q+j","ln(q+j)"],rows:p.betaTerms.map(t=>[t.j,t.factor,t.log])});
   for(const q of d.comparisons)extra.push({key:"compare-"+q.kind,title:"对照曲线 "+q.kind+" 的全部节点",...nodes,rows:q.nodes.map(row)});
  }else if(s.mode==="moser"){
   summary=[["维数n=p",s.n],["L",p.L],["平台半径",p.radius],["峰值",p.peak],["梯度Ln范数",p.gradient],["Ln范数",p.lnNorm],["Ln范数的n次方",p.lnPower],["平台的n次积分",p.corePower],["壳层＋平台积分",d.shellSum],["两种公式的差",d.shellResidual],["指数可积临界系数",p.alphaThreshold]];
   nodes={headers:["L","平台半径","峰值","梯度Ln","Ln","Ln的n次方"],rows:d.nodes.map(p=>[p.L,p.radius,p.peak,p.gradient,p.lnNorm,p.lnPower])};
   extra.push({key:"shells",title:"全部对数壳层：梯度与函数积分",headers:["i","t左","t右","外半径","内半径","梯度n次贡献","函数n次贡献"],rows:d.shells.map(t=>[t.i,t.a,t.b,t.rOuter,t.rInner,t.gradientPower,t.lnPower])});
   extra.push({key:"moments",title:"每个壳层的正项矩分解",headers:["壳层","k","二项式系数","平移矩","级数项数","未除L的贡献"],rows:d.shells.flatMap(t=>t.parts.map(q=>[t.i,q.k,q.choose,q.moment,q.terms,q.contribution]))});
   extra.push({key:"gamma",title:"整体积分中的有限和",headers:["j","(nL)^j/j!"],rows:p.terms.map(t=>[t.j,t.term])});
  }else if(s.mode==="poincare"){
   summary=[["均值",p.mean],["左端迹",p.traceLeft],["右端迹",p.traceRight],["是否满足零迹",p.zeroTrace],["L2范数",p.norm],["梯度L2",p.gradient],["减均值后L2",p.meanZeroNorm],["零迹最优常数ℓ/π",p.C],["范数比状态",p.ratioStatus],["范数比",p.ratio],["||u||²−C²||u′||²",p.inequalityGap]];
   nodes={headers:["ℓ","L2","梯度L2","减均值L2","ℓ/π","实际范数比","差值"],rows:d.nodes.map(p=>[p.ell,p.norm,p.gradient,p.meanZeroNorm,p.C,p.ratio,p.inequalityGap])};
  }else{
   summary=[["边界层宽ε",p.epsilon],["L2范数",p.norm],["梯度L2",p.gradient],["W1,2范数",p.w12],["左端迹",p.traceLeft],["右端迹",p.traceRight]];
   nodes={headers:["宽度比例","ε","L2","梯度L2","W1,2","左端迹","右端迹"],rows:d.nodes.map(p=>[p.ratio,p.epsilon,p.norm,p.gradient,p.w12,p.traceLeft,p.traceRight])};
  }
  return [{key:"summary",title:"当前条件与范数账本",headers:["量","值"],rows:summary},{key:"nodes",title:"整条参数曲线的全部节点",...nodes},...extra];
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

 const STYLE=".sobolev136{color:var(--fg,#273646)}.sobolev136 .sob-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.sobolev136 label{display:flex;flex-direction:column;gap:6px}.sobolev136 input,.sobolev136 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.sobolev136 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.sobolev136 button[aria-pressed=true]{outline:3px solid #478aaa}.sobolev136 .sob-scroll{overflow:auto;max-width:100%;margin:16px 0}.sobolev136 .sob-scroll:focus{outline:3px solid #478aaa}.sobolev136 .sob-ledger{max-height:420px}.sobolev136 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.sobolev136 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.sobolev136 th,.sobolev136 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.sobolev136 .sob-error{color:#c74b39}.sobolev136 [hidden]{display:none!important}.sobolev136 fieldset{margin:16px 0;padding:12px}.sobolev136 details{margin:16px 0}.sobolev136 summary{cursor:pointer;font-weight:600}.sobolev136 .sob-legend{font-size:.95em}.sobolev136 .sob-note{line-height:1.7}.sobolev136 [hidden]{display:none!important}.sobolev136 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("sobolev136-style")){const style=doc.createElement("style");style.id="sobolev136-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="sobolev136"><h3>导数预算能控制哪些量？</h3><p>先预测，再揭示。帽函数比较临界幂次，Moser 族展示 n=p≥2 的集中，区间模型分别检查零迹、均值和边界层。</p><div class="sob-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="sob-controls"><label>实验模式<select data-key="mode"><option value="hat">帽函数与临界缩放</option><option value="moser">n=p：Moser 集中</option><option value="poincare">Poincaré 与常数自由度</option><option value="trace">边界层与迹</option></select></label>'+
   field("n","维数 n（2–6整数）","hat moser")+field("p","p（1–n−0.1）","hat")+
   '<label data-modes="hat">目标 q<select data-key="qkind"><option value="sub">q=p</option><option value="critical">q=p*（保留符号关系）</option><option value="super">q=p*+2</option><option value="custom">手动输入 q</option></select></label>'+
   field("q","手动 q（1–1000）","hat")+field("epsilon","帽支撑半径 ε（10⁻⁶–1）","hat")+field("L","L=log(1/ε)（1–40）","moser")+
   field("ell","区间长度 ℓ（0.2–10）","poincare trace")+field("A","正弦振幅 A（−2–2）","poincare")+field("b","常数偏置 b（−2–2）","poincare")+field("ratio","边界层宽 ε/ℓ（0.01–1）","trace")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="sob-error" role="alert"></p><p role="status"></p><div class="sob-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".sob-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={hat:"帽的梯度范数解析值为1。图中第一幅按当前支撑放大，并以峰值归一化；实际半径、体积和峰值在坐标说明及账本中。q=p* 选项使用符号临界关系；手动输入按该数值计算，近临界小指数不会被任意阈值抹为0。缩放模型不证明一般嵌入，也不输出最优 Sobolev 常数。",moser:"Moser 族只用于 n=p≥2，不能套到一维 W¹,¹。平台半径 e⁻ᴸ 越来越小，峰值增大但梯度 Ln 范数保持1。图用 t=log(1/r) 分辨窄平台；Ln 的整体公式与全部200壳层的正项积分独立对照，差值为数值诊断。指数可积临界系数在正文中区分必要性反例与完整定理。",poincare:"u=b+A sin(πx/ℓ)。零迹要求 b=0；减均值通常不等于零迹。C=ℓ/π 是区间零迹的最优常数；无零迹时，本例可能碰巧满足不等式，也可能违反，不能由一次计算宣布一般定理。梯度为0时不会执行除零。",trace:"vε=(1−x/ε)+ 在区间[0,ℓ]上。左端迹保持1，而 L² 范数随 ε 缩小趋零；梯度范数却发散。迹不是给 L² 等价类任意补一个端点值，需由 Sobolev 结构定义。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="sob-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="sob-scroll sob-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>所有参数曲线使用201个基础节点并加入当前参数，所有折点明确入图。当前帽的 Beta 因子使用整数维度的有限乘积；Moser 积分同时保留有限和、每个壳层、正项矩分解。有限图与账本核对具体函数族；正文的极限论证和定理条件不可省略。图表可聚焦后用方向键横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   container.querySelector('[data-key="q"]').parentElement.hidden=raw.mode!=="hat"||raw.qkind!=="custom";
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+QUESTIONS.map(q=>q[3]).join(" "):"";
  }
  fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.closest("[data-question]").dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
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
  const h=snapshot().current;ck(h.pStar===6&&h.exponent===0,"symbolic critical");ck(Math.abs(h.beta-1/252)<1e-16,"integer Beta");ck(Math.abs(h.gradient-1)<1e-14,"gradient budget");
  ck(exponent(3,2,6-Number.EPSILON*4).classification==="subcritical","near lower boundary");ck(exponent(3,2,6+Number.EPSILON*4).classification==="supercritical","near upper boundary");
  const m=snapshot({mode:"moser",n:2});ck(Math.abs(m.current.alphaThreshold-4*Math.PI)<1e-13,"Moser coefficient");ck(Math.abs(m.shellResidual)<1e-13,"positive shells");
  const z=snapshot({mode:"poincare"}).current;ck(z.zeroTrace&&Math.abs(z.ratio-z.C)<1e-14,"Dirichlet sine");ck(snapshot({mode:"poincare",A:0,b:1}).current.ratio===null,"zero denominator");
  const t=snapshot({mode:"trace"}).current;ck(t.traceLeft===1&&t.traceRight===0,"trace");ck(Math.abs(t.norm2-.1/3)<1e-15,"boundary layer integral");
  ck(fmt(1e-30)!=="0","small values");return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,omega,factorial,rational,exponent,hat,moser,moment,shellIntegral,poincare,trace,grid,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
