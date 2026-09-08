(function(root,factory){
 "use strict";const node=typeof module==="object"&&module.exports;
 const lib=factory(node?require("../research-renderer.js"):root.ResearchLab,node?require("./research-environments.js"):root.ResearchEnvironments,node?require("./research-mps-cache.js"):root.ResearchMPSCache);
 if(node)module.exports=lib;else {root.ResearchMPO=lib;if(root.CourseLearning)root.CourseLearning.register("research-mpo",lib.mount);}
})(typeof globalThis!=="undefined"?globalThis:this,function(core,env,mps){
 "use strict";
 const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]],zero=()=>[[0,0],[0,0]],scale=(A,c)=>A.map(r=>r.map(v=>v*c));
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.sqrt(dot(a,a)),matrix=(n,m)=>Array.from({length:n},()=>Array(m).fill(0)),boundary=v=>v.map(x=>[[x]]);
 function ising(g){return [[I,zero(),zero()],[X,zero(),zero()],[scale(Z,-g),scale(X,-1),I]];}
 function entries(W){const list=[];for(let a=0;a<W.length;a++)for(let b=0;b<W[a].length;b++)for(let s=0;s<W[a][b].length;s++)for(let t=0;t<W[a][b][s].length;t++){const v=W[a][b][s][t];if(v)list.push({a,b,s,t,v});}return list;}
 function growLeft(E,A,W){const dl=A[0].length,dr=A[0][0].length,out=Array.from({length:W[0].length},()=>matrix(dr,dr));
  for(const {a,b,s,t,v} of entries(W))for(let r=0;r<dr;r++)for(let rp=0;rp<dr;rp++)for(let l=0;l<dl;l++)for(let lp=0;lp<dl;lp++)out[b][r][rp]+=v*A[s][l][r]*E[a][l][lp]*A[t][lp][rp];return out;
 }
 function growRight(E,A,W){const dl=A[0].length,dr=A[0][0].length,out=Array.from({length:W.length},()=>matrix(dl,dl));
  for(const {a,b,s,t,v} of entries(W))for(let l=0;l<dl;l++)for(let lp=0;lp<dl;lp++)for(let r=0;r<dr;r++)for(let rp=0;rp<dr;rp++)out[a][l][lp]+=v*A[s][l][r]*E[b][r][rp]*A[t][lp][rp];return out;
 }
 function action(L,R,W,V){
  const dl=L[0].length,dr=R[0].length,d=W[0][0].length,e=V[0][0].length,terms=[],WE=entries(W),VE=entries(V);
  for(const a of WE)for(const b of VE)if(a.b===b.a)terms.push({a:a.a,c:b.b,s:a.s,t:b.s,sp:a.t,tp:b.t,v:a.v*b.v});
  const index=(l,s,t,r)=>((l*d+s)*e+t)*dr+r;
  return theta=>{if(theta.length!==dl*d*e*dr)throw Error("局部向量维数不相容");const out=Array(theta.length).fill(0);
   for(const q of terms)for(let l=0;l<dl;l++)for(let lp=0;lp<dl;lp++)for(let r=0;r<dr;r++)for(let rp=0;rp<dr;rp++)out[index(l,q.s,q.t,r)]+=q.v*L[q.a][l][lp]*R[q.c][r][rp]*theta[index(lp,q.sp,q.tp,rp)];return out;};
 }
 function krylov(apply,start,maxSteps,tol=1e-11){
  if(!Number.isInteger(maxSteps)||maxSteps<1||!start.length||!start.every(Number.isFinite)||norm(start)===0)throw Error("无效Krylov输入");
  const Q=[],HQ=[];let q=start.map(x=>x/norm(start)),breakdown=false;
  for(let k=0;k<Math.min(maxSteps,start.length);k++){
   Q.push(q);const hq=apply(q);HQ.push(hq);let w=hq.slice();
   for(let pass=0;pass<2;pass++)for(const b of Q){const v=dot(b,w);w=w.map((x,i)=>x-v*b[i]);}
   const beta=norm(w);if(beta<=tol){breakdown=true;break;}q=w.map(x=>x/beta);
  }
  const B=Q.map((a,i)=>Q.map((b,j)=>(dot(a,HQ[j])+dot(b,HQ[i]))/2)),sol=env.eigen(B);
  const vector=start.map((_,i)=>Q.reduce((s,q,j)=>s+q[i]*sol.vector[j],0)),vnorm=norm(vector),v=vector.map(x=>x/vnorm),Hv=apply(v),energy=dot(v,Hv),residual=norm(Hv.map((x,i)=>x-energy*v[i]));
  const orthogonality=Math.max(...Q.flatMap((q,i)=>Q.map((p,j)=>Math.abs(dot(q,p)-(i===j?1:0)))));
  return {vector:v,energy,residual,steps:Q.length,actions:Q.length+1,breakdown,orthogonality};
 }
 function run(length,g,chi,rounds,maxSteps,inspect,angles){
  if(!Number.isInteger(length)||length<2||!Number.isFinite(g)||g<=0||!Number.isInteger(chi)||chi<1||!Number.isInteger(rounds)||rounds<1)throw Error("无效扫描参数");
  if(angles!==undefined&&(!Array.isArray(angles)||angles.length!==length||!angles.every(Number.isFinite)))throw Error("初态角度须逐站给出有限实数");
  const clean=x=>Math.abs(x)<1e-15?0:x;
  const W=ising(g),tensors=angles===undefined?mps.initial(length):angles.map(t=>[[[clean(Math.cos(t/2))]],[[clean(Math.sin(t/2))]]]),left=[],right=[],history=[];right[length]=boundary([1,0,0]);
  for(let j=length-1;j>=0;j--)right[j]=growRight(right[j+1],tensors[j],W);
  const start=right[0][2][0][0];let actions=0;
  for(let round=1;round<=rounds;round++)for(const direction of [1,-1]){
   if(direction===1)left[0]=boundary([0,0,1]);else right[length]=boundary([1,0,0]);
   for(let k=0;k<length-1;k++){
    const j=direction===1?k:length-2-k,apply=action(left[j],right[j+2],W,W),old=mps.merge(tensors[j],tensors[j+1]).flat(),before=dot(old,apply(old))/dot(old,old),sol=krylov(apply,old,maxSteps),dl=tensors[j][0].length,dr=tensors[j+1][0][0].length;
    const M=Array.from({length:2*dl},(_,i)=>sol.vector.slice(i*2*dr,(i+1)*2*dr)),s=mps.split(M,chi,direction);tensors[j]=s.A;tensors[j+1]=s.B;
    const candidate=mps.merge(s.A,s.B).flat(),E=dot(candidate,apply(candidate))/dot(candidate,candidate);actions+=sol.actions+2;
    const step={index:history.length+1,bond:j+1,direction,before,optimized:sol.energy,E,epsilon:s.epsilon,residual:sol.residual,steps:sol.steps,dimension:old.length,orthogonality:sol.orthogonality};history.push(step);
    if(inspect)inspect({tensors,j,apply,step,L:left[j],R:right[j+2]});
    if(direction===1)left[j+1]=growLeft(left[j],s.A,W);else right[j+1]=growRight(right[j+2],s.B,W);
   }
  }
  const end=tensors.reduce((E,A)=>growLeft(E,A,W),boundary([0,0,1])),norm2=mps.contract(tensors,g).G[0][0],E=end[0][0][0]/norm2;
  return {tensors,history,start,E,ground:mps.exactGround(length,g),norm:norm2,actions,environmentSteps:length+history.length,maxResidual:Math.max(...history.map(x=>x.residual)),maxKrylov:Math.max(...history.map(x=>x.steps)),maxDimension:Math.max(...history.map(x=>x.dimension))};
 }
 const configs={operator:{title:"只会计算H乘向量，能求局部最低态吗？",predict:"先预测：Krylov步数较少时，局部残差和截断误差会表现为同一种误差吗？",
 scope:"真实实MPO张量及双向环境；开放Ising链J=1、Pauli±1。不构造局部稠密H，以算符作用建立再正交Krylov空间，求解其中的小投影矩阵。固定60°乘积初态、全部截断候选接受。",
 controls:[["length","站点数 L",4,10,2,8],["g","横场比 g",.5,2,.25,1],["chi","所有键维上限 χ",1,4,1,2],["rounds","完整往返轮数",1,3,1,2],["steps","每次Krylov最大步数",2,32,2,16]],
 compute(v){const m=run(v.length,v.g,v.chi,v.rounds,v.steps);return {numeric:m,rows:[["最终MPO收缩能量",m.E],["开放链精确基态",m.ground],["剩余能量差",m.E-m.ground],["范数平方",m.norm],["最大未截断局部Ritz残差",m.maxResidual],["最大局部向量维数",m.maxDimension],["最大实际Krylov维数",m.maxKrylov],["局部算符作用总次数",m.actions],["MPO环境递推次数（含初建）",m.environmentSteps],...m.history.map(s=>["第"+s.index+"步／键"+s.bond+(s.direction===1?"→":"←"),"E="+core.format(s.E)+"；r="+core.format(s.residual)+"；ε="+core.format(s.epsilon)+"；K="+s.steps])],
 chart:{title:"局部求解精度与扫描",xlabel:"两站点更新次数",ylabel:"未截断局部残差",series:[{label:"直接计算‖Hv−λv‖",points:m.history.map(s=>[s.index,s.residual])}]},
 text:"残差在当前局部空间、SVD截断之前测量，不是完整物理残差。Krylov初向量为旧中心态；不含低能方向的初向量可能困在不变子空间。增加迭代步数、减小截断及改变初态是不同检查。此页以Ising演示一般兼容实MPO收缩接口，未自动编码任意Hamiltonian，也未给出大规模性能保证。"};}}
 };
 return Object.assign(core.create("research-mpo",configs),{ising,entries,boundary,growLeft,growRight,action,krylov,run});
});
