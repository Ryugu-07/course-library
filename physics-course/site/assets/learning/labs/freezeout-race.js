(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("freezeout-race",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"rate",m:5,n:2,C:1,x:.5,T:.1,TD:2,TeV:.3,eta:6e-10});
 const PRESETS=Object.freeze([
  {id:"weak",label:"弱作用幂律",mode:"rate",m:5,n:2,C:1,x:.5},
  {id:"shift",label:"改变反应归一化",mode:"rate",m:5,n:2,C:8,x:.5},
  {id:"flat",label:"指数相等、比值不等于1",mode:"rate",m:2,n:2,C:2},
  {id:"equal",label:"整条等于1",mode:"rate",m:2,n:2,C:1},
  {id:"recouple",label:"冷却后重新耦合",mode:"rate",m:1,n:3,C:1},
  {id:"bath",label:"电子湮灭与分温",mode:"bath",TD:2,T:.1},
  {id:"saha",label:"纯氢 Saha 平衡",mode:"saha",TeV:.3,eta:6e-10}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["m>n 时，冷却使 Γ/H 怎样变化？",["下降；归一化 C 仍决定交点","上升；交点总在 x=1"],0,"斜率为 m−n；C 改变纵向位置。"],
  ["e± 湮灭后，已解耦的中微子与光子谁温度更高？",["光子；须分别守恒两部分的熵","相同；全宇宙只能有一个温度"],0,"这里假设瞬时解耦；光子热浴获得电子正电子的熵。"],
  ["Saha 算出 Xe=0.1，是否等于算出了真实最后散射？",["否；还需非平衡重组与光学深度","是；0.1 是普适的最后散射阈值"],0,"平衡组成、散射率和最后散射概率是不同问题。"],
  ["150 Mpc / 14 Gpc 对应 π/θ 约为多少？",["293；这是声学尺度，不能直接叫第一峰","220；声学尺度和第一峰没有区别"],0,"统一共动距离后 θ=0.0107143 rad，ℓA=293.215。"]
 ];
 function number(v,key,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(key+" 必须填写有限数值");
  const n=Number(v);if(!Number.isFinite(n)||n<lo||n>hi)throw Error(key+" 必须在 "+lo+"–"+hi+" 内");return n;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode};
  if(p.mode==="rate"){for(const k of ["m","n"])s[k]=number(p[k],k,-8,8);s.C=number(p.C,"C",1e-4,1e4);s.x=number(p.x,"x",.01,100);}
  else if(p.mode==="bath"){s.TD=number(p.TD,"解耦温度 TD（MeV）",1,10);s.T=number(p.T,"光子温度 T（MeV）",.01,s.TD);}
  else if(p.mode==="saha"){s.TeV=number(p.TeV,"温度（eV）",.1,20);s.eta=number(p.eta,"纯氢/光子比 η",1e-11,1e-8);}
  else throw Error("未知模式");return s;
 }
 const ME_MEV=.51099895,ME_EV=510998.95,BIND_EV=13.6,ZETA3=1.2020569031595943,HBARC=1.973269804e-7,KB_EV=8.617333262e-5;
 const QMAX=80;
 function ratePoint(s,x){const logRatio=Math.log(s.C)+(s.m-s.n)*Math.log(x);return {x,logRatio,ratio:Math.exp(logRatio),side:logRatio>0?"反应较快":logRatio<0?"反应较慢":"速率相等"};}
 function crossing(s){
  const d=s.m-s.n;if(d===0)return {status:s.C===1?"all":"none",logX:null,x:null,direction:"冷却不改变比值"};
  const logX=-Math.log(s.C)/d,x=Math.exp(logX);
  return {status:logX<Math.log(.01)||logX>Math.log(100)?"outside":"inside",logX:Number.isFinite(logX)?logX:null,logStatus:Number.isFinite(logX)?"finite":logX<0?"negative-overflow":"positive-overflow",x:Number.isFinite(x)&&x>0?x:null,direction:d>0?"冷却使比值下降":"冷却使比值上升"};
 }
 // Composite adaptive Simpson on 80 initial intervals. Embedded error estimates
 // are diagnostics, not rigorous enclosures. The omitted infinite tail has a separate bound.
 function integrate(f,options={}){
  const atol=options.atol===undefined?1e-13:options.atol,rtol=options.rtol===undefined?1e-11:options.rtol,depth=options.depth===undefined?18:options.depth;
  if(!(atol>0&&Number.isFinite(atol))||!(rtol>=0&&Number.isFinite(rtol))||!Number.isInteger(depth)||depth<0||depth>22)throw Error("非法积分控制参数");
  let evaluations=0,failed=0;const panels=[];
  const at=x=>{evaluations++;const v=f(x);if(!Number.isFinite(v))throw Error("非有限被积函数");return v;};
  function rec(a,b,fa,fm,fb,coarse,budget,left){
   const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=at(l),fr=at(r);
   const refined=(m-a)*(fa+4*fl+fm)/6+(b-m)*(fm+4*fr+fb)/6,error=Math.abs(refined-coarse)/15,value=refined+(refined-coarse)/15;
   const converged=error<=budget+rtol*Math.abs(refined);
   if(converged||left===0){if(!converged)failed++;panels.push({a,b,fa,fl,fm,fr,fb,coarse,refined,error,value,converged});return;}
   rec(a,m,fa,fl,fm,(m-a)*(fa+4*fl+fm)/6,budget/2,left-1);
   rec(m,b,fm,fr,fb,(b-m)*(fm+4*fr+fb)/6,budget/2,left-1);
  }
  for(let i=0;i<80;i++){const a=i,b=a+1,m=(a+b)/2,fa=at(a),fm=at(m),fb=at(b);rec(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,atol/80,depth);}
  return {value:panels.reduce((z,p)=>z+p.value,0),error:panels.reduce((z,p)=>z+p.error,0),status:failed?"unresolved":"finite",evaluations,panels,atol,rtol};
 }
 function fd(q,y,kind){const E=Math.hypot(q,y);if(E===0)return 0;const e=Math.exp(-E),f=e/(1+e);return kind==="rho"?q*q*E*f:q**4/E*f;}
 function tailBound(y,kind){const q=QMAX,p3=q**3+3*q*q+6*q+6,p2=q*q+2*q+2;return Math.exp(-q)*(p3+(kind==="rho"?y*p2:0));}
 const gasCache=new Map();
 function gas(T,keep=false){
  number(T,"光子温度（MeV）",.01,10);
  let d=gasCache.get(T);
  if(!d){
   const y=ME_MEV/T,rho=integrate(q=>fd(q,y,"rho")),pressure=integrate(q=>fd(q,y,"P"));
   for(const [kind,q]of [["rho",rho],["P",pressure]])q.tail=tailBound(y,kind);
   const er=60/Math.PI**4*rho.value,es=45/Math.PI**4*(rho.value+pressure.value/3);
   const epsilonT4=Math.PI**2/15+2/Math.PI**2*rho.value,pressureT4=Math.PI**2/45+2/(3*Math.PI**2)*pressure.value;
   d={T,y,electronGr:er,electronGs:es,gr:2+er,gs:2+es,epsilonT4,pressureT4,w:pressureT4/epsilonT4,rho,pressure,status:rho.status==="finite"&&pressure.status==="finite"?"finite":"unresolved"};
   if(gasCache.size>=1024)gasCache.delete(gasCache.keys().next().value);gasCache.set(T,d);
  }
  if(keep)return d;
  const short=q=>({value:q.value,error:q.error,tail:q.tail,status:q.status,evaluations:q.evaluations});
  return Object.assign({},d,{rho:short(d.rho),pressure:short(d.pressure)});
 }
 function bathPoint(s,T,decoupled,keep=false){
  const g=gas(T,keep),ratio=Math.cbrt(g.gs/decoupled.gs),a=s.TD/T/ratio;
  return Object.assign({},g,{ratio,a,Tnu:T*ratio,entropyCheck:g.gs/decoupled.gs*(T/s.TD)**3*a**3,nuComovingCheck:T*ratio*a/s.TD});
 }
 function sahaPoint(s,T){
  const logS=-Math.log(s.eta)-Math.log(2*ZETA3/Math.PI**2)+1.5*Math.log(ME_EV/(2*Math.PI*T))-BIND_EV/T;
  const invS=Math.exp(-logS),S=Math.exp(logS),root=Math.sqrt(1+4*invS),X=2/(1+root),neutral=1/(1+S/2+Math.sqrt(S)*Math.sqrt(S+4)/2);
  const nGamma=2*ZETA3/Math.PI**2*(T/HBARC)**3;
  return {T,logS,X,neutral,nGamma,nH:s.eta*nGamma,kelvin:T/KB_EV};
 }
 function logGrid(lo,hi,n,extra=[]){return Array.from(new Set([lo,hi,...Array.from({length:n-1},(_,i)=>Math.exp(Math.log(lo)+(Math.log(hi)-Math.log(lo))*(i+1)/n)),...extra])).sort((a,b)=>a-b);}
 function snapshot(raw={}){
  const s=config(raw);
  if(s.mode==="rate"){
   const cross=crossing(s),current=ratePoint(s,s.x),nodes=logGrid(.01,100,400,[s.x,...(cross.status==="inside"&&cross.x!==null?[cross.x]:[])]).map(x=>ratePoint(s,x));
   return {config:s,cross,current,nodes};
  }
  if(s.mode==="bath"){
   const decoupled=gas(s.TD),current=bathPoint(s,s.T,decoupled,true),nodes=logGrid(.01,s.TD,180,[s.T]).map(T=>bathPoint(s,T,decoupled));
   return {config:s,decoupled,current,nodes,idealRatio:Math.cbrt(4/11)};
  }
  return {config:s,current:sahaPoint(s,s.TeV),nodes:logGrid(.1,20,400,[s.TeV]).map(T=>sahaPoint(s,T))};
 }
 function fmt(v){
  if(v===null||v===undefined)return "—";
  if(typeof v!=="number")return String(v);
  if(!Number.isFinite(v))return String(v);
  if(v===0)return "0";return Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(8):String(Number(v.toPrecision(10)));
 }
 function plots(d){
  const s=d.config,colors=["#268bd2","#cb6a16","#29966c","#9966bb"];
  const plot=(key,title,x,y,series,bounds={})=>{
   const points=series.map((v,i)=>({key:v[0],label:v[1],color:colors[i],line:true,points:d.nodes.map(p=>v[2](p))}));
   const xs=points.flatMap(p=>p.points.map(v=>v[0])),ys=points.flatMap(p=>p.points.map(v=>v[1]));
   let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo){lo-=1;hi+=1;}
   return Object.assign({key,title,x,y,xmin:Math.min(...xs),xmax:Math.max(...xs),ymin:lo-.05*(hi-lo),ymax:hi+.05*(hi-lo),series:points,markers:[{x:Math.log10(s.mode==="rate"?s.x:s.mode==="bath"?s.T:s.TeV),label:"当前"}]},bounds);
  };
  if(s.mode==="rate"){
   const q=plot("rate","反应与膨胀：冷却向左走","log₁₀ x = log₁₀(T/Tref)","log₁₀(Γ/H)",[["rate","速率比",p=>[Math.log10(p.x),p.logRatio/Math.LN10]],["one","Γ/H=1",p=>[Math.log10(p.x),0]]]);
   if(d.cross.status==="inside"&&d.cross.x!==null){
    if(d.cross.x===s.x)q.markers[0].label="当前：速率相等";
    else q.markers.push({x:Math.log10(d.cross.x),label:"速率相等"});
   }return [q];
  }
  if(s.mode==="bath")return [
   plot("degrees","同一热浴，两种有效自由度","log₁₀(Tγ / MeV)；冷却向左","gρ 与 gs（含光子和 e±）",[["gr","能量 gρ",p=>[Math.log10(p.T),p.gr]],["gs","熵 gs",p=>[Math.log10(p.T),p.gs]]],{ymin:0,ymax:6}),
   plot("ratio","分开守恒熵，温度开始分离","log₁₀(Tγ / MeV)；冷却向左","Tν / Tγ",[["ratio","有限 TD 的瞬时解耦模型",p=>[Math.log10(p.T),p.ratio]],["ideal","高温解耦极限 (4/11)¹ᐟ³",p=>[Math.log10(p.T),d.idealRatio]]],{ymin:.68,ymax:1.02})
  ];
  return [
   plot("saha","组成是连续变化的平衡解","log₁₀(kBT / eV)；冷却向左","粒子数分数",[["X","自由电子比例 Xe",p=>[Math.log10(p.T),p.X]],["neutral","中性氢比例",p=>[Math.log10(p.T),p.neutral]]],{ymin:0,ymax:1}),
   plot("neutral","接近全电离，也保留微小中性分数","log₁₀(kBT / eV)","log₁₀(中性氢比例)",[["neutral-log","中性氢比例",p=>[Math.log10(p.T),Math.log10(p.neutral)]]])
  ];
 }
 function ledgers(d){
  const s=d.config;
  if(s.mode==="rate")return [
   {key:"summary",title:"当前值与交点",headers:["量","值"],rows:[["m−n",s.m-s.n],["x",s.x],["Γ/H",d.current.ratio],["ln(Γ/H)",d.current.logRatio],["诊断",d.current.side],["交点状态",d.cross.status],["ln(xcross)",d.cross.logX],["对数状态",d.cross.logStatus||"不适用"],["xcross（可表示时）",d.cross.x],["冷却方向",d.cross.direction]]},
   {key:"nodes",title:"全部速率节点",headers:["x","ln(Γ/H)","Γ/H","相对速率"],rows:d.nodes.map(p=>[p.x,p.logRatio,p.ratio,p.side])}
  ];
  if(s.mode==="bath"){
   const p=d.current;
   return [
    {key:"summary",title:"当前热浴与守恒核对",headers:["量","值"],rows:[["Tγ / MeV",p.T],["TD / MeV",s.TD],["me/Tγ",p.y],["电子 gρ",p.electronGr],["电子 gs",p.electronGs],["总 gρ",p.gr],["总 gs",p.gs],["Tν/Tγ",p.ratio],["Tν / MeV",p.Tnu],["a/aD",p.a],["相对共动熵（应为1）",p.entropyCheck],["中微子 aT（应为1）",p.nuComovingCheck],["P/ε",p.w],["积分状态",p.status]]},
    {key:"nodes",title:"全部温度节点与积分诊断",headers:["Tγ/MeV","me/T","gρ","gs","Tν/Tγ","a/aD","熵核对","ν aT核对","ε/T⁴","P/T⁴","P/ε","Iρ","估计误差ρ","尾界ρ","IP","估计误差P","尾界P","状态"],rows:d.nodes.map(p=>[p.T,p.y,p.gr,p.gs,p.ratio,p.a,p.entropyCheck,p.nuComovingCheck,p.epsilonT4,p.pressureT4,p.w,p.rho.value,p.rho.error,p.rho.tail,p.pressure.value,p.pressure.error,p.pressure.tail,p.status])},
    ...[["rho","能量积分 Iρ"],["pressure","压强积分 IP"]].map(([key,title])=>({key,title:"当前 "+title+" 的全部积分面板",headers:["q左","q右","f左","f1/4","f中","f3/4","f右","粗Simpson","细Simpson","误差估计","修正值","达标"],rows:p[key].panels.map(q=>[q.a,q.b,q.fa,q.fl,q.fm,q.fr,q.fb,q.coarse,q.refined,q.error,q.value,q.converged])}))
   ];
  }
  return [
   {key:"summary",title:"当前纯氢平衡组成",headers:["量","值"],rows:[["kBT / eV",d.current.T],["T / K",d.current.kelvin],["η（氢核/光子）",s.eta],["ln S",d.current.logS],["Xe",d.current.X],["中性氢分数",d.current.neutral],["nγ / m⁻³",d.current.nGamma],["氢核数密度 / m⁻³",d.current.nH]]},
   {key:"nodes",title:"全部 Saha 节点",headers:["kBT/eV","ln S","Xe","中性氢分数","nγ/m⁻³","氢核/m⁻³","T/K"],rows:d.nodes.map(p=>[p.T,p.logS,p.X,p.neutral,p.nGamma,p.nH,p.kelvin])}
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

 const STYLE=".thermal132{color:var(--fg,#273646)}.thermal132 .thermal-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.thermal132 label{display:flex;flex-direction:column;gap:6px}.thermal132 input,.thermal132 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.thermal132 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.thermal132 button[aria-pressed=true]{outline:3px solid #478aaa}.thermal132 .thermal-scroll{overflow:auto;max-width:100%;margin:16px 0}.thermal132 .thermal-scroll:focus{outline:3px solid #478aaa}.thermal132 .thermal-ledger{max-height:420px}.thermal132 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.thermal132 table{min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.thermal132 th,.thermal132 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.thermal132 .thermal-error{color:#c74b39}.thermal132 [hidden]{display:none!important}.thermal132 fieldset{margin:16px 0;padding:12px}.thermal132 details{margin:16px 0}.thermal132 summary{cursor:pointer;font-weight:600}.thermal132 .thermal-legend{font-size:.95em}.thermal132 .thermal-note{line-height:1.7}.thermal132 [hidden]{display:none!important}.thermal132 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("thermal132-style")){const style=doc.createElement("style");style.id="thermal132-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="thermal132"><h3>热历史：三个机制，分别核算</h3><p>先预测，再揭示；错误预测也可继续。参数变化保留预测，非法输入保留原文。速率模型不输出丰度；热浴假设理想气体与瞬时中微子解耦；Saha 模式仅输出纯氢平衡组成。</p><div class="thermal-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="thermal-controls"><label>实验模式<select data-key="mode"><option value="rate">反应与膨胀速率</option><option value="bath">电子湮灭与温度分离</option><option value="saha">纯氢 Saha 平衡</option></select></label>'+
   field("m","Γ 的温度指数 m（−8–8）","rate")+field("n","H 的温度指数 n（−8–8）","rate")+field("C","Γ/H 在 x=1 的值 C（10⁻⁴–10⁴）","rate")+field("x","x=T/Tref（0.01–100）","rate")+field("TD","瞬时解耦温度 TD（1–10 MeV）","bath")+field("T","当前光子温度 Tγ（0.01 MeV 至 TD）","bath")+field("TeV","kBT（0.1–20 eV）","saha")+field("eta","纯氢核/光子比 η（10⁻¹¹–10⁻⁸）","saha")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="thermal-error" role="alert"></p><p role="status"></p><div class="thermal-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".thermal-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   result.innerHTML='<p>'+(d.config.mode==="rate"?"inside：孤立交点在窗口内；outside：有交点但在窗口外；all：整条相等；none：指数相同但比值不等于1。极端斜率使交点不可表示时仍保留状态；“—”不表示零。":d.config.mode==="bath"?"电子正电子化学势取零，光子＋电子热浴的熵与中微子熵分开守恒。有限 TD 结果不必精确等于高温解耦极限；模型忽略持续弱作用能量传递、有限温 QED 修正与中微子谱畸变。":"η 是纯氢模型中的氢核/光子比；这里没有氦。Xe 很接近1时，直接用稳定公式保存中性分数，不把浮点数的1误当成完全没有中性氢。")+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="thermal-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="thermal-scroll thermal-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>速率与 Saha 图各有401个对数网格节点；热浴图有181个节点，另加入当前状态与窗口内速率交点。每个节点都在账本中。积分区间 q=0–80 使用80段起始区间的自适应 Simpson，绝对容差10⁻¹³、相对容差10⁻¹¹；报告嵌入误差估计和独立的无限尾项上界，估计不是严格误差证书。finite 表示本次数值诊断达标；unresolved 不等于数学发散。极低温电子项小于绝对容差时，不承诺其相对精度。图表可聚焦后用方向键横向滚动。</p>';
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
  let checks=0;const ck=(b,m)=>{checks++;if(!b)throw Error(m);};
  ck(Math.abs(snapshot().current.ratio-.125)<1e-15,"rate");
  ck(crossing(config({C:8})).x===.5,"normalization");
  ck(crossing(config({m:2,n:2,C:2})).status==="none","flat unequal");
  ck(crossing(config({m:2,n:2,C:1})).status==="all","all equal");
  ck(crossing(config({m:2+1e-12,n:2,C:2})).status==="outside","nonzero tiny slope");
  const b=snapshot({mode:"bath"});ck(Math.abs(b.current.entropyCheck-1)<1e-12&&b.current.ratio<1,"entropy");
  const h=sahaPoint(config({mode:"saha"}),20);ck(h.neutral>0,"tiny neutral");
  ck(integrate(q=>Math.exp(q),{depth:0}).status==="unresolved","unresolved");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,ratePoint,crossing,integrate,fd,tailBound,gas,bathPoint,sahaPoint,logGrid,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
