(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("physics-inverse-uncertainty",api.mount);
})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const DEFAULTS={mode:"inverse",transmission:.05,contrast:1,priorContrast:0,priorMean:0,widthTrue:.14,widthFit:.14,sigmaData:.05,sigmaFit:.05,lambda:.03,order:1,seed:20260911,draws:64};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+" 必须是数值");
 if(typeof v==="string"&&!v.trim())throw Error(key+" 不能为空");
 const n=Number(v);if(!Number.isFinite(n)||n<lo||n>hi||(integer&&!Number.isInteger(n)))throw Error(key+" 超出范围或不是所需整数");
 if(n===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(key+" 非零输入下溢");return n;
}
function config(raw={}){
 if(!raw||Array.isArray(raw)||typeof raw!=="object")throw Error("参数必须是对象");
 const s=Object.assign({},DEFAULTS,raw);if(!["contrast","inverse","risk"].includes(s.mode))throw Error("未知模型");
 s.sigmaData=num(s.sigmaData,"数据噪声σdata",0,.2);if(s.sigmaData!==0&&s.sigmaData<.001)throw Error("σdata需为0或0.001–0.2");
 s.sigmaFit=num(s.sigmaFit,"假设噪声σfit",.01,.2);
 s.lambda=num(s.lambda,"λ",1e-5,100);s.priorMean=num(s.priorMean,"先验均值", -1,1);s.seed=num(s.seed,"seed",0,4294967295,true);
 if(s.mode==="contrast"){
  s.transmission=num(s.transmission,"对比传输κ",0,1);if(s.transmission!==0&&s.transmission<1e-6)throw Error("κ需为0或10⁻⁶–1");
  s.contrast=num(s.contrast,"真实对比", -2,2);s.priorContrast=num(s.priorContrast,"先验对比", -2,2);
 }else{
  s.widthTrue=num(s.widthTrue,"真实核宽度",.06,.25);s.widthFit=num(s.widthFit,"假设核宽度",.06,.25);
  s.order=num(s.order,"差分阶数",0,2,true);
  s.draws=num(s.draws,"后验复制次数",16,128,true);
 }
 return s;
}
function sum(xs){let z=0,c=0;for(const x of xs){const y=x-c,t=z+y;c=(t-z)-y;z=t;}return z;}
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const matvec=(A,v)=>A.map(r=>dot(r,v));
const matmul=(A,B)=>{const bt=transpose(B);return A.map(r=>bt.map(c=>dot(r,c)));};
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
function cholesky(A){
 const n=A.length,L=Array.from({length:n},()=>Array(n).fill(0));
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
  const v=A[i][j]-sum(Array.from({length:j},(_,k)=>L[i][k]*L[j][k]));
  if(i===j){if(!(v>0)||!Number.isFinite(v))throw Error("精度矩阵Cholesky失效，不能伪造正方差");L[i][j]=Math.sqrt(v);}
  else L[i][j]=v/L[j][j];
 }return L;
}
function forward(L,b){const x=[];for(let i=0;i<b.length;i++)x[i]=(b[i]-sum(x.map((v,j)=>L[i][j]*v)))/L[i][i];return x;}
function backward(L,b){const x=Array(b.length).fill(0);for(let i=b.length-1;i>=0;i--)x[i]=(b[i]-sum(x.slice(i+1).map((v,j)=>L[i+1+j][i]*v)))/L[i][i];return x;}
const solve=(L,b)=>backward(L,forward(L,b));
function householder(A){
 const m=A.length,n=A[0].length,U=A.map(r=>r.slice()),Qt=eye(m),steps=[];
 for(let k=0;k<n;k++){
  const v=U.slice(k).map(r=>r[k]),norm=Math.hypot(...v);
  if(!(norm>0)||!Number.isFinite(norm))throw Error("增广矩阵QR秩失效");
  const alpha=v[0]>=0?-norm:norm;v[0]-=alpha;const vnorm=Math.hypot(...v);for(let i=0;i<v.length;i++)v[i]/=vnorm;
  for(let j=k;j<n;j++){const projection=2*sum(v.map((x,i)=>x*U[k+i][j]));for(let i=0;i<v.length;i++)U[k+i][j]-=projection*v[i];}
  for(let j=0;j<m;j++){const projection=2*sum(v.map((x,i)=>x*Qt[k+i][j]));for(let i=0;i<v.length;i++)Qt[k+i][j]-=projection*v[i];}
  // Exact structural zeros are consequences of the reflector, not a rank cutoff.
  U[k][k]=alpha;for(let i=k+1;i<m;i++)U[i][k]=0;
  steps.push({k,norm,alpha,vector:v.slice()});
 }
 for(let i=0;i<n;i++)if(U[i][i]<0){U[i]=U[i].map(x=>-x);Qt[i]=Qt[i].map(x=>-x);}
 return{upper:U.slice(0,n),Qt:Qt.slice(0,n),steps};
}
function noiseStream(seed){
 let state=seed;const rows=[];
 function next(){state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/4294967296;}
 return{rows,normal(stage,index){
  const u=next(),state1=state,v=next(),state2=state,z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  rows.push({i:rows.length+1,stage,index,u,v,z,state1,state2});return z;
 },get state(){return state;},get calls(){return 2*rows.length;}};
}
function kernel(width,positions,n=16){
 return positions.map(x=>{const raw=Array.from({length:n},(_,i)=>Math.exp(-.5*((x-i/(n-1))/width)**2)),z=sum(raw);return raw.map(v=>v/z);});
}
function regularizer(n,order){
 const D=order===0?eye(n):Array.from({length:n-order},(_,i)=>Array.from({length:n},(_,j)=>order===1?(j===i?-1:j===i+1?1:0):(j===i?1:j===i+1?-2:j===i+2?1:0)));
 const R=matmul(transpose(D),D).map((r,i)=>r.map((v,j)=>v+(i===j?.001:0)));return{D,R};
}
function trueSource(i,n=16){const x=i/(n-1);return .15+.95*Math.exp(-.5*((x-.28)/.075)**2)+.7*Math.exp(-.5*((x-.73)/.11)**2);}
function posterior(K,R,y,m0,sigma,lambda){
 const n=m0.length,kt=transpose(K),precision=matmul(kt,K).map((r,i)=>r.map((v,j)=>v/(sigma*sigma)+lambda*R[i][j]));
 const priorRoot=cholesky(R),augmented=[...K.map(r=>r.map(v=>v/sigma)),...transpose(priorRoot).map(r=>r.map(v=>Math.sqrt(lambda)*v))],qr=householder(augmented),L=transpose(qr.upper);
 const priorPrediction=matvec(K,m0),augmentedRhs=[...y.map((v,i)=>(v-priorPrediction[i])/sigma),...Array(n).fill(0)],projected=matvec(qr.Qt,augmentedRhs),
  rhs=matvec(kt,y.map((v,i)=>(v-priorPrediction[i])/(sigma*sigma))),shift=backward(L,projected),mean=m0.map((v,i)=>v+shift[i]);
 const inverseL=transpose(eye(n).map(e=>forward(L,e))),covariance=matmul(transpose(inverseL),inverseL),
  gain=transpose(K.map((_,j)=>backward(L,qr.Qt.map(row=>row[j]/sigma))));
 const fitted=matvec(K,mean),residuals=y.map((v,i)=>v-fitted[i]),posteriorResidual=matvec(precision,shift).map((v,i)=>v-rhs[i]);
 return{precision,L,inverseL,covariance,gain,rhs,shift,mean,fitted,residuals,posteriorResidual,priorRoot,augmented,augmentedRhs,projected,qr,
  residualNorm:Math.sqrt(dot(residuals,residuals)),penalty:dot(shift,matvec(R,shift)),
  objective:dot(residuals,residuals)/(sigma*sigma)+lambda*dot(shift,matvec(R,shift))};
}
function predictive(K,post,sigma){
 const means=matvec(K,post.mean),factors=K.map(row=>forward(post.L,row));
 return means.map((mean,i)=>{const latentVariance=dot(factors[i],factors[i]),variance=latentVariance+sigma*sigma;return{i,mean,latentVariance,variance,latentLow:mean-1.96*Math.sqrt(latentVariance),latentHigh:mean+1.96*Math.sqrt(latentVariance),low:mean-1.96*Math.sqrt(variance),high:mean+1.96*Math.sqrt(variance)};});
}
function repeatedRisk(Ktrue,truth,m0,sigmaData,post){
 const dataMean=matvec(Ktrue,truth),fittedPrior=matvec(post.K,m0),expectedShift=matvec(post.gain,dataMean.map((v,i)=>v-fittedPrior[i])),mean=m0.map((v,i)=>v+expectedShift[i]),bias=mean.map((v,i)=>v-truth[i]);
 const covariance=matmul(post.gain,transpose(post.gain)).map(r=>r.map(v=>sigmaData*sigmaData*v));
 const rows=truth.map((x,i)=>({i,truth:x,expected:mean[i],bias:bias[i],biasSquared:bias[i]**2,samplingVariance:covariance[i][i],mse:bias[i]**2+covariance[i][i],posteriorVariance:post.covariance[i][i]}));
 return{mean,bias,covariance,rows,biasSquared:sum(rows.map(v=>v.biasSquared))/truth.length,variance:sum(rows.map(v=>v.samplingVariance))/truth.length,mse:sum(rows.map(v=>v.mse))/truth.length,posteriorVariance:sum(rows.map(v=>v.posteriorVariance))/truth.length};
}
function contrastModel(s){
 const k=s.transmission,K=[[(1+k)/2,(1-k)/2],[(1-k)/2,(1+k)/2]],truth=[1+s.contrast,1-s.contrast],m0=[s.priorMean+s.priorContrast,s.priorMean-s.priorContrast],g=noiseStream(s.seed),clean=matvec(K,truth);
 const data=clean.map((v,i)=>v+s.sigmaData*g.normal("data",i)),post=posterior(K,eye(2),data,m0,s.sigmaFit,s.lambda);post.K=K;
 const q=[[Math.SQRT1_2,Math.SQRT1_2],[Math.SQRT1_2,-Math.SQRT1_2]],yt=matvec(q,data),xt=matvec(q,truth),pt=matvec(q,m0),mt=matvec(q,post.mean);
 const modes=[1,k].map((transmission,i)=>{
  const denominator=transmission**2+s.lambda*s.sigmaFit**2,variance=s.sigmaFit**2/denominator,gain=transmission/denominator;
  return{i,transmission,data:yt[i],truth:xt[i],prior:pt[i],mean:mt[i],analyticMean:(transmission*yt[i]+s.lambda*s.sigmaFit**2*pt[i])/denominator,variance,gain,resolution:transmission*gain,leastSquares:transmission===0?null:yt[i]/transmission};
 });
 const family=Array.from({length:65},(_,i)=>{const c=-2+i/16,x=[1+c,1-c],y=matvec(K,x);return{i,contrast:c,x0:x[0],x1:x[1],y0:y[0],y1:y[1]};});
 const transmissions=Array.from({length:49},(_,i)=>10**(-6+i/8));if(k>0&&!transmissions.includes(k))transmissions.push(k);transmissions.sort((a,b)=>a-b);
 const study=transmissions.map(k=>({k,leastSquaresGain:1/k,regularizedGain:k/(k*k+s.lambda*s.sigmaFit*s.sigmaFit),resolution:k*k/(k*k+s.lambda*s.sigmaFit*s.sigmaFit)}));
 return{K,truth,m0,clean,data,post,modes,family,study,predictive:predictive(K,post,s.sigmaFit),risk:repeatedRisk(K,truth,m0,s.sigmaData,post),noise:g.rows,calls:g.calls,lastState:g.state};
}
function fieldModel(s){
 const n=16,positions=Array.from({length:n},(_,i)=>i/(n-1)),heldPositions=Array.from({length:15},(_,i)=>(i+.5)/15),
  Ktrue=kernel(s.widthTrue,positions),K=kernel(s.widthFit,positions),heldTrue=kernel(s.widthTrue,heldPositions),held=kernel(s.widthFit,heldPositions),truth=positions.map((_,i)=>trueSource(i)),m0=Array(n).fill(s.priorMean),g=noiseStream(s.seed);
 const clean=matvec(Ktrue,truth),heldClean=matvec(heldTrue,truth),data=clean.map((v,i)=>v+s.sigmaData*g.normal("training",i)),heldData=heldClean.map((v,i)=>v+s.sigmaData*g.normal("heldout",i)),{D,R}=regularizer(n,s.order);
 const post=posterior(K,R,data,m0,s.sigmaFit,s.lambda);post.K=K;
 const prediction=predictive(K,post,s.sigmaFit),heldPrediction=predictive(held,post,s.sigmaFit),risk=repeatedRisk(Ktrue,truth,m0,s.sigmaData,post);
 const drawRows=[],samples=[];let hits=0;
 for(let b=0;b<s.draws;b++){
  const z=Array.from({length:n},(_,i)=>g.normal("posterior-"+b,i)),shift=backward(post.L,z),x=post.mean.map((v,i)=>v+shift[i]),mu=matvec(K,x),noise=Array.from({length:n},(_,i)=>g.normal("replica-"+b,i)),replica=mu.map((v,i)=>v+s.sigmaFit*noise[i]);
  const obs=sum(data.map((v,i)=>((v-mu[i])/s.sigmaFit)**2))/n,rep=sum(replica.map((v,i)=>((v-mu[i])/s.sigmaFit)**2))/n,hit=rep>=obs;hits+=hit;
  drawRows.push({b,observed:obs,replicated:rep,hit});
  samples.push(...x.map((v,i)=>({b,i,z:z[i],shift:shift[i],x:v,prediction:mu[i],observed:data[i],replica:replica[i],replicaNoise:noise[i]})));
 }
 const ppc={rows:drawRows,samples,hits,draws:s.draws,pValue:hits/s.draws,observedMean:sum(drawRows.map(v=>v.observed))/s.draws,replicatedMean:sum(drawRows.map(v=>v.replicated))/s.draws,
  expectedObserved:(dot(post.residuals,post.residuals)+sum(prediction.map(v=>v.latentVariance)))/(n*s.sigmaFit*s.sigmaFit),expectedReplicated:1};
 const lambdas=Array.from({length:29},(_,i)=>10**(-5+i/4));if(!lambdas.includes(s.lambda))lambdas.push(s.lambda);lambdas.sort((a,b)=>a-b);
 const study=lambdas.map(lambda=>{
  const p=posterior(K,R,data,m0,s.sigmaFit,lambda);p.K=K;const r=repeatedRisk(Ktrue,truth,m0,s.sigmaData,p),differences=matvec(D,p.shift);
  return{lambda,residualNorm:p.residualNorm,differenceNorm:Math.sqrt(dot(differences,differences)),penaltyNorm:Math.sqrt(p.penalty),biasSquared:r.biasSquared,variance:r.variance,mse:r.mse,posteriorVariance:r.posteriorVariance,actualMSE:sum(p.mean.map((v,i)=>(v-truth[i])**2))/n};
 });
 return{positions,heldPositions,K,Ktrue,held,heldTrue,D,R,truth,m0,clean,data,heldClean,heldData,post,prediction,heldPrediction,risk,ppc,study,
  source:truth.map((v,i)=>({i,position:positions[i],truth:v,mean:post.mean[i],variance:post.covariance[i][i],low:post.mean[i]-1.96*Math.sqrt(post.covariance[i][i]),high:post.mean[i]+1.96*Math.sqrt(post.covariance[i][i])})),
  trainingCoverage:prediction.filter((v,i)=>data[i]>=v.low&&data[i]<=v.high).length,heldCoverage:heldPrediction.filter((v,i)=>heldData[i]>=v.low&&heldData[i]<=v.high).length,
  sourceMSE:sum(post.mean.map((v,i)=>(v-truth[i])**2))/n,noise:g.rows,calls:g.calls,lastState:g.state};
}
function snapshot(raw={}){const s=config(raw);return{config:s,result:s.mode==="contrast"?contrastModel(s):fieldModel(s)};}

