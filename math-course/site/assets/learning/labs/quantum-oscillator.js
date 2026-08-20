(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quantum-oscillator", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("quantum-oscillator self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("quantum-oscillator self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-quantum-oscillator-styles";
  var SERIAL = 0;
  var DEFAULTS = { n: 2, N: 12, X: 7, grid: 1601 };
  var PRESETS = [
    { id: "ground", label: "基态 n=0", n: 0, N: 12, X: 7 },
    { id: "excited", label: "激发态 n=3", n: 3, N: 12, X: 7 },
    { id: "top", label: "顶层边界 n=N−1", n: 7, N: 8, X: 7 },
    { id: "coarse", label: "小图 N=4", n: 2, N: 4, X: 5 },
    { id: "wide", label: "高激发 n=6", n: 6, N: 20, X: 8 }
  ];
  var STYLE_TEXT = [
    ".qo-lab{--qo-blue:var(--cl-blue,#315f9d);--qo-gold:var(--cl-gold,#9b6a12);--qo-green:var(--cl-green,#39734d);--qo-red:var(--cl-red,#b64335);--qo-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .qo-lab{--qo-blue:#83c8ff;--qo-gold:#e2b458;--qo-green:#72bd8b;--qo-red:#f08c7d;--qo-soft:#b8b2a7;}",
    ".qo-lab *,.qo-lab *::before,.qo-lab *::after{box-sizing:border-box;}.qo-lab [hidden]{display:none!important;}",
    ".qo-lab h3,.qo-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.qo-lab h3{font-size:1.18rem;}.qo-lab h4{font-size:1rem;}.qo-lab .qo-intro,.qo-lab .qo-note,.qo-lab .qo-feedback{color:var(--qo-soft);font-size:13px;line-height:1.7;}",
    ".qo-lab .qo-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--qo-gold);background:var(--bg);}.qo-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.qo-lab legend{max-width:100%;padding:0 4px;color:var(--qo-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere;}",
    ".qo-lab .qo-choice-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}.qo-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.qo-lab button:hover{border-color:var(--accent);}.qo-lab button[aria-pressed=\"true\"],.qo-lab button.qo-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.qo-lab button:disabled{cursor:not-allowed;opacity:.55;}.qo-lab button:focus-visible,.qo-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".qo-lab .qo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.qo-lab .qo-actions>*{flex:1 1 170px;}.qo-lab .qo-feedback{min-height:2em;margin:8px 0;font-weight:700;}.qo-lab .qo-pass{color:var(--qo-green);}.qo-lab .qo-warn{color:var(--qo-red);}",
    ".qo-lab .qo-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.qo-lab .qo-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:11px 0;}.qo-lab .qo-presets button{font-size:12px;}.qo-lab .qo-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:12px 0;}.qo-lab .qo-control{display:grid;gap:5px;min-width:0;}.qo-lab .qo-control label{color:var(--qo-soft);font-size:13px;font-weight:700;}.qo-lab output{color:var(--accent);font-variant-numeric:tabular-nums;}.qo-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".qo-lab .qo-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0;}.qo-lab .qo-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.qo-lab .qo-metric:nth-child(1),.qo-lab .qo-metric:nth-child(4){border-top-color:var(--qo-blue);}.qo-lab .qo-metric:nth-child(2),.qo-lab .qo-metric:nth-child(5){border-top-color:var(--qo-gold);}.qo-lab .qo-metric:nth-child(3),.qo-lab .qo-metric:nth-child(6){border-top-color:var(--qo-green);}.qo-lab .qo-metric span{display:block;color:var(--qo-soft);font-size:11.5px;line-height:1.4;}.qo-lab .qo-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".qo-lab .qo-chart{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.qo-lab svg{display:block;width:100%;height:auto;min-width:700px;color:var(--fg);}.qo-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.qo-lab .qo-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7;}.qo-lab .qo-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.qo-lab .qo-wave{fill:none;stroke:var(--qo-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;}.qo-lab .qo-node{stroke:var(--qo-red);stroke-width:1.4;stroke-dasharray:4 4;}.qo-lab .qo-bar-exact{fill:var(--qo-blue);fill-opacity:.78;}.qo-lab .qo-bar-truncated{fill:var(--qo-red);fill-opacity:.78;}.qo-lab .qo-chart-title{font-size:13px;font-weight:750;}.qo-lab .qo-chart-label{font-size:11px;}",
    ".qo-lab .qo-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.qo-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.qo-lab caption{padding:0 0 7px;text-align:left;color:var(--qo-soft);font-size:12px;line-height:1.55;}.qo-lab th,.qo-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap;}.qo-lab th{color:var(--qo-soft);font-size:11.5px;font-weight:750;}.qo-lab .qo-good{color:var(--qo-green);font-weight:750;}.qo-lab .qo-bad{color:var(--qo-red);font-weight:750;}.qo-lab .qo-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--qo-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.qo-lab .qo-presets{grid-template-columns:repeat(3,minmax(0,1fr));}.qo-lab .qo-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}",
    "@media(max-width:650px){.qo-lab .qo-choice-row,.qo-lab .qo-presets,.qo-lab .qo-controls,.qo-lab .qo-metrics{grid-template-columns:minmax(0,1fr);}.qo-lab .qo-chart{padding:5px;}}",
    "@media(prefers-reduced-motion:reduce){.qo-lab *{animation:none!important;transition:none!important;}}"
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

  function normalizeConfig(input) {
    var source = input || {};
    var N = Math.round(clamp(number(source.N, DEFAULTS.N), 2, 32));
    var n = Math.round(clamp(number(source.n, DEFAULTS.n), 0, Math.min(16, N - 1)));
    return {
      n: n,
      N: N,
      X: clamp(number(source.X, DEFAULTS.X), 4, 12),
      grid: Math.round(clamp(number(source.grid, DEFAULTS.grid), 401, 2401))
    };
  }

  function copyConfig(config) {
    return { n: config.n, N: config.N, X: config.X, grid: config.grid };
  }

  function factorial(n) {
    var result = 1;
    var index;
    for (index = 2; index <= n; index += 1) result *= index;
    return result;
  }

  function hermite(n, x) {
    if (n === 0) return 1;
    if (n === 1) return 2 * x;
    var previous = 1;
    var current = 2 * x;
    var index;
    for (index = 2; index <= n; index += 1) {
      var next = 2 * x * current - 2 * (index - 1) * previous;
      previous = current;
      current = next;
    }
    return current;
  }

  function wavefunction(n, x) {
    var denominator = Math.pow(Math.PI, 0.25) * Math.sqrt(Math.pow(2, n) * factorial(n));
    return hermite(n, x) * Math.exp(-0.5 * x * x) / denominator;
  }

  function countNodes(values, xs) {
    var count = 0;
    var positions = [];
    var lastSign = 0;
    var lastIndex = -1;
    values.forEach(function (value, index) {
      var sign;
      if (Math.abs(value) < 1e-9) return;
      sign = value > 0 ? 1 : -1;
      if (lastSign !== 0 && sign !== lastSign) {
        count += 1;
        positions.push((xs[lastIndex] + xs[index]) / 2);
      }
      lastSign = sign;
      lastIndex = index;
    });
    return { count: count, positions: positions };
  }

  function gridMetrics(config) {
    var count = config.grid;
    var dx = 2 * config.X / (count - 1);
    var xs = [];
    var values = [];
    var squares = [];
    var index;
    for (index = 0; index < count; index += 1) {
      var x = -config.X + index * dx;
      var value = wavefunction(config.n, x);
      xs.push(x);
      values.push(value);
      squares.push(value * value);
    }
    function integrate(samples, transform) {
      var total = 0;
      samples.forEach(function (value, itemIndex) {
        var weight = itemIndex === 0 || itemIndex === samples.length - 1 ? 0.5 : 1;
        total += weight * transform(value, itemIndex);
      });
      return total * dx;
    }
    var norm = integrate(values, function (value) { return value * value; });
    var meanX = integrate(values, function (value, itemIndex) { return squares[itemIndex] * xs[itemIndex]; });
    var x2 = integrate(values, function (value, itemIndex) { return squares[itemIndex] * xs[itemIndex] * xs[itemIndex]; });
    var derivatives = values.map(function (value, itemIndex) {
      if (itemIndex === 0) return (values[1] - value) / dx;
      if (itemIndex === values.length - 1) return (value - values[itemIndex - 1]) / dx;
      return (values[itemIndex + 1] - values[itemIndex - 1]) / (2 * dx);
    });
    var p2 = integrate(derivatives, function (value) { return value * value; });
    var nodeData = countNodes(values, xs);
    var curve = [];
    var curveCount = 401;
    for (index = 0; index < curveCount; index += 1) {
      var curveX = -config.X + 2 * config.X * index / (curveCount - 1);
      curve.push({ x: curveX, psi: wavefunction(config.n, curveX) });
    }
    return {
      dx: dx,
      norm: norm,
      meanX: meanX,
      x2: x2,
      p2: p2,
      nodeCount: nodeData.count,
      nodePositions: nodeData.positions,
      curve: curve
    };
  }

  function finiteFock(config) {
    var top = config.N - 1;
    var atTop = config.n === top;
    var exactEnergy = config.n + 0.5;
    var truncatedEnergy = 0.5 * (config.n + (atTop ? 0 : config.n + 1));
    return {
      top: top,
      atTop: atTop,
      loweringCoefficient: config.n > 0 ? Math.sqrt(config.n) : 0,
      raisingCoefficient: atTop ? 0 : Math.sqrt(config.n + 1),
      exactEnergy: exactEnergy,
      truncatedEnergy: truncatedEnergy,
      energyError: truncatedEnergy - exactEnergy,
      commutatorResidual: atTop ? config.N : 0,
      boundaryLeakage: atTop ? Math.sqrt(config.n + 1) : 0
    };
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var grid = gridMetrics(config);
    var fock = finiteFock(config);
    var exactVariance = config.n + 0.5;
    var numericVarianceX = Math.max(0, grid.x2 - grid.meanX * grid.meanX);
    var numericUncertainty = Math.sqrt(numericVarianceX) * Math.sqrt(Math.max(0, grid.p2));
    return {
      config: config,
      grid: grid,
      fock: fock,
      exact: {
        energy: exactVariance,
        gap: 1,
        varianceX: exactVariance,
        varianceP: exactVariance,
        uncertaintyProduct: exactVariance,
        nodes: config.n,
        normalization: 1
      },
      numeric: {
        uncertaintyProduct: numericUncertainty,
        normalizationError: grid.norm - 1,
        nodeError: grid.nodeCount - config.n
      },
      finiteGraph: {
        commutatorFormula: "I_N − N|N−1><N−1|",
        topBoundary: fock.atTop,
        finiteWindow: config.X
      }
    };
  }

  function predictionAnswers() {
    return {
      energyGap: "constant",
      ladder: "sqrt",
      nodes: "n",
      truncation: "top-only"
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
    var merged = { x: x, y: y, className: "qo-chart-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, text);
  }

  function wavePath(points, x, y) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + x(point.x).toFixed(2) + " " + y(point.psi).toFixed(2);
    }).join(" ");
  }

  function drawChart(api, doc, svg, result, uid) {
    clear(svg);
    var width = 780;
    var height = 370;
    var top = 38;
    var bottom = 52;
    var leftA = 52;
    var rightA = 430;
    var leftB = 500;
    var rightB = 758;
    var plotBottom = height - bottom;
    var maxPsi = Math.max.apply(null, result.grid.curve.map(function (point) { return Math.abs(point.psi); }));
    maxPsi = Math.max(0.1, maxPsi * 1.15);
    function xA(value) {
      return leftA + (value + result.config.X) / (2 * result.config.X) * (rightA - leftA);
    }
    function yA(value) {
      return top + (maxPsi - value) / (2 * maxPsi) * (plotBottom - top);
    }
    var energyMax = Math.max(result.fock.exactEnergy, result.fock.truncatedEnergy, 0.5) * 1.25;
    function xB(index) {
      return leftB + (index + 0.5) / 2 * (rightB - leftB);
    }
    function yB(value) {
      return plotBottom - value / energyMax * (plotBottom - top);
    }
    svg.appendChild(makeSvg(api, doc, "title", { id: uid + "-chart-title" }, "量子谐振子波函数与有限 Fock 边界"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: uid + "-chart-desc" }, "左图显示第 n 个谐振子波函数和节点，右图比较无限维精确能量与有限截断能量。"));
    [-maxPsi, 0, maxPsi].forEach(function (value) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: yA(value), x2: rightA, y2: yA(value), className: value === 0 ? "qo-axis" : "qo-grid" }));
      svg.appendChild(svgText(api, doc, leftA - 8, yA(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    [-result.config.X, 0, result.config.X].forEach(function (value) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: xA(value), y1: top, x2: xA(value), y2: plotBottom, className: "qo-grid" }));
      svg.appendChild(svgText(api, doc, xA(value), plotBottom + 18, format(value, 1), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "path", { d: wavePath(result.grid.curve, xA, yA), className: "qo-wave" }));
    result.grid.nodePositions.forEach(function (node) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: xA(node), y1: top, x2: xA(node), y2: plotBottom, className: "qo-node" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: plotBottom, x2: rightA, y2: plotBottom, className: "qo-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftA, y1: top, x2: leftA, y2: plotBottom, className: "qo-axis" }));
    svg.appendChild(svgText(api, doc, leftA, 20, "ψ_n(x)：节点与有限窗口", { className: "qo-chart-title" }));
    svg.appendChild(svgText(api, doc, rightA, 20, "红虚线：网格识别的节点", { "text-anchor": "end" }));
    var bars = [
      { label: "E_n", value: result.fock.exactEnergy, className: "qo-bar-exact" },
      { label: "E_N", value: result.fock.truncatedEnergy, className: "qo-bar-truncated" }
    ];
    [0, energyMax / 2, energyMax].forEach(function (value) {
      svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: yB(value), x2: rightB, y2: yB(value), className: "qo-grid" }));
      svg.appendChild(svgText(api, doc, leftB - 8, yB(value) + 4, format(value, 2), { "text-anchor": "end" }));
    });
    bars.forEach(function (bar, index) {
      var barWidth = (rightB - leftB) / 2 * 0.5;
      var barX = xB(index) - barWidth / 2;
      var barTop = yB(bar.value);
      svg.appendChild(makeSvg(api, doc, "rect", { x: barX, y: barTop, width: barWidth, height: plotBottom - barTop, className: bar.className }));
      svg.appendChild(svgText(api, doc, xB(index), plotBottom + 18, bar.label, { "text-anchor": "middle" }));
      svg.appendChild(svgText(api, doc, xB(index), barTop - 6, format(bar.value, 3), { "text-anchor": "middle" }));
    });
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: plotBottom, x2: rightB, y2: plotBottom, className: "qo-axis" }));
    svg.appendChild(makeSvg(api, doc, "line", { x1: leftB, y1: top, x2: leftB, y2: plotBottom, className: "qo-axis" }));
    svg.appendChild(svgText(api, doc, leftB, 20, "能量：无限维 vs 截断图", { className: "qo-chart-title" }));
    svg.appendChild(svgText(api, doc, rightB, 20, result.fock.atTop ? "顶层泄漏" : "当前态未到顶层", { "text-anchor": "end" }));
  }

  function metric(api, doc, label, value) {
    return makeElement(api, doc, "div", { className: "qo-metric" }, [
      makeElement(api, doc, "span", { text: label }),
      makeElement(api, doc, "strong", { text: value })
    ]);
  }

  function ledger(api, doc, result) {
    var rows = [
      ["精确能级 E_n", format(result.fock.exactEnergy, 7), "n + 1/2", "无限维解析值"],
      ["截断能级 E_N", format(result.fock.truncatedEnergy, 7), format(result.fock.energyError, 7), result.fock.atTop ? "顶层少了升算子项" : "当前态低于顶层"],
      ["能级间隔", "1", "E_{n+1}−E_n", "等间距，不随 n 增长"],
      ["降算符系数", format(result.fock.loweringCoefficient, 7), "sqrt(n)", "a|n>"],
      ["升算符系数", format(result.fock.raisingCoefficient, 7), "sqrt(n+1)", result.fock.atTop ? "有限图把它截成 0" : "a†|n>"],
      ["网格归一化", format(result.grid.norm, 9), "1", "有限窗口与求积误差"],
      ["节点数", String(result.grid.nodeCount), String(result.exact.nodes), "从 n=0 编号"],
      ["不确定性乘积", format(result.exact.uncertaintyProduct, 7), format(result.numeric.uncertaintyProduct, 7), "解析值 / 网格值"],
      ["顶层对易子残差", format(result.fock.commutatorResidual, 7), "0（非顶层）或 N（顶层）", "I_N−N|N−1><N−1|"]
    ];
    var tableNode = makeElement(api, doc, "table", {});
    tableNode.appendChild(makeElement(api, doc, "caption", {}, "透明账本：精确公式、网格诊断和有限 Fock 边界分栏。"));
    tableNode.appendChild(makeElement(api, doc, "thead", {}, makeElement(api, doc, "tr", {}, [
      makeElement(api, doc, "th", {}, "项目"),
      makeElement(api, doc, "th", {}, "当前值"),
      makeElement(api, doc, "th", {}, "精确 / 参考"),
      makeElement(api, doc, "th", {}, "读法")
    ])));
    var body = makeElement(api, doc, "tbody", {});
    rows.forEach(function (row) {
      body.appendChild(makeElement(api, doc, "tr", {}, row.map(function (cell, index) {
        return makeElement(api, doc, "td", { className: index === 0 ? "qo-good" : "" }, cell);
      })));
    });
    tableNode.appendChild(body);
    return tableNode;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    installStyles(doc);
    clear(root);
    root.className = "qo-lab";
    var uid = "qo-" + (++SERIAL);
    var state = {
      config: copyConfig(DEFAULTS),
      revealed: false,
      predictions: { energyGap: null, ladder: null, nodes: null, truncation: null }
    };
    var questions = [
      {
        key: "energyGap",
        title: "谐振子能级间隔怎样变化？",
        choices: [["constant", "固定为 hbar omega"], ["growing", "随 n 增长"], ["quadratic", "按 n² 增长"]]
      },
      {
        key: "ladder",
        title: "升算符的归一化系数？",
        choices: [["sqrt", "sqrt(n+1)"], ["linear", "n+1"], ["unit", "1"]]
      },
      {
        key: "nodes",
        title: "从 n=0 开始，第 n 态节点数？",
        choices: [["n", "恰好 n 个"], ["n-plus-one", "n+1 个"], ["zero", "都没有"]]
      },
      {
        key: "truncation",
        title: "有限 Fock 图的对易子误差在哪里？",
        choices: [["top-only", "只在顶层"], ["everywhere", "每一层都一样"], ["nowhere", "完全没有"]]
      }
    ];
    var shell = makeElement(api, doc, "div", {});
    shell.appendChild(makeElement(api, doc, "h3", { text: "量子谐振子：精确阶梯与有限图边界" }));
    shell.appendChild(makeElement(api, doc, "p", { className: "qo-intro", text: "在 hbar=m=omega=1 单位制中，先预测能级、升降系数、节点和截断边界，再打开波函数与透明账本。" }));
    var form = makeElement(api, doc, "form", { className: "qo-gate", "aria-labelledby": uid + "-gate-title" });
    form.appendChild(makeElement(api, doc, "strong", { id: uid + "-gate-title", text: "预测门：先写下无限维模型的精确结论" }));
    var choiceNodes = [];
    var feedback;
    questions.forEach(function (question) {
      var field = makeElement(api, doc, "fieldset", {});
      field.appendChild(makeElement(api, doc, "legend", {}, question.title));
      var row = makeElement(api, doc, "div", { className: "qo-choice-row" });
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          choiceNodes.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.className = "qo-feedback";
          feedback.textContent = "预测已记录；四项都选好后揭示精确与截断账本。";
        });
        choiceNodes.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      form.appendChild(field);
    });
    var actions = makeElement(api, doc, "div", { className: "qo-actions" });
    var reveal = makeElement(api, doc, "button", { type: "submit", className: "qo-primary" }, "提交预测并揭示");
    var reset = makeElement(api, doc, "button", { type: "button" }, "重置预测");
    actions.appendChild(reveal);
    actions.appendChild(reset);
    form.appendChild(actions);
    feedback = makeElement(api, doc, "p", { className: "qo-feedback", "aria-live": "polite" }, "波函数、能级和账本在揭示前保持隐藏。");
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(api, doc, "section", { className: "qo-revealed", hidden: "hidden", "aria-labelledby": uid + "-result-title" });
    revealed.appendChild(makeElement(api, doc, "h3", { id: uid + "-result-title", text: "结果账本：解析值、网格值与 Fock 边界" }));
    var presetWrap = makeElement(api, doc, "div", { className: "qo-presets" });
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
    var controls = makeElement(api, doc, "div", { className: "qo-controls" });
    var controlInputs = {};
    function addRange(key, label, min, max, step) {
      var input = makeElement(api, doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      var output = makeElement(api, doc, "output", {}, format(state.config[key], key === "n" || key === "N" ? 0 : 2));
      var field = makeElement(api, doc, "div", { className: "qo-control" }, [
        makeElement(api, doc, "label", {}, [label, " ", output]),
        input
      ]);
      input.addEventListener("input", function () {
        state.config[key] = key === "n" || key === "N" ? Math.round(Number(input.value)) : Number(input.value);
        if (key === "N") state.config.n = Math.min(state.config.n, state.config.N - 1);
        syncControls();
        renderResult();
      });
      controlInputs[key] = { input: input, output: output };
      controls.appendChild(field);
    }
    addRange("n", "激发数 n", 0, 16, 1);
    addRange("N", "Fock 维数 N", 2, 32, 1);
    addRange("X", "位置窗口 X", 4, 12, 0.5);
    revealed.appendChild(controls);
    var metricsNode = makeElement(api, doc, "div", { className: "qo-metrics" });
    var chartWrap = makeElement(api, doc, "div", { className: "qo-chart" });
    var chart = makeSvg(api, doc, "svg", { viewBox: "0 0 780 370", role: "img", "aria-labelledby": uid + "-chart-title " + uid + "-chart-desc" });
    chartWrap.appendChild(chart);
    var ledgerWrap = makeElement(api, doc, "div", { className: "qo-ledger" });
    var interpretation = makeElement(api, doc, "p", { className: "qo-interpretation" });
    revealed.appendChild(metricsNode);
    revealed.appendChild(chartWrap);
    revealed.appendChild(ledgerWrap);
    revealed.appendChild(interpretation);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function syncControls() {
      controlInputs.n.input.max = Math.min(16, state.config.N - 1);
      controlInputs.n.input.value = state.config.n;
      controlInputs.n.output.textContent = format(state.config.n, 0);
      controlInputs.N.input.value = state.config.N;
      controlInputs.N.output.textContent = format(state.config.N, 0);
      controlInputs.X.input.value = state.config.X;
      controlInputs.X.output.textContent = format(state.config.X, 1);
    }

    function renderResult() {
      var result = compute(state.config);
      state.config = result.config;
      syncControls();
      metricsNode.replaceChildren(
        metric(api, doc, "n / N", result.config.n + " / " + result.config.N),
        metric(api, doc, "精确 E_n", format(result.fock.exactEnergy, 5)),
        metric(api, doc, "截断 E_N", format(result.fock.truncatedEnergy, 5)),
        metric(api, doc, "归一化", format(result.grid.norm, 7)),
        metric(api, doc, "节点数", result.grid.nodeCount + " / " + result.exact.nodes),
        metric(api, doc, "sigma_x sigma_p", format(result.exact.uncertaintyProduct, 5))
      );
      drawChart(api, doc, chart, result, uid);
      clear(ledgerWrap);
      ledgerWrap.appendChild(ledger(api, doc, result));
      interpretation.textContent = result.fock.atTop
        ? "当前态正好在有限 Fock 图顶层：升算符被截断，对易子残差为 N，截断能量不再等于无限维 E_n。"
        : "当前态低于 Fock 顶层；能级、升降系数和节点应与无限维公式一致，剩余差异来自有限位置窗口和网格求积。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return state.predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "qo-feedback qo-warn";
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
      feedback.className = correct === questions.length ? "qo-feedback qo-pass" : "qo-feedback";
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项预测命中。";
      renderResult();
      announce(api, root, feedback.textContent);
    });

    reset.addEventListener("click", function () {
      state.config = copyConfig(DEFAULTS);
      state.revealed = false;
      state.predictions = { energyGap: null, ladder: null, nodes: null, truncation: null };
      choiceNodes.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "qo-feedback";
      feedback.textContent = "波函数、能级和账本在揭示前保持隐藏。";
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
    assert(hermite(0, 2) === 1, "H0");
    assert(hermite(1, 2) === 4, "H1");
    assert(hermite(2, 0) === -2, "H2");
    var ground = compute({ n: 0, N: 12, X: 7, grid: 1601 });
    assert(ground.fock.exactEnergy === 0.5 && ground.grid.nodeCount === 0, "ground state ledger");
    var excited = compute(DEFAULTS);
    assert(excited.fock.exactEnergy === 2.5, "exact energy");
    assert(excited.fock.raisingCoefficient === Math.sqrt(3), "raising coefficient");
    assert(excited.fock.loweringCoefficient === Math.sqrt(2), "lowering coefficient");
    assert(excited.grid.nodeCount === 2 && excited.exact.nodes === 2, "n=2 node count");
    assert(Math.abs(excited.grid.norm - 1) < 1e-8, "finite-grid normalization");
    assert(Math.abs(excited.grid.x2 - 2.5) < 1e-5, "position variance");
    assert(Math.abs(excited.grid.p2 - 2.5) < 3e-4, "momentum variance");
    assert(Math.abs(excited.numeric.uncertaintyProduct - 2.5) < 2e-4, "uncertainty ledger");
    var top = compute({ n: 7, N: 8, X: 7, grid: 1201 });
    assert(top.fock.atTop && top.fock.raisingCoefficient === 0, "top raising truncation");
    assert(top.fock.commutatorResidual === 8, "finite commutator residual");
    assert(top.fock.truncatedEnergy === 3.5 && top.fock.exactEnergy === 7.5, "top energy artifact");
    var low = compute({ n: 2, N: 8, X: 7, grid: 1201 });
    assert(!low.fock.atTop && low.fock.commutatorResidual === 0 && low.fock.truncatedEnergy === 2.5, "below-top finite ledger");
    var deterministicA = compute({ n: 4, N: 16, X: 8, grid: 801 });
    var deterministicB = compute({ n: 4, N: 16, X: 8, grid: 801 });
    assert(JSON.stringify(deterministicA) === JSON.stringify(deterministicB), "deterministic oscillator model");
    assert(predictionAnswers().energyGap === "constant", "energy answer");
    assert(predictionAnswers().truncation === "top-only", "truncation answer");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    factorial: factorial,
    hermite: hermite,
    wavefunction: wavefunction,
    finiteFock: finiteFock,
    compute: compute,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
