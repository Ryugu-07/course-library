(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("aep-typicality",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
"use strict";
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
function rat(n,d=1n){if(d===0n)throw Error("分母为零");if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const ZERO=rat(0n),ONE=rat(1n),add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d),div=(a,b)=>rat(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d-b.n*a.d,complement=p=>sub(ONE,p),pow=(a,k)=>rat(a.n**BigInt(k),a.d**BigInt(k));
function decimal(value,label="参数",lo=0,hi=1){
 if(typeof value!=="string"&&typeof value!=="number")throw Error(label+"须为十进制数");
 const s=String(value).trim();if(!/^(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(s))throw Error(label+"须为最多6位小数的非负十进制数（不接受指数记法）");
 const x=Number(s);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(label+"超出范围");
 const t=s.split("."),den=10n**BigInt((t[1]||"").length);return rat(BigInt(t[0]||"0")*den+BigInt(t[1]||"0"),den);
}
function integer(value,label,lo,hi){if(typeof value!=="number"&&typeof value!=="string")throw Error(label+"须为整数");const s=String(value).trim();if(!/^\d+$/.test(s))throw Error(label+"须为整数");const n=Number(s);if(!Number.isSafeInteger(n)||n<lo||n>hi)throw Error(label+"超出范围");return n;}
function approx(q){
 if(q.n===0n)return 0;const sign=q.n<0n?-1:1,n=abs(q.n),bn=n.toString(2).length,bd=q.d.toString(2).length,sn=Math.max(0,bn-53),sd=Math.max(0,bd-53);
 const exponent=sn-sd,first=Math.max(-1022,Math.min(1023,exponent));return sign*((Number(n>>BigInt(sn))/Number(q.d>>BigInt(sd)))*2**first)*2**(exponent-first);
}
function logq(q){
 if(q.n<=0n)return null;
 if(q.n<=2n*q.d&&2n*q.n>=q.d)return Math.log1p(approx(sub(q,ONE)))/Math.LN2;
 const bn=q.n.toString(2).length,bd=q.d.toString(2).length,sn=Math.max(0,bn-53),sd=Math.max(0,bd-53);
 return Math.log2(Number(q.n>>BigInt(sn))/Number(q.d>>BigInt(sd)))+sn-sd;
}
function pack(q){const x=approx(q);return {numerator:String(q.n),denominator:String(q.d),value:q.n!==0n&&x===0?null:x,status:q.n===0n?"zero":x===0?"underflow":"finite",log2:q.n>0n?logq(q):null};}
function sum(values){let s=0,c=0;for(const x of values){const y=x-c,t=s+y;c=(t-s)-y;s=t;}return s;}
function entropy(p){return sum([p,complement(p)].filter(x=>x.n>0n).map(x=>-approx(x)*logq(x)));}
function binom(n,k){let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;}
function bits(count){if(count===0n)return null;return count===1n?0:(count-1n).toString(2).length;}
function typeRows(n,probability){let c=1n;return Array.from({length:n+1},(_,k)=>{if(k)c=c*BigInt(n-k+1)/BigInt(k);const p=probability(k),mass=mul(rat(c),p);return {k,count:c,p,mass};});}
function codebook(rows,ell){
 let remaining=1n<<BigInt(ell),covered=ZERO,recovered=0n;const ranks=rows.filter(x=>x.p.n>0n).slice().sort((a,b)=>{const z=cmp(b.p,a.p);return z>0n?1:z<0n?-1:a.k-b.k;});
 const allocation=ranks.map((r,rank)=>{const take=remaining<r.count?remaining:r.count;remaining-=take;recovered+=take;const mass=mul(rat(take),r.p);covered=add(covered,mass);return {rank:rank+1,k:r.k,count:String(r.count),selected:String(take),sequenceProbability:pack(r.p),selectedMass:pack(mass)};});
 const support=rows.filter(x=>x.p.n>0n).reduce((s,x)=>s+x.count,0n);
 return {ell,capacity:String(1n<<BigInt(ell)),recovered:String(recovered),unused:String(remaining),support:String(support),zeroErrorBits:bits(support),covered:pack(covered),error:pack(complement(covered)),allocation};
}
function summarizeTypes(rows,n,center,epsilon,offset){
 let total=ZERO,typical=ZERO,count=0n;const terms=[];
 const table=rows.map(r=>{
  total=add(total,r.mass);const possible=r.p.n>0n,information=possible?-logq(r.p)/n:null,difference=possible?(offset?offset(r.k):information-center):null,margin=possible?epsilon-Math.abs(difference):null,inBand=possible&&margin>=0;
  if(inBand){typical=add(typical,r.mass);count+=r.count;}if(possible)terms.push(approx(r.mass)*information*n);
  return {k:r.k,count:String(r.count),sequenceProbability:pack(r.p),mass:pack(r.mass),information,difference,margin,nearBoundary:possible&&Math.abs(margin)<=64*Number.EPSILON*(1+Math.abs(information)+Math.abs(center)+epsilon),typical:inBand};
 });
 return {rows:table,total:pack(total),typicalMass:pack(typical),atypicalMass:pack(complement(typical)),typicalCount:String(count),typicalLogCount:count===0n?null:logq(rat(count)),typicalBits:bits(count),empty:count===0n,blockEntropy:sum(terms),center,epsilon};
}
function iid(c){
 const p=decimal(c.p,"P(1)"),q=complement(p),h=entropy(p),n=c.n,raw=typeRows(n,k=>mul(pow(p,k),pow(q,n-k))),lr=p.n>0n&&q.n>0n?logq(div(q,p)):0;
 const result=summarizeTypes(raw,n,h,Number(c.epsilon),k=>p.n===0n||q.n===0n?0:approx(sub(rat(BigInt(k),BigInt(n)),p))*lr);
 const largest=raw.reduce((v,r)=>cmp(r.p,v)>0n?r.p:v,ZERO);
 const champions=raw.filter(r=>cmp(r.p,largest)===0n).map(r=>({k:r.k,count:String(r.count),probability:pack(r.p),typical:result.rows[r.k].typical}));
 return {...result,p:pack(p),entropy:h,variance:approx(mul(p,q))*lr*lr,chebyshev:Number(c.epsilon)>0?approx(mul(p,q))*lr*lr/(n*Number(c.epsilon)**2):null,champions,coding:codebook(raw,c.ell)};
}
function mixture(c){
 const pA=decimal(c.pA,"分量A的P(1)"),pB=decimal(c.pB,"分量B的P(1)"),w=decimal(c.weight,"选择A的概率"),v=complement(w),n=c.n,hA=entropy(pA),hB=entropy(pB),h=approx(w)*hA+approx(v)*hB;
 const pairs=Array.from({length:n+1},(_,k)=>[mul(pow(pA,k),pow(complement(pA),n-k)),mul(pow(pB,k),pow(complement(pB),n-k))]);
 const raw=typeRows(n,k=>add(mul(w,pairs[k][0]),mul(v,pairs[k][1]))),result=summarizeTypes(raw,n,h,Number(c.epsilon));
 const posterior=result.rows.map((r,k)=>{const jointA=mul(w,pairs[k][0]),jointB=mul(v,pairs[k][1]),a=raw[k].p.n>0n?div(jointA,raw[k].p):null;return {k,jointA:pack(jointA),jointB:pack(jointB),posteriorA:a?pack(a):null,posteriorEntropy:a?entropy(a):null};});
 const conditionalLatentEntropy=sum(posterior.filter(x=>x.posteriorA).map(x=>approx(raw[x.k].mass)*x.posteriorEntropy)),latentEntropy=entropy(w),mutualInformation=latentEntropy-conditionalLatentEntropy;
 return {...result,pA:pack(pA),pB:pack(pB),weight:pack(w),componentEntropy:[hA,hB],entropyRate:h,latentEntropy,conditionalLatentEntropy,mutualInformation,entropyIdentity:n*h+mutualInformation,entropyIdentityGap:result.blockEntropy-(n*h+mutualInformation),posterior,coding:codebook(raw,c.ell)};
}
function markov(c){
 const a=decimal(c.a,"Q01"),b=decimal(c.b,"Q10"),Q=[[complement(a),a],[b,complement(b)]],ab=add(a,b),stationary=ab.n===0n?null:[div(b,ab),div(a,ab)];
 const requested=decimal(c.initial,"初始P(1)"),pi=c.start==="stationary"?(stationary||[complement(requested),requested]):[complement(requested),requested];
 const ma=decimal(c.modelA,"模型Q01"),mb=decimal(c.modelB,"模型Q10"),mi=decimal(c.modelInitial,"模型初始P(1)"),R=[[complement(ma),ma],[mb,complement(mb)]],nu=[complement(mi),mi],n=c.n;
 const stationaryActual=pi.every((p,j)=>cmp(p,add(mul(pi[0],Q[0][j]),mul(pi[1],Q[1][j])))===0n),rowEntropy=[entropy(a),entropy(b)],rate=stationaryActual?approx(pi[0])*rowEntropy[0]+approx(pi[1])*rowEntropy[1]:null;
 let total=ZERO,modelTotal=ZERO;const ht=[],ct=[],dt=[],rows=[];let unsupported=false;
 for(let index=0;index<2**n;index++){
  const path=index.toString(2).padStart(n,"0"),x=Array.from(path,Number),counts=[[0,0],[0,0]];let p=pi[x[0]],q=nu[x[0]];
  for(let t=1;t<n;t++){counts[x[t-1]][x[t]]++;p=mul(p,Q[x[t-1]][x[t]]);q=mul(q,R[x[t-1]][x[t]]);}
  total=add(total,p);modelTotal=add(modelTotal,q);const information=p.n>0n?-logq(p):null,modelInformation=q.n>0n?-logq(q):null,logRatio=p.n>0n&&q.n>0n?logq(div(p,q)):null;
  if(p.n>0n){ht.push(approx(p)*information);if(q.n>0n){ct.push(approx(p)*modelInformation);dt.push(approx(p)*logRatio);}else unsupported=true;}
  rows.push({index,path,counts,probability:pack(p),modelProbability:pack(q),information,modelInformation,logRatio,possible:p.n>0n,unsupported:p.n>0n&&q.n===0n,empiricalCrossEntropy:modelInformation===null?null:modelInformation/n});
 }
 const chain=[];let distribution=pi.slice(),chainEntropy=entropy(pi[1]);
 for(let t=0;t<n;t++){const conditional=t===0?entropy(pi[1]):sum(distribution.map((p,j)=>approx(p)*rowEntropy[j]));if(t>0)chainEntropy+=conditional;chain.push({t,previousDistribution:t===0?null:distribution.map(pack),conditionalEntropy:conditional,cumulativeEntropy:chainEntropy});if(t>0)distribution=[0,1].map(j=>add(mul(distribution[0],Q[0][j]),mul(distribution[1],Q[1][j])));}
 const H=sum(ht),CE=unsupported?null:sum(ct),KL=unsupported?null:sum(dt);
 return {Q:Q.map(row=>row.map(pack)),modelQ:R.map(row=>row.map(pack)),initial:pi.map(pack),modelInitial:nu.map(pack),stationary:stationary?stationary.map(pack):null,stationaryActual,irreducible:a.n>0n&&b.n>0n,period:a.n>0n&&b.n>0n?(cmp(a,ONE)===0n&&cmp(b,ONE)===0n?2:1):null,rowEntropy,entropyRate:rate,rows,total:pack(total),modelTotal:pack(modelTotal),blockEntropy:H,entropyPerSymbol:H/n,crossEntropy:CE,relativeEntropy:KL,infiniteCrossEntropy:unsupported,identityGap:unsupported?null:CE-H-KL,chain,chainEntropy,chainGap:H-chainEntropy};
}
const DEFAULTS={mode:"iid",n:100,p:"0.9",epsilon:"0.1",ell:47,pA:"0.1",pB:"0.5",weight:"0.5",a:"0.1",b:"0.2",start:"stationary",initial:"0.5",modelA:"0.5",modelB:"0.5",modelInitial:"0.5"};
function config(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("配置须为对象");const c={...DEFAULTS,...input};if(!["iid","mixture","markov"].includes(c.mode))throw Error("未知实验");
 c.n=integer(c.n,"长度n",1,c.mode==="markov"?9:256);
 if(c.mode==="markov"){
  if(!["stationary","chosen"].includes(c.start))throw Error("未知初始规则");for(const k of["a","b","initial","modelA","modelB","modelInitial"])decimal(c[k],k);
 }else{decimal(c.epsilon,"带宽epsilon",0,2);c.ell=integer(c.ell,"码长ell",0,256);for(const k of c.mode==="iid"?["p"]:["pA","pB","weight"])decimal(c[k],k);}
 return c;
}
function snapshot(input={}){const c=config(input);return {parameters:c,result:c.mode==="iid"?iid(c):c.mode==="mixture"?mixture(c):markov(c)};}
const PRESETS=[
 {id:"biased",label:"100次偏置硬币",values:{}},
 {id:"fair",label:"公平：零带宽也全典型",values:{p:"0.5",epsilon:"0"}},
 {id:"zero",label:"确定性全0",values:{p:"0",epsilon:"0",ell:0}},
 {id:"one",label:"确定性全1",values:{p:"1",epsilon:"0",ell:0}},
 {id:"empty",label:"两次抛掷：典型集为空",values:{n:2,p:"0.75",epsilon:"0.1",ell:1}},
 {id:"zero-band",label:"偏置零带宽",values:{p:"0.9",epsilon:"0"}},
 {id:"one-symbol",label:"长度1与零比特码",values:{n:1,ell:0}},
 {id:"wide",label:"扩大带宽收进冠军",values:{epsilon:"0.4"}},
 {id:"more-bits",label:"53比特最优码本",values:{ell:53}},
 {id:"full-code",label:"严格零错误满码本",values:{ell:100}},
 {id:"partial-tie",label:"并列类型只收部分",values:{n:2,p:"0.75",ell:1}},
 {id:"underflow",label:"微小概率保留精确分数",values:{n:256,p:"0.000001",ell:1}},
 {id:"fair-half",label:"公平硬币少一比特",values:{n:256,p:"0.5",epsilon:"0",ell:255}},
 {id:"mix",label:"一次选信源：两种信息率",values:{mode:"mixture"}},
 {id:"mix-long",label:"混合长度256",values:{mode:"mixture",n:256}},
 {id:"latent-phase",label:"全0或公平硬币",values:{mode:"mixture",pA:"0",pB:"0.5",epsilon:"0.2"}},
 {id:"same-entropy",label:"不同分量却同熵",values:{mode:"mixture",pA:"0.1",pB:"0.9"}},
 {id:"same-source",label:"两个分量完全相同",values:{mode:"mixture",pA:"0.5",pB:"0.5",epsilon:"0"}},
 {id:"pure-a",label:"混合权重退化为A",values:{mode:"mixture",weight:"1"}},
 {id:"two-constant",label:"两种常数路径",values:{mode:"mixture",pA:"0",pB:"1",epsilon:"0.01"}},
 {id:"markov",label:"平稳有记忆链",values:{mode:"markov",n:8}},
 {id:"periodic",label:"周期交替：熵率零",values:{mode:"markov",n:8,a:"1",b:"1"}},
 {id:"absorbing",label:"两个吸收态",values:{mode:"markov",n:8,a:"0",b:"0"}},
 {id:"nonstationary",label:"指定非平稳起点",values:{mode:"markov",n:8,start:"chosen",initial:"1"}},
 {id:"matched",label:"真实模型与候选完全相同",values:{mode:"markov",n:8,a:"0.1",b:"0.1",modelA:"0.1",modelB:"0.1"}},
 {id:"support-gap",label:"模型漏掉真实路径",values:{mode:"markov",n:8,modelA:"0"}},
 {id:"initial-gap",label:"模型初始支持缺口",values:{mode:"markov",n:8,modelInitial:"0"}},
 {id:"single-path",label:"唯一常数路径",values:{mode:"markov",n:8,a:"0",b:"0.2"}},
 {id:"markov-one",label:"Markov长度1无转移",values:{mode:"markov",n:1}},
 {id:"fair-markov",label:"无记忆公平链",values:{mode:"markov",n:9,a:"0.5",b:"0.5"}}
];
const QUESTIONS=[
 ["公平硬币的零带宽弱典型集多大？",["全部序列","只含频率恰好一半的序列"],0],
 ["p=0.9，n=100时，47比特能否直接保证几乎零块错误？",["不能，要计算有限码本覆盖率","可以，因为47接近nH"],0],
 ["从公平相位开始永远交替，熵率是多少？",["0：只有最初相位随机","1：每个时刻的边际都公平"],0],
 ["平稳但非遍历的混合信源，路径信息率必等于平均熵率吗？",["不必，可能有不同分量极限","必然，平稳已经足够"],0]
];
function fmt(x){if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x==="number"){if(!Number.isFinite(x))throw Error("未标记的非有限数");if(x===0)return"0";return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));}if(typeof x==="object")return Array.isArray(x)?"["+x.map(fmt).join("；")+"]":Object.entries(x).map(([k,v])=>(WORDS[k]||k)+"="+fmt(v)).join("；");return WORDS[String(x)]||String(x);}
const B="#268bd2",O="#cb6a16",G="#29966c",V="#9966bb",R="#b44a72";
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,xmax){const v=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...v),hi=Math.max(0,...v),pad=(hi-lo||1)*.08;return {title,x,y,series:ss,xmin:0,xmax:Math.max(1,xmax),ymin:lo-pad,ymax:hi+pad,square:false,markers:[],xTicks:[...new Set(Array.from({length:5},(_,i)=>Math.round(Math.max(1,xmax)*i/4)))]};}
function plots(d){
 const c=d.parameters,r=d.result,n=c.n;
 if(c.mode==="markov")return[
  chart("全部路径的概率：真实信源与候选模型","二元路径的整数编号（字典序）","整条路径概率；下溢点省略，分数仍在表中",[series("true","真实P",B,r.rows.flatMap(z=>z.probability.value===null?[]:[[z.index,z.probability.value]])),series("model","模型Q",O,r.rows.flatMap(z=>z.modelProbability.value===null?[]:[[z.index,z.modelProbability.value]]))],2**n-1),
  chart("单路径损失：不能冒充期望交叉熵","路径编号","比特 / 二元符号；零模型概率的无穷值不画点",[
   series("information","真实自信息率",B,r.rows.flatMap(z=>z.information===null?[]:[[z.index,z.information/n]])),series("loss","模型经验损失",O,r.rows.flatMap(z=>z.modelInformation===null?[]:[[z.index,z.modelInformation/n]])),series("rate","平稳起始熵率",G,r.entropyRate===null?[]:[[0,r.entropyRate],[2**n-1,r.entropyRate]])],2**n-1),
  chart("链式法则：每一位新增多少条件熵","位置t（从0开始）","比特；第一位包含初始随机性",[series("conditional","实际条件熵",B,r.chain.map(z=>[z.t,z.conditionalEntropy])),series("rate","平稳起始熵率",G,r.entropyRate===null?[]:[[0,r.entropyRate],[n-1,r.entropyRate]])],n-1),
  chart("对数似然比：单条为负并不违反KL非负","路径编号","log₂(P / Q)；任一概率为零时不画点",[series("ratio","逐路径对数比",V,r.rows.flatMap(z=>z.logRatio===null?[]:[[z.index,z.logRatio]]))],2**n-1)
 ];
 const typ=r.rows.filter(z=>z.typical),assigned=new Map(r.coding.allocation.map(z=>[z.k,z])),h=r.center,eps=Number(c.epsilon);
 const out=[
  chart("全部类型质量，与典型带选中的质量","类型k：1的个数","P(K=k)；类型包含所有排列",[series("mass","全部类型质量",B,r.rows.flatMap(z=>z.mass.value===null?[]:[[z.k,z.mass.value]])),series("typical","带内类型质量",G,typ.flatMap(z=>z.mass.value===null?[]:[[z.k,z.mass.value]]),false)],n),
  chart("每符号自信息与当前中心、带宽","类型k：1的个数","比特 / 符号；不可能类型不画信息点",[series("information","每条序列自信息率",B,r.rows.flatMap(z=>z.information===null?[]:[[z.k,z.information]])),series("center","熵或平均熵率",O,[[0,h],[n,h]]),series("lower","带的下界",G,[[0,h-eps],[n,h-eps]]),series("upper","带的上界",G,[[0,h+eps],[n,h+eps]])],n),
  chart("同一类型：存在多少条，码本收下多少条","类型k：1的个数","log₂条数；一条为0，零条不画点",[series("all","全部排列数",B,r.rows.map(z=>[z.k,logq(rat(BigInt(z.count)))])),series("chosen","最优码本所选条数",O,r.coding.allocation.flatMap(z=>BigInt(z.selected)>0n?[[z.k,logq(rat(BigInt(z.selected)))]]:[]).sort((a,b)=>a[0]-b[0]))],n),
  chart("有限码本实际覆盖的每类概率","类型k：1的个数","概率；按单条概率排序，末类可只收部分",[series("available","该类原有质量",B,r.rows.flatMap(z=>z.mass.value===null?[]:[[z.k,z.mass.value]])),series("selected","码本恢复的质量",O,r.rows.flatMap(z=>{const a=assigned.get(z.k);return a?.selectedMass.value===null?[]:[[z.k,a?a.selectedMass.value:0]];}))],n)
 ];
 if(c.mode==="mixture")out.push(chart("观察类型后，最初选了A的后验概率","类型k：1的个数","P(Z=A | Xⁿ=xⁿ)；不可能类型留空",[series("posterior","后验选择A",V,r.posterior.flatMap(z=>z.posteriorA===null||z.posteriorA.value===null?[]:[[z.k,z.posteriorA.value]])),series("prior","先验选择A",G,[[0,r.weight.value],[n,r.weight.value]])],n));
 return out;
}
const WORDS={numerator:"分子",denominator:"分母",value:"近似值",status:"状态",log2:"log₂",zero:"精确零",underflow:"浮点下溢",finite:"有限",k:"类型k",count:"排列条数",sequenceProbability:"单序列概率",mass:"类型质量",information:"自信息（类型为每符号，路径为整块）",difference:"与中心的差",margin:"带边界余量",nearBoundary:"浮点边界提醒",typical:"是否入带",total:"真实总质量",typicalMass:"入带总质量",atypicalMass:"带外总质量",typicalCount:"入带序列条数",typicalLogCount:"入带基数log₂",typicalBits:"入带字典所需整数比特",empty:"典型集为空",blockEntropy:"整块熵",center:"当前带中心",epsilon:"带宽",p:"P(1)",entropy:"二元熵",variance:"单符号自信息方差",chebyshev:"Chebyshev原始右端",champions:"全部冠军类型",ell:"固定整数码长",capacity:"可用码字数",recovered:"恢复序列数",unused:"未用码字数",support:"正概率序列数",zeroErrorBits:"严格零错误最小码长",covered:"码本覆盖质量",error:"最优块错误率",rank:"概率降序排名",selected:"选中序列数",selectedMass:"选中质量",pA:"分量A的P(1)",pB:"分量B的P(1)",weight:"选择A的先验",componentEntropy:"两个分量熵",entropyRate:"平稳起始的熵率",latentEntropy:"隐变量熵H(Z)",conditionalLatentEntropy:"H(Z|Xⁿ)",mutualInformation:"互信息I(Z;Xⁿ)",entropyIdentity:"n乘平均熵率加互信息",entropyIdentityGap:"块熵恒等式浮点差",jointA:"A权重乘单序列似然",jointB:"B权重乘单序列似然",posteriorA:"选择A的后验",posteriorEntropy:"当前后验二元熵",Q:"真实行随机转移",modelQ:"模型行随机转移",initial:"真实初始分布",modelInitial:"模型初始分布",stationary:"唯一平稳分布（若存在）",stationaryActual:"实际初始是否平稳",irreducible:"真实链不可约",period:"不可约真实链的周期",rowEntropy:"两行转移熵",index:"路径编号",path:"二元路径",counts:"四种转移计数（行出列入）",probability:"真实路径概率",modelProbability:"模型路径概率",modelInformation:"模型整块自信息",logRatio:"逐路径log₂(P/Q)",possible:"真实路径可能",unsupported:"真实可能但模型为零",empiricalCrossEntropy:"路径模型损失比特/符号",modelTotal:"模型总质量",entropyPerSymbol:"块熵/n",crossEntropy:"期望整块交叉熵",relativeEntropy:"整块KL",infiniteCrossEntropy:"期望交叉熵及KL为正无穷",identityGap:"交叉熵减熵减KL的浮点差",t:"位置t（从0开始）",previousDistribution:"前一时刻真实分布",conditionalEntropy:"本位条件熵",cumulativeEntropy:"累计块熵",chainEntropy:"链式法则块熵",chainGap:"枚举块熵减链式块熵"};
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(r=>keys.map(k=>r[k]))};}
function ledgers(d){
 const r=d.result,excluded=new Set(["rows","coding","posterior","chain"]),summary=Object.entries(r).filter(([k])=>!excluded.has(k)).map(([k,v])=>[WORDS[k]||k,v]);
 const out=[{key:"summary",title:"汇总与适用条件",headers:["量","实际结果；精确分数和近似值分列于同格"],rows:summary},recordTable("rows",d.parameters.mode==="markov"?"全部路径与四种转移计数":"全部类型与带边界",r.rows)];
 if(r.coding){out.push({key:"coding",title:"有限最优码本汇总",headers:["量","实际结果"],rows:Object.entries(r.coding).filter(([k])=>k!=="allocation").map(([k,v])=>[WORDS[k]||k,v])},recordTable("allocation","全部正概率类型的码字分配",r.coding.allocation));}
 if(r.posterior)out.push(recordTable("posterior","所有类型的隐变量后验",r.posterior));
 if(r.chain)out.push(recordTable("chain","每一步实际分布与链式条件熵",r.chain));
 return out;
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

 const STYLE=".aep149{color:var(--fg,#273646)}.aep149 .aep-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.aep149 label{display:flex;flex-direction:column;gap:6px}.aep149 input,.aep149 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.aep149 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.aep149 button[aria-pressed=true]{outline:3px solid #478aaa}.aep149 .aep-scroll{overflow:auto;max-width:100%;margin:16px 0}.aep149 .aep-scroll:focus{outline:3px solid #478aaa}.aep149 .aep-ledger{max-height:420px}.aep149 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.aep149 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.aep149 th,.aep149 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.aep149 .aep-error{color:#c74b39}.aep149 [hidden]{display:none!important}.aep149 fieldset{margin:16px 0;padding:12px}.aep149 details{margin:16px 0}.aep149 summary{cursor:pointer;font-weight:600}.aep149 .aep-legend{font-size:.95em}.aep149 .aep-note{line-height:1.7}.aep149 [hidden]{display:none!important}.aep149 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.aep149 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.aep149 .aep-controls{min-width:0}.aep149 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("aep149-style")){const style=doc.createElement("style");style.id="aep149-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="text" inputmode="decimal"></label>';
  container.innerHTML='<div class="aep149"><h3>先数清有限序列，再使用渐近结论</h3><p>用精确十进制分数核对类型、路径和码本；熵与对数是浮点近似。</p><div class="aep-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="aep-controls"><label>实验<select data-key="mode"><option value="iid">IID类型与有限码本</option><option value="mixture">一次选择的混合信源</option><option value="markov">Markov路径与交叉熵</option></select></label>'+
   field("n","长度n（IID/混合1–256，Markov1–9）","iid mixture markov")+field("p","P(1)（0–1）","iid")+field("epsilon","典型带宽（0–2）","iid mixture")+field("ell","整数码长ell（0–256）","iid mixture")+
   field("pA","分量A的P(1)（0–1）","mixture")+field("pB","分量B的P(1)（0–1）","mixture")+field("weight","开始时选择A的概率（0–1）","mixture")+
   field("a","真实Q01（0–1）","markov")+field("b","真实Q10（0–1）","markov")+
   '<label data-modes="markov">真实初始规则<select data-key="start"><option value="stationary">唯一平稳分布；双吸收态用指定值</option><option value="chosen">使用指定初始分布</option></select></label>'+
   field("initial","指定初始P(1)（0–1）","markov")+field("modelA","候选模型Q01（0–1）","markov")+field("modelB","候选模型Q10（0–1）","markov")+field("modelInitial","候选模型初始P(1)（0–1）","markov")+'</div><p>概率按最多六位小数的精确十进制解释，不接受指数记法。切换实验可先用对应预设装入适用长度；保留的非法输入会明确报错。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="aep-error" role="alert"></p><p role="status"></p><div class="aep-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".aep-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={iid:"完整列出n+1个类型。典型带按浮点对数差判定，再用精确分数汇总已选集合。最优固定码本允许不可检测块错误，容量是2^ell；按单条概率排序，最后一类可只取部分。冠军并列全部保留。",mixture:"隐变量在开始时只抽一次。全部类型共享一次选择，因此不是每一步重新混合的IID信源。图中的中心是平均熵率，不保证路径集中在它附近；后验和互信息解释一次未知选择的有限信息成本。",markov:"使用行随机转移Q_ij=P(下一位j|当前i)，枚举全部2^n路径。第一位和后续条件熵分别计算；非平稳起始时不套平稳块熵公式。模型漏掉正概率路径时，期望交叉熵和KL明确为正无穷。"};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="aep-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="aep-scroll aep-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”配合状态字段表示不适用、概率为零时的无限自信息或浮点下溢，不是数值0。精确分数与log₂仍可核对极小概率。图线连接离散点只作读图辅助；相同曲线会重合。每个表保留该类结果的全部字段，宽表与图可键盘横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"有限码本、渐近概率和过程条件分别核对。":"";
  }
  fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.closest("[data-question]").dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
  }));
  container.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{
   const s=Object.assign({},DEFAULTS,PRESETS.find(p=>p.id===b.dataset.preset).values);fields.forEach(e=>e.value=s[e.dataset.key]);update();
  }));
  reveal.addEventListener("click",()=>{if(!reveal.disabled){revealed=true;update();}});
  container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
  update();
 }
















