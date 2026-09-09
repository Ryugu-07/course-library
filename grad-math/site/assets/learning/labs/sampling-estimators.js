(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("sampling-estimators", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("sampling-estimators self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("sampling-estimators self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-sampling-estimators-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    { id: "normal", label: "正态 · N(10,4)", mean: 10, variance: 4, kind: "normal", note: "均值抽样分布精确正态；S^2 的正态总体定理可用。" },
    { id: "skewed", label: "偏斜 · Exp(1)", mean: 1, variance: 1, kind: "exponential", note: "i.i.d. 且有限方差；有限 n 仍可能右偏，CLT 只给渐近近似。" },
    { id: "clustered", label: "相关 · 共同冲击", mean: 0, variance: 2, kind: "clustered", note: "X_i=Z+ε_i；样本内相关，均值波动有不消失的共同项。" },
    { id: "heavy", label: "重尾 · Pareto(1,1.5)", mean: 3, variance: null, kind: "pareto", note: "均值存在而方差不存在；经典有限方差 CLT 不适用。" }
  ];

  var STYLE_TEXT = [
    ".se-lab{--se-blue:#315f9d;--se-gold:var(--cl-gold,#9b6a12);--se-green:var(--cl-green,#39734d);--se-red:var(--cl-red,#b64335);--se-muted:var(--fg-soft,#706b62);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".se-lab [hidden]{display:none!important;}",
    ".se-lab *,.se-lab *::before,.se-lab *::after{box-sizing:border-box;}.se-lab h3,.se-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.se-lab h3{font-size:1.18rem;}.se-lab h4{font-size:1rem;}",
    ".se-lab button,.se-lab input,.se-lab select{font:inherit;}.se-lab button,.se-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}.se-lab button{min-width:0;padding:8px 11px;cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}.se-lab button:hover{border-color:var(--accent);}.se-lab button:disabled{cursor:not-allowed;opacity:.55;}.se-lab button[aria-pressed=true],.se-lab .se-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".se-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.se-lab button:focus-visible,.se-lab input:focus-visible,.se-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".se-lab .se-intro,.se-lab .se-note,.se-lab .se-feedback,.se-lab .se-chart-note{color:var(--se-muted);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.se-lab .se-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--se-gold);background:var(--block-bg,var(--bg));}.se-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.se-lab legend{max-width:100%;padding:0;font-weight:750;line-height:1.45;overflow-wrap:anywhere;}.se-lab .se-question-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.se-lab .se-question{min-width:0;padding:9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.se-lab .se-choice-list{display:grid;gap:6px;margin-top:8px;}.se-lab .se-choice-list button{width:100%;min-height:44px;text-align:left;font-size:12.5px;}.se-lab .se-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;}.se-lab .se-actions>*{flex:1 1 160px;}.se-lab .se-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.se-lab .se-pass{color:var(--se-green);}.se-lab .se-warn{color:var(--se-red);}",
    ".se-lab .se-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.se-lab .se-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:15px;align-items:start;min-width:0;}.se-lab .se-controls,.se-lab .se-stage{min-width:0;}.se-lab .se-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.se-lab .se-control{display:grid;gap:5px;min-width:0;}.se-lab .se-control label,.se-lab .se-control-title{color:var(--se-muted);font-size:13px;font-weight:700;}.se-lab .se-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.se-lab .se-preset-grid,.se-lab .se-estimator-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.se-lab .se-preset-grid button,.se-lab .se-estimator-grid button{font-size:12px;}.se-lab .se-scale{display:flex;justify-content:space-between;color:var(--se-muted);font-size:11px;}",
    ".se-lab .se-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.se-lab .se-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--se-muted);font-size:13px;}.se-lab .se-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg);}.se-lab .se-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.se-lab .se-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1;}.se-lab .se-axis{stroke:currentColor;stroke-opacity:.62;stroke-width:1.2;}.se-lab .se-bar{fill:var(--se-blue);fill-opacity:.62;}.se-lab .se-theory{fill:none;stroke:var(--se-gold);stroke-width:2.5;stroke-linecap:round;}.se-lab .se-target{stroke:var(--se-red);stroke-width:2;stroke-dasharray:6 4;}.se-lab .se-observed{stroke:var(--se-green);stroke-width:2;stroke-dasharray:2 4;}.se-lab .se-label{font-size:13px;fill:var(--se-muted)!important;}.se-lab .se-title{font-size:13px;font-weight:750;}",
    ".se-lab .se-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px;}.se-lab .se-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.se-lab .se-metric:nth-child(4n+1){border-color:var(--se-blue);}.se-lab .se-metric:nth-child(4n+2){border-color:var(--se-gold);}.se-lab .se-metric:nth-child(4n+3){border-color:var(--se-green);}.se-lab .se-metric:nth-child(4n){border-color:var(--se-red);}.se-lab .se-metric span{display:block;color:var(--se-muted);font-size:11px;line-height:1.4;}.se-lab .se-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}.se-lab .se-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.se-lab table{display:table;width:100%;min-width:800px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.se-lab caption{padding:0 0 7px;text-align:left;color:var(--se-muted);font-size:12px;}.se-lab th,.se-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.se-lab th{color:var(--se-muted);font-size:11.5px;font-weight:750;}.se-lab .se-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--se-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.se-lab .se-caution{margin:10px 0 0;color:var(--se-muted);font-size:12px;line-height:1.65;}",
    ".se-lab .se-chart-scroll{overflow-x:auto;max-width:100%}.se-lab .se-chart-scroll:focus-visible,.se-lab .se-table-wrap:focus-visible{outline:3px solid var(--accent)}[data-theme=dark] .se-lab{--se-blue:#89b8f5;--se-green:#92c7a0;--se-red:#ef998c;--se-gold:#d9bb73;}@media(max-width:900px){.se-lab .se-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:720px){.se-lab .se-question-grid{grid-template-columns:minmax(0,1fr);}.se-lab .se-preset-grid,.se-lab .se-estimator-grid{grid-template-columns:minmax(0,1fr);}.se-lab .se-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:430px){.se-lab .se-stage-frame{padding:5px;}.se-lab table{font-size:11.5px;}.se-lab th,.se-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.se-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || EPS) * scale; }
  function format(value, digits) {
    if (value === null || value === undefined) return "不定义";
    if (value === Infinity) return "∞";
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value)>=10000)) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function presetById(id) {var p=PRESETS.find(function(p){return p.id===id;});if(!p)throw new RangeError('未知总体');return p;}
  function integer(v,d,min,max){if(v===undefined)return d;if(!Number.isInteger(v)||v<min||v>max)throw new RangeError('整数参数超出范围');return v;}
  function normalizeN(v){return integer(v,20,5,100);}
  function normalizeR(v){return integer(v,120,40,240);}
  function normalizeB(v){return integer(v,120,40,240);}
  function normalizeEstimator(v){if(v===undefined)return 'mean';if(v!=='mean'&&v!=='variance')throw new RangeError('未知统计量');return v;}

  function hashSeed(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0) || 1;
  }
  function rngFrom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function unit(rng){if(typeof rng!=='function')throw new TypeError('需要随机数函数');var u=rng();if(!finite(u)||u<0||u>=1)throw new RangeError('随机数必须位于[0,1)');return u;}
  function normal(rng) {
    var u = 1-unit(rng);
    var v = unit(rng);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function exponential(rng) { return -Math.log1p(-unit(rng)); }
  function pareto(rng) { return Math.pow(1-unit(rng), -2 / 3); }
  function sampleReplicate(modelId, n, rng) {
    presetById(modelId);normalizeN(n);if(n===undefined)throw new RangeError("需要n");
    var values = [];
    var i;
    if (modelId === "clustered") {
      var common = normal(rng);
      for (i = 0; i < n; i += 1) values.push(common + normal(rng));
      return values;
    }
    for (i = 0; i < n; i += 1) {
      if (modelId === "normal") values.push(10 + 2 * normal(rng));
      else if (modelId === "skewed") values.push(exponential(rng));
      else values.push(pareto(rng));
    }
    return values;
  }
  function checkValues(v,min){if(!Array.isArray(v)||v.length<min||!v.every(finite))throw new RangeError("需要有限样本数组");}
  function sampleMean(values) { checkValues(values,1); var scale=Math.max.apply(null,values.map(Math.abs));if(scale===0)return 0;return (values.reduce(function(sum,v){return sum+v/scale;},0)/values.length)*scale; }
  function sampleVariance(values) {
    checkValues(values,2);
    var meanValue = sampleMean(values);
    return values.reduce(function (sum, value) { return sum + Math.pow(value - meanValue, 2); }, 0) / (values.length - 1);
  }
  function statistic(values, estimator) { return normalizeEstimator(estimator) === "variance" ? sampleVariance(values) : sampleMean(values); }
  function populationParameter(modelId, estimator) {
    var model = presetById(modelId);
    return normalizeEstimator(estimator) === "variance" ? model.variance : model.mean;
  }
  function theory(modelId,estimator,n){
    var model=presetById(modelId);estimator=normalizeEstimator(estimator);normalizeN(n);if(n===undefined)throw new RangeError('需要n');
    var mean,variance,law;
    if(estimator==='mean'){
      mean=model.mean;variance=modelId==='heavy'?Infinity:modelId==='clustered'?1+1/n:model.variance/n;
      law=modelId==='normal'?'精确 N(10,4/n)':modelId==='clustered'?'精确 N(0,1+1/n)':modelId==='skewed'?'精确 Gamma(n, scale=1/n)':'均值存在；方差和MSE无穷';
    }else{
      mean=modelId==='heavy'?Infinity:modelId==='clustered'?1:model.variance;
      variance=modelId==='heavy'?Infinity:modelId==='skewed'?8/n+2/(n*(n-1)):2*mean*mean/(n-1);
      law=modelId==='normal'?'精确 4χ²(n−1)/(n−1)':modelId==='clustered'?'精确 χ²(n−1)/(n−1)，只测簇内噪声':modelId==='skewed'?'精确矩可算；不套正态总体χ²律':'S²有限样本值仍有限，理论期望无穷';
    }
    var target=populationParameter(modelId,estimator),bias=target===null?null:mean-target;
    return {mean:mean,variance:variance,sd:Math.sqrt(variance),bias:bias,mse:target===null?null:variance+bias*bias,law:law};
  }
  function theoreticalSE(modelId,estimator,n){var t=theory(modelId,estimator,n);return finite(t.sd)?t.sd:null;}
  function cltAllowed(modelId,estimator){return normalizeEstimator(estimator)==='mean'&&(modelId==='normal'||modelId==='skewed');}
  function distributionDescription(modelId,estimator,n){return theory(modelId,estimator,n).law;}
  function bootstrapTheory(values,estimator){
    checkValues(values,2);estimator=normalizeEstimator(estimator);var n=values.length,mean=sampleMean(values),squares=values.map(function(v){return (v-mean)*(v-mean);}),m2=sampleMean(squares);
    var varSquare=sampleMean(squares.map(function(v){return (v-m2)*(v-m2);}));
    return {mean:estimator==='mean'?mean:m2,variance:estimator==='mean'?m2/n:(varSquare+2*m2*m2/(n-1))/n};
  }
  function consistency(modelId,estimator){if(estimator==='variance')return modelId==='heavy'?'不存在有限方差目标':modelId==='clustered'?'S²趋向1，不趋向边际方差2':'S²依概率趋向总体方差';return modelId==='clustered'?'样本均值保留共同冲击，不一致':modelId==='heavy'?'有限均值：强LLN仍适用；经典CLT不适用':'样本均值一致';}
  function logGamma(z){var c=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];z-=1;var x=.99999999999980993;for(var i=0;i<c.length;i++)x+=c[i]/(z+i+1);var t=z+7.5;return .9189385332046727+(z+.5)*Math.log(t)-t+Math.log(x);}
  function gammaDensity(x,k,scale){if(x<=0)return 0;return Math.exp((k-1)*Math.log(x)-x/scale-logGamma(k)-k*Math.log(scale));}
  function densityAt(data,x){if(data.modelId==='heavy'||(data.modelId==='skewed'&&data.estimator==='variance'))return null;if(data.estimator==='mean'){if(data.modelId==='skewed')return gammaDensity(x,data.n,1/data.n);return normalDensity((x-data.theory.mean)/data.theory.sd)/data.theory.sd;}return gammaDensity(x,(data.n-1)/2,2*data.theory.mean/(data.n-1));}
  function bootstrapStatus(modelId) {
    if (modelId === "normal") return "可作近似诊断；精确正态理论仍是基准。";
    if (modelId === "skewed") return "可能捕捉有限样本偏斜，但需检查样本量和尾部。";
    if (modelId === "clustered") return "普通重抽样看不到跨簇共同冲击；单独一簇不能靠增加B补出独立簇。";
    return "无限方差下普通 bootstrap 不提供无条件一致性保证。";
  }

  function summarize(values) {
    var meanValue = sampleMean(values);
    var varianceValue = values.length ? values.reduce(function (sum, value) { return sum + Math.pow(value - meanValue, 2); }, 0) / values.length : 0;
    return { mean: meanValue, variance: varianceValue, sd: Math.sqrt(Math.max(0, varianceValue)) };
  }
  function histogram(values, bins) {
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    if (!finite(min) || !finite(max)) { min = 0; max = 1; }
    if (near(min, max)) { min -= 1; max += 1; }
    var width = (max - min) / bins;
    var counts = [];
    for (var i = 0; i < bins; i += 1) counts.push(0);
    values.forEach(function (value) { var index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width))); counts[index] += 1; });
    return { min: min, max: max, width: width, counts: counts };
  }
  function compute(input) {
    if(input===undefined)input={};if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('需要参数对象');
    var modelId=input.modelId===undefined?'normal':input.modelId,model=presetById(modelId);
    var estimator=normalizeEstimator(input.estimator),n=normalizeN(input.n),repetitions=normalizeR(input.repetitions),bootstrap=normalizeB(input.bootstrap);
    var sampleRng = rngFrom(hashSeed("sampling-observed:" + modelId + ":" + n));
    var observed = sampleReplicate(modelId, n, sampleRng);
    var repeatRng = rngFrom(hashSeed("sampling-repeated:" + modelId + ":" + n));
    var values = [];
    for (var r = 0; r < repetitions; r += 1) values.push(statistic(sampleReplicate(modelId, n, repeatRng), estimator));
    var bootstrapRng = rngFrom(hashSeed("sampling-bootstrap:" + modelId + ":" + n));
    var bootstrapValues = [];
    for (var b = 0; b < bootstrap; b += 1) {
      var resample = [];
      for (var j = 0; j < n; j += 1) resample.push(observed[Math.floor(bootstrapRng() * observed.length)]);
      bootstrapValues.push(statistic(resample, estimator));
    }
    var summary = summarize(values);
    var bootSummary = summarize(bootstrapValues);
    var target = populationParameter(modelId, estimator);
    var bias = target === null ? null : summary.mean - target;
    var mse = target === null ? null : summary.variance + bias * bias;
    return {
      model: model,
      theory:theory(modelId,estimator,n),
      bootstrapTheory:bootstrapTheory(observed,estimator),
      consistency:consistency(modelId,estimator),
      modelId: modelId,
      estimator: estimator,
      n: n,
      repetitions: repetitions,
      bootstrap: bootstrap,
      observed: observed,
      values: values,
      bootstrapValues: bootstrapValues,
      histogram: histogram(values, 24),
      target: target,
      samplingMean: summary.mean,
      samplingVariance: summary.variance,
      samplingSD: summary.sd,
      bias: bias,
      mse: mse,
      bootstrapMean: bootSummary.mean,
      bootstrapSE:bootSummary.sd*Math.sqrt(bootstrap/(bootstrap-1)),
      theoreticalSE: theoreticalSE(modelId, estimator, n),
      cltAllowed: cltAllowed(modelId, estimator),
      distributionDescription: distributionDescription(modelId, estimator,n),
      bootstrapStatus: bootstrapStatus(modelId)
    };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if(key === "text")node.textContent=String(value);
      else if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child))); });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function ensureStyles(doc) { if (!doc.getElementById(STYLE_ID)) { var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); } }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label, value) { var node = element(doc, "div", { className: "se-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); return { node: node, value: node.lastChild }; }
  function px(value, min, max, left, width) { return left + (value - min) * width / (max - min); }
  function py(value, min, max, top, height) { return top + height - (value - min) * height / (max - min); }
  function path(points) { return points.map(function (point, index) { return (index ? "L" : "M") + format(point[0], 2) + "," + format(point[1], 2); }).join(" "); }
  function normalDensity(value) { return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI); }

  function drawSvg(doc,data,uid){
    var allValues=data.values.concat(data.bootstrapValues),observed=statistic(data.observed,data.estimator);
    allValues.push(observed);if(data.target!==null)allValues.push(data.target);
    var min=Math.min.apply(null,allValues),max=Math.max.apply(null,allValues),pad=(max-min)*.04||1;
    min-=pad;max+=pad;if(data.estimator==='variance')min=Math.max(0,min);
    var bins=24,bw=(max-min)/bins,left=70,top=110,w=650,h=270;
    function counts(vs){var c=Array(bins).fill(0);vs.forEach(function(v){c[Math.min(bins-1,Math.floor((v-min)/bw))]++;});return c;}
    var rc=counts(data.values),bc=counts(data.bootstrapValues),densities=rc.map(function(v){return v/(data.repetitions*bw);}).concat(bc.map(function(v){return v/(data.bootstrap*bw);}));
    var curve=[];for(var i=0;i<=400;i++){var x=min+(max-min)*i/400,dy=densityAt(data,x);if(dy!==null){curve.push([x,dy]);densities.push(dy);}}
    var yMax=Math.max.apply(null,densities)*1.13;
    function sx(x){return left+(x-min)/(max-min)*w;}function sy(y){return top+h-y/yMax*h;}
    var svg=svgElement(doc,'svg',{className:'se-svg',viewBox:'0 0 760 455',role:'img','aria-labelledby':uid+'-title'});
    function add(tag,a,t){var node=svgElement(doc,tag,a,t===undefined?[]:[t]);svg.appendChild(node);return node;}
    add('title',{id:uid+'-title'},'重新抽样与给定观测的bootstrap经验密度；完整显示所有模拟样本');
    add('text',{class:'se-title',x:20,y:22},data.model.label+' · '+(data.estimator==='mean'?'样本均值':'样本方差')+' · n='+data.n+' · R='+data.repetitions+' · B='+data.bootstrap);
    add('text',{class:'se-label',x:70,y:46,style:'fill:var(--se-blue)!important'},'蓝柱：重复抽样');
    add('text',{class:'se-label',x:285,y:46,style:'fill:#a581c4!important'},'紫阶梯：普通bootstrap');
    add('text',{class:'se-label',x:520,y:46},curve.length?'金线：精确理论密度':'此组合不画理论密度');
    add('text',{class:'se-label',x:70,y:73},'目标参数：'+format(data.target,4)+'；当前统计量：'+format(observed,4));
    add('text',{class:'se-label',x:70,y:96},'密度（每组柱/阶梯全面积为1）');
    for(var j=0;j<=4;j++){var x=min+(max-min)*j/4,y=yMax*j/4;add('line',{class:'se-grid',x1:sx(x),x2:sx(x),y1:top,y2:top+h});add('text',{class:'se-label',x:sx(x),y:top+h+24,'text-anchor':'middle'},format(x,3));add('line',{class:'se-grid',x1:left,x2:left+w,y1:sy(y),y2:sy(y)});add('text',{class:'se-label',x:left-8,y:sy(y)+4,'text-anchor':'end'},format(y,3));}
    for(var k=0;k<bins;k++)add('rect',{class:'se-bar',x:sx(min+k*bw),y:sy(rc[k]/(data.repetitions*bw)),width:w/bins,height:rc[k]/(data.repetitions*bw)/yMax*h,'data-bin':k});
    var pts=[];for(var k=0;k<bins;k++){var y=sy(bc[k]/(data.bootstrap*bw));pts.push([sx(min+k*bw),y],[sx(min+(k+1)*bw),y]);}add('path',{d:path(pts),fill:'none',stroke:'#a581c4','stroke-width':2,'data-bootstrap':true});
    if(curve.length)add('path',{class:'se-theory',d:path(curve.map(function(p){return[sx(p[0]),sy(p[1])];}))});
    if(data.target!==null)add('line',{class:'se-target',x1:sx(data.target),x2:sx(data.target),y1:top,y2:top+h});
    add('line',{class:'se-observed',x1:sx(observed),x2:sx(observed),y1:top,y2:top+h});
    add('text',{class:'se-label',x:380,y:440,'text-anchor':'middle'},'统计量取值；红虚线：目标参数，绿虚线：本次统计量');
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var uid = "se-" + (++INSTANCE);
    var state = { modelId: "normal", estimator: "mean", n: 20, repetitions: 120, bootstrap: 120, predictions: { objects: null, sampling: null, clt: null, bootstrap: null }, score: 0 };
    var shell = element(doc, "div", { className: "se-lab" });
    var form = element(doc, "form", { className: "se-prediction" });
    var revealed = element(doc, "section", { className: "se-revealed", hidden: true, tabindex:"-1", "aria-label": "抽样与估计量实验结果" });
    var feedback = element(doc, "p", { className: "se-feedback", role: "status", "aria-live": "polite", text: "请先完成四项预测。" });
    var questions = [
      { key: "objects", prompt: "1 · μ 与 X̄ 各是什么？", answer: "parameter", choices: [["parameter", "μ 是总体参数，X̄ 是样本统计量"], ["statistic", "二者都是一次统计量"], ["fixed", "二者都不随样本变化"]] },
      { key: "sampling", prompt: "2 · 抽样分布描述什么？", answer: "repeated", choices: [["repeated", "重复抽样后统计量的分布"], ["raw", "一条原始观测的分布"], ["parameter", "总体参数本身的分布"]] },
      { key: "clt", prompt: "3 · CLT 是否无条件自动成立？", answer: "conditions", choices: [["conditions", "否；它是有条件的渐近结论"], ["always", "是；n 大就不需条件"], ["exact", "是有限样本精确等式"]] },
      { key: "bootstrap", prompt: "4 · bootstrap 能无条件替代理论吗？", answer: "no", choices: [["no", "不能；依赖、重尾等需匹配结构与条件"], ["yes", "任何数据都自动修复"], ["parameter", "会把未知参数变成已知"]] }
    ];
    var choiceButtons = [];
    shell.appendChild(element(doc, "h3", { text: "总体参数、统计量、抽样分布与估计量" }));
    shell.appendChild(element(doc, "p", { className: "se-intro", text: "提交前隐藏重复抽样结果；提交后调整 n、R、B 和估计量，查看同一实验如何区分四层对象。" }));
    form.appendChild(element(doc, "p", { className: "se-prompt", text: "预测门：先把对象命名，再判断 CLT 与 bootstrap 的边界。" }));
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "四项都回答后才揭示结果" }));
    var questionGrid = element(doc, "div", { className: "se-question-grid" });
    questions.forEach(function (question) {
      var questionSet = element(doc, "fieldset", { className: "se-question" });
      questionSet.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "se-choice-list", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];revealed.hidden=true;
          choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false"); });
          feedback.className = "se-feedback";
          feedback.textContent = "已记录当前选择；四项完成后提交。";
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        choices.appendChild(button);
      });
      questionSet.appendChild(choices);
      questionGrid.appendChild(questionSet);
    });
    fieldset.appendChild(questionGrid);
    form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "se-actions" });
    var submit = element(doc, "button", { type: "submit", className: "se-primary", text: "提交预测并揭示" });
    var clearPredictionButton = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(submit);
    actions.appendChild(clearPredictionButton);
    form.appendChild(actions);
    form.appendChild(feedback);
    shell.appendChild(form);

    var layout = element(doc, "div", { className: "se-layout" });
    var controls = element(doc, "div", { className: "se-controls" });
    var stage = element(doc, "div", { className: "se-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    clear(root);
    root.appendChild(shell);

    controls.appendChild(element(doc, "h4", { text: "揭示后的操作参数" }));
    var presetGrid = element(doc, "div", { className: "se-preset-grid", role: "group", "aria-label": "总体预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: preset.label });
      button.addEventListener("click", function () { state.modelId = preset.id; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    controls.appendChild(presetGrid);
    var estimatorGrid = element(doc, "div", { className: "se-estimator-grid", role: "group", "aria-label": "估计量选择" });
    [["mean", "样本均值 X̄"], ["variance", "样本方差 S²"]].forEach(function (item) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: item[1] });
      button.addEventListener("click", function () { state.estimator = item[0]; render(); });
      button.dataset.value = item[0];
      estimatorGrid.appendChild(button);
    });
    controls.appendChild(estimatorGrid);
    controls.appendChild(element(doc, "p", { className: "se-note", text: "R 生成抽样分布的重复次数；B 只生成当前观测的 bootstrap 近似。固定种子便于比较参数变化。" }));

    function addRange(label, id, min, max, step, value, onInput, lowText, highText) {
      var output = element(doc, "output", { for: id, text: "" });
      var input = element(doc, "input", { id: id, type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
      input.addEventListener("input", function () { onInput(Number(input.value)); render(); });
      controls.appendChild(element(doc, "div", { className: "se-control" }, [element(doc, "label", { htmlFor: id }, [label, output]), input, element(doc, "div", { className: "se-scale" }, [element(doc, "span", { text: lowText }), element(doc, "span", { text: highText })])]));
      return { input: input, output: output };
    }
    var nControl = addRange("样本量 n：", uid + "-n", 5, 100, 5, 20, function (value) { state.n = normalizeN(value); }, "5", "100");
    var rControl = addRange("重复次数 R：", uid + "-r", 40, 240, 20, 120, function (value) { state.repetitions = normalizeR(value); }, "40", "240");
    var bControl = addRange("bootstrap 次数 B：", uid + "-b", 40, 240, 20, 120, function (value) { state.bootstrap = normalizeB(value); }, "40", "240");
    var relock = element(doc, "button", { type: "button", text: "重新预测" });
    controls.appendChild(relock);

    function renderTable(data) {
      var targetText = data.target === null ? "无有限值（∞）" : format(data.target, 5);
      var rows = [
        ["总体参数 θ", data.estimator === "mean" ? "μ=" + targetText : "σ²=" + targetText, "总体参数固定；未知但不随样本重抽改变。"],
        ["一次统计量", (data.estimator === "mean" ? "x̄=" : "s²=") + format(statistic(data.observed, data.estimator), 5), "只对应当前一份观测；换样本会变。"],
        ["抽样分布", "均值=" + format(data.samplingMean, 5) + "；SD=" + format(data.samplingSD, 5), data.distributionDescription],
        ["经验偏差估计 / 方差 / 经验 MSE", format(data.bias, 5) + " / " + format(data.samplingVariance, 5) + " / " + format(data.mse, 5), "有限 R 只能估计期望差与 MSE；方差是当前重复抽样的经验波动。"],
        ["一致性信号", data.consistency, "一致性是 n→∞ 的概率陈述，不是一次误差。"],
        ["bootstrap 模拟", "SE=" + format(data.bootstrapSE, 5) + "；B=" + data.bootstrap, data.bootstrapStatus]
      ];
      rows.push(['理论抽样矩','E='+format(data.theory.mean,5)+'；SD='+format(data.theory.sd,5)+'；偏差='+format(data.theory.bias,5)+'；MSE='+format(data.theory.mse,5),'理论矩与有限R的经验矩分开；经验方差用R作分母，经验MSE是平方误差平均。']);
      rows.push(['bootstrap精确条件矩','E*='+format(data.bootstrapTheory.mean,5)+'；SE*='+format(Math.sqrt(data.bootstrapTheory.variance),5),'给定当前观测的经验分布，精确计算；B只影响模拟精度。模拟SE用B−1作方差分母。']);
      var table = element(doc, "table");
      table.appendChild(element(doc, "caption", { text: "四层对象与估计量性质审计账本" }));
      table.appendChild(element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope:"col", text: "对象" }), element(doc, "th", { scope:"col", text: "当前读数" }), element(doc, "th", { scope:"col", text: "解释与边界" })])]));
      var body = element(doc, "tbody");
      rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); }))); });
      table.appendChild(body);
      return element(doc, "div", { className: "se-table-wrap",tabindex:"0",role:"region","aria-label":"可横向滚动的抽样读数表" }, [table]);
    }

    function render() {
      var data = compute({ modelId: state.modelId, estimator: state.estimator, n: state.n, repetitions: state.repetitions, bootstrap: state.bootstrap });
      state.n = data.n;
      state.repetitions = data.repetitions;
      state.bootstrap = data.bootstrap;
      nControl.input.value = String(data.n);
      nControl.output.textContent = String(data.n);
      rControl.input.value = String(data.repetitions);
      rControl.output.textContent = String(data.repetitions);
      bControl.input.value = String(data.bootstrap);
      bControl.output.textContent = String(data.bootstrap);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === data.modelId ? "true" : "false"); });
      estimatorGrid.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", button.dataset.value === data.estimator ? "true" : "false"); });
      clear(stage);
      var cards = [metric(doc, "目标参数", data.target === null ? "无有限值（∞）" : format(data.target, 4)), metric(doc, "经验抽样 SD", format(data.samplingSD, 4)), metric(doc, "经验偏差估计", format(data.bias, 4)), metric(doc, "bootstrap SE", format(data.bootstrapSE, 4))];
      stage.appendChild(element(doc, "div", { className: "se-metrics", "aria-label": "抽样与估计量读数" }, cards.map(function (card) { return card.node; })));
      var frame = element(doc, "div", { className: "se-stage-frame" }, [element(doc, "div", { className: "se-stage-title" }, [element(doc, "strong", { text: data.model.label }), element(doc, "span", { text: data.estimator === "mean" ? "估计量：X̄" : "估计量：S²" })])]);
      frame.appendChild(element(doc,"div",{className:"se-chart-scroll",tabindex:"0",role:"region","aria-label":"可横向滚动的抽样与bootstrap分布图"},[drawSvg(doc,data,uid)]));
      frame.appendChild(element(doc, "p", { className: "se-chart-note", text: "蓝柱为R次重新抽样，紫色阶梯为给定当前观测的B次普通bootstrap；两者分别按完整箱宽归一化。金线若存在，是当前模型的精确抽样密度；红线标目标，绿线标本次统计量。" }));
      stage.appendChild(frame);
      stage.appendChild(renderTable(data));
      var interpretation = data.modelId === "clustered"
        ? "共同冲击没有随着样本内平均被消掉；普通 i.i.d. 抽样分布公式和普通 bootstrap 都需要停下来检查。"
        : data.modelId === "heavy"
          ? "Pareto 的均值存在但方差不存在；看到重尾直方图时，不能用有限方差 CLT 或普通 bootstrap 自动盖章。"
          : data.modelId === "skewed"
            ? "指数总体满足经典 CLT 的有限方差条件，但小样本的偏斜仍是真实抽样分布的一部分。"
            : "正态总体把四层对象对齐得最干净：均值抽样分布精确，S² 还可接上 χ² 理论；bootstrap 仍是近似。";
      stage.appendChild(element(doc, "p", { className: "se-interpretation", role: "status", "aria-live": "polite", text: interpretation }));
      stage.appendChild(element(doc, "p", { className: "se-caution", text: "固定n时，增加R/B保留各自较短重复序列的前缀；B不能增加原始信息。有限精度伪随机数使可生成尾部有上限，有限模拟矩不能证明理想总体矩存在。" }));
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.className = "se-feedback se-warn"; feedback.textContent = "还差 " + missing.length + " 项预测。"; return; }
      var answers = { objects: "parameter", sampling: "repeated", clt: "conditions", bootstrap: "no" };
      state.score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === answers[question.key] ? 1 : 0); }, 0);
      revealed.removeAttribute("hidden");
      feedback.className = "se-feedback " + (state.score === questions.length ? "se-pass" : "se-warn");
      feedback.textContent = "已揭示：" + state.score + "/" + questions.length + " 项预测与解析账本一致。";
      render();
      revealed.focus();
      announce(api, root, feedback.textContent);
    });
    function resetPredictions() { state.predictions = { objects: null, sampling: null, clt: null, bootstrap: null }; choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); }); }
    clearPredictionButton.addEventListener("click", function () { resetPredictions();revealed.hidden=true;choiceButtons[0].node.focus(); feedback.className = "se-feedback"; feedback.textContent = "预测已清空。"; });
    function reset() {
      state.modelId = "normal";
      state.estimator = "mean";
      state.n = 20;
      state.repetitions = 120;
      state.bootstrap = 120;
      resetPredictions();
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "se-feedback";
      feedback.textContent = "已重新上锁，请再完成四项预测。";
      choiceButtons[0].node.focus();
      announce(api, root, "抽样与估计量实验已重置。");
    }
    relock.addEventListener("click", reset);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    check(PRESETS.length === 4, "four presets");
    check(near(sampleMean([1, 2, 3]), 2), "sample mean");
    check(near(sampleVariance([1, 2, 3]), 1), "unbiased sample variance formula");
    check(theoreticalSE("normal", "mean", 20) === 2 / Math.sqrt(20), "normal theoretical SE");
    check(theoreticalSE("skewed", "mean", 20) === 1 / Math.sqrt(20), "skewed theoretical SE");
    check(theoreticalSE("clustered", "mean", 20) > 1 && !cltAllowed("clustered", "mean"), "clustered CLT boundary");
    check(theoreticalSE("heavy", "mean", 20) === null && populationParameter("heavy", "variance") === null, "heavy variance boundary");
    var first = compute({ modelId: "normal", estimator: "mean", n: 20, repetitions: 80, bootstrap: 80 });
    var second = compute({ modelId: "normal", estimator: "mean", n: 20, repetitions: 80, bootstrap: 80 });
    check(JSON.stringify(first.values) === JSON.stringify(second.values), "deterministic sampling replay");
    check(first.values.length === 80 && first.bootstrapValues.length === 80, "replicate lengths");
    check(first.histogram.counts.reduce(function (sum, count) { return sum + count; }, 0) === 80, "histogram count");
    check(first.target === 10 && first.cltAllowed, "normal mean target and CLT");
    check(theory("clustered","variance",20).bias === -1, "clustered variance estimates within-cluster noise");
    var exponentialData = compute({ modelId: "skewed", estimator: "mean", n: 50, repetitions: 60, bootstrap: 60 });
    check(exponentialData.target === 1 && exponentialData.theoreticalSE === 1 / Math.sqrt(50), "exponential mean theory");
    var clusteredData = compute({ modelId: "clustered", estimator: "mean", n: 50, repetitions: 60, bootstrap: 60 });
    check(clusteredData.target === 0 && clusteredData.theoreticalSE > 1, "clustered nonvanishing spread");
    var heavyData = compute({ modelId: "heavy", estimator: "mean", n: 20, repetitions: 60, bootstrap: 60 });
    check(heavyData.target === 3 && heavyData.theoreticalSE === null && heavyData.bootstrapStatus.indexOf("无限方差") !== -1, "heavy tail warning");
    var varianceData = compute({ modelId: "normal", estimator: "variance", n: 20, repetitions: 60, bootstrap: 60 });
    check(varianceData.target === 4 && near(varianceData.theoreticalSE,Math.sqrt(32/19)), "variance estimator target");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    sampleReplicate: sampleReplicate,
    sampleVariance: sampleVariance,
    sampleMean:sampleMean,
    rngFrom:rngFrom,
    theory:theory,
    bootstrapTheory:bootstrapTheory,
    densityAt:densityAt,
    drawSvg:drawSvg,
    statistic: statistic,
    theoreticalSE: theoreticalSE,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});
