(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("poisson-process", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("poisson-process self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("poisson-process self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-poisson-process-styles";
  var SERIAL = 0;
  var DEFAULTS = Object.freeze({ lambda: 2, horizon: 4, repetitions: 80, seed: 20260822 });

  var STYLE_TEXT = [
    ".pp-lab{--pp-blue:#2b628f;--pp-green:#39734d;--pp-red:#b4493f;--pp-gold:#9a6b16;--pp-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=dark] .pp-lab{--pp-blue:#83c8ff;--pp-green:#82d49e;--pp-red:#f08d83;--pp-gold:#e2b458;--pp-soft:#b8b2a7}",
    ".pp-lab *,.pp-lab *::before,.pp-lab *::after{box-sizing:border-box}.pp-lab [hidden]{display:none!important}",
    ".pp-lab h3,.pp-lab h4{margin:0;color:var(--fg);letter-spacing:0}.pp-lab h3{font-size:1.18rem}.pp-lab h4{font-size:1rem}",
    ".pp-lab .pp-intro,.pp-lab .pp-note,.pp-lab .pp-feedback{color:var(--pp-soft);font-size:13px;line-height:1.7}.pp-lab .pp-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pp-gold);background:var(--bg)}",
    ".pp-lab fieldset{min-width:0;margin:0;padding:0;border:0}.pp-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5}.pp-lab .pp-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.pp-lab .pp-question legend{color:var(--pp-soft);font-size:13px;font-weight:650}",
    ".pp-lab .pp-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pp-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pp-lab button:hover{border-color:var(--accent)}.pp-lab button[aria-pressed=true],.pp-lab button.pp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.pp-lab button:focus-visible,.pp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pp-lab .pp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pp-lab .pp-actions>*{flex:1 1 180px}.pp-lab .pp-feedback{min-height:2em;margin:8px 0;font-weight:700}.pp-lab .pp-pass{color:var(--pp-green)}.pp-lab .pp-warn{color:var(--pp-red)}",
    ".pp-lab .pp-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pp-lab .pp-layout{display:grid;grid-template-columns:minmax(205px,.62fr) minmax(0,1.38fr);gap:16px;align-items:start;min-width:0}.pp-lab .pp-controls,.pp-lab .pp-stage{min-width:0}.pp-lab .pp-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pp-lab .pp-controls h4{margin:0}.pp-lab .pp-control{display:grid;gap:5px;min-width:0}.pp-lab .pp-control label{color:var(--pp-soft);font-size:13px;font-weight:700}.pp-lab .pp-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pp-lab input[type=range]{display:block;width:100%;min-height:44px;height:44px;margin:0;accent-color:var(--accent)}",
    ".pp-lab .pp-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pp-lab .pp-chart{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.pp-lab .pp-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.pp-lab .pp-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65}.pp-lab .pp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72}.pp-lab .pp-split{stroke:var(--pp-gold);stroke-width:1.8;stroke-dasharray:6 4}.pp-lab .pp-path{fill:none;stroke:var(--pp-blue);stroke-width:2.5;stroke-linejoin:miter}.pp-lab .pp-event{fill:var(--pp-green);stroke:var(--bg);stroke-width:1.2}.pp-lab .pp-label{font-size:11px}.pp-lab .pp-axis-label{font-size:12px}.pp-lab .pp-tick{font-size:11px;fill:var(--pp-soft)!important}.pp-lab .pp-chart-note{font-size:11px;fill:var(--pp-soft)!important}",
    ".pp-lab .pp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px}.pp-lab .pp-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pp-lab .pp-metric:nth-child(1){border-top-color:var(--pp-blue)}.pp-lab .pp-metric:nth-child(2){border-top-color:var(--pp-green)}.pp-lab .pp-metric:nth-child(3){border-top-color:var(--pp-gold)}.pp-lab .pp-metric:nth-child(4){border-top-color:var(--pp-red)}.pp-lab .pp-metric span{display:block;color:var(--pp-soft);font-size:11.5px;line-height:1.4}.pp-lab .pp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".pp-lab .pp-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch}.pp-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pp-lab caption{padding:0 0 7px;text-align:left;color:var(--pp-soft);font-size:12px;line-height:1.55}.pp-lab th,.pp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pp-lab th{color:var(--pp-soft);font-size:11.5px;font-weight:750}.pp-lab td:nth-child(n+2){white-space:nowrap}.pp-lab .pp-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--pp-gold);background:var(--bg);color:var(--pp-soft);font-size:12.5px;line-height:1.7}",
    "@media(max-width:900px){.pp-lab .pp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.pp-lab .pp-choice-row{grid-template-columns:minmax(0,1fr)}.pp-lab .pp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.pp-lab .pp-stage-frame{padding:6px}.pp-lab table{font-size:11.5px}.pp-lab th,.pp-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pp-lab *{animation:none!important;transition:none!important}}"
    ,".pp-lab .pp-layout{grid-template-columns:minmax(0,1fr)}.pp-lab .pp-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.pp-lab .pp-controls h4,.pp-lab .pp-controls>.pp-note,.pp-lab .pp-seed{grid-column:1/-1}.pp-lab .pp-seed{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.pp-lab .pp-seed input{min-height:44px;width:180px;max-width:100%;font:inherit;background:var(--bg);color:var(--fg)}",
    ".pp-lab .pp-chart-region{max-width:100%;overflow:auto}.pp-lab .pp-chart{min-width:820px;max-width:none!important}.pp-lab .pp-stage-frame{overflow:visible}.pp-lab .pp-left-limit{fill:var(--bg);stroke:var(--pp-blue);stroke-width:1.3}.pp-lab .pp-hist-empirical{fill:var(--pp-blue)}.pp-lab .pp-hist-theory{fill:var(--pp-gold)}.pp-lab [role=region]:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px}.pp-lab table{min-width:980px}.pp-lab .pp-metric strong{font-size:16px}",
    "@media(max-width:700px){.pp-lab .pp-controls{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){html:has(.pp-lab){scroll-behavior:auto!important}.pp-lab *{scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function bounded(value,label,lo,hi,integer){
    if(typeof value!=="number"||!Number.isFinite(value)||value<lo||value>hi||(integer&&!Number.isInteger(value)))throw new RangeError(label+" outside "+lo+".."+hi+(integer?" (integer)":""));
    return value;
  }
  function makeRng(seed) {
    bounded(seed,"seed",0,4294967295,true);
    var state=seed>>>0;
    return function(){
      state=(state+0x6d2b79f5)|0;
      var value=Math.imul(state^(state>>>15),1|state);
      value=(value+Math.imul(value^(value>>>7),61|value))^value;
      // Midpoints of 2^32 bins: strictly between 0 and 1, with no rejection loop.
      return (((value^(value>>>14))>>>0)+.5)/4294967296;
    };
  }
  function exponential(rng,rate){
    bounded(rate,"lambda",.1,20,false);
    if(typeof rng!=="function")throw new TypeError("rng function required");
    var u=rng();if(typeof u!=="number"||!Number.isFinite(u)||u<=0||u>=1)throw new RangeError("rng must return 0 < u < 1");
    return -Math.log(u)/rate;
  }
  function poissonPmf(k,rate){
    bounded(k,"k",0,2048,true);bounded(rate,"Poisson mean",0,400,false);
    if(rate===0)return k===0?1:0;
    var value=Math.exp(-rate);
    for(var j=1;j<=k;j++)value*=rate/j;
    return value;
  }
  function copyConfig(config){
    var source=config===undefined?DEFAULTS:config;
    if(!source||typeof source!=="object")throw new TypeError("configuration object required");
    function take(key,lo,hi,integer){return bounded(source[key]===undefined?DEFAULTS[key]:source[key],key,lo,hi,integer);}
    return {lambda:take("lambda",.1,20,false),horizon:take("horizon",0,20,false),repetitions:take("repetitions",2,1000,true),seed:take("seed",0,4294967295,true)};
  }
  function simulatePath(rate,horizon,rng,maxEvents){
    bounded(rate,"lambda",.1,20,false);bounded(horizon,"horizon",0,20,false);
    if(maxEvents===undefined)maxEvents=4096;bounded(maxEvents,"event budget",1,4096,true);
    var time=0,events=[];
    while(true){
      var next=time+exponential(rng,rate);
      if(next<=time)throw new RangeError("waiting time cannot advance floating-point clock");
      if(next>horizon)break;
      if(events.length>=maxEvents)throw new RangeError("event budget exceeded; no truncated path is returned");
      events.push(next);time=next;
    }
    return events;
  }
  function histogram(counts,rate){
    bounded(rate,"Poisson mean",0,400,false);
    if(!Array.isArray(counts)||counts.length<1||counts.length>1000)throw new RangeError("nonempty count sample, at most 1000");
    counts.forEach(function(k){bounded(k,"observed count",0,4096,true);});
    var maximum=Math.max.apply(null,counts),bins=[],prob=Math.exp(-rate);
    for(var k=0;k<=maximum;k++){
      var count=counts.filter(function(v){return v===k;}).length;
      bins.push({k:k,count:count,empirical:count/counts.length,theory:prob});
      prob*=rate/(k+1);
    }
    // Sum the tail directly; subtracting a nearly-one CDF would erase small tails.
    var tail=0,correction=0,j=maximum+1;
    while(prob>0&&j<=2048){
      var y=prob-correction,t=tail+y;correction=(t-tail)-y;tail=t;
      if(j>rate&&prob<=tail*Number.EPSILON/4)break;
      j++;prob*=rate/j;
    }
    return {bins:bins,cutoff:maximum,tail:tail,tailEmpirical:0};
  }

  function mean(values) {
    return values.length ? values.reduce(function (total, value) { return total + value; }, 0) / values.length : NaN;
  }

  function variance(values) {
    if (values.length < 2) return NaN;
    var center = mean(values);
    return values.reduce(function (total, value) { return total + Math.pow(value - center, 2); }, 0) / (values.length - 1);
  }

  function covariance(left, right) {
    if (left.length !== right.length || left.length < 2) return NaN;
    var leftMean = mean(left);
    var rightMean = mean(right);
    return left.reduce(function (total, value, index) { return total + (value - leftMean) * (right[index] - rightMean); }, 0) / (left.length - 1);
  }

  function simulate(config) {
    var settings = copyConfig(config);
    var rng = makeRng(settings.seed);
    var half = settings.horizon / 2;
    var firstPath = null;
    var firstHalf = [];
    var secondHalf = [];
    var fullCounts = [];
    var waits = [];
    for (var repetition = 0; repetition < settings.repetitions; repetition += 1) {
      var path = simulatePath(settings.lambda, settings.horizon, rng);
      if (firstPath === null) firstPath = path.slice();
      var leftCount = path.filter(function (time) { return time <= half; }).length;
      firstHalf.push(leftCount);
      secondHalf.push(path.length - leftCount);
      fullCounts.push(path.length);
      waits.push(exponential(rng, settings.lambda));
    }
    var u = 0.4 / settings.lambda;
    var v = 0.6 / settings.lambda;
    var survivesU = waits.filter(function (wait) { return wait > u; }).length;
    var survivesUV = waits.filter(function (wait) { return wait > u + v; }).length;
    var survivesV = waits.filter(function (wait) { return wait > v; }).length;
    return {
      config: settings,
      histogram: histogram(fullCounts, settings.lambda * settings.horizon),
      u: u, v: v,
      countMeanSE: Math.sqrt(settings.lambda) * Math.sqrt(settings.horizon) / Math.sqrt(settings.repetitions),
      waitMeanSE: 1 / (settings.lambda * Math.sqrt(settings.repetitions)),
      survivesV: survivesV,
      half: half,
      firstPath: firstPath,
      firstHalf: firstHalf,
      secondHalf: secondHalf,
      fullCounts: fullCounts,
      waits: waits,
      expectedHalf: settings.lambda * half,
      expectedFull: settings.lambda * settings.horizon,
      empiricalHalf: mean(firstHalf),
      empiricalSecondHalf: mean(secondHalf),
      empiricalFull: mean(fullCounts),
      empiricalVariance: variance(fullCounts),
      incrementCovariance: covariance(firstHalf, secondHalf),
      meanWait: mean(waits),
      expectedWait: 1 / settings.lambda,
      memorylessConditional: survivesU ? survivesUV / survivesU : null,
      memorylessTail: survivesV / settings.repetitions,
      memorylessTheoretical: Math.exp(-settings.lambda * v),
      survivesU: survivesU,
      survivesUV: survivesUV
    };
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function svgElement(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function replaceChildren(node, children) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function format(value,digits){
    if(value===null||value===undefined||!finite(value))return "未定义";
    if(value===0)return "0";
    if(Math.abs(value)<.001||Math.abs(value)>=1e5)return value.toExponential(5);
    var text=value.toFixed(digits===undefined?3:digits);
    return text.indexOf(".")<0?text:text.replace(/0+$/,"").replace(/\.$/,"");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function chart(api,doc,result,prefix){
    var left=70,top=55,width=690,height=235,max=Math.max(1,result.firstPath.length+1),span=result.config.horizon||1;
    var mx=function(t){return left+t/span*width;},my=function(n){return top+(max-n)/max*height;},nodes=[];
    function add(tag,attrs,text){nodes.push(svgElement(api,doc,tag,attrs,text));}
    add("title",{id:prefix+"-chart-title"},"固定种子的 Poisson 计数路径");
    add("desc",{id:prefix+"-chart-desc"},"实心点是到达时的计数；空心点是到达前的左极限。竖线只标记跳变，不表示同一时刻取全部中间值。");
    add("text",{x:25,y:23,"font-size":17},"一条路径：实心为 N(t)，空心为到达前的左极限");
    add("text",{x:25,y:44,"font-size":13},"seed="+result.config.seed+"；观察窗 T="+format(result.config.horizon)+"；本条事件数 "+result.firstPath.length);
    add("line",{className:"pp-axis",x1:left,y1:top+height,x2:left+width,y2:top+height});
    add("line",{className:"pp-axis",x1:left,y1:top,x2:left,y2:top+height});
    var step=Math.max(1,Math.ceil(max/5));
    for(var n=0;n<=max;n+=step){add("line",{className:"pp-grid",x1:left,y1:my(n),x2:left+width,y2:my(n)});add("text",{x:left-10,y:my(n)+4,"text-anchor":"end","font-size":12},String(n));}
    [0,.25,.5,.75,1].forEach(function(f){add("text",{x:left+f*width,y:top+height+22,"text-anchor":"middle","font-size":12},format(f*span,2));});
    add("line",{className:"pp-split",x1:mx(result.half),y1:top,x2:mx(result.half),y2:top+height});
    add("text",{x:mx(result.half)+6,y:top+16,"font-size":12},"T/2");
    var points=[{time:0,count:0}];result.firstPath.forEach(function(t,i){points.push({time:t,count:i},{time:t,count:i+1});});points.push({time:result.config.horizon,count:result.firstPath.length});
    add("path",{className:"pp-path",d:points.map(function(p,i){return(i?"L":"M")+mx(p.time)+" "+my(p.count);}).join(" ")});
    result.firstPath.forEach(function(t,i){
      add("circle",{className:"pp-left-limit","data-time":t,"data-count":i,cx:mx(t),cy:my(i),r:3.6});
      add("circle",{className:"pp-event","data-time":t,"data-count":i+1,cx:mx(t),cy:my(i+1),r:3.6});
    });
    add("text",{x:785,y:312,"font-size":13},"t");
    add("text",{x:25,y:340,"font-size":13},"金线分开 (0,T/2] 与 (T/2,T]；两边的计数不必相等。");
    add("text",{x:25,y:365,"font-size":13},"竖线只标跳变。固定种子的有限伪随机路径不能证明过程公理。");
    return svgElement(api,doc,"svg",{className:"pp-chart",viewBox:"0 0 820 385",role:"img","aria-labelledby":prefix+"-chart-title "+prefix+"-chart-desc"},nodes);
  }
  function histogramChart(api,doc,result,prefix){
    var h=result.histogram,columns=h.bins.concat([{k:"tail",empirical:0,theory:h.tail}]),maximum=Math.max.apply(null,columns.map(function(b){return Math.max(b.empirical,b.theory);}))*1.12;
    var left=70,top=75,width=690,height=220,bw=width/columns.length,nodes=[];
    function add(tag,attrs,text){nodes.push(svgElement(api,doc,tag,attrs,text));}
    add("title",{id:prefix+"-hist-title"},"所有重复计数的经验频率与理论 Poisson 概率");
    add("text",{x:25,y:25,"font-size":17},"重复抽样：蓝色经验频率，金色理论概率");
    add("text",{x:25,y:50,"font-size":13},"全部 "+result.config.repetitions+" 次计数均入图；最右栏是超过 "+h.cutoff+" 次的理论尾部。");
    [0,.25,.5,.75,1].forEach(function(t){var y=top+height-height*t;add("line",{className:"pp-grid",x1:left,y1:y,x2:left+width,y2:y});add("text",{x:left-10,y:y+4,"text-anchor":"end","font-size":12},format(maximum*t,3));});
    var tick=Math.max(1,Math.ceil(h.bins.length/7));
    columns.forEach(function(b,i){
      ["empirical","theory"].forEach(function(key,j){var value=b[key];add("rect",{className:key==="empirical"?"pp-hist-empirical":"pp-hist-theory","data-k":b.k,"data-value":value,x:left+bw*(i+.1+.4*j),y:top+height-height*value/maximum,width:bw*.35,height:height*value/maximum});});
      if(i%tick===0||b.k==="tail")add("text",{x:left+bw*(i+.5),y:318,"text-anchor":"middle","font-size":12},b.k==="tail"?">"+h.cutoff:String(b.k));
    });
    add("text",{x:25,y:345,"font-size":13},"尾部理论概率 "+format(h.tail)+"；本批尾部经验频率为 0，因为分界取本批最大计数。");
    add("text",{x:25,y:370,"font-size":13},"没有观察到，不等于理论概率为零；单次样本偏离理论也不自动表示模型错误。");
    return svgElement(api,doc,"svg",{className:"pp-chart",viewBox:"0 0 820 390",role:"img","aria-labelledby":prefix+"-hist-title","data-prob-max":maximum},nodes);
  }

  function row(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function metric(api, doc, label, value) {
    return element(api, doc, "div", { className: "pp-metric" }, [element(api, doc, "span", {}, label), element(api, doc, "strong", {}, value)]);
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "pp-" + SERIAL;
    var state = { config: copyConfig(DEFAULTS), revealed: false, predictions: { rate: null, increments: null, memoryless: null, proof: null } };
    var questions = [
      {
        key: "rate",
        prompt: "λ=2 次/小时首先表示什么？",
        choices: [
          { value: "rate", label: "单位时间平均计数率" },
          { value: "probability", label: "每小时恰好来一次的概率" },
          { value: "wait", label: "每次等待时间都等于 1/2" }
        ],
        expected: "rate"
      },
      {
        key: "increments",
        prompt: "Poisson 过程在两个不重叠区间上的计数增量怎样？",
        choices: [
          { value: "independent", label: "独立，且只看区间长度" },
          { value: "same", label: "一定相等" },
          { value: "dependent", label: "前一段越多后一段越少" }
        ],
        expected: "independent"
      },
      {
        key: "memoryless",
        prompt: "已经等了 u 仍未到达，再等 v 的条件尾概率怎样读？",
        choices: [
          { value: "memoryless", label: "等于直接等 v 的尾概率" },
          { value: "sum", label: "一定等于两次尾概率之和" },
          { value: "zero", label: "知道 u 后必为零" }
        ],
        expected: "memoryless"
      },
      {
        key: "proof",
        prompt: "一条有限 seed 模拟路径能证明 Poisson 过程公理吗？",
        choices: [
          { value: "no-proof", label: "不能，只能作直觉/校准" },
          { value: "proof", label: "能，路径就是公理证明" },
          { value: "exact", label: "能证明每个样本都服从公理" }
        ],
        expected: "no-proof"
      }
    ];
    var gate = element(api, doc, "section", { className: "pp-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先分开计数、增量和等待时间"));
    gate.appendChild(element(api, doc, "p", { className: "pp-intro" }, "先完成四项预测；提交前不显示阶梯路径、计数均值、增量协方差或无记忆性结果。"));
    questions.forEach(function (question) {
      var fieldset = element(api, doc, "fieldset", { className: "pp-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var choiceRow = element(api, doc, "div", { className: "pp-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; state.revealed=false; stage.hidden=true; feedback.textContent="预测已修改；请重新提交。"; renderPrediction(); });
        choice.button = button;
        choiceRow.appendChild(button);
      });
      fieldset.appendChild(choiceRow);
      gate.appendChild(fieldset);
    });
    var actions = element(api, doc, "div", { className: "pp-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "pp-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "pp-feedback", "aria-live": "polite" }, "");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);

    var stage = element(api, doc, "section", { className: "pp-revealed", tabindex: "-1", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(api, doc, "h4", { id: prefix + "-result-title" }, "揭示实验：计数路径、增量账本与等待尾部"));
    stage.appendChild(element(api, doc, "p", { className: "pp-note" }, "切换 λ、观察时长或重复次数后，固定 seed 的一条路径与重复抽样表格同步重算。两幅图和账本均可横向滚动；键盘先聚焦图框或账本，再用左右方向键。有限模拟不是过程公理的证明。"));
    var layout = element(api, doc, "div", { className: "pp-layout" });
    var controls = element(api, doc, "section", { className: "pp-controls", "aria-labelledby": prefix + "-controls-title" });
    controls.appendChild(element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"));
    function rangeControl(label, key, min, max, step, digits) {
      var output = element(api, doc, "output", {}, format(state.config[key], digits));
      var input = element(api, doc, "input", { id: prefix+"-"+key, type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); renderResult(); });
      return element(api, doc, "div", { className: "pp-control" }, [element(api, doc, "label", {htmlFor:prefix+"-"+key}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("计数率 λ", "lambda", 0.5, 8, 0.5, 1));
    controls.appendChild(rangeControl("观察时长 T", "horizon", 1, 12, 0.5, 1));
    controls.appendChild(rangeControl("重复次数", "repetitions", 40, 180, 10, 0));
    controls.appendChild(element(api, doc, "p", { className: "pp-note" }, "λ 是单位时间的平均计数率；等待时间的均值是 1/λ。T/2 两侧是不重叠区间。"));
    var seedInput=element(api,doc,"input",{type:"number",min:"0",max:"4294967295",step:"1",id:prefix+"-seed","aria-label":"随机种子 seed",value:String(state.config.seed)});
    var nextSeed=element(api,doc,"button",{type:"button"},"下一个 seed");
    var seedRow=element(api,doc,"div",{className:"pp-seed"},[element(api,doc,"label",{htmlFor:prefix+"-seed"},"随机种子 seed"),seedInput,nextSeed]);
    seedInput.addEventListener("change",function(){
      var v=seedInput.valueAsNumber;
      try{bounded(v,"seed",0,4294967295,true);state.config.seed=v;renderResult();}
      catch(e){seedInput.value=String(state.config.seed);feedback.textContent="seed 必须是 0 至 4294967295 的整数；已保留上一有效值。";}
    });
    nextSeed.addEventListener("click",function(){state.config.seed=(state.config.seed+1)%4294967296;seedInput.value=String(state.config.seed);renderResult();});
    controls.appendChild(seedRow);
    controls.appendChild(element(api,doc,"p",{className:"pp-note"},"固定 seed 可复现本次算法；换 seed 观察样本波动。32 位伪随机网格与双精度仅近似连续模型，指数分布的理论尾部没有有限上界。"));
    layout.appendChild(controls);

    var stageFrame = element(api, doc, "div", { className: "pp-stage-frame" });
    var chartHost = element(api, doc, "div", {className:"pp-chart-region", role:"region", tabindex:"0", "aria-label":"可横向滚动的路径与计数直方图"});
    var metrics = element(api, doc, "div", { className: "pp-metrics", "aria-label": "Poisson 指标" });
    var ledger = element(api, doc, "div", { className: "pp-ledger", role:"region", tabindex:"0", "aria-label":"可横向滚动的Poisson统计账本" });
    stageFrame.appendChild(chartHost);
    stageFrame.appendChild(metrics);
    stageFrame.appendChild(ledger);
    layout.appendChild(stageFrame);
    stage.appendChild(layout);
    stage.appendChild(element(api, doc, "p", { className: "pp-caution" }, "边界读法：计数率不等于“每个单位时间恰好一次的概率”；独立平稳增量是过程定义的一部分；指数等待时间与无记忆性是等价刻画；有限路径只能帮助校准这些公式，不能从样本图证明公理。"));
    root.replaceChildren(gate, stage);
    if (root.classList) root.classList.add("pp-lab");

    function renderPrediction() {
      reveal.disabled=state.revealed||questions.some(function(q){return state.predictions[q.key]===null;});
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); });
      });
    }

    function syncControls() {
      seedInput.value=String(state.config.seed);
      controls.querySelectorAll("input[type=range]").forEach(function (input) {
        var label = input.getAttribute("aria-label");
        var key = label === "计数率 λ" ? "lambda" : label === "观察时长 T" ? "horizon" : "repetitions";
        input.value = String(state.config[key]);
        var output = input.parentNode.querySelector("output");
        if (output) output.textContent = format(state.config[key], key === "repetitions" ? 0 : 1);
      });
    }

    function renderResult() {
      if (!state.revealed) return;
      var result = simulate(state.config);
      state.config = result.config;
      replaceChildren(chartHost, [chart(api, doc, result, prefix),histogramChart(api,doc,result,prefix)]);
      replaceChildren(metrics, [
        metric(api, doc, "理论 E[N(T)]", format(result.expectedFull, 2)),
        metric(api, doc, "经验 Var[N(T)]", format(result.empiricalVariance, 2)),
        metric(api, doc, "经验 E[N(T)]", format(result.empiricalFull, 3)),
        metric(api, doc, "无记忆条件尾", format(result.memorylessConditional, 3))
      ]);
      var table = element(api, doc, "table", {});
      table.appendChild(element(api, doc, "caption", {}, "样本方差/协方差用 R−1 作分母；标准误来自模型，不是样本必落其中的误差界。"));
      table.appendChild(element(api, doc, "thead", {}, [row(api, doc, ["量", "实验", "理论/基准", "读法"]) ]));
      var rows = [
        ["N(T/2) 均值",format(result.empiricalHalf),format(result.expectedHalf),"区间 (0,T/2]"],
        ["N(T)−N(T/2) 均值",format(result.empiricalSecondHalf),format(result.expectedHalf),"区间 (T/2,T]"],
        ["两段样本协方差",format(result.incrementCovariance),"0","接近零不证明独立；偏离零可来自有限抽样"],
        ["N(T) 均值",format(result.empiricalFull),format(result.expectedFull),"均值标准误 √(λT/R)="+format(result.countMeanSE)],
        ["N(T) 样本方差",format(result.empiricalVariance),format(result.expectedFull),"使用 R−1 分母"],
        ["另抽的完整等待 W 均值",format(result.meanWait),format(result.expectedWait),"标准误 1/(λ√R)="+format(result.waitMeanSE)],
        ["尾部阈值 u、v",format(result.u)+"，"+format(result.v),"u=0.4/λ，v=0.6/λ","同一组完整等待样本；单位与时间轴相同"],
        ["条件尾 P(W>u+v | W>u)",result.survivesU?result.survivesUV+"/"+result.survivesU+" = "+format(result.memorylessConditional):"未定义：没有 W>u 的样本",format(result.memorylessTheoretical),"分母是存活到 u 的样本数，不是全部 R"],
        ["无条件尾 P(W>v)",result.survivesV+"/"+result.config.repetitions+" = "+format(result.memorylessTail),format(result.memorylessTheoretical),"与条件频率来自同一批样本，两估计不是独立的"]
      ];
      table.appendChild(element(api, doc, "tbody", {}, rows.map(function (items) { return row(api, doc, items); })));
      replaceChildren(ledger,[table,element(api,doc,"p",{className:"pp-note"},"等待样本在每条计数路径之外另行抽取，没有被观察窗口截尾。只统计窗口内已完成的短间隔，会产生选择偏差，不能直接拿它们估计无条件等待均值。")]);
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成四个预测。";
        feedback.className = "pp-feedback pp-warn";
        return;
      }
      state.revealed = true;
      renderPrediction();
      stage.hidden = false;
      syncControls();
      renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；现在可以改变 λ 与 T，观察计数和等待两本账。";
      feedback.className = "pp-feedback " + (correct === questions.length ? "pp-pass" : "pp-warn");
      stage.focus();
      announce(api, root, feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { rate: null, increments: null, memoryless: null, proof: null };
      stage.hidden = true;
      feedback.textContent = "已重置；答案与过程账本再次隐藏。";
      feedback.className = "pp-feedback";
      renderPrediction();
      syncControls();
      questions[0].choices[0].button.focus();
      announce(api, root, "Poisson 过程预测与实验已重置。");
    });
    renderPrediction();
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("poisson-process self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    close(poissonPmf(0, 2), Math.exp(-2), 1e-12, "Poisson zero mass");
    close(poissonPmf(2, 2), 2 * Math.exp(-2), 1e-12, "Poisson mass");
    close(exponential(function () { return Math.exp(-1); }, 2), 0.5, 1e-12, "exponential inverse");
    var rngA = makeRng(7);
    var rngB = makeRng(7);
    assert(rngA() === rngB() && rngA() === rngB(), "fixed RNG reproducibility");
    var path = simulatePath(2, 4, makeRng(11));
    assert(path.every(function (time, index) { return time > 0 && time <= 4 && (index === 0 || time > path[index - 1]); }), "path event ordering");
    var resultA = simulate(DEFAULTS);
    var resultB = simulate(DEFAULTS);
    assert(JSON.stringify(resultA) === JSON.stringify(resultB), "fixed seed simulation reproducibility");
    assert(resultA.firstPath.length === resultA.firstPath.filter(function (time) { return time <= DEFAULTS.horizon; }).length, "path horizon");
    assert(resultA.fullCounts.length === DEFAULTS.repetitions, "replication count");
    assert(resultA.expectedFull === DEFAULTS.lambda * DEFAULTS.horizon, "count rate bridge");
    assert(resultA.expectedWait === 1 / DEFAULTS.lambda, "waiting rate bridge");
    assert(resultA.memorylessTheoretical === Math.exp(-0.6), "memoryless benchmark");
    var fast = simulate({ lambda: 8, horizon: 1, repetitions: 40, seed: 3 });
    assert(fast.expectedFull === 8 && fast.expectedWait === 0.125, "parameter linkage");
    var threw = false;
    try { exponential(makeRng(1), 0); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "nonpositive rate rejected");
    threw = false;
    try { simulatePath(2, Infinity, makeRng(1)); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "infinite horizon rejected");
    threw = false;
    try { copyConfig({ horizon: NaN }); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "nonfinite config rejected");
    threw=false;try{poissonPmf(-1,2);}catch(error){threw=error instanceof RangeError;}assert(threw,"invalid mass rejected");
    threw=false;try{copyConfig({lambda:99});}catch(error){threw=error instanceof RangeError;}assert(threw,"out-of-range config is not silently clamped");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    copyConfig: copyConfig,
    histogram: histogram,
    format: format,
    chart: chart,
    histogramChart: histogramChart,
    makeRng: makeRng,
    exponential: exponential,
    poissonPmf: poissonPmf,
    simulatePath: simulatePath,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
