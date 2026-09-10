(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("elliptic-coercivity",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const PI2=Math.PI**2;
 const DEFAULTS=Object.freeze({mode:"spectral",mu:0,N:5,M:128,F:.85,tau:.8,zeroAt:0,kernel:0,K:8,grading:1,angleRatio:1.5,rho:.001});
 const PRESETS=Object.freeze([
  {id:"coercive",label:"强制：μ=0"},
  {id:"near",label:"第一共振附近",mu:-.99},
  {id:"compatible",label:"第一共振：相容多解",mu:-1,zeroAt:1,kernel:1},
  {id:"incompatible",label:"第一共振：不相容",mu:-1},
  {id:"indefinite",label:"非强制但唯一",mu:-1.2},
  {id:"hidden",label:"N=1漏掉第二共振",mu:-4,N:1},
  {id:"higher",label:"第二共振：自由核方向",mu:-4,N:1,zeroAt:2,kernel:1},
  {id:"fem",label:"真实装配一维有限元",mode:"fem"},
  {id:"graded",label:"把网格堆在左端",mode:"fem",grading:3},
  {id:"corner",label:"凹角：H¹不保证H²",mode:"corner"},
  {id:"flat",label:"平角：线性特殊值",mode:"corner",angleRatio:1},
  {id:"convex",label:"凸角：二阶积分有限",mode:"corner",angleRatio:2/3}
 ].map(Object.freeze));
 const QUESTIONS=[
  ["有限 Galerkin 矩阵可解，是否就证明全问题可解？",["不能，截断可能漏掉不相容的核方向","可以，矩阵残差为0就足够"],0,"有限测试空间看不到它之外的模态。"],
  ["共振模态的乘子为0，且右端该系数也为0，会怎样？",["留下自由系数，需要另外指定代表","该系数必须唯一等于0"],0,"0·u=0没有确定u；取0只是一个选择。"],
  ["强制性失败，是否自动意味着算子不可逆？",["不意味着，非共振谱点之外仍可唯一","意味着，Lax–Milgram条件也是必要条件"],0,"强制性给充分的存在唯一证书；失败后需要别的论证。"],
  ["零迹弱解属于H¹，是否自动在边界附近属于H²？",["不自动，凹角可能使二阶导数积分发散","自动，多一阶导数由椭圆性无条件给出"],0,"内部正则性与穿过边界的全局正则性是两种结论。"]
 ];
 function number(v,k,lo,hi,integer=false){
  if((typeof v!=="number"&&typeof v!=="string")||(typeof v==="string"&&!v.trim()))throw Error(k+" 必须填写有限数值");
  const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw Error(k+" 必须在 "+lo+"–"+hi+" 内"+(integer?"且为整数":""));return x;
 }
 function config(raw={}){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数必须为对象");
  const p=Object.assign({},DEFAULTS,raw),s={mode:p.mode};
  if(!["spectral","fem","corner"].includes(s.mode))throw Error("未知模式");
  if(s.mode==="spectral"){
   s.mu=number(p.mu,"μ=c/π²",-16,4);s.N=number(p.N,"Galerkin 阶数 N",1,32,true);s.M=number(p.M,"参考和阶数 M",64,512,true);
   s.F=number(p.F,"第一强迫系数",-2,2);s.tau=number(p.tau,"高阶强迫幅度",-2,2);s.zeroAt=number(p.zeroAt,"归零模态",0,4,true);s.kernel=number(p.kernel,"核方向系数",-2,2);
   for(const k of ["F","tau","kernel"])if(s[k]!==0&&Math.abs(s[k])<1e-100)throw Error(k+" 的非零绝对值须至少为10⁻¹⁰⁰，以保留平方积分");
  }else if(s.mode==="fem"){s.K=number(p.K,"单元数",2,64,true);s.grading=number(p.grading,"网格幂次",1,4);}
  else{s.angleRatio=number(p.angleRatio,"扇形角/π",.5,1.75);s.rho=number(p.rho,"观察的内半径",1e-6,1);}
  return s;
 }
 function forcing(s,k){return k===s.zeroAt?0:k===1?s.F:s.tau*(k%2===0?-1:1)/(k*k);}
 function tailBounds(s){
  const M=s.M,r=( (M+1)**2+s.mu)/(M+1)**2,rmin=Math.min(1,r),rmax=Math.max(1,r),a=s.tau*s.tau;
  const sum=(power,denPower=0,scale=1)=>({lower:a*scale/(rmax**denPower*(power-1)*(M+1)**(power-1)),upper:a*scale/(rmin**denPower*(power-1)*M**(power-1))});
  return {M,rmin,rmax,residual:sum(4),h1:sum(6,2,1/PI2),energy:sum(6,1,1/PI2),l2:sum(8,2,1/PI2**2),uniform:Math.SQRT2*Math.abs(s.tau)/(3*PI2*rmin*M**3),uniformDerivative:Math.SQRT2*Math.abs(s.tau)/(2*Math.PI*rmin*M*M)};
 }
 function spectral(s,N=s.N,keep=true){
  const rows=Array.from({length:s.M},(_,i)=>{
   const k=i+1,gap=k*k+s.mu,lambda=PI2*k*k,d=PI2*gap,f=forcing(s,k);
   return {k,lambda,gap,d,ratio:gap/(k*k),f,included:k<=N,resonant:gap===0};
  });
  const roots=rows.filter(r=>r.resonant),finiteRoots=roots.filter(r=>r.included);
  const status=rs=>rs.length===0?"unique":rs.every(r=>r.f===0)?"multiple":"no-solution";
  const fullStatus=status(roots),finiteStatus=status(finiteRoots),fullOK=fullStatus!=="no-solution",finiteOK=finiteStatus!=="no-solution";
  let finiteResidual2=0,residualPartial2=0,errorH1Partial2=0,errorL2Partial2=0,errorEnergyPartial=0,fullH1Partial2=0,fullL2Partial2=0,fullEnergyPartial=0,finiteEnergy=0;
  for(const r of rows){
   r.full=fullOK?(r.resonant?s.kernel:r.f/r.d):null;
   r.finite=finiteOK?(r.included?(r.resonant?s.kernel:r.f/r.d):0):null;
   r.residual=finiteOK?r.d*r.finite-r.f:null;
   if(finiteOK){
    residualPartial2+=r.residual*r.residual;
    if(r.included)finiteResidual2+=r.residual*r.residual;
    finiteEnergy+=r.d*r.finite*r.finite;
   }
   if(fullOK){
    fullH1Partial2+=r.lambda*r.full*r.full;fullL2Partial2+=r.full*r.full;fullEnergyPartial+=r.d*r.full*r.full;
    const e=r.full-r.finite;r.error=e;r.h1Error2=r.lambda*e*e;r.l2Error2=e*e;r.energyError=r.d*e*e;
    errorH1Partial2+=r.h1Error2;errorL2Partial2+=r.l2Error2;errorEnergyPartial+=r.energyError;
   }else{r.error=r.h1Error2=r.l2Error2=r.energyError=null;}
  }
  const tail=tailBounds(s),bounds=(partial,b,ok,root=true)=>ok?{partial,lower:root?Math.sqrt(partial+b.lower):partial+b.lower,upper:root?Math.sqrt(partial+b.upper):partial+b.upper}:null;
  const included=rows.slice(0,N),absD=included.map(r=>Math.abs(r.d)),alpha=Math.min(1,1+s.mu),beta=Math.max(1,Math.abs(1+s.mu)),minRelative=Math.min(1,...rows.map(r=>Math.abs(r.ratio)));
  return {N,M:s.M,mu:s.mu,c:PI2*s.mu,fullStatus,finiteStatus,fullOK,finiteOK,roots:roots.map(r=>r.k),finiteRoots:finiteRoots.map(r=>r.k),alpha,beta,coercive:alpha>0,alphaFinite:Math.min(...included.map(r=>r.ratio)),minimumAbsoluteMargin:Math.min(...rows.map(r=>Math.abs(r.d))),minimumRelativeMargin:minRelative,inverseH1Norm:minRelative===0?null:1/minRelative,conditionFinite:finiteRoots.length?null:Math.max(...absD)/Math.min(...absD),finiteResidual:finiteOK?Math.sqrt(finiteResidual2):null,residual:bounds(residualPartial2,tail.residual,finiteOK),h1Error:bounds(errorH1Partial2,tail.h1,fullOK),l2Error:bounds(errorL2Partial2,tail.l2,fullOK),energyError:bounds(errorEnergyPartial,tail.energy,fullOK,false),fullH1:bounds(fullH1Partial2,tail.h1,fullOK),fullL2:bounds(fullL2Partial2,tail.l2,fullOK),fullEnergy:bounds(fullEnergyPartial,tail.energy,fullOK,false),finiteEnergy:finiteOK?finiteEnergy:null,tail,rows:keep?rows:[]};
 }
 function grid(lo,hi,n=200,extra=[]){return Array.from(new Set([...Array.from({length:n+1},(_,i)=>i===n?hi:lo+(hi-lo)*i/n),...extra.filter(x=>x>=lo&&x<=hi)])).sort((a,b)=>a-b);}
 function profile(p){
  return grid(0,1,8*p.M).map(x=>{
   let full=0,finite=0;
   if(x!==0&&x!==1)for(const r of p.rows){const phi=Math.SQRT2*Math.sin(r.k*Math.PI*x);if(p.fullOK)full+=r.full*phi;if(p.finiteOK)finite+=r.finite*phi;}
   return {x,full:p.fullOK?full:null,finite:p.finiteOK?finite:null};
  });
 }
 function fem(s,K=s.K,keep=true){
  const xs=Array.from({length:K+1},(_,i)=>i===K?1:(i/K)**s.grading),hs=xs.slice(1).map((x,i)=>x-xs[i]),diag=[],lower=[],upper=[],rhs=[];
  for(let i=1;i<K;i++){diag.push(1/hs[i-1]+1/hs[i]);lower.push(i===1?0:-1/hs[i-1]);upper.push(i===K-1?0:-1/hs[i]);rhs.push((hs[i-1]+hs[i])/2);}
  const pivots=[],loads=[],forward=[];
  for(let j=0;j<K-1;j++){
   const factor=j===0?0:lower[j]/pivots[j-1],pivot=diag[j]-(j===0?0:factor*upper[j-1]),load=rhs[j]-(j===0?0:factor*loads[j-1]);
   if(!(pivot>0))throw Error("有限元正定主元失效");
   pivots.push(pivot);loads.push(load);forward.push({i:j+1,lower:lower[j],diagonal:diag[j],upper:upper[j],rhs:rhs[j],factor,pivot,load});
  }
  const ys=Array(K+1).fill(0),backward=[];
  for(let j=K-2;j>=0;j--){const next=upper[j]*ys[j+2],value=(loads[j]-next)/pivots[j];ys[j+1]=value;backward.push({i:j+1,load:loads[j],next,pivot:pivots[j],value});}
  let h1Error2=0,l2Error2=0,interpolationH1Error2=0,interpolationL2Error2=0,energy=0,loadIntegral=0,maxResidual=0;
  const elements=[];
  for(let i=0;i<K;i++){
   const a=xs[i],b=xs[i+1],h=hs[i],left=ys[i],right=ys[i+1],mid=(a+b)/2,slope=(right-left)/h,m=.5-mid,C=mid*(1-mid)/2-(left+right)/2,D=h*(m-slope)/2,E=-h*h/8;
   const gradError=h**3/12+h*(m-slope)**2,l2Error=h*((C+E/3)**2+D*D/3+(2*E/3)**2/5),stiffness=1/h,localLoad=h/2;
   h1Error2+=gradError;l2Error2+=l2Error;interpolationH1Error2+=h**3/12;interpolationL2Error2+=h**5/120;energy+=h*slope*slope;loadIntegral+=h*(left+right)/2;
   elements.push({i,a,b,h,left,right,slope,exactMidSlope:m,C,D,E,gradError,l2Error,stiffness,localLoad});
  }
  const nodes=xs.map((x,i)=>{
   const exact=x*(1-x)/2,residual=i===0||i===K?null:lower[i-1]*ys[i-1]+diag[i-1]*ys[i]+upper[i-1]*ys[i+1]-rhs[i-1];
   if(residual!==null)maxResidual=Math.max(maxResidual,Math.abs(residual));
   return {i,x,value:ys[i],exact,error:ys[i]-exact,residual};
  });
  const J=energy/2-loadIntegral;
  return {K,grading:s.grading,hmax:Math.max(...hs),hmin:Math.min(...hs),h1Error2,h1Error:Math.sqrt(h1Error2),l2Error2,l2Error:Math.sqrt(l2Error2),interpolationH1Error2,interpolationL2Error2,energy,loadIntegral,J,exactJ:-1/24,energyGap:J+1/24,gapResidual:J+1/24-h1Error2/2,maxResidual,nodes:keep?nodes:[],elements:keep?elements:[],forward:keep?forward:[],backward:keep?backward:[]};
 }
 function corner(s,rho=s.rho){
  const theta=Math.PI*s.angleRatio,nu=1/s.angleRatio,delta=(1-s.angleRatio)/s.angleRatio,t=2*delta,logR=Math.log(rho),radial=t===0?-logR:-Math.expm1(t*logR)/t,coefficient=2*theta*nu*nu*delta*delta,hessian=delta===0?0:coefficient*radial;
  return {angleRatio:s.angleRatio,theta,nu,delta,rho,log10Rho:Math.log10(rho),radial,coefficient,hessian,gradient:theta*nu/2*(-Math.expm1(2*nu*logR)),l2:theta/(4*nu+4)*(-Math.expm1((2*nu+2)*logR)),classification:delta<0?"diverges":delta===0?"linear":"finite",hessianLimit:delta<0?null:delta===0?0:theta*nu*nu*delta};
 }
 function snapshot(raw={}){
  const s=config(raw),d={config:s};
  if(s.mode==="spectral"){d.current=spectral(s);d.profile=profile(d.current);d.nodes=Array.from({length:32},(_,i)=>spectral(s,i+1,false));}
  else if(s.mode==="fem"){
   d.current=fem(s);d.nodes=Array.from({length:63},(_,i)=>fem(s,i+2,false));
   d.profile=grid(0,1,256,d.current.nodes.map(n=>n.x)).map(x=>{
    const ns=d.current.nodes;let i=0;while(i<ns.length-2&&x>ns[i+1].x)i++;
    const a=ns[i],b=ns[i+1],v=a.value+(b.value-a.value)*(x-a.x)/(b.x-a.x);
    return {x,exact:x*(1-x)/2,finite:v};
   });
  }else{
   d.current=corner(s);d.nodes=grid(-6,0,200,[Math.log10(s.rho)]).map(x=>corner(s,10**x));
   d.comparisons=[{label:"凸角 2π/3",ratio:2/3},{label:"平角 π",ratio:1},{label:"凹角 3π/2",ratio:1.5},{label:"当前角",ratio:s.angleRatio}].map(v=>({...v,nodes:d.nodes.map(p=>corner({...s,angleRatio:v.ratio},p.rho))}));
  }
  return d;
 }
 function fmt(x){
  if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
  if(!Number.isFinite(x))throw Error("非有限计算值");if(x===0)return "0";
  return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):Number(x.toPrecision(10)).toString();
 }
 function series(key,label,color,points,extra={}){return Object.assign({key,label,color,points,line:true},extra);}
 function plot(title,x,y,ss,xmin,xmax,markers=[]){
  const ys=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
  return {title,x,y,xmin,xmax,ymin:lo-pad,ymax:hi+pad,series:ss,markers};
 }
 function plots(d){
  const s=d.config,p=d.current,B="#268bd2",O="#cb6a16",G="#29966c",V="#9966bb";
  if(s.mode==="spectral"){
   const ss=[];
   if(p.fullOK)ss.push(series("reference","参考和至 M（非全解）",B,d.profile.map(v=>[v.x,v.full])));
   if(p.finiteOK)ss.push(series("finite","Galerkin 解至 N",O,d.profile.map(v=>[v.x,v.finite])));
   const errors=d.nodes.filter(v=>v.h1Error!==null);
   return [
    plot("谱比决定强制性，零点决定相容性","模态 k","dₖ/λₖ",[
     series("ratio","谱比",B,p.rows.slice(0,Math.max(8,s.N+3)).map(v=>[v.k,v.ratio]),{line:false})
    ],1,Math.max(8,s.N+3)),
    plot(ss.length?"有限解与参考和：边界都满足还不够":"本次有限系统也无解：不画伪造解","x ∈ [0,1]","u",ss,0,1),
    plot(p.fullOK?"截断误差：已算部分＋解析无穷尾界":"全问题无解：全解截断误差未定义","Galerkin 阶数 N","梯度误差的下界与上界",p.fullOK?[
     series("lower","下界",B,errors.map(v=>[v.N,v.h1Error.lower])),
     series("upper","上界",O,errors.map(v=>[v.N,v.h1Error.upper]))
    ]:[],1,32,[{x:s.N,label:"当前 N"}])
   ];
  }
  if(s.mode==="fem")return [
   plot("从真实刚度矩阵求出分段线性近似","x ∈ [0,1]","u",[
    series("exact","精确抛物线",B,d.profile.map(v=>[v.x,v.exact])),
    series("finite","装配求解的 P1 近似",O,d.profile.map(v=>[v.x,v.finite]))
   ],0,1),
   plot("误差随单元数变化：当前网格幂次 "+fmt(s.grading),"log₁₀ 单元数 K","log₁₀ 误差",[
    series("h1","梯度 L2 误差",B,d.nodes.map(v=>[Math.log10(v.K),Math.log10(v.h1Error)])),
    series("l2","函数 L2 误差",O,d.nodes.map(v=>[Math.log10(v.K),Math.log10(v.l2Error)]))
   ],Math.log10(2),Math.log10(64),[{x:Math.log10(s.K),label:"当前 K"}])
  ];
  return [
   plot("越靠近角点，分别累计零、一、二阶积分","log₁₀ ρ；向左接近角点","log₁₀(1＋截断积分)",[
    series("l2","函数平方积分",B,d.nodes.map(v=>[v.log10Rho,Math.log1p(v.l2)/Math.LN10])),
    series("gradient","梯度平方积分",G,d.nodes.map(v=>[v.log10Rho,Math.log1p(v.gradient)/Math.LN10])),
    series("hessian","Hessian平方积分",O,d.nodes.map(v=>[v.log10Rho,Math.log1p(v.hessian)/Math.LN10]))
   ],-6,0,[{x:Math.log10(s.rho),label:"当前 ρ"}]),
   plot("凸角、平角、凹角：同一局部调和模式","log₁₀ ρ；向左接近角点","log₁₀(1＋Hessian平方积分)",d.comparisons.map((c,i)=>series("angle-"+i,c.label,[B,G,O,V][i],c.nodes.map(v=>[v.log10Rho,Math.log1p(v.hessian)/Math.LN10]))),-6,0)
  ];
 }
 function ledgers(d){
  const s=d.config,p=d.current;let summary,nodes,extra=[];
  const bound=(name,b)=>[name,b?b.partial:null,b?b.lower:null,b?b.upper:null];
  if(s.mode==="spectral"){
   summary=[["μ=c/π²",s.mu.toString()],["c（近似数值）",p.c],["全问题",p.fullStatus],["有限系统",p.finiteStatus],["共振模态",p.roots.join(",")||"无"],["强制常数α",p.alpha],["有界常数β",p.beta],["有限强制常数",p.alphaFinite],["全谱最小绝对余量",p.minimumAbsoluteMargin],["H1相对余量下确界",p.minimumRelativeMargin],["H⁻¹→H₀¹逆算子范数",p.inverseH1Norm],["有限矩阵条件数",p.conditionFinite],["有限方程残差",p.finiteResidual],["有限双线性型能量",p.finiteEnergy],["参考曲线一致余项界",p.tail.uniform],["参考导数一致余项界",p.tail.uniformDerivative]];
   nodes={headers:["N","全问题","有限系统","有限残差","完整残差下界","完整残差上界","梯度误差下界","梯度误差上界","能量尾项下界","能量尾项上界"],rows:d.nodes.map(v=>[v.N,v.fullStatus,v.finiteStatus,v.finiteResidual,v.residual?.lower,v.residual?.upper,v.h1Error?.lower,v.h1Error?.upper,v.energyError?.lower,v.energyError?.upper])};
   extra.push({key:"modes",title:"全部 M 个模态：系数、残差与误差贡献",headers:["k","λk","k²+μ","dk","fk","计入N","共振","全解指定系数","有限系数","残差","误差系数","梯度误差²","L2误差²","有符号能量误差"],rows:p.rows.map(v=>[v.k,v.lambda,v.gap,v.d,v.f,v.included,v.resonant,v.full,v.finite,v.residual,v.error,v.h1Error2,v.l2Error2,v.energyError])});
   extra.push({key:"bounds",title:"部分和与无限尾界分开报告",headers:["量","已算部分（范数项为平方）","最终下界","最终上界"],rows:[bound("完整方程残差L2",p.residual),bound("梯度误差",p.h1Error),bound("L2误差",p.l2Error),bound("有符号能量误差",p.energyError),bound("全解梯度",p.fullH1),bound("全解L2",p.fullL2),bound("全解有符号能量",p.fullEnergy)]});
   extra.push({key:"tails",title:"M 以后的解析级数尾界",headers:["量","下界","上界"],rows:["residual","h1","l2","energy"].map(k=>[k,p.tail[k].lower,p.tail[k].upper]).concat([["尾部最小谱比",p.tail.rmin,p.tail.rmin],["尾部最大谱比",p.tail.rmax,p.tail.rmax]])});
   extra.push({key:"profile",title:"空间曲线的全部 8M＋1 个节点",headers:["x","参考和至M","有限解至N"],rows:d.profile.map(v=>[v.x,v.full,v.finite])});
  }else if(s.mode==="fem"){
   summary=[["单元数",p.K],["网格幂次",p.grading],["最小单元",p.hmin],["最大单元",p.hmax],["梯度误差",p.h1Error],["L2误差",p.l2Error],["插值梯度误差²",p.interpolationH1Error2],["插值L2误差²",p.interpolationL2Error2],["最大矩阵残差",p.maxResidual],["J(uh)",p.J],["J(u)",p.exactJ],["能量泛函差",p.energyGap],["差减去半个梯度误差²",p.gapResidual]];
   nodes={headers:["K","最小单元","最大单元","梯度误差","L2误差","能量差","最大矩阵残差"],rows:d.nodes.map(v=>[v.K,v.hmin,v.hmax,v.h1Error,v.l2Error,v.energyGap,v.maxResidual])};
   extra.push({key:"mesh",title:"全部网格节点与求解残差",headers:["i","x","求解值","精确节点值","节点误差","矩阵残差"],rows:p.nodes.map(v=>[v.i,v.x,v.value,v.exact,v.error,v.residual])});
   extra.push({key:"elements",title:"每个单元的装配与误差积分",headers:["单元","左端","右端","h","u左","u右","离散斜率","精确中点斜率","1/h","h/2","C","D","E","梯度误差²","L2误差²"],rows:p.elements.map(v=>[v.i,v.a,v.b,v.h,v.left,v.right,v.slope,v.exactMidSlope,v.stiffness,v.localLoad,v.C,v.D,v.E,v.gradError,v.l2Error])});
   extra.push({key:"forward",title:"Thomas 前消：每一个主元与载荷",headers:["i","下对角","对角","上对角","原rhs","消元乘子","新主元","新rhs"],rows:p.forward.map(v=>[v.i,v.lower,v.diagonal,v.upper,v.rhs,v.factor,v.pivot,v.load])});
   extra.push({key:"backward",title:"Thomas 回代：真实求出的系数",headers:["i","新rhs","上对角乘下个值","主元","解"],rows:p.backward.map(v=>[v.i,v.load,v.next,v.pivot,v.value])});
   extra.push({key:"profile",title:"空间曲线全部节点，包含每个网格折点",headers:["x","精确值","P1值"],rows:d.profile.map(v=>[v.x,v.exact,v.finite])});
  }else{
   summary=[["扇形角/π",s.angleRatio.toString()],["Θ",p.theta],["ν=π/Θ",p.nu.toString()],["ν−1（避免近值相减）",p.delta],["观察内半径ρ",p.rho],["H²分类",p.classification],["函数平方积分",p.l2],["梯度平方积分",p.gradient],["Hessian平方积分",p.hessian],["Hessian积分的ρ→0极限（发散不填数值）",p.hessianLimit]];
   const row=v=>[v.rho,v.nu.toString(),v.delta,v.radial,v.coefficient,v.l2,v.gradient,v.hessian,v.classification];
   nodes={headers:["ρ","ν","ν−1","径向积分因子","角向与导数系数","函数平方积分","梯度平方积分","Hessian平方积分","分类"],rows:d.nodes.map(row)};
   for(const [i,v]of d.comparisons.entries())extra.push({key:"angle-"+i,title:v.label+" 的全部截断积分",headers:nodes.headers,rows:v.nodes.map(row)});
  }
  return [{key:"summary",title:"当前条件与解的状态",headers:["量","值"],rows:summary},{key:"nodes",title:"整条参数曲线的全部节点",...nodes},...extra];
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

 const STYLE=".elliptic137{color:var(--fg,#273646)}.elliptic137 .ell-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.elliptic137 label{display:flex;flex-direction:column;gap:6px}.elliptic137 input,.elliptic137 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.elliptic137 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.elliptic137 button[aria-pressed=true]{outline:3px solid #478aaa}.elliptic137 .ell-scroll{overflow:auto;max-width:100%;margin:16px 0}.elliptic137 .ell-scroll:focus{outline:3px solid #478aaa}.elliptic137 .ell-ledger{max-height:420px}.elliptic137 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.elliptic137 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.elliptic137 th,.elliptic137 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.elliptic137 .ell-error{color:#c74b39}.elliptic137 [hidden]{display:none!important}.elliptic137 fieldset{margin:16px 0;padding:12px}.elliptic137 details{margin:16px 0}.elliptic137 summary{cursor:pointer;font-weight:600}.elliptic137 .ell-legend{font-size:.95em}.elliptic137 .ell-note{line-height:1.7}.elliptic137 [hidden]{display:none!important}.elliptic137 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("elliptic137-style")){const style=doc.createElement("style");style.id="elliptic137-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="elliptic137"><h3>从弱解到可计算的近似</h3><p>先预测，再揭示。正弦模态检查强制性与共振，有限元实际装配求解，角点模型区分一阶与二阶积分。</p><div class="ell-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="ell-controls"><label>实验模式<select data-key="mode"><option value="spectral">正弦模态与共振</option><option value="fem">P1有限元与误差</option><option value="corner">角点与二阶正则性</option></select></label>'+
   field("mu","μ=c/π²（−16–4）","spectral")+field("N","Galerkin阶数N（1–32整数）","spectral")+field("M","参考和阶数M（64–512整数）","spectral")+
   field("F","第一强迫系数F（−2–2）","spectral")+field("tau","高阶强迫幅度τ（−2–2）","spectral")+field("zeroAt","归零模态（0不归零，1–4指定）","spectral")+field("kernel","相容核方向系数（−2–2）","spectral")+
   field("K","有限元单元数（2–64整数）","fem")+field("grading","网格幂次（1–4）","fem")+
   field("angleRatio","扇形角/π（0.5–1.75）","corner")+field("rho","观察内半径ρ（10⁻⁶–1）","corner")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="ell-error" role="alert"></p><p role="status"></p><div class="ell-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".ell-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={spectral:"c=π²μ，μ是实际输入；μ=−j²表示符号共振，小的非零余量不会被抹为0。强迫第1项为F，其余为τ(−1)^(k+1)/k²；归零模态只改指定一项。全问题与有限系统分别检查相容性。相容核自由系数用于指定代表，若N漏掉该模态，有限解仍没有这项。参考曲线只累加到M，并另给一致余项界；不是无限全解。解析尾界只包住未计算的级数，尚未计入严格浮点区间误差。",fem:"问题是−u″=1、u(0)=u(1)=0。先按真实网格装配三对角刚度与载荷，再前消回代；精确节点值只用于核验，没有灌入求解器。这个特殊一维问题的Galerkin解等于节点插值，正文给出证明；一般有限元问题没有此性质。恒定曲率下盲目将网格堆到一端不一定减小误差。",corner:"扇形局部调和模式u=r^ν sin(νφ)，ν=π/Θ。ρ只是积分观察的内半径，没有在该圆弧上额外施加零边界。完整齐次Dirichlet反例还要加正文的径向光滑截断。平角ν=1时u是线性函数，Hessian恒0，不能按一个未消去的分母误判为对数发散。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫"}[s.color])+'）').join("；")+'</p><div class="ell-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="ell-scroll ell-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>每张表保留当前计算的全部节点或消元步骤。正弦空间曲线使用8M＋1节点；有限元图额外包含每个网格折点；角点图用201个基础对数半径并加入当前ρ。零、未定义与非常小的非零数值分别显示。图表可聚焦后用方向键横向滚动。</p>';
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
  const a=spectral(config());ck(a.fullStatus==="unique"&&a.alpha===1,"coercive");ck(a.h1Error.lower<a.h1Error.upper,"tail bracket");
  const b=spectral(config({mu:-1}));ck(b.fullStatus==="no-solution"&&b.rows.every(r=>r.full===null&&r.finite===null),"incompatible means no fake vector");
  const c=spectral(config({mu:-4,N:1}));ck(c.fullStatus==="no-solution"&&c.finiteStatus==="unique","hidden resonance");
  const z=spectral(config({mu:-4,N:1,zeroAt:2,kernel:1}));ck(z.fullStatus==="multiple"&&z.rows[1].full===1&&z.rows[1].finite===0,"chosen kernel outside N");
  ck(spectral(config({mu:-1+Number.EPSILON})).fullStatus==="unique","near root");
  ck(spectral(config({mu:-1-Number.EPSILON})).alpha<0,"near lower root");
  const f=fem(config({mode:"fem",K:2}));ck(Math.abs(f.nodes[1].value-.125)<1e-14,"one hat solved");
  ck(Math.abs(f.h1Error2-1/48)<1e-14,"hat energy error");ck(Math.abs(f.l2Error2-1/1920)<1e-14,"hat L2 error");
  ck(Math.abs(f.energyGap-f.h1Error2/2)<1e-14,"variational gap");
  const h=corner(config({mode:"corner",angleRatio:1}));ck(h.hessian===0&&h.classification==="linear","flat angle special");
  ck(corner(config({mode:"corner",angleRatio:1.5})).classification==="diverges","reentrant corner");
  ck(corner(config({mode:"corner",angleRatio:.5})).classification==="finite","convex corner");
  ck(fmt(1e-30)!=="0","small value");return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,PI2,config,forcing,tailBounds,spectral,profile,fem,corner,grid,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
