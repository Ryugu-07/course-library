(function(root,factory){
"use strict";var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
if(root&&root.CourseLearning)root.CourseLearning.register("subgaussian-concentration",api.mount);
if(typeof module==="object"&&module.exports&&typeof require==="function"&&require.main===module)console.log(JSON.stringify(api.selfTest()));
})(typeof window!=="undefined"?window:null,function(){
"use strict";
var MODES=Object.freeze({models:"MGF、真实尾与独立性的作用",binomial:"稀有计数：精确尾与三种界",shell:"高维薄壳：独立坐标与相关反例"});
var MODELS=Object.freeze({gaussian:"标准 Gaussian",rademacher:"Rademacher ±1",uniform:"Uniform[-1,1]",laplace:"单位方差 Laplace",heavy:"对称重尾 (1+t)⁻³"});
var DEFAULTS=Object.freeze({mode:"models",model:"rademacher",dependence:"independent",n:32,threshold:12,events:5,lambda:1,singleThreshold:1.5,p:.01,count:5,dimension:32,deviation:2});
var INSTANCE=0;
function finite(v,lo,hi,name){if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi)throw RangeError(name+" must be finite in ["+lo+", "+hi+"]");return v;}
function integer(v,lo,hi,name){finite(v,lo,hi,name);if(!Number.isInteger(v))throw RangeError(name+" must be integer");return v;}
function config(o){if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("configuration required");var c=Object.assign({},DEFAULTS,o);if(typeof c.mode!=="string"||!Object.hasOwn(MODES,c.mode))throw RangeError("mode");if(typeof c.model!=="string"||!Object.hasOwn(MODELS,c.model))throw RangeError("model");if(c.dependence!=="independent"&&c.dependence!=="shared")throw RangeError("dependence");
integer(c.n,1,512,"n");finite(c.threshold,0,512,"sum threshold");integer(c.events,1,10000,"events");finite(c.lambda,-20,20,"lambda");finite(c.singleThreshold,0,20,"single threshold");finite(c.p,0,1,"p");var canonical=Math.round(c.p*10000)/10000;if(Math.abs(c.p-canonical)>Number.EPSILON*Math.max(c.p,canonical))throw RangeError("p supports four decimal places");c.p=canonical;integer(c.count,0,c.n,"count");integer(c.dimension,2,512,"dimension");if(c.dimension%2)throw RangeError("dimension must be even");finite(c.deviation,0,20,"deviation");return c;}
function sum(xs){var s=0,c=0;xs.forEach(function(v){var y=v-c,t=s+y;c=(t-s)-y;s=t;});return s;}
function logAdd(a,b){if(a===-Infinity)return b;if(b===-Infinity)return a;var m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));}
function logSum(xs){var m=Math.max.apply(null,xs);if(m===-Infinity)return m;return m+Math.log(sum(xs.map(function(x){return Math.exp(x-m);}))); }
function logComplement(a){if(a===-Infinity)return 0;if(a===0)return-Infinity;if(!(a<0))throw RangeError("log probability must be nonpositive");return a<-Math.LN2?Math.log1p(-Math.exp(a)):Math.log(-Math.expm1(a));}
function logGammaShape(a){if(a===.5)return .5*Math.log(Math.PI);var out=0;for(var k=1;k<a;k++)out+=Math.log(k);return out;}
function gammaPair(a,x){
if(x===0)return{lower:-Infinity,upper:0,iterations:0,method:"x=0"};
var pref=-x+a*Math.log(x)-logGammaShape(a);
if(x<a+1){var ap=a,term=1/a,total=term;for(var i=1;i<=10000;i++){ap++;term*=x/ap;total+=term;if(term<=total*Number.EPSILON){var lp=Math.min(0,pref+Math.log(total));return{lower:lp,upper:logComplement(lp),iterations:i,method:"lower series"};}}}
else{var b=x+1-a,c=1e300,d=1/b,h=d;for(var j=1;j<=10000;j++){var an=-j*(j-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;var change=d*c;h*=change;if(Math.abs(change-1)<=4*Number.EPSILON){var lq=Math.min(0,pref+Math.log(h));return{lower:logComplement(lq),upper:lq,iterations:j,method:"upper continued fraction"};}}}
throw Error("gamma iteration did not converge");
}
function normalLogTwoTail(t){finite(t,0,512,"normal threshold");if(t===0)return 0;if(t<.1){var term=1,total=1;for(var k=1;k<=16;k++){term*=-(t*t)/(2*k)*(2*k-1)/(2*k+1);total+=term;}return Math.log1p(-t*Math.sqrt(2/Math.PI)*total);}return gammaPair(.5,t*t/2).upper;}
function logMGF(model,lambda){
if(typeof model!=="string"||!Object.hasOwn(MODELS,model))throw RangeError("model");finite(lambda,-20,20,"lambda");var a=Math.abs(lambda),z=a*a;
if(a===0)return 0;if(model==="gaussian")return z/2;
if(model==="rademacher")return a<.1?Math.log1p(2*Math.sinh(a/2)**2):a+Math.log1p(Math.exp(-2*a))-Math.LN2;
if(model==="uniform")return a<.05?z/6-z*z/180+z*z*z/2835-z**4/37800:a+Math.log(-Math.expm1(-2*a))-Math.LN2-Math.log(a);
if(model==="laplace")return z<2?-Math.log1p(-z/2):Infinity;
return Infinity;
}
function proxyVariance(model){return model==="uniform"?1/3:model==="gaussian"||model==="rademacher"?1:null;}
function singleLogTail(model,t){if(typeof model!=="string"||!Object.hasOwn(MODELS,model))throw RangeError("model");finite(t,0,512,"threshold");if(model==="gaussian")return normalLogTwoTail(t);if(model==="rademacher")return t<=1?0:-Infinity;if(model==="uniform")return t<1?Math.log1p(-t):-Infinity;if(model==="laplace")return-Math.SQRT2*t;return-3*Math.log1p(t);}
function binomialRows(n,p){
integer(n,1,512,"n");finite(p,0,1,"p");var logs=[],choose=0;
for(var k=0;k<=n;k++){if(k>0)choose+=Math.log(n-k+1)-Math.log(k);var l=p===0?(k===0?0:-Infinity):p===1?(k===n?0:-Infinity):choose+k*Math.log(p)+(n-k)*Math.log1p(-p);logs.push(l);}
// Normalize finite binary64 log masses; the normalizer is exposed, not hidden as an exact arithmetic claim.
var norm=logSum(logs),rows=logs.map(function(l,k){return{k:k,logRaw:l,logMass:l-norm,mass:Math.exp(l-norm)};});
var tail=-Infinity;for(var k=n;k>=0;k--){tail=logAdd(tail,rows[k].logMass);rows[k].logUpper=Math.min(0,tail);}
var before=-Infinity;for(var k=0;k<=n;k++){var upper=rows[k].logUpper;rows[k].logLowerBefore=before>-Math.LN2?logComplement(upper):before;if(upper>-Math.LN2)rows[k].logUpper=logComplement(Math.min(0,before));before=logAdd(before,rows[k].logMass);}rows[0].logUpper=0;
return{rows:rows,logNormalizer:norm};
}
function rademacherLogTail(n,t){integer(n,1,512,"n");finite(t,0,512,"threshold");if(t===0||(n%2===1&&t<=1))return 0;if(t>n)return-Infinity;var d=binomialRows(n,.5);return Math.min(0,logSum(d.rows.filter(function(r){return Math.abs(2*r.k-n)>=t;}).map(function(r){return r.logMass;})));}
function models(o){
var c=config(o),K2=proxyVariance(c.model),factor=c.dependence==="independent"?c.n:c.n*c.n,logBound=K2===null?null:Math.min(0,Math.LN2-c.threshold*c.threshold/(2*factor*K2)),logActual;
if(c.dependence==="shared")logActual=singleLogTail(c.model,c.threshold/c.n);
else if(c.model==="gaussian")logActual=normalLogTwoTail(c.threshold/Math.sqrt(c.n));
else if(c.model==="rademacher")logActual=rademacherLogTail(c.n,c.threshold);
else logActual=c.n===1?singleLogTail(c.model,c.threshold):null;
var lambdas=Array.from({length:161},function(_,i){return-20+i/4;}).concat([c.lambda,-Math.SQRT2,Math.SQRT2,0]);
var ts=Array.from({length:201},function(_,i){return i/10;}).concat([c.singleThreshold,1]);
var all=Object.keys(MODELS).map(function(m){return{model:m,variance:m==="uniform"?1/3:1,proxy:proxyVariance(m),logMGF:logMGF(m,c.lambda),logTail:singleLogTail(m,c.singleThreshold)};});
return{config:c,proxyVariance:K2,variance:c.model==="uniform"?1/3:1,sumVariance:factor*(c.model==="uniform"?1/3:1),sumLogActual:logActual,sumLogBound:logBound,unionLogBound:logBound===null?null:Math.min(0,Math.log(c.events)+logBound),wrongIndependentLogBound:c.dependence==="shared"&&K2!==null?Math.min(0,Math.LN2-c.threshold*c.threshold/(2*c.n*K2)):null,
lambdaRows:Array.from(new Set(lambdas)).sort(function(a,b){return a-b;}).map(function(l){return{lambda:l,logMGF:logMGF(c.model,l),logEnvelope:K2===null?null:l*l*K2/2,logRangeEnvelope:c.model==="uniform"?l*l/2:null};}),
tailRows:Array.from(new Set(ts)).sort(function(a,b){return a-b;}).map(function(t){return{t:t,logActual:singleLogTail(c.model,t),logBound:K2===null?null:Math.min(0,Math.LN2-t*t/(2*K2))};}),comparison:all,
binomial:c.model==="rademacher"&&c.dependence==="independent"?binomialRows(c.n,.5):null};
}
function bernoulliKL(q,p){
finite(q,0,1,"q");finite(p,0,1,"p");
if(q===p)return 0;if(p===0||p===1)return Infinity;if(q===0)return-Math.log1p(-p);if(q===1)return-Math.log(p);
var d=q-p;
if(Math.abs(d)<.05*Math.min(p,1-p)){var xp=d/p,xq=-d/(1-p),ap=xp*xp,aq=xq*xq,total=0;for(var k=2;k<=40;k++){total+=(p*ap+(1-p)*aq)/(k*(k-1));ap*=-xp;aq*=-xq;}return total;}
return q*Math.log1p(d/p)+(1-q)*Math.log1p(-d/(1-p));
}
function binomial(o){
var c=config(o),d=binomialRows(c.n,c.p),a=Math.round(c.p*10000),variance=c.n*c.p*(1-c.p),M=Math.max(c.p,1-c.p);
var rows=d.rows.map(function(r){var delta=c.n===0?0:(10000*r.k-c.n*a)/10000,q=r.k/c.n,hoeffding=delta<=0?0:-2*delta*delta/c.n,bernstein=delta<=0?0:variance===0?-Infinity:-delta*delta/(2*(variance+M*delta/3)),kl=delta<=0?0:-c.n*bernoulliKL(q,c.p);return Object.assign({},r,{mean:c.n*c.p,deviation:delta,logHoeffding:hoeffding,logBernstein:bernstein,logKL:kl,logUnion:Math.min(0,Math.log(c.events)+kl)});});
return{config:c,rows:rows,sample:rows[c.count],variance:variance,boundM:M,logNormalizer:d.logNormalizer,mean:c.n*c.p};
}
function shellAt(n,t){
var root=Math.sqrt(n),lo=Math.max(0,root-t),hi=root+t,l=gammaPair(n/2,lo*lo/2),u=gammaPair(n/2,hi*hi/2),logActual=t===0?0:Math.min(0,logAdd(l.lower,u.upper));
var a=Math.max(0,1-t/root),b=1+t/root,sharedLow=a===0?-Infinity:gammaPair(.5,a*a/2).lower,sharedHigh=normalLogTwoTail(b),logShared=t===0?0:Math.min(0,logAdd(sharedLow,sharedHigh));
return{t:t,lowerRadius:lo,upperRadius:hi,logLower:l.lower,logUpper:u.upper,logActual:logActual,logBound:Math.min(0,Math.LN2-t*t/2),logShared:logShared,logRademacher:t===0?0:-Infinity,lowerIterations:l.iterations,upperIterations:u.iterations};
}
function shell(o){
var c=config(o),n=c.dimension,rs=Array.from({length:201},function(_,i){return (Math.sqrt(n)+8)*i/200;}).concat([Math.sqrt(n),Math.sqrt(n-1)]),ts=Array.from({length:201},function(_,i){return i/10;}).concat([c.deviation,Math.sqrt(n)]);
return{config:c,sample:shellAt(n,c.deviation),root:Math.sqrt(n),radialMode:Math.sqrt(n-1),rows:Array.from(new Set(ts.filter(function(t){return t<=20;}))).sort(function(a,b){return a-b;}).map(function(t){return shellAt(n,t);}),
radial:Array.from(new Set(rs)).sort(function(a,b){return a-b;}).map(function(r){var ld=r===0?-Infinity:(1-n/2)*Math.LN2-logGammaShape(n/2)+(n-1)*Math.log(r)-r*r/2;return{r:r,logDensity:ld,density:Math.exp(ld),logPointDensity:-n/2*Math.log(2*Math.PI)-r*r/2};})};
}
function snapshot(o){var c=config(o);return c.mode==="models"?models(c):c.mode==="binomial"?binomial(c):shell(c);}
function fmt(x){if(x===null)return"此模型未计算 / 不适用";if(x===Infinity)return"∞（发散）";if(x===-Infinity)return"−∞（概率严格为 0）";if(typeof x!=="number"||!Number.isFinite(x))throw Error("invalid display");if(x===0)return"0";if(Math.abs(x)<.0001||Math.abs(x)>=100000)return x.toExponential(6);return String(Number(x.toPrecision(7)));}
function prob(log){if(log===null)return"未计算";if(log===-Infinity)return"0（严格为 0）";var v=Math.exp(log);return v===0?"浮点下溢；请读 ln P":fmt(v);}
function selfTest(){var n=0;function ck(v){n++;if(!v)throw Error("self "+n);}ck(logMGF("heavy",1e-15)===Infinity);ck(logMGF("heavy",0)===0);ck(normalLogTwoTail(40)<-800&&Number.isFinite(normalLogTwoTail(40)));ck(rademacherLogTail(4,3)===Math.log(.125));ck(rademacherLogTail(4,4+Number.EPSILON*4)===-Infinity);ck(binomial({}).rows.length===33);ck(Math.abs(shell({}).sample.logActual)<100);ck(shell({deviation:0}).sample.logActual===0);return{status:"PASS",checks:n};}
function ledgers(s){
var c=s.config,list=[],summary;
function table(key,title,headers,rows){list.push({key:key,title:title,headers:headers,rows:rows,detail:true});}
if(c.mode==="models"){
summary=[["模型",MODELS[c.model],"全部模型已中心化"],["单变量 Var(X)",s.variance,"实际二阶中心矩"],["MGF 代理 K²",s.proxyVariance,"Uniform 使用最优 1/3；不是 ψ₂ 范数平方"],["依赖结构",c.dependence==="independent"?"独立同分布":"X₁=⋯=X_n，同一个随机量","后者 Var(S)=n² Var(X)"],["n",c.n,"和 S=X₁+⋯+X_n"],["Var(S)",s.sumVariance,"由实际依赖结构计算"],["和阈值 t",c.threshold,"事件 |S|≥t"],["和的模型尾",prob(s.sumLogActual),"只有明确已计算的解析模型才给数"],["ln P(|S|≥t)",s.sumLogActual,"有限负数与 −∞ 严格零分开"],["适用的 MGF 尾界",prob(s.sumLogBound),"按实际独立/共用结构选择 nK² 或 n²K²"],["ln 单事件界",s.sumLogBound,"概率上界截断为 1"],["m 事件 union bound",prob(s.unionLogBound),"只用概率可加性，不需要事件独立"],["错误代入独立公式",prob(s.wrongIndependentLogBound),"仅作反例；共享变量时不是有效证书"]];
table("models","五种模型在当前 λ 和单变量阈值的对照",["模型","方差","MGF代理 K²","ln MGF(λ)","ln P(|X|≥t₀)","P(|X|≥t₀)"],s.comparison.map(function(r){return[MODELS[r.model],r.variance,r.proxy,r.logMGF,r.logTail,prob(r.logTail)];}));
table("mgf","全部 λ 节点：函数值和两个常数口径",["λ","ln MGF","最优代理 K²λ²/2","Uniform 范围证书 λ²/2"],s.lambdaRows.map(function(r){return[r.lambda,r.logMGF,r.logEnvelope,r.logRangeEnvelope];}));
table("tails","全部单变量阈值：真实尾与有效上界",["t₀","ln P","P","ln 界","概率界"],s.tailRows.map(function(r){return[r.t,r.logActual,prob(r.logActual),r.logBound,prob(r.logBound)];}));
if(s.binomial)table("rademacher","Rademacher 和的全部二项式质量",["k（+1 的个数）","S=2k−n","ln 原质量","ln 归一化质量","概率质量","|S|≥t?"],s.binomial.rows.map(function(r){return[r.k,2*r.k-c.n,r.logRaw,r.logMass,prob(r.logMass),Math.abs(2*r.k-c.n)>=c.threshold?"计入":"不计入"];}));
}else if(c.mode==="binomial"){
var r=s.sample;summary=[["模型","B∼Bin(n,p)","独立 Bernoulli 之和；真实 p 是模型输入"],["n / p",c.n+" / "+c.p,"p 输入到小数点后四位"],["事件","B≥"+c.count,"整数计数，保留 ≥ 边界"],["均值 np",s.mean,"偏差 t=k−np"],["方差 np(1−p)",s.variance,"不能将估计方差无说明地代替真方差"],["中心变量的 |X| 上界 M",s.boundM,"max(p,1−p)"],["模型概率",prob(r.logUpper),"完整二项式尾，未用正态近似"],["ln 模型概率",r.logUpper,"下溢时仍保留对数"],["Hoeffding",prob(r.logHoeffding),"单侧；只使用范围宽 1"],["Bernstein",prob(r.logBernstein),"单侧；使用真方差与 M"],["优化 Chernoff/KL",prob(r.logKL),"单侧；使用完整 Bernoulli MGF"],["m 事件 KL union",prob(r.logUnion),"min(1,m×界)，不是精确并集概率"],["浮点 log 归一化量",s.logNormalizer,"原始 log 质量归一化的数值修正；不是误差证书"]];
table("binomial","从 0 到 n 的全部质量、尾概率与上界",["k","t=k−np","ln 原质量","ln 归一化质量","ln P(B<k)","ln P(B≥k)","ln Hoeffding","ln Bernstein","ln KL","ln union"],s.rows.map(function(r){return[r.k,r.deviation,r.logRaw,r.logMass,r.logLowerBefore,r.logUpper,r.logHoeffding,r.logBernstein,r.logKL,r.logUnion];}));
}else{
var r=s.sample;summary=[["维数 d",c.dimension,"本精确算例只取偶数，2–512"],["独立 Gaussian 的 √d",s.root,"不是 E‖G‖ 的精确值"],["径向密度众数 √(d−1)",s.radialMode,"与原点处最高的向量点密度分开"],["壳厚 t",c.deviation,"事件 |‖X‖−√d|≥t"],["独立 Gaussian 精确概率",prob(r.logActual),"χ² 分布的下尾+上尾"],["ln 精确概率",r.logActual,"使用稳定不完全 Gamma 算法"],["Gaussian 有效尾界",prob(r.logBound),"min(1,2e^(−t²/2))"],["共用一个 Gaussian 的概率",prob(r.logShared),"X=(Z,…,Z)；每坐标方差 1，但不独立"],["Rademacher 向量概率",prob(r.logRademacher),"‖X‖恒等于√d；t=0的≥事件概率1"],["下 / 上半径",r.lowerRadius+" / "+r.upperRadius,"下半径截在0；不是删去下尾"],["下尾迭代次数",r.lowerIterations,"收敛停止是数值准则"],["上尾迭代次数",r.upperIterations,"不把有限迭代当严格实数证书"]];
table("shell","全部壳厚：两个独立尾、相关反例和有效界",["t","下半径","上半径","ln 下尾","ln 上尾","ln 独立总尾","ln Gaussian界","ln 共用Z","ln Rademacher","下迭代","上迭代"],s.rows.map(function(r){return[r.t,r.lowerRadius,r.upperRadius,r.logLower,r.logUpper,r.logActual,r.logBound,r.logShared,r.logRademacher,r.lowerIterations,r.upperIterations];}));
table("radial","全部半径：径向概率密度与向量点密度",["r","ln 径向密度","径向密度","ln 向量点密度"],s.radial.map(function(r){return[r.r,r.logDensity,r.density,r.logPointDensity];}));
}
list.unshift({key:"summary",title:MODES[c.mode],headers:["项目","数值 / 结论","条件与口径"],rows:summary,detail:false});return list;
}
function plots(s){
var out=[],colors=["#3979b8","#b16b18","#398664"];
function make(key,title,xlabel,xs,ss,zero){
var lo=zero?0:Infinity,hi=-Infinity,series=ss.map(function(r,i){var values=r[2].map(function(v){return v===null||!Number.isFinite(v)?null:v;});values.forEach(function(v){if(v!==null){lo=Math.min(lo,v);hi=Math.max(hi,v);}});return{key:r[0],label:r[1],values:values,pointsOnly:!!r[3],color:colors[i],dash:i===1?"7 4":i===2?"3 4":""};});
if(lo===Infinity||hi===-Infinity){lo=0;hi=1;}var span=hi-lo;if(span<1e-10*Math.max(1,Math.abs(hi))){span=Math.max(1,.1*Math.abs(hi));var mid=(lo+hi)/2;lo=mid-span/2;hi=mid+span/2;}
out.push({key:key,title:title,xlabel:xlabel,xs:xs,series:series,xmin:xs[0],xmax:xs[xs.length-1],ymin:zero&&lo>=0?0:lo-.07*span,ymax:hi+.08*span});
}
if(s.config.mode==="models"){
make("mgf","MGF 的对数：常数与定义域","λ；纵轴 ln E exp(λX)；∞ 节点见表",s.lambdaRows.map(function(r){return r.lambda;}),[["actual","模型 log MGF",s.lambdaRows.map(function(r){return r.logMGF;})],["proxy","最优 Gaussian 代理",s.lambdaRows.map(function(r){return r.logEnvelope;})],["range","Uniform 范围级代理",s.lambdaRows.map(function(r){return r.logRangeEnvelope;})]],true);
make("tail","同一尺度下，真实尾概率并不相同","t₀；纵轴 P(|X|≥t₀)；离散模型只画点",s.tailRows.map(function(r){return r.t;}),[["actual","真实分布的数值尾",s.tailRows.map(function(r){return Math.exp(r.logActual);}),s.config.model==="rademacher"],["bound","适用的最优代理尾界",s.tailRows.map(function(r){return r.logBound===null?null:Math.exp(r.logBound);})]],true);
}else if(s.config.mode==="binomial"){
make("binomial-tail","完整离散计数：尾概率与三种单侧界","整数 k；纵轴 ln P(B≥k) 或 ln 上界",s.rows.map(function(r){return r.k;}),[["actual","完整二项式尾（离散点）",s.rows.map(function(r){return r.logUpper;}),true],["hoeffding","Hoeffding 范围界",s.rows.map(function(r){return r.logHoeffding;}),true],["bernstein","Bernstein 方差界",s.rows.map(function(r){return r.logBernstein;}),true],["kl","Chernoff/KL",s.rows.map(function(r){return r.logKL;}),true]],false);
out[0].series[3].color="#8c5cb0";
}else{
make("radial","点密度最高处，不是径向概率最多处","r；纵轴径向密度 f_R(r)",s.radial.map(function(r){return r.r;}),[["density","独立 Gaussian 径向密度",s.radial.map(function(r){return r.density;})]],true);
make("shell","薄壳集中需要检查坐标依赖","壳厚 t；纵轴 ln P(|‖X‖−√d|≥t)",s.rows.map(function(r){return r.t;}),[["actual","独立 Gaussian 精确分布数值",s.rows.map(function(r){return r.logActual;})],["bound","只对独立 Gaussian 适用的界",s.rows.map(function(r){return r.logBound;})],["shared","共用一个 Z 的相关反例",s.rows.map(function(r){return r.logShared;})]],false);
}
out.forEach(function(p){if(p.key==="binomial-tail"||p.key==="shell")p.ymax=0;if(p.key==="tail")p.ymax=1;});return out;
}
function inject(doc){if(doc.getElementById("sg-full-style"))return;var style=doc.createElement("style");style.id="sg-full-style";style.textContent=[
".sg-lab{color:var(--fg);max-width:100%;min-width:0;line-height:1.65}.sg-lab *{box-sizing:border-box}.sg-lab [hidden]{display:none!important}.sg-lab button,.sg-lab input,.sg-lab select{font:inherit;max-width:100%;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;min-height:44px;padding:8px}.sg-lab button{cursor:pointer}.sg-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.sg-lab button:disabled{opacity:.55;cursor:default}.sg-lab :focus-visible{outline:3px solid var(--accent);outline-offset:2px}",
".sg-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:15px 0}.sg-controls label,.sg-mode{display:grid;gap:5px}.sg-lab fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--border)}.sg-choices,.sg-actions{display:flex;gap:8px;flex-wrap:wrap}.sg-choices>*{flex:1 1 180px}.sg-note{padding:10px 12px;border-left:3px solid var(--accent)}.sg-feedback{min-height:2em}",
".sg-results h4{margin-top:24px}.sg-results figure{margin:15px 0}.sg-region{max-width:100%;overflow-x:auto;margin:12px 0}.sg-lab svg.sg-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;height:auto;color:var(--fg)}.sg-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.sg-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:13px}.sg-legend span{display:inline-flex;align-items:center;gap:5px}.sg-legend i{width:24px;border-top:3px solid}.sg-lab table{border-collapse:collapse;min-width:900px;font-size:13px}.sg-lab th,.sg-lab td{padding:8px;border:1px solid var(--border);white-space:nowrap;text-align:left}.sg-lab caption{padding:8px;font-weight:bold}.sg-lab details{margin:16px 0}.sg-lab summary{cursor:pointer;min-height:44px;padding:8px}@media(max-width:600px){.sg-controls{grid-template-columns:minmax(0,1fr)}}"
].join("\n");doc.head.append(style);}
function drawPlot(doc,d,id){
var ns="http://www.w3.org/2000/svg";function el(tag,attrs,text){var e=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});if(text!==undefined)e.textContent=text;return e;}
var svg=el("svg",{class:"sg-chart",viewBox:"0 0 900 390",role:"img","data-plot":d.key,"aria-labelledby":id+"-title "+id+"-desc"}),x=function(v){return 120+740*(v-d.xmin)/(d.xmax-d.xmin);},y=function(v){return 290-230*(v-d.ymin)/(d.ymax-d.ymin);};
svg.append(el("title",{id:id+"-title"},d.title),el("desc",{id:id+"-desc"},"轴上数值含义写在标签中。每个有限节点都保留；发散、不适用和负无穷值不伪造有限坐标，在表中逐项标明。离散计数只画点。"),el("text",{x:120,y:28,"font-size":18},d.title));
for(var i=0;i<=4;i++){var v=d.ymin+(d.ymax-d.ymin)*i/4,xx=d.xmin+(d.xmax-d.xmin)*i/4;svg.append(el("line",{x1:120,x2:860,y1:y(v),y2:y(v),stroke:"currentColor",opacity:.18}),el("text",{x:108,y:y(v)+5,"text-anchor":"end","font-size":13},fmt(v)),el("text",{x:x(xx),y:320,"text-anchor":i===0?"start":i===4?"end":"middle","font-size":13},fmt(xx)));}
svg.append(el("text",{x:860,y:355,"text-anchor":"end","font-size":14},d.xlabel));
d.series.forEach(function(r){var chunks=[],part=[];r.values.forEach(function(v,i){if(v===null){if(part.length)chunks.push(part);part=[];return;}part.push([x(d.xs[i]),y(v)]);svg.append(el("circle",{"data-series":r.key,"data-index":i,cx:x(d.xs[i]),cy:y(v),r:r.pointsOnly?2.2:1.5,fill:r.color}));});if(part.length)chunks.push(part);if(!r.pointsOnly)chunks.forEach(function(a,j){svg.append(el("polyline",{"data-series":r.key,"data-chunk":j,points:a.map(function(v){return v.join(",");}).join(" "),fill:"none",stroke:r.color,"stroke-width":2,"stroke-dasharray":r.dash}));});});return svg;
}
function mount(container){
if(!container||container.getAttribute("data-sg-mounted")==="true")return;container.setAttribute("data-sg-mounted","true");var doc=container.ownerDocument;inject(doc);var id="sg-full-"+(++INSTANCE),selected=[null,null,null,null,null],c=Object.assign({},DEFAULTS);
function input(key,label,min,max,step){return'<label>'+label+'<input type="number" data-key="'+key+'" min="'+min+'" max="'+max+'" step="'+(step||"any")+'" value="'+DEFAULTS[key]+'"></label>';}
function select(key,label,items){return'<label>'+label+'<select data-key="'+key+'">'+Object.keys(items).map(function(k){return'<option value="'+k+'"'+(DEFAULTS[key]===k?' selected':'')+'>'+items[k]+'</option>';}).join("")+'</select></label>';}
function group(mode,title,controls){return'<details data-controls="'+mode+'"'+(mode==="models"||mode==="common"?" open":"")+'><summary>'+title+'</summary><div class="sg-controls">'+controls+'</div></details>';}
container.innerHTML='<div class="sg-lab"><h3>从尾概率到样本量：常数、依赖与高维几何</h3>'+select("mode","实验场景",MODES)+
group("common","和与计数的公共参数",input("n","变量数 / 试验数 n（1–512）",1,512,1)+input("events","同时保护的事件数 m（1–10000）",1,10000,1))+
group("models","MGF 与独立性：参数",select("model","中心化分布",MODELS)+select("dependence","和的依赖结构",{independent:"独立同分布",shared:"所有 Xᵢ 共用同一个 X"})+input("threshold","和的绝对偏差阈值 t（0–512）",0,512)+input("lambda","MGF 参数 λ（−20–20）",-20,20)+input("singleThreshold","单变量绝对尾阈值 t₀（0–20）",0,20))+
group("binomial","稀有计数：参数",input("p","成功概率 p（0–1，最多四位小数）",0,1,.0001)+input("count","上尾事件 B≥k 的整数 k（0–n）",0,512,1))+
group("shell","高维薄壳：参数",input("dimension","偶数维度 d（2–512）",2,512,2)+input("deviation","绝对壳厚 t（0–20）",0,20))+
'<p class="sg-note">模型尾概率是指定分布的数值计算；上界另列所需假设。ln P 为有限负数时，即使概率数值下溢，也不等于事件不可能。</p>'+
[["1. 同样的 MGF 代理 K，真实尾概率必须相同吗？",["不必相同","必须相同"]],["2. 重尾模型在 λ=10⁻¹⁵ 时的 MGF？",["仍然发散","近零就等于 1"]],["3. X₁=⋯=X_n 时，和的方差怎样缩放？",["n² Var(X)","n Var(X)"]],["4. 稀有 Bernoulli 计数，Bernstein 永远比 Hoeffding 紧吗？",["需要比较偏差大小","永远更紧"]],["5. m 事件的 union bound 需要独立吗？",["不需要","需要"]]].map(function(q,i){return'<fieldset data-question="'+i+'"><legend>'+q[0]+'</legend><div class="sg-choices">'+q[1].map(function(a,j){return'<button type="button" data-choice="'+j+'" aria-pressed="false">'+a+'</button>';}).join("")+'</div></fieldset>';}).join("")+
'<div class="sg-actions"><button type="button" data-action="submit" disabled>核对五项预测并揭示结果</button><button type="button" data-action="reset">重置实验</button></div><p class="sg-feedback" role="status" aria-live="polite"></p><div class="sg-results" hidden><h4 tabindex="-1">函数、概率与条件账本</h4><div data-content></div></div></div>';
var lab=container.querySelector(".sg-lab"),results=lab.querySelector(".sg-results"),submit=lab.querySelector('[data-action="submit"]'),feedback=lab.querySelector(".sg-feedback"),content=lab.querySelector("[data-content]");
function read(){var o={},bad=null;lab.querySelectorAll("[data-key]").forEach(function(e){var k=e.getAttribute("data-key");if(e.tagName==="SELECT")o[k]=e.value;else{if(e.value.trim()===""||!e.validity.valid)bad=bad||e;o[k]=Number(e.value);}});if(bad){bad.closest("details").open=true;throw Error(bad.parentElement.firstChild.textContent+"：保留输入，请修正");}if(o.count>o.n){lab.querySelector('[data-controls="binomial"]').open=true;lab.querySelector('[data-controls="common"]').open=true;throw Error("计数阈值 k 不能超过试验数 n");}return config(o);}
function region(title){var r=doc.createElement("div");r.className="sg-region";r.setAttribute("role","region");r.tabIndex=0;r.setAttribute("aria-label",title+"，可左右滚动");return r;}
function table(d){var r=region(d.title),t=doc.createElement("table"),caption=doc.createElement("caption"),head=doc.createElement("thead"),tr=doc.createElement("tr"),body=doc.createElement("tbody");t.setAttribute("data-table",d.key);caption.textContent=d.title;t.append(caption);d.headers.forEach(function(x){var th=doc.createElement("th");th.scope="col";th.textContent=x;tr.append(th);});head.append(tr);t.append(head);d.rows.forEach(function(row){var tr=doc.createElement("tr");row.forEach(function(x){var td=doc.createElement("td");td.textContent=typeof x==="number"||x===null?fmt(x):x;tr.append(td);});body.append(tr);});t.append(body);r.append(t);if(d.detail){var details=doc.createElement("details"),summary=doc.createElement("summary");summary.textContent="展开 "+d.rows.length+" 行："+d.title;details.append(summary,r);content.append(details);}else content.append(r);}
function render(){var s=snapshot(c),tables=ledgers(s);content.replaceChildren();table(tables[0]);var note=doc.createElement("p");note.className="sg-note";
note.textContent=c.mode==="models"?"五种模型各自有明确的 MGF 定义域。Uniform 的 1/3 是本模型最优代理方差，范围级证书仍为 1。独立 Uniform/Laplace/重尾和在 n>1 时未计算真实卷积，不能把空项猜成 0。MGF 的无穷值与不适用证书不画有限线；所有节点在表中保留。":c.mode==="binomial"?"所有 k=0,…,n 都保留，图只画离散点。k≤np 时三种上界均取 1。p=0 或 1 的确定性模型直接处理。二项式质量采用 log 算法并公开归一化量；这些比较依赖输入的真 p，不能拿它给未知 p 的数据直接认证。":"Gaussian 薄壳来自独立坐标的 χ² 分布。共用一个 Z 的向量每个坐标方差仍为 1，却不满足独立性。Rademacher 范数恒定，t>0 时概率严格为 0；这些 −∞ 不伪造为图上的有限负数。径向密度包含球面体积因素，不能与向量点密度混同。";
content.append(note);plots(s).forEach(function(d,i){var figure=doc.createElement("figure"),r=region(d.title),caption=doc.createElement("figcaption");r.append(drawPlot(doc,d,id+"-"+i));caption.className="sg-legend";d.series.forEach(function(s){var span=doc.createElement("span"),line=doc.createElement("i");line.style.borderColor=s.color;if(s.dash)line.style.borderTopStyle="dashed";span.append(line,doc.createTextNode(s.label+(s.values.some(function(v){return v===null;})?"（非有限/不适用项见表）":"")));caption.append(span);});figure.append(r,caption);content.append(figure);});tables.slice(1).forEach(table);results.hidden=false;}
function complete(){return selected.every(function(x){return x!==null;});}
function state(){var ok=true;try{c=read();}catch(e){ok=false;results.hidden=true;feedback.textContent="输入无效："+e.message;}submit.disabled=!ok||!complete()||!results.hidden;return ok;}
lab.querySelectorAll("[data-choice]").forEach(function(b){b.addEventListener("click",function(){var f=b.closest("[data-question]"),i=Number(f.getAttribute("data-question"));selected[i]=Number(b.getAttribute("data-choice"));f.querySelectorAll("[data-choice]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});results.hidden=true;if(state())feedback.textContent=complete()?"五项已填，请点击核对。":"请完成五项预测。";});});
lab.querySelectorAll("[data-key]").forEach(function(e){e.addEventListener(e.tagName==="SELECT"?"change":"input",function(){var visible=!results.hidden;if(e.getAttribute("data-key")==="mode")lab.querySelectorAll("[data-controls]").forEach(function(d){d.open=d.getAttribute("data-controls")==="common"||d.getAttribute("data-controls")===e.value;});if(state()){if(visible){render();submit.disabled=true;}else feedback.textContent=complete()?"输入已恢复，请手动核对。":"请先完成五项预测。";}});});
submit.addEventListener("click",function(){if(!state()||!complete())return;render();submit.disabled=true;feedback.textContent="预测 "+selected.filter(function(x){return x===0;}).length+" / 5。请对照定义域、依赖结构和误差口径。";results.querySelector("h4").focus();});
lab.querySelector('[data-action="reset"]').addEventListener("click",function(){selected=[null,null,null,null,null];lab.querySelectorAll("[data-choice]").forEach(function(b){b.setAttribute("aria-pressed","false");});lab.querySelectorAll("[data-key]").forEach(function(e){e.value=String(DEFAULTS[e.getAttribute("data-key")]);});lab.querySelectorAll("[data-controls]").forEach(function(d){d.open=["models","common"].includes(d.getAttribute("data-controls"));});results.hidden=true;state();feedback.textContent="已复位，请重新预测。";lab.querySelector("[data-choice]").focus();});state();
}

return{MODES:MODES,MODELS:MODELS,DEFAULTS:DEFAULTS,config:config,models:models,binomial:binomial,shell:shell,snapshot:snapshot,normalLogTwoTail:normalLogTwoTail,logMGF:logMGF,singleLogTail:singleLogTail,rademacherLogTail:rademacherLogTail,binomialRows:binomialRows,bernoulliKL:bernoulliKL,fmt:fmt,prob:prob,selfTest:selfTest,ledgers:ledgers,plots:plots,mount:mount};
});
