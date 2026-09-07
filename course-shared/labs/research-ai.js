(function(root,factory){
  "use strict";
  if(typeof module==="object"&&module.exports) module.exports=factory(require("../research-renderer.js"));
  else { const lib=factory(root.ResearchLab); root.CourseLearning.register("research-ai",lib.mount); }
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  const grid=(n,lo,hi)=>Array.from({length:n},(_,i)=>lo+(hi-lo)*i/(n-1));
  const series=(label,x,f)=>({label,points:x.map(t=>[t,f(t)])});
  const clip=(x,m)=>Math.max(-m,Math.min(m,x));
  const theta=[-2,-1,0,1,2];
  function posterior(y,sigma){
    const log=theta.map(t=>-((y-t*t)**2)/(2*sigma*sigma)), max=Math.max(...log);
    const w=log.map(l=>Math.exp(l-max)), sum=w.reduce((a,b)=>a+b,0);
    const p=w.map(z=>z/sum), order=p.map((z,i)=>[z,i]).sort((a,b)=>b[0]-a[0]);
    let mass=0,threshold=0;
    for(const [z] of order){mass+=z;threshold=z;if(mass>=.8-1e-14)break;}
    const selected=p.map(z=>z>=threshold-1e-14);
    return {p,selected,mass:p.reduce((s,z,i)=>s+(selected[i]?z:0),0)};
  }
  function coverage(sigma){
    const totals=theta.map(()=>0);let norm=0;
    for(let i=0;i<=480;i++){
      const z=-6+i*.025,w=Math.exp(-z*z/2)*(i===0||i===480?.5:1); norm+=w;
      theta.forEach((t,j)=>{if(posterior(t*t+.5*z,sigma).selected[j])totals[j]+=w;});
    }
    const perTheta=totals.map(t=>t/norm);
    return {perTheta,average:perTheta.reduce((a,b)=>a+b)/5};
  }
  const configs={
    operator:{title:"热算子：遗漏的高频去了哪里",predict:"先预测：延长时间会放大还是缩小丢弃高频的误差？",scope:"周期区间 [0,2π]、无量纲热方程 κ=0.1；解析算子与低模态近似，无神经网络训练。",controls:[["t","演化时间 t",0,2,.1,1],["k","高频波数 k",2,8,1,4],["b","高频振幅 b",0,2,.1,1]],compute(v){
      const low=Math.exp(-.1*v.t),high=Math.exp(-.1*v.k*v.k*v.t),x=grid(257,0,2*Math.PI);
      const rmse=v.b*high/Math.sqrt(2),inputEnergy=(1+v.b*v.b)/2,outputEnergy=(low*low+v.b*v.b*high*high)/2;
      return {numeric:{low,high,rmse,inputEnergy,outputEnergy},rows:[["高频衰减因子",high],["归一化 L² 误差",rmse],["输入平方范数",inputEnergy],["输出平方范数",outputEnergy]],chart:{title:"函数输入与输出",xlabel:"位置 x",ylabel:"函数值",series:[series("输入函数",x,z=>Math.sin(z)+v.b*Math.sin(v.k*z)),series("真实热算子",x,z=>low*Math.sin(z)+v.b*high*Math.sin(v.k*z)),series("只留低频",x,z=>low*Math.sin(z))]},text:"丢失高频的误差来自表达能力限制；本例的扩散会压低它。小误差不能证明模型恢复了输入细节。"};
    }},
    fourier:{title:"网格上的零误差，连续空间的错波",predict:"先预测：16 个点能区分 sin(9x) 与 −sin(7x) 吗？",scope:"周期等距采样与显式 DFT；只演示 FNO 的谱截断问题，谱权重固定为 1，未训练网络。",controls:[["N","采样点数 N",8,32,4,16],["k","真实波数 k",1,20,1,9],["K","请求保留波数 K",1,12,1,7]],validate(v){if(v.N%4!==0)throw Error("N 必须为 4 的倍数");},compute(v){
      const cut=Math.min(v.K,v.N/2-1),coeff=[];
      for(let m=-cut;m<=cut;m++){
        let re=0,im=0;for(let j=0;j<v.N;j++){const x=2*Math.PI*j/v.N,y=Math.sin(v.k*x);re+=y*Math.cos(m*x)/v.N;im-=y*Math.sin(m*x)/v.N;}
        coeff.push([m,re,im]);
      }
      const f=x=>coeff.reduce((s,c)=>s+c[1]*Math.cos(c[0]*x)-c[2]*Math.sin(c[0]*x),0),dense=Array.from({length:512},(_,j)=>2*Math.PI*j/512);
      const rms=xs=>Math.sqrt(xs.reduce((s,x)=>s+(f(x)-Math.sin(v.k*x))**2,0)/xs.length);
      const sensorRMS=rms(Array.from({length:v.N},(_,j)=>2*Math.PI*j/v.N)),denseRMS=rms(dense),alias=((v.k+v.N/2)%v.N)-v.N/2;
      return {numeric:{cut,alias,sensorRMS,denseRMS,coeff},rows:[["实际截断 K（略去 Nyquist）",cut],["折回的有符号波数",alias],["采样点 RMS",sensorRMS],["连续网格 RMS（512 点）",denseRMS]],chart:{title:"真实函数与谱重建",xlabel:"位置 x",ylabel:"函数值",series:[series("真实输入",dense,x=>Math.sin(v.k*x)),series("采样后的低通重建",dense,f)]},text:"频率模 N 同余导致混叠；Nyquist 正弦在这些节点上为零。增加输出绘图点不会补回采样前丢失的信息。"};
    }},
    equivariance:{title:"旋转前后：两个运算能否交换",predict:"先预测：只把纵向放大两倍，还能保持任意旋转等变吗？",scope:"二维向量 x=(1,0)，A=diag(1,a)；检验 SO(2) 旋转。这里只证明所列映射的性质。",controls:[["angle","旋转角（度）",0,180,15,90],["a","纵向缩放 a",0,3,.25,2]],compute(v){
      const phi=v.angle*Math.PI/180,defect=Math.abs(v.a-1)*Math.abs(Math.sin(phi)),x=grid(181,0,180);
      return {numeric:{defect,rotatedThenMapped:[Math.cos(phi),v.a*Math.sin(phi)],mappedThenRotated:[Math.cos(phi),Math.sin(phi)]},rows:[["‖ARx−RAx‖",defect],["aI 的等变误差",0]],chart:{title:"各角度的交换误差",xlabel:"角度（度）",ylabel:"向量差的长度",series:[series("A=diag(1,a)",x,d=>Math.abs(v.a-1)*Math.abs(Math.sin(d*Math.PI/180))),series("对照：aI",x,()=>0)],marker:[v.angle,defect]},text:"某一个角度误差为零，只检查了一个输入与群元素。任意旋转等变需要对全部允许输入和旋转成立。"};
    }},
    inference:{title:"同一观测的两个符号：后验与覆盖",predict:"先预测：y 接近 1 时，后验均值 0 会是最可信的参数吗？",scope:"θ 均匀取 −2,−1,0,1,2，真实 y=θ²+N(0,0.5²)。覆盖率对先验与真实噪声平均；不是逐 θ 的频率学保证。",controls:[["y","观测 y",-1,5,.25,1],["sigma","推断采用的噪声 σ",.2,1,.1,.5]],compute(v){
      const post=posterior(v.y,v.sigma),cov=coverage(v.sigma),mean=post.p.reduce((s,p,i)=>s+p*theta[i],0),set=theta.filter((_,i)=>post.selected[i]);
      return {numeric:{posterior:post.p,mean,credibleMass:post.mass,coverage:cov.average,perThetaCoverage:cov.perTheta},rows:[["后验均值",mean],["80% 可信集合（并列一起保留）",set.join("，")],["该集合后验质量",post.mass],["先验预测覆盖（数值积分）",cov.average],["θ=0 条件覆盖",cov.perTheta[2]]],chart:{title:"五个参数的后验质量",xlabel:"参数 θ",ylabel:"概率",xticks:theta,series:[{label:"后验（点间连线无连续密度含义）",points:theta.map((t,i)=>[t,post.p[i]])}]},text:"覆盖通过标准正态 z∈[−6,6]、步长 0.025 的梯形积分估计，并归一化截断质量。离散可信集合至少含 80% 后验质量，故匹配模型的平均覆盖通常高于 80%；覆盖合格也不独自证明后验正确。"};
    }},
    world:{title:"一步误差怎样变成长时偏移",predict:"先预测：初态上的一步误差只有 0.03，十步自由滚动后还是 0.03 吗？",scope:"x₀=1，真实 x'=ax，模型 x'=(a+δ)x；无量纲线性动力学，不模拟视觉世界模型训练。",controls:[["a","真实增益 a",.8,1.1,.05,1],["delta","模型增益偏差 δ",-.1,.1,.01,.03],["H","预测步数 H",1,20,1,10]],compute(v){
      const x=grid(v.H+1,0,v.H),truth=v.a**v.H,pred=(v.a+v.delta)**v.H,error=Math.abs(pred-truth);
      return {numeric:{truth,pred,error,oneStep:Math.abs(v.delta)},rows:[["初态上的一步绝对误差",Math.abs(v.delta)],["终点真实状态",truth],["终点模型状态",pred],["终点绝对误差",error]],chart:{title:"同一起点的自由滚动",xlabel:"步数 h",ylabel:"状态 x",series:[series("真实",x,h=>v.a**h),series("模型",x,h=>(v.a+v.delta)**h)]},text:"每一步把自己的预测重新输入，误差会改变后续输入。这里的精确误差是 |(a+δ)^H−a^H|，并不假设沿途每一步都有相同绝对误差。"};
    }},
    planning:{title:"约束最优计划与反馈重规划",predict:"先预测：模型高估动作效果时，执行中重新观察会怎样改变第二步？",scope:"真实 x'=x+u；模型 x'=x+b̂u；固定两步截止时间、动作盒约束、代价终点误差平方加 0.1 动作平方。第二次优化剩余一步。",controls:[["bhat","模型动作增益 b̂",.3,2,.1,1.3],["target","目标 r",.5,2,.1,1],["umax","动作上限 U",.1,1,.1,.6]],compute(v){
      const u=clip(v.bhat*v.target/(2*v.bhat*v.bhat+.1),v.umax),uRe=clip(v.bhat*(v.target-u)/(v.bhat*v.bhat+.1),v.umax),pred=2*v.bhat*u,open=2*u,closed=u+uRe,J=(pred-v.target)**2+.2*u*u;
      return {numeric:{u,uRe,pred,open,closed,J,openError:Math.abs(open-v.target),closedError:Math.abs(closed-v.target)},rows:[["最优初始计划 u₀=u₁",u],["观察 x₁ 后重新求解 u₁",uRe],["模型预计终点",pred],["真实开环终点",open],["真实反馈终点",closed],["初始约束最优目标值",J]],chart:{title:"计划与执行轨迹",xlabel:"时间步",ylabel:"位置 x",xticks:[0,1,2],series:[{label:"模型中的原计划",points:[[0,0],[1,v.bhat*u],[2,pred]]},{label:"真实开环",points:[[0,0],[1,u],[2,open]]},{label:"真实反馈",points:[[0,0],[1,u],[2,closed]]},{label:"目标",points:[[0,v.target],[2,v.target]]}]},text:"两次都解了对应剩余时域的凸优化，并在必要时取约束边界。动作可行不等于真实状态约束可行；本例也不给所有模型偏差下的反馈改善保证。"};
    }},
    vla:{title:"模型给出动作时，观测已经多老",predict:"先预测：目标以 0.5 m/s 移动，200 ms 延迟意味着多少位置差？",scope:"匀速目标、理想瞬时位置执行器，周期更新并零阶保持。只量化时序误差，不验证机器人控制安全或 VLA 能力。",controls:[["speed","目标速度 v（m/s）",0,1,.1,.5],["latency","观测到动作延迟 τ（s）",0,.8,.05,.2],["period","更新周期 Δ（s）",.05,.5,.05,.1]],compute(v){
      const mean=v.speed*(v.latency+v.period/2),rms=v.speed*Math.sqrt(v.latency*v.latency+v.latency*v.period+v.period*v.period/3),correctedRMS=v.speed*v.period/Math.sqrt(3),x=grid(401,v.latency,v.latency+4*v.period);
      const capture=t=>Math.floor((t-v.latency)/v.period+1e-10)*v.period;
      return {numeric:{mean,rms,correctedRMS,maxSup:v.speed*(v.latency+v.period)},rows:[["平均位置滞后（m）",mean],["RMS 滞后（m）",rms],["延迟补偿后 RMS（m）",correctedRMS],["未补偿误差上确界（m）",v.speed*(v.latency+v.period)]],chart:{title:"带时间戳的目标与命令",xlabel:"实际时间 t（s）",ylabel:"位置（m）",series:[series("真实目标",x,t=>v.speed*t),series("收到的旧位置并保持",x,t=>v.speed*capture(t)),series("补偿已知延迟后保持",x,t=>v.speed*(capture(t)+v.latency))]},text:"补偿只外推 τ 秒，再保持到下次更新，仍有周期内误差。若目标加速、速度估计不准或执行器有惯性，公式不再完整。"};
    }},
    embodied:{title:"同一策略，换一个测试分布就会换排名",predict:"先预测：擅长简单任务的策略，在困难任务占多数时还领先吗？",scope:"固定合成评估库：简单、困难各 100 个独立编号，用均匀中点分数生成成败。污染参数是复制测试任务并强制成功的假设，不是泄漏检测器。",controls:[["mix","目标分布中简单任务占比 q",0,1,.1,.8],["hard","策略 A 困难任务成功比例",.1,.9,.05,.35],["leak","假设被复制的测试比例 ℓ",0,.8,.1,0]],compute(v){
      const count=p=>Array.from({length:100},(_,i)=>(i+.5)/100<p?1:0).reduce((a,b)=>a+b),easyCount=count(.95),hardCount=count(v.hard),e=easyCount/100,h=hardCount/100,score=q=>q*e+(1-q)*h,baseline=q=>q*.8+(1-q)*.5,clean=score(v.mix),observed=v.leak+(1-v.leak)*clean,x=grid(101,0,1);
      return {numeric:{easyCount,hardCount,balanced:(e+h)/2,clean,baseline:baseline(v.mix),observed,stageChain:.9**10},rows:[["A 简单任务成功 / 100",easyCount],["A 困难任务成功 / 100",hardCount],["A 平衡测试库成功率",(e+h)/2],["A 目标分布成功率",clean],["B 目标分布成功率",baseline(v.mix)],["假设污染后显示的分数",observed],["十阶段各条件成功率 0.9 的总成功率",.9**10]],chart:{title:"任务混合与比较结果",xlabel:"简单任务占比 q",ylabel:"任务成功率",series:[series("策略 A",x,score),series("策略 B：简单 0.8，困难 0.5",x,baseline),series("A 假设污染后的显示分数",x,q=>v.leak+(1-v.leak)*score(q))],marker:[v.mix,clean]},text:"先查看每类任务的分子与分母，再按目标部署分布加权。连续滑块的比例在 100 项合成库中量化到百分之一；独立编号不表示真实机器人试验必然统计独立。"};
    }}
  };
  return core.create("research-ai",configs);
});
