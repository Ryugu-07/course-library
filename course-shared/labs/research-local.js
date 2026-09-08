(function(root,factory){
  "use strict";
  const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;
  const lib=factory(core);
  if(typeof module==="object"&&module.exports)module.exports=lib;
  else if(root.CourseLearning)root.CourseLearning.register("research-local",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  function metric(theta,lambda){
    const c=theta===90?0:Math.cos(theta*Math.PI/180),s=theta===90?1:Math.sin(theta*Math.PI/180),A=-1,B=-c-lambda*s,D=s*s-c*c-2*lambda*c*s;
    const wrong=(A+D)/2-Math.hypot((A-D)/2,B);
    // Stable minimum eigenvector of a symmetric 2x2 matrix, including B=0.
    const angle=.5*Math.atan2(2*B,A-D),a=[-Math.sin(angle),Math.cos(angle)];
    const y=[a[0]+c*a[1],s*a[1]],norm=y[0]**2+y[1]**2;
    const physical=(-(y[0]**2)-2*lambda*y[0]*y[1]+y[1]**2)/norm;
    const exact=-Math.hypot(1,lambda),ratio=lambda/(1-exact),q=1/Math.hypot(1,ratio),ground=[q,ratio*q];
    const coords=[ground[0]-c*ground[1]/s,ground[1]/s];
    return {c,s,N:[[1,c],[c,1]],H:[[A,B],[B,D]],wrong,physical,exact,condition:(1+c)/(1-c),a,coords,norm};
  }
  const configs={
    tangent:{
      title:"一阶约束何时看不见尖点？",
      predict:"先预测：尖点原点的切空间是直线还是整个二维空间？它是否等于实割线的极限？",
      scope:"曲线 0：y=x²；曲线 1：y²=x³。代数定义在 C 上，图只画实点与实切向量。切空间维数不是曲线维数。",
      controls:[["curve","曲线（0 抛物线 / 1 尖点）",0,1,1,1],["t","曲线上点的参数 t",-1,1,.1,0]],
      compute(v){
        const cusp=v.curve===1,x=cusp?v.t*v.t:v.t,y=cusp?v.t**3:v.t*v.t;
        const gradient=cusp?[-3*v.t**4,2*v.t**3]:[-2*v.t,1];
        const dimension=cusp&&v.t===0?2:1,slope=cusp?1.5*v.t:2*v.t;
        const curve=Array.from({length:81},(_,i)=>{const q=-1+i/40;return cusp?[q*q,q**3]:[q,q*q];});
        const series=[{label:cusp?"实尖点曲线":"实抛物线",points:curve}];
        if(dimension===1)series.push({label:"该点的一阶切线",points:[[-1,y+slope*(-1-x)],[1,y+slope*(1-x)]]});
        else {
          series.push({label:"切空间基方向：x",points:[[-1,0],[1,0]]});
          series.push({label:"切空间基方向：y",points:[[0,-1],[0,1]]});
        }
        return {numeric:{point:[x,y],gradient,dimension,slope},rows:[["当前曲线",cusp?"y²=x³":"y=x²"],["点的 x",x],["点的 y",y],["∂f/∂x",gradient[0]],["∂f/∂y",gradient[1]],["Zariski 切空间维数",dimension],["曲线局部维数",1]],
          chart:{title:"曲线与一阶约束",xlabel:"x（实坐标）",ylabel:"y（实坐标）",xticks:[-1,0,1],series,marker:[x,y]},
          text:dimension===2?"原点 Jacobian 为零，任意 (a,b) 都通过一阶检验。图中两条轴仅表示整个平面的基方向，不表示切空间只有两条线；实割线的极限方向却只有 x 轴。":"虚线是满足 Jacobian 约束的仿射切线。切空间本身由附着在该点的位移向量组成。图轴缩放可能不同，不应按屏幕角度测斜率。"};
      }
    },
    metric:{
      title:"只换坐标，能量应当保持不变",
      predict:"先预测：改变两个环境基矢的夹角，会改变同一子空间的最低物理能量吗？",
      scope:"固定二维物理子空间，实对称 H₀=[[-1,−λ],[−λ,1]]。θ 只改变坐标。不是完整 DMRG 扫描。",
      controls:[["theta","环境基夹角 θ（度）",15,90,5,60],["lambda","物理耦合 λ",0,2,.1,.5]],
      compute(v){const m=metric(v.theta,v.lambda),scan=Array.from({length:31},(_,i)=>[15+i*2.5,metric(15+i*2.5,v.lambda)]);
        return {numeric:m,rows:[["正确最低能量",m.exact],["忽略 N 的普通本征值",m.wrong],["错误候选态的实际能量",m.physical],["N 的条件数 κ₂",m.condition],["错误候选的物理范数平方",m.norm],["N 的非对角重叠",m.c]],
          chart:{title:"相同物理问题，不同坐标",xlabel:"环境基夹角 θ（度）",ylabel:"能量（统一单位）",xticks:[15,60,90],marker:[v.theta,m.exact],series:[{label:"正确广义本征值",points:scan.map(([x,m])=>[x,m.exact])},{label:"忽略 N 的数值",points:scan.map(([x,m])=>[x,m.wrong])},{label:"错误候选的实际能量",points:scan.map(([x,m])=>[x,m.physical])}]},
          text:"横轴扫描时固定当前 λ。忽略 N 的普通本征值不是归一化物理能量；将候选态按真实范数归一后，能量仍不低于正确基态。θ=0 会真正降秩，不在本实验定义域。"};}
    }
  };
  return core.create("research-local",configs);
});
