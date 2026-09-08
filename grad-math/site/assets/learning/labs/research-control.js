(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-control",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function moments(a,b,e,T,t){const D=1+b*e*T;return {mean:a*e*t/D,variance:e*t*(1+b*e*(T-t))/D};}
 function calculate(a,b,e,T){const D=1+b*e*T,m=a*e*T/D,v=e*T/D,KL=.5*(1/D+m*m/(e*T)-1+Math.log(D));
  function rate(t){const r=moments(a,b,e,T,t),d=1+b*e*(T-t);return .5*e*((a-b*r.mean)**2+b*b*r.variance)/(d*d);}
  const n=1024,dt=T/n;let energy=rate(0)+rate(T);for(let i=1;i<n;i++)energy+=(i%2?4:2)*rate(i*dt);energy*=dt/3;
  return {mean:m,variance:v,KL,energy,D,rate};
 }
 const configs={gaussian:{title:"改变漂移的能量，真的等于整条路径的KL吗？",predict:"先预测：增大终端约束b，终点方差会怎样改变？只比较终端分布，什么时候足以算出路径KL？",
 scope:"X₀=0，参考dX=√ε dW；用exp(aX_T−bX_T²/2)倾斜，b≥0，双方扩散系数相同。先选择终端势，再导出终端Gaussian分布；没有求任意给定两端边缘的通用算法。",
 controls:[["a","终端势线性参数 a",-2,2,.25,1],["b","终端势二次参数 b",0,3,.25,1],["epsilon","相同扩散方差率 ε",.5,2,.25,1],["T","终止时间 T",.5,2,.25,1]],
 compute(v){const m=calculate(v.a,v.b,v.epsilon,v.T);return {numeric:m,rows:[["终端均值",m.mean],["终端方差",m.variance],["终端KL＝路径KL（解析）",m.KL],["期望控制能量（1024段Simpson积分）",m.energy],["积分与解析差",m.energy-m.KL],["初始分布KL",0]],
 chart:{title:"未来约束如何改变当前漂移",xlabel:"当前位置 x",ylabel:"漂移速度 u(t,x)",series:[0,.5,1].map(f=>({label:"t="+core.format(f*v.T),points:Array.from({length:81},(_,i)=>{const x=-2+i/20,t=f*v.T;return [x,v.epsilon*(v.a-v.b*x)/(1+v.b*v.epsilon*(v.T-t))];})}))},
 text:"曲线是三个时刻的解析漂移场切片，不是采样轨迹或对期望的统计估计。路径KL等于终端KL，是因为本例保留了给定终点后的参考Brownian条件桥；任意同终点分布的过程不一定相等。能量用另一条积分路线核对，双精度微小差异不表示额外物理代价。ε滑块同时修改参考与受控过程的扩散，不能将两次不同ε的运行互相套用漂移KL公式。"};}}
 };
 return Object.assign(core.create("research-control",configs),{moments,calculate});
});
