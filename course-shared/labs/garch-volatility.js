(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("garch-volatility", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("garch-volatility self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("garch-volatility self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-garch-volatility-lab-styles";
  var INSTANCE = 0;
  var PRESETS = [
    { id: "calm", label: "有限方差：短记忆", omega: 0.00001, alpha: 0.08, beta: 0.84, innovation: "normal", df: 5 },
    { id: "persistent", label: "有限方差：长记忆", omega: 0.00001, alpha: 0.08, beta: 0.90, innovation: "t", df: 5 },
    { id: "boundary", label: "无有限方差证书", omega: 0.00001, alpha: 0.10, beta: 0.92, innovation: "t", df: 5 }
  ];
  var DEFAULTS = {
    preset: "persistent",
    omega: 0.00001,
    alpha: 0.08,
    beta: 0.90,
    innovation: "t",
    df: 5,
    shock: -0.03,
    length: 180,
    shockIndex: 72,
    horizon: 18,
    seed: 20260722
  };
  var STYLE_TEXT = [
    ".garch-volatility-lab{--gv-blue:#315f9d;--gv-gold:var(--cl-gold,#9b6a12);--gv-green:var(--cl-green,#39734d);--gv-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=dark] .garch-volatility-lab{--gv-blue:#83c8ff;--gv-gold:#e2b458;--gv-green:#72bd8b;--gv-red:#f08c7d}",
    ".garch-volatility-lab *{box-sizing:border-box}.garch-volatility-lab [hidden]{display:none!important}.garch-volatility-lab h3,.garch-volatility-lab h4{margin:0 0 8px;line-height:1.35}.garch-volatility-lab p{margin:8px 0}.garch-volatility-lab button,.garch-volatility-lab select,.garch-volatility-lab input{font:inherit}.garch-volatility-lab button,.garch-volatility-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.garch-volatility-lab button{padding:8px 12px;cursor:pointer}.garch-volatility-lab button:hover,.garch-volatility-lab select:hover{border-color:var(--accent)}.garch-volatility-lab button[aria-pressed='true'],.garch-volatility-lab .gv-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.garch-volatility-lab button:focus-visible,.garch-volatility-lab select:focus-visible,.garch-volatility-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".garch-volatility-lab .gv-note,.garch-volatility-lab .gv-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.garch-volatility-lab .gv-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.garch-volatility-lab .gv-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.garch-volatility-lab .gv-control{display:grid;gap:5px;min-width:0}.garch-volatility-lab .gv-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.garch-volatility-lab .gv-control output{color:var(--accent);font-variant-numeric:tabular-nums}.garch-volatility-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.garch-volatility-lab select{width:100%;padding:7px 9px}",
    ".garch-volatility-lab .gv-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gv-gold);background:var(--bg)}.garch-volatility-lab .gv-predict strong{display:block;margin-bottom:8px}.garch-volatility-lab .gv-question-list{display:grid;gap:10px}.garch-volatility-lab .gv-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.garch-volatility-lab .gv-question legend{padding:0 4px;color:var(--fg-soft);font-size:12.5px;font-weight:750;line-height:1.5}.garch-volatility-lab .gv-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.garch-volatility-lab .gv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.garch-volatility-lab .gv-actions>*{flex:1 1 170px}.garch-volatility-lab .gv-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.garch-volatility-lab .gv-pass{color:var(--gv-green)}.garch-volatility-lab .gv-warn{color:var(--gv-red)}",
    ".garch-volatility-lab .gv-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.garch-volatility-lab .gv-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.garch-volatility-lab .gv-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.garch-volatility-lab .gv-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.garch-volatility-lab .gv-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.garch-volatility-lab .gv-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}.garch-volatility-lab .gv-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.garch-volatility-lab .gv-panel h4{font-size:13px;color:var(--fg-soft)}.garch-volatility-lab .gv-chart-scroll{overflow-x:auto;max-width:100%}.garch-volatility-lab svg{display:block;width:100%;min-width:720px;height:auto;color:var(--fg)}.garch-volatility-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.garch-volatility-lab .gv-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.garch-volatility-lab .gv-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.garch-volatility-lab .gv-return{fill:none;stroke:var(--gv-blue);stroke-width:1.7}.garch-volatility-lab .gv-sigma{fill:none;stroke:var(--gv-gold);stroke-width:2.7}.garch-volatility-lab .gv-forecast{fill:none;stroke:var(--gv-green);stroke-width:3}.garch-volatility-lab .gv-target{fill:none;stroke:var(--gv-red);stroke-width:2;stroke-dasharray:6 4}.garch-volatility-lab .gv-shock{stroke:var(--gv-red);stroke-width:2;stroke-dasharray:4 4}.garch-volatility-lab .gv-bar{fill:var(--gv-blue);fill-opacity:.62;stroke:var(--gv-blue);stroke-width:1}.garch-volatility-lab .gv-bar-tail{fill:var(--gv-red);fill-opacity:.62;stroke:var(--gv-red);stroke-width:1}.garch-volatility-lab .gv-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.garch-volatility-lab .gv-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.garch-volatility-lab .gv-dash{border-top-style:dashed}",
    ".garch-volatility-lab .gv-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.garch-volatility-lab table{width:100%;min-width:690px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.garch-volatility-lab th,.garch-volatility-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.garch-volatility-lab th{color:var(--fg-soft);font-size:11.5px}.garch-volatility-lab td:not(:first-child){text-align:right}.garch-volatility-lab .gv-boundary{margin-top:12px;padding:10px 12px;border-left:3px solid var(--gv-red);background:var(--bg);color:var(--fg-soft);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.garch-volatility-lab .gv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.garch-volatility-lab .gv-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.garch-volatility-lab .gv-presets,.garch-volatility-lab .gv-controls{grid-template-columns:minmax(0,1fr)}.garch-volatility-lab .gv-options{grid-template-columns:minmax(0,1fr)}.garch-volatility-lab .gv-panel{padding:5px}}@media(prefers-reduced-motion:reduce){.garch-volatility-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function makeRng(seed) {
    var state = (Number(seed) >>> 0) || 1;
    return function () {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function gaussian(rng) {
    var u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  function studentT(rng, degrees) {
    var numerator = gaussian(rng);
    var sumSquares = 0;
    for (var i = 0; i < degrees; i += 1) {
      var normal = gaussian(rng);
      sumSquares += normal * normal;
    }
    return numerator / Math.sqrt(sumSquares / degrees) * Math.sqrt((degrees - 2) / degrees);
  }

  function copyConfig(input) {
    var source = input || {};
    return {
      preset: source.preset || DEFAULTS.preset,
      omega: clamp(Number(source.omega === undefined ? DEFAULTS.omega : source.omega), 0.000001, 0.0001),
      alpha: clamp(Number(source.alpha === undefined ? DEFAULTS.alpha : source.alpha), 0, 0.35),
      beta: clamp(Number(source.beta === undefined ? DEFAULTS.beta : source.beta), 0, 1.05),
      innovation: source.innovation === "normal" ? "normal" : "t",
      df: Math.round(clamp(Number(source.df === undefined ? DEFAULTS.df : source.df), 3, 12)),
      shock: clamp(Number(source.shock === undefined ? DEFAULTS.shock : source.shock), -0.12, 0.12),
      length: DEFAULTS.length,
      shockIndex: DEFAULTS.shockIndex,
      horizon: Math.round(clamp(Number(source.horizon === undefined ? DEFAULTS.horizon : source.horizon), 4, 30)),
      seed: (Number(source.seed === undefined ? DEFAULTS.seed : source.seed) >>> 0)
    };
  }

  function persistence(config) {
    return config.alpha + config.beta;
  }

  function hasFiniteVarianceCertificate(config) {
    return persistence(config) < 1;
  }

  function unconditionalVariance(config) {
    return hasFiniteVarianceCertificate(config) ? config.omega / (1 - persistence(config)) : null;
  }

  function initialVariance(config) {
    var target = unconditionalVariance(config);
    return target === null ? config.omega / (1 - Math.min(0.98, persistence(config))) : target;
  }

  function innovation(rng, config) {
    return config.innovation === "normal" ? gaussian(rng) : studentT(rng, config.df);
  }

  function forecastVariance(config, currentVariance, lastReturn, horizon) {
    var result = [];
    var next = config.omega + config.alpha * lastReturn * lastReturn + config.beta * currentVariance;
    for (var i = 0; i < horizon; i += 1) {
      result.push(next);
      next = config.omega + persistence(config) * next;
    }
    return result;
  }

  function impulseResponse(config, baseVariance, shock, horizon) {
    var response = [];
    var next = config.omega + config.alpha * shock * shock + config.beta * baseVariance;
    for (var i = 0; i < horizon; i += 1) {
      response.push(next);
      next = config.omega + persistence(config) * next;
    }
    return response;
  }

  function correlationLagOne(values) {
    if (values.length < 3) return 0;
    var left = values.slice(0, values.length - 1);
    var right = values.slice(1);
    var leftMean = left.reduce(function (sum, value) { return sum + value; }, 0) / left.length;
    var rightMean = right.reduce(function (sum, value) { return sum + value; }, 0) / right.length;
    var numerator = 0;
    var leftNorm = 0;
    var rightNorm = 0;
    for (var i = 0; i < left.length; i += 1) {
      var a = left[i] - leftMean;
      var b = right[i] - rightMean;
      numerator += a * b;
      leftNorm += a * a;
      rightNorm += b * b;
    }
    return leftNorm && rightNorm ? numerator / Math.sqrt(leftNorm * rightNorm) : 0;
  }

  function sampleStats(values, variances) {
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
    var second = values.reduce(function (sum, value) { return sum + value * value; }, 0) / values.length;
    var squared = values.map(function (value) { return value * value; });
    var tail = values.filter(function (value) { return Math.abs(value) > 2 * Math.sqrt(second); }).length / values.length;
    return {
      mean: mean,
      variance: second - mean * mean,
      averageConditionalVariance: variances.reduce(function (sum, value) { return sum + value; }, 0) / variances.length,
      squaredAcf: correlationLagOne(squared),
      tailRate: tail
    };
  }

  function simulate(input) {
    var config = copyConfig(input);
    var rng = makeRng(config.seed);
    var returns = [];
    var variances = [];
    var innovations = [];
    var varianceNow = initialVariance(config);
    for (var t = 0; t < config.length; t += 1) {
      var epsilon;
      var value;
      if (t === config.shockIndex) {
        value = config.shock;
        epsilon = value / Math.sqrt(Math.max(varianceNow, 1e-12));
      } else {
        epsilon = innovation(rng, config);
        value = Math.sqrt(Math.max(varianceNow, 0)) * epsilon;
      }
      returns.push(value);
      variances.push(varianceNow);
      innovations.push(epsilon);
      varianceNow = config.omega + config.alpha * value * value + config.beta * varianceNow;
    }
    var forecasts = forecastVariance(config, variances[variances.length - 1], returns[returns.length - 1], config.horizon);
    var response = impulseResponse(config, initialVariance(config), config.shock, config.horizon);
    return {
      config: config,
      returns: returns,
      variances: variances,
      innovations: innovations,
      forecasts: forecasts,
      response: response,
      responseBaseline: forecastVariance(config, initialVariance(config), Math.sqrt(initialVariance(config)), config.horizon),
      responseIncrement: Array.from({length:config.horizon}, function(_,i){ return config.alpha*(config.shock*config.shock-initialVariance(config))*Math.pow(persistence(config),i); }),
      stats: sampleStats(returns, variances),
      unconditional: unconditionalVariance(config),
      persistence: persistence(config),
      finiteVarianceCertified: hasFiniteVarianceCertificate(config)
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.00001)) return value.toExponential(2);
    var text=value.toFixed(places);
    return places===0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function htmlNode(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pathData(values, xMap, yMap) {
    return values.map(function (value, index) {
      return (index ? "L" : "M") + xMap(index, values.length).toFixed(2) + " " + yMap(value).toFixed(2);
    }).join(" ");
  }

  function installStyles(doc) {
    doc = doc || (host && host.document);
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    var box = htmlNode(doc, "div", "gv-metric");
    box.appendChild(htmlNode(doc, "span", "", label));
    box.appendChild(htmlNode(doc, "strong", "", value));
    return box;
  }

  function chartBase(doc, title, description, width, height) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": description });
    svg.appendChild(svgNode(doc, "title", {}, title));
    svg.appendChild(svgNode(doc, "desc", {}, description));
    return svg;
  }

  function tickText(doc, svg, x, y, label, anchor) {
    svg.appendChild(svgNode(doc,"text",{x:x,y:y,"font-size":12,"text-anchor":anchor||"middle"},label));
  }
  function numericAxes(doc,svg,left,right,top,bottom,yMin,yMax,xMax,xLabel,asPercent) {
    for(var i=0;i<=4;i++) {
      var v=yMin+(yMax-yMin)*i/4, y=bottom-i/4*(bottom-top);
      svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:y,y2:y,class:"gv-grid"}));
      tickText(doc,svg,left-8,y+4,asPercent?format(100*v,2)+"%":format(v,6),"end");
    }
    var ticks=[1,Math.round(xMax/2),xMax];
    ticks.forEach(function(v){ tickText(doc,svg,left+(v-1)/(xMax-1)*(right-left),bottom+20,String(v)); });
    tickText(doc,svg,right,bottom+40,xLabel,"end");
  }
  function drawReturnsChart(doc,data) {
    var left=88,right=700,top=36,bottom=266;
    var sigmas=data.variances.map(Math.sqrt);
    var extent=Math.max.apply(Math,data.returns.map(Math.abs).concat(sigmas,[0.01]))*1.08;
    var ym=function(v){return bottom-(v+extent)/(2*extent)*(bottom-top);};
    var xm=function(i,n){return left+i/(n-1)*(right-left);};
    var svg=chartBase(doc,"收益与条件标准差","两条曲线共用百分比纵轴；横轴为样本时点；红虚线为人为替换收益",720,320);
    numericAxes(doc,svg,left,right,top,bottom,-extent,extent,data.returns.length,"样本时点",true);
    svg.appendChild(svgNode(doc,"path",{d:pathData(data.returns,xm,ym),class:"gv-return"}));
    svg.appendChild(svgNode(doc,"path",{d:pathData(sigmas,xm,ym),class:"gv-sigma"}));
    var x=xm(data.config.shockIndex,data.returns.length);
    svg.appendChild(svgNode(doc,"line",{x1:x,x2:x,y1:top,y2:bottom,class:"gv-shock"}));
    tickText(doc,svg,left,18,"r_t 与 σ_t · 同一百分比刻度","start");
    return svg;
  }
  function drawForecastChart(doc,data) {
    var left=88,right=700,top=36,bottom=246;
    var all=data.forecasts.concat(data.response,data.responseBaseline,data.unconditional===null?[]:[data.unconditional]);
    var max=Math.max.apply(Math,all.concat([1e-8]))*1.12;
    var ym=function(v){return bottom-v/max*(bottom-top);};
    var xm=function(i,n){return left+i/(n-1)*(right-left);};
    var svg=chartBase(doc,"条件方差水平与冲击对照","绿色为末时点预测；蓝色为固定初始方差的冲击情形；金色为对应基准；红虚线为有限长期方差",720,300);
    numericAxes(doc,svg,left,right,top,bottom,0,max,data.config.horizon,"预测步 h",false);
    [[data.forecasts,"gv-forecast"],[data.response,"gv-return"],[data.responseBaseline,"gv-sigma"]].forEach(function(pair){svg.appendChild(svgNode(doc,"path",{d:pathData(pair[0],xm,ym),class:pair[1]}));});
    if(data.unconditional!==null) svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:ym(data.unconditional),y2:ym(data.unconditional),class:"gv-target"}));
    tickText(doc,svg,left,18,"方差水平 · 单位：收益比例²（不是标准差）","start");
    return svg;
  }
  function innovationHistogram(data) {
    var counts=Array(16).fill(0),under=0,over=0,total=0;
    data.innovations.forEach(function(v,i){
      if(i===data.config.shockIndex)return;
      total++;
      if(v < -4){under++;return;} if(v>4){over++;return;}
      counts[Math.min(15,Math.floor((v+4)*2))]++;
    });
    return {counts:counts,under:under,over:over,total:total};
  }
  function drawHistogram(doc,data) {
    var hist=innovationHistogram(data),left=88,right=700,top=36,bottom=236;
    var max=Math.max.apply(Math,hist.counts.concat([1]));
    var svg=chartBase(doc,"标准化创新样本","排除人为替换收益的时点；柱高为计数；区间外样本数另列，末箱含右端点",720,310);
    for(var i=0;i<=4;i++) {
      var v=max*i/4,y=bottom-v/max*(bottom-top);
      svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:y,y2:y,class:"gv-grid"}));
      tickText(doc,svg,left-8,y+4,format(v,1),"end");
    }
    var bw=(right-left)/16;
    hist.counts.forEach(function(n,i){var y=bottom-n/max*(bottom-top);svg.appendChild(svgNode(doc,"rect",{x:left+i*bw+1,y:y,width:bw-2,height:bottom-y,class:i<4||i>=12?"gv-bar-tail":"gv-bar"}));});
    [-4,-2,0,2,4].forEach(function(v){tickText(doc,svg,left+(v+4)/8*(right-left),bottom+20,String(v));});
    tickText(doc,svg,left,18,(data.config.innovation==="t"?"标准化 Student-t":"标准正态")+" · 柱高为样本数","start");
    tickText(doc,svg,left,280,"共 "+hist.total+" 个随机创新；小于 −4："+hist.under+"；大于 4："+hist.over+"。","start");
    tickText(doc,svg,left,301,"红柱仅标 |ε|≥2 的区间，不是总体尾指数估计。","start");
    return svg;
  }
  function chartScroll(doc,svg) {
    var wrap=htmlNode(doc,"div","gv-chart-scroll");
    wrap.tabIndex=0;wrap.setAttribute("role","region");wrap.setAttribute("aria-label","数值图，窄屏可左右滚动");wrap.appendChild(svg);return wrap;
  }

  function makeControl(doc, label, key, min, max, step, value) {
    var wrapper = htmlNode(doc, "div", "gv-control");
    var labelNode = htmlNode(doc, "label", "", label);
    var output = htmlNode(doc, "output", "", "");
    labelNode.appendChild(output);
    var input = doc.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("data-key", key);
    input.setAttribute("aria-label", label);
    wrapper.appendChild(labelNode);
    wrapper.appendChild(input);
    return { node: wrapper, input: input, output: output };
  }

  function makeSelect(doc, label, key, options, value) {
    var wrapper = htmlNode(doc, "div", "gv-control");
    var labelNode = htmlNode(doc, "label", "", label);
    var select = doc.createElement("select");
    select.setAttribute("data-key", key);
    select.setAttribute("aria-label", label);
    options.forEach(function (optionData) {
      var option = doc.createElement("option");
      option.value = optionData[0];
      option.textContent = optionData[1];
      select.appendChild(option);
    });
    select.value = value;
    labelNode.appendChild(select);
    wrapper.appendChild(labelNode);
    return { node: wrapper, input: select, output: null };
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var state = copyConfig(DEFAULTS);
    var answers = ["", "", ""];
    var revealed = false;
    var uid = "garch-volatility-" + INSTANCE;
    var shell = htmlNode(doc, "div", "garch-volatility-lab");
    shell.appendChild(htmlNode(doc, "h3", "", "GARCH(1,1) 波动与预测账本"));
    shell.appendChild(htmlNode(doc, "p", "gv-note", "蓝色是收益，金色是条件波动；先预测有限方差、长期目标和因果边界，揭示后再看固定样本与多步预测。图框保留数值刻度，窄屏可聚焦后左右滚动。"));
    var presetWrap = htmlNode(doc, "div", "gv-presets");
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = htmlNode(doc, "button", "", preset.label);
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.addEventListener("click", function () {
        state = copyConfig(preset);
        state.preset = preset.id;
        answers = ["", "", ""];
        choiceButtons.forEach(function (buttonNode) { buttonNode.removeAttribute("aria-pressed"); });
        hideResults("预设已切换；请重新完成三项预测。");
        sync();
      });
      presetButtons.push(button);
      presetWrap.appendChild(button);
    });
    shell.appendChild(presetWrap);
    var controls = htmlNode(doc, "div", "gv-controls");
    var controlList = [
      makeControl(doc, "omega：", "omega", 0.000001, 0.0001, 0.000001, state.omega),
      makeControl(doc, "alpha：", "alpha", 0, 0.35, 0.01, state.alpha),
      makeControl(doc, "beta：", "beta", 0, 1.05, 0.01, state.beta),
      makeSelect(doc, "创新：", "innovation", [["normal", "标准正态"], ["t", "Student-t"]], state.innovation),
      makeControl(doc, "自由度：", "df", 3, 12, 1, state.df),
      makeControl(doc, "预测步数：", "horizon", 4, 30, 1, state.horizon)
    ];
    controlList.forEach(function (control) { controls.appendChild(control.node); });
    shell.appendChild(controls);
    var predict = htmlNode(doc, "div", "gv-predict");
    predict.appendChild(htmlNode(doc, "strong", "", "先预测：提交三项判断后才揭示结果"));
    var questionList = htmlNode(doc, "div", "gv-question-list");
    var questionData = [
      ["持久性 α+β 的有限方差证书？", [["finite", "有：长期方差有限"], ["none", "无：本实验不给长期方差"], ["unknown", "只由样本方差决定"]]],
      ["远期条件方差预测？", [["target", "回到有限无条件方差"], ["away", "无有限目标，不会均值回归"], ["zero", "总是趋向零"]]],
      ["冲击响应的解释？", [["causal", "它就是因果效应"], ["conditional", "模型内条件响应，不自动是因果"], ["none", "完全没有统计信息"]]]
    ];
    var choiceButtons = [];
    questionData.forEach(function (question, questionIndex) {
      var fieldset = doc.createElement("fieldset");
      fieldset.className = "gv-question";
      var legend = doc.createElement("legend"); legend.textContent = (questionIndex + 1) + ". " + question[0]; fieldset.appendChild(legend);
      var options = htmlNode(doc, "div", "gv-options");
      question[1].forEach(function (item) {
        var button = htmlNode(doc, "button", "", item[1]);
        button.type = "button";
        button.setAttribute("data-question", String(questionIndex));
        button.setAttribute("data-answer", item[0]);
        button.addEventListener("click", function () {
          answers[questionIndex] = item[0];
          hideResults("预测已修改；请重新揭示结果。");
          options.querySelectorAll("button").forEach(function (node) { node.setAttribute("aria-pressed", node === button ? "true" : "false"); });
        });
        choiceButtons.push(button);
        options.appendChild(button);
      });
      fieldset.appendChild(options);
      questionList.appendChild(fieldset);
    });
    predict.appendChild(questionList);
    var actions = htmlNode(doc, "div", "gv-actions");
    var reveal = htmlNode(doc, "button", "gv-primary", "揭示结果");
    var reset = htmlNode(doc, "button", "", "重置");
    reveal.type = reset.type = "button";
    actions.appendChild(reveal); actions.appendChild(reset); predict.appendChild(actions);
    var feedback = htmlNode(doc, "p", "gv-feedback", "请完成三项预测。");
    predict.appendChild(feedback);
    shell.appendChild(predict);
    var results = htmlNode(doc, "div", "gv-results");
    results.hidden = true;
    shell.appendChild(results);
    rootNode.replaceChildren(shell);

    function sync() {
      controlList.forEach(function (control) {
        var key = control.input.getAttribute("data-key");
        control.input.value = String(state[key]);
        if (control.output) control.output.textContent = key === "omega" ? format(state[key], 6) : key === "horizon" || key === "df" ? String(state[key]) : format(state[key], 2);
      });
      presetButtons.forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-preset") === state.preset ? "true" : "false"); });
    }

    function hideResults(message) {
      revealed = false;
      results.hidden = true;
      feedback.className = "gv-feedback";
      feedback.textContent = message || "请完成三项预测。";
    }

    function expectedAnswers(data) {
      return [data.finiteVarianceCertified ? "finite" : "none", data.finiteVarianceCertified ? "target" : "away", "conditional"];
    }

    function renderResults(data) {
      results.replaceChildren();
      var expected = expectedAnswers(data);
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      feedback.className = "gv-feedback " + (score === 3 ? "gv-pass" : "gv-warn");
      feedback.textContent = "预测 " + score + "/3。持久性为 " + format(data.persistence, 2) + "；请把条件方差、无条件方差和冲击响应分别读。";
      var metrics = htmlNode(doc, "div", "gv-metrics");
      metrics.appendChild(metric(doc, "alpha+beta", format(data.persistence, 3)));
      metrics.appendChild(metric(doc, "有限方差证书", data.finiteVarianceCertified ? "有" : "无"));
      metrics.appendChild(metric(doc, "无条件方差", format(data.unconditional, 6)));
      metrics.appendChild(metric(doc, "样本方差", format(data.stats.variance, 6)));
      metrics.appendChild(metric(doc, "平方收益 ACF(1)", format(data.stats.squaredAcf, 3)));
      metrics.appendChild(metric(doc, "|r| > 2×样本 RMS 比例", format(data.stats.tailRate, 3)));
      results.appendChild(metrics);
      var layout = htmlNode(doc, "div", "gv-layout");
      var pathPanel = htmlNode(doc, "div", "gv-panel");
      pathPanel.appendChild(htmlNode(doc, "h4", "", "条件风险随时间"));
      pathPanel.appendChild(chartScroll(doc,drawReturnsChart(doc, data)));
      var pathLegend = htmlNode(doc, "div", "gv-legend");
      pathLegend.innerHTML = "<span><i class='gv-swatch' style='color:var(--gv-blue)'></i>收益 r_t</span><span><i class='gv-swatch' style='color:var(--gv-gold)'></i>条件 sigma_t</span><span><i class='gv-swatch gv-dash' style='color:var(--gv-red)'></i>冲击位置</span>";
      pathPanel.appendChild(pathLegend);
      var forecastPanel = htmlNode(doc, "div", "gv-panel");
      forecastPanel.appendChild(htmlNode(doc, "h4", "", "预测与冲击响应"));
      forecastPanel.appendChild(chartScroll(doc,drawForecastChart(doc, data)));
      var forecastLegend = htmlNode(doc, "div", "gv-legend");
      forecastLegend.innerHTML = "<span><i class='gv-swatch' style='color:var(--gv-green)'></i>条件预测</span><span><i class='gv-swatch' style='color:var(--gv-blue)'></i>冲击后水平</span><span><i class='gv-swatch' style='color:var(--gv-gold)'></i>冲击对照基准</span><span><i class='gv-swatch gv-dash' style='color:var(--gv-red)'></i>无条件目标</span>";
      forecastPanel.appendChild(forecastLegend);
      layout.appendChild(pathPanel); layout.appendChild(forecastPanel); results.appendChild(layout);
      var tailPanel = htmlNode(doc, "div", "gv-panel");
      tailPanel.style.marginTop = "14px";
      tailPanel.appendChild(htmlNode(doc, "h4", "", "厚尾检查：标准化创新"));
      tailPanel.appendChild(chartScroll(doc,drawHistogram(doc, data)));
      results.appendChild(tailPanel);
      var tableWrap = htmlNode(doc, "div", "gv-table-wrap");
      var table = doc.createElement("table"); table.setAttribute("aria-label", "GARCH 条件方差与预测表");
      var head = doc.createElement("tr"); ["时点", "收益 r_t", "条件方差", "条件 sigma", "标准化创新"].forEach(function (label) { var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; head.appendChild(th); });
      var thead = doc.createElement("thead"); thead.appendChild(head); table.appendChild(thead);
      var body = doc.createElement("tbody");
      [0, 1, data.config.shockIndex - 1, data.config.shockIndex, data.config.shockIndex + 1, data.config.length - 1].forEach(function (index) {
        if (index < 0 || index >= data.config.length) return;
        var tr = doc.createElement("tr");
        [index + 1, format(data.returns[index], 5), format(data.variances[index], 6), format(Math.sqrt(data.variances[index]), 5), format(data.innovations[index], 3)].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); });
        body.appendChild(tr);
      });
      table.appendChild(body); tableWrap.appendChild(table); results.appendChild(tableWrap);
      var forecastWrap = htmlNode(doc, "div", "gv-table-wrap");
      var forecastTable = doc.createElement("table"); forecastTable.setAttribute("aria-label", "多步方差预测表");
      var fHead = doc.createElement("tr"); ["预测步", "末时点预测", "冲击后方差", "基准方差", "冲击增量 Δ"].forEach(function (label) { var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; fHead.appendChild(th); });
      var fThead = doc.createElement("thead"); fThead.appendChild(fHead); forecastTable.appendChild(fThead);
      var fBody = doc.createElement("tbody");
      data.forecasts.forEach(function (value, index) { var tr = doc.createElement("tr"); [index + 1, format(value, 6), format(data.response[index], 6), format(data.responseBaseline[index],6), format(data.responseIncrement[index],6)].forEach(function (entry) { var td = doc.createElement("td"); td.textContent = String(entry); tr.appendChild(td); }); fBody.appendChild(tr); });
      forecastTable.appendChild(fBody); forecastWrap.appendChild(forecastTable); results.appendChild(forecastWrap);
      var boundary = htmlNode(doc, "p", "gv-boundary", "各图可在窄屏聚焦后左右滚动。样本长度固定为 " + data.config.length + "，初始方差设为 " + format(initialVariance(data.config),6) + "（有限目标存在时取其值，否则采用 omega/[1−min(0.98,alpha+beta)] 的教学初值）；这不是从平稳分布抽出的初态。冲击是实验中人为替换的收益，已从创新直方图排除。平方收益 ACF 只是诊断代理，Student-t 直方图只是有限样本；参数估计误差、时间切分和识别假设仍需在真实预测/因果工作中单独验证。" + (data.finiteVarianceCertified ? "当前 alpha+beta<1，有限无条件方差目标存在。" : "当前 alpha+beta 不小于 1，本实验只撤回有限二阶矩证书；这不等于严格平稳性必然失败，严格条件还取决于 E log(alpha epsilon^2+beta)。"));
      results.appendChild(boundary);
      if (api && api.announce) api.announce(rootNode, feedback.textContent);
    }

    function render() {
      sync();
      if (revealed) renderResults(simulate(state));
    }

    controlList.forEach(function (control) {
      control.input.addEventListener("input", function () {
        var key = control.input.getAttribute("data-key");
        state[key] = key === "innovation" ? control.input.value : Number(control.input.value);
        if (key === "df" || key === "horizon") state[key] = Math.round(state[key]);
        state.preset = "custom";
        answers = ["", "", ""];
        choiceButtons.forEach(function (button) { button.removeAttribute("aria-pressed"); });
        hideResults("参数已更新；请重新完成三项预测。");
        sync();
      });
      control.input.addEventListener("change", function () { control.input.dispatchEvent(new Event("input")); });
    });
    reveal.addEventListener("click", function () {
      if (answers.some(function (answer) { return !answer; })) { feedback.className = "gv-feedback gv-warn"; feedback.textContent = "请先完成三项预测。"; return; }
      revealed = true; results.hidden = false; render();
    });
    reset.addEventListener("click", function () {
      state = copyConfig(DEFAULTS); answers = ["", "", ""]; choiceButtons.forEach(function (button) { button.removeAttribute("aria-pressed"); }); hideResults("已重置到有限方差长记忆预设；请重新预测。"); sync();
    });
    sync();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var stable = copyConfig({ alpha: 0.1, beta: 0.8, omega: 0.00001 });
    var boundary = copyConfig({ alpha: 0.1, beta: 0.9 });
    check(hasFiniteVarianceCertificate(stable), "finite-variance certificate below unit persistence");
    check(!hasFiniteVarianceCertificate(boundary), "unit persistence is outside finite-variance certificate");
    check(Math.abs(unconditionalVariance(stable) - 0.0001) < 1e-12, "unconditional variance formula");
    check(unconditionalVariance(boundary) === null, "no target at boundary");
    var target = unconditionalVariance(stable);
    var forecast = forecastVariance(stable, target, Math.sqrt(target), 8);
    check(forecast.every(function (value) { return Math.abs(value - target) < 1e-12; }), "target fixed by forecast recursion");
    var response = impulseResponse(stable, unconditionalVariance(stable), -0.03, 8);
    check(response[0] > response[response.length - 1], "certified finite-variance impulse decays");
    var rng = makeRng(17);
    var tValue = studentT(rng, 5);
    check(finite(tValue), "student t innovation finite");
    var normalData = simulate({ innovation: "normal", alpha: 0.08, beta: 0.84 });
    var heavyData = simulate({ innovation: "t", df: 5, alpha: 0.08, beta: 0.84 });
    check(normalData.returns.length === DEFAULTS.length, "normal simulation length");
    check(heavyData.returns.length === DEFAULTS.length, "heavy-tail simulation length");
    check(heavyData.returns[DEFAULTS.shockIndex] === DEFAULTS.shock, "shock is visible in sample");
    check(finite(normalData.stats.squaredAcf) && finite(heavyData.stats.tailRate), "sample diagnostics finite");
    check(normalData.forecasts.length === DEFAULTS.horizon, "forecast horizon");
    check(normalData.finiteVarianceCertified && boundary.alpha + boundary.beta === 1, "finite-variance state labels");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    format: format,
    innovationHistogram: innovationHistogram,
    PRESETS: PRESETS,
    persistence: persistence,
    hasFiniteVarianceCertificate: hasFiniteVarianceCertificate,
    unconditionalVariance: unconditionalVariance,
    forecastVariance: forecastVariance,
    impulseResponse: impulseResponse,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
