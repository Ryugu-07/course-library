(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root.CourseLearning) root.CourseLearning.register("heat-inverse-project", api.mount);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const N = 16, M = 8, lambdas = [1e-6,1e-5,1e-4,1e-3,1e-2,.1];
  const scenarios = ["smooth", "high-frequency", "wrong-diffusivity"];
  const methods = ["least_squares", "tikhonov", "learned"];
  const names = {least_squares:"无正则最小二乘", tikhonov:"Tikhonov", learned:"学习的八参数逆"};
  const labels = {smooth:"同分布：平滑初态", "high-frequency":"分布外：第六模态增强", "wrong-diffusivity":"模型失配：实际扩散更快"};
  const x = Array.from({length:N},(_,j)=>(j+1)/17);
  const Q = x.map(v=>Array.from({length:M},(_,k)=>Math.sqrt(2/17)*Math.sin(v*(k+1)*Math.PI)));
  const dot = (a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const field = a=>Q.map(row=>dot(row,a));
  const project = y=>Array.from({length:M},(_,k)=>y.reduce((s,v,j)=>s+Q[j][k]*v,0));
  const attenuation = (t,kappa=.01)=>Array.from({length:M},(_,k)=>Math.exp(-kappa*((k+1)*Math.PI)**2*t));
  const forward = (a,t,kappa=.01)=>field(a.map((v,k)=>v*attenuation(t,kappa)[k]));
  const mse = (a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0)/a.length;
  function generate(split,t,sigma,scenario="smooth") {
    if (![.5,1,1.5].includes(t) || ![0,.02,.05].includes(sigma)) throw Error("Unsupported experiment settings");
    if (!scenarios.includes(scenario) || (split!=="test" && scenario!=="smooth")) throw Error("Invalid split/scenario");
    const spec = {train:[101,128],validation:[202,32],test:[303,32]}[split];
    if (!spec) throw Error("Unknown split");
    return Array.from({length:spec[1]},(_,i)=>{
      let state = (spec[0]+104729*i)>>>0;
      const uniform = ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+.5)/4294967296;};
      const normal = ()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
      const a = Array.from({length:M},(_,k)=>{const z=normal();return k===0?6+.6*z:1.5*z/Math.max(k,1)**2;});
      if (scenario==="high-frequency") a[5]+=i%2===0?6:-6;
      const kappa=scenario==="wrong-diffusivity"?.016:.01;
      const noise=Array.from({length:N},normal), futureNoise=Array.from({length:N},normal);
      return {split,index:i,scenario,coefficients_K:a,initial_K:field(a),
        true_kappa_m2_per_s:kappa, observed_K:forward(a,t,kappa).map((v,j)=>v+sigma*noise[j]),
        future_observed_K:forward(a,t+.5,kappa).map((v,j)=>v+sigma*futureNoise[j])};
    });
  }
  function fitLearned(rows) {
    if (rows.some(r=>r.split!=="train")) throw Error("Training trajectories only");
    const numerator=Array(M).fill(0), denominator=Array(M).fill(0);
    rows.forEach(r=>project(r.observed_K).forEach((b,k)=>{numerator[k]+=b*r.coefficients_K[k];denominator[k]+=b*b;}));
    return numerator.map((v,k)=>v/denominator[k]);
  }
  function reconstruct(y,t,method,lambda,weights) {
    const b=project(y),s=attenuation(t);
    if (!methods.includes(method)) throw Error("Unknown estimator");
    return b.map((v,k)=>method==="least_squares"?v/s[k]:method==="tikhonov"?s[k]*v/(s[k]**2+lambda):weights[k]*v);
  }
  function metrics(row,a,t) {
    return {initial_rmse_K:Math.sqrt(mse(field(a),row.initial_K)),
      observation_residual_rms_K:Math.sqrt(mse(forward(a,t),row.observed_K)),
      future_predictive_rmse_K:Math.sqrt(mse(forward(a,t+.5),row.future_observed_K))};
  }
  function buildBenchmark(t=1,sigma=.02) {
    const train=generate("train",t,sigma), validation=generate("validation",t,sigma), weights=fitLearned(train);
    const scores=lambdas.map(lambda=>({lambda,initial_field_mse_K2:validation.reduce((sum,r)=>sum+mse(field(reconstruct(r.observed_K,t,"tikhonov",lambda)),r.initial_K),0)/validation.length}));
    const selected=scores.reduce((best,r)=>r.initial_field_mse_K2<best.initial_field_mse_K2?r:best).lambda;
    const test={}, aggregate={};
    scenarios.forEach(scenario=>{
      test[scenario]=generate("test",t,sigma,scenario).map(row=>{
        row.estimators={};methods.forEach(method=>{const a=reconstruct(row.observed_K,t,method,selected,weights);row.estimators[method]={coefficients_K:a,initial_K:field(a),metrics:metrics(row,a,t)};});return row;
      });
      aggregate[scenario]={};methods.forEach(method=>{
        aggregate[scenario][method]={};Object.keys(test[scenario][0].estimators[method].metrics).forEach(key=>{
          aggregate[scenario][method][key]=Math.sqrt(test[scenario].reduce((sum,r)=>sum+r.estimators[method].metrics[key]**2,0)/32);
        });
      });
    });
    return {protocol_version:"heat-inverse-v1", config:{t_s:t,sigma_K:sigma},
      fitted:{learned_fit_split:"train",lambda_selection_split:"validation",learned_weights:weights,validation_selected_lambda:selected,validation_scores:scores},
      splits:{train,validation,test},metrics:aggregate};
  }
  function mount(root,api) {
    const {el,svg}=api, doc=root.ownerDocument;
    if (!doc.getElementById("heat-project-style")) doc.head.appendChild(el("style",{id:"heat-project-style"},`
      .hi-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.hi-controls label{display:flex;flex-direction:column;gap:4px}.hi-controls select,.hi-controls input,.hi-shell button{font:inherit;padding:7px;max-width:100%}.hi-shell{line-height:1.7;min-width:0}.hi-shell figure{margin:16px 0}.hi-shell figcaption>div{display:flex;align-items:center;gap:6px;text-align:left}.hi-shell figcaption svg{width:48px!important;height:20px!important;display:inline-block!important;flex-shrink:0;max-width:48px}.hi-chart{width:100%;max-width:540px;display:block;margin:auto;color:inherit}.hi-scroll{overflow-x:auto}.hi-shell table{font-size:14px;min-width:460px;width:100%}.hi-shell td,.hi-shell th{padding:6px;text-align:right}.hi-shell th:first-child,.hi-shell td:first-child{text-align:left}.hi-note{border-left:3px solid #6c8acf;padding-left:12px}.hi-shell button{cursor:pointer}.hi-shell details{margin:12px 0}.hi-chart text{fill:currentColor;font:20px sans-serif}
    `));
    const shell=el("div",{className:"hi-shell"}), controls=el("div",{className:"hi-controls"});
    let state={t:1,sigma:.02,scenario:"smooth",index:0,lambda:.001,reveal:false};
    let benchmark=buildBenchmark(), plotArea=el("div"), result=el("div",{"aria-live":"polite"}), summary=el("div"), selectors={};
    function select(key,title,options) {
      const input=el("select",{"aria-label":title},options.map(([value,text])=>el("option",{value},text)));
      input.value=String(state[key]);selectors[key]=input;
      input.addEventListener("change",()=>{
        state[key]=key==="scenario"?input.value:Number(input.value);
        if (key==="t" || key==="sigma") benchmark=buildBenchmark(state.t,state.sigma);
        state.reveal=false;render();
      });controls.appendChild(el("label",{},[title,input]));
    }
    select("t","测量时刻 t（秒）",[.5,1,1.5].map(v=>[v,String(v)]));
    select("sigma","传感器噪声 σ（K）",[0,.02,.05].map(v=>[v,String(v)]));
    select("scenario","测试场景",scenarios.map(s=>[s,labels[s]]));
    select("index","测试轨迹编号",Array.from({length:32},(_,i)=>[i,String(i)]));
    select("lambda","手动正则 λ（仅当前轨迹）",lambdas.map(v=>[v,String(v)]));
    const reveal=el("button",{type:"button"},"显示真值与误差");
    reveal.addEventListener("click",()=>{state.reveal=!state.reveal;render();});
    const reset=el("button",{type:"button"},"恢复默认实验");
    reset.addEventListener("click",()=>{state={t:1,sigma:.02,scenario:"smooth",index:0,lambda:.001,reveal:false};Object.keys(selectors).forEach(k=>selectors[k].value=String(state[k]));benchmark=buildBenchmark();render();});
    const download=el("button",{type:"button"},"下载当前轨迹 JSON（含真值）");
    download.addEventListener("click",()=>{
      const row=benchmark.splits.test[state.scenario][state.index];
      const manual=reconstruct(row.observed_K,state.t,"tikhonov",state.lambda);
      const data={protocol_version:benchmark.protocol_version,config:{...state},x_m:x,
        fitted:benchmark.fitted,trajectory:row,manual_tikhonov:{lambda:state.lambda,coefficients_K:manual,initial_K:field(manual),metrics:metrics(row,manual,state.t)}};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
      const link=el("a",{href:url,download:`heat-inverse-${state.scenario}-${state.index}.json`});doc.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    shell.append(el("h3",{},"一根杆，三种逆推方法"),el("p",{},"两端接恒温浴，16 个内点传感器在 t 秒读数。所有温度都是相对浴温的差值（K）；负值表示比浴温冷。没有持续热源。这是八模态模拟数据。"),controls,
      el("p",{className:"hi-note"},"先预测：哪种重建保留了真实细节？改变测量时刻或噪声，会重新生成固定种子的训练／验证／测试数据并拟合八个权重；切换测试场景不会重训。"),plotArea,
      el("p",{},[reveal," ",reset," ",download]),result,summary);
    const rod=svg("svg",{viewBox:"0 0 440 130",role:"img","aria-label":"一米长杆，两端固定浴温，16个内点传感器均匀间隔，位置从1/17到16/17米",className:"hi-chart"},[
      svg("title",{},"杆与16个传感器"),svg("path",{d:"M30,60H410",stroke:"currentColor","stroke-width":8}),
      svg("text",{x:30,y:30},"左端 u=0"),svg("text",{x:410,y:30,"text-anchor":"end"},"右端 u=0"),
      svg("text",{x:220,y:105,"text-anchor":"middle"},"16 个内点测温；杆长 L=1 m")]);
    x.forEach(v=>rod.appendChild(svg("circle",{cx:30+380*v,cy:60,r:5,fill:"#518bdd",stroke:"currentColor"})));
    shell.insertBefore(rod,controls);
    shell.appendChild(el("p",{},["复现下载：",...[["PROTOCOL.md","完整协议"],["reference.py","独立 NumPy 参考脚本"],["benchmark-default.json","默认完整基准数据"]].flatMap(([file,label],i)=>[i?" · ":"",el("a",{href:"assets/learning/projects/heat-inverse/"+file},label)])]));
    root.replaceChildren(shell);
    function chart(title,series,description) {
      const W=440,H=285,left=65,right=20,top=42,bottom=50;
      const all=series.flatMap(s=>s.values), low=Math.min(0,...all), high=Math.max(0,...all);
      const pad=Math.max((high-low)*.08,.05), lo=low-pad,hi=high+pad;
      const px=v=>left+v*(W-left-right), py=v=>top+(hi-v)/(hi-lo)*(H-top-bottom);
      const g=svg("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":title+"。"+description,className:"hi-chart"},[
        svg("title",{},title),svg("desc",{},description),svg("text",{x:W/2,y:24,"text-anchor":"middle"},title),
        svg("path",{d:`M${left},${top}V${H-bottom}H${W-right}`,fill:"none",stroke:"currentColor"}),
        svg("text",{x:W/2,y:H-8,"text-anchor":"middle"},"位置 x（m）"),svg("text",{x:8,y:24},"K")]);
      [0,.5,1].forEach(v=>g.appendChild(svg("text",{x:px(v),y:H-bottom+24,"text-anchor":"middle"},String(v))));
      [lo,(lo+hi)/2,hi].forEach(v=>{g.appendChild(svg("text",{x:left-7,y:py(v)+6,"text-anchor":"end"},Math.abs(v)>=100?v.toExponential(1):v.toFixed(1)));});
      g.appendChild(svg("path",{d:`M${left},${py(0)}H${W-right}`,stroke:"currentColor","stroke-opacity":.2}));
      series.forEach(s=>{
        const values=s.boundaries?[0,...s.values,0]:s.values, xs=s.boundaries?[0,...x,1]:x;
        if (!s.points) g.appendChild(svg("polyline",{points:values.map((v,i)=>`${px(xs[i])},${py(v)}`).join(" "),fill:"none",stroke:s.color,"stroke-width":2.5,"stroke-dasharray":s.dash||"none"}));
        else values.forEach((v,i)=>g.appendChild(s.square?svg("rect",{x:px(xs[i])-4,y:py(v)-4,width:8,height:8,fill:"none",stroke:s.color,"stroke-width":2}):svg("circle",{cx:px(xs[i]),cy:py(v),r:3.5,fill:s.color})));
      });
      const legend=el("figcaption",{},series.map(s=>el("div",{},[
        svg("svg",{width:48,height:20,viewBox:"0 0 48 20","aria-hidden":"true",style:"vertical-align:middle;margin-right:6px"},[
          s.points?(s.square?svg("rect",{x:20,y:6,width:8,height:8,fill:"none",stroke:s.color,"stroke-width":2}):svg("circle",{cx:24,cy:10,r:4,fill:s.color})):svg("path",{d:"M2,10H46",stroke:s.color,"stroke-width":3,"stroke-dasharray":s.dash||"none"})]),s.label])));
      legend.appendChild(el("p",{},"纵轴随当前数据自动缩放；折线只连接传感器位置，不代表更密的测量。"));
      return el("figure",{},[g,legend]);
    }
    function table(headers,rows) {return el("div",{className:"hi-scroll"},el("table",{},[el("thead",{},el("tr",{},headers.map(h=>el("th",{scope:"col"},h)))),el("tbody",{},rows.map(row=>el("tr",{},row.map((v,i)=>el(i?"td":"th",i?{}:{scope:"row"},v)))))]));}
    const fmt=v=>v===0?"0":Math.abs(v)<.0001?v.toExponential(3):v.toFixed(4);
    function render() {
      const row=benchmark.splits.test[state.scenario][state.index], estimates={};
      methods.forEach(m=>{const a=reconstruct(row.observed_K,state.t,m,state.lambda,benchmark.fitted.learned_weights);estimates[m]={a,metrics:metrics(row,a,state.t)};});
      const colors={least_squares:"#dc6545",tikhonov:"#518bdd",learned:"#9d73da"};
      const series=methods.map((m,i)=>({label:names[m]+(m==="tikhonov"?"，手动 λ":""),values:field(estimates[m].a),color:colors[m],dash:i===1?"8 4":i===2?"2 5":null,boundaries:true}));
      if(state.reveal)series.unshift({label:"模拟初态真值",values:row.initial_K,color:"#279b7a",boundaries:true,dash:"12 3 2 3"});
      plotArea.replaceChildren(chart("初态重建：从晚到早",series,"横轴为杆长，纵轴为初始温差。两端温差为零。无正则解可能有很大振荡。"),
        chart(`传感器读数与未来预测`,[
          {label:`t=${state.t} 的测量`,values:row.observed_K,color:"#dc6545",points:true},
          {label:"手动 Tikhonov 对测量的拟合",values:forward(estimates.tikhonov.a,state.t),color:"#518bdd",boundaries:true},
          {label:`t=${state.t+.5} 的独立测量`,values:row.future_observed_K,color:"#279b7a",points:true,square:true},
          {label:"手动 Tikhonov 未来预测",values:forward(estimates.tikhonov.a,state.t+.5),color:"#9d73da",dash:"8 4",boundaries:true}
        ],"未来读数使用独立噪声，不参与拟合。初态图和观测图的纵轴范围可能不同。"));
      reveal.textContent=state.reveal?"隐藏真值与误差":"显示真值与误差";
      result.replaceChildren(el("p",{},`当前：${labels[state.scenario]}，测试轨迹 ${state.index}；假设 κ=0.01 m²/s，模拟实际 κ=${row.true_kappa_m2_per_s} m²/s。`));
      if(state.reveal) result.append(table(["当前轨迹","初态 RMSE/K","观测残差/K","未来 RMSE/K"],methods.map(m=>[names[m]+(m==="tikhonov"?` λ=${state.lambda}`:""),...Object.values(estimates[m].metrics).map(fmt)])),el("p",{className:"hi-note"},"真值仅在模拟中可知。观测残差小，只说明拟合了已有读数；未来误差小，也不能证明已恢复被扩散抹去的初态细节。"));
      const singular=attenuation(state.t), weights=benchmark.fitted.learned_weights;
      const details=el("details",{},[el("summary",{},"展开模态账本：衰减与逆向增益"),table(["模态 k","衰减 sₖ","直接逆 1/sₖ","手动正则增益","学习权重 wₖ"],singular.map((s,k)=>[String(k+1),fmt(s),fmt(1/s),fmt(s/(s*s+state.lambda)),fmt(weights[k])]))]);
      summary.replaceChildren(details,el("h4",{},"冻结方案后的 32 条测试轨迹"),el("p",{},`128 条训练轨迹拟合权重；32 条验证轨迹选择 λ=${benchmark.fitted.validation_selected_lambda}。下表正则法始终使用这个验证值，不随手动 λ 改变。全部误差先汇总平方再开根，单位 K。`));
      if (state.reveal) summary.appendChild(table(["场景／方法","初态 RMSE","观测残差","未来 RMSE"],scenarios.flatMap(s=>methods.map(m=>[labels[s]+" / "+names[m],...Object.values(benchmark.metrics[s][m]).map(fmt)]))));
      else summary.appendChild(el("p",{},"点击“显示真值与误差”后查看测试对照。先写下你的预测，再核对三种场景。"));
    }
    render();
  }
  return {Q,x,attenuation,field,project,forward,generate,fitLearned,reconstruct,metrics,buildBenchmark,mount};
});
