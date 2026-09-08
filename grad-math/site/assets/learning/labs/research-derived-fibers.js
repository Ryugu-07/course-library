(function(root,factory){
 "use strict";
 const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-derived-fibers",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function dimensions(family,a){return {h0:family===0?2:a===0?2:1,hminus1:family===1&&a===0?1:0,torsionScalar:family===1?-a:null};}
 const configs={torsion:{title:"同一个双点纤维，背后的族也一样吗？",predict:"先预测：两族在a=0的普通纤维都同构于C[x]/(x²)，Tor₁是否也相同？",
 scope:"底环B=C[t]；族0为B[u]/(u²−t)；族1为C[t,x]/(x²,tx)。只计算[A --(t−a)→ A]在−1、0次的同调。图是精确维数账本，不是把无限维A截断成数值矩阵。",
 controls:[["family","族（0 自由平方族 / 1 挠元族）",0,1,1,1],["a","闭点参数 a",-2,2,.1,0]],
 compute(v){const m=dimensions(v.family,v.a);return {numeric:m,
 rows:[["当前族",v.family===0?"B-自由秩2的平方族":"B ⊕ C·x̄，t x̄=0"],["普通纤维维数 H⁰",m.h0],["Tor₁ 维数 H⁻¹",m.hminus1],["高于1的 Tor",0],["t−a 在 C·x̄ 上的标量",m.torsionScalar===null?"自由平方族没有该挠子模":m.torsionScalar],["普通纤维环",v.family===0?(v.a===0?"C[u]/(u²)":"C×C"):(v.a===0?"C[x]/(x²)":"C")]],
 chart:{title:"当前闭点的同调维数",xlabel:"上同调次数",ylabel:"复向量空间维数",xticks:[-1,0],series:[{label:"H⁻¹：被乘法杀掉的方向",points:[[-1,0],[-1,m.hminus1]]},{label:"H⁰：商掉乘法像后留下的方向",points:[[0,0],[0,m.h0]]}]},
 text:v.family===0?"自由平方族的零纤维虽然非约化，乘t仍在A中单射，故Tor₁=0。非约化纤维不能单独判定非平坦。":"自由B分量贡献一个H⁰；挠子模上乘t−a等于乘−a。只有a=0时，该方向同时留在核和余核中，分别贡献H⁻¹与H⁰。"};}}
 };
 return Object.assign(core.create("research-derived-fibers",configs),{dimensions});
});
