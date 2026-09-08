(function(root,factory){
 "use strict";
 const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-fibers",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function fiber(a){
  const t=Math.sqrt(Math.abs(a)),roots=a===0?[[0,0]]:a>0?[[t,0],[-t,0]]:[[0,t],[0,-t]];
  return {a,roots,distinct:roots.length,dimension:2,reduced:a!==0,multiplicity:a===0?2:1,multiplyX:[[0,a],[1,0]]};
 }
 const configs={square:{title:"两个点合并以后，什么信息还留在环里？",predict:"先预测：a 从正数变到0再变成负数，复数底域上的纤维会消失吗？",
 scope:"C[t]→C[x]，t↦x²；纤维环 C[x]/(x²−a)。滑块只取复数底域内的实参数 a。图仅画闭点位置，不绘出全部概形结构。",
 controls:[["a","目标参数 a",-2,2,.1,1]],
 compute(v){const m=fiber(v.a);return {numeric:m,
 rows:[["闭点的复坐标",m.roots.map(p=>p[1]===0?core.format(p[0]):core.format(p[1])+"i").join("，")],["纤维环",v.a===0?"C[x]/(x²)":"C[x]/(x²−a)"],["不同闭点数",m.distinct],["每个闭点的局部长度",m.multiplicity],["作为 C 向量空间的维数",2],["是否约化",m.reduced?"是（两个不同根）":"否：x̄≠0，但 x̄²=0"],["乘 x̄ 矩阵（基 1,x̄）","[[0, "+v.a+"], [1, 0]]"]],
 chart:{title:"纤维闭点在复平面的位置",xlabel:"Re x",ylabel:"Im x",xticks:[-1.5,0,1.5],series:[{label:"实轴参照",points:[[-1.5,0],[1.5,0]]},{label:"虚轴参照",points:[[0,-1.5],[0,1.5]]},...m.roots.map((p,i)=>({label:m.distinct===1?"原点：局部长度2":"闭点 "+(i+1),points:[p],dots:true}))]},
 text:v.a===0?"一个实心点画不出非零幂零元；长度2由基 {1,x̄} 和关系 x̄²=0 记录，并不是两个可分辨的位置。":"a<0 时根位于虚轴，仍是两个复闭点。图中的轴线只是坐标参照，不是纤维的一部分；点集以外的信息要查看上方的商环。"};}}
 };
 return Object.assign(core.create("research-fibers",configs),{fiber});
});
