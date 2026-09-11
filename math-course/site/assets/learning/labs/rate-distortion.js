(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("rate-distortion",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
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

function entropyGap(p,d){return capacity(d)-capacity(p);}
function binary(p,D){const threshold=cmp(p,complement(p))<=0n?p:complement(p),zero=cmp(D,threshold)>=0n;let q,joint;
 if(zero){q=cmp(p,rat(1n,2n))<=0n?ZERO:ONE;joint=[[mul(complement(p),complement(q)),mul(complement(p),q)],[mul(p,complement(q)),mul(p,q)]];}
 else{q=div(sub(p,D),sub(ONE,mul(rat(2n),D)));joint=[[mul(complement(q),complement(D)),mul(q,D)],[mul(complement(q),D),mul(q,complement(D))]];}
 const source=[complement(p),p],reproduction=[complement(q),q],actual=add(joint[0][1],joint[1][0]);
 const forward=joint.map((row,i)=>source[i].n===0n?null:row.map(z=>pack(div(z,source[i]))));
 const backward=[0,1].map(j=>reproduction[j].n===0n?null:[0,1].map(i=>pack(div(joint[i][j],reproduction[j]))));
 let mutual=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(joint[i][j].n>0n)mutual+=approx(joint[i][j])*logq(div(joint[i][j],mul(source[i],reproduction[j])));
 return{p:pack(p),budget:pack(D),zeroRateThreshold:pack(threshold),zeroRate:zero,reproduction:reproduction.map(pack),joint:joint.map(row=>row.map(pack)),forward,backward,distortion:pack(actual),slack:pack(sub(D,actual)),entropy:entropy(p),rate:zero?0:entropyGap(p,D),mutualInformation:mutual,strictFiniteZeroDistortionRate:p.n===0n||complement(p).n===0n?0:1};
}
function logsum(a){const m=Math.max(...a);return m===-Infinity?-Infinity:m+Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0));}
function logRecord(x){if(x===-Infinity)return{log:null,value:0,status:'zero'};const v=Math.exp(x);return{log:x,value:v===0||!Number.isFinite(v)?null:v,status:v===0?'underflow':!Number.isFinite(v)?'overflow':'finite'};}
function ba(c){const p=decimal(c.p,'源P(1)'),ps=[complement(p),p],lp=ps.map(q=>q.n===0n?-Infinity:logq(q)*Math.LN2),beta=Number(c.beta);let lq=[complement(decimal(c.initialQ,'初始重构P(1)')),decimal(c.initialQ,'初始重构P(1)')].map(q=>q.n===0n?-Infinity:logq(q)*Math.LN2);const rows=[];
 for(let t=0;t<c.steps;t++){
  const logZ=[0,1].map(x=>logsum(lq.map((v,y)=>v-beta*(x!==y)))),lw=[0,1].map(x=>lq.map((v,y)=>v-beta*(x!==y)-logZ[x])),next=[0,1].map(y=>logsum([0,1].map(x=>lp[x]+lw[x][y])));
  let D=0,I=0;for(let x=0;x<2;x++)for(let y=0;y<2;y++)if(lp[x]!==-Infinity&&lw[x][y]!==-Infinity){const w=Math.exp(lp[x]+lw[x][y]);D+=w*(x!==y);I+=w*(lw[x][y]-next[y])/Math.LN2;}
  const logColumns=[0,1].map(y=>logsum([0,1].map(x=>lp[x]-beta*(x!==y)-logZ[x]))),g=-sum(ps.map((v,x)=>approx(v)*logZ[x])),upper=I*Math.LN2+beta*D,lower=g-Math.max(...logColumns),delta=Math.max(...next.map((v,j)=>Math.abs(Math.exp(v)-Math.exp(lq[j]))));
  rows.push({t,inputMarginal:lq.map(logRecord),normalizers:logZ.map(logRecord),channel:lw.map(row=>row.map(logRecord)),outputMarginal:next.map(logRecord),distortion:D,mutualInformation:I,objectiveNats:upper,dualLowerNats:lower,gapNats:upper-lower,logColumnConstraints:logColumns,marginalDelta:delta});lq=next;
 }
 const threshold=approx(cmp(p,complement(p))<=0n?p:complement(p)),e=Math.exp(-beta),optimalD=Math.min(threshold,e/(1+e)),optRate=optimalD===threshold?0:capacityFromFloat(optimalD)-capacity(p);
 return{p:pack(p),beta,steps:c.steps,initialQ:pack(decimal(c.initialQ,'初始重构P(1)')),rows,referenceDistortion:optimalD,referenceRate:optRate,referenceObjectiveNats:optRate*Math.LN2+beta*optimalD,final:rows[rows.length-1],supportLocked:lq.some(x=>x===-Infinity),boundKind:'floating-dual-diagnostic'};
}
function capacityFromFloat(p){if(p===0||p===1)return 1;const u=1-2*p;return Math.abs(u)>.5?1-(-p*Math.log(p)-(1-p)*Math.log1p(-p))/Math.LN2:u===0?0:(.5*Math.log1p(-u*u)+u*Math.atanh(u))/Math.LN2;}
function rateModel(c){const p=decimal(c.p,'源P(1)'),D=decimal(c.D,'失真预算',0,2),maxD=cmp(D,ONE)>0n?D:ONE;return{optimal:binary(p,D),ba:ba(c),curve:Array.from({length:101},(_,j)=>{const d=mul(maxD,rat(BigInt(j),100n));return{D:pack(d),rate:cmp(d,cmp(p,complement(p))<=0n?p:complement(p))>=0n?0:entropyGap(p,d)};})};}

