(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "jl-projection-lab-styles";
  var INSTANCE = 0;
  var DIMENSION = 32;
  var DEFAULTS = { presetId: "default", k: 8, epsilon: 0.2, showEnsemble: false };
  var PRESETS = [
    { id: "default", label: "默认 · seed 20260722", seed: 20260722 },
    { id: "pi", label: "对照 · seed 31415926", seed: 31415926 },
    { id: "e", label: "对照 · seed 27182818", seed: 27182818 },
    { id: "stress", label: "压力 · seed 8675309", seed: 8675309 }
  ];
  var DIAGNOSTIC_SEEDS = [20260722, 31415926, 27182818, 8675309, 1103515245, 123456789, 42424242, 987654321, 135791113, 246802468, 314159265, 161803398, 19260817, 9001, 65537, 4294967];
  var NONMONOTONE_CASE = { seed: 20260722, epsilon: 0.2, fromK: 4, toK: 5 };
  var PLOT_MAX = 3;
  var RATIO_MAX = 3;
  var MATRIX_CACHE = Object.create(null);

  var STYLE_TEXT = [
    ".jl-lab{--jl-blue:var(--accent,#315f9d);--jl-orange:var(--cl-gold,#9b6a12);--jl-green:var(--cl-green,#39734d);--jl-red:var(--cl-red,#b64335);--jl-muted:var(--fg-soft,#6f6a60);--jl-band:rgba(57,115,77,.13);color:var(--fg);line-height:1.55;min-width:0}",
    "html[data-theme=dark] .jl-lab{--jl-blue:#83c8ff;--jl-orange:#e2b458;--jl-green:#72bd8b;--jl-red:#f08c7d;--jl-muted:#b8b2a7;--jl-band:rgba(114,189,139,.16)}",
    ".jl-lab *{box-sizing:border-box}.jl-lab [hidden]{display:none!important}.jl-lab button,.jl-lab select,.jl-lab input{font:inherit}.jl-lab button,.jl-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.jl-lab button{padding:8px 11px;cursor:pointer}.jl-lab button:hover{border-color:var(--accent)}.jl-lab button[aria-pressed=true],.jl-lab .jl-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}.jl-lab button:focus-visible,.jl-lab select:focus-visible,.jl-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".jl-lab .jl-note,.jl-lab .jl-feedback{color:var(--jl-muted);font-size:13px;line-height:1.65}.jl-lab .jl-heading{margin:0}.jl-lab .jl-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.jl-lab .jl-control{display:grid;gap:5px;min-width:0}.jl-lab .jl-control label,.jl-lab .jl-control legend{color:var(--jl-muted);font-size:12.5px;font-weight:700}.jl-lab .jl-control select{width:100%;padding:7px 9px}.jl-lab .jl-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.jl-lab output{color:var(--jl-blue);font-variant-numeric:tabular-nums}.jl-lab .jl-seed-readout{display:block;color:var(--jl-muted);font-size:12px;overflow-wrap:anywhere}.jl-lab .jl-check{display:flex;align-items:center;gap:8px;min-height:44px;color:var(--fg);font-size:13px}.jl-lab .jl-check input{width:18px;height:18px;accent-color:var(--accent)}",
    ".jl-lab .jl-predict{margin:16px 0;padding:12px 14px;border-left:3px solid var(--jl-orange);background:var(--block-bg,var(--bg))}.jl-lab .jl-predict>strong{display:block;margin-bottom:10px;font-size:13px}.jl-lab .jl-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.jl-lab .jl-prediction-grid fieldset{min-width:0;margin:0;padding:9px;border:1px solid var(--border);border-radius:6px}.jl-lab .jl-prediction-grid legend{padding:0 4px;line-height:1.45}.jl-lab .jl-choices{display:grid;gap:6px}.jl-lab .jl-choices button{width:100%;min-height:44px;text-align:left;font-size:12.5px}.jl-lab .jl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.jl-lab .jl-feedback{min-height:1.7em;margin:9px 0 0;font-weight:700}.jl-lab .jl-pass{color:var(--jl-green)}.jl-lab .jl-warn{color:var(--jl-red)}",
    ".jl-lab .jl-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:16px 0}.jl-lab .jl-metric{min-width:0;padding:9px 7px;border-top:2px solid var(--border)}.jl-lab .jl-metric span{display:block;color:var(--jl-muted);font-size:11px;line-height:1.4}.jl-lab .jl-metric strong{display:block;margin-top:3px;font-size:15px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.jl-lab .jl-results{min-width:0}.jl-lab .jl-charts{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:12px}.jl-lab .jl-chart{min-width:0}.jl-lab .jl-chart h4,.jl-lab .jl-ledger-title{margin:12px 0 7px;font-size:14px}.jl-lab svg{display:block;width:100%;height:auto;aspect-ratio:760/420;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.jl-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.jl-lab .jl-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.jl-lab .jl-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.2}.jl-lab .jl-diagonal{stroke:var(--jl-muted);stroke-width:1.5;stroke-dasharray:5 4}.jl-lab .jl-band{fill:var(--jl-band);stroke:none}.jl-lab .jl-band-line{stroke:var(--jl-green);stroke-width:1.4;stroke-dasharray:5 4}.jl-lab .jl-point-inside{fill:var(--jl-blue);stroke:var(--bg);stroke-width:1}.jl-lab .jl-point-outside{fill:var(--jl-red);stroke:var(--bg);stroke-width:1}.jl-lab .jl-chart-label{font-size:11px;fill:var(--jl-muted)}.jl-lab .jl-chart-title{font-size:13px;font-weight:700}.jl-lab .jl-ensemble{margin:14px 0;padding:10px 12px;border-left:3px solid var(--jl-orange);background:var(--block-bg,var(--bg))}.jl-lab .jl-ensemble strong{display:block;font-size:13px}.jl-lab .jl-ensemble p{margin:5px 0;color:var(--jl-muted);font-size:12.5px}.jl-lab .jl-ensemble-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.jl-lab .jl-ensemble-grid span{display:block;color:var(--jl-muted);font-size:11px}.jl-lab .jl-ensemble-grid b{display:block;margin-top:2px;font-size:14px;font-variant-numeric:tabular-nums}.jl-lab .jl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.jl-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.jl-lab th,.jl-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:right;vertical-align:top}.jl-lab th:first-child,.jl-lab td:first-child{text-align:left}.jl-lab th{color:var(--jl-muted);font-size:11px}.jl-lab .jl-inside{color:var(--jl-green);font-weight:700}.jl-lab .jl-outside{color:var(--jl-red);font-weight:700}.jl-lab .jl-footnote{margin:11px 0 0;padding:8px 10px;border-left:3px solid var(--jl-green);background:var(--block-bg,var(--bg));color:var(--jl-muted);font-size:12.5px;line-height:1.65}",
    "@media(max-width:1100px){.jl-lab .jl-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.jl-lab .jl-prediction-grid{grid-template-columns:minmax(0,1fr)}.jl-lab .jl-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.jl-lab .jl-charts{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:500px){.jl-lab .jl-controls{grid-template-columns:minmax(0,1fr)}.jl-lab .jl-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.jl-lab svg{min-width:620px;max-width:none}.jl-lab .jl-chart{overflow-x:auto;-webkit-overflow-scrolling:touch}}",
    "@media(prefers-reduced-motion:reduce){.jl-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && Number.isFinite(value); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
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
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children); }
  function svgNode(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function replaceChildren(node, children) { clear(node); appendChildren(node, children); }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function makeRng(seed) {
    var state = Number(seed) >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rng) {
    var u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }
  function gaussianMatrix(seed, rows, columns) {
    var rowCount = rows === undefined ? DIMENSION : Math.max(1, Math.floor(rows));
    var columnCount = columns === undefined ? DIMENSION : Math.max(1, Math.floor(columns));
    var rng = makeRng(seed), matrix = [], r, c, row;
    for (r = 0; r < rowCount; r += 1) {
      row = [];
      for (c = 0; c < columnCount; c += 1) row.push(gaussian(rng));
      matrix.push(row);
    }
    return matrix;
  }
  function matrixForSeed(seed) {
    var key = String(Number(seed) >>> 0);
    if (!MATRIX_CACHE[key]) MATRIX_CACHE[key] = gaussianMatrix(Number(seed) >>> 0, DIMENSION, DIMENSION);
    return MATRIX_CACHE[key];
  }
  function makePoints() {
    var points = [], i, v;
    function blank() { var result = []; for (var n = 0; n < DIMENSION; n += 1) result.push(0); return result; }
    v = blank(); points.push(v);
    v = blank(); v[0] = 1; points.push(v);
    v = blank(); v[1] = 1; points.push(v);
    v = blank(); v[0] = 1; v[1] = 1; points.push(v);
    v = blank(); for (i = 0; i < 8; i += 1) v[i] = 1 / Math.sqrt(8); points.push(v);
    v = blank(); for (i = 0; i < 8; i += 1) v[i] = (i % 2 ? -1 : 1) / Math.sqrt(8); points.push(v);
    v = blank(); for (i = 0; i < DIMENSION; i += 1) v[i] = 1 / Math.sqrt(DIMENSION); points.push(v);
    v = blank(); for (i = 0; i < DIMENSION; i += 1) v[i] = (i % 2 ? -1 : 1) / Math.sqrt(DIMENSION); points.push(v);
    v = blank(); for (i = 0; i < 16; i += 1) v[i] = 0.25; points.push(v);
    v = blank(); for (i = 16; i < DIMENSION; i += 1) v[i] = 0.25; points.push(v);
    v = blank(); for (i = 0; i < 4; i += 1) v[i] = 0.5; points.push(v);
    v = blank(); for (i = 0; i < 4; i += 1) v[i] = (i % 2 ? -0.5 : 0.5); points.push(v);
    return points;
  }
  var POINTS = makePoints();
  function squaredDistance(left, right) {
    var sum = 0, i, delta;
    for (i = 0; i < left.length; i += 1) { delta = left[i] - right[i]; sum += delta * delta; }
    return sum;
  }
  function maxOriginalDistance(points) {
    var max = 0, i, j;
    for (i = 0; i < points.length; i += 1) for (j = i + 1; j < points.length; j += 1) max = Math.max(max, squaredDistance(points[i], points[j]));
    return max;
  }
  var ORIGINAL_SCALE = maxOriginalDistance(POINTS);
  function projectPoints(points, k, seed) {
    var rows = matrixForSeed(seed), scale = 1 / Math.sqrt(k), projected = [], p, r, c, sum, point;
    for (p = 0; p < points.length; p += 1) {
      point = [];
      for (r = 0; r < k; r += 1) {
        sum = 0;
        for (c = 0; c < DIMENSION; c += 1) sum += rows[r][c] * points[p][c];
        point.push(sum * scale);
      }
      projected.push(point);
    }
    return projected;
  }
  function normalizeConfig(config) {
    var input = config || {}, rawK = input.k === undefined ? DEFAULTS.k : Number(input.k), rawE = input.epsilon === undefined ? DEFAULTS.epsilon : Number(input.epsilon);
    var seed = input.seed === undefined ? PRESETS[0].seed : Number(input.seed);
    return { k: clamp(Math.round(finite(rawK) ? rawK : DEFAULTS.k), 2, DIMENSION), epsilon: clamp(finite(rawE) ? rawE : DEFAULTS.epsilon, 0.1, 0.6), seed: (finite(seed) ? seed : PRESETS[0].seed) >>> 0 };
  }
  function analyze(config) {
    var settings = normalizeConfig(config), projected = projectPoints(POINTS, settings.k, settings.seed), pairs = [], i, j, originalSquared, projectedSquared, ratio, inside;
    var minRatio = Infinity, maxRatio = -Infinity, worstDeviation = 0, insideCount = 0;
    for (i = 0; i < POINTS.length; i += 1) for (j = i + 1; j < POINTS.length; j += 1) {
      originalSquared = squaredDistance(POINTS[i], POINTS[j]);
      projectedSquared = squaredDistance(projected[i], projected[j]);
      ratio = projectedSquared / originalSquared;
      inside = ratio >= 1 - settings.epsilon && ratio <= 1 + settings.epsilon;
      pairs.push({ i: i, j: j, originalSquared: originalSquared, projectedSquared: projectedSquared, ratio: ratio, inside: inside });
      minRatio = Math.min(minRatio, ratio); maxRatio = Math.max(maxRatio, ratio); worstDeviation = Math.max(worstDeviation, Math.abs(ratio - 1));
      if (inside) insideCount += 1;
    }
    return { seed: settings.seed, k: settings.k, epsilon: settings.epsilon, dimension: DIMENSION, points: POINTS, projectedPoints: projected, originalScale: ORIGINAL_SCALE, pairs: pairs, pairCount: pairs.length, minRatio: minRatio, maxRatio: maxRatio, worstDeviation: worstDeviation, insideCount: insideCount, fractionInside: insideCount / pairs.length };
  }
  function ensembleDiagnostic(k, epsilon) {
    var reports = DIAGNOSTIC_SEEDS.map(function (seed) { return analyze({ seed: seed, k: k, epsilon: epsilon }); });
    var meanFraction = reports.reduce(function (sum, item) { return sum + item.fractionInside; }, 0) / reports.length;
    var meanWorst = reports.reduce(function (sum, item) { return sum + item.worstDeviation; }, 0) / reports.length;
    var passMaps = reports.filter(function (item) { return item.insideCount === item.pairCount; }).length;
    return { count: reports.length, meanFraction: meanFraction, meanWorst: meanWorst, passMaps: passMaps, minFraction: Math.min.apply(null, reports.map(function (item) { return item.fractionInside; })), maxFraction: Math.max.apply(null, reports.map(function (item) { return item.fractionInside; })) };
  }
  function assertFiniteResult(result, check) {
    check(finite(result.minRatio) && finite(result.maxRatio) && finite(result.worstDeviation) && finite(result.fractionInside), "finite summary");
    check(result.projectedPoints.every(function (point) { return point.every(finite); }), "finite projected points");
    result.pairs.forEach(function (pair) { check(finite(pair.originalSquared) && finite(pair.projectedSquared) && finite(pair.ratio), "finite pair " + pair.i + "," + pair.j); });
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error("jl-projection self-test failed: " + message); }
    check(POINTS.length >= 10 && POINTS.length <= 12, "analytic point count");
    check(POINTS.every(function (point) { return point.length === DIMENSION && point.every(finite); }), "analytic points finite");
    var expectedPairs = POINTS.length * (POINTS.length - 1) / 2;
    var first = analyze(DEFAULTS), repeat = analyze(DEFAULTS);
    check(first.pairCount === expectedPairs, "pair count");
    check(JSON.stringify(first.projectedPoints) === JSON.stringify(repeat.projectedPoints), "deterministic reproducibility");
    check(first.pairs.every(function (pair) { return pair.originalSquared > 0; }), "nonidentical points");
    assertFiniteResult(first, check);
    var expectationK = 16, expectationCount = 512, sum = 0, n, seed, expectationResult, standardError, tolerance;
    for (n = 0; n < expectationCount; n += 1) {
      seed = (900000 + Math.imul(n + 1, 2654435761)) >>> 0;
      expectationResult = analyze({ seed: seed, k: expectationK, epsilon: 0.2 });
      sum += expectationResult.pairs[0].ratio;
    }
    var mean = sum / expectationCount;
    standardError = Math.sqrt(2 / (expectationK * expectationCount));
    tolerance = 5 * standardError + 0.01;
    check(Math.abs(mean - 1) <= tolerance, "approximate expectation over seeds (mean " + mean + ", tolerance " + tolerance + ")");
    var lower = analyze({ seed: NONMONOTONE_CASE.seed, epsilon: NONMONOTONE_CASE.epsilon, k: NONMONOTONE_CASE.fromK }), higher = analyze({ seed: NONMONOTONE_CASE.seed, epsilon: NONMONOTONE_CASE.epsilon, k: NONMONOTONE_CASE.toK });
    check(higher.worstDeviation > lower.worstDeviation + 1e-10, "locked nonmonotone nested seed example");
    var diagnostic = ensembleDiagnostic(8, 0.2);
    check(diagnostic.count === DIAGNOSTIC_SEEDS.length && finite(diagnostic.meanFraction), "finite-seed diagnostic");
    return { checks: checks, points: POINTS.length, pairs: expectedPairs, expectationMean: mean, expectationTolerance: tolerance, nonmonotone: { seed: NONMONOTONE_CASE.seed, fromK: NONMONOTONE_CASE.fromK, toK: NONMONOTONE_CASE.toK, fromWorst: lower.worstDeviation, toWorst: higher.worstDeviation } };
  }

  function mapLinear(value, min, max, start, end) { return start + (value - min) / (max - min) * (end - start); }
  function metric(doc, label, value, className) { var box = element(doc, "div", { className: "jl-metric" }); box.appendChild(element(doc, "span", {}, label)); box.appendChild(element(doc, "strong", className ? { className: className } : {}, value)); return box; }
  function scatterSvg(doc, data, uid) {
    var width = 760, height = 420, left = 62, right = 24, top = 34, bottom = 56, plotRight = width - right, plotBottom = height - bottom;
    var svg = svgNode(doc, "svg", { width: width, height: height, viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-scatter-title " + uid + "-scatter-desc" });
    svg.appendChild(svgNode(doc, "title", { id: uid + "-scatter-title" }, "原始与投影平方距离散点图"));
    svg.appendChild(svgNode(doc, "desc", { id: uid + "-scatter-desc" }, "固定归一化坐标；蓝点在容差带内，红点在容差带外。"));
    var x = function (value) { return mapLinear(value, 0, PLOT_MAX, left, plotRight); }, y = function (value) { return mapLinear(value, 0, PLOT_MAX, plotBottom, top); };
    [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(function (tick) { svg.appendChild(svgNode(doc, "line", { x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "jl-grid" })); svg.appendChild(svgNode(doc, "line", { x1: left, y1: y(tick), x2: plotRight, y2: y(tick), className: "jl-grid" })); svg.appendChild(svgNode(doc, "text", { x: x(tick), y: plotBottom + 18, "text-anchor": "middle", className: "jl-chart-label" }, String(tick))); svg.appendChild(svgNode(doc, "text", { x: left - 8, y: y(tick) + 4, "text-anchor": "end", className: "jl-chart-label" }, String(tick))); });
    var xEnd = Math.min(1, PLOT_MAX / (1 + data.epsilon));
    svg.appendChild(svgNode(doc, "polygon", { points: x(0) + "," + y(0) + " " + x(xEnd) + "," + y((1 + data.epsilon) * xEnd) + " " + x(xEnd) + "," + y((1 - data.epsilon) * xEnd), className: "jl-band" }));
    svg.appendChild(svgNode(doc, "line", { x1: x(0), y1: y(0), x2: x(xEnd), y2: y((1 - data.epsilon) * xEnd), className: "jl-band-line" }));
    svg.appendChild(svgNode(doc, "line", { x1: x(0), y1: y(0), x2: x(xEnd), y2: y((1 + data.epsilon) * xEnd), className: "jl-band-line" }));
    svg.appendChild(svgNode(doc, "line", { x1: x(0), y1: y(0), x2: x(1), y2: y(1), className: "jl-diagonal" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "jl-axis" })); svg.appendChild(svgNode(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "jl-axis" }));
    data.pairs.forEach(function (pair) { var xValue = clamp(pair.originalSquared / data.originalScale, 0, PLOT_MAX), rawY = pair.projectedSquared / data.originalScale, yValue = clamp(rawY, 0, PLOT_MAX), circle = svgNode(doc, "circle", { cx: x(xValue), cy: y(yValue), r: 3.8, className: pair.inside ? "jl-point-inside" : "jl-point-outside", "aria-label": "点对 " + pair.i + "," + pair.j + "，比值 " + format(pair.ratio, 3) }); circle.appendChild(svgNode(doc, "title", {}, "点对 " + pair.i + "," + pair.j + "：原始 " + format(pair.originalSquared, 3) + "，投影 " + format(pair.projectedSquared, 3) + "，比值 " + format(pair.ratio, 3))); svg.appendChild(circle); });
    svg.appendChild(svgNode(doc, "text", { x: (left + plotRight) / 2, y: height - 12, "text-anchor": "middle", className: "jl-chart-label" }, "原始平方距离 / 固定 D*²")); svg.appendChild(svgNode(doc, "text", { x: 15, y: (top + plotBottom) / 2, transform: "rotate(-90 15 " + ((top + plotBottom) / 2) + ")", "text-anchor": "middle", className: "jl-chart-label" }, "投影平方距离 / 固定 D*²")); svg.appendChild(svgNode(doc, "text", { x: left, y: 19, className: "jl-chart-title" }, "蓝：容差内　红：容差外　绿带：1±ε"));
    return svg;
  }
  function histogramSvg(doc, data, uid) {
    var width = 760, height = 420, left = 54, right = 22, top = 34, bottom = 56, plotRight = width - right, plotBottom = height - bottom, bins = 15, counts = [], i;
    for (i = 0; i < bins; i += 1) counts.push(0);
    data.pairs.forEach(function (pair) { var index = Math.floor(clamp(pair.ratio, 0, RATIO_MAX - 1e-9) / RATIO_MAX * bins); counts[index] += 1; });
    var maxCount = Math.max.apply(null, counts), svg = svgNode(doc, "svg", { width: width, height: height, viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-hist-title " + uid + "-hist-desc" });
    svg.appendChild(svgNode(doc, "title", { id: uid + "-hist-title" }, "距离比值分布")); svg.appendChild(svgNode(doc, "desc", { id: uid + "-hist-desc" }, "横轴固定为距离平方比 0 到 3，绿色区间表示当前容差带。"));
    var x = function (value) { return mapLinear(value, 0, RATIO_MAX, left, plotRight); }, y = function (value) { return mapLinear(value, 0, Math.max(1, maxCount), plotBottom, top); };
    [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(function (tick) { svg.appendChild(svgNode(doc, "line", { x1: x(tick), y1: top, x2: x(tick), y2: plotBottom, className: "jl-grid" })); svg.appendChild(svgNode(doc, "text", { x: x(tick), y: plotBottom + 18, "text-anchor": "middle", className: "jl-chart-label" }, String(tick))); });
    svg.appendChild(svgNode(doc, "rect", { x: x(Math.max(0, 1 - data.epsilon)), y: top, width: x(Math.min(RATIO_MAX, 1 + data.epsilon)) - x(Math.max(0, 1 - data.epsilon)), height: plotBottom - top, className: "jl-band" }));
    counts.forEach(function (count, index) { var band = RATIO_MAX / bins, barWidth = (plotRight - left) / bins - 2, bar = svgNode(doc, "rect", { x: x(index * band) + 1, y: y(count), width: barWidth, height: plotBottom - y(count), className: "jl-point-inside" }); bar.appendChild(svgNode(doc, "title", {}, "比值 " + format(index * band, 2) + "–" + format((index + 1) * band, 2) + "：" + count + " 个点对")); svg.appendChild(bar); });
    svg.appendChild(svgNode(doc, "line", { x1: x(1), y1: top, x2: x(1), y2: plotBottom, className: "jl-band-line" })); svg.appendChild(svgNode(doc, "line", { x1: left, y1: plotBottom, x2: plotRight, y2: plotBottom, className: "jl-axis" })); svg.appendChild(svgNode(doc, "line", { x1: left, y1: top, x2: left, y2: plotBottom, className: "jl-axis" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 19, className: "jl-chart-title" }, "比值分布：绿色带为 [1−ε,1+ε]")); svg.appendChild(svgNode(doc, "text", { x: (left + plotRight) / 2, y: height - 12, "text-anchor": "middle", className: "jl-chart-label" }, "投影平方距离 / 原始平方距离")); svg.appendChild(svgNode(doc, "text", { x: 16, y: (top + plotBottom) / 2, transform: "rotate(-90 16 " + ((top + plotBottom) / 2) + ")", "text-anchor": "middle", className: "jl-chart-label" }, "点对数"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc); var uid = "jl-" + (++INSTANCE);
    var state = { presetId: DEFAULTS.presetId, k: DEFAULTS.k, epsilon: DEFAULTS.epsilon, showEnsemble: DEFAULTS.showEnsemble, revealed: false, predictions: { expectation: null, simultaneous: null, nested: null } };
    var refs = { predictionButtons: Object.create(null) };
    function preset() { return PRESETS.filter(function (item) { return item.id === state.presetId; })[0] || PRESETS[0]; }
    function changeSetting() { render(); }
    function makePrediction(key, legendText, choices) {
      var fieldset = element(doc, "fieldset", {}), legend = element(doc, "legend", {}, legendText), group = element(doc, "div", { className: "jl-choices" });
      fieldset.appendChild(legend); refs.predictionButtons[key] = [];
      choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label }); button.addEventListener("click", function () { state.predictions[key] = choice.value; renderPrediction(); }); refs.predictionButtons[key].push({ value: choice.value, node: button }); group.appendChild(button); });
      fieldset.appendChild(group); return fieldset;
    }
    var shell = element(doc, "div", { className: "jl-lab" });
    shell.appendChild(element(doc, "h3", { className: "jl-heading" }, "Johnson–Lindenstrauss：随机图的距离账本"));
    shell.appendChild(element(doc, "p", { className: "jl-note" }, "固定 12 点与固定 PRNG；先预测，再揭示一次 map 的 66 个点对。揭示后可以连续改变参数，不把一次抽样误当成定理。"));
    var controls = element(doc, "section", { className: "jl-controls", hidden: true, "aria-labelledby": uid + "-controls-title" });
    controls.appendChild(element(doc, "h4", { id: uid + "-controls-title", hidden: true }, "投影参数"));
    var presetBox = element(doc, "div", { className: "jl-control" }), presetLabel = element(doc, "label", { htmlFor: uid + "-preset" }, "命名 seed");
    var presetSelect = element(doc, "select", { id: uid + "-preset", "aria-label": "选择命名 seed" }); PRESETS.forEach(function (item) { presetSelect.appendChild(element(doc, "option", { value: item.id }, item.label)); }); presetSelect.addEventListener("change", function () { state.presetId = presetSelect.value; changeSetting(); }); presetBox.appendChild(presetLabel); presetBox.appendChild(presetSelect); presetBox.appendChild(element(doc, "span", { className: "jl-seed-readout", "aria-live": "polite" })); refs.presetReadout = presetBox.querySelector(".jl-seed-readout"); controls.appendChild(presetBox);
    function rangeBox(key, labelText, min, max, step, outputDigits) { var box = element(doc, "div", { className: "jl-control" }), output = element(doc, "output", {}), label = element(doc, "label", { htmlFor: uid + "-" + key }, [labelText + " = ", output]), input = element(doc, "input", { id: uid + "-" + key, type: "range", min: String(min), max: String(max), step: String(step), "aria-label": labelText }); input.addEventListener("input", function () { state[key] = Number(input.value); changeSetting(); }); box.appendChild(label); box.appendChild(input); refs[key] = { input: input, output: output, digits: outputDigits }; return box; }
    controls.appendChild(rangeBox("k", "目标维数 k", 2, DIMENSION, 1, 0)); controls.appendChild(rangeBox("epsilon", "容差 ε", 0.1, 0.6, 0.05, 2));
    var ensembleBox = element(doc, "div", { className: "jl-control" }), ensembleLabel = element(doc, "label", { className: "jl-check" }, []), ensembleInput = element(doc, "input", { type: "checkbox", "aria-label": "显示有限种子诊断" }); ensembleLabel.appendChild(ensembleInput); ensembleLabel.appendChild(doc.createTextNode("显示有限种子诊断")); ensembleInput.addEventListener("change", function () { state.showEnsemble = ensembleInput.checked; changeSetting(); }); ensembleBox.appendChild(ensembleLabel); ensembleBox.appendChild(element(doc, "span", { className: "jl-note" }, "仅诊断，不是证明")); controls.appendChild(ensembleBox); shell.appendChild(controls);
    var prediction = element(doc, "section", { className: "jl-predict", "aria-labelledby": uid + "-predict-title" }); prediction.appendChild(element(doc, "strong", { id: uid + "-predict-title" }, "先预测三件事，再揭示账本")); var predictionGrid = element(doc, "div", { className: "jl-prediction-grid" }); predictionGrid.appendChild(makePrediction("expectation", "固定向量的期望比值", [{ value: "one", label: "保持为 1" }, { value: "changes", label: "随 k 改变" }])); predictionGrid.appendChild(makePrediction("simultaneous", "一次随机图对所有点对", [{ value: "guarantee", label: "必然全部通过" }, { value: "high-probability", label: "高概率但可能失败" }])); predictionGrid.appendChild(makePrediction("nested", "固定 seed 的嵌套路径", [{ value: "monotone", label: "最坏误差必单调下降" }, { value: "distribution", label: "分布更集中，路径可非单调" }])); prediction.appendChild(predictionGrid);
    var actions = element(doc, "div", { className: "jl-actions" }), reveal = element(doc, "button", { type: "button", className: "jl-primary" }, "揭示并核对"), reset = element(doc, "button", { type: "button" }, "重置"); actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions); var feedback = element(doc, "p", { className: "jl-feedback", "aria-live": "polite" }, "先选择三个预测。 "); prediction.appendChild(feedback); shell.appendChild(prediction);
    var results = element(doc, "section", { className: "jl-results", hidden: true, "aria-labelledby": uid + "-results-title" }), metrics = element(doc, "div", { className: "jl-metrics" }), charts = element(doc, "div", { className: "jl-charts" }), scatterHost = element(doc, "div", { className: "jl-chart" }), histogramHost = element(doc, "div", { className: "jl-chart" }), ensembleHost = element(doc, "div", { className: "jl-ensemble", hidden: true }), table = element(doc, "table", { "aria-label": "Johnson–Lindenstrauss 点对距离账本" }), ledgerBody = element(doc, "tbody");
    results.appendChild(element(doc, "h4", { id: uid + "-results-title", hidden: true }, "投影结果")); charts.appendChild(scatterHost); charts.appendChild(histogramHost); results.appendChild(metrics); results.appendChild(charts); results.appendChild(ensembleHost); results.appendChild(element(doc, "div", { className: "jl-ledger-title" }, "逐点对距离账本")); var tableWrap = element(doc, "div", { className: "jl-table-wrap" }); table.appendChild(element(doc, "caption", {}, "每个点对的原始平方距离、投影平方距离、比值与容差状态")); var head = element(doc, "thead"), headRow = element(doc, "tr", {}); ["点对", "原始 d²", "投影 d²", "比值", "状态"].forEach(function (label) { headRow.appendChild(element(doc, "th", { scope: "col" }, label)); }); head.appendChild(headRow); table.appendChild(head); table.appendChild(ledgerBody); tableWrap.appendChild(table); results.appendChild(tableWrap); results.appendChild(element(doc, "p", { className: "jl-footnote" }, "期望保距是对随机 map 的平均；当前图和表只展示一个固定 seed。k 增大改善的是分布尾部，不能把这条固定嵌套路径改写成单调保证。")); shell.appendChild(results); root.classList.add("jl-lab"); root.replaceChildren(shell);
    function renderPrediction() { Object.keys(refs.predictionButtons).forEach(function (key) { refs.predictionButtons[key].forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[key] === item.value ? "true" : "false"); }); }); }
    function renderResults(data) {
      replaceChildren(metrics, [metric(doc, "点对数", String(data.pairCount)), metric(doc, "最小比值", format(data.minRatio, 3)), metric(doc, "最大比值", format(data.maxRatio, 3)), metric(doc, "最坏 |r−1|", format(data.worstDeviation, 3)), metric(doc, "容差内", data.insideCount + "/" + data.pairCount), metric(doc, "容差内比例", format(data.fractionInside * 100, 1) + "%")]);
      replaceChildren(scatterHost, [element(doc, "h4", {}, "原始 vs 投影平方距离"), scatterSvg(doc, data, uid)]); replaceChildren(histogramHost, [element(doc, "h4", {}, "比值分布"), histogramSvg(doc, data, uid)]);
      replaceChildren(ledgerBody, data.pairs.map(function (pair) { var row = element(doc, "tr", {}), status = pair.inside ? "容差内" : "容差外"; row.appendChild(element(doc, "th", { scope: "row" }, "(" + pair.i + "," + pair.j + ")")); row.appendChild(element(doc, "td", {}, format(pair.originalSquared, 4))); row.appendChild(element(doc, "td", {}, format(pair.projectedSquared, 4))); row.appendChild(element(doc, "td", {}, format(pair.ratio, 4))); row.appendChild(element(doc, "td", { className: pair.inside ? "jl-inside" : "jl-outside" }, status)); return row; }));
      ensembleHost.hidden = !state.showEnsemble; if (state.showEnsemble) { var diagnostic = ensembleDiagnostic(state.k, state.epsilon); replaceChildren(ensembleHost, [element(doc, "strong", {}, "有限种子诊断（不是证明）"), element(doc, "p", {}, "对 " + diagnostic.count + " 个固定 seed 汇总当前参数；这只是一个有限诊断，不能替代 JL 尾界或所有 map 的保证。"), element(doc, "div", { className: "jl-ensemble-grid" }, [metric(doc, "通过 map 数", diagnostic.passMaps + "/" + diagnostic.count), metric(doc, "平均容差内比例", format(diagnostic.meanFraction * 100, 1) + "%"), metric(doc, "比例范围", format(diagnostic.minFraction * 100, 1) + "–" + format(diagnostic.maxFraction * 100, 1) + "%"), metric(doc, "平均最坏偏差", format(diagnostic.meanWorst, 3))])]); }
    }
    function render() {
      var data = analyze({ seed: preset().seed, k: state.k, epsilon: state.epsilon }); presetSelect.value = state.presetId; refs.presetReadout.textContent = "seed = " + preset().seed; refs.k.input.value = String(state.k); refs.k.output.textContent = format(state.k, refs.k.digits); refs.epsilon.input.value = String(state.epsilon); refs.epsilon.output.textContent = format(state.epsilon, refs.epsilon.digits); ensembleInput.checked = state.showEnsemble; renderPrediction(); controls.hidden = !state.revealed; results.hidden = !state.revealed;
      if (!state.revealed) { feedback.textContent = Object.keys(state.predictions).every(function (key) { return state.predictions[key] !== null; }) ? "预测已记录，点击“揭示并核对”查看结果。" : "先选择三个预测。"; feedback.className = "jl-feedback"; return; }
      renderResults(data);
    }
    reveal.addEventListener("click", function () { var missing = Object.keys(state.predictions).filter(function (key) { return state.predictions[key] === null; }); if (missing.length) { feedback.textContent = "请先完成三个预测。"; feedback.className = "jl-feedback jl-warn"; return; } state.revealed = true; render(); var answers = { expectation: "one", simultaneous: "high-probability", nested: "distribution" }, hit = Object.keys(answers).filter(function (key) { return state.predictions[key] === answers[key]; }).length; feedback.textContent = "已揭示：" + hit + "/3 个预测命中。结果是一次固定 map 的账本，不是模拟证明。"; feedback.className = "jl-feedback " + (hit === 3 ? "jl-pass" : "jl-warn"); if (api && typeof api.announce === "function") api.announce(root, feedback.textContent); });
    reset.addEventListener("click", function () { state = { presetId: DEFAULTS.presetId, k: DEFAULTS.k, epsilon: DEFAULTS.epsilon, showEnsemble: DEFAULTS.showEnsemble, revealed: false, predictions: { expectation: null, simultaneous: null, nested: null } }; render(); });
    render();
  }

  var exported = { DIMENSION: DIMENSION, POINTS: POINTS, PRESETS: PRESETS, DEFAULTS: DEFAULTS, NONMONOTONE_CASE: NONMONOTONE_CASE, makeRng: makeRng, gaussian: gaussian, gaussianMatrix: gaussianMatrix, projectPoints: projectPoints, analyze: analyze, ensembleDiagnostic: ensembleDiagnostic, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("jl-projection", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try { var report = selfTest(); console.log("jl-projection self-test: PASS (" + report.checks + " checks, " + report.pairs + " pairs; mean=" + report.expectationMean.toFixed(4) + ")"); }
    catch (error) { console.error("jl-projection self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null);
