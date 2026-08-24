(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-additive-build-proxy", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-additive-build-proxy self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-additive-build-proxy self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-additive-build-proxy";
  var STYLE_ID = "cl-mech-additive-build-proxy-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { orientation: 30, layerHeight: 0.05, overhang: 35, power: 220 };
  var BASE = { length: 80, width: 40, height: 50, scanSpeed: 600, hatch: 0.1, recoater: 8, threshold: 45, supportDensity: 0.24 };
  var PREDICTIONS = [
    { key: "layers", prompt: "其他参数不变时，层厚减小会怎样改变层数和估算时间？", expected: "increase", choices: [["increase", "增大"], ["decrease", "减小"], ["same", "保持不变"]] },
    { key: "support", prompt: "悬垂角低于示例阈值时，支撑量 proxy 会怎样？", expected: "increase", choices: [["increase", "上升"], ["decrease", "下降"], ["same", "与角度无关"]] },
    { key: "orientation", prompt: "是否存在跨材料、设备和功能面的普适最佳打印方向？", expected: "no", choices: [["no", "不存在"], ["yes", "存在"], ["time-only", "只按时间即可"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function bounded(value, label, low, high) { var number = finite(value, label); if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]"); return number; }
  function normalizeConfig(input) {
    var source = input || {};
    return {
      orientation: bounded(source.orientation === undefined ? DEFAULTS.orientation : source.orientation, "orientation", 0, 90),
      layerHeight: bounded(source.layerHeight === undefined ? DEFAULTS.layerHeight : source.layerHeight, "layerHeight", 0.03, 0.1),
      overhang: bounded(source.overhang === undefined ? DEFAULTS.overhang : source.overhang, "overhang", 15, 60),
      power: bounded(source.power === undefined ? DEFAULTS.power : source.power, "power", 150, 300)
    };
  }
  function model(input) {
    var config = normalizeConfig(input);
    var angleRad = config.orientation * Math.PI / 180;
    var effectiveHeight = BASE.height + 25 * Math.sin(angleRad);
    var area = BASE.length * BASE.width;
    var layers = Math.ceil(effectiveHeight / config.layerHeight);
    var scanLengthPerLayer = area / BASE.hatch;
    var secondsPerLayer = scanLengthPerLayer / BASE.scanSpeed + BASE.recoater;
    var buildMinutes = layers * secondsPerLayer / 60;
    var supportFraction = Math.max(0, (BASE.threshold - config.overhang) / BASE.threshold);
    var supportVolumeProxy = area * effectiveHeight * BASE.supportDensity * supportFraction;
    var surfaceAngle = 30 + 0.2 * (config.orientation - 30);
    var stairStepProxy = config.layerHeight / Math.tan(surfaceAngle * Math.PI / 180);
    var defaultThermalFactor = 1 + 0.12 * Math.sin(DEFAULTS.orientation * Math.PI / 180);
    var thermalProxy = (config.power / DEFAULTS.power) * (DEFAULTS.layerHeight / config.layerHeight) * (effectiveHeight / (BASE.height + 25 * Math.sin(DEFAULTS.orientation * Math.PI / 180))) * (1 + 0.12 * Math.sin(angleRad)) / defaultThermalFactor;
    var zStrengthProxy = 0.7 + 0.3 * Math.cos(angleRad);
    return {
      config: config,
      effectiveHeight: effectiveHeight,
      area: area,
      layers: layers,
      scanLengthPerLayer: scanLengthPerLayer,
      secondsPerLayer: secondsPerLayer,
      buildMinutes: buildMinutes,
      buildHours: buildMinutes / 60,
      supportFraction: supportFraction,
      supportVolumeProxy: supportVolumeProxy,
      surfaceAngle: surfaceAngle,
      stairStepProxy: stairStepProxy,
      thermalProxy: thermalProxy,
      zStrengthProxy: zStrengthProxy,
      supportNeeded: config.overhang < BASE.threshold,
      assumptions: "几何扫描时间、支撑、台阶、热风险和方向强度均为教学 proxy；非认证结果"
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
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "text") node.textContent = String(value); else if (key === "className") node.setAttribute("class", value); else if (key === "htmlFor") node.setAttribute("for", value); else node.setAttribute(key, String(value)); });
    (children || []).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgElement(doc, tag, attrs) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); }); return node; }
  function svgText(doc, parent, value, x, y, className) { var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mab-label" }); node.textContent = value; parent.appendChild(node); }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mab-blue:#245a9b;--mab-green:#2d7a4b;--mab-orange:#ad6811;--mab-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mab-note,[data-learning-lab="' + LAB_ID + '"] .mab-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mab-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mab-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mab-primary{border-color:var(--mab-blue);background:var(--mab-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mab-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mab-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mab-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mab-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mab-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mab-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mab-control output{color:var(--mab-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mab-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mab-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mab-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mab-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mab-metric{min-width:0;padding:8px;border-top:3px solid var(--mab-blue)}[data-learning-lab="' + LAB_ID + '"] .mab-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mab-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mab-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mab-pass{color:var(--mab-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mab-warn{color:var(--mab-red);font-weight:700}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mab-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){[data-learning-lab="' + LAB_ID + '"] .mab-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mab-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mab-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mab-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mab-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mab-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function drawSvg(doc, svg, result) {
    clear(svg); var width = 700; var height = 390; var left = 55; var right = 645; var top = 35; var bottom = 210;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "增材制造方向、层数和四项 proxy 指标");
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", opacity: 0.7 }));
    var layerHeightPx = Math.max(8, Math.min(150, result.effectiveHeight * 2));
    var buildX = 100; var buildY = bottom - layerHeightPx; var buildW = 120;
    svg.appendChild(svgElement(doc, "rect", { x: buildX, y: buildY, width: buildW, height: layerHeightPx, fill: "none", stroke: "var(--mab-blue)", "stroke-width": 3 }));
    for (var i = 1; i < 8; i += 1) svg.appendChild(svgElement(doc, "line", { x1: buildX, y1: buildY + layerHeightPx * i / 8, x2: buildX + buildW, y2: buildY + layerHeightPx * i / 8, stroke: "var(--mab-blue)", opacity: 0.35 }));
    svg.appendChild(svgElement(doc, "line", { x1: buildX + buildW / 2, y1: buildY, x2: buildX + buildW / 2 + 62 * Math.cos(result.config.orientation * Math.PI / 180), y2: buildY - 62 * Math.sin(result.config.orientation * Math.PI / 180), stroke: "var(--mab-orange)", "stroke-width": 3 }));
    svgText(doc, svg, "方向 " + formatNumber(result.config.orientation, 0) + "°", buildX, 235, "mab-orange");
    svgText(doc, svg, result.layers + " layers", buildX, 255, "mab-blue");
    var labels = ["时间 h", "支撑 mm³ proxy", "台阶 mm proxy", "热/强度 proxy"];
    var values = [result.buildHours, result.supportVolumeProxy / 1000, result.stairStepProxy * 10, result.thermalProxy];
    var colors = ["var(--mab-blue)", "var(--mab-orange)", "var(--mab-green)", "var(--mab-red)"];
    var max = Math.max.apply(null, values.concat([1])); var barX = 300; var barW = 300; var barY = 55;
    values.forEach(function (value, index) { var y = barY + index * 38; svgText(doc, svg, labels[index], barX, y + 12, "mab-label"); svg.appendChild(svgElement(doc, "rect", { x: barX + 115, y: y, width: Math.max(2, value / max * barW), height: 20, fill: colors[index], opacity: 0.78 })); svgText(doc, svg, formatNumber(value, index === 1 ? 1 : 2), barX + 122 + Math.max(2, value / max * barW), y + 15, "mab-label"); });
    svgText(doc, svg, "支撑阈值 " + BASE.threshold + "°；各项数值为 proxy", 300, 230, "mab-label");
    svgText(doc, svg, "Z/XY strength proxy " + formatNumber(result.zStrengthProxy, 2), 300, 255, "mab-red");
  }
  function renderTable(doc, hostNode, headings, rows) {
    clear(hostNode); var table = element(doc, "table", {}); var header = element(doc, "tr", {}); headings.forEach(function (heading) { header.appendChild(element(doc, "th", { scope: "col", text: heading })); }); table.appendChild(element(doc, "thead", {}, [header])); var body = element(doc, "tbody", {}); rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); }); body.appendChild(tr); }); table.appendChild(body); hostNode.appendChild(table);
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "mab-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document); if (!doc) throw new Error("a document is required to mount the lab"); installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { orientation: DEFAULTS.orientation, layerHeight: DEFAULTS.layerHeight, overhang: DEFAULTS.overhang, power: DEFAULTS.power }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mab-shell" }); shell.appendChild(element(doc, "h3", { text: "增材实验：打印时间、支撑与方向 proxy" })); shell.appendChild(element(doc, "p", { className: "mab-note", text: "先完成三项预测；时间用 h、层数用 layers、支撑体积用 mm³，热/强度读数明确为 proxy。" }));
    var predictionHost = element(doc, "div", { className: "mab-predictions" }); PREDICTIONS.forEach(function (spec, index) { var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt })); var grid = element(doc, "div", { className: "mab-choice-grid" }); spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { state.predictions[spec.key] = choice[0]; grid.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); }); grid.appendChild(button); }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mab-actions" }); var reveal = element(doc, "button", { type: "button", className: "mab-primary", text: "提交预测并揭示" }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "mab-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mab-bench" }); bench.hidden = true; var controls = element(doc, "div", { className: "mab-controls" }); var controlRefs = {};
    [{ key: "orientation", label: "方向角", min: 0, max: 90, step: 1, unit: "°" }, { key: "layerHeight", label: "层厚", min: 0.03, max: 0.1, step: 0.005, unit: " mm" }, { key: "overhang", label: "悬垂角", min: 15, max: 60, step: 1, unit: "°" }, { key: "power", label: "激光功率", min: 150, max: 300, step: 5, unit: " W" }].forEach(function (definition) { var inputId = uid + "-" + definition.key; var output = element(doc, "output", { for: inputId, text: "" }); var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]); var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] }); input.addEventListener("input", function () { state.config[definition.key] = Number(input.value); render(); }); controls.appendChild(element(doc, "div", { className: "mab-control" }, [label, input])); controlRefs[definition.key] = { input: input, output: output, unit: definition.unit }; }); bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mab-metrics" }); bench.appendChild(metrics); var layout = element(doc, "div", { className: "mab-layout" }); var stage = element(doc, "div", { className: "mab-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var right = element(doc, "div", {}); right.appendChild(element(doc, "h4", { text: "过程 proxy 表" })); var proxyTable = element(doc, "div", { className: "mab-table-wrap" }); right.appendChild(proxyTable); right.appendChild(element(doc, "h4", { text: "证据 ledger" })); var ledgerTable = element(doc, "div", { className: "mab-table-wrap" }); right.appendChild(ledgerTable); layout.appendChild(right); bench.appendChild(layout); shell.appendChild(bench); clear(rootNode); rootNode.appendChild(shell);
    function render() { var result = model(state.config); controlRefs.orientation.output.textContent = formatNumber(result.config.orientation, 0) + "°"; controlRefs.layerHeight.output.textContent = formatNumber(result.config.layerHeight, 3) + " mm"; controlRefs.overhang.output.textContent = formatNumber(result.config.overhang, 0) + "°"; controlRefs.power.output.textContent = formatNumber(result.config.power, 0) + " W"; Object.keys(controlRefs).forEach(function (key) { controlRefs[key].input.value = result.config[key]; }); feedback.textContent = state.feedback; bench.hidden = !state.revealed; if (!state.revealed) return; metrics.replaceChildren(metric(doc, "层数", result.layers + " layers"), metric(doc, "成形时间", formatNumber(result.buildHours, 2) + " h"), metric(doc, "支撑 proxy", formatNumber(result.supportVolumeProxy, 0) + " mm³"), metric(doc, "Z/XY proxy", formatNumber(result.zStrengthProxy, 2))); drawSvg(doc, svg, result); renderTable(doc, proxyTable, ["量", "读数", "单位/含义"], [["有效高度", formatNumber(result.effectiveHeight, 2), "mm"], ["每层扫描长度", formatNumber(result.scanLengthPerLayer, 0), "mm"], ["单层时间", formatNumber(result.secondsPerLayer, 2), "s"], ["台阶尺寸", formatNumber(result.stairStepProxy, 4), "mm proxy"], ["热风险", formatNumber(result.thermalProxy, 3), "归一化 proxy"]]); renderTable(doc, ledgerTable, ["证据", "读数", "边界"], [["支撑状态", result.supportNeeded ? "需要" : "可不加", "阈值 " + BASE.threshold + "°; proxy"], ["方向角", formatNumber(result.config.orientation, 0), "°; 影响高度/热/Z proxy"], ["层厚趋势", formatNumber(result.config.layerHeight, 3), "mm; 越小通常越慢"], ["热风险", formatNumber(result.thermalProxy, 3), "归一化; 不是温度"], ["模型状态", "PROXY", "需过程窗口、后处理和检测"]]); }
    reveal.addEventListener("click", function () { if (!PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；结果仍然隐藏。"; render(); return; } var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭示：" + correct + "/3 命中。现在调节方向、层厚、悬垂角和功率。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, "增材实验已揭示，打印时间、支撑和方向 proxy 已显示。"); });
    reset.addEventListener("click", function () { state = { config: { orientation: DEFAULTS.orientation, layerHeight: DEFAULTS.layerHeight, overhang: DEFAULTS.overhang, power: DEFAULTS.power }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" }; predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "增材实验已重置，预测结果再次隐藏。"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "增材实验已加载；先完成三项预测。");
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = model(DEFAULTS); check(result.layers === 1250, "default layer count"); check(near(result.buildHours, 21.2962963, 1e-7), "default build time"); check(near(result.supportVolumeProxy, 10666.6666667, 1e-9), "support proxy geometry"); check(near(result.thermalProxy, 1), "default normalized thermal proxy"); check(result.zStrengthProxy < 1, "orientation anisotropy proxy visible"); check(model({ layerHeight: 0.03 }).buildMinutes > result.buildMinutes, "thinner layers take longer"); check(model({ overhang: 60 }).supportVolumeProxy === 0, "support-free boundary"); check(model({ orientation: 90 }).effectiveHeight > result.effectiveHeight, "orientation changes build height"); var invalidLayer = false; try { model({ layerHeight: 0.02 }); } catch (error) { invalidLayer = true; } check(invalidLayer, "layer height boundary"); var invalidPower = false; try { model({ power: 301 }); } catch (error) { invalidPower = true; } check(invalidPower, "power boundary"); return { checks: checks }; }
  return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, normalizeConfig: normalizeConfig, model: model, mount: mount, selfTest: selfTest };
});
