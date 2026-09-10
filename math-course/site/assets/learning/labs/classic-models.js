(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("classic-models", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("classic-models self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("classic-models self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-classic-models-styles";
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if(value===null||typeof value!=="number"||Number.isNaN(value))return "—";
    if(!Number.isFinite(value))return "超出浮点范围";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    var text=value.toFixed(places);return text.indexOf(".")<0?text:text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function finite(value,min,max,name){
    if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError(name+" outside supported domain");
    return value;
  }
  function logisticValue(time,rate,capacity,initial){
    finite(time,0,80,"time");finite(rate,0,1.2,"growth rate");finite(capacity,1,1000000,"capacity");finite(initial,0,1000000,"initial count");
    if(time===0||rate===0||initial===0||initial===capacity)return initial;
    var q=Math.exp(-rate*time);
    return initial/(q+(initial/capacity)*(-Math.expm1(-rate*time)));
  }
  function samplePath(points,mapX,mapY,key){
    return points.map(function(p,i){return(i?"L":"M")+mapX(p.t)+" "+mapY(p[key]);}).join(" ");
  }
  function growthPoints(rate,capacity,initial,horizon){
    finite(horizon,0,80,"horizon");var points=[];
    for(var j=0;j<=160;j++){var t=horizon*j/160;points.push({t:t,n:logisticValue(t,rate,capacity,initial)});}
    return points;
  }
  function sirParameters(beta,gamma,initial,horizon,removed){
    finite(beta,.1,1.5,"contact rate");finite(gamma,.05,.8,"removal rate");finite(initial,0,.2,"initial infection");
    finite(removed,0,.8,"initial removed fraction");finite(horizon,0,80,"horizon");
    if(initial+removed>1)throw new RangeError("initial fractions exceed one");
    return {s:1-(initial+removed),i:initial,r:removed};
  }
  function sirPoints(beta,gamma,initial,horizon,removed,maxStep){
    removed=removed===undefined?0:removed;maxStep=maxStep===undefined?.01:maxStep;
    var start=sirParameters(beta,gamma,initial,horizon,removed);finite(maxStep,.0025,.05,"RK4 step bound");
    var state=[start.s,start.i,start.r],points=[{t:0,s:state[0],i:state[1],r:state[2]}];
    if(horizon===0)return points;
    function derivative(v){var infection=beta*v[0]*v[1],removal=gamma*v[1];return[-infection,infection-removal,removal];}
    function add(v,k,h){return v.map(function(x,j){return x+h*k[j];});}
    var segments=Math.ceil(horizon/.2);
    for(var j=1;j<=segments;j++){
      var left=horizon*(j-1)/segments,right=horizon*j/segments,steps=Math.ceil((right-left)/maxStep),h=(right-left)/steps;
      for(var k=0;k<steps;k++){
        var k1=derivative(state),k2=derivative(add(state,k1,h/2)),k3=derivative(add(state,k2,h/2)),k4=derivative(add(state,k3,h));
        state=state.map(function(x,q){return x+h*(k1[q]+2*k2[q]+2*k3[q]+k4[q])/6;});
        if(state.some(function(x){return !Number.isFinite(x)||x<0||x>1+1e-12;}))throw new Error("SIR numerical state left the simplex; no clipping applied");
      }
      points.push({t:right,s:state[0],i:state[1],r:state[2]});
    }
    return points;
  }
  function sirFinalSize(beta,gamma,initial,removed){
    removed=removed===undefined?0:removed;var state=sirParameters(beta,gamma,initial,0,removed),s=state.s,R0=beta/gamma;
    if(s===0)return {s:0,r:1,logRatio:null,residual:null};
    if(initial===0)return {s:s,r:removed,logRatio:0,residual:0};
    var lo=-R0*(s+initial),hi=0,mid;
    for(var j=0;j<1100;j++){
      mid=(lo+hi)/2;
      if(mid===lo||mid===hi)break;
      var value=mid+R0*(initial-s*Math.expm1(mid));
      if(value>0)hi=mid;else lo=mid;
    }
    mid=(lo+hi)/2;var end=s*Math.exp(mid);
    return {s:end,r:removed+initial-s*Math.expm1(mid),logRatio:mid,residual:mid+R0*(initial-s*Math.expm1(mid))};
  }
  function sirAnalyze(beta,gamma,initial,horizon,removed){
    removed=removed===undefined?0:removed;var start=sirParameters(beta,gamma,initial,horizon,removed);
    var points=sirPoints(beta,gamma,initial,horizon,removed,.01),fine=sirPoints(beta,gamma,initial,horizon,removed,.005);
    var drift=0,refinement=0,invariantDrift=start.s>0?0:null,H0=start.s>0?start.s+start.i-gamma/beta*Math.log(start.s):null,peak=points[0];
    points.forEach(function(p,j){
      drift=Math.max(drift,Math.abs(p.s+p.i+p.r-1));
      ["s","i","r"].forEach(function(key){refinement=Math.max(refinement,Math.abs(p[key]-fine[j][key]));});
      if(invariantDrift!==null)invariantDrift=Math.max(invariantDrift,Math.abs(p.s+p.i-gamma/beta*Math.log(p.s)-H0));
      if(p.i>peak.i)peak=p;
    });
    var product=beta*start.s,split=134217729;
    var abig=split*beta,ahi=abig-(abig-beta),alo=beta-ahi;
    var bbig=split*start.s,bhi=bbig-(bbig-start.s),blo=start.s-bhi;
    var productError=((ahi*bhi-product)+ahi*blo+alo*bhi)+alo*blo;
    var R0=beta/gamma,Re=R0*start.s,growing=initial>0&&(product>gamma||(product===gamma&&productError>0));
    var analyticPeak=growing?initial+start.s-1/R0-Math.log(Re)/R0:initial;
    return {points:points,start:start,R0:R0,Re:Re,initialGrowth:initial===0?"absent":growing?"outbreak":"fade",peak:peak,
      analyticPeak:analyticPeak,drift:drift,invariantDrift:invariantDrift,refinement:refinement,finalSize:sirFinalSize(beta,gamma,initial,removed)};
  }
  function queueMetrics(arrival,service){
    finite(arrival,0,Number.MAX_VALUE,"arrival rate");finite(service,Number.MIN_VALUE,Number.MAX_VALUE,"service rate");
    var rho=arrival/service,stable=arrival<service;
    if(!stable)return {rho:rho,stable:false,L:null,W:null,Lq:null,Wq:null,flowError:null};
    var gap=service-arrival,L=arrival/gap,W=1/gap,Lq=rho*L,Wq=arrival===0?0:rho/gap;
    var flow=arrival===0?0:Number.isFinite(W)?Math.abs(L-arrival*W):null;
    return {rho:rho,stable:true,L:L,W:W,Lq:Lq,Wq:Wq,flowError:flow};
  }
  function queueCurve(current){
    var values=[];for(var j=0;j<=98;j++)values.push(j/100);
    if(current!==undefined&&current>=0&&current<1)values.push(current);
    return values.sort(function(a,b){return a-b;}).filter(function(v,i,a){return i===0||v!==a[i-1];}).map(function(rho){return {t:rho,l:rho/(1-rho)};});
  }

  function plotText(x,y,value,attrs){return '<text x="'+x+'" y="'+y+'" '+(attrs||"")+'>'+escapeHtml(value)+'</text>';}
  function plotLine(x1,y1,x2,y2,cls,extra){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+cls+'" '+(extra||"")+'/>';}
  function axes(xmax,ymax,xLabel,yLabel){
    var s=plotLine(80,80,80,325,"cml-axis")+plotLine(80,325,810,325,"cml-axis");
    for(var j=0;j<=4;j++){
      var y=ymax*j/4;s+=plotLine(80,325-245*j/4,810,325-245*j/4,"cml-gridline")+plotText(70,329-245*j/4,format(y),'text-anchor="end"');
      if(xmax>0)s+=plotText(80+730*j/4,350,format(xmax*j/4),'text-anchor="middle"');
    }
    return s+plotText(810,397,xLabel,'text-anchor="end"')+plotText(28,67,yLabel);
  }
  function renderGrowthSvg(params){
    var points=growthPoints(params.rate,params.capacity,params.initial,params.horizon),maxY=Math.max(params.capacity,params.initial)*1.12;
    function X(t){return 80+(params.horizon===0?0:730*t/params.horizon);}function Y(n){return 325-245*n/maxY;}
    var s=plotText(80,27,"蓝：Logistic 轨迹；金虚线：容量 K；红点：初值")+
      plotText(80,51,"零初值保持零；零增长率保持初值；高于 K 的正初值会下降")+
      axes(params.horizon,maxY,"时间 t（日）","人数 N")+plotLine(80,Y(params.capacity),810,Y(params.capacity),"cml-capacity");
    s+='<path class="cml-growth" data-series="growth" d="'+samplePath(points,X,Y,"n")+'"/><circle class="cml-infection" cx="'+X(0)+'" cy="'+Y(params.initial)+'" r="5"/>';
    return '<svg viewBox="0 0 900 420" data-max-y="'+maxY+'" data-horizon="'+params.horizon+'" role="img" aria-label="Logistic 初值与容量边界">'+s+'</svg>';
  }
  function renderSirSvg(points){
    var end=points[points.length-1].t;
    function X(t){return 80+(end===0?0:730*t/end);}function Y(y){return 325-245*y;}
    var s=plotText(80,27,"蓝实线：易感 s；红长虚线：感染 i；绿点线：移出 r")+
      plotText(80,51,"RK4 数值轨迹；同时查看第一积分漂移和步长减半差")+
      axes(end,1,"时间 t（日）","比例");
    ["s","i","r"].forEach(function(key){
      s+='<path class="cml-sir-'+key+'" data-series="'+key+'" d="'+samplePath(points,X,Y,key)+'"/>';
    });
    return '<svg viewBox="0 0 900 420" data-horizon="'+end+'" role="img" aria-label="SIR 三种人群比例与时间">'+s+'</svg>';
  }
  function renderQueueSvg(arrival,service){
    finite(arrival,0,1.4,"chart arrival rate");finite(service,.5,1.5,"chart service rate");
    var m=queueMetrics(arrival,service),points=queueCurve(m.stable?m.rho:undefined);
    if(m.stable)points=points.map(function(p){return p.t===m.rho?{t:p.t,l:m.L}:p;});
    var maxY=Math.max.apply(null,points.map(function(p){return p.l;}).concat(m.stable?[m.L]:[]))*1.12,maxX=Math.max(1.1,m.rho*1.1);
    function X(rho){return 80+730*rho/maxX;}function Y(L){return 325-245*L/maxY;}
    var s=plotText(80,27,"蓝：稳态系统人数 L（含服务中顾客）；ρ≥1 区域没有平稳分布")+
      plotText(80,51,"红色标记表示当前负荷；只有 ρ<1 时才有对应的稳态均值")+
      '<rect class="cml-invalid-domain" x="'+X(1)+'" y="80" width="'+(810-X(1))+'" height="245"/>'+
      axes(maxX,maxY,"负荷比 ρ = λ/μ","人数 L")+
      '<path class="cml-growth" data-series="queue" d="'+samplePath(points,X,Y,"l")+'"/>'+
      plotLine(X(1),80,X(1),325,"cml-capacity");
    if(m.stable)s+='<circle class="cml-infection" data-rho="'+m.rho+'" cx="'+X(m.rho)+'" cy="'+Y(m.L)+'" r="5"/>';
    else s+=plotLine(X(m.rho),80,X(m.rho),325,"cml-overload",'data-rho="'+m.rho+'"');
    s+=plotText(80,378,"当前 ρ="+format(m.rho)+"；"+(m.stable?"存在平稳分布":"不存在平稳分布，稳态 L/W 未定义"));
    return '<svg viewBox="0 0 900 420" data-max-x="'+maxX+'" data-max-y="'+maxY+'" role="img" aria-label="M/M/1 稳态适用范围和实际负荷">'+s+'</svg>';
  }

  var PRESETS={
    growth:[
      {label:"低于容量",values:{rate:.35,capacity:600,initial:80,horizon:10}},
      {label:"高于容量",values:{rate:.35,capacity:600,initial:1200,horizon:10}},
      {label:"零初值",values:{rate:.35,capacity:600,initial:0,horizon:10}},
      {label:"零增长率",values:{rate:0,capacity:600,initial:80,horizon:10}}],
    sir:[
      {label:"初期增长",values:{beta:.6,gamma:.2,initial:.02,removed:0,horizon:40}},
      {label:"已有移出人群",values:{beta:.6,gamma:.2,initial:.02,removed:.7,horizon:40}},
      {label:"没有初始感染",values:{beta:.6,gamma:.2,initial:0,removed:0,horizon:40}},
      {label:"恰在初始阈值",values:{beta:1,gamma:.5,initial:.2,removed:.3,horizon:40}}],
    queue:[
      {label:"稳定负荷",values:{arrival:.8,service:1}},
      {label:"临界负荷",values:{arrival:1,service:1}},
      {label:"超载",values:{arrival:1.4,service:1}},
      {label:"零到达",values:{arrival:0,service:1}}]
  };
  Object.keys(PRESETS).forEach(function(k){PRESETS[k].forEach(function(p){Object.freeze(p.values);Object.freeze(p);});Object.freeze(PRESETS[k]);});Object.freeze(PRESETS);
  var OPTIONS={growth:[["increase","上升趋向 K"],["decrease","下降趋向 K"],["zero","保持零"],["constant","保持当前常数"]],
    sir:[["outbreak","感染初期增长"],["fade","感染不出现增长期"],["absent","无初始感染，始终为零"]],
    queue:[["stable","存在平稳分布"],["unstable","不存在平稳分布"]]},SERIAL=0;
  function ensureStyles(){
    if(!host||host.document.getElementById(STYLE_ID))return;
    var el=host.document.createElement("style");el.id=STYLE_ID;
    el.textContent='.cml-lab{min-width:0;max-width:100%;color:var(--fg);line-height:1.65}.cml-lab *{box-sizing:border-box}.cml-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cml-panel{display:contents}.cml-lab [hidden]{display:none!important}.cml-lab label{display:grid;gap:6px}.cml-lab input,.cml-lab select,.cml-lab button{font:inherit;min-height:44px;max-width:100%;color:inherit}.cml-lab input{width:100%;margin:0}.cml-lab select{padding:8px;width:100%;background:var(--bg)}.cml-lab button{border:1px solid var(--border);background:var(--bg);padding:8px 14px;border-radius:7px;cursor:pointer}.cml-lab button:disabled{opacity:.5;cursor:default}.cml-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.cml-actions,.cml-presets{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.cml-scroll{max-width:100%;overflow-x:auto;margin:15px 0}.cml-scroll svg{display:block;width:900px;min-width:900px;max-width:none;height:auto;background:var(--bg);color:var(--fg)}.cml-scroll svg text{fill:currentColor;font:14px Arial,sans-serif}.cml-scroll table{display:table!important;overflow:visible!important;width:900px;min-width:900px;max-width:none;border-collapse:collapse}.cml-scroll th,.cml-scroll td{padding:10px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}.cml-axis{stroke:var(--fg-soft);stroke-width:1.5}.cml-gridline{stroke:var(--border)}.cml-growth,.cml-sir-s{stroke:var(--accent);fill:none;stroke-width:2.5}.cml-sir-i{stroke:#bc5146;fill:none;stroke-width:2.5;stroke-dasharray:8 4}.cml-sir-r{stroke:#478759;fill:none;stroke-width:2.5;stroke-dasharray:2 4}.cml-infection{fill:#bc5146}.cml-capacity{stroke:#a97924;stroke-width:1.5;stroke-dasharray:6 4}.cml-overload{stroke:#bc5146;stroke-width:2;stroke-dasharray:5 4}.cml-invalid-domain{fill:#bc5146;opacity:.1}.cml-note{border-left:4px solid #b58224;padding:8px 12px;background:var(--bg-soft)}.cml-lab :focus-visible{outline:3px solid var(--accent);outline-offset:3px}@media(max-width:600px){.cml-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){html:has(.cml-lab){scroll-behavior:auto}}';
    host.document.head.appendChild(el);
  }
  function mount(root){
    ensureStyles();var id="cml-"+(++SERIAL);
    var fields={growth:[["rate","增长率 r（每日）",0,1.2,.05,.35],["capacity","容量 K（人）",300,1000,10,600],["initial","初值 N₀（人）",0,1500,10,80],["horizon","增长观察时长（日）",0,20,1,10]],
      sir:[["beta","接触率 β（每日）",.1,1.5,.025,.6],["gamma","移出率 γ（每日）",.05,.8,.05,.2],["initial","初始感染 i₀",0,.2,.01,.02],["removed","初始移出 r₀",0,.8,.05,0],["horizon","SIR 观察时长（日）",0,80,5,40]],
      queue:[["arrival","到达率 λ（每小时）",0,1.4,.05,.8],["service","服务率 μ（每小时）",.5,1.5,.05,1]]};
    var html='<div class="cml-lab"><label for="'+id+'-model">模型</label><select id="'+id+'-model" data-role="model"><option value="growth">增长：Logistic</option><option value="sir">传染：SIR</option><option value="queue">排队：M/M/1</option></select><div class="cml-presets" aria-label="边界预设"></div><div class="cml-controls">';
    Object.keys(fields).forEach(function(kind){html+='<div class="cml-panel" data-panel="'+kind+'">';
      fields[kind].forEach(function(f){var name=kind+"-"+f[0],controlId=id+"-"+name;html+='<label for="'+controlId+'">'+f[1]+' <output for="'+controlId+'" data-output="'+name+'">'+f[5]+'</output></label><input id="'+controlId+'" aria-label="'+f[1]+'" data-role="'+name+'" type="range" min="'+f[2]+'" max="'+f[3]+'" step="'+f[4]+'" value="'+f[5]+'">';});html+='</div>';});
    html+='</div><p>先判断当前配置的行为，再提交。参数改变后显示新的行为与账本；重新选择判断会隐藏结果。</p><label for="'+id+'-prediction">行为判断</label><select id="'+id+'-prediction" data-role="prediction"></select><div class="cml-actions"><button data-role="reveal" disabled>揭示模型</button><button data-role="reset">重置</button></div><p class="cml-feedback" aria-live="polite"></p><section class="cml-result" data-role="result" tabindex="-1" aria-label="经典模型结果" hidden></section></div>';root.innerHTML=html;
    var model=root.querySelector('[data-role="model"]'),prediction=root.querySelector('[data-role="prediction"]'),result=root.querySelector('[data-role="result"]'),reveal=root.querySelector('[data-role="reveal"]'),feedback=root.querySelector('.cml-feedback'),presetHost=root.querySelector('.cml-presets');
    function parameters(){var p={};fields[model.value].forEach(function(f){p[f[0]]=Number(root.querySelector('[data-role="'+model.value+'-'+f[0]+'"]').value);});return p;}
    function region(s,name){return '<div class="cml-scroll" role="region" tabindex="0" aria-label="'+name+'，可横向滚动">'+s+'</div>';}
    function row(a,b){return '<tr><th scope="row">'+a+'</th><td>'+b+'</td></tr>';}
    function setup(){
      prediction.innerHTML='<option value="">请选择</option>'+OPTIONS[model.value].map(function(o){return'<option value="'+o[0]+'">'+o[1]+'</option>';}).join('');
      root.querySelectorAll('[data-panel]').forEach(function(p){p.hidden=p.getAttribute('data-panel')!==model.value;});
      presetHost.replaceChildren();PRESETS[model.value].forEach(function(preset,j){
        var btn=root.ownerDocument.createElement('button');btn.type='button';btn.textContent=preset.label;btn.dataset.preset=String(j);
        btn.addEventListener('click',function(){Object.keys(preset.values).forEach(function(k){root.querySelector('[data-role="'+model.value+'-'+k+'"]').value=String(preset.values[k]);});render();});
        presetHost.appendChild(btn);
      });
    }
    function render(){
      root.querySelectorAll('input[data-role]').forEach(function(input){root.querySelector('[data-output="'+input.dataset.role+'"]').textContent=input.value;});
      var p=parameters();presetHost.querySelectorAll('button').forEach(function(b,j){b.setAttribute('aria-pressed',String(Object.keys(PRESETS[model.value][j].values).every(function(k){return PRESETS[model.value][j].values[k]===p[k];})));});
      reveal.disabled=!prediction.value||!result.hidden;if(result.hidden)return;
      var expected,chart,rows='',note,extra='';
      if(model.value==='growth'){
        var end=logisticValue(p.horizon,p.rate,p.capacity,p.initial);
        expected=p.initial===0?'zero':p.rate===0||p.initial===p.capacity?'constant':p.initial<p.capacity?'increase':'decrease';
        chart=renderGrowthSvg(p);
        rows+=row("当前初值 / 容量",format(p.initial)+" / "+format(p.capacity)+" 人")+row("观察终值 N(T)",format(end)+" 人；T="+p.horizon+" 日");
        rows+=row("不变区间","N(t) 位于初值与平衡值之间；正增长时正初值趋向 K，零初值始终零。");
        rows+=row("极限与观察终值","r=0 时保持 N₀；r>0 且 N₀>0 时极限为 K。有限 T 的终值不是极限。");
        note="固定容量的确定性模型；高于容量会下降，零初值不会凭空增长。容量是否可从数据估计，需要独立的校准与识别分析。";
      }else if(model.value==='sir'){
        var a=sirAnalyze(p.beta,p.gamma,p.initial,p.horizon,p.removed),last=a.points[a.points.length-1];expected=a.initialGrowth;chart=renderSirSvg(a.points);
        rows+=row("阈值","R₀="+format(a.R0)+"；Rₑ(0)=R₀s₀="+format(a.Re)+"。接近阈值时不以已舍入读数判等；i₀=0 时无感染。");
        rows+=row("观察窗内网格峰值","i="+format(a.peak.i,6)+"，t="+format(a.peak.t)+" 日；仅在已绘制网格中取最大值");
        rows+=row("全时段解析峰高",format(a.analyticPeak,6)+"；达到时间不由本账本直接求出");
        rows+=row("观察终值","s="+format(last.s,6)+"；i="+format(last.i,6)+"；r="+format(last.r,6));
        rows+=row("最终规模关系","s∞="+format(a.finalSize.s,6)+"；r∞="+format(a.finalSize.r,6)+"；并非把当前观察终值当作无穷时极限");
        rows+=row("人口和第一积分","输出点 max|s+i+r−1|="+format(a.drift)+"；max|H−H₀|="+format(a.invariantDrift)+"（s₀=0 时 H 不适用）");
        rows+=row("步长减半比较","RK4 步长上限 .01 / .005 日；相同输出网格最大分量差 "+format(a.refinement)+"。没有截断负值或归一化。");
        note="人口守恒不能单独证明轨迹准确；第一积分和两种步长的比较是诊断，不是严格误差上界。无感染初值保持不变；充分混合、固定参数和封闭人群是本模型的条件。";
      }else{
        var q=queueMetrics(p.arrival,p.service);expected=q.stable?'stable':'unstable';chart=renderQueueSvg(p.arrival,p.service);
        rows+=row("负荷比 ρ",format(q.rho)+(q.stable?"；平稳忙碌概率为 ρ":"；此时不能把 ρ>1 当作忙碌概率"));
        rows+=row("系统内人数 L",format(q.L)+" 人（包括服务中的顾客）")+row("纯排队人数 Lq",format(q.Lq)+" 人（不包括服务中）");
        rows+=row("总逗留 W",format(q.W)+" 小时（等待 + 服务）")+row("纯等待 Wq",format(q.Wq)+" 小时（服务开始前）");
        rows+=row("Little 数值对账","|L−λW|="+format(q.flowError)+"；λ=0 时用 L=0，W 表示假想新顾客的极限口径");
        if(q.stable){
          var cells='',p0=(p.service-p.arrival)/p.service;
          for(var k=0;k<=10;k++)cells+=row(String(k),format(p0*Math.pow(q.rho,k),7));
          cells+=row("n ≥ 11",format(Math.pow(q.rho,11),7)+"（完整理论尾，不作重归一化）");
          extra=region('<table><caption>平稳系统人数分布 πn；包含服务中顾客</caption><thead><tr><th>系统人数</th><th>概率</th></tr></thead><tbody>'+cells+'</tbody></table>',"队列平稳分布");
        }
        note=q.stable?"Poisson 到达、独立指数服务、单服务台、无限等待空间。平均服务时长为 1/μ；零到达下没有实际顾客样本，W 是单个假想到达者的口径。":"λ≥μ 时不存在可归一化的平稳分布，稳态 L、W 未定义；有限初始人数下，有限时刻的系统人数仍几乎必然有限。";
      }
      var label=OPTIONS[model.value].find(function(o){return o[0]===expected;})[1];feedback.textContent=(prediction.value===expected?"判断与当前配置一致：":"请对照当前配置修正判断：")+label;
      result.innerHTML='<h4>'+label+'</h4>'+region(chart,"经典模型图")+region('<table><caption>模型条件与数值账本</caption><tbody>'+rows+'</tbody></table>',"经典模型账本")+extra+'<p class="cml-note">'+note+' 图和账本可聚焦后用左右方向键滚动。</p>';
    }
    model.addEventListener('change',function(){result.hidden=true;result.innerHTML='';feedback.textContent='';setup();render();});
    prediction.addEventListener('change',function(){result.hidden=true;feedback.textContent='判断已记录，提交后显示结果。';render();});
    reveal.addEventListener('click',function(){if(!prediction.value)return;result.hidden=false;render();result.focus({preventScroll:true});});
    root.querySelector('[data-role="reset"]').addEventListener('click',function(){
      Object.keys(fields).forEach(function(kind){fields[kind].forEach(function(f){root.querySelector('[data-role="'+kind+'-'+f[0]+'"]').value=String(f[5]);});});
      model.value='growth';result.hidden=true;result.innerHTML='';feedback.textContent='已重置，结果隐藏。';setup();render();prediction.focus({preventScroll:true});
    });
    root.querySelectorAll('input[data-role]').forEach(function(input){input.addEventListener('input',render);input.addEventListener('change',render);});
    setup();render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(near(logisticValue(0, 0.35, 600, 80), 80), "logistic initial condition");
    check(logisticValue(20, 0.35, 600, 80) < 600, "logistic capacity boundary");
    check(growthPoints(0.35, 600, 80, 10).every(function (point) { return isFinite(point.t) && isFinite(point.n); }), "finite growth trace");
    var outbreak = sirPoints(0.6, 0.2, 0.02, 20);
    check(outbreak.every(function (point) { return near(point.s + point.i + point.r, 1, 1e-9); }), "SIR conservation");
    check(outbreak.some(function (point) { return point.i > 0.02; }), "SIR outbreak threshold");
    var stable = queueMetrics(0.8, 1);
    check(stable.stable && near(stable.L, 4) && near(stable.W, 5), "M/M/1 stable metrics");
    check(near(stable.flowError, 0), "Little flow conservation");
    check(!queueMetrics(1.1, 1).stable && queueMetrics(1.1, 1).W===null, "M/M/1 unstable boundary");
    var invalidQueue = false;
    try { queueMetrics(NaN, 1); } catch (error) { invalidQueue = error instanceof RangeError; }
    check(invalidQueue, "M/M/1 nonfinite input rejected");
    invalidQueue = false;
    try { queueMetrics(0.5, 0); } catch (error) { invalidQueue = error instanceof RangeError; }
    check(invalidQueue, "M/M/1 nonpositive service rejected");
    check(!near(logisticValue(10, 0.2, 400, 80), logisticValue(10, 0.2, 800, 80)), "capacity changes trajectory");
    check(logisticValue(10,.35,600,0)===0,"zero population stays zero");
    check(logisticValue(10,0,600,80)===80,"zero growth stays constant");
    check(logisticValue(10,.35,600,1200)>600&&logisticValue(10,.35,600,1200)<1200,"above capacity decreases");
    check(sirAnalyze(.6,.2,0,40,0).initialGrowth==="absent","no infection seed");
    check(sirAnalyze(1,.5,.2,40,.3).initialGrowth==="fade","exact initial threshold");
    check(sirAnalyze(.625,.5,.2,0,0).initialGrowth==="outbreak","binary input product retains its rounding residual");
    check(sirAnalyze(.6,.2,.02,40,.7).initialGrowth==="fade","initial removed population changes threshold");
    check(sirFinalSize(.6,.2,.2,.8).logRatio===null,"zero susceptible excludes logarithm");
    check(sirFinalSize(.1,.8,1e-20,0).r>1e-20,"small final removed fraction avoids one-minus cancellation");
    check(sirFinalSize(.1,.8,0,Number.MIN_VALUE).r===Number.MIN_VALUE,"initial removed fraction retained");
    var zero=queueMetrics(0,1);
    check(zero.L===0&&zero.Lq===0&&zero.Wq===0&&zero.W===1,"zero arrival convention");
    check(Math.abs(stable.Lq-3.2)<1e-12&&Math.abs(stable.Wq-4)<1e-12,"queue excludes service");
    check(queueMetrics(1,1).L===null,"critical queue has no stationary mean");
    check(format(120,0)==="120"&&format(null)==="—","format integer and undefined state");
    Object.keys(PRESETS).forEach(function(kind){check(PRESETS[kind].length===4,"four meaningful presets per model");});
    return { checks: checks, presets: 12 };
  }

  return {
    mount: mount,
    PRESETS: PRESETS,
    renderGrowthSvg: renderGrowthSvg,
    renderSirSvg: renderSirSvg,
    renderQueueSvg: renderQueueSvg,
    format: format,
    growthPoints: growthPoints,
    sirAnalyze: sirAnalyze,
    sirFinalSize: sirFinalSize,
    queueCurve: queueCurve,
    logisticValue: logisticValue,
    sirPoints: sirPoints,
    queueMetrics: queueMetrics,
    selfTest: selfTest
  };
});
