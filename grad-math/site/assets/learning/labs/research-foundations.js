(function (root, factory) {
  "use strict";
  const core = typeof module === "object" && module.exports ? require("../research-renderer.js") : root.ResearchLab;
  const lib = factory(core);
  if (typeof module === "object" && module.exports) module.exports = lib;
  else if (root.CourseLearning) root.CourseLearning.register("research-foundations", lib.mount);
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";
  const mod = (x, m) => ((x % m) + m) % m;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return Math.abs(a); };
  const grid = (a, b, n = 81) => Array.from({length:n}, (_, i) => a + (b-a)*i/(n-1));
  const series = (label, points) => ({label, points});
  function radial(cutoff, mass2) {
    const z = cutoff * cutoff / mass2;
    return (Math.log1p(z) - z / (1 + z)) / 2;
  }
  function simpson(f, n = 256) {
    let total = f(0) + f(1);
    for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(i/n);
    return total / (3*n);
  }
  function bubble(q, cutoff) {
    return simpson(x => radial(cutoff, 1 + x*(1-x)*q*q)) / (8*Math.PI**2);
  }
  function subtracted(q, q0) {
    return -simpson(x => Math.log((1+x*(1-x)*q*q)/(1+x*(1-x)*q0*q0))) / (16*Math.PI**2);
  }
  const configs = {
    module: {
      title:"非零标量一定可逆吗？",
      predict:"先预测：模六时乘二，哪些不同的输入会合并？",
      scope:"有限整数模 Z/m 上的乘法映射；图中点与连线不是连续函数。",
      controls:[["m","模数 m",2,24,1,6],["a","乘数 a",0,24,1,2]],
      compute(v) {
        const points = Array.from({length:v.m}, (_, x) => [x, mod(v.a*x, v.m)]);
        const kernel = points.filter(p => p[1] === 0).map(p => p[0]);
        const image = [...new Set(points.map(p => p[1]))].sort((a,b)=>a-b);
        return {numeric:{kernel,image,gcd:gcd(v.a,v.m)},
          rows:[["核",kernel.join(", ")],["像",image.join(", ")],["核的元素数",kernel.length],["像的元素数",image.length],["可逆？",kernel.length===1?"是":"否"]],
          chart:{title:"剩余类乘法",xlabel:"输入剩余类 x",ylabel:"ax mod m",xticks:[0,Math.floor((v.m-1)/2),v.m-1],series:[series("乘法映射",points)]},
          text:"核的元素数等于 gcd(a,m)。检查：核的元素数乘像的元素数，应等于原模的元素数 m。"};
      }
    },
    localization: {
      title:"允许新分母，会丢失什么？",
      predict:"先预测：模十二分别反演二、五、六，哪些分量会保留？",
      scope:"只计算有限环 (Z/m)[1/s]；剩余模数为一时得到零环，其中 0=1。",
      controls:[["m","原模数 m",2,36,1,12],["s","要反演的整数 s",1,12,1,2]],
      compute(v) {
        let r=v.m, d=gcd(r,v.s);
        while(d>1){r/=d;d=gcd(r,v.s);}
        const points=Array.from({length:v.m},(_,x)=>[x,x%r]);
        const kernel=points.filter(p=>p[1]===0).map(p=>p[0]);
        return {numeric:{remaining:r,kernel},rows:[["剩余环的模数 r",r],["剩余环元素数",r],["原映射的核",kernel.join(", ")],["核的元素数",kernel.length]],
          chart:{title:"局部化后的像",xlabel:"原剩余类 x",ylabel:"x mod r",xticks:[0,Math.floor((v.m-1)/2),v.m-1],series:[series("自然映射",points)]},
          text:r===1?"所有原元素合并到零环唯一元素。它不是空集合。":"反复删去与 s 共有的素因子幂后，剩余分量中的 s 已经可逆；原映射是模 r。"};
      }
    },
    complex: {
      title:"有回路，不一定有非零同调",
      predict:"先预测：填入三角面是否改变闭链数？再故意改错一个取向符号。",
      scope:"实系数，边顺序 e01,e12,e02。错误符号模式是链条件检查，不能据此定义 H1。",
      controls:[["filled","填面（0 无，1 有）",0,1,1,1],["wrong","取向错误（0 正确，1 错误）",0,1,1,0]],
      compute(v) {
        const boundary=v.filled?[1,1,v.wrong?1:-1]:[0,0,0];
        const twice=[-boundary[0]-boundary[2],boundary[0]-boundary[1],boundary[1]+boundary[2]];
        const valid=twice.every(x=>x===0), h1=valid?1-v.filled:null;
        return {numeric:{boundary,twice,valid,h1,h0:1},
          rows:[["闭链空间维数",1],["边界空间维数",v.filled],["边界再取边界",twice.join(", ")],["链条件",valid?"通过":"失败"],["H1 维数",h1]],
          chart:{title:"边界是否闭合",xlabel:"顶点编号",ylabel:"端点净系数",xticks:[0,1,2],series:[series("∂₁∂₂",twice.map((y,x)=>[x,y]))]},
          text:valid?"闭链空间一直是一维。填面后，这个回路成为边界，所以在同调商中等于零。":"∂₁∂₂ ≠ 0，像不包含在核中。H1 未定义，必须先修正边方向或面取向。"};
      }
    },
    sheaf: {
      title:"绕一圈，局部值还能对上吗？",
      predict:"先预测：两个负号会不会比一个负号更阻碍全局平坦截面？",
      scope:"三个开弧、实系数秩一局部系统；只研究平坦截面。符号开关 0 表示 +1，1 表示 −1。",
      controls:[["g12","接缝 1→2 的负号开关",0,1,1,0],["g23","接缝 2→3 的负号开关",0,1,1,0],["g31","接缝 3→1 的负号开关",0,1,1,1]],
      compute(v) {
        const signs=[v.g12,v.g23,v.g31].map(x=>x?-1:1),values=[1];
        signs.forEach(s=>values.push(values[values.length-1]*s));
        const h=values[3],dimension=h===1?1:0;
        return {numeric:{signs,values,holonomy:h,dimension},rows:[["三个过渡符号",signs.join(", ")],["绕一周的乘积",h],["起始试探值",1],["返回值",h],["全局平坦截面空间维数",dimension]],
          chart:{title:"一次平行移动",xlabel:"经过的接缝数",ylabel:"局部坐标值",xticks:[0,1,2,3],series:[series("从 a₁=1 出发",values.map((y,x)=>[x,y]))]},
          text:dimension?"所有初值都可相容地绕回自身，实截面空间一维。":"非零初值绕回变号；唯一全局平坦截面是零。这里显示的初值 1 是失败试探，不是全局截面。"};
      }
    },
    lsz: {
      title:"少截一条外腿会留下极点",
      predict:"先预测：离壳量减半，截三腿与截四腿的结果分别怎样变化？",
      scope:"Z=1 的树级形式极点模型，公共 delta 与单位幂已提出；不模拟物理散射运动学。",
      controls:[["lambda","耦合 λ",.1,1,.1,.2],["delta","无量纲离壳量 δ",.05,1,.05,.1],["legs","截去外腿数 k",0,4,1,3]],
      compute(v) {
        const value=v.lambda*v.delta**(v.legs-4),raw=v.lambda/v.delta**4;
        return {numeric:{raw,value,amplitude:-v.lambda,modulus:v.lambda},rows:[["未截肢核的模",raw],["截 k 条后的模",value],["四条全部截肢的模",v.lambda],["约化振幅 M",-v.lambda]],
          chart:{title:"残留极点的阶数",xlabel:"离壳量 δ",ylabel:"无量纲核的模",series:[series("当前截肢数 k",grid(.05,1).map(x=>[x,v.lambda*x**(v.legs-4)])),series("四条全截",[[.05,v.lambda],[1,v.lambda]])],marker:[v.delta,value]},
          text:v.legs===4?"外腿极点已全部抵消，树级核与离壳量无关；得到振幅仍需按 iM 的约定辨认符号。":"尚余 "+(4-v.legs)+" 条外腿，靠近壳面会发散。不同 k 的中间核原有量纲不同，图中已分别无量纲化。"};
      }
    },
    loop: {
      title:"算出对数，比较减法前后",
      predict:"先预测：提高截断时，两条未减法积分与它们的差，谁会趋于有限？",
      scope:"四维欧氏单泡图，m=1 为质量单位；参数积分采用 256 分段 Simpson。不是完整 φ⁴ 振幅。",
      controls:[["q","外动量模 Q/m",0,4,.25,2],["q0","参考动量模 Q₀/m",0,4,.25,0],["cutoff","截断 Λ/m",2,40,1,10]],
      compute(v) {
        const a=bubble(v.q,v.cutoff),b=bubble(v.q0,v.cutoff),limit=subtracted(v.q,v.q0);
        return {numeric:{a,b,difference:a-b,limit,error:a-b-limit,radial:radial(v.cutoff,1)},
          rows:[["BΛ(Q)",a],["BΛ(Q₀)",b],["有限截断差",a-b],["减法极限 BR",limit],["有限差减去极限",a-b-limit]],
          chart:{title:"同一截断下作减法",xlabel:"截断 Λ/m",ylabel:"无量纲积分",series:[series("BΛ(Q)",grid(2,40,39).map(x=>[x,bubble(v.q,x)])),series("BΛ(Q₀)",grid(2,40,39).map(x=>[x,bubble(v.q0,x)])),series("两者之差",grid(2,40,39).map(x=>[x,bubble(v.q,x)-bubble(v.q0,x)])),series("减法极限",[[2,limit],[40,limit]])]},
          text:"固定外动量与质量，两条原积分有共同的紫外对数，差趋于有限值。Q=Q₀ 时差严格为零；交换 Q 与 Q₀ 会反号。"};
      }
    }
  };
  return core.create("research-foundations", configs);
});
