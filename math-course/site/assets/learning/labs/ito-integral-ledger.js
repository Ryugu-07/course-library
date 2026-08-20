(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ito-integral-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("ito-integral-ledger self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("ito-integral-ledger self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-ito-integral-ledger-styles";
  var SERIAL = 0;
  var DEFAULTS = { T: 1, level: 6, maxLevel: 9, paths: 96, pathIndex: 1, seed: 20260722 };
  var PRESETS = [
    { id: "baseline", label: "基准：96 条", T: 1, level: 6, maxLevel: 9, paths: 96, pathIndex: 1, seed: 20260722 },
    { id: "coarse", label: "粗分割：2⁴", T: 1, level: 4, maxLevel: 9, paths: 96, pathIndex: 1, seed: 20260722 },
    { id: "fine", label: "细分割：2⁹", T: 1, level: 9, maxLevel: 9, paths: 96, pathIndex: 1, seed: 20260722 },
    { id: "single", label: "单路径诊断", T: 1, level: 6, maxLevel: 9, paths: 1, pathIndex: 1, seed: 20260722 },
    { id: "longer", label: "T=2：同一规则", T: 2, level: 6, maxLevel: 9, paths: 96, pathIndex: 1, seed: 20260722 }
  ];
  var STYLE_TEXT = [
    ".il-lab{--il-blue:var(--cl-blue,#315f9d);--il-gold:var(--cl-gold,#9b6a12);--il-green:var(--cl-green,#39734d);--il-red:var(--cl-red,#b64335);--il-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .il-lab{--il-blue:#83c8ff;--il-gold:#e2b458;--il-green:#72bd8b;--il-red:#f08c7d;--il-soft:#b8b2a7;}",
    ".il-lab *,.il-lab *::before,.il-lab *::after{box-sizing:border-box;}.il-lab [hidden]{display:none!important;}",
    ".il-lab h3,.il-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.il-lab h3{font-size:1.18rem;}.il-lab h4{font-size:1rem;}.il-lab .il-intro,.il-lab .il-note,.il-lab .il-feedback{color:var(--il-soft);font-size:13px;line-height:1.7;}",
    ".il-lab .il-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--il-gold);background:var(--bg);}.il-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.il-lab legend{max-width:100%;padding:0 4px;color:var(--il-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere;}",
    ".il-lab .il-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.il-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.il-lab button:hover{border-color:var(--accent);}.il-lab button[aria-pressed=\"true\"],.il-lab button.il-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.il-lab button:disabled{cursor:not-allowed;opacity:.55;}.il-lab button:focus-visible,.il-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".il-lab .il-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.il-lab .il-actions>*{flex:1 1 170px;}.il-lab .il-feedback{min-height:2em;margin:8px 0;font-weight:700;}.il-lab .il-pass{color:var(--il-green);}.il-lab .il-warn{color:var(--il-red);}",
    ".il-lab .il-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.il-lab .il-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:11px 0;}.il-lab .il-presets button{font-size:12px;}.il-lab .il-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:12px 0;}.il-lab .il-control{display:grid;gap:5px;min-width:0;}.il-lab .il-control label{color:var(--il-soft);font-size:13px;font-weight:700;}.il-lab output{color:var(--accent);font-variant-numeric:tabular-nums;}.il-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".il-lab .il-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0;}.il-lab .il-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.il-lab .il-metric:nth-child(1),.il-lab .il-metric:nth-child(4){border-top-color:var(--il-blue);}.il-lab .il-metric:nth-child(2),.il-lab .il-metric:nth-child(5){border-top-color:var(--il-gold);}.il-lab .il-metric:nth-child(3),.il-lab .il-metric:nth-child(6){border-top-color:var(--il-green);}.il-lab .il-metric span{display:block;color:var(--il-soft);font-size:11.5px;line-height:1.4;}.il-lab .il-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".il-lab .il-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.il-lab svg{display:block;width:100%;height:auto;min-width:700px;color:var(--fg);}.il-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.il-lab .il-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7;}.il-lab .il-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.il-lab .il-qv{fill:none;stroke:var(--il-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}.il-lab .il-target{stroke:var(--il-gold);stroke-width:1.6;stroke-dasharray:5 4;}.il-lab .il-bar{fill:var(--il-green);fill-opacity:.74;}.il-lab .il-bar-sample{fill:var(--il-blue);fill-opacity:.74;}.il-lab .il-chart-title{font-size:13px;font-weight:750;}.il-lab .il-chart-label{font-size:11px;}",
    ".il-lab .il-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.il-lab table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.il-lab caption{padding:0 0 7px;text-align:left;color:var(--il-soft);font-size:12px;line-height:1.55;}.il-lab th,.il-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap;}.il-lab th{color:var(--il-soft);font-size:11.5px;font-weight:750;}.il-lab .il-good{color:var(--il-green);font-weight:750;}.il-lab .il-bad{color:var(--il-red);font-weight:750;}.il-lab .il-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--il-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.il-lab .il-presets{grid-template-columns:repeat(3,minmax(0,1fr));}.il-lab .il-controls{grid-template-columns:repeat(2,minmax(0,1fr));}.il-lab .il-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}",
    "@media(max-width:650px){.il-lab .il-choice-row,.il-lab .il-presets,.il-lab .il-controls,.il-lab .il-metrics{grid-template-columns:minmax(0,1fr);}.il-lab .il-chart{padding:5px;}}",
    "@media(prefers-reduced-motion:reduce){.il-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function number(value, fallback) {
    if (value === null || value === "") return fallback;
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSeed(value) {
    return Math.floor(number(value, DEFAULTS.seed)) >>> 0;
  }

  function normalizeConfig(input) {
    var source = input || {};
    var maxLevel = Math.round(clamp(number(source.maxLevel, DEFAULTS.maxLevel), 2, 9));
    var paths = Math.round(clamp(number(source.paths, DEFAULTS.paths), 1, 192));
    return {
      T: clamp(number(source.T, DEFAULTS.T), 0, 4),
      level: Math.round(clamp(number(source.level, DEFAULTS.level), 1, maxLevel)),
      maxLevel: maxLevel,
      paths: paths,
      pathIndex: Math.round(clamp(number(source.pathIndex, DEFAULTS.pathIndex), 1, paths)),
      seed: normalizeSeed(source.seed)
    };
  }

  function copyConfig(config) {
    return {
      T: config.T,
      level: config.level,
      maxLevel: config.maxLevel,
      paths: config.paths,
      pathIndex: config.pathIndex,
      seed: config.seed
    };
  }

  function makeRng(seed) {
    var state = normalizeSeed(seed);
    return function () {
      var value;
      state = (state + 0x6D2B79F5) >>> 0;
      value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(rng) {
    var u = Math.max(rng(), Number.MIN_VALUE);
    var v = Math.max(rng(), Number.MIN_VALUE);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function generateFinePaths(config) {
    var rng = makeRng(config.seed);
    var fineSteps = 1 << config.maxLevel;
    var scale = Math.sqrt(config.T / fineSteps);
    var paths = [];
    var pathIndex;
    var step;
    for (pathIndex = 0; pathIndex < config.paths; pathIndex += 1) {
      var increments = [];
      for (step = 0; step < fineSteps; step += 1) increments.push(scale * normal(rng));
      paths.push(increments);
    }
    return paths;
  }

  function aggregate(increments, fromLevel, targetLevel) {
    var factor = 1 << (fromLevel - targetLevel);
    var result = [];
    var index;
    var offset;
    for (index = 0; index < increments.length; index += factor) {
      var sum = 0;
      for (offset = 0; offset < factor; offset += 1) sum += increments[index + offset];
      result.push(sum);
    }
    return result;
  }

  function summarizePath(increments, T) {
    var steps = increments.length;
    var dt = steps ? T / steps : 0;
    var current = 0;
    var qv = 0;
    var left = 0;
    var right = 0;
    var midpoint = 0;
    var energy = 0;
    var values = [0];
    var index;
    for (index = 0; index < steps; index += 1) {
      var delta = increments[index];
      qv += delta * delta;
      left += current * delta;
      right += (current + delta) * delta;
      midpoint += (current + 0.5 * delta) * delta;
      energy += current * current * dt;
      current += delta;
      values.push(current);
    }
    return {
      steps: steps,
      terminal: current,
      values: values,
      qv: qv,
      left: left,
      right: right,
      midpoint: midpoint,
      energy: energy,
      leftIdentityResidual: left + 0.5 * qv - 0.5 * current * current,
      rightIdentityResidual: right - 0.5 * qv - 0.5 * current * current,
      midpointIdentityResidual: midpoint - 0.5 * current * current
    };
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var finePaths = generateFinePaths(config);
    var currentSummaries = finePaths.map(function (increments) {
      return summarizePath(aggregate(increments, config.maxLevel, config.level), config.T);
    });
    var selectedFine = finePaths[config.pathIndex - 1];
    var pathLevels = [];
    var level;
    for (level = 1; level <= config.maxLevel; level += 1) {
      pathLevels.push({
        level: level,
        summary: summarizePath(aggregate(selectedFine, config.maxLevel, level), config.T)
      });
    }
    var steps = 1 << config.level;
    var leftValues = currentSummaries.map(function (item) { return item.left; });
    var energyValues = currentSummaries.map(function (item) { return item.energy; });
    var qvValues = currentSummaries.map(function (item) { return item.qv; });
    var discreteTarget = config.T * config.T * (steps - 1) / (2 * steps);
    var continuousTarget = config.T * config.T / 2;
    var sample = {
      count: config.paths,
      meanLeft: mean(leftValues),
      meanLeftSquare: mean(leftValues.map(function (value) { return value * value; })),
      meanEnergy: mean(energyValues),
      meanQv: mean(qvValues),
      discreteIsometryTarget: discreteTarget,
      continuousIsometryTarget: continuousTarget,
      qvTarget: config.T,
      leftSquareGapToDiscrete: mean(leftValues.map(function (value) { return value * value; })) - discreteTarget,
      energyGapToContinuous: mean(energyValues) - continuousTarget
    };
    return {
      config: config,
      steps: steps,
      selectedPath: currentSummaries[config.pathIndex - 1],
      pathLevels: pathLevels,
      sample: sample
    };
  }

  function predictionAnswers() {
    return {
      endpoint: "left",
      correction: "right-plus",
      singlePath: "diagnostic",
      isometry: "half-square"
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 5 : digits;
    var absolute = Math.abs(value);
    if (absolute > 0 && (absolute < 0.001 || absolute >= 10000)) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, value);
    });
    return appendChildren(node, children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null) node.setAttribute(key, value);
    });
    return appendChildren(node, children, doc);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "il-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function pathFor(points, x, y) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + x(point.level).toFixed(2) + " " + y(point.summary.qv).toFixed(2);
    }).join(" ");
  }

  function drawChart(api, doc, svg, result, uid) {
    clear(svg);
    var width = 780;
    var height = 370;
    var top = 38;
    var bottom = 52;
    var leftA = 52;
    var rightA = 365;
    var leftB = 430;
    var rightB = 758;
    var plotBottom = height - bottom;
    var pathValues = result.pathLevels.map(function (item) { return item.summary.qv; }).concat([result.config.T]);
    var qvMax = Math.max(1e-9, Math.max.apply(null, pathValues) * 1.12);
    function xA(level) {
      return leftA + (level - 1) / Math.max(1, result.config.maxLevel - 1) * (rightA - leftA);
    }
    function yA(value) {
      return plotBottom - value / qvMax * (plotBottom - top);
    }
    var bars = [
      { label: "E[I²]", value: result.sample.meanLeftSquare, className: "il-bar-sample" },
      { label: "E∫B²", value: result.sample.meanEnergy, className: "il-bar" },
      { label: "离散目标", value: result.sample.discreteIsometryTarget, className: "il-bar" },
      { label: "连续目标", value: result.sample.continuousIsometryTarget, className: "il-target" }
    ];
    var barMax = Math.max(1e-9, Math.max.apply(null, bars.map(function (item) { return Math.abs(item.value); })) * 1.2);
    function xB(index) {
      return leftB + (index + 0.5) / bars.length * (rightB - leftB);
    }
    function yB(value) {
      return plotBottom - value / barMax * (plotBottom - top);
    }
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-chart-title" }, "二次变差与 Itô 等距的双账本"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-chart-desc" }, "左图显示同一条路径的二次变差随 dyadic 层级变化，右图比较多路径样本与离散、连续等距目标。"));
    [0, qvMax / 2, qvMax].forEach(function (value) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: yA(value), x2: rightA, y2: yA(value), className: "il-grid" }));
      svg.appendChild(svgText(api, doc, leftA - 8, yA(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: yA(result.config.T), x2: rightA, y2: yA(result.config.T), className: "il-target" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: pathFor(result.pathLevels, xA, yA), className: "il-qv" }));
    result.pathLevels.forEach(function (item) {
      svg.appendChild(makeSvg(api, doc, "circle", { cx: xA(item.level), cy: yA(item.summary.qv), r: 3.5, fill: "var(--il-blue)" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: plotBottom, x2: rightA, y2: plotBottom, className: "il-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: top, x2: leftA, y2: plotBottom, className: "il-axis" }));
    svg.appendChild(svgText(api, doc, leftA, 20, "单路径 Q_L：诊断，不是证明", { className: "il-chart-title" }));
    svg.appendChild(svgText(api, doc, rightA, 20, "金虚线：T", { "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, (leftA + rightA) / 2, height - 13, "dyadic 层 L", { "text-anchor": "middle" }));
    [0, barMax / 2, barMax].forEach(function (value) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: yB(value), x2: rightB, y2: yB(value), className: "il-grid" }));
      svg.appendChild(svgText(api, doc, leftB - 8, yB(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    bars.forEach(function (item, index) {
      var barWidth = (rightB - leftB) / bars.length * 0.58;
      var barX = xB(index) - barWidth / 2;
      var barTop = yB(Math.max(0, item.value));
      var barHeight = Math.max(1, plotBottom - barTop);
      svg.appendChild(makeSvg(api, doc, "rect", { x: barX, y: barTop, width: barWidth, height: barHeight, className: item.className }));
      svg.appendChild(svgText(api, doc, xB(index), plotBottom + 18, item.label, { "text-anchor": "middle" }));
      svg.appendChild(svgText(api, doc, xB(index), barTop - 6, format(item.value, 3), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: plotBottom, x2: rightB, y2: plotBottom, className: "il-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: top, x2: leftB, y2: plotBottom, className: "il-axis" }));
    svg.appendChild(svgText(api, doc, leftB, 20, "多路径：E[I_L²] 与 E∫B²dt", { className: "il-chart-title" }));
    svg.appendChild(svgText(api, doc, rightB, 20, "离散目标与连续目标分开", { "text-anchor": "end" }));
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "il-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function ledger(api, doc, result) {
    var path = result.selectedPath;
    var sample = result.sample;
    var rows = [
      ["单路径 Q_n", format(path.qv, 7), format(sample.qvTarget, 5), "二次变差样本；不证明极限"],
      ["左端 Itô 和 I_L", format(path.left, 7), "B_T²/2 − Q_n/2", "B_{t_j} 是 F_{t_j}-可测"],
      ["右端和 I_R", format(path.right, 7), "I_L + Q_n", "偷看下一段增量，修正为 +Q"],
      ["中点和 I_M", format(path.midpoint, 7), "I_L + Q_n/2", "Stratonovich 型修正"],
      ["左端恒等式残差", format(path.leftIdentityResidual, 9), "0", "有限路径代数核对"],
      ["E[I_L²] 样本", format(sample.meanLeftSquare, 7), format(sample.discreteIsometryTarget, 7), "离散左和的有限分割目标"],
      ["E∫B²dt 样本", format(sample.meanEnergy, 7), format(sample.continuousIsometryTarget, 7), "连续等距目标 T²/2"],
      ["多路径数 N", String(sample.count), "N 趋大才谈样本均值", "仍是 Monte Carlo 诊断"]
    ];
    var tableNode = makeElement(api, doc, "table", {});
    tableNode.appendChild(makeElement(api, doc, "caption", {}, "透明账本：路径恒等式、可测性和期望量词分栏。"));
    tableNode.appendChild(makeElement(api, doc, "thead", {}, makeElement(api, doc, "tr", {}, [
      makeElement(api, doc, "th", {}, "项目"),
      makeElement(api, doc, "th", {}, "当前值"),
      makeElement(api, doc, "th", {}, "目标 / 修正"),
      makeElement(api, doc, "th", {}, "读法")
    ])));
    var body = makeElement(api, doc, "tbody", {});
    rows.forEach(function (row) {
      body.appendChild(makeElement(api, doc, "tr", {}, row.map(function (cell, index) {
        return makeElement(api, doc, "td", { className: index === 0 ? "il-good" : "" }, cell);
      })));
    });
    tableNode.appendChild(body);
    return tableNode;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    installStyles(doc);
    clear(root);
    root.className = "il-lab";
    var uid = "il-" + (++SERIAL);
    var state = {
      config: copyConfig(DEFAULTS),
      revealed: false,
      predictions: { endpoint: null, correction: null, singlePath: null, isometry: null }
    };
    var questions = [
      {
        key: "endpoint",
        title: "Itô 简单过程应取哪个端点？",
        choices: [["left", "左端点 B_tj"], ["right", "右端点 B_tj+1"], ["mid", "中点"]]
      },
      {
        key: "correction",
        title: "右端点相对左端点的修正？",
        choices: [["right-plus", "多 Q_n"], ["mid-half", "多 Q_n/2"], ["same", "没有修正"]]
      },
      {
        key: "singlePath",
        title: "一条路径的 Q_n 能证明二次变差定理吗？",
        choices: [["prove", "可以证明"], ["diagnostic", "只能作有限诊断"], ["unknown", "无法判断"]]
      },
      {
        key: "isometry",
        title: "连续模型中共同的期望目标？",
        choices: [["half-square", "T²/2"], ["T", "T"], ["zero", "0"]]
      }
    ];
    var shell = makeElement(api, doc, "div", {});
    shell.appendChild(makeElement(api, doc, "h3", { text: "Itô 积分账本：左、右、中点与期望等距" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "il-intro", text: "固定 seeded Brownian 路径；路径级二次变差和多路径期望分别揭示，避免用一个样本承担两个量词。" }));
    var form = makeElement(api, doc, "form", { className: "il-gate", "aria-labelledby": uid + "-gate-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-gate-title", text: "预测门：先判断端点、修正和量词" }));
    var choiceNodes = [];
    var feedback;
    questions.forEach(function (question) {
      var field = makeElement(api, doc, "fieldset", {});
      field.appendChild(makeElement(api, doc, "legend", {}, question.title));
      var row = makeElement(api, doc, "div", { className: "il-choice-row" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          choiceNodes.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.className = "il-feedback";
          feedback.textContent = "预测已记录；四项都选好后揭示双账本。";
        });
        choiceNodes.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      form.appendChild(field);
    });
    var actions = makeElement(api, doc, "div", { className: "il-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "il-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置预测");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    feedback = makeElement(api, doc, "p", { className: "il-feedback", "aria-live": "polite" }, "路径、结果和账本在揭示前保持隐藏。");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(api, doc, "section", { className: "il-revealed", hidden: "hidden", "aria-labelledby": uid + "-result-title" });
    revealed.appendChild(makeElement(api, doc, "h3", { id: uid + "-result-title", text: "结果账本：单路径与多路径各自负责什么" }));
    var presetWrap = makeElement(api, doc, "div", { className: "il-presets" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button" }, preset.label);
      button.addEventListener("click", function () {
        state.config = copyConfig(preset);
        syncControls();
        renderResult();
      });
      presetWrap.appendChild(button);
    });
    revealed.appendChild(presetWrap);
    var controls = makeElement(api, doc, "div", { className: "il-controls" });
    var controlInputs = {};
    function addRange(key, label, min, max, step) {
      var input = makeElement(api, doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      var output = makeElement(api, doc, "output", { "data-control-output": key }, format(state.config[key], key === "paths" || key === "level" ? 0 : 2));
      var field = makeElement(api, doc, "div", { className: "il-control" }, [
        makeElement(api, doc, "label", {}, [label, " ", output]),
        input
      ]);
      input.addEventListener("input", function () {
        state.config[key] = Math.round(Number(input.value)) === Number(input.value) && (key === "level" || key === "paths" || key === "pathIndex")
          ? Math.round(Number(input.value))
          : Number(input.value);
        if (key === "paths") state.config.pathIndex = Math.min(state.config.pathIndex, state.config.paths);
        if (key === "level") state.config.level = Math.min(state.config.level, state.config.maxLevel);
        output.textContent = format(state.config[key], key === "paths" || key === "level" ? 0 : 2);
        syncControls();
        renderResult();
      });
      controlInputs[key] = { input: input, output: output };
      controls.appendChild(field);
    }
    addRange("T", "终点 T", 0, 4, 0.1);
    addRange("level", "当前层 L", 1, DEFAULTS.maxLevel, 1);
    addRange("paths", "路径数 N", 1, 192, 1);
    addRange("pathIndex", "显示路径", 1, 192, 1);
    revealed.appendChild(controls);
    var metricsNode = makeElement(api, doc, "div", { className: "il-metrics" });
    var chartWrap = makeElement(api, doc, "div", { className: "il-chart" });
    var chart = makeSvg(api, doc, "svg", { viewBox: "0 0 780 370", role: "img", "aria-labelledby": uid + "-chart-title " + uid + "-chart-desc" });
    chartWrap.appendChild(chart);
    var ledgerWrap = makeElement(api, doc, "div", { className: "il-ledger" });
    var interpretation = makeElement(api, doc, "p", { className: "il-interpretation" });
    revealed.appendChild(metricsNode);
    revealed.appendChild(chartWrap);
    revealed.appendChild(ledgerWrap);
    revealed.appendChild(interpretation);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function syncControls() {
      controlInputs.T.input.value = state.config.T;
      controlInputs.T.output.textContent = format(state.config.T, 2);
      controlInputs.level.input.value = state.config.level;
      controlInputs.level.output.textContent = format(state.config.level, 0);
      controlInputs.paths.input.value = state.config.paths;
      controlInputs.paths.output.textContent = format(state.config.paths, 0);
      controlInputs.pathIndex.input.max = state.config.paths;
      controlInputs.pathIndex.input.value = Math.min(state.config.pathIndex, state.config.paths);
      controlInputs.pathIndex.output.textContent = format(Math.min(state.config.pathIndex, state.config.paths), 0);
    }

    function renderResult() {
      var result = compute(state.config);
      state.config = result.config;
      syncControls();
      metricsNode.replaceChildren(
        metric(api, doc, "T / 2^L", format(result.config.T, 2) + " / " + result.steps),
        metric(api, doc, "路径 Q_n", format(result.selectedPath.qv, 6)),
        metric(api, doc, "左 / 右和", format(result.selectedPath.left, 5) + " / " + format(result.selectedPath.right, 5)),
        metric(api, doc, "中点和", format(result.selectedPath.midpoint, 5)),
        metric(api, doc, "E[I_L²] / 离散目标", format(result.sample.meanLeftSquare, 4) + " / " + format(result.sample.discreteIsometryTarget, 4)),
        metric(api, doc, "E∫B² / 连续目标", format(result.sample.meanEnergy, 4) + " / " + format(result.sample.continuousIsometryTarget, 4))
      );
      drawChart(api, doc, chart, result, uid);
      clear(ledgerWrap);
      ledgerWrap.appendChild(ledger(api, doc, result));
      interpretation.textContent = result.config.paths === 1
        ? "当前只有一条路径：Q_n 与三种和仍可核对逐段恒等式，但样本均值没有独立的期望量词，不能凭它证明等距。"
        : "左端点是适应的 Itô 取法；右端/中点的差异由 Q_n 修正。右图把离散左和目标与连续 T²/2 分开，有限 N 只提供 Monte Carlo 诊断。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "il-feedback il-warn";
        feedback.textContent = "还缺 " + missing.length + " 项预测；揭示前不显示结果。";
        return;
      }
      var answers = predictionAnswers();
      var correct = questions.filter(function (question) {
        return state.predictions[question.key] === answers[question.key];
      }).length;
      state.revealed = true;
      revealed.removeAttribute("hidden");
      reveal.disabled = true;
      feedback.className = correct === questions.length ? "il-feedback il-pass" : "il-feedback";
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项预测命中。";
      renderResult();
      announce(api, root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { endpoint: null, correction: null, singlePath: null, isometry: null };
      choiceNodes.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "il-feedback";
      feedback.textContent = "路径、结果和账本在揭示前保持隐藏。";
      syncControls();
    });
    syncControls();
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var first = compute(DEFAULTS);
    var second = compute(DEFAULTS);
    assert(JSON.stringify(first) === JSON.stringify(second), "seeded model must be deterministic");
    assert(first.config.level === 6 && first.steps === 64, "default dyadic level");
    assert(first.pathLevels.length === first.config.maxLevel, "nested level ledger");
    assert(close(first.selectedPath.right - first.selectedPath.left, first.selectedPath.qv), "right-left quadratic variation correction");
    assert(close(first.selectedPath.midpoint - first.selectedPath.left, first.selectedPath.qv / 2), "midpoint correction");
    assert(close(first.selectedPath.midpoint, first.selectedPath.terminal * first.selectedPath.terminal / 2), "midpoint telescoping identity");
    assert(close(first.selectedPath.leftIdentityResidual, 0), "left telescoping identity");
    assert(close(first.selectedPath.rightIdentityResidual, 0), "right telescoping identity");
    assert(close(first.selectedPath.midpointIdentityResidual, 0), "midpoint telescoping identity");
    assert(first.sample.discreteIsometryTarget === 1 * 1 * 63 / 128, "finite left-sum target");
    assert(first.sample.continuousIsometryTarget === 0.5, "continuous isometry target");
    assert(first.sample.count === 96, "ensemble count");
    first.pathLevels.forEach(function (item) {
      assert(finite(item.summary.qv) && item.summary.qv >= 0, "nonnegative path quadratic variation");
    });
    var single = compute({ T: 1, level: 3, maxLevel: 8, paths: 1, pathIndex: 1, seed: 17 });
    assert(single.sample.count === 1 && single.config.pathIndex === 1, "single path configuration");
    var zero = compute({ T: 0, level: 4, maxLevel: 6, paths: 3, seed: 19 });
    assert(zero.selectedPath.qv === 0 && zero.selectedPath.left === 0 && zero.sample.continuousIsometryTarget === 0, "zero horizon");
    assert(predictionAnswers().endpoint === "left", "adapted endpoint answer");
    assert(predictionAnswers().correction === "right-plus", "right correction answer");
    assert(predictionAnswers().singlePath === "diagnostic", "single path answer");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    aggregate: aggregate,
    summarizePath: summarizePath,
    compute: compute,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
