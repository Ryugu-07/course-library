(function(root,factory){
  "use strict";
  const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
  const lib=factory(core);
  if(typeof module==="object"&&module.exports)module.exports=lib;
  else if(root.CourseLearning)root.CourseLearning.register("research-paths",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  const line=(label,points)=>({label,points});
  const pop=n=>{let c=0;for(;n;n>>=1)c+=n&1;return c;};
  function eigenvalues(matrix){
    const a=matrix.map(r=>r.slice()),n=a.length;
    for(let sweep=0;sweep<50;sweep++){
      let max=0;
      for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
        const apq=a[p][q];max=Math.max(max,Math.abs(apq));if(Math.abs(apq)<1e-13)continue;
        const angle=.5*Math.atan2(2*apq,a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle),app=a[p][p],aqq=a[q][q];
        for(let k=0;k<n;k++)if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
        a[p][p]=c*c*app-2*c*s*apq+s*s*aqq;a[q][q]=s*s*app+2*c*s*apq+c*c*aqq;a[p][q]=a[q][p]=0;
      }
      if(max<1e-12)return a.map((r,i)=>r[i]).sort((x,y)=>x-y);
    }
    throw Error("对角化未收敛");
  }
  function spinSpectrum(L,g,parity){
    const basis=Array.from({length:2**L},(_,i)=>i).filter(i=>pop(i)%2===parity),idx=new Map(basis.map((b,i)=>[b,i]));
    const H=basis.map(()=>basis.map(()=>0));
    basis.forEach((b,col)=>{H[col][col]=-g*(L-2*pop(b));for(let j=0;j<L;j++){const flipped=b^(1<<j)^(1<<((j+1)%L));H[idx.get(flipped)][col]-=1;}});
    return eigenvalues(H);
  }
  const configs={
    markov:{
      title:"终端偏好怎样改变中途转移？",
      predict:"先预测：提高终端状态 1 的权重，第一步与第二步的转移会变得相同吗？",
      scope:"两状态、两次转移。先选 g₂=(1,w) 与初始边缘 μ，再导出终端边缘 ν；不是任意双边缘求解器。",
      controls:[["r","参考换位概率 r",.05,.45,.05,.25],["w","终端势比 w",.25,4,.25,2],["u","初始状态 0 概率 u",.1,.9,.1,.5]],
      compute(v){const K=[[1-v.r,v.r],[v.r,1-v.r]],g2=[1,v.w],mv=x=>K.map(row=>row[0]*x[0]+row[1]*x[1]),g1=mv(g2),g0=mv(g1),mu=[v.u,1-v.u],paths=[],marg=[mu,[0,0],[0,0]],pi=[[0,0],[0,0]],ref=[[0,0],[0,0]];
        let pathKL=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){const R=.5*K[i][j]*K[j][k],P=mu[i]*K[i][j]*K[j][k]*g2[k]/g0[i];paths.push({i,j,k,R,P});marg[1][j]+=P;marg[2][k]+=P;pi[i][k]+=P;ref[i][k]+=R;pathKL+=P*Math.log(P/R);}
        let endpointKL=0;for(let i=0;i<2;i++)for(let k=0;k<2;k++)endpointKL+=pi[i][k]*Math.log(pi[i][k]/ref[i][k]);
        const transforms=[K.map((row,i)=>row.map((x,j)=>x*g1[j]/g0[i])),K.map((row,i)=>row.map((x,j)=>x*g2[j]/g1[i]))];
        return {numeric:{g0,g1,g2,paths,marg,pi,ref,pathKL,endpointKL,transforms},rows:[["t=1 状态 1 概率",marg[1][1]],["导出的终端 ν(1)",marg[2][1]],["路径 KL（自然对数）",pathKL],["端点 KL",endpointKL],...paths.map(p=>[`${p.i} → ${p.j} → ${p.k}`,p.P])],
          chart:{title:"三个时刻的状态 1 概率",xlabel:"时刻 t",ylabel:"概率",xticks:[0,1,2],series:[line("桥 P",marg.map((m,t)=>[t,m[1]])),line("参考 R",[[0,.5],[1,.5],[2,.5]])]},
          text:"图中连线仅连接三个离散时刻。路径 KL 等于端点 KL，是因为同端点下保留参考条件桥；不是所有过程都满足这个等式。"};}
    },
    ising:{
      title:"同一条链，三个“能隙”为什么不同？",
      predict:"先预测：完整最低能隙、偶扇区内部能隙与 ε(π/L)，哪一个需要跨扇区比较？",
      scope:"周期自旋链，每条邻接键计一次；Pauli 本征值 ±1，J=1，L 只取 4 或 6。直接构造两个自旋奇偶块并数值对角化。",
      controls:[["L","自旋数 L",4,6,2,4],["g","横场比 g=h/J",0,2,.05,1]],
      validate(v){if(v.L!==4&&v.L!==6)throw Error("只支持 L=4 或 6");},
      compute(v){const even=spinSpectrum(v.L,v.g,0),odd=spinSpectrum(v.L,v.g,1),all=even.concat(odd).sort((a,b)=>a-b),gap=all[1]-all[0],evenGap=even[1]-even[0],epsilon=2*Math.sqrt((v.g-1)**2+4*v.g*Math.sin(Math.PI/(2*v.L))**2);
        return {numeric:{even,odd,gap,evenGap,epsilon,ground:all[0]},rows:[["偶扇区最低 E+/J",even[0]],["奇扇区最低 E−/J",odd[0]],["完整谱 Δspin/J（计重数）",gap],["偶扇区内部 Δ+/J",evenGap],["单准粒子尺度 ε(π/L)/J",epsilon],["偶扇区两准粒子 2ε/J",2*epsilon]],
          chart:{title:"两个扇区各自最低六能级",xlabel:"各扇区能级序号（从 0 起）",ylabel:"(E−全局基态能量)/J",xticks:[0,2,5],series:[line("偶 P=+1",even.slice(0,6).map((e,i)=>[i,e-all[0]])),line("奇 P=−1",odd.slice(0,6).map((e,i)=>[i,e-all[0]]))]},
          text:"每个能级按重数保留，连线不表示不同序号之间有连续动力学。g=0 的双重基态使完整隙为零；约 10⁻¹² 以下差值视为数值分辨率内简并。两个小尺寸不能证明热力学临界指数。"};}
    }
  };
  return core.create("research-paths",configs);
});