function finiteLoss(c){const p=decimal(c.p,'源P(1)'),D=decimal(c.D,'失真预算',0,2),words=c.codewords,n=words[0].length,M=words.length,rows=[],cells=words.map((w,j)=>({label:j,word:w,count:0,mass:ZERO,distortion:ZERO})),byDistance=Array.from({length:n+1},(_,k)=>({k,mass:ZERO}));let total=ZERO,average=ZERO,excess=ZERO,worst=ZERO;
 for(let index=0;index<2**n;index++){
  const x=word(index,n),k=Array.from(x).filter(v=>v==='1').length,probability=likelihood(n,k,p),distances=words.map(y=>distance(x,y)),best=Math.min(...distances),winners=distances.flatMap((v,j)=>v===best?[j]:[]),chosen=winners[0],distortion=rat(BigInt(best),BigInt(n)),contribution=mul(probability,distortion),exceeds=cmp(distortion,D)>0n;
  total=add(total,probability);average=add(average,contribution);if(exceeds)excess=add(excess,probability);if(probability.n>0n&&cmp(distortion,worst)>0n)worst=distortion;
  cells[chosen].count++;cells[chosen].mass=add(cells[chosen].mass,probability);cells[chosen].distortion=add(cells[chosen].distortion,contribution);byDistance[best].mass=add(byDistance[best].mass,probability);
  rows.push({index,word:x,ones:k,probability:pack(probability),distances,winners,chosen,reconstruction:words[chosen],distortion:pack(distortion),contribution:pack(contribution),exceeds});
 }
 const H=distributionEntropy(cells.map(z=>z.mass)),rate=Math.log2(M)/n;
 return{p:pack(p),budget:pack(D),n,M,codewords:words,distinct:new Set(words).size,rate,rows,cells:cells.map(z=>({...z,mass:pack(z.mass),distortion:pack(z.distortion)})),byDistance:byDistance.map(z=>({k:z.k,mass:pack(z.mass)})),total:pack(total),averageDistortion:pack(average),maximumSupportedDistortion:pack(worst),excessProbability:pack(excess),meetsAverage:cmp(average,D)<=0n,reconstructionEntropy:H,informationPerSymbol:H/n,rateLowerAtActualDistortion:binary(p,average).rate,rateLowerAtBudget:binary(p,D).rate,strictFiniteZeroDistortionRate:p.n===0n||complement(p).n===0n?0:1};
}

