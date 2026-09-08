(function(root,factory){
  "use strict";
  const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
  const lib=factory(core);
  if(typeof module==="object"&&module.exports)module.exports=lib;
  else if(root.CourseLearning)root.CourseLearning.register("research-limits",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  const grid=(n)=>Array.from({length:n+1},(_,i)=>i/n);
  const sum=(a,b,r)=>{let s=0;for(let k=a;k<=b;k++)s+=k**(-r);return s;};
  const line=(label,points)=>({label,points});
  const damping=(p,theta)=>{const b=Math.sin(Math.PI*theta/2)**2,c=Math.sin(Math.PI*theta)/2;return {b,pe:(1-p)*b,coherence:Math.sqrt(1-p)*c,purity:1-2*p*(1-p)*b*b,choiLarge:1-p/2,choiSmall:p/2};};
  const configs={
    wick:{
      title:"点上发散，平均后的差能否变小？",
      predict:"先预测：s=1/2 时，点方差和跨截断均方差会朝同一方向变化吗？",
      scope:"同一组独立标准 Gaussian Fourier 系数；归一化空间平均 dx/(2π)，比较 M=2N。只检验常数测试函数。",
      controls:[["N","Fourier 截断 N",2,128,1,16],["s","系数衰减指数 s",0,1,.05,.5]],
      compute(v){const C=sum(1,v.N,2*v.s),variance=sum(1,v.N,4*v.s),difference=sum(v.N+1,2*v.N,4*v.s),converges=v.s>.25,bound=converges?v.N**(1-4*v.s)/(4*v.s-1):null;
        return {numeric:{C,pointVariance:2*C*C,variance,difference,converges,bound},rows:[["点方差 C_N",C],["点 Wick 平方的方差",2*C*C],["空间平均 Y_N 的方差",variance],["E|Y_2N−Y_N|²",difference],["L² 极限存在？",converges?"是（本模型 s>1/4）":"否（s≤1/4）"],["到无限截断的均方误差上界",bound===null?"无有限尾和，不能给出":bound]],
          chart:{title:"跨截断差的均方值",xlabel:"截断 n（整数）",ylabel:"E|Y_2n−Y_n|²",series:[line("同一耦合下的精确有限和",Array.from({length:127},(_,i)=>{const n=i+2;return[n,sum(n+1,2*n,4*v.s)];}))],marker:[v.N,difference]},
          text:"有限数值不等于极限证明。阈值来自全部尾和的 Cauchy 判据；图只扫描 n 到 128。s=1/4 的跨倍增差趋向 log 2，不趋向零。"};}
    },
    damping:{
      title:"衰减越彻底，输出一定越混合吗？",
      predict:"先预测：同一纯输入，p 从 0 增至 1 时纯度是否单调下降？",
      scope:"基底 (|0>,|1>)，初态 cos(θ/2)|0>+sin(θ/2)|1>；振幅衰减 Kraus 通道。p 是一次操作的概率。",
      controls:[["p","衰减概率 p",0,1,.05,.4],["theta","初态极角 θ/π",0,1,.05,.5]],
      compute(v){const a=damping(v.p,v.theta);return {numeric:a,rows:[["初态激发人口",a.b],["输出激发人口",a.pe],["输出相干模 |ρ01|",a.coherence],["输出纯度",a.purity],["归一化 Choi 本征值 1",a.choiLarge],["归一化 Choi 本征值 2",a.choiSmall],["其余 Choi 本征值","0，0"]],
        chart:{title:"同一输入下的衰减扫描",xlabel:"衰减概率 p",ylabel:"人口、相干模与纯度（无量纲）",series:[line("激发人口",grid(100).map(p=>[p,damping(p,v.theta).pe])),line("相干模",grid(100).map(p=>[p,damping(p,v.theta).coherence])),line("纯度",grid(100).map(p=>[p,damping(p,v.theta).purity]))],marker:[v.p,a.purity]},
        text:"p=1 时输出为纯基态。图中的通道均完全正，但输出纯度随输入与 p 改变；纯度不是通道合法性的判据。"};}
    },
    choi:{
      title:"迹始终为一，哪里出现了负概率？",
      predict:"先预测：混入多少退极化，才能让转置混合映射通过 Bell 输入检验？",
      scope:"Φ_q=(1−q)T+qD，T 为指定基底转置，D(A)=Tr(A)I/2；J 使用归一化 Bell 态，输出系统在前。",
      controls:[["q","退极化权重 q",0,1,.01,.5]],
      compute(v){const plus=(2-v.q)/4,minus=(3*v.q-2)/4,cp=v.q>=2/3;return {numeric:{plus,minus,cp,trace:3*plus+minus},rows:[["对称方向本征值（三重）",plus],["反对称方向本征值",minus],["Choi 迹",3*plus+minus],["单系统正性 / 迹保持","均通过"],["完全正性",cp?"通过":"不通过：联合输出存在负本征值"]],
        chart:{title:"Bell 输入揭示的本征值",xlabel:"退极化权重 q",ylabel:"归一化 Choi 本征值",series:[line("λ+（三重）",grid(100).map(q=>[q,(2-q)/4])),line("λ−（一重）",grid(100).map(q=>[q,(3*q-2)/4])),line("零基线",[[0,0],[1,0]])],marker:[v.q,minus]},
        text:"精确阈值 q=2/3；滑杆步长 0.01，0.66 与 0.67 分居两侧。负值保留用于诊断，不是可实现通道的输出概率。"};}
    }
  };
  return core.create("research-limits",configs);
});
