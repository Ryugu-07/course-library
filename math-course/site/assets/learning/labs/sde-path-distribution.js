(function(root,factory){
  "use strict";
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root&&root.CourseLearning)root.CourseLearning.register("sde-path-distribution",api.mount);
  if(typeof module==="object"&&module.exports&&require.main===module)console.log(JSON.stringify(api.selfTest()));
})(typeof window==="undefined"?null:window,function(){
  "use strict";
  var DEFAULTS=Object.freeze({theta:1.15,sigma:.85,horizon:2,x0:1.4,level:5,path:0,seed:98443302});
  var SEEDS=Object.freeze([98443302,107,20260910]),LEVELS=Object.freeze([2,3,4,5,6,7,8]),M=256,N=256,INSTANCE=0;
  var PRESETS=Object.freeze([
    {name:"均值回复",values:{}},{name:"θ=0：布朗运动",values:{theta:0}},
    {name:"σ=0：确定性",values:{sigma:0}},{name:"临界：θh=2",values:{theta:4,level:2}},
    {name:"失稳：θh=2.5",values:{theta:5,level:2}},{name:"零均值仍有强误差",values:{x0:0}}
  ]);
  function range(v,lo,hi,label,int){if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(int&&!Number.isInteger(v)))throw new RangeError(label);return v;}
  function config(input){
    if(input!==undefined&&(!input||typeof input!=="object"||Array.isArray(input)))throw new TypeError("configuration");
    var c=Object.assign({},DEFAULTS);
    Object.keys(input||{}).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(c,k))throw new RangeError("unknown "+k);c[k]=input[k];});
    range(c.theta,0,5,"theta");range(c.sigma,0,1.5,"sigma");range(c.horizon,.5,2,"horizon");range(c.x0,-2,2,"x0");
    range(c.level,2,8,"level",true);range(c.path,0,255,"path",true);range(c.seed,0,4294967295,"seed",true);
    return Object.freeze(c);
  }
  function rng(seed){range(seed,0,4294967295,"seed",true);return function(){seed=(seed+0x6D2B79F5)>>>0;var t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return(((t^(t>>>14))>>>0)+.5)/4294967296;};}
  function normal(random){
    if(typeof random!=="function")throw new TypeError("rng");
    var u=random(),v=random();if(typeof u!=="number"||typeof v!=="number"||!(u>0&&u<1&&v>0&&v<1))throw new RangeError("open uniforms");
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function sum(values){var s=0,c=0;values.forEach(function(x){var y=x-c,t=s+y;c=(t-s)-y;s=t;});return s;}
  function mean(values){return sum(values)/values.length;}
  function variance(values){var m=mean(values);return sum(values.map(function(x){return(x-m)*(x-m);}))/values.length;}
  function log1pmx(x){
    if(Math.abs(x)>.05)return Math.log1p(x)-x;
    var term=-x*x/2,s=term;
    for(var k=3;k<200;k++){term*=-x*(k-1)/k;var next=s+term;if(next===s)break;s=next;}return s;
  }
  // c(x) = integral_0^1 exp(-x u) du; loss is evaluated without subtracting nearly equal numbers.
  function kernel(x){
    range(x,0,20,"kernel decay");
    if(x===0)return{c:1,loss:0,bridge:0};
    var c=-Math.expm1(-x)/x,loss;
    if(x<.1){var term=x/2;loss=term;for(var k=2;k<120;k++){term*=-x/(k+1);var next=loss+term;if(next===loss)break;loss=next;}}
    else loss=1-c;
    // Positive series for sqrt(Var(J)/h - Cov(J,dW)^2/h^2).
    // exp(-x) sum_{k>=1} 2k*x^(2k)/(2k+2)! avoids catastrophic cancellation.
    var term=1/12,s=term;
    for(var k=1;k<200;k++){term*=((k+1)/k)*x*x/((2*k+4)*(2*k+3));var next=s+term;if(next===s)break;s=next;}
    return{c:c,loss:loss,bridge:Math.exp(-x/2)*x*Math.sqrt(s)};
  }
  function moments(input,steps){
    var c=config(input);range(steps,1,256,"steps",true);
    var h=c.horizon/steps,x=c.theta*h,A=1-x,q=kernel(x),decay=Math.exp(-c.theta*c.horizon);
    var exactMean=c.x0*decay,discreteMean=c.x0*Math.pow(A,steps),bias;
    if(c.theta===0||c.x0===0)bias=0;
    else if(A>0)bias=exactMean*Math.expm1(steps*log1pmx(-x));
    else bias=discreteMean-exactMean;
    var power=1,geom=0,components=[bias],sqrtH=Math.sqrt(h);
    for(var j=0;j<steps;j++){
      geom+=power*power;
      var E=Math.exp(-x*j),d=A>0?E*(Math.expm1(j*log1pmx(-x))+q.loss):power-E*q.c;
      components.push(c.sigma*sqrtH*d,c.sigma*sqrtH*E*q.bridge);power*=A;
    }
    var exactSD=c.sigma*Math.sqrt(c.horizon)*Math.sqrt(kernel(2*c.theta*c.horizon).c);
    var sd=c.sigma*sqrtH*Math.sqrt(geom),wrongSD=sd*sqrtH;
    return{steps:steps,h:h,A:A,exactMean:exactMean,mean:discreteMean,bias:bias,weak:Math.abs(bias),
      variance:sd*sd,wrongVariance:wrongSD*wrongSD,exactVariance:exactSD*exactSD,
      exactSD:exactSD,sd:sd,wrongSD:wrongSD,strong:Math.hypot.apply(Math,components),
      stability:c.theta===0?"无回复（θ=0）":x<2?"均方稳定":x===2?"临界：无收缩":"失稳：|1−θh|>1",
      stationaryVariance:c.theta>0&&x<2?c.sigma*c.sigma/(2*c.theta-c.theta*c.theta*h):null};
  }
  function noise(seed){
    var paths=[];for(var j=0;j<M;j++){var random=rng((seed+j*7919)>>>0),z=[],w=[];
      for(var i=0;i<N;i++){z.push(normal(random));w.push(normal(random));}paths.push({z:z,w:w});}return paths;
  }
  function exactPath(c,p){
    var dt=c.horizon/N,x=c.theta*dt,q=kernel(x),e=Math.exp(-x),root=Math.sqrt(dt),fluct=0,values=[c.x0],dw=[];
    for(var i=0;i<N;i++){
      var increment=root*p.z[i];dw.push(increment);
      fluct=e*fluct+c.sigma*(q.c*increment+root*q.bridge*p.w[i]);
      values.push(c.x0*Math.exp(-c.theta*(i+1)*dt)+fluct);
    }return{values:values,dw:dw};
  }
  function simulate(input){
    var c=config(input),raw=noise(c.seed),fine=raw.map(function(p){return exactPath(c,p);}),exact=fine.map(function(p){return p.values[N];}),rows=[];
    LEVELS.forEach(function(level){
      var steps=Math.pow(2,level),block=N/steps,r=moments(c,steps),numeric=[],wrong=[],chosen;
      fine.forEach(function(p,index){
        var x=c.x0,y=c.x0,xs=[x],ys=[y],es=[c.x0];
        for(var j=0;j<steps;j++){
          var dw=sum(p.dw.slice(j*block,(j+1)*block));
          x=r.A*x+c.sigma*dw;y=r.A*y+c.sigma*Math.sqrt(r.h)*dw;
          xs.push(x);ys.push(y);es.push(p.values[(j+1)*block]);
        }numeric.push(x);wrong.push(y);
        if(index===c.path)chosen={numeric:xs,wrong:ys,exact:es};
      });
      var differences=numeric.map(function(v,j){return v-exact[j];});
      r.level=level;r.numeric=numeric;r.wrong=wrong;r.exact=exact;
      r.sampleMean=mean(numeric);r.sampleVariance=variance(numeric);r.wrongSampleVariance=variance(wrong);
      r.sampleRMS=Math.hypot.apply(Math,differences)/Math.sqrt(M);r.pairedMean=mean(differences);
      r.pairedSE=Math.sqrt(variance(differences)/(M-1));r.samplingDeviation=r.sampleMean-r.mean;r.trace=chosen;rows.push(r);
    });
    return{config:c,rows:rows,selected:rows[c.level-2],exact:exact};
  }
  function format(v,digits){
    if(v===null||!Number.isFinite(v))return"—";if(v===0)return"0";
    digits=digits===undefined?6:digits;var t=v.toFixed(digits);
    if(Math.abs(v)<1e-4||Math.abs(v)>=1e6||Number(t)===0)return v.toExponential(5);
    return t.indexOf(".")>=0?t.replace(/0+$/,"").replace(/\.$/,""):t;
  }
  function histogram(data){
    var r=data.selected,all=r.numeric.concat(r.wrong,r.exact),min=Math.min.apply(Math,all),max=Math.max.apply(Math,all);
    if(max-min<.2){min-=.1;max+=.1;}
    var bins=24,width=(max-min)/bins,result={min:min,max:max,width:width};
    ["numeric","wrong","exact"].forEach(function(key){
      var counts=Array(bins).fill(0);r[key].forEach(function(v){
        if(!Number.isFinite(v)||v<min||v>max)throw Error("histogram escaped bounds");
        // Even a value one ulp below max can round to bins after division.
        // Only the bin index is capped; values outside the domain still fail.
        var j=Math.min(bins-1,Math.floor((v-min)/width));counts[j]++;
      });result[key]=counts;
    });return result;
  }
    var STYLE_ID="cl-ou-lab-style",SVG="http://www.w3.org/2000/svg";
  var STYLE_TEXT=[
    ".sde-path-distribution-lab{--ou-blue:var(--cl-blue,#315f9d);--ou-red:var(--cl-red,#b64335);--ou-green:var(--cl-green,#39734d);--ou-gold:var(--cl-gold,#9b6a12);color:var(--fg);line-height:1.65;min-width:0;overflow-wrap:anywhere}",
    ".sde-path-distribution-lab *{box-sizing:border-box}.sde-path-distribution-lab [hidden]{display:none!important}.sde-path-distribution-lab button,.sde-path-distribution-lab select,.sde-path-distribution-lab input{font:inherit;min-height:44px}.sde-path-distribution-lab button,.sde-path-distribution-lab select{background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:5px;padding:8px;cursor:pointer}.sde-path-distribution-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.sde-path-distribution-lab button:disabled{opacity:.5;cursor:not-allowed}.sde-path-distribution-lab :focus-visible{outline:3px solid var(--accent);outline-offset:2px}",
    ".ou-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.ou-control{display:grid;gap:5px;min-width:0}.ou-control input,.ou-control select{width:100%;min-width:0;margin:0}.ou-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ou-control label{font-size:13px}.ou-presets,.ou-choices,.ou-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.ou-presets button,.ou-choices button,.ou-actions button{flex:1 1 180px}",
    ".ou-gate{min-width:0;border:0;border-left:3px solid var(--ou-gold);margin:16px 0;padding:12px}.ou-gate legend{padding:0;max-width:100%;font-weight:700}.ou-note{font-size:13px;color:var(--fg-soft)}.ou-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.ou-metric{padding:10px;border-top:2px solid var(--border);min-width:0}.ou-metric span{display:block;font-size:12px;color:var(--fg-soft)}.ou-metric strong{display:block;font-size:16px;font-variant-numeric:tabular-nums}",
    ".ou-scroll{overflow-x:auto;max-width:100%;overscroll-behavior-x:contain;margin:12px 0}.sde-path-distribution-lab svg{display:block;width:900px;max-width:none!important;height:auto}.sde-path-distribution-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:13px}.ou-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.ou-numeric{stroke:var(--ou-blue);fill:none;stroke-width:2.5}.ou-wrong{stroke:var(--ou-red);fill:none;stroke-width:2.2;stroke-dasharray:3 4}.ou-exact{stroke:var(--ou-green);fill:none;stroke-width:2.2;stroke-dasharray:9 4}.ou-mean{stroke:var(--ou-gold);fill:none;stroke-width:2;stroke-dasharray:12 3 2 3}",
    ".sde-path-distribution-lab table{display:table!important;min-width:1200px;width:100%;max-width:none!important;overflow:visible!important;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.sde-path-distribution-lab th,.sde-path-distribution-lab td{padding:8px;border-bottom:1px solid var(--border);text-align:right}.sde-path-distribution-lab th{color:var(--fg-soft)}.sde-path-distribution-lab caption{text-align:left;font-weight:700;font-size:14px}.ou-boundary{padding:12px;border-left:3px solid var(--ou-red);font-size:13px}",
    "@media(max-width:850px){.ou-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.ou-controls{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){html:has(.sde-path-distribution-lab){scroll-behavior:auto!important}.sde-path-distribution-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");
  function node(doc,tag,cl,text){var n=doc.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n;}
  function sn(doc,tag,attrs,text){var n=doc.createElementNS(SVG,tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,String(attrs[k]));});if(text!==undefined)n.textContent=text;return n;}
  function chart(doc,title,height,attrs){
    var svg=sn(doc,"svg",Object.assign({viewBox:"0 0 900 "+height,role:"img","aria-label":title},attrs));
    svg.appendChild(sn(doc,"title",{},title));return svg;
  }
  function text(doc,svg,x,y,value,anchor){svg.appendChild(sn(doc,"text",{x:x,y:y,"text-anchor":anchor||"start"},value));}
  function line(doc,svg,x1,y1,x2,y2){svg.appendChild(sn(doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,class:"ou-grid"}));}
  function path(doc,svg,values,y,cl){
    var d=values.map(function(v,j){return(j?"L":"M")+(80+760*j/(values.length-1)).toFixed(12)+" "+y(v).toFixed(12);}).join(" ");
    svg.appendChild(sn(doc,"path",{d:d,class:cl}));
  }
  function drawPath(doc,data){
    var r=data.selected,tr=r.trace,c=data.config,means=tr.numeric.map(function(v,j){return c.x0*Math.exp(-c.theta*j*r.h);});
    var all=tr.numeric.concat(tr.wrong,tr.exact,means),lo=Math.min.apply(Math,all),hi=Math.max.apply(Math,all);
    var pad=Math.max(.1,(hi-lo)*.08);lo-=pad;hi+=pad;
    var svg=chart(doc,"同一布朗噪声上的 EM、错误缩放、精确 OU 与总体均值",365,{"data-min":lo,"data-max":hi});
    var y=function(v){return 280-(v-lo)*240/(hi-lo);};
    for(var j=0;j<=4;j++){var v=lo+(hi-lo)*j/4;line(doc,svg,80,y(v),840,y(v));text(doc,svg,72,y(v)+4,format(v,3),"end");text(doc,svg,80+190*j,307,format(c.horizon*j/4,3),"middle");}
    path(doc,svg,tr.numeric,y,"ou-numeric");path(doc,svg,tr.wrong,y,"ou-wrong");path(doc,svg,tr.exact,y,"ou-exact");path(doc,svg,means,y,"ou-mean");
    text(doc,svg,80,24,"X(t)；横轴 t");text(doc,svg,80,337,"蓝实线 EM · 红短虚线 错误缩放 · 绿长虚线 精确 OU · 金点划线 总体均值");
    text(doc,svg,80,358,"全部采样顶点均保留；连接线不表示两个时刻之间的真实轨迹。");
    return svg;
  }
  function drawHistogram(doc,data){
    var h=histogram(data),max=Math.max.apply(Math,h.numeric.concat(h.wrong,h.exact)),top=Math.max(4,Math.ceil(max/4)*4);
    var svg=chart(doc,"全部 256 条路径的终点频数，不是密度",370,{"data-min":h.min,"data-max":h.max,"data-count-max":top});
    for(var j=0;j<=4;j++){var y=275-230*j/4;line(doc,svg,80,y,848,y);text(doc,svg,72,y+4,String(top*j/4),"end");text(doc,svg,80+192*j,302,format(h.min+(h.max-h.min)*j/4,3),"middle");}
    ["numeric","wrong","exact"].forEach(function(key,k){h[key].forEach(function(count,j){var height=230*count/top;svg.appendChild(sn(doc,"rect",{x:80+32*j+1+10*k,y:275-height,width:9,height:height,class:"ou-"+key,"data-bin":j,"data-count":count}));});});
    text(doc,svg,80,26,"频数（条）；横轴为终点值 X(T)");
    text(doc,svg,80,333,"每箱三列：蓝 EM / 红错误缩放 / 绿精确 OU；每组共 256 条，末箱包含右端点。");
    text(doc,svg,80,358,data.config.sigma===0?"σ=0：总体分布是单点质量，不绘制虚假的高斯密度。":"柱高表示个数；柱宽与概率密度无关。解析均值和方差见账本。");
    return svg;
  }
  function drawErrors(doc,data){
    var keys=["sampleRMS","strong","weak"],classes=["ou-numeric","ou-exact","ou-mean"],values=[];
    data.rows.forEach(function(r){keys.forEach(function(k){if(r[k]>0)values.push(Math.log10(r[k]));});});
    var lo=values.length?Math.floor(Math.min.apply(Math,values)):-1,hi=values.length?Math.ceil(Math.max.apply(Math,values)):0;
    if(hi===lo)hi=lo+1;var svg=chart(doc,"终点强误差与弱均值误差",380,{"data-log-min":lo,"data-log-max":hi});
    for(var j=0;j<=4;j++){var y=275-230*j/4;line(doc,svg,80,y,840,y);text(doc,svg,72,y+4,"10^"+format(lo+(hi-lo)*j/4,2),"end");}
    data.rows.forEach(function(r,j){text(doc,svg,80+760*j/6,301,format(r.h,5),"middle");});
    keys.forEach(function(key,k){
      var d="";
      data.rows.forEach(function(r,j){
        if(r[key]===0){if(d){svg.appendChild(sn(doc,"path",{d:d,class:classes[k]}));d="";}return;}
        var x=80+760*j/6,y=275-(Math.log10(r[key])-lo)*230/(hi-lo);d+=(d?"L":"M")+x.toFixed(12)+" "+y.toFixed(12)+" ";
        svg.appendChild(sn(doc,"circle",{cx:x,cy:y,r:3,class:classes[k],"data-series":key,"data-level":r.level}));
      });if(d)svg.appendChild(sn(doc,"path",{d:d,class:classes[k]}));
    });
    text(doc,svg,80,25,"纵轴对数；横轴步长 h（从左到右逐次减半）");
    text(doc,svg,80,334,"蓝实线 256 条配对 RMS · 绿长虚线 解析强 L² 误差 · 金点划线 解析弱均值误差");
    text(doc,svg,80,361,"零误差仅列账本，不放进对数图；接近机器精度的样本残差可能来自浮点舍入。");
    return svg;
  }
  function mount(root,api){
    var doc=root.ownerDocument;if(!doc.getElementById(STYLE_ID)){var style=node(doc,"style");style.id=STYLE_ID;style.textContent=STYLE_TEXT;doc.head.appendChild(style);}
    var uid="ou-"+(++INSTANCE),state=Object.assign({},DEFAULTS),prediction="",revealed=false,refs={};
    var shell=node(doc,"div","sde-path-distribution-lab");root.replaceChildren(shell);
    shell.appendChild(node(doc,"h3","","从一条路径，到总体分布，再到数值误差"));
    shell.appendChild(node(doc,"p","ou-note","256 条伪随机路径，256 个细时间段；用两组独立高斯数精确耦合 OU 随机积分与布朗增量。七层网格共享同一驱动，最细层也和真解比较。参数使用一致的任意时间单位。"));
    var presets=node(doc,"div","ou-presets");shell.appendChild(presets);
    PRESETS.forEach(function(p,i){var b=node(doc,"button","",p.name);b.type="button";b.setAttribute("data-preset",i);b.addEventListener("click",function(){state=Object.assign({},DEFAULTS,p.values);sync();if(revealed)render();});presets.appendChild(b);});
    var controls=node(doc,"div","ou-controls");shell.appendChild(controls);
    function control(key,label,min,max,step,options){
      var box=node(doc,"div","ou-control"),l=node(doc,"label","",label+"："),out=node(doc,"output"),input=node(doc,options?"select":"input");
      input.id=uid+"-"+key;l.htmlFor=input.id;out.setAttribute("for",input.id);l.appendChild(out);input.setAttribute("aria-label",label);input.setAttribute("data-key",key);
      if(options)options.forEach(function(v){var o=node(doc,"option","",String(v));o.value=v;input.appendChild(o);});
      else{input.type="range";input.min=min;input.max=max;input.step=step;}
      box.appendChild(l);box.appendChild(input);controls.appendChild(box);refs[key]={input:input,out:out};
      input.addEventListener("input",function(){state[key]=Number(input.value);state=Object.assign({},config(state));sync();if(revealed)render();});
    }
    control("theta","回复率 θ",0,5,.05);control("sigma","噪声 σ",0,1.5,.05);control("x0","初值 X₀",-2,2,.1);control("horizon","终止时间 T",.5,2,.5);
    control("level","网格层级",2,8,1);control("path","显示路径",0,255,1);control("seed","噪声种子",null,null,null,SEEDS);
    var gate=node(doc,"fieldset","ou-gate");gate.appendChild(node(doc,"legend","","先判断：两个方法的终点均值相同，是否足以证明路径同样准确？"));shell.appendChild(gate);
    var choices=node(doc,"div","ou-choices"),buttons=[];gate.appendChild(choices);
    [["no","不足：还须比较分布与同噪声误差"],["yes","足够：均值能代表所有路径"],["sample","只要一条样本看起来接近就足够"]].forEach(function(v){
      var b=node(doc,"button","",v[1]);b.type="button";b.setAttribute("data-choice",v[0]);b.setAttribute("aria-pressed","false");b.addEventListener("click",function(){prediction=v[0];revealed=false;results.hidden=true;feedback.textContent="预测已记录，揭示后核对三本账。";sync();});buttons.push(b);choices.appendChild(b);
    });
    var actions=node(doc,"div","ou-actions"),reveal=node(doc,"button","","揭示结果"),reset=node(doc,"button","","重置");reveal.type=reset.type="button";actions.appendChild(reveal);actions.appendChild(reset);gate.appendChild(actions);
    var feedback=node(doc,"p","ou-note","请选择一个预测。");feedback.setAttribute("aria-live","polite");gate.appendChild(feedback);
    var results=node(doc,"div","ou-results");results.hidden=true;results.tabIndex=-1;results.setAttribute("role","region");results.setAttribute("aria-label","OU 实验结果");shell.appendChild(results);
    function sync(){
      Object.keys(refs).forEach(function(k){refs[k].input.value=state[k];refs[k].out.textContent=k==="level"?Math.pow(2,state.level)+" 步":k==="path"?(state.path+1)+" / 256":format(state[k],3);});
      buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-choice")===prediction));});reveal.disabled=!prediction||revealed;
    }
    function scroll(n,label){var w=node(doc,"div","ou-scroll");w.tabIndex=0;w.setAttribute("role","region");w.setAttribute("aria-label",label+"，可横向滚动");w.appendChild(n);return w;}
    function table(title,headers,rows){
      var t=node(doc,"table");t.setAttribute("aria-label",title);t.appendChild(node(doc,"caption","",title));var head=node(doc,"thead"),tr=node(doc,"tr");
      headers.forEach(function(v){var th=node(doc,"th","",v);th.scope="col";tr.appendChild(th);});head.appendChild(tr);t.appendChild(head);var body=node(doc,"tbody");
      rows.forEach(function(row){var tr=node(doc,"tr");row.forEach(function(v){tr.appendChild(node(doc,"td","",typeof v==="number"?format(v,7):v));});body.appendChild(tr);});t.appendChild(body);results.appendChild(scroll(t,title));
    }
    function render(){
      var data=simulate(state),r=data.selected;results.replaceChildren();results.hidden=false;
      feedback.textContent=(prediction==="no"?"判断正确。":"请结合账本修正判断。")+" 均值相同可能掩盖方差错误；强误差须在同一驱动下比较。";
      var metrics=node(doc,"div","ou-metrics");results.appendChild(metrics);
      [["步长 h",r.h],["EM 乘子 1−θh",r.A],["256 条样本 RMS",r.sampleRMS],["解析强 L² 误差",r.strong],["解析弱均值误差",r.weak],["配对均差 SE 估计",r.pairedSE]].forEach(function(v){var box=node(doc,"div","ou-metric");box.appendChild(node(doc,"span","",v[0]));box.appendChild(node(doc,"strong","",format(v[1],7)));metrics.appendChild(box);});
      results.appendChild(node(doc,"p","ou-boundary","当前离散稳定性："+r.stability+"。连续 OU 在 θ>0 时均值回复，显式 EM 却还要求 0<θh<2。临界与失稳数据完整保留，不截断数值。"));
      [[drawPath(doc,data),"单路径对照"],[drawHistogram(doc,data),"终点频数"],[drawErrors(doc,data),"误差随步长"]].forEach(function(v){results.appendChild(scroll(v[0],v[1]));});
      table("七层误差账本",["步数","h","样本 RMS","解析强 L²","解析弱均值误差","配对均差","配对 SE","样本均值−离散均值"],data.rows.map(function(r){return[r.steps,r.h,r.sampleRMS,r.strong,r.weak,r.pairedMean,r.pairedSE,r.samplingDeviation];}));
      table("七层总体与样本矩",["步数","精确均值","两种离散法均值","精确方差","EM 方差","错误法方差","EM 样本方差","错误法样本方差"],data.rows.map(function(r){return[r.steps,r.exactMean,r.mean,r.exactVariance,r.variance,r.wrongVariance,r.sampleVariance,r.wrongSampleVariance];}));
      var h=histogram(data);table("完整终点分箱",["箱","左端（含）","右端（仅末箱含）","EM 个数","错误缩放个数","精确 OU 个数"],h.numeric.map(function(v,j){return[j+1,h.min+j*h.width,h.min+(j+1)*h.width,v,h.wrong[j],h.exact[j]];}));
      results.appendChild(node(doc,"p","ou-note","样本方差分母为 256，用于描述这批样本；SE 则按独立配对差、分母 255 估计。固定伪随机样本不是精确置信保证。零均值并不消除强误差；θ=0 时 EM 在网格上精确，σ=0 时退化为确定性 Euler。极小样本残差可能来自浮点舍入。"));
    }
    reveal.addEventListener("click",function(){if(!prediction||revealed)return;revealed=true;render();sync();results.focus();if(api&&api.announce)api.announce(root,"OU 实验结果已揭示。");});
    reset.addEventListener("click",function(){state=Object.assign({},DEFAULTS);prediction="";revealed=false;results.hidden=true;feedback.textContent="已重置，请重新判断。";sync();buttons[0].focus();});
    sync();
  }

  function selfTest(){
    var checks=0;function check(v,label){checks++;if(!v)throw Error(label);}
    check(kernel(0).bridge===0&&kernel(0).c===1,"theta zero");
    check(Math.abs(kernel(1e-20).bridge/(1e-20/Math.sqrt(12))-1)<1e-14,"tiny conditional variance");
    check(moments({theta:0},4).strong===0,"Brownian EM exact on grid");
    check(moments({x0:0},4).weak===0&&moments({x0:0},4).strong>0,"weak mean is not strong");
    check(moments({theta:4},4).A===-1,"stability boundary");
    check(moments({theta:5},4).A===-1.5,"unstable values retained");
    check(moments({sigma:0},32).strong===moments({sigma:0},32).weak,"deterministic error");
    check(rng(0)()!==rng(1)(),"seed zero");
    check(format(10,0)==="10"&&format(.0001,3)!=="0","number formatting");
    PRESETS.forEach(function(p){var d=simulate(p.values),h=histogram(d);check(d.rows.length===7&&d.exact.length===256,p.name);["numeric","wrong","exact"].forEach(function(k){check(sum(h[k])===256,"all histogram observations");});});
    var edge=histogram(simulate({theta:0,sigma:1.5,horizon:.5,x0:-2,level:8,path:255,seed:20260910}));
    check(sum(edge.numeric)===256&&sum(edge.wrong)===256&&sum(edge.exact)===256,"right endpoint rounding retains all observations");
    return{checks:checks,presets:PRESETS.length};
  }
  return{DEFAULTS:DEFAULTS,SEEDS:SEEDS,LEVELS:LEVELS,PRESETS:PRESETS,config:config,rng:rng,normal:normal,kernel:kernel,moments:moments,noise:noise,exactPath:exactPath,simulate:simulate,format:format,histogram:histogram,selfTest:selfTest,mount:mount,drawPath:drawPath,drawHistogram:drawHistogram,drawErrors:drawErrors};
});
