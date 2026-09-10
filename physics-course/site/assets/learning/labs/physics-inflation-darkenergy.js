(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-inflation-darkenergy",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"kinematic",epsilon:0,N:60,u0:15,v0:0,omegaM:.3,w:-1,a:1});
 const PRESETS=Object.freeze([
  {id:"de-sitter",label:"恒 H：几何基准",mode:"kinematic",epsilon:0,N:60},
  {id:"power-law",label:"加速但 H 下降",mode:"kinematic",epsilon:.1,N:60},
  {id:"coasting",label:"加速边界 ε=1",mode:"kinematic",epsilon:1,N:60},
  {id:"field",label:"二次势：从静止到退出",mode:"field",u0:15,v0:0},
  {id:"uphill",label:"初始向势能更高处运动",mode:"field",u0:15,v0:1},
  {id:"lambda",label:"晚期物质＋Λ",mode:"late",omegaM:.3,w:-1,a:1},
  {id:"matter",label:"纯物质边界",mode:"late",omegaM:1,w:-1,a:1},
  {id:"phantom",label:"w<−1 的现象学背景",mode:"late",omegaM:.3,w:-1.2,a:3}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["εH=0.1 的膨胀阶段会怎样？",["a 加速增长，同时 H 下降","加速就要求 H 增大"],0,"q=εH−1，而 d ln H/dN=−εH；两种变化不能混同。"],
  ["恒 H 时，共动哈勃半径缩小，光积累的共动路程呢？",["仍增加；半径与路程是不同量","也按 e⁻ᴺ 缩小"],0,"一个是瞬时尺度，另一个是沿时间积分。"],
  ["二次势精确背景退出，应检查什么？",["εH=1；φ=√2 Mpl 只是慢滚估计","始终在 φ=√2 Mpl 精确退出"],0,"退出附近慢滚近似正在失效。"],
  ["w=−1 时，何时开始加速？",["ρm=2ρΛ，比等密度时更早","ρm=ρΛ"],0,"加速取决于总 ρ+3p，而不只是哪一项密度最大。"]
 ];
 function number(v,key,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(key+" 必须填写有限数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(key+" 必须在 "+lo+"–"+hi+" 内");return x;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode};
  if(!["kinematic","field","late"].includes(s.mode))throw Error("未知模式");
  if(s.mode==="kinematic"){s.epsilon=number(p.epsilon,"εH",0,1.5);s.N=number(p.N,"从开始经过的 N",0,80);}
  if(s.mode==="field"){s.u0=number(p.u0,"初始 φ/Mpl",4,20);s.v0=number(p.v0,"初始 d(φ/Mpl)/dN",-1,1);}
  if(s.mode==="late"){s.omegaM=number(p.omegaM,"今天 Ωm",.01,1);s.omegaDE=1-s.omegaM;s.w=number(p.w,"常数 w",-1.5,-.2);s.a=number(p.a,"a",.01,10);}
  return s;
 }
 function quotientExp(rate,x){return rate===0?x:Math.expm1(rate*x)/rate;}
 function kinematic(s,N){
  const e=s.epsilon,logH=-e*N,logRadius=(e-1)*N;
  return {N,epsilon:e,q:e-1,logH,logRadius,H:Math.exp(logH),radius:Math.exp(logRadius),expansion:Math.exp(N),light:quotientExp(e-1,N),time:quotientExp(e,N),curvatureRatio:Math.exp(2*logRadius)};
 }
 function late(s,a){
  const m=s.omegaM*a**-3,de=s.omegaDE*a**(-3*(1+s.w)),E2=m+de,E=Math.sqrt(E2),omegaMatter=m/E2,omegaDE=de/E2;
  const q=.5*(omegaMatter+(1+3*s.w)*omegaDE),epsilon=q+1,radius=1/(a*E);
  return {a,E,E2,omegaMatter,omegaDE,q,epsilon,radius,logRadius:Math.log10(radius),densityM:m,densityDE:de};
 }
 function transition(s,kind){
  const c=kind==="equality"?1:-(1+3*s.w);
  if(s.omegaDE===0||c<=0)return {kind,status:"none",a:null,logA:null};
  const logA=(Math.log(s.omegaM)-Math.log(c)-Math.log(s.omegaDE))/(-3*s.w),a=Math.exp(logA);
  return {kind,status:logA>=Math.log(.01)&&logA<=Math.log(10)?"inside":"outside",a,logA};
 }
 function fieldDerivative(y){
  const [u,v]=y,epsilon=v*v/2;
  if(!(u>0)||!(epsilon<3)||!y.every(Number.isFinite))throw Error("场积分离开正势能与正 H² 的定义域");
  return [v,-(3-epsilon)*(v+2/u),-epsilon];
 }
 function step(y,h,N){
  const k1=fieldDerivative(y),y2=y.map((v,i)=>v+h*k1[i]/2),k2=fieldDerivative(y2),y3=y.map((v,i)=>v+h*k2[i]/2),k3=fieldDerivative(y3),y4=y.map((v,i)=>v+h*k3[i]),k4=fieldDerivative(y4),end=y.map((v,i)=>v+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
  fieldDerivative(end);
  return {N,h,start:y.slice(),y2,y3,y4,k1,k2,k3,k4,end,endN:N+h};
 }
 function fieldPoint(s,N,y){
  const [u,v,logH]=y,epsilon=v*v/2,epsilonV=2/(u*u),constraintH=u/s.u0*Math.sqrt((3-s.v0*s.v0/2)/(3-epsilon)),H=Math.exp(logH);
  return {N,u,v,logH,H,epsilon,epsilonV,q:epsilon-1,w:v*v/3-1,logRadius:-N-logH,radius:Math.exp(-N-logH),HOverM:u/Math.sqrt(2*(3-epsilon)),constraintH,constraintResidual:H*H/(constraintH*constraintH)-1};
 }
 function integrateField(s,h=.025,keep=true){
  number(h,"积分步长",.01,.2);let N=0,y=[s.u0,s.v0,0],status="window-end";
  const nodes=[fieldPoint(s,N,y)],rows=[],trials=[];let crossing=null,totalSteps=0;
  try{
   while(N<120){
    const width=Math.min(h,120-N);if(!(width>0)||N+width===N)throw Error("步长不能推进时间");
    let r=step(y,width,N);
    if(r.end[1]*r.end[1]/2>=1){
     const upperAttempt=r;let lo=0,hi=width;
     for(let i=0;i<50&&hi-lo>1e-11;i++){
      const mid=(lo+hi)/2,t=step(y,mid,N),e=t.end[1]*t.end[1]/2;
      if(keep)trials.push({i,lo,hi,mid,epsilon:e,stage:t});
      if(e>=1)hi=mid;else lo=mid;
     }
     r=step(y,hi,N);crossing={Nleft:N,lo,hi,width:hi-lo,lower:step(y,lo,N).end,upper:r.end,upperAttempt:keep?upperAttempt:null};
     status="exit";
    }
    if(keep)rows.push(r);N=r.endN;y=r.end;totalSteps++;
    if(keep)nodes.push(fieldPoint(s,N,y));
    if(status==="exit")break;
   }
  }catch(error){status="unresolved";return {status,error:error.message,h,N,nodes,rows,trials,crossing,totalSteps,current:fieldPoint(s,N,y)};}
  return {status,h,N,nodes,rows,trials,crossing,totalSteps,current:fieldPoint(s,N,y)};
 }
 function grid(lo,hi,n,extra=[]){return Array.from(new Set(Array.from({length:n+1},(_,i)=>i===0?lo:i===n?hi:lo+(hi-lo)*i/n).concat(extra))).sort((a,b)=>a-b);}
 const fieldCache=new Map();
 function snapshot(raw={}){
  const s=config(raw);
  if(s.mode==="kinematic")return {config:s,current:kinematic(s,s.N),nodes:grid(0,80,400,[s.N]).map(N=>kinematic(s,N))};
  if(s.mode==="late"){
   const cross=transition(s,"acceleration"),equal=transition(s,"equality"),extras=[s.a,1,...[cross,equal].filter(x=>x.status==="inside").map(x=>x.a)];
   const values=Array.from(new Set(grid(Math.log(.01),Math.log(10),400).map(x=>Math.exp(x)).concat([.01,10],extras))).filter(x=>x>=.01&&x<=10).sort((a,b)=>a-b);
   return {config:s,current:late(s,s.a),nodes:values.map(a=>late(s,a)),cross,equal};
  }
  const key=s.u0+":"+s.v0;let d=fieldCache.get(key);
  if(!d){
   const field=integrateField(s,.025),convergence=[.1,.05,.025,.0125].map(h=>h===.025?{...field,nodes:[],rows:[],trials:[]}:integrateField(s,h,false)),fine=convergence[3];
   convergence.forEach(p=>{p.deltaN=p.status==="exit"&&fine.status==="exit"?p.N-fine.N:null;p.deltaU=p.current.u-fine.current.u;p.deltaLogH=p.current.logH-fine.current.logH;});
   d={config:s,current:field.current,nodes:field.nodes,field,convergence,slowRollN:(s.u0*s.u0-2)/4};
   if(fieldCache.size>=8)fieldCache.delete(fieldCache.keys().next().value);fieldCache.set(key,d);
  }
  return d;
 }
 function fmt(v){
  if(v===null||v===undefined)return "—";if(typeof v==="boolean")return v?"是":"否";if(typeof v!=="number")return String(v);
  if(!Number.isFinite(v))return "不可表示";if(v===0)return "0";
  return Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(7):Number(v.toPrecision(9)).toString();
 }
 function plots(d){
  const s=d.config,key=s.mode==="late"?"a":"N",xof=p=>s.mode==="late"?Math.log10(p.a):p.N,colors=["#268bd2","#cb6a16","#29966c"];
  const markers=[{x:xof(d.current),label:s.mode==="field"?(d.field.status==="exit"?"εH=1 退出":"计算终点"):"当前"}];
  if(s.mode==="late")for(const c of [d.cross,d.equal])if(c.status==="inside"){
   const x=Math.log10(c.a),label=c.kind==="equality"?"等密度":"加速转折",same=markers.find(m=>m.x===x);
   if(same)same.label+=" / "+label;else markers.push({x,label});
  }
  function make(id,title,y,defs,bounds={}){
   const series=defs.map((v,i)=>({key:v[0],label:v[1],color:colors[i],line:true,points:d.nodes.map(p=>[xof(p),v[2](p)])})),xs=series[0].points.map(p=>p[0]),ys=series.flatMap(q=>q.points.map(p=>p[1]));
   let lo=Math.min(...ys),hi=Math.max(...ys);if(lo===hi){lo-=1;hi+=1;}
   const xmin=Math.min(...xs),xmax=Math.max(...xs);
   return Object.assign({key:id,title,x:key==="a"?"log₁₀ a；今天为1":"N=ln(a/a初始)；向右为以后",y,xmin,xmax:xmax===xmin?xmin+1:xmax,ymin:lo-.05*(hi-lo),ymax:hi+.05*(hi-lo),series,markers},bounds);
  }
  if(s.mode==="kinematic")return [
   make("kinematics","加速不要求 H 增大","q 与 εH",[[ "q","q",p=>p.q],["epsilon","εH",p=>p.epsilon]]),
   make("radii","瞬时尺度与积累光程分别比较","log₁₀ 比值；光程用 log₁₀(1+χ/rH初始)",[["logRadius","共动哈勃半径",p=>p.logRadius/Math.LN10],["logLight","已积累光程",p=>Math.log1p(p.light)/Math.LN10],["logH","H/H初始",p=>p.logH/Math.LN10]])
  ];
  if(s.mode==="field")return [
   make("field","真实场轨道：初始速度影响总膨胀","φ/Mpl",[[ "u","φ/Mpl",p=>p.u]]),
   make("exit","精确退出与势慢滚估计","εH 与 εV；加速边界为1",[[ "epsilon","εH=v²/2",p=>p.epsilon],["epsilonV","εV=2/u²",p=>p.epsilonV],["one","退出边界",()=>1]],{ymin:0}),
   make("field-radius","从同一初始时刻比较两个尺度","log₁₀ 比值",[[ "logRadius","共动哈勃半径",p=>p.logRadius/Math.LN10],["logH","H/H初始",p=>p.logH/Math.LN10]])
  ];
  return [
   make("late-q","加速转折与等密度不是同一条件","q 与 εH",[[ "q","q",p=>p.q],["epsilon","εH",p=>p.epsilon]]),
   make("late-radius","共动哈勃半径：极值对应 q=0","log₁₀[rH/(c/H0)]",[[ "logRadius","共动哈勃半径",p=>p.logRadius]])
  ];
 }
 function stageRow(r){return [r.N,r.h,...r.start,...r.y2,...r.y3,...r.y4,...r.k1,...r.k2,...r.k3,...r.k4,...r.end];}
 const stageHeaders=["N左","ΔN","u左","v左","lnH左","u2","v2","lnH2","u3","v3","lnH3","u4","v4","lnH4","k1u","k1v","k1lnH","k2u","k2v","k2lnH","k3u","k3v","k3lnH","k4u","k4v","k4lnH","u右","v右","lnH右"];
 function ledgers(d){
  const s=d.config,p=d.current;
  if(s.mode==="kinematic")return [
   {key:"summary",title:"当前几何读数",headers:["量","值"],rows:[["N",p.N],["εH",p.epsilon],["q",p.q],["a/a初始",p.expansion],["H/H初始",p.H],["共动哈勃半径比",p.radius],["从开始积累光程 / rH初始",p.light],["H初始 × 经过时间",p.time],["曲率偏离比",p.curvatureRatio]]},
   {key:"nodes",title:"全部几何节点",headers:["N","q","εH","a/a初始","H/H初始","rH比","光程比","H初始Δt","曲率偏离比","lnH比","lnrH比"],rows:d.nodes.map(p=>[p.N,p.q,p.epsilon,p.expansion,p.H,p.radius,p.light,p.time,p.curvatureRatio,p.logH,p.logRadius])}
  ];
  if(s.mode==="late")return [
   {key:"summary",title:"背景与两种转折",headers:["量","值"],rows:[["今天 Ωm",s.omegaM],["今天 ΩDE=1−Ωm",s.omegaDE],["w",s.w],["a",p.a],["E",p.E],["q",p.q],["εH",p.epsilon],["rH/(c/H0)",p.radius],["加速转折 a",d.cross.a],["加速转折状态",d.cross.status],["等密度 a",d.equal.a],["等密度状态",d.equal.status]]},
   {key:"nodes",title:"全部晚期节点",headers:["a","E","Ωm(a)","ΩDE(a)","q","εH","rH/(c/H0)","log10 rH比","ρm/ρcrit0","ρDE/ρcrit0"],rows:d.nodes.map(p=>[p.a,p.E,p.omegaMatter,p.omegaDE,p.q,p.epsilon,p.radius,p.logRadius,p.densityM,p.densityDE])}
  ];
  const f=d.field,c=f.crossing;
  return [
   {key:"summary",title:"场背景的真实退出",headers:["量","值"],rows:[["状态",f.status],["初始 u",s.u0],["初始 v",s.v0],["结束 N",p.N],["结束 u",p.u],["结束 v",p.v],["εH",p.epsilon],["εV",p.epsilonV],["H结束/H初始",p.H],["rH结束/rH初始",p.radius],["慢滚 N≈(u初始²−2)/4",d.slowRollN],["Friedmann 相对残差",p.constraintResidual],["退出二分区间宽",c?c.width:null],["实际 RK 步数",f.totalSteps]]},
   {key:"nodes",title:"全部场轨道节点",headers:["N","u","v","εH","εV","q","wφ","H/H初始","H/m","rH比","lnH比","lnrH比","代数约束 H比","约束残差"],rows:d.nodes.map(p=>[p.N,p.u,p.v,p.epsilon,p.epsilonV,p.q,p.w,p.H,p.HOverM,p.radius,p.logH,p.logRadius,p.constraintH,p.constraintResidual])},
   {key:"stages",title:"每个已接受 RK4 步的全部阶段",headers:stageHeaders,rows:f.rows.map(stageRow)},
   {key:"event",title:"首次 εH=1 的二分试探",headers:["i","步内下界","步内上界","试探 ΔN","试探 εH"],rows:f.trials.map(t=>[t.i,t.lo,t.hi,t.mid,t.epsilon])},
   {key:"event-stages",title:"每个退出试探的全部 RK4 阶段",headers:stageHeaders,rows:f.trials.map(t=>stageRow(t.stage))},
   {key:"bracket",title:"退出区间的两端与原始跨越步",headers:["量","值"],rows:c?[["步开始 N",c.Nleft],["下端 ΔN",c.lo],["上端 ΔN",c.hi],["下端 εH",c.lower[1]**2/2],["上端 εH",c.upper[1]**2/2],["原跨越步 ΔN",c.upperAttempt.h],["原跨越步 εH",c.upperAttempt.end[1]**2/2]]:[]},
   {key:"convergence",title:"四种步长：差值以最细一组为参照",headers:["ΔN","状态","步数","退出 N","退出 u","lnH比","N差","u差","lnH差","约束残差"],rows:d.convergence.map(q=>[q.h,q.status,q.totalSteps,q.N,q.current.u,q.current.logH,q.deltaN,q.deltaU,q.deltaLogH,q.current.constraintResidual])}
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
   s+='<line data-marker="'+i+'" x1="'+px+'" x2="'+px+'" y1="'+top+'" y2="'+bottom+'" stroke="currentColor" stroke-dasharray="5 5" opacity=".65"/><text x="'+(px+(right?-4:4))+'" y="'+(80+25*q.markers.slice(0,i).filter(p=>Math.abs(px-x(p.x))<110).length)+'" font-size="13" text-anchor="'+(right?'end':'start')+'">'+esc(m.label)+'</text>';
  }
  return s+"</svg>";
 }

 const STYLE=".acceleration134{color:var(--fg,#273646)}.acceleration134 .accel-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.acceleration134 label{display:flex;flex-direction:column;gap:6px}.acceleration134 input,.acceleration134 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.acceleration134 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.acceleration134 button[aria-pressed=true]{outline:3px solid #478aaa}.acceleration134 .accel-scroll{overflow:auto;max-width:100%;margin:16px 0}.acceleration134 .accel-scroll:focus{outline:3px solid #478aaa}.acceleration134 .accel-ledger{max-height:420px}.acceleration134 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.acceleration134 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.acceleration134 th,.acceleration134 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.acceleration134 .accel-error{color:#c74b39}.acceleration134 [hidden]{display:none!important}.acceleration134 fieldset{margin:16px 0;padding:12px}.acceleration134 details{margin:16px 0}.acceleration134 summary{cursor:pointer;font-weight:600}.acceleration134 .accel-legend{font-size:.95em}.acceleration134 .accel-note{line-height:1.7}.acceleration134 [hidden]{display:none!important}.acceleration134 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("acceleration134-style")){const style=doc.createElement("style");style.id="acceleration134-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="acceleration134"><h3>加速宇宙：几何判据、场动力学与晚期背景</h3><p>先预测，再揭示；错误预测也可继续。常 εH 模式只规定膨胀史；二次势模式实际求解场与引力的背景方程；晚期常 w 模式明确取 ΩDE=1−Ωm。三者的时间起点与归一化分别标注。</p><div class="accel-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="accel-controls"><label>实验模式<select data-key="mode"><option value="kinematic">常 εH 的几何比较</option><option value="field">二次势场与真实退出</option><option value="late">晚期常 w 背景</option></select></label>'+
   field("epsilon","常 εH（0–1.5）","kinematic")+field("N","从开始经过的 N（0–80）","kinematic")+field("u0","初始 φ/Mpl（4–20）","field")+field("v0","初始 d(φ/Mpl)/dN（−1–1）","field")+field("omegaM","今天 Ωm（0.01–1）","late")+field("w","常数 w（−1.5–−0.2）","late")+field("a","a（0.01–10；今天为1）","late")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="accel-error" role="alert"></p><p role="status"></p><div class="accel-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".accel-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={kinematic:"光程从指定的 N=0 开始累积，不是已知整个宇宙过去后的完整粒子视界。曲率偏离比只说明相同曲率项相对背景的变化。εH=0 不提供标量时钟，也不能直接代入曲率谱的 1/εH 因子。",field:"当前状态："+(d.field?d.field.status:"")+"。背景积分只到第一次 εH=1；没有模拟粒子产生或再热。初始正速度允许先上坡再回落。最细步长是比较参照，并非精确解；二分区间宽只描述事件定位，不能替代整条轨道的离散误差。",late:"所有密度参数是今天的份额，ΩDE=1−Ωm；常 w 是现象学背景参数。w<−1 不来自本页标准正动能单标量场。加速转折与等密度点可能在显示范围外；outside 不等于不存在。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="accel-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="accel-scroll accel-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>几何与晚期模式使用401个基础节点，再加入当前点与域内转折点；场模式使用全部实际积分节点，末步由事件定位缩短。场积分分别以 ΔN=0.1、0.05、0.025、0.0125 求解，图与完整阶段账本使用0.025。第一次 εH=1 的步内二分区间宽不超过10⁻¹¹，最大计算区间为N=120；exit 表示找到退出，window-end 表示到达计算上限，unresolved 表示计算未完成。独立积分 ln(H/H初始) 并与 Friedmann 代数约束比较，残差是数值诊断。图表可聚焦后用方向键横向滚动。</p>';
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
  const k=snapshot();ck(k.current.radius===Math.exp(-60),"de Sitter radius");ck(k.current.light>0,"accumulated light");
  ck(snapshot({epsilon:1}).current.light===60,"coasting limit");
  ck(snapshot({N:0}).current.expansion===1,"zero interval");
  const l=snapshot({mode:"late"});ck(Math.abs(l.current.q+.55)<1e-14,"late q");ck(l.cross.a<l.equal.a,"transition before equality");
  ck(snapshot({mode:"late",omegaM:1}).cross.status==="none","pure matter");
  const f=snapshot({mode:"field"});ck(f.field.status==="exit"&&f.current.epsilon>=1,"actual exit");ck(Math.abs(f.current.u-Math.SQRT2)>.1,"not forced slow-roll end");
  ck(fmt(1e-30)!=="0","small positive value");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,quotientExp,kinematic,late,transition,fieldDerivative,step,fieldPoint,integrateField,grid,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
