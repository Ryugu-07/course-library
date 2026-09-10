(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-pde-fem",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"sine",N:16,kappa:1,A:1,TL:0,TR:0,rule:"midpoint",kL:1,kR:.2,cut:.45,mesh:"fitted",S:1,robin:1,Tinf:0,gL:.5,imbalance:0,mean:0});
 const PRESETS=[
  {id:"sine",label:"正弦源：中点求积"},{id:"exact",label:"解析载荷：节点准了，曲线呢？",rule:"exact"},
  {id:"boundary",label:"非零端温度",TL:1,TR:-1,rule:"gauss2"},
  {id:"zero",label:"没有热源的常温杆",A:0,TL:1,TR:1},
  {id:"interface",label:"两种材料：网格贴合界面",mode:"interface",TL:1,TR:0},
  {id:"unfitted",label:"同一界面：均匀网格",mode:"interface",TL:1,TR:0,mesh:"uniform"},
  {id:"robin",label:"右端与环境换热",mode:"robin"},{id:"insulated",label:"右端绝热，左端定温",mode:"robin",robin:0},
  {id:"neumann",label:"两端热流：相容但不唯一",mode:"neumann"},
  {id:"incompatible",label:"热流收支不平：没有稳态",mode:"neumann",imbalance:.1},
  {id:"shift",label:"相容热流：只改变平均温度",mode:"neumann",mean:1}
 ].map(Object.freeze);
 const QUESTIONS=[
  ["UᵀKU与UᵀF相等，能否直接当成实际热功率守恒？",["不能，这是温度加权的变分恒等式","能，两者量纲就是热功率"],0,"真实热量账要比较总热源与所有向外热流。"],
  ["精确载荷使一维P1解的节点全对，是否说明整条函数精确？",["不说明，节点之间仍是折线","说明，节点足以确定任意连续函数"],0,"全区间函数与梯度误差仍可能非零。"],
  ["两种材料交界、没有点热源时，哪一个量连续？",["温度与热流；温度斜率可以跳变","温度与斜率；热流可以任意跳变"],0,"界面收支约束的是κu′，并非单独的u′。"],
  ["纯Neumann总热流不匹配热源时，增加网格能解决吗？",["不能，先修正物理数据才可能有稳态","能，只要网格足够细"],0,"测试常数给出必要相容条件。"]
 ];
 function num(v,name,lo,hi,int=false){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(name+"必须填写数值");
  const x=Number(v);if(x===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(name+"非零输入小于浮点可表示范围");if(!Number.isFinite(x)||x<lo||x>hi||(int&&!Number.isInteger(x)))throw Error(name+"须在"+lo+"–"+hi+"内"+(int?"且为整数":""));return x;
 }
 function config(raw={}){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode,N:num(p.N,"单元数",2,64,true)};
  if(!["sine","interface","robin","neumann"].includes(s.mode))throw Error("未知模式");
  const get=(k,lo,hi)=>s[k]=num(p[k],k,lo,hi);
  if(s.mode!=="interface")get("kappa",.1,10);
  const amplitude=k=>{get(k,-2,2);if(s[k]!==0&&Math.abs(s[k])<1e-8)throw Error(k+"的非零绝对值须至少为10⁻⁸");};
  if(s.mode==="sine"){["A","TL","TR"].forEach(amplitude);s.rule=p.rule;if(!["exact","midpoint","gauss2"].includes(s.rule))throw Error("未知载荷求积");}
  if(s.mode==="interface"){["TL","TR"].forEach(amplitude);get("kL",.1,10);get("kR",.1,10);get("cut",.15,.85);s.mesh=p.mesh;if(!["uniform","fitted"].includes(s.mesh))throw Error("未知网格");}
  if(s.mode==="robin"){["S","TL","Tinf"].forEach(amplitude);get("robin",0,100);}
  if(s.mode==="neumann"){["S","gL","mean"].forEach(amplitude);get("imbalance",-2,2);if(s.imbalance!==0&&Math.abs(s.imbalance)<1e-100)throw Error("非零收支偏差至少为10⁻¹⁰⁰");s.gR=s.S-s.gL+s.imbalance;}
  return s;
 }
 const G8=[[-.9602898564975363,.1012285362903763],[-.7966664774136267,.2223810344533745],[-.525532409916329,.3137066458778873],[-.1834346424956498,.362683783378362],[.1834346424956498,.362683783378362],[.525532409916329,.3137066458778873],[.7966664774136267,.2223810344533745],[.9602898564975363,.1012285362903763]];
 function mesh(s,N=s.N){
  if(s.mode==="interface"&&s.mesh==="fitted"){
   const nL=Math.max(1,Math.min(N-1,Math.round(N*s.cut))),nR=N-nL;
   return [...Array.from({length:nL},(_,i)=>s.cut*i/nL),...Array.from({length:nR+1},(_,j)=>j===nR?1:s.cut+(1-s.cut)*j/nR)];
  }
  return Array.from({length:N+1},(_,i)=>i===N?1:i/N);
 }
 function exact(s,x){
  if(s.mode==="sine")return s.TL+(s.TR-s.TL)*x+s.A/s.kappa*(x===0||x===1?0:Math.sin(Math.PI*x));
  if(s.mode==="interface"){const R=s.cut/s.kL+(1-s.cut)/s.kR,q=(s.TL-s.TR)/R;return s.TL-q*(Math.min(x,s.cut)/s.kL+Math.max(0,x-s.cut)/s.kR);}
  if(s.mode==="robin"){const c=(s.S+s.robin*s.S/(2*s.kappa)-s.robin*(s.TL-s.Tinf))/(s.kappa+s.robin);return s.TL+c*x-s.S*x*x/(2*s.kappa);}
  const c=s.mean-s.gL/(2*s.kappa)+s.S/(6*s.kappa);return c+s.gL*x/s.kappa-s.S*x*x/(2*s.kappa);
 }
 function exactDerivative(s,x,conductivity){
  if(s.mode==="sine")return s.TR-s.TL+s.A*Math.PI*Math.cos(Math.PI*x)/s.kappa;
  if(s.mode==="interface")return -(s.TL-s.TR)/(s.cut/s.kL+(1-s.cut)/s.kR)/conductivity;
  if(s.mode==="robin")return (s.S+s.robin*s.S/(2*s.kappa)-s.robin*(s.TL-s.Tinf))/(s.kappa+s.robin)-s.S*x/s.kappa;
  return (s.gL-s.S*x)/s.kappa;
 }
 function source(s,x){return s.mode==="interface"?0:s.mode==="sine"?s.A*Math.PI**2*Math.sin(Math.PI*x):s.S;}
 function split(s,a,b){
  if(s.mode!=="interface")return [{a,b,k:s.kappa}];
  const pts=[a,...(a<s.cut&&s.cut<b?[s.cut]:[]),b];
  return pts.slice(0,-1).map((a,i)=>({a,b:pts[i+1],k:pts[i+1]<=s.cut?s.kL:s.kR}));
 }
 function load(s,a,b){
  const h=b-a,m=(a+b)/2;
  if(s.mode==="interface")return {left:0,right:0,points:[],kind:"zero"};
  if(s.mode!=="sine")return {left:s.S*h/2,right:s.S*h/2,points:[],kind:"constant"};
  if(s.rule==="exact"){
   const t=Math.PI*h/2,total=s.A*Math.PI*Math.sin(Math.PI*m)*Math.sin(t),difference=s.A*Math.PI*Math.cos(Math.PI*m)*(Math.cos(t)-Math.sin(t)/t);
   return {left:total+difference,right:total-difference,totalHalf:total,differenceHalf:difference,points:[],kind:"analytic-sine"};
  }
  const rule=s.rule==="midpoint"?[[0,2]]:[[-1/Math.sqrt(3),1],[1/Math.sqrt(3),1]];
  const points=rule.map(([z,w])=>{const x=m+h*z/2,f=source(s,x),weight=h*w/2,L=(1-z)/2,R=(1+z)/2;return {x,weight,f,L,R,left:weight*f*L,right:weight*f*R};});
  return {left:points.reduce((v,q)=>v+q.left,0),right:points.reduce((v,q)=>v+q.right,0),points,kind:s.rule};
 }
 function solve(s,N=s.N,keep=true){
  const xs=mesh(s,N),count=xs.length,diag=Array(count).fill(0),off=Array(count-1).fill(0),F=Array(count).fill(0),elements=[];
  for(let i=0;i<count-1;i++){
   const a=xs[i],b=xs[i+1],h=b-a,parts=split(s,a,b),integralK=parts.reduce((v,p)=>v+p.k*(p.b-p.a),0),stiffness=integralK/(h*h),f=load(s,a,b);
   diag[i]+=stiffness;diag[i+1]+=stiffness;off[i]-=stiffness;F[i]+=f.left;F[i+1]+=f.right;
   elements.push({i,a,b,h,parts,integralK,stiffness,load:f});
  }
  const A=diag.slice(),b=F.slice(),fixed={},gauge=s.mode==="neumann",balance=gauge?{value:-s.imbalance,sign:s.imbalance>0?-1:s.imbalance<0?1:0}:{value:0,sign:0},compatible=balance.sign===0;
  if(s.mode==="sine"||s.mode==="interface"){fixed[0]=s.TL;fixed[count-1]=s.TR;}
  if(s.mode==="robin"){fixed[0]=s.TL;A[count-1]+=s.robin;b[count-1]+=s.robin*s.Tinf;}
  if(gauge){b[0]-=s.gL;b[count-1]-=s.gR;fixed[0]=0;}
  const free=Array.from({length:count},(_,i)=>i).filter(i=>!(i in fixed)),forward=[],backward=[],U=Array(count).fill(null),residual=Array(count).fill(null);
  let shift=null;
  if(compatible){
   const pivots=[],loads=[];
   free.forEach((i,j)=>{
    const left=i>0?off[i-1]:0,right=i<count-1?off[i]:0,correction=(i-1 in fixed?left*fixed[i-1]:0)+(i+1 in fixed?right*fixed[i+1]:0),rhs=b[i]-correction;
    const factor=j?left/pivots[j-1]:0,pivot=A[i]-(j?factor*off[free[j-1]]:0),load=rhs-(j?factor*loads[j-1]:0);
    if(!(pivot>0))throw Error("正定子系统出现非正主元");pivots.push(pivot);loads.push(load);forward.push({i,left,diagonal:A[i],right,original:b[i],correction,rhs,factor,pivot,load});
   });
   for(const [i,v]of Object.entries(fixed))U[+i]=v;
   for(let j=free.length-1;j>=0;j--){const i=free[j],next=j===free.length-1?0:off[i]*U[free[j+1]],value=(loads[j]-next)/pivots[j];U[i]=value;backward.push({i,load:loads[j],next,pivot:pivots[j],value});}
   if(gauge){const integral=elements.reduce((v,e)=>v+e.h*(U[e.i]+U[e.i+1])/2,0);shift=s.mean-integral;for(let i=0;i<count;i++)U[i]+=shift;}
   for(let i=0;i<count;i++)residual[i]=A[i]*U[i]+(i?off[i-1]*U[i-1]:0)+(i<count-1?off[i]*U[i+1]:0)-b[i];
  }
  let h1=0,l2=0,energy=0,weightedSource=0,mean=0,nodeL2=0;
  const errors=[],fluxParts=[];
  if(compatible)for(const e of elements){
   const i=e.i,left=U[i],right=U[i+1],slope=(right-left)/e.h;energy+=e.integralK*slope*slope;mean+=e.h*(left+right)/2;weightedSource+=e.load.left*left+e.load.right*right;
   nodeL2+=e.h*((left-exact(s,e.a))**2+(right-exact(s,e.b))**2)/2;
   for(const part of e.parts){
    const h=part.b-part.a,m=(part.a+part.b)/2,nodes=G8.map(([z,w])=>{
     const x=m+h*z/2,weight=h*w/2,uh=left+slope*(x-e.a),u=exact(s,x),du=exactDerivative(s,x,part.k),error=uh-u,derivativeError=slope-du;
     return {x,weight,uh,u,du,error,derivativeError,l2:weight*error*error,h1:weight*derivativeError*derivativeError};
    });
    const eh1=nodes.reduce((v,q)=>v+q.h1,0),el2=nodes.reduce((v,q)=>v+q.l2,0);h1+=eh1;l2+=el2;
    errors.push({element:i,a:part.a,b:part.b,k:part.k,slope,h1:eh1,l2:el2,nodes});
    fluxParts.push({element:i,a:part.a,b:part.b,k:part.k,flux:-part.k*slope,meanElementFlux:-e.integralK/e.h*slope});
   }
   Object.assign(e,{left,right,slope});
  }
  let gLeft=null,gRight=null,rawLeft=null,rawRight=null,weightedBoundary=null,heatResidual=null,trueHeatResidual=null,weightedResidual=null;
  const totalSource=F.reduce((v,x)=>v+x,0),exactSource=s.mode==="sine"?2*s.A*Math.PI:s.mode==="interface"?0:s.S;
  if(compatible){
   gLeft=gauge?s.gL:-residual[0];gRight=gauge?s.gR:s.mode==="robin"?s.robin*(U[count-1]-s.Tinf):-residual[count-1];
   rawLeft=-fluxParts[0].flux;rawRight=fluxParts[fluxParts.length-1].flux;
   weightedBoundary=U[0]*gLeft+U[count-1]*gRight;heatResidual=gLeft+gRight-totalSource;trueHeatResidual=gLeft+gRight-exactSource;
   weightedResidual=energy-weightedSource+weightedBoundary;
  }
  const nodes=xs.map((x,i)=>({i,x,value:U[i],exact:compatible?exact(s,x):null,error:compatible?U[i]-exact(s,x):null,residual:residual[i],diagonal:diag[i],systemDiagonal:A[i],source:F[i],rhs:b[i],fixed:i in fixed,gauge:gauge&&i===0}));
  const algebraicResidual=compatible?Math.max(...residual.filter((v,i)=>gauge||!(i in fixed)).map(Math.abs)):null;
  return {N,elementsCount:count-1,status:compatible?(gauge?"compatible-with-chosen-mean":"unique"):"no-steady-solution",compatible,balance,shift,mean:compatible?mean:null,
   h1Error:compatible?Math.sqrt(h1):null,l2Error:compatible?Math.sqrt(l2):null,nodeL2:compatible?Math.sqrt(nodeL2):null,maxNodeError:compatible?Math.max(...nodes.map(v=>Math.abs(v.error))):null,
   energy:compatible?energy:null,weightedSource:compatible?weightedSource:null,weightedBoundary,weightedResidual,totalSource,exactSource,sourceQuadratureError:totalSource-exactSource,
   gLeft,gRight,rawLeft,rawRight,heatResidual,trueHeatResidual,algebraicResidual,minPivot:forward.length?Math.min(...forward.map(v=>v.pivot)):null,
   nodes:keep?nodes:[],elements:keep?elements:[],errors:keep?errors:[],fluxParts:keep?fluxParts:[],forward:keep?forward:[],backward:keep?backward:[],off:keep?off:[]};
 }
 function snapshot(raw={}){
  const s=config(raw),p=solve(s),profile=[];
  const xs=Array.from(new Set([...Array.from({length:257},(_,i)=>i/256),...p.nodes.map(v=>v.x),...(s.mode==="interface"?[s.cut]:[])])).sort((a,b)=>a-b);
  for(const x of xs){let i=0;while(i<p.nodes.length-2&&x>p.nodes[i+1].x)i++;const a=p.nodes[i],b=p.nodes[i+1];profile.push({x,exact:p.compatible?exact(s,x):null,finite:p.compatible?a.value+(b.value-a.value)*(x-a.x)/(b.x-a.x):null});}
  const nodes=Array.from({length:63},(_,i)=>solve(s,i+2,false));
  return {config:s,current:p,profile,nodes};
 }
 function fmt(x){
  if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
  if(!Number.isFinite(x))throw Error("非有限计算结果");if(x===0)return "0";
  return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 function series(key,label,color,points){return {key,label,color,points,line:true};}
 function plot(title,x,y,ss,xmin,xmax,markers=[]){
  const ys=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
  return {title,x,y,xmin,xmax,ymin:lo-pad,ymax:hi+pad,series:ss,markers};
 }
 function plots(d){
  const s=d.config,p=d.current,B="#268bd2",O="#cb6a16",G="#29966c";
  if(!p.compatible)return [plot("指定热流不相容：不存在稳态温度解","x","未定义",[],0,1)];
  const truth=d.profile.map(v=>[v.x,-(s.mode==="interface"?(v.x<=s.cut?s.kL:s.kR):s.kappa)*exactDerivative(s,v.x,s.mode==="interface"?(v.x<=s.cut?s.kL:s.kR):s.kappa)]);
  const fs=[series("exact","连续问题精确热流",B,truth),...p.fluxParts.map((v,i)=>series("flux-"+i,"P1梯度给出的单侧热流",O,[[v.a,v.flux],[v.b,v.flux]]))];
  return [
   plot("节点对照之外：整条温度曲线","x ∈ [0,1]","无量纲温差 θ",[series("exact","解析温度",B,d.profile.map(v=>[v.x,v.exact])),series("finite","实际求解的P1折线",O,d.profile.map(v=>[v.x,v.finite]))],0,1,s.mode==="interface"?[{x:s.cut,label:"材料界面"}]:[]),
   plot("热流看梯度，热量账还要看边界反力","x；各小段端点表示单侧极限","无量纲热流；向右为正",fs,0,1,s.mode==="interface"?[{x:s.cut,label:"材料界面"}]:[]),
   plot("全区间误差随网格变化：线性坐标保留零值","指定单元数 N","误差范数",[
    series("h1","梯度L2误差",B,d.nodes.map(v=>[v.N,v.h1Error])),
    series("l2","函数L2误差",O,d.nodes.map(v=>[v.N,v.l2Error])),
    series("node","离散节点L2误差",G,d.nodes.map(v=>[v.N,v.nodeL2]))
   ],2,64,[{x:s.N,label:"当前 N"}])
  ];
 }
 function ledgers(d){
  const s=d.config,p=d.current;
  const select=(vs,keys)=>vs.map(v=>keys.map(k=>v[k]));
  return [
   {key:"summary",title:"三种账本分别核对",headers:["量","值"],rows:[
    ["当前解状态",p.status],["纯Neumann源减去向外热流（恒等于−Δ）",p.balance.value],["右端gR=S−gL+Δ（近似读数）",s.gR],
    ["全区间梯度L2误差",p.h1Error],["全区间函数L2误差",p.l2Error],["离散节点L2误差",p.nodeL2],["最大节点误差",p.maxNodeError],
    ["求积的总热源",p.totalSource],["连续精确总热源",p.exactSource],["总热源求积偏差",p.sourceQuadratureError],
    ["左端向外热流（约束反力/给定值）",p.gLeft],["右端向外热流（反力/Robin/给定值）",p.gRight],["实际梯度左端向外热流",p.rawLeft],["实际梯度右端向外热流",p.rawRight],
    ["向外热流和减求积总源",p.heatResidual],["向外热流和减连续总源",p.trueHeatResidual],
    ["温度加权：UᵀKU",p.energy],["温度加权：UᵀF（体源）",p.weightedSource],["温度加权：边界ΣU·g",p.weightedBoundary],["加权式左减右",p.weightedResidual],
    ["自由行最大残差（纯N包括所有行）",p.algebraicResidual],["最小正主元",p.minPivot],["P1函数积分平均",p.mean],["纯N计算规范后的常数平移",p.shift]
   ]},
   {key:"nodes",title:"全部63个网格的误差和收支",headers:["N","状态","梯度L2","函数L2","节点L2","节点最大误差","求积源偏差","反力热量残差","相对连续源残差","加权式残差","方程残差"],rows:select(d.nodes,["N","status","h1Error","l2Error","nodeL2","maxNodeError","sourceQuadratureError","heatResidual","trueHeatResidual","weightedResidual","algebraicResidual"])},
   {key:"mesh",title:"完整未删除边界的节点系统",headers:["i","x","求解温度","精确温度","节点差","系统残差/约束反力","纯导热对角","含Robin对角","体源载荷","含边界载荷","固定点","仅计算规范","右邻非对角"],rows:p.nodes.map((v,i)=>[...["i","x","value","exact","error","residual","diagonal","systemDiagonal","source","rhs","fixed","gauge"].map(k=>v[k]),p.off[i]])},
   {key:"elements",title:"逐单元刚度、载荷和真实斜率",headers:["i","左端","右端","h","∫κdx","刚度因子","左载荷","右载荷","求积规则","解析总量一半","解析左右差一半","左温度","右温度","斜率"],rows:p.elements.map(v=>[v.i,v.a,v.b,v.h,v.integralK,v.stiffness,v.load.left,v.load.right,v.load.kind,v.load.totalHalf,v.load.differenceHalf,v.left,v.right,v.slope])},
   {key:"load",title:"载荷求积全部节点（解析积分不伪造节点）",headers:["单元","x","物理权重","源值","左形函数","右形函数","左贡献","右贡献"],rows:p.elements.flatMap(e=>e.load.points.map(v=>[e.i,...["x","weight","f","L","R","left","right"].map(k=>v[k])]))},
   {key:"forward",title:"边界修正与Thomas每一步前消",headers:["i","下对角","对角","上对角","原载荷","边界修正","修正后载荷","消元乘子","新主元","新载荷"],rows:select(p.forward,["i","left","diagonal","right","original","correction","rhs","factor","pivot","load"])},
   {key:"backward",title:"每一步回代（纯N平移前的计算规范）",headers:["i","新载荷","上对角乘下个值","主元","值"],rows:select(p.backward,["i","load","next","pivot","value"])},
   {key:"parts",title:"按材料切分后的实际误差积分",headers:["单元","积分左端","积分右端","材料κ","离散斜率","梯度误差平方","函数误差平方"],rows:select(p.errors,["element","a","b","k","slope","h1","l2"])},
   {key:"quadrature",title:"误差积分全部Gauss8节点与贡献",headers:["单元","x","权重","P1值","解析值","解析导数","函数误差","导数误差","L2平方贡献","梯度平方贡献"],rows:p.errors.flatMap(e=>e.nodes.map(v=>[e.element,...["x","weight","uh","u","du","error","derivativeError","l2","h1"].map(k=>v[k])]))},
   {key:"flux",title:"物理单侧热流与单元平均热流",headers:["单元","左端","右端","κ","单侧−κu′h","单元平均−κ平均·u′h"],rows:select(p.fluxParts,["element","a","b","k","flux","meanElementFlux"])},
   {key:"profile",title:"曲线全部节点，含网格折点与材料界面",headers:["x","解析温度","求解P1值"],rows:select(d.profile,["x","exact","finite"])}
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

 const STYLE=".fem138{color:var(--fg,#273646)}.fem138 .fem-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.fem138 label{display:flex;flex-direction:column;gap:6px}.fem138 input,.fem138 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.fem138 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.fem138 button[aria-pressed=true]{outline:3px solid #478aaa}.fem138 .fem-scroll{overflow:auto;max-width:100%;margin:16px 0}.fem138 .fem-scroll:focus{outline:3px solid #478aaa}.fem138 .fem-ledger{max-height:420px}.fem138 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.fem138 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.fem138 th,.fem138 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.fem138 .fem-error{color:#c74b39}.fem138 [hidden]{display:none!important}.fem138 fieldset{margin:16px 0;padding:12px}.fem138 details{margin:16px 0}.fem138 summary{cursor:pointer;font-weight:600}.fem138 .fem-legend{font-size:.95em}.fem138 .fem-note{line-height:1.7}.fem138 [hidden]{display:none!important}.fem138 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("fem138-style")){const style=doc.createElement("style");style.id="fem138-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="fem138"><h3>解出温度之后，再核对边界与热量</h3><p>先预测再揭示。所有参数均采用正文定义的无量纲尺度；温度θ不是绝对温度。体热源、向外热流和温度加权恒等式分别记账。</p><div class="fem-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="fem-controls"><label>模式<select data-key="mode"><option value="sine">正弦源与载荷求积</option><option value="interface">复合杆材料界面</option><option value="robin">定温与Robin换热</option><option value="neumann">纯Neumann热流边界</option></select></label>'+
   field("N","单元数N（2–64整数）","sine interface robin neumann")+field("kappa","导热率κ（0.1–10）","sine robin neumann")+
   field("A","正弦源幅度A（−2–2）","sine")+field("TL","左端温度θL（−2–2）","sine interface robin")+field("TR","右端温度θR（−2–2）","sine interface")+
   '<label data-modes="sine">载荷积分<select data-key="rule"><option value="midpoint">每单元中点</option><option value="gauss2">每单元Gauss2</option><option value="exact">解析正弦积分</option></select></label>'+
   field("kL","左材料κ（0.1–10）","interface")+field("kR","右材料κ（0.1–10）","interface")+field("cut","界面位置（0.15–0.85）","interface")+
   '<label data-modes="interface">网格<select data-key="mesh"><option value="fitted">同样N个单元，贴合界面</option><option value="uniform">全区间均匀</option></select></label>'+
   field("S","恒定体热源S（−2–2）","robin neumann")+field("robin","右端换热系数b（0–100）","robin")+field("Tinf","右侧环境温度θ∞（−2–2）","robin")+
   field("gL","左端向外热流gL（−2–2）","neumann")+field("imbalance","收支偏差Δ（−2–2，非零至少10⁻¹⁰⁰）","neumann")+field("mean","指定平均温度（−2–2）","neumann")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="fem-error" role="alert"></p><p role="status"></p><div class="fem-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".fem-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={sine:"三种载荷规则解的是不同的离散右端。节点误差、全区间函数误差和梯度误差分别计算。精确载荷可在本一维常系数问题中给出精确节点，仍不使正弦变成折线。",interface:"同样N个单元，贴合网格按两侧长度分配单元，并把界面作为共同端点；均匀网格可能跨界。跨界单元仍精确积分导热率，绝非随意指定一种材料。物理热流由每种材料κ乘同一个P1斜率给出，可能跳变；单元平均通量守恒不等于局部通量准确。",robin:"右侧向外热流为b(θ−θ∞)，同时修改刚度和载荷。b=0表示右端绝热；左端仍固定温度，因此不产生纯Neumann的常数自由度。",neumann:"右端热流按模型定义为gR=S−gL+Δ。Δ=0才相容；很小但非零的Δ仍无稳态。gR只显示近似数值，不能用这个舍入读数重新判断相容性。相容后仍需选平均温度；临时固定首点只用于计算规范，随后按P1的精确积分平移。无稳态时不生成假温度曲线，也不擅自减去平均载荷。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="fem-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="fem-scroll fem-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>热量账用边界反力/指定热流；由端点P1斜率直接算出的热流另列，两者不一般相同。误差用每个材料子段的Gauss8积分，独立更高阶规则验算；这仍是数值积分，不是严格区间界。曲线包含257个基础点、全部网格折点及界面。纯N的前消回代是平移前计算规范，节点表是指定平均值后的物理解代表。零值、无解和很小的非零值分别保留。</p>';
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
  const a=solve(config());ck(a.l2Error>a.nodeL2,"whole error differs from nodal");
  ck(Math.abs(a.heatResidual)<1e-10&&Math.abs(a.trueHeatResidual)>1e-3,"quadrature heat versus physical source");
  const b=solve(config({rule:"exact"}));ck(b.maxNodeError<1e-12&&b.l2Error>.001,"exact nodes not exact curve");
  const c=solve(config({mode:"interface",TL:1}));ck(c.h1Error<1e-12,"fitted exact FE space");
  const u=solve(config({mode:"interface",TL:1,mesh:"uniform"}));ck(u.h1Error>.1&&Math.abs(u.heatResidual)<1e-10,"balance not accuracy");
  const n=solve(config({mode:"neumann"}));ck(n.compatible&&Math.abs(n.mean)<1e-12,"chosen mean");
  ck(!solve(config({mode:"neumann",imbalance:1e-100})).compatible,"near incompatible preserved");
  const r=solve(config({mode:"robin",robin:0}));ck(r.gRight===0&&r.status==="unique","one Dirichlet still unique");
  ck(solve(config({mode:"neumann",S:.3,gL:.1,imbalance:0})).compatible,"decimal inputs do not create an artificial physical imbalance");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,mesh,exact,exactDerivative,source,split,load,solve,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
