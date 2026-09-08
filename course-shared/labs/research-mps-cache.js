(function(root,factory){
 "use strict";const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("./research-environments.js"):root.ResearchEnvironments,node?require("./research-two-site.js"):root.ResearchTwoSite);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-mps-cache",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,env,two){
 "use strict";
 const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]];
 const zeros=n=>Array.from({length:n},()=>Array(n).fill(0)),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),mv=(A,v)=>A.map(r=>dot(r,v)),transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
 const empty=()=>({G:[[1]],K:[[0]],C:[[0]]});
 function growLeft(E,A,g){
  const dl=A[0].length,dr=A[0][0].length,G=zeros(dr),K=zeros(dr),C=zeros(dr);
  for(let r=0;r<dr;r++)for(let rp=0;rp<dr;rp++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)for(let l=0;l<dl;l++)for(let lp=0;lp<dl;lp++){
   const w=A[s][l][r]*A[t][lp][rp];
   G[r][rp]+=w*I[s][t]*E.G[l][lp];C[r][rp]+=w*X[s][t]*E.G[l][lp];
   K[r][rp]+=w*(I[s][t]*E.K[l][lp]-g*Z[s][t]*E.G[l][lp]-X[s][t]*E.C[l][lp]);
  }return {G,K,C};
 }
 const growRight=(E,A,g)=>env.growRight(E.G,E.K,E.C,A,g);
 function effective(L,R,g){
  const dl=L.G.length,dr=R.G.length,H=zeros(4*dl*dr);
  for(let l=0;l<dl;l++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)for(let r=0;r<dr;r++)for(let lp=0;lp<dl;lp++)for(let sp=0;sp<2;sp++)for(let tp=0;tp<2;tp++)for(let rp=0;rp<dr;rp++)
   H[((l*2+s)*2+t)*dr+r][((lp*2+sp)*2+tp)*dr+rp]=L.K[l][lp]*I[s][sp]*I[t][tp]*R.G[r][rp]+L.G[l][lp]*I[s][sp]*I[t][tp]*R.K[r][rp]
    -g*L.G[l][lp]*(Z[s][sp]*I[t][tp]+I[s][sp]*Z[t][tp])*R.G[r][rp]-L.C[l][lp]*X[s][sp]*I[t][tp]*R.G[r][rp]
    -L.G[l][lp]*I[s][sp]*X[t][tp]*R.C[r][rp]-L.G[l][lp]*X[s][sp]*X[t][tp]*R.G[r][rp];
  return H;
 }
 function merge(A,B){const dl=A[0].length,dr=B[0][0].length,k=A[0][0].length;
  return Array.from({length:2*dl},(_,i)=>Array.from({length:2*dr},(_,j)=>{let v=0;for(let b=0;b<k;b++)v+=A[i%2][Math.floor(i/2)][b]*B[Math.floor(j/dr)][b][j%dr];return v;}));
 }
 function split(M,chi,direction){
  const dl=M.length/2,dr=M[0].length/2,rank=Math.min(chi,M.length,M[0].length);
  const s=two.split(direction===1?M:transpose(M),rank);
  const left=direction===1?s.A:transpose(s.B),right=direction===1?s.B:transpose(s.A);
  const A=Array.from({length:2},(_,t)=>Array.from({length:dl},(_,l)=>left[l*2+t].slice()));
  const B=Array.from({length:2},(_,t)=>Array.from({length:rank},(_,b)=>right[b].slice(t*dr,(t+1)*dr)));
  return {A,B,epsilon:s.epsilon};
 }
 const initial=L=>Array.from({length:L},()=>[[[Math.cos(Math.PI/6)]],[[Math.sin(Math.PI/6)]]]);
 function contract(tensors,g){return tensors.reduce((E,A)=>growLeft(E,A,g),empty());}
 function exactGround(L,g){
  // Open-chain Majorana matrix: diagonal g, subdiagonal -1. H=i a^T T b.
  const T=zeros(L);for(let i=0;i<L;i++){T[i][i]=g;if(i)T[i][i-1]=-1;}
  const gram=T.map((_,i)=>T.map((_,j)=>T.reduce((s,row)=>s+row[i]*row[j],0)));
  return -env.eigen(gram).values.reduce((s,x)=>s+Math.sqrt(Math.max(0,x)),0);
 }
 function identityError(G){return Math.max(...G.flatMap((r,i)=>r.map((x,j)=>Math.abs(x-(i===j?1:0)))));}
 function run(length,g,chi,rounds,inspect){
  if(!Number.isFinite(g)||g<=0||!Number.isInteger(length)||length<2||!Number.isInteger(chi)||chi<1||!Number.isInteger(rounds)||rounds<1)throw Error("无效链长、键维或轮数");
  const tensors=initial(length),right=Array(length+1),left=Array(length+1),history=[];
  right[length]=empty();let environmentSteps=0;
  for(let j=length-1;j>=0;j--){right[j]=growRight(right[j+1],tensors[j],g);environmentSteps++;}
  const start=right[0].K[0][0]/right[0].G[0][0];let maxMetricError=0;
  for(let round=1;round<=rounds;round++)for(const direction of [1,-1]){
   if(direction===1)left[0]=empty();else right[length]=empty();
   const bonds=Array.from({length:length-1},(_,i)=>direction===1?i:length-2-i);
   for(const j of bonds){
    const L=left[j],R=right[j+2],H=effective(L,R,g),old=merge(tensors[j],tensors[j+1]).flat(),before=dot(old,mv(H,old))/dot(old,old),sol=env.eigen(H),dl=L.G.length,dr=R.G.length;
    const M=Array.from({length:2*dl},(_,i)=>sol.vector.slice(i*2*dr,(i+1)*2*dr));
    const s=split(M,chi,direction);tensors[j]=s.A;tensors[j+1]=s.B;
    const v=merge(s.A,s.B).flat(),E=dot(v,mv(H,v))/dot(v,v),metric=Math.max(identityError(L.G),identityError(R.G));maxMetricError=Math.max(maxMetricError,metric);
    const step={index:history.length+1,round,direction,bond:j+1,before,optimized:sol.values[0],E,epsilon:s.epsilon,dimension:H.length,center:direction===1?j+2:j+1};history.push(step);
    if(inspect)inspect({tensors,L,R,H,j,step});
    if(direction===1)left[j+1]=growLeft(left[j],tensors[j],g);else right[j+1]=growRight(right[j+2],tensors[j+1],g);
    environmentSteps++;
   }
  }
  const all=contract(tensors,g),norm=all.G[0][0],E=all.K[0][0]/norm,ground=exactGround(length,g);
  return {tensors,history,E,ground,norm,start,maxMetricError,environmentSteps,measurementSteps:length,naiveEnvironmentSteps:history.length*(length-2),storage:tensors.reduce((s,A)=>s+A.flat(2).length,0),maxLocalDimension:Math.max(...history.map(x=>x.dimension)),maxDiscard:Math.max(...history.map(x=>x.epsilon)),rises:history.filter(x=>x.E>x.before+1e-10).length};
 }
 const configs={cached:{title:"中心向前一步，整条链需要从头再算吗？",predict:"先预测：更新两个中心张量后，远端哪些环境仍能复用？截断后的能量是否必然下降？",
 scope:"开放 Ising 链，J=1、Pauli ±1、固定60°实乘积初态；实际存储MPS张量和G/K/C环境。双向两站点求解及SVD，所有候选直接接受；每轮左右各L−1次。使用小型稠密局部求解器，未实现一般MPO或大规模稀疏求解。",
 controls:[["length","站点数 L",4,12,2,8],["g","横场比 g",.5,2,.1,1],["chi","所有键的维数上限 χ",1,4,1,2],["rounds","完整往返轮数",1,3,1,2]],
 compute(v){const m=run(v.length,v.g,v.chi,v.rounds);return {numeric:m,rows:[["MPS收缩能量",m.E],["同一开放链的精确基态能量",m.ground],["剩余能量差",m.E-m.ground],["范数平方",m.norm],["实际存储的实张量系数数",m.storage],["完整波函数需要的系数数",2**v.length],["最大局部矩阵维数",m.maxLocalDimension],["扫描环境递推次数（含初建）",m.environmentSteps],["每步重建两侧所需递推次数",m.naiveEnvironmentSteps],["最终能量另需递推次数",m.measurementSteps],["最大块基正交误差",m.maxMetricError],["最大单次丢弃权重",m.maxDiscard],["截断后升能次数（容差10⁻¹⁰）",m.rises],...m.history.map(x=>["第"+x.index+"步／键"+x.bond+(x.direction===1?" →":" ←"),"E="+core.format(x.E)+"；ΔE="+core.format(x.E-x.before)+"；ε="+core.format(x.epsilon)+"；中心站"+x.center])],
 chart:{title:"张量扫描中的剩余能量差",xlabel:"两站点更新次数",ylabel:"E−精确E₀（J=1）",series:[{label:"接受的MPS",points:[[0,m.start-m.ground],...m.history.map(x=>[x.index,x.E-m.ground])]},{label:"精确参照",points:[[0,0],[m.history.length,0]]}]},
 text:"每次调参从同一初态重跑。环境计数只统计G/K/C递推，不是总运行时间；局部对角化和SVD成本另计。这里未启用升能拒绝，SVD仍可能升能。精确参照来自该Ising链的Majorana奇异值，未构造完整波函数；约10⁻¹²以下偏差按舍入解释。能量接近或稳定都不能替代一般收敛证明。"};}}
 };
 return Object.assign(core.create("research-mps-cache",configs),{run,growLeft,growRight,effective,merge,split,initial,contract,exactGround});
});
