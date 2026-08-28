(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-qcd-hadrons", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-qcd-hadrons self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-qcd-hadrons self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-qcd-hadrons-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    { id: "reference", label: "参考：Q=2 GeV", lambda: 0.25, nf: 5, q: 2, note: "进入可计算的低能端，但 αs 已不再是很小的展开参数。" },
    { id: "jet", label: "喷注尺度：Q=91 GeV", lambda: 0.25, nf: 5, q: 91, note: "高能处耦合较小，微扰喷注计算更可信。" },
    { id: "near-boundary", label: "靠近 ΛQCD", lambda: 0.25, nf: 4, q: 0.6, note: "Q 只比 Λ 大一截；一圈公式仍可算，但解释要非常谨慎。" },
    { id: "too-low", label: "越过扰动边界", lambda: 0.25, nf: 5, q: 0.2, note: "Q≤Λ：一圈微扰表达式没有合法实数读数。" }
  ];

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }

  function beta0(nf) {
    return 11 - 2 * nf / 3;
  }

  function normalize(input) {
    input = input || {};
    var lambda = Number(input.lambda === undefined ? input.lambdaQCD : input.lambda);
    var nf = Number(input.nf);
    var q = Number(input.q === undefined ? input.Q : input.q);
    if (!finite(lambda) || !finite(nf) || !finite(q)) throw new TypeError("lambda、nf、Q 必须是有限数");
    if (!(lambda > 0)) throw new RangeError("ΛQCD 必须为正");
    if (!(nf >= 0 && nf <= 16 && Math.round(nf) === nf)) throw new RangeError("本 toy 要求 nf 是 0 到 16 的整数");
    if (!(q > 0)) throw new RangeError("Q 必须为正能标");
    return { lambda: lambda, nf: nf, q: q, beta0: beta0(nf) };
  }

  function alphaS(q, lambda, nf) {
    q = Number(q);
    lambda = Number(lambda);
    nf = Number(nf);
    if (!finite(q) || !finite(lambda) || !finite(nf)) return { ok: false, status: "invalid-input", message: "Q、ΛQCD、nf 必须是有限数。" };
    if (!(lambda > 0) || !(q > 0) || nf < 0 || nf > 16 || Math.round(nf) !== nf) {
      return { ok: false, status: "invalid-input", message: "输入不在本 toy 的物理范围内。" };
    }
    var b0 = beta0(nf);
    if (!(b0 > 0)) return { ok: false, status: "no-asymptotic-freedom", message: "β₀≤0；此一圈模型不再给出渐近自由。", beta0: b0 };
    if (q <= lambda) return { ok: false, status: "nonperturbative-boundary", message: "Q≤ΛQCD；一圈微扰表达式越过了自己的适用边界。", beta0: b0 };
    var logarithm = Math.log((q / lambda) * (q / lambda));
    var value = 4 * Math.PI / (b0 * logarithm);
    return {
      ok: true,
      status: value < 1 ? "perturbative-candidate" : "strong-coupling-warning",
      q: q,
      lambda: lambda,
      nf: nf,
      beta0: b0,
      logarithm: logarithm,
      alpha: value,
      relativeScale: q / lambda
    };
  }

  function analyze(input) {
    var params;
    try {
      params = normalize(input);
    } catch (error) {
      return { ok: false, status: "invalid-input", message: error.message };
    }
    var running = alphaS(params.q, params.lambda, params.nf);
    return {
      ok: running.ok,
      status: running.status,
      message: running.message || "",
      q: params.q,
      lambda: params.lambda,
      nf: params.nf,
      beta0: params.beta0,
      alpha: running.alpha,
      logarithm: running.logarithm,
      relativeScale: params.q / params.lambda,
      perturbativeCandidate: running.ok && running.alpha < 1,
      warning: params.q < 2 ? "低能端的微扰展开需要非微扰输入；这里的曲线不是精密 QCD 预言。" : "一圈 running 只提供尺度趋势；真实计算还要处理阈值、圈修正与重整化方案。"
    };
  }

  function runningCurve(input) {
    var params = normalize(input);
    var start = Math.max(0.1, params.lambda * 1.015);
    var end = Math.max(1000, params.lambda * 4000);
    var points = [];
    for (var i = 0; i <= 120; i += 1) {
      var fraction = i / 120;
      var q = start * Math.pow(end / start, fraction);
      var result = alphaS(q, params.lambda, params.nf);
      points.push({ q: q, alpha: result.ok ? result.alpha : NaN });
    }
    return points;
  }

  function assert(condition, message) {
    if (!condition) throw new Error("physics-qcd-hadrons self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var low = alphaS(2, 0.25, 5);
    var high = alphaS(91, 0.25, 5);
    check(low.ok && high.ok, "reference points are valid");
    check(high.alpha < low.alpha, "asymptotic freedom lowers alpha at high Q");
    check(near(low.beta0, 23 / 3, 1e-12), "nf=5 beta coefficient");
    check(alphaS(0.25, 0.25, 5).status === "nonperturbative-boundary", "Q=lambda boundary");
    check(alphaS(0.2, 0.25, 5).ok === false, "below lambda rejected");
    check(beta0(16) > 0 && beta0(17) < 0, "beta coefficient boundary");
    check(analyze({ q: 2, lambda: 0.25, nf: 5 }).perturbativeCandidate, "reference is flagged as candidate");
    check(analyze({ q: 0.6, lambda: 0.25, nf: 4 }).warning.indexOf("低能端") >= 0, "low-scale caveat");
    var curveA = runningCurve({ q: 2, lambda: 0.25, nf: 5 });
    var curveB = runningCurve({ q: 2, lambda: 0.25, nf: 5 });
    check(JSON.stringify(curveA) === JSON.stringify(curveB), "curve is deterministic");
    var invalid = analyze({ q: NaN, lambda: 0.25, nf: 5 });
    check(!invalid.ok && invalid.status === "invalid-input", "invalid numeric input is rejected");
    var rejected = false;
    try { normalize({ q: 2, lambda: 0.25, nf: 5.5 }); } catch (error) { rejected = true; }
    check(rejected, "fractional nf rejected");
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
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
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
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children, doc);
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pqcd-lab{color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.pqcd-lab *{box-sizing:border-box}.pqcd-lab [hidden]{display:none!important}",
      ".pqcd-lab h3{margin:0;color:var(--fg,#20252b);font-size:1.15rem}.pqcd-note,.pqcd-feedback,.pqcd-warning{color:var(--fg-soft,var(--muted,#5d6873));font-size:.9rem}.pqcd-lab fieldset{min-width:0;margin:12px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.pqcd-lab legend{max-width:100%;font-weight:750}.pqcd-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pqcd-choice{display:flex;gap:7px;align-items:flex-start;min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px}.pqcd-choice input{margin-top:3px;accent-color:var(--accent,#1769aa)}",
      ".pqcd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.pqcd-lab button,.pqcd-lab select,.pqcd-lab input{font:inherit}.pqcd-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer}.pqcd-lab button:hover{border-color:var(--accent,#1769aa)}.pqcd-lab button:focus-visible,.pqcd-lab select:focus-visible,.pqcd-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pqcd-primary{background:var(--accent,#1769aa)!important;color:var(--bg,#fff)!important;font-weight:750}.pqcd-pass{color:var(--cl-green,#2f7547)}.pqcd-warn{color:var(--cl-red,#b43d32)}",
      ".pqcd-layout{display:grid;grid-template-columns:minmax(190px,.7fr) minmax(0,1.3fr);gap:14px;align-items:start}.pqcd-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border,#c8cdd3);border-radius:7px}.pqcd-field{display:grid;gap:5px}.pqcd-field label{font-size:.82rem;font-weight:700;color:var(--fg-soft,var(--muted,#5d6873))}.pqcd-field select,.pqcd-field input{width:100%;min-height:42px;padding:7px 8px;border:1px solid var(--border,#c8cdd3);border-radius:5px;background:var(--bg,#fff);color:inherit}.pqcd-field input[type=range]{padding:0;accent-color:var(--accent,#1769aa)}.pqcd-output{font-variant-numeric:tabular-nums;font-weight:750;color:var(--accent,#1769aa)}",
      ".pqcd-frame{min-width:0;border:1px solid var(--border,#c8cdd3);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.pqcd-svg{display:block;width:100%;height:auto}.pqcd-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pqcd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.pqcd-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--bg,#fff)}.pqcd-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.pqcd-metric:nth-child(4n+2){border-color:var(--cl-gold,#95670d)}.pqcd-metric:nth-child(4n+3){border-color:var(--cl-green,#347247)}.pqcd-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.pqcd-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:.73rem}.pqcd-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.pqcd-table-wrap{max-width:100%;overflow-x:auto;margin-top:10px}.pqcd-table{width:100%;min-width:600px;border-collapse:collapse;font-size:.8rem}.pqcd-table th,.pqcd-table td{padding:7px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.pqcd-table th{color:var(--fg-soft,var(--muted,#5d6873));font-size:.74rem}.pqcd-interpretation{margin-top:10px;padding:9px 11px;border-left:3px solid var(--cl-blue,#2c6aa0);background:var(--block-bg,var(--bg,#fff));font-size:.86rem}",
      "@media(max-width:760px){.pqcd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:600px){.pqcd-choices{grid-template-columns:minmax(0,1fr)}.pqcd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.pqcd-lab *{transition:none!important;animation:none!important}}"
    ].join("\n");
    doc.head.appendChild(style);
  }

  function metric(api, doc, label) {
    var value = make(api, doc, "strong", {}, ["—"]);
    return make(api, doc, "div", { className: "pqcd-metric" }, [make(api, doc, "span", {}, [label]), value]);
  }

  function drawChart(doc, node, params, current) {
    replaceChildren(node, [], doc);
    node.setAttribute("viewBox", "0 0 760 340");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", "一圈 QCD running coupling alpha_s 随能标 Q 的变化");
    var left = 58;
    var right = 730;
    var top = 30;
    var bottom = 285;
    var minQ = 0.1;
    var maxQ = Math.max(1000, params.lambda * 4000);
    var maxAlpha = 1.45;
    var x = function (q) { return left + (Math.log10(q) - Math.log10(minQ)) / (Math.log10(maxQ) - Math.log10(minQ)) * (right - left); };
    var y = function (alpha) { return bottom - clamp(alpha, 0, maxAlpha) / maxAlpha * (bottom - top); };
    node.appendChild(svg(doc, "title", { id: "pqcd-title" }, "QCD 一圈 running 曲线"));
    node.appendChild(svg(doc, "desc", { id: "pqcd-desc" }, "横轴是对数能标 Q，纵轴是 alpha_s；低能区用浅色标出微扰警示，当前参数由红点表示。"));
    node.setAttribute("aria-labelledby", "pqcd-title pqcd-desc");
    node.appendChild(svg(doc, "rect", { x: x(minQ), y: top, width: x(Math.min(2, maxQ)) - x(minQ), height: bottom - top, fill: "var(--cl-red,#b43d32)", "fill-opacity": "0.08" }));
    [0.2, 0.5, 1, 1.4].forEach(function (value) {
      node.appendChild(svg(doc, "line", { x1: left, y1: y(value), x2: right, y2: y(value), stroke: "var(--border,#c8cdd3)", "stroke-width": "1" }));
      node.appendChild(svg(doc, "text", { x: left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": "11" }, format(value, 1)));
    });
    [0.1, 0.3, 1, 2, 10, 100, 1000].forEach(function (value) {
      if (value < minQ || value > maxQ) return;
      node.appendChild(svg(doc, "line", { x1: x(value), y1: top, x2: x(value), y2: bottom, stroke: "var(--border,#c8cdd3)", "stroke-width": "1", "stroke-opacity": "0.65" }));
      node.appendChild(svg(doc, "text", { x: x(value), y: bottom + 18, "text-anchor": "middle", "font-size": "11" }, value < 1 ? value.toFixed(1) : String(value)));
    });
    node.appendChild(svg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    node.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-width": "1.2" }));
    var points = runningCurve(params);
    var path = "";
    points.forEach(function (point, index) {
      if (!finite(point.alpha) || point.alpha > maxAlpha) return;
      path += (path ? " L " : "M ") + x(point.q).toFixed(2) + " " + y(point.alpha).toFixed(2);
    });
    node.appendChild(svg(doc, "path", { d: path, fill: "none", stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": "3", "stroke-linecap": "round" }));
    var boundaryX = x(params.lambda);
    node.appendChild(svg(doc, "line", { x1: boundaryX, y1: top, x2: boundaryX, y2: bottom, stroke: "var(--cl-red,#b43d32)", "stroke-width": "1.5", "stroke-dasharray": "5 4" }));
    node.appendChild(svg(doc, "text", { x: Math.min(right - 4, boundaryX + 6), y: top + 15, "font-size": "11" }, "ΛQCD=" + format(params.lambda, 2) + " GeV"));
    if (current.ok) {
      node.appendChild(svg(doc, "circle", { cx: x(current.q), cy: y(current.alpha), r: "6", fill: "var(--cl-red,#b43d32)", stroke: "var(--bg,#fff)", "stroke-width": "2" }));
      node.appendChild(svg(doc, "text", { x: Math.min(right - 4, x(current.q) + 9), y: Math.max(top + 35, y(current.alpha) - 9), "font-size": "11" }, "当前 Q=" + format(current.q, current.q < 10 ? 2 : 1)));
    } else {
      node.appendChild(svg(doc, "text", { x: 470, y: 125, "text-anchor": "middle", "font-size": "13", "font-weight": "700" }, "Q≤Λ：微扰账本停止给出读数"));
    }
    node.appendChild(svg(doc, "text", { x: (left + right) / 2, y: 330, "text-anchor": "middle", "font-size": "12" }, "能标 Q / GeV（对数轴）"));
    node.appendChild(svg(doc, "text", { x: 17, y: (top + bottom) / 2, "text-anchor": "middle", "font-size": "12", transform: "rotate(-90 17 " + ((top + bottom) / 2) + ")" }, "αs(Q)"));
    node.appendChild(svg(doc, "text", { x: left + 5, y: top + 15, "font-size": "11", fill: "var(--cl-red,#b43d32)" }, "低能微扰警示区（Q<2 GeV）"));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "pqcd-" + INSTANCE;
    var state = { presetId: "reference", lambda: 0.25, nf: 5, q: 2, revealed: false, predictions: {}, feedback: "" };
    var refs = {};
    root.classList.add("pqcd-lab");
    var heading = make(api, doc, "h3", { id: prefix + "-heading" }, ["QCD running 账本：先猜尺度，再看 αs(Q)"]);
    var intro = make(api, doc, "p", { className: "pqcd-note" }, ["这里用固定 nf 的一圈公式做尺度诊断。曲线展示可计算性边界，不把 Landau pole 当成真实物理发散，也不把它单独当作禁闭证明。"]);
    var form = make(api, doc, "fieldset", {});
    form.appendChild(make(api, doc, "legend", {}, ["预测门：揭晓前先写下三条判断"]));
    var questions = [
      { key: "trend", text: "Q 增大时 αs(Q) 怎样变化？", expected: "decrease", options: [["decrease", "减小"], ["same", "保持不变"], ["increase", "增大"]] },
      { key: "boundary", text: "Q≤ΛQCD 时，一圈公式应怎样读？", expected: "invalid", options: [["invalid", "越过微扰边界"], ["zero", "趋于 0"], ["exact", "仍是精确读数"]] },
      { key: "nf", text: "固定 Q、Λ 时，nf 增大对 αs 的一圈趋势？", expected: "increase", options: [["increase", "增大"], ["same", "不变"], ["decrease", "减小"]] }
    ];
    var groupNames = [];
    questions.forEach(function (question) {
      var group = prefix + "-" + question.key;
      groupNames.push(group);
      var block = make(api, doc, "div", {});
      block.appendChild(make(api, doc, "p", { className: "pqcd-note" }, [question.text]));
      var choices = make(api, doc, "div", { className: "pqcd-choices" });
      question.options.forEach(function (option) {
        var radio = make(api, doc, "input", { type: "radio", name: group, value: option[0] });
        radio.addEventListener("change", function () { state.predictions[question.key] = option[0]; });
        choices.appendChild(make(api, doc, "label", { className: "pqcd-choice" }, [radio, make(api, doc, "span", {}, [option[1]])]));
      });
      block.appendChild(choices);
      form.appendChild(block);
    });
    var actions = make(api, doc, "div", { className: "pqcd-actions" });
    var reveal = make(api, doc, "button", { type: "button", className: "pqcd-primary" }, ["核对预测并揭晓"]);
    var reset = make(api, doc, "button", { type: "button" }, ["重置预测"]);
    actions.appendChild(reveal);
    actions.appendChild(reset);
    refs.feedback = make(api, doc, "p", { className: "pqcd-feedback", "aria-live": "polite", "aria-atomic": "true" }, []);
    var shell = make(api, doc, "div", { hidden: true });
    var controls = make(api, doc, "div", { className: "pqcd-controls" });
    var preset = make(api, doc, "select", { "aria-label": "QCD 预设" });
    PRESETS.forEach(function (item) { preset.appendChild(make(api, doc, "option", { value: item.id }, [item.label])); });
    var lambdaInput = make(api, doc, "input", { type: "number", min: "0.05", max: "1", step: "0.01", value: "0.25", "aria-label": "ΛQCD 尺度 / GeV" });
    var nfInput = make(api, doc, "input", { type: "range", min: "0", max: "16", step: "1", value: "5", "aria-label": "活跃夸克味数 nf" });
    var nfOutput = make(api, doc, "output", { className: "pqcd-output", for: prefix + "-nf" }, ["5"]);
    nfInput.id = prefix + "-nf";
    var qInput = make(api, doc, "input", { type: "range", min: "0.1", max: "1000", step: "0.1", value: "2", "aria-label": "能标 Q / GeV" });
    var qOutput = make(api, doc, "output", { className: "pqcd-output", for: prefix + "-q" }, ["2 GeV"]);
    qInput.id = prefix + "-q";
    controls.appendChild(make(api, doc, "div", { className: "pqcd-field" }, [make(api, doc, "label", { htmlFor: prefix + "-preset" }, ["教学预设"]), preset]));
    preset.id = prefix + "-preset";
    controls.appendChild(make(api, doc, "div", { className: "pqcd-field" }, [make(api, doc, "label", { htmlFor: prefix + "-lambda" }, ["ΛQCD 尺度 / GeV"]), lambdaInput]));
    lambdaInput.id = prefix + "-lambda";
    controls.appendChild(make(api, doc, "div", { className: "pqcd-field" }, [make(api, doc, "label", { htmlFor: prefix + "-nf" }, ["活跃夸克味数 nf：", nfOutput]), nfInput]));
    controls.appendChild(make(api, doc, "div", { className: "pqcd-field" }, [make(api, doc, "label", { htmlFor: prefix + "-q" }, ["能标 Q：", qOutput]), qInput]));
    controls.appendChild(make(api, doc, "p", { className: "pqcd-note" }, ["nf 固定只是教学近似；跨越夸克质量阈值时，真实 running 需要匹配不同有效理论。"]));
    var stage = make(api, doc, "div", {});
    var frame = make(api, doc, "div", { className: "pqcd-frame" });
    var chart = doc.createElementNS(SVG_NS, "svg");
    chart.setAttribute("class", "pqcd-svg");
    frame.appendChild(chart);
    stage.appendChild(frame);
    var metrics = make(api, doc, "div", { className: "pqcd-metrics" });
    var tableWrap = make(api, doc, "div", { className: "pqcd-table-wrap" });
    var interpretation = make(api, doc, "p", { className: "pqcd-interpretation", "aria-live": "polite" }, []);
    stage.appendChild(metrics);
    stage.appendChild(tableWrap);
    stage.appendChild(interpretation);
    var layout = make(api, doc, "div", { className: "pqcd-layout" }, [controls, stage]);
    shell.appendChild(layout);
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
      state.lambda = selected.lambda;
      state.nf = selected.nf;
      state.q = selected.q;
    }

    function renderLedger(result) {
      replaceChildren(tableWrap, [], doc);
      var table = make(api, doc, "table", { className: "pqcd-table" });
      table.appendChild(make(api, doc, "caption", {}, ["计算账本：观测输入、模型输出与适用边界"]));
      table.appendChild(make(api, doc, "thead", {}, [make(api, doc, "tr", {}, [make(api, doc, "th", { scope: "col" }, ["量"]), make(api, doc, "th", { scope: "col" }, ["数值"]), make(api, doc, "th", { scope: "col" }, ["解释"])])]));
      var body = make(api, doc, "tbody");
      var rows = [
        ["Q", format(state.q, state.q < 10 ? 2 : 1) + " GeV", "实验者选择的能标"],
        ["ΛQCD", format(state.lambda, 2) + " GeV", "模型的尺度参数，不是无条件常数"],
        ["nf", String(state.nf), "固定有效理论中的活跃味数"],
        ["β0", format(result.beta0, 4), "β0>0 给出一圈渐近自由趋势"],
        ["αs(Q)", result.ok ? format(result.alpha, 4) : "—", result.ok ? "模型数值；不是直接观测" : "—"],
        ["状态", result.ok ? (result.perturbativeCandidate ? "可作微扰候选" : "强耦合警示") : result.status, result.ok ? result.warning : result.message]
      ];
      rows.forEach(function (row) {
        body.appendChild(make(api, doc, "tr", {}, row.map(function (value) { return make(api, doc, "td", {}, [value]); })));
      });
      table.appendChild(body);
      tableWrap.appendChild(table);
    }

    function render() {
      preset.value = state.presetId;
      lambdaInput.value = String(state.lambda);
      nfInput.value = String(state.nf);
      nfOutput.textContent = String(state.nf);
      qInput.value = String(state.q);
      qOutput.textContent = format(state.q, state.q < 10 ? 2 : 1) + " GeV";
      shell.hidden = !state.revealed;
      if (!state.revealed) return;
      var result = analyze({ q: state.q, lambda: state.lambda, nf: state.nf });
      if (!result.ok && result.status === "invalid-input") {
        replaceChildren(chart, [], doc);
        replaceChildren(metrics, [], doc);
        replaceChildren(tableWrap, [], doc);
        replaceChildren(interpretation, ["模型停止：" + result.message], doc);
        interpretation.className = "pqcd-interpretation pqcd-warn";
        return;
      }
      drawChart(doc, chart, { q: state.q, lambda: state.lambda, nf: state.nf }, result);
      replaceChildren(metrics, [metric(api, doc, "Q / GeV"), metric(api, doc, "β0"), metric(api, doc, "αs(Q)"), metric(api, doc, "Q/Λ")], doc);
      var values = [format(state.q, state.q < 10 ? 2 : 1), format(result.beta0, 3), result.ok ? format(result.alpha, 4) : "—", format(result.relativeScale, 2)];
      metrics.querySelectorAll("strong").forEach(function (node, index) { node.textContent = values[index]; });
      renderLedger(result);
      interpretation.textContent = result.ok ? "模型判断：" + (result.perturbativeCandidate ? "当前 αs<1，至少可以把微扰展开作为候选工具。" : "当前 αs 已不小，低能非微扰动力学不能被这条曲线替代。") + " 这是由一圈公式得到的推断；喷注、强子谱等才是实验输入。" : "模型停止：" + result.message + " 这里的空白是适用范围的诚实标记，不是 αs=0。";
      interpretation.className = "pqcd-interpretation " + (result.ok && result.perturbativeCandidate ? "pqcd-pass" : "pqcd-warn");
    }

    preset.addEventListener("change", function () { applyPreset(preset.value); render(); });
    lambdaInput.addEventListener("input", function () { state.lambda = Number(lambdaInput.value); state.presetId = "custom"; render(); });
    nfInput.addEventListener("input", function () { state.nf = Number(nfInput.value); state.presetId = "custom"; render(); });
    qInput.addEventListener("input", function () { state.q = Number(qInput.value); state.presetId = "custom"; render(); });
    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        state.feedback = "请先完成全部预测，再揭晓。";
        refs.feedback.textContent = state.feedback;
        refs.feedback.className = "pqcd-feedback pqcd-warn";
        announce(api, root, state.feedback);
        return;
      }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + questions.length + " 命中。现在可改变 Q、ΛQCD 和 nf，观察模型边界。";
      refs.feedback.textContent = state.feedback;
      refs.feedback.className = "pqcd-feedback " + (correct === questions.length ? "pqcd-pass" : "pqcd-warn");
      render();
      announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () {
      state.presetId = "reference";
      state.lambda = 0.25;
      state.nf = 5;
      state.q = 2;
      state.revealed = false;
      state.predictions = {};
      form.querySelectorAll("input[type=radio]").forEach(function (radio) { radio.checked = false; });
      refs.feedback.textContent = "";
      render();
      announce(api, root, "QCD running 预测已重置。");
    });
    render();
  }

  return {
    PRESETS: PRESETS,
    beta0: beta0,
    normalize: normalize,
    alphaS: alphaS,
    analyze: analyze,
    runningCurve: runningCurve,
    mount: mount,
    selfTest: selfTest
  };
});
