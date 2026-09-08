(function(root,factory){
 "use strict";
 const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("./research-environments.js"):root.ResearchEnvironments,node?require("./research-two-site.js"):root.ResearchTwoSite);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-sweeps",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,env,two){
 "use strict";
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),mv=(A,v)=>A.map(r=>dot(r,v)),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>{const bt=T(B);return A.map(row=>bt.map(col=>dot(row,col)));};
 const energy=(H,v)=>dot(v,mv(H,v));
 const RANK_TOL=1e-12,ENERGY_TOL=1e-10;
 function blockBasis(psi,cut,side){
  const M=Array.from({length:2**cut},(_,i)=>psi.slice(i*2**(4-cut),(i+1)*2**(4-cut)));
  const rho=side==="left"?mul(M,T(M)):mul(T(M),M),e=env.eigen(rho);
  const keep=e.values.map((v,i)=>[v,i]).filter(([v])=>v>RANK_TOL).reverse().map(([,i])=>i);
  if(!keep.length)throw Error("块态丢失全部支撑");
  return e.vectors.map(row=>keep.map(i=>row[i]));
 }
 function searchSpace(psi,j){
  const L=blockBasis(psi,j,"left"),R=blockBasis(psi,j+2,"right"),dl=L[0].length,dr=R[0].length;
  const W=Array.from({length:16},()=>Array(dl*4*dr).fill(0));
  for(let left=0;left<L.length;left++)for(let right=0;right<R.length;right++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)for(let l=0;l<dl;l++)for(let r=0;r<dr;r++)
   W[(left*4+s*2+t)*R.length+right][((l*2+s)*2+t)*dr+r]=L[left][l]*R[right][r];
  return {L,R,W,dl,dr};
 }
 function update(psi,H,j,chi,guard){
  const space=searchSpace(psi,j),{W,dl,dr}=space,Heff=mul(mul(T(W),H),W),solution=env.eigen(Heff),a=solution.vector;
  const M=Array.from({length:dl*2},(_,i)=>a.slice(i*2*dr,(i+1)*2*dr)),split=two.split(M,Math.min(chi,dl*2,dr*2)),candidate=mv(W,split.matrix.flat());
  const before=energy(H,psi),trial=energy(H,candidate),accepted=!guard||trial<=before+ENERGY_TOL,state=accepted?candidate:psi.slice();
  const projection=mv(W,mv(T(W),psi));
  return {...space,Heff,optimized:solution.values[0],optimizedState:mv(W,a),before,trial,accepted,state,candidate,after:energy(H,state),epsilon:split.epsilon,representedError:Math.hypot(...projection.map((v,i)=>v-psi[i]))};
 }
 function initial(){let v=[1];const c=Math.cos(Math.PI/6),s=Math.sin(Math.PI/6);for(let i=0;i<4;i++)v=v.flatMap(x=>[x*c,x*s]);return v;}
 function run(g,chi,rounds,guard){
  const H=env.hamiltonian(g),ground=env.eigen(H).values[0];let psi=initial();const start=energy(H,psi),history=[];
  for(let round=1;round<=rounds;round++)for(const j of [0,1,2,1,0]){const step=update(psi,H,j,chi,guard);psi=step.state;history.push({...step,round,bond:j+1,index:history.length+1});}
  const E=energy(H,psi),residual=Math.hypot(...mv(H,psi).map((v,i)=>v-E*psi[i]));
  return {H,psi,start,ground,E,residual,norm:dot(psi,psi),history,rejected:history.filter(x=>!x.accepted).length,maxDiscard:Math.max(...history.map(x=>x.epsilon))};
 }
 const configs={roundtrip:{title:"每次移动中心以后，环境还可以沿用吗？",predict:"先预测：加上拒绝升能的规则，是否就能保证找到精确基态？",
 scope:"开放四站 Ising，Pauli ±1，J=1；固定60°实乘积初态。每轮依次更新键1、2、3、2、1。用完整16维态重建块基及投影矩阵，演示完整往返逻辑，不是大链高效实现。",
 controls:[["g","横场比 g",.2,2,.1,1],["chi","所有键的维数上限 χ",1,4,1,2],["rounds","往返轮数",1,5,1,2],["guard","拒绝升能候选（0 关 / 1 开）",0,1,1,1]],
 compute(v){const m=run(v.g,v.chi,v.rounds,v.guard);return {numeric:m,
 rows:[["初态能量",m.start],["最终接受态能量",m.E],["精确四站基态能量",m.ground],["剩余能量差",m.E-m.ground],["完整物理残差",m.residual],["态范数平方",m.norm],["更新尝试数",m.history.length],["拒绝次数",m.rejected],["单步最大丢弃权重",m.maxDiscard],["最大当前态投影误差",Math.max(...m.history.map(x=>x.representedError))],...m.history.map(x=>["第"+x.index+"步／键"+x.bond,"旧 "+core.format(x.before)+" → 解 "+core.format(x.optimized)+" → 截 "+core.format(x.trial)+"；ΔE="+core.format(x.trial-x.before)+"；ε="+core.format(x.epsilon)+"；"+(x.accepted?"接受":"拒绝，保留旧态")])],
 chart:{title:"候选与接受态距基态多远？",xlabel:"更新尝试编号",ylabel:"相对精确基态的能量差（J=1）",xticks:[0,Math.ceil(m.history.length/2),m.history.length],series:[{label:"实际接受态",points:[[0,m.start-m.ground],...m.history.map(x=>[x.index,x.after-m.ground])]},{label:"未截断局部最优",points:m.history.map(x=>[x.index,x.optimized-m.ground])},{label:"归一化截断候选",points:m.history.map(x=>[x.index,x.trial-m.ground])},{label:"完整四站基态",points:[[0,0],[m.history.length,0]]}]},
 text:"ΔE 是归一化截断候选减旧态的能量差，正值表示候选升能。曲线已减去精确基态能量，表格仍列绝对能量。每次调参都从同一初态重新运行。χ 限制所有三条键；拒绝时下一步仍从旧态重建环境。升能容差10⁻¹⁰，块支撑权重阈值10⁻¹²。约10⁻¹⁴量级的负能量差属于浮点舍入。能量停止变化与单次ε很小都不等于全局收敛，仍需检查完整残差与χ敏感性。"};}}
 };
 return Object.assign(core.create("research-sweeps",configs),{run,update,searchSpace,blockBasis,initial});
});