const PRESETS=[
 {id:"default",label:"同数据：均值、区间与预测"},
 {id:"contrast",label:"两源：小奇异值放大噪声",mode:"contrast"},
 {id:"null",label:"真零空间：数据看不见对比",mode:"contrast",transmission:0},
 {id:"prior-null",label:"零空间改先验：预测不变",mode:"contrast",transmission:0,priorContrast:1},
 {id:"resolved",label:"两个方向都能看见",mode:"contrast",transmission:1},
 {id:"noise-mismatch",label:"固定数据，低估噪声",sigmaFit:.01},
 {id:"kernel-mismatch",label:"固定数据，写错前向核",widthFit:.25},
 {id:"weak",label:"弱正则化的代价",lambda:1e-5},
 {id:"strong",label:"强正则化也会带来偏差",lambda:100},
 {id:"risk",label:"重复实验方差不等于后验方差",mode:"risk"},
 {id:"noiseless",label:"无噪声数据仍可能有正则化偏差",mode:"risk",sigmaData:0},
 {id:"curvature",label:"换成二阶差分先验",order:2}
];
const QUESTIONS=[
 ["若两个不同的源产生完全相同的无噪声读数，仅提高浮点精度能分开它们吗？",["不能，这是前向映射的零空间","能，足够多位小数会恢复全部信息"],0,"零空间属于模型；数值精度不能创造缺失的测量。"],
 ["固定已有数据，只改变推断时假设的噪声，观测点应该跟着移动吗？",["不应该，改变的是推断模型","应该，噪声参数必须重画所有观测"],0,"实验将数据生成和推断设置分开；条件分析先固定所观察的数据。"],
 ["后验参数区间与新传感器读数的预测区间，是否只差一个名称？",["不是，新读数还包含新测量噪声","是，同一个误差条可在各空间通用"],0,"先用前向矩阵传播参数协方差，再加新噪声；参数和观测空间也不同。"],
 ["正则化让后验区间变窄，能否据此说固定真实源的重建MSE一定更小？",["不能，还要计入重复实验方差与偏差","能，区间越窄就必然越准确"],0,"条件后验方差、抽样方差与偏差分别回答不同问题。"]
];
function fmt(x){
 if(x===null||x===undefined)return "—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
function series(key,label,color,points,line=true){return{key,label,color,points,line};}
function plot(title,x,y,ss,xmin,xmax){
 const ys=ss.flatMap(s=>s.points.map(v=>v[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square:false,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result,B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb";
 if(s.mode==="contrast"){
  const q=plot("κ越小，直接反演越放大噪声；κ=0不画伪造倒数","log₁₀ κ（完整扫描点）","log₁₀ 噪声增益",[
   series("ls","最小二乘1/κ",R,p.study.map(v=>[Math.log10(v.k),Math.log10(v.leastSquaresGain)])),
   series("regularized","正则化κ/(κ²+λσ²)",B,p.study.map(v=>[Math.log10(v.k),Math.log10(v.regularizedGain)]))],-6,0);
  if(s.transmission>0)q.markers=[{x:Math.log10(s.transmission),label:"当前κ"}];
  return[
   plot("两个源：数据约束与先验选择同时存在","源编号","源值及约95%逐点后验区间",[
    series("truth","已知模拟真值",B,p.truth.map((v,i)=>[i,v])),
    series("prior","先验均值",V,p.m0.map((v,i)=>[i,v])),
    series("mean","后验均值",O,p.post.mean.map((v,i)=>[i,v])),
    series("low","逐点后验界限",G,p.post.mean.map((v,i)=>[i,v-1.96*Math.sqrt(p.post.covariance[i][i])])),
    series("high","逐点后验界限",G,p.post.mean.map((v,i)=>[i,v+1.96*Math.sqrt(p.post.covariance[i][i])]))],0,1),
   plot("保持源的平均为1，只改变两个源的对比","源对比 c，源为(1+c,1−c)","无噪声传感器值",[
    series("first","第一个传感器",B,p.family.map(v=>[v.contrast,v.y0])),
    series("second","第二个传感器",O,p.family.map(v=>[v.contrast,v.y1]))],-2,2),
   q,
   plot("对称与反对称模式：后验方差是否被数据压缩","模式0：平均；模式1：对比","log₁₀ 模式方差",[
    series("prior-variance","先验方差1/λ",V,p.modes.map(v=>[v.i,Math.log10(1/s.lambda)]),false),
    series("posterior-variance","解析后验方差",G,p.modes.map(v=>[v.i,Math.log10(v.variance)]),false)],0,1)
  ];
 }
 const source=plot("源空间：真值与约95%逐点后验区间","源网格位置","源值（没有施加非负约束）",[
  series("truth","模拟真值",B,p.source.map(v=>[v.position,v.truth])),
  series("mean","后验均值",O,p.source.map(v=>[v.position,v.mean])),
  series("low","逐点后验界限",G,p.source.map(v=>[v.position,v.low])),
  series("high","逐点后验界限",G,p.source.map(v=>[v.position,v.high]))],0,1);
 if(s.mode==="risk")return[
  source,
  plot("同一固定真源，反复生成新数据的理论风险","源网格位置","逐坐标平方误差",[
   series("bias","偏差²",O,p.risk.rows.map(v=>[p.positions[v.i],v.biasSquared])),
   series("variance","估计量的抽样方差",B,p.risk.rows.map(v=>[p.positions[v.i],v.samplingVariance])),
   series("mse","MSE=偏差²+抽样方差",R,p.risk.rows.map(v=>[p.positions[v.i],v.mse])),
   series("posterior","条件后验方差（不同对象）",G,p.risk.rows.map(v=>[p.positions[v.i],v.posteriorVariance]))],0,1),
  plot("固定数据生成过程，改变推断的λ","log₁₀ λ","每坐标平均平方量",[
   series("bias","理论偏差²",O,p.study.map(v=>[Math.log10(v.lambda),v.biasSquared])),
   series("variance","理论抽样方差",B,p.study.map(v=>[Math.log10(v.lambda),v.variance])),
   series("mse","理论MSE",R,p.study.map(v=>[Math.log10(v.lambda),v.mse])),
   series("posterior","条件后验方差",G,p.study.map(v=>[Math.log10(v.lambda),v.posteriorVariance]))],-5,2),
  plot("某一次重建误差，不等于重复实验的期望风险","log₁₀ λ","平均平方误差",[
   series("realized","本次实际MSE",O,p.study.map(v=>[Math.log10(v.lambda),v.actualMSE])),
   series("risk","理想重复实验MSE",B,p.study.map(v=>[Math.log10(v.lambda),v.mse]))],-5,2)
 ];
 const train=plot("观测空间：传播参数方差，再加新测量噪声","训练传感器位置","读数与约95%逐点区间",[
  series("data","固定的训练观测",R,p.data.map((v,i)=>[p.positions[i],v]),false),
  series("fit","后验预测均值",O,p.prediction.map(v=>[p.positions[v.i],v.mean])),
  series("latent-low","无噪声Kx界限",G,p.prediction.map(v=>[p.positions[v.i],v.latentLow])),
  series("latent-high","无噪声Kx界限",G,p.prediction.map(v=>[p.positions[v.i],v.latentHigh])),
  series("predictive-low","含新噪声的预测界限",B,p.prediction.map(v=>[p.positions[v.i],v.low])),
  series("predictive-high","含新噪声的预测界限",B,p.prediction.map(v=>[p.positions[v.i],v.high]))],0,1);
 const held=plot("未参与拟合的15个中点传感器，另有独立噪声","留出传感器位置","读数与约95%逐点预测区间",[
  series("held-data","留出观测（不参与推断）",R,p.heldData.map((v,i)=>[p.heldPositions[i],v]),false),
  series("held-mean","假设模型的预测",O,p.heldPrediction.map(v=>[p.heldPositions[v.i],v.mean])),
  series("held-low","含新噪声的预测界限",B,p.heldPrediction.map(v=>[p.heldPositions[v.i],v.low])),
  series("held-high","含新噪声的预测界限",B,p.heldPrediction.map(v=>[p.heldPositions[v.i],v.high]))],0,1);
 const max=Math.max(...p.ppc.rows.flatMap(v=>[v.observed,v.replicated]))*1.08;
 const ppc=plot("每点是一对：同一个后验源下比较观测与复制","Tobs：相对该后验源的观测偏差","Trep：相对同源的复制偏差",[
  series("identity","相等线",G,[[0,0],[max,max]]),
  series("ppc","全部成对复制",B,p.ppc.rows.map(v=>[v.observed,v.replicated]),false)],0,max);
 const curve=plot("L曲线使用完整R范数，差分半范数另列","log₁₀ ||x−m₀||R","log₁₀ ||Kx−y||₂",[
  series("lcurve","全部λ扫描点",R,p.study.map(v=>[Math.log10(v.penaltyNorm),Math.log10(v.residualNorm)]))],
  Math.min(...p.study.map(v=>Math.log10(v.penaltyNorm))),Math.max(...p.study.map(v=>Math.log10(v.penaltyNorm))));
 return[source,train,held,ppc,curve];
}
function ledgers(d){
 const s=d.config,p=d.result,post=p.post,rows=(vs,ks)=>vs.map(v=>ks.split(" ").map(k=>v[k])),table=(key,title,headers,rows)=>({key,title,headers,rows});
 const common=[["模式",s.mode],["初始seed",s.seed],["数据噪声σdata",s.sigmaData],["假设噪声σfit",s.sigmaFit],["λ",s.lambda],["先验平均",s.priorMean],["实际均匀数调用数",p.calls],["最终LCG状态",p.lastState],
  ["数据残差范数",post.residualNorm],["完整R惩罚平方范数",post.penalty],["目标函数值",post.objective],["正规方程残差最大绝对值",Math.max(...post.posteriorResidual.map(Math.abs))],
  ["重复实验平均偏差²",p.risk.biasSquared],["重复实验平均抽样方差",p.risk.variance],["重复实验MSE",p.risk.mse],["平均条件后验方差",p.risk.posteriorVariance]];
 const matrices={K:p.K,precision:post.precision,priorRoot:post.priorRoot,augmented:post.augmented,augmentedRhs:post.augmentedRhs.map(v=>[v]),projectedRhs:post.projected.map(v=>[v]),QRupper:post.qr.upper,Qt:post.qr.Qt,L:post.L,inverseL:post.inverseL,covariance:post.covariance,gain:post.gain,samplingCovariance:p.risk.covariance,...(s.mode==="contrast"?{}:{Ktrue:p.Ktrue,held:p.held,heldTrue:p.heldTrue,D:p.D,R:p.R})};
 const shared=[
  table("matrices","所有矩阵的每一项（索引从0）",["矩阵","行","列","数值"],Object.entries(matrices).flatMap(([key,A])=>A.flatMap((row,i)=>row.map((v,j)=>[key,i,j,v])))),
  table("solver","每个源坐标的QR求解与正规方程诊断",["i","先验均值","后验位移","后验均值","正规右端","正规残差"],p.m0.map((v,i)=>[i,v,post.shift[i],post.mean[i],post.rhs[i],post.posteriorResidual[i]])),
  table("reflectors","每一步Householder向量，含完整分量",["反射步骤k","相对分量i","列范数","目标对角alpha","单位向量分量"],post.qr.steps.flatMap(v=>v.vector.map((x,i)=>[v.k,i,v.norm,v.alpha,x]))),
  table("risk","固定真源重复数据的逐坐标理论风险",["i","真值","重复实验期望","偏差","偏差²","抽样方差","MSE","条件后验方差"],rows(p.risk.rows,"i truth expected bias biasSquared samplingVariance mse posteriorVariance")),
  table("noise","所有Box–Muller输入与32位整数状态",["正态序号","用途","局部索引","u","v","z","u后LCG状态","v后LCG状态"],rows(p.noise,"i stage index u v z state1 state2"))
 ];
 if(s.mode==="contrast")return[
  table("summary","同向模式可见，反向模式由κ决定",["量","值"],[...common,["κ",s.transmission],["真实对比",s.contrast],["先验对比",s.priorContrast],["数学秩",s.transmission===0?1:2]]),
  table("data","两个源与两个实际观测",["i","源真值","无噪声读数","实际观测","拟合值"],p.truth.map((v,i)=>[i,v,p.clean[i],p.data[i],post.fitted[i]])),
  table("modes","两个已知奇异方向的解析对照",["模式","传输奇异值","观测系数","真值系数","先验系数","QR后验系数","解析后验系数","解析后验方差","噪声增益","分辨因子","直接LS系数（κ0未定义）"],rows(p.modes,"i transmission data truth prior mean analyticMean variance gain resolution leastSquares")),
  table("family","全部65个同平均不同对比的无噪声源",["i","对比","源0","源1","观测0","观测1"],rows(p.family,"i contrast x0 x1 y0 y1")),
  table("transmissions","全部正传输扫描点；κ0的倒数未定义",["κ","直接LS增益","正则化增益","分辨因子"],rows(p.study,"k leastSquaresGain regularizedGain resolution")),
  ...shared
 ];
 return[
  table("summary","先固定数据，再比较推断模型",["量","值"],[...common,["真实核宽度",s.widthTrue],["假设核宽度",s.widthFit],["差分阶数",s.order],["本次源MSE",p.sourceMSE],["训练数据落在预测区间内的个数/16",p.trainingCoverage],["留出数据落在预测区间内的个数/15",p.heldCoverage],["后验复制对数",s.draws],["复制≥观测次数",p.ppc.hits],["PPC经验比例",p.ppc.pValue],["本次Tobs均值",p.ppc.observedMean],["解析E[Tobs|y]",p.ppc.expectedObserved],["本次Trep均值",p.ppc.replicatedMean],["理想E[Trep|y]",1]]),
  table("source","全部源坐标，约95%逐点条件后验区间",["i","位置","真值","后验均值","后验方差","下界","上界"],rows(p.source,"i position truth mean variance low high")),
  table("training","全部训练数据与两种观测空间区间",["i","位置","无噪声真读数","观测","拟合均值","无噪声方差","含噪声方差","无噪声下界","无噪声上界","新观测下界","新观测上界"],p.prediction.map(v=>[v.i,p.positions[v.i],p.clean[v.i],p.data[v.i],v.mean,v.latentVariance,v.variance,v.latentLow,v.latentHigh,v.low,v.high])),
  table("heldout","全部留出数据：未参与后验计算",["i","位置","无噪声真读数","留出观测","预测均值","无噪声方差","新观测方差","预测下界","预测上界"],p.heldPrediction.map(v=>[v.i,p.heldPositions[v.i],p.heldClean[v.i],p.heldData[v.i],v.mean,v.latentVariance,v.variance,v.low,v.high])),
  table("ppc","每对后验预测偏差及事件指示",["b","Tobs","Trep","Trep≥Tobs"],rows(p.ppc.rows,"b observed replicated hit")),
  table("posterior-samples","每次抽样的每个源/传感器分量",["b","i","后验标准正态z","源位移","后验源x","同源预测","训练观测","复制读数","复制标准正态"],rows(p.ppc.samples,"b i z shift x prediction observed replica replicaNoise")),
  table("study","全部λ扫描：同一数据与同一数据生成过程",["λ","残差范数","差分范数","完整R范数","理论偏差²","抽样方差","理论MSE","条件后验方差","本次MSE"],rows(p.study,"lambda residualNorm differenceNorm penaltyNorm biasSquared variance mse posteriorVariance actualMSE")),
  ...shared
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

 const STYLE=".inv142{color:var(--fg,#273646)}.inv142 .inv-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.inv142 label{display:flex;flex-direction:column;gap:6px}.inv142 input,.inv142 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.inv142 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.inv142 button[aria-pressed=true]{outline:3px solid #478aaa}.inv142 .inv-scroll{overflow:auto;max-width:100%;margin:16px 0}.inv142 .inv-scroll:focus{outline:3px solid #478aaa}.inv142 .inv-ledger{max-height:420px}.inv142 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.inv142 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.inv142 th,.inv142 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.inv142 .inv-error{color:#c74b39}.inv142 [hidden]{display:none!important}.inv142 fieldset{margin:16px 0;padding:12px}.inv142 details{margin:16px 0}.inv142 summary{cursor:pointer;font-weight:600}.inv142 .inv-legend{font-size:.95em}.inv142 .inv-note{line-height:1.7}.inv142 [hidden]{display:none!important}.inv142 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("inv142-style")){const style=doc.createElement("style");style.id="inv142-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="inv142"><h3>同一观测，哪些源特征真被数据约束？</h3><p>数据生成参数与推断假设分开设置。先预测，再对照源、传感器、先验和重复实验风险。</p><div class="inv-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="inv-controls"><label>模型<select data-key="mode"><option value="inverse">16源反演与后验预测</option><option value="contrast">两源可辨识性与精确零空间</option><option value="risk">固定真源的重复实验风险</option></select></label>'+
   field("sigmaData","数据噪声σdata（0或0.001–0.2）","contrast inverse risk")+field("sigmaFit","假设噪声σfit（0.01–0.2）","contrast inverse risk")+
   field("lambda","正则化λ（10⁻⁵–100）","contrast inverse risk")+field("priorMean","先验平均（−1–1）","contrast inverse risk")+
   field("seed","LCG种子（0–4294967295整数）","contrast inverse risk")+
   field("transmission","对比传输κ（0或10⁻⁶–1）","contrast")+field("contrast","真实两源对比（−2–2）","contrast")+
   field("priorContrast","先验两源对比（−2–2）","contrast")+
   field("widthTrue","真实Gaussian核宽度（0.06–0.25）","inverse risk")+field("widthFit","假设Gaussian核宽度（0.06–0.25）","inverse risk")+
   '<label data-modes="inverse risk">先验差分阶数<select data-key="order"><option value="0">零阶：幅度</option><option value="1">一阶：邻点差</option><option value="2">二阶：曲率差</option></select></label>'+
   field("draws","成对后验复制次数（16–128整数）","inverse risk")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="inv-error" role="alert"></p><p role="status"></p><div class="inv-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".inv-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={contrast:"两个已知奇异方向分别对应平均和对比。κ=0时，对比方向没有数据分辨率，直接LS系数未定义；解析后验仍由明确的正先验给出。QR数值结果与解析式分别入表，末位可能有舍入差异。先验对比不是新的传感器信息。",inverse:"训练和留出数据先由真实核与σdata生成；更改λ、σfit、假设核或先验不会移动这些观测。后验使用固定超参数的线性Gaussian模型。图中全部区间均为约95%逐点区间；未施加非负约束，不能把它们读成整条源函数的同时覆盖带。",risk:"这里的偏差、抽样方差和MSE是在固定真源下，理想独立Gaussian数据重复实验的解析量；没有假装运行许多seed。条件后验方差单列，二者不是同一个随机对象。一次实际误差也单列，不用它代替期望风险。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="inv-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="inv-scroll inv-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示当前量未定义，不表示0。求解采用增广最小二乘的Householder QR；正规矩阵用于核对，未用舍入阈值把小方向偷偷删掉。PPC经验比例是成对比较结果，不是模型正确概率，也不按经典p值均匀校准；0次或全部命中不能证明真实概率等于0或1。固定seed只重放有限伪随机实现。</p>';
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
 const a=snapshot({mode:"contrast",transmission:0}).result;
 ck(a.family.every(v=>v.y0===1&&v.y1===1),"exact null direction");
 ck(a.modes[1].leastSquares===null&&a.modes[1].variance===1/DEFAULTS.lambda,"null posterior variance is prior variance");
 const b=snapshot({mode:"contrast",transmission:0,priorContrast:1}).result;
 ck(Math.abs(b.modes[1].analyticMean-Math.SQRT2)<1e-12,"null mean follows prior");
 const c=snapshot({draws:16}).result,d=snapshot({draws:16,lambda:100,sigmaFit:.01,widthFit:.25}).result;
 ck(JSON.stringify(c.data)===JSON.stringify(d.data)&&JSON.stringify(c.heldData)===JSON.stringify(d.heldData),"inference settings preserve data");
 ck(c.calls===2*(16+15+16*32),"all random draws accounted");
 ck(c.ppc.rows.length===16&&c.ppc.samples.length===256,"all posterior pairs");
 ck(c.prediction.every(v=>Math.abs(v.variance-v.latentVariance-DEFAULTS.sigmaFit**2)<1e-12),"new noise added once");
 const e=snapshot({mode:"risk",sigmaData:0,draws:16}).result;
 ck(e.risk.variance===0&&e.risk.biasSquared>0,"noiseless data still regularization bias");
 ck(Math.abs(c.risk.mse-c.risk.biasSquared-c.risk.variance)<1e-12,"bias variance identity");
 ck(fmt(1000)==="1000","integer formatting");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,config,num,sum,dot,transpose,matvec,matmul,eye,cholesky,forward,backward,solve,householder,noiseStream,kernel,regularizer,trueSource,posterior,predictive,repeatedRisk,contrastModel,fieldModel,snapshot,evaluate:snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