function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};
 let r=snapshot().result;ck(r.rows.length===101&&r.rows.filter(z=>z.typical).map(z=>z.k).join(",")==="87,88,89,90,91,92,93","finite band");
 ck(Math.abs(r.coding.covered.value-.6858439149436099)<1e-14,"finite codebook");
 r=snapshot({p:"0.5",epsilon:"0"}).result;ck(r.typicalMass.numerator==="1"&&r.typicalCount===String(1n<<100n),"fair full");
 r=snapshot({p:"0",epsilon:"0",ell:0}).result;ck(r.typicalCount==="1"&&r.coding.error.numerator==="0","deterministic");
 r=snapshot({n:2,p:"0.75",epsilon:"0.1",ell:1}).result;ck(r.empty&&r.typicalLogCount===null&&r.coding.covered.value===.75,"empty and code");
 r=snapshot({mode:"markov",n:8,a:"1",b:"1"}).result;ck(r.entropyRate===0&&r.blockEntropy===1&&r.period===2,"periodic");
 r=snapshot({mode:"markov",n:8,modelA:"0"}).result;ck(r.infiniteCrossEntropy&&r.crossEntropy===null,"model support gap");
 r=snapshot({mode:"markov",n:1}).result;ck(r.rows.length===2&&r.chain.length===1&&r.rows.every(z=>z.counts.flat().every(v=>v===0)),"n1");
 r=snapshot({mode:"mixture",pA:"0.5",pB:"0.5",epsilon:"0"}).result;ck(r.typicalMass.value===1&&Math.abs(r.mutualInformation)<1e-12,"same source");
 r=snapshot({mode:"mixture",pA:"0",pB:"1"}).result;ck(r.entropyRate===0&&r.blockEntropy===1,"two constants");
 r=snapshot({n:256,p:"0.000001"}).result;ck(r.rows[256].sequenceProbability.status==="underflow"&&r.rows[256].sequenceProbability.log2< -1000,"underflow retained");
 ck(fmt(1e-15)!=="0"&&fmt(0)==="0","small values");return{status:"PASS",checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,decimal,rat,pack,approx,logq,entropy,binom,codebook,iid,mixture,markov,fmt,plots,ledgers,svg,mount,selfTest};
});
