(function (root, factory) {
  "use strict";
  const core = typeof module === "object" && module.exports ? require("../research-renderer.js") : root.ResearchLab;
  const lib = factory(core);
  if (typeof module === "object" && module.exports) module.exports = lib;
  else if (root.CourseLearning) root.CourseLearning.register("research-geometry", lib.mount);
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const grid=(a,b,n=81)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
  const series=(label,points)=>({label,points});
  const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
  const configs={
    tensor:{
      title:"换系数之后，单射还在吗？",
      predict:"先预测：乘六改在模四上计算，哪些输入合并到零？",
      scope:"整数自由分解与 Z/n 张量；核和余核元素数相同，但不是同一个构造。连线仅帮助跟踪离散值。",
      controls:[["m","分解中的乘数 m",1,24,1,6],["n","系数模数 n",2,24,1,4]],
      compute(v){
        const points=Array.from({length:v.n},(_,x)=>[x,(v.m*x)%v.n]);
        const kernel=points.filter(p=>p[1]===0).map(p=>p[0]);
        const image=[...new Set(points.map(p=>p[1]))].sort((a,b)=>a-b);
        const d=gcd(v.m,v.n);
        return {numeric:{kernel,image,tensorOrder:d,torOrder:d},rows:[["核（Tor₁ 的具体实现）",kernel.join(", ")],["像",image.join(", ")],["余核 / 张量积元素数",d],["Tor₁ 元素数",kernel.length],["张量后单射？",d===1?"是":"否"]],
          chart:{title:"自由分解换系数后的微分",xlabel:"输入剩余类 a",ylabel:"ma mod n",xticks:[0,Math.floor((v.n-1)/2),v.n-1],series:[series("微分",points)]},text:"元素数为一表示零模。一次没有出现核不能证明系数模平坦；平坦性须对所有短正合列成立。"};
      }
    },
    cech:{
      title:"哪些 Laurent 单项式无法消去？",
      predict:"先预测：O(−3) 的指数 −1 能由两边局部截面之差得到吗？",
      scope:"P¹ 上代数线丛 O(k)，e₁=zᵏe₀。图示指数窗口 −8 至 8；维数由完整指数区间计算。",
      controls:[["k","线丛次数 k",-6,6,1,-3],["j","试探指数 j",-8,8,1,-1]],
      compute(v){
        const h0=Math.max(v.k+1,0),h1=Math.max(-v.k-1,0),survives=v.j>v.k&&v.j<0;
        const basis=Array.from({length:h1},(_,i)=>v.k+1+i);
        return {numeric:{h0,h1,basis,survives,euler:h0-h1},rows:[["h⁰：全局截面维数",h0],["h¹：一次上同调维数",h1],["H¹ 基的指数",basis.length?basis.join(", "):"空基（零空间）"],["试探项的上同调类",survives?"非零":"零，可消去"],["Euler 特征",h0-h1]],
          chart:{title:"两侧能覆盖的指数与剩余缺口",xlabel:"整数指数 j",ylabel:"成员指示（1 是，0 否）",xticks:[-8,-4,0,4,8],series:[series("U₀：j≥0",grid(-8,8,17).map(j=>[j,j>=0?1:0])),series("U₁：j≤k",grid(-8,8,17).map(j=>[j,j<=v.k?1:0])),series("商中剩余：k<j<0",grid(-8,8,17).map(j=>[j,j>v.k&&j<0?1:0]))],marker:[v.j,survives?1:0]},
          text:"H⁰ 取两个指数区域的交集；H¹ 取并集未覆盖的缺口。图中整数之间的线没有分数次幂含义。"};
      }
    },
    berry:{
      title:"换相位规范，闭合回路是否改变？",
      predict:"先预测：北、南两套规范的实数相位相差 2π，复相位是否相同？",
      scope:"隔离的两能级下态，A=i⟨u|du⟩。θ 用 π 为单位；只算几何相位，不模拟绝热动力学。",
      controls:[["theta","纬度 θ/π",.05,.95,.05,.5],["south","规范（0 北，1 南）",0,1,1,0],["steps","回路分段数 N",8,128,8,64]],
      compute(v){
        const theta=v.theta*Math.PI,c=Math.cos(theta),s2=(1-c)/2,c2=1-s2;
        const exact=Math.PI*(1-c)-2*Math.PI*v.south,step=2*Math.PI/v.steps;
        // Each overlap is c²+s² exp(−i Δφ); southern gauge adds exp(i Δφ).
        const overlapArg=Math.atan2(-s2*Math.sin(step),c2+s2*Math.cos(step))+v.south*step;
        const discrete=wrap(-v.steps*overlapArg),error=wrap(discrete-exact);
        const connection=s2-v.south,curvature=Math.sin(theta)/2;
        return {numeric:{exact,discrete,error,connection,curvature,cosPhase:Math.cos(exact),sinPhase:Math.sin(exact)},rows:[["联络 Aφ",connection],["精确实数相位（当前规范）",exact],["离散相位主值",discrete],["模 2π 误差",error],["曲率 Fθφ",curvature],["复相位实部",Math.cos(exact)],["复相位虚部",Math.sin(exact)]],
          chart:{title:"同一纬线的两套联络",xlabel:"θ/π",ylabel:"Aφ（无量纲）",series:[series("北侧规范",grid(.05,.95).map(x=>[x,(1-Math.cos(Math.PI*x))/2])),series("南侧规范",grid(.05,.95).map(x=>[x,-(1+Math.cos(Math.PI*x))/2]))],marker:[v.theta,connection]},
          text:"联络相差 −1 对应一圈积分差 −2π。离散结果采用相位主值，±π 可代表同一相位；误差用模 2π 比较。"};
      }
    },
    metric:{
      title:"局部度量能近似多大的步长？",
      predict:"先预测：把经度步长加倍，精确保真度损失是否恰好四倍？",
      scope:"同一两能级下态，固定 θ 沿经度移动；角度无量纲。不是材料测量，也不计算输运或超导温度。",
      controls:[["theta","纬度 θ/π",.05,.95,.05,.5],["epsilon","经度步长 ε（rad）",.05,2,.05,.4]],
      compute(v){
        const sin=Math.sin(v.theta*Math.PI),gtt=.25,gpp=sin*sin/4,f=sin/2;
        const exact=sin*sin*Math.sin(v.epsilon/2)**2,approx=gpp*v.epsilon**2;
        return {numeric:{gtt,gpp,curvature:f,det:gtt*gpp,bound:f*f/4,exact,approx,error:approx-exact},rows:[["gθθ",gtt],["gφφ",gpp],["Fθφ",f],["det g",gtt*gpp],["(Fθφ/2)²",f*f/4],["精确保真度损失",exact],["二阶度量近似",approx],["近似减去精确",approx-exact]],
          chart:{title:"有限步长与局部二阶展开",xlabel:"经度步长 ε（rad）",ylabel:"1−保真度（无量纲）",series:[series("精确重叠",grid(0,2).map(e=>[e,sin*sin*Math.sin(e/2)**2])),series("局部二次近似",grid(0,2).map(e=>[e,gpp*e*e]))],marker:[v.epsilon,exact]},
          text:"小步长时两条曲线接近；这里两带纯态使 det g=(F/2)²。一般多能级系统只有不等式，不能把本实验等号直接推广。"};
      }
    }
  };
  return core.create("research-geometry",configs);
});
