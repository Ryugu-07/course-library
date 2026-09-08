(function(root,factory){
 "use strict";const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("../projects/co2-observations/data.js"):root.CourseCO2Data);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-co2-observations",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,data){
 "use strict";
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),zeros=(n,m)=>Array.from({length:n},()=>Array(m).fill(0));
 function qrFit(X,y){
  const n=X.length,p=X[0].length;if(n<=p||y.length!==n)throw Error("有效观测数必须大于参数数");
  const Q=[],R=zeros(p,p);
  for(let j=0;j<p;j++){
   let v=X.map(row=>row[j]),original=Math.hypot(...v);
   for(let pass=0;pass<2;pass++)for(let k=0;k<j;k++){const a=dot(Q[k],v);R[k][j]+=a;v=v.map((x,i)=>x-a*Q[k][i]);}
   R[j][j]=Math.hypot(...v);if(R[j][j]<1e-12*Math.max(1,original))throw Error("设计矩阵秩不足");Q.push(v.map(x=>x/R[j][j]));
  }
  const solve=b=>{const x=Array(p).fill(0);for(let i=p-1;i>=0;i--){let s=b[i];for(let j=i+1;j<p;j++)s-=R[i][j]*x[j];x[i]=s/R[i][i];}return x;};
  const beta=solve(Q.map(q=>dot(q,y))),ri=zeros(p,p);
  for(let j=0;j<p;j++){const e=Array(p).fill(0);e[j]=1;const x=solve(e);for(let i=0;i<p;i++)ri[i][j]=x[i];}
  const bread=ri.map(row=>ri.map(col=>dot(row,col))),residuals=y.map((v,i)=>v-dot(X[i],beta));
  return {beta,bread,residuals,Q,R};
 }
 function features(t,center,model){const x=t-center,v=[1,x];if(model>0){for(let k=1;k<=2;k++)v.push(Math.sin(2*Math.PI*k*t),Math.cos(2*Math.PI*k*t));}if(model===2)v.push(x*x);return v;}
 function covariance(X,fit,months,lag){
  const n=X.length,p=X[0].length;if(!Number.isInteger(lag)||lag<0||lag>24)throw Error("HAC滞后需为0..24个月");
  const C=zeros(p,p),influence=X.map((x,i)=>fit.bread.map(row=>dot(row,x)*fit.residuals[i]));
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
   const gap=months[i]-months[j];if(gap<0)throw Error("月份必须递增");if(gap>lag)continue;
   const weight=1-gap/(lag+1),a=influence[i],b=influence[j];
   for(let u=0;u<p;u++)for(let v=0;v<p;v++)C[u][v]+=weight*(a[u]*b[v]+(i===j?0:b[u]*a[v]));
  }
  return C.map(row=>row.map(x=>x*n/(n-p)));
 }
 function fitSeries(records,start=2010,model=1,lag=12,minDays=0){
  if(![start,model,lag,minDays].every(Number.isInteger)||start<1990||start>2015||model<0||model>2||minDays<0||minDays>25)throw Error("课程参数越界");
  const candidates=records.filter(r=>r.year>=start&&r.year<=2019),valid=r=>r.quality==='reported'&&r.days>=minDays&&r.monthly_unc>=0&&r.daily_std>=0&&Number.isFinite(r.average);
  const train=candidates.filter(valid),test=records.filter(r=>r.year>=2020&&r.year<=2021&&valid(r)),center=(start+2020)/2;
  const X=train.map(r=>features(r.decimal_year,center,model)),y=train.map(r=>r.average),fit=qrFit(X,y),n=X.length,p=X[0].length,SSE=dot(fit.residuals,fit.residuals),cov=covariance(X,fit,train.map(r=>r.month_id),lag);
  const predict=r=>dot(features(r.decimal_year,center,model),fit.beta),testErrors=test.map(r=>r.average-predict(r));
  const pairs=[];for(let i=1;i<n;i++)if(train[i].month_id-train[i-1].month_id===1)pairs.push([fit.residuals[i-1],fit.residuals[i]]);
  const means=[0,1].map(k=>pairs.reduce((a,r)=>a+r[k],0)/pairs.length),aa=pairs.map(r=>r[0]-means[0]),bb=pairs.map(r=>r[1]-means[1]);
  const corr=dot(aa,bb)/Math.sqrt(dot(aa,aa)*dot(bb,bb));
  return {start,model,lag,minDays,center,n,p,excluded:candidates.length-n,testN:test.length,beta:fit.beta,cov,bread:fit.bread,
   iidSE:Math.sqrt(SSE/(n-p)*fit.bread[1][1]),hacSE:Math.sqrt(Math.max(0,cov[1][1])),trainRMSE:Math.sqrt(SSE/n),testRMSE:Math.sqrt(dot(testErrors,testErrors)/test.length),lag1:corr,pairCount:pairs.length,
   train:train.map((r,i)=>({...r,predicted:predict(r),residual:fit.residuals[i]})),test:test.map((r,i)=>({...r,predicted:predict(r),residual:testErrors[i]}))};
 }
 function dryAir(wetPpm,waterPercent){if(!Number.isFinite(wetPpm)||!Number.isFinite(waterPercent)||wetPpm<0||waterPercent<0||waterPercent>=100)throw Error("湿度必须小于100%，数值有限");return wetPpm/(1-waterPercent/100);}
 const controls=[["start","训练起始年（结束固定2019）",1990,2015,5,2010],["model","模型 0=直线 / 1=季节 / 2=季节＋曲率",0,2,1,1],["lag","HAC相关截断 L（月）",0,24,3,12],["days","每月最少有效天数",0,25,5,0]];
 const configs={trend:{title:"真实CO₂资料：一条漂亮曲线，能支持多大的结论？",predict:"先预测：加入季节项会怎样改变残差？把训练窗口变长，斜率的标准误变小，就一定更能预测后两年吗？",
  scope:"固定NOAA 2026-08-05发布快照，使用1990—2021月均干空气摩尔分数。训练到2019，2020—2021仅作模型留出检验；这是事后回顾，不是历史实时预测。单位ppm与ppm/年。",
  controls,compute(v){const r=fitSeries(data.records,v.start,v.model,v.lag,v.days);return {numeric:r,rows:[["有效训练月数 / 剔除月数",r.n+' / '+r.excluded],["留出月数",r.testN],["训练中心年 t₀",r.center],["中心处趋势斜率（ppm/年）",r.beta[1]],["朴素iid斜率标准误（ppm/年）",r.iidSE],["HAC斜率标准误（ppm/年）",r.hacSE],["训练残差RMSE（ppm）",r.trainRMSE],["留出RMSE（ppm）",r.testRMSE],["相邻日历月残差相关",r.lag1],["有效相邻月对数",r.pairCount]],
   chart:{title:"真实月均值与同一模型的留出预测",xlabel:"年份",ylabel:"CO₂ − 400（ppm，干空气）",series:[{label:"训练观测（NOAA）",points:r.train.map(x=>[x.decimal_year,x.average-400]),dots:true},{label:"留出观测（NOAA）",points:r.test.map(x=>[x.decimal_year,x.average-400]),dots:true},{label:"课程模型：训练及延伸",points:[...r.train,...r.test].map(x=>[x.decimal_year,x.predicted-400])}]},
   text:"HAC只改变所选均值模型下的协方差估计，不会修复错误的趋势形式，也不是精确置信保证。最少有效天数筛选会改变样本；程序用真实年月差计算相关，不把缺月两端当相邻月。官方去季节列及月均unc都未作为独立观测或拟合权重。改变模型后反复观看留出误差，会把留出集变成调参集；不能再声称完全独立评估。"};}},
  residuals:{title:"误差在哪里：天气尺度不确定度与模型残差",predict:"先预测：官方每个月的unc较小，是否意味着一个跨年的直线模型也应该残差很小？",
   scope:"仍是同一NOAA快照。上下的unc线仅显示官方月均不确定度量级，并非本课程回归的置信带；官方unc考虑日际天气波动和相关性，不能重算为daily_std/√days。",
   controls,compute(v){const r=fitSeries(data.records,v.start,v.model,v.lag,v.days);return {numeric:r,rows:[["中心处斜率（ppm/年）",r.beta[1]],["训练残差RMSE（ppm）",r.trainRMSE],["平均官方monthly_unc（ppm）",r.train.reduce((a,x)=>a+x.monthly_unc,0)/r.n],["HAC斜率标准误（ppm/年）",r.hacSE],["相邻月残差相关",r.lag1]],
    chart:{title:"残差与官方月均unc的不同量级",xlabel:"年份",ylabel:"残差 / 官方unc（ppm）",series:[{label:"观测减课程拟合",points:r.train.map(x=>[x.decimal_year,x.residual])},{label:"＋官方monthly_unc",points:r.train.map(x=>[x.decimal_year,x.monthly_unc])},{label:"−官方monthly_unc",points:r.train.map(x=>[x.decimal_year,-x.monthly_unc])}]},
    text:"残差混合了随机变化和模型未描述的结构；月平均unc描述另一层不确定性。这里没有把其平方倒数当权重，也没有报告凭小unc获得的过度精确排放估计。参考物理页的测量链，再检查数学页的均值与相关假设。"};}},
  dry:{title:"同一份空气，为什么湿值与干值不同？",predict:"先预测：只有加入水汽而没有移走CO₂时，湿空气ppm会降低吗？干空气ppm呢？",
   scope:"这是单位转换的机制算例，不是NOAA逐次仪器记录。选一个真实月均干值，给定水汽分数，计算同一份空气的湿值；压力、温度变化不改变分子数比。",
   controls:[["month","2020年月份",1,12,1,7],["water","湿空气水汽摩尔百分比",0,4,.5,3]],compute(v){const row=data.records.find(r=>r.year===2020&&r.month===v.month),wet=row.average*(1-v.water/100);return {numeric:{dry:row.average,wet,restored:dryAir(wet,v.water),row},rows:[["2020所选月：官方干空气CO₂（ppm）",row.average],["假设水汽比例下的湿空气CO₂（ppm）",wet],["由湿值还原的干值（ppm）",dryAir(wet,v.water)],["本月有效天数",row.days],["本月官方月均unc（ppm）",row.monthly_unc]],
    chart:{title:"加入水汽改变分母",xlabel:"水汽摩尔百分比",ylabel:"相对干空气值的差（ppm）",series:[{label:"湿值 − 干值（机制换算）",points:Array.from({length:17},(_,i)=>[i/4,-row.average*i/400])},{label:"干值作参考零点",points:[[0,0],[4,0]]}]},
    text:"图的纵轴为湿值减干值，表格保留实际ppm数值。水汽滑块不是Mauna Loa当月真实湿度；本快照没有湿度或ring-down原始信号。程序保留真实月值作为起点，派生的湿值明确标为假设算例。月均unc也不能覆盖任意湿度测量误差或所有校准系统误差。"};}}
 };
 return Object.assign(core.create("research-co2-observations",configs),{qrFit,features,covariance,fitSeries,dryAir,data});
});
