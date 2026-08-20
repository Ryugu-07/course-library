(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("pac-sample-complexity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("pac-sample-complexity self-test: PASS (" + report.checks + " checks, " + report.hypotheses + " hypotheses)");
    } catch (error) {
      console.error("pac-sample-complexity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var SAMPLE_X = [0, 5, 7, 12, 14, 19, 3, 8, 11, 16, 1, 4, 6, 9, 10, 13, 15, 17, 18, 2];

  function targetLabel(x) {
    return x % 4 === 0 || x === 7 || x === 14 ? 1 : 0;
  }

  var DATASET = SAMPLE_X.map(function (x, index) {
    return { id: index + 1, x: x, y: targetLabel(x) };
  });

  var RULES = [
    { id: "zero", label: "h₀：恒 0", predict: function () { return 0; } },
    { id: "one", label: "h₁：恒 1", predict: function () { return 1; } },
    { id: "even", label: "h₂：x 为偶数", predict: function (x) { return x % 2 === 0 ? 1 : 0; } },
    { id: "multiple-four", label: "h₃：4 的倍数", predict: function (x) { return x % 4 === 0 ? 1 : 0; } },
    { id: "lower-half", label: "h₄：x < 10", predict: function (x) { return x < 10 ? 1 : 0; } },
    { id: "upper-half", label: "h₅：x ≥ 10", predict: function (x) { return x >= 10 ? 1 : 0; } },
    { id: "mod-four-half", label: "h₆：x mod 4 < 2", predict: function (x) { return x % 4 < 2 ? 1 : 0; } },
    { id: "multiple-three", label: "h₇：3 的倍数", predict: function (x) { return x % 3 === 0 ? 1 : 0; } }
  ];

  var DEFAULTS = { hypothesisCount: 8, epsilon: 0.20, delta: 0.10, trainCount: 12 };

  var STYLE_TEXT = [
    ".pac-lab{--pac-blue:var(--cl-blue,#315f9d);--pac-green:var(--cl-green,#39734d);--pac-gold:var(--cl-gold,#9b6a12);--pac-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".pac-lab *,.pac-lab *::before,.pac-lab *::after{box-sizing:border-box}.pac-lab [hidden]{display:none!important}.pac-lab h3,.pac-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.pac-lab h3{font-size:1.12rem}.pac-lab h4{font-size:1rem}.pac-lab p{margin:8px 0}.pac-lab .pac-note,.pac-lab .pac-feedback,.pac-lab .pac-detail{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}.pac-lab .pac-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;margin:11px 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.pac-lab .pac-control{display:grid;gap:4px;min-width:0}.pac-lab .pac-control label{font-size:12.5px;font-weight:700;color:var(--fg-soft,var(--muted,#6b6557))}.pac-lab .pac-control output{color:var(--pac-blue);font-variant-numeric:tabular-nums}.pac-lab select,.pac-lab input{font:inherit;min-width:0}.pac-lab select{height:44px;min-height:44px;padding:5px 7px;border:1px solid var(--border,#d7d0c2);border-radius:5px;background:var(--bg,#fff);color:inherit}.pac-lab input[type=range]{display:block;width:100%;height:44px;min-height:44px;margin:0;accent-color:var(--pac-blue)}.pac-lab select:focus-visible,.pac-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pac-lab .pac-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.pac-lab .pac-question{margin:10px 0 0;padding:9px;border:1px solid var(--border,#d7d0c2);min-width:0}.pac-lab .pac-question legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.pac-lab .pac-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pac-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pac-lab button:hover{border-color:var(--pac-blue)}.pac-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pac-lab button[aria-pressed=true],.pac-lab .pac-primary{border-color:var(--pac-blue);background:var(--pac-blue);color:var(--bg,#fff);font-weight:750}.pac-lab .pac-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.pac-lab .pac-actions>*{flex:1 1 160px}.pac-lab .pac-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pac-lab .pac-pass{color:var(--pac-green)}.pac-lab .pac-warn{color:var(--pac-red)}.pac-lab .pac-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.pac-lab .pac-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.pac-lab .pac-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.pac-lab .pac-metric:nth-child(4n+1){border-color:var(--pac-blue)}.pac-lab .pac-metric:nth-child(4n+2){border-color:var(--pac-green)}.pac-lab .pac-metric:nth-child(4n+3){border-color:var(--pac-gold)}.pac-lab .pac-metric:nth-child(4n){border-color:var(--pac-red)}.pac-lab .pac-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.pac-lab .pac-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pac-lab .pac-chart-frame{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.pac-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.pac-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pac-lab .pac-axis{stroke:currentColor;stroke-opacity:.22;stroke-width:1}.pac-lab .pac-bar-eps{fill:var(--pac-gold)}.pac-lab .pac-bar-train{fill:var(--pac-blue)}.pac-lab .pac-bar-test{fill:var(--pac-red)}.pac-lab .pac-small-label{font-size:10px;fill:var(--fg-soft,var(--muted,#6b6557))}.pac-lab .pac-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.pac-lab table{width:100%;min-width:670px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pac-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.pac-lab th,.pac-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.pac-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.pac-lab .pac-ledger-note{margin-top:12px;padding:9px 11px;border-left:3px solid var(--pac-gold);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;line-height:1.65}",
    "@media(max-width:900px){.pac-lab .pac-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pac-lab .pac-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:600px){.pac-lab .pac-choice-row{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:420px){.pac-lab .pac-controls,.pac-lab .pac-metrics{grid-template-columns:minmax(0,1fr)}.pac-lab .pac-predict{padding:9px}.pac-lab .pac-chart-frame{padding:4px}.pac-lab table{font-size:11.5px}.pac-lab th,.pac-lab td{padding-left:5px;padding-right:5px}}",
    "@media(prefers-reduced-motion:reduce){.pac-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalizeConfig(input) {
    var source = input || DEFAULTS;
    var hypothesisCount = Math.round(Number(source.hypothesisCount));
    var epsilon = Number(source.epsilon);
    var delta = Number(source.delta);
    var trainCount = Math.round(Number(source.trainCount));
    return {
      hypothesisCount: clamp(Number.isFinite(hypothesisCount) ? hypothesisCount : DEFAULTS.hypothesisCount, 1, RULES.length),
      epsilon: clamp(Number.isFinite(epsilon) ? epsilon : DEFAULTS.epsilon, 1e-6, 1),
      delta: clamp(Number.isFinite(delta) ? delta : DEFAULTS.delta, 1e-9, 1 - 1e-9),
      trainCount: clamp(Number.isFinite(trainCount) ? trainCount : DEFAULTS.trainCount, 1, DATASET.length - 1)
    };
  }

  function sampleComplexityRealizable(hypothesisCount, epsilon, delta) {
    return Math.ceil(Math.log(hypothesisCount / delta) / epsilon);
  }

  function sampleComplexityAgnostic(hypothesisCount, epsilon, delta) {
    return Math.ceil(2 * Math.log((2 * hypothesisCount) / delta) / (epsilon * epsilon));
  }

  function unionBoundFailureRealizable(hypothesisCount, sampleCount, epsilon) {
    return Math.min(1, hypothesisCount * Math.exp(-sampleCount * epsilon));
  }

  function unionBoundFailureAgnostic(hypothesisCount, sampleCount, epsilon) {
    return Math.min(1, 2 * hypothesisCount * Math.exp(-sampleCount * epsilon * epsilon / 2));
  }

  function selectHypotheses(count) {
    return RULES.slice(0, count);
  }

  function empiricalError(hypothesis, examples) {
    if (!examples.length) return 0;
    var errors = examples.reduce(function (total, example) {
      return total + (hypothesis.predict(example.x) === example.y ? 0 : 1);
    }, 0);
    return errors / examples.length;
  }

  function errorRows(hypotheses, examples) {
    return hypotheses.map(function (hypothesis) {
      var errors = examples.reduce(function (total, example) {
        return total + (hypothesis.predict(example.x) === example.y ? 0 : 1);
      }, 0);
      return { id: hypothesis.id, label: hypothesis.label, errors: errors, count: examples.length, error: examples.length ? errors / examples.length : 0 };
    });
  }

  function ermAudit(hypothesisCount, trainCount) {
    var config = normalizeConfig({ hypothesisCount: hypothesisCount, trainCount: trainCount });
    var hypotheses = selectHypotheses(config.hypothesisCount);
    var train = DATASET.slice(0, config.trainCount);
    var test = DATASET.slice(config.trainCount);
    var trainRows = errorRows(hypotheses, train);
    var testRows = errorRows(hypotheses, test);
    var selectedIndex = 0;
    trainRows.forEach(function (row, index) {
      if (row.error < trainRows[selectedIndex].error) selectedIndex = index;
    });
    return {
      hypotheses: hypotheses,
      train: train,
      test: test,
      trainRows: trainRows,
      testRows: testRows,
      selected: hypotheses[selectedIndex],
      selectedIndex: selectedIndex,
      trainError: trainRows[selectedIndex].error,
      testError: testRows[selectedIndex].error,
      trainErrors: trainRows[selectedIndex].errors,
      testErrors: testRows[selectedIndex].errors
    };
  }

  function analyze(input) {
    var config = normalizeConfig(input);
    var audit = ermAudit(config.hypothesisCount, config.trainCount);
    return {
      hypothesisCount: config.hypothesisCount,
      epsilon: config.epsilon,
      delta: config.delta,
      trainCount: config.trainCount,
      testCount: DATASET.length - config.trainCount,
      realizable: {
        sampleComplexity: sampleComplexityRealizable(config.hypothesisCount, config.epsilon, config.delta),
        failureBound: unionBoundFailureRealizable(config.hypothesisCount, config.trainCount, config.epsilon)
      },
      agnostic: {
        sampleComplexity: sampleComplexityAgnostic(config.hypothesisCount, config.epsilon, config.delta),
        failureBound: unionBoundFailureAgnostic(config.hypothesisCount, config.trainCount, config.epsilon)
      },
      audit: audit
    };
  }

  function near(first, second, tolerance) {
    return Math.abs(first - second) <= (tolerance || 1e-9) * Math.max(1, Math.abs(first), Math.abs(second));
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var defaultResult = analyze(DEFAULTS);
    check(DATASET.length === 20, "fixed realized dataset length");
    check(RULES.length === 8, "finite hypothesis class length");
    check(defaultResult.realizable.sampleComplexity === 22, "realizable default sample complexity");
    check(defaultResult.agnostic.sampleComplexity === 254, "agnostic default sample complexity");
    check(defaultResult.realizable.sampleComplexity < defaultResult.agnostic.sampleComplexity, "agnostic bound is more expensive");
    check(unionBoundFailureRealizable(8, 12, 0.2) < 1, "realizable failure bound is clipped correctly");
    check(unionBoundFailureRealizable(8, 20, 0.2) < unionBoundFailureRealizable(8, 12, 0.2), "realizable bound decreases with samples");
    check(near(defaultResult.audit.train.length / DATASET.length, 0.6), "default train split");
    check(defaultResult.audit.selectedIndex >= 0 && defaultResult.audit.selectedIndex < 8, "ERM selects a finite hypothesis");
    check(defaultResult.audit.trainError >= 0 && defaultResult.audit.trainError <= 1, "realized train error range");
    check(defaultResult.audit.testError >= 0 && defaultResult.audit.testError <= 1, "realized test error range");
    defaultResult.audit.trainRows.forEach(function (row) { check(row.count === 12, row.id + " train row count"); });
    defaultResult.audit.testRows.forEach(function (row) { check(row.count === 8, row.id + " test row count"); });
    check(sampleComplexityRealizable(2, 0.5, 0.5) === 3, "small realizable formula");
    check(sampleComplexityAgnostic(2, 0.5, 0.5) === 17, "small agnostic formula");
    check(empiricalError(RULES[0], [{ x: 0, y: 0 }, { x: 1, y: 1 }]) === 0.5, "empirical error");
    return { checks: checks, hypotheses: RULES.length };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = String(value);
      else if (key === "className") node.className = String(value);
      else if (key === "htmlFor") node.htmlFor = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgNode(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    var places = digits === undefined ? 3 : digits;
    if (!Number.isFinite(value)) return "-";
    if (Math.abs(value) < 1e-4 && value !== 0) return value.toExponential(places);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label, value) {
    var box = element(doc, "div", { className: "pac-metric" });
    box.appendChild(element(doc, "span", { text: label }));
    box.appendChild(element(doc, "strong", { text: value }));
    return box;
  }

  function errorChart(doc, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 640 220", role: "img", "aria-label": "目标 epsilon、一次训练误差和一次测试误差比较" });
    svg.appendChild(svgNode(doc, "title", {}, "理论 epsilon 与 realized train/test error 的分账"));
    var rows = [
      { label: "epsilon", value: result.epsilon, className: "pac-bar-eps" },
      { label: "train error", value: result.audit.trainError, className: "pac-bar-train" },
      { label: "test error", value: result.audit.testError, className: "pac-bar-test" }
    ];
    var left = 126, width = 450;
    [0, 0.5, 1].forEach(function (value) {
      var x = left + width * value;
      svg.appendChild(svgNode(doc, "line", { x1: x, y1: 26, x2: x, y2: 184, class: "pac-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: 204, "text-anchor": "middle", class: "pac-small-label" }, format(value, 1)));
    });
    rows.forEach(function (row, index) {
      var y = 53 + index * 48;
      svg.appendChild(svgNode(doc, "text", { x: 8, y: y + 5, class: "pac-small-label" }, row.label));
      svg.appendChild(svgNode(doc, "rect", { x: left, y: y - 12, width: Math.max(1, width * row.value), height: 18, class: row.className }));
      svg.appendChild(svgNode(doc, "text", { x: left + width * row.value + 7, y: y + 3, class: "pac-small-label" }, format(row.value, 3)));
    });
    return svg;
  }

  function table(doc, caption, headers, rows) {
    var wrap = element(doc, "div", { className: "pac-table-wrap" });
    var node = element(doc, "table", {});
    node.appendChild(element(doc, "caption", { text: caption }));
    var head = element(doc, "thead", {}), headRow = element(doc, "tr", {});
    headers.forEach(function (header) { headRow.appendChild(element(doc, "th", { scope: "col", text: header })); });
    head.appendChild(headRow); node.appendChild(head);
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (cell) { tr.appendChild(element(doc, "td", { text: cell })); });
      body.appendChild(tr);
    });
    node.appendChild(body); wrap.appendChild(node); return wrap;
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    if (!doc.getElementById("pac-sample-complexity-styles")) {
      var style = element(doc, "style", { id: "pac-sample-complexity-styles", text: STYLE_TEXT });
      (doc.head || doc.documentElement).appendChild(style);
    }
    INSTANCE += 1;
    var uid = "pac-" + INSTANCE;
    var state = { hypothesisCount: DEFAULTS.hypothesisCount, epsilon: DEFAULTS.epsilon, delta: DEFAULTS.delta, trainCount: DEFAULTS.trainCount, predictions: {}, revealed: false };
    var shell = element(doc, "div", { className: "pac-shell" });
    shell.appendChild(element(doc, "p", { className: "pac-note", text: "蓝色/绿色是定理或上界账，红色/蓝色 error 是同一份固定数据上的一次 realized ERM 观测；两者始终分栏。" }));
    var controls = element(doc, "div", { className: "pac-controls", "aria-label": "PAC 参数控制" });
    var hypothesisSelect = element(doc, "select", { id: uid + "-h", "aria-label": "有限假设类大小" });
    [2, 4, 6, 8].forEach(function (count) { hypothesisSelect.appendChild(element(doc, "option", { value: count, text: "H=" + count })); });
    var hControl = element(doc, "div", { className: "pac-control" }); hControl.appendChild(element(doc, "label", { htmlFor: uid + "-h", text: "有限类大小 H" })); hControl.appendChild(hypothesisSelect); controls.appendChild(hControl);
    function rangeControl(key, labelText, min, max, step, digits, suffix) {
      var input = element(doc, "input", { id: uid + "-" + key, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": labelText });
      var output = element(doc, "output", { for: uid + "-" + key, text: "" });
      var label = element(doc, "label", { htmlFor: uid + "-" + key }, [labelText + " = ", output]);
      var box = element(doc, "div", { className: "pac-control" }); box.appendChild(label); box.appendChild(input);
      input.addEventListener("input", function () { state[key] = Number(input.value); state.revealed = false; renderControls(); renderStatus(); });
      return { box: box, input: input, output: output, digits: digits, suffix: suffix || "" };
    }
    var epsilonControl = rangeControl("epsilon", "精度 ε", 0.05, 0.5, 0.05, 2, "");
    var deltaControl = rangeControl("delta", "失败概率 δ", 0.01, 0.30, 0.01, 2, "");
    var trainControl = rangeControl("trainCount", "训练样本 m", 4, 19, 1, 0, "");
    controls.appendChild(epsilonControl.box); controls.appendChild(deltaControl.box); controls.appendChild(trainControl.box); shell.appendChild(controls);
    hypothesisSelect.addEventListener("change", function () { state.hypothesisCount = Number(hypothesisSelect.value); state.revealed = false; renderControls(); renderStatus(); });

    var questions = [
      { id: "rate", label: "可实现 / 不可知样本复杂度的 ε 代价？", choices: [["one-vs-two", "1/ε vs 1/ε²"], ["same", "两者相同"]] },
      { id: "count", label: "H 加倍时，有限类公式怎样变化？", choices: [["log", "只加一个 ln H 项"], ["linear", "整体线性加倍"]] },
      { id: "realized", label: "一次 test error 在账本中是什么？", choices: [["observation", "一次 realized observation"], ["guarantee", "PAC 上界本身"]] }
    ];
    var prediction = element(doc, "section", { className: "pac-predict", "aria-labelledby": uid + "-predict-title" });
    prediction.appendChild(element(doc, "h4", { id: uid + "-predict-title", text: "先预测三件事，再揭示两本账" }));
    var questionButtons = {};
    questions.forEach(function (question) {
      var fieldset = element(doc, "fieldset", { className: "pac-question" }); fieldset.appendChild(element(doc, "legend", { text: question.label }));
      var choices = element(doc, "div", { className: "pac-choice-row" }); questionButtons[question.id] = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () { state.predictions[question.id] = choice[0]; state.revealed = false; renderPrediction(); renderStatus(); });
        questionButtons[question.id].push({ value: choice[0], node: button }); choices.appendChild(button);
      });
      fieldset.appendChild(choices); prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "pac-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pac-primary", text: "揭示并核对" });
    var reset = element(doc, "button", { type: "button", text: "重置预测" }); actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "pac-feedback", "aria-live": "polite", text: "每题先作一个预测。" }); prediction.appendChild(feedback); shell.appendChild(prediction);

    var results = element(doc, "section", { className: "pac-results", hidden: true, "aria-labelledby": uid + "-results-title" });
    results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "PAC theorem ledger / realized data ledger" }));
    var metrics = element(doc, "div", { className: "pac-metrics" }); results.appendChild(metrics);
    var chartFrame = element(doc, "div", { className: "pac-chart-frame" }); results.appendChild(chartFrame);
    var theoremHost = element(doc, "div", {}); var errorHost = element(doc, "div", {}); results.appendChild(theoremHost); results.appendChild(errorHost);
    results.appendChild(element(doc, "p", { className: "pac-ledger-note", text: "定理项只在对应 realizable/agnostic、i.i.d.、有限类与量词条件下提供概率保证；train/test 两行只描述当前固定 20 点样本和当前 ERM 选择，绝不把一次 realized test error 写成预测或上界。" }));
    shell.appendChild(results); root.classList.add("pac-lab"); clear(root); root.appendChild(shell);

    function announce(message) {
      feedback.textContent = message;
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function renderControls() {
      hypothesisSelect.value = String(state.hypothesisCount);
      [epsilonControl, deltaControl, trainControl].forEach(function (control) {
        var key = control.input.id.slice((uid + "-").length);
        control.input.value = String(state[key]);
        control.output.textContent = format(state[key], control.digits) + control.suffix;
      });
    }

    function renderPrediction() {
      questions.forEach(function (question) {
        questionButtons[question.id].forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[question.id] === item.value ? "true" : "false"); });
      });
    }

    function renderStatus() {
      var count = Object.keys(state.predictions).length;
      feedback.className = "pac-feedback";
      if (!state.revealed) feedback.textContent = count === 3 ? "三项预测已记录，点击“揭示并核对”。" : "已记录 " + count + "/3 项预测。";
    }

    function render() {
      renderControls(); renderPrediction(); renderStatus();
      if (!state.revealed) { results.hidden = true; return; }
      var result = analyze(state);
      var expected = { rate: "one-vs-two", count: "log", realized: "observation" };
      var correct = questions.every(function (question) { return state.predictions[question.id] === expected[question.id]; });
      feedback.className = "pac-feedback " + (correct ? "pac-pass" : "pac-warn");
      feedback.textContent = (correct ? "三项预测都命中。" : "预测已揭示，请按量词和分账复盘。") + " ERM 选择了 " + result.audit.selected.label + "。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      results.hidden = false;
      metrics.replaceChildren(
        metric(doc, "H", String(result.hypothesisCount)),
        metric(doc, "ε / δ", format(result.epsilon, 2) + " / " + format(result.delta, 2)),
        metric(doc, "训练 m", String(result.trainCount)),
        metric(doc, "测试数", String(result.testCount)),
        metric(doc, "realizable m(ε,δ)", String(result.realizable.sampleComplexity)),
        metric(doc, "agnostic m(ε,δ)", String(result.agnostic.sampleComplexity)),
        metric(doc, "realizable failure bound", format(result.realizable.failureBound, 3)),
        metric(doc, "agnostic failure bound", format(result.agnostic.failureBound, 3))
      );
      clear(chartFrame); chartFrame.appendChild(errorChart(doc, result));
      clear(theoremHost);
      theoremHost.appendChild(table(doc, "定理账本：上界与当前 m 的关系", ["情形", "样本复杂度上界", "union-bound failure 形式", "当前 m"], [
        ["realizable", String(result.realizable.sampleComplexity), "min(1, H exp(-mε)) = " + format(result.realizable.failureBound, 4), result.trainCount + (result.trainCount >= result.realizable.sampleComplexity ? " ≥ bound" : " < bound")],
        ["agnostic", String(result.agnostic.sampleComplexity), "min(1, 2H exp(-mε²/2)) = " + format(result.agnostic.failureBound, 4), result.trainCount + (result.trainCount >= result.agnostic.sampleComplexity ? " ≥ bound" : " < bound")]
      ]));
      clear(errorHost);
      var errorRowsForTable = result.audit.hypotheses.map(function (hypothesis, index) {
        return [hypothesis.label, String(result.audit.trainRows[index].errors) + "/" + result.trainCount, format(result.audit.trainRows[index].error, 3), String(result.audit.testRows[index].errors) + "/" + result.testCount, format(result.audit.testRows[index].error, 3), hypothesis.id === result.audit.selected.id ? "ERM 选中" : ""];
      });
      errorHost.appendChild(table(doc, "一次 realized train/test error 账本（只对当前固定数据负责）", ["假设", "train 错误", "train error", "test 错误", "test error", "选择"], errorRowsForTable));
      announce(feedback.textContent);
    }

    reveal.addEventListener("click", function () {
      if (Object.keys(state.predictions).length !== questions.length) {
        feedback.className = "pac-feedback pac-warn"; feedback.textContent = "请先完成三项预测，再揭示两本账。"; return;
      }
      state.revealed = true; render();
    });
    reset.addEventListener("click", function () { state.predictions = {}; state.revealed = false; render(); });
    render();
  }

  return {
    DATASET: DATASET,
    RULES: RULES,
    DEFAULTS: DEFAULTS,
    targetLabel: targetLabel,
    normalizeConfig: normalizeConfig,
    sampleComplexityRealizable: sampleComplexityRealizable,
    sampleComplexityAgnostic: sampleComplexityAgnostic,
    unionBoundFailureRealizable: unionBoundFailureRealizable,
    unionBoundFailureAgnostic: unionBoundFailureAgnostic,
    empiricalError: empiricalError,
    ermAudit: ermAudit,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
