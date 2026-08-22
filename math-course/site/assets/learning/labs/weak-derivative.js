(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("weak-derivative", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("weak-derivative self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("weak-derivative self-test: FAIL", error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "weak-derivative-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  function bump(x) {
    if (Math.abs(x) >= 1) return 0;
    return Math.exp(-1 / (1 - x * x));
  }
  function bumpPrime(x) {
    if (Math.abs(x) >= 1) return 0;
    return bump(x) * (-2 * x / Math.pow(1 - x * x, 2));
  }
  var TESTS = [
    {
      id: "even-bump",
      label: "偶对称 bump",
      phi: function (x) { return bump(x) * Math.cos(Math.PI * x / 2); },
      dphi: function (x) { return bumpPrime(x) * Math.cos(Math.PI * x / 2) - bump(x) * Math.PI / 2 * Math.sin(Math.PI * x / 2); }
    },
    {
      id: "tilted-bump",
      label: "倾斜 bump",
      phi: function (x) { return bump(x) * (1 + 0.35 * x); },
      dphi: function (x) { return bumpPrime(x) * (1 + 0.35 * x) + 0.35 * bump(x); }
    }
  ];
  var PRESETS = [
    {
      id: "abs",
      label: "|x|",
      kind: "continuous-corner",
      u: function (x) { return Math.abs(x); },
      regularDerivative: function (x) { return x < 0 ? -1 : x > 0 ? 1 : 0; },
      jumps: [],
      note: "连续但在 0 有折角；D|x|=sign(x)，没有 delta 跳跃项。"
    },
    {
      id: "heaviside",
      label: "H(x)",
      kind: "jump",
      u: function (x) { return x > 0 ? 1 : 0; },
      regularDerivative: function () { return 0; },
      jumps: [{ location: 0, size: 1 }],
      note: "H 从 0 跳到 1；DH=δ₀，经典导数部分为 0。"
    },
    {
      id: "ramp-jump",
      label: "x+H(x)",
      kind: "jump-with-slope",
      u: function (x) { return x + (x > 0 ? 1 : 0); },
      regularDerivative: function () { return 1; },
      jumps: [{ location: 0, size: 1 }],
      note: "平滑部分导数为 1，跳跃边界再贡献 δ₀；D(x+H)=1+δ₀。"
    }
  ];
  var STYLE_TEXT = [
    ".wd-lab{--wd-blue:var(--cl-blue,#315f9d);--wd-gold:var(--cl-gold,#9b6a12);--wd-green:var(--cl-green,#39734d);--wd-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".wd-lab *,.wd-lab *::before,.wd-lab *::after{box-sizing:border-box}.wd-lab [hidden]{display:none!important}.wd-lab h3,.wd-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.wd-lab h3{font-size:1.16rem}.wd-lab p{margin:8px 0}.wd-lab .wd-note,.wd-lab .wd-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".wd-lab button,.wd-lab input{font:inherit}.wd-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.wd-lab button:hover{border-color:var(--wd-blue)}.wd-lab button:focus-visible,.wd-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.wd-lab button[aria-pressed=true],.wd-lab button.wd-primary{border-color:var(--wd-blue);background:var(--wd-blue);color:#fff;font-weight:750}.wd-lab .wd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.wd-lab .wd-actions>*{flex:1 1 180px}",
    ".wd-lab .wd-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--wd-gold);background:var(--block-bg,var(--bg,#fff))}.wd-lab .wd-prediction-title{display:block;margin-bottom:9px;font-size:13px}.wd-lab fieldset{min-width:0;margin:9px 0;padding:9px 10px;border:1px solid var(--border,#d7d0c2)}.wd-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.wd-lab .wd-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.wd-lab .wd-choice-grid button{font-size:12px}.wd-lab .wd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.wd-lab .wd-pass{color:var(--wd-green)}.wd-lab .wd-warn{color:var(--wd-red)}",
    ".wd-lab .wd-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.wd-lab .wd-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.wd-lab .wd-presets button{font-size:12px}.wd-lab .wd-controls{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(220px,1fr);gap:12px;align-items:end;margin:12px 0}.wd-lab .wd-control{display:grid;gap:5px;min-width:0}.wd-lab .wd-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.wd-lab .wd-control output{color:var(--wd-blue);font-variant-numeric:tabular-nums}.wd-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0;accent-color:var(--wd-blue)}",
    ".wd-lab .wd-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.wd-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.wd-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.wd-lab .wd-axis{stroke:currentColor;stroke-width:1;stroke-opacity:.6}.wd-lab .wd-u{fill:none;stroke:var(--wd-blue);stroke-width:2.5}.wd-lab .wd-v{fill:none;stroke:var(--wd-red);stroke-width:2.3;stroke-dasharray:6 4}.wd-lab .wd-phi{fill:none;stroke:var(--wd-gold);stroke-width:2}.wd-lab .wd-jump{stroke:var(--wd-green);stroke-width:2;stroke-dasharray:4 4}.wd-lab .wd-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}.wd-lab .wd-title{font-size:13px;font-weight:750}",
    ".wd-lab .wd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}.wd-lab .wd-metric{min-width:0;padding:8px;border-top:2px solid var(--wd-blue);background:var(--block-bg,var(--bg,#fff))}.wd-lab .wd-metric:nth-child(2){border-color:var(--wd-red)}.wd-lab .wd-metric:nth-child(3){border-color:var(--wd-green)}.wd-lab .wd-metric:nth-child(4){border-color:var(--wd-gold)}.wd-lab .wd-metric span,.wd-lab .wd-metric small{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.wd-lab .wd-metric strong{display:block;margin:2px 0;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".wd-lab .wd-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.wd-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.wd-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.wd-lab th,.wd-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.wd-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.wd-lab .wd-interpretation{margin-top:11px;padding:10px 12px;border-left:3px solid var(--wd-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}",
    "@media(max-width:850px){.wd-lab .wd-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.wd-lab .wd-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wd-lab .wd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.wd-lab .wd-presets,.wd-lab .wd-choice-grid,.wd-lab .wd-controls{grid-template-columns:minmax(0,1fr)}.wd-lab .wd-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.wd-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }
  function formatNumber(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    return PRESETS[0];
  }
  function testById(id) {
    for (var i = 0; i < TESTS.length; i += 1) if (TESTS[i].id === id) return TESTS[i];
    return TESTS[0];
  }
  function integrate(fn, left, right, steps) {
    var n = Math.max(2, Math.floor(Number(steps) || 1000));
    if (n % 2) n += 1;
    var h = (right - left) / n;
    var sum = fn(left) + fn(right);
    for (var i = 1; i < n; i += 1) sum += (i % 2 ? 4 : 2) * fn(left + i * h);
    return sum * h / 3;
  }
  function integrateAcrossBreaks(fn, breaks, steps) {
    var total = 0;
    var perInterval = Math.max(2, Math.floor((Number(steps) || 1000) / (breaks.length - 1)));
    for (var i = 0; i < breaks.length - 1; i += 1) {
      var left = breaks[i];
      var right = breaks[i + 1];
      var edge = Math.min(Math.abs(right - left) * 1e-6, 1e-8);
      total += integrate(function (x) {
        if (x === left && i > 0) return fn(left + edge);
        if (x === right && i < breaks.length - 2) return fn(right - edge);
        return fn(x);
      }, left, right, perInterval);
    }
    return total;
  }
  function deltaAction(testId) { return testById(testId).phi(0); }
  function approximateDeltaAction(testId, width, steps) {
    var test = testById(testId);
    var epsilon = Math.abs(Number(width));
    if (!finite(epsilon) || epsilon <= 0) epsilon = 0.08;
    return integrate(function (x) { return Math.abs(x) <= epsilon ? test.phi(x) / (2 * epsilon) : 0; }, -epsilon, epsilon, steps || 800);
  }
  function evaluate(input) {
    var source = input || {};
    var model = presetById(source.modelId || source.id);
    var test = testById(source.testId || "even-bump");
    var steps = Math.max(100, Math.floor(Number(source.steps) || 800));
    var breaks = [-1, 0, 1];
    var lhs = integrateAcrossBreaks(function (x) { return model.u(x) * test.dphi(x); }, breaks, steps);
    var regularPairing = integrateAcrossBreaks(function (x) { return model.regularDerivative(x) * test.phi(x); }, breaks, steps);
    var jumpPairing = model.jumps.reduce(function (sum, jump) { return sum + jump.size * test.phi(jump.location); }, 0);
    var rhs = -regularPairing - jumpPairing;
    var naiveRhs = -regularPairing;
    return {
      modelId: model.id,
      testId: test.id,
      steps: steps,
      lhs: lhs,
      regularPairing: regularPairing,
      jumpPairing: jumpPairing,
      rhs: rhs,
      naiveRhs: naiveRhs,
      residual: Math.abs(lhs - rhs),
      naiveResidual: Math.abs(lhs - naiveRhs),
      deltaExact: deltaAction(test.id),
      deltaApprox: approximateDeltaAction(test.id, 0.08, steps),
      note: model.note
    };
  }
  function gridEvidence(modelId, testId) {
    return [200, 800, 1600].map(function (steps) {
      var result = evaluate({ modelId: modelId, testId: testId, steps: steps });
      return { steps: steps, residual: result.residual, naiveResidual: result.naiveResidual };
    });
  }

  function appendChildren(parent, doc, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      parent.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return parent;
  }
  function attrs(node, values) {
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function element(doc, tag, values, children) { return appendChildren(attrs(doc.createElement(tag), values), doc, children); }
  function svgElement(doc, tag, values, children) { return appendChildren(attrs(doc.createElementNS(SVG_NS, tag), values), doc, children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }
  function linePath(points, xMin, xMax, yMin, yMax, left, top, width, height) {
    return points.map(function (point, index) {
      var x = left + (point[0] - xMin) / (xMax - xMin) * width;
      var y = top + (yMax - point[1]) / (yMax - yMin) * height;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }
  function chart(doc, result, prefix) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 300", role: "img", "aria-labelledby": prefix + "-title " + prefix + "-desc" });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-title" }, "弱导数积分分部核对图"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-desc" }, "蓝线是函数 u，红虚线是其经典部分导数，金线是紧支集测试函数，绿虚线标出跳点。"));
    var model = presetById(result.modelId);
    var test = testById(result.testId);
    var left = 48, top = 40, width = 624, height = 205;
    var curve = [], derivative = [], phi = [], values = [];
    for (var i = 0; i <= 100; i += 1) {
      var x = -1 + 2 * i / 100;
      var u = model.u(x);
      var v = model.regularDerivative(x);
      var p = test.phi(x);
      curve.push([x, u]);
      derivative.push([x, v]);
      phi.push([x, p]);
      values.push(u, v, p);
    }
    var yMin = Math.min.apply(null, values) - 0.15;
    var yMax = Math.max.apply(null, values) + 0.15;
    svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: width, height: height, className: "wd-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(curve, -1, 1, yMin, yMax, left, top, width, height), className: "wd-u" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(derivative, -1, 1, yMin, yMax, left, top, width, height), className: "wd-v" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(phi, -1, 1, yMin, yMax, left, top, width, height), className: "wd-phi" }));
    model.jumps.forEach(function (jump) {
      var xJump = left + (jump.location + 1) / 2 * width;
      svg.appendChild(svgElement(doc, "line", { x1: xJump, y1: top, x2: xJump, y2: top + height, className: "wd-jump" }));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top + height / 2, x2: left + width, y2: top + height / 2, className: "wd-axis" }));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 24, className: "wd-title" }, "u、经典部分导数 v、测试函数 φ"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 267, className: "wd-small" }, "绿虚线：跳点；δ 项不由一条离散曲线本身定义"));
    return svg;
  }
  function metric(doc, label, value, note) {
    return element(doc, "div", { className: "wd-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value }), element(doc, "small", { text: note })]);
  }
  function tableFor(doc, result) {
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "对两支紧支集测试函数分别做有限 Simpson 积分；jump 是解析边界项" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["测试函数", "∫uφ'", "-∫vφ", "-Σ jump·φ", "合计 RHS", "残差", "漏掉 jump 的残差"].map(function (text) { return element(doc, "th", { text: text }); }))));
    var body = element(doc, "tbody");
    TESTS.forEach(function (test) {
      var row = evaluate({ modelId: result.modelId, testId: test.id, steps: result.steps });
      body.appendChild(element(doc, "tr", {}, [
        test.label,
        formatNumber(row.lhs, 7),
        formatNumber(-row.regularPairing, 7),
        formatNumber(-row.jumpPairing, 7),
        formatNumber(row.rhs, 7),
        formatNumber(row.residual, 3),
        formatNumber(row.naiveResidual, 5)
      ].map(function (text) { return element(doc, "td", { text: text }); })));
    });
    table.appendChild(body);
    return table;
  }
  function interpretation(result) {
    if (result.modelId === "abs") return "对于 |x|，跳跃项为 0，分部积分把导数完全交给 sign(x)；这说明尖角的一阶弱导数仍是函数。";
    if (result.modelId === "heaviside") return "对于 H，经典部分导数为 0，但 -∫Hφ' 只有加入 -φ(0) 这一 δ 边界配对才闭合。";
    return "对于 x+H，普通斜率 1 与跳点 δ₀ 必须同时入账；少写跳跃项会留下可见残差。";
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-wd-mounted") === "true") return;
    root.setAttribute("data-wd-mounted", "true");
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "wd-" + INSTANCE;
    var state = { modelId: "abs", testId: "even-bump", steps: 800, revealed: false, predictions: [null, null, null] };
    var shell = element(doc, "div", { className: "wd-lab" });
    shell.appendChild(element(doc, "h3", { text: "弱导数：把导数交给测试函数" }));
    shell.appendChild(element(doc, "p", { className: "wd-note", text: "先预测分部积分的符号与跳点项，再揭示解析边界项和固定网格的数值核对。有限网格不是分布恒等式的证明。" }));
    var prediction = element(doc, "div", { className: "wd-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "wd-prediction-title", text: "预测门：完成三项后揭晓" }));
    var questions = [
      { prompt: "1. 弱导数的定义把 ∫uφ' 变成哪一侧？", choices: [["minus", "−〈Du,φ〉"], ["plus", "〈Du,φ〉"], ["point", "只看 φ 的最大值"]], expected: "minus" },
      { prompt: "2. Heaviside H 的分布导数应该记成什么？", choices: [["delta", "δ₀"], ["zero", "0"], ["sign", "sign(x)"]], expected: "delta" },
      { prompt: "3. 有限网格上残差很小，是否独自证明了对所有测试函数的分布恒等式？", choices: [["no", "不是，只是当前模型/网格的数值证据"], ["yes", "是，网格已经覆盖所有函数"], ["only", "只要函数有跳点就是证明"]], expected: "no" }
    ];
    var choices = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: question.prompt }));
      var group = element(doc, "div", { className: "wd-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[questionIndex] = choice[0]; renderPrediction(); });
        choices.push({ index: questionIndex, value: choice[0], node: button });
        group.appendChild(button);
      });
      fieldset.appendChild(group);
      prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "wd-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "wd-primary", text: "核对预测并揭晓" });
    var resetButton = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(revealButton);
    actions.appendChild(resetButton);
    prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "wd-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var reveal = element(doc, "section", { className: "wd-reveal", hidden: true, "aria-label": "弱导数揭晓结果" });
    reveal.appendChild(element(doc, "h4", { text: "函数、测试函数与积分精度" }));
    var presetRow = element(doc, "div", { className: "wd-presets", role: "group", "aria-label": "弱导数函数预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label, "aria-pressed": "false" });
      button.addEventListener("click", function () { state.modelId = preset.id; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    reveal.appendChild(presetRow);
    var controls = element(doc, "div", { className: "wd-controls" });
    var testButtons = [];
    var testGroup = element(doc, "div", { className: "wd-presets", role: "group", "aria-label": "测试函数预设" });
    TESTS.forEach(function (test) {
      var button = element(doc, "button", { type: "button", text: test.label, "aria-pressed": "false" });
      button.addEventListener("click", function () { state.testId = test.id; render(); });
      testButtons.push({ id: test.id, node: button });
      testGroup.appendChild(button);
    });
    controls.appendChild(element(doc, "div", { className: "wd-control" }, [element(doc, "span", { className: "wd-note", text: "测试函数" }), testGroup]));
    var nId = prefix + "-steps";
    var nOutput = element(doc, "output", { for: nId, text: "800" });
    var nLabel = element(doc, "label", { htmlFor: nId });
    nLabel.appendChild(doc.createTextNode("Simpson 子区间数："));
    nLabel.appendChild(nOutput);
    var nInput = element(doc, "input", { id: nId, type: "range", min: "200", max: "1600", step: "200", value: "800", "aria-label": "数值积分子区间数" });
    nInput.addEventListener("input", function () { state.steps = Number(nInput.value); render(); });
    controls.appendChild(element(doc, "div", { className: "wd-control" }, [nLabel, nInput]));
    reveal.appendChild(controls);
    reveal.appendChild(element(doc, "p", { className: "wd-note", text: "δ(φ)=φ(0) 是定义级的精确配对；δε 的 box 近似和 Simpson 残差只作有限数值证据。" }));
    var stage = element(doc, "div", { className: "wd-stage" });
    var metrics = element(doc, "div", { className: "wd-metrics", "aria-label": "弱导数积分读数" });
    var chartHolder = element(doc, "div");
    var tableHolder = element(doc, "div", { className: "wd-table-wrap" });
    var status = element(doc, "p", { className: "wd-interpretation", role: "status", "aria-live": "polite" });
    stage.appendChild(metrics);
    stage.appendChild(chartHolder);
    stage.appendChild(tableHolder);
    stage.appendChild(status);
    reveal.appendChild(stage);
    shell.appendChild(reveal);
    clear(root);
    root.appendChild(shell);

    function announce(message) { if (api && typeof api.announce === "function") api.announce(root, message); }
    function renderPrediction() {
      choices.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.index] === item.value ? "true" : "false"); });
    }
    function render() {
      var result = evaluate(state);
      nInput.value = String(state.steps);
      nOutput.textContent = String(state.steps);
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.modelId ? "true" : "false"); });
      testButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.testId ? "true" : "false"); });
      reveal.hidden = !state.revealed;
      if (!state.revealed) return;
      clear(metrics);
      metrics.appendChild(metric(doc, "∫uφ'", formatNumber(result.lhs, 6), "左侧有限积分"));
      metrics.appendChild(metric(doc, "−∫vφ", formatNumber(-result.regularPairing, 6), "经典部分"));
      metrics.appendChild(metric(doc, "−Σ jump·φ", formatNumber(-result.jumpPairing, 6), "解析 delta 边界项"));
      metrics.appendChild(metric(doc, "δ(φ) / δε(φ)", formatNumber(result.deltaExact, 6) + " / " + formatNumber(result.deltaApprox, 6), "精确配对 / box 证据"));
      clear(chartHolder);
      chartHolder.appendChild(chart(doc, result, prefix));
      clear(tableHolder);
      tableHolder.appendChild(tableFor(doc, result));
      status.textContent = interpretation(result) + " 当前残差=" + formatNumber(result.residual, 3) + "；漏项残差=" + formatNumber(result.naiveResidual, 4) + "。";
    }
    revealButton.addEventListener("click", function () {
      var missing = state.predictions.filter(function (value) { return value === null; }).length;
      if (missing) {
        feedback.className = "wd-feedback wd-warn";
        feedback.textContent = "还差 " + missing + " 项预测。";
        announce(feedback.textContent);
        return;
      }
      var score = questions.reduce(function (sum, question, index) { return sum + (question.expected === state.predictions[index] ? 1 : 0); }, 0);
      state.revealed = true;
      feedback.className = "wd-feedback " + (score === 3 ? "wd-pass" : "wd-warn");
      feedback.textContent = "预测 " + score + "/3。现在分别查看经典配对、delta 跳跃项和有限数值残差。";
      render();
      announce(feedback.textContent);
    });
    resetButton.addEventListener("click", function () {
      state = { modelId: "abs", testId: "even-bump", steps: 800, revealed: false, predictions: [null, null, null] };
      feedback.className = "wd-feedback";
      feedback.textContent = "预测已重置，请重新作答。";
      renderPrediction();
      render();
      announce(feedback.textContent);
    });
    renderPrediction();
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error("weak-derivative self-test: " + message);
    }
    check(near(integrate(function (x) { return x * x; }, -1, 1, 800), 2 / 3, 1e-8), "Simpson integral");
    check(Math.abs(TESTS[0].phi(-1)) < EPS && Math.abs(TESTS[0].phi(1)) < EPS, "compact support endpoints");
    var absEven = evaluate({ modelId: "abs", testId: "even-bump", steps: 800 });
    check(absEven.residual < 1e-7, "absolute value weak identity");
    var heaviside = evaluate({ modelId: "heaviside", testId: "tilted-bump", steps: 800 });
    check(heaviside.jumpPairing > 0 && heaviside.residual < 1e-7, "Heaviside delta identity");
    check(heaviside.naiveResidual > 0.1, "missing delta term is visible");
    var ramp = evaluate({ modelId: "ramp-jump", testId: "tilted-bump", steps: 800 });
    check(ramp.jumpPairing > 0 && ramp.residual < 1e-7, "jump ramp identity");
    check(Math.abs(heaviside.deltaApprox - heaviside.deltaExact) < 0.01, "box delta approximation");
    check(JSON.stringify(gridEvidence("heaviside", "even-bump")) === JSON.stringify(gridEvidence("heaviside", "even-bump")), "deterministic grid evidence");
    PRESETS.forEach(function (preset) { check(evaluate({ modelId: preset.id, testId: "even-bump" }).modelId === preset.id, preset.id + " preset"); });
    return { checks: checks, presets: PRESETS.length, tests: TESTS.length, deterministic: true };
  }
  return {
    PRESETS: PRESETS,
    TESTS: TESTS,
    integrate: integrate,
    approximateDeltaAction: approximateDeltaAction,
    evaluate: evaluate,
    gridEvidence: gridEvidence,
    mount: mount,
    selfTest: selfTest
  };
});
