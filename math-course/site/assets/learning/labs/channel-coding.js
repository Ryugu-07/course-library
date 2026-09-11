(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("channel-coding",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
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
function pack(q){const x=approx(q);return {numerator:String(q.n),denominator:String(q.d),value:!Number.isFinite(x)||(q.n!==0n&&x===0)?null:x,status:q.n===0n?"zero":!Number.isFinite(x)?"overflow":x===0?"underflow":"finite",log2:q.n>0n?logq(q):null};}
function sum(values){let s=0,c=0;for(const x of values){const y=x-c,t=s+y;c=(t-s)-y;s=t;}return s;}
function entropy(p){return sum([p,complement(p)].filter(x=>x.n>0n).map(x=>-approx(x)*logq(x)));}
function binom(n,k){let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;}
function bits(count){if(count===0n)return null;return count===1n?0:(count-1n).toString(2).length;}

function capacity(p){const u=approx(sub(ONE,mul(rat(2n),p)));return Math.abs(u)>.5?1-entropy(p):u===0?0:(.5*Math.log1p(-u*u)+u*Math.atanh(u))/Math.LN2;}
function distributionEntropy(ps){return sum(ps.filter(p=>p.n>0n).map(p=>-approx(p)*logq(p)));}
const word=(v,n)=>v.toString(2).padStart(n,"0"),distance=(a,b)=>Array.from(a).reduce((s,x,i)=>s+(x!==b[i]?1:0),0);
function likelihood(n,k,p){return mul(pow(p,k),pow(complement(p),n-k));}
function repetition(n,p){if(n===0)return rat(1n,2n);let e=ZERO;for(let k=Math.floor(n/2)+1;k<=n;k++)e=add(e,mul(rat(binom(n,k)),likelihood(n,k,p)));if(n%2===0)e=add(e,mul(rat(binom(n,n/2),2n),likelihood(n,n/2,p)));return e;}
function finite(c){
 const codewords=c.codewords,n=codewords[0].length,M=codewords.length,p=decimal(c.p,"翻转概率"),prior=rat(1n,BigInt(M));
 const confusion=Array.from({length:M},()=>Array(M).fill(ZERO)),byWeight=Array.from({length:n+1},(_,k)=>({k,mass:ZERO,error:ZERO})),received=[];let conditionalEntropy=0;
 for(let index=0;index<2**n;index++){
  const y=word(index,n),distances=codewords.map(x=>distance(x,y)),ls=distances.map(k=>likelihood(n,k,p));let winners;
  if(c.decoder==="first")winners=[0];
  else if(c.decoder==="nearest"){const best=Math.min(...distances);winners=distances.flatMap((v,i)=>v===best?[i]:[]);}
  else {const best=ls.reduce((s,x)=>cmp(x,s)>0n?x:s,ZERO);winners=ls.flatMap((v,i)=>cmp(v,best)===0n?[i]:[]);}
  const chosen=c.tie==="first"?[winners[0]]:winners,decisions=Array.from({length:M},(_,i)=>chosen.includes(i)?rat(1n,BigInt(chosen.length)):ZERO);
  const L=ls.reduce(add,ZERO),py=mul(prior,L),posterior=L.n>0n?ls.map(x=>div(x,L)):null,H=posterior?distributionEntropy(posterior):null;
  if(H!==null)conditionalEntropy+=approx(py)*H;
  let correct=ZERO,error=ZERO;
  for(let i=0;i<M;i++){
   const joint=mul(prior,ls[i]),err=mul(joint,complement(decisions[i]));correct=add(correct,mul(joint,decisions[i]));error=add(error,err);
   byWeight[distances[i]].mass=add(byWeight[distances[i]].mass,joint);byWeight[distances[i]].error=add(byWeight[distances[i]].error,err);
   for(let j=0;j<M;j++)confusion[i][j]=add(confusion[i][j],mul(ls[i],decisions[j]));
  }
  received.push({index,word:y,distances,likelihoods:ls.map(pack),winners,chosen,decisions:decisions.map(pack),outputProbability:pack(py),posterior:posterior?posterior.map(pack):null,posteriorEntropy:H,jointCorrect:pack(correct),jointError:pack(error)});
 }
 const perMessage=confusion.map((row,i)=>{const error=row.reduce((s,x,j)=>i===j?s:add(s,x),ZERO);return {message:i,codeword:codewords[i],success:pack(row[i]),error:pack(error),total:pack(row.reduce(add,ZERO))};});
 const errors=perMessage.map(z=>rat(BigInt(z.error.numerator),BigInt(z.error.denominator))),average=mul(prior,errors.reduce(add,ZERO)),maximum=errors.reduce((s,x)=>cmp(x,s)>0n?x:s,ZERO),logM=Math.log2(M),C=capacity(p),isPowerOfTwo=(M&(M-1))===0;
 let bitError=null;if(isPowerOfTwo&&M>1){let e=ZERO;for(let i=0;i<M;i++)for(let j=0;j<M;j++)e=add(e,mul(confusion[i][j],rat(BigInt(distance(word(i,logM),word(j,logM))),BigInt(M*logM))));bitError=pack(e);}
 const pairDistances=codewords.map(x=>codewords.map(y=>distance(x,y))),distinct=new Set(codewords).size,minDistance=M>1?Math.min(...pairDistances.flatMap((row,i)=>row.filter((_,j)=>j!==i))):null;
 const oppositeRepetition=M===2&&((codewords[0]==="0".repeat(n)&&codewords[1]==="1".repeat(n))||(codewords[1]==="0".repeat(n)&&codewords[0]==="1".repeat(n)));
 let repetitionReference=null;if(oppositeRepetition&&c.decoder!=="first")repetitionReference=pack(repetition(n,c.decoder==="nearest"?p:cmp(p,rat(1n,2n))>0n?complement(p):p));
 const mutualInformation=logM-conditionalEntropy;
 return {n,M,codewords,p:pack(p),decoder:c.decoder,tie:c.tie,distinct,pairDistances,minDistance,rate:logM/n,capacity:C,received,perMessage,confusion:confusion.map(row=>row.map(pack)),byWeight:byWeight.map(z=>({k:z.k,mass:pack(z.mass),error:pack(z.error)})),averageError:pack(average),maximumError:pack(maximum),bitError,conditionalEntropy,mutualInformation,fanoUsingActualInformation:M>1?(logM-mutualInformation-1)/logM:null,fanoUsingCapacity:M>1?(logM-n*C-1)/logM:null,repetitionReference};
}

function exp2Record(log2Value){const value=2**log2Value;return {log2Value,value:Number.isFinite(value)&&value!==0?value:null,status:!Number.isFinite(value)?"overflow":value===0?"underflow":"finite"};}
function packing(c){
 const n=c.n,p=decimal(c.p,"翻转概率"),q=complement(p),H=entropy(p),C=capacity(p),epsilon=Number(c.epsilon),M=1n<<BigInt(c.bits),lr=p.n>0n&&q.n>0n?logq(div(q,p)):0;
 let trueAccepted=ZERO,falseAccepted=ZERO,maxRatio=null,totalTrue=ZERO,totalFalse=ZERO,count=0n;
 const rows=Array.from({length:n+1},(_,k)=>{
  const size=binom(n,k),single=likelihood(n,k,p),tp=mul(rat(size),single),fp=rat(size,1n<<BigInt(n));totalTrue=add(totalTrue,tp);totalFalse=add(totalFalse,fp);
  const possible=single.n>0n,z=possible?-logq(single)/n:null,difference=possible?(p.n===0n||q.n===0n?0:approx(sub(rat(BigInt(k),BigInt(n)),p))*lr):null,margin=possible?epsilon-Math.abs(difference):null,accepted=possible&&margin>=0;
  const ratio=possible?div(rat(1n,1n<<BigInt(n)),single):null;
  if(accepted){trueAccepted=add(trueAccepted,tp);falseAccepted=add(falseAccepted,fp);count+=size;if(maxRatio===null||cmp(ratio,maxRatio)>0n)maxRatio=ratio;}
  return {k,count:String(size),singleLikelihood:pack(single),trueMass:pack(tp),falseMass:pack(fp),noiseInformation:z,jointInformation:z===null?null:1+z,informationDensity:z===null?null:n*(1-z),difference,margin,nearBoundary:possible&&Math.abs(margin)<=64*Number.EPSILON*(1+(z===null?0:Math.abs(z))+H+epsilon),accepted,independentToJointRatio:ratio?pack(ratio):null};
 });
 const tail=complement(trueAccepted),falseTerm=mul(rat(M-1n),falseAccepted),raw=add(tail,falseTerm),capped=cmp(raw,ONE)>0n?ONE:raw,packingUpper=maxRatio===null?ZERO:mul(trueAccepted,maxRatio);
 const generalLog=n*(3*epsilon-C)+(M>1n?logq(rat(M-1n)):0),bscLog=n*(epsilon-C)+(M>1n?logq(rat(M-1n)):0);
 return {n,p:pack(p),epsilon,M:String(M),bits:c.bits,rate:c.bits/n,entropy:H,capacity:C,rows,totalTrue:pack(totalTrue),totalFalse:pack(totalFalse),acceptedDistanceStrings:String(count),trueAccepted:pack(trueAccepted),trueTail:pack(tail),falseAccepted:pack(falseAccepted),falseTerm:pack(falseTerm),rawUnion:pack(raw),cappedUnion:pack(capped),maximumProbabilityRatio:maxRatio?pack(maxRatio):null,exactPackingUpper:pack(packingUpper),generalExponentTerm:M===1n?null:exp2Record(generalLog),uniformBscExponentTerm:M===1n?null:exp2Record(bscLog),generalExponentGap:C-c.bits/n-3*epsilon,uniformBscExponentGap:C-c.bits/n-epsilon};
}

function ensemble(c){
 const n=c.n,p=decimal(c.p,"翻转概率"),input=decimal(c.inputProbability,"随机码字位P(1)"),words=Array.from({length:2**n},(_,i)=>word(i,n)),ps=words.map(w=>{const k=Array.from(w).filter(x=>x==="1").length;return mul(pow(input,k),pow(complement(input),n-k));}),effective=cmp(p,rat(1n,2n))>0n?complement(p):p;
 const rows=[],groups=Array.from({length:n+1},(_,k)=>({distance:k,codebookCount:0,probability:ZERO,weightedError:ZERO,reference:repetition(k,effective)}));let total=ZERO,average=ZERO,collision=ZERO,best=null,worst=null,supportCount=0;
 for(let i=0;i<words.length;i++)for(let j=0;j<words.length;j++){
  const probability=mul(ps[i],ps[j]),d=distance(words[i],words[j]);
  // Independently enumerate each possible output for the two-message ML problem.
  let error=ZERO;const outputRows=[];
  for(const y of words){const l0=likelihood(n,distance(words[i],y),p),l1=likelihood(n,distance(words[j],y),p),minimum=cmp(l0,l1)<=0n?l0:l1;error=add(error,mul(rat(1n,2n),minimum));outputRows.push({word:y,likelihood0:pack(l0),likelihood1:pack(l1),jointError:pack(mul(rat(1n,2n),minimum))});}
  const weighted=mul(probability,error);total=add(total,probability);average=add(average,weighted);if(i===j)collision=add(collision,probability);
  if(probability.n>0n){supportCount++;if(best===null||cmp(error,best)<0n)best=error;if(worst===null||cmp(error,worst)>0n)worst=error;}
  groups[d].codebookCount++;groups[d].probability=add(groups[d].probability,probability);groups[d].weightedError=add(groups[d].weightedError,weighted);
  rows.push({index:rows.length,first:words[i],second:words[j],distance:d,collision:i===j,probability:pack(probability),error:pack(error),weightedError:pack(weighted),outputs:outputRows});
 }
 const mismatch=mul(rat(2n),mul(input,complement(input))),byDistance=groups.map(z=>({distance:z.distance,codebookCount:z.codebookCount,probability:pack(z.probability),weightedError:pack(z.weightedError),referenceError:pack(z.reference),binomialProbability:pack(mul(rat(binom(n,z.distance)),likelihood(n,z.distance,mismatch)))}));
 const distanceAverage=groups.reduce((s,z)=>add(s,mul(z.probability,z.reference)),ZERO);
 return {n,p:pack(p),inputProbability:pack(input),M:2,rate:1/n,capacity:capacity(p),rows,byDistance,total:pack(total),averageError:pack(average),distanceAverage:pack(distanceAverage),collisionProbability:pack(collision),collisionFormula:pack(pow(add(pow(input,2),pow(complement(input),2)),n)),bestSupportedError:pack(best),worstSupportedError:pack(worst),supportCount};
}

const DEFAULTS={mode:"finite",p:"0.1",codebook:"000,111",decoder:"ml",tie:"uniform",inspect:0,n:100,bits:40,epsilon:"0.05",inputProbability:"0.5"};
function config(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("配置须为对象");const c={...DEFAULTS,...input};if(!["finite","packing","ensemble"].includes(c.mode))throw Error("未知实验");decimal(c.p,"翻转概率");
 if(c.mode==="finite"){
  if(typeof c.codebook!=="string"||c.codebook.length>256||!/^\s*[01]+(?:\s*,\s*[01]+|\s+[01]+)*\s*$/.test(c.codebook))throw Error("码本须为以逗号或空格分隔的二元词");
  c.codewords=c.codebook.trim().split(/[\s,]+/);const n=c.codewords[0].length;
  if(n<1||n>7||c.codewords.length>16||!c.codewords.every(w=>w.length===n))throw Error("每个码字须等长1–7位，消息数1–16；允许相同码字对应不同消息");
  if(!["ml","nearest","first"].includes(c.decoder))throw Error("未知译码器");if(!["uniform","first"].includes(c.tie))throw Error("未知平局规则");
  c.inspect=integer(c.inspect,"观察消息编号",0,c.codewords.length-1);c.n=n;
 }else{
  c.n=integer(c.n,"长度n",1,c.mode==="packing"?512:4);
  if(c.mode==="packing"){c.bits=integer(c.bits,"消息比特数",0,512);decimal(c.epsilon,"带宽",0,2);}
  else decimal(c.inputProbability,"随机码字位P(1)");
 }
 return c;
}
function snapshot(input={}){const c=config(input);return {parameters:c,result:c.mode==="finite"?finite(c):c.mode==="packing"?packing(c):ensemble(c)};}

const HAMMING=Array.from({length:16},(_,v)=>{const d=word(v,4).split('').map(Number),[a,b,c,e]=d;return [a^b^e,a^c^e,a,b^c^e,b,c,e].join('');}).join(',');
const PRESETS=[
 ['repeat','三位重复码',{codebook:'000,111'}],['even','四位均匀平局',{codebook:'0000,1111'}],['first-tie','四位优先标签0',{codebook:'0000,1111',tie:'first'}],
 ['reverse','翻转0.9：ML',{p:'0.9'}],['wrong-nearest','翻转0.9：最近邻',{p:'0.9',decoder:'nearest'}],['bad-decoder','总猜标签0',{decoder:'first'}],
 ['noiseless','完全无噪声',{p:'0'}],['inverted','确定性翻转',{p:'1'}],['fair','完全丢失信息',{p:'0.5'}],['duplicate','重复词仍是两个消息',{codebook:'000,000'}],
 ['single','只有一个消息',{codebook:'000'}],['three','非二次幂消息数',{codebook:'000,011,111'}],['full','两位完整码本',{codebook:'00,01,10,11'}],['hamming','Hamming(7,4)',{codebook:HAMMING}],
 ['near-half','容量接近零',{p:'0.499999'}],['tiny','微小误码保留',{codebook:'0000000,1111111',p:'0.000001'}],
 ['packing','有限真假配对',{mode:'packing'}],['tail','500位窄带：大尾项',{mode:'packing',n:500,bits:200,epsilon:'0.02'}],['exercise','三位典型译码例题',{mode:'packing',n:3,bits:1,epsilon:'0.5'}],
 ['empty','空接受带',{mode:'packing',n:2,p:'0.1',epsilon:'0',bits:1}],['fair-band','公平信道零带宽',{mode:'packing',n:20,p:'0.5',epsilon:'0',bits:3}],['endpoint','无噪声真假配对',{mode:'packing',n:8,p:'0',epsilon:'0',bits:2}],
 ['no-competitor','没有假消息',{mode:'packing',n:10,bits:0}],['large-bound','原始上界大于1',{mode:'packing',n:8,bits:12,epsilon:'2'}],['underflow','极小类型概率',{mode:'packing',n:128,p:'0.000001',bits:2}],
 ['ensemble','全部随机码本',{mode:'ensemble',n:3}],['collisions','无噪声也会碰撞',{mode:'ensemble',n:3,p:'0'}],['degenerate','只生成全零词',{mode:'ensemble',n:3,inputProbability:'0'}],['biased-ensemble','偏置随机造码',{mode:'ensemble',n:3,inputProbability:'0.1'}],['four-ensemble','四位256个有序码本',{mode:'ensemble',n:4}]
].map(([id,label,values])=>({id,label,values}));
const QUESTIONS=[
 ['低于容量，总猜标签0会自动可靠吗？',['不会，译码器仍然重要','会，只看码率即可'],0],
 ['并集界要求错误事件相互独立吗？',['不要求','要求全部独立'],0],
 ['重复码从三位加到四位，平均错误一定严格下降吗？',['不一定，平局可使两者相同','一定下降'],0],
 ['假配对指数很小，能代替真配对尾项吗？',['不能，尾项须另算','可以忽略尾项'],0]
];

function fmt(x){if(x===null||x===undefined)return'—';if(typeof x==='boolean')return x?'是':'否';if(typeof x==='number'){if(!Number.isFinite(x))throw Error('未标记非有限值');if(x===0)return'0';return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));}if(typeof x==='object')return Array.isArray(x)?'['+x.map(fmt).join('；')+']':Object.entries(x).map(([k,v])=>(WORDS[k]||k)+'='+fmt(v)).join('；');return WORDS[String(x)]||String(x);}
const B='#268bd2',O='#cb6a16',G='#29966c',V='#9966bb',R='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,xmax){const v=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...v),hi=Math.max(0,...v),pad=(hi-lo||1)*.08;return{title,x,y,series:ss,xmin:0,xmax:Math.max(1,xmax),ymin:lo-pad,ymax:hi+pad,square:false,markers:[],xTicks:[...new Set(Array.from({length:5},(_,i)=>Math.round(Math.max(1,xmax)*i/4)))]};}
const points=(rows,x,y)=>rows.flatMap(z=>{const v=y(z);return v===null?[]:[[x(z),v]];});
function plots(d){const c=d.parameters,r=d.result,n=c.n;
 if(c.mode==='finite'){const i=c.inspect;return[
  chart('逐消息：平均相同不代表保护相同','发送消息标签','条件错误概率；平均与最大值是水平线',[series('errors','逐消息错误',B,r.perMessage.map(z=>[z.message,z.error.value])),series('average','平均块错误',O,[[0,r.averageError.value],[r.M-1,r.averageError.value]]),series('maximum','最大消息错误',R,[[0,r.maximumError.value],[r.M-1,r.maximumError.value]])],r.M-1),
  chart('完整接收词：似然与实际错误贡献','接收词的二进制整数编号','选中消息 '+i+'；似然条件于该消息',[series('likelihood','条件似然',B,points(r.received,z=>z.index,z=>z.likelihoods[i].value)),series('wrong','条件错误贡献',O,points(r.received,z=>z.index,z=>{const l=z.likelihoods[i],a=z.decisions[i];return approx(mul(rat(BigInt(l.numerator),BigInt(l.denominator)),complement(rat(BigInt(a.numerator),BigInt(a.denominator)))));})),series('decision','输出该标签的概率',G,points(r.received,z=>z.index,z=>z.decisions[i].value))],2**n-1),
  chart('混淆矩阵的一整行','译码输出标签','给定发送消息 '+i+' 的条件概率',[series('confusion','实际输出概率',V,r.confusion[i].map((z,j)=>[j,z.value]))],r.M-1),
  chart('所有翻转数的质量与块错误贡献','实际翻转位数','按均匀消息加权，所有接收词均计入',[series('noise','翻转数质量',B,r.byWeight.map(z=>[z.k,z.mass.value])),series('error','该翻转数错误贡献',O,r.byWeight.map(z=>[z.k,z.error.value]))],n)
 ];}
 if(c.mode==='packing')return[
  chart('同一个距离，两种不同的概率分布','Hamming距离d','类型概率；绿点表示当前接受距离',[series('true','真实配对',B,points(r.rows,z=>z.k,z=>z.trueMass.value)),series('false','独立假配对',O,points(r.rows,z=>z.k,z=>z.falseMass.value)),series('accepted','接受的真实质量',G,points(r.rows.filter(z=>z.accepted),z=>z.k,z=>z.trueMass.value),false)],n),
  chart('噪声自信息与接受带','Hamming距离d','比特/次使用；不可能类型没有信息点',[series('information','自信息率',B,points(r.rows,z=>z.k,z=>z.noiseInformation)),series('entropy','二元熵',O,[[0,r.entropy],[n,r.entropy]]),series('lower','带下界',G,[[0,r.entropy-r.epsilon],[n,r.entropy-r.epsilon]]),series('upper','带上界',G,[[0,r.entropy+r.epsilon],[n,r.entropy+r.epsilon]])],n),
  chart('极小质量保留真实对数','Hamming距离d','log₂类型概率；精确零不画点',[series('logTrue','真实质量log₂',B,points(r.rows,z=>z.k,z=>z.trueMass.log2)),series('logFalse','假配对质量log₂',O,points(r.rows,z=>z.k,z=>z.falseMass.log2))],n),
  chart('有限上界逐项记账','0真尾项 / 1假项 / 2原始和 / 3截到1','实际分数的近似值；原始和可大于1',[series('terms','有限概率账本',V,[r.trueTail,r.falseTerm,r.rawUnion,r.cappedUnion].flatMap((z,i)=>z.value===null?[]:[[i,z.value]]),false)],3)
 ];
 return[
  chart('每个有序码本的实际ML错误','有序码本编号','块错误概率；零生成概率成员也列出',[series('errors','逐码本错误',B,r.rows.map(z=>[z.index,z.error.value])),series('average','按生成概率加权平均',O,[[0,r.averageError.value],[r.rows.length-1,r.averageError.value]])],r.rows.length-1),
  chart('码本怎样生成，怎样贡献平均错误','有序码本编号','概率；不能对偏置码本做简单算术平均',[series('probability','码本生成概率',B,r.rows.map(z=>[z.index,z.probability.value])),series('weighted','加权错误贡献',O,r.rows.map(z=>[z.index,z.weightedError.value]))],r.rows.length-1),
  chart('按距离归组的独立核对','两码字的距离d','概率；枚举质量与二项公式应重合',[series('distance','枚举距离质量',B,r.byDistance.map(z=>[z.distance,z.probability.value])),series('binomial','二项公式',G,r.byDistance.map(z=>[z.distance,z.binomialProbability.value])),series('error','该距离错误贡献',O,r.byDistance.map(z=>[z.distance,z.weightedError.value]))],n),
  chart('只有不同的位置帮助区分两个消息','两码字的距离d','ML块错误；距离0意味着标签碰撞',[series('reference','重复判别公式',V,r.byDistance.map(z=>[z.distance,z.referenceError.value]))],n)
 ];
}
const WORDS={numerator:'分子',denominator:'分母',value:'近似值',status:'状态',log2:'log₂',log2Value:'以2为底的指数',zero:'精确零',underflow:'浮点下溢',overflow:'浮点上溢',finite:'有限',n:'长度n',M:'消息数M',codewords:'按标签排序的码字',p:'信道翻转概率',decoder:'译码器',tie:'平局规则',ml:'最大似然',nearest:'最近邻',first:'优先标签0或并列首标签',uniform:'均匀平局',distinct:'不同码字数',minDistance:'最小码字距离',rate:'码率：比特/次',capacity:'BSC容量：比特/次',message:'发送消息标签',codeword:'发送码字',success:'条件成功率',error:'错误率或错误贡献',total:'总概率',averageError:'平均块错误',maximumError:'最大消息错误',bitError:'标签平均比特错误',conditionalEntropy:'条件熵H(J|Yⁿ)',mutualInformation:'互信息I(J;Yⁿ)',fanoUsingActualInformation:'实际互信息Fano原始下界',fanoUsingCapacity:'容量Fano原始下界',repetitionReference:'重复码公式核对',index:'编号',word:'接收词',distances:'与每个码字的距离',likelihoods:'每个消息的条件似然',winners:'并列赢家标签',chosen:'实际可能输出的标签',decisions:'每个输出标签的概率',outputProbability:'均匀消息下接收词概率',posterior:'全部消息后验',posteriorEntropy:'当前后验熵',jointCorrect:'该输出的联合正确质量',jointError:'该输出的联合错误质量',k:'翻转位数',mass:'类型质量',epsilon:'典型带宽',bits:'整数消息比特数',entropy:'二元熵',count:'该距离词数',singleLikelihood:'单一噪声词似然',trueMass:'真实距离质量',falseMass:'假配对距离质量',noiseInformation:'每位噪声自信息',jointInformation:'每位联合自信息',informationDensity:'整块信息密度',difference:'自信息率减熵',margin:'接受带边界余量',nearBoundary:'浮点边界提醒',accepted:'是否接受',independentToJointRatio:'独立与联合概率比',totalTrue:'真实类型总质量',totalFalse:'假配对类型总质量',acceptedDistanceStrings:'接受的噪声词数',trueAccepted:'真配对接受率',trueTail:'真配对尾概率',falseAccepted:'一个假配对接受率',falseTerm:'所有假消息并集项',rawUnion:'有限并集原始和',cappedUnion:'有限并集上界截到1',maximumProbabilityRatio:'接受集合最大概率比',exactPackingUpper:'已选集合精确假接受上界',generalExponentTerm:'一般三带宽假项指数诊断',uniformBscExponentTerm:'均匀BSC单带宽假项指数诊断',generalExponentGap:'C减码率减三倍带宽',uniformBscExponentGap:'C减码率减带宽',inputProbability:'随机码字每位P(1)',distance:'两码字距离',collision:'两个标签码字重合',probability:'码本生成概率',weightedError:'加权错误贡献',outputs:'该码本全部接收词',likelihood0:'消息0条件似然',likelihood1:'消息1条件似然',codebookCount:'此距离的有序码本数',referenceError:'长度d重复判别错误',binomialProbability:'二项距离公式概率',distanceAverage:'按距离公式的平均错误',collisionProbability:'枚举码字碰撞概率',collisionFormula:'碰撞概率公式',bestSupportedError:'正生成概率码本最小错误',worstSupportedError:'正生成概率码本最大错误',supportCount:'有正生成概率码本数'};
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(r=>keys.map(k=>r[k]))};}
function ledgers(d){const r=d.result,excluded=new Set(['received','perMessage','confusion','pairDistances','byWeight','rows','byDistance']),out=[{key:'summary',title:'汇总、单位与边界',headers:['量','实际结果；分数与近似值均保留'],rows:Object.entries(r).filter(([k])=>!excluded.has(k)).map(([k,v])=>[WORDS[k]||k,v])}];
 if(d.parameters.mode==='finite')out.push(recordTable('perMessage','全部逐消息错误',r.perMessage),recordTable('received','全部接收词、似然、平局和后验',r.received),{key:'confusion',title:'完整混淆矩阵：行发送、列输出',headers:['发送标签',...r.codewords.map((_,i)=>'输出'+i)],rows:r.confusion.map((z,i)=>[i,...z])},{key:'pairDistances',title:'完整码字距离矩阵',headers:['消息标签',...r.codewords.map((_,i)=>'标签'+i)],rows:r.pairDistances.map((z,i)=>[i,...z])},recordTable('byWeight','全部翻转数与错误贡献',r.byWeight));
 else if(d.parameters.mode==='packing')out.push(recordTable('rows','全部距离类型与选带记录',r.rows));
 else out.push(recordTable('rows','全部有序码本及各自完整接收记录',r.rows),recordTable('byDistance','所有距离的枚举与公式核对',r.byDistance));
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

 const STYLE=".channel150{color:var(--fg,#273646)}.channel150 .channel-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.channel150 label{display:flex;flex-direction:column;gap:6px}.channel150 input,.channel150 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.channel150 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.channel150 button[aria-pressed=true]{outline:3px solid #478aaa}.channel150 .channel-scroll{overflow:auto;max-width:100%;margin:16px 0}.channel150 .channel-scroll:focus{outline:3px solid #478aaa}.channel150 .channel-ledger{max-height:420px}.channel150 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.channel150 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.channel150 th,.channel150 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.channel150 .channel-error{color:#c74b39}.channel150 [hidden]{display:none!important}.channel150 fieldset{margin:16px 0;padding:12px}.channel150 details{margin:16px 0}.channel150 summary{cursor:pointer;font-weight:600}.channel150 .channel-legend{font-size:.95em}.channel150 .channel-note{line-height:1.7}.channel150 [hidden]{display:none!important}.channel150 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.channel150 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.channel150 .channel-controls{min-width:0}.channel150 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("channel150-style")){const style=doc.createElement("style");style.id="channel150-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="text" inputmode="decimal"></label>';
  container.innerHTML='<div class="channel150"><h3>先定义码与译码器，再计算每一项错误</h3><p>精确枚举短码和有理数概率；熵与典型带的对数为浮点近似。</p><div class="channel-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="channel-controls"><label>实验<select data-key="mode"><option value="finite">有限码本与完整译码</option><option value="packing">真假配对与有限并集界</option><option value="ensemble">枚举两个随机码字</option></select></label>'+
   field("p","信道翻转概率（0–1）","finite packing ensemble")+
   '<label data-modes="finite">码本：逗号分隔等长二元词（1–7位，1–16消息）<input data-key="codebook" type="text"></label>'+
   '<label data-modes="finite">译码器<select data-key="decoder"><option value="ml">最大似然（自动适应信道）</option><option value="nearest">最近邻（按最小距离）</option><option value="first">总猜标签0</option></select></label>'+
   '<label data-modes="finite">平局规则<select data-key="tie"><option value="uniform">并列赢家均分</option><option value="first">并列首标签优先</option></select></label>'+
   field("inspect","图中观察的发送标签（从0开始）","finite")+field("n","长度n（真假配对1–512，随机码本1–4）","packing ensemble")+field("bits","整数消息比特数（0–512）","packing")+field("epsilon","典型带宽（0–2）","packing")+field("inputProbability","随机码字每位P(1)（0–1）","ensemble")+'</div><p>概率按最多六位小数精确解释，不接受指数记法。可用预设装入对应长度；非法输入原样保留并提示。重复码字仍保留各自消息标签。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="channel-error" role="alert"></p><p role="status"></p><div class="channel-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".channel-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={finite:"消息均匀。全部2^n接收词、每个条件似然和译码平局都计入混淆矩阵；误码直接累加。图中观察标签只改变视图，完整账本保留所有消息。ML在p大于1/2时自动偏好更远的码字。",packing:"全部n+1个距离类型均列出。真实配对与独立假配对按不同分布计量。典型带由浮点对数判定；已选集合的概率与最大比值上界由精确分数核对。指数只诊断假消息项，不能替代真尾项；M=1无假消息，指数记为不适用。",ensemble:"枚举两个码字的全部有序组合及每个接收词，用生成概率加权。重复词不去重，零生成概率成员仍列出；最好与最坏只在正生成概率支持中统计。距离分组提供第二条独立公式。"};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="channel-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="channel-scroll channel-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”配合状态字段表示不适用、不适用的指标、概率为零时的无限自信息或浮点上下溢，不是数值0。精确分数与log₂仍可核对极小概率。图线连接离散点只作读图辅助；相同曲线会重合。每个表保留该类结果的全部字段，宽表与图可键盘横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"实际错误、群体平均与概率上界分别核对。":"";
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
 let r=snapshot().result;ck(r.averageError.value===.028,"repeat3");
 r=snapshot({codebook:"0000,1111",tie:"first"}).result;ck(r.averageError.value===.028&&r.maximumError.value===.0523,"even tie");
 r=snapshot({p:"0.9"}).result;ck(r.averageError.value===.028,"reverse ML");
 r=snapshot({p:"0.9",decoder:"nearest"}).result;ck(r.averageError.value===.972,"wrong nearest");
 r=snapshot({codebook:"000,000",p:"0"}).result;ck(r.averageError.value===.5&&r.minDistance===0,"duplicate messages");
 r=snapshot({codebook:"0"}).result;ck(r.averageError.value===0&&r.bitError===null&&r.minDistance===null,"singleton");
 r=snapshot({p:"0.5"}).result;ck(r.capacity===0&&r.averageError.value===.5,"fair");
 r=snapshot({p:"0.499999"}).result;ck(Math.abs(r.capacity/2.8853900817798487e-12-1)<1e-12,"near-half capacity");
 r=snapshot({mode:"packing",n:3,bits:1,epsilon:"0.5"}).result;ck(r.trueTail.value===.271&&r.falseAccepted.value===.125&&r.rawUnion.value===.396,"finite bound");
 r=snapshot({mode:"packing",n:2,epsilon:"0",bits:1}).result;ck(r.trueTail.value===1&&r.falseAccepted.value===0,"empty");
 r=snapshot({mode:"ensemble",n:3}).result;ck(r.averageError.value===.141&&r.rows.length===64,"ensemble");
 r=snapshot({mode:"ensemble",n:3,p:"0"}).result;ck(r.averageError.value===.0625&&r.collisionProbability.value===.125,"collision");
 return{status:"PASS",checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,decimal,rat,pack,approx,logq,entropy,binom,capacity,finite,packing,ensemble,fmt,plots,ledgers,svg,mount,selfTest};
});
