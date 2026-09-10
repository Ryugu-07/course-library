(function(root,factory){
  "use strict";var api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root&&root.CourseLearning)root.CourseLearning.register("modeling-workflow",api.mount);
  if(typeof module==="object"&&module.exports&&require.main===module)console.log("modeling-workflow self-test: PASS",api.selfTest());
})(typeof window!=="undefined"?window:null,function(host){
  "use strict";
  var DATA=Object.freeze([120,148,182,220,260,302,345,381,410,430]);
  var DEFAULTS=Object.freeze({kind:"logistic",n:5,horizon:8,sensitivity:1.1,search:4}),serial=0;
  function number(v,min,max,name,integer){
    if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw new RangeError(name+" outside supported domain");
    return v;
  }
  function count(n){return number(n,3,8,"training count",true);}
  function time(t){return number(t,0,23,"prediction time");}
  function searchLimit(s){if(s!==4&&s!==12)throw new RangeError("capacity range must be 4 or 12");return s;}
  function format(v,d){
    if(v===null||v===undefined)return "—";
    if(typeof v!=="number"||Number.isNaN(v))return "—";
    if(!Number.isFinite(v))return "超出浮点范围";
    if(v===0)return "0";
    d=d===undefined?3:d;
    if(Math.abs(v)<.001||Math.abs(v)>=10000)return v.toExponential(4);
    var s=v.toFixed(d);return s.indexOf(".")<0?s:s.replace(/0+$/,"").replace(/\.$/,"");
  }
  function linearFit(values){
    var n=values.length,xbar=(n-1)/2,ybar=values.reduce(function(a,b){return a+b;},0)/n,sxx=0,sxy=0;
    values.forEach(function(y,i){sxx+=(i-xbar)*(i-xbar);sxy+=(i-xbar)*(y-ybar);});
    return {slope:sxy/sxx,intercept:ybar-sxy/sxx*xbar};
  }
  function error(values,predict){return values.reduce(function(s,y,i){var e=y-predict(i);return s+e*e;},0);}
  function fitExponential(n){
    count(n);var values=DATA.slice(0,n),line=linearFit(values.map(Math.log)),A=Math.exp(line.intercept),growth=line.slope;
    var predict=function(t){time(t);return A*Math.exp(growth*t);};
    return Object.freeze({kind:"exponential",count:n,A:A,growth:growth,predict:predict,sse:error(values,predict),initial:A});
  }
  function logisticCandidate(n,K){
    count(n);number(K,DATA[n-1]*1.02,DATA[n-1]*12+400,"capacity");
    var values=DATA.slice(0,n),line=linearFit(values.map(function(y){return Math.log(K/y-1);})),rate=-line.slope,C=Math.exp(line.intercept);
    var predict=function(t){time(t);return K/(1+C*Math.exp(-rate*t));};
    return Object.freeze({K:K,C:C,rate:rate,predict:predict,sse:error(values,predict),initial:predict(0)});
  }
  function fitLogistic(n,search){
    count(n);search=search===undefined?4:searchLimit(search);
    var minK=DATA[n-1]*1.02,maxK=Math.max(DATA[n-1]*search,DATA[n-1]+400),profile=[],best=null,bestIndex=-1;
    for(var j=0;j<=360;j++){
      var candidate=logisticCandidate(n,minK+(maxK-minK)*j/360);
      profile.push(Object.freeze({K:candidate.K,sse:candidate.sse,rmse:Math.sqrt(candidate.sse/n)}));
      if(best===null||candidate.sse<best.sse){best=candidate;bestIndex=j;}
    }
    return Object.freeze({kind:"logistic",count:n,K:best.K,C:best.C,rate:best.rate,predict:best.predict,sse:best.sse,initial:best.initial,
      minK:minK,maxK:maxK,search:search,bestIndex:bestIndex,boundary:bestIndex===0||bestIndex===360,profile:Object.freeze(profile)});
  }
  function fitModel(kind,n,search){
    if(kind!=="logistic"&&kind!=="exponential")throw new RangeError("unknown model");
    return kind==="logistic"?fitLogistic(n,search):fitExponential(n);
  }
  function sensitivityModel(model,factor){
    number(factor,.8,1.2,"sensitivity");
    if(!model||typeof model.predict!=="function")throw new TypeError("fitted model required");
    if(model.kind==="logistic"){
      var K=model.K*factor,N0=model.initial,r=model.rate;
      number(K,Number.MIN_VALUE,20000,"capacity");number(N0,Number.MIN_VALUE,K,"initial count");number(r,0,10,"growth");
      var C=K/N0-1;
      return {predict:function(t){time(t);return K/(1+C*Math.exp(-r*t));},label:"K × "+format(factor),initial:N0,K:K,rate:r};
    }
    if(model.kind!=="exponential")throw new RangeError("unknown model");
    number(model.A,Number.MIN_VALUE,20000,"initial count");number(model.growth,0,10,"growth");
    return {predict:function(t){time(t);return model.A*Math.exp(model.growth*factor*t);},label:"r × "+format(factor),initial:model.A};
  }
  function compute(config){
    if(!config||typeof config!=="object")throw new TypeError("configuration required");
    var n=count(config.n),h=number(config.horizon,2,14,"horizon",true),f=number(config.sensitivity,.8,1.2,"sensitivity"),search=searchLimit(config.search);
    var model=fitModel(config.kind,n,search),futureTime=9+h,rows=DATA.map(function(y,t){var fit=model.predict(t);return {time:t,actual:y,predicted:fit,residual:y-fit,training:t<n};});
    var holdoutSse=rows.slice(n).reduce(function(s,r){return s+r.residual*r.residual;},0),loFactor=Math.min(f,2-f),hiFactor=Math.max(f,2-f);
    var lower=sensitivityModel(model,loFactor),upper=sensitivityModel(model,hiFactor);
    return {model:model,rows:rows,n:n,horizon:h,futureTime:futureTime,future:model.predict(futureTime),trainingRmse:Math.sqrt(model.sse/n),
      validationRmse:Math.sqrt(holdoutSse/(10-n)),holdoutSse:holdoutSse,lower:lower,upper:upper,
      low:lower.predict(futureTime),high:upper.predict(futureTime),lowFactor:loFactor,highFactor:hiFactor,sensitivity:f};
  }
  function text(x,y,s,attrs){return '<text x="'+x+'" y="'+y+'" '+(attrs||"")+'>'+s+'</text>';}
  function line(x1,y1,x2,y2,cls){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+cls+'"/>';}
  function path(points,cls,extra){return '<path class="'+cls+'" '+(extra||"")+' d="'+points.map(function(p,i){return(i?"L":"M")+p[0]+" "+p[1];}).join(" ")+'"/>';}
  function svg(body,w,h,label,extra){return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+label+'" '+(extra||"")+'>'+body+'</svg>';}
  function renderSvg(r){
    var end=r.futureTime,maxY=Math.max.apply(null,DATA.concat([r.future,r.low,r.high]))*1.12;
    function X(t){return 80+730*t/end;}function Y(y){return 315-245*y/maxY;}
    var s=text(80,28,"绿点：训练；金点：留出；蓝线：拟合；虚线：参数扰动")+text(80,51,"数据时刻为 t=0,…,9；t>9 是未观测未来，虚线不是置信区间");
    for(var j=0;j<=4;j++){var y=maxY*j/4;s+=line(80,Y(y),810,Y(y),"mwf-gridline")+text(70,Y(y)+4,format(y), 'text-anchor="end"');}
    for(var t=0;t<=end;t++){if(t%3===0||t===end)s+=text(X(t),337,String(t),'text-anchor="middle"');}
    s+=line(80,70,80,315,"mwf-axis")+line(80,315,810,315,"mwf-axis");
    [[r.lower.predict,"mwf-sensitivity","lower"],[r.upper.predict,"mwf-sensitivity","upper"],[r.model.predict,"mwf-fit","fit"]].forEach(function(a){
      var pts=[];for(var k=0;k<=160;k++){var t=end*k/160;pts.push([X(t),Y(a[0](t))]);}s+=path(pts,a[1],'data-series="'+a[2]+'"');
    });
    r.rows.forEach(function(row){s+='<circle data-time="'+row.time+'" data-value="'+row.actual+'" cx="'+X(row.time)+'" cy="'+Y(row.actual)+'" r="4.5" class="'+(row.training?"mwf-training":"mwf-holdout")+'"/>';});
    s+=line(X(r.n-.5),70,X(r.n-.5),315,"mwf-split")+line(X(9.5),70,X(9.5),315,"mwf-future");
    s+=text(80,371,"训练／留出分界：t="+format(r.n-.5)+"（红虚线）；观测／未来分界：t=9.5（灰虚线）");
    s+=text(810,394,"时间 t（日）",'text-anchor="end"')+text(28,65,"人数");
    return svg(s,900,415,"校准、留出、未来与参数扰动", 'data-max-y="'+maxY+'" data-end="'+end+'"');
  }
  function residualSvg(r){
    var max=Math.max(1,Math.max.apply(null,r.rows.map(function(row){return Math.abs(row.residual);}))*1.15);
    function X(t){return 80+730*t/9;}function Y(e){return 170-105*e/max;}
    var s=text(80,27,"残差 = 观测 − 预测；连续同号或随时间弯曲，值得检查机制") +line(80,Y(0),810,Y(0),"mwf-axis");
    [-max,0,max].forEach(function(v){s+=text(70,Y(v)+4,format(v),'text-anchor="end"');});
    r.rows.forEach(function(row){var cls=row.training?"mwf-training":"mwf-holdout";s+=line(X(row.time),Y(0),X(row.time),Y(row.residual),"mwf-residual-stem");s+='<circle data-time="'+row.time+'" data-value="'+row.residual+'" cx="'+X(row.time)+'" cy="'+Y(row.residual)+'" r="4.5" class="'+cls+'"/>'+text(X(row.time),298,String(row.time),'text-anchor="middle"');});
    s+=text(810,320,"时间 t（日）",'text-anchor="end"');return svg(s,900,335,"十个观测的有符号残差",'data-max-abs="'+max+'"');
  }
  function profileSvg(r){
    var m=r.model;if(m.kind!=="logistic")return '<p class="mwf-note">指数候选没有容量 K；其对数斜率和截距由训练点的直线最小二乘求出。</p>';
    var ymax=Math.max.apply(null,m.profile.map(function(p){return p.rmse;}))*1.1;
    function X(K){return 80+730*(K-m.minK)/(m.maxK-m.minK);}function Y(e){return 250-180*e/ymax;}
    var s=text(80,26,"361 个容量候选的训练 RMSE；每个 K 都重新拟合变换后的直线")+text(80,49,"这不是完整非线性最小二乘剖面，也不是参数置信区间");
    for(var j=0;j<=4;j++){var v=ymax*j/4;s+=line(80,Y(v),810,Y(v),"mwf-gridline")+text(70,Y(v)+4,format(v),'text-anchor="end"');var K=m.minK+(m.maxK-m.minK)*j/4;s+=text(X(K),276,format(K),'text-anchor="middle"');}
    s+=path(m.profile.map(function(p){return[X(p.K),Y(p.rmse)];}),"mwf-fit",'data-series="profile"');
    s+='<circle class="mwf-holdout" data-best="'+m.bestIndex+'" cx="'+X(m.K)+'" cy="'+Y(r.trainingRmse)+'" r="5"/>';
    s+=text(810,302,"候选容量 K（人）",'text-anchor="end"');return svg(s,900,320,"容量搜索范围和训练误差",'data-max-y="'+ymax+'" data-min-k="'+m.minK+'" data-max-k="'+m.maxK+'"');
  }
  function styles(){
    if(!host||host.document.getElementById("mwf106-style"))return;
    var el=host.document.createElement("style");el.id="mwf106-style";el.textContent=
      '.mwf-lab{min-width:0;max-width:100%;color:var(--fg);line-height:1.65}.mwf-lab *{box-sizing:border-box}.mwf-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.mwf-lab label{display:grid;gap:6px}.mwf-lab input,.mwf-lab select,.mwf-lab button{font:inherit;min-height:44px;max-width:100%;color:inherit}.mwf-lab input{width:100%;margin:0}.mwf-lab select{width:100%;padding:8px;background:var(--bg)}.mwf-lab button{padding:8px 14px;border:1px solid var(--border);background:var(--bg);border-radius:7px;cursor:pointer}.mwf-lab button:disabled{opacity:.5;cursor:default}.mwf-lab .mwf-actions{display:flex;gap:10px;margin:15px 0;flex-wrap:wrap}.mwf-lab .mwf-primary{background:var(--accent);color:var(--bg)}.mwf-result[hidden]{display:none}.mwf-scroll{max-width:100%;overflow-x:auto;margin:15px 0}.mwf-scroll svg{display:block;width:900px;min-width:900px;max-width:none;height:auto;color:var(--fg);background:var(--bg)}.mwf-scroll svg text{fill:currentColor;font:14px Arial,sans-serif}.mwf-scroll table{display:table!important;overflow:visible!important;width:900px;min-width:900px;max-width:none;border-collapse:collapse}.mwf-scroll th,.mwf-scroll td{padding:10px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}.mwf-gridline{stroke:var(--border);stroke-width:1}.mwf-axis{stroke:var(--fg-soft);stroke-width:1.5}.mwf-fit{stroke:var(--accent);stroke-width:2.5;fill:none}.mwf-sensitivity{stroke:#a67521;stroke-width:2;fill:none;stroke-dasharray:7 4}.mwf-training{fill:#478759}.mwf-holdout{fill:#b58224}.mwf-split{stroke:#b6483d;stroke-dasharray:5 4}.mwf-future{stroke:var(--fg-soft);stroke-dasharray:3 4}.mwf-residual-stem{stroke:var(--fg-soft);stroke-width:1.5}.mwf-note{border-left:4px solid #b58224;padding:8px 12px;background:var(--bg-soft)}.mwf-lab :focus-visible{outline:3px solid var(--accent);outline-offset:3px}.mwf-feedback{padding:8px 0}.mwf-lab h4{margin:20px 0 8px}@media(max-width:600px){.mwf-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){html:has(.mwf-lab){scroll-behavior:auto}}';
    host.document.head.appendChild(el);
  }
  function mount(root){
    styles();var id="mwf-"+(++serial);
    root.innerHTML='<div class="mwf-lab"><p>十个人为选定的教学观测，单位为人，时刻 t=0,…,9 日；不代表某个真实产品。</p><div class="mwf-controls">'+
      '<label for="'+id+'-kind">候选模型</label><select id="'+id+'-kind" data-role="kind"><option value="logistic">Logistic</option><option value="exponential">指数增长</option></select>'+
      '<label for="'+id+'-n">训练点数 n <output data-role="n-output" for="'+id+'-n">5</output></label><input id="'+id+'-n" aria-label="训练点数 n" data-role="n" type="range" min="3" max="8" step="1" value="5">'+
      '<label for="'+id+'-h">未来步数 <output data-role="horizon-output" for="'+id+'-h">8</output></label><input id="'+id+'-h" aria-label="未来步数" data-role="horizon" type="range" min="2" max="14" step="1" value="8">'+
      '<label for="'+id+'-f">参数扰动倍率 <output data-role="sensitivity-output" for="'+id+'-f">1.1</output></label><input id="'+id+'-f" aria-label="参数扰动倍率" data-role="sensitivity" type="range" min=".8" max="1.2" step=".05" value="1.1">'+
      '<label for="'+id+'-search">容量搜索上限</label><select id="'+id+'-search" data-role="search"><option value="4">训练最大值的 4 倍（至少加 400）</option><option value="12">训练最大值的 12 倍（至少加 400）</option></select></div>'+
      '<p>先预测：训练误差很小，能否证明容量 K 已被数据准确识别？</p><label for="'+id+'-prediction">你的判断</label><select id="'+id+'-prediction" data-role="prediction"><option value="">请选择</option><option value="no">不能，还要检查搜索范围、识别性和验证</option><option value="yes">能，训练误差小就足够</option><option value="band">能，敏感性包络就是置信区间</option></select>'+
      '<div class="mwf-actions"><button class="mwf-primary" data-role="reveal" disabled>揭示工作流</button><button data-role="reset">重置</button></div><p class="mwf-feedback" aria-live="polite"></p><section class="mwf-result" data-role="result" tabindex="-1" aria-label="建模验证结果" hidden></section></div>';
    var controls={};["kind","n","horizon","sensitivity","search","prediction","reveal","reset","result"].forEach(function(k){controls[k]=root.querySelector('[data-role="'+k+'"]');});
    var result=controls.result,feedback=root.querySelector(".mwf-feedback");
    function region(html,label){return '<div class="mwf-scroll" role="region" tabindex="0" aria-label="'+label+'，可横向滚动">'+html+'</div>';}
    function row(a,b){return "<tr><th scope=\"row\">"+a+"</th><td>"+b+"</td></tr>";}
    function render(){
      ["n","horizon","sensitivity"].forEach(function(k){root.querySelector('[data-role="'+k+'-output"]').textContent=controls[k].value;});
      controls.search.disabled=controls.kind.value!=="logistic";
      controls.reveal.disabled=!controls.prediction.value||!result.hidden;
      if(result.hidden)return;
      var r=compute({kind:controls.kind.value,n:Number(controls.n.value),horizon:Number(controls.horizon.value),sensitivity:Number(controls.sensitivity.value),search:Number(controls.search.value)}),m=r.model;
      feedback.textContent=controls.prediction.value==="no"?"判断正确：小训练误差不足以识别容量。":"请修正判断：小训练误差不足以识别容量；参数扰动没有置信水平。";
      var params=m.kind==="logistic"?"K="+format(m.K)+" 人；r="+format(m.rate,5)+" /日；C="+format(m.C,5):"A="+format(m.A)+" 人；r="+format(m.growth,5)+" /日";
      var diagnostic=m.kind==="logistic"?"K ∈ ["+format(m.minK)+", "+format(m.maxK)+"]，361 候选；最优索引 "+m.bestIndex+"。"+(m.boundary?"最优值触及搜索边界，应扩大范围检查。":"最优值在网格内部，也不等于已识别。"):"对 log(y/1人) 作直线最小二乘；不等于原人数尺度的最小二乘。";
      result.innerHTML='<h4>校准与未来</h4>'+region(renderSvg(r),"校准和外推图")+
        region('<table><caption>误差、参数与适用条件</caption><tbody>'+
        row("训练 / 留出","t=0,…,"+(r.n-1)+" / t="+r.n+",…,9；共 "+r.n+" / "+(10-r.n)+" 点")+
        row("校准参数",params)+row("候选搜索",diagnostic)+row("训练 RMSE",format(r.trainingRmse)+" 人")+
        row("留出 RMSE",format(r.validationRmse)+" 人；原人数尺度")+
        row("未来值","t="+r.futureTime+" 日："+format(r.future)+" 人")+
        row("参数扰动包络",format(r.low)+" 至 "+format(r.high)+" 人；倍率 "+format(r.lowFactor)+" / "+format(r.highFactor))+
        row("扰动保持什么",m.kind==="logistic"?"改变 K，固定拟合的 N(0) 与 r，重算 C；没有重新拟合训练数据。":"改变 r，固定拟合 A；没有重新拟合训练数据。")+
        '</tbody></table>',"模型账本")+
        '<p class="mwf-note">包络仅覆盖所选参数方向的两条情景，不是置信区间或预测区间。反复查看留出结果后再调模型，会用掉这份验证信息；此教学数据没有额外的独立测试集。未来也没有观测真值。</p>'+
        '<h4>残差比拟合曲线更容易暴露偏差</h4>'+region(residualSvg(r),"残差图")+
        region('<table><caption>每个观测都保留，残差 = 观测 − 预测</caption><thead><tr><th>t（日）</th><th>用途</th><th>观测（人）</th><th>预测（人）</th><th>残差（人）</th></tr></thead><tbody>'+
        r.rows.map(function(v){return '<tr><th scope="row">'+v.time+'</th><td>'+(v.training?"训练":"留出")+'</td><td>'+v.actual+'</td><td>'+format(v.predicted)+'</td><td>'+format(v.residual)+'</td></tr>';}).join("")+'</tbody></table>',"逐点残差账本")+
        '<h4>搜索范围也是假设的一部分</h4>'+region(profileSvg(r),"容量搜索图")+
        '<p class="mwf-note">Logistic：固定每个候选 K，先对 log(K/y−1) 做直线回归，再按原尺度训练 SSE 比较候选。它是透明的有限网格校准法，没有宣称找到完整非线性最小二乘的全局解。调整上限时网格间距也会改变。图和表可聚焦后用左右方向键滚动。</p>';
    }
    controls.reveal.addEventListener("click",function(){if(!controls.prediction.value)return;result.hidden=false;render();result.focus({preventScroll:true});});
    controls.prediction.addEventListener("change",function(){result.hidden=true;feedback.textContent=controls.prediction.value?"判断已记录，提交后显示结果。":"";render();});
    ["kind","n","horizon","sensitivity","search"].forEach(function(k){controls[k].addEventListener("input",render);controls[k].addEventListener("change",render);});
    controls.reset.addEventListener("click",function(){Object.keys(DEFAULTS).forEach(function(k){controls[k].value=String(DEFAULTS[k]);});controls.prediction.value="";result.hidden=true;result.innerHTML="";feedback.textContent="已重置，结果隐藏。";render();controls.prediction.focus({preventScroll:true});});
    render();
  }
  function selfTest(){
    var checks=0;function ok(v,msg){checks++;if(!v)throw new Error(msg);}
    ["logistic","exponential"].forEach(function(kind){for(var n=3;n<=8;n++){
      var r=compute({kind:kind,n:n,horizon:8,sensitivity:1.1,search:4});
      ok(r.future>0&&r.trainingRmse>=0&&r.validationRmse>=0,"finite fit");
      ok(Math.abs(r.lower.predict(0)-r.model.predict(0))<1e-10,"sensitivity fixes initial value");
      ok(r.rows.length===10&&r.rows.filter(function(v){return v.training;}).length===n,"all data and split");
      if(kind==="logistic")ok(r.model.profile.length===361,"all capacity candidates");
    }});
    ok(format(120,0)==="120"&&format(0,0)==="0","integer zero retained");
    [null,"5",2,9,NaN,3.5].forEach(function(n){var threw=false;try{fitLogistic(n);}catch(e){threw=true;}ok(threw,"strict count");});
    return {checks:checks,presets:2};
  }
  return {DATA:DATA,DEFAULTS:DEFAULTS,format:format,fitModel:fitModel,fitLogistic:fitLogistic,fitExponential:fitExponential,logisticCandidate:logisticCandidate,
    sensitivityModel:sensitivityModel,compute:compute,renderSvg:renderSvg,residualSvg:residualSvg,profileSvg:profileSvg,mount:mount,selfTest:selfTest};
});
