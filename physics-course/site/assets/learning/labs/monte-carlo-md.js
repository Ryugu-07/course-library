(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("monte-carlo-md",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const DEFAULTS={mode:"chain",N:128,seed:20260911,eta:0,proposal:.1,burn:0,stride:1,initial:"stationary",beta:1,energy:1,omega:1,phase:0,turns:.125};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+" 必须是数值");
 if(typeof v==="string"&&!v.trim())throw Error(key+" 不能为空");
 const n=Number(v);
 if(!Number.isFinite(n)||n<lo||n>hi||(integer&&!Number.isInteger(n)))throw Error(key+" 超出范围或不是所需整数");
 if(n===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(key+" 非零输入下溢");
 return n;
}
function config(raw={}){
 if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须是对象");
 const s=Object.assign({},DEFAULTS,raw);
 if(!["integration","chain","ensemble"].includes(s.mode))throw Error("未知模型");
 s.N=num(s.N,"N",1,256,true);s.seed=num(s.seed,"seed",0,4294967295,true);
 if(s.mode==="chain"){
  s.eta=num(s.eta,"η",-4,4);s.proposal=num(s.proposal,"r",0,1);
  if(s.proposal!==0&&s.proposal<1e-6)throw Error("非零r至少为10⁻⁶");
  s.burn=num(s.burn,"burn",0,256,true);s.stride=num(s.stride,"stride",1,8,true);
  if(!["stationary","plus","minus"].includes(s.initial))throw Error("未知初值分布");
 }else if(s.mode==="ensemble"){
  s.beta=num(s.beta,"β",.25,4);s.energy=num(s.energy,"E",0,4);s.omega=num(s.omega,"ω",.25,4);
  s.phase=num(s.phase,"初相角/2π",0,1);s.turns=num(s.turns,"每次观测间隔/周期",0,2);
 }
 return s;
}
function rng(seed){
 let state=seed,calls=0;
 return {next(){state=(Math.imul(1664525,state)+1013904223)>>>0;calls++;return(state+.5)/4294967296;},get state(){return state;},get calls(){return calls;}};
}
function sum(xs){let s=0,c=0;for(const x of xs){const y=x-c,t=s+y;c=(t-s)-y;s=t;}return s;}
function integration(s){
 const g=rng(s.seed),rows=[];let iid=0,strat=0;
 for(let j=0;j<s.N;j++){
  const u=g.next(),x=(j+u)/s.N,f=u*u,fs=x*x,mu=(j*j+j+1/3)/(s.N*s.N),v=(j*j/3+j/3+4/45)/(s.N**4);
  iid+=f;strat+=fs/s.N;
  rows.push({i:j+1,state:g.state,u,x,iid:f,strat:fs,layerMean:mu,layerVariance:v,iidMean:iid/(j+1),partial:strat,partialTruth:((j+1)/s.N)**3/3});
 }
 const study=Array.from({length:256},(_,j)=>{const n=j+1;return{N:n,iidVariance:4/(45*n),stratVariance:(5*n*n-1)/(45*n**5)};});
 const v=study[s.N-1];
 return{rows,study,iid:iid/s.N,strat,truth:1/3,iidVariance:v.iidVariance,stratVariance:v.stratVariance,calls:g.calls,lastState:g.state};
}
// Stable 1 - lambda^n, including the alternating endpoint.
function oneMinusPower(lambda,n){
 if(n===0)return 0;if(lambda===0)return 1;
 const t=n*Math.log(Math.abs(lambda));
 return lambda<0&&n%2?1+Math.exp(t):-Math.expm1(t);
}
function chainTheory(s){
 const z=Math.exp(-2*Math.abs(s.eta)),small=z/(1+z),large=1/(1+z),piPlus=s.eta>=0?large:small,piMinus=s.eta>=0?small:large;
 const acceptPlus=Math.min(1,Math.exp(-2*s.eta)),acceptMinus=Math.min(1,Math.exp(2*s.eta)),a=s.proposal*acceptPlus,b=s.proposal*acceptMinus;
 const lambda=1-(a+b),m=piPlus-piMinus,v=4*piPlus*piMinus,R=lambda**s.stride;
 let A=0,B=0;
 for(let i=0;i<s.stride;i++){A=A*(1-b)+(1-A)*a;B=B*(1-a)+(1-B)*b;}
 function probabilities(t){
  const d=oneMinusPower(lambda,t);
  return s.initial==="stationary"?[piPlus,piMinus]:s.initial==="plus"?[1-piMinus*d,piMinus*d]:[piPlus*d,1-piPlus*d];
 }
 const G=[0];for(let i=1;i<=s.N;i++)G.push(1+R*G[i-1]);
 const moments=[];let prior=null;
 for(let i=0;i<s.N;i++){
  const t=s.burn+(i+1)*s.stride,p=probabilities(t),mean=p[0]-p[1],variance=4*p[0]*p[1];
  const innovation=i===0?variance:4*(prior[0]*A*(1-A)+prior[1]*B*(1-B));
  moments.push({i:i+1,t,plus:p[0],minus:p[1],mean,variance,innovation,weight:G[s.N-i],contribution:innovation*G[s.N-i]**2/s.N**2});
  prior=p;
 }
 const expected=sum(moments.map(v=>v.mean))/s.N,variance=sum(moments.map(v=>v.contribution)),bias=expected-m;
 // Full ideal distribution of the recorded sample mean. No simulated replicas.
 let dp=Array.from({length:s.N+1},()=>[0,0]);dp[1][0]=moments[0].plus;dp[0][1]=moments[0].minus;
 for(let n=1;n<s.N;n++){
  const next=Array.from({length:s.N+1},()=>[0,0]);
  for(let k=0;k<=n;k++){next[k+1][0]+=dp[k][0]*(1-A)+dp[k][1]*B;next[k][1]+=dp[k][0]*A+dp[k][1]*(1-B);}
  dp=next;
 }
 const distribution=dp.map((v,k)=>({plusCount:k,mean:2*k/s.N-1,probability:v[0]+v[1],endPlus:v[0],endMinus:v[1]}));
 const factor=Math.abs(R)<1?(1+R)/(1-R):null;
 return{piPlus,piMinus,m,v,a,b,acceptPlus,acceptMinus,lambda,R,A,B,P:[[1-a,a],[b,1-b]],moments,distribution,expected,variance,bias,mse:variance+bias*bias,
  se:Math.sqrt(variance),iidSE:Math.sqrt(v/s.N),factor,tau:factor===null?null:factor/2,asymptoticESS:factor===null||factor===0?null:s.N/factor,
  distributionMass:sum(distribution.map(v=>v.probability)),distributionMean:sum(distribution.map(v=>v.mean*v.probability)),distributionVariance:sum(distribution.map(v=>(v.mean-expected)**2*v.probability))};
}
function chain(s){
 const th=chainTheory(s),g=rng(s.seed),initialU=g.next();let state=s.initial==="stationary"?(initialU<th.piPlus?1:-1):s.initial==="plus"?1:-1;
 const initialState=state,steps=[],observations=[];let total=0,proposedCount=0,acceptedCount=0;
 for(let t=1;t<=s.burn+s.N*s.stride;t++){
  const before=state,up=g.next(),ua=g.next(),delta=2*s.eta*before,accept=Math.min(1,Math.exp(-delta)),proposed=up<s.proposal,accepted=proposed&&ua<accept;
  if(proposed)proposedCount++;if(accepted){state=-state;acceptedCount++;}
  const record=t>s.burn&&(t-s.burn)%s.stride===0;
  steps.push({t,before,proposalU:up,acceptU:ua,delta,accept,proposed,accepted,after:state,record,state:g.state});
  if(record){total+=state;observations.push({i:observations.length+1,t,state,mean:total/(observations.length+1)});}
 }
 const mean=total/s.N,ss=sum(observations.map(v=>(v.state-mean)**2)),acf=[];
 for(let k=0;k<s.N;k++)acf.push({lag:k,theory:th.R**k,empirical:ss===0?null:sum(observations.slice(0,s.N-k).map((v,i)=>(v.state-mean)*(observations[i+k].state-mean)))/ss});
 return{theory:th,steps,observations,acf,mean,observedError:mean-th.m,sampleVariance:s.N>1?ss/(s.N-1):null,naiveSE:s.N>1?Math.sqrt(ss/(s.N-1)/s.N):null,
  initialU,initialState,proposedCount,acceptedCount,acceptance:proposedCount?acceptedCount/proposedCount:null,calls:g.calls,lastState:g.state};
}
function phasePoint(turn,amplitude,omega){
 // Reduce phase in turns first; exact cardinal cases make sampling aliasing explicit.
 const u=turn%1;
 const cs=u===0?[1,0]:u===.25?[0,1]:u===.5?[-1,0]:u===.75?[0,-1]:[Math.cos(2*Math.PI*u),Math.sin(2*Math.PI*u)];
 return{q:amplitude*cs[0]/omega,p:-amplitude*cs[1]};
}
function ensemble(s){
 const g=rng(s.seed),rows=[],a=Math.sqrt(2*s.energy),circle=[];
 let q2=0,q4=0,cq2=0,cq4=0,ce=0;
 for(let i=0;i<s.N;i++){
  const ue=g.next(),ut=g.next(),E=-Math.log(ue)/s.beta,can=phasePoint(ut,Math.sqrt(2*E),s.omega),micro=phasePoint(s.phase+i*s.turns,a,s.omega);
  q2+=micro.q**2;q4+=micro.q**4;cq2+=can.q**2;cq4+=can.q**4;ce+=E;
  rows.push({i:i+1,t:2*Math.PI*i*s.turns/s.omega,uEnergy:ue,uPhase:ut,energy:E,q:micro.q,p:micro.p,canonicalQ:can.q,canonicalP:can.p,
   microQ2:q2/(i+1),microQ4:q4/(i+1),canonicalQ2:cq2/(i+1),canonicalQ4:cq4/(i+1),canonicalEnergy:ce/(i+1),state:g.state});
 }
 for(let i=0;i<=256;i++)circle.push(phasePoint(i/256,a,s.omega));
 const moments={microEnergy:s.energy,canonicalEnergy:1/s.beta,microQ2:s.energy/s.omega**2,canonicalQ2:1/(s.beta*s.omega**2),microQ4:1.5*s.energy**2/s.omega**4,canonicalQ4:3/(s.beta*s.omega**2)**2};
 // Exact microcanonical interval probabilities, including both turning points.
 const bins=[],amp=a/s.omega;
 function microCDF(x){return amp===0?(x<0?0:1):x<=-amp?0:x>=amp?1:.5+Math.asin(x/amp)/Math.PI;}
 for(let i=0;i<16;i++){
  const left=amp===0?-1+i/8:amp*(-1+i/8),right=amp===0?-1+(i+1)/8:amp*(-1+(i+1)/8);
  const inBin=x=>x>=left&&(x<right||(i===15&&x===right));
  // Left-closed bins: at E=0 all mass is in [0,1/8).
  const probability=amp===0?(left<=0&&right>0?1:0):microCDF(right)-microCDF(left);
  bins.push({i:i+1,left,right,probability,observed:rows.filter(v=>inBin(v.q)).length/s.N});
 }
 return{rows,circle,moments,bins,calls:g.calls,lastState:g.state};
}
function snapshot(raw={}){const s=config(raw);return{config:s,result:s.mode==="integration"?integration(s):s.mode==="chain"?chain(s):ensemble(s)};}

const PRESETS=[
 {id:"positive",label:"正相关：误差条变宽"},
 {id:"iid",label:"两态独立采样",proposal:.5},
 {id:"negative",label:"负相关：有效样本可多于读数",proposal:.9},
 {id:"periodic",label:"周期2：不能套混合结论",proposal:1},
 {id:"thinned",label:"隔两步：反而只看见一个状态",proposal:1,stride:2},
 {id:"frozen",label:"冻结：样本方差零仍有误差",proposal:0,initial:"plus",eta:1},
 {id:"transient",label:"初值偏差：误差条没有包含它",proposal:.01,initial:"minus",eta:2},
 {id:"burn",label:"真正执行热化步",proposal:.01,initial:"minus",eta:2,burn:256},
 {id:"integration",label:"随机积分与分层",mode:"integration"},
 {id:"ensemble",label:"二阶矩相同，系综仍不同",mode:"ensemble"},
 {id:"alias",label:"精确轨道也会观测混叠",mode:"ensemble",turns:1},
 {id:"rest",label:"零能量：原点静止",mode:"ensemble",energy:0}
];
const QUESTIONS=[
 ["同样N个读数，正相关会怎样改变均值的标准误？",["通常变大，要计入协方差","再除以相关时间，所以变小"],0,"标准误来自均值的方差；正协方差会增加它。"],
 ["一条完全不动的样本序列，能否仅凭样本方差为0判定结果准确？",["不能，链可能被冻结在错误位置","能，零方差意味着零误差"],0,"目标分布的方差、当前样本方差和初始化偏差是不同量。"],
 ["详细平衡成立，是否就保证每个测量都彼此独立？",["不保证，还要研究转移相关性与初值","保证，详细平衡就是独立采样"],0,"平稳分布约束边缘概率流，不消除路径的记忆。"],
 ["固定能量谐振子与正则系综的q²均值相同，能否据此说两种分布相同？",["不能，q⁴和能量波动可以不同","能，一个二阶矩足以确定所有分布"],0,"相同二阶矩不代表同一概率测度。"]
];
function fmt(x){
 if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("非有限数值不能作为有效结果");if(x===0)return "0";
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
function series(key,label,color,points,line=true){return{key,label,color,points,line};}
function plot(title,x,y,ss,xmin,xmax,square=false){
 const ys=ss.flatMap(s=>s.points.map(v=>v[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
 if(square){const r=1.08*Math.max(.01,...ss.flatMap(s=>s.points.flatMap(v=>v.map(Math.abs))));return{title,x,y,series:ss,xmin:-r,xmax:r,ymin:-r,ymax:r,square,markers:[],xTicks:[-r,0,r]};}
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result,B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72";
 if(s.mode==="integration")return[
  plot("同样数量的点，分层让每个区间都被访问","位置 x","f(x)=x²",[
   series("function","被积函数",G,Array.from({length:257},(_,i)=>[i/256,(i/256)**2])),
   series("iid","IID模型的一次伪随机取点",B,p.rows.map(v=>[v.u,v.iid]),false),
   series("stratified","每层一个随机点",O,p.rows.map(v=>[v.x,v.strat]),false)],0,1),
  plot("只积完前k层时，目标也只是前k层的面积","已完成层数 k","部分积分",[
   series("partial","随机部分和",O,p.rows.map(v=>[v.i,v.partial])),
   series("partial-truth","∫₀ᵏ⁄ᴺ x² dx",B,p.rows.map(v=>[v.i,v.partialTruth]))],0,s.N),
  plot("普通随机积分：每个前缀都估计同一个全区间","样本数 k","均值",[
   series("running","IID运行均值",B,p.rows.map(v=>[v.i,v.iidMean])),
   series("truth","全积分1/3",G,p.rows.map(v=>[v.i,p.truth]))],0,s.N),
  plot("理想独立均匀数模型下的精确标准误","log₁₀ N（1–256全部整数）","log₁₀ SE",[
   series("iid-se","普通MC",B,p.study.map(v=>[Math.log10(v.N),Math.log10(Math.sqrt(v.iidVariance))])),
   series("strat-se","此光滑一维例的分层MC",O,p.study.map(v=>[Math.log10(v.N),Math.log10(Math.sqrt(v.stratVariance))]))],0,Math.log10(256))
 ];
 if(s.mode==="chain"){
  const t=p.theory;let u=0;
  const expected=t.moments.map((v,i)=>{u+=v.mean;return[v.t,u/(i+1)];});
  const dist=plot("理想转移规则下，所有可能的样本均值","记录均值","概率质量（不是密度）",[
   series("distribution","完整均值分布：递推计算",B,t.distribution.map(v=>[v.mean,v.probability]),false)],-1,1);
  dist.markers=[{x:p.mean,label:"本次均值",color:O}];
  return[
   plot("每个被记录的状态，都保留真实转移步编号","实际转移次数 t","状态 s",[
    series("state","本次记录轨迹",O,p.observations.map(v=>[v.t,v.state]))],0,s.burn+s.N*s.stride),
   plot("本次结果、初始化后的期望和目标分别看","实际转移次数 t","记录均值",[
    series("actual","本次运行均值",O,p.observations.map(v=>[v.t,v.mean])),
    series("expectation","指定初始化的有限期望",B,expected),
    series("target","Boltzmann目标均值",G,p.observations.map(v=>[v.t,t.m]))],0,s.burn+s.N*s.stride),
   plot("经验相关函数不是已知的理论相关函数","记录滞后 k","相关系数",[
    series("theory","平稳理论 Rᵏ",B,p.acf.map(v=>[v.lag,v.theory])),
    series("empirical","当前样本中心化诊断",O,p.acf.filter(v=>v.empirical!==null).map(v=>[v.lag,v.empirical]))],0,Math.max(1,s.N-1)),
   dist
  ];
 }
 const m=p.moments;
 return[
  plot("同一Hamilton量，两种不同的抽样测度","q；横纵单位长度相同","p/ω；等比例",[
   series("orbit","固定E的连续轨道",G,p.circle.map(v=>[v.q,v.p/s.omega])),
   series("time","真实观测时刻的解析相点",O,p.rows.map(v=>[v.q,v.p/s.omega]),false),
   series("canonical","正则能量与相角采样",B,p.rows.map(v=>[v.canonicalQ,v.canonicalP/s.omega]),false)],-1,1,true),
  plot("二阶矩：相同的期望不代表相同分布","读数 k","q²均值",[
   series("micro","固定E的离散时间观测",O,p.rows.map(v=>[v.i,v.microQ2])),
   series("canonical","正则样本均值",B,p.rows.map(v=>[v.i,v.canonicalQ2])),
   series("micro-truth","连续一周期平均",R,p.rows.map(v=>[v.i,m.microQ2])),
   series("canonical-truth","正则期望",G,p.rows.map(v=>[v.i,m.canonicalQ2]))],0,s.N),
  plot("四阶矩把二阶矩掩盖的系综差别显露出来","读数 k","q⁴均值",[
   series("micro","固定E的离散时间观测",O,p.rows.map(v=>[v.i,v.microQ4])),
   series("canonical","正则样本均值",B,p.rows.map(v=>[v.i,v.canonicalQ4])),
   series("micro-truth","连续一周期平均",R,p.rows.map(v=>[v.i,m.microQ4])),
   series("canonical-truth","正则期望",G,p.rows.map(v=>[v.i,m.canonicalQ4]))],0,s.N),
  plot("微正则位置区间概率：转折点停留更久","区间中心 q","区间概率（不是密度）",[
   series("bins","连续均匀相角的精确区间概率",B,p.bins.map(v=>[(v.left+v.right)/2,v.probability]),false),
   series("observed","当前离散时间观测频率",O,p.bins.map(v=>[(v.left+v.right)/2,v.observed]),false)],p.bins[0].left,p.bins[15].right)
 ];
}
function ledgers(d){
 const s=d.config,p=d.result,rows=(vs,ks)=>vs.map(v=>ks.split(" ").map(k=>v[k])),table=(key,title,headers,rows)=>({key,title,headers,rows});
 const common=[["N",s.N],["初始seed",s.seed],["实际消耗均匀数",p.calls],["最终LCG状态",p.lastState]];
 if(s.mode==="integration")return[
  table("summary","目标、一次估计与理想标准误",["量","值"],[...common,["解析全积分",p.truth],["普通MC估计",p.iid],["分层MC估计",p.strat],["普通MC本次有符号误差",p.iid-p.truth],["分层MC本次有符号误差",p.strat-p.truth],["普通MC理论SE",Math.sqrt(p.iidVariance)],["分层MC理论SE",Math.sqrt(p.stratVariance)],["精确方差比",p.iidVariance/p.stratVariance]]),
  table("samples","每个随机数、取点、分层矩和部分和",["i","LCG状态","u","分层x","u²","分层x²","层内E[x²]","层内Var(x²)","IID前缀均值","分层部分积分","部分积分真值"],rows(p.rows,"i state u x iid strat layerMean layerVariance iidMean partial partialTruth")),
  table("study","全部N=1..256的理论方差",["N","普通MC方差","分层MC方差"],rows(p.study,"N iidVariance stratVariance"))
 ];
 if(s.mode==="chain"){
  const t=p.theory;
  return[
   table("summary","方差、偏差和一次误差不混为一谈",["量","值"],[
    ...common,["总转移次数（含burn）",p.steps.length],["初始均匀数（固定初值时也消耗）",p.initialU],["本次初始状态",p.initialState],
    ["π(+1)",t.piPlus],["π(−1)",t.piMinus],["目标均值m",t.m],["目标单次方差v",t.v],["单步λ",t.lambda],["记录步R=λᵈ",t.R],
    ["指定初始化的E[记录均值]",t.expected],["初始化偏差",t.bias],["有限均值方差",t.variance],["有限均值SE",t.se],["MSE=方差+偏差²",t.mse],
    ["理想IID参考SE",t.iidSE],["平稳混合模型的2τ",t.factor],["平稳混合模型的τ",t.tau],["平稳渐近ESS（可>N）",t.asymptoticESS],
    ["本次均值",p.mean],["本次均值−目标",p.observedError],["样本方差（N=1未定义）",p.sampleVariance],["忽略相关性的样本SE诊断",p.naiveSE],
    ["提出翻转次数",p.proposedCount],["接受翻转次数",p.acceptedCount],["条件接受率（无提议时未定义）",p.acceptance],
    ["全均值分布质量和",t.distributionMass],["全分布计算均值",t.distributionMean],["全分布计算方差",t.distributionVariance]]),
   table("transition","状态序为+1、−1的转移矩阵与平衡流",["起点","到+1","到−1","π起点","正向流π(+)a","反向流π(−)b"],t.P.map((v,i)=>[i===0?1:-1,...v,i===0?t.piPlus:t.piMinus,t.piPlus*t.a,t.piMinus*t.b])),
   table("steps","所有实际转移：无提议时也消耗两个均匀数",["t","更新前s","提议u","接受u","βΔE","接受阈值","提出翻转","接受翻转","更新后s","记录","LCG状态"],rows(p.steps,"t before proposalU acceptU delta accept proposed accepted after record state")),
   table("observations","全部记录及运行均值",["i","真实t","状态s","运行均值"],rows(p.observations,"i t state mean")),
   table("moments","每个观测时刻的解析边缘概率与非负方差贡献",["i","t","P(+)","P(−)","均值","方差","innovation方差","传播权重","对均值方差贡献"],rows(t.moments,"i t plus minus mean variance innovation weight contribution")),
   table("acf","全部滞后；常数样本的经验相关未定义",["k","平稳理论Rᵏ","经验相关诊断"],rows(p.acf,"lag theory empirical")),
   table("distribution","完整理论均值分布：不是伪随机重复试验",["正状态次数","均值","概率","末态+的质量","末态−的质量"],rows(t.distribution,"plusCount mean probability endPlus endMinus"))
  ];
 }
 return[
  table("summary","连续微正则与正则的解析矩",["量","值"],[...common,["固定能量E",s.energy],["正则平均能量",p.moments.canonicalEnergy],["微正则q²",p.moments.microQ2],["正则q²",p.moments.canonicalQ2],["微正则q⁴",p.moments.microQ4],["正则q⁴",p.moments.canonicalQ4],["每次观测的时间间隔",2*Math.PI*s.turns/s.omega],["最后实际观测时间",p.rows[s.N-1].t],["本次离散时间q²",p.rows[s.N-1].microQ2],["本次离散时间q⁴",p.rows[s.N-1].microQ4],["本次正则q²",p.rows[s.N-1].canonicalQ2],["本次正则q⁴",p.rows[s.N-1].canonicalQ4]]),
  table("samples","全部相点、真实观测时间和正则随机数",["i","时间t","能量u","相角u","正则E","固定E的q","固定E的p","正则q","正则p","固定E前缀q²","固定E前缀q⁴","正则前缀q²","正则前缀q⁴","正则前缀E","LCG状态"],rows(p.rows,"i t uEnergy uPhase energy q p canonicalQ canonicalP microQ2 microQ4 canonicalQ2 canonicalQ4 canonicalEnergy state")),
  table("circle","完整连续能量轨道257节点",["i","q","p"],p.circle.map((v,i)=>[i,v.q,v.p])),
  table("bins","左闭右开区间，最后一箱含右端点；E=0单独处理",["箱","左端","右端","精确概率","观测频率"],rows(p.bins,"i left right probability observed"))
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

 const STYLE=".mc140{color:var(--fg,#273646)}.mc140 .mc-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.mc140 label{display:flex;flex-direction:column;gap:6px}.mc140 input,.mc140 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.mc140 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.mc140 button[aria-pressed=true]{outline:3px solid #478aaa}.mc140 .mc-scroll{overflow:auto;max-width:100%;margin:16px 0}.mc140 .mc-scroll:focus{outline:3px solid #478aaa}.mc140 .mc-ledger{max-height:420px}.mc140 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.mc140 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.mc140 th,.mc140 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.mc140 .mc-error{color:#c74b39}.mc140 [hidden]{display:none!important}.mc140 fieldset{margin:16px 0;padding:12px}.mc140 details{margin:16px 0}.mc140 summary{cursor:pointer;font-weight:600}.mc140 .mc-legend{font-size:.95em}.mc140 .mc-note{line-height:1.7}.mc140 [hidden]{display:none!important}.mc140 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("mc140-style")){const style=doc.createElement("style");style.id="mc140-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="mc140"><h3>先认清目标平均，再选择计算方法</h3><p>理想随机模型给出参考方差，固定seed只让这一次伪随机实现可重放。请先预测，再核对每个取点、转移和观测时刻。</p><div class="mc-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="mc-controls"><label>模型<select data-key="mode"><option value="integration">随机积分与分层</option><option value="chain">两态Metropolis与误差</option><option value="ensemble">时间平均与系综</option></select></label>'+
   field("N","记录/样本数N（1–256整数）","integration chain ensemble")+field("seed","LCG种子（0–4294967295整数）","integration chain ensemble")+
   field("eta","无量纲场η=βb（−4–4）","chain")+field("proposal","提出翻转概率r（0或10⁻⁶–1）","chain")+
   field("burn","先实际运行的burn步（0–256整数）","chain")+field("stride","记录间隔d（1–8整数）","chain")+
   '<label data-modes="chain">初始分布<select data-key="initial"><option value="stationary">从目标分布抽一次初值</option><option value="plus">确定初值+1</option><option value="minus">确定初值−1</option></select></label>'+
   field("beta","正则β（0.25–4）","ensemble")+field("energy","固定能量E（0–4）","ensemble")+field("omega","谐振频率ω（0.25–4）","ensemble")+
   field("phase","初始相角/2π（0–1）","ensemble")+field("turns","观测间隔/周期（0–2）","ensemble")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="mc-error" role="alert"></p><p role="status"></p><div class="mc-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".mc-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={integration:"普通MC与分层MC使用同一组均匀数作配对比较；两种估计之间不独立。分层只完成前k层时，部分和估计的是[0,k/N]的面积，不能把它当全区间运行均值。理论标准误在理想独立均匀数模型下计算，不是本次实际误差。",chain:"全部burn与间隔步都真实执行并入账。蓝色理论相关属于平稳链；指定固定初值时，有限均值与方差按实际初始分布另算。理论均值分布由概率递推得到，不是假装跑了许多独立seed。常数样本的经验相关未定义；渐近ESS仅在|R|<1时显示，负相关时允许超过N。",ensemble:"固定E的轨道用解析流直接求每个观测时刻，不含积分器截断误差。等时间离散观测仍可能混叠；正则样本另抽指数能量和均匀相角。连续一周期平均与有限离散观测分别标明。区间图画概率质量，不把转折点的奇异密度截成有限值。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="mc-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="mc-scroll mc-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示当前量未定义或其适用条件不成立，不表示0。记录均值的SE只描述指定初始化下的随机波动，偏差另列，MSE将两者合并。固定种子不会保证独立、热化或物理模型正确；真实格点与实际辛积分分别见后续专页。</p>';
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
 const a=snapshot().result;ck(a.theory.se>a.theory.iidSE,"positive correlation widens SE");
 const b=snapshot({proposal:.9}).result;ck(b.theory.asymptoticESS>128,"negative correlation ESS above N");
 const c=snapshot({proposal:1}).result;ck(c.theory.variance===0&&c.theory.factor===null,"periodic even mean is exact, no mixing formula");
 const d=snapshot({proposal:1,stride:2}).result;ck(d.theory.variance===1&&d.theory.factor===null,"thinning freezes alternating observations");
 const e=snapshot({proposal:0,initial:"plus",eta:1}).result;ck(e.naiveSE===0&&e.theory.mse>0&&e.acf.every(v=>v.empirical===null),"zero sample variance is not accuracy");
 const f=snapshot({mode:"integration",N:1}).result;ck(f.iid===f.strat&&f.iidVariance===f.stratVariance,"one stratum equals IID");
 const g=snapshot({mode:"ensemble"}).result;ck(g.moments.microQ2===g.moments.canonicalQ2&&g.moments.canonicalQ4===2*g.moments.microQ4,"same second moment different fourth");
 const h=snapshot({mode:"ensemble",turns:1}).result;ck(h.rows.every(v=>v.q===h.rows[0].q),"exact trajectory aliased by observation");
 ck(snapshot({mode:"ensemble",energy:0}).result.bins[8].probability===1,"zero energy atom");
 ck(rng(0).next()!==rng(1).next(),"seed zero remains distinct");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,config,rng,sum,integration,oneMinusPower,chainTheory,chain,phasePoint,ensemble,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
