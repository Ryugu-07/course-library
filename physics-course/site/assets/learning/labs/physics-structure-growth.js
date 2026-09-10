(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-structure-growth",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"growth",omegaM:.3,a:.5,k:.1,kEq:.01,ns:.965});
 const PRESETS=Object.freeze([
  {id:"lcdm",label:"物质＋Λ：两种归一化",mode:"growth",omegaM:.3,a:.5},
  {id:"eds",label:"纯物质解析边界",mode:"growth",omegaM:1,a:.5},
  {id:"future",label:"Λ 主导的未来",mode:"growth",omegaM:.3,a:10},
  {id:"low-matter",label:"更少物质",mode:"growth",omegaM:.01,a:1},
  {id:"transfer",label:"转移函数与波数换算",mode:"transfer",k:.1,kEq:.01},
  {id:"large",label:"有限大尺度修正",mode:"transfer",k:1e-8,kEq:.1},
  {id:"power",label:"谱形状与平方增长",mode:"power",omegaM:.3,a:.5,k:.1,kEq:.01,ns:.965}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["纯物质模型的增长模与衰减模是什么？",["a 与 a⁻³ᐟ²","a 与常数"],0,"两个初始条件决定增长模与衰减模的混合。"],
  ["今天都归一化为1，Λ模型在过去的 D 更大，说明什么？",["它从过去到今天增长得较少","它在相同早期振幅下增长更快"],0,"必须同时检查早期归一化 G 与今天归一化 D=G/G(1)。"],
  ["k/keq=10 时，本页 BBKS 的 q 是多少？",["10/13.41，约0.746","10"],0,"物理 equality 波数与拟合尺度不是同一个量。"],
  ["振幅乘 D，功率谱乘什么？",["D²；功率是二阶统计量","D；谱和振幅没有区别"],0,"P 的量纲还包含体积，无量纲每对数波数功率为 k³P/(2π²)。"]
 ];
 function number(v,key,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(key+" 必须填写有限数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(key+" 必须在 "+lo+"–"+hi+" 内");return x;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode};
  if(!["growth","transfer","power"].includes(s.mode))throw Error("未知模式");
  if(s.mode!=="transfer"){s.omegaM=number(p.omegaM,"今天 Ωm",.01,1);s.omegaLambda=1-s.omegaM;s.a=number(p.a,"尺度因子 a",.01,10);}
  if(s.mode!=="growth"){s.k=number(p.k,"k（Mpc⁻¹）",1e-8,10);s.kEq=number(p.kEq,"keq（Mpc⁻¹）",1e-4,.1);}
  if(s.mode==="power")s.ns=number(p.ns,"谱指数 ns",.8,1.2);
  return s;
 }
 function quadrature(f,keep=true,options={}){
  const atol=options.atol===undefined?2e-13:options.atol,rtol=options.rtol===undefined?2e-11:options.rtol,depth=options.depth===undefined?28:options.depth;
  if(!Number.isFinite(atol)||atol<=0||!Number.isFinite(rtol)||rtol<0||!Number.isInteger(depth)||depth<0||depth>28)throw Error("非法积分控制参数");
  let evaluations=0,accepted=0,failed=0;const panels=[];
  const at=x=>{evaluations++;const y=f(x);if(!Number.isFinite(y))throw Error("被积函数非有限");return y;};
  let result;
  try{
   function visit(lo,hi,fa,fm,fb,coarse,budget,left){
    const mid=(lo+hi)/2,lm=(lo+mid)/2,rm=(mid+hi)/2,fl=at(lm),fr=at(rm);
    const sl=(mid-lo)*(fa+4*fl+fm)/6,sr=(hi-mid)*(fm+4*fr+fb)/6,refined=sl+sr,error=Math.abs(refined-coarse)/15;
    const ok=error<=budget+rtol*Math.abs(refined);
    if(ok||left===0||accepted>=32768){
     accepted++;if(!ok)failed++;
     const value=refined+(refined-coarse)/15;
     if(keep)panels.push({lo,hi,fa,fl,fm,fr,fb,coarse,refined,error,value,converged:ok});
     return {value,error};
    }
    const l=visit(lo,mid,fa,fl,fm,sl,budget/2,left-1),r=visit(mid,hi,fm,fr,fb,sr,budget/2,left-1);
    return {value:l.value+r.value,error:l.error+r.error};
   }
   result={value:0,error:0};
   for(let i=0;i<16;i++){const lo=i/16,hi=(i+1)/16,fa=at(lo),fm=at((lo+hi)/2),fb=at(hi),q=visit(lo,hi,fa,fm,fb,(hi-lo)*(fa+4*fm+fb)/6,atol/16,depth);result.value+=q.value;result.error+=q.error;}
  }catch(e){return {status:"unresolved",value:null,error:null,evaluations,accepted,failed,panels,message:e.message};}
  return Object.assign({status:failed?"unresolved":"finite",evaluations,accepted,failed,panels,atol,rtol},result);
 }

 const growthCache=new Map();
 function background(s,a){const b=s.omegaLambda*a**3/s.omegaM,omega=1/(1+b);return {a,b,omega,E:Math.sqrt(s.omegaM/a**3+s.omegaLambda),dlnH:-1.5*omega};}
 function growth(s,a,keep=false){
  const key=s.omegaM+":"+a;let d=growthCache.get(key);
  if(!d){
   const b=background(s,a),integral=quadrature(u=>2*u**4/(1+b.b*u**6)**1.5,true),status=integral.status;
   let g=null,G=null,f=null,V=null;
   if(status==="finite"){
    g=s.omegaLambda===0?1:2.5*Math.sqrt(1+b.b)*integral.value;
    G=a*g;f=s.omegaLambda===0?1:-1.5*b.omega+2.5*b.omega/g;V=f*G;
   }
   d=Object.assign(b,{g,G,f,V,status,integral});
   if(growthCache.size>=2048)growthCache.delete(growthCache.keys().next().value);growthCache.set(key,d);
  }
  if(keep)return d;
  return Object.assign({},d,{integral:Object.assign({},d.integral,{panels:[]})});
 }
 function growthPoint(s,a,today,keep=false){
  const p=growth(s,a,keep);
  return Object.assign({},p,{D:p.G===null||today.G===null?null:p.G/today.G,edsG:a,edsD:a,edsf:1,approxF:p.omega**.55,approxError:p.f===null?null:p.omega**.55-p.f});
 }
 function derivative(x,state,s){
  const omega=background(s,Math.exp(x)).omega;
  return [state[1],-(2-1.5*omega)*state[1]+1.5*omega*state[0]];
 }
 function rk4(s,target,N){
  if(!Number.isInteger(N)||N<1||N>4096)throw Error("RK4 步数须为1–4096整数");
  number(target,"RK4 目标 a",.01,10);
  const initial=growth(s,.01),exact=growth(s,target),rows=[];
  if(initial.status!=="finite"||exact.status!=="finite")return {status:"unresolved",N,rows};
  let state=[initial.G,initial.V];const x0=Math.log(.01),x1=Math.log(target),h=(x1-x0)/N;
  if(target!==.01)for(let i=0;i<N;i++){
   const x=x0+i*h,k1=derivative(x,state,s);
   const y2=state.map((v,j)=>v+h*k1[j]/2),k2=derivative(x+h/2,y2,s);
   const y3=state.map((v,j)=>v+h*k2[j]/2),k3=derivative(x+h/2,y3,s);
   const y4=state.map((v,j)=>v+h*k3[j]),k4=derivative(x+h,y4,s);
   const next=state.map((v,j)=>v+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
   rows.push({i,x,a:Math.exp(x),h,start:state.slice(),y2,y3,y4,k1,k2,k3,k4,end:next.slice(),endA:Math.exp(x+h)});
   state=next;
  }
  return {status:"finite",N,steps:rows.length,h,initial:[initial.G,initial.V],G:state[0],V:state[1],f:state[1]/state[0],errorG:state[0]-exact.G,errorV:state[1]-exact.V,relativeG:(state[0]-exact.G)/exact.G,rows};
 }
 const QFACTOR=13.41,KSTAR=.05;
 function bbks(q){
  number(q,"BBKS q",0,1e8);if(q===0)return 1;
  return Math.log1p(2.34*q)/(2.34*q)/(1+3.89*q+(16.1*q)**2+(5.46*q)**3+(6.71*q)**4)**.25;
 }
 function transferPoint(s,k){
  const ratio=k/s.kEq,q=ratio/QFACTOR,T=bbks(q);
  return {k,ratio,q,T,logT:Math.log10(T),oneMinusT:1-T,low:1-2.1425*q,high:Math.log(2.34*q)/(2.34*6.71*q*q)};
 }
 function spectrumPoint(s,k,D,Tstar){
  const p=transferPoint(s,k),logPower=2*Math.log(D)+s.ns*Math.log(k/KSTAR)+2*Math.log(p.T/Tstar),logDelta=logPower+3*Math.log(k/KSTAR);
  return Object.assign(p,{power:Math.exp(logPower),delta:Math.exp(logDelta),logPower:logPower/Math.LN10,logDelta:logDelta/Math.LN10,unfiltered:Math.exp(2*Math.log(D)+s.ns*Math.log(k/KSTAR))});
 }
 function grid(lo,hi,n,extra=[]){return Array.from(new Set([lo,hi,...Array.from({length:n-1},(_,i)=>Math.exp(Math.log(lo)+(Math.log(hi)-Math.log(lo))*(i+1)/n)),...extra])).sort((a,b)=>a-b);}
 function snapshot(raw={}){
  const s=config(raw);
  if(s.mode==="growth"){
   const today=growth(s,1),current=growthPoint(s,s.a,today,true),nodes=grid(.01,10,400,[1,s.a]).map(a=>growthPoint(s,a,today));
   const integration=[16,32,64,128].map(N=>rk4(s,s.a,N));
   return {config:s,today,current,nodes,integration};
  }
  // The transfer curve has a fixed k/keq window, expanded to include the current k.
  const lo=Math.min(1e-4*s.kEq,s.k),hi=Math.max(1e5*s.kEq,s.k),ks=grid(lo,hi,400,[s.k,s.kEq,QFACTOR*s.kEq,...(s.mode==="power"?[KSTAR]:[])]);
  if(s.mode==="transfer")return {config:s,current:transferPoint(s,s.k),nodes:ks.map(k=>transferPoint(s,k))};
  const today=growth(s,1),grow=growthPoint(s,s.a,today,true);
  if(grow.status!=="finite")return {config:s,status:"unresolved",current:null,nodes:[],growth:grow};
  const Tstar=bbks(KSTAR/(QFACTOR*s.kEq));
  return {config:s,growth:grow,Tstar,current:spectrumPoint(s,s.k,grow.D,Tstar),nodes:ks.map(k=>spectrumPoint(s,k,grow.D,Tstar))};
 }
 function fmt(v){
  if(v===null||v===undefined)return "—";if(typeof v!=="number")return String(v);if(v===0)return "0";
  return Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(8):String(Number(v.toPrecision(10)));
 }
 function plots(d){
  if(!d.nodes.length)return [];
  const s=d.config,colors=["#268bd2","#cb6a16","#29966c","#9966bb"],key=s.mode==="growth"?"a":"k";
  const make=(id,title,y,defs,bounds={})=>{
   const series=defs.map((v,i)=>({key:v[0],label:v[1],color:colors[i],line:true,points:d.nodes.filter(p=>v[2](p)!==null).map(p=>[Math.log10(p[key]),v[2](p)])}));
   const xs=series.flatMap(q=>q.points.map(p=>p[0])),ys=series.flatMap(q=>q.points.map(p=>p[1]));let lo=Math.min(...ys),hi=Math.max(...ys);
   if(hi===lo){lo-=1;hi+=1;}
   return Object.assign({key:id,title,x:key==="a"?"log₁₀ a；a=1 是今天":"log₁₀(k / Mpc⁻¹)",y,xmin:Math.min(...xs),xmax:Math.max(...xs),ymin:lo-.05*(hi-lo),ymax:hi+.05*(hi-lo),series,markers:[{x:Math.log10(s[key]),label:"当前"}]},bounds);
  };
  if(s.mode==="growth")return [
   make("early","相同早期归一化：比较 G/a","G/a；早期极限为1",[["g","物质＋Λ",p=>p.g],["one","纯物质",()=>1]],{ymin:0,ymax:1.02}),
   make("today","今天同为1：D 更大不代表增长更快","log₁₀[D(a)=G(a)/G(1)]",[["D","物质＋Λ",p=>p.D===null?null:Math.log10(p.D)],["edsD","纯物质",p=>Math.log10(p.a)]]),
   make("rate","增长率：精确模型与经验近似","f=d ln G/d ln a",[["f","积分模型 f",p=>p.f],["approxF","Ωm(a)^0.55 近似",p=>p.approxF]],{ymin:0,ymax:1.02})
  ];
  if(s.mode==="transfer")return [
   make("transfer","转移函数：大尺度极限不是有限点恒等于1","T(k)",[["T","BBKS 教学形状",p=>p.T]],{ymin:0,ymax:1.02}),
   make("tail","保留微小的正转移，不截成零","log₁₀ T(k)",[["logT","BBKS 教学形状",p=>p.logT]])
  ];
  return [
   make("power","功率乘 D²：给定谱形状的归一化比较","log₁₀[P(k,a)/P(k*,1)]",[["logPower","含转移函数",p=>p.logPower],["unfiltered","仅幂律作参照",p=>Math.log10(p.unfiltered)]]),
   make("delta","每个对数波数区间，还要乘 k³","log₁₀[Δ²(k,a)/Δ²(k*,1)]",[["logDelta","无量纲功率比",p=>p.logDelta]])
  ];
 }
 function panelTable(p){
  return {key:"panels",title:"当前 G/a 积分的全部面板",headers:["u左","u右","f左","f1/4","f中","f3/4","f右","粗Simpson","细Simpson","误差估计","修正值","达标"],rows:p.integral.panels.map(q=>[q.lo,q.hi,q.fa,q.fl,q.fm,q.fr,q.fb,q.coarse,q.refined,q.error,q.value,q.converged])};
 }
 function ledgers(d){
  const s=d.config,p=d.current;
  if(s.mode==="growth")return [
   {key:"summary",title:"当前增长与归一化",headers:["量","值"],rows:[["今天 Ωm",s.omegaM],["今天 ΩΛ=1−Ωm",s.omegaLambda],["a",s.a],["E(a)",p.E],["Ωm(a)",p.omega],["G（早期 G/a→1）",p.G],["G/a",p.g],["G(1)",d.today.G],["D=G/G(1)",p.D],["f",p.f],["Ωm(a)^0.55",p.approxF],["近似减精确 f",p.approxError],["积分状态",p.status]]},
   {key:"nodes",title:"全部增长节点与积分诊断",headers:["a","E","Ωm(a)","G","G/a","D=G/G1","f","Ωm^0.55","近似f误差","V=dG/dlna","积分","估计误差","状态"],rows:d.nodes.map(p=>[p.a,p.E,p.omega,p.G,p.g,p.D,p.f,p.approxF,p.approxError,p.V,p.integral.value,p.integral.error,p.status])},
   panelTable(p),
   {key:"convergence",title:"同一增长初值的 RK4 步长比较",headers:["请求步数","实际步数","Δln a","G","V","f","G误差","G相对误差","V误差","状态"],rows:d.integration.map(q=>[q.N,q.steps,q.h,q.G,q.V,q.f,q.errorG,q.relativeG,q.errorV,q.status])},
   ...d.integration.map(q=>({key:"rk"+q.N,title:"RK4 "+q.N+" 步的全部阶段",headers:["i","ln a","a左","Δln a","G左","V左","G2","V2","G3","V3","G4","V4","k1G","k1V","k2G","k2V","k3G","k3V","k4G","k4V","G右","V右","a右"],rows:q.rows.map(p=>[p.i,p.x,p.a,p.h,...p.start,...p.y2,...p.y3,...p.y4,...p.k1,...p.k2,...p.k3,...p.k4,...p.end,p.endA])}))
  ];
  if(s.mode==="transfer")return [
   {key:"summary",title:"波数约定与当前转移",headers:["量","值"],rows:[["k / Mpc⁻¹",p.k],["keq / Mpc⁻¹",s.kEq],["k/keq",p.ratio],["q=k/(13.41 keq)",p.q],["T",p.T],["1−T",p.oneMinusT],["log10 T",p.logT]]},
   {key:"nodes",title:"全部转移节点",headers:["k/Mpc⁻¹","k/keq","q","T","1−T","log10T","小q一阶近似","大q渐近式"],rows:d.nodes.map(p=>[p.k,p.ratio,p.q,p.T,p.oneMinusT,p.logT,p.low,p.high])}
  ];
  if(!p)return [{key:"summary",title:"模型状态",headers:["量","值"],rows:[["积分","unresolved"]]}];
  return [
   {key:"summary",title:"条件化谱比：分清两种归一化",headers:["量","值"],rows:[["a",s.a],["D(a)",d.growth.D],["k* / Mpc⁻¹",KSTAR],["ns",s.ns],["T(k*)",d.Tstar],["T(k)",p.T],["P(k,a)/P(k*,1)",p.power],["Δ²(k,a)/Δ²(k*,1)",p.delta]]},
   {key:"nodes",title:"全部功率谱节点",headers:["k/Mpc⁻¹","k/keq","q","T","P/P*","Δ²/Δ*²","log10(P/P*)","log10(Δ²/Δ*²)","D²(k/k*)^ns参照"],rows:d.nodes.map(p=>[p.k,p.ratio,p.q,p.T,p.power,p.delta,p.logPower,p.logDelta,p.unfiltered])},
   panelTable(d.growth)
  ];
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
   s+='<line data-marker="'+i+'" x1="'+px+'" x2="'+px+'" y1="'+top+'" y2="'+bottom+'" stroke="currentColor" stroke-dasharray="5 5" opacity=".65"/><text x="'+(px+(right?-4:4))+'" y="'+(i&&Math.abs(px-x(q.markers[i-1].x))<100?105:80)+'" font-size="13" text-anchor="'+(right?'end':'start')+'">'+esc(m.label)+'</text>';
  }
  return s+"</svg>";
 }

 const STYLE=".growth133{color:var(--fg,#273646)}.growth133 .growth-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.growth133 label{display:flex;flex-direction:column;gap:6px}.growth133 input,.growth133 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.growth133 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.growth133 button[aria-pressed=true]{outline:3px solid #478aaa}.growth133 .growth-scroll{overflow:auto;max-width:100%;margin:16px 0}.growth133 .growth-scroll:focus{outline:3px solid #478aaa}.growth133 .growth-ledger{max-height:420px}.growth133 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.growth133 table{min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.growth133 th,.growth133 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.growth133 .growth-error{color:#c74b39}.growth133 [hidden]{display:none!important}.growth133 fieldset{margin:16px 0;padding:12px}.growth133 details{margin:16px 0}.growth133 summary{cursor:pointer;font-weight:600}.growth133 .growth-legend{font-size:.95em}.growth133 .growth-note{line-height:1.7}.growth133 [hidden]{display:none!important}.growth133 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("growth133-style")){const style=doc.createElement("style");style.id="growth133-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="growth133"><h3>结构增长：先固定归一化，再比较变化</h3><p>先预测，再揭示；错误预测也可继续。ΩΛ=1−Ωm 明确为剩余量；不会把任意两项偷偷归一化。增长模式是无辐射的平坦物质＋Λ模型；转移与谱模式使用独立的教学形状参数，不替代完整早期宇宙求解。</p><div class="growth-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="growth-controls"><label>实验模式<select data-key="mode"><option value="growth">增长、归一化与积分误差</option><option value="transfer">转移函数与波数</option><option value="power">条件化功率谱比</option></select></label>'+
   field("omegaM","今天 Ωm（0.01–1）","growth power")+field("a","a（0.01–10；今天为1）","growth power")+field("k","k（10⁻⁸–10 Mpc⁻¹）","transfer power")+field("kEq","keq（10⁻⁴–0.1 Mpc⁻¹）","transfer power")+field("ns","谱指数 ns（0.8–1.2）","power")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="growth-error" role="alert"></p><p role="status"></p><div class="growth-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".growth-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   result.innerHTML='<p>'+(d.config.mode==="growth"?"G 的定义是早期 G/a→1；D=G/G(1) 固定今天为1；f=d ln G/d ln a 不受常数归一化影响。RK4 用积分模型提供的同一初值，误差是相对独立积分结果的差，而非仅相邻步数之间的差。":"所有 k 与 keq 均用 Mpc⁻¹。keq 在这里作为可独立调节的形状参数；改变 Ωm 而固定 keq 是分离机制的教学比较，不能自动称为固定其它宇宙参数的自洽 ΛCDM 拟合。谱模式只给相对幅度，不输出绝对 σ8。")+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="growth-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="growth-scroll growth-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>每幅曲线有401个对数网格节点，另加入当前点与相应参考点；全部节点均可查。增长积分经 a′=a u² 换元到0–1，用16段起始区间的自适应 Simpson，绝对预算2×10⁻¹³、相对预算2×10⁻¹¹；嵌入误差是数值诊断，不是严格区间证书。finite 表示本次积分达标，unresolved 表示未达标，不等于发散。RK4 的16/32/64/128步展示离散误差，每步四阶段都在账本中；当前a=0.01时无需演化，实际步数为0。图表可聚焦后用方向键横向滚动。</p>';
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
  const e=snapshot({omegaM:1});ck(e.current.D===.5&&e.current.f===1,"EdS");
  const d=snapshot();ck(d.current.D>.5&&d.current.G<.5,"normalization");
  ck(bbks(0)===1&&bbks(1e-9)<1,"finite large scale");
  ck(snapshot({mode:"transfer"}).current.q===10/13.41,"q conversion");
  const p=snapshot({mode:"power",a:1,k:.05});ck(Math.abs(p.current.power-1)<1e-14,"pivot normalization");
  ck(rk4(config(),.01,16).steps===0,"zero interval");
  ck(quadrature(u=>Math.exp(20*u),true,{depth:0}).status==="unresolved","depth explicit");
  ck(fmt(1e-20)!=="0","tiny transfer");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,QFACTOR,KSTAR,config,background,quadrature,growth,growthPoint,derivative,rk4,bbks,transferPoint,spectrumPoint,grid,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
