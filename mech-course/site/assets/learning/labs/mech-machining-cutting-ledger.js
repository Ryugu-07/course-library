(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-machining-cutting-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-machining-cutting-ledger self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-machining-cutting-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-machining-cutting-ledger";
  var STYLE_ID = "cl-mech-machining-cutting-ledger-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var FIT_RANGE = { low: 30, high: 150 };
  var DEFAULTS = { speed: 80, rake: 10, friction: 0.6, chip: 0.2, width: 4, shearStress: 500 };
  var TAYLOR = { C: 180, n: 0.25 };
  var PREDICTIONS = [
    { key: "angle", prompt: "摩擦条件不变时，前角增大对 Merchant 剪切角的影响是？", expected: "increase", choices: [["increase", "增大"], ["decrease", "减小"], ["unknown", "没有确定方向"]] },
    { key: "life", prompt: "在同一组拟合 Taylor 参数内，提高切削速度会怎样改变寿命？", expected: "decrease", choices: [["decrease", "减小"], ["increase", "增大"], ["same", "保持不变"]] },
    { key: "power", prompt: "主切削功率应由哪个量与线速度相乘？", expected: "cutting", choices: [["cutting", "主切削力"], ["feed", "进给力"], ["average", "两者平均"]] }
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
      speed: bounded(source.speed === undefined ? DEFAULTS.speed : source.speed, "speed", 20, 220),
      rake: bounded(source.rake === undefined ? DEFAULTS.rake : source.rake, "rake", 0, 20),
      friction: bounded(source.friction === undefined ? DEFAULTS.friction : source.friction, "friction", 0.2, 0.9),
      chip: bounded(source.chip === undefined ? DEFAULTS.chip : source.chip, "chip", 0.05, 0.4),
      width: bounded(source.width === undefined ? DEFAULTS.width : source.width, "width", 1, 8),
      shearStress: bounded(source.shearStress === undefined ? DEFAULTS.shearStress : source.shearStress, "shearStress", 300, 800)
    };
  }
  function model(input) {
    var config = normalizeConfig(input);
    var alpha = config.rake * Math.PI / 180;
    var frictionAngle = Math.atan(config.friction);
    var betaDeg = frictionAngle * 180 / Math.PI;
    var shearAngleDeg = 45 + config.rake / 2 - betaDeg / 2;
    var shearAngle = shearAngleDeg * Math.PI / 180;
    var chipRatio = Math.sin(shearAngle) / Math.cos(shearAngle - alpha);
    var chipThickness = config.chip / chipRatio;
    var shearArea = config.width * config.chip / Math.sin(shearAngle);
    var shearForce = config.shearStress * shearArea;
    var denominator = Math.cos(shearAngle + frictionAngle - alpha);
    if (!(denominator > 0.08)) throw new RangeError("Merchant force denominator is too close to zero");
    var cuttingForce = shearForce * Math.cos(frictionAngle - alpha) / denominator;
    var feedForce = shearForce * Math.sin(frictionAngle - alpha) / denominator;
    var frictionForce = cuttingForce * Math.sin(alpha) + feedForce * Math.cos(alpha);
    var normalForce = cuttingForce * Math.cos(alpha) - feedForce * Math.sin(alpha);
    var power = cuttingForce * config.speed / 60;
    var toolLife = Math.pow(TAYLOR.C / config.speed, 1 / TAYLOR.n);
    return {
      config: config,
      rakeAngleDeg: config.rake,
      frictionAngleDeg: betaDeg,
      shearAngleDeg: shearAngleDeg,
      chipRatio: chipRatio,
      chipThickness: chipThickness,
      shearArea: shearArea,
      shearForce: shearForce,
      denominator: denominator,
      cuttingForce: cuttingForce,
      feedForce: feedForce,
      frictionForce: frictionForce,
      normalForce: normalForce,
      power: power,
      toolLife: toolLife,
      taylor: TAYLOR,
      fitInRange: config.speed >= FIT_RANGE.low && config.speed <= FIT_RANGE.high,
      fitRange: FIT_RANGE,
      assumptions: "稳态正交切削、单一剪切面、Merchant 摩擦平衡；Taylor 参数只在拟合速度区间有效"
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
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mcm-label" }); node.textContent = value; parent.appendChild(node);
  }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mcm-blue:#245a9b;--mcm-green:#2d7a4b;--mcm-orange:#ad6811;--mcm-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mcm-note,[data-learning-lab="' + LAB_ID + '"] .mcm-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcm-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mcm-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mcm-primary{border-color:var(--mcm-blue);background:var(--mcm-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mcm-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mcm-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mcm-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcm-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mcm-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mcm-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mcm-control output{color:var(--mcm-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mcm-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcm-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mcm-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mcm-metric{min-width:0;padding:8px;border-top:3px solid var(--mcm-blue)}[data-learning-lab="' + LAB_ID + '"] .mcm-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mcm-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcm-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mcm-pass{color:var(--mcm-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mcm-warn{color:var(--mcm-red);font-weight:700}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mcm-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mcm-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mcm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mcm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mcm-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mcm-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mcm-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function drawSvg(doc, svg, result) {
    clear(svg);
    var width = 700; var height = 390; var left = 55; var right = 655; var top = 35; var bottom = 170;
    function sx(value) { return left + (value - 20) / 200 * (right - left); }
    function sy(value) { var min = 0; var max = Math.max(80, result.toolLife * 1.1); return bottom - (value - min) / (max - min) * (bottom - top); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "正交切削几何和 Taylor 刀具寿命曲线，速度单位为 m/min，寿命单位为 min");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    var points = [];
    for (var speed = 20; speed <= 220; speed += 4) points.push((speed === 20 ? "M" : "L") + sx(speed).toFixed(2) + " " + sy(Math.pow(TAYLOR.C / speed, 1 / TAYLOR.n)).toFixed(2));
    svg.appendChild(svgElement(doc, "path", { d: points.join(" "), fill: "none", stroke: "var(--mcm-blue)", "stroke-width": 2.5 }));
    svg.appendChild(svgElement(doc, "line", { x1: sx(FIT_RANGE.low), y1: top, x2: sx(FIT_RANGE.low), y2: bottom, stroke: "var(--mcm-orange)", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: sx(FIT_RANGE.high), y1: top, x2: sx(FIT_RANGE.high), y2: bottom, stroke: "var(--mcm-orange)", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: sx(result.config.speed), cy: sy(result.toolLife), r: 6, fill: result.fitInRange ? "var(--mcm-green)" : "var(--mcm-red)" }));
    svgText(doc, svg, "Taylor T (min)", left + 5, top + 12, "mcm-blue");
    svgText(doc, svg, "v (m/min)", right - 54, bottom + 22, "mcm-label");
    svgText(doc, svg, "拟合区间 " + FIT_RANGE.low + "–" + FIT_RANGE.high + " m/min", sx(FIT_RANGE.low) + 6, top + 30, "mcm-orange");
    svgText(doc, svg, "当前 " + formatNumber(result.config.speed, 0) + " m/min, " + formatNumber(result.toolLife, 1) + " min", sx(result.config.speed) - 30, sy(result.toolLife) - 10, "mcm-green");
    var gx = 110; var gy = 270;
    svg.appendChild(svgElement(doc, "polygon", { points: gx + "," + gy + " " + (gx + 80) + "," + gy + " " + (gx + 80) + "," + (gy - 45), fill: "none", stroke: "currentColor", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "line", { x1: gx + 80, y1: gy, x2: gx + 135, y2: gy - 65, stroke: "var(--mcm-orange)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: gx + 80, y1: gy, x2: gx + 153, y2: gy + 34, stroke: "var(--mcm-red)", "stroke-width": 3 }));
    svgText(doc, svg, "工件", gx + 8, gy + 20, "mcm-label");
    svgText(doc, svg, "剪切角 φ=" + formatNumber(result.shearAngleDeg, 1) + "°", gx + 100, gy - 71, "mcm-orange");
    svgText(doc, svg, "Fc=" + formatNumber(result.cuttingForce, 0) + " N", gx + 157, gy + 41, "mcm-red");
    svgText(doc, svg, "Ft=" + formatNumber(result.feedForce, 0) + " N", gx + 89, gy + 58, "mcm-label");
    svgText(doc, svg, "前角 α=" + formatNumber(result.rakeAngleDeg, 1) + "°", gx + 2, gy - 60, "mcm-blue");
  }
  function renderTable(doc, hostNode, headings, rows) {
    clear(hostNode); var table = element(doc, "table", {}); var header = element(doc, "tr", {});
    headings.forEach(function (heading) { header.appendChild(element(doc, "th", { scope: "col", text: heading })); }); table.appendChild(element(doc, "thead", {}, [header]));
    var body = element(doc, "tbody", {}); rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); }); body.appendChild(tr); }); table.appendChild(body); hostNode.appendChild(table);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "mcm-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document); if (!doc) throw new Error("a document is required to mount the lab"); installStyles(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { speed: DEFAULTS.speed, rake: DEFAULTS.rake, friction: DEFAULTS.friction, chip: DEFAULTS.chip, width: DEFAULTS.width, shearStress: DEFAULTS.shearStress }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mcm-shell" }); shell.appendChild(element(doc, "h3", { text: "切削实验：Merchant 力账与 Taylor 寿命" }));
    shell.appendChild(element(doc, "p", { className: "mcm-note", text: "先完成三项预测；力用 N，功率用 W，速度用 m/min，寿命用 min。Taylor 只在橙色拟合区间内有意义。" }));
    var predictionHost = element(doc, "div", { className: "mcm-predictions" });
    PREDICTIONS.forEach(function (spec, index) {
      var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt })); var grid = element(doc, "div", { className: "mcm-choice-grid" });
      spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { state.predictions[spec.key] = choice[0]; grid.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); }); grid.appendChild(button); });
      fieldset.appendChild(grid); predictionHost.appendChild(fieldset);
    }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mcm-actions" }); var reveal = element(doc, "button", { type: "button", className: "mcm-primary", text: "提交预测并揭示" }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "mcm-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mcm-bench" }); bench.hidden = true; var controls = element(doc, "div", { className: "mcm-controls" }); var controlRefs = {};
    [
      { key: "speed", label: "切削速度", min: 20, max: 220, step: 1, unit: " m/min" },
      { key: "rake", label: "前角", min: 0, max: 20, step: 1, unit: "°" },
      { key: "friction", label: "摩擦系数", min: 0.2, max: 0.9, step: 0.01, unit: "" },
      { key: "chip", label: "未变形切屑厚度", min: 0.05, max: 0.4, step: 0.01, unit: " mm" },
      { key: "width", label: "切削宽度", min: 1, max: 8, step: 0.1, unit: " mm" },
      { key: "shearStress", label: "剪切流动应力 proxy", min: 300, max: 800, step: 10, unit: " MPa" }
    ].forEach(function (definition) {
      var inputId = uid + "-" + definition.key; var output = element(doc, "output", { for: inputId, text: "" }); var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]); var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] });
      input.addEventListener("input", function () { state.config[definition.key] = Number(input.value); render(); }); controls.appendChild(element(doc, "div", { className: "mcm-control" }, [label, input])); controlRefs[definition.key] = { input: input, output: output, unit: definition.unit };
    }); bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mcm-metrics" }); bench.appendChild(metrics); var layout = element(doc, "div", { className: "mcm-layout" }); var stage = element(doc, "div", { className: "mcm-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage);
    var right = element(doc, "div", {}); right.appendChild(element(doc, "h4", { text: "几何与力表" })); var forceTable = element(doc, "div", { className: "mcm-table-wrap" }); right.appendChild(forceTable); right.appendChild(element(doc, "h4", { text: "证据 ledger" })); var ledgerTable = element(doc, "div", { className: "mcm-table-wrap" }); right.appendChild(ledgerTable); layout.appendChild(right); bench.appendChild(layout); shell.appendChild(bench); clear(rootNode); rootNode.appendChild(shell);
    function render() {
      var result = model(state.config);
      Object.keys(controlRefs).forEach(function (key) { controlRefs[key].input.value = result.config[key]; controlRefs[key].output.textContent = formatNumber(result.config[key], key === "friction" ? 2 : key === "rake" ? 0 : key === "speed" || key === "width" || key === "shearStress" ? 1 : 2) + controlRefs[key].unit; });
      feedback.textContent = state.feedback; bench.hidden = !state.revealed; if (!state.revealed) return;
      metrics.replaceChildren(metric(doc, "剪切角", formatNumber(result.shearAngleDeg, 2) + "°"), metric(doc, "Fc", formatNumber(result.cuttingForce, 0) + " N"), metric(doc, "主轴功率 proxy", formatNumber(result.power, 0) + " W"), metric(doc, "刀具寿命", formatNumber(result.toolLife, 2) + " min"));
      drawSvg(doc, svg, result);
      renderTable(doc, forceTable, ["量", "读数", "单位"], [["摩擦角 β", formatNumber(result.frictionAngleDeg, 2), "°"], ["剪切角 φ", formatNumber(result.shearAngleDeg, 2), "°"], ["切屑比 r", formatNumber(result.chipRatio, 3), "无量纲"], ["切屑厚度 t2", formatNumber(result.chipThickness, 3), "mm"], ["剪切面积 As", formatNumber(result.shearArea, 3), "mm²"], ["Fs / Fc / Ft", formatNumber(result.shearForce, 0) + " / " + formatNumber(result.cuttingForce, 0) + " / " + formatNumber(result.feedForce, 0), "N"]]);
      renderTable(doc, ledgerTable, ["证据", "读数", "边界"], [["功率闭合", formatNumber(result.power, 1), "W = Fc × v/60"], ["摩擦力 / 法向力", formatNumber(result.frictionForce, 0) + " / " + formatNumber(result.normalForce, 0), "N; 正交分解"], ["Taylor 参数", "C=" + TAYLOR.C + ", n=" + TAYLOR.n, "C: (m/min)·min^n"], ["拟合范围", FIT_RANGE.low + "–" + FIT_RANGE.high, "m/min; " + (result.fitInRange ? "PASS" : "WARN 超出拟合")], ["模型状态", result.fitInRange ? "PASS" : "WARN", "Merchant/Taylor 均为限定近似"]]);
    }
    reveal.addEventListener("click", function () { if (!PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；结果仍然隐藏。"; render(); return; } var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭示：" + correct + "/3 命中。现在调节速度、前角和摩擦，观察力账与拟合边界。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, "切削实验已揭示，Merchant 力账和 Taylor 曲线已显示。"); });
    reset.addEventListener("click", function () { state = { config: { speed: DEFAULTS.speed, rake: DEFAULTS.rake, friction: DEFAULTS.friction, chip: DEFAULTS.chip, width: DEFAULTS.width, shearStress: DEFAULTS.shearStress }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" }; predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "切削实验已重置，预测结果再次隐藏。"); });
    render(); if (api && typeof api.announce === "function") api.announce(rootNode, "切削实验已加载；先完成三项预测。");
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var result = model(DEFAULTS);
    check(near(result.frictionAngleDeg, 30.9637565, 1e-6), "friction angle");
    check(near(result.shearAngleDeg, 34.5181217, 1e-6), "Merchant shear angle");
    check(near(result.chipRatio, Math.sin(result.shearAngleDeg * Math.PI / 180) / Math.cos((result.shearAngleDeg - DEFAULTS.rake) * Math.PI / 180)), "chip ratio geometry");
    check(result.cuttingForce > result.feedForce && result.feedForce > 0, "force directions and magnitudes");
    check(near(result.power, result.cuttingForce * DEFAULTS.speed / 60), "power unit conversion");
    check(near(result.toolLife, Math.pow(TAYLOR.C / DEFAULTS.speed, 1 / TAYLOR.n)), "Taylor life");
    check(model({ rake: 15 }).shearAngleDeg > result.shearAngleDeg, "rake increases Merchant angle");
    check(model({ speed: 120 }).toolLife < result.toolLife, "speed lowers fitted life");
    check(!model({ speed: 220 }).fitInRange, "out of fitted range is visible");
    var invalidChip = false; try { model({ chip: 0.01 }); } catch (error) { invalidChip = true; } check(invalidChip, "chip thickness boundary");
    var invalidFriction = false; try { model({ friction: 1.1 }); } catch (error) { invalidFriction = true; } check(invalidFriction, "friction boundary");
    return { checks: checks };
  }
  return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, normalizeConfig: normalizeConfig, model: model, mount: mount, selfTest: selfTest };
});
