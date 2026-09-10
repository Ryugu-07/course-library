(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-lattice-monte-carlo",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const DEFAULTS={mode:"sample",L:4,temperature:2.3,field:0,N:128,burn:32,every:1,seed:20260911,initial:"random",observable:"abs"};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+" 必须是数值");
 if(typeof v==="string"&&!v.trim())throw Error(key+" 不能为空");
 const n=Number(v);if(!Number.isFinite(n)||n<lo||n>hi||(integer&&!Number.isInteger(n)))throw Error(key+" 超出范围或不是所需整数");
 if(n===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(key+" 非零输入下溢");
 return n;
}
function config(raw={}){
 if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须是对象");
 const s=Object.assign({},DEFAULTS,raw);if(!["sample","exact","finite"].includes(s.mode))throw Error("未知模型");
 s.temperature=num(s.temperature,"T",.5,5);s.field=num(s.field,"h",-1,1);
 if(s.mode!=="finite"){
  s.L=num(s.L,"L",3,12,true);if(!(s.mode==="exact"?[3,4]:[3,4,6,8,10,12]).includes(s.L))throw Error("当前模式不支持此L");
 }
 if(s.mode==="sample"){
  s.N=num(s.N,"N",32,256,true);if(![32,64,128,256].includes(s.N))throw Error("N须为32、64、128或256");
  s.burn=num(s.burn,"burn",0,128,true);s.every=num(s.every,"d",1,4,true);s.seed=num(s.seed,"seed",0,4294967295,true);
  if((s.burn+s.N*s.every)*s.L*s.L>16384)throw Error("总提议超过16384；请减少L、burn、N或d");
  if(!["random","plus","minus","checker"].includes(s.initial))throw Error("未知初值");
  if(!["energy","signed","abs"].includes(s.observable))throw Error("未知观测量");
 }
 return s;
}
function rng(seed){let state=seed,calls=0;return{next(){state=(Math.imul(1664525,state)+1013904223)>>>0;calls++;return(state+.5)/4294967296;},get state(){return state;},get calls(){return calls;}};}
function sum(xs){let z=0,c=0;for(const x of xs){const y=x-c,t=z+y;c=(t-z)-y;z=t;}return z;}
function neighbours(L,i){
 const x=i%L,y=Math.floor(i/L);return[y*L+(x+L-1)%L,y*L+(x+1)%L,((y+L-1)%L)*L+x,((y+1)%L)*L+x];
}
function measure(spins,L){
 let E0=0,M=0;
 for(let i=0;i<spins.length;i++){const x=i%L,y=Math.floor(i/L);M+=spins[i];E0-=spins[i]*(spins[y*L+(x+1)%L]+spins[((y+1)%L)*L+x]);}
 return{E0,M};
}
const dosCache=new Map();
function densityOfStates(L){
 if(dosCache.has(L))return dosCache.get(L);if(L!==3&&L!==4)throw Error("枚举仅支持L3/4");
 const n=L*L,total=2**n,buckets=new Map();
 for(let bits=0;bits<total;bits++){
  const spins=Array.from({length:n},(_,i)=>(bits>>>i)&1?1:-1),v=measure(spins,L),key=v.E0+","+v.M;
  if(!buckets.has(key))buckets.set(key,{E0:v.E0,M:v.M,degeneracy:0});buckets.get(key).degeneracy++;
 }
 const out=Array.from(buckets.values()).sort((a,b)=>a.E0-b.E0||a.M-b.M).map(Object.freeze);
 Object.freeze(out);dosCache.set(L,out);return out;
}
function enumerate(L,T,h){
 const dos=densityOfStates(L),n=L*L,Emin=-2*n-Math.abs(h)*n;
 const rows=dos.map(v=>({...v,energy:v.E0-h*v.M,weight:v.degeneracy*Math.exp(-(v.E0-h*v.M-Emin)/T)}));
 const Zscaled=sum(rows.map(v=>v.weight));rows.forEach(v=>v.probability=v.weight/Zscaled);
 const meanE=sum(rows.map(v=>v.energy*v.probability)),meanM=sum(rows.map(v=>v.M*v.probability)),meanAbs=sum(rows.map(v=>Math.abs(v.M)*v.probability))/n,
  m2=sum(rows.map(v=>(v.M/n)**2*v.probability)),m4=sum(rows.map(v=>(v.M/n)**4*v.probability));
 rows.forEach(v=>{v.energyContribution=v.energy*v.probability/n;v.mContribution=v.M*v.probability/n;v.cvContribution=v.probability*(v.energy-meanE)**2/(n*T*T);v.chiContribution=v.probability*(v.M-meanM)**2/(n*T);});
 const cv=sum(rows.map(v=>v.cvContribution)),chi=sum(rows.map(v=>v.chiContribution));
 const energyMap=new Map(),magMap=new Map(),dosEnergy=new Map();
 for(const v of rows){energyMap.set(v.energy,(energyMap.get(v.energy)||0)+v.probability);magMap.set(v.M,(magMap.get(v.M)||0)+v.probability);dosEnergy.set(v.E0,(dosEnergy.get(v.E0)||0)+v.degeneracy);}
 const energyMass=Array.from(energyMap,([energy,probability])=>({energy,e:energy/n,probability})).sort((a,b)=>a.energy-b.energy),
  magnetizationMass=Array.from(magMap,([M,probability])=>({M,m:M/n,probability})).sort((a,b)=>a.M-b.M),
  degeneracy=Array.from(dosEnergy,([E0,count])=>({E0,count,log2:Math.log2(count)})).sort((a,b)=>a.E0-b.E0);
 return{L,T,h,spins:n,totalStates:2**n,Emin,Zscaled,logZ:Math.log(Zscaled)-Emin/T,rows,meanE,meanM,energy:meanE/n,signed:meanM/n,abs:meanAbs,m2,m4,cv,chi,binder:1-m4/(3*m2*m2),
  mass:sum(rows.map(v=>v.probability)),count:sum(rows.map(v=>v.degeneracy)),energyMass,magnetizationMass,degeneracy};
}
function statistics(xs){
 if(!Array.isArray(xs)||xs.length<2||xs.length>256||(xs.length&(xs.length-1))||xs.some(v=>typeof v!=="number"||!Number.isFinite(v)))throw Error("统计序列须有2–256个有限数值且长度为2的幂");
 const n=xs.length,mean=sum(xs)/n,center=xs.map(x=>x-mean),ss=sum(center.map(x=>x*x)),gamma0=ss/n,acf=[];
 for(let k=0;k<n;k++){const covariance=sum(center.slice(0,n-k).map((v,i)=>v*center[i+k]))/n;acf.push({lag:k,covariance,rho:gamma0===0?null:covariance/gamma0});}
 const pairs=[];let active=gamma0>0,previous=Infinity,positiveSum=0,monotoneSum=0,stop=null;
 for(let k=0;2*k+1<n;k++){
  const raw=acf[2*k].covariance+acf[2*k+1].covariance;
  if(active&&raw<=0){active=false;stop=k;}
  const kept=active?raw:0,monotone=active?Math.min(previous,raw):0;
  if(active)previous=monotone;
  positiveSum+=kept;monotoneSum+=monotone;pairs.push({pair:k,lag0:2*k,lag1:2*k+1,raw,kept,monotone,used:active});
 }
 const ipsRaw=-gamma0+2*positiveSum,imsRaw=-gamma0+2*monotoneSum,ips=gamma0>0&&ipsRaw>0?ipsRaw:null,ims=gamma0>0&&imsRaw>0?imsRaw:null;
 const blocks=[];
 for(let B=1;B<=n/2;B*=2){
  const count=n/B,means=Array.from({length:count},(_,j)=>sum(xs.slice(j*B,(j+1)*B))/B),variance=sum(means.map(v=>(v-mean)**2))/(count-1);
  blocks.push({B,count,mean:sum(means)/count,variance,se:Math.sqrt(variance/count),means});
 }
 return{n,mean,gamma0,variance:ss/(n-1),naiveSE:Math.sqrt(ss/(n-1)/n),acf,pairs,stop,ipsRaw,imsRaw,ips,ims,
  ipsSE:ips===null?null:Math.sqrt(ips/n),imsSE:ims===null?null:Math.sqrt(ims/n),tau:ims===null?null:ims/(2*gamma0),effective:ims===null?null:n*gamma0/ims,
  status:gamma0===0?"constant-sample":ims===null?"nonpositive-estimate":stop===null?"no-cutoff-found":"window-estimate",blocks};
}
function simulate(s){
 const n=s.L*s.L,g=rng(s.seed),initialRows=[],spins=[];
 for(let i=0;i<n;i++){
  const u=g.next(),spin=s.initial==="random"?(u<.5?-1:1):s.initial==="plus"?1:s.initial==="minus"?-1:((i%s.L+Math.floor(i/s.L))%2?-1:1);
  spins.push(spin);initialRows.push({i,u,spin,state:g.state});
 }
 const initial=measure(spins,s.L);let E0=initial.E0,M=initial.M,accepted=0;const steps=[],observations=[];
 const total=(s.burn+s.N*s.every)*n;
 for(let j=0;j<total;j++){
  const ui=g.next(),ua=g.next(),index=Math.floor(ui*n),before=spins[index],neighbourSum=sum(neighbours(s.L,index).map(i=>spins[i])),
   delta0=2*before*neighbourSum,delta=delta0+2*s.field*before,probability=Math.min(1,Math.exp(-delta/s.temperature)),accept=ua<probability;
  if(accept){spins[index]=-before;E0+=delta0;M-=2*before;accepted++;}
  const sweep=Math.floor(j/n)+1,record=(j+1)%n===0&&sweep>s.burn&&(sweep-s.burn)%s.every===0;
  steps.push({attempt:j+1,sweep,index,siteU:ui,acceptU:ua,before,neighbourSum,delta0,delta,probability,accepted:accept,E0,M,energy:E0-s.field*M,record,state:g.state});
  if(record){
   const actual=measure(spins,s.L);if(actual.E0!==E0||actual.M!==M)throw Error("增量能量与全格计算不一致");
   observations.push({i:observations.length+1,sweep,attempt:j+1,E0,M,energy:(E0-s.field*M)/n,signed:M/n,abs:Math.abs(M/n)});
  }
 }
 const stats={};for(const key of ["energy","signed","abs"])stats[key]=statistics(observations.map(v=>v[key]));
 const exact=s.L<=4?enumerate(s.L,s.temperature,s.field):null;
 return{initialRows,initial,steps,observations,spins,stats,accepted,attempted:total,acceptance:accepted/total,calls:g.calls,lastState:g.state,exact};
}
function finiteStudy(s){
 const temperatures=Array.from({length:41},(_,i)=>.5+4.5*i/40);if(!temperatures.includes(s.temperature))temperatures.push(s.temperature);temperatures.sort((a,b)=>a-b);
 const rows=[];
 for(const L of [3,4])for(const T of temperatures){const e=enumerate(L,T,s.field);rows.push({L,T,energy:e.energy,signed:e.signed,abs:e.abs,m2:e.m2,m4:e.m4,cv:e.cv,chi:e.chi,binder:e.binder,logZ:e.logZ});}
 return{temperatures,rows,critical:s.field===0?2/Math.log(1+Math.sqrt(2)):null};
}
function snapshot(raw={}){const s=config(raw);return{config:s,result:s.mode==="sample"?simulate(s):s.mode==="exact"?enumerate(s.L,s.temperature,s.field):finiteStudy(s)};}

const PRESETS=[
 {id:"default",label:"短链与同模型精确答案"},
 {id:"exact",label:"4×4：全部65536个构型",mode:"exact"},
 {id:"odd",label:"3×3：周期边界的奇偶差别",mode:"exact",L:3},
 {id:"field",label:"外场打破磁化对称",mode:"exact",field:.2},
 {id:"frozen",label:"低温短链：零波动不等于准确",temperature:.5,initial:"plus",burn:0,N:32},
 {id:"minus",label:"相反初值，同一个目标",temperature:.5,initial:"minus",burn:0,N:32,observable:"signed"},
 {id:"signed",label:"有符号磁化的相关性",observable:"signed"},
 {id:"energy",label:"能量有自己的相关性",observable:"energy"},
 {id:"large",label:"12×12：不冒充有精确对照",L:12,N:32,burn:16},
 {id:"finite",label:"两个有限格点的精确温度曲线",mode:"finite"},
 {id:"finite-field",label:"非零场：撤去零场临界标记",mode:"finite",field:.2}
];
const QUESTIONS=[
 ["有限零场系统的精确磁化均值为0，是否表示每个构型都没有磁化？",["不是，正负构型抵消，绝对磁化仍可很大","是，每个构型的磁化都必须为0"],0,"全局翻转使M变号而能量不变；分布对称不等于样本逐个为0。"],
 ["短链中所有读数相同，能否据此认证均值的误差为0？",["不能，经验相关未定义，链可能没有离开初态","能，标准差为0已经足够"],0,"样本内没有波动，不代表目标分布没有波动或初值偏差。"],
 ["改变观测量，从m换成绝对值后能否照抄原来的相关时间？",["不能，要重新计算该观测量的相关函数","能，同一条链只有一个相关时间"],0,"同一转移链中不同观测量可能耦合到不同的慢模。"],
 ["3×3和4×4比热的光滑峰能否单独证明无限系统的临界指数？",["不能，有限系统峰和极限奇点之间还缺尺度分析","能，两个尺寸已有唯一答案"],0,"有限配分函数是有限个正项的和；小系统精确答案仍不是热力学极限。"]
];
function fmt(x){
 if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
const observableNames={energy:"能量/自旋 e",signed:"有符号磁化 m",abs:"绝对磁化 |m|"};
function series(key,label,color,points,line=true){return{key,label,color,points,line};}
function plot(title,x,y,ss,xmin,xmax,square=false){
 const ys=ss.flatMap(s=>s.points.map(v=>v[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
 if(square){const r=1.08*Math.max(1,...ss.flatMap(s=>s.points.flatMap(v=>v.map(Math.abs))));return{title,x,y,series:ss,xmin:-r,xmax:r,ymin:-r,ymax:r,square,markers:[],xTicks:[-r,0,r]};}
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result,B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72";
 if(s.mode==="exact")return[
  plot("完整枚举：各能量的概率质量","能量/自旋 e","概率质量",[series("energy-mass","Boltzmann边缘概率",B,p.energyMass.map(v=>[v.e,v.probability]),false)],p.energyMass[0].e,p.energyMass.at(-1).e),
  plot("零场时正负磁化等概率；外场改变权重","有符号磁化 m","概率质量",[series("mag-mass","磁化边缘概率",O,p.magnetizationMass.map(v=>[v.m,v.probability]),false)],-1,1),
  plot("每个(E₀,M)桶对比热的非负贡献","完整联合DOS桶序号","每自旋比热贡献",[series("cv-bucket","p(E−〈E〉)²/(L²T²)",G,p.rows.map((v,i)=>[i,v.cvContribution]),false)],0,p.rows.length-1),
  plot("态数由格点决定，温度只改变概率权重","零场相互作用能量 E₀","log₂ 简并度",[series("dos","同E₀的构型数",B,p.degeneracy.map(v=>[v.E0,v.log2]),false)],p.degeneracy[0].E0,p.degeneracy.at(-1).E0)
 ];
 if(s.mode==="finite"){
  const labels={cv:"比热/自旋",chi:"磁化率/自旋",abs:"绝对磁化均值",binder:"Binder U₄"};
  return ["cv","chi","abs","binder"].map(key=>{
   const q=plot(labels[key]+"：完整温度点的精确有限和","T（J=kB=1）",labels[key],[3,4].map((L,i)=>series("L"+L,L+"×"+L+"周期格点",i?O:B,p.rows.filter(v=>v.L===L).map(v=>[v.T,v[key]]))),.5,5);
   if(p.critical!==null)q.markers=[{x:p.critical,label:"无限零场Tc（非小格拟合）"}];
   return q;
  });
 }
 const t=p.stats[s.observable],name=observableNames[s.observable],obs=p.observations;
 let running=0;
 const runningSeries=[series("mean","本次前缀均值",O,obs.map((v,i)=>{running+=v[s.observable];return[v.sweep,running/(i+1)];}))];
 if(p.exact)runningSeries.push(series("target","同L、T、h的精确目标",G,obs.map(v=>[v.sweep,p.exact[s.observable]])));
 const grid=[-1,1].map((v,i)=>series("spin"+(i?"plus":"minus"),"自旋 "+(i?"+1":"−1"),i?O:B,p.spins.flatMap((spin,j)=>spin===v?[[j%s.L-(s.L-1)/2,(s.L-1)/2-Math.floor(j/s.L)]]:[]),false));
 return[
  plot("每次记录对应真实sweep；记录间还执行所有更新","实际sweep","本次 "+name,[series("trajectory",name,O,obs.map(v=>[v.sweep,v[s.observable]]))],0,s.burn+s.N*s.every),
  plot("运行均值与目标比较；偏离不自动等于程序错误","实际sweep",name+" 均值",runningSeries,0,s.burn+s.N*s.every),
  plot("全部经验自相关：恒定序列不画伪造的零相关","记录滞后 k","经验ρ(k)",[series("acf","中心化经验ACF",B,t.acf.filter(v=>v.rho!==null).map(v=>[v.lag,v.rho]))],0,s.N-1),
  plot("成对截断：先取初始正序列，再取累计最小值","成对序号 k","Γ̂k=γ̂2k+γ̂2k+1",[
   series("pair-raw","全部原始成对值",B,t.pairs.map(v=>[v.pair,v.raw])),
   series("pair-used","IMS实际保留值（截断后为0）",O,t.pairs.map(v=>[v.pair,v.monotone]))],0,t.pairs.length-1),
  plot("增大块长也会减少块数；最后一点只有两个块","log₂ 块长 B","分块均值SE估计",[series("batch","全部整除块长；不删除尾部",R,t.blocks.map(v=>[Math.log2(v.B),v.se]))],0,Math.log2(s.N/2)),
  plot("最终构型：边缘与对边相邻，全部格点保留","水平格点位置","竖直格点位置；等比例",grid,-s.L/2,s.L/2,true)
 ];
}
function ledgers(d){
 const s=d.config,p=d.result,rows=(vs,ks)=>vs.map(v=>ks.split(" ").map(k=>v[k])),table=(key,title,headers,rows)=>({key,title,headers,rows});
 const exactTables=e=>[
  table("dos","全部非零联合态密度桶与权重",[ "E₀","M","构型数g","含场E","平移权重","概率p","能量均值贡献/自旋","磁化均值贡献/自旋","比热贡献/自旋","磁化率贡献/自旋"],rows(e.rows,"E0 M degeneracy energy weight probability energyContribution mContribution cvContribution chiContribution")),
  table("energy-mass","全部能量边缘概率",["E","e","概率"],rows(e.energyMass,"energy e probability")),
  table("mag-mass","全部磁化边缘概率",["M","m","概率"],rows(e.magnetizationMass,"M m probability")),
  table("degeneracy","全部零场能量简并度",["E₀","构型数","log₂构型数"],rows(e.degeneracy,"E0 count log2"))
 ];
 if(s.mode==="exact")return[
  table("summary","有限系统的精确求和（浮点计算权重）",["量","值"],[
   ["L",s.L],["T",s.temperature],["h",s.field],["枚举构型数",p.totalStates],["桶内构型数总和",p.count],["概率和",p.mass],["最低能量",p.Emin],["平移配分和",p.Zscaled],["log Z",p.logZ],
   ["〈e〉",p.energy],["〈m〉",p.signed],["〈|m|〉",p.abs],["〈m²〉",p.m2],["〈m⁴〉",p.m4],["比热/自旋",p.cv],["磁化率/自旋",p.chi],["Binder U₄",p.binder]]),...exactTables(p)
 ];
 if(s.mode==="finite")return[
  table("summary","仅作有限系统比较，不拟合临界指数",["量","值"],[["h",s.field],["每个L的完整温度点数",p.temperatures.length],["尺寸个数",2],["无限零场Tc（非零场不适用）",p.critical]]),
  table("temperatures","所有温度、两个尺寸及全部精确矩",["L","T","〈e〉","〈m〉","〈|m|〉","〈m²〉","〈m⁴〉","比热/自旋","磁化率/自旋","Binder U₄","log Z"],rows(p.rows,"L T energy signed abs m2 m4 cv chi binder logZ"))
 ];
 const t=p.stats[s.observable],ref=p.exact&&p.exact[s.observable],status={"constant-sample":"样本恒定：经验相关未定义","nonpositive-estimate":"渐近方差估计非正：不报告ESS","no-cutoff-found":"窗口内未找到截断：仅作诊断","window-estimate":"有限窗口估计：不是收敛证书"};
 return[
  table("summary","当前观测量、真实更新预算与诊断",["量","值"],[
   ["L",s.L],["T",s.temperature],["h",s.field],["观测量",observableNames[s.observable]],["初始模式",s.initial],["初始seed",s.seed],["burn sweep",s.burn],["每d sweep记录",s.every],["记录数N",s.N],
   ["实际提议数",p.attempted],["实际接受数",p.accepted],["接受率",p.acceptance],["消耗均匀数",p.calls],["最终LCG状态",p.lastState],["本次均值",t.mean],["同模型精确均值（仅L3/4）",ref],["本次均值−精确目标",ref===null?null:t.mean-ref],
   ["样本方差",t.variance],["忽略相关的SE诊断",t.naiveSE],["IPS原始渐近方差估计",t.ipsRaw],["IMS原始渐近方差估计",t.imsRaw],["IPS标准误估计",t.ipsSE],["IMS标准误估计",t.imsSE],["IMS τ估计",t.tau],["IMS有效样本估计（不夹N）",t.effective],["首个非正成对值序号",t.stop],["诊断状态",status[t.status]]]),
  table("observables","三个不同观测量，分别计算诊断",["观测量","均值","γ̂₀","样本方差","naive SE","IPS SE","IMS SE","IMS τ","ESS","状态"],Object.entries(p.stats).map(([key,v])=>[observableNames[key],v.mean,v.gamma0,v.variance,v.naiveSE,v.ipsSE,v.imsSE,v.tau,v.effective,status[v.status]])),
  table("initial","每个初始格点，固定初值时也消耗均匀数",["格点i","u","初始自旋","LCG状态"],rows(p.initialRows,"i u spin state")),
  table("steps","全部实际单点提议；一sweep是L²次有放回选择",["提议序号","sweep","格点i","选点u","接受u","翻前自旋","四邻自旋和","ΔE₀","含场ΔE","接受阈值","接受","更新后E₀","更新后M","更新后E","记录","LCG状态"],rows(p.steps,"attempt sweep index siteU acceptU before neighbourSum delta0 delta probability accepted E0 M energy record state")),
  table("observations","全部记录，第一条在burn+d sweep后",["记录i","真实sweep","已执行提议数","E₀","M","e","m","|m|"],rows(p.observations,"i sweep attempt E0 M energy signed abs")),
  table("acf","当前观测量全部滞后；分母统一为N",["滞后k","γ̂k","经验ρk"],rows(t.acf,"lag covariance rho")),
  table("pairs","所有成对值、初始正截断和单调修正",["k","滞后2k","滞后2k+1","原始Γ̂k","IPS保留值","IMS保留值","在窗口内"],rows(t.pairs,"pair lag0 lag1 raw kept monotone used")),
  table("blocks","全部整除块长；块均值仍可能彼此相关",["B","块数","块均值的均值","块均值样本方差","SE估计"],rows(t.blocks,"B count mean variance se")),
  table("block-means","每种块长下的每一个块均值",["B","块序号（从1）","第一条记录","最后一条记录","块均值"],t.blocks.flatMap(v=>v.means.map((m,i)=>[v.B,i+1,i*v.B+1,(i+1)*v.B,m]))),
  table("spins","最终格点，全部格点逐一列出",["格点i","行","列","自旋"],p.spins.map((v,i)=>[i,Math.floor(i/s.L),i%s.L,v])),
  ...(p.exact?exactTables(p.exact):[])
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

 const STYLE=".lat141{color:var(--fg,#273646)}.lat141 .lat-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.lat141 label{display:flex;flex-direction:column;gap:6px}.lat141 input,.lat141 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.lat141 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.lat141 button[aria-pressed=true]{outline:3px solid #478aaa}.lat141 .lat-scroll{overflow:auto;max-width:100%;margin:16px 0}.lat141 .lat-scroll:focus{outline:3px solid #478aaa}.lat141 .lat-ledger{max-height:420px}.lat141 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.lat141 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.lat141 th,.lat141 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.lat141 .lat-error{color:#c74b39}.lat141 [hidden]{display:none!important}.lat141 fieldset{margin:16px 0;padding:12px}.lat141 details{margin:16px 0}.lat141 summary{cursor:pointer;font-weight:600}.lat141 .lat-legend{font-size:.95em}.lat141 .lat-note{line-height:1.7}.lat141 [hidden]{display:none!important}.lat141 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("lat141-style")){const style=doc.createElement("style");style.id="lat141-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="lat141"><h3>先在小系统找到答案，再检查随机采样</h3><p>采用J=kB=1的周期方格。完整枚举给出同模型的有限系统期望；短链估计必须另行检查初值和相关性。</p><div class="lat-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="lat-controls"><label>模型<select data-key="mode"><option value="sample">单点Metropolis与统计诊断</option><option value="exact">3×3或4×4完整枚举</option><option value="finite">两个有限尺寸的温度曲线</option></select></label>'+
   field("L","边长L（枚举3/4；采样3/4/6/8/10/12）","sample exact")+
   field("temperature","温度T（0.5–5）","sample exact finite")+field("field","外场h（−1–1）","sample exact finite")+
   field("N","记录数N（32/64/128/256）","sample")+field("burn","先执行burn sweep（0–128整数）","sample")+
   field("every","每d sweep记录（1–4整数）","sample")+field("seed","LCG种子（0–4294967295整数）","sample")+
   '<label data-modes="sample">初始构型<select data-key="initial"><option value="random">随机±1</option><option value="plus">全+1</option><option value="minus">全−1</option><option value="checker">棋盘式（奇L不能满足全部反向键）</option></select></label>'+
   '<label data-modes="sample">统计观测量<select data-key="observable"><option value="abs">绝对磁化 |m|</option><option value="signed">有符号磁化 m</option><option value="energy">能量/自旋 e</option></select></label></div><p>采样总提议预算为(burn+Nd)L²≤16384，超限会明确报错；不会暗中减少步数。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="lat-error" role="alert"></p><p role="status"></p><div class="lat-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".lat-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={exact:"枚举访问全部2^(L²)个构型，以(E₀,M)汇总简并度。温度和外场改变Boltzmann权重，不改变态密度。这里的“精确”指完整有限和，指数与求和仍使用浮点数。概率图的点是质量，不是连续密度。",sample:"每个sweep实际进行L²次随机有放回单点提议；全部burn和记录间隔更新都入账。第一条记录在burn+d之后。L=3/4提供同T、h的精确目标；更大L没有伪造精确参考。全部ACF、成对窗口和分块均值均针对当前选择的观测量重新计算。",finite:"蓝橙两组曲线来自完整枚举，每个点均有表格记录，线段只连接采样温度点。L=3与4既有尺寸差别，也有奇偶周期几何差别；不能仅用它们拟合临界指数。仅h=0标出无限二维方格的已知Tc，该标记不是从两条曲线拟合出来的。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="lat-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="lat-scroll lat-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示量未定义或缺少参考，不表示0。IMS与分块SE均为有限序列诊断；未找到截断、块数过少或初态未遗忘时，不能据此认证收敛。所有读数相同会使经验相关未定义；naive SE或分块SE显示0仍不是准确性证书。固定seed只能重放这一次伪随机路径。</p>';
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
 for(const L of [3,4]){
  const e=enumerate(L,2.3,0);ck(e.count===2**(L*L),"all configurations");
  ck(Math.abs(e.mass-1)<1e-12&&Math.abs(e.signed)<1e-12&&e.abs>0,"symmetric nontrivial measure");
  ck(e.cv>=0&&e.chi>=0,"fluctuation responses nonnegative");
 }
 ck(densityOfStates(3).at(-1).E0===6,"odd torus antialignment is frustrated");
 const a=statistics(Array(32).fill(1));ck(a.effective===null&&a.acf.every(v=>v.rho===null),"constant series not independent evidence");
 ck(fmt(10)==="10"&&fmt(1000)==="1000"&&fmt(20260910)==="20260910","integer trailing zeros preserved");
 const d=snapshot({N:32,burn:2,every:2,seed:0}).result;ck(d.steps.length===66*16&&d.observations.length===32&&d.observations[0].sweep===4,"real budget and record times");
 ck(d.calls===16+2*d.steps.length,"all uniforms accounted");
 ck(finiteStudy(config({mode:"finite",field:.2})).critical===null,"zero-field critical marker not reused");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,config,rng,sum,neighbours,measure,densityOfStates,enumerate,statistics,simulate,finiteStudy,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
