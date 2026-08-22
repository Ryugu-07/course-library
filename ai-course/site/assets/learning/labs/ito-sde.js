(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ito-sde", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ito-sde self-test: PASS (" + report.checks + " checks, " + report.models + " models)");
    } catch (error) {
      console.error("ito-sde self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-ito-sde-lab-styles";
  var INSTANCE = 0;
  var LEVELS = [8, 16, 32, 64, 128];
  var DEFAULTS = {
    model: "ito",
    x0: 1,
    drift: 0.35,
    sigma: 0.7,
    horizon: 1,
    level: 2,
    path: 4,
    seed: 20260722,
    paths: 64,
    noiseSteps: 256
  };
  var MODEL_LABELS = {
    ode: "ODE：无噪声",
    ito: "Itô SDE：左端点 EM",
    strat: "Stratonovich：预测校正"
  };
  var ORDER_LABELS = {
    one: "约 h",
    half: "约 sqrt(h)",
    none: "没有一般阶数证书"
  };
  var STYLE_TEXT = [
    ".ito-sde-lab{--isde-blue:var(--cl-blue,#315f9d);--isde-gold:var(--cl-gold,#9b6a12);--isde-green:var(--cl-green,#39734d);--isde-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".ito-sde-lab *{box-sizing:border-box}.ito-sde-lab [hidden]{display:none!important}.ito-sde-lab h3,.ito-sde-lab h4{margin:0 0 8px;line-height:1.35}.ito-sde-lab p{margin:8px 0}",
    ".ito-sde-lab button,.ito-sde-lab select,.ito-sde-lab input{font:inherit}.ito-sde-lab button,.ito-sde-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.ito-sde-lab button{padding:8px 12px;cursor:pointer}.ito-sde-lab button:hover,.ito-sde-lab select:hover{border-color:var(--accent)}.ito-sde-lab button[aria-pressed='true'],.ito-sde-lab .isde-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ito-sde-lab button:focus-visible,.ito-sde-lab select:focus-visible,.ito-sde-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ito-sde-lab .isde-note,.ito-sde-lab .isde-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.ito-sde-lab .isde-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.ito-sde-lab .isde-control{display:grid;gap:5px;min-width:0}.ito-sde-lab .isde-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.ito-sde-lab .isde-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ito-sde-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.ito-sde-lab select{width:100%;padding:7px 9px}",
    ".ito-sde-lab .isde-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--isde-gold);background:var(--bg)}.ito-sde-lab .isde-predict strong{display:block;margin-bottom:8px}.ito-sde-lab .isde-choice{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ito-sde-lab .isde-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ito-sde-lab .isde-actions>*{flex:1 1 170px}.ito-sde-lab .isde-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ito-sde-lab .isde-pass{color:var(--isde-green)}.ito-sde-lab .isde-warn{color:var(--isde-red)}",
    ".ito-sde-lab .isde-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ito-sde-lab .isde-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.ito-sde-lab .isde-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ito-sde-lab .isde-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.ito-sde-lab .isde-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ito-sde-lab .isde-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}.ito-sde-lab .isde-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.ito-sde-lab .isde-panel h4{font-size:13px;color:var(--fg-soft)}.ito-sde-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.ito-sde-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ito-sde-lab .isde-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.ito-sde-lab .isde-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.ito-sde-lab .isde-ode{fill:none;stroke:var(--isde-gold);stroke-width:2.4;stroke-dasharray:7 4}.ito-sde-lab .isde-num{fill:none;stroke:var(--isde-blue);stroke-width:3}.ito-sde-lab .isde-exact{fill:none;stroke:var(--isde-green);stroke-width:2;stroke-dasharray:5 4}.ito-sde-lab .isde-hist{fill:var(--isde-blue);fill-opacity:.64;stroke:var(--isde-blue);stroke-width:1}.ito-sde-lab .isde-exact-hist{fill:none;stroke:var(--isde-green);stroke-width:2;stroke-dasharray:5 4}.ito-sde-lab .isde-error-strong{fill:none;stroke:var(--isde-blue);stroke-width:3}.ito-sde-lab .isde-error-weak{fill:none;stroke:var(--isde-gold);stroke-width:3;stroke-dasharray:6 4}.ito-sde-lab .isde-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.ito-sde-lab .isde-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.ito-sde-lab .isde-swatch-dash{border-top-style:dashed}",
    ".ito-sde-lab .isde-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.ito-sde-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ito-sde-lab th,.ito-sde-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ito-sde-lab th{color:var(--fg-soft);font-size:11.5px}.ito-sde-lab td:not(:first-child){text-align:right}.ito-sde-lab .isde-boundary{margin-top:12px;padding:10px 12px;border-left:3px solid var(--isde-red);background:var(--bg);color:var(--fg-soft);font-size:13px;line-height:1.7}",
    "@media(max-width:850px){.ito-sde-lab .isde-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ito-sde-lab .isde-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:520px){.ito-sde-lab .isde-controls{grid-template-columns:minmax(0,1fr)}.ito-sde-lab .isde-choice{grid-template-columns:minmax(0,1fr)}.ito-sde-lab .isde-panel{padding:5px}}@media(prefers-reduced-motion:reduce){.ito-sde-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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

  function copyConfig(config) {
    var source = config || {};
    return {
      model: source.model === "ode" || source.model === "strat" ? source.model : DEFAULTS.model,
      x0: clamp(Number(source.x0 === undefined ? DEFAULTS.x0 : source.x0), 0.2, 3),
      drift: clamp(Number(source.drift === undefined ? DEFAULTS.drift : source.drift), -1, 1),
      sigma: clamp(Number(source.sigma === undefined ? DEFAULTS.sigma : source.sigma), 0, 1.4),
      horizon: clamp(Number(source.horizon === undefined ? DEFAULTS.horizon : source.horizon), 0.5, 2),
      level: Math.round(clamp(Number(source.level === undefined ? DEFAULTS.level : source.level), 0, LEVELS.length - 1)),
      path: Math.round(clamp(Number(source.path === undefined ? DEFAULTS.path : source.path), 0, DEFAULTS.paths - 1)),
      seed: (Number(source.seed === undefined ? DEFAULTS.seed : source.seed) >>> 0),
      paths: DEFAULTS.paths,
      noiseSteps: DEFAULTS.noiseSteps
    };
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

  function makeNoise(config) {
    var noise = [];
    var dt = config.horizon / config.noiseSteps;
    for (var path = 0; path < config.paths; path += 1) {
      var rng = makeRng(config.seed + path * 7919);
      var increments = [];
      for (var index = 0; index < config.noiseSteps; index += 1) {
        increments.push(Math.sqrt(dt) * gaussian(rng));
      }
      noise.push(increments);
    }
    return noise;
  }

  function aggregateIncrements(fine, steps, noiseSteps) {
    if (noiseSteps % steps !== 0) throw new RangeError("steps must divide noiseSteps");
    var block = noiseSteps / steps;
    var result = [];
    for (var i = 0; i < steps; i += 1) {
      var sum = 0;
      for (var j = 0; j < block; j += 1) sum += fine[i * block + j];
      result.push(sum);
    }
    return result;
  }

  function exactValue(model, t, x0, drift, sigma, brownian) {
    if (model === "ode") return x0 * Math.exp(drift * t);
    if (model === "strat") return x0 * Math.exp(drift * t + sigma * brownian);
    return x0 * Math.exp((drift - 0.5 * sigma * sigma) * t + sigma * brownian);
  }

  function exactMean(model, x0, drift, sigma, horizon) {
    if (model === "strat") return x0 * Math.exp((drift + 0.5 * sigma * sigma) * horizon);
    return x0 * Math.exp(drift * horizon);
  }

  function eulerTrace(model, x0, drift, sigma, horizon, increments) {
    var h = horizon / increments.length;
    var x = x0;
    var brownian = 0;
    var values = [x];
    for (var i = 0; i < increments.length; i += 1) {
      var dw = increments[i];
      if (model === "ode") {
        x = x + drift * x * h;
      } else if (model === "ito") {
        x = x + drift * x * h + sigma * x * dw;
      } else {
        var predictor = x + drift * x * h + sigma * x * dw;
        x = x + 0.5 * (drift * x + drift * predictor) * h +
          0.5 * (sigma * x + sigma * predictor) * dw;
      }
      brownian += dw;
      values.push(x);
    }
    return { values: values, brownian: brownian };
  }

  function variance(values) {
    if (!values.length) return 0;
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
    return values.reduce(function (sum, value) {
      return sum + (value - mean) * (value - mean);
    }, 0) / values.length;
  }

  function fitOrder(rows, key) {
    var points = rows.filter(function (row) { return row[key] > 1e-14 && finite(row[key]); });
    if (points.length < 2) return null;
    var xs = points.map(function (row) { return Math.log(row.h); });
    var ys = points.map(function (row) { return Math.log(row[key]); });
    var xMean = xs.reduce(function (sum, value) { return sum + value; }, 0) / xs.length;
    var yMean = ys.reduce(function (sum, value) { return sum + value; }, 0) / ys.length;
    var numerator = 0;
    var denominator = 0;
    for (var i = 0; i < xs.length; i += 1) {
      numerator += (xs[i] - xMean) * (ys[i] - yMean);
      denominator += (xs[i] - xMean) * (xs[i] - xMean);
    }
    return denominator ? numerator / denominator : null;
  }

  function simulate(input) {
    var config = copyConfig(input);
    var noise = makeNoise(config);
    var rows = [];
    LEVELS.forEach(function (steps) {
      var h = config.horizon / steps;
      var numerical = [];
      var exact = [];
      for (var path = 0; path < config.paths; path += 1) {
        var increments = aggregateIncrements(noise[path], steps, config.noiseSteps);
        var trace = eulerTrace(config.model, config.x0, config.drift, config.sigma, config.horizon, increments);
        numerical.push(trace.values[trace.values.length - 1]);
        exact.push(exactValue(config.model, config.horizon, config.x0, config.drift, config.sigma, trace.brownian));
      }
      var strong = Math.sqrt(numerical.reduce(function (sum, value, index) {
        return sum + (value - exact[index]) * (value - exact[index]);
      }, 0) / config.paths);
      var numericMean = numerical.reduce(function (sum, value) { return sum + value; }, 0) / config.paths;
      var exactSampleMean = exact.reduce(function (sum, value) { return sum + value; }, 0) / config.paths;
      rows.push({
        steps: steps,
        h: h,
        strong: strong,
        weak: Math.abs(numericMean - exactMean(config.model, config.x0, config.drift, config.sigma, config.horizon)),
        numerical: numerical,
        exact: exact,
        numericalMean: numericMean,
        exactSampleMean: exactSampleMean,
        numericalVariance: variance(numerical),
        exactVariance: variance(exact)
      });
    });
    var selected = rows[config.level];
    var selectedSteps = selected.steps;
    var selectedIncrements = aggregateIncrements(noise[config.path], selectedSteps, config.noiseSteps);
    var selectedTrace = eulerTrace(config.model, config.x0, config.drift, config.sigma, config.horizon, selectedIncrements);
    var exactTrace = [config.x0];
    var brownian = 0;
    for (var index = 0; index < selectedIncrements.length; index += 1) {
      brownian += selectedIncrements[index];
      exactTrace.push(exactValue(config.model, (index + 1) * config.horizon / selectedSteps, config.x0, config.drift, config.sigma, brownian));
    }
    return {
      config: config,
      rows: rows,
      selected: selected,
      selectedTrace: selectedTrace.values,
      selectedExactTrace: exactTrace,
      strongOrder: fitOrder(rows, "strong"),
      weakOrder: fitOrder(rows, "weak"),
      analyticMean: exactMean(config.model, config.x0, config.drift, config.sigma, config.horizon),
      modelLabel: MODEL_LABELS[config.model]
    };
  }

  function expectedOrder(model) {
    return model === "ito" ? "half" : "one";
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)) return value.toExponential(2);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
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

  function chartBase(doc, title, description, width, height) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": description });
    svg.appendChild(svgNode(doc, "title", {}, title));
    svg.appendChild(svgNode(doc, "desc", {}, description));
    return svg;
  }

  function drawGrid(doc, svg, left, top, right, bottom, min, max, yMap, ticks) {
    for (var i = 0; i <= ticks; i += 1) {
      var value = min + (max - min) * i / ticks;
      var y = yMap(value);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "isde-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: left - 6, y: y + 4, "text-anchor": "end", "font-size": 10 }, format(value, 2)));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "isde-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, class: "isde-axis" }));
  }

  function drawPathChart(doc, data, uid) {
    var width = 680;
    var height = 290;
    var left = 48;
    var right = 662;
    var top = 22;
    var bottom = 246;
    var values = data.selectedTrace.concat(data.selectedExactTrace);
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    if (max - min < 0.2) { min -= 0.1; max += 0.1; }
    var yMap = function (value) { return top + (max - value) / (max - min) * (bottom - top); };
    var xMap = function (index, count) { return left + index / Math.max(1, count - 1) * (right - left); };
    var svg = chartBase(doc, "同一 Brownian 噪声下的单路径", "数值路径、精确路径和 ODE 对照", width, height);
    drawGrid(doc, svg, left, top, right, bottom, min, max, yMap, 4);
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.selectedExactTrace, xMap, yMap), class: "isde-exact" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(data.selectedTrace, xMap, yMap), class: "isde-num" }));
    if (data.config.model !== "ode") {
      var ode = data.selectedExactTrace.map(function (_, index) {
        return exactValue("ode", index * data.config.horizon / (data.selectedExactTrace.length - 1), data.config.x0, data.config.drift, data.config.sigma, 0);
      });
      svg.appendChild(svgNode(doc, "path", { d: pathData(ode, xMap, yMap), class: "isde-ode" }));
    }
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "X(t) · " + data.modelLabel));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 25, "font-size": 10, "text-anchor": "end" }, "t=" + format(data.config.horizon, 2)));
    svg.appendChild(svgNode(doc, "text", { x: right - 2, y: 15, "font-size": 10, "text-anchor": "end" }, "path=" + (data.config.path + 1)));
    svg.id = uid;
    return svg;
  }

  function histogram(values, minimum, maximum, bins) {
    var counts = [];
    for (var i = 0; i < bins; i += 1) counts.push(0);
    var range = maximum - minimum || 1;
    values.forEach(function (value) {
      var index = Math.floor((value - minimum) / range * bins);
      index = clamp(index, 0, bins - 1);
      counts[index] += 1;
    });
    return counts;
  }

  function drawDistributionChart(doc, data) {
    var width = 680;
    var height = 290;
    var left = 48;
    var right = 662;
    var top = 22;
    var bottom = 246;
    var selected = data.selected;
    var all = selected.numerical.concat(selected.exact);
    var min = Math.min.apply(Math, all);
    var max = Math.max.apply(Math, all);
    if (max - min < 0.2) { min -= 0.1; max += 0.1; }
    var bins = 16;
    var numericCounts = histogram(selected.numerical, min, max, bins);
    var exactCounts = histogram(selected.exact, min, max, bins);
    var maxCount = Math.max.apply(Math, numericCounts.concat(exactCounts).concat([1]));
    var yMap = function (value) { return bottom - value / maxCount * (bottom - top); };
    var svg = chartBase(doc, "终点分布账本", "同一参数下的数值终点和精确终点直方图", width, height);
    for (var tick = 0; tick <= 4; tick += 1) {
      var y = yMap(maxCount * tick / 4);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, class: "isde-grid" }));
    }
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "isde-axis" }));
    var binWidth = (right - left) / bins;
    numericCounts.forEach(function (count, index) {
      var x = left + index * binWidth + 1;
      var y = yMap(count);
      svg.appendChild(svgNode(doc, "rect", { x: x, y: y, width: Math.max(1, binWidth - 2), height: bottom - y, class: "isde-hist" }));
      var exactHeight = bottom - yMap(exactCounts[index]);
      svg.appendChild(svgNode(doc, "rect", { x: x + binWidth * 0.15, y: bottom - exactHeight, width: Math.max(1, binWidth * 0.7), height: exactHeight, class: "isde-exact-hist" }));
    });
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "终点 t=T · " + data.selected.steps + " 步"));
    svg.appendChild(svgNode(doc, "text", { x: left, y: bottom + 25, "font-size": 10 }, format(min, 2)));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 25, "font-size": 10, "text-anchor": "end" }, format(max, 2)));
    return svg;
  }

  function drawErrorChart(doc, data) {
    var width = 680;
    var height = 260;
    var left = 48;
    var right = 662;
    var top = 24;
    var bottom = 220;
    var rows = data.rows;
    var errors = rows.reduce(function (all, row) { return all.concat([row.strong, row.weak]); }, []).filter(function (value) { return value > 0; });
    var min = Math.min.apply(Math, errors.concat([1e-8]));
    var max = Math.max.apply(Math, errors.concat([1e-6]));
    var logMin = Math.log(min);
    var logMax = Math.log(max);
    if (logMax - logMin < 1) { logMin -= 0.5; logMax += 0.5; }
    var xMap = function (index) { return left + index / Math.max(1, rows.length - 1) * (right - left); };
    var yMap = function (value) { return top + (logMax - Math.log(Math.max(value, 1e-14))) / (logMax - logMin) * (bottom - top); };
    var svg = chartBase(doc, "离散误差账本", "强误差和弱误差随步长变化的对数图", width, height);
    drawGrid(doc, svg, left, top, right, bottom, logMin, logMax, function (value) { return top + (logMax - value) / (logMax - logMin) * (bottom - top); }, 3);
    svg.appendChild(svgNode(doc, "path", { d: pathData(rows.map(function (row) { return row.strong; }), xMap, yMap), class: "isde-error-strong" }));
    svg.appendChild(svgNode(doc, "path", { d: pathData(rows.map(function (row) { return row.weak; }), xMap, yMap), class: "isde-error-weak" }));
    rows.forEach(function (row, index) {
      svg.appendChild(svgNode(doc, "text", { x: xMap(index), y: bottom + 18, "font-size": 10, "text-anchor": "middle" }, String(row.steps)));
    });
    svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": 12, "font-weight": 700 }, "误差 · 越往右 h 越小"));
    return svg;
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
    var box = htmlNode(doc, "div", "isde-metric");
    box.appendChild(htmlNode(doc, "span", "", label));
    box.appendChild(htmlNode(doc, "strong", "", value));
    return box;
  }

  function makeControl(doc, label, type, min, max, step, value, key) {
    var wrapper = htmlNode(doc, "div", "isde-control");
    var labelNode = htmlNode(doc, "label", "", label);
    var output = htmlNode(doc, "output", "", "");
    labelNode.appendChild(output);
    var input = doc.createElement(type === "select" ? "select" : "input");
    input.setAttribute("data-key", key);
    if (type === "select") {
      Object.keys(MODEL_LABELS).forEach(function (model) {
        var option = doc.createElement("option");
        option.value = model;
        option.textContent = MODEL_LABELS[model];
        input.appendChild(option);
      });
    } else {
      input.type = type;
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
    }
    input.value = String(value);
    input.setAttribute("aria-label", label);
    wrapper.appendChild(labelNode);
    wrapper.appendChild(input);
    return { node: wrapper, input: input, output: output };
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "ito-sde-" + INSTANCE;
    var state = copyConfig(DEFAULTS);
    var prediction = "";
    var revealed = false;
    var shell = htmlNode(doc, "div", "ito-sde-lab");
    var title = htmlNode(doc, "h3", "", "Itô / Stratonovich 数值账本");
    var intro = htmlNode(doc, "p", "isde-note", "固定一份 Brownian 增量：数值轨迹回答强误差问题，终点集合回答弱误差和分布问题。先预测离散阶数，再揭示账本。");
    shell.appendChild(title);
    shell.appendChild(intro);
    var controls = htmlNode(doc, "div", "isde-controls");
    var controlList = [
      makeControl(doc, "模型：", "select", 0, 0, 1, state.model, "model"),
      makeControl(doc, "漂移 a：", "range", -1, 1, 0.05, state.drift, "drift"),
      makeControl(doc, "噪声 sigma：", "range", 0, 1.4, 0.05, state.sigma, "sigma"),
      makeControl(doc, "步长层级：", "range", 0, LEVELS.length - 1, 1, state.level, "level"),
      makeControl(doc, "显示路径：", "range", 0, state.paths - 1, 1, state.path, "path")
    ];
    controlList.forEach(function (control) { controls.appendChild(control.node); });
    shell.appendChild(controls);
    var predict = htmlNode(doc, "div", "isde-predict");
    predict.appendChild(htmlNode(doc, "strong", "", "先预测：当前模型的典型强离散误差阶数？"));
    var choices = htmlNode(doc, "div", "isde-choice");
    var choiceNodes = [];
    [["one", "约 h"], ["half", "约 sqrt(h)"], ["none", "没有一般阶数"]].forEach(function (item) {
      var button = htmlNode(doc, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("data-order", item[0]);
      button.addEventListener("click", function () {
        prediction = item[0];
        choiceNodes.forEach(function (entry) { entry.setAttribute("aria-pressed", entry.getAttribute("data-order") === prediction ? "true" : "false"); });
        feedback.textContent = "预测已记录；结果仍然隐藏。";
        feedback.className = "isde-feedback";
      });
      choiceNodes.push(button);
      choices.appendChild(button);
    });
    predict.appendChild(choices);
    var actions = htmlNode(doc, "div", "isde-actions");
    var reveal = htmlNode(doc, "button", "isde-primary", "揭示结果");
    var reset = htmlNode(doc, "button", "", "重置");
    reveal.type = reset.type = "button";
    actions.appendChild(reveal);
    actions.appendChild(reset);
    predict.appendChild(actions);
    var feedback = htmlNode(doc, "p", "isde-feedback", "请选择一个预测。");
    predict.appendChild(feedback);
    shell.appendChild(predict);
    var results = htmlNode(doc, "div", "isde-results");
    results.hidden = true;
    shell.appendChild(results);
    rootNode.replaceChildren(shell);

    function syncControls() {
      controlList.forEach(function (control) {
        var key = control.input.getAttribute("data-key");
        control.input.value = String(state[key]);
        if (key === "model") control.output.textContent = "";
        else if (key === "level") control.output.textContent = LEVELS[state.level] + " 步";
        else if (key === "path") control.output.textContent = (state.path + 1) + " / " + state.paths;
        else control.output.textContent = format(state[key], 2);
      });
    }

    function hideResults(message) {
      revealed = false;
      results.hidden = true;
      feedback.className = "isde-feedback";
      feedback.textContent = message || (prediction ? "预测已记录；点击“揭示结果”查看账本。" : "请选择一个预测。");
    }

    function renderResults(data) {
      results.replaceChildren();
      var expected = expectedOrder(state.model);
      var hit = prediction === expected;
      feedback.className = "isde-feedback " + (hit ? "isde-pass" : "isde-warn");
      feedback.textContent = (hit ? "预测命中。" : "预测需修正。") + "当前模型：" + MODEL_LABELS[state.model] + "；典型强阶为“" + ORDER_LABELS[expected] + "”。";
      results.appendChild(htmlNode(doc, "div", "isde-metrics", null));
      var metrics = results.firstChild;
      metrics.appendChild(metric(doc, "当前步长", format(data.selected.h, 4)));
      metrics.appendChild(metric(doc, "强误差 RMS", format(data.selected.strong, 5)));
      metrics.appendChild(metric(doc, "弱均值偏差", format(data.selected.weak, 5)));
      metrics.appendChild(metric(doc, "拟合强阶", data.strongOrder === null ? "—" : format(data.strongOrder, 2)));
      metrics.appendChild(metric(doc, "解析均值", format(data.analyticMean, 4)));
      metrics.appendChild(metric(doc, "终点样本方差", format(data.selected.numericalVariance, 4)));
      var layout = htmlNode(doc, "div", "isde-layout");
      var pathPanel = htmlNode(doc, "div", "isde-panel");
      pathPanel.appendChild(htmlNode(doc, "h4", "", "单路径：强误差账本"));
      pathPanel.appendChild(drawPathChart(doc, data, uid + "-path"));
      var legend = htmlNode(doc, "div", "isde-legend");
      legend.innerHTML = "<span><i class='isde-swatch' style='color:var(--isde-blue)'></i>数值</span><span><i class='isde-swatch isde-swatch-dash' style='color:var(--isde-green)'></i>精确</span><span><i class='isde-swatch isde-swatch-dash' style='color:var(--isde-gold)'></i>ODE 对照</span>";
      pathPanel.appendChild(legend);
      var distPanel = htmlNode(doc, "div", "isde-panel");
      distPanel.appendChild(htmlNode(doc, "h4", "", "终点集合：弱误差与分布账本"));
      distPanel.appendChild(drawDistributionChart(doc, data));
      var distLegend = htmlNode(doc, "div", "isde-legend");
      distLegend.innerHTML = "<span><i class='isde-swatch' style='color:var(--isde-blue)'></i>数值终点</span><span><i class='isde-swatch isde-swatch-dash' style='color:var(--isde-green)'></i>精确终点</span>";
      distPanel.appendChild(distLegend);
      layout.appendChild(pathPanel);
      layout.appendChild(distPanel);
      results.appendChild(layout);
      var errorPanel = htmlNode(doc, "div", "isde-panel");
      errorPanel.style.marginTop = "14px";
      errorPanel.appendChild(htmlNode(doc, "h4", "", "随 h 的误差趋势（有限实验）"));
      errorPanel.appendChild(drawErrorChart(doc, data));
      results.appendChild(errorPanel);
      var tableWrap = htmlNode(doc, "div", "isde-table-wrap");
      var table = doc.createElement("table");
      table.setAttribute("aria-label", "Itô 数值误差账本");
      var head = doc.createElement("tr");
      ["步数", "h", "强 RMS", "弱均值偏差", "数值均值", "数值方差"].forEach(function (label) {
        var th = doc.createElement("th"); th.scope = "col"; th.textContent = label; head.appendChild(th);
      });
      var thead = doc.createElement("thead"); thead.appendChild(head); table.appendChild(thead);
      var body = doc.createElement("tbody");
      data.rows.forEach(function (row) {
        var tr = doc.createElement("tr");
        [row.steps, format(row.h, 4), format(row.strong, 5), format(row.weak, 5), format(row.numericalMean, 4), format(row.numericalVariance, 4)].forEach(function (value) { var td = doc.createElement("td"); td.textContent = String(value); tr.appendChild(td); });
        body.appendChild(tr);
      });
      table.appendChild(body); tableWrap.appendChild(table); results.appendChild(tableWrap);
      var boundary = htmlNode(doc, "p", "isde-boundary", "这张图只使用 " + state.paths + " 条固定噪声路径和有限步层级。强误差共享噪声，弱误差比较终点均值；单条路径不能替代终点分布，更不能把有限斜率当成一般收敛定理。");
      results.appendChild(boundary);
      if (api && api.announce) api.announce(rootNode, feedback.textContent);
    }

    function render() {
      syncControls();
      if (!revealed) return;
      renderResults(simulate(state));
    }

    controlList.forEach(function (control) {
      control.input.addEventListener("input", function () {
        var key = control.input.getAttribute("data-key");
        state[key] = key === "model" ? control.input.value : Number(control.input.value);
        if (key === "level" || key === "path") state[key] = Math.round(state[key]);
        prediction = "";
        choiceNodes.forEach(function (button) { button.removeAttribute("aria-pressed"); });
        hideResults("参数已更新；请重新作出预测。");
        syncControls();
      });
      control.input.addEventListener("change", function () { control.input.dispatchEvent(new Event("input")); });
    });
    reveal.addEventListener("click", function () {
      if (!prediction) { feedback.className = "isde-feedback isde-warn"; feedback.textContent = "先选择一个强误差阶数预测。"; return; }
      revealed = true;
      results.hidden = false;
      render();
    });
    reset.addEventListener("click", function () {
      state = copyConfig(DEFAULTS);
      prediction = "";
      choiceNodes.forEach(function (button) { button.removeAttribute("aria-pressed"); });
      hideResults("已重置到 Itô 默认账本；请选择一个预测。");
      syncControls();
    });
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var config = copyConfig({ model: "ito", level: 2, path: 0 });
    var fine = makeNoise(config)[0];
    var coarse = aggregateIncrements(fine, 8, config.noiseSteps);
    check(coarse.length === 8, "coarse increment count");
    check(Math.abs(coarse.reduce(function (sum, value) { return sum + value; }, 0) - fine.reduce(function (sum, value) { return sum + value; }, 0)) < 1e-10, "Brownian coupling preserves total increment");
    check(Math.abs(exactValue("ito", 1, 1, 0.35, 0, 0) - exactValue("ode", 1, 1, 0.35, 0, 0)) < 1e-12, "zero noise agrees with ODE");
    check(Math.abs(exactMean("ito", 1, 0.35, 0.7, 1) - Math.exp(0.35)) < 1e-12, "Ito geometric mean");
    check(Math.abs(exactValue("strat", 1, 1, 0.35, 0.7, 0) - exactValue("ito", 1, 1, 0.35, 0.7, 0)) > 0.1, "Ito and Stratonovich drift correction");
    check(eulerTrace("ito", 1, 0.35, 0.7, 1, coarse).values.length === 9, "Euler trace length");
    var result = simulate(config);
    check(result.rows.length === LEVELS.length, "all step levels simulated");
    check(result.rows.every(function (row) { return finite(row.strong) && finite(row.weak); }), "finite error ledger");
    check(result.selected.numerical.length === config.paths, "ensemble size");
    check(expectedOrder("ito") === "half" && expectedOrder("ode") === "one", "order labels");
    return { checks: checks, models: Object.keys(MODEL_LABELS).length };
  }

  return {
    LEVELS: LEVELS,
    MODEL_LABELS: MODEL_LABELS,
    aggregateIncrements: aggregateIncrements,
    exactValue: exactValue,
    exactMean: exactMean,
    eulerTrace: eulerTrace,
    simulate: simulate,
    selfTest: selfTest,
    mount: mount
  };
});
