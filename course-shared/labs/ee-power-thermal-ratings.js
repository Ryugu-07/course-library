(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-power-thermal-ratings", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-power-thermal-ratings self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-power-thermal-ratings self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "ee-power-thermal-ratings";
  var STYLE_ID = "cl-ee-power-thermal-ratings-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { appliedV: 5, appliedI: 0.08, ratedVoltage: 5.5, ratedCurrent: 0.1, ambient: 25, rjc: 5, rca: 35, tjMax: 125 };
  var QUESTIONS = [
    { key: "current", prompt: "电压不变时，把负载电流加倍，耗散功率与结温上升怎样？", expected: "double", choices: [["double", "都约加倍"], ["half", "都约减半"], ["same", "都不变"]] },
    { key: "ambient", prompt: "环境温度升高而热阻不变，允许耗散功率怎样？", expected: "lower", choices: [["lower", "降低"], ["higher", "升高"], ["same", "不变"]] },
    { key: "path", prompt: "散热路径总热阻增大而功率不变，结温怎样？", expected: "higher", choices: [["higher", "升高"], ["lower", "降低"], ["same", "不变"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function normalize(input) {
    var source = input || {};
    return {
      appliedV: clamp(finite(source.appliedV === undefined ? DEFAULTS.appliedV : source.appliedV, "applied voltage"), 0, 24),
      appliedI: clamp(finite(source.appliedI === undefined ? DEFAULTS.appliedI : source.appliedI, "applied current"), 0, 0.5),
      ratedVoltage: clamp(finite(source.ratedVoltage === undefined ? DEFAULTS.ratedVoltage : source.ratedVoltage, "voltage rating"), 0.1, 30),
      ratedCurrent: clamp(finite(source.ratedCurrent === undefined ? DEFAULTS.ratedCurrent : source.ratedCurrent, "current rating"), 0.001, 1),
      ambient: clamp(finite(source.ambient === undefined ? DEFAULTS.ambient : source.ambient, "ambient temperature"), -20, 150),
      rjc: clamp(finite(source.rjc === undefined ? DEFAULTS.rjc : source.rjc, "junction-case thermal resistance"), 0.1, 100),
      rca: clamp(finite(source.rca === undefined ? DEFAULTS.rca : source.rca, "case-ambient thermal resistance"), 0.1, 300),
      tjMax: clamp(finite(source.tjMax === undefined ? DEFAULTS.tjMax : source.tjMax, "maximum junction temperature"), 40, 220)
    };
  }
  function computeThermal(input) {
    var config = normalize(input);
    var power = config.appliedV * config.appliedI;
    var rthetaPath = config.rjc + config.rca;
    var temperatureRise = power * rthetaPath;
    var junction = config.ambient + temperatureRise;
    var allowablePower = Math.max(0, (config.tjMax - config.ambient) / rthetaPath);
    var thermalMargin = allowablePower - power;
    var voltageMargin = config.ratedVoltage - config.appliedV;
    var currentMargin = config.ratedCurrent - config.appliedI;
    var voltageOver = voltageMargin < 0;
    var currentOver = currentMargin < 0;
    var thermalOver = junction > config.tjMax;
    var electricalOver = voltageOver || currentOver;
    var interpretation = "电压" + (voltageOver ? "越界" : "有效") + "；电流" + (currentOver ? "越界" : "有效") + "；热" + (thermalOver ? "越界" : "有效");
    return {
      config: config,
      power: power,
      rthetaPath: rthetaPath,
      temperatureRise: temperatureRise,
      junction: junction,
      allowablePower: allowablePower,
      thermalMargin: thermalMargin,
      voltageMargin: voltageMargin,
      currentMargin: currentMargin,
      voltageOver: voltageOver,
      currentOver: currentOver,
      thermalOver: thermalOver,
      electricalOver: electricalOver,
      interpretation: interpretation,
      status: { voltage: voltageOver ? "越界" : "有效", current: currentOver ? "越界" : "有效", thermal: thermalOver ? "越界" : "有效" }
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
      '[data-learning-lab="' + LAB_ID + '"]{--ept-blue:#1769aa;--ept-green:#2e7d57;--ept-red:#b23a32;--ept-gold:#9b6a12;display:block;max-width:100%;min-width:0;line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .ept-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ept-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ept-primary{border-color:var(--ept-blue);background:var(--ept-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ept-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ept-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .ept-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ept-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .ept-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ept-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ept-blue);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ept-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .ept-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ept-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .ept-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .ept-metric{min-width:0;padding:9px;border-top:2px solid var(--ept-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .ept-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ept-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] .ept-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ept-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .ept-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .ept-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .ept-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ept-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ept-choice-grid,[data-learning-lab="' + LAB_ID + '"] .ept-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ept-actions>*{flex-basis:100%}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-ept-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 330"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "器件功率到结温的热路径示意");
    node.appendChild(svgElement(doc, "title", {}, "功率、额定值与结温热路径")); node.appendChild(svgElement(doc, "desc", {}, "左侧是低压源驱动耗散负载，右侧是从结到壳再到环境的热阻路径和结温预算。"));
    node.appendChild(svgElement(doc, "rect", { x: 30, y: 90, width: 50, height: 70, rx: 4, fill: "var(--ept-blue)", "fill-opacity": ".12", stroke: "var(--ept-blue)", "stroke-width": 2 })); svgText(doc, node, "Vs", 55, 121, { "font-size": 15, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.config.appliedV, 1) + " V", 55, 141, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 80, y1: 125, x2: 125, y2: 125, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "rect", { x: 125, y: 99, width: 92, height: 52, rx: 4, fill: "var(--ept-red)", "fill-opacity": ".12", stroke: "var(--ept-red)", "stroke-width": 2 })); svgText(doc, node, "耗散负载", 171, 121, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, format(result.power, 3) + " W", 171, 140, { "font-size": 11, "text-anchor": "middle", fill: "var(--ept-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 217, y1: 125, x2: 258, y2: 125, stroke: "var(--ept-red)", "stroke-width": 4 })); node.appendChild(svgElement(doc, "polygon", { points: "258,125 247,119 247,131", fill: "var(--ept-red)" })); svgText(doc, node, "P=VI", 238, 105, { "font-size": 12, "text-anchor": "middle", fill: "var(--ept-red)" });
    node.appendChild(svgElement(doc, "line", { x1: 171, y1: 151, x2: 171, y2: 226, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 55, y1: 226, x2: 171, y2: 226, stroke: "currentColor", "stroke-width": 3 })); node.appendChild(svgElement(doc, "line", { x1: 55, y1: 226, x2: 55, y2: 160, stroke: "currentColor", "stroke-width": 3 })); svgText(doc, node, format(result.config.appliedI * 1000, 1) + " mA", 171, 249, { "font-size": 11, "text-anchor": "middle" });
    svgText(doc, node, "额定（教学设定）", 516, 57, { "font-size": 13, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "V≤" + format(result.config.ratedVoltage, 2) + " V，I≤" + format(result.config.ratedCurrent * 1000, 1) + " mA", 516, 78, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "rect", { x: 395, y: 100, width: 86, height: 52, rx: 4, fill: "var(--ept-red)", "fill-opacity": ".12", stroke: "var(--ept-red)", "stroke-width": 2 })); svgText(doc, node, "结 J", 438, 123, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "Tj=" + format(result.junction, 1) + " °C", 438, 141, { "font-size": 11, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 481, y1: 126, x2: 518, y2: 126, stroke: "var(--ept-red)", "stroke-width": 5 })); node.appendChild(svgElement(doc, "polygon", { points: "518,126 506,119 506,133", fill: "var(--ept-red)" })); svgText(doc, node, "热流", 500, 111, { "font-size": 11, "text-anchor": "middle", fill: "var(--ept-red)" });
    node.appendChild(svgElement(doc, "rect", { x: 518, y: 100, width: 86, height: 52, rx: 4, fill: "var(--ept-gold)", "fill-opacity": ".12", stroke: "var(--ept-gold)", "stroke-width": 2 })); svgText(doc, node, "壳 C", 561, 123, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "Rjc=" + format(result.config.rjc, 1) + " °C/W", 561, 141, { "font-size": 10, "text-anchor": "middle" });
    node.appendChild(svgElement(doc, "line", { x1: 604, y1: 126, x2: 641, y2: 126, stroke: "var(--ept-gold)", "stroke-width": 5 })); node.appendChild(svgElement(doc, "polygon", { points: "641,126 629,119 629,133", fill: "var(--ept-gold)" })); svgText(doc, node, "Rca=" + format(result.config.rca, 1) + " °C/W", 622, 94, { "font-size": 10, "text-anchor": "middle", fill: "var(--ept-gold)" }); node.appendChild(svgElement(doc, "rect", { x: 641, y: 100, width: 86, height: 52, rx: 4, fill: "var(--ept-green)", "fill-opacity": ".12", stroke: "var(--ept-green)", "stroke-width": 2 })); svgText(doc, node, "环境 A", 684, 123, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "Ta=" + format(result.config.ambient, 1) + " °C", 684, 141, { "font-size": 11, "text-anchor": "middle" });
    svgText(doc, node, "ΔT = P·Rθ,path = P·(Rjc+Rca) = " + format(result.temperatureRise, 2) + " °C", 555, 191, { "font-size": 12, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "允许功率 = (Tjmax−Ta)/Rθ,path = " + format(result.allowablePower, 3) + " W", 555, 222, { "font-size": 11, "text-anchor": "middle" }); svgText(doc, node, "状态：" + result.interpretation, 555, 255, { "font-size": 11, "text-anchor": "middle", fill: result.thermalOver || result.electricalOver ? "var(--ept-red)" : "var(--ept-green)" }); svgText(doc, node, "仅 J→C→A 的全部热流被迫走同一路径时才可相加", 555, 288, { "font-size": 11, "text-anchor": "middle" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "ept-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [["耗散功率 P", format(result.power, 6), "W；V·I"], ["教学串联热路 Rθ,path", format(result.rthetaPath, 4), "°C/W；Rjc+Rca，仅全热流 J→C→A"], ["结温上升 ΔT", format(result.temperatureRise, 5), "°C；P·Rθ,path"], ["结温 Tj", format(result.junction, 5), "°C；Ta+ΔT"], ["允许功率", format(result.allowablePower, 6), "W；至 Tjmax 的预算"], ["热余量", format(result.thermalMargin, 6), "W；允许功率−实际功率"], ["电压余量", format(result.voltageMargin, 4), "V；教学额定−施加"], ["电流余量", format(result.currentMargin * 1000, 4), "mA；教学额定−施加"], ["电压状态", result.voltageOver ? "越界" : "有效", "等号仍在边界内"], ["电流状态", result.currentOver ? "越界" : "有效", "等号仍在边界内"], ["热状态", result.thermalOver ? "越界" : "有效", "等号仍在边界内"], ["状态", result.interpretation, "同时报告电压、电流、热边界"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "功率、热阻与额定值账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE); var state = { config: { appliedV: DEFAULTS.appliedV, appliedI: DEFAULTS.appliedI, ambient: DEFAULTS.ambient, rjc: DEFAULTS.rjc, rca: DEFAULTS.rca, tjMax: DEFAULTS.tjMax }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "ept-shell" }); shell.appendChild(element(doc, "h3", { text: "热实验：功率、结温与降额" })); shell.appendChild(element(doc, "p", { className: "ept-note", text: "先预测功率和热阻的方向；揭示后调节低压工作点与散热路径。额定值均是教学设定，不是具体器件承诺。" })); var predictionHost = element(doc, "div"); var groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "ept-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "ept-actions" }); var reveal = element(doc, "button", { type: "button", className: "ept-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "ept-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback); var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "ept-controls" }); var inputs = {}; var outputs = {};
    [["appliedV", "施加电压", 0, 12, 0.1, function (v) { return format(v, 1) + " V"; }], ["appliedI", "工作电流", 0, 0.2, 0.001, function (v) { return format(v * 1000, 1) + " mA"; }], ["ambient", "环境温度", -10, 100, 1, function (v) { return format(v, 0) + " °C"; }], ["rjc", "Rjc", 1, 30, 1, function (v) { return format(v, 0) + " °C/W"; }], ["rca", "Rca", 1, 100, 1, function (v) { return format(v, 0) + " °C/W"; }], ["tjMax", "Tjmax", 60, 180, 1, function (v) { return format(v, 0) + " °C"; }]].forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "ept-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = { node: output, format: spec[5] }; });
    results.appendChild(controls); var layout = element(doc, "div", { className: "ept-layout" }); var stage = element(doc, "div", { className: "ept-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "ept-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "ept-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "ept-note", text: "Rθ,path=Rjc+Rca 只是全热流被迫走 J→C→A 的教学假设；真实封装优先使用系统有效 θJA，或在有效散热器假设下使用 θJC+θCS+θSA。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeThermal(state.config); results.hidden = !state.revealed; Object.keys(outputs).forEach(function (key) { outputs[key].node.textContent = outputs[key].format(result.config[key]); }); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "功率", format(result.power, 3) + " W")); metrics.appendChild(metric(doc, "结温", format(result.junction, 1) + " °C")); metrics.appendChild(metric(doc, "允许功率", format(result.allowablePower, 3) + " W")); metrics.appendChild(metric(doc, "状态", result.interpretation)); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。改变环境温度或 Rca，再看允许功率而不只看瞬时功率。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { appliedV: DEFAULTS.appliedV, appliedI: DEFAULTS.appliedI, ambient: DEFAULTS.ambient, rjc: DEFAULTS.rjc, rca: DEFAULTS.rca, tjMax: DEFAULTS.tjMax }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "功率热实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-ept-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computeThermal(DEFAULTS); check(near(result.power, 0.4), "power"); check(near(result.rthetaPath, 40), "series teaching thermal path"); check(near(result.junction, 41), "junction temperature"); check(near(result.allowablePower, 2.5), "allowable power"); check(near(computeThermal({ appliedI: 0.16 }).power, 0.8), "power doubles with current"); check(computeThermal({ ambient: 60 }).allowablePower < result.allowablePower, "higher ambient lowers allowed power"); check(computeThermal({ rca: 70 }).junction > result.junction, "larger thermal resistance raises junction temperature"); var voltageOnly = computeThermal({ appliedV: 6 }); check(voltageOnly.voltageOver && !voltageOnly.currentOver && !voltageOnly.thermalOver, "voltage-only violation"); var currentOnly = computeThermal({ appliedI: 0.2 }); check(!currentOnly.voltageOver && currentOnly.currentOver && !currentOnly.thermalOver, "current-only violation"); var thermalOnly = computeThermal({ appliedI: 0.5, ratedCurrent: 0.5, ambient: 30 }); check(!thermalOnly.voltageOver && !thermalOnly.currentOver && thermalOnly.thermalOver, "thermal-only violation"); var combined = computeThermal({ appliedV: 6, appliedI: 0.2, ambient: 100 }); check(combined.voltageOver && combined.currentOver && combined.thermalOver, "combined violations"); var equal = computeThermal({ appliedV: 5.5, ratedVoltage: 5.5, appliedI: 0.1, ratedCurrent: 0.1, ambient: 25, tjMax: 47 }); check(!equal.voltageOver && !equal.currentOver && !equal.thermalOver && near(equal.voltageMargin, 0) && near(equal.currentMargin, 0) && near(equal.junction, equal.config.tjMax), "equality is still valid"); check(JSON.stringify(computeThermal(DEFAULTS)) === JSON.stringify(computeThermal(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, computeThermal: computeThermal, mount: mount, selfTest: selfTest };
});
