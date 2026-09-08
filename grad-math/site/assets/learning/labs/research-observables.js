(function(root,factory){
  "use strict";
  const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
  const lib=factory(core);
  if(typeof module==="object"&&module.exports)module.exports=lib;
  else if(root.CourseLearning)root.CourseLearning.register("research-observables",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  const grid=(a,b,n=101)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
  const series=(label,points)=>({label,points});
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const sinc=x=>Math.abs(x)<1e-8?1-x*x/6:Math.sin(x)/x;
  function pulse(omega,T){
    const g=v=>{const x=v*T/2,s=T*sinc(x);return [s*Math.cos(x),s*Math.sin(x)];};
    const a=g(1-omega),b=g(1+omega);
    return ((a[0]+b[0])**2+(a[1]+b[1])**2)/4;
  }
  function chi(delta,beta,eta,omega){
    const r=Math.tanh(beta*delta/2),minus=omega-delta,plus=omega+delta;
    return {re:r*(plus/(plus*plus+eta*eta)-minus/(minus*minus+eta*eta)),im:r*eta*(1/(minus*minus+eta*eta)-1/(plus*plus+eta*eta))};
  }
  const configs={
    ext:{
      title:"扩张的类与中间模是不是一回事？",
      predict:"先预测：同样 n=6，不同的 a 能否给出同构的中间模？",
      scope:"Ext¹_Z(Z/n,Z)，固定两端及其映射。关系 nx=ae；实验将 a 化为模 n 的类。",
      controls:[["n","商模的模数 n",2,12,1,6],["a","关系中的整数 a",0,12,1,2]],
      compute(v){const a=v.a%v.n,d=gcd(v.n,a),split=a===0;
        return {numeric:{class:a,torsion:d,split},rows:[["扩张类 a mod n",a],["中间模的挠部分阶数",d],["中间模",d===1?"Z":"Z ⊕ Z/"+d],["固定两端的扩张分裂？",split?"是":"否"]],
          chart:{title:"同一商模下的扩张类",xlabel:"类的代表 a",ylabel:"中间模挠部分的阶",xticks:[0,Math.floor((v.n-1)/2),v.n-1],series:[series("gcd(n,a)",Array.from({length:v.n},(_,x)=>[x,gcd(v.n,x)]))],marker:[a,d]},
          text:"相同挠部分阶数意味着这里的中间阿贝尔群同构，但不保证固定两端的扩张等价。a=0 的分裂扩张也可有非零挠部分。"};}
    },
    connection:{
      title:"绕行返回相同，能推出全局解吗？",
      predict:"先预测：α=1/2 绕两圈返回原值，是否存在非零全局单值水平截面？",
      scope:"C* 上秩一联络 d−α dz/z，α 为实数；基变换 e′=z^m e，α′=α−m。",
      controls:[["alpha","联络参数 α",-2,2,.1,.5],["m","整数规范 m",-2,2,1,0],["w","绕圈次数 w",1,4,1,1]],
      compute(v){const shifted=v.alpha-v.m,angle=2*Math.PI*shifted*v.w,re=Math.cos(angle),im=Math.sin(angle),integer=Math.abs(v.alpha-Math.round(v.alpha))<1e-10;
        return {numeric:{shifted,re,im,dimension:integer?1:0,oneRe:Math.cos(2*Math.PI*v.alpha),oneIm:Math.sin(2*Math.PI*v.alpha)},rows:[["新参数 α′",shifted],["绕 w 圈的复数实部",re],["绕 w 圈的复数虚部",im],["全局单值水平截面维数",integer?1:0]],
          chart:{title:"沿回路延拓一个局部水平解",xlabel:"已经绕过的圈数",ylabel:"复解的实部 / 虚部",xticks:[0,v.w/2,v.w],series:[series("实部",grid(0,v.w,201).map(x=>[x,Math.cos(2*Math.PI*shifted*x)])),series("虚部",grid(0,v.w,201).map(x=>[x,Math.sin(2*Math.PI*shifted*x)]))]},
          text:"必须检查一次基本绕行，才能判定全局单值性。整数规范可改变沿途局部坐标，却不改变整圈单值化；图中初值 1 是局部解的延拓。"};}
    },
    response:{
      title:"两条跃迁如何组合成因果响应？",
      predict:"先预测：温度上升时，相关谱的总权重与响应谱的差是否一起消失？",
      scope:"H′=−fB，hbar=q=1，能隙 Δ>0。有限 η 仅为显示展宽，未声称满足展宽后的逐点平衡 FDT。",
      controls:[["delta","能隙 Δ",.5,2,.1,1],["beta","逆温度 β",.2,5,.2,2],["eta","显示展宽 η",.05,.4,.05,.1],["omega","读数角频率 ω",-3,3,.1,1]],
      compute(v){const r=Math.tanh(v.beta*v.delta/2),pg=(1+r)/2,pe=(1-r)/2,value=chi(v.delta,v.beta,v.eta,v.omega);
        return {numeric:{...value,r,pg,pe,staticIdeal:2*r/v.delta,staticBroadened:2*r*v.delta/(v.delta**2+v.eta**2),noisePositive:2*Math.PI*pg,noiseNegative:2*Math.PI*pe},
          rows:[["占据差 pg−pe",r],["基态概率 pg",pg],["激发态概率 pe",pe],["Re χ（有限 η）",value.re],["Im χ（有限 η）",value.im],["理想静态极限",2*r/v.delta],["有限 η 的静态值",2*r*v.delta/(v.delta**2+v.eta**2)],["相关谱总面积",2*Math.PI]],
          chart:{title:"同一因果函数的实部与虚部",xlabel:"角频率 ω",ylabel:"χ（q²/能量单位）",series:[series("Re χ",grid(-3,3,241).map(x=>[x,chi(v.delta,v.beta,v.eta,x).re])),series("Im χ",grid(-3,3,241).map(x=>[x,chi(v.delta,v.beta,v.eta,x).im]))],marker:[v.omega,value.im]},
          text:"正频率吸收为正，实部为偶函数、虚部为奇函数。相关峰的权重均非负；响应取两种跃迁的概率差，不能把负频率负峰当作负概率。"};}
    },
    spectroscopy:{
      title:"脉冲更长，为什么峰高不能直接当度量？",
      predict:"先预测：把观测时间加倍，共振最低阶概率是否仍足够小？",
      scope:"hbar=Δ=1，调制经度 φ，保留线性化 Hamiltonian 的二阶概率估计及两项振幅。不做数值截断来伪造概率。",
      controls:[["theta","极角 θ/π",.05,.95,.05,.5],["a","驱动振幅 a",.01,.2,.01,.05],["T","脉冲时长 T",2,40,2,20],["omega","驱动角频率 ω",.2,2,.05,1]],
      compute(v){const metric=Math.sin(Math.PI*v.theta)**2/4,scale=v.a**2*metric,p=scale*pulse(v.omega,v.T),rwa=scale*v.T**2/4*sinc((1-v.omega)*v.T/2)**2;
        const validity=p>1?"失效：估计超过一，不能当作概率":p>.1?"需检查高阶效应（教学阈值 0.1）":"小激发区；仍需误差与模型检查";
        return {numeric:{metric,p,rwa,weightedArea:Math.PI*v.a*v.a*metric/2,exceedsOne:p>1},rows:[["本征态量子度量 gφφ",metric],["二阶概率估计（两项振幅）",p],["只保留共振项的估计",rwa],["理想加权谱面积",Math.PI*v.a*v.a*metric/2],["微扰范围",validity]],
          chart:{title:"有限脉冲的频率选择性",xlabel:"驱动角频率 ω",ylabel:"二阶激发概率估计",series:[series("完整二阶估计",grid(.2,2,241).map(x=>[x,scale*pulse(x,v.T)])),series("共振项近似",grid(.2,2,241).map(x=>[x,scale*v.T**2/4*sinc((1-x)*v.T/2)**2]))],marker:[v.omega,p]},
          text:"峰宽随时间变窄，峰高不能单独代表量子度量。扫描图上每个频率的估计均须检查是否小；不应把强驱动区的曲线解释为精确动力学。"};}
    }
  };
  return core.create("research-observables",configs);
});
