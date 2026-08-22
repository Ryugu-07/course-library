(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("moments-tail", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("moments-tail self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("moments-tail self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-moments-tail-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var ALPHA = 2.5;

  var PRESETS = [
    { id: "uniform", label: "有界 · U(0,2)", note: "所有矩与 MGF 都存在；尾部有硬截断。" },
    { id: "exponential", label: "指数 · Exp(1)", note: "所有原点矩有限；MGF 的右端点是 t=1。" },
    { id: "pareto", label: "重尾 · Pareto(1,2.5)", note: "均值、方差有限，但 MGF 没有包含 0 的正邻域。" },
    { id: "matched", label: "同矩 · 两种离散尾部", note: "Rademacher 与稀疏尖峰共享均值/方差，四阶矩与尾部不同。" }
  ];

  var STYLE_TEXT = [
    ".mt-lab{--mt-blue:var(--cl-blue,#315f9d);--mt-gold:var(--cl-gold,#9b6a12);--mt-green:var(--cl-green,#39734d);--mt-red:var(--cl-red,#b64335);--mt-muted:var(--fg-soft,#706b62);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".mt-lab [hidden]{display:none!important;}",
    ".mt-lab *,.mt-lab *::before,.mt-lab *::after{box-sizing:border-box;}.mt-lab h3,.mt-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.mt-lab h3{font-size:1.18rem;}.mt-lab h4{font-size:1rem;}",
    ".mt-lab button,.mt-lab input,.mt-lab select{font:inherit;}.mt-lab button,.mt-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}.mt-lab button{min-width:0;padding:8px 11px;cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}.mt-lab button:hover{border-color:var(--accent);}.mt-lab button:disabled{cursor:not-allowed;opacity:.55;}.mt-lab button[aria-pressed=true],.mt-lab .mt-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".mt-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.mt-lab button:focus-visible,.mt-lab input:focus-visible,.mt-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".mt-lab .mt-intro,.mt-lab .mt-note,.mt-lab .mt-feedback,.mt-lab .mt-chart-note{color:var(--mt-muted);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.mt-lab .mt-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--mt-gold);background:var(--block-bg,var(--bg));}.mt-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.mt-lab legend{max-width:100%;padding:0;font-weight:750;line-height:1.45;overflow-wrap:anywhere;}.mt-lab .mt-question-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.mt-lab .mt-question{min-width:0;padding:9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.mt-lab .mt-choice-list{display:grid;gap:6px;margin-top:8px;}.mt-lab .mt-choice-list button{width:100%;min-height:44px;text-align:left;font-size:12.5px;}.mt-lab .mt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;}.mt-lab .mt-actions>*{flex:1 1 160px;}.mt-lab .mt-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.mt-lab .mt-pass{color:var(--mt-green);}.mt-lab .mt-warn{color:var(--mt-red);}",
    ".mt-lab .mt-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.mt-lab .mt-layout{display:grid;grid-template-columns:minmax(210px,.48fr) minmax(0,1.52fr);gap:15px;align-items:start;min-width:0;}.mt-lab .mt-controls,.mt-lab .mt-stage{min-width:0;}.mt-lab .mt-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.mt-lab .mt-control{display:grid;gap:5px;min-width:0;}.mt-lab .mt-control label,.mt-lab .mt-control-title{color:var(--mt-muted);font-size:13px;font-weight:700;}.mt-lab .mt-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.mt-lab .mt-preset-grid,.mt-lab .mt-variant-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.mt-lab .mt-preset-grid button,.mt-lab .mt-variant-grid button{font-size:12px;}.mt-lab .mt-scale{display:flex;justify-content:space-between;color:var(--mt-muted);font-size:11px;}",
    ".mt-lab .mt-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.mt-lab .mt-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--mt-muted);font-size:13px;}.mt-lab .mt-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.mt-lab .mt-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.mt-lab .mt-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1;}.mt-lab .mt-axis{stroke:currentColor;stroke-opacity:.62;stroke-width:1.2;}.mt-lab .mt-exact{fill:none;stroke:var(--mt-blue);stroke-width:2.7;stroke-linecap:round;stroke-linejoin:round;}.mt-lab .mt-bound{fill:none;stroke:var(--mt-red);stroke-width:2.2;stroke-dasharray:6 4;stroke-linecap:round;}.mt-lab .mt-marker{fill:var(--mt-green);stroke:var(--bg);stroke-width:2;}.mt-lab .mt-divider{stroke:var(--border);stroke-width:1;}.mt-lab .mt-label{font-size:11px;fill:var(--mt-muted)!important;}.mt-lab .mt-title{font-size:13px;font-weight:750;}",
    ".mt-lab .mt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px;}.mt-lab .mt-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.mt-lab .mt-metric:nth-child(4n+1){border-color:var(--mt-blue);}.mt-lab .mt-metric:nth-child(4n+2){border-color:var(--mt-gold);}.mt-lab .mt-metric:nth-child(4n+3){border-color:var(--mt-green);}.mt-lab .mt-metric:nth-child(4n){border-color:var(--mt-red);}.mt-lab .mt-metric span{display:block;color:var(--mt-muted);font-size:11px;line-height:1.4;}.mt-lab .mt-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}.mt-lab .mt-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.mt-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.mt-lab caption{padding:0 0 7px;text-align:left;color:var(--mt-muted);font-size:12px;}.mt-lab th,.mt-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.mt-lab th{color:var(--mt-muted);font-size:11.5px;font-weight:750;}.mt-lab .mt-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--mt-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.mt-lab .mt-caution{margin:10px 0 0;color:var(--mt-muted);font-size:12px;line-height:1.65;}",
    "@media(max-width:900px){.mt-lab .mt-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:720px){.mt-lab .mt-question-grid{grid-template-columns:minmax(0,1fr);}.mt-lab .mt-preset-grid,.mt-lab .mt-variant-grid{grid-template-columns:minmax(0,1fr);}.mt-lab .mt-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:430px){.mt-lab .mt-stage-frame{padding:5px;}.mt-lab table{font-size:11.5px;}.mt-lab th,.mt-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.mt-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || EPS) * scale; }
  function format(value, digits) {
    if (value === null || value === undefined) return "不存在";
    if (value === Infinity) return "∞";
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function factorial(order) { var value = 1; for (var i = 2; i <= order; i += 1) value *= i; return value; }
  function binomial(n, k) { if (k < 0 || k > n) return 0; var value = 1; for (var i = 1; i <= k; i += 1) value = value * (n - i + 1) / i; return value; }
  function presetById(id) { return PRESETS.filter(function (preset) { return preset.id === id; })[0] || PRESETS[0]; }
  function normalizeVariant(value) { return value === "spike" ? "spike" : "rademacher"; }
  function normalizeOrder(value) { return Math.round(clamp(Number(value) || 2, 1, 4)); }
  function normalizeThreshold(value) { return clamp(finite(Number(value)) ? Number(value) : 1.5, 0.2, 5); }
  function normalizeT(value) { return clamp(finite(Number(value)) ? Number(value) : 0.5, -1.5, 1.5); }

  function rawMoment(modelId, order, variant) {
    var k = Math.round(order);
    if (k === 0) return 1;
    if (modelId === "uniform") return Math.pow(2, k) / (k + 1);
    if (modelId === "exponential") return factorial(k);
    if (modelId === "pareto") return k < ALPHA ? ALPHA / (ALPHA - k) : null;
    if (k % 2 === 1) return 0;
    return normalizeVariant(variant) === "spike" ? 0.2 * Math.pow(5, k / 2) : 1;
  }

  function mean(modelId) {
    if (modelId === "uniform" || modelId === "exponential") return 1;
    if (modelId === "pareto") return ALPHA / (ALPHA - 1);
    return 0;
  }

  function variance(modelId) {
    if (modelId === "uniform") return 1 / 3;
    if (modelId === "exponential") return 1;
    if (modelId === "pareto") return ALPHA / ((ALPHA - 1) * (ALPHA - 1) * (ALPHA - 2));
    return 1;
  }

  function centralMoment(modelId, order, variant) {
    var k = Math.round(order);
    var mu = mean(modelId);
    var value = 0;
    for (var j = 0; j <= k; j += 1) {
      var moment = rawMoment(modelId, j, variant);
      if (moment === null) return null;
      value += binomial(k, j) * Math.pow(-mu, k - j) * moment;
    }
    return value;
  }

  function expectedAbsolute(modelId, variant) {
    if (modelId === "matched") return normalizeVariant(variant) === "spike" ? 0.2 * Math.sqrt(5) : 1;
    return mean(modelId);
  }

  function mgfValue(modelId, t, variant) {
    var value = normalizeT(t);
    if (modelId === "uniform") return near(value, 0) ? 1 : (Math.exp(2 * value) - 1) / (2 * value);
    if (modelId === "exponential") return value < 1 ? 1 / (1 - value) : Infinity;
    if (modelId === "matched") {
      return normalizeVariant(variant) === "spike" ? 0.8 + 0.2 * Math.cosh(Math.sqrt(5) * value) : Math.cosh(value);
    }
    if (value > 0) return Infinity;
    if (near(value, 0)) return 1;
    // x=1/u maps the infinite Pareto tail to [0,1] without truncating mass.
    var steps = 1200;
    var width = 1 / steps;
    var total = 0;
    for (var i = 0; i <= steps; i += 1) {
      var u = i * width;
      var term = u === 0 ? 0 : ALPHA * Math.pow(u, ALPHA - 1) * Math.exp(value / u);
      total += (i === 0 || i === steps ? 1 : (i % 2 === 0 ? 2 : 4)) * term;
    }
    return clamp(total * width / 3, 0, 1);
  }

  function mgfDomain(modelId) {
    if (modelId === "uniform" || modelId === "matched") return "所有实数 t";
    if (modelId === "exponential") return "t<1";
    return "t≤0（不含 0 的正邻域）";
  }

  function markovTail(modelId, threshold, variant) {
    var a = normalizeThreshold(threshold);
    if (modelId === "uniform") return a >= 2 ? 0 : Math.max(0, (2 - a) / 2);
    if (modelId === "exponential") return Math.exp(-a);
    if (modelId === "pareto") return a < 1 ? 1 : Math.pow(a, -ALPHA);
    var level = normalizeVariant(variant) === "spike" ? Math.sqrt(5) : 1;
    return a <= level ? 1 : 0;
  }

  function centralTail(modelId, threshold, variant) {
    var a = normalizeThreshold(threshold);
    var mu = mean(modelId);
    if (modelId === "uniform") return a >= 1 ? 0 : Math.max(0, 1 - a);
    if (modelId === "exponential") {
      var lower = a < mu ? 1 - Math.exp(-(mu - a)) : 0;
      return lower + Math.exp(-(mu + a));
    }
    if (modelId === "pareto") {
      var lowerPoint = mu - a;
      var lowerMass = lowerPoint > 1 ? 1 - Math.pow(lowerPoint, -ALPHA) : 0;
      return lowerMass + Math.pow(mu + a, -ALPHA);
    }
    return normalizeVariant(variant) === "spike" ? (a <= Math.sqrt(5) ? 0.2 : 0) : (a <= 1 ? 1 : 0);
  }

  function markovBound(modelId, threshold, variant) { return Math.min(1, expectedAbsolute(modelId, variant) / normalizeThreshold(threshold)); }
  function chebyshevBound(modelId, threshold) { return Math.min(1, variance(modelId) / Math.pow(normalizeThreshold(threshold), 2)); }

  function evaluate(input) {
    var rawModelId = input && input.modelId ? input.modelId : "uniform";
    var model = presetById(rawModelId);
    var modelId = model.id;
    var variant = normalizeVariant(input && input.variant);
    var order = normalizeOrder(input && input.order);
    var t = normalizeT(input && input.t);
    var threshold = normalizeThreshold(input && input.threshold);
    var raw = rawMoment(modelId, order, variant);
    var central = centralMoment(modelId, order, variant);
    var mgf = mgfValue(modelId, t, variant);
    return {
      model: model,
      modelId: modelId,
      variant: variant,
      order: order,
      t: t,
      threshold: threshold,
      mean: mean(modelId),
      variance: variance(modelId),
      rawMoment: raw,
      centralMoment: central,
      mgf: mgf,
      mgfDomain: mgfDomain(modelId),
      markovExact: markovTail(modelId, threshold, variant),
      markovBound: markovBound(modelId, threshold, variant),
      chebyshevExact: centralTail(modelId, threshold, variant),
      chebyshevBound: chebyshevBound(modelId, threshold),
      markovVariable: modelId === "matched" ? "|X|" : "X"
    };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function ensureStyles(doc) { if (!doc.getElementById(STYLE_ID)) { var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); } }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label, value) { var node = element(doc, "div", { className: "mt-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); return { node: node, value: node.lastChild }; }
  function px(value, min, max, left, width) { return left + (value - min) * width / (max - min); }
  function py(value, top, height) { return top + height - value * height; }
  function linePath(points) { return points.map(function (point, index) { return (index ? "L" : "M") + format(point[0], 2) + "," + format(point[1], 2); }).join(" "); }

  function drawSvg(doc, data, uid) {
    var width = 620;
    var height = 360;
    var top = 52;
    var bottom = 38;
    var gap = 30;
    var plotHeight = height - top - bottom;
    var plotWidth = (width - 54 - gap) / 2;
    var leftA = 42;
    var leftB = leftA + plotWidth + gap;
    var xMin = 0.2;
    var xMax = 5;
    var svg = svgElement(doc, "svg", { className: "mt-svg", viewBox: "0 0 " + width + " " + height, role: "img", "aria-labelledby": uid + "-title" });
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["矩、MGF 与尾部上界"]));
    svg.appendChild(svgElement(doc, "text", { class: "mt-title", x: 10, y: 18, "text-anchor": "start" }, ["k=" + data.order + " · t=" + format(data.t, 2) + " · M(t)=" + format(data.mgf, 3)]));
    svg.appendChild(svgElement(doc, "text", { class: "mt-label", x: 10, y: 36, "text-anchor": "start" }, [data.model.label + "；上界会截到 1"]));
    function drawPanel(left, title, exact, bound, exactLabel, boundLabel) {
      [0.25, 0.5, 0.75].forEach(function (fraction) {
        var y = top + plotHeight * fraction;
        svg.appendChild(svgElement(doc, "line", { class: "mt-grid", x1: left, x2: left + plotWidth, y1: y, y2: y }));
      });
      svg.appendChild(svgElement(doc, "line", { class: "mt-axis", x1: left, x2: left + plotWidth, y1: top + plotHeight, y2: top + plotHeight }));
      svg.appendChild(svgElement(doc, "line", { class: "mt-axis", x1: left, x2: left, y1: top, y2: top + plotHeight }));
      svg.appendChild(svgElement(doc, "text", { class: "mt-title", x: left + 5, y: top - 14, "text-anchor": "start" }, [title]));
      svg.appendChild(svgElement(doc, "text", { class: "mt-label", x: left + plotWidth / 2, y: height - 10, "text-anchor": "middle" }, ["阈值 a"]));
      var exactPoints = [];
      var boundPoints = [];
      for (var i = 0; i <= 80; i += 1) {
        var a = xMin + (xMax - xMin) * i / 80;
        exactPoints.push([px(a, xMin, xMax, left, plotWidth), py(exact(a), top, plotHeight)]);
        boundPoints.push([px(a, xMin, xMax, left, plotWidth), py(bound(a), top, plotHeight)]);
      }
      svg.appendChild(svgElement(doc, "path", { class: "mt-exact", d: linePath(exactPoints) }));
      svg.appendChild(svgElement(doc, "path", { class: "mt-bound", d: linePath(boundPoints) }));
      var markerX = px(data.threshold, xMin, xMax, left, plotWidth);
      svg.appendChild(svgElement(doc, "line", { class: "mt-divider", x1: markerX, x2: markerX, y1: top, y2: top + plotHeight, "stroke-dasharray": "2 4" }));
      svg.appendChild(svgElement(doc, "circle", { class: "mt-marker", cx: markerX, cy: py(exact(data.threshold), top, plotHeight), r: 5 }));
      svg.appendChild(svgElement(doc, "text", { class: "mt-label", x: left + 5, y: top + plotHeight - 8, "text-anchor": "start" }, [exactLabel]));
      svg.appendChild(svgElement(doc, "text", { class: "mt-label", x: left + plotWidth - 5, y: top + 15, "text-anchor": "end" }, [boundLabel]));
    }
    drawPanel(leftA, "Markov：P(W≥a)", function (a) { return markovTail(data.modelId, a, data.variant); }, function (a) { return markovBound(data.modelId, a, data.variant); }, "蓝：精确事件", "红虚线：上界");
    drawPanel(leftB, "Chebyshev：P(|X-μ|≥a)", function (a) { return centralTail(data.modelId, a, data.variant); }, function (a) { return chebyshevBound(data.modelId, a); }, "蓝：中心尾部", "红虚线：上界");
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var uid = "mt-" + (++INSTANCE);
    var state = { modelId: "uniform", variant: "rademacher", order: 2, t: 0.5, threshold: 1.5, predictions: { moments: null, mgf: null, unique: null, bound: null }, score: 0 };
    var shell = element(doc, "div", { className: "mt-lab" });
    var form = element(doc, "form", { className: "mt-prediction" });
    var revealed = element(doc, "section", { className: "mt-revealed", hidden: true, "aria-label": "矩与尾部实验结果" });
    var feedback = element(doc, "p", { className: "mt-feedback", role: "status", "aria-live": "polite", text: "请先完成四项预测。" });
    var questions = [
      { key: "moments", prompt: "1 · 原点矩与中心矩的关系？", answer: "different", choices: [["different", "均值不为零时通常不同"], ["same", "所有阶都相同"], ["variance", "只要看方差即可"]] },
      { key: "mgf", prompt: "2 · Pareto 有有限均值/方差，MGF？", answer: "no", choices: [["no", "仍可能没有包含 0 的正邻域"], ["yes", "必在所有实数有限"], ["zero", "因为均值有限所以 M(0)=0"]] },
      { key: "unique", prompt: "3 · 均值和方差相同是否决定分布？", answer: "no", choices: [["no", "不能；尾部和高阶矩仍可不同"], ["yes", "均值方差唯一决定"], ["mgf", "只要一次观测就决定"]] },
      { key: "bound", prompt: "4 · Markov/Chebyshev 的数值是什么？", answer: "upper", choices: [["upper", "带条件的概率上界，不是自动等号"], ["exact", "精确尾概率"], ["mean", "新的总体均值"]] }
    ];
    var choiceButtons = [];
    shell.appendChild(element(doc, "h3", { text: "矩、MGF 与尾部：摘要的强度边界" }));
    shell.appendChild(element(doc, "p", { className: "mt-intro", text: "先预测四个逻辑判断；提交后才打开矩表、MGF 存在域和两条尾部曲线。" }));
    form.appendChild(element(doc, "p", { className: "mt-prompt", text: "预测门：先区分统计摘要、变换存在域和概率上界。" }));
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "四项都回答后才揭示结果" }));
    var questionGrid = element(doc, "div", { className: "mt-question-grid" });
    questions.forEach(function (question) {
      var questionSet = element(doc, "fieldset", { className: "mt-question" });
      questionSet.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "mt-choice-list", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false"); });
          feedback.className = "mt-feedback";
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
    var actions = element(doc, "div", { className: "mt-actions" });
    var submit = element(doc, "button", { type: "submit", className: "mt-primary", text: "提交预测并揭示" });
    var clearPredictionButton = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(submit);
    actions.appendChild(clearPredictionButton);
    form.appendChild(actions);
    form.appendChild(feedback);
    shell.appendChild(form);

    var layout = element(doc, "div", { className: "mt-layout" });
    var controls = element(doc, "div", { className: "mt-controls" });
    var stage = element(doc, "div", { className: "mt-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    clear(root);
    root.appendChild(shell);

    controls.appendChild(element(doc, "h4", { text: "揭示后的操作参数" }));
    var presetGrid = element(doc, "div", { className: "mt-preset-grid", role: "group", "aria-label": "矩与尾部预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: preset.label });
      button.addEventListener("click", function () { state.modelId = preset.id; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    controls.appendChild(presetGrid);
    var variantGrid = element(doc, "div", { className: "mt-variant-grid", role: "group", "aria-label": "同矩离散变体", hidden: true });
    var variantButtons = [];
    [["rademacher", "Rademacher"], ["spike", "稀疏尖峰"]].forEach(function (item) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: item[1] });
      button.addEventListener("click", function () { state.variant = item[0]; render(); });
      variantButtons.push({ id: item[0], node: button });
      variantGrid.appendChild(button);
    });
    controls.appendChild(variantGrid);
    controls.appendChild(element(doc, "p", { className: "mt-note", text: "W=X 用于非负预设；同矩离散变体的 Markov 事件改为 W=|X|。" }));

    function addRange(label, id, min, max, step, value, onInput, lowText, highText) {
      var output = element(doc, "output", { for: id, text: "" });
      var input = element(doc, "input", { id: id, type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
      input.addEventListener("input", function () { onInput(Number(input.value)); render(); });
      controls.appendChild(element(doc, "div", { className: "mt-control" }, [element(doc, "label", { htmlFor: id }, [label, output]), input, element(doc, "div", { className: "mt-scale" }, [element(doc, "span", { text: lowText }), element(doc, "span", { text: highText })])]));
      return { input: input, output: output };
    }
    var orderControl = addRange("原点/中心矩阶数 k：", uid + "-order", 1, 4, 1, state.order, function (value) { state.order = normalizeOrder(value); }, "1", "4");
    var tControl = addRange("MGF 探针 t：", uid + "-t", -150, 150, 5, 50, function (value) { state.t = normalizeT(value / 100); }, "-1.5", "1.5");
    var thresholdControl = addRange("尾阈值 a：", uid + "-threshold", 20, 500, 5, 150, function (value) { state.threshold = normalizeThreshold(value / 100); }, "0.2", "5");
    var relock = element(doc, "button", { type: "button", text: "重新预测" });
    controls.appendChild(relock);

    function renderTable(data) {
      var rows = [
        ["均值 / 方差", format(data.mean, 5) + " / " + format(data.variance, 5), "方差是二阶中心矩，不是二阶原点矩。"],
        ["原点矩 m_k", format(data.rawMoment, 6), "当前 k=" + data.order + "；有限低阶矩不等于完整分布。"],
        ["中心矩 μ_k", format(data.centralMoment, 6), "E[(X-EX)^k]；中心化后再计算。"],
        ["MGF M(t)", format(data.mgf, 6), "t=" + format(data.t, 2) + "；存在域：" + data.mgfDomain],
        ["Markov", "P(" + data.markovVariable + "≥a)=" + format(data.markovExact, 5) + "；上界 " + format(data.markovBound, 5), "W 必须非负；上界不是精确值。"],
        ["Chebyshev", "P(|X-μ|≥a)=" + format(data.chebyshevExact, 5) + "；上界 " + format(data.chebyshevBound, 5), "需要有限方差；中心事件与 Markov 事件不同。"]
      ];
      var table = element(doc, "table");
      table.appendChild(element(doc, "caption", { text: "矩、变换与尾部逐项审计账本" }));
      table.appendChild(element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "账本" }), element(doc, "th", { text: "当前读数" }), element(doc, "th", { text: "解释与边界" })])]));
      var body = element(doc, "tbody");
      rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); }))); });
      table.appendChild(body);
      return element(doc, "div", { className: "mt-table-wrap" }, [table]);
    }

    function render() {
      var data = evaluate({ modelId: state.modelId, variant: state.variant, order: state.order, t: state.t, threshold: state.threshold });
      state.order = data.order;
      state.t = data.t;
      state.threshold = data.threshold;
      orderControl.input.value = String(data.order);
      orderControl.output.textContent = String(data.order);
      tControl.input.value = String(Math.round(data.t * 100));
      tControl.output.textContent = format(data.t, 2);
      thresholdControl.input.value = String(Math.round(data.threshold * 100));
      thresholdControl.output.textContent = format(data.threshold, 2);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === data.modelId ? "true" : "false"); });
      variantGrid.hidden = data.modelId !== "matched";
      variantButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === data.variant ? "true" : "false"); });
      clear(stage);
      var cards = [metric(doc, "原点 m_k", format(data.rawMoment, 4)), metric(doc, "中心 μ_k", format(data.centralMoment, 4)), metric(doc, "M(t)", format(data.mgf, 4)), metric(doc, "Cheb 上界", format(data.chebyshevBound, 4))];
      stage.appendChild(element(doc, "div", { className: "mt-metrics", "aria-label": "矩与上界读数" }, cards.map(function (card) { return card.node; })));
      var frame = element(doc, "div", { className: "mt-stage-frame" }, [element(doc, "div", { className: "mt-stage-title" }, [element(doc, "strong", { text: data.model.label }), element(doc, "span", { text: "a=" + format(data.threshold, 2) })])]);
      frame.appendChild(drawSvg(doc, data, uid));
      frame.appendChild(element(doc, "p", { className: "mt-chart-note", text: "蓝线是相应事件的精确概率，红虚线是只由均值或方差推出的上界；绿色点标出当前阈值。" }));
      stage.appendChild(frame);
      stage.appendChild(renderTable(data));
      var interpretation = data.modelId === "pareto"
        ? "Pareto 当前展示的是有限均值/方差与不存在正 MGF 邻域可以同时成立；不要把矩条件升级成指数尾条件。"
        : data.modelId === "matched"
          ? "两种离散变体的均值和方差保持不变，但四阶矩与尾部曲线改变；低阶摘要没有唯一性。"
          : "当前模型的 MGF 域和两条上界都要按各自条件读取；曲线低于上界是保证的正常形态。";
      stage.appendChild(element(doc, "p", { className: "mt-interpretation", role: "status", "aria-live": "polite", text: interpretation }));
      stage.appendChild(element(doc, "p", { className: "mt-caution", text: "上界截到 1 只是概率的基本范围，不增加定理强度；MGF 显示为不存在时，不使用其导数生成矩。" }));
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.className = "mt-feedback mt-warn"; feedback.textContent = "还差 " + missing.length + " 项预测。"; return; }
      var answers = { moments: "different", mgf: "no", unique: "no", bound: "upper" };
      state.score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === answers[question.key] ? 1 : 0); }, 0);
      revealed.removeAttribute("hidden");
      feedback.className = "mt-feedback " + (state.score === questions.length ? "mt-pass" : "mt-warn");
      feedback.textContent = "已揭示：" + state.score + "/" + questions.length + " 项预测与解析账本一致。";
      render();
      announce(api, root, feedback.textContent);
    });
    function resetPredictions() { state.predictions = { moments: null, mgf: null, unique: null, bound: null }; choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); }); }
    clearPredictionButton.addEventListener("click", function () { resetPredictions(); feedback.className = "mt-feedback"; feedback.textContent = "预测已清空。"; });
    function reset() {
      state.modelId = "uniform";
      state.variant = "rademacher";
      state.order = 2;
      state.t = 0.5;
      state.threshold = 1.5;
      resetPredictions();
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "mt-feedback";
      feedback.textContent = "已重新上锁，请再完成四项预测。";
      announce(api, root, "矩与尾部实验已重置。");
    }
    relock.addEventListener("click", reset);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    check(PRESETS.length === 4, "four presets");
    check(near(rawMoment("uniform", 2), 4 / 3), "uniform raw second moment");
    check(near(centralMoment("uniform", 2), 1 / 3), "uniform central second moment");
    check(near(rawMoment("exponential", 3), 6), "exponential raw third moment");
    check(near(mgfValue("exponential", 0.5), 2), "exponential MGF");
    check(mgfValue("exponential", 1.1) === Infinity, "exponential MGF domain");
    check(near(mean("pareto"), 5 / 3) && near(variance("pareto"), 20 / 9), "Pareto first two moments");
    check(rawMoment("pareto", 2) !== null && rawMoment("pareto", 3) === null, "Pareto finite moment boundary");
    check(mgfValue("pareto", 0.1) === Infinity && near(mgfValue("pareto", 0), 1), "Pareto MGF right boundary");
    check(mgfValue("pareto", -0.001) > 0 && mgfValue("pareto", -0.001) < 1, "Pareto Laplace transform basic bound");
    check(mgfValue("pareto", -1) < mgfValue("pareto", -0.1), "Pareto Laplace transform monotonicity");
    check(near(rawMoment("matched", 2, "rademacher"), rawMoment("matched", 2, "spike")), "matched second moment");
    check(near(rawMoment("matched", 4, "rademacher"), 1) && near(rawMoment("matched", 4, "spike"), 5), "matched fourth moment differs");
    check(markovBound("uniform", 1.5) >= markovTail("uniform", 1.5), "Markov dominates uniform event");
    check(chebyshevBound("exponential", 1.5) >= centralTail("exponential", 1.5), "Chebyshev dominates exponential event");
    var defaultResult = evaluate({ modelId: "uniform", order: 2, t: 0.5, threshold: 1.5 });
    check(near(defaultResult.markovExact, 0.25), "uniform Markov event");
    check(near(defaultResult.chebyshevExact, 0), "uniform central event");
    check(evaluate({ modelId: "unknown-model" }).modelId === "uniform", "invalid model uses canonical fallback");
    PRESETS.forEach(function (preset) {
      var result = evaluate({ modelId: preset.id, order: 2, t: 0, threshold: 1.5, variant: "rademacher" });
      check(result.model.id === preset.id && finite(result.variance), preset.id + " evaluates");
      check(result.markovBound >= result.markovExact - EPS && result.chebyshevBound >= result.chebyshevExact - EPS, preset.id + " bounds dominate");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    rawMoment: rawMoment,
    centralMoment: centralMoment,
    mgfValue: mgfValue,
    markovTail: markovTail,
    centralTail: centralTail,
    markovBound: markovBound,
    chebyshevBound: chebyshevBound,
    evaluate: evaluate,
    mount: mount,
    selfTest: selfTest
  };
});
