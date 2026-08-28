(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("physics-inflation-darkenergy", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("physics-inflation-darkenergy self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("physics-inflation-darkenergy self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-inflation-darkenergy-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var DEFAULTS = { mode: "late", N: 60, a: 1, omegaM: 0.3, omegaLambda: 0.7 };
  var PRESETS = [
    { id: "late", label: "晚期：物质 + Λ", mode: "late", N: 60, a: 1, omegaM: 0.3, omegaLambda: 0.7 },
    { id: "early", label: "早期：恒 H inflation toy", mode: "early", N: 60, a: 1, omegaM: 0.3, omegaLambda: 0.7 },
    { id: "early-short", label: "早期：N=50 对照", mode: "early", N: 50, a: 1, omegaM: 0.3, omegaLambda: 0.7 },
    { id: "matter-boundary", label: "晚期边界：纯物质", mode: "late", N: 60, a: 1, omegaM: 1, omegaLambda: 0 }
  ];

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function format(value, digits) {
    if (!finite(value)) return "—";
    return value.toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }
  function formatExp(value) {
    if (!finite(value)) return "—";
    return value.toExponential(2).replace("+", "");
  }
  function radiusAxisTitle(mode) { return mode === "early" ? "共动 Hubble 半径的十进对数（相对开始）" : "共动 Hubble 半径的十进对数（以 H0⁻¹ 为单位）"; }
  function radiusAxisLabel(mode) { return mode === "early" ? "绿：log10{[(aH)⁻¹]/[(aH)⁻¹]开始}" : "绿：log10[(aH)⁻¹]（以 H0⁻¹ 为单位）"; }

  function normalize(input) {
    input = input || {};
    var mode = input.mode === undefined ? DEFAULTS.mode : String(input.mode);
    var N = Number(input.N === undefined ? DEFAULTS.N : input.N);
    var a = Number(input.a === undefined ? DEFAULTS.a : input.a);
    var omegaM = Number(input.omegaM === undefined ? DEFAULTS.omegaM : input.omegaM);
    var omegaLambda = Number(input.omegaLambda === undefined ? DEFAULTS.omegaLambda : input.omegaLambda);
    if (mode !== "early" && mode !== "late") throw new RangeError("模式必须是 early 或 late");
    if (!finite(N) || !finite(a) || !finite(omegaM) || !finite(omegaLambda)) throw new TypeError("N、a、Ωm、ΩΛ 必须是有限数");
    if (N < 40 || N > 70) throw new RangeError("N 限在 40 到 70");
    if (a < 0.2 || a > 5) throw new RangeError("晚期 toy 的 a 限在 0.2 到 5");
    if (!(omegaM > 0) || omegaLambda < 0 || !(omegaM + omegaLambda > 0)) throw new RangeError("需要 Ωm>0、ΩΛ≥0 且总密度为正");
    var total = omegaM + omegaLambda;
    return { mode: mode, N: N, a: a, omegaM: omegaM / total, omegaLambda: omegaLambda / total };
  }

  function lateState(a, params) {
    var matterTerm = params.omegaM / Math.pow(a, 3);
    var lambdaTerm = params.omegaLambda;
    var E2 = matterTerm + lambdaTerm;
    var E = Math.sqrt(E2);
    var omegaMatter = matterTerm / E2;
    var omegaLambda = lambdaTerm / E2;
    var epsilon = 1.5 * omegaMatter;
    return {
      a: a,
      E: E,
      omegaMatter: omegaMatter,
      omegaLambda: omegaLambda,
      epsilon: epsilon,
      q: epsilon - 1,
      radius: 1 / (a * E)
    };
  }

  function analyze(input) {
    var params;
    try { params = normalize(input); } catch (error) { return { ok: false, status: "invalid-input", message: error.message }; }
    if (params.mode === "early") {
      return {
        ok: true,
        status: "early-accelerated-toy",
        params: params,
        N: params.N,
        epsilon: 0,
        q: -1,
        expansionRatio: Math.exp(params.N),
        radiusRatio: Math.exp(-params.N),
        transitionA: null,
        observationNote: "这是恒 H、恒 ε=0 的早期膨胀 toy；N 是输入的 e-fold 数，不是由观测单独读出的量。",
        inferenceNote: "加速膨胀与微观机制不是同一句话；慢滚标量场只是候选实现，模型还需解释扰动谱与 reheating。"
      };
    }
    var state = lateState(params.a, params);
    var transitionA = params.omegaLambda > 0 ? Math.pow(params.omegaM / (2 * params.omegaLambda), 1 / 3) : null;
    return {
      ok: true,
      status: params.omegaLambda > 0 ? "late-matter-plus-lambda" : "matter-boundary",
      params: params,
      N: null,
      E: state.E,
      omegaMatter: state.omegaMatter,
      omegaLambda: state.omegaLambda,
      epsilon: state.epsilon,
      q: state.q,
      radius: state.radius,
      transitionA: transitionA,
      expansionRatio: null,
      radiusRatio: null,
      observationNote: "q<0 是背景加速的运动学判据；本 toy 以 Λ 作为一种解释参数。",
      inferenceNote: "超新星、BAO、CMB 与透镜共同约束背景和增长，但暗能量本性与修正引力仍需模型比较。"
    };
  }

  function curve(params, count) {
    count = count || 120;
    var values = [];
    for (var i = 0; i <= count; i += 1) {
      var fraction = i / count;
      if (params.mode === "early") {
        var n = params.N * fraction;
        values.push({ x: n, q: -1, logRadius: -n / Math.LN10, radius: Math.exp(-n) });
      } else {
        var a = 0.2 * Math.pow(25, fraction);
        var state = lateState(a, params);
        values.push({ x: Math.log10(a), a: a, q: state.q, logRadius: Math.log10(state.radius), radius: state.radius });
      }
    }
    return values;
  }

  function assert(condition, message) { if (!condition) throw new Error("physics-inflation-darkenergy self-test failed: " + message); }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var early = analyze({ mode: "early", N: 60, a: 1, omegaM: 0.3, omegaLambda: 0.7 });
    check(early.ok && near(early.q, -1), "early q");
    check(near(Math.log(early.expansionRatio), 60, 1e-12), "early e-fold accounting");
    check(near(early.radiusRatio, Math.exp(-60), 1e-12), "early radius is relative to its start");
    check(early.radiusRatio < 1e-25, "early comoving radius shrinks");
    check(radiusAxisTitle("early").indexOf("相对开始") >= 0 && radiusAxisLabel("early").indexOf("H0") < 0, "early radius axis wording");
    var late = analyze(DEFAULTS);
    check(late.ok && near(late.q, -0.55, 1e-12), "late q");
    check(near(late.epsilon, 0.45, 1e-12), "late epsilon");
    var expectedTransition = Math.pow(0.3 / 1.4, 1 / 3);
    check(near(late.transitionA, expectedTransition, 1e-12), "late transition");
    check(near(lateState(late.transitionA, late.params).q, 0, 1e-10), "transition q zero");
    check(curve(normalize(DEFAULTS), 20).length === 21, "curve length");
    check(analyze({ mode: "late", N: 60, a: 1, omegaM: 0, omegaLambda: 1 }).ok === false, "zero matter rejected");
    check(near(analyze({ mode: "late", N: 60, a: 1, omegaM: 1, omegaLambda: 0 }).q, 0.5, 1e-12), "matter boundary decelerates");
    return { checks: checks, presets: PRESETS.length };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function make(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }
  function svg(doc, tag, attrs, text) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {});
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function replaceChildren(node, children, doc) {
    if (typeof node.replaceChildren === "function") { node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]); return; }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children, doc);
  }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pid-lab{color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.pid-lab *{box-sizing:border-box}.pid-lab [hidden]{display:none!important}.pid-lab h3{margin:0;color:var(--fg,#20252b);font-size:1.15rem}.pid-note,.pid-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:.9rem}.pid-lab fieldset{min-width:0;margin:12px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.pid-lab legend{max-width:100%;font-weight:750}.pid-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pid-choice{display:flex;gap:7px;align-items:flex-start;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px}.pid-choice input{margin-top:3px;accent-color:var(--accent,#1769aa)}",
      ".pid-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.pid-lab button,.pid-lab select,.pid-lab input{font:inherit}.pid-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer}.pid-lab button:hover{border-color:var(--accent,#1769aa)}.pid-lab button:focus-visible,.pid-lab select:focus-visible,.pid-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pid-primary{background:var(--accent,#1769aa)!important;color:var(--bg,#fff)!important;font-weight:750}.pid-pass{color:var(--cl-green,#2f7547)}.pid-warn{color:var(--cl-red,#b43d32)}",
      ".pid-layout{display:grid;grid-template-columns:minmax(200px,.7fr) minmax(0,1.3fr);gap:14px;align-items:start}.pid-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px}.pid-field{display:grid;gap:5px}.pid-field label{font-size:.82rem;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.pid-field select,.pid-field input{width:100%;min-height:42px;padding:7px 8px;border:1px solid var(--border,#c8cdd3);border-radius:5px;background:var(--bg,#fff);color:inherit}.pid-field input[type=range]{padding:0;accent-color:var(--accent,#1769aa)}.pid-output{font-variant-numeric:tabular-nums;color:var(--accent,#1769aa)}",
      ".pid-frame{min-width:0;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.pid-svg{display:block;width:100%;height:auto}.pid-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pid-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.pid-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.pid-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.pid-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.pid-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.pid-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.pid-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:.73rem}.pid-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.pid-table-wrap{max-width:100%;overflow-x:auto;margin-top:10px}.pid-table{width:100%;min-width:650px;border-collapse:collapse;font-size:.8rem}.pid-table th,.pid-table td{padding:7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.pid-table th{color:var(--fg-soft,var(--muted,#5d6873));font-size:.74rem}.pid-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-blue,#2c6aa0);background:var(--block-bg,var(--bg,#fff));font-size:.86rem}",
      "@media(max-width:760px){.pid-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:600px){.pid-choices{grid-template-columns:minmax(0,1fr)}.pid-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.pid-lab *{transition:none!important;animation:none!important}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function metric(api, doc, label) {
    var value = make(api, doc, "strong", {}, ["—"]);
    return make(api, doc, "div", { className: "pid-metric" }, [make(api, doc, "span", {}, [label]), value]);
  }
  function pathFrom(points, xFn, yFn) {
    var path = "";
    points.forEach(function (point) { path += (path ? " L " : "M ") + xFn(point).toFixed(2) + " " + yFn(point).toFixed(2); });
    return path;
  }
  function drawChart(doc, node, params, result) {
    replaceChildren(node, [], doc);
    node.setAttribute("viewBox", "0 0 760 590");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "比较早期膨胀 toy 与晚期加速 toy 的 q 和共动 Hubble 半径");
    var left = 62, right = 726;
    var top = 42, topBottom = 235;
    var bottom = 335, bottomBottom = 535;
    var qMin = -1.2, qMax = 1.2;
    var values = curve(params, 120);
    var radiusMin = Math.min.apply(null, values.map(function (point) { return point.logRadius; }));
    var radiusMax = Math.max.apply(null, values.map(function (point) { return point.logRadius; }));
    if (params.mode === "early") { radiusMin = Math.min(radiusMin - 1, -params.N / Math.LN10 - 1); radiusMax = 0.5; }
    else { radiusMin -= 0.15; radiusMax += 0.15; }
    var xMin = params.mode === "early" ? 0 : Math.log10(0.2);
    var xMax = params.mode === "early" ? params.N : Math.log10(5);
    var x = function (value) { return left + (value - xMin) / (xMax - xMin) * (right - left); };
    var yQ = function (value) { return topBottom - (clamp(value, qMin, qMax) - qMin) / (qMax - qMin) * (topBottom - top); };
    var yR = function (value) { return bottomBottom - (value - radiusMin) / (radiusMax - radiusMin) * (bottomBottom - bottom); };
    node.appendChild(svg(doc, "title", { id: "pid-title" }, "两种加速时代的运动学比较"));
    node.appendChild(svg(doc, "desc", { id: "pid-desc" }, "上图是减速参数 q，下图是" + radiusAxisTitle(params.mode) + "；早期恒 H toy 的半径持续缩小，晚期 Λ toy 的半径先增后减。"));
    [-1, 0, 1].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: left, y1: yQ(value), x2: right, y2: yQ(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: yQ(value) + 4, "text-anchor": "end", "font-size": "11" }, String(value)));
    });
    var radiusTicks = params.mode === "early" ? [0, -params.N / 2 / Math.LN10, -params.N / Math.LN10] : [radiusMin, 0, radiusMax];
    radiusTicks.forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: left, y1: yR(value), x2: right, y2: yR(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: yR(value) + 4, "text-anchor": "end", "font-size": "11" }, format(value, 1)));
    });
    node.appendChild(svg(doc, "line", { x1: left, y1: yQ(0), x2: right, y2: yQ(0), stroke: "var(--cl-red,#b43d32)", "stroke-width": "1.5", "stroke-dasharray": "5 4" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: topBottom, x2: right, y2: topBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: topBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: bottomBottom, x2: right, y2: bottomBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: bottom, x2: left, y2: bottomBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    var qPath = pathFrom(values, function (point) { return x(point.x); }, function (point) { return yQ(point.q); });
    var rPath = pathFrom(values, function (point) { return x(point.x); }, function (point) { return yR(point.logRadius); });
    node.appendChild(svg(doc, "path", { d: qPath, fill: "none", stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": "3", "stroke-linecap": "round" }));
    node.appendChild(svg(doc, "path", { d: rPath, fill: "none", stroke: "var(--cl-green,#347247)", "stroke-width": "3", "stroke-linecap": "round" }));
    var markerX = params.mode === "early" ? params.N : Math.log10(params.a);
    var markerQ = result.q;
    var markerR = params.mode === "early" ? Math.log10(result.radiusRatio) : Math.log10(result.radius);
    node.appendChild(svg(doc, "circle", { cx: x(markerX), cy: yQ(markerQ), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
    node.appendChild(svg(doc, "circle", { cx: x(markerX), cy: yR(markerR), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
    node.appendChild(svg(doc, "text", { x: left, y: 24, "font-size": "13", "font-weight": "700" }, "运动学：q<0 表示背景加速"));
    node.appendChild(svg(doc, "text", { x: right, y: 24, "text-anchor": "end", "font-size": "11" }, "蓝：q　红虚线：加速边界 q=0"));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 270, "text-anchor": "middle", "font-size": "12" }, params.mode === "early" ? "e-fold 数 N" : "log10 a"));
    node.appendChild(svg(doc, "text", { x: left, y: 317, "font-size": "13", "font-weight": "700" }, radiusAxisTitle(params.mode)));
    node.appendChild(svg(doc, "text", { x: right, y: 317, "text-anchor": "end", "font-size": "11" }, radiusAxisLabel(params.mode)));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 575, "text-anchor": "middle", "font-size": "12" }, params.mode === "early" ? "从开始到结束的 e-fold" : "标度因子 a（对数轴）"));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "pid-" + INSTANCE;
    var state = { presetId: "late", mode: DEFAULTS.mode, N: DEFAULTS.N, a: DEFAULTS.a, omegaM: DEFAULTS.omegaM, omegaLambda: DEFAULTS.omegaLambda, revealed: false, predictions: {} };
    var refs = {};
    root.classList.add("pid-lab");
    root.appendChild(make(api, doc, "h3", { id: prefix + "-heading" }, ["两种加速时代：同一个 q，不同的历史问题"]));
    root.appendChild(make(api, doc, "p", { className: "pid-note" }, ["上图把运动学判据 q 和共动 Hubble 半径放在一起。恒 H 的早期 toy 用 N 记录 e-fold；晚期 toy 用平直物质 + Λ 背景计算 E(a)。"]))

    var form = make(api, doc, "fieldset", {});
    form.appendChild(make(api, doc, "legend", {}, ["预测门：先区分加速判据和机制"]));
    var questions = [
      { key: "q", text: "q<0 的直接含义是？", expected: "accelerate", options: [["accelerate", "标度因子在加速"], ["inflation", "已经证明是 inflation"], ["lambda", "已经证明有 Λ"]] },
      { key: "radius", text: "恒 H、N=60 时，共动 Hubble 半径末/初？", expected: "tiny", options: [["tiny", "约 e⁻⁶⁰，极小"], ["one", "约 1"], ["large", "约 e⁶⁰，极大"]] },
      { key: "transition", text: "晚期 Λ toy 从 q>0 到 q<0 的转折满足 ρm=？", expected: "twolambda", options: [["twolambda", "2ρΛ"], ["lambda", "ρΛ"], ["zero", "0"]] }
    ];
    questions.forEach(function (question) {
      var block = make(api, doc, "div", {});
      block.appendChild(make(api, doc, "p", { className: "pid-note" }, [question.text]));
      var choices = make(api, doc, "div", { className: "pid-choices" });
      question.options.forEach(function (option) {
        var radio = make(api, doc, "input", { type: "radio", name: prefix + "-" + question.key, value: option[0] });
        radio.addEventListener("change", function () { state.predictions[question.key] = option[0]; });
        choices.appendChild(make(api, doc, "label", { className: "pid-choice" }, [radio, make(api, doc, "span", {}, [option[1]])]));
      });
      block.appendChild(choices);
      form.appendChild(block);
    });
    var actions = make(api, doc, "div", { className: "pid-actions" });
    var reveal = make(api, doc, "button", { type: "button", className: "pid-primary" }, ["核对预测并揭晓"]);
    var reset = make(api, doc, "button", { type: "button" }, ["重置预测"]);
    actions.appendChild(reveal);
    actions.appendChild(reset);
    refs.feedback = make(api, doc, "p", { className: "pid-feedback", "aria-live": "polite", "aria-atomic": "true" }, []);
    var shell = make(api, doc, "div", { hidden: true });
    var controls = make(api, doc, "div", { className: "pid-controls" });
    var preset = make(api, doc, "select", { "aria-label": "加速宇宙教学预设" });
    PRESETS.forEach(function (item) { preset.appendChild(make(api, doc, "option", { value: item.id }, [item.label])); });
    preset.id = prefix + "-preset";
    controls.appendChild(make(api, doc, "div", { className: "pid-field" }, [make(api, doc, "label", { htmlFor: preset.id }, ["教学预设"]), preset]));
    var modeInput = make(api, doc, "select", { "aria-label": "比较哪段历史：模型时代" });
    modeInput.appendChild(make(api, doc, "option", { value: "early" }, ["早期恒 H toy"]));
    modeInput.appendChild(make(api, doc, "option", { value: "late" }, ["晚期物质 + Λ toy"]));
    modeInput.id = prefix + "-mode";
    controls.appendChild(make(api, doc, "div", { className: "pid-field" }, [make(api, doc, "label", { htmlFor: modeInput.id }, ["比较哪段历史"]), modeInput]));
    function labelled(label, input, output, id) {
      input.id = id;
      return make(api, doc, "div", { className: "pid-field" }, [make(api, doc, "label", { htmlFor: id }, [label, output]), input]);
    }
    var nInput = make(api, doc, "input", { type: "range", min: "40", max: "70", step: "1", value: String(DEFAULTS.N), "aria-label": "e-fold 数 N" });
    var nOutput = make(api, doc, "output", { className: "pid-output" }, [String(DEFAULTS.N)]);
    refs.nField = labelled("e-fold 数 N：", nInput, nOutput, prefix + "-N");
    var aInput = make(api, doc, "input", { type: "range", min: "0.2", max: "5", step: "0.01", value: String(DEFAULTS.a), "aria-label": "当前标度因子 a" });
    var aOutput = make(api, doc, "output", { className: "pid-output" }, [format(DEFAULTS.a, 2)]);
    refs.aField = labelled("当前标度因子 a：", aInput, aOutput, prefix + "-a");
    var omegaMInput = make(api, doc, "input", { type: "number", min: "0.01", max: "1", step: "0.01", value: String(DEFAULTS.omegaM), "aria-label": "物质密度 Ωm" });
    var omegaLInput = make(api, doc, "input", { type: "number", min: "0", max: "1", step: "0.01", value: String(DEFAULTS.omegaLambda), "aria-label": "暗能量密度 ΩΛ" });
    controls.appendChild(refs.nField);
    controls.appendChild(refs.aField);
    controls.appendChild(labelled("Ωm：", omegaMInput, null, prefix + "-omega-m"));
    controls.appendChild(labelled("ΩΛ：", omegaLInput, null, prefix + "-omega-l"));
    controls.appendChild(make(api, doc, "p", { className: "pid-note" }, ["输入的 Ωm、ΩΛ 会归一化为平直 toy；这只改变背景账本，不是对暗能量微观性质的测量。"]));
    var stage = make(api, doc, "div", {});
    var frame = make(api, doc, "div", { className: "pid-frame" });
    var chart = doc.createElementNS(SVG_NS, "svg");
    chart.setAttribute("class", "pid-svg");
    frame.appendChild(chart);
    stage.appendChild(frame);
    var metrics = make(api, doc, "div", { className: "pid-metrics" });
    var tableWrap = make(api, doc, "div", { className: "pid-table-wrap" });
    var interpretation = make(api, doc, "p", { className: "pid-interpretation", "aria-live": "polite" }, []);
    stage.appendChild(metrics);
    stage.appendChild(tableWrap);
    stage.appendChild(interpretation);
    shell.appendChild(make(api, doc, "div", { className: "pid-layout" }, [controls, stage]));
    root.appendChild(form);
    root.appendChild(actions);
    root.appendChild(refs.feedback);
    root.appendChild(shell);

    function applyPreset(id) {
      var selected = PRESETS.filter(function (item) { return item.id === id; })[0];
      if (!selected) return;
      state.presetId = selected.id;
      state.mode = selected.mode;
      state.N = selected.N;
      state.a = selected.a;
      state.omegaM = selected.omegaM;
      state.omegaLambda = selected.omegaLambda;
    }
    function syncInputs() {
      modeInput.value = state.mode;
      nInput.value = String(state.N);
      nOutput.value = String(state.N);
      nOutput.textContent = String(state.N);
      aInput.value = String(state.a);
      aOutput.value = format(state.a, 2);
      aOutput.textContent = format(state.a, 2);
      omegaMInput.value = String(state.omegaM);
      omegaLInput.value = String(state.omegaLambda);
      refs.nField.hidden = state.mode !== "early";
      refs.aField.hidden = state.mode !== "late";
    }
    function renderTable(result) {
      replaceChildren(tableWrap, [], doc);
      var table = make(api, doc, "table", { className: "pid-table" });
      table.appendChild(make(api, doc, "caption", {}, ["加速时代账本：运动学读数与模型解释"]));
      table.appendChild(make(api, doc, "thead", {}, [make(api, doc, "tr", {}, [
        make(api, doc, "th", { scope: "col" }, ["量"]),
        make(api, doc, "th", { scope: "col" }, ["读数"]),
        make(api, doc, "th", { scope: "col" }, ["解释"])
      ])]));
      var rows;
      if (result.params.mode === "early") {
        rows = [
          ["εH", format(result.epsilon, 3), "恒 H toy 的第一 Hubble 慢滚参数"],
          ["q", format(result.q, 3), "q<0 表示背景加速"],
          ["aend/astart", formatExp(result.expansionRatio), "N=ln(aend/astart)"],
          ["[(aH)⁻¹]end / [(aH)⁻¹]start", formatExp(result.radiusRatio), "共动 Hubble 半径的缩小"],
          ["机制状态", "未指定", "toy 只规定膨胀史，不证明微观起源"]
        ];
      } else {
        rows = [
          ["E(a)", format(result.E, 4), "H/H0"],
          ["Ωm(a)", format(result.omegaMatter, 4), "背景中物质的瞬时份额"],
          ["εH", format(result.epsilon, 4), "-d ln H/d ln a"],
          ["q", format(result.q, 4), "q=εH-1；负值是加速"],
          ["a转折", result.transitionA === null ? "无" : format(result.transitionA, 4), "ρm=2ρΛ 时 q=0"]
        ];
      }
      rows.forEach(function (row) { table.appendChild(make(api, doc, "tr", {}, row.map(function (value, index) { return make(api, doc, "td", {}, [value]); }))); });
      tableWrap.appendChild(table);
    }
    function render() {
      var result = analyze({ mode: state.mode, N: state.N, a: state.a, omegaM: state.omegaM, omegaLambda: state.omegaLambda });
      if (!result.ok) {
        replaceChildren(metrics, [make(api, doc, "p", { className: "pid-warn" }, [result.message])], doc);
        replaceChildren(tableWrap, [], doc);
        replaceChildren(interpretation, [], doc);
        return;
      }
      drawChart(doc, chart, result.params, result);
      replaceChildren(metrics, [], doc);
      var metricItems = [
        ["模型", result.params.mode === "early" ? "早期恒 H toy" : "晚期物质 + Λ"],
        ["q", format(result.q, 4)],
        ["εH", format(result.epsilon, 4)],
        [result.params.mode === "early" ? "半径末/初" : "[(aH)⁻¹]", result.params.mode === "early" ? formatExp(result.radiusRatio) : format(result.radius, 4)]
      ];
      metricItems.forEach(function (item) {
        var card = metric(api, doc, item[0]);
        card.querySelector("strong").textContent = item[1];
        metrics.appendChild(card);
      });
      renderTable(result);
      replaceChildren(interpretation, [
        make(api, doc, "strong", {}, ["读法："]),
        result.observationNote + " ",
        result.inferenceNote
      ], doc);
    }
    function changed() {
      state.mode = modeInput.value;
      state.N = Number(nInput.value);
      state.a = Number(aInput.value);
      state.omegaM = Number(omegaMInput.value);
      state.omegaLambda = Number(omegaLInput.value);
      syncInputs();
      if (state.revealed) render();
    }
    preset.addEventListener("change", function () { applyPreset(preset.value); syncInputs(); if (state.revealed) render(); });
    modeInput.addEventListener("change", changed);
    nInput.addEventListener("input", changed);
    aInput.addEventListener("input", changed);
    omegaMInput.addEventListener("input", changed);
    omegaLInput.addEventListener("input", changed);
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { refs.feedback.textContent = "请先完成全部预测，再揭晓。"; announce(api, root, refs.feedback.textContent); return; }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      shell.hidden = false;
      refs.feedback.textContent = "已揭晓：答对 " + correct + "/" + questions.length + "。现在可拖动参数检验判断。";
      render();
      announce(api, root, refs.feedback.textContent);
    });
    reset.addEventListener("click", function () {
      state.predictions = {};
      state.revealed = false;
      shell.hidden = true;
      form.querySelectorAll("input[type=radio]").forEach(function (radio) { radio.checked = false; });
      refs.feedback.textContent = "预测已重置。";
      announce(api, root, refs.feedback.textContent);
    });
    preset.value = state.presetId;
    syncInputs();
  }

  return {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    normalize: normalize,
    analyze: analyze,
    curve: curve,
    mount: mount,
    selfTest: selfTest
  };
});
