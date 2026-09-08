(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-blocks",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function block(h,z,N){
  if(!(h>=1&&h<=8&&z>=.1&&z<=.9&&Number.isInteger(N)&&N>=64&&N<=256))throw Error("本实现要求1≤h≤8、0.1≤z≤0.9、64≤N≤256");
  let term=z**h,g=term,d=h*term/z;
  for(let n=0;n<N;n++){term*=z*(h+n)**2/((2*h+n)*(n+1));g+=term;d+=(h+n+1)*term/z;}
  const next=term*z*(h+N)**2/((2*h+N)*(N+1));
  // For n>=N+1>=65 and h<=8, (n+h)^2/((n+2h)(n+1))<=1.
  const tail=next/(1-z),q=z*(1+1/(h+N+1)),dtail=(h+N+1)*next/z/(1-q);
  return {g,d,tail,dtail};
 }
 function certificate(h,N){const r=block(h,.5,N),C=h*(h-1),a=8*C-8,b=8-48*C;
  const alpha=a*r.d+b*r.g,bound=Math.abs(a)*r.dtail+Math.abs(b)*r.tail;
  return {...r,alpha,bound,ratio:alpha/r.g,lower:h>=4?16*(h-3)*C-16*h+8:null};
 }
 const configs={positive:{title:"一个共形块的正系数，怎样成为谱排除证据？",predict:"先预测：检验h=4、5、6都为正，能否排除所有h≥4？正文会给覆盖整个半轴的解析不等式。",
 scope:"一维全局共形块g_h=z^h₂F₁(h,h;2h;z)，实h>0；排除证书固定相同外部标量Δφ=1/2，α=∂³−4∂在z=1/2取值。界面只计算h∈[1,8]，连续h≥4的证明不依赖这个网格。",
 controls:[["h","交换初级维数 h",1,8,.5,4],["z","交比 z",.1,.9,.05,.5],["N","共形块后裔级数最高阶 N",64,256,64,128]],
 compute(v){const r=block(v.h,v.z,v.N),c=certificate(v.h,v.N);return {numeric:{...r,certificate:c},rows:[["共形块部分和",r.g],["一阶导数部分和",r.d],["块级数解析余项上界（不含舍入）",r.tail],["导数级数解析余项上界（不含舍入）",r.dtail],["恒等块 α(F_id)",8],["所选h的α(F_h)，在z=1/2",c.alpha],["α截断误差上界（不含舍入）",c.bound],["α(F_h)/g_h(1/2)",c.ratio],["连续半轴的解析下界",c.lower===null?"本讲证明仅适用于h≥4":c.lower]],
 chart:{title:"块与交换维数",xlabel:"交换初级维数 h",ylabel:"α(F_h)/g_h(1/2)",series:[{label:"有限和计算；固定z=1/2",points:Array.from({length:57},(_,i)=>{const h=1+i/8;return [h,certificate(h,v.N).ratio];})},{label:"零线",points:[[1,0],[8,0]]}]},
 text:"z滑块只改变表中共形块与其导数，排除泛函始终在z=1/2。N截断的是单个共形块的后裔级数，不是完整OPE的初级谱。余项界不包括双精度舍入；小于约10⁻¹²时不可当作机器精度证书。严格排除来自正文对全部h≥4的解析证明，以及OPE正性和逐项求导条件。这里给的是宽松界，不是最优谱隙或三维临界指数。"};}}
 };
 return Object.assign(core.create("research-blocks",configs),{block,certificate});
});
