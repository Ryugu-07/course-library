(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("cosmological-horizons",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"background",omegaR:.0001,omegaM:.2999,a:1,H0:70,z:2,emit:.25,beta:2});
 const PRESETS=Object.freeze([
  {id:"toy",label:"平坦三组分教学模型",mode:"background",omegaR:.0001,omegaM:.2999},
  {id:"matter",label:"纯物质",mode:"background",omegaR:0,omegaM:1},
  {id:"radiation",label:"纯辐射",mode:"background",omegaR:1,omegaM:0},
  {id:"desitter",label:"纯 de Sitter 平坦片",mode:"background",omegaR:0,omegaM:0},
  {id:"mixed",label:"物质＋辐射，无 Λ",mode:"background",omegaR:.4,omegaM:.6},
  {id:"distance",label:"红移与三种距离",mode:"distance",z:2},
  {id:"photon",label:"Hubble 半径外的来光",mode:"photon",emit:.25,beta:2}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["Hubble 半径之外、朝我们发出的光，是否可能最终到达？",["可能，取决于整个膨胀历史","永远不可能"],0,"Hubble 半径是瞬时 HD=c 条件；纯物质光子是可到达的反例。"],
  ["无 Λ、同时含物质和辐射时，谁主导遥远未来？",["物质","辐射"],0,"物质按 a⁻³ 稀释，辐射按 a⁻⁴ 稀释，物质最终占优。"],
  ["平坦模型 z>0 的 DL 与 DA 满足什么关系？",["DL=(1+z)² DA","DL=DA"],0,"一个红移因子来自光子能量，另一个来自到达间隔；角距离还含发射时尺度因子。"],
  ["数值积分达到细分上限，能否据此断言数学发散？",["不能，须区分未收敛与解析发散","能，写成无穷即可"],0,"解析端点判别与数值误差估计是两套不同的证据。"]
 ];
 function number(v,key,lo,hi){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(key+" 必须填写有限数值");
  const n=Number(v);if(!Number.isFinite(n)||n<lo||n>hi)throw Error(key+" 必须在 "+lo+"–"+hi+" 内");return n;
 }
 function config(raw={}){
  if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw);if(!["background","distance","photon"].includes(p.mode))throw Error("未知模式");
  const s={mode:p.mode};
  if(p.mode==="photon"){s.emit=number(p.emit,"发射尺度因子",.01,1);s.beta=number(p.beta,"β",.1,4);return s;}
  s.omegaR=number(p.omegaR,"Ωr",0,1);s.omegaM=number(p.omegaM,"Ωm",0,1);
  s.omegaLambda=1-(s.omegaR+s.omegaM);
  if(s.omegaLambda<0)throw Error("Ωr+Ωm 不能大于1；不会自动归一化");
  // Residual subtraction may round an exact decimal boundary slightly below 1e-6.
  // Accept a few machine ulps at that boundary; retain the actual residual, without renormalization.
  for(const [k,v]of Object.entries(s))if(k.startsWith("omega")&&v>0&&v<1e-6-(k==="omegaLambda"?4*Number.EPSILON:0))throw Error(k+" 非零时须至少为 0.000001（本实验数值域）");
  s.H0=number(p.H0,"H₀",40,100);
  if(p.mode==="background")s.a=number(p.a,"a",.0001,10);
  else s.z=number(p.z,"z",0,20);
  return s;
 }
 const C=299792.458,MPC_KM=3.0856775814913673e19,GYR_SECONDS=31557600e9;
 function scales(s){return {Mpc:C/s.H0,Gpc:C/s.H0/1000,Gyr:MPC_KM/s.H0/GYR_SECONDS};}
 function expansion(s,a){
  const r=s.omegaR/a**4,m=s.omegaM/a**3,l=s.omegaLambda,total=r+m+l;
  return {a,E:Math.sqrt(total),DH:1/Math.sqrt(total),r:r/total,m:m/total,l:l/total,q:(2*r+m-2*l)/(2*total),hdot:-2*r-1.5*m};
 }
 // Unit-interval adaptive Simpson. The embedded estimate is a diagnostic, not a rigorous interval enclosure.
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
   const fa=at(0),fm=at(.5),fb=at(1);
   result=visit(0,1,fa,fm,fb,(fa+4*fm+fb)/6,atol,depth);
  }catch(e){return {status:"unresolved",value:null,error:null,evaluations,accepted,failed,panels,message:e.message};}
  return Object.assign({status:failed?"unresolved":"finite",evaluations,accepted,failed,panels,atol,rtol},result);
 }
 const special=(status,message)=>({status,value:null,error:null,evaluations:0,accepted:0,failed:0,panels:[],message});
 const zero=()=>({status:"finite",value:0,error:0,evaluations:0,accepted:0,failed:0,panels:[]});
 function integrals(s,a,keep=true,options={}){
  const R=s.omegaR,M=s.omegaM,L=s.omegaLambda;
  const past=(age)=>u=>{
   if(u===0)return !age&&R===0?2*Math.sqrt(a/M):0;
   const x=a*u*u,base=2*a*u/Math.sqrt(R+M*x+L*x**4);return age?x*base:base;
  };
  const particle=R+M===0?special("divergent","平坦 de Sitter 片过去共形积分发散"):quadrature(past(false),keep,options);
  const age=R+M===0?special("undefined","平坦片 a→0 位于无限过去，不定义大爆炸年龄"):quadrature(past(true),keep,options);
  const event=L===0?special("divergent","无 Λ 的本三组分模型未来共形积分发散"):quadrature(t=>{const u=t/a;return 1/a/Math.sqrt(R*u**4+M*u**3+L);},keep,options);
  const log=Math.log(a),elapsed=a===1?zero():quadrature(t=>log/expansion(s,Math.exp(t*log)).E,keep,options);
  return {particle,event,age,elapsed};
 }
 function backgroundPoint(s,a,keep=false){
  const e=expansion(s,a),i=integrals(s,a,keep);
  const finite=q=>q.status==="finite"?q.value:null;
  return Object.assign(e,{particle:finite(i.particle)===null?null:a*i.particle.value,event:finite(i.event)===null?null:a*i.event.value,age:finite(i.age),elapsed:finite(i.elapsed),integrals:i});
 }
 function distances(s,z,keep=false){
  const dc=z===0?zero():quadrature(u=>z/expansion(s,1/(1+z*u)).E,keep);
  const lookback=z===0?zero():quadrature(u=>z/((1+z*u)*expansion(s,1/(1+z*u)).E),keep);
  const DC=dc.status==="finite"?dc.value:null;
  return {z,DC,DA:DC===null?null:DC/(1+z),DL:DC===null?null:DC*(1+z),lookback:lookback.status==="finite"?lookback.value:null,integrals:{dc,lookback}};
 }
 function unique(values){return [...new Set(values)].sort((a,b)=>a-b);}
 function snapshot(raw={}){
  const s=config(raw);
  if(s.mode==="background"){
   const current=backgroundPoint(s,s.a,true),curve=unique(Array.from({length:401},(_,i)=>10**(-4+5*i/400)).concat([s.a,1])).map(a=>backgroundPoint(s,a));
   return {config:s,scales:scales(s),current,curve,future:s.omegaLambda>0?"Λ 主导：DH→1/√ΩΛ，De→1/√ΩΛ":s.omegaM>0?"物质主导：DH∼a^(3/2)/√Ωm；无事件视界":"辐射主导：DH∼a²/√Ωr；无事件视界"};
  }
  if(s.mode==="distance")return {config:s,scales:scales(s),current:distances(s,s.z,true),curve:unique(Array.from({length:301},(_,i)=>20*i/300).concat([s.z])).map(z=>distances(s,z))};
  const root=Math.sqrt(s.emit),arrival=s.emit*(1+s.beta/2)**2,turn=s.beta>1?s.emit*((s.beta+2)/3)**2:null;
  function point(a){const chi=2*(Math.sqrt(arrival)-Math.sqrt(a)),D=a*chi,DH=a**1.5;return {a,tau:2*a**1.5/3,chi,D,DH,velocity:D/DH-1};}
  const curve=unique(Array.from({length:301},(_,i)=>s.emit+(arrival-s.emit)*i/300).concat([s.emit,arrival,...(turn===null?[]:[turn])])).map(point);
  return {config:s,arrival,turn,current:point(s.emit),curve};
 }
 function fmt(x){
  if(x===null||x===undefined)return "—";
  if(typeof x!=="number")return String(x);
  if(x===0)return "0";
  return Math.abs(x)<1e-5||Math.abs(x)>=1e8?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 const COLORS=["#268bd2","#cb6a16","#29966c","#9966bb"];
 function plots(d){
  const mode=d.config.mode;
  function plot(title,x,y,keys,rows,xkey,logx=false,logy=false){
   const series=keys.map(([key,label],i)=>({key,label,color:COLORS[i],line:true,points:rows.filter(r=>Number.isFinite(r[key])&&(!logy||r[key]>0)).map(r=>[logx?Math.log10(r[xkey]):r[xkey],logy?Math.log10(r[key]):r[key]])})).filter(s=>s.points.length);
   const all=series.flatMap(s=>s.points),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
   let ymin=logy?Math.min(...ys):Math.min(0,...ys),ymax=Math.max(...ys);if(ymax===ymin)ymax=ymin+1;
   const pad=(ymax-ymin)*.06;
   const markers=mode==="background"?[{x:Math.log10(d.config.a),label:"当前 a="+Number(d.config.a.toPrecision(5))}]:mode==="distance"?[{x:d.config.z,label:"当前 z="+Number(d.config.z.toPrecision(5))}]:d.turn===null?[]:[{x:d.turn,label:"转折 a="+Number(d.turn.toPrecision(5))}];
   return {title,x,y,xmin:Math.min(...xs),xmax:Math.max(...xs),ymin:!logy&&ymin===0?0:ymin-pad,ymax:keys[0][0]==="r"?1:ymax+pad,series,markers};
  }
  if(mode==="background")return [
   plot("三种半径：斜率也有物理含义","log₁₀ a","log₁₀ [D / (c/H₀)]",[["DH","Hubble 半径"],["particle","粒子视界"],["event","事件视界"]],d.curve,"a",true,true),
   plot("谁占据密度账本？","log₁₀ a","当时的密度分数",[["r","辐射"],["m","物质"],["l","Λ"]],d.curve,"a",true)
  ];
  if(mode==="distance")return [
   plot("同一个红移对应三种距离","红移 z","距离 / (c/H₀)",[["DC","DC"],["DA","DA"],["DL","DL"]],d.curve,"z"),
   plot("单独放大 DA：检查是否存在转折","红移 z","DA / (c/H₀)",[["DA","角直径距离"]],d.curve,"z"),
   plot("往过去看了多久？","红移 z","H₀ × 回望时间",[["lookback","回望时间"]],d.curve,"z")
  ];
  return [
   plot("纯物质模型：来光先远离，再到达","尺度因子 a","距离 / (c/H₀)",[["D","光子固有距离"],["DH","Hubble 半径"]],d.curve,"a"),
   plot("朝我们传播的光，Ḋ 仍可为正","尺度因子 a","Ḋ / c = HD/c − 1",[["velocity","固有距离变化率"]],d.curve,"a")
  ];
 }
 function ledgers(d){
  const out=[],add=(key,title,headers,rows)=>out.push({key,title,headers,rows}),mode=d.config.mode,c=d.current;
  if(mode==="background"){
   add("summary","当前背景与单位",["量","数值","解释"],[
    ["ΩΛ",d.config.omegaLambda,"1−Ωr−Ωm，未归一化"],["a",c.a,"今天 a₀=1"],["E",c.E,"H/H₀"],["q",c.q,"负值表示尺度因子加速"],
    ["Hdot/H₀²",c.hdot,"背景导数"],["DH",c.DH,"c/H₀ 单位"],["Dp",c.particle,c.integrals.particle.status],["De",c.event,c.integrals.event.status],
    ["H₀ t",c.age,c.integrals.age.status],["H₀(t−t₀)",c.elapsed,c.integrals.elapsed.status],
    ["c/H₀ (Gpc)",d.scales.Gpc,"乘无量纲距离"],["1/H₀ (Gyr)",d.scales.Gyr,"乘无量纲时间"],
    ["模型年龄 (Gyr)",c.age===null?null:c.age*d.scales.Gyr,"不是自动等于 Hubble 时间"]
   ]);
   add("curve","全部背景曲线节点",["a","E","DH","Dp","De","H₀t","H₀(t−t₀)","Ωr(a)","Ωm(a)","ΩΛ(a)","q"],d.curve.map(r=>[r.a,r.E,r.DH,r.particle,r.event,r.age,r.elapsed,r.r,r.m,r.l,r.q]));
  }else if(mode==="distance"){
   add("summary","当前红移距离",["量","无量纲值","物理值／含义"],[
    ["z",c.z,"观测时 a₀=1"],["DC",c.DC,c.DC===null?null:c.DC*d.scales.Gpc+" Gpc"],
    ["DA",c.DA,c.DA===null?null:c.DA*d.scales.Gpc+" Gpc"],["DL",c.DL,c.DL===null?null:c.DL*d.scales.Gpc+" Gpc"],
    ["回望时间",c.lookback,c.lookback===null?null:c.lookback*d.scales.Gyr+" Gyr"],
    ["DL−(1+z)²DA",c.DC===null?null:c.DL-(1+c.z)**2*c.DA,"浮点残差；不是观测检验"]
   ]);
   add("curve","全部红移曲线节点",["z","DC","DA","DL","H₀ × 回望时间"],d.curve.map(r=>[r.z,r.DC,r.DA,r.DL,r.lookback]));
  }else{
   add("summary","解析光子事件",["量","数值","含义"],[
    ["Ωm",1,"本模式固定纯物质背景"],["a_emit",d.config.emit,"发射事件"],["β",d.config.beta,"D_emit/DH_emit"],
    ["a_turn",d.turn,d.turn===null?"无未来转折（β≤1）":"最大固有距离事件"],["a_arrival",d.arrival,"到达原点事件"],
    ["初始 Ḋ/c",c.velocity,"β−1"],["发射 τ",c.tau,"H₀t"],["到达 τ",d.curve[d.curve.length-1].tau,"H₀t"]
   ]);
   add("curve","完整解析光路径",["a","τ=H₀t","χ/(c/H₀)","D/(c/H₀)","DH/(c/H₀)","Ḋ/c"],d.curve.map(r=>[r.a,r.tau,r.chi,r.D,r.DH,r.velocity]));
   return out;
  }
  add("diagnostics","全部节点的积分状态与误差估计",["节点","积分","状态","值","估计误差","函数调用","接受面板","未达标面板"],d.curve.flatMap(r=>Object.entries(r.integrals).map(([k,q])=>[r.a===undefined?r.z:r.a,k,q.status,q.value,q.error,q.evaluations,q.accepted,q.failed])));
  add("current","当前积分诊断",["积分","状态","值","估计误差","说明"],Object.entries(c.integrals).map(([k,q])=>[k,q.status,q.value,q.error,q.message||"局部 atol×区间宽 + rtol×|细分估计|"]));
  add("panels","当前积分全部细分面板（变量均为 u∈[0,1]）",["积分","左端","右端","f左","f1/4","f中","f3/4","f右","粗 Simpson","细 Simpson","估计误差","修正值","达标"],Object.entries(c.integrals).flatMap(([k,q])=>q.panels.map(p=>[k,p.lo,p.hi,p.fa,p.fl,p.fm,p.fr,p.fb,p.coarse,p.refined,p.error,p.value,p.converged])));
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
   s+='<line data-marker="'+i+'" x1="'+px+'" x2="'+px+'" y1="'+top+'" y2="'+bottom+'" stroke="currentColor" stroke-dasharray="5 5" opacity=".65"/><text x="'+(px+(right?-4:4))+'" y="80" font-size="13" text-anchor="'+(right?'end':'start')+'">'+esc(m.label)+'</text>';
  }
  return s+"</svg>";
 }

 const STYLE=".frw131{color:var(--fg,#273646)}.frw131 .frw-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.frw131 label{display:flex;flex-direction:column;gap:6px}.frw131 input,.frw131 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.frw131 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.frw131 button[aria-pressed=true]{outline:3px solid #478aaa}.frw131 .frw-scroll{overflow:auto;max-width:100%;margin:16px 0}.frw131 .frw-scroll:focus{outline:3px solid #478aaa}.frw131 .frw-ledger{max-height:420px}.frw131 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.frw131 table{min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.frw131 th,.frw131 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.frw131 .frw-error{color:#c74b39}.frw131 [hidden]{display:none!important}.frw131 fieldset{margin:16px 0;padding:12px}.frw131 details{margin:16px 0}.frw131 summary{cursor:pointer;font-weight:600}.frw131 .frw-legend{font-size:.95em}.frw131 .frw-note{line-height:1.7}.frw131 [hidden]{display:none!important}.frw131 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("frw131-style")){const style=doc.createElement("style");style.id="frw131-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="frw131"><h3>从背景到光：三种可核算的实验</h3><p>先预测，再揭示；错误预测也可继续。参数与预设变化保留预测。ΩΛ 明确等于 1−Ωr−Ωm，非零组分至少为 10⁻⁶。结果中的“—”须结合状态解释，不表示零。</p><div class="frw-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="frw-controls"><label>实验模式<select data-key="mode"><option value="background">平坦背景与视界</option><option value="distance">红移与观测距离</option><option value="photon">纯物质解析光子</option></select></label>'+
   field("omegaR","今天 Ωr（辐射）","background distance")+field("omegaM","今天 Ωm（物质）","background distance")+field("H0","H₀（40–100 km/s/Mpc）","background distance")+field("a","a（0.0001–10）","background")+field("z","z（0–20）","distance")+field("emit","发射 a（0.01–1）","photon")+field("beta","β（0.1–4）","photon")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="frw-error" role="alert"></p><p role="status"></p><div class="frw-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".frw-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   result.innerHTML='<p>'+(d.config.mode==="background"?d.future:d.config.mode==="distance"?"平坦模型 DC=DM，DA=DC/(1+z)，DL=(1+z)DC。z=0 时四个积分距离／回望时间精确为0；不在此处计算零距离通量。":"本模式固定 Ωm=1。光沿局域入射零测地线传播；固有距离先增大不表示局域光速超过 c。")+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="frw-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="frw-scroll frw-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>finite：积分通过本次数值误差估计；divergent：由解析端点判别发散；undefined：模型未定义该年龄；unresolved：数值未达标。估计误差不是严格区间证书。背景曲线有401个对数网格节点，距离／光路径有301个线性节点，另加入当前状态与解析事件；线段只连接这些样本。全部节点、积分诊断与当前状态的每个细分面板都在账本中。图表可聚焦后用方向键横向滚动。</p>';
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
  const near=(x,y)=>Math.abs(x-y)<1e-8;
  const m=snapshot({omegaR:0,omegaM:1});ck(near(m.current.particle,2),"matter past");ck(m.current.integrals.event.status==="divergent","matter future");
  const l=snapshot({omegaR:0,omegaM:0});ck(l.current.integrals.age.status==="undefined","de Sitter age");ck(near(l.current.event,1),"de Sitter event");
  const p=snapshot({mode:"photon"});ck(p.arrival===1&&near(p.turn,4/9)&&p.current.velocity>0,"outside Hubble photon");
  ck(snapshot({omegaR:.4,omegaM:.6}).future.startsWith("物质"),"mixed future");
  ck(quadrature(x=>Math.exp(20*x),false,{depth:0}).status==="unresolved","depth not divergence");
  ck(snapshot({mode:"distance",z:1e-14}).current.lookback>0,"tiny redshift retained");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,scales,expansion,quadrature,integrals,backgroundPoint,distances,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
