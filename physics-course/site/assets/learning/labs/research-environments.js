(function(root,factory){
 "use strict";
 const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
 const lib=factory(core);
 if(typeof module==="object"&&module.exports)module.exports=lib;
 else if(root.CourseLearning)root.CourseLearning.register("research-environments",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]];
 const zeros=n=>Array.from({length:n},()=>Array(n).fill(0));
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const mv=(A,v)=>A.map(r=>dot(r,v));
 const norm=v=>Math.hypot(...v);
 function eigen(A){
  const a=A.map(r=>r.slice()),n=a.length,V=zeros(n);for(let i=0;i<n;i++)V[i][i]=1;
  for(let sweep=0;sweep<60;sweep++){
   let max=0;
   for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
    const apq=a[p][q];max=Math.max(max,Math.abs(apq));if(Math.abs(apq)<1e-14)continue;
    const angle=.5*Math.atan2(2*apq,a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle),app=a[p][p],aqq=a[q][q];
    for(let k=0;k<n;k++)if(k!==p&&k!==q){const u=a[k][p],v=a[k][q];a[k][p]=a[p][k]=c*u-s*v;a[k][q]=a[q][k]=s*u+c*v;}
    for(let k=0;k<n;k++){const u=V[k][p],v=V[k][q];V[k][p]=c*u-s*v;V[k][q]=s*u+c*v;}
    a[p][p]=c*c*app-2*c*s*apq+s*s*aqq;a[q][q]=s*s*app+2*c*s*apq+c*c*aqq;a[p][q]=a[q][p]=0;
   }
   if(max<1e-12){const order=Array.from({length:n},(_,i)=>i).sort((i,j)=>a[i][i]-a[j][j]);return {values:order.map(i=>a[i][i]),vector:V.map(r=>r[order[0]])};}
  }
  throw Error("对角化未收敛");
 }
 // Real-valued right-block contraction, with bra index first in every environment.
 function growRight(G,K,C,B,g){
  const n=B[0].length,m=G.length,gn=zeros(n),kn=zeros(n),cn=zeros(n);
  for(let b=0;b<n;b++)for(let bp=0;bp<n;bp++)for(let s=0;s<2;s++)for(let t=0;t<2;t++)for(let r=0;r<m;r++)for(let rp=0;rp<m;rp++){
   const weight=B[s][b][r]*B[t][bp][rp];
   gn[b][bp]+=weight*(s===t?G[r][rp]:0);
   cn[b][bp]+=weight*X[s][t]*G[r][rp];
   kn[b][bp]+=weight*((s===t?K[r][rp]:0)-g*Z[s][t]*G[r][rp]-X[s][t]*C[r][rp]);
  }
  return {G:gn,K:kn,C:cn};
 }
 function environments(alpha,g){
  const a=alpha*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const B4=[[[1],[0]],[[0],[1]]],B3=[[[c,0],[0,1]],[[0,s],[0,0]]];
  const last=growRight([[1]],[[0]],[[0]],B4,g);
  return {...growRight(last.G,last.K,last.C,B3,g),last,R:[[c,0],[0,1],[0,0],[s,0]]};
 }
 function hamiltonian(g){
  const H=zeros(16);
  for(let b=0;b<16;b++){
   H[b][b]=-g*Array.from({length:4},(_,j)=>((b>>(3-j))&1)?-1:1).reduce((s,v)=>s+v,0);
   for(let j=0;j<3;j++)H[b^((1<<(3-j))|(1<<(2-j)))][b]-=1;
  }return H;
 }
 function effective(env,g){
  const H=zeros(8);
  for(let l=0;l<2;l++)for(let s=0;s<2;s++)for(let b=0;b<2;b++)for(let lp=0;lp<2;lp++)for(let sp=0;sp<2;sp++)for(let bp=0;bp<2;bp++)
   H[(l*2+s)*2+b][(lp*2+sp)*2+bp]=
   -g*Z[l][lp]*I[s][sp]*env.G[b][bp]+I[l][lp]*I[s][sp]*env.K[b][bp]
   -g*I[l][lp]*Z[s][sp]*env.G[b][bp]-X[l][lp]*X[s][sp]*env.G[b][bp]-I[l][lp]*X[s][sp]*env.C[b][bp];
  return H;
 }
 const exactCache=new Map();
 function calculate(alpha,g){
  const env=environments(alpha,g),Heff=effective(env,g),solution=eigen(Heff),a=solution.vector,E=solution.values[0],H=hamiltonian(g);
  if(!exactCache.has(g))exactCache.set(g,eigen(H).values[0]);
  const psi=Array(16).fill(0);
  for(let l=0;l<2;l++)for(let s=0;s<2;s++)for(let r=0;r<4;r++)for(let b=0;b<2;b++)psi[(l*2+s)*4+r]+=env.R[r][b]*a[(l*2+s)*2+b];
  return {env,Heff,a,psi,E,ground:exactCache.get(g),localResidual:norm(mv(Heff,a).map((v,i)=>v-E*a[i])),physicalResidual:norm(mv(H,psi).map((v,i)=>v-E*psi[i])),physicalEnergy:dot(psi,mv(H,psi)),norm:dot(psi,psi)};
 }
 const configs={center:{title:"环境固定以后，中心能优化到哪里？",predict:"先预测：8 维局部残差接近零，是否保证完整 16 维态也是本征态？",
 scope:"四站开放 Ising，Pauli ±1、J=1；左块站1，中心站2，右块站3–4。固定正交块基，χL=χR=2。只解一次中心问题，不执行扫描。",
 controls:[["alpha","右块混合角 α（度）",0,90,5,45],["g","横场比 g",.2,2,.1,1]],
 compute(v){const m=calculate(v.alpha,v.g);return {numeric:m,
 rows:[["中心分量数",8],["物理态范数平方",m.norm],["右块边界矩阵非对角元",m.env.C[0][1]],["右块内部能量矩阵 K₀₀",m.env.K[0][0]],["局部最低能量",m.E],["完整态重算能量",m.physicalEnergy],["精确四站基态",m.ground],["剩余能量差",m.E-m.ground],["8 维局部残差",m.localResidual],["16 维物理残差",m.physicalResidual]],
 chart:{title:"固定不同右块时的最优能量",xlabel:"右块混合角 α（度）",ylabel:"能量（J=1）",xticks:[0,45,90],series:[{label:"各固定子空间的最低能量",points:Array.from({length:19},(_,i)=>[i*5,eigen(effective(environments(i*5,v.g),v.g)).values[0]])},{label:"完整四站基态",points:[[0,m.ground],[90,m.ground]]}],marker:[v.alpha,m.E]},
 text:"α 改变右块张成的物理子空间，不只是坐标规范。每个点都重新优化中心；图线连接采样值。局部残差小只证明投影后的方程解得准，物理残差还可非零。"};}}
 };
 return Object.assign(core.create("research-environments",configs),{environments,effective,hamiltonian,calculate,growRight});
});