function divergence(q,p){let v=0;for(const [a,b]of[[q,p],[complement(q),complement(p)]])if(a.n>0n){if(b.n===0n)return null;v+=approx(a)*logq(div(a,b));}return v;}
function types(c){const n=c.n,p=decimal(c.p,'源P(1)'),a=decimal(c.threshold,'阈值'),rows=[];let total=ZERO,event=ZERO,numerator=ZERO,maxMass=ZERO,selected=0,possible=0,minKL=null;
 for(let k=0;k<=n;k++){
  const q=rat(BigInt(k),BigInt(n)),count=binom(n,k),single=likelihood(n,k,p),mass=mul(rat(count),single),kl=divergence(q,p),H=entropy(q),logCount=logq(rat(count)),chosen=c.event==='tail'?cmp(q,a)>=0n:cmp(q,a)===0n;
  total=add(total,mass);if(chosen){selected++;event=add(event,mass);numerator=add(numerator,mul(q,mass));if(mass.n>0n){possible++;if(cmp(mass,maxMass)>0n)maxMass=mass;if(minKL===null||kl<minKL)minKL=kl;}}
  rows.push({k,frequency:pack(q),count:String(count),singleProbability:pack(single),mass:pack(mass),entropy:H,divergence:kl,infiniteDivergence:kl===null,logCount,logExponent:kl===null?null:-n*kl,logPrefactor:logCount-n*H,logTypeLower:kl===null?null:-n*kl-2*Math.log2(n+1),chosen});
 }
 for(const z of rows)z.conditionalMass=event.n===0n?null:pack(z.chosen?div(rat(BigInt(z.mass.numerator),BigInt(z.mass.denominator)),event):ZERO);
 const upper=mul(rat(BigInt(possible)),maxMass),ldp=c.event==='tail'?(cmp(a,p)<=0n?0:divergence(a,p)):null;
 return{n,p:pack(p),threshold:pack(a),event:c.event,rows,total:pack(total),eventMass:pack(event),selectedTypes:selected,possibleSelectedTypes:possible,emptyOnGrid:selected===0,impossible:event.n===0n,conditionalMean:event.n===0n?null:pack(div(numerator,event)),finiteRate:event.n===0n?null:-logq(event)/n,minimumSelectedDivergence:minKL,maximumTypeMass:pack(maxMass),exactTypeUnionRaw:pack(upper),exactTypeUnionCapped:pack(cmp(upper,ONE)>0n?ONE:upper),tailLimitRate:ldp,tailLimitInfinite:c.event==='tail'&&ldp===null,thresholdOnGrid:(a.n*BigInt(n))%a.d===0n};
}

function water(c){const vs=c.variances.map(x=>decimal(x,'方差',0,1000)),D=decimal(c.totalD,'总平方失真预算',0,8000),m=vs.length,total=vs.reduce(add,ZERO),budget=cmp(D,total)>=0n?total:D,sorted=vs.slice().sort((a,b)=>cmp(a,b)<0n?-1:cmp(a,b)>0n?1:0);let theta=ZERO,spent=ZERO;
 if(cmp(budget,total)===0n)theta=sorted[m-1];
 else for(let j=0;j<m;j++){theta=div(sub(budget,spent),rat(BigInt(m-j)));if(cmp(theta,sorted[j])<=0n)break;spent=add(spent,sorted[j]);}
 let rate=0,infinite=false;const rows=vs.map((v,j)=>{const d=cmp(v,theta)<=0n?v:theta,active=cmp(v,d)>0n,reconstruction=sub(v,d),coefficient=v.n===0n?null:div(reconstruction,v),forwardNoise=v.n===0n?ZERO:div(mul(reconstruction,d),v),r=active?(d.n===0n?null:logq(div(v,d))/2):0;if(r===null)infinite=true;else rate+=r;return{j,variance:pack(v),distortion:pack(d),active,rate:r,infiniteRate:r===null,reconstructionVariance:pack(reconstruction),forwardCoefficient:coefficient?pack(coefficient):null,forwardNoiseVariance:pack(forwardNoise)};});
 const actual=rows.reduce((s,z)=>add(s,rat(BigInt(z.distortion.numerator),BigInt(z.distortion.denominator))),ZERO);
 return{dimensions:m,variances:vs.map(pack),budget:pack(D),totalVariance:pack(total),waterLevel:pack(theta),rows,actualDistortion:pack(actual),slack:pack(sub(D,actual)),ratePerVector:infinite?null:rate,ratePerCoordinate:infinite?null:rate/m,infiniteRate:infinite,activeCount:rows.filter(z=>z.active).length,model:'independent-real-Gaussian-coordinates'};
}

