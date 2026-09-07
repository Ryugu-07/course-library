(function(root,factory){"use strict";const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root.CourseLearning)root.CourseLearning.register("frontier-lab",api.mount);})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const log2=x=>Math.log(x)/Math.LN2;
  const entropy=p=>p<=0||p>=1?0:-p*log2(p)-(1-p)*log2(1-p);
  const sequence=(lo,hi,n=61)=>Array.from({length:n},(_,i)=>lo+(hi-lo)*i/(n-1));
  const series=(label,color,points,dash)=>({label,color,points,dash});
  const blue="#497ec5",orange="#c65c3d",green="#20876c";
  const controls={
    bridge:[["epsilon","熵正则 ε",.05,4,.05,1]],
    spde:[["C","高斯变量方差 C",1,16,1,1],["z","标准化样本 z",-3,3,.1,1]],
    langlands:[["mode","特征标编号 k",0,2,1,1],["shift","循环移位次数 m",0,2,1,1]],
    entanglement:[["theta","Schmidt 角 θ（度）",0,90,1,45]],
    qec:[["p","单比特翻转概率 p",0,.8,.01,.1],["correlation","共同错误混合比例 c",0,1,.05,0]],
    holography:[["radiation","辐射子系统量子比特数 r",0,12,1,3]],
    flow:[["t","插值时间 t",0,1,.05,.5],["mu","目标均值 μ",-3,3,.1,2]],
    reasoning:[["p","单次真实正确概率 p",0,1,.01,.2],["k","独立采样次数 k",1,64,1,4],["alpha","错误答案误通过率 α",0,1,.01,.1]],
    circuits:[["input","输入 x",0,1,1,1],["ablate1","消融路径 1（1=消融）",0,1,1,0],["ablate2","消融路径 2（1=消融）",0,1,1,0]]
  };
  const meta={
    bridge:["边缘固定后，熵怎样改变耦合？","先预测：增大 ε 后，更多质量会留在对角线还是跨到另一格？","这里只计算两时刻、两状态的熵正则耦合。路径空间 Schrödinger 桥还需参考过程和端点约束；此图不求解连续桥。"],
    spde:["减去发散均值，是否已经得到极限？","先预测：把 X² 改成 X²−C 后，均值和方差会分别怎样变化？","X=√C Z，Z~N(0,1)。这是单个高斯变量的 Wick 平方恒等式；它不证明随机分布的收敛，亦不实现正则性结构。"],
    langlands:["循环移位为何变成乘一个复数？","先预测：同一个特征标移动三次后，能否回到原值？","这是有限循环群 Z/3Z 上的 Fourier 对角化类比，不是几何 Langlands 对应。采用 Tf(j)=f(j+m) 与正指数特征标。"],
    entanglement:["只看一个子系统，会丢失多少信息？","先预测：θ 从 0° 走到 90°，纠缠是否一直增大？","纯态 |ψ⟩=cosθ|00⟩+sinθ|11⟩。这里的局部熵等于纠缠熵依赖全局纯态；混合态局部熵不能直接当纠缠量。"],
    qec:["冗余是否必然降低错误？","先预测：保持每个比特错误概率相同，把独立错误换成共同翻转，会怎样？","固定多数表决的三比特重复码只处理位翻转。它不保护任意量子噪声，也不是表面码阈值实验；未计门、读出和泄漏错误。"],
    holography:["两个子系统的维数给出怎样的熵上界？","先预测：辐射越来越大时，纯态中较小子系统的容量如何限制纠缠？","总共 12 个量子比特，min(r,12−r) 是典型大维度 Page 行为的前导示意及维数上界，不是任意态的熵、精确 Haar 平均或岛屿公式的数值解。"],
    flow:["端点相同，中间路径一定相同吗？","先预测：独立高斯端点的线性插值，在 t=1/2 时方差仍为 1 吗？","X₀~N(0,1)、X₁~N(μ,1) 相互独立。曲线是其插值边际的解析解；未训练神经网络。恒速平移能到达同样端点，却走不同边际路径。"],
    reasoning:["生成了正确答案，验证器就会选中它吗？","先预测：有误通过时，增加候选数能否让最终选中正确答案的概率趋近 1？","候选独立同分布，正确答案总通过，错误答案以 α 误通过，返回第一个通过者。pass@k 仅表示至少生成一个正确答案；此处不模拟 RL 训练，也不审计推理链。"],
    circuits:["单路径消融无效，是否说明它没有作用？","先预测：两条冗余路径中，单独关掉一条与同时关掉两条会有什么不同？","人造电路 h₁=h₂=x、y=max(h₁,h₂)。只在这个已知结构模型内解释干预；神经网络的干预可能偏离训练分布，语义特征也不等于一条人造路径。"]
  };
  function defaults(topic){if(!controls[topic])throw Error("Unknown frontier topic");return Object.fromEntries(controls[topic].map(c=>[c[0],c[5]]));}
  function validate(topic,v){if(!controls[topic])throw Error("Unknown frontier topic");controls[topic].forEach(([key,,min,max])=>{if(!Number.isFinite(v[key])||v[key]<min||v[key]>max)throw Error("Invalid "+key);if(["mode","shift","radiation","k","input","ablate1","ablate2"].includes(key)&&!Number.isInteger(v[key]))throw Error("Integer required for "+key);});}
  function reasoning(p,k,alpha){
    const q=p+(1-p)*alpha,accepted=1-(1-q)**k;
    return {coverage:1-(1-p)**k,selectedCorrect:q===0?0:p/q*accepted,
      selectedWrong:q===0?0:(1-p)*alpha/q*accepted,rejected:(1-q)**k,
      precision:q===0?null:p/q,falseReward:1-(1-(1-p)*alpha)**k};
  }
  function compute(topic,input){
    const v={...defaults(topic),...input};validate(topic,v);
    if(topic==="bridge"){
      const e=Math.exp(-1/v.epsilon),diag=1/(2*(1+e)),off=e/(2*(1+e));
      const kl=2*diag*Math.log(4*diag)+2*off*Math.log(4*off);
      return {values:v,numeric:{diag,off,cost:2*off,kl,objective:2*off+v.epsilon*kl},rows:[["P₁₁=P₂₂",diag],["P₁₂=P₂₁",off],["每行／列质量",.5],["运输成本",2*off],["KL(P‖均匀耦合)",kl]],
        chart:{title:"成本与随机化的取舍",xlabel:"熵正则 ε",ylabel:"无量纲",series:[series("跨状态总质量／成本",orange,sequence(.05,4).map(eps=>[eps,1/(1+Math.exp(1/eps))])),series("对角总质量",blue,sequence(.05,4).map(eps=>[eps,1/(1+Math.exp(-1/eps))]),"8 4")],marker:[v.epsilon,2*off]},
        text:"边缘仍各为 (1/2,1/2)。ε 增大时，更愿意用较高运输成本换取更分散的耦合；有限 ε 下两条跨状态路径的质量均为正。"};
    }
    if(topic==="spde"){
      const C=v.C,z=v.z;
      return {values:v,numeric:{raw:C*z*z,wick:C*(z*z-1),rawMean:C,wickMean:0,variance:2*C*C},rows:[["当前 X²",C*z*z],["当前 X²−C",C*(z*z-1)],["E[X²]",C],["E[X²−C]",0],["Var(X²−C)=2C²",2*C*C]],
        chart:{title:"同一个样本：平方与 Wick 平方",xlabel:"标准化样本 z",ylabel:"无量纲",series:[series("X²=Cz²",orange,sequence(-3,3).map(z=>[z,C*z*z])),series("X²−C=C(z²−1)",blue,sequence(-3,3).map(z=>[z,C*(z*z-1)]),"8 4")],marker:[z,C*(z*z-1)]},
        text:"减去 C 只消除了均值，方差仍为 2C²。若让 C 不断增大，不能据零均值断言变量收敛；真正的 SPDE 重整化需要在指定分布空间中证明控制与收敛。"};
    }
    if(topic==="langlands"){
      const k=v.mode,m=v.shift,phase=2*Math.PI*k*m/3;
      const re=j=>Math.cos(2*Math.PI*k*j/3)/Math.sqrt(3),im=j=>Math.sin(2*Math.PI*k*j/3)/Math.sqrt(3);
      return {values:v,numeric:{eigenReal:Math.cos(phase),eigenImag:Math.sin(phase),norm:1},rows:[["特征值实部",Math.cos(phase)],["特征值虚部",Math.sin(phase)],["特征向量平方范数",1],["三次单位移位的特征值",1]],
        chart:{title:"移位前后的复向量坐标",xlabel:"位置 j ∈ {0,1,2}",ylabel:"复数分量",series:[series("原向量实部",blue,[0,1,2].map(j=>[j,re(j)])),series("移位后实部",orange,[0,1,2].map(j=>[j,re(j+m)]),"8 4"),series("移位后虚部",green,[0,1,2].map(j=>[j,im(j+m)]),"2 5")]},
        text:"Tfₖ=e^(2πikm/3)fₖ；乘复相位会混合实部与虚部，不是仅把实部乘一个实数。图上的线只连接三个离散位置。"};
    }
    if(topic==="entanglement"){
      const p=Math.sin(v.theta*Math.PI/180)**2,S=entropy(p);
      return {values:v,numeric:{p,entropy:S,purity:p*p+(1-p)**2},rows:[["Schmidt 概率 sin²θ",p],["S(ρA) / bit",S],["Tr(ρA²)",p*p+(1-p)**2],["全局纯态熵 / bit",0]],
        chart:{title:"局部熵随 Schmidt 角变化",xlabel:"θ（度）",ylabel:"熵（bit）",series:[series("纠缠熵 H₂(sin²θ)",blue,sequence(0,90,91).map(t=>[t,entropy(Math.sin(t*Math.PI/180)**2)]))],marker:[v.theta,S]},
        text:"45° 时两个 Schmidt 概率相等，熵为 1 bit；0° 与 90° 都是乘积态，熵回到 0。这个两体计算不能单独证明多体面积律或识别拓扑相。"};
    }
    if(topic==="qec"){
      const p=v.p,c=v.correlation,ind=3*p*p-2*p*p*p,mix=(1-c)*ind+c*p;
      return {values:v,numeric:{independent:ind,mixed:mix,physical:p},rows:[["物理比特错误率",p],["独立错误下逻辑错误率",ind],["当前混合下逻辑错误率",mix]],
        chart:{title:"固定多数表决与相关错误",xlabel:"单比特错误概率 p",ylabel:"错误概率",series:[series("单比特 p",orange,sequence(0,.8).map(p=>[p,p]),"8 4"),series("独立重复码 3p²−2p³",blue,sequence(0,.8).map(p=>[p,3*p*p-2*p*p*p])),series("当前共同错误混合",green,sequence(0,.8).map(p=>[p,(1-c)*(3*p*p-2*p*p*p)+c*p]),"2 5")],marker:[p,mix]},
        text:"以概率 c 进入共同错误分支（三个比特以概率 p 一起翻转），否则各自独立翻转。单比特边际始终为 p。c=1 时冗余不降低错误；p>1/2 时固定多数表决也不再改善。这里的 1/2 不是表面码阈值。"};
    }
    if(topic==="holography"){
      const r=v.radiation,b=12-r,bound=Math.min(r,b);
      return {values:v,numeric:{radiation:r,remaining:b,bound},rows:[["log₂ dR = r",r],["log₂ dB = 12−r",b],["纯态纠缠熵上界 / bit",bound]],
        chart:{title:"固定总维数下的 Page 前导示意",xlabel:"辐射量子比特数 r",ylabel:"熵（bit）",series:[series("min(r,12−r)：维数上界",blue,sequence(0,12,13).map(r=>[r,Math.min(r,12-r)])),series("只随辐射容量增长的参照 r",orange,sequence(0,12,13).map(r=>[r,r]),"8 4")],marker:[r,bound]},
        text:"全局纯态要求两侧纠缠熵相等，且不超过较小 Hilbert 空间的 log₂ 维数。乘积态可在任何分割处都为零；上界并不决定具体态的熵，更不等于黑洞微观演化的推导。"};
    }
    if(topic==="flow"){
      const t=v.t,mu=v.mu,varx=t*t+(1-t)**2,sd=Math.sqrt(varx),a=(2*t-1)/varx;
      const density=(x,s)=>Math.exp(-.5*((x-t*mu)/s)**2)/(Math.sqrt(2*Math.PI)*s);
      return {values:v,numeric:{mean:t*mu,variance:varx,sd,slope:a,velocityAtMean:mu},rows:[["边际均值 tμ",t*mu],["边际方差 t²+(1−t)²",varx],["速度的空间斜率",a],["均值位置的速度",mu]],
        chart:{title:"同样端点，不同中间分布",xlabel:"样本位置 x",ylabel:"概率密度",series:[series("独立端点插值的真实边际",blue,sequence(-6,6,121).map(x=>[x,density(x,sd)])),series("恒速平移 N(tμ,1)",orange,sequence(-6,6,121).map(x=>[x,density(x,1)]),"8 4")]},
        text:"条件均值速度 vₜ(x)=μ+(2t−1)/(t²+(1−t)²)·(x−tμ)。中点瞬时速度虽为常数 μ，此前收缩已使方差降为 1/2；仅看某个时刻的速度，不能跳过整条轨迹。"};
    }
    if(topic==="reasoning"){
      const r=reasoning(v.p,v.k,v.alpha);
      return {values:v,numeric:r,rows:[["oracle pass@k：至少一个正确",r.coverage],["最终返回正确的概率",r.selectedCorrect],["最终返回错误的概率",r.selectedWrong],["全部拒绝的概率",r.rejected],["返回非空时的正确比例",r.precision],["至少一个错误被误通过",r.falseReward]],
        chart:{xticks:[1,32,64],title:"候选覆盖与实际选择分开计分",xlabel:"候选次数 k",ylabel:"概率",series:[series("oracle pass@k",blue,sequence(1,64,64).map(k=>[k,reasoning(v.p,k,v.alpha).coverage])),series("首个通过者实际正确",orange,sequence(1,64,64).map(k=>[k,reasoning(v.p,k,v.alpha).selectedCorrect]),"8 4")],marker:[v.k,r.selectedCorrect]},
        text:"若 q=p+(1−p)α>0，返回正确概率为 p/q·[1−(1−q)^k]。真实正确、错误返回和全拒绝三种事件互斥且总概率为 1；有错误误通过时，多采样不保证正确选择概率趋于 1。"};
    }
    const x=v.input,h1=v.ablate1?0:x,h2=v.ablate2?0:x,y=Math.max(h1,h2);
    return {values:v,numeric:{h1,h2,y,baseline:x},rows:[["自然运行输出",x],["干预后 h₁",h1],["干预后 h₂",h2],["干预后 y=max(h₁,h₂)",y]],
      chart:{xticks:[0,1,2,3],title:"冗余路径的联合干预",xlabel:"干预编号（见下方）",ylabel:"输出 y",series:[series("无／只去1／只去2／同时去",blue,[[0,x],[1,x],[2,x],[3,0]])],marker:[v.ablate1+2*v.ablate2,y]},
      text:"图中 0=不消融、1=只消融路径1、2=只消融路径2、3=同时消融。x=1 时每条单独消融都不改输出，联合消融才变为0。单项不是必要条件，不等于它没有因果作用；每条保留路径在本模型中都足以维持输出。"};
  }
  function mount(root,api){
    const {el,svg}=api,doc=root.ownerDocument,topic=root.getAttribute("data-frontier-topic");
    const information=meta[topic];if(!information)throw Error("Unknown frontier topic");
    if(!doc.getElementById("frontier-lab-style"))doc.head.appendChild(el("style",{id:"frontier-lab-style"},`
      .fr-lab{line-height:1.75;min-width:0}.fr-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.fr-controls label{display:flex;flex-direction:column;gap:5px}.fr-lab input{width:100%}.fr-lab button{font:inherit;cursor:pointer;padding:7px 14px}.fr-lab figure{margin:18px 0}.fr-lab .fr-chart{width:100%;max-width:560px;margin:auto;display:block}.fr-chart text{font:20px sans-serif;fill:currentColor}.fr-lab figcaption>div{display:flex;align-items:center;text-align:left;gap:7px}.fr-lab figcaption svg{width:48px!important;height:20px!important;max-width:48px;flex-shrink:0;display:inline-block!important}.fr-lab table{width:100%;font-size:15px}.fr-lab th,.fr-lab td{padding:7px;text-align:left}.fr-note{border-left:3px solid #497ec5;padding-left:12px}.fr-output[hidden]{display:none}.fr-lab output{font-variant-numeric:tabular-nums}
    `));
    let values=defaults(topic),revealed=false;
    const shell=el("div",{className:"fr-lab"}),panel=el("div",{className:"fr-controls"}),out=el("div",{className:"fr-output",hidden:true}),inputs={};
    const format=n=>n===null?"未定义（从不通过）":Math.abs(n)<1e-12?"0":Math.abs(n)<.0001?n.toExponential(3):Number(n.toFixed(5)).toString();
    controls[topic].forEach(([key,label,min,max,step])=>{
      const number=el("output",{},format(values[key]));
      const input=el("input",{type:"range",min,max,step,value:values[key],"aria-label":label});inputs[key]={input,number};
      input.addEventListener("input",()=>{values[key]=Number(input.value);number.textContent=format(values[key]);if(revealed)render();});
      panel.appendChild(el("label",{},[label,number,input]));
    });
    const reveal=el("button",{type:"button","aria-expanded":"false"},"查看计算与图像"),reset=el("button",{type:"button"},"恢复本讲默认值");
    reveal.addEventListener("click",()=>{revealed=!revealed;out.hidden=!revealed;reveal.setAttribute("aria-expanded",String(revealed));reveal.textContent=revealed?"收起计算与图像":"查看计算与图像";if(revealed)render();});
    reset.addEventListener("click",()=>{values=defaults(topic);Object.keys(inputs).forEach(key=>{inputs[key].input.value=values[key];inputs[key].number.textContent=format(values[key]);});if(revealed)render();});
    shell.append(el("h3",{},information[0]),el("p",{},information[1]),panel,el("p",{},[reveal," ",reset]),el("p",{className:"fr-note"},information[2]),out);root.replaceChildren(shell);
    function draw(chart){
      const W=440,H=300,l=67,r=20,t=45,b=54,points=chart.series.flatMap(s=>s.points);
      const xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0])),ymin=Math.min(0,...points.map(p=>p[1])),ymax=Math.max(...points.map(p=>p[1]));
      const pad=Math.max((ymax-ymin)*.06,.02),lo=ymin-pad,hi=ymax+pad;
      const X=x=>l+(x-xmin)/(xmax-xmin||1)*(W-l-r),Y=y=>t+(hi-y)/(hi-lo)*(H-t-b);
      const g=svg("svg",{viewBox:`0 0 ${W} ${H}`,className:"fr-chart",role:"img","aria-label":chart.title+"；横轴"+chart.xlabel+"；纵轴"+chart.ylabel},[svg("title",{},chart.title),svg("text",{x:W/2,y:24,"text-anchor":"middle"},chart.title),svg("path",{d:`M${l},${t}V${H-b}H${W-r}`,fill:"none",stroke:"currentColor"}),svg("text",{x:W/2,y:H-10,"text-anchor":"middle"},chart.xlabel)]);
      (chart.xticks||[xmin,(xmin+xmax)/2,xmax]).forEach(x=>g.appendChild(svg("text",{x:X(x),y:H-b+26,"text-anchor":"middle"},Number(x.toFixed(2)).toString())));
      [...new Set([ymin,(ymin+ymax)/2,ymax])].forEach(y=>g.appendChild(svg("text",{x:l-8,y:Y(y)+7,"text-anchor":"end"},Number(y.toFixed(2)).toString())));
      chart.series.forEach(s=>g.appendChild(svg("polyline",{points:s.points.map(p=>`${X(p[0])},${Y(p[1])}`).join(" "),fill:"none",stroke:s.color,"stroke-width":3,"stroke-dasharray":s.dash||"none"})));
      if(chart.marker)g.appendChild(svg("circle",{cx:X(chart.marker[0]),cy:Y(chart.marker[1]),r:6,fill:"none",stroke:"currentColor","stroke-width":2}));
      const legend=el("figcaption",{},chart.series.map(s=>el("div",{},[svg("svg",{viewBox:"0 0 48 20","aria-hidden":"true"},svg("path",{d:"M1,10H47",stroke:s.color,"stroke-width":3,"stroke-dasharray":s.dash||"none"})),s.label])));
      legend.appendChild(el("p",{},"纵轴："+chart.ylabel+"。坐标范围随当前数据缩放；空心圆标记当前设置（若有）。"));return el("figure",{},[g,legend]);
    }
    function render(){const result=compute(topic,values);out.replaceChildren(el("table",{},[el("thead",{},el("tr",{},[el("th",{scope:"col"},"计算量"),el("th",{scope:"col"},"数值")])),el("tbody",{},result.rows.map(([label,value])=>el("tr",{},[el("th",{scope:"row"},label),el("td",{},format(value))])))]),draw(result.chart),el("p",{className:"fr-note","aria-live":"polite"},result.text));}
  }
  return {compute,defaults,reasoning,entropy,mount,topics:Object.keys(meta)};
});
