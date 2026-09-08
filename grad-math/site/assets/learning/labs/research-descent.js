(function(root,factory){
  "use strict";
  const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
  const lib=factory(core);
  if(typeof module==="object"&&module.exports)module.exports=lib;
  else if(root.CourseLearning)root.CourseLearning.register("research-descent",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
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
  const energy=(x,z,g)=>-x.slice(0,3).reduce((s,v,i)=>s+v*x[i+1],0)-g*z.reduce((s,v)=>s+v,0);
  const cache=new Map();
  function exactGround(g){
    if(cache.has(g))return cache.get(g);
    const H=Array.from({length:16},()=>Array(16).fill(0));
    for(let b=0;b<16;b++){
      let z=0;for(let j=0;j<4;j++)z+=((b>>j)&1)?-1:1;H[b][b]=-g*z;
      for(let j=0;j<3;j++)H[b^(3<<j)][b]-=1;
    }
    const ground=eigenvalues(H)[0];cache.set(g,ground);return ground;
  }
  function sweep(g,theta,rounds){
    const angle=theta*Math.PI/180,x=Array(4).fill(Math.sin(angle)),z=Array(4).fill(Math.cos(angle));
    const history=[{step:0,site:null,b:null,energy:energy(x,z,g),x:x.slice(),z:z.slice()}];
    for(let r=0;r<rounds;r++)for(const j of [0,1,2,3,3,2,1,0]){
      const b=(j>0?x[j-1]:0)+(j<3?x[j+1]:0),norm=Math.hypot(b,g);
      x[j]=b/norm;z[j]=g/norm;
      history.push({step:history.length,site:j+1,b,energy:energy(x,z,g),x:x.slice(),z:z.slice()});
    }
    const residual=Math.max(...x.map((v,j)=>{const b=(j>0?x[j-1]:0)+(j<3?x[j+1]:0),n=Math.hypot(b,g);return Math.hypot(v-b/n,z[j]-g/n);}));
    return {history,x,z,residual,ground:exactGround(g)};
  }
  const configs={
    cone:{title:"锥何时能够收缩到零？",predict:"先预测：微分乘以一个很小但非零的数，与微分恰好为零，同调会相同吗？",
      scope:"系数域 R，上链约定。A=B=R 位于次数 0，f=乘 a，锥只有次数 −1 到 0 的两个 R。",
      controls:[["a","映射系数 a",-2,2,.25,1]],
      compute(v){const dim=v.a===0?1:0;return {numeric:{rank:1-dim,hMinus:dim,hZero:dim,contraction:v.a===0?null:1/v.a},
        rows:[["锥微分 d⁻¹",v.a],["微分的秩",1-dim],["dim H⁻¹",dim],["dim H⁰",dim],["收缩同伦 h⁰",v.a===0?"不存在":1/v.a],["原映射 f 是否拟同构",v.a===0?"否":"是"]],
        chart:{title:"当前锥的上同调",xlabel:"上同调次数",ylabel:"维数",xticks:[-1,0],series:[{label:"同调维数（仅两个次数）",points:[[-1,dim],[0,dim]]}]},
        text:"连线只连接两个离散次数，不表示存在中间次数。a≠0 时 h=1/a 给出 dh+hd=id；a=0 时同调非零。小的非零 a 会使收缩系数变大，但不会变成零微分。"};}
    },
    sweep:{title:"能量下降，是否就找到了基态？",predict:"先预测：初态角度取 0° 时，每个局部问题都已最优，整体能量还可能被联合改变降低吗？",
      scope:"四站开放链 H=−Σ₁³ XⱼXⱼ₊₁−gΣ₁⁴ Zⱼ，Pauli ±1，J=1。只优化 χ=1 的实乘积 MPS；精确参照来自完整 16 维矩阵。",
      controls:[["g","横场比 g",.2,2,.1,1],["theta","初始统一 Bloch 角（度）",0,90,5,30],["rounds","往返扫描轮数",1,8,1,2]],
      compute(v){const m=sweep(v.g,v.theta,v.rounds),last=m.history[m.history.length-1],prev=m.history[m.history.length-9];
        return {numeric:m,rows:[["初始能量",m.history[0].energy],["扫描后能量",last.energy],["精确基态能量",m.ground],["剩余变分能量差",last.energy-m.ground],["最后一轮能量下降",prev.energy-last.energy],["局部更新残差",m.residual],...m.history.slice(1,9).map(h=>[`首轮第 ${h.step} 次更新：站点 ${h.site}`,h.energy])],
          chart:{title:"逐次局部更新的能量",xlabel:"已更新站点次数",ylabel:"能量（J=1）",xticks:[0,4*v.rounds,8*v.rounds],series:[{label:"乘积态扫描",points:m.history.map(h=>[h.step,h.energy])},{label:"精确基态参照",points:[[0,m.ground],[8*v.rounds,m.ground]]}]},
          text:"一轮顺序为 1→2→3→4→4→3→2→1；转向时重复端点是有意约定。更新使用最新邻居，连线只帮助阅读。小能量变化或零局部残差均不证明全局最优，也不消除 χ=1 的表达限制。"};}
    }
  };
  return core.create("research-descent",configs);
});
