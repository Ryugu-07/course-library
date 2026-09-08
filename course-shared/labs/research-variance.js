(function(root,factory){
 "use strict";const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("./research-mpo.js"):root.ResearchMPO);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-variance",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,mpo){
 "use strict";
 const matrix=(n,m)=>Array.from({length:n},()=>Array(m).fill(0));
 // Composition AB: sum the physical output of B / input of A, keep both operator bonds.
 function compose(A,B){
  const al=A.length,ar=A[0].length,bl=B.length,br=B[0].length,d=A[0][0].length,e=B[0][0][0].length,mid=A[0][0][0].length;
  if(mid!==B[0][0].length)throw Error("MPO乘法物理维数不匹配");
  return Array.from({length:al*bl},(_,i)=>Array.from({length:ar*br},(_,j)=>{
   const out=matrix(d,e),a=Math.floor(i/bl),b=i%bl,c=Math.floor(j/br),f=j%br;
   for(let s=0;s<d;s++)for(let t=0;t<e;t++)for(let u=0;u<mid;u++)out[s][t]+=A[a][c][s][u]*B[b][f][u][t];return out;
  }));
 }
 const pair=(a,b)=>a.flatMap(x=>b.map(y=>x*y));
 function expectation(tensors,operators,left,right){
  if(tensors.length!==operators.length)throw Error("逐站MPO长度不匹配");
  let E=mpo.boundary(left);for(let j=0;j<tensors.length;j++)E=mpo.growLeft(E,tensors[j],operators[j]);
  return right.reduce((s,v,a)=>s+v*E[a][0][0],0);
 }
 function moments(tensors,g){
  const n=tensors.length,W=mpo.ising(g),W2=compose(W,W),l=[0,0,1],r=[1,0,0],I=[[[[1,0],[0,1]]]],Z=[[[[1,0],[0,-1]]]];
  const norm=expectation(tensors,Array(n).fill(I),[1],[1]);
  if(!(norm>0))throw Error("态范数须为正");
  const E=expectation(tensors,Array(n).fill(W),l,r)/norm,H2=expectation(tensors,Array(n).fill(W2),pair(l,l),pair(r,r))/norm,rawVariance=H2-E*E;
  // A display resolution heuristic, not a rigorously propagated roundoff bound.
  const resolution=128*Number.EPSILON*n*Math.max(1,Math.abs(H2),E*E),resolved=rawVariance>resolution;
  if(rawVariance < -resolution)throw Error("方差出现超出分辨标度的负值，请检查收缩与数值误差");
  return {norm,E,H2,rawVariance,resolution,resolved,residual:Math.sqrt(Math.max(0,rawVariance)),parity:expectation(tensors,Array(n).fill(Z),[1],[1])/norm};
 }
 function starts(n){return [
  {name:"60°乘积态",angles:Array(n).fill(Math.PI/3)},
  {name:"Z全上（初始P=+1）",angles:Array(n).fill(0)},
  {name:"Z单翻转（初始P=−1）",angles:Array.from({length:n},(_,j)=>j===0?Math.PI:0)},
  {name:"X全正乘积态",angles:Array(n).fill(Math.PI/2)}];}
 function compare(length,g,chi,rounds){return starts(length).map(start=>{
  const run=mpo.run(length,g,chi,rounds,32,undefined,start.angles),m=moments(run.tensors,g);
  return {name:start.name,angles:start.angles,run,m};
 });}
 const configs={diagnostics:{title:"能量停住以后，整条链真的接近本征态吗？",predict:"先预测：Z单翻转初态与Z全上初态，能否在相同扫描规则下得到相同能量？哪一个可能有很小方差，却仍不是基态？",
 scope:"开放Ising链J=1，四个固定归一化实乘积初态，每个都从头扫描；χ/轮数相同，局部Krylov上限32。真实MPO乘积构造H²，分别收缩H²、H、I和奇偶算符P，测最终截断后的全链态。",
 controls:[["length","站点数 L",4,8,2,6],["g","横场比 g",.5,2,.25,1],["chi","所有键维上限 χ",1,4,1,2],["rounds","完整往返轮数",1,3,1,2]],
 compute(v){const rows=compare(v.length,v.g,v.chi,v.rounds),ground=rows[0].run.ground;return {numeric:rows,rows:[["精确开放链基态 E₀",ground],...rows.flatMap(({name,run,m})=>[[name+"／最终能量",m.E],[name+"／E−E₀",m.E-ground],[name+"／范数平方",m.norm],[name+"／〈H²〉",m.H2],[name+"／原始方差差值",m.rawVariance],[name+"／方差分辨标度",m.resolution],[name+"／全链残差范数",m.resolved?m.residual:"低于浮点分辨标度；不作零残差证书"],[name+"／〈P〉",m.parity],[name+"／最大局部Ritz残差",run.maxResidual]])],
 chart:{title:"同一预算，四个初态的扫描轨迹",xlabel:"两站点更新次数",ylabel:"E−精确E₀（J=1）",series:rows.map(({name,run})=>({label:name,points:[[0,run.start-ground],...run.history.map(s=>[s.index,s.E-ground])]}))},
 text:"方差是〈H²〉−〈H〉²，接近零时会发生大数相减；原始差值和启发式浮点分辨标度同时展示，标度不是严格误差界。低于它的数值不声称数学上的零。小方差只说明接近某个能量本征子空间；多初态比较也不能证明搜遍所有态。当前实现未使用精确量子数张量，奇偶守恒须结合〈P〉实测，不能假定浮点/截断永远保持。"};}}
 };
 return Object.assign(core.create("research-variance",configs),{compose,pair,expectation,moments,starts,compare});
});
