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
  function finite(v,label) {
    if(typeof v!=="number" || !Number.isFinite(v))throw new TypeError(label+" must be a finite number");
    return v;
  }
  function vector(a,n,label) {
    if(!Array.isArray(a)||a.length!==n)throw new TypeError(label+" has the wrong length");
    for(let i=0;i<n;i++)finite(a[i],label+"["+i+"]");
    return a;
  }
  function time(t) {finite(t,"time");if(t<0)throw new RangeError("time must be nonnegative");}
  function nonnegative(v,label) {finite(v,label);if(v<0)throw new RangeError(label+" must be nonnegative");}
  function fitRows(rows,split) {
    if(!Array.isArray(rows)||rows.length===0)throw new TypeError("A nonempty trajectory array is required");
    for(let i=0;i<rows.length;i++){
      const r=rows[i];if(!r||r.split!==split)throw new Error(split==="train"?"Training trajectories only":"Validation trajectories only");
      vector(r.observed_K,N,"observed");vector(r.coefficients_K,M,"coefficients");vector(r.initial_K,N,"initial");
    }
  }
  function selectLambda(rows,t) {
    fitRows(rows,"validation");time(t);
    const scores=lambdas.map(lambda=>({lambda,initial_field_mse_K2:rows.reduce((sum,r)=>sum+mse(field(reconstruct(r.observed_K,t,"tikhonov",lambda)),r.initial_K),0)/rows.length}));
    const selected=scores.reduce((best,r)=>r.initial_field_mse_K2<best.initial_field_mse_K2?r:best).lambda;
    return {selected,scores};
  }
  function trajectoryLedger(row,t,sigma,lambda,weights) {
    time(t);nonnegative(sigma,"sigma");nonnegative(lambda,"lambda");vector(weights,M,"weights");
    if(!row||!scenarios.includes(row.scenario))throw new TypeError("Unknown trajectory scenario");
    vector(row.coefficients_K,M,"coefficients");vector(row.observed_K,N,"observed");vector(row.initial_K,N,"initial");vector(row.future_observed_K,N,"future");
    nonnegative(row.true_kappa_m2_per_s,"true diffusivity");
    const b=project(row.observed_K),s=attenuation(t),trueS=attenuation(t,row.true_kappa_m2_per_s);
    const estimates={};methods.forEach(method=>{
      const a=reconstruct(row.observed_K,t,method,lambda,weights);
      estimates[method]={coefficients_K:a,initial_K:field(a),observed_fit_K:forward(a,t),future_fit_K:forward(a,t+.5),metrics:metrics(row,a,t)};
    });
    const modes=s.map((v,k)=>{
      const truth=row.coefficients_K[k],signal=trueS[k]*truth,eta=b[k]-signal;
      const gains={least_squares:1/v,tikhonov:v/(v*v+lambda),learned:weights[k]},risk={};
      methods.forEach(method=>{
        const g=gains[method],bias=(g*trueS[k]-1)*truth,variance=(g*sigma)**2;
        risk[method]={gain:g,shrinkage:g*v,bias_K:bias,bias_squared_K2:bias*bias,variance_K2:variance,mse_K2:bias*bias+variance,error_K:estimates[method].coefficients_K[k]-truth};
      });
      return {mode:k+1,s:v,true_s:trueS[k],truth_K:truth,signal_K:signal,projected_K:b[k],projected_noise_K:eta,noise_sd_K:sigma,risk};
    });
    const conditionalRisk={};methods.forEach(method=>{
      const bias_squared_K2=modes.reduce((sum,r)=>sum+r.risk[method].bias_squared_K2,0)/N;
      const variance_K2=modes.reduce((sum,r)=>sum+r.risk[method].variance_K2,0)/N;
      conditionalRisk[method]={bias_squared_K2,variance_K2,mse_K2:bias_squared_K2+variance_K2,root_mean_squared_risk_K:Math.sqrt(bias_squared_K2+variance_K2)};
    });
    const projected=field(b),orthogonal=row.observed_K.map((v,j)=>v-projected[j]);
    const projection={orthogonal_K:orthogonal,orthogonal_sse_K2:dot(orthogonal,orthogonal),methods:{}};
    methods.forEach(method=>{
      const a=estimates[method].coefficients_K;
      const modal_sse_K2=s.reduce((sum,v,k)=>sum+(v*a[k]-b[k])**2,0);
      const residual_sse_K2=N*estimates[method].metrics.observation_residual_rms_K**2;
      projection.methods[method]={modal_sse_K2,residual_sse_K2,sum_sse_K2:modal_sse_K2+projection.orthogonal_sse_K2};
    });
    const sensors=x.map((v,j)=>({index:j+1,x_m:v,truth_K:row.initial_K[j],observed_K:row.observed_K[j],future_observed_K:row.future_observed_K[j],
      estimates:Object.fromEntries(methods.map(m=>[m,{initial_K:estimates[m].initial_K[j],observed_fit_K:estimates[m].observed_fit_K[j],future_fit_K:estimates[m].future_fit_K[j]}]))}));
    return {modes,sensors,estimates,conditionalRisk,projection};
  }

  Q.forEach(Object.freeze);Object.freeze(Q);Object.freeze(x);
  const dot = (a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const field = a=>{vector(a,M,"coefficients");return Q.map(row=>finite(dot(row,a),"field value"));};
  const project = y=>{vector(y,N,"observed");return Array.from({length:M},(_,k)=>finite(y.reduce((s,v,j)=>s+Q[j][k]*v,0),"projected value"));};
  const attenuation = (t,kappa=.01)=>{time(t);nonnegative(kappa,"diffusivity");return t===0||kappa===0?Array(M).fill(1):Array.from({length:M},(_,k)=>Math.exp(-kappa*((k+1)*Math.PI)**2*t));};
  const forward = (a,t,kappa=.01)=>field(a.map((v,k)=>v*attenuation(t,kappa)[k]));
  const mse = (a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0)/a.length;
  function generate(split,t,sigma,scenario="smooth") {
    if (![.5,1,1.5].includes(t) || ![0,.02,.05].includes(sigma)) throw Error("Unsupported experiment settings");
    if (!scenarios.includes(scenario) || (split!=="test" && scenario!=="smooth")) throw Error("Invalid split/scenario");
    if(!["train","validation","test"].includes(split))throw Error("Unknown split");
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
    fitRows(rows,"train");
    const numerator=Array(M).fill(0), denominator=Array(M).fill(0);
    rows.forEach(r=>project(r.observed_K).forEach((b,k)=>{numerator[k]+=b*r.coefficients_K[k];denominator[k]+=b*b;}));
    return numerator.map((v,k)=>{if(!(denominator[k]>0))throw new RangeError("Training mode has zero energy");return finite(v/denominator[k],"learned weight");});
  }
  function reconstruct(y,t,method,lambda,weights) {
    const b=project(y),s=attenuation(t);
    if(method==="tikhonov")nonnegative(lambda,"lambda");
    if(method==="learned")vector(weights,M,"weights");
    if (!methods.includes(method)) throw Error("Unknown estimator");
    return b.map((v,k)=>finite(method==="least_squares"?v/s[k]:method==="tikhonov"?s[k]*v/(s[k]**2+lambda):weights[k]*v,"reconstructed coefficient"));
  }
  function metrics(row,a,t) {
    if(!row)throw new TypeError("Trajectory required");
    vector(row.initial_K,N,"initial");vector(row.observed_K,N,"observed");vector(row.future_observed_K,N,"future");
    return {initial_rmse_K:Math.sqrt(mse(field(a),row.initial_K)),
      observation_residual_rms_K:Math.sqrt(mse(forward(a,t),row.observed_K)),
      future_predictive_rmse_K:Math.sqrt(mse(forward(a,t+.5),row.future_observed_K))};
  }
  function buildBenchmark(t=1,sigma=.02) {
    const train=generate("train",t,sigma), validation=generate("validation",t,sigma), weights=fitLearned(train);
    const {scores,selected}=selectLambda(validation,t);
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
  const palette=["#d56643","#497fc4","#9b75ce","#268b6b"];
  const fmt=v=>{if(!Number.isFinite(v))return"不可表示";if(v===0)return"0";if(Math.abs(v)<.0001||Math.abs(v)>=10000)return v.toExponential(5);return v.toFixed(6).replace(/0+$/,"").replace(/\.$/,"");};
  function drawHeatChart(svg,title,series,options={}) {
    const left=125,right=865,top=50,bottom=295;
    const all=series.flatMap(s=>s.values),minimum=Math.min(0,...all),maximum=Math.max(0,...all);
    const pad=Math.max((maximum-minimum)*.08,options.pad||1e-12),lo=minimum-pad,hi=maximum+pad;
    const xmin=options.modes?1:0,xmax=options.modes?8:1;
    const X=v=>left+(v-xmin)/(xmax-xmin)*(right-left),Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
    const g=svg("svg",{viewBox:"0 0 900 390",role:"img","aria-label":title,class:"hi-chart"},[
      svg("title",{},title),svg("desc",{},options.description||"完整数据与条件见相邻账本，纵轴按当前图的数据独立缩放。"),
      svg("text",{x:left,y:25},title),svg("text",{x:20,y:25},options.unit||"K")]);
    for(let j=0;j<=4;j++){
      const v=lo+(hi-lo)*j/4,y=Y(v);
      g.append(svg("line",{x1:left,y1:y,x2:right,y2:y,stroke:"currentColor","stroke-opacity":.15}),
        svg("text",{x:left-12,y:y+5,"text-anchor":"end"},fmt(v)));
    }
    for(const v of options.modes?[1,2,3,4,5,6,7,8]:[0,.25,.5,.75,1])
      g.append(svg("text",{x:X(v),y:322,"text-anchor":"middle"},String(v)));
    g.append(svg("text",{x:right,y:352,"text-anchor":"end"},options.modes?"模态 k":"位置 x（m）"));
    series.forEach((s,i)=>{
      const xs=s.xs||(options.modes?Array.from({length:8},(_,k)=>k+1):x),color=s.color||palette[i];
      if(!s.points)g.append(svg("polyline",{"data-series":s.key,points:s.values.map((v,k)=>X(xs[k])+","+Y(v)).join(" "),fill:"none",stroke:color,"stroke-width":2.5,"stroke-dasharray":s.dash||"none"}));
      s.values.forEach((v,k)=>g.append(svg("circle",{"data-point":s.key,"data-index":k,cx:X(xs[k]),cy:Y(v),r:s.points?4:2.5,fill:color})));
    });
    g.append(svg("text",{x:left,y:382},options.modes?"所有 8 个模态逐项绘制；参见完整账本。":"折线连接测点；没有新增传感器测量。"));
    return g;
  }
  function mount(root,api) {
    if(root.dataset.heatMounted)return;root.dataset.heatMounted="true";
    const {el,svg}=api,doc=root.ownerDocument;
    if(!doc.getElementById("heat-project-style"))doc.head.append(el("style",{id:"heat-project-style"},
      ".hi-shell{min-width:0;line-height:1.75}.hi-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.hi-controls label{display:flex;flex-direction:column;gap:6px}.hi-shell select,.hi-shell button{font:inherit;padding:9px;color:inherit;background:var(--bg);border:1px solid #80808060;border-radius:5px;max-width:100%}.hi-shell button{cursor:pointer}.hi-shell button:disabled{opacity:.5;cursor:default}.hi-shell button[aria-pressed=true]{outline:2px solid #497fc4;outline-offset:1px}.hi-shell button:focus-visible,.hi-scroll:focus-visible{outline:3px solid #497fc4;outline-offset:3px}.hi-scroll{overflow:auto;max-height:500px;margin:14px 0}.hi-shell svg.hi-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;color:inherit}.hi-chart text{fill:currentColor;font:15px sans-serif}.hi-chart text:first-of-type{font-size:19px}.hi-shell figure{margin:20px 0}.hi-shell figcaption{font-size:15px}.hi-legend{display:flex;flex-wrap:wrap;gap:10px 24px}.hi-legend span{display:flex;align-items:center;gap:6px}.hi-legend i{width:24px;border-top:3px solid;display:inline-block}.hi-shell table{width:100%;min-width:900px;font-size:14px}.hi-shell td,.hi-shell th{padding:7px;text-align:right;white-space:nowrap}.hi-shell td:first-child,.hi-shell th:first-child{text-align:left}.hi-shell fieldset{margin:16px 0;padding:12px;border:1px solid #80808050}.hi-shell fieldset button{margin:5px}.hi-shell .hi-note{border-left:3px solid #497fc4;padding-left:12px}.hi-shell [hidden]{display:none!important}.hi-shell details{margin:18px 0}"
    ));
    const defaults={t:1,sigma:.02,scenario:"smooth",index:0,lambda:.001};
    let state={...defaults},revealed=false,answers=[null,null,null],benchmark=buildBenchmark(),ledger;
    const cache=new Map([["1/0.02",benchmark]]),selectors={};
    const shell=el("div",{className:"hi-shell"}),controls=el("div",{className:"hi-controls"}),given=el("div",{className:"hi-given"}),result=el("section",{className:"hi-results",hidden:true}),feedback=el("p",{className:"hi-feedback","aria-live":"polite"});
    function region(child,label){return el("div",{className:"hi-scroll",role:"region",tabindex:"0","aria-label":label},child);}
    function table(key,title,headers,rows){
      return region(el("table",{"data-table":key},[el("caption",{},title),el("thead",{},el("tr",{},headers.map(h=>el("th",{scope:"col"},h)))),el("tbody",{},rows.map(row=>el("tr",{},row.map((v,i)=>el(i?"td":"th",i?{}:{scope:"row"},typeof v==="number"?fmt(v):v)))))]),title+"，可横向和纵向滚动");
    }
    function figure(title,series,options={}){
      return el("figure",{},[region(drawHeatChart(svg,title,series,options),title+"，可横向滚动"),el("figcaption",{},[
        el("div",{className:"hi-legend"},series.map((s,i)=>el("span",{},[el("i",{style:"border-color:"+(s.color||palette[i])+";border-top-style:"+(s.dash?"dashed":"solid")}),s.label]))),
        el("p",{},options.description||"纵轴随当前数据独立缩放。圆点是完整数据；精确到显示位数的数值可在账本核对。")])]);
    }
    function current(){return benchmark.splits.test[state.scenario][state.index];}
    function rebuild(){
      const key=state.t+"/"+state.sigma;
      if(!cache.has(key))cache.set(key,buildBenchmark(state.t,state.sigma));
      benchmark=cache.get(key);ledger=trajectoryLedger(current(),state.t,state.sigma,state.lambda,benchmark.fitted.learned_weights);
    }
    function select(key,title,options){
      const input=el("select",{"aria-label":title,"data-key":key},options.map(([value,label])=>el("option",{value},label)));
      input.value=String(state[key]);selectors[key]=input;
      input.addEventListener("change",()=>{state[key]=key==="scenario"?input.value:Number(input.value);rebuild();render();});
      controls.append(el("label",{},[title,input]));
    }
    select("t","测量时刻 t（s）",[.5,1,1.5].map(v=>[v,String(v)]));
    select("sigma","噪声标准差 σ（K）",[0,.02,.05].map(v=>[v,String(v)]));
    select("scenario","测试场景",scenarios.map(v=>[v,labels[v]]));
    select("index","测试轨迹编号",Array.from({length:32},(_,i)=>[i,String(i)]));
    select("lambda","手动正则 λ",[...lambdas].map(v=>[v,String(v)]));
    const questions=[
      ["相同噪声下，观测越晚，哪类细节的直接反演更敏感？",[["fine","高频细节"],["all","所有方向相同"]],"fine"],
      ["增大正则参数后曲线更平稳，能否推出初态误差更小？",[["bias","不能，还要检查信号偏差"],["always","能，平稳就更准确"]],"bias"],
      ["独立晚时刻预测很好，是否已经证明初态细节正确？",[["no","还不能，晚时刻又衰减了高频"],["yes","已经证明"]],"no"]
    ];
    const prediction=el("div",{className:"hi-predictions"},questions.map((q,i)=>el("fieldset",{},[el("legend",{},(i+1)+". "+q[0]),...q[1].map(([value,label])=>{
      const button=el("button",{type:"button","data-question":i,"data-answer":value,"aria-pressed":"false"},label);
      button.addEventListener("click",()=>{answers[i]=value;revealed=false;prediction.querySelectorAll('[data-question="'+i+'"]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.answer===value)));render();});
      return button;
    })])));
    const reveal=el("button",{type:"button",disabled:true},"核对预测并显示真值账本");
    reveal.addEventListener("click",()=>{if(answers.some(v=>v===null))return;revealed=true;render();result.querySelector("h4").focus();});
    const reset=el("button",{type:"button"},"恢复默认实验");
    reset.addEventListener("click",()=>{state={...defaults};revealed=false;answers=[null,null,null];Object.keys(selectors).forEach(k=>selectors[k].value=String(state[k]));prediction.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed","false"));rebuild();render();prediction.querySelector("button").focus();});
    const download=el("button",{type:"button",hidden:true},"下载当前轨迹与完整账本 JSON");
    download.addEventListener("click",()=>{
      const data={protocol_version:benchmark.protocol_version,config:{...state},x_m:x,fitted:benchmark.fitted,trajectory:current(),manual_tikhonov:{lambda:state.lambda,...ledger.estimates.tikhonov},ledger};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),a=el("a",{href:url,download:"heat-inverse-"+state.scenario+"-"+state.index+".json"});
      doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const rod=svg("svg",{viewBox:"0 0 900 135",role:"img","aria-label":"一米棒的16个内点传感器，两端超额温度为零",class:"hi-chart"},[
      svg("title",{},"固定测点与浴温边界"),svg("line",{x1:80,y1:65,x2:820,y2:65,stroke:"currentColor","stroke-width":8}),
      svg("text",{x:80,y:30},"x=0，u=0"),svg("text",{x:820,y:30,"text-anchor":"end"},"x=1 m，u=0"),svg("text",{x:450,y:112,"text-anchor":"middle"},"内部测点 xⱼ=j/17 m；所有温度都是相对浴温的差值 K")]);
    x.forEach((v,j)=>rod.append(svg("circle",{"data-sensor":j+1,cx:80+740*v,cy:65,r:5,fill:"#497fc4",stroke:"currentColor"})));
    shell.append(el("h3",{},"从观测投影到误差来源"),el("p",{},"固定八模态模型：先看测点和读数，作出预测，再逐项核对。改变 t 或 σ 会按固定协议重新生成三份数据并重新拟合；改变测试场景不会重训。"),region(rod,"测点位置，可横向滚动"),controls,given,prediction,el("p",{},[reveal," ",reset," ",download]),feedback,result,
      el("p",{},["复现下载：",...[[ "PROTOCOL.md","完整协议"],["reference.py","独立 NumPy 参考"],["benchmark-default.json","默认完整基准"]].flatMap(([file,label],i)=>[i?" · ":"",el("a",{href:"assets/learning/projects/heat-inverse/"+file},label)])]));
    root.replaceChildren(shell);
    function render(){
      const row=current(),m=ledger.modes,e=ledger.estimates;
      given.replaceChildren(el("p",{className:"hi-note"},"已知设定："+labels[state.scenario]+"，测试轨迹 "+state.index+"；假设 κ=0.01 m²/s，模拟实际 κ="+row.true_kappa_m2_per_s+" m²/s。负温差表示比浴温冷。"),
        figure("已知数据：t="+state.t+" s 的16个读数",[{key:"given",label:"有噪声测量",values:row.observed_K,points:true}],{description:"这些读数是三种方法的共同输入。初态真值在预测完成后展示。"}),
        table("given","16 个已知测点读数",["测点 j","x / m","y / K"],ledger.sensors.map(r=>[String(r.index),r.x_m,r.observed_K])));
      reveal.disabled=answers.some(v=>v===null)||revealed;result.hidden=!revealed;download.hidden=!revealed;
      feedback.textContent=revealed?"预测核对："+answers.filter((a,i)=>a===questions[i][2]).length+" / 3。高频逆增益更大；正则引入偏差；未来拟合不足以确认初态。":"请先完成三个预测，再查看真值与测试误差。";
      result.replaceChildren();if(!revealed)return;
      const spatial=(key,label,values,color,dash)=>({key,label,values:[0,...values,0],xs:[0,...x,1],color,dash});
      result.append(el("h4",{tabindex:"-1"},"1. 同一个输入，三种重建"),
        figure("初态：真实信号与三种反演",[
          spatial("truth","模拟初态真值",row.initial_K,palette[3],"12 3 2 3"),
          ...methods.map((method,i)=>spatial(method,names[method]+(method==="tikhonov"?"（手动 λ）":""),e[method].initial_K,palette[i],i===1?"8 4":i===2?"2 5":undefined))
        ],{description:"四条曲线共用当前坐标轴，两端强制为零。真值仅在模拟中可知。"}),
        figure("观测时刻与独立晚时刻",[
          {key:"observed",label:"t="+state.t+" s 有噪声读数",values:row.observed_K,points:true,color:palette[0]},
          spatial("fit","手动 Tikhonov 对读数的拟合",e.tikhonov.observed_fit_K,palette[1]),
          {key:"future",label:"t="+(state.t+.5)+" s 新噪声读数",values:row.future_observed_K,points:true,color:palette[3]},
          spatial("prediction","手动 Tikhonov 晚时刻预测",e.tikhonov.future_fit_K,palette[2],"8 4")
        ],{description:"晚时刻读数使用独立噪声，从未参与拟合；此图与初态图的纵轴范围分别计算。"}),
        table("current","当前轨迹的实际误差（K）",["方法","初态 RMSE","观测残差 RMS","晚时刻 RMSE"],methods.map(method=>[names[method]+(method==="tikhonov"?" λ="+state.lambda:""),...Object.values(e[method].metrics)])),
        el("h4",{},"2. 八个模态与条件风险"),
        figure("假设模型中的信号保留比例 gₖsₖ",methods.map((method,i)=>({key:method,label:names[method],values:m.map(r=>r.risk[method].shrinkage),color:palette[i],dash:i===1?"8 4":i===2?"2 5":undefined})),{modes:true,unit:"无量纲",description:"学习权重不受正则收缩区间约束，比例可能超出 [0,1]。模型失配时，对真实信号的比例应使用 gₖsₖᵗʳᵘᵉ；误差账使用真实衰减。"}),
        table("gains","8 个模态的逆向增益（无量纲）",["k","LS 增益 1/sₖ","手动 Tik 增益","学习权重 wₖ","Tik 信号保留比例"],m.map(r=>[String(r.mode),...methods.map(method=>r.risk[method].gain),r.risk.tikhonov.shrinkage])),
        table("modes","8 个模态的投影与反演（温度单位 K）",["k","假设 sₖ","真实 sₖ","真值 aₖ","信号 sₖᵗʳᵘᵉaₖ","投影 bₖ","投影扰动 ηₖ","LS 系数","手动 Tik 系数","学习系数"],m.map((r,k)=>[String(r.mode),r.s,r.true_s,r.truth_K,r.signal_K,r.projected_K,r.projected_noise_K,...methods.map(method=>e[method].coefficients_K[k])])),
        el("p",{},"投影扰动按 bₖ−sₖᵗʳᵘᵉaₖ 计算。有限精度投影也有舍入，因此 σ=0 时仍可能显示极小的非零数；这不是额外的传感器噪声。"),
        figure("手动 Tikhonov：逐模态偏差平方与方差",[
          {key:"bias2",label:"偏差平方",values:m.map(r=>r.risk.tikhonov.bias_squared_K2),color:palette[0]},
          {key:"variance",label:"噪声方差",values:m.map(r=>r.risk.tikhonov.variance_K2),color:palette[1],dash:"8 4"},
          {key:"mse",label:"两者之和：期望平方误差",values:m.map(r=>r.risk.tikhonov.mse_K2),color:palette[3],dash:"2 5"}
        ],{modes:true,unit:"K²",description:"固定当前真实初态和已拟合权重，只平均新的测量噪声。不是当前一次误差的平方，也没有平均训练不确定性。"}),
        el("details",{className:"hi-modal-risk"},[el("summary",{},"展开三种方法全部模态的风险与本次误差"),table("modal-risk","每个模态的条件风险和本次误差",["k / 方法","偏差 / K","偏差平方 / K²","方差 / K²","期望平方误差 / K²","本次系数误差 / K"],m.flatMap(r=>methods.map(method=>{const v=r.risk[method];return[r.mode+" / "+names[method],v.bias_K,v.bias_squared_K2,v.variance_K2,v.mse_K2,v.error_K];})))]),
        table("risk","传感器初态条件风险：8 模态平方和除以 16",["方法","偏差平方 / K²","方差 / K²","期望 MSE / K²","√期望 MSE / K"],methods.map(method=>[names[method],...Object.values(ledger.conditionalRisk[method])])),
        el("p",{className:"hi-note"},"风险公式中的真值只在模拟里可用，不能拿它选择真实实验的参数。零噪声时方差为零，正则偏差或模型失配仍可能存在。"),
        table("projection","观测残差的正交分解（K²）",["方法","模态残差平方","列空间外残差平方","两项之和","16 点残差平方"],methods.map(method=>{const r=ledger.projection.methods[method];return[names[method],r.modal_sse_K2,ledger.projection.orthogonal_sse_K2,r.sum_sse_K2,r.residual_sse_K2];})),
        el("p",{},"两项之和与直接残差在精确算术下相等；数值账可能保留浮点舍入的末位差异。"),
        el("details",{className:"hi-sensors"},[el("summary",{},"展开全部 16 测点：图上的每个值"),table("sensors","完整测点重建账本（温度单位 K）",["j","x / m","真初态","当前读数","晚时刻读数","LS 初态","Tik 初态","学习初态","Tik 当前拟合","Tik 晚时刻预测"],ledger.sensors.map(r=>[String(r.index),r.x_m,r.truth_K,r.observed_K,r.future_observed_K,...methods.map(method=>r.estimates[method].initial_K),r.estimates.tikhonov.observed_fit_K,r.estimates.tikhonov.future_fit_K]))]),
        el("h4",{},"3. 固定方案后再评测"),
        el("p",{},"128 条完整训练轨迹拟合八个权重；32 条验证轨迹选择 λ="+benchmark.fitted.validation_selected_lambda+"。以下 Tikhonov 测试结果使用验证选择值，始终与手动 λ="+state.lambda+" 分开。"),
        table("validation","6 个候选参数：只看验证集",["λ","验证初态 MSE / K²","是否选中"],benchmark.fitted.validation_scores.map(r=>[r.lambda,r.initial_field_mse_K2,r.lambda===benchmark.fitted.validation_selected_lambda?"是":"否"])),
        table("aggregate","三种测试场景：每种 32 条完整轨迹（K）",["场景 / 方法","初态 RMSE","观测残差 RMS","晚时刻 RMSE"],scenarios.flatMap(s=>methods.map(method=>[labels[s]+" / "+names[method],...Object.values(benchmark.metrics[s][method])]))),
        el("details",{className:"hi-test"},[el("summary",{},"展开当前场景全部 32 条测试轨迹的三种方法"),table("test","冻结参数后逐条测试（K）",["轨迹 / 方法","初态 RMSE","观测残差 RMS","晚时刻 RMSE"],benchmark.splits.test[state.scenario].flatMap(r=>methods.map(method=>[r.index+" / "+names[method],...Object.values(r.estimators[method].metrics)])))]),
        el("p",{className:"hi-note"},"总体指标先汇总所有轨迹和传感器的平方误差，再开根；不平均逐条 RMSE。平滑训练分布中的排序不保证在高频增强或扩散率失配时保持。")
      );
    }
    rebuild();render();
  }

  return {Q,x,attenuation,field,project,forward,generate,fitLearned,selectLambda,reconstruct,metrics,buildBenchmark,trajectoryLedger,drawHeatChart,mount};
});
