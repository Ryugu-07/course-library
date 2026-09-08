(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-intersections",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function calculate(kind,m){
  return kind===0?{H0:"C",H1:"0",length:1,rank:0}:kind===1?{H0:"C[x]/(x^"+m+")",H1:"0",length:m,rank:0}:{H0:"C[x]",H1:"C[x]",length:null,rank:1};
 }
 const configs={plane:{title:"相切以后，Tor₁一定出现吗？",predict:"先预测：y=x²与y=0相切，和y=0与自身相交，哪一个使乘y真正产生核？",
 scope:"B=C[x,y]，固定Y:y=0。由[A --y→ A]计算H⁰与H⁻¹=Tor₁；所有环在复数上。图只画实平面切片，不能画出幂零方向或完整概形。",
 controls:[["kind","相交类型（0 横截 / 1 相切 / 2 自交）",0,2,1,1],["m","相切曲线的次数 m",2,6,1,2]],
 compute(v){const d=calculate(v.kind,v.m);const xs=Array.from({length:81},(_,i)=>-1+2*i/80),curve=v.kind===0?[[0,-1],[0,1]]:xs.map(x=>[x,v.kind===1?x**v.m:0]);
 return {numeric:d,rows:[["X 的方程",v.kind===0?"x=0":v.kind===1?"y=x^"+v.m:"y=0（与Y相同）"],["在A中乘y",v.kind===0?"C[y]上乘y，单射":v.kind===1?"C[x]上乘x^"+v.m+"，单射":"C[x]上的零映射"],["普通交环 H⁰",d.H0],["Tor₁（模）",d.H1],["孤立交点长度",d.length===null?"不适用：交集是一整条直线":d.length],["Tor₁作为C[x]模的秩",d.rank],["更高Tor（i≥2）","0：本例分解长度为1"]],
 chart:{title:"两条曲线的实切片",xlabel:"横坐标 x",ylabel:"纵坐标 y",xticks:[-1,0,1],series:[{label:"固定Y：y=0",points:[[-1,0],[1,0]]},{label:v.kind===2?"X与Y重合（虚线）":"X的实切片",points:curve}]},
 text:v.kind===2?"自交时H⁰与Tor₁都是C[x]，作为复向量空间无限维。表中的秩1指C[x]模秩，不是一个额外交点。m滑块在自交和横截模式不改变对象。":"相切可以让普通交点环非约化，却不必产生Tor₁。本例乘x^m在C[x]上仍单射；相切与非零Tor₁是不同判断。m仅在相切模式生效。"};}}
 };
 return Object.assign(core.create("research-intersections",configs),{calculate});
});
