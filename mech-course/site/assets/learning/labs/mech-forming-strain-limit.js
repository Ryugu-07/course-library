(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-forming-strain-limit", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-forming-strain-limit self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-forming-strain-limit self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-forming-strain-limit";
  var STYLE_ID = "cl-mech-forming-strain-limit-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { length: 125, width: 48, springback: 0.12 };
  var BASE = { length: 100, width: 50, thickness: 2, flowStress: 320, bendAngle: 90, limit: 0.25 };
  var PREDICTIONS = [
    { key: "thickness", prompt: "塑性体积近似守恒时，长度拉长会怎样改变厚度？", expected: "decrease", choices: [["decrease", "减小"], ["increase", "增大"], ["same", "保持不变"]] },
    { key: "springback", prompt: "对弯曲转角定义，卸载后的回弹方向是什么？", expected: "decrease", choices: [["decrease", "转角变小"], ["increase", "转角变大"], ["unknown", "方向不确定"]] },
    { key: "limit", prompt: "一个固定成形极限数字能否对所有材料和路径普适？", expected: "no", choices: [["no", "不能普适"], ["yes", "可以普适"], ["only-thickness", "只要看厚度"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
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
      length: bounded(source.length === undefined ? DEFAULTS.length : source.length, "length", 105, 170),
      width: bounded(source.width === undefined ? DEFAULTS.width : source.width, "width", 40, 60),
      springback: bounded(source.springback === undefined ? DEFAULTS.springback : source.springback, "springback", 0, 0.25)
    };
  }
  function model(input) {
    var config = normalizeConfig(input);
    var epsLength = Math.log(config.length / BASE.length);
    var epsWidth = Math.log(config.width / BASE.width);
    var thickness = BASE.thickness * BASE.length * BASE.width / (config.length * config.width);
    var epsThickness = Math.log(thickness / BASE.thickness);
    var volumeRatio = config.length * config.width * thickness / (BASE.length * BASE.width * BASE.thickness);
    var forceProxy = BASE.flowStress * config.width * thickness * Math.max(epsLength, 0);
    var bendAfter = BASE.bendAngle * (1 - config.springback);
    return {
      config: config,
      epsLength: epsLength,
      epsWidth: epsWidth,
      epsThickness: epsThickness,
      thickness: thickness,
      volumeRatio: volumeRatio,
      forceProxy: forceProxy,
      bendBefore: BASE.bendAngle,
      bendAfter: bendAfter,
      limit: BASE.limit,
      limitPass: epsLength <= BASE.limit,
      assumptions: "局部均匀塑性流动、体积近似守恒；成形力和极限线均为教学 proxy"
    };
  }
  function formatNumber(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
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
    (children || []).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    return node;
  }
  function svgText(doc, parent, value, x, y, className) {
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mfl-label" });
    node.textContent = value;
    parent.appendChild(node);
  }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mfl-blue:#245a9b;--mfl-green:#2d7a4b;--mfl-orange:#ad6811;--mfl-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mfl-note,[data-learning-lab="' + LAB_ID + '"] .mfl-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mfl-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mfl-primary{border-color:var(--mfl-blue);background:var(--mfl-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mfl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mfl-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mfl-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfl-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mfl-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mfl-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfl-control output{color:var(--mfl-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mfl-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfl-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mfl-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfl-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mfl-metric{min-width:0;padding:8px;border-top:3px solid var(--mfl-blue)}[data-learning-lab="' + LAB_ID + '"] .mfl-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfl-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mfl-pass{color:var(--mfl-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mfl-warn{color:var(--mfl-red);font-weight:700}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mfl-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mfl-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfl-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mfl-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mfl-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfl-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mfl-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function drawSvg(doc, svg, result) {
    clear(svg);
    var width = 700;
    var height = 360;
    var left = 62;
    var right = 390;
    var top = 30;
    var bottom = 245;
    var xLow = -0.15;
    var xHigh = 0.5;
    var yLow = -0.18;
    var yHigh = 0.18;
    function xOf(value) { return left + (value - xLow) / (xHigh - xLow) * (right - left); }
    function yOf(value) { return bottom - (value - yLow) / (yHigh - yLow) * (bottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "板料真应变路径与弯曲转角回弹方向");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: yOf(0), x2: right, y2: yOf(0), stroke: "currentColor", opacity: 0.7 }));
    svg.appendChild(svgElement(doc, "line", { x1: xOf(0), y1: top, x2: xOf(0), y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    svg.appendChild(svgElement(doc, "line", { x1: xOf(result.limit), y1: top, x2: xOf(result.limit), y2: bottom, stroke: "var(--mfl-red)", "stroke-dasharray": "5 4", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "line", { x1: xOf(0), y1: yOf(0), x2: xOf(result.epsLength), y2: yOf(result.epsWidth), stroke: "var(--mfl-blue)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "circle", { cx: xOf(result.epsLength), cy: yOf(result.epsWidth), r: 6, fill: result.limitPass ? "var(--mfl-green)" : "var(--mfl-red)" }));
    svgText(doc, svg, "εW", left + 6, top + 10, "mfl-label");
    svgText(doc, svg, "εL", right - 20, bottom + 24, "mfl-label");
    svgText(doc, svg, "筛查线 εL=" + formatNumber(result.limit, 2), xOf(result.limit) + 5, top + 18, "mfl-red");
    svgText(doc, svg, "应变路径终点", xOf(result.epsLength) + 8, yOf(result.epsWidth) - 8, "mfl-blue");
    var baseX = 485;
    var baseY = 250;
    svg.appendChild(svgElement(doc, "polyline", { points: baseX + "," + baseY + " " + (baseX + 60) + "," + (baseY - 70) + " " + (baseX + 120) + "," + baseY, fill: "none", stroke: "var(--mfl-orange)", "stroke-width": 5 }));
    var afterRise = 70 * Math.sin(result.bendAfter * Math.PI / 360);
    svg.appendChild(svgElement(doc, "polyline", { points: baseX + "," + baseY + " " + (baseX + 60) + "," + (baseY - afterRise) + " " + (baseX + 120) + "," + baseY, fill: "none", stroke: "var(--mfl-green)", "stroke-width": 4 }));
    svgText(doc, svg, "成形转角 " + formatNumber(result.bendBefore, 1) + "°", baseX, 285, "mfl-orange");
    svgText(doc, svg, "卸载后 " + formatNumber(result.bendAfter, 1) + "°（转角减小）", baseX, 310, "mfl-green");
  }
  function renderTable(doc, hostNode, headings, rows) {
    clear(hostNode);
    var table = element(doc, "table", {});
    var header = element(doc, "tr", {});
    headings.forEach(function (heading) { header.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    table.appendChild(element(doc, "thead", {}, [header]));
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); }); body.appendChild(tr); });
    table.appendChild(body);
    hostNode.appendChild(table);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "mfl-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document);
    if (!doc) throw new Error("a document is required to mount the lab");
    installStyles(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { length: DEFAULTS.length, width: DEFAULTS.width, springback: DEFAULTS.springback }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mfl-shell" });
    shell.appendChild(element(doc, "h3", { text: "成形实验：真应变、体积与回弹" }));
    shell.appendChild(element(doc, "p", { className: "mfl-note", text: "先回答三项预测；成形力和极限线均为 proxy，真应变为无量纲，长度/厚度为 mm。" }));
    var predictionHost = element(doc, "div", { className: "mfl-predictions" });
    PREDICTIONS.forEach(function (spec, index) {
      var fieldset = element(doc, "fieldset", {});
      fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }));
      var grid = element(doc, "div", { className: "mfl-choice-grid" });
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
    var actions = element(doc, "div", { className: "mfl-actions" });
    var reveal = element(doc, "button", { type: "button", className: "mfl-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mfl-feedback", role: "status", "aria-live": "polite", text: state.feedback });
    shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mfl-bench" });
    bench.hidden = true;
    var controls = element(doc, "div", { className: "mfl-controls" });
    var controlRefs = {};
    [
      { key: "length", label: "成形长度", min: 105, max: 170, step: 1, unit: " mm" },
      { key: "width", label: "成形宽度", min: 40, max: 60, step: 1, unit: " mm" },
      { key: "springback", label: "弹性回弹比例", min: 0, max: 0.25, step: 0.01, unit: "" }
    ].forEach(function (definition) {
      var inputId = uid + "-" + definition.key;
      var output = element(doc, "output", { for: inputId, text: "" });
      var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]);
      var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] });
      input.addEventListener("input", function () { state.config[definition.key] = Number(input.value); render(); });
      controls.appendChild(element(doc, "div", { className: "mfl-control" }, [label, input]));
      controlRefs[definition.key] = { input: input, output: output, unit: definition.unit };
    });
    bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mfl-metrics" }); bench.appendChild(metrics);
    var layout = element(doc, "div", { className: "mfl-layout" });
    var stage = element(doc, "div", { className: "mfl-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var right = element(doc, "div", {});
    right.appendChild(element(doc, "h4", { text: "真应变与几何表" }));
    var geometryTable = element(doc, "div", { className: "mfl-table-wrap" }); right.appendChild(geometryTable);
    right.appendChild(element(doc, "h4", { text: "证据 ledger" }));
    var ledgerTable = element(doc, "div", { className: "mfl-table-wrap" }); right.appendChild(ledgerTable);
    layout.appendChild(right); bench.appendChild(layout); shell.appendChild(bench);
    clear(rootNode); rootNode.appendChild(shell);
    function render() {
      var result = model(state.config);
      controlRefs.length.output.textContent = formatNumber(result.config.length, 0) + " mm";
      controlRefs.width.output.textContent = formatNumber(result.config.width, 0) + " mm";
      controlRefs.springback.output.textContent = formatNumber(result.config.springback * 100, 0) + "%";
      controlRefs.length.input.value = result.config.length; controlRefs.width.input.value = result.config.width; controlRefs.springback.input.value = result.config.springback;
      feedback.textContent = state.feedback; bench.hidden = !state.revealed;
      if (!state.revealed) return;
      metrics.replaceChildren(
        metric(doc, "厚度", formatNumber(result.thickness, 3) + " mm"),
        metric(doc, "力 proxy", formatNumber(result.forceProxy, 0) + " N"),
        metric(doc, "体积比", formatNumber(result.volumeRatio, 4) + ""),
        metric(doc, "卸载转角", formatNumber(result.bendAfter, 1) + "°")
      );
      drawSvg(doc, svg, result);
      renderTable(doc, geometryTable, ["量", "读数", "单位/意义"], [
        ["εL", formatNumber(result.epsLength, 4), "无量纲真应变"],
        ["εW", formatNumber(result.epsWidth, 4), "无量纲真应变"],
        ["εt", formatNumber(result.epsThickness, 4), "无量纲真应变"],
        ["体积比", formatNumber(result.volumeRatio, 5), "应接近 1"],
        ["力 proxy", formatNumber(result.forceProxy, 0), "N; 均匀流动近似"]
      ]);
      renderTable(doc, ledgerTable, ["证据", "读数", "边界"], [
        ["真应变和", formatNumber(result.epsLength + result.epsWidth + result.epsThickness, 6), "无量纲; 应接近 0"],
        ["示例筛查线", formatNumber(result.epsLength, 4), result.limitPass ? "PASS; εL ≤ 0.25" : "WARN; proxy 超界"],
        ["回弹方向", formatNumber(result.bendBefore, 1) + "° → " + formatNumber(result.bendAfter, 1) + "°", "转角减小; 内角打开"],
        ["模型边界", "成形力/极限均为 proxy", "需材料与模具验证"]
      ]);
    }
    reveal.addEventListener("click", function () {
      if (!PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；结果仍然隐藏。"; render(); return; }
      var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true; state.feedback = "已揭示：" + correct + "/3 命中。现在调节长度、宽度或回弹比例。"; render();
      if (api && typeof api.announce === "function") api.announce(rootNode, "成形实验已揭示，真应变、体积和回弹账本已显示。");
    });
    reset.addEventListener("click", function () {
      state = { config: { length: DEFAULTS.length, width: DEFAULTS.width, springback: DEFAULTS.springback }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
      predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); render();
      if (api && typeof api.announce === "function") api.announce(rootNode, "成形实验已重置，预测结果再次隐藏。");
    });
    render();
    if (api && typeof api.announce === "function") api.announce(rootNode, "成形实验已加载；先完成三项预测。");
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = model(DEFAULTS);
    check(near(result.thickness, 5 / 3), "default thickness from volume");
    check(near(result.volumeRatio, 1), "volume closes");
    check(near(result.epsLength + result.epsWidth + result.epsThickness, 0, 1e-10), "true strain sum");
    check(result.bendAfter < result.bendBefore, "springback opens bend angle");
    check(result.forceProxy > 0, "force proxy has units and sign");
    check(model({ length: 150 }).thickness < result.thickness, "more length thins sheet");
    check(model({ springback: 0 }).bendAfter === result.bendBefore, "zero springback boundary");
    check(model({ length: 170 }).limitPass === false, "screening boundary is visible");
    var invalidLength = false;
    try { model({ length: 104 }); } catch (error) { invalidLength = true; }
    check(invalidLength, "length boundary rejects out of range");
    var invalidWidth = false;
    try { model({ width: 61 }); } catch (error) { invalidWidth = true; }
    check(invalidWidth, "width boundary rejects out of range");
    var invalidSpringback = false;
    try { model({ springback: 0.3 }); } catch (error) { invalidSpringback = true; }
    check(invalidSpringback, "springback boundary rejects out of range");
    return { checks: checks };
  }
  return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, normalizeConfig: normalizeConfig, model: model, mount: mount, selfTest: selfTest };
});
