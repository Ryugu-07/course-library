(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "canonical-ensemble-lab-styles";
  var INSTANCE = 0;
  var LIMITS = { x: [0, 8], N: [1, 400], g: [1, 8] };
  var PRESETS = [
    { id: "equal", label: "等退化基线", x: 1, N: 24, g0: 1, g1: 1 },
    { id: "excited-triplet", label: "激发三重简并", x: 0, N: 24, g0: 1, g1: 3 },
    { id: "concentration", label: "大 N 集中", x: 1, N: 200, g0: 1, g1: 1 },
    { id: "frozen", label: "低温冻结", x: 6, N: 40, g0: 1, g1: 1 }
  ];

  var STYLE_TEXT = [
    ".ce-lab{max-width:100%;min-width:0;color:var(--fg);overflow-wrap:anywhere;}",
    ".ce-lab *{box-sizing:border-box;}",
    ".ce-lab [hidden]{display:none!important;}",
    ".ce-lab .ce-note{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".ce-lab .ce-presets,.ce-lab .ce-actions,.ce-lab .ce-choice-row{display:flex;flex-wrap:wrap;gap:8px;}",
    ".ce-lab button{min-height:44px;padding:8px 12px;}",
    ".ce-lab .ce-presets button{flex:1 1 150px;}",
    ".ce-lab .ce-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0;}",
    ".ce-lab .ce-control{display:grid;gap:4px;min-width:0;}",
    ".ce-lab .ce-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;line-height:1.4;}",
    ".ce-lab .ce-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".ce-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".ce-lab .ce-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".ce-lab .ce-predict-title{display:block;margin-bottom:12px;font-size:13px;}",
    ".ce-lab .ce-question{min-width:0;margin:10px 0;padding:10px;border:1px solid var(--border);}",
    ".ce-lab .ce-question legend{max-width:100%;padding:0 5px;color:var(--fg);font-size:12.5px;font-weight:700;line-height:1.5;}",
    ".ce-lab .ce-choice-row button{flex:1 1 145px;}",
    ".ce-lab .ce-feedback{min-height:2em;margin:9px 0 0;font-size:13px;font-weight:700;line-height:1.65;}",
    ".ce-lab .ce-pass{color:var(--cl-green);}.ce-lab .ce-warn{color:var(--cl-red);}",
    ".ce-lab .ce-results{margin-top:18px;}",
    ".ce-lab .ce-section-title{margin:16px 0 8px;font-size:14px;}",
    ".ce-lab .ce-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 16px;}",
    ".ce-lab .ce-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".ce-lab .ce-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}",
    ".ce-lab .ce-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ce-lab .ce-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}",
    ".ce-lab .ce-chart{min-width:0;}",
    ".ce-lab .ce-chart h4{margin:0 0 7px;font-size:13px;}",
    ".ce-lab svg{display:block;width:100%;height:auto;max-width:100%;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".ce-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".ce-lab .ce-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55;}",
    ".ce-lab .ce-axis{stroke:var(--border);stroke-width:1.25;}",
    ".ce-lab .ce-curve{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}",
    ".ce-lab .ce-bar{fill:var(--accent);fill-opacity:.7;}",
    ".ce-lab .ce-band{fill:var(--cl-gold);fill-opacity:.16;}",
    ".ce-lab .ce-reference{stroke:var(--cl-gold);stroke-width:1.5;stroke-dasharray:5 4;}",
    ".ce-lab .ce-peak{stroke:var(--cl-green);stroke-width:1.5;stroke-dasharray:3 3;}",
    ".ce-lab .ce-current{stroke:var(--cl-red);stroke-width:1.6;stroke-dasharray:2 3;}",
    ".ce-lab .ce-mean{stroke:var(--cl-green);stroke-width:2;}",
    ".ce-lab .ce-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
    ".ce-lab table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".ce-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;}",
    ".ce-lab th,.ce-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap;}",
    ".ce-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".ce-lab button:focus-visible,.ce-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:820px){.ce-lab .ce-controls{grid-template-columns:repeat(2,minmax(0,1fr));}.ce-lab .ce-charts{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:520px){.ce-lab .ce-controls,.ce-lab .ce-metrics{grid-template-columns:minmax(0,1fr);}.ce-lab .ce-question{padding:8px;}.ce-lab .ce-choice-row button{flex-basis:100%;}}",
    "@media(prefers-reduced-motion:reduce){.ce-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback, min, max) {
    var parsed = Math.round(finite(Number(value), fallback));
    return clamp(parsed, min, max);
  }

  function nearly(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function logAddExp(a, b) {
    if (a === -Infinity) return b;
    if (b === -Infinity) return a;
    var high = Math.max(a, b);
    return high + Math.log1p(Math.exp(Math.min(a, b) - high));
  }

  function logPartition(x, g0, g1) {
    return logAddExp(Math.log(g0), Math.log(g1) - x);
  }

  function excitationProbability(x, g0, g1) {
    var logOdds = Math.log(g1) - Math.log(g0) - x;
    if (logOdds >= 0) {
      return 1 / (1 + Math.exp(-logOdds));
    }
    var odds = Math.exp(logOdds);
    return odds / (1 + odds);
  }

  function heatCapacity(x, g0, g1) {
    var p = excitationProbability(x, g0, g1);
    return x * x * p * (1 - p);
  }

  function peakEquation(x, g0, g1) {
    return 2 / x + 2 * excitationProbability(x, g0, g1) - 1;
  }

  function heatCapacityPeak(g0, g1) {
    var left = 1e-8;
    var right = 40;
    while (peakEquation(right, g0, g1) > 0 && right < 640) right *= 2;
    for (var i = 0; i < 90; i += 1) {
      var middle = (left + right) / 2;
      if (peakEquation(middle, g0, g1) > 0) left = middle;
      else right = middle;
    }
    return (left + right) / 2;
  }

  function logFactorials(n) {
    var values = [0];
    for (var i = 1; i <= n; i += 1) values[i] = values[i - 1] + Math.log(i);
    return values;
  }

  function logSumExp(values) {
    var maximum = -Infinity;
    values.forEach(function (value) { if (value > maximum) maximum = value; });
    if (maximum === -Infinity) return -Infinity;
    var sum = 0;
    values.forEach(function (value) { sum += Math.exp(value - maximum); });
    return maximum + Math.log(sum);
  }

  function binomialDistribution(n, p) {
    n = integer(n, 1, LIMITS.N[0], LIMITS.N[1]);
    p = clamp(finite(Number(p), 0.5), 0, 1);
    var logs = logFactorials(n);
    var logWeights = [];
    for (var k = 0; k <= n; k += 1) {
      var logWeight;
      if (p === 0) logWeight = k === 0 ? 0 : -Infinity;
      else if (p === 1) logWeight = k === n ? 0 : -Infinity;
      else logWeight = logs[n] - logs[k] - logs[n - k] + k * Math.log(p) + (n - k) * Math.log1p(-p);
      logWeights.push(logWeight);
    }
    var logNorm = logSumExp(logWeights);
    var rows = logWeights.map(function (logWeight, index) {
      return { k: index, fraction: index / n, logProbability: logWeight, probability: logNorm === -Infinity ? 0 : Math.exp(logWeight - logNorm) };
    });
    var total = rows.reduce(function (sum, row) { return sum + row.probability; }, 0);
    if (total > 0) rows.forEach(function (row) { row.probability /= total; });
    return { n: n, p: p, rows: rows, probabilitySum: rows.reduce(function (sum, row) { return sum + row.probability; }, 0) };
  }

  function normalizeConfig(config) {
    config = config || {};
    return {
      id: config.id || "custom",
      label: config.label || "自定义",
      x: clamp(finite(Number(config.x), 1), LIMITS.x[0], LIMITS.x[1]),
      N: integer(config.N, 24, LIMITS.N[0], LIMITS.N[1]),
      g0: integer(config.g0, 1, LIMITS.g[0], LIMITS.g[1]),
      g1: integer(config.g1, 1, LIMITS.g[0], LIMITS.g[1])
    };
  }

  function copyPreset(preset) {
    return normalizeConfig(preset);
  }

  function canonicalModel(config) {
    var state = normalizeConfig(config);
    var logZ1 = logPartition(state.x, state.g0, state.g1);
    var p = excitationProbability(state.x, state.g0, state.g1);
    var varianceK = state.N * p * (1 - p);
    var meanK = state.N * p;
    var sigmaK = Math.sqrt(Math.max(0, varianceK));
    var peakX = heatCapacityPeak(state.g0, state.g1);
    return {
      id: state.id,
      label: state.label,
      x: state.x,
      N: state.N,
      g0: state.g0,
      g1: state.g1,
      logZ1: logZ1,
      p: p,
      energyPerUnit: p,
      entropyPerUnit: logZ1 + state.x * p,
      heatCapacityPerUnit: heatCapacity(state.x, state.g0, state.g1),
      meanK: meanK,
      varianceK: varianceK,
      sigmaK: sigmaK,
      relativeFluctuation: meanK > 0 ? sigmaK / meanK : Infinity,
      fractionSigma: sigmaK / state.N,
      inverseSqrtN: 1 / Math.sqrt(state.N),
      peakX: peakX,
      peakCv: heatCapacity(peakX, state.g0, state.g1),
      distribution: binomialDistribution(state.N, p)
    };
  }

  function formatNumber(value, digits) {
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "−∞";
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 5e-10) return "0";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "htmlFor") node.htmlFor = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
    }
    return node;
  }

  function svgNode(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "ce-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function mapLinear(value, low, high, pixelLow, pixelHigh) {
    return pixelLow + (value - low) / (high - low) * (pixelHigh - pixelLow);
  }

  function heatCapacitySvg(doc, result) {
    var width = 620;
    var height = 360;
    var left = 56;
    var right = 592;
    var top = 48;
    var bottom = 304;
    var xMax = LIMITS.x[1];
    var yMax = 2.1;
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "每单元 Schottky 热容曲线" });
    svg.appendChild(svgNode(doc, "title", {}, "每单元 Schottky 热容曲线"));
    svg.appendChild(svgNode(doc, "desc", {}, "横轴固定为 x=beta epsilon 从零到八，纵轴固定为每单元热容；金色虚线是等退化峰，绿色虚线是当前退化峰，红线是当前 x。"));
    [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
      var y = mapLinear(fraction * yMax, 0, yMax, bottom, top);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, className: "ce-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: left - 8, y: y + 4, "font-size": 10, "text-anchor": "end" }, formatNumber(fraction * yMax, 1)));
    });
    [0, 2, 4, 6, 8].forEach(function (value) {
      var x = mapLinear(value, 0, xMax, left, right);
      svg.appendChild(svgNode(doc, "line", { x1: x, x2: x, y1: bottom, y2: bottom + 5, className: "ce-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: bottom + 20, "font-size": 10, "text-anchor": "middle" }, String(value)));
    });
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, className: "ce-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "ce-axis" }));
    var points = [];
    for (var i = 0; i <= 260; i += 1) {
      var xValue = xMax * i / 260;
      points.push({ x: xValue, y: heatCapacity(xValue, result.g0, result.g1) });
    }
    var path = points.map(function (point, index) {
      var x = mapLinear(point.x, 0, xMax, left, right);
      var y = mapLinear(clamp(point.y, 0, yMax), 0, yMax, bottom, top);
      return (index ? "L" : "M") + x + " " + y;
    }).join(" ");
    svg.appendChild(svgNode(doc, "path", { d: path, className: "ce-curve" }));
    var equalPeak = heatCapacityPeak(1, 1);
    var equalX = mapLinear(equalPeak, 0, xMax, left, right);
    var currentPeakX = mapLinear(result.peakX, 0, xMax, left, right);
    var currentX = mapLinear(result.x, 0, xMax, left, right);
    svg.appendChild(svgNode(doc, "line", { x1: equalX, x2: equalX, y1: top, y2: bottom, className: "ce-reference" }));
    svg.appendChild(svgNode(doc, "line", { x1: currentPeakX, x2: currentPeakX, y1: top + 12, y2: bottom, className: "ce-peak" }));
    svg.appendChild(svgNode(doc, "line", { x1: currentX, x2: currentX, y1: top, y2: bottom, className: "ce-current" }));
    svg.appendChild(svgNode(doc, "circle", { cx: currentPeakX, cy: mapLinear(clamp(result.peakCv, 0, yMax), 0, yMax, bottom, top), r: 5, fill: "var(--cl-green)" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 700 }, "Cᵥ/(Nk_B)：两端为零，中间有峰"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: 22, "font-size": 10, "text-anchor": "end" }, "金：等退化 x*=2.399；绿：当前退化峰；红：当前 x"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: height - 10, "font-size": 10, "text-anchor": "end" }, "x=βε"));
    return svg;
  }

  function distributionSvg(doc, result) {
    var width = 620;
    var height = 360;
    var left = 56;
    var right = 592;
    var top = 48;
    var bottom = 304;
    var svg = svgNode(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "固定 K 除以 N 坐标的精确二项分布" });
    svg.appendChild(svgNode(doc, "title", {}, "固定 K/N 坐标的精确二项分布"));
    svg.appendChild(svgNode(doc, "desc", {}, "横轴固定为 K/N 从零到一，纵轴固定为概率从零到一；柱高是精确二项概率，绿色线是均值，金色区域是一倍标准差。"));
    [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
      var y = mapLinear(fraction, 0, 1, bottom, top);
      svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: y, y2: y, className: "ce-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: left - 8, y: y + 4, "font-size": 10, "text-anchor": "end" }, formatNumber(fraction, 2)));
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (value) {
      var x = mapLinear(value, 0, 1, left, right);
      svg.appendChild(svgNode(doc, "line", { x1: x, x2: x, y1: bottom, y2: bottom + 5, className: "ce-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: bottom + 20, "font-size": 10, "text-anchor": "middle" }, formatNumber(value, 2)));
    });
    var bandLow = clamp(result.p - result.fractionSigma, 0, 1);
    var bandHigh = clamp(result.p + result.fractionSigma, 0, 1);
    svg.appendChild(svgNode(doc, "rect", { x: mapLinear(bandLow, 0, 1, left, right), y: top, width: mapLinear(bandHigh, 0, 1, left, right) - mapLinear(bandLow, 0, 1, left, right), height: bottom - top, className: "ce-band" }));
    var barWidth = Math.max(1.2, (right - left) / result.N * 0.82);
    result.distribution.rows.forEach(function (row) {
      var center = mapLinear(row.fraction, 0, 1, left, right);
      var heightPx = row.probability * (bottom - top);
      var x = clamp(center - barWidth / 2, left, right - barWidth);
      svg.appendChild(svgNode(doc, "rect", { x: x, y: bottom - heightPx, width: barWidth, height: heightPx, className: "ce-bar" }));
    });
    var meanX = mapLinear(result.p, 0, 1, left, right);
    svg.appendChild(svgNode(doc, "line", { x1: meanX, x2: meanX, y1: top, y2: bottom, className: "ce-mean" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, className: "ce-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "ce-axis" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 22, "font-size": 13, "font-weight": 700 }, "P(K=k)：精确二项分布"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: 22, "font-size": 10, "text-anchor": "end" }, "坐标固定 K/N∈[0,1]；绿：p；金：±σ"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: height - 10, "font-size": 10, "text-anchor": "end" }, "K/N"));
    return svg;
  }

  function selectedRows(result) {
    var keep = Object.create(null);
    var stride = Math.max(1, Math.ceil(result.distribution.rows.length / 14));
    result.distribution.rows.forEach(function (row, index) {
      if (index % stride === 0 || row.k === 0 || row.k === result.N) keep[row.k] = true;
    });
    keep[Math.round(result.meanK)] = true;
    keep[clamp(Math.round(result.meanK - result.sigmaK), 0, result.N)] = true;
    keep[clamp(Math.round(result.meanK + result.sigmaK), 0, result.N)] = true;
    return result.distribution.rows.filter(function (row) { return keep[row.k]; });
  }

  function appendLedger(doc, parent, result) {
    var wrap = element(doc, "div", { className: "ce-ledger" });
    var table = element(doc, "table", { "aria-label": "精确 K 分布账本" });
    table.appendChild(element(doc, "caption", { text: "精确 K 分布账本（显示代表性行；柱图包含全部 k=0,…,N）" }));
    var head = element(doc, "tr");
    ["k", "K/N", "P(K=k)"].forEach(function (label) {
      head.appendChild(element(doc, "th", { scope: "col", text: label }));
    });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody");
    selectedRows(result).forEach(function (row) {
      var tr = element(doc, "tr");
      [String(row.k), formatNumber(row.fraction, 4), formatNumber(row.probability, 6)].forEach(function (value) {
        tr.appendChild(element(doc, "td", { text: value }));
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    parent.appendChild(wrap);
  }

  function renderResults(doc, results, result) {
    results.replaceChildren();
    results.appendChild(element(doc, "h3", { className: "ce-section-title", text: "揭晓：单元热力学账本" }));
    var unitMetrics = element(doc, "div", { className: "ce-metrics", "aria-label": "单元热力学读数" });
    unitMetrics.appendChild(metric(doc, "ln Z₁", formatNumber(result.logZ1, 5)));
    unitMetrics.appendChild(metric(doc, "p_exc", formatNumber(result.p, 6)));
    unitMetrics.appendChild(metric(doc, "U/(Nε)", formatNumber(result.energyPerUnit, 6)));
    unitMetrics.appendChild(metric(doc, "S/(Nk_B)", formatNumber(result.entropyPerUnit, 6)));
    unitMetrics.appendChild(metric(doc, "Cᵥ/(Nk_B)", formatNumber(result.heatCapacityPerUnit, 6)));
    unitMetrics.appendChild(metric(doc, "当前 Cᵥ 峰 x", formatNumber(result.peakX, 5)));
    results.appendChild(unitMetrics);
    results.appendChild(element(doc, "h3", { className: "ce-section-title", text: "揭晓：总量与集中" }));
    var fluctuationMetrics = element(doc, "div", { className: "ce-metrics", "aria-label": "总激发数涨落读数" });
    fluctuationMetrics.appendChild(metric(doc, "E[K]=Np", formatNumber(result.meanK, 5)));
    fluctuationMetrics.appendChild(metric(doc, "Var(K)=Np(1−p)", formatNumber(result.varianceK, 5)));
    fluctuationMetrics.appendChild(metric(doc, "σK/E[K]", formatNumber(result.relativeFluctuation, 5)));
    fluctuationMetrics.appendChild(metric(doc, "σK/N", formatNumber(result.fractionSigma, 5)));
    fluctuationMetrics.appendChild(metric(doc, "1/√N", formatNumber(result.inverseSqrtN, 5)));
    fluctuationMetrics.appendChild(metric(doc, "固定的单元 p", formatNumber(result.p, 5)));
    results.appendChild(fluctuationMetrics);
    var charts = element(doc, "div", { className: "ce-charts" });
    charts.appendChild(element(doc, "div", { className: "ce-chart" }, [element(doc, "h4", { text: "热容随 x 的曲线" }), heatCapacitySvg(doc, result)]));
    charts.appendChild(element(doc, "div", { className: "ce-chart" }, [element(doc, "h4", { text: "固定坐标的 K 分布" }), distributionSvg(doc, result)]));
    results.appendChild(charts);
    appendLedger(doc, results, result);
    results.appendChild(element(doc, "p", { className: "ce-note", text: "N 只改变 E[K]、Var(K) 和 K/N 的集中尺度；在相同 x、g₀、g₁ 下，p、S/(Nk_B) 与 Cᵥ/(Nk_B) 不随 N 改变。所有柱高来自稳定的对数二项概率并重新归一化。" }));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "ce-" + INSTANCE;
    var state = copyPreset(PRESETS[0]);
    var activePresetId = PRESETS[0].id;
    var predictions = { highTemperature: null, heatCapacity: null, peak: null };
    var revealed = false;
    var feedbackText = "先选择三项预测，再点击“核对预测”。";
    var feedbackClass = "";
    var shell = element(doc, "div", { className: "ce-lab" });
    shell.appendChild(element(doc, "p", { className: "ce-note", text: "精确正则系综：调节退化与 βε，先预测高温占据、两端零热容和 Schottky 峰，再比较固定 K/N 坐标上的二项分布。" }));

    var presetRow = element(doc, "div", { className: "ce-presets", role: "group", "aria-label": "正则系综教学预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label });
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        activePresetId = preset.id;
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    shell.appendChild(presetRow);

    var controls = element(doc, "div", { className: "ce-controls", "aria-label": "正则系综参数控制" });
    var inputs = {};
    [
      ["x", "无量纲温度 x=βε", LIMITS.x[0], LIMITS.x[1], 0.01, 2],
      ["N", "独立单元数 N", LIMITS.N[0], LIMITS.N[1], 1, 0],
      ["g0", "基态简并 g₀", LIMITS.g[0], LIMITS.g[1], 1, 0],
      ["g1", "激发态简并 g₁", LIMITS.g[0], LIMITS.g[1], 1, 0]
    ].forEach(function (spec) {
      var key = spec[0];
      var id = prefix + "-" + key;
      var wrap = element(doc, "div", { className: "ce-control" });
      var label = element(doc, "label", { htmlFor: id });
      label.appendChild(doc.createTextNode(spec[1] + "："));
      var output = element(doc, "output", { id: id + "-value", for: id });
      label.appendChild(output);
      var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], "aria-label": spec[1] });
      input.addEventListener("input", function () {
        state[key] = key === "x" ? Number(input.value) : Math.round(Number(input.value));
        state.id = "custom";
        render();
      });
      wrap.appendChild(label);
      wrap.appendChild(input);
      controls.appendChild(wrap);
      inputs[key] = { input: input, output: output, digits: spec[5] };
    });
    shell.appendChild(controls);

    var predict = element(doc, "div", { className: "ce-predict" });
    predict.appendChild(element(doc, "strong", { className: "ce-predict-title", text: "预测门：三项都作答后才能揭晓" }));
    var questions = [
      {
        key: "highTemperature",
        prompt: "g₀=1、g₁=3 且 x→0 时，p_exc 趋向哪里？",
        choices: [["half", "1/2"], ["degenerate", "3/4（数退化态）"], ["zero", "0"]],
        expected: "degenerate"
      },
      {
        key: "heatCapacity",
        prompt: "固定正能隙时，Cᵥ/(Nk_B) 的温度曲线怎样？",
        choices: [["peak", "两端为零，中间有峰"], ["monotone", "从零单调上升"], ["constant", "始终不变"]],
        expected: "peak"
      },
      {
        key: "peak",
        prompt: "g₀=g₁ 时，Schottky 峰的 x=βε 在哪里？",
        choices: [["schottky", "约 2.399，不是等占据点"], ["equal", "x=0（p=1/2）"], ["one", "x=1"]],
        expected: "schottky"
      }
    ];
    var choiceButtons = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset", { className: "ce-question" });
      fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
      var row = element(doc, "div", { className: "ce-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1] });
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          feedbackText = "预测已记录。";
          feedbackClass = "";
          renderPrediction();
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      predict.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "ce-actions" });
    var check = element(doc, "button", { type: "button", className: "cl-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置本预设" });
    actions.appendChild(check);
    actions.appendChild(reset);
    predict.appendChild(actions);
    var feedback = element(doc, "p", { className: "ce-feedback", "aria-live": "polite", "aria-atomic": "true", text: feedbackText });
    predict.appendChild(feedback);
    shell.appendChild(predict);

    var results = element(doc, "section", { className: "ce-results", "aria-label": "揭晓后的正则系综结果" });
    results.hidden = true;
    shell.appendChild(results);
    root.replaceChildren(shell);

    check.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedbackText = "还差 " + missing.length + " 项预测，请逐项选择。";
        feedbackClass = "ce-warn";
        renderPrediction();
        announce(feedbackText);
        return;
      }
      var correct = questions.filter(function (question) { return predictions[question.key] === question.expected; }).length;
      revealed = true;
      feedbackText = "已揭晓：" + correct + "/3 命中。高温极限数退化态；等退化峰满足 x tanh(x/2)=2。";
      feedbackClass = correct === questions.length ? "ce-pass" : "ce-warn";
      render();
      announce(feedbackText);
    });

    reset.addEventListener("click", function () {
      var preset = PRESETS.filter(function (item) { return item.id === activePresetId; })[0] || PRESETS[0];
      state = copyPreset(preset);
      predictions = { highTemperature: null, heatCapacity: null, peak: null };
      revealed = false;
      feedbackText = "先选择三项预测，再点击“核对预测”。";
      feedbackClass = "";
      render();
    });

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function renderPrediction() {
      choiceButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false");
      });
      feedback.textContent = feedbackText;
      feedback.className = "ce-feedback" + (feedbackClass ? " " + feedbackClass : "");
    }

    function render() {
      Object.keys(inputs).forEach(function (key) {
        var input = inputs[key].input;
        var output = inputs[key].output;
        input.value = String(state[key]);
        output.textContent = formatNumber(state[key], inputs[key].digits);
      });
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === activePresetId && state.id !== "custom" ? "true" : "false");
      });
      presetRow.hidden = !revealed;
      controls.hidden = !revealed;
      renderPrediction();
      var result = canonicalModel(state);
      results.hidden = !revealed;
      if (revealed) renderResults(doc, results, result);
    }

    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error("canonical-ensemble self-test failed: " + message);
    }
    var hot = canonicalModel({ x: 0, N: 12, g0: 1, g1: 3 });
    assert(nearly(hot.p, 0.75, 1e-12), "high-temperature degeneracy");
    assert(nearly(hot.energyPerUnit, hot.p, 1e-12), "energy occupation identity");
    assert(nearly(hot.heatCapacityPerUnit, 0, 1e-12), "high-temperature endpoint");
    assert(nearly(hot.distribution.probabilitySum, 1, 1e-12), "hot distribution normalization");
    var mgfX = 1;
    var mgfT = 0.2;
    var mgfFromZ = Math.exp(logPartition(mgfX - mgfT, 1, 1) - logPartition(mgfX, 1, 1));
    var mgfDirect = (1 + Math.exp(-(mgfX - mgfT))) / (1 + Math.exp(-mgfX));
    assert(nearly(mgfFromZ, mgfDirect, 1e-12), "normalized energy MGF ratio");
    var equalPeak = heatCapacityPeak(1, 1);
    assert(nearly(equalPeak, 2.3993572805, 1e-8), "equal-degeneracy Schottky peak");
    assert(nearly(heatCapacity(0, 1, 1), 0, 1e-14), "equal-occupancy point is not peak");
    assert(heatCapacity(equalPeak, 1, 1) > heatCapacity(0, 1, 1), "intermediate heat-capacity peak");
    assert(heatCapacity(8, 1, 1) < 0.03, "low-temperature endpoint");
    var sample = canonicalModel({ x: 1, N: 25, g0: 1, g1: 1 });
    assert(nearly(sample.meanK, 25 * sample.p, 1e-12), "binomial mean");
    assert(nearly(sample.varianceK, 25 * sample.p * (1 - sample.p), 1e-12), "binomial variance");
    var larger = canonicalModel({ x: 1, N: 100, g0: 1, g1: 1 });
    assert(nearly(sample.p, larger.p, 1e-12), "N leaves unit occupation unchanged");
    assert(nearly(sample.heatCapacityPerUnit, larger.heatCapacityPerUnit, 1e-12), "N leaves unit heat capacity unchanged");
    assert(nearly(sample.fractionSigma / larger.fractionSigma, 2, 1e-12), "fraction concentration scales as one over sqrt N");
    assert(nearly(sample.relativeFluctuation / larger.relativeFluctuation, 2, 1e-12), "relative fluctuation scales as one over sqrt N");
    var stable = canonicalModel({ x: 8, N: 400, g0: 1, g1: 8 });
    assert(Number.isFinite(stable.logZ1) && Number.isFinite(stable.p), "stable low-temperature values");
    assert(nearly(stable.distribution.probabilitySum, 1, 1e-12), "stable distribution normalization");
    assert(stable.distribution.rows.every(function (row) { return row.probability >= 0 && Number.isFinite(row.probability); }), "nonnegative finite probabilities");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length, schottkyPeak: equalPeak };
  }

  var exported = {
    PRESETS: PRESETS,
    logAddExp: logAddExp,
    logPartition: logPartition,
    excitationProbability: excitationProbability,
    heatCapacity: heatCapacity,
    heatCapacityPeak: heatCapacityPeak,
    binomialDistribution: binomialDistribution,
    canonicalModel: canonicalModel,
    selfTest: selfTest
  };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("canonical-ensemble", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log("canonical-ensemble self-test: PASS (" + report.checks + " checks, " + report.presets + " presets; x*= " + report.schottkyPeak.toFixed(6) + ")");
    } catch (error) {
      console.error("canonical-ensemble self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null);