const DEFAULTS={mode:'rate',p:'0.1',D:'0.05',beta:'3',initialQ:'0.5',steps:40,codebook:'000,111',n:100,event:'tail',threshold:'0.7',varianceList:'9,4,1',totalD:'3'};
function config(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('配置须为对象');const c={...DEFAULTS,...input};if(!['rate','finite','types','water'].includes(c.mode))throw Error('未知实验');
 if(c.mode!=='water')decimal(c.p,'源P(1)');
 if(c.mode==='rate'){decimal(c.D,'失真预算',0,2);decimal(c.beta,'自然指数beta',0,1000);decimal(c.initialQ,'初始重构P(1)');c.steps=integer(c.steps,'迭代数',1,200);}
 if(c.mode==='finite'){decimal(c.D,'失真预算',0,2);if(typeof c.codebook!=='string'||c.codebook.length>256||!/^\s*[01]+(?:\s*,\s*[01]+|\s+[01]+)*\s*$/.test(c.codebook))throw Error('码本须为逗号或空格分隔二元词');c.codewords=c.codebook.trim().split(/[\s,]+/);c.n=c.codewords[0].length;if(c.n<1||c.n>8||c.codewords.length>16||!c.codewords.every(w=>w.length===c.n))throw Error('码字须等长1–8位，数量1–16');}
 if(c.mode==='types'){c.n=integer(c.n,'长度',1,512);decimal(c.threshold,'事件阈值');if(!['tail','point'].includes(c.event))throw Error('未知类型事件');}
 if(c.mode==='water'){if(typeof c.varianceList!=='string'||c.varianceList.length>256)throw Error('方差列表须为文本');c.variances=c.varianceList.split(',').map(x=>x.trim());if(c.variances.length<1||c.variances.length>8)throw Error('需1–8个方差');c.variances.forEach(x=>decimal(x,'方差',0,1000));decimal(c.totalD,'总失真',0,8000);}
 return c;
}
function snapshot(input={}){const c=config(input);return{parameters:c,result:c.mode==='rate'?rateModel(c):c.mode==='finite'?finiteLoss(c):c.mode==='types'?types(c):water(c)};}

