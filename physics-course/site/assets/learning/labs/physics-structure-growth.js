(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("physics-structure-growth", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("physics-structure-growth self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("physics-structure-growth self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-structure-growth-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var BBKS_Q_FACTOR = 13.41;
  var TRANSFER_RATIO_MIN = 1e-4;
  var TRANSFER_RATIO_MAX = 1e5;
  var DEFAULTS = { omegaM: 0.3, omegaLambda: 0.7, a: 0.5, k: 0.1, kEq: 0.01 };
  var PRESETS = [
    { id: "lcdm", label: "ΛCDM toy：Ωm=.3", omegaM: 0.3, omegaLambda: 0.7, a: 0.5, k: 0.1, kEq: 0.01 },
    { id: "eds", label: "Einstein–de Sitter", omegaM: 1, omegaLambda: 0, a: 0.5, k: 0.1, kEq: 0.01 },
    { id: "large-scale", label: "大尺度：k≪keq", omegaM: 0.3, omegaLambda: 0.7, a: 0.5, k: 0.0001, kEq: 0.01 },
    { id: "small-scale", label: "小尺度：k≫keq", omegaM: 0.3, omegaLambda: 0.7, a: 0.5, k: 1, kEq: 0.01 }
  ];

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function format(value, digits) {
    if (!finite(value)) return "—";
    return value.toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    input = input || {};
    var omegaM = Number(input.omegaM);
    var omegaLambda = Number(input.omegaLambda === undefined ? input.lambda : input.omegaLambda);
    var a = Number(input.a);
    var k = Number(input.k);
    var kEq = Number(input.kEq === undefined ? input.keq : input.kEq);
    if (!finite(omegaM) || !finite(omegaLambda) || !finite(a) || !finite(k) || !finite(kEq)) throw new TypeError("Ωm、ΩΛ、a、k、keq 必须是有限数");
    if (!(omegaM > 0) || omegaLambda < 0 || !(omegaM + omegaLambda > 0)) throw new RangeError("需要 Ωm>0 且 ΩΛ≥0");
    if (a < 0.01 || a > 1) throw new RangeError("本 lab 将 a 限在 0.01 到 1 的线性增长区间");
    if (!(k > 0) || !(kEq > 0)) throw new RangeError("k 和 keq 必须为正");
    var total = omegaM + omegaLambda;
    return { omegaM: omegaM / total, omegaLambda: omegaLambda / total, a: a, k: k, kEq: kEq };
  }

  function expansionSquared(a, params) {
    return params.omegaM / Math.pow(a, 3) + params.omegaLambda;
  }

  function omegaMatterAt(a, params) {
    var matter = params.omegaM / Math.pow(a, 3);
    return matter / (matter + params.omegaLambda);
  }

  function growthDerivative(x, state, params) {
    var a = Math.exp(x);
    var omega = omegaMatterAt(a, params);
    var dlnH = -1.5 * omega;
    return [state[1], -(2 + dlnH) * state[1] + 1.5 * omega * state[0]];
  }

  function integrateGrowth(targetA, params) {
    var startA = 0.01;
    targetA = clamp(Number(targetA), startA, 1);
    var x0 = Math.log(startA);
    var x1 = Math.log(targetA);
    var steps = Math.max(1, Math.ceil((x1 - x0) / 0.0125));
    var h = (x1 - x0) / steps;
    var state = [startA, startA];
    for (var i = 0; i < steps; i += 1) {
      var x = x0 + i * h;
      var k1 = growthDerivative(x, state, params);
      var mid1 = [state[0] + h * k1[0] / 2, state[1] + h * k1[1] / 2];
      var k2 = growthDerivative(x + h / 2, mid1, params);
      var mid2 = [state[0] + h * k2[0] / 2, state[1] + h * k2[1] / 2];
      var k3 = growthDerivative(x + h / 2, mid2, params);
      var end = [state[0] + h * k3[0], state[1] + h * k3[1]];
      var k4 = growthDerivative(x + h, end, params);
      state = [state[0] + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, state[1] + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
    }
    return { D: state[0], Dprime: state[1], f: state[0] !== 0 ? state[1] / state[0] : NaN };
  }

  function bbksQ(k, kEq) {
    k = Number(k);
    kEq = Number(kEq);
    if (!finite(k) || !finite(kEq) || !(k > 0) || !(kEq > 0)) return NaN;
    return k / (BBKS_Q_FACTOR * kEq);
  }

  function bbksShape(q) {
    if (q < 1e-8) return 1;
    var numerator = Math.log(1 + 2.34 * q) / (2.34 * q);
    var bracket = 1 + 3.89 * q + Math.pow(16.1 * q, 2) + Math.pow(5.46 * q, 3) + Math.pow(6.71 * q, 4);
    return numerator / Math.pow(bracket, 0.25);
  }

  function transferFunction(k, kEq) {
    var q = bbksQ(k, kEq);
    return finite(q) ? bbksShape(q) : NaN;
  }

  function analyze(input) {
    var params;
    try { params = normalize(input); } catch (error) { return { ok: false, status: "invalid-input", message: error.message }; }
    var today = integrateGrowth(1, params);
    var current = integrateGrowth(params.a, params);
    return {
      ok: true,
      status: params.omegaLambda > 0 ? "matter-plus-lambda" : "eds-boundary",
      params: params,
      E: Math.sqrt(expansionSquared(params.a, params)),
      omegaMatter: omegaMatterAt(params.a, params),
      D: current.D / today.D,
      f: current.f,
      transfer: transferFunction(params.k, params.kEq),
      kRatio: params.k / params.kEq,
      bbksQ: bbksQ(params.k, params.kEq),
      initialSlope: 1,
      growthToday: today.D,
      observationNote: "线性模型输出：不同 k 的初始振幅被转移函数重塑，时间演化由增长因子推进。",
      inferenceNote: "观测推断需要把 CMB 初始条件、星系偏差、红移空间畸变、透镜和非线性一起拟合。"
    };
  }

  function transferCurve(params, count) {
    count = count || 120;
    var values = [];
    for (var i = 0; i <= count; i += 1) {
      var fraction = i / count;
      var ratio = TRANSFER_RATIO_MIN * Math.pow(TRANSFER_RATIO_MAX / TRANSFER_RATIO_MIN, fraction);
      var k = ratio * params.kEq;
      values.push({ k: k, ratio: ratio, transfer: transferFunction(k, params.kEq) });
    }
    return values;
  }

  function growthCurve(params, count) {
    count = count || 100;
    var today = integrateGrowth(1, params).D;
    var values = [];
    for (var i = 0; i <= count; i += 1) {
      var a = 0.01 * Math.pow(100, i / count);
      values.push({ a: a, growth: integrateGrowth(a, params).D / today });
    }
    return values;
  }

  function assert(condition, message) { if (!condition) throw new Error("physics-structure-growth self-test failed: " + message); }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var lcdm = normalize(DEFAULTS);
    var result = analyze(DEFAULTS);
    check(result.ok, "default analysis");
    check(near(bbksQ(13.41 * lcdm.kEq, lcdm.kEq), 1, 1e-12), "BBKS q uses the physical equality scale");
    check(near(transferFunction(13.41 * lcdm.kEq, lcdm.kEq), bbksShape(1), 1e-12), "BBKS equality normalization");
    check(near(result.bbksQ, DEFAULTS.k / (13.41 * DEFAULTS.kEq), 1e-12), "analysis reports the physical BBKS q");
    check(near(transferFunction(1e-12, 0.01), 1, 1e-8), "large-scale transfer limit");
    check(transferFunction(1, 0.01) < transferFunction(0.001, 0.01), "small-scale suppression");
    var eds = analyze({ omegaM: 1, omegaLambda: 0, a: 0.5, k: 0.1, kEq: 0.01 });
    check(near(eds.D, 0.5, 2e-4), "EdS growth D proportional to a");
    check(near(eds.f, 1, 2e-4), "EdS growth rate");
    check(result.D < 0.7 && result.D > 0.5, "late lambda slows growth");
    check(near(result.params.omegaM + result.params.omegaLambda, 1, 1e-12), "flat normalization");
    var repeat = analyze(DEFAULTS);
    check(JSON.stringify(result) === JSON.stringify(repeat), "analysis deterministic");
    check(growthCurve(lcdm, 20).length === 21 && transferCurve(lcdm, 20).length === 21, "curve lengths");
    var transferPoints = transferCurve(lcdm, 20);
    check(near(transferPoints[0].ratio, TRANSFER_RATIO_MIN, 1e-12) && near(transferPoints[transferPoints.length - 1].ratio, TRANSFER_RATIO_MAX, 1e-12), "transfer curve uses k/keq chart ratios");
    check(analyze({ omegaM: 0.3, omegaLambda: 0.7, a: 0.5, k: NaN, kEq: 0.01 }).ok === false, "invalid numeric input rejected without a model result");
    var rejected = false;
    try { normalize({ omegaM: 0, omegaLambda: 1, a: 0.5, k: 0.1, kEq: 0.01 }); } catch (error) { rejected = true; }
    check(rejected, "zero matter rejected");
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
    (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
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
      ".psg-lab{color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.psg-lab *{box-sizing:border-box}.psg-lab [hidden]{display:none!important}.psg-lab h3{margin:0;color:var(--fg,#20252b);font-size:1.15rem}.psg-note,.psg-feedback{color:var(--fg-soft,var(--muted,#5d6873));font-size:.9rem}.psg-lab fieldset{min-width:0;margin:12px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.psg-lab legend{max-width:100%;font-weight:750}.psg-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.psg-choice{display:flex;gap:7px;align-items:flex-start;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px}.psg-choice input{margin-top:3px;accent-color:var(--accent,#1769aa)}",
      ".psg-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.psg-lab button,.psg-lab select,.psg-lab input{font:inherit}.psg-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer}.psg-lab button:hover{border-color:var(--accent,#1769aa)}.psg-lab button:focus-visible,.psg-lab select:focus-visible,.psg-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.psg-primary{background:var(--accent,#1769aa)!important;color:var(--bg,#fff)!important;font-weight:750}.psg-pass{color:var(--cl-green,#2f7547)}.psg-warn{color:var(--cl-red,#b43d32)}",
      ".psg-layout{display:grid;grid-template-columns:minmax(200px,.7fr) minmax(0,1.3fr);gap:14px;align-items:start}.psg-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px}.psg-field{display:grid;gap:5px}.psg-field label{font-size:.82rem;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.psg-field select,.psg-field input{width:100%;min-height:42px;padding:7px 8px;border:1px solid var(--border,#c8cdd3);border-radius:5px;background:var(--bg,#fff);color:inherit}.psg-field input[type=range]{padding:0;accent-color:var(--accent,#1769aa)}.psg-output{font-variant-numeric:tabular-nums;color:var(--accent,#1769aa)}",
      ".psg-frame{min-width:0;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.psg-svg{display:block;width:100%;height:auto}.psg-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.psg-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.psg-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.psg-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.psg-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.psg-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.psg-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.psg-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:.73rem}.psg-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.psg-table-wrap{max-width:100%;overflow-x:auto;margin-top:10px}.psg-table{width:100%;min-width:650px;border-collapse:collapse;font-size:.8rem}.psg-table th,.psg-table td{padding:7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.psg-table th{color:var(--fg-soft,var(--muted,#5d6873));font-size:.74rem}.psg-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-blue,#2c6aa0);background:var(--block-bg,var(--bg,#fff));font-size:.86rem}",
      "@media(max-width:760px){.psg-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:600px){.psg-choices{grid-template-columns:minmax(0,1fr)}.psg-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.psg-lab *{transition:none!important;animation:none!important}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function metric(api, doc, label) {
    var value = make(api, doc, "strong", {}, ["—"]);
    return make(api, doc, "div", { className: "psg-metric" }, [make(api, doc, "span", {}, [label]), value]);
  }

  function drawChart(doc, node, params, result) {
    replaceChildren(node, [], doc);
    node.setAttribute("viewBox", "0 0 760 610");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "线性宇宙学密度扰动的转移函数和增长因子");
    var left = 58, right = 728;
    var transferTop = 38, transferBottom = 255;
    var growthTop = 340, growthBottom = 555;
    var currentRatio = params.k / params.kEq;
    var ratioMin = Math.min(TRANSFER_RATIO_MIN, currentRatio);
    var ratioMax = Math.max(TRANSFER_RATIO_MAX, currentRatio);
    var xK = function (value) { return left + (Math.log10(value) - Math.log10(ratioMin)) / (Math.log10(ratioMax) - Math.log10(ratioMin)) * (right - left); };
    var yT = function (value) { return transferBottom - clamp(value, 0, 1.05) / 1.05 * (transferBottom - transferTop); };
    var xA = function (value) { return left + (Math.log10(value) + 2) / 2 * (right - left); };
    var yD = function (value) { return growthBottom - clamp(value, 0, 1.05) / 1.05 * (growthBottom - growthTop); };
    node.appendChild(svg(doc, "title", { id: "psg-title" }, "扰动转移与增长"));
    node.appendChild(svg(doc, "desc", { id: "psg-desc" }, "上图显示 T(k) 在 k 大于 keq 后受到抑制；下图显示 D(a)/D(1)，Λ 主导时增长偏离 D 正比于 a。"));
    node.setAttribute("aria-labelledby", "psg-title psg-desc");
    [0, .5, 1].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: left, y1: yT(value), x2: right, y2: yT(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "line", { x1: left, y1: yD(value), x2: right, y2: yD(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: yT(value) + 4, "text-anchor": "end", "font-size": "11" }, format(value, 1)));
      node.appendChild(svg(doc, "text", { x: left - 8, y: yD(value) + 4, "text-anchor": "end", "font-size": "11" }, format(value, 1)));
    });
    [1e-4, 1e-2, 1, 100, 1e4, 1e5].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: xK(value), y1: transferTop, x2: xK(value), y2: transferBottom, stroke: "var(--border,#c8cdd3)", "stroke-width": "1", "stroke-opacity": "0.65" }));
      node.appendChild(svg(doc, "text", { x: xK(value), y: transferBottom + 17, "text-anchor": "middle", "font-size": "11" }, value < 1 ? value.toExponential(0) : String(value)));
    });
    [0.01, 0.1, 1].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: xA(value), y1: growthTop, x2: xA(value), y2: growthBottom, stroke: "var(--border,#c8cdd3)", "stroke-width": "1", "stroke-opacity": "0.65" }));
      node.appendChild(svg(doc, "text", { x: xA(value), y: growthBottom + 17, "text-anchor": "middle", "font-size": "11" }, value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")));
    });
    node.appendChild(svg(doc, "line", { x1: left, y1: transferBottom, x2: right, y2: transferBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: transferTop, x2: left, y2: transferBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: growthBottom, x2: right, y2: growthBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: growthTop, x2: left, y2: growthBottom, stroke: "currentColor", "stroke-width": "1.2" }));
    var tPath = "";
    transferCurve(params, 120).forEach(function (point) { tPath += (tPath ? " L " : "M ") + xK(point.ratio).toFixed(2) + " " + yT(point.transfer).toFixed(2); });
    node.appendChild(svg(doc, "path", { d: tPath, fill: "none", stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": "3", "stroke-linecap": "round" }));
    var dPath = "";
    growthCurve(params, 70).forEach(function (point) { dPath += (dPath ? " L " : "M ") + xA(point.a).toFixed(2) + " " + yD(point.growth).toFixed(2); });
    node.appendChild(svg(doc, "path", { d: dPath, fill: "none", stroke: "var(--cl-green,#347247)", "stroke-width": "3", "stroke-linecap": "round" }));
    node.appendChild(svg(doc, "line", { x1: xK(1), y1: transferTop, x2: xK(1), y2: transferBottom, stroke: "var(--cl-gold,#95670d)", "stroke-width": "1.5", "stroke-dasharray": "5 4" }));
    node.appendChild(svg(doc, "circle", { cx: xK(result.kRatio), cy: yT(result.transfer), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
    node.appendChild(svg(doc, "circle", { cx: xA(params.a), cy: yD(result.D), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
    node.appendChild(svg(doc, "text", { x: left, y: 22, "font-size": "13", "font-weight": "700" }, "转移函数 T(k)"));
    node.appendChild(svg(doc, "text", { x: right, y: 22, "text-anchor": "end", "font-size": "11" }, "蓝：T(k)　金：keq　红：当前 k"));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 292, "text-anchor": "middle", "font-size": "12" }, "k / k_eq（相对物理等号波数的对数轴）"));
    node.appendChild(svg(doc, "text", { x: left, y: 324, "font-size": "13", "font-weight": "700" }, "增长因子 D(a)/D(1)"));
    node.appendChild(svg(doc, "text", { x: right, y: 324, "text-anchor": "end", "font-size": "11" }, "绿：数值积分　红：当前 a"));
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 590, "text-anchor": "middle", "font-size": "12" }, "标度因子 a（对数轴）"));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "psg-" + INSTANCE;
    var state = { presetId: "lcdm", omegaM: DEFAULTS.omegaM, omegaLambda: DEFAULTS.omegaLambda, a: DEFAULTS.a, k: DEFAULTS.k, kEq: DEFAULTS.kEq, revealed: false, predictions: {} };
    var refs = {};
    root.classList.add("psg-lab");
    var heading = make(api, doc, "h3", { id: prefix + "-heading" }, ["结构形成账本：T(k) 记忆早期，D(a) 推进晚期"]);
    var intro = make(api, doc, "p", { className: "psg-note" }, ["这是线性、平直、物质加宇宙学常数的教学模型。上图和下图分别回答“不同尺度的初始振幅怎样被改写”和“给定尺度的扰动怎样随 a 增长”，不直接拟合星系目录。"]);
    var form = make(api, doc, "fieldset", {});
    form.appendChild(make(api, doc, "legend", {}, ["预测门：先判断尺度与时间的分工"]));
    var questions = [
      { key: "transfer", text: "k≪keq 时，T(k) 的极限？", expected: "one", options: [["one", "接近 1"], ["zero", "接近 0"], ["grow", "随时间增长"]] },
      { key: "growth", text: "物质主导 Ωm=1 时，增长解？", expected: "a", options: [["a", "D∝a"], ["constant", "D 为常数"], ["sqrt", "D∝√a"]] },
      { key: "lambda", text: "Λ 主导后，D(a) 相对 EdS？", expected: "slow", options: [["slow", "增长变慢"], ["faster", "增长更快"], ["same", "完全相同"]] }
    ];
    questions.forEach(function (question) {
      var block = make(api, doc, "div", {});
      block.appendChild(make(api, doc, "p", { className: "psg-note" }, [question.text]));
      var choices = make(api, doc, "div", { className: "psg-choices" });
      question.options.forEach(function (option) {
        var radio = make(api, doc, "input", { type: "radio", name: prefix + "-" + question.key, value: option[0] });
        radio.addEventListener("change", function () { state.predictions[question.key] = option[0]; });
        choices.appendChild(make(api, doc, "label", { className: "psg-choice" }, [radio, make(api, doc, "span", {}, [option[1]])]));
      });
      block.appendChild(choices);
      form.appendChild(block);
    });
    var actions = make(api, doc, "div", { className: "psg-actions" });
    var reveal = make(api, doc, "button", { type: "button", className: "psg-primary" }, ["核对预测并揭晓"]);
    var reset = make(api, doc, "button", { type: "button" }, ["重置预测"]);
    actions.appendChild(reveal);
    actions.appendChild(reset);
    refs.feedback = make(api, doc, "p", { className: "psg-feedback", "aria-live": "polite", "aria-atomic": "true" }, []);
    var shell = make(api, doc, "div", { hidden: true });
    var controls = make(api, doc, "div", { className: "psg-controls" });
    var preset = make(api, doc, "select", { "aria-label": "结构增长预设" });
    PRESETS.forEach(function (item) { preset.appendChild(make(api, doc, "option", { value: item.id }, [item.label])); });
    var omegaMInput = make(api, doc, "input", { type: "number", min: "0.01", max: "1", step: "0.01", value: String(DEFAULTS.omegaM), "aria-label": "物质密度 Ωm" });
    var omegaLInput = make(api, doc, "input", { type: "number", min: "0", max: "1", step: "0.01", value: String(DEFAULTS.omegaLambda), "aria-label": "暗能量密度 ΩΛ" });
    var aInput = make(api, doc, "input", { type: "range", min: "0.01", max: "1", step: "0.01", value: String(DEFAULTS.a), "aria-label": "标度因子 a" });
    var aOutput = make(api, doc, "output", { className: "psg-output" }, ["0.50"]);
    var kInput = make(api, doc, "input", { type: "number", min: "0.0001", max: "10", step: "0.0001", value: String(DEFAULTS.k), "aria-label": "波数 k / h Mpc⁻¹" });
    var kEqInput = make(api, doc, "input", { type: "number", min: "0.0001", max: "1", step: "0.0001", value: String(DEFAULTS.kEq), "aria-label": "物理等号波数 k_eq / h Mpc⁻¹" });
    function labelled(label, input, output, id) {
      input.id = id;
      return make(api, doc, "div", { className: "psg-field" }, [make(api, doc, "label", { htmlFor: id }, [label, output]), input]);
    }
    preset.id = prefix + "-preset";
    controls.appendChild(make(api, doc, "div", { className: "psg-field" }, [make(api, doc, "label", { htmlFor: preset.id }, ["教学预设"]), preset]));
    controls.appendChild(labelled("Ωm：", omegaMInput, null, prefix + "-omega-m"));
    controls.appendChild(labelled("ΩΛ：", omegaLInput, null, prefix + "-omega-l"));
    controls.appendChild(labelled("当前标度因子 a：", aInput, aOutput, prefix + "-a"));
    controls.appendChild(labelled("波数 k / h Mpc⁻¹：", kInput, null, prefix + "-k"));
    controls.appendChild(labelled("物理等号波数 k_eq：", kEqInput, null, prefix + "-keq"));
    controls.appendChild(make(api, doc, "p", { className: "psg-note" }, ["Ωm、ΩΛ 会归一化为平直 toy；T(k) 公式是无重子、无中微子自由流的教学 transfer 近似。"]));
    var stage = make(api, doc, "div", {});
    var frame = make(api, doc, "div", { className: "psg-frame" });
    var chart = doc.createElementNS(SVG_NS, "svg");
    chart.setAttribute("class", "psg-svg");
    frame.appendChild(chart);
    stage.appendChild(frame);
    var metrics = make(api, doc, "div", { className: "psg-metrics" });
    var tableWrap = make(api, doc, "div", { className: "psg-table-wrap" });
    var interpretation = make(api, doc, "p", { className: "psg-interpretation", "aria-live": "polite" }, []);
    stage.appendChild(metrics);
    stage.appendChild(tableWrap);
    stage.appendChild(interpretation);
    shell.appendChild(make(api, doc, "div", { className: "psg-layout" }, [controls, stage]));
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(form);
    root.appendChild(actions);
    root.appendChild(refs.feedback);
    root.appendChild(shell);

    function applyPreset(id) {
      var selected = PRESETS.filter(function (item) { return item.id === id; })[0];
      if (!selected) return;
      state.presetId = selected.id;
      state.omegaM = selected.omegaM;
      state.omegaLambda = selected.omegaLambda;
      state.a = selected.a;
      state.k = selected.k;
      state.kEq = selected.kEq;
    }
    function renderTable(result) {
      replaceChildren(tableWrap, [], doc);
      var table = make(api, doc, "table", { className: "psg-table" });
      table.appendChild(make(api, doc, "caption", {}, ["线性结构账本：输入、模型输出与解释"]));
      table.appendChild(make(api, doc, "thead", {}, [make(api, doc, "tr", {}, [make(api, doc, "th", { scope: "col" }, ["量"]), make(api, doc, "th", { scope: "col" }, ["读数"]), make(api, doc, "th", { scope: "col" }, ["解释"])])]));
      var rows = [
        ["E(a)", result.ok ? format(result.E, 4) : "—", "无量纲膨胀率"],
        ["Ωm(a)", result.ok ? format(result.omegaMatter, 4) : "—", "当前时刻物质引力源占比"],
        ["D(a)/D(1)", result.ok ? format(result.D, 4) : "—", "线性增长因子"],
        ["f=d ln D/d ln a", result.ok ? format(result.f, 4) : "—", "增长率，不是转移函数"],
        ["k/keq", result.ok ? format(result.kRatio, 3) : "—", "判断 horizon-entry 记忆的尺度比"],
        ["T(k)", result.ok ? format(result.transfer, 4) : "—", "早期历史造成的尺度重塑"]
      ];
      var body = make(api, doc, "tbody");
      rows.forEach(function (row) { body.appendChild(make(api, doc, "tr", {}, row.map(function (value) { return make(api, doc, "td", {}, [value]); }))); });
      table.appendChild(body);
      tableWrap.appendChild(table);
    }
    function render() {
      preset.value = state.presetId;
      omegaMInput.value = String(state.omegaM);
      omegaLInput.value = String(state.omegaLambda);
      aInput.value = String(state.a);
      aOutput.textContent = format(state.a, 2);
      kInput.value = String(state.k);
      kEqInput.value = String(state.kEq);
      shell.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze({ omegaM: state.omegaM, omegaLambda: state.omegaLambda, a: state.a, k: state.k, kEq: state.kEq });
      if (!result.ok) {
        replaceChildren(chart, [], doc);
        replaceChildren(metrics, [], doc);
        replaceChildren(tableWrap, [], doc);
        replaceChildren(interpretation, ["模型停止：" + result.message], doc);
        interpretation.className = "psg-interpretation psg-warn";
        return;
      }
      drawChart(doc, chart, result.params, result);
      replaceChildren(metrics, [metric(api, doc, "T(k)"), metric(api, doc, "D(a)/D(1)"), metric(api, doc, "Ωm(a)"), metric(api, doc, "f")], doc);
      [format(result.transfer, 4), format(result.D, 4), format(result.omegaMatter, 4), format(result.f, 4)].forEach(function (value, index) { metrics.querySelectorAll("strong")[index].textContent = value; });
      renderTable(result);
      interpretation.textContent = "观测层/模型层分开读：当前输出是线性 toy 的数值解。T(k) 不是 D(a)，Λ 只改变晚期时间增长；真实宇宙还需辐射、重子、无菌/有质量中微子、曲率、偏差和非线性修正。";
    }
    preset.addEventListener("change", function () { applyPreset(preset.value); render(); });
    omegaMInput.addEventListener("input", function () { state.omegaM = Number(omegaMInput.value); state.presetId = "custom"; render(); });
    omegaLInput.addEventListener("input", function () { state.omegaLambda = Number(omegaLInput.value); state.presetId = "custom"; render(); });
    aInput.addEventListener("input", function () { state.a = Number(aInput.value); state.presetId = "custom"; render(); });
    kInput.addEventListener("input", function () { state.k = Number(kInput.value); state.presetId = "custom"; render(); });
    kEqInput.addEventListener("input", function () { state.kEq = Number(kEqInput.value); state.presetId = "custom"; render(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        var missingMessage = "请先完成全部预测，再揭晓。";
        refs.feedback.textContent = missingMessage;
        refs.feedback.className = "psg-feedback psg-warn";
        announce(api, root, missingMessage);
        return;
      }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      var message = "已揭晓：" + correct + "/" + questions.length + " 命中。现在可分别调节尺度 k 和晚期背景。";
      refs.feedback.textContent = message;
      refs.feedback.className = "psg-feedback " + (correct === questions.length ? "psg-pass" : "psg-warn");
      render();
      announce(api, root, message);
    });
    reset.addEventListener("click", function () {
      state.presetId = "lcdm";
      state.omegaM = DEFAULTS.omegaM;
      state.omegaLambda = DEFAULTS.omegaLambda;
      state.a = DEFAULTS.a;
      state.k = DEFAULTS.k;
      state.kEq = DEFAULTS.kEq;
      state.revealed = false;
      state.predictions = {};
      form.querySelectorAll("input[type=radio]").forEach(function (radio) { radio.checked = false; });
      refs.feedback.textContent = "";
      render();
      announce(api, root, "结构增长预测已重置。");
    });
    render();
  }
  return { DEFAULTS: DEFAULTS, PRESETS: PRESETS, BBKS_Q_FACTOR: BBKS_Q_FACTOR, TRANSFER_RATIO_MIN: TRANSFER_RATIO_MIN, TRANSFER_RATIO_MAX: TRANSFER_RATIO_MAX, normalize: normalize, expansionSquared: expansionSquared, omegaMatterAt: omegaMatterAt, integrateGrowth: integrateGrowth, bbksQ: bbksQ, transferFunction: transferFunction, analyze: analyze, transferCurve: transferCurve, growthCurve: growthCurve, mount: mount, selfTest: selfTest };
});
