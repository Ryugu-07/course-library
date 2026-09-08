(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-heat-fields",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function calculate(alpha,s,N,epsilon){
  const weight=k=>2*(1+k*k)**s*k**(-2*alpha),raw=[],heated=[];let partial=0,shell=0,smoothed=0,error=0;
  for(let k=1;k<=2*N;k++){const w=weight(k),heat=Math.exp(-epsilon*k*k);if(k<=N){partial+=w;smoothed+=w*heat*heat;error+=w*(1-heat)**2;raw.push([k,w]);heated.push([k,w*heat*heat]);}else shell+=w;}
  const p=2*alpha-2*s,converges=p>1,tail=converges?2*2**Math.max(s,0)*N**(1-p)/(p-1):null;
  return {partial,shell,smoothed,error,tail,p,converges,threshold:alpha-.5,raw,heated};
 }
 const configs={sobolev:{title:"高频看不见以后，误差真的消失了吗？",predict:"先预测：α=0时，将s从−3/4改到−1/2，倍增频率壳层还会随N增大而趋零吗？",
 scope:"2π圆周、dx/(2π)、sqrt2实正交三角基，去零模Gaussian场；所有截断与热时间共用同一噪声。图画的是解析期望模态贡献，不是随机样本。",
 controls:[["alpha","原场频率衰减 α",0,2,.25,0],["s","Sobolev 阶 s",-1.5,1,.25,-.75],["power","截断 N=2ⁿ 的指数 n",3,7,1,4],["epsilon","热时间 ε",.01,.2,.01,.05]],
 compute(v){const N=2**v.power,m=calculate(v.alpha,v.s,N,v.epsilon);return {numeric:m,rows:[["最高频率 N",N],["原场部分二阶矩",m.partial],["N到2N壳层二阶矩",m.shell],["热场部分二阶矩（仅k≤N）",m.smoothed],["热平方误差部分和（仅k≤N）",m.error],["原场截断平方尾界",m.tail===null?"不适用：不在L²(Ω;Hˢ)收敛区":m.tail],["完整热平方误差上界",m.tail===null?"本空间未定义所需Hˢ值极限":m.error+m.tail],["正则性阈值 s<",m.threshold],["cos(x)探针方差（全部N≥1）",.5],["临界倍增壳层极限",2*Math.log(2)]],
 chart:{title:"高频的加权二阶矩",xlabel:"频率 k",ylabel:"期望Hˢ模态贡献",series:[{label:"原场：两份实模态",points:m.raw},{label:"热场：乘e^(−2εk²)",points:m.heated}]},
 text:"热场二阶矩和误差只显示前N项，不冒充无穷和。收敛区的误差部分和加原场尾界覆盖所有未显示频率；临界/超临界不报告伪有限总误差。曲线接近、单一cos探针稳定，都不能代替完整Sobolev范数的Cauchy证明。要看ε→0，必须同时增大N控制尾部。"};}}
 };
 return Object.assign(core.create("research-heat-fields",configs),{calculate});
});
