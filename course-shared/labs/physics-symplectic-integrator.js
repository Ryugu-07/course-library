(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-symplectic-integrator",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS=Object.freeze({mode:"harmonic",method:"verlet",h:.2,steps:256,omega:1,q0:1,p0:0,epsilon:.5,h0:.5,stretch:2});
 const PRESETS=[
  {id:"harmonic",label:"谐振子：能量与相位"}, {id:"midpoint",label:"中点：能量精确，时间仍有偏差",method:"midpoint"},
  {id:"rk4",label:"RK4：高阶与面积因子",method:"rk4"},{id:"euler",label:"Euler：假加热",method:"euler",steps:128},
  {id:"boundary",label:"Verlet边界：初值会隐藏Jordan增长",h:2,steps:32,p0:.1},
  {id:"boundary-hidden",label:"同一边界：特殊初值仍有界",h:2,steps:32},
  {id:"unstable",label:"辛但不稳定",h:2.1,steps:32,p0:.1},
  {id:"zero",label:"零初值：相对误差无定义",q0:0,p0:0},
  {id:"well",label:"双阱：井内真实积分",mode:"doublewell",q0:.9,h:.05},
  {id:"saddle",label:"双阱：物理不稳定平衡附近",mode:"doublewell",q0:.01,h:.05},
  {id:"equilibrium",label:"双阱：精确井底平衡",mode:"doublewell",q0:1,h:.05},
  {id:"geometry",label:"能量/体积保持，是否足够？",mode:"geometry"}
 ].map(Object.freeze);
 const QUESTIONS=[
  ["Verlet在ωh=2时，两根均为−1，是否就对所有初值稳定？",["不是，Jordan块可产生线性增长","是，根在单位圆上已经足够"],0,"还要检查重根是否有非平凡Jordan块。"],
  ["谐振子的原始能量精确保住，是否意味着相位也准确？",["不意味着，中点法仍有数值频率偏差","意味着，圆轨道上每个时刻都已确定"],0,"轨道所在的圆与绕圆行进的速度分别检查。"],
  ["四维相空间的体积因子为1，是否能直接判定辛性？",["不能，还要检查MᵀJM=J","能，体积就是全部辛结构"],0,"两个共轭平面的面积可能一大一小，体积仍不变。"],
  ["双阱鞍点附近轨迹分离，就能判定算法不稳定吗？",["不能，连续系统本来就有实指数增长方向","能，保守系统不可能有指数分离"],0,"先把物理线性化与离散放大因子对照。"]
 ];
 function num(v,key,lo,hi,int=false){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(key+"必须填写数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi||(int&&!Number.isInteger(x)))throw Error(key+"须在"+lo+"–"+hi+"内"+(int?"且为整数":""));
  if(x===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(key+"非零输入下溢");return x;
 }
 function config(raw={}){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数必须为对象");
  const p={...DEFAULTS,...raw},s={mode:p.mode};if(!["harmonic","doublewell","geometry"].includes(s.mode))throw Error("未知模型");
  const get=(key,lo,hi,int=false)=>s[key]=num(p[key],key,lo,hi,int);
  if(s.mode==="geometry"){get("epsilon",0,.8);get("h0",.02,1);get("stretch",.25,4);return s;}
  s.method=p.method;if(!["verlet","euler","rk4",...(s.mode==="harmonic"?["midpoint"]:[])].includes(s.method))throw Error("该模型不支持这个积分方法");
  get("h",.001,s.mode==="harmonic"?3:.2);get("steps",1,s.mode==="harmonic"?2048:1024,true);
  for(const key of ["q0","p0"]){get(key,-2,2);if(s[key]!==0&&Math.abs(s[key])<1e-8)throw Error(key+"的非零绝对值至少10⁻⁸");}
  if(s.mode==="harmonic")get("omega",.25,3);return s;
 }
 const I=[1,0,0,1],mul=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3]];
 const add=(a,b,c=1)=>a.map((v,i)=>v+c*b[i]),det=a=>a[0]*a[3]-a[1]*a[2];
 function rational(x){
  const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x);const bits=v.getBigUint64(0),e=Number((bits>>52n)&2047n)-1075,m=(bits&((1n<<52n)-1n))+(1n<<52n);
  return e>=0?[m<<BigInt(e),1n]:[m,1n<<BigInt(-e)];
 }
 function productSquareGap(c,a,b){
  // Positive normal inputs only; retain the exact sign of c-(a*b)^2.
  const [A,D]=rational(a),[B,E]=rational(b),den=D*D*E*E,n=BigInt(c)*den-A*A*B*B;
  return {value:Number(n)/Number(den),sign:n>0n?1:n<0n?-1:0};
 }
 function potential(s,q){return s.mode==="harmonic"?.5*s.omega*s.omega*q*q:q*q*q*q/4-q*q/2;}
 function gradient(s,q){return s.mode==="harmonic"?s.omega*s.omega*q:q*q*q-q;}
 function curvature(s,q){return s.mode==="harmonic"?s.omega*s.omega:3*q*q-1;}
 function energy(s,z){return .5*z.p*z.p+potential(s,z.q);}
 function exact(s,t){
  const w=s.omega,c=Math.cos(w*t),v=Math.sin(w*t);return {q:s.q0*c+s.p0/w*v,p:s.p0*c-w*s.q0*v};
 }
 function step(s,z,h,method=s.method,detail=false){
  const stages=[];let q,p,J;
  const row=(name,u,dq,dp)=>{if(detail)stages.push({name,q:u.q,p:u.p,dq,dp,gradient:gradient(s,u.q),curvature:curvature(s,u.q)});};
  if(method==="verlet"){
   const ph=z.p-h*gradient(s,z.q)/2;row("第一次半kick",z,0,-gradient(s,z.q));
   q=z.q+h*ph;row("完整drift",{q:z.q,p:ph},ph,0);p=ph-h*gradient(s,q)/2;row("第二次半kick",{q,p:ph},0,-gradient(s,q));
   if(detail)J=mul([1,0,-h*curvature(s,q)/2,1],mul([1,h,0,1],[1,0,-h*curvature(s,z.q)/2,1]));
  }else if(method==="euler"){
   row("Euler斜率",z,z.p,-gradient(s,z.q));q=z.q+h*z.p;p=z.p-h*gradient(s,z.q);if(detail)J=[1,h,-h*curvature(s,z.q),1];
  }else if(method==="midpoint"){
   const w2=s.omega*s.omega,d=1+h*h*w2/4,a=(1-h*h*w2/4)/d,b=h/d,c=-h*w2/d;
   q=a*z.q+b*z.p;p=c*z.q+a*z.p;row("隐式中点满足处",{q:(z.q+q)/2,p:(z.p+p)/2},(z.p+p)/2,-w2*(z.q+q)/2);if(detail)J=[a,b,c,a];
  }else{
   const f=u=>({q:u.p,p:-gradient(s,u.q)}),plus=(u,v,c)=>({q:u.q+c*v.q,p:u.p+c*v.p});
   const z1=z,k1=f(z1),z2=plus(z,k1,h/2),k2=f(z2),z3=plus(z,k2,h/2),k3=f(z3),z4=plus(z,k3,h),k4=f(z4);
   [z1,z2,z3,z4].forEach((v,i)=>{const k=[k1,k2,k3,k4][i];row("RK4 k"+(i+1),v,k.q,k.p);});
   q=z.q+h*(k1.q+2*k2.q+2*k3.q+k4.q)/6;p=z.p+h*(k1.p+2*k2.p+2*k3.p+k4.p)/6;
   if(detail){
    const A=u=>[0,1,-curvature(s,u.q),0],j1=A(z1),j2=mul(A(z2),add(I,j1,h/2)),j3=mul(A(z3),add(I,j2,h/2)),j4=mul(A(z4),add(I,j3,h));
    J=add(I,j1.map((v,i)=>(v+2*j2[i]+2*j3[i]+j4[i])/6),h);
   }
  }
  return {q,p,J,stages};
 }
 function harmonicTheory(s,h=s.h){
  const z=s.omega*h,gap=productSquareGap(4,s.omega,Math.abs(h)),gap8=productSquareGap(8,s.omega,Math.abs(h)),c=gap.value/4;
  let status,theta=null,energyFactor=null,invariantCoefficient=null,modifiedScale=null;
  if(s.method==="verlet"){
   status=gap.sign>0?"power-bounded":gap.sign===0?"Jordan-boundary":"exponential-growth";
   invariantCoefficient=s.omega*s.omega*c;
   if(gap.sign>0){theta=2*Math.atan2(z/2,Math.sqrt(c));modifiedScale=theta/(z*Math.sqrt(c));}
  }else if(s.method==="midpoint"){status="power-bounded";theta=2*Math.atan(z/2);energyFactor=1;invariantCoefficient=s.omega*s.omega;}
  else if(s.method==="euler"){status="exponential-growth";theta=Math.atan(z);energyFactor=1+z*z;}
  else{status=gap8.sign>0?"contractive":gap8.sign===0?"unit-modulus-boundary":"exponential-growth";theta=Math.atan2(z-z**3/6,1-z*z/2+z**4/24);energyFactor=1-z**6*gap8.value/576;}
  const J=step(s,{q:0,p:0},h,s.method,true).J;
  return {z,c,gap:gap.value,gapSign:gap.sign,gap8:gap8.value,gap8Sign:gap8.sign,status,theta,frequency:theta===null?null:theta/h,energyFactor,invariantCoefficient,modifiedScale,matrix:J,determinant:det(J),symplecticResidual:Math.SQRT2*Math.abs(det(J)-1)};
 }
 function integrate(s,h=s.h,count=s.steps,keep=true,method=s.method,substeps=1,initial=null){
  let z=initial||{q:s.q0,p:s.p0},stoppedAt=null,maxEnergyError=0;
  const H0=energy(s,z),trace=[],stages=[],theory=s.mode==="harmonic"?harmonicTheory({...s,method},h):null;
  const invariant=u=>theory&&theory.invariantCoefficient!==null?.5*(u.p*u.p+theory.invariantCoefficient*u.q*u.q):null;
  const I0=invariant(z),scale=s.mode==="harmonic"?s.omega:1,limit=s.mode==="harmonic"?1e100:1e12;
  function save(i,u){
   const E=energy(s,u),truth=s.mode==="harmonic"&&!initial?exact(s,i*h):null,inv=invariant(u),delta=E-H0;
   maxEnergyError=Math.max(maxEnergyError,Math.abs(delta));
   const v={i,t:i*h,q:u.q,p:u.p,energy:E,deltaEnergy:delta,relativeEnergy:H0===0?null:delta/Math.abs(H0),invariant:inv,deltaInvariant:inv===null?null:inv-I0,exactQ:truth?truth.q:null,exactP:truth?truth.p:null,error:truth?Math.hypot(u.q-truth.q,(u.p-truth.p)/scale):null};
   if(keep||i===count||i===0)trace.push(v);return v;
  }
  let last=save(0,z);
  for(let i=1;i<=count;i++){
   let next=z,local=[];
   for(let j=0;j<substeps;j++){
    const v=step(s,next,h/substeps,method,keep&&substeps===1);
    const finite=[v.q,v.p,energy(s,v),...(v.J||[]),...v.stages.flatMap(v=>[v.q,v.p,v.dq,v.dp,v.gradient,v.curvature])].every(Number.isFinite);
    if(!finite||Math.max(Math.abs(v.q),Math.abs(v.p))>limit){stoppedAt={step:i,substep:j+1,reason:"finite-display-range"};break;}
    if(keep&&substeps===1)local=v.stages.map((v,j)=>({step:i,stage:j+1,...v,determinant:det(v.J||I)}));
    next={q:v.q,p:v.p};
    if(keep&&substeps===1){const D=det(v.J);local.forEach(r=>{r.determinant=D;r.J=v.J;});}
   }
   if(stoppedAt)break;z=next;stages.push(...local);last=save(i,z);
  }
  return {h,requestedSteps:count,completedSteps:last.i,requestedTime:h*count,time:last.t,complete:stoppedAt===null,stoppedAt,initialEnergy:H0,initialInvariant:I0,final:last,maxEnergyError,theory,trace,stages};
 }
 function reverse(s,forward){
  if(!forward.complete)return null;
  const r=integrate(s,-s.h,s.steps,true,s.method,1,{q:forward.final.q,p:forward.final.p});
  return {...r,returnError:r.complete?Math.hypot(r.final.q-s.q0,r.final.p-s.p0):null};
 }
 function convergence(s){
  const T=s.mode==="harmonic"?8.5*Math.PI/s.omega:8,counts=[8,16,32,64,128,256,512],ref=s.mode==="doublewell"?integrate(s,T/512,512,false,"rk4",32):null,refCoarse=s.mode==="doublewell"?integrate(s,T/512,512,false,"rk4",16):null;
  const referenceDifference=ref&&ref.complete&&refCoarse.complete?Math.hypot(ref.final.q-refCoarse.final.q,ref.final.p-refCoarse.final.p):null;
  const rows=counts.map(N=>{
   const h=T/N,r=integrate(s,h,N,false),truth=s.mode==="harmonic"?exact(s,T):ref.complete?ref.final:null;
   const error=r.complete&&truth?Math.hypot(r.final.q-truth.q,r.final.p-truth.p):null;
   return {N,h,T,complete:r.complete,actualTime:r.time,q:r.final.q,p:r.final.p,error,maxEnergyError:r.maxEnergyError,order:null};
  });
  for(let i=1;i<rows.length;i++){
   const a=rows[i-1],b=rows[i],floor=Math.max(1e-12,referenceDifference===null?0:10*referenceDifference);if(a.error!==null&&b.error!==null&&a.error>floor&&b.error>floor)b.order=Math.log(a.error/b.error)/Math.log(2);
  }
  return {T,reference:ref?{method:"RK4",step:T/(512*32),complete:ref.complete,q:ref.final.q,p:ref.final.p,coarseQ:refCoarse.final.q,coarseP:refCoarse.final.p,difference:referenceDifference}:null,rows};
 }
 function geometry(s){
  const points=Array.from({length:257},(_,i)=>{
   const angle=2*Math.PI*i/256,cardinal=i%64===0?[[1,0],[0,1],[-1,0],[0,-1],[1,0]][i/64]:null,q=cardinal?cardinal[0]:Math.cos(angle),p=cardinal?cardinal[1]:Math.sin(angle),h=s.h0*(1+s.epsilon*q),c=Math.cos(h),v=Math.sin(h),Q=q*c+p*v,P=p*c-q*v,g=s.h0*s.epsilon;
   const J=[c+P*g,v,-v-Q*g,c],D=det(J);
   return {i,angle,q,p,h,Q,P,J,determinant:D,theoreticalDeterminant:1+g*p,energy:.5*(Q*Q+P*P),energyError:.5*(Q*Q+P*P-q*q-p*p),symplecticResidual:Math.SQRT2*Math.abs(D-1)};
  });
  const a=s.stretch,diag=[a,1/a,1,1],J4=[[0,0,1,0],[0,0,0,1],[-1,0,0,0],[0,-1,0,0]];
  const residual=J4.map((row,i)=>row.map((v,j)=>(diag[i]*diag[j]-1)*v));
  return {points,diag,residual,determinant:diag.reduce((v,x)=>v*x,1),symplecticResidual:Math.hypot(...residual.flat()),area1:a,area2:1/a};
 }
 function snapshot(raw={}){
  const s=config(raw);if(s.mode==="geometry")return {config:s,current:geometry(s)};
  const current=integrate(s),backward=reverse(s,current),study=convergence(s);
  let reference=null;
  if(s.mode==="doublewell"){
   const coarse=integrate(s,s.h,s.steps,true,"rk4",16),fine=integrate(s,s.h,s.steps,true,"rk4",32);
   reference={coarse,fine,difference:coarse.complete&&fine.complete?Math.hypot(coarse.final.q-fine.final.q,coarse.final.p-fine.final.p):null};
  }
  return {config:s,current,backward,study,reference};
 }

 function fmt(x){
  if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
  if(!Number.isFinite(x))throw Error("非有限数值不能显示为有效结果");if(x===0)return "0";
  return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 function series(key,label,color,points,line=true){return {key,label,color,points,line};}
 function plot(title,x,y,ss,xmin,xmax,square=false){
  const ys=ss.flatMap(s=>s.points.map(v=>v[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
  if(square){
   const r=1.08*Math.max(1,...ss.flatMap(s=>s.points.flatMap(v=>v.map(Math.abs))));
   return {title,x,y,series:ss,xmin:-r,xmax:r,ymin:-r,ymax:r,square,markers:[],xTicks:[-r,0,r]};
  }
  return {title,x,y,series:ss,xmin,xmax,ymin:lo-pad,ymax:hi+pad,square,markers:[]};
 }
 function plots(d){
  const s=d.config,p=d.current,B="#268bd2",O="#cb6a16",G="#29966c";
  if(s.mode==="geometry"){
   const points=p.points,blue=series("input","输入单位圆等角节点",B,points.map(v=>[v.q,v.p]));
   return [
    plot("圆仍是同一个圆，节点之间的面积却变了","q；横纵单位长度相同","p；等比例",[
     blue,series("output","状态依赖步长后的点",O,points.map(v=>[v.Q,v.P]),false)],-1,1,true),
    plot("局部面积因子：能量保持不等于辛性","输入相角 / π","det DΦ",[
     series("actual","实际Jacobian行列式",O,points.map(v=>[v.angle/Math.PI,v.determinant])),
     series("one","辛映射要求的1",B,points.map(v=>[v.angle/Math.PI,1]))],0,2),
    plot("四维体积不变：两个共轭平面可以互相抵消","q₁或q₂；等比例","p₁或p₂",[
     blue,series("plane1","第一共轭平面，面积×a",O,points.map(v=>[s.stretch*v.q,v.p])),
     series("plane2","第二共轭平面，面积×1/a",G,points.map(v=>[v.q/s.stretch,v.p]))],-1,1,true)
   ];
  }
  const truth=s.mode==="harmonic"?Array.from({length:257},(_,i)=>i===256?{q:s.q0,p:s.p0}:exact(s,2*Math.PI*i/(256*s.omega))):d.reference.fine.trace;
  const referenceName=s.mode==="harmonic"?"连续解析能量轨道（完整一圈）":"RK4每宏步32子步的数值参考";
  const scale=s.mode==="harmonic"?s.omega:1;
  const phase=plot("同一相轨道位置，还要核对到达它的时刻","q；横纵单位长度相同",s.mode==="harmonic"?"p/ω；等比例":"p；等比例",[
   series("reference",referenceName,B,truth.map(v=>[v.q,v.p/scale])),
   series("actual","当前方法的每一个实际步",O,p.trace.map(v=>[v.q,v.p/scale]))],-1,1,true);
  const energySeries=[series("energy","原始Hamilton量变化 ΔH",O,p.trace.map(v=>[v.t,v.deltaEnergy]))];
  if(p.theory&&p.theory.invariantCoefficient!==null)energySeries.push(series("invariant","离散二次不变量变化 ΔI",G,p.trace.map(v=>[v.t,v.deltaInvariant])));
  if(d.reference)energySeries.push(series("reference","细参考自身的 ΔH",B,truth.map(v=>[v.t,v.deltaEnergy])));
  const energyPlot=plot("能量变化单独记账；初始能量为零也保留绝对误差","实际计算时间 t","绝对能量变化",energySeries,0,p.requestedTime);
  const third=s.mode==="harmonic"?plot("能量有界，不保证相位和相点仍然准确","实际计算时间 t","√(Δq²+(Δp/ω)²)",[
   series("state-error","相对连续解析解的相点距离",B,p.trace.map(v=>[v.t,v.error]))],0,p.requestedTime):
   plot("双阱：能量相近的轨道，位置仍可能逐渐分离","实际计算时间 t","位置 q",[
    series("reference",referenceName,B,truth.map(v=>[v.t,v.q])),
    series("actual","当前方法实际坐标",O,p.trace.map(v=>[v.t,v.q]))],0,p.requestedTime);
  const study=plot("固定总时间的细化；零误差与未完成计算不混为一谈","log₂(步数 N)","log₁₀(1+终点相点距离)",[
   series("error",s.mode==="harmonic"?"相对解析终点":"相对独立细参考终点",B,d.study.rows.filter(v=>v.error!==null).map(v=>[Math.log2(v.N),Math.log1p(v.error)/Math.LN10]))],3,9);
  study.xTicks=[3,4,5,6,7,8,9];
  return [phase,energyPlot,third,study];
 }
 function ledgers(d){
  const s=d.config,p=d.current,select=(vs,ks)=>vs.map(v=>ks.split(" ").map(k=>v[k]));
  if(s.mode==="geometry")return [
   {key:"summary",title:"能量、局部面积与四维体积",headers:["量","值"],rows:[
    ["输入能量",.5],["最大能量保持残差",Math.max(...p.points.map(v=>Math.abs(v.energyError)))],
    ["单位圆上最小局部面积因子",Math.min(...p.points.map(v=>v.determinant))],
    ["单位圆上最大局部面积因子",Math.max(...p.points.map(v=>v.determinant))],
    ["四维实际行列式",p.determinant],["第一共轭平面面积倍率",p.area1],["第二共轭平面面积倍率",p.area2],
    ["四维辛条件Frobenius残差",p.symplecticResidual]]},
   {key:"geometry",title:"全部257个输入、映射和Jacobian",headers:["i","相角","q","p","状态依赖h","映射q","映射p","能量","能量差","实际det","公式det","辛残差","J00","J01","J10","J11"],rows:p.points.map(v=>[...["i","angle","q","p","h","Q","P","energy","energyError","determinant","theoreticalDeterminant","symplecticResidual"].map(k=>v[k]),...v.J])},
   {key:"matrix4",title:"四维 M 与 MᵀJM−J：坐标序为q₁,q₂,p₁,p₂",headers:["行","M第1列","M第2列","M第3列","M第4列","残差第1列","残差第2列","残差第3列","残差第4列"],rows:p.residual.map((v,i)=>[i,...p.diag.map((x,j)=>i===j?x:0),...v])}
  ];
  const th=p.theory,ref=d.reference,back=d.backward;
  const summary=[
   ["是否完成全部请求步",p.complete],["请求步数",p.requestedSteps],["实际完成步数",p.completedSteps],["固定步长h",p.h],["请求终时",p.requestedTime],["实际终时",p.time],
   ["首个超出数值显示范围的步",p.stoppedAt?p.stoppedAt.step:null],["初始原能量",p.initialEnergy],["最终原能量",p.final.energy],["最终能量绝对变化",p.final.deltaEnergy],["最大能量绝对变化",p.maxEnergyError],
   ["最终相对能量变化（H₀=0时未定义）",p.final.relativeEnergy],
   ["最终相对解析解的归一化相点距离",p.final.error],["初始离散二次不变量",p.initialInvariant],["最终二次不变量变化",p.final.deltaInvariant],
   ["全程负h回放是否完成",back?back.complete:null],["回放后与初值的相点距离",back?back.returnError:null],
   ["谐振子稳定分类（所有初值）",th?th.status:null],["ωh",th?th.z:null],["4−(ωh)²（保留精确参数的符号）",th?th.gap:null],
   ["一步主相角（弧度）",th?th.theta:null],["数值主频率",th?th.frequency:null],
   ["一步能量倍率（若存在）",th?th.energyFactor:null],["I的q²系数",th?th.invariantCoefficient:null],
   ["Verlet精确插值Hamilton量倍率θ/sinθ",th?th.modifiedScale:null],
   ["实际一步行列式",th?th.determinant:null],["实际一步辛残差",th?th.symplecticResidual:null],
   ["当前双阱粗参考是否完成",ref?ref.coarse.complete:null],["当前双阱细参考是否完成",ref?ref.fine.complete:null],["两参考终点差（非严格误差界）",ref?ref.difference:null],
   ["固定终时细化T",d.study.T],["细化参考的16/32子步终点差",d.study.reference?d.study.reference.difference:null]
  ];
  const traceKeys="i t q p energy deltaEnergy relativeEnergy invariant deltaInvariant exactQ exactP error";
  const traceHeaders=["步","t","q","p","H","ΔH","ΔH/|H₀|","I","ΔI","解析q","解析p","归一化相点误差"];
  return [
   {key:"summary",title:"稳定、误差与参考精度分别核对",headers:["量","值"],rows:summary},
   {key:"trace",title:"全部实际步；停止后没有伪造轨迹",headers:traceHeaders,rows:select(p.trace,traceKeys)},
   {key:"stages",title:"每一步真实阶段及局部Jacobian",headers:["步","阶段","名称","输入q","输入p","q斜率","p斜率","V′","V″","整步det","J00","J01","J10","J11"],rows:p.stages.map(v=>[...["step","stage","name","q","p","dq","dp","gradient","curvature","determinant"].map(k=>v[k]),...v.J])},
   {key:"reverse",title:"从最终相点负h逐步回放；时间为相对回放起点",headers:traceHeaders,rows:back?select(back.trace,traceKeys):[]},
   {key:"convergence",title:"固定总时间，同一初值，只细化步数",headers:["N","h","目标T","完成","实际T","终点q","终点p","终点相点距离","最大|ΔH|","相邻细化阶数"],rows:select(d.study.rows,"N h T complete actualTime q p error maxEnergyError order")},
   {key:"matrix",title:"谐振子实际一步矩阵",headers:["行","q列","p列"],rows:th?[[0,...th.matrix.slice(0,2)],[1,...th.matrix.slice(2)]]:[]},
   {key:"reference16",title:"双阱RK4每宏步16子步的参考",headers:traceHeaders,rows:ref?select(ref.coarse.trace,traceKeys):[]},
   {key:"reference32",title:"双阱RK4每宏步32子步的参考",headers:traceHeaders,rows:ref?select(ref.fine.trace,traceKeys):[]}
  ];
 }

 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function svg(q){
  const left=q.square?325:100,width=q.square?250:750,height=250,top=85,bottom=335,x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>bottom-height*(v-q.ymin)/(q.ymax-q.ymin);
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
  for(let i=0;i<(q.square?3:5);i++){
   const v=q.ymin+(q.ymax-q.ymin)*i/(q.square?2:4);
   s+='<path d="M'+left+' '+y(v)+'H'+(left+width)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-12)+'" y="'+(y(v)+5)+'" text-anchor="end">'+tick(v)+'</text>';
  }
  const ticks=q.xTicks||Array.from({length:5},(_,i)=>q.xmin+(q.xmax-q.xmin)*i/4);
  for(const v of ticks)s+='<text x="'+x(v)+'" y="'+(bottom+28)+'" text-anchor="middle">'+tick(v)+'</text>';
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

 const STYLE=".sym139{color:var(--fg,#273646)}.sym139 .sym-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.sym139 label{display:flex;flex-direction:column;gap:6px}.sym139 input,.sym139 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.sym139 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.sym139 button[aria-pressed=true]{outline:3px solid #478aaa}.sym139 .sym-scroll{overflow:auto;max-width:100%;margin:16px 0}.sym139 .sym-scroll:focus{outline:3px solid #478aaa}.sym139 .sym-ledger{max-height:420px}.sym139 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.sym139 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.sym139 th,.sym139 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.sym139 .sym-error{color:#c74b39}.sym139 [hidden]{display:none!important}.sym139 fieldset{margin:16px 0;padding:12px}.sym139 details{margin:16px 0}.sym139 summary{cursor:pointer;font-weight:600}.sym139 .sym-legend{font-size:.95em}.sym139 .sym-note{line-height:1.7}.sym139 [hidden]{display:none!important}.sym139 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("sym139-style")){const style=doc.createElement("style");style.id="sym139-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="sym139"><h3>轨道、能量、相位与辛形式，一项一项核对</h3><p>先预测再揭示。固定步长与步数决定实际终时；细化实验另固定同一个终时。这里使用无量纲坐标和单位质量。</p><div class="sym-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="sym-controls"><label>模型<select data-key="mode"><option value="harmonic">谐振子：解析解对照</option><option value="doublewell">双阱：非线性积分</option><option value="geometry">几何反例：能量、体积与辛性</option></select></label>'+
   '<label data-modes="harmonic doublewell">方法<select data-key="method"><option value="verlet">Velocity Verlet</option><option value="euler">显式Euler</option><option value="rk4">经典RK4</option><option value="midpoint">隐式中点（仅谐振子）</option></select></label>'+
   field("h","实际固定步长h（谐振子0.001–3；双阱至0.2）","harmonic doublewell")+
   field("steps","整数步数（谐振子1–2048；双阱至1024）","harmonic doublewell")+
   field("q0","初始q（−2–2；非零至少10⁻⁸）","harmonic doublewell")+field("p0","初始p（−2–2；非零至少10⁻⁸）","harmonic doublewell")+
   field("omega","谐振频率ω（0.25–3）","harmonic")+
   field("h0","状态依赖步长基准h₀（0.02–1）","geometry")+field("epsilon","状态依赖强度ε（0–0.8）","geometry")+field("stretch","四维伸缩a（0.25–4）","geometry")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="sym-error" role="alert"></p><p role="status"></p><div class="sym-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".sym-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={harmonic:"实际使用输入h，不为凑整周期暗中改步长。稳定分类针对所有初值，特殊初值不能把Jordan边界改称稳定。相图横纵同尺度；解析能量轨道画完整一圈，实际步逐点保留。精确保能量的中点法仍有数值相位偏差。",doublewell:"参考轨道也由数值积分生成：每个宏步用RK4的16与32子步分别计算，并显示终点差。两参考接近是分辨率诊断，不是严格误差界或解析真解。双阱鞍点附近的物理不稳定与离散算法稳定性分开讨论。",geometry:"状态依赖步长使用连续谐振子的精确流，所以保持能量，但其Jacobian一般不再辛。四维例保持总体积，却把两个共轭平面分别放大和缩小。所有Jacobian均按解析链式法则计算，不用有限差分冒充恒等式。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="sym-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="sym-scroll sym-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>轨迹超出数值显示范围时明确停止并保留实际终时，不补齐后续假点。相对误差在初始能量为0时未定义，绝对误差仍保留。双阱细化距离是相对数值参考；参考分辨率附近不报伪阶。反向回放按负h运行同一方法，不能把“有算法逆”误称“同一方法时间对称”。四维矩阵坐标顺序为(q₁,q₂,p₁,p₂)。</p>';
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
  const s=config(),v=step(s,{q:1,p:0},.2,"verlet",true);
  ck(Math.abs(v.q-.98)<1e-14&&Math.abs(v.p+.198)<1e-14,"actual first Verlet step");
  const a=integrate(s);ck(a.complete&&Math.abs(a.final.deltaInvariant)<1e-12,"quadratic invariant");
  const r=reverse(s,a);ck(r.returnError<1e-12,"time reversal");
  const b=integrate(config({h:2,p0:.1,steps:32}));ck(b.theory.status==="Jordan-boundary"&&Math.abs(b.final.q)>5,"boundary Jordan growth");
  const c=integrate(config({h:2,p0:0,steps:32}));ck(c.final.q===1&&c.final.p===0,"special initial condition hides boundary growth");
  const m=integrate(config({method:"midpoint"}));ck(m.maxEnergyError<1e-12&&m.final.error>.01,"energy exact does not fix phase");
  const z=integrate(config({q0:0,p0:0}));ck(z.final.relativeEnergy===null&&z.final.error===0,"zero relative quantity undefined");
  const stop=integrate(config({h:3,omega:3,steps:2048}));ck(!stop.complete&&stop.time<stop.requestedTime,"no fabricated overflow continuation");
  const g=geometry(config({mode:"geometry"}));ck(g.symplecticResidual>0&&Math.abs(g.determinant-1)<1e-14,"4D volume does not imply symplectic");
  ck(g.points[64].determinant>1&&g.points[192].determinant<1,"energy-preserving map changes local area");
  const w=integrate(config({mode:"doublewell",q0:1,p0:0,h:.05}));ck(w.final.q===1&&w.final.p===0,"actual nonlinear equilibrium");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,mul,det,productSquareGap,potential,gradient,curvature,energy,exact,step,harmonicTheory,integrate,reverse,convergence,geometry,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
