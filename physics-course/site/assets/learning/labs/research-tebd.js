(function(root,factory){
 "use strict";const node=typeof module==="object"&&module.exports,lib=factory(node?require("../research-renderer"):root.ResearchLab,node?require("./research-environments"):root.ResearchEnvironments);
 if(node)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-tebd",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core,env){
 "use strict";
 const z=()=>[0,0],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],scale=(a,s)=>[a[0]*s,a[1]*s],conj=a=>[a[0],-a[1]],abs2=a=>a[0]*a[0]+a[1]*a[1];
 const dot=(a,b)=>a.reduce((s,x,i)=>add(s,mul(conj(x),b[i])),z()),norm2=a=>a.reduce((s,x)=>s+abs2(x),0),dag=A=>A[0].map((_,j)=>A.map(r=>conj(r[j]))),mm=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,x,k)=>add(s,mul(x,B[k][j])),z())));
 function columnJacobi(M){
  const n=M[0].length,cols=Array.from({length:n},(_,j)=>M.map(row=>row[j].slice())),R=Array.from({length:n},(_,j)=>Array.from({length:n},(_,i)=>[+(i===j),0]));
  let converged=false;
  for(let sweep=0;sweep<100;sweep++){
   let changed=false;
   for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
    const a=norm2(cols[p]),b=norm2(cols[q]),c=dot(cols[p],cols[q]),size=Math.hypot(...c);
    if(size<=2e-14*Math.sqrt(a*b)||size<1e-300)continue;
    const phase=scale(c,1/size),angle=.5*Math.atan2(2*size,b-a),co=Math.cos(angle),si=Math.sin(angle);
    for(const rows of [cols,R]){const u=rows[p],v=rows[q];rows[p]=u.map((x,i)=>sub(scale(mul(phase,x),co),scale(v[i],si)));rows[q]=u.map((x,i)=>add(scale(mul(phase,x),si),scale(v[i],co)));}
    changed=true;
   }
   if(!changed){converged=true;break;}
  }
  if(!converged)throw Error("复数Jacobi SVD未收敛");
  const order=Array.from({length:n},(_,j)=>j).sort((i,j)=>norm2(cols[j])-norm2(cols[i]));
  return {columns:order.map(i=>cols[i]),right:order.map(i=>R[i])};
 }
 function svdLeft(M){
  const m=M.length,n=M[0].length,Q=[];
  if(m<n){const s=columnJacobi(dag(M));Q.push(...s.right);}
  else{
   const s=columnJacobi(M),largest=Math.sqrt(norm2(s.columns[0]));
   const append=candidate=>{let q=candidate.map(x=>x.slice());for(let pass=0;pass<2;pass++)for(const p of Q){const c=dot(p,q);q=q.map((x,i)=>sub(x,mul(p[i],c)));}const norm=Math.sqrt(norm2(q));if(norm>1e-12)Q.push(q.map(x=>scale(x,1/norm)));};
   for(const col of s.columns){const norm=Math.sqrt(norm2(col));if(norm>largest*1e-14)append(col.map(x=>scale(x,1/norm)));}
   for(let i=0;Q.length<m&&i<m;i++)append(Array.from({length:m},(_,j)=>[+(i===j),0]));
  }
  if(Q.length!==m)throw Error("复奇异向量基不完整");
  const U=Array.from({length:m},(_,i)=>Q.map(q=>q[i])),B=mm(dag(U),M),weights=B.map(norm2);
  return {U,B,weights};
 }
 function split(M,chi,direction=1,normalize=true){
  const source=direction===1?M:dag(M),s=svdLeft(source),rank=Math.min(chi,source.length,source[0].length);
  if(!Number.isInteger(rank)||rank<1)throw Error("无效截断维数");
  const kept=s.weights.slice(0,rank).reduce((a,b)=>a+b,0),lost=s.weights.slice(rank).reduce((a,b)=>a+b,0),total=kept+lost;
  if(!(kept>0))throw Error("零态不能归一化");
  const L=s.U.map(row=>row.slice(0,rank)),R=s.B.slice(0,rank).map(row=>row.map(x=>scale(x,normalize?1/Math.sqrt(kept):1))),A=direction===1?L:dag(R),B=direction===1?R:dag(L),epsilon=lost/total;
  return {A,B,epsilon,delta:Math.sqrt(2*epsilon/(1+Math.sqrt(Math.max(0,1-epsilon)))),weights:s.weights,total};
 }
 function merge(A,B){const dl=A[0].length,dr=B[0][0].length,k=A[0][0].length;return Array.from({length:2*dl},(_,i)=>Array.from({length:2*dr},(_,j)=>{let out=z();for(let b=0;b<k;b++)out=add(out,mul(A[i%2][Math.floor(i/2)][b],B[Math.floor(j/dr)][b][j%dr]));return out;}));}
 function writePair(ts,j,s){const dl=s.A.length/2,dr=s.B[0].length/2,rank=s.B.length;ts[j]=Array.from({length:2},(_,a)=>Array.from({length:dl},(_,l)=>s.A[2*l+a].slice()));ts[j+1]=Array.from({length:2},(_,a)=>Array.from({length:rank},(_,b)=>s.B[b].slice(a*dr,(a+1)*dr)));}
 const initial=n=>Array.from({length:n},()=>[[[[Math.cos(Math.PI/6),0]]],[[[Math.sin(Math.PI/6),0]]]]);
 function field(ts,angle){for(const A of ts)for(let s=0;s<2;s++){const phase=[Math.cos(angle),Math.sin(angle)*(s===0?1:-1)];for(let l=0;l<A[s].length;l++)for(let r=0;r<A[s][l].length;r++)A[s][l][r]=mul(phase,A[s][l][r]);}}
 function twoGate(M,dt){const dr=M[0].length/2,c=Math.cos(dt),is=[0,Math.sin(dt)];return M.map((row,i)=>row.map((x,j)=>add(scale(x,c),mul(is,M[i^1][j<dr?j+dr:j-dr]))));}
 function recenter(ts){for(let j=ts.length-2;j>=0;j--){const rank=ts[j][0][0].length,s=split(merge(ts[j],ts[j+1]),rank,-1,false);writePair(ts,j,s);}}
 function expand(ts){let B=[[[1,0]]];for(const A of ts){const next=[];for(const row of B)for(let s=0;s<2;s++)next.push(A[s][0].map((_,r)=>row.reduce((v,x,l)=>add(v,mul(x,A[s][l][r])),z())));B=next;}return B.flat();}
 function applyH(psi,n,g){return psi.map((x,b)=>{let pop=0;for(let j=0;j<n;j++)pop+=(b>>j)&1;let y=scale(x,-g*(n-2*pop));for(let j=0;j<n-1;j++)y=sub(y,psi[b^(3<<j)]);return y;});}
 function fullStep(psi,n,g,dt){const field=v=>v.map((x,b)=>{let pop=0;for(let j=0;j<n;j++)pop+=(b>>j)&1;const a=g*dt/2*(n-2*pop);return mul(x,[Math.cos(a),Math.sin(a)]);});let v=field(psi);for(let j=0;j<n-1;j++){const old=v,c=Math.cos(dt),is=[0,Math.sin(dt)],mask=3<<(n-2-j);v=old.map((x,b)=>add(scale(x,c),mul(is,old[b^mask])));}return field(v);}
 const cache=new Map();
 function spectral(n,g){const key=n+":"+g;if(!cache.has(key)){const N=2**n,H=Array.from({length:N},()=>Array(N).fill(0));for(let b=0;b<N;b++){let pop=0;for(let j=0;j<n;j++)pop+=(b>>j)&1;H[b][b]=-g*(n-2*pop);for(let j=0;j<n-1;j++)H[b][b^(3<<j)]=-1;}cache.set(key,env.eigen(H));}return cache.get(key);}
 function exact(psi,n,g,t){const e=spectral(n,g),N=psi.length,c=e.values.map((_,j)=>psi.reduce((v,x,i)=>add(v,scale(x,e.vectors[i][j])),z())).map((x,j)=>mul(x,[Math.cos(e.values[j]*t),-Math.sin(e.values[j]*t)]));return psi.map((_,i)=>c.reduce((v,x,j)=>add(v,scale(x,e.vectors[i][j])),z()));}
 const distance=(a,b)=>Math.sqrt(a.reduce((s,x,i)=>s+abs2(sub(x,b[i])),0));
 function observables(psi,n,g){const norm=norm2(psi),E=dot(psi,applyH(psi,n,g))[0]/norm;let magnet=0;psi.forEach((x,b)=>{let pop=0;for(let j=0;j<n;j++)pop+=(b>>j)&1;magnet+=abs2(x)*(n-2*pop)/n/norm;});return {norm,E,magnet};}
 function run(n,g,chi,T,steps,inspect){
  if(!Number.isInteger(n)||n<2||n>8||!Number.isFinite(g)||g<=0||!Number.isInteger(chi)||chi<1||!Number.isFinite(T)||T<=0||!Number.isInteger(steps)||steps<1)throw Error("无效演化参数");
  const ts=initial(n),psi0=expand(ts),dt=T/steps,history=[],truncations=[];let reference=psi0,sumDelta=0,sumEpsilon=0;
  const start=observables(psi0,n,g);
  for(let step=1;step<=steps;step++){
   field(ts,g*dt/2);
   for(let j=0;j<n-1;j++){const before=merge(ts[j],ts[j+1]),gated=twoGate(before,dt),s=split(gated,chi);writePair(ts,j,s);sumDelta+=s.delta;sumEpsilon+=s.epsilon;const item={step,bond:j+1,epsilon:s.epsilon,delta:s.delta};truncations.push(item);if(inspect)inspect({ts,j,gated,split:s,item});}
   field(ts,g*dt/2);recenter(ts);reference=fullStep(reference,n,g,dt);
   const psi=expand(ts),truth=exact(psi0,n,g,step*dt),obs=observables(psi,n,g),trotter=distance(reference,truth),compression=distance(psi,reference),total=distance(psi,truth),trotterBound=step*dt*dt*dt*(g*n+n-1)**3/3;
   history.push({step,t:step*dt,...obs,trotter,compression,total,sumDelta,sumEpsilon,trotterBound,bound:Math.min(2,trotterBound+sumDelta),infidelity:Math.max(0,1-abs2(dot(truth,psi))/norm2(truth)/obs.norm)});
  }
  return {ts,history,truncations,start,dt,final:history.at(-1)};
 }
 const configs={evolution:{title:"每一步误差很小，长期轨迹就可靠吗？",predict:"先预测：固定总时间，步数加倍与键维加倍，分别主要改变哪一种误差？",
 scope:"开放Ising链J=1、固定60°乘积初态、真实复MPS两站点门及SVD；二阶Z/XX/Z分裂。无截断移回正交中心后继续。网页限定4或6站，完整波函数仅用于小链参照和观测，不参与张量更新。",
 controls:[["length","站点数 L",4,6,2,4],["g","横场比 g",.5,2,.5,1],["chi","所有键维上限 χ",1,8,1,2],["T","总演化时间 T",.2,2,.2,1],["steps","时间步数",2,32,2,10]],
 compute(v){const m=run(v.length,v.g,v.chi,v.T,v.steps),f=m.final;return {numeric:m,rows:[["步长 Δt",m.dt],["最终范数平方",f.norm],["最终磁化 Σ〈Z〉/L",f.magnet],["初始能量",m.start.E],["最终能量",f.E],["相对初始能量变化",f.E-m.start.E],["总态误差（相位固定）",f.total],["纯Strang误差（完整态）",f.trotter],["压缩路径差（相对同一Strang序列）",f.compression],["不保真度",f.infidelity],["累计丢弃权重 Σε",f.sumEpsilon],["截断态距离累计界 Σδ",f.sumDelta],["保守Strang算符界",f.trotterBound],["两项合成界（精确算术，截在2）",f.bound],["浮点误差","未给出严格上界；由独立复算监测"]],chart:{title:"同一时间轴上的三种误差",xlabel:"演化时间 t",ylabel:"固定相位的态距离",series:[{label:"MPS vs 精确演化",points:m.history.map(h=>[h.t,h.total])},{label:"纯Strang vs 精确演化",points:m.history.map(h=>[h.t,h.trotter])},{label:"MPS vs 同一Strang",points:m.history.map(h=>[h.t,h.compression])}]},text:"三种距离不直接相加成等式。相同门序列下，归一化截断态距离δ=√[2ε/(1+√(1−ε))]可用三角不等式累加；Σε本身不是态误差上界。Strang界很保守，可能比2还大而无精度判别力。公式界假设精确酉门、规范正交与精确SVD，不含浮点认证；数据中约10⁻¹¹以下的差别应结合独立参照解释。能量近似守恒也不能代替整个态或观测轨迹检查。"};}}
 };
 return Object.assign(core.create("research-tebd",configs),{svdLeft,split,merge,writePair,initial,field,twoGate,recenter,expand,applyH,fullStep,exact,distance,observables,run,add,sub,mul,scale,conj,abs2,dot,norm2,dag,mm});
});
