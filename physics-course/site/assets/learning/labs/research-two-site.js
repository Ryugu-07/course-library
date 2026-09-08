(function(root,factory){
 "use strict";
 const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("./research-environments.js"):root.ResearchEnvironments);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-two-site",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,env){
 "use strict";
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),mv=(A,v)=>A.map(r=>dot(r,v));
 const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
 const mul=(A,B)=>A.map(r=>transpose(B).map(c=>dot(r,c)));
 // Left singular subspace from MM^T. U^T M stores sigma*V^T without dividing by tiny sigma.
 function split(M,r){
  const n=M.length;
  if(!Number.isInteger(r)||r<1||r>Math.min(n,M[0].length))throw Error("无效保留数");
  const eig=env.eigen(mul(M,transpose(M))),order=Array.from({length:n},(_,i)=>n-1-i);
  const U=eig.vectors.map(row=>order.map(i=>row[i])),Bfull=mul(transpose(U),M);
  const weights=Bfull.map(row=>dot(row,row)),q=weights.slice(0,r).reduce((a,b)=>a+b,0),epsilon=weights.slice(r).reduce((a,b)=>a+b,0);
  if(q<=0)throw Error("不能归一化零态");
  const A=U.map(row=>row.slice(0,r)),B=Bfull.slice(0,r).map(row=>row.map(v=>v/Math.sqrt(q)));
  return {A,B,weights,q,epsilon,unnormalized:mul(A,Bfull.slice(0,r)),matrix:mul(A,B)};
 }
 const cache=new Map();
 function optimized(g){if(!cache.has(g)){const H=env.hamiltonian(g),e=env.eigen(H);cache.set(g,{H,psi:e.vector,E:e.values[0],top:e.values.at(-1)});}return cache.get(g);}
 function calculate(g,r){
  const o=optimized(g),M=Array.from({length:4},(_,i)=>o.psi.slice(i*4,i*4+4)),s=split(M,r),phi=s.matrix.flat(),Hphi=mv(o.H,phi),energy=dot(phi,Hphi);
  return {...s,psi:o.psi,phi,ground:o.E,top:o.top,initial:-3,energy,gap:energy-o.E,fidelity:dot(phi,o.psi)**2,
   norm:dot(phi,phi),distance:Math.hypot(...phi.map((v,i)=>v-o.psi[i])),residual:Math.hypot(...Hphi.map((v,i)=>v-energy*phi[i])),bound:(o.top-o.E)*s.epsilon};
 }
 const configs={split:{title:"求解后截断，能量还会一直下降吗？",predict:"先预测：保留最大的奇异值，是在优化态的距离，还是在优化能量？",
 scope:"四站开放 Ising，Pauli ±1，J=1。外块为站1和站4的完整正交基；中心站2–3的16维问题在此特例等于全链求解。只更新中间一条键，未执行扫描。",
 controls:[["g","横场比 g",.2,2,.1,1],["r","中间键保留数 r",1,4,1,2]],
 compute(v){const m=calculate(v.g,v.r),all=[1,2,3,4].map(r=>[r,calculate(v.g,r)]);return {numeric:m,
 rows:[["更新前 |+⟩⁴ 的能量",m.initial],["截断前最低能量",m.ground],["归一化截断后能量",m.energy],["截断后相对更新前的能量变化",m.energy-m.initial],["丢弃权重 ε",m.epsilon],["保真度 |⟨ψ|φ⟩|²",m.fidelity],["归一化态距离",m.distance],["截断后范数平方",m.norm],["截断后物理残差",m.residual],["能量偏差 Eφ−E₀",m.gap],["本例能量偏差上界",m.bound],...m.weights.map((w,i)=>["Schmidt 权重 σ"+(i+1)+"²",w])],
 chart:{title:"固定 g，仅改变中间键保留数",xlabel:"保留数 r",ylabel:"能量（J=1）",xticks:[1,2,3,4],series:[{label:"归一化截断后",points:all.map(([r,x])=>[r,x.energy])},{label:"截断前最低能量",points:[[1,m.ground],[4,m.ground]]},{label:"更新前 |+⟩⁴",points:[[1,-3],[4,-3]]}],marker:[v.r,m.energy]},
 text:"r 只限制中间键，外侧两键仍可达2；r=1 不表示四个站完全无纠缠。试 g=0.2、r=1：截断后能量高于更新前。丢弃权重控制态误差；SVD 没有保证截断后相对旧态降能。约 10⁻¹⁴ 的负能量偏差属于浮点舍入。"};}}
 };
 return Object.assign(core.create("research-two-site",configs),{split,calculate});
});
