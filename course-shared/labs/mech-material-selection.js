(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (typeof window !== "undefined" && window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("mech-material-selection", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-material-selection self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-material-selection self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "mech-material-selection";
  var STYLE_ID = "cl-mech-material-selection-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var CASES = {
    tieStiff: { label: "拉杆刚度 E/ρ", key: "tieStiff" },
    tieStrength: { label: "拉杆强度 σ/ρ", key: "tieStrength" },
    beamStiff: { label: "梁弯曲刚度 E^(1/3)/ρ", key: "beamStiff" },
    beamStrength: { label: "梁弯曲强度 σ^(2/3)/ρ", key: "beamStrength" }
  };
  var PROCESSES = ["machining", "casting", "forming", "additive", "layup"];
  var MATERIALS = [
    { name: "钢", rho: 7850, E: 200, strength: 600, temp: 300, cost: 1, processes: ["machining", "casting", "forming", "additive"] },
    { name: "铝合金", rho: 2700, E: 70, strength: 300, temp: 120, cost: 2, processes: ["machining", "casting", "forming", "additive"] },
    { name: "钛合金", rho: 4500, E: 110, strength: 800, temp: 300, cost: 5, processes: ["machining", "forming", "additive"] },
    { name: "玻纤复材", rho: 1900, E: 35, strength: 250, temp: 100, cost: 4, processes: ["layup"] },
    { name: "PEEK", rho: 1400, E: 3.5, strength: 100, temp: 150, cost: 4, processes: ["machining", "additive"] }
  ];
  var DEFAULTS = { case: "beamStiff", minE: 60, minStrength: 250, serviceTemp: 120, process: "machining" };
  var PREDICTIONS = [
    { key: "beam", prompt: "弯曲刚度指数下，低 E 但低密度的铝相对钢会怎样？", expected: "better", choices: [["better", "铝可能更好"], ["worse", "铝一定更差"], ["same", "必然相同"]] },
    { key: "temperature", prompt: "提高最高服役温度要求，会怎样改变通过过滤的候选数？", expected: "decrease", choices: [["decrease", "减少"], ["increase", "增多"], ["same", "只改排序"]] },
    { key: "flowdown", prompt: "能否先凭材料家族声誉选材，再补载荷、温度和工艺？", expected: "no", choices: [["no", "不能"], ["yes", "可以"], ["only-cost", "只要成本低即可"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale; }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function bounded(value, label, low, high) { var number = finite(value, label); if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]"); return number; }
  function normalizeConfig(input) {
    var source = input || {};
    var selectedCase = source.case === undefined ? DEFAULTS.case : String(source.case);
    if (!CASES[selectedCase]) throw new RangeError("case is not supported");
    var process = source.process === undefined ? DEFAULTS.process : String(source.process);
    if (PROCESSES.indexOf(process) === -1) throw new RangeError("process is not supported");
    return { case: selectedCase, minE: bounded(source.minE === undefined ? DEFAULTS.minE : source.minE, "minE", 0, 220), minStrength: bounded(source.minStrength === undefined ? DEFAULTS.minStrength : source.minStrength, "minStrength", 0, 900), serviceTemp: bounded(source.serviceTemp === undefined ? DEFAULTS.serviceTemp : source.serviceTemp, "serviceTemp", 0, 350), process: process };
  }
  function indexFor(material, caseKey) {
    if (caseKey === "tieStiff") return material.E / material.rho;
    if (caseKey === "tieStrength") return material.strength / material.rho;
    if (caseKey === "beamStiff") return Math.pow(material.E, 1 / 3) / material.rho;
    return Math.pow(material.strength, 2 / 3) / material.rho;
  }
  function model(input) {
    var config = normalizeConfig(input);
    var rows = MATERIALS.map(function (material) {
      var reasons = [];
      if (material.E < config.minE) reasons.push("E");
      if (material.strength < config.minStrength) reasons.push("strength");
      if (material.temp < config.serviceTemp) reasons.push("temperature");
      if (material.processes.indexOf(config.process) === -1) reasons.push("process");
      return { material: material, index: indexFor(material, config.case), eligible: reasons.length === 0, reasons: reasons };
    });
    var eligible = rows.filter(function (row) { return row.eligible; });
    var best = eligible.length ? eligible.reduce(function (current, row) { return row.index > current.index ? row : current; }) : null;
    var maxIndex = Math.max.apply(null, rows.map(function (row) { return row.index; }));
    return { config: config, rows: rows, eligible: eligible, best: best, caseLabel: CASES[config.case].label, maxIndex: maxIndex, assumptions: "同一数据表内的 Ashby 相对指数；属性/工艺/成本均为教学筛查值" };
  }
  function formatNumber(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 3 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5)); return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, ""); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "text") node.textContent = String(value); else if (key === "className") node.setAttribute("class", value); else if (key === "htmlFor") node.setAttribute("for", value); else node.setAttribute(key, String(value)); }); (children || []).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); }); return node; }
  function svgText(doc, parent, value, x, y, className) { var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mms-label" }); node.textContent = value; parent.appendChild(node); }
  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mms-blue:#245a9b;--mms-green:#2d7a4b;--mms-orange:#ad6811;--mms-red:#b23a32;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}' +
      '[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}[data-learning-lab="' + LAB_ID + '"] .mms-note,[data-learning-lab="' + LAB_ID + '"] .mms-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .mms-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mms-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mms-primary{border-color:var(--mms-blue);background:var(--mms-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid #1769aa;outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .mms-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mms-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .mms-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mms-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .mms-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mms-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mms-control output{color:var(--mms-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mms-blue)}[data-learning-lab="' + LAB_ID + '"] select{width:100%;min-height:44px;padding:7px 8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] .mms-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mms-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mms-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mms-metric{min-width:0;padding:8px;border-top:3px solid var(--mms-blue)}[data-learning-lab="' + LAB_ID + '"] .mms-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mms-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mms-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mms-pass{color:var(--mms-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mms-warn{color:var(--mms-red);font-weight:700}' +
      '@media(max-width:1000px){[data-learning-lab="' + LAB_ID + '"] .mms-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mms-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mms-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mms-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mms-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .mms-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mms-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mms-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function drawSvg(doc, svg, result) {
    clear(svg); var width = 700; var height = 390; var left = 170; var right = 650; var top = 35; var rowHeight = 52; var max = result.maxIndex;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "不同材料在当前设计工况下的相对 Ashby 指数和硬过滤状态");
    result.rows.forEach(function (row, index) { var y = top + index * rowHeight; var bar = row.index / max * (right - left); svgText(doc, svg, row.material.name, 10, y + 16, "mms-label"); svg.appendChild(svgElement(doc, "rect", { x: left, y: y, width: Math.max(3, bar), height: 22, fill: row.eligible ? "var(--mms-green)" : "var(--mms-red)", opacity: row.eligible ? 0.78 : 0.32 })); svgText(doc, svg, formatNumber(row.index, 5), left + bar + 8, y + 16, "mms-label"); svgText(doc, svg, row.eligible ? "PASS" : "BLOCK: " + row.reasons.join(","), 10, y + 36, row.eligible ? "mms-green" : "mms-red"); });
    svgText(doc, svg, result.caseLabel, left, 15, "mms-blue"); svgText(doc, svg, "相对指数（同表单位）", right - 125, 15, "mms-label");
  }
  function renderTable(doc, hostNode, headings, rows) { clear(hostNode); var table = element(doc, "table", {}); var header = element(doc, "tr", {}); headings.forEach(function (heading) { header.appendChild(element(doc, "th", { scope: "col", text: heading })); }); table.appendChild(element(doc, "thead", {}, [header])); var body = element(doc, "tbody", {}); rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); }); body.appendChild(tr); }); table.appendChild(body); hostNode.appendChild(table); }
  function metric(doc, label, value) { return element(doc, "div", { className: "mms-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (host && host.document); if (!doc) throw new Error("a document is required to mount the lab"); installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { case: DEFAULTS.case, minE: DEFAULTS.minE, minStrength: DEFAULTS.minStrength, serviceTemp: DEFAULTS.serviceTemp, process: DEFAULTS.process }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" };
    var shell = element(doc, "div", { className: "mms-shell" }); shell.appendChild(element(doc, "h3", { text: "材料实验：指数、过滤与需求流向" })); shell.appendChild(element(doc, "p", { className: "mms-note", text: "先完成三项预测；指数仅作同一属性表内的相对 proxy。E 用 GPa，强度用 MPa，密度用 kg/m³，温度用 °C。" }));
    var predictionHost = element(doc, "div", { className: "mms-predictions" }); PREDICTIONS.forEach(function (spec, index) { var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + spec.prompt })); var grid = element(doc, "div", { className: "mms-choice-grid" }); spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { state.predictions[spec.key] = choice[0]; grid.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); }); grid.appendChild(button); }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "mms-actions" }); var reveal = element(doc, "button", { type: "button", className: "mms-primary", text: "提交预测并揭示" }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "mms-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var bench = element(doc, "div", { className: "mms-bench" }); bench.hidden = true; var controls = element(doc, "div", { className: "mms-controls" }); var controlRefs = {};
    var caseSelect = element(doc, "select", { id: uid + "-case", "aria-label": "设计工况" }); Object.keys(CASES).forEach(function (key) { caseSelect.appendChild(element(doc, "option", { value: key, text: CASES[key].label })); }); caseSelect.value = state.config.case; var caseWrap = element(doc, "div", { className: "mms-control" }, [element(doc, "label", { htmlFor: uid + "-case", text: "设计工况" }), caseSelect]); controls.appendChild(caseWrap); controlRefs.case = caseSelect;
    [{ key: "minE", label: "最小 E", min: 0, max: 210, step: 5, unit: " GPa" }, { key: "minStrength", label: "最小强度", min: 0, max: 900, step: 25, unit: " MPa" }, { key: "serviceTemp", label: "服役温度", min: 0, max: 300, step: 5, unit: " °C" }].forEach(function (definition) { var inputId = uid + "-" + definition.key; var output = element(doc, "output", { for: inputId, text: "" }); var label = element(doc, "label", { htmlFor: inputId }, [definition.label + " ", output]); var input = element(doc, "input", { id: inputId, type: "range", min: definition.min, max: definition.max, step: definition.step, value: state.config[definition.key] }); input.addEventListener("input", function () { state.config[definition.key] = Number(input.value); render(); }); controls.appendChild(element(doc, "div", { className: "mms-control" }, [label, input])); controlRefs[definition.key] = { input: input, output: output, unit: definition.unit }; });
    var processSelect = element(doc, "select", { id: uid + "-process", "aria-label": "制造过程" }); PROCESSES.forEach(function (process) { processSelect.appendChild(element(doc, "option", { value: process, text: process })); }); processSelect.value = state.config.process; processSelect.addEventListener("change", function () { state.config.process = processSelect.value; render(); }); controls.appendChild(element(doc, "div", { className: "mms-control" }, [element(doc, "label", { htmlFor: uid + "-process", text: "制造过程" }), processSelect])); controlRefs.process = processSelect; caseSelect.addEventListener("change", function () { state.config.case = caseSelect.value; render(); }); bench.appendChild(controls);
    var metrics = element(doc, "div", { className: "mms-metrics" }); bench.appendChild(metrics); var layout = element(doc, "div", { className: "mms-layout" }); var stage = element(doc, "div", { className: "mms-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var right = element(doc, "div", {}); right.appendChild(element(doc, "h4", { text: "候选属性与过滤" })); var candidatesTable = element(doc, "div", { className: "mms-table-wrap" }); right.appendChild(candidatesTable); right.appendChild(element(doc, "h4", { text: "证据 ledger" })); var ledgerTable = element(doc, "div", { className: "mms-table-wrap" }); right.appendChild(ledgerTable); layout.appendChild(right); bench.appendChild(layout); shell.appendChild(bench); clear(rootNode); rootNode.appendChild(shell);
    function render() { var result = model(state.config); caseSelect.value = result.config.case; processSelect.value = result.config.process; controlRefs.minE.input.value = result.config.minE; controlRefs.minStrength.input.value = result.config.minStrength; controlRefs.serviceTemp.input.value = result.config.serviceTemp; controlRefs.minE.output.textContent = formatNumber(result.config.minE, 0) + " GPa"; controlRefs.minStrength.output.textContent = formatNumber(result.config.minStrength, 0) + " MPa"; controlRefs.serviceTemp.output.textContent = formatNumber(result.config.serviceTemp, 0) + " °C"; feedback.textContent = state.feedback; bench.hidden = !state.revealed; if (!state.revealed) return; var bestText = result.best ? result.best.material.name : "无候选"; metrics.replaceChildren(metric(doc, "当前工况", result.caseLabel), metric(doc, "通过数", result.eligible.length + " / " + result.rows.length), metric(doc, "首选", bestText), metric(doc, "要求温度", formatNumber(result.config.serviceTemp, 0) + " °C")); drawSvg(doc, svg, result); renderTable(doc, candidatesTable, ["材料", "指数", "过滤", "原因"], result.rows.map(function (row) { return [row.material.name, formatNumber(row.index, 6), row.eligible ? "PASS" : "BLOCK", row.eligible ? "-" : row.reasons.join(", ")]; })); renderTable(doc, ledgerTable, ["证据", "读数", "单位/边界"], [["工况", result.caseLabel, "指数假设"], ["硬过滤", result.eligible.length + " / " + result.rows.length, "E/强度/温度/工艺"], ["首选", bestText, result.best ? "当前指数最高" : "需求无可行候选"], ["成本", result.best ? formatNumber(result.best.material.cost, 1) : "-", "归一化 cost proxy"], ["验证边界", "属性代表性筛查", "需牌号、连接、环境和试验"]]); }
    reveal.addEventListener("click", function () { if (!PREDICTIONS.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测；结果仍然隐藏。"; render(); return; } var correct = PREDICTIONS.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭示：" + correct + "/3 命中。现在改变工况与过滤器，观察需求流向。"; render(); if (api && typeof api.announce === "function") api.announce(rootNode, "材料实验已揭示，指数与硬过滤账本已显示。"); });
    reset.addEventListener("click", function () { state = { config: { case: DEFAULTS.case, minE: DEFAULTS.minE, minStrength: DEFAULTS.minStrength, serviceTemp: DEFAULTS.serviceTemp, process: DEFAULTS.process }, predictions: {}, revealed: false, feedback: "结果尚未揭示。" }; predictionHost.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "材料实验已重置，预测结果再次隐藏。"); }); render(); if (api && typeof api.announce === "function") api.announce(rootNode, "材料实验已加载；先完成三项预测。");
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = model(DEFAULTS); check(result.eligible.length === 3, "default hard filters"); check(result.best && result.best.material.name === "铝合金", "beam stiffness best under default filters"); check(near(indexFor(MATERIALS[1], "tieStiff"), 70 / 2700), "tie stiffness index"); check(indexFor(MATERIALS[1], "beamStiff") > indexFor(MATERIALS[0], "beamStiff"), "aluminum beam index beats steel"); check(indexFor(MATERIALS[2], "tieStrength") > indexFor(MATERIALS[0], "tieStrength"), "titanium strength index"); check(model({ serviceTemp: 220 }).eligible.length < result.eligible.length, "temperature filter removes candidates"); check(model({ process: "layup", minE: 0, minStrength: 200, serviceTemp: 90 }).eligible.some(function (row) { return row.material.name === "玻纤复材"; }), "process filter admits layup composite when requirements fit"); check(model({ minE: 210 }).eligible.length === 0, "modulus boundary can block all candidates"); var invalidCase = false; try { model({ case: "universal" }); } catch (error) { invalidCase = true; } check(invalidCase, "case boundary"); var invalidProcess = false; try { model({ process: "printing" }); } catch (error) { invalidProcess = true; } check(invalidProcess, "process boundary"); return { checks: checks }; }
  return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, MATERIALS: MATERIALS, normalizeConfig: normalizeConfig, indexFor: indexFor, model: model, mount: mount, selfTest: selfTest };
});
