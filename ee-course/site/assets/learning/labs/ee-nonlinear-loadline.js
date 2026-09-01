(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-nonlinear-loadline", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-nonlinear-loadline self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-nonlinear-loadline self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-nonlinear-loadline";
  var STYLE_ID = "cl-ee-nonlinear-loadline-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { sourceV: 5, sourceR: 330, threshold: 0.7, dynamicR: 20 };
  var QUESTIONS = [
    { key: "source", prompt: "把源电压提高但仍保持在导通区，二极管工作电流怎样？", expected: "higher", choices: [["higher", "升高"], ["lower", "降低"], ["same", "不变"]] },
    { key: "resistance", prompt: "把源电阻增大，负载线变得更平，工作电流怎样？", expected: "lower", choices: [["lower", "降低"], ["higher", "升高"], ["same", "不变"]] },
    { key: "threshold", prompt: "把分段模型的阈值电压提高，负载线与器件曲线的交点通常怎样移动？", expected: "lower", choices: [["lower", "电流降低、交点右移"], ["higher", "电流升高、交点左移"], ["same", "位置不变"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function normalize(input) {
    var source = input || {};
    return {
      sourceV: clamp(finite(source.sourceV === undefined ? DEFAULTS.sourceV : source.sourceV, "source voltage"), 0.1, 12),
      sourceR: clamp(finite(source.sourceR === undefined ? DEFAULTS.sourceR : source.sourceR, "source resistance"), 1, 5000),
      threshold: clamp(finite(source.threshold === undefined ? DEFAULTS.threshold : source.threshold, "threshold voltage"), 0, 3),
      dynamicR: clamp(finite(source.dynamicR === undefined ? DEFAULTS.dynamicR : source.dynamicR, "dynamic resistance"), 0.1, 1000)
    };
  }
  function computeLoadline(input) {
    var config = normalize(input);
    var on = config.sourceV > config.threshold;
    var operatingCurrent = on ? (config.sourceV - config.threshold) / (config.sourceR + config.dynamicR) : 0;
    var operatingVoltage = on ? config.threshold + operatingCurrent * config.dynamicR : config.sourceV;
    var sourceLineAtZero = config.sourceV / config.sourceR;
    var deviceCurrentAtSource = config.sourceV > config.threshold ? (config.sourceV - config.threshold) / config.dynamicR : 0;
    return {
      config: config,
      on: on,
      operatingCurrent: operatingCurrent,
      operatingVoltage: operatingVoltage,
      operatingPower: operatingVoltage * operatingCurrent,
      sourceLineAtZero: sourceLineAtZero,
      deviceCurrentAtSource: deviceCurrentAtSource,
      lineSlope: -1 / config.sourceR,
      deviceSlope: on ? 1 / config.dynamicR : 0,
      intersectionResidual: (config.sourceV - operatingVoltage) / config.sourceR - operatingCurrent,
      interpretation: on ? "交点在导通段：分段线性模型给出工作点" : "截止支路：VQ=Vs、I=0，模型处于截止段"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--enl-blue:#1769aa;--enl-green:#2e7d57;--enl-red:#b23a32;--enl-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .enl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--enl-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .enl-primary{border-color:var(--enl-blue);background:var(--enl-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .enl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .enl-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .enl-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .enl-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .enl-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .enl-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--enl-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--enl-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .enl-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .enl-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .enl-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .enl-metric{min-width:0;padding:9px;border-top:2px solid var(--enl-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .enl-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .enl-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] .enl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .enl-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .enl-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .enl-choice-grid,[data-learning-lab="' + LAB_ID + '"] .enl-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .enl-choice-grid,[data-learning-lab="' + LAB_ID + '"] .enl-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .enl-actions>*{flex-basis:100%}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-enl-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 330"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "二极管分段模型负载线与工作点示意");
    node.appendChild(svgElement(doc, "title", {}, "二极管负载线与分段工作点")); node.appendChild(svgElement(doc, "desc", {}, "左侧坐标图显示电源负载线与二极管分段曲线的交点，右侧是低压源、源电阻和二极管回路。"));
    var left = 45, right = 410, top = 42, bottom = 235; var vmax = Math.max(result.config.sourceV, result.config.threshold * 1.35, 1); var imax = Math.max(result.sourceLineAtZero, result.operatingCurrent * 1.5, result.deviceCurrentAtSource * 0.45, 0.005);
    function x(v) { return left + (right - left) * clamp(v / vmax, 0, 1); }
    function y(i) { return bottom - (bottom - top) * clamp(i / imax, 0, 1); }
    node.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" })); node.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor", "stroke-opacity": ".55" }));
    node.appendChild(svgElement(doc, "line", { x1: x(0), y1: y(result.sourceLineAtZero), x2: x(result.config.sourceV), y2: y(0), stroke: "var(--enl-blue)", "stroke-width": 3 }));
    var deviceEnd = result.on ? (result.config.sourceV - result.config.threshold) / result.config.dynamicR : 0;
    node.appendChild(svgElement(doc, "line", { x1: x(0), y1: y(0), x2: x(result.config.threshold), y2: y(0), stroke: "var(--enl-red)", "stroke-width": 3 }));
    if (result.on) node.appendChild(svgElement(doc, "line", { x1: x(result.config.threshold), y1: y(0), x2: x(result.config.sourceV), y2: y(deviceEnd), stroke: "var(--enl-red)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "line", { x1: x(result.config.threshold), y1: bottom, x2: x(result.config.threshold), y2: top + 8, stroke: "var(--enl-gold)", "stroke-dasharray": "5 4" }));
    node.appendChild(svgElement(doc, "circle", { cx: x(result.operatingVoltage), cy: y(result.operatingCurrent), r: 6, fill: "var(--enl-green)", stroke: "currentColor", "stroke-width": 2 }));
    svgText(doc, node, "I", left - 24, top + 6, { "font-size": 13 }); svgText(doc, node, "V", right + 5, bottom + 5, { "font-size": 13 }); svgText(doc, node, "源负载线", 170, 88, { "font-size": 12, fill: "var(--enl-blue)" }); svgText(doc, node, "器件分段线", 300, 150, { "font-size": 12, fill: "var(--enl-red)" }); svgText(doc, node, "I=0 截止段", 150, bottom - 8, { "font-size": 11, fill: "var(--enl-red)" }); svgText(doc, node, "Vknee", x(result.config.threshold) + 5, bottom - 24, { "font-size": 11, fill: "var(--enl-gold)" }); svgText(doc, node, "Q (" + format(result.operatingVoltage, 3) + " V, " + format(result.operatingCurrent * 1000, 2) + " mA)", 200, 207, { "font-size": 11, fill: "var(--enl-green)" }); svgText(doc, node, "I = (Vs − Vd)/Rs", 116, 264, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "I = (Vd − Vknee)/rd", 318, 264, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "rect", { x: 480, y: 92, width: 54, height: 70, rx: 4, fill: "var(--enl-blue)", "fill-opacity": ".12", stroke: "var(--enl-blue)", "stroke-width": 2 })); svgText(doc, node, "Vs", 507, 124, { "font-size": 15, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sourceV, 1) + " V", 507, 144, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 534, y1: 127, x2: 570, y2: 127, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 570, y: 103, width: 72, height: 48, rx: 4, fill: "var(--enl-green)", "fill-opacity": ".12", stroke: "var(--enl-green)", "stroke-width": 2 })); svgText(doc, node, "Rs", 606, 124, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.sourceR, 0) + " Ω", 606, 141, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 642, y1: 127, x2: 681, y2: 127, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "polygon", { points: "681,109 681,145 698,127", fill: "var(--enl-red)", "fill-opacity": ".25", stroke: "var(--enl-red)", "stroke-width": 2 })); node.appendChild(svgElement(doc, "line", { x1: 700, y1: 105, x2: 700, y2: 149, stroke: "var(--enl-red)", "stroke-width": 3 })); svgText(doc, node, "D", 694, 94, { "font-size": 12, "text-anchor": "middle", fill: "var(--enl-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 700, y1: 149, x2: 700, y2: 226, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 507, y1: 226, x2: 700, y2: 226, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 507, y1: 226, x2: 507, y2: 162, stroke: "currentColor", "stroke-width": 3 })); svgText(doc, node, "Q：交点是同时满足两条 I-V 关系的工作点", 590, 294, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, result.interpretation, 590, 316, { "font-size": 11, "text-anchor": "middle", fill: result.on ? "var(--enl-green)" : "var(--enl-red)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "enl-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [["工作点电压 VQ", format(result.operatingVoltage, 6), "V；交点"], ["工作点电流 IQ", format(result.operatingCurrent * 1000, 6), "mA；交点"], ["负载线零电压截距", format(result.sourceLineAtZero * 1000, 6), "mA；Vs/Rs"], ["工作点功率", format(result.operatingPower * 1000, 6), "mW；VQ·IQ"], ["负载线斜率", format(result.lineSlope, 8), "A/V；−1/Rs"], ["导通分段斜率", format(result.deviceSlope, 8), "A/V；1/rd"], ["交点残差", format(result.intersectionResidual * 1000, 8), "mA；负载线−工作点"], ["状态", result.interpretation, "教学模型解释"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "分段负载线工作点账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { sourceV: DEFAULTS.sourceV, sourceR: DEFAULTS.sourceR, threshold: DEFAULTS.threshold, dynamicR: DEFAULTS.dynamicR }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "enl-shell" }); shell.appendChild(element(doc, "h3", { text: "非线性实验：分段负载线与工作点" })); shell.appendChild(element(doc, "p", { className: "enl-note", text: "先预测交点方向；揭示后再调节源电阻、阈值和分段斜率。阈值是教学设定，不是某种二极管的通用数字。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "enl-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "enl-actions" }); var reveal = element(doc, "button", { type: "button", className: "enl-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "enl-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "enl-controls" }); var inputs = {}; var outputs = {};
    [["sourceV", "源电压 Vs", 0.1, 10, 0.1, function (v) { return format(v, 1) + " V"; }], ["sourceR", "源电阻 Rs", 10, 1000, 10, function (v) { return format(v, 0) + " Ω"; }], ["threshold", "阈值 Vknee", 0, 2, 0.05, function (v) { return format(v, 2) + " V"; }], ["dynamicR", "导通斜率 rd", 1, 200, 1, function (v) { return format(v, 0) + " Ω"; }]].forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "enl-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] }; });
    results.appendChild(controls); var layout = element(doc, "div", { className: "enl-layout" }); var stage = element(doc, "div", { className: "enl-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "enl-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "enl-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "enl-note", text: "实际器件的 I-V 曲线、温度、反向区和动态效应要回到数据手册与测量；本图只验证分段交点的推理。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeLoadline(state.config); results.hidden = !state.revealed; Object.keys(outputs).forEach(function (key) { outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "工作点电压", format(result.operatingVoltage, 3) + " V")); metrics.appendChild(metric(doc, "工作点电流", format(result.operatingCurrent * 1000, 3) + " mA")); metrics.appendChild(metric(doc, "工作点功率", format(result.operatingPower * 1000, 3) + " mW")); metrics.appendChild(metric(doc, "模型状态", result.on ? "导通段" : "截止段")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。先读交点，再分别检查两条曲线的斜率和单位。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { sourceV: DEFAULTS.sourceV, sourceR: DEFAULTS.sourceR, threshold: DEFAULTS.threshold, dynamicR: DEFAULTS.dynamicR }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "非线性负载线实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-enl-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computeLoadline(DEFAULTS); check(result.on, "default diode is on"); check(near(result.operatingCurrent, 4.3 / 350), "operating current"); check(near(result.operatingVoltage, 0.7 + (4.3 / 350) * 20), "operating voltage"); check(near(result.intersectionResidual, 0, 1e-10), "load-line intersection"); var cutoff = computeLoadline({ sourceV: 0.5 }); check(cutoff.operatingCurrent === 0 && near(cutoff.operatingVoltage, 0.5), "cutoff branch has VQ equal to Vs and zero current"); check(near(cutoff.intersectionResidual, 0, 1e-10), "cutoff intersection residual"); var belowKnee = computeLoadline({ sourceV: 0.999, threshold: 1 }); var atKnee = computeLoadline({ sourceV: 1, threshold: 1 }); var aboveKnee = computeLoadline({ sourceV: 1.001, threshold: 1 }); check(near(belowKnee.operatingVoltage, belowKnee.config.sourceV) && near(atKnee.operatingVoltage, atKnee.config.threshold), "cutoff side reaches the knee continuously"); check(aboveKnee.operatingCurrent > 0 && near(aboveKnee.operatingVoltage, 1 + aboveKnee.operatingCurrent * 20), "conducting side starts at the knee"); check(aboveKnee.operatingVoltage - atKnee.operatingVoltage < 1e-3, "knee-side voltage continuity"); check(computeLoadline({ sourceR: 1000 }).operatingCurrent < result.operatingCurrent, "larger source resistance lowers current"); check(JSON.stringify(computeLoadline(DEFAULTS)) === JSON.stringify(computeLoadline(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, computeLoadline: computeLoadline, mount: mount, selfTest: selfTest };
});
