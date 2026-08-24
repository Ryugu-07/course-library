(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-tolerance-stackup", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-tolerance-stackup self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-tolerance-stackup self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-tolerance-stackup";
  var STYLE_ID = "cl-mech-tolerance-stackup-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { scale: 1, datumOffset: 0 };
  var SPEC = { low: 0.9, high: 1.5 };
  var COMPONENTS = [
    { name: "壳体基准到端面", sign: 1, nominal: 40, tolerance: 0.2 },
    { name: "隔圈", sign: 1, nominal: 5, tolerance: 0.1 },
    { name: "轴肩", sign: -1, nominal: 42.6, tolerance: 0.15 },
    { name: "止推垫", sign: -1, nominal: 1.2, tolerance: 0.05 }
  ];
  var PREDICTIONS = [
    { key: "worst", prompt: "同时放大所有半公差，最坏情况间隙区间会怎样？", expected: "wider", choices: [["wider", "变宽"], ["narrower", "变窄"], ["center", "只改中心"]] },
    { key: "rss", prompt: "独立正态、±值为 3σ 时，RSS 3σ 带宽相对极值法怎样？", expected: "smaller", choices: [["smaller", "更小"], ["larger", "更大"], ["equal", "必然相等"]] },
    { key: "datum", prompt: "共享基准带来相关性时，能否直接把独立 RSS 良率当最终保证？", expected: "no", choices: [["no", "不能"], ["yes", "可以"], ["only-rss", "只要 RSS 小就可以"]] }
  ];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finite(value, label) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function bounded(value, label, low, high) {
    var number = finite(value, label);
    if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]");
    return number;
  }

  function normalizeConfig(input) {
    var source = input || {};
    return {
      scale: bounded(source.scale === undefined ? DEFAULTS.scale : source.scale, "scale", 0.5, 1.5),
      datumOffset: bounded(source.datumOffset === undefined ? DEFAULTS.datumOffset : source.datumOffset, "datumOffset", -0.3, 0.3)
    };
  }

  function erf(value) {
    var sign = value < 0 ? -1 : 1;
    var x = Math.abs(value);
    var t = 1 / (1 + 0.3275911 * x);
    var polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return sign * (1 - polynomial * Math.exp(-x * x));
  }

  function normalCdf(value) {
    if (value === 0) return 0.5;
    return 0.5 * (1 + erf(value / Math.sqrt(2)));
  }

  function model(input) {
    var config = normalizeConfig(input);
    var nominal = config.datumOffset;
    var worstHalf = 0;
    var sumSquares = 0;
    var rows = COMPONENTS.map(function (component) {
      var tolerance = component.tolerance * config.scale;
      var contribution = component.sign * component.nominal;
      nominal += contribution;
      worstHalf += tolerance;
      sumSquares += tolerance * tolerance;
      return {
        name: component.name,
        sign: component.sign,
        nominal: component.nominal,
        tolerance: tolerance,
        contribution: contribution
      };
    });
    var rssThreeSigma = Math.sqrt(sumSquares);
    var sigma = rssThreeSigma / 3;
    var worstMin = nominal - worstHalf;
    var worstMax = nominal + worstHalf;
    var rssMin = nominal - rssThreeSigma;
    var rssMax = nominal + rssThreeSigma;
    var yieldProbability = sigma === 0
      ? (nominal >= SPEC.low && nominal <= SPEC.high ? 1 : 0)
      : normalCdf((SPEC.high - nominal) / sigma) - normalCdf((SPEC.low - nominal) / sigma);
    return {
      config: config,
      rows: rows,
      nominal: nominal,
      worstHalf: worstHalf,
      worstMin: worstMin,
      worstMax: worstMax,
      rssThreeSigma: rssThreeSigma,
      rssMin: rssMin,
      rssMax: rssMax,
      sigma: sigma,
      yieldProbability: yieldProbability,
      worstPass: worstMin >= SPEC.low && worstMax <= SPEC.high,
      rssPass: rssMin >= SPEC.low && rssMax <= SPEC.high,
      spec: SPEC,
      assumptions: "±值按 3σ，偏差独立、近似正态；一维线性尺寸链；datum offset 是系统均值项"
    };
  }

  function formatNumber(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = String(value);
      else if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else node.setAttribute(key, String(value));
    });
    (children || []).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgText(doc, parent, value, x, y, className) {
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mts-label" });
    node.textContent = value;
    parent.appendChild(node);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mts-blue:#245a9b;--mts-green:#2d7a4b;--mts-orange:#ad6811;--mts-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mts-note,[data-learning-lab="' + LAB_ID + '"] .mts-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mts-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mts-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mts-primary{border-color:var(--mts-blue);background:var(--mts-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mts-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mts-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mts-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mts-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mts-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mts-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mts-control output{color:var(--mts-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mts-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mts-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mts-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mts-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mts-metric{min-width:0;padding:8px;border-top:3px solid var(--mts-blue)}[data-learning-lab="' + LAB_ID + '"] .mts-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mts-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mts-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mts-pass{color:var(--mts-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mts-warn{color:var(--mts-red);font-weight:700}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mts-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mts-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mts-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mts-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mts-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mts-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function drawSvg(doc, svg, result) {
    clear(svg);
    var width = 700;
    var height = 300;
    var left = 65;
    var right = 655;
    var y = 122;
    var low = Math.min(result.worstMin, result.spec.low) - 0.15;
    var high = Math.max(result.worstMax, result.spec.high) + 0.15;
    function xOf(value) { return left + (value - low) / (high - low) * (right - left); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "公差封闭环的规格窗口、极值包络和 RSS 三西格玛包络，单位为毫米");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "currentColor", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "rect", { x: xOf(result.spec.low), y: y - 24, width: xOf(result.spec.high) - xOf(result.spec.low), height: 48, fill: "var(--mts-green)", opacity: 0.16 }));
    svg.appendChild(svgElement(doc, "line", { x1: xOf(result.worstMin), y1: y - 45, x2: xOf(result.worstMax), y2: y - 45, stroke: "var(--mts-red)", "stroke-width": 6 }));
    svg.appendChild(svgElement(doc, "line", { x1: xOf(result.rssMin), y1: y + 45, x2: xOf(result.rssMax), y2: y + 45, stroke: "var(--mts-orange)", "stroke-width": 6 }));
    svg.appendChild(svgElement(doc, "circle", { cx: xOf(result.nominal), cy: y, r: 7, fill: "var(--mts-blue)" }));
    [result.spec.low, result.nominal, result.spec.high].forEach(function (value) {
      svg.appendChild(svgElement(doc, "line", { x1: xOf(value), y1: y - 10, x2: xOf(value), y2: y + 10, stroke: "currentColor", "stroke-width": 1 }));
    });
    svgText(doc, svg, "极值 [" + formatNumber(result.worstMin, 2) + ", " + formatNumber(result.worstMax, 2) + "] mm", left, 65, "mts-red");
    svgText(doc, svg, "RSS 3σ [" + formatNumber(result.rssMin, 2) + ", " + formatNumber(result.rssMax, 2) + "] mm", left, 208, "mts-orange");
    svgText(doc, svg, "规格 [" + formatNumber(result.spec.low, 2) + ", " + formatNumber(result.spec.high, 2) + "] mm", xOf(result.spec.low), 105, "mts-green");
    svgText(doc, svg, "名义 " + formatNumber(result.nominal, 2) + " mm", xOf(result.nominal) - 32, 155, "mts-blue");
    svgText(doc, svg, "间隙 C (mm)", right - 75, y + 32, "mts-label");
  }

  function renderTable(doc, hostNode, headings, rows) {
    clear(hostNode);
    var table = element(doc, "table", {});
    var headRow = element(doc, "tr", {});
    headings.forEach(function (heading) { headRow.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    table.appendChild(element(doc, "thead", {}, [headRow]));
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "mts-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document);
    if (!doc) throw new Error("a document is required to mount the lab");
    installStyles(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { scale: DEFAULTS.scale, datumOffset: DEFAULTS.datumOffset }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mts-shell" });
    shell.appendChild(element(doc, "h3", { text: "尺寸链实验：极值、RSS 与正态良率" }));
    shell.appendChild(element(doc, "p", { className: "mts-note", text: "先完成三项预测；结果和证据账会保持隐藏，直到提交。数值单位为 mm，良率是模型概率估计。" }));
    var predictionHost = element(doc, "div", { className: "mts-predictions" });
    PREDICTIONS.forEach(function (spec, index) {
      var fieldset = element(doc, "fieldset", {});
      fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }));
      var grid = element(doc, "div", { className: "mts-choice-grid" });
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          state.predictions[spec.key] = choice[0];
          grid.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); });
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      predictionHost.appendChild(fieldset);
    });
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mts-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mts-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mts-feedback", role: "status", "aria-live": "polite", text: state.feedback });
    shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mts-bench" });
    bench.hidden = true;
    var controls = element(doc, "div", { className: "mts-controls" });
    var controlRefs = {};
    [
      { key: "scale", label: "公差尺度", min: 0.5, max: 1.5, step: 0.01, unit: "×" },
      { key: "datumOffset", label: "datum 系统偏置", min: -0.3, max: 0.3, step: 0.01, unit: "mm" }
    ].forEach(function (definition) {
      var inputId = uid + "-" + definition.key;
      var output = element(doc, "output", { for: inputId, text: "" });
      var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]);
      var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] });
      input.addEventListener("input", function () {
        state.config[definition.key] = Number(input.value);
        render();
      });
      var wrapper = element(doc, "div", { className: "mts-control" }, [label, input]);
      controls.appendChild(wrapper);
      controlRefs[definition.key] = { input: input, output: output, unit: definition.unit };
    });
    bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mts-metrics" });
    bench.appendChild(metrics);
    var layout = element(doc, "div", { className: "mts-layout" });
    var stage = element(doc, "div", { className: "mts-stage" });
    var svg = svgElement(doc, "svg", {});
    stage.appendChild(svg);
    layout.appendChild(stage);
    var right = element(doc, "div", {});
    right.appendChild(element(doc, "h4", { text: "尺寸贡献表" }));
    var componentTable = element(doc, "div", { className: "mts-table-wrap" });
    right.appendChild(componentTable);
    right.appendChild(element(doc, "h4", { text: "证据 ledger" }));
    var ledgerTable = element(doc, "div", { className: "mts-table-wrap" });
    right.appendChild(ledgerTable);
    layout.appendChild(right);
    bench.appendChild(layout);
    shell.appendChild(bench);
    clear(rootNode);
    rootNode.appendChild(shell);

    function render() {
      var result = model(state.config);
      controlRefs.scale.output.textContent = formatNumber(result.config.scale, 2) + "×";
      controlRefs.datumOffset.output.textContent = formatNumber(result.config.datumOffset, 2) + " mm";
      controlRefs.scale.input.value = result.config.scale;
      controlRefs.datumOffset.input.value = result.config.datumOffset;
      feedback.textContent = state.feedback;
      bench.hidden = !state.revealed;
      if (!state.revealed) return;
      metrics.replaceChildren(
        metric(doc, "名义间隙", formatNumber(result.nominal, 3) + " mm"),
        metric(doc, "极值半宽", formatNumber(result.worstHalf, 3) + " mm"),
        metric(doc, "RSS 3σ", formatNumber(result.rssThreeSigma, 3) + " mm"),
        metric(doc, "窗口良率", formatNumber(result.yieldProbability * 100, 2) + "%")
      );
      drawSvg(doc, svg, result);
      renderTable(doc, componentTable, ["尺寸环", "符号", "名义 (mm)", "±3σ (mm)", "贡献 (mm)"], result.rows.map(function (row) {
        return [row.name, row.sign > 0 ? "+" : "−", formatNumber(row.nominal, 2), formatNumber(row.tolerance, 3), formatNumber(row.contribution, 2)];
      }));
      renderTable(doc, ledgerTable, ["证据", "读数", "单位/边界"], [
        ["极值区间", "[" + formatNumber(result.worstMin, 3) + ", " + formatNumber(result.worstMax, 3) + "]", "mm; " + (result.worstPass ? "规格内" : "越过规格")],
        ["RSS 3σ 区间", "[" + formatNumber(result.rssMin, 3) + ", " + formatNumber(result.rssMax, 3) + "]", "mm; 统计估计"],
        ["正态窗口良率", formatNumber(result.yieldProbability * 100, 3) + "%", "独立/正态假设"],
        ["datum 偏置", formatNumber(result.config.datumOffset, 3), "mm; 系统均值项"],
        ["模型状态", result.worstPass ? "PASS" : "WARN", result.worstPass ? "极值满足规格" : "极值不满足 100% 互换"]
      ]);
    }

    reveal.addEventListener("click", function () {
      var complete = PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; });
      if (!complete) {
        state.feedback = "请先完成三项预测；结果仍然隐藏。";
        render();
        return;
      }
      var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/3 命中。现在调节公差尺度或 datum 偏置，观察两种边界如何分开。";
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, "尺寸链实验已揭示，极值、RSS 和正态良率账本已显示。");
    });
    reset.addEventListener("click", function () {
      state = { config: { scale: DEFAULTS.scale, datumOffset: DEFAULTS.datumOffset }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
      predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, "尺寸链实验已重置，预测结果再次隐藏。");
    });
    render();
    if (api && typeof api.announce === "function") api.announce(rootNode, "尺寸链实验已加载；先完成三项预测。");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = model(DEFAULTS);
    check(near(result.nominal, 1.2), "default nominal closure");
    check(near(result.worstMin, 0.7) && near(result.worstMax, 1.7), "worst case bounds");
    check(near(result.rssThreeSigma, Math.sqrt(0.075)), "RSS three sigma");
    check(result.rssThreeSigma < result.worstHalf, "RSS is narrower than worst case");
    check(result.yieldProbability > 0.99 && result.yieldProbability < 1, "normal yield is a probability estimate");
    check(!result.worstPass && result.rssPass, "default worst and RSS statuses");
    check(model({ scale: 1.5 }).worstHalf > result.worstHalf, "scale widens worst half width");
    check(model({ datumOffset: 0.3 }).nominal > result.nominal, "datum offset moves mean");
    check(normalCdf(0) === 0.5, "normal CDF center");
    check(model({ scale: 0.5 }).rssThreeSigma < result.rssThreeSigma, "minimum scale boundary is usable");
    var invalidScale = false;
    try { model({ scale: 1.6 }); } catch (error) { invalidScale = true; }
    check(invalidScale, "scale boundary rejects out of range");
    var invalidOffset = false;
    try { model({ datumOffset: 0.31 }); } catch (error) { invalidOffset = true; }
    check(invalidOffset, "datum boundary rejects out of range");
    return { checks: checks };
  }

  return {
    LAB_ID: LAB_ID,
    DEFAULTS: DEFAULTS,
    normalizeConfig: normalizeConfig,
    model: model,
    mount: mount,
    selfTest: selfTest
  };
});
