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
    { id: "calm", label: "平稳：短记忆", omega: 0.00001, alpha: 0.08, beta: 0.84, innovation: "normal", df: 5 },
    { id: "persistent", label: "平稳：长记忆", omega: 0.00001, alpha: 0.08, beta: 0.90, innovation: "t", df: 5 },
    { id: "boundary", label: "边界：无长期证书", omega: 0.00001, alpha: 0.10, beta: 0.92, innovation: "t", df: 5 }
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
    ".garch-volatility-lab{--gv-blue:var(--cl-blue,#315f9d);--gv-gold:var(--cl-gold,#9b6a12);--gv-green:var(--cl-green,#39734d);--gv-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".garch-volatility-lab *{box-sizing:border-box}.garch-volatility-lab [hidden]{display:none!important}.garch-volatility-lab h3,.garch-volatility-lab h4{margin:0 0 8px;line-height:1.35}.garch-volatility-lab p{margin:8px 0}.garch-volatility-lab button,.garch-volatility-lab select,.garch-volatility-lab input{font:inherit}.garch-volatility-lab button,.garch-volatility-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.garch-volatility-lab button{padding:8px 12px;cursor:pointer}.garch-volatility-lab button:hover,.garch-volatility-lab select:hover{border-color:var(--accent)}.garch-volatility-lab button[aria-pressed='true'],.garch-volatility-lab .gv-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.garch-volatility-lab button:focus-visible,.garch-volatility-lab select:focus-visible,.garch-volatility-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".garch-volatility-lab .gv-note,.garch-volatility-lab .gv-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.garch-volatility-lab .gv-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.garch-volatility-lab .gv-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.garch-volatility-lab .gv-control{display:grid;gap:5px;min-width:0}.garch-volatility-lab .gv-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.garch-volatility-lab .gv-control output{color:var(--accent);font-variant-numeric:tabular-nums}.garch-volatility-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.garch-volatility-lab select{width:100%;padding:7px 9px}",
    ".garch-volatility-lab .gv-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gv-gold);background:var(--bg)}.garch-volatility-lab .gv-predict strong{display:block;margin-bottom:8px}.garch-volatility-lab .gv-question-list{display:grid;gap:10px}.garch-volatility-lab .gv-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.garch-volatility-lab .gv-question legend{padding:0 4px;color:var(--fg-soft);font-size:12.5px;font-weight:750;line-height:1.5}.garch-volatility-lab .gv-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.garch-volatility-lab .gv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.garch-volatility-lab .gv-actions>*{flex:1 1 170px}.garch-volatility-lab .gv-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.garch-volatility-lab .gv-pass{color:var(--gv-green)}.garch-volatility-lab .gv-warn{color:var(--gv-red)}",
    ".garch-volatility-lab .gv-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.garch-volatility-lab .gv-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.garch-volatility-lab .gv-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.garch-volatility-lab .gv-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.garch-volatility-lab .gv-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.garch-volatility-lab .gv-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}.garch-volatility-lab .gv-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.garch-volatility-lab .gv-panel h4{font-size:13px;color:var(--fg-soft)}.garch-volatility-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.garch-volatility-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.garch-volatility-lab .gv-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.garch-volatility-lab .gv-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.garch-volatility-lab .gv-return{fill:none;stroke:var(--gv-blue);stroke-width:1.7}.garch-volatility-lab .gv-sigma{fill:none;stroke:var(--gv-gold);stroke-width:2.7}.garch-volatility-lab .gv-forecast{fill:none;stroke:var(--gv-green);stroke-width:3}.garch-volatility-lab .gv-target{fill:none;stroke:var(--gv-red);stroke-width:2;stroke-dasharray:6 4}.garch-volatility-lab .gv-shock{stroke:var(--gv-red);stroke-width:2;stroke-dasharray:4 4}.garch-volatility-lab .gv-bar{fill:var(--gv-blue);fill-opacity:.62;stroke:var(--gv-blue);stroke-width:1}.garch-volatility-lab .gv-bar-tail{fill:var(--gv-red);fill-opacity:.62;stroke:var(--gv-red);stroke-width:1}.garch-volatility-lab .gv-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.garch-volatility-lab .gv-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.garch-volatility-lab .gv-dash{border-top-style:dashed}",
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

  function isStationary(config) {
    return persistence(config) < 1;
  }

  function unconditionalVariance(config) {
    return isStationary(config) ? config.omega / (1 - persistence(config)) : null;
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
      stats: sampleStats(returns, variances),
      unconditional: unconditionalVariance(config),
      persistence: persistence(config),
      stationary: isStationary(config)
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.00001)) return value.toExponential(2);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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

  function drawReturnsChart(doc, data) {
    var width = 720;
    var height = 300;
    var left = 44;
    var right = 704;
    var top = 22;
    var bottom = 252;
    var maxReturn = Math.max.apply(Math, data.returns.map(function (value) { return Math.abs(value); }).concat([0.01]));
    var maxSigma = Math.sqrt(Math.max.apply(Math, data.variances.concat([0.0001])));
    var yReturn = function (value) { return top + (maxReturn - value) / (2 * maxReturn) * (bottom - top); };
    var ySigma = function (value) { return bottom - value / (maxSigma * 1.15) * (bottom - top); };
    var xMap = function (index, count) { return left + index / Math.max(1, count - 1) * (right - left); };
    var svg = chartBase(doc, "收益与条件波动", "收益序列、条件标准差和冲击位置", width, height);
    for (var tick = 0; tick <= 4; tick += 1) {
      var y = top + tick / 4 * (bottom - top);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "gv-grid" }));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "gv-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.returns, xMap, yReturn), class: "gv-return" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.variances.map(function (value) { return Math.sqrt(value); }), xMap, ySigma), class: "gv-sigma" }));
    var shockX = xMap(data.config.shockIndex, data.returns.length);
    svg.appendChild(svgNode(doc, "line", { x1: shockX, x2: shockX, y1: top, y2: bottom, class: "gv-shock" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "r_t 与 sigma_t · 红虚线为人为插入的冲击"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 25, "font-size": 10, "text-anchor": "end" }, "t"));
    return svg;
  }

  function drawForecastChart(doc, data) {
    var width = 720;
    var height = 270;
    var left = 44;
    var right = 704;
    var top = 22;
    var bottom = 222;
    var all = data.forecasts.concat(data.response).concat(data.unconditional === null ? [] : [data.unconditional]);
    var min = 0;
    var max = Math.max.apply(Math, all.concat([0.0001]));
    var yMap = function (value) { return bottom - value / (max * 1.12) * (bottom - top); };
    var xMap = function (index, count) { return left + index / Math.max(1, count - 1) * (right - left); };
    var svg = chartBase(doc, "条件预测与冲击响应", "多步条件方差预测、单次冲击响应和长期目标", width, height);
    for (var tick = 0; tick <= 4; tick += 1) {
      var y = yMap(max * tick / 4);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "gv-grid" }));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "gv-axis" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.forecasts, xMap, yMap), class: "gv-forecast" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.response, xMap, yMap), class: "gv-return" }));
    if (data.unconditional !== null) {
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: yMap(data.unconditional), y2: yMap(data.unconditional), class: "gv-target" }));
    }
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "未来方差 · horizon=" + data.config.horizon));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 22, "font-size": 10, "text-anchor": "end" }, "预测步"));
    return svg;
  }

  function drawHistogram(doc, data) {
    var values = data.innovations;
    var bins = 16;
    var minimum = -4;
    var maximum = 4;
    var counts = [];
    for (var i = 0; i < bins; i += 1) counts.push(0);
    values.forEach(function (value) {
      var index = Math.floor((value - minimum) / (maximum - minimum) * bins);
      if (index >= 0 && index < bins) counts[index] += 1;
    });
    var width = 720;
    var height = 250;
    var left = 44;
    var right = 704;
    var top = 22;
    var bottom = 205;
    var maxCount = Math.max.apply(Math, counts.concat([1]));
    var svg = chartBase(doc, "标准化创新的尾部", "标准化创新直方图，超过二倍标准差的观测以红色标记", width, height);
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "gv-axis" }));
    var barWidth = (right - left) / bins;
    counts.forEach(function (count, index) {
      var center = minimum + (index + 0.5) / bins * (maximum - minimum);
      var x = left + index * barWidth + 1;
      var y = bottom - count / maxCount * (bottom - top);
      svg.appendChild(svgNode(doc, "rect", { x: x, y: y, width: Math.max(1, barWidth - 2), height: bottom - y, class: Math.abs(center) >= 2 ? "gv-bar-tail" : "gv-bar" }));
    });
    [-4, -2, 0, 2, 4].forEach(function (value) {
      var x = left + (value - minimum) / (maximum - minimum) * (right - left);
      svg.appendChild(svgNode(doc, "text", { x: x, y: bottom + 20, "font-size": 10, "text-anchor": "middle" }, String(value)));
    });
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, data.config.innovation === "t" ? "标准化 Student-t 创新" : "标准化正态创新"));
    return svg;
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
    shell.appendChild(htmlNode(doc, "p", "gv-note", "蓝色是收益，金色是条件波动；先预测平稳性、长期目标和因果边界，揭示后再看固定样本与多步预测。"));
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
      ["持久性 α+β 的长期方差证书？", [["finite", "有限：存在长期目标"], ["none", "无有限平稳目标"], ["unknown", "只由样本方差决定"]]],
      ["平稳模型的远期方差预测？", [["target", "回到无条件方差"], ["shock", "永远停在冲击水平"], ["zero", "趋向零"]]],
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
      return [data.stationary ? "finite" : "none", data.stationary ? "target" : "shock", "conditional"];
    }

    function renderResults(data) {
      results.replaceChildren();
      var expected = expectedAnswers(data);
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      feedback.className = "gv-feedback " + (score === 3 ? "gv-pass" : "gv-warn");
      feedback.textContent = "预测 " + score + "/3。持久性为 " + format(data.persistence, 2) + "；请把条件方差、无条件方差和冲击响应分别读。";
      var metrics = htmlNode(doc, "div", "gv-metrics");
      metrics.appendChild(metric(doc, "alpha+beta", format(data.persistence, 3)));
      metrics.appendChild(metric(doc, "平稳证书", data.stationary ? "有" : "无"));
      metrics.appendChild(metric(doc, "无条件方差", format(data.unconditional, 6)));
      metrics.appendChild(metric(doc, "样本方差", format(data.stats.variance, 6)));
      metrics.appendChild(metric(doc, "平方收益 ACF(1)", format(data.stats.squaredAcf, 3)));
      metrics.appendChild(metric(doc, "超二倍波动比例", format(data.stats.tailRate, 3)));
      results.appendChild(metrics);
      var layout = htmlNode(doc, "div", "gv-layout");
      var pathPanel = htmlNode(doc, "div", "gv-panel");
      pathPanel.appendChild(htmlNode(doc, "h4", "", "条件风险随时间"));
      pathPanel.appendChild(drawReturnsChart(doc, data));
      var pathLegend = htmlNode(doc, "div", "gv-legend");
      pathLegend.innerHTML = "<span><i class='gv-swatch' style='color:var(--gv-blue)'></i>收益 r_t</span><span><i class='gv-swatch' style='color:var(--gv-gold)'></i>条件 sigma_t</span><span><i class='gv-swatch gv-dash' style='color:var(--gv-red)'></i>冲击位置</span>";
      pathPanel.appendChild(pathLegend);
      var forecastPanel = htmlNode(doc, "div", "gv-panel");
      forecastPanel.appendChild(htmlNode(doc, "h4", "", "预测与冲击响应"));
      forecastPanel.appendChild(drawForecastChart(doc, data));
      var forecastLegend = htmlNode(doc, "div", "gv-legend");
      forecastLegend.innerHTML = "<span><i class='gv-swatch' style='color:var(--gv-green)'></i>条件预测</span><span><i class='gv-swatch' style='color:var(--gv-blue)'></i>单次冲击响应</span><span><i class='gv-swatch gv-dash' style='color:var(--gv-red)'></i>无条件目标</span>";
      forecastPanel.appendChild(forecastLegend);
      layout.appendChild(pathPanel); layout.appendChild(forecastPanel); results.appendChild(layout);
      var tailPanel = htmlNode(doc, "div", "gv-panel");
      tailPanel.style.marginTop = "14px";
      tailPanel.appendChild(htmlNode(doc, "h4", "", "厚尾检查：标准化创新"));
      tailPanel.appendChild(drawHistogram(doc, data));
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
      var fHead = doc.createElement("tr"); ["预测步", "条件方差预测", "冲击响应"].forEach(function (label) { var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; fHead.appendChild(th); });
      var fThead = doc.createElement("thead"); fThead.appendChild(fHead); forecastTable.appendChild(fThead);
      var fBody = doc.createElement("tbody");
      data.forecasts.forEach(function (value, index) { var tr = doc.createElement("tr"); [index + 1, format(value, 6), format(data.response[index], 6)].forEach(function (entry) { var td = doc.createElement("td"); td.textContent = String(entry); tr.appendChild(td); }); fBody.appendChild(tr); });
      forecastTable.appendChild(fBody); forecastWrap.appendChild(forecastTable); results.appendChild(forecastWrap);
      var boundary = htmlNode(doc, "p", "gv-boundary", "样本长度固定为 " + data.config.length + "，冲击是实验中人为插入的条件反事实。平方收益 ACF 只是诊断代理，Student-t 直方图只是有限样本；参数估计误差、时间切分和识别假设仍需在真实预测/因果工作中单独验证。" + (data.stationary ? "当前 gamma 目标存在。" : "当前 alpha+beta 不小于 1，长期无条件方差栏保持无证书。"));
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
      state = copyConfig(DEFAULTS); answers = ["", "", ""]; choiceButtons.forEach(function (button) { button.removeAttribute("aria-pressed"); }); hideResults("已重置到长记忆平稳预设；请重新预测。"); sync();
    });
    sync();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var stable = copyConfig({ alpha: 0.1, beta: 0.8, omega: 0.00001 });
    var boundary = copyConfig({ alpha: 0.1, beta: 0.9 });
    check(isStationary(stable), "strict stationary condition");
    check(!isStationary(boundary), "unit persistence is outside certificate");
    check(Math.abs(unconditionalVariance(stable) - 0.0001) < 1e-12, "unconditional variance formula");
    check(unconditionalVariance(boundary) === null, "no target at boundary");
    var target = unconditionalVariance(stable);
    var forecast = forecastVariance(stable, target, Math.sqrt(target), 8);
    check(forecast.every(function (value) { return Math.abs(value - target) < 1e-12; }), "target fixed by forecast recursion");
    var response = impulseResponse(stable, unconditionalVariance(stable), -0.03, 8);
    check(response[0] > response[response.length - 1], "stationary impulse decays");
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
    check(normalData.stationary && boundary.alpha + boundary.beta === 1, "preset state labels");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    persistence: persistence,
    isStationary: isStationary,
    unconditionalVariance: unconditionalVariance,
    forecastVariance: forecastVariance,
    impulseResponse: impulseResponse,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