const PRESETS=[
 ['biased','偏置源：反向信道',{}],['fair','公平源D=0.2',{p:'0.5',D:'0.2',beta:'1.386294'}],['reflected','反向偏置0.9',{p:'0.9'}],['zero-budget','精确零与趋零',{D:'0'}],['platform','零率平台',{D:'0.1'}],['wide-budget','预算大于1/2',{D:'0.8'}],['deterministic','确定性源',{p:'0'}],['near-half','微小正码率',{p:'0.5',D:'0.499999'}],
 ['locked','零初始支持锁死',{initialQ:'0'}],['other-locked','锁死在另一符号',{initialQ:'1'}],['asymmetric-start','偏置BA起点',{initialQ:'0.000001'}],['one-step','只迭代一次',{steps:1}],['zero-beta','乘子为零',{beta:'0'}],['large-beta','大乘子与对数概率',{beta:'1000'}],['tiny-source','极小源概率',{p:'0.000001',steps:100}],
 ['finite','三位有损码本',{mode:'finite',D:'0.1'}],['fair-code','公平源同一码本',{mode:'finite',p:'0.5',D:'0.2'}],['full-code','两位完全重构',{mode:'finite',codebook:'00,01,10,11',D:'0'}],['one-word','只存一个代表词',{mode:'finite',codebook:'000'}],['duplicates','重复代表词',{mode:'finite',codebook:'000,000,111'}],['support-only','最大值只看源支持',{mode:'finite',p:'0'}],
 ['tail','公平硬币稀有尾项',{mode:'types',p:'0.5'}],['point','恰好0.7：长度100',{mode:'types',p:'0.5',event:'point'}],['off-grid','恰好0.7：长度101',{mode:'types',p:'0.5',event:'point',n:101}],['impossible','源不支持的类型',{mode:'types',p:'0',threshold:'0.7'}],['underflow','极小尾概率仍保留',{mode:'types',p:'0.000001',n:512,threshold:'1'}],['all-types','事件包括所有类型',{mode:'types',threshold:'0'}],
 ['water','三维高斯反注水',{mode:'water'}],['more-water','提高总失真预算',{mode:'water',totalD:'6'}],['zero-water','高斯严格零失真',{mode:'water',totalD:'0'}],['all-discarded','全部方向零率',{mode:'water',totalD:'14'}],['zero-variance','含确定性坐标',{mode:'water',varianceList:'0,9,0,1',totalD:'1'}]
].map(([id,label,values])=>({id,label,values}));
const QUESTIONS=[
 ['平均失真达标能推出每条达标吗？',['不能，要分别计算','可以，平均就是每条'],0],
 ['偏置源的最优前向信道总对称吗？',['不总对称，应由反向联合分布推算','总是相同翻转概率'],0],
 ['BA边缘不动足以证明全局最优吗？',['不足，可能锁死支持','足够，变化量为零即可'],0],
 ['恰好0.7正面在任何长度都可行吗？',['不可行，要看整数格点','总可以，只是概率很小'],0]
];
function fmt(x){if(x===null||x===undefined)return'—';if(typeof x==='boolean')return x?'是':'否';if(typeof x==='number'){if(!Number.isFinite(x))throw Error('未标记的非有限值');if(x===0)return'0';return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));}if(typeof x==='object')return Array.isArray(x)?'['+x.map(fmt).join('；')+']':Object.entries(x).map(([k,v])=>(WORDS[k]||k)+'='+fmt(v)).join('；');return WORDS[String(x)]||String(x);}
const B='#268bd2',O='#cb6a16',G='#29966c',V='#9966bb',R='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,xmax,discrete=true){const vs=ss.flatMap(s=>s.points.map(z=>z[1])),lo=Math.min(0,...vs),hi=Math.max(0,...vs),pad=(hi-lo||1)*.08,max=Math.max(1,xmax);return{title,x,y,series:ss,xmin:0,xmax:max,ymin:lo-pad,ymax:hi+pad,square:false,markers:[],xTicks:[...new Set(Array.from({length:5},(_,i)=>discrete?Math.round(max*i/4):max*i/4))]};}
const pts=(rows,x,y)=>rows.flatMap(z=>{const v=y(z);return v===null?[]:[[x(z),v]];});
function plots(d){const c=d.parameters,r=d.result;
 if(c.mode==='rate'){const o=r.optimal,b=r.ba,steps=b.steps;return[
  chart('当前源的单字母率失真边界','预算D：Hamming每位平均失真','bit/源符号；红点为当前预算',[series('curve','解析边界',B,r.curve.map(z=>[z.D.value,z.rate])),series('selected','当前预算',R,[[o.budget.value,o.rate]],false)],Math.max(1,o.budget.value),false),
  chart('最优联合分布：先核对四格质量','联合格编号：00、01、10、11','P(X=x,重构=y)；行是原信源',[series('joint','最优联合质量',V,o.joint.flatMap((row,x)=>row.map((z,y)=>[2*x+y,z.value])))],3),
  chart('BA当前可行目标与对偶下界','迭代t（从0开始）','nat目标=互信息nat+beta乘失真',[series('upper','当前测试信道上界',B,b.rows.map(z=>[z.t,z.objectiveNats])),series('lower','全输出列对偶下界',G,b.rows.map(z=>[z.t,z.dualLowerNats])),series('optimum','独立解析最优目标',O,[[0,b.referenceObjectiveNats],[steps-1,b.referenceObjectiveNats]])],steps-1),
  chart('固定乘子下的实际平均失真','迭代t（从0开始）','当前beta对应的最优失真，与输入预算分别定义',[series('distortion','当前BA失真',B,b.rows.map(z=>[z.t,z.distortion])),series('reference','该beta解析最优失真',O,[[0,b.referenceDistortion],[steps-1,b.referenceDistortion]])],steps-1),
  chart('最优性余量：保留原始浮点差','迭代t（从0开始）','上界减下界，nat；微小负值是舍入诊断',[series('gap','对偶差',V,b.rows.map(z=>[z.t,z.gapNats]))],steps-1)
 ];}
 if(c.mode==='finite')return[
  chart('每个原词的概率与失真贡献','二元源词整数编号','概率，以及概率乘每位失真',[series('probability','源词概率',B,pts(r.rows,z=>z.index,z=>z.probability.value)),series('contribution','平均失真贡献',O,pts(r.rows,z=>z.index,z=>z.contribution.value))],2**c.n-1),
  chart('每个原词的实际重构失真','二元源词整数编号','每位错误比例；零概率原词也列出',[series('distortion','实际失真',B,r.rows.map(z=>[z.index,z.distortion.value])),series('budget','当前平均预算',G,[[0,r.budget.value],[2**c.n-1,r.budget.value]])],2**c.n-1),
  chart('每个重构区域收到多少源概率','重构标签编号','区域质量；未使用标签为零',[series('cells','区域质量',V,r.cells.map(z=>[z.label,z.mass.value]))],r.M-1),
  chart('完整失真分布','重构错误位数','总概率；与每位平均和超额概率分别核对',[series('distance','该距离的概率',B,r.byDistance.map(z=>[z.k,z.mass.value]))],c.n)
 ];
 if(c.mode==='types')return[
  chart('全部类型与事件选中的质量','类型k：1的个数','概率；下溢点省略，精确分数仍保留',[series('mass','全部类型质量',B,pts(r.rows,z=>z.k,z=>z.mass.value)),series('selected','事件质量',G,pts(r.rows.filter(z=>z.chosen),z=>z.k,z=>z.mass.value),false)],c.n),
  chart('有限前因子：实际质量不等于指数部分','类型k：1的个数','log₂概率；不可能类型不画点',[series('actual','实际质量log₂',B,pts(r.rows,z=>z.k,z=>z.mass.log2)),series('exponent','KL指数部分',O,pts(r.rows,z=>z.k,z=>z.logExponent)),series('lower','含多项式因子的下界',G,pts(r.rows,z=>z.k,z=>z.logTypeLower))],c.n),
  chart('条件于事件发生后的完整类型分布','类型k：1的个数','条件概率；零事件没有条件分布',[series('conditional','事件条件质量',V,pts(r.rows,z=>z.k,z=>z.conditionalMass?.value??null))],c.n),
  chart('经验分布到真实源的KL代价','类型k：1的个数','bit/源符号；正质量支持外为无穷，不画点',[series('kl','D₂(k/n || p)',B,pts(r.rows,z=>z.k,z=>z.divergence)),series('minimum','所选可行类型最小KL',O,r.minimumSelectedDivergence===null?[]:[[0,r.minimumSelectedDivergence],[c.n,r.minimumSelectedDivergence]])],c.n)
 ];
 return[
  chart('原方差、分配失真与共同水位','坐标编号','平方单位；小方差坐标的失真封顶',[series('variance','原始方差',B,r.rows.map(z=>[z.j,z.variance.value])),series('distortion','分配失真',O,r.rows.map(z=>[z.j,z.distortion.value])),series('water','水位',G,[[0,r.waterLevel.value],[r.dimensions-1,r.waterLevel.value]])],r.dimensions-1),
  chart('每个坐标实际需要的率','坐标编号','bit/向量中该坐标；无穷率不画点',[series('rate','分量率',V,pts(r.rows,z=>z.j,z=>z.rate))],r.dimensions-1),
  chart('重构还保留多少随机变化','坐标编号','重构方差=lambda减分配失真',[series('reconstruction','重构方差',B,r.rows.map(z=>[z.j,z.reconstructionVariance.value]))],r.dimensions-1),
  chart('从原信号到重构的前向均值系数','坐标编号','无单位；零方差方向系数不适用',[series('gain','条件均值乘数',G,pts(r.rows,z=>z.j,z=>z.forwardCoefficient?.value??null))],r.dimensions-1)
 ];
}
const WORDS={numerator:'分子',denominator:'分母',value:'近似值',status:'状态',log2:'log₂',log:'自然对数',zero:'精确零',underflow:'浮点下溢',overflow:'浮点上溢',finite:'有限',p:'源P(1)',budget:'失真预算',zeroRateThreshold:'零率起点',zeroRate:'处于零率平台',reproduction:'重构边缘',joint:'联合分布（行原词列重构）',forward:'前向条件（行原词列重构）',backward:'反向条件（行重构列原词）',distortion:'实际或分配失真',slack:'未用预算',entropy:'二元熵',rate:'bit/源符号或分量率',mutualInformation:'实际互信息bit',strictFiniteZeroDistortionRate:'有限严格零失真最小率',beta:'自然指数乘子beta',steps:'指定迭代步数',initialQ:'初始重构P(1)',referenceDistortion:'该beta解析最优失真',referenceRate:'该beta解析最优率',referenceObjectiveNats:'该beta解析最优nat目标',supportLocked:'存在被锁定的零初始支持',boundKind:'数值界类别','floating-dual-diagnostic':'浮点对偶诊断',t:'迭代编号',inputMarginal:'本步输入边缘',normalizers:'每行归一化系数',channel:'本步前向信道',outputMarginal:'本步输出边缘',objectiveNats:'当前nat目标上界',dualLowerNats:'nat目标对偶下界',gapNats:'原始对偶差nat',logColumnConstraints:'所有列约束自然对数',marginalDelta:'边缘最大变化量',D:'曲线失真预算',n:'源词长度',M:'码本标签数',codewords:'完整码本',distinct:'不同重构词数',total:'总质量',averageDistortion:'每位平均失真',maximumSupportedDistortion:'支持中最大每位失真',excessProbability:'超过预算的概率',meetsAverage:'平均失真达标',reconstructionEntropy:'重构标签熵bit/块',informationPerSymbol:'确定性编码信息bit/符号',rateLowerAtActualDistortion:'实际失真下的信息率下界',rateLowerAtBudget:'预算对应的信息率下界',index:'源词编号',word:'二元词',ones:'1的个数',probability:'源词概率',distances:'到全部重构词的距离',winners:'并列最近标签',chosen:'是否入事件或所选重构标签',reconstruction:'重构词',contribution:'加权失真贡献',exceeds:'超过失真预算',label:'重构标签',count:'源词数或类型词数',mass:'概率质量',k:'1的个数或错误位数',threshold:'事件频率阈值',event:'事件类型',tail:'至少阈值',point:'精确等于阈值',eventMass:'完整事件概率',selectedTypes:'所选整数类型数',possibleSelectedTypes:'所选正概率类型数',emptyOnGrid:'格点上没有选中类型',impossible:'事件严格零概率',conditionalMean:'事件条件下平均频率',finiteRate:'有限负log₂概率除以n',minimumSelectedDivergence:'选中正概率类型的最小KL',maximumTypeMass:'所选最大类型质量',exactTypeUnionRaw:'类型并集原始上界',exactTypeUnionCapped:'类型并集上界截到1',tailLimitRate:'闭尾事件极限速率',tailLimitInfinite:'闭尾事件极限速率无穷',thresholdOnGrid:'阈值落在整数格点',frequency:'经验比例',singleProbability:'单个该类型词概率',divergence:'经验到真实源KL',infiniteDivergence:'KL正无穷',logCount:'类型基数log₂',logExponent:'负n乘KL',logPrefactor:'实际类型前因子log₂',logTypeLower:'含多项式项的下界log₂',conditionalMass:'事件条件类型概率',dimensions:'实坐标维数',variances:'全部坐标方差',totalVariance:'总方差',waterLevel:'精确水位',actualDistortion:'实际总失真',ratePerVector:'bit/整个向量',ratePerCoordinate:'bit/坐标平均',infiniteRate:'率为正无穷',activeCount:'正率活动坐标数',model:'模型','independent-real-Gaussian-coordinates':'独立实高斯坐标',j:'坐标编号',variance:'原始方差',active:'正率活动方向',reconstructionVariance:'重构方差',forwardCoefficient:'前向均值系数',forwardNoiseVariance:'前向条件噪声方差'};
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(z=>keys.map(k=>z[k]))};}
function summaryTable(key,title,r,exclude=[]){return{key,title,headers:['量','实际记录；分数或对数与近似值均保留'],rows:Object.entries(r).filter(([k])=>!exclude.includes(k)).map(([k,v])=>[WORDS[k]||k,v])};}
function ledgers(d){const c=d.parameters,r=d.result;
 if(c.mode==='rate')return[summaryTable('summary','预算下最优测试信道',r.optimal),summaryTable('ba','乘子下BA汇总',r.ba,['rows','final']),recordTable('iterations','全部BA迭代记录',r.ba.rows),summaryTable('final','最后一步完整记录',r.ba.final),recordTable('curve','全部解析曲线取样点',r.curve)];
 const out=[summaryTable('summary','参数、约束与结果',r,['rows','cells','byDistance']),recordTable('rows',c.mode==='finite'?'全部源词与实际重构':c.mode==='types'?'全部类型、事件与条件质量':'全部高斯坐标分配',r.rows)];
 if(c.mode==='finite')out.push(recordTable('cells','完整重构区域',r.cells),recordTable('byDistance','全部重构错误距离',r.byDistance));return out;
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

 const STYLE=".distortion151{color:var(--fg,#273646)}.distortion151 .distortion-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.distortion151 label{display:flex;flex-direction:column;gap:6px}.distortion151 input,.distortion151 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.distortion151 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.distortion151 button[aria-pressed=true]{outline:3px solid #478aaa}.distortion151 .distortion-scroll{overflow:auto;max-width:100%;margin:16px 0}.distortion151 .distortion-scroll:focus{outline:3px solid #478aaa}.distortion151 .distortion-ledger{max-height:420px}.distortion151 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.distortion151 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.distortion151 th,.distortion151 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.distortion151 .distortion-error{color:#c74b39}.distortion151 [hidden]{display:none!important}.distortion151 fieldset{margin:16px 0;padding:12px}.distortion151 details{margin:16px 0}.distortion151 summary{cursor:pointer;font-weight:600}.distortion151 .distortion-legend{font-size:.95em}.distortion151 .distortion-note{line-height:1.7}.distortion151 [hidden]{display:none!important}.distortion151 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.distortion151 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.distortion151 .distortion-controls{min-width:0}.distortion151 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("distortion151-style")){const style=doc.createElement("style");style.id="distortion151-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="text" inputmode="decimal"></label>';
  container.innerHTML='<div class="distortion151"><h3>分别核对信息边界、有限压缩与稀有事件</h3><p>有限计数和失真用精确分数；BA与对数用浮点，并保留完整轨迹和边界状态。</p><div class="distortion-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="distortion-controls"><label>实验<select data-key="mode"><option value="rate">二元最优信道与BA</option><option value="finite">有限有损码本</option><option value="types">Sanov类型与格点</option><option value="water">高斯反注水</option></select></label>'+
   field("p","信源每位P(1)（0–1）","rate finite types")+field("D","每位失真预算（0–2）","rate finite")+field("beta","BA自然指数beta（0–1000）","rate")+field("initialQ","BA初始重构P(1)（0–1）","rate")+field("steps","BA固定迭代步数（1–200）","rate")+
   '<label data-modes="finite">重构码本：等长二元词，逗号分隔（1–8位，1–16标签）<input data-key="codebook" type="text"></label>'+
   field("n","类型样本长度n（1–512）","types")+field("threshold","事件频率阈值（0–1）","types")+
   '<label data-modes="types">事件<select data-key="event"><option value="tail">比例至少达到阈值</option><option value="point">比例精确等于阈值</option></select></label>'+
   '<label data-modes="water">1–8个独立实坐标方差，逗号分隔（各0–1000）<input data-key="varianceList" type="text"></label>'+
   field("totalD","整个向量总平方失真预算（0–8000）","water")+'</div><p>输入按最多六位小数解释，不接受指数记法。预算D决定解析测试信道；beta单独决定BA优化目标，二者不会被悄悄绑定。切换模型可先用对应预设。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="distortion-error" role="alert"></p><p role="status"></p><div class="distortion-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".distortion-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={rate:"预算下的最优联合分布，与固定beta的BA轨迹分别计算。反向信道对称，前向由Bayes求得。零初始支持可能锁死，边缘不动不等于全局最优；全部列约束给出浮点对偶诊断。微小负互信息或负gap原样保留，不能当作数学反例。",finite:"完整枚举2^n源词，以最近重构词编码，平局选首标签。最大失真只看正概率支持；平均失真与超预算概率分别算。整数码本率、标签熵与单字母信息下界并列，严格有限零失真和渐近趋零分开。",types:"完整枚举n+1类型。事件选择用分数精确比较，单点未落格点时事件为空。KL方向是经验分布到真信源；实际质量保留有限前因子。零事件没有条件分布，不用某个小正数代替。",water:"输入是独立实高斯坐标方差；总失真按整个向量计量，率同时报告每向量与每坐标。精确分数决定水位与活动集合，对数给码率。零方差方向不含信息，正方差方向严格零失真需要无穷率。"};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="distortion-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="distortion-scroll distortion-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”配合状态字段表示不适用、不适用的指标、概率为零时的无限自信息或浮点上下溢，不是数值0。精确分数与log₂仍可核对极小概率。图线连接离散点只作读图辅助；相同曲线会重合。每个表保留该类结果的全部字段，宽表与图可键盘横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"预算、有限对象与渐近结论分别核对。":"";
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
 let r=snapshot().result;ck(Math.abs(r.optimal.rate-.182598636473325)<1e-12,"biased RD");ck(r.optimal.forward[0][1].denominator==="324","backward construction");
 r=snapshot({p:"0.5",D:"0.499999"}).result;ck(Math.abs(r.optimal.rate/2.8853900817798487e-12-1)<1e-12,"near-half rate");
 r=snapshot({D:"0"}).result;ck(r.optimal.rate<1&&r.optimal.strictFiniteZeroDistortionRate===1,"two zero conventions");
 r=snapshot({initialQ:"0"}).result;ck(r.ba.final.marginalDelta===0&&r.ba.final.gapNats>.7,"locked support");
 r=snapshot({beta:"1000"}).result;ck(r.ba.rows.some(z=>z.channel.flat().some(v=>v.status==="underflow"&&v.log!==null)),"log probability preserved");
 r=snapshot({mode:"finite",D:"0.1"}).result;ck(r.averageDistortion.value===.09&&r.excessProbability.value===.27,"finite average/excess");
 r=snapshot({mode:"types",event:"point",n:101}).result;ck(r.emptyOnGrid&&r.eventMass.value===0&&r.conditionalMean===null,"off-grid point");
 r=snapshot({mode:"types",p:"0",threshold:"1"}).result;ck(r.impossible&&r.tailLimitInfinite,"impossible source");
 r=snapshot({mode:"water"}).result;ck(r.waterLevel.value===1&&Math.abs(r.ratePerVector-2.584962500721156)<1e-12,"water filling");
 r=snapshot({mode:"water",totalD:"0"}).result;ck(r.infiniteRate&&r.ratePerVector===null,"Gaussian zero distortion");
 r=snapshot({mode:"water",varianceList:"0,0",totalD:"0"}).result;ck(!r.infiniteRate&&r.ratePerVector===0,"deterministic Gaussian");return{status:"PASS",checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,binary,ba,finiteLoss,types,water,capacity,decimal,rat,pack,entropy,divergence,fmt,plots,ledgers,svg,mount,selfTest};
});
