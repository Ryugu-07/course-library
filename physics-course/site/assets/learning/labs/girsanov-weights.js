(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("girsanov-weights", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("girsanov-weights self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("girsanov-weights self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-girsanov-weights-styles";
  var SERIAL = 0;
  var DEFAULTS = { theta: 1, T: 1, sigma: 1, steps: 48, sampleCount: 192, seed: 20260722 };

  var PRESETS = [
    { id: "same-measure", label: "θ=0：Q=P", theta: 0, T: 1, sigma: 1 },
    { id: "moderate", label: "中等漂移：θ=1", theta: 1, T: 1, sigma: 1 },
    { id: "large", label: "大漂移：θ=4", theta: 4, T: 1, sigma: 1 },
    { id: "reverse", label: "反向漂移：θ=-2", theta: -2, T: 1, sigma: 1 }
  ];

  var STYLE_TEXT = [
    ".gz-lab{--gz-blue:var(--cl-blue,#315f9d);--gz-gold:var(--cl-gold,#9b6a12);--gz-green:var(--cl-green,#39734d);--gz-red:var(--cl-red,#b64335);--gz-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .gz-lab{--gz-blue:#83c8ff;--gz-gold:#e2b458;--gz-green:#72bd8b;--gz-red:#f08c7d;--gz-soft:#b8b2a7;}",
    ".gz-lab *,.gz-lab *::before,.gz-lab *::after{box-sizing:border-box;}.gz-lab [hidden]{display:none!important;}",
    ".gz-lab h3,.gz-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.gz-lab h3{font-size:1.18rem;}.gz-lab h4{font-size:1rem;}.gz-lab .gz-intro,.gz-lab .gz-note,.gz-lab .gz-feedback{color:var(--gz-soft);font-size:13px;line-height:1.7;}",
    ".gz-lab .gz-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gz-gold);background:var(--bg);}.gz-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.gz-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;line-height:1.5;}.gz-lab .gz-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.gz-lab .gz-question legend{color:var(--gz-soft);font-size:13px;font-weight:650;}",
    ".gz-lab .gz-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.gz-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.gz-lab button:hover{border-color:var(--accent);}.gz-lab button[aria-pressed=\"true\"],.gz-lab button.gz-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.gz-lab button:disabled{cursor:not-allowed;opacity:.55;}.gz-lab button:focus-visible,.gz-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".gz-lab .gz-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.gz-lab .gz-actions>*{flex:1 1 180px;}.gz-lab .gz-feedback{min-height:2em;margin:8px 0;font-weight:700;}.gz-lab .gz-pass{color:var(--gz-green);}.gz-lab .gz-warn{color:var(--gz-red);}.gz-lab .gz-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".gz-lab .gz-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.gz-lab .gz-controls,.gz-lab .gz-stage{min-width:0;}.gz-lab .gz-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.gz-lab .gz-controls h4{margin:0;}.gz-lab .gz-preset-grid{display:grid;gap:7px;}.gz-lab .gz-preset-grid button{font-size:12px;text-align:left;}.gz-lab .gz-control{display:grid;gap:5px;min-width:0;}.gz-lab .gz-control label{color:var(--gz-soft);font-size:13px;font-weight:700;}.gz-lab .gz-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.gz-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".gz-lab .gz-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.gz-lab .gz-chart-title{display:flex;justify-content:space-between;gap:10px;margin:0 0 7px;color:var(--gz-soft);font-size:13px;}.gz-lab .gz-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.gz-lab .gz-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.gz-lab .gz-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.gz-lab .gz-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.62;}.gz-lab .gz-zero{stroke:var(--gz-gold);stroke-width:1.2;stroke-dasharray:4 4;}.gz-lab .gz-path-p{fill:none;stroke:var(--gz-blue);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}.gz-lab .gz-path-q{fill:none;stroke:var(--gz-gold);stroke-width:2;stroke-dasharray:7 4;stroke-linecap:round;stroke-linejoin:round;}.gz-lab .gz-bar{fill:var(--gz-red);fill-opacity:.72;}.gz-lab .gz-bar-top{stroke:var(--gz-green);stroke-width:1.4;stroke-dasharray:3 3;}.gz-lab .gz-label{font-size:11px;}.gz-lab .gz-chart-label{font-size:12px;font-weight:750;}",
    ".gz-lab .gz-legend{display:flex;flex-wrap:wrap;gap:7px 15px;margin:8px 2px 0;color:var(--gz-soft);font-size:12px;}.gz-lab .gz-legend-item{display:inline-flex;align-items:center;gap:6px;}.gz-lab .gz-swatch{display:inline-block;width:25px;height:0;border-top:3px solid currentColor;}.gz-lab .gz-swatch-p{color:var(--gz-blue);}.gz-lab .gz-swatch-q{color:var(--gz-gold);border-top-style:dashed;}.gz-lab .gz-swatch-weight{color:var(--gz-red);}",
    ".gz-lab .gz-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 12px;}.gz-lab .gz-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.gz-lab .gz-metric:nth-child(1),.gz-lab .gz-metric:nth-child(4){border-top-color:var(--gz-blue);}.gz-lab .gz-metric:nth-child(2),.gz-lab .gz-metric:nth-child(5){border-top-color:var(--gz-gold);}.gz-lab .gz-metric:nth-child(3),.gz-lab .gz-metric:nth-child(6){border-top-color:var(--gz-red);}.gz-lab .gz-metric span{display:block;color:var(--gz-soft);font-size:11.5px;line-height:1.4;}.gz-lab .gz-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".gz-lab .gz-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.gz-lab table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.gz-lab caption{padding:0 0 7px;text-align:left;color:var(--gz-soft);font-size:12px;line-height:1.55;}.gz-lab th,.gz-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.gz-lab th{color:var(--gz-soft);font-size:11.5px;font-weight:750;}.gz-lab td:nth-child(2){white-space:nowrap;font-weight:700;}.gz-lab .gz-caution{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--gz-green);background:var(--bg);color:var(--gz-soft);font-size:12.5px;line-height:1.7;}",
    "@media(max-width:900px){.gz-lab .gz-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:700px){.gz-lab .gz-choice-row{grid-template-columns:minmax(0,1fr);}.gz-lab .gz-metrics{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:430px){.gz-lab .gz-stage-frame{padding:6px;}.gz-lab table{font-size:11.5px;}.gz-lab th,.gz-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.gz-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function validateFinite(name, value) {
    if (!finite(value)) throw new RangeError(name + " 必须是有限实数。");
    return value;
  }

  function validateTime(T) {
    validateFinite("T", T);
    if (T < 0) throw new RangeError("T 必须是非负数。");
    return T;
  }

  function validateSteps(steps) {
    if (!Number.isInteger(steps) || steps < 1 || steps > 512) throw new RangeError("steps 必须是 1 到 512 的整数。");
    return steps;
  }

  function validateSigma(sigma) {
    validateFinite("sigma", sigma);
    if (!(sigma > 0)) throw new RangeError("sigma 必须为正数。");
    return sigma;
  }

  function validateTheta(theta) {
    return validateFinite("theta", theta);
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rng) {
    var u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  function generateStandardEnsemble(seed, sampleCount, steps) {
    if (!Number.isInteger(sampleCount) || sampleCount < 2 || sampleCount > 2048) throw new RangeError("sampleCount 必须是 2 到 2048 的整数。");
    validateSteps(steps);
    var rng = makeRng(seed);
    var ensemble = [];
    for (var i = 0; i < sampleCount; i += 1) {
      var increments = [];
      for (var j = 0; j < steps; j += 1) increments.push(gaussian(rng));
      ensemble.push(increments);
    }
    return ensemble;
  }

  function logRadonNikodym(theta, brownianTerminal, T) {
    validateTheta(theta);
    validateFinite("B_T", brownianTerminal);
    validateTime(T);
    return -theta * brownianTerminal - 0.5 * theta * theta * T;
  }

  function novikovExpectation(theta, T) {
    validateTheta(theta);
    validateTime(T);
    return Math.exp(0.5 * theta * theta * T);
  }

  function novikovHolds(theta, T) {
    validateTheta(theta);
    validateTime(T);
    return true;
  }

  function tiltedBrownianMgf(theta, T, lambda) {
    validateTheta(theta);
    validateTime(T);
    validateFinite("lambda", lambda);
    return Math.exp(0.5 * lambda * lambda * T - theta * lambda * T);
  }

  function discreteAreaVariance(T, sigma, steps) {
    validateTime(T);
    validateSigma(sigma);
    validateSteps(steps);
    if (T === 0) return 0;
    var dt = T / steps;
    var sum = 0;
    for (var j = 1; j <= steps; j += 1) {
      var coefficient = steps - j + 0.5;
      sum += coefficient * coefficient;
    }
    return sigma * sigma * Math.pow(dt, 3) * sum;
  }

  function logSumExp(values) {
    var maximum = -Infinity;
    values.forEach(function (value) { if (value > maximum) maximum = value; });
    var sum = 0;
    values.forEach(function (value) { sum += Math.exp(value - maximum); });
    return maximum + Math.log(sum);
  }

  function normalizedWeights(logWeights) {
    var maximum = -Infinity;
    logWeights.forEach(function (value) { if (value > maximum) maximum = value; });
    var shifted = logWeights.map(function (value) { return Math.exp(value - maximum); });
    var sum = shifted.reduce(function (total, value) { return total + value; }, 0);
    var weights = shifted.map(function (value) { return value / sum; });
    return {
      weights: weights,
      logSum: maximum + Math.log(sum),
      rawMean: Math.exp(maximum + Math.log(sum) - Math.log(logWeights.length))
    };
  }

  function weightedMean(values, weights) {
    return values.reduce(function (total, value, index) { return total + weights[index] * value; }, 0);
  }

  function weightedSecond(values, weights) {
    return weightedMean(values.map(function (value) { return value * value; }), weights);
  }

  function evaluate(input) {
    var config = input || {};
    var theta = validateTheta(config.theta === undefined ? DEFAULTS.theta : Number(config.theta));
    var T = validateTime(config.T === undefined ? DEFAULTS.T : Number(config.T));
    var sigma = validateSigma(config.sigma === undefined ? DEFAULTS.sigma : Number(config.sigma));
    var steps = validateSteps(config.steps === undefined ? DEFAULTS.steps : Number(config.steps));
    var sampleCount = config.sampleCount === undefined ? DEFAULTS.sampleCount : Number(config.sampleCount);
    if (!Number.isInteger(sampleCount) || sampleCount < 2 || sampleCount > 2048) throw new RangeError("sampleCount 必须是 2 到 2048 的整数。");
    var seed = config.seed === undefined ? DEFAULTS.seed : Number(config.seed);
    if (!Number.isFinite(seed)) throw new RangeError("seed 必须是有限数。");
    var standard = generateStandardEnsemble(seed, sampleCount, steps);
    var dt = T / steps;
    var sqrtDt = Math.sqrt(dt);
    var terminal = [];
    var terminalSecondValues = [];
    var area = [];
    var areaSecondValues = [];
    var logs = [];
    var paths = [];
    for (var i = 0; i < standard.length; i += 1) {
      var b = 0;
      var x = 0;
      var a = 0;
      var path = [{ t: 0, brownian: 0, drifted: 0, nodrift: 0 }];
      for (var j = 0; j < steps; j += 1) {
        var previousX = x;
        b += standard[i][j] * sqrtDt;
        var time = (j + 1) * dt;
        x = sigma * theta * time + sigma * b;
        a += 0.5 * (previousX + x) * dt;
        path.push({ t: time, brownian: b, drifted: x, nodrift: sigma * b });
      }
      terminal.push(x);
      terminalSecondValues.push(x * x);
      area.push(a);
      areaSecondValues.push(a * a);
      logs.push(logRadonNikodym(theta, b, T));
      paths.push(path);
    }
    var normalized = normalizedWeights(logs);
    var sumSquares = normalized.weights.reduce(function (total, value) { return total + value * value; }, 0);
    var ess = 1 / sumSquares;
    var exact = {
      terminalMean: 0,
      terminalSecond: sigma * sigma * T,
      areaMean: 0,
      areaSecond: discreteAreaVariance(T, sigma, steps)
    };
    return {
      theta: theta,
      T: T,
      sigma: sigma,
      steps: steps,
      sampleCount: sampleCount,
      seed: seed,
      drift: sigma * theta,
      terminal: {
        weightedMean: weightedMean(terminal, normalized.weights),
        weightedSecond: weightedSecond(terminal, normalized.weights),
        exactMean: exact.terminalMean,
        exactSecond: exact.terminalSecond
      },
      area: {
        weightedMean: weightedMean(area, normalized.weights),
        weightedSecond: weightedSecond(area, normalized.weights),
        exactMean: exact.areaMean,
        exactSecond: exact.areaSecond
      },
      weights: normalized.weights,
      weightSummary: {
        rawMean: normalized.rawMean,
        normalizedSum: normalized.weights.reduce(function (total, value) { return total + value; }, 0),
        maxNormalized: Math.max.apply(Math, normalized.weights),
        ess: ess,
        relativeEss: ess / sampleCount,
        logMax: Math.max.apply(Math, logs)
      },
      novikov: {
        expectation: novikovExpectation(theta, T),
        holds: novikovHolds(theta, T),
        density: "dQ/dP = exp(-theta B_T - 0.5 theta^2 T)",
        qBrownian: "B_t + theta t"
      },
      paths: paths,
      exact: exact
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
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function formatNumber(api, value, digits) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    if (!finite(value)) return value === Infinity ? "∞" : "—";
    if (api && typeof api.format === "function") return api.format(value, digits);
    var places = digits === undefined ? 4 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metricNode(api, doc, label, value) {
    return element(api, doc, "div", { className: "gz-metric" }, [
      element(api, doc, "span", {}, label),
      element(api, doc, "strong", {}, value)
    ]);
  }

  function ledgerRow(api, doc, cells) {
    return element(api, doc, "tr", {}, cells.map(function (cell, index) {
      return element(api, doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell);
    }));
  }

  function drawChart(api, doc, result, prefix) {
    var path = result.paths[0];
    var values = [];
    path.forEach(function (point) { values.push(point.drifted, point.nodrift); });
    var yMin = Math.min.apply(Math, values);
    var yMax = Math.max.apply(Math, values);
    if (!(yMax > yMin)) { yMin -= 1; yMax += 1; }
    var pad = Math.max(0.2, 0.12 * (yMax - yMin));
    yMin -= pad;
    yMax += pad;
    var left = 48;
    var width = 700;
    var top = 22;
    var pathHeight = 205;
    var weightTop = 274;
    var weightHeight = 60;
    var timeSpan = result.T > 0 ? result.T : 1;
    function xMap(time) { return left + time / timeSpan * width; }
    function yMap(value) { return top + (yMax - value) / (yMax - yMin) * pathHeight; }
    var children = [
      svgElement(api, doc, "title", { id: prefix + "-chart-title" }, "Girsanov 固定增量路径与归一化权重"),
      svgElement(api, doc, "desc", { id: prefix + "-chart-desc" }, "上图比较 P 下带漂移路径与同一增量的无漂移坐标，下图显示稳定化后的归一化权重。"),
      svgElement(api, doc, "line", { className: "gz-axis", x1: left, y1: top + pathHeight, x2: left + width, y2: top + pathHeight }),
      svgElement(api, doc, "line", { className: "gz-axis", x1: left, y1: top, x2: left, y2: top + pathHeight }),
      svgElement(api, doc, "line", { className: "gz-zero", x1: left, y1: yMap(0), x2: left + width, y2: yMap(0) }),
      svgElement(api, doc, "text", { className: "gz-chart-label", x: left + 7, y: top + 14 }, "同一固定增量的路径"),
      svgElement(api, doc, "text", { className: "gz-label", x: left + width - 3, y: top + pathHeight + 19, "text-anchor": "end" }, "t=" + formatNumber(api, result.T, 2)),
      svgElement(api, doc, "text", { className: "gz-label", x: left - 7, y: top + 4, "text-anchor": "end" }, "X_t")
    ];
    [
      { key: "drifted", className: "gz-path-p" },
      { key: "nodrift", className: "gz-path-q" }
    ].forEach(function (curve) {
      var d = path.map(function (point, index) {
        return (index === 0 ? "M" : "L") + " " + xMap(point.t).toFixed(2) + " " + yMap(point[curve.key]).toFixed(2);
      }).join(" ");
      children.push(svgElement(api, doc, "path", { className: curve.className, d: d }));
    });
    children.push(svgElement(api, doc, "circle", { cx: xMap(result.T), cy: yMap(path[path.length - 1].drifted), r: 4.2, fill: "var(--gz-blue)" }));
    children.push(svgElement(api, doc, "text", { className: "gz-chart-label", x: left + 7, y: weightTop - 10 }, "P 下样本权重（归一化后，固定增量集合）"));
    var barWidth = width / result.weights.length;
    var maxWeight = Math.max.apply(Math, result.weights);
    var weightScale = maxWeight > 0 ? weightHeight / maxWeight : 0;
    children.push(svgElement(api, doc, "line", { className: "gz-axis", x1: left, y1: weightTop + weightHeight, x2: left + width, y2: weightTop + weightHeight }));
    result.weights.forEach(function (weight, index) {
      var height = weight * weightScale;
      children.push(svgElement(api, doc, "rect", { className: "gz-bar", x: left + index * barWidth + 0.3, y: weightTop + weightHeight - height, width: Math.max(0.8, barWidth - 0.7), height: height }));
    });
    children.push(svgElement(api, doc, "line", { className: "gz-bar-top", x1: left, y1: weightTop + weightHeight - (1 / result.weights.length) * weightScale, x2: left + width, y2: weightTop + weightHeight - (1 / result.weights.length) * weightScale }));
    children.push(svgElement(api, doc, "text", { className: "gz-label", x: left + width - 3, y: weightTop + weightHeight + 18, "text-anchor": "end" }, "样本编号"));
    return svgElement(api, doc, "svg", { className: "gz-svg", viewBox: "0 0 760 360", role: "img", "aria-labelledby": prefix + "-chart-title " + prefix + "-chart-desc" }, children);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "gz-" + SERIAL;
    var state = { theta: DEFAULTS.theta, T: DEFAULTS.T, sigma: DEFAULTS.sigma, revealed: false, predictions: { sign: null, drift: null, novikov: null, ess: null } };
    var questions = [
      {
        key: "sign",
        prompt: "若定义 dQ/dP=Z_T 且 Q 下 B_t+θt 是 Brownian，Z_T 的线性项符号是什么？",
        choices: [{ value: "negative", label: "−θB_T" }, { value: "positive", label: "+θB_T" }, { value: "none", label: "没有线性项" }],
        expected: "negative",
        explanation: "方向是 dQ/dP=exp(−θB_T−θ²T/2)；于是 B_t+θt 在 Q 下无漂移。把符号反过来会把漂移方向也反过来。"
      },
      {
        key: "drift",
        prompt: "P 下取 X_t=σθt+σB_t，按上面的 dQ/dP 加权后，Q 下 X_t 的漂移是多少？",
        choices: [{ value: "zero", label: "0：无漂移" }, { value: "double", label: "2σθ" }, { value: "same", label: "仍为 σθ" }],
        expected: "zero",
        explanation: "Q 下写 B_t=\tilde B_t−θt，所以 X_t=σθt+σ(\tilde B_t−θt)=σ\tilde B_t。"
      },
      {
        key: "novikov",
        prompt: "常数有限 θ、有限 T 时，Novikov 条件 E_P exp(θ²T/2) 是否成立？",
        choices: [{ value: "yes", label: "成立且为有限数" }, { value: "no", label: "总是失败" }, { value: "unknown", label: "只靠样本判断" }],
        expected: "yes",
        explanation: "常数 θ 给出 E_P exp(1/2∫θ²dt)=exp(θ²T/2)<∞；这是解析条件，不是有限样本归一化的替代品。"
      },
      {
        key: "ess",
        prompt: "保持样本量不变，把 |θ| 调大时，重要性权重的 ESS 通常怎样？",
        choices: [{ value: "collapse", label: "下降，权重退化" }, { value: "grow", label: "上升，越来越均匀" }, { value: "same", label: "完全不变" }],
        expected: "collapse",
        explanation: "理论测度仍然等价，但有限样本的似然比变得尖锐，少数路径承担几乎全部权重；这是数值诊断，不是定理失效。"
      }
    ];

    function makeQuestion(question) {
      var fieldset = element(api, doc, "fieldset", { className: "gz-question" });
      fieldset.appendChild(element(api, doc, "legend", {}, question.prompt));
      var row = element(api, doc, "div", { className: "gz-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; renderPrediction(); });
        choice.button = button;
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    var gate = element(api, doc, "section", { className: "gz-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(api, doc, "h3", { id: prefix + "-gate-title" }, "预测门：先核对符号与测度方向"));
    gate.appendChild(element(api, doc, "p", { className: "gz-intro" }, "先回答四问；提交前不显示加权账本、ESS 或答案。实验的固定增量是数值示范，不是有限样本对 Girsanov 定理的证明。"));
    questions.forEach(function (question) { gate.appendChild(makeQuestion(question)); });
    var gateActions = element(api, doc, "div", { className: "gz-actions" });
    var reveal = element(api, doc, "button", { type: "button", className: "gz-primary" }, "提交预测并揭示");
    var reset = element(api, doc, "button", { type: "button" }, "重置");
    var feedback = element(api, doc, "p", { className: "gz-feedback", "aria-live": "polite" }, "");
    gateActions.appendChild(reveal);
    gateActions.appendChild(reset);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);

    var presetGrid = element(api, doc, "div", { className: "gz-preset-grid", role: "group", "aria-label": "漂移预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(api, doc, "button", { type: "button", "aria-pressed": preset.id === "moderate" ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () { state.theta = preset.theta; state.T = preset.T; state.sigma = preset.sigma; render(); });
      presetButtons.push({ preset: preset, node: button });
      presetGrid.appendChild(button);
    });
    var thetaOutput = element(api, doc, "output", {}, formatNumber(api, state.theta, 2));
    var thetaInput = element(api, doc, "input", { type: "range", min: "-5", max: "5", step: "0.1", value: String(state.theta), "aria-label": "theta" });
    var timeOutput = element(api, doc, "output", {}, formatNumber(api, state.T, 2));
    var timeInput = element(api, doc, "input", { type: "range", min: "0", max: "2", step: "0.05", value: String(state.T), "aria-label": "时间 T" });
    var sigmaOutput = element(api, doc, "output", {}, formatNumber(api, state.sigma, 2));
    var sigmaInput = element(api, doc, "input", { type: "range", min: "0.5", max: "2", step: "0.05", value: String(state.sigma), "aria-label": "sigma" });
    thetaInput.addEventListener("input", function () { state.theta = Number(thetaInput.value); render(); });
    timeInput.addEventListener("input", function () { state.T = Number(timeInput.value); render(); });
    sigmaInput.addEventListener("input", function () { state.sigma = Number(sigmaInput.value); render(); });
    var controls = element(api, doc, "section", { className: "gz-controls", "aria-labelledby": prefix + "-controls-title" }, [
      element(api, doc, "h4", { id: prefix + "-controls-title" }, "参数"),
      presetGrid,
      element(api, doc, "div", { className: "gz-control" }, [element(api, doc, "label", {}, ["θ = ", thetaOutput]), thetaInput]),
      element(api, doc, "div", { className: "gz-control" }, [element(api, doc, "label", {}, ["T = ", timeOutput]), timeInput]),
      element(api, doc, "div", { className: "gz-control" }, [element(api, doc, "label", {}, ["σ = ", sigmaOutput]), sigmaInput]),
      element(api, doc, "p", { className: "gz-note" }, "P 下固定模型：X_t=σθt+σB_t；权重只用同一条 Brownian 终值 B_T。图像每次重算同一 seed 的 192 条路径。")
    ]);

    var chartHost = element(api, doc, "div", { className: "gz-stage-frame" });
    var legend = element(api, doc, "div", { className: "gz-legend", "aria-label": "图例" }, [
      element(api, doc, "span", { className: "gz-legend-item" }, [element(api, doc, "i", { className: "gz-swatch gz-swatch-p" }), "P 下带漂移 X_t"]),
      element(api, doc, "span", { className: "gz-legend-item" }, [element(api, doc, "i", { className: "gz-swatch gz-swatch-q" }), "Q 下无漂移坐标 σB_t"]),
      element(api, doc, "span", { className: "gz-legend-item" }, [element(api, doc, "i", { className: "gz-swatch gz-swatch-weight" }), "归一化权重"])
    ]);
    var metricGrid = element(api, doc, "div", { className: "gz-metrics", "aria-label": "权重与目标矩" });
    var metricWeight = element(api, doc, "div");
    var metricEss = element(api, doc, "div");
    var metricTerminal = element(api, doc, "div");
    var metricArea = element(api, doc, "div");
    var metricNovikov = element(api, doc, "div");
    var metricDrift = element(api, doc, "div");
    [metricWeight, metricEss, metricTerminal, metricArea, metricNovikov, metricDrift].forEach(function (node) { metricGrid.appendChild(node); });
    var ledgerBody = element(api, doc, "tbody");
    var table = element(api, doc, "table", { "aria-label": "Girsanov 权重逐项账本" }, [
      element(api, doc, "caption", {}, "逐项账本：测度方向、归一化、目标矩与退化诊断"),
      element(api, doc, "thead", {}, [element(api, doc, "tr", {}, [
        element(api, doc, "th", { scope: "col" }, "对象"),
        element(api, doc, "th", { scope: "col" }, "当前读数"),
        element(api, doc, "th", { scope: "col" }, "解析目标 / 读法")
      ])]),
      ledgerBody
    ]);
    var caution = element(api, doc, "p", { className: "gz-caution" }, "反例与迁移：有限样本把权重归一化为 1，不等于证明 E_P[Z_T]=1。常数有限 θ、有限 T 时 Z_T>0 且 Novikov 成立，Q 与 P 等价；无限时间、不可积的随机 θ 或只得到局部鞅时，不能自动声称存在同一个概率 Q。迁移到非高斯增量时，指数形式与可积性检查必须重新证明。 ");
    var stage = element(api, doc, "section", { className: "gz-revealed", hidden: true, "aria-labelledby": prefix + "-stage-title" });
    stage.appendChild(element(api, doc, "h3", { id: prefix + "-stage-title" }, "权重账本与固定 Brownian 增量"));
    stage.appendChild(element(api, doc, "div", { className: "gz-layout" }, [
      controls,
      element(api, doc, "section", { className: "gz-stage" }, [
        element(api, doc, "div", { className: "gz-chart-title" }, [element(api, doc, "span", {}, "路径与权重"), element(api, doc, "span", { className: "gz-note" }, "固定 seed，不是定理证明")]),
        chartHost,
        legend,
        metricGrid,
        element(api, doc, "div", { className: "gz-ledger" }, table),
        caution
      ])
    ]));
    root.replaceChildren(gate, stage);
    root.classList.add("gz-lab");

    function renderPrediction() {
      questions.forEach(function (question) {
        question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", state.predictions[question.key] === choice.value ? "true" : "false"); });
      });
      var complete = questions.every(function (question) { return state.predictions[question.key] !== null; });
      reveal.disabled = !complete || state.revealed;
      if (!state.revealed) {
        feedback.textContent = complete ? "预测已记录；点击提交后才会揭示结果。" : "请先完成四个预测。";
        feedback.className = "gz-feedback";
      }
    }

    function renderMetrics(result) {
      replaceChildren(metricWeight, metricNode(api, doc, "样本平均 Z_T", formatNumber(api, result.weightSummary.rawMean, 5)));
      replaceChildren(metricEss, metricNode(api, doc, "ESS / N", formatNumber(api, result.weightSummary.ess, 2) + " / " + result.sampleCount));
      replaceChildren(metricTerminal, metricNode(api, doc, "加权 E_Q[X_T]", formatNumber(api, result.terminal.weightedMean, 5)));
      replaceChildren(metricArea, metricNode(api, doc, "加权 E_Q[A_T]", formatNumber(api, result.area.weightedMean, 5)));
      replaceChildren(metricNovikov, metricNode(api, doc, "Novikov 值", formatNumber(api, result.novikov.expectation, 4)));
      replaceChildren(metricDrift, metricNode(api, doc, "P 下漂移 σθ", formatNumber(api, result.drift, 4)));
    }

    function renderLedger(result) {
      var rows = [
        ledgerRow(api, doc, ["测度方向", "dQ/dP", "Z_T=exp(−θB_T−θ²T/2)；Q 下 B_t+θt 为 Brownian"]),
        ledgerRow(api, doc, ["样本平均 Z_T", formatNumber(api, result.weightSummary.rawMean, 7), "解析 E_P[Z_T]=1；有限集合会有采样误差"]),
        ledgerRow(api, doc, ["归一化权重和", formatNumber(api, result.weightSummary.normalizedSum, 7), "数值稳定化后强制为 1，不是定理证明"]),
        ledgerRow(api, doc, ["E_Q[X_T]", formatNumber(api, result.terminal.weightedMean, 7), "目标 0；X_T=σθT+σB_T 在 P 下带漂移"]),
        ledgerRow(api, doc, ["E_Q[X_T²]", formatNumber(api, result.terminal.weightedSecond, 7), "目标 σ²T=" + formatNumber(api, result.terminal.exactSecond, 5)]),
        ledgerRow(api, doc, ["E_Q[A_T]", formatNumber(api, result.area.weightedMean, 7), "A_T=∫X_tdt 的目标均值 0；这是路径量"]),
        ledgerRow(api, doc, ["E_Q[A_T²]", formatNumber(api, result.area.weightedSecond, 7), "离散梯形路径的解析目标 " + formatNumber(api, result.area.exactSecond, 5)]),
        ledgerRow(api, doc, ["ESS", formatNumber(api, result.weightSummary.ess, 5), "1/Σw_i²；|θ| 大时有限样本权重退化"]),
        ledgerRow(api, doc, ["Novikov / AC", result.novikov.holds ? "成立 / 等价" : "不成立", "常数有限 θ、有限 T：exp(θ²T/2)<∞ 且 Z_T>0"])
      ];
      replaceChildren(ledgerBody, rows);
    }

    function render() {
      thetaInput.value = String(state.theta);
      timeInput.value = String(state.T);
      sigmaInput.value = String(state.sigma);
      thetaOutput.textContent = formatNumber(api, state.theta, 2);
      timeOutput.textContent = formatNumber(api, state.T, 2);
      sigmaOutput.textContent = formatNumber(api, state.sigma, 2);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.preset.theta === state.theta && item.preset.T === state.T && item.preset.sigma === state.sigma ? "true" : "false"); });
      stage.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = evaluate({ theta: state.theta, T: state.T, sigma: state.sigma, steps: DEFAULTS.steps, sampleCount: DEFAULTS.sampleCount, seed: DEFAULTS.seed });
      replaceChildren(chartHost, drawChart(api, doc, result, prefix));
      renderMetrics(result);
      renderLedger(result);
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.textContent = "请先完成四个预测。";
        feedback.className = "gz-feedback gz-warn";
        return;
      }
      state.revealed = true;
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      render();
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中。符号、测度方向、Novikov 和 ESS 已列入账本。";
      feedback.className = "gz-feedback " + (correct === questions.length ? "gz-pass" : "gz-warn");
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.theta = DEFAULTS.theta;
      state.T = DEFAULTS.T;
      state.sigma = DEFAULTS.sigma;
      state.revealed = false;
      state.predictions = { sign: null, drift: null, novikov: null, ess: null };
      renderPrediction();
      render();
      feedback.textContent = "已重置；答案再次隐藏。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });

    renderPrediction();
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("girsanov-weights self-test failed: " + message);
    }
    function close(left, right, tolerance, message) {
      assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")");
    }
    close(logRadonNikodym(1, 2, 1), -2.5, 1e-12, "RN sign and quadratic term");
    close(tiltedBrownianMgf(1, 1, 1), Math.exp(-0.5), 1e-12, "measure direction mgf");
    close(tiltedBrownianMgf(2, 1, 0), 1, 1e-12, "normalizer mgf at zero");
    close(novikovExpectation(2, 1), Math.exp(2), 1e-12, "Novikov value");
    assert(novikovHolds(100, 2) === true, "finite constant Novikov boundary");
    close(discreteAreaVariance(1, 1, 48), Math.pow(1, 3) * (48 * 48 / 3 - 1 / 12) / (48 * 48), 1e-10, "discrete area variance");
    var zero = evaluate({ theta: 0, T: 1, sigma: 1, steps: 8, sampleCount: 16, seed: 7 });
    close(zero.weightSummary.rawMean, 1, 1e-12, "theta zero raw normalization");
    close(zero.weightSummary.normalizedSum, 1, 1e-12, "normalized weights sum");
    close(zero.weightSummary.ess, 16, 1e-12, "theta zero ESS");
    close(zero.terminal.exactSecond, 1, 1e-12, "theta zero analytic target second moment");
    assert(finite(zero.terminal.weightedSecond), "theta zero finite-sample second moment");
    var zeroTime = evaluate({ theta: 4, T: 0, sigma: 2, steps: 8, sampleCount: 16, seed: 7 });
    close(zeroTime.weightSummary.rawMean, 1, 1e-12, "T zero normalization");
    close(zeroTime.terminal.weightedMean, 0, 1e-12, "T zero terminal");
    close(zeroTime.area.weightedSecond, 0, 1e-12, "T zero path quantity");
    var repeatA = generateStandardEnsemble(11, 3, 4);
    var repeatB = generateStandardEnsemble(11, 3, 4);
    assert(JSON.stringify(repeatA) === JSON.stringify(repeatB), "fixed Gaussian increments reproducibility");
    var sample = evaluate({ theta: 1, T: 1, sigma: 1, steps: 8, sampleCount: 16, seed: 11 });
    assert(sample.weights.length === 16 && sample.paths[0].length === 9, "ensemble dimensions");
    assert(sample.weightSummary.ess >= 1 && sample.weightSummary.ess <= 16, "ESS bounds");
    close(sample.paths[0][8].drifted, sample.drift + sample.paths[0][8].brownian, 1e-12, "P drifted path sign");
    var threw = false;
    try { logRadonNikodym(1, 1, -1); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "negative horizon rejected");
    threw = false;
    try { evaluate({ theta: Infinity }); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "non-finite theta rejected");
    threw = false;
    try { evaluate({ sigma: 0 }); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "non-positive sigma rejected");
    threw = false;
    try { evaluate({ steps: 0 }); } catch (error) { threw = error instanceof RangeError; }
    assert(threw, "invalid steps rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    makeRng: makeRng,
    gaussian: gaussian,
    generateStandardEnsemble: generateStandardEnsemble,
    logRadonNikodym: logRadonNikodym,
    novikovExpectation: novikovExpectation,
    novikovHolds: novikovHolds,
    tiltedBrownianMgf: tiltedBrownianMgf,
    discreteAreaVariance: discreteAreaVariance,
    evaluate: evaluate,
    selfTest: selfTest,
    mount: mount
  };
});
