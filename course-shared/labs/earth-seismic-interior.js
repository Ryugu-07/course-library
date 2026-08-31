(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-seismic-interior", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-seismic-interior self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-seismic-interior self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "earth-seismic-interior";
  var STYLE_ID = "cl-earth-seismic-interior-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { distance: 4000, vp: 8, vs: 4.5, medium: "solid" };
  var QUESTIONS = [
    { key: "first", prompt: "在同一路径上且 vP > vS 时，哪一相先到？", expected: "p", choices: [["p", "P 波"], ["s", "S 波"], ["same", "同时"]] },
    { key: "liquid", prompt: "液态介质的剪切刚度近似为零，直达 S 波会？", expected: "blocked", choices: [["blocked", "被阻断"], ["pass", "照常通过"], ["faster", "变得更快"]] },
    { key: "station", prompt: "一个台站的一条到时差能唯一定位内部界面吗？", expected: "no", choices: [["no", "不能"], ["yes", "能"], ["always", "总能"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (value === null || !isFinite(value)) return "不可用"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function normalize(input) {
    var source = input || {};
    var vp = clamp(finite(source.vp === undefined ? DEFAULTS.vp : source.vp, "P speed"), 5, 12);
    var vs = clamp(finite(source.vs === undefined ? DEFAULTS.vs : source.vs, "S speed"), 2, 7);
    if (vs >= vp) vs = Math.max(2, vp - 0.1);
    return {
      distance: clamp(finite(source.distance === undefined ? DEFAULTS.distance : source.distance, "path length"), 500, 12000),
      vp: vp,
      vs: vs,
      medium: source.medium === "liquid" ? "liquid" : "solid"
    };
  }
  function computeSeismic(input) {
    var config = normalize(input);
    var pTime = config.distance / config.vp;
    var sTime = config.medium === "liquid" ? null : config.distance / config.vs;
    var gap = sTime === null ? null : sTime - pTime;
    return {
      config: config,
      pTime: pTime,
      sTime: sTime,
      gap: gap,
      pMinutes: pTime / 60,
      sMinutes: sTime === null ? null : sTime / 60,
      sDirect: sTime !== null,
      interpretation: sTime === null ? "液态路径：无直达 S" : "固体路径：P 先于 S"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node;
  }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value)); }); if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--esi-blue:#2563a6;--esi-green:#39734d;--esi-gold:#9b6a12;--esi-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}[data-learning-lab="' + LAB_ID + '"] .esi-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] select:hover{border-color:var(--esi-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .esi-primary{border-color:var(--esi-blue);background:var(--esi-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .esi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .esi-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .esi-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .esi-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .esi-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .esi-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--esi-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--esi-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .esi-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .esi-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .esi-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .esi-metric{min-width:0;padding:9px;border-top:2px solid var(--esi-blue)}[data-learning-lab="' + LAB_ID + '"] .esi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .esi-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .esi-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .esi-note{color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .esi-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .esi-choice-grid,[data-learning-lab="' + LAB_ID + '"] .esi-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .esi-choice-grid,[data-learning-lab="' + LAB_ID + '"] .esi-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .esi-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); else { var live = rootNode.querySelector("[data-esi-live]"); if (live) live.textContent = message; } }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 350"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "地震波路径与 P S 到时示意"); node.appendChild(svgElement(doc, "title", {}, "地震波路径和到时账本")); node.appendChild(svgElement(doc, "desc", {}, "左侧显示穿过固体或液体路径的 P、S 概念波线，右侧显示到时条。"));
    var coreFill = result.config.medium === "liquid" ? "var(--esi-red)" : "var(--esi-gold)";
    node.appendChild(svgElement(doc, "circle", { cx: 158, cy: 171, r: 112, fill: "var(--esi-gold)", "fill-opacity": ".10", stroke: "currentColor", "stroke-opacity": ".55", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "circle", { cx: 158, cy: 171, r: 48, fill: coreFill, "fill-opacity": result.config.medium === "liquid" ? ".30" : ".12", stroke: coreFill, "stroke-opacity": ".70", "stroke-width": 2 }));
    node.appendChild(svgElement(doc, "path", { d: "M58 157 Q158 78 258 157", fill: "none", stroke: "var(--esi-blue)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "path", { d: "M58 185 Q158 266 258 185", fill: "none", stroke: "var(--esi-red)", "stroke-width": 3, "stroke-dasharray": result.sDirect ? "0" : "7 5" }));
    node.appendChild(svgElement(doc, "circle", { cx: 58, cy: 171, r: 7, fill: "var(--esi-green)" })); node.appendChild(svgElement(doc, "circle", { cx: 258, cy: 171, r: 7, fill: "var(--esi-green)" }));
    svgText(doc, node, "路径", 158, 28, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" }); svgText(doc, node, "震源", 45, 210, { "font-size": 11, fill: "var(--esi-green)" }); svgText(doc, node, "台站", 267, 210, { "font-size": 11, fill: "var(--esi-green)" }); svgText(doc, node, "P", 155, 74, { "font-size": 13, fill: "var(--esi-blue)" }); svgText(doc, node, "S", 156, 278, { "font-size": 13, fill: "var(--esi-red)" }); svgText(doc, node, result.config.medium === "liquid" ? "液态：S 缺失" : "固体：S 可传播", 158, 314, { "font-size": 11, "text-anchor": "middle", fill: coreFill });
    var left = 365, right = 730, baseY = 90, maxTime = Math.max(result.pTime, result.sTime === null ? result.pTime * 1.6 : result.sTime) * 1.25;
    node.appendChild(svgElement(doc, "line", { x1: left, y1: baseY, x2: right, y2: baseY, stroke: "currentColor", "stroke-opacity": ".25" }));
    function timeX(value) { return left + (right - left) * value / maxTime; }
    [0, 0.5, 1].forEach(function (fraction) { var x = left + (right - left) * fraction; node.appendChild(svgElement(doc, "line", { x1: x, y1: baseY - 5, x2: x, y2: baseY + 5, stroke: "currentColor", "stroke-opacity": ".45" })); svgText(doc, node, format(maxTime * fraction, 0) + " s", x, baseY + 23, { "font-size": 10, "text-anchor": "middle" }); });
    var px = timeX(result.pTime); node.appendChild(svgElement(doc, "rect", { x: left, y: 140, width: Math.max(3, px - left), height: 22, fill: "var(--esi-blue)", "fill-opacity": ".23" })); node.appendChild(svgElement(doc, "line", { x1: px, y1: 128, x2: px, y2: 188, stroke: "var(--esi-blue)", "stroke-width": 3 })); svgText(doc, node, "P  " + format(result.pTime, 1) + " s", left, 126, { "font-size": 12, fill: "var(--esi-blue)" });
    if (result.sDirect) { var sx = timeX(result.sTime); node.appendChild(svgElement(doc, "rect", { x: left, y: 235, width: Math.max(3, sx - left), height: 22, fill: "var(--esi-red)", "fill-opacity": ".18" })); node.appendChild(svgElement(doc, "line", { x1: sx, y1: 223, x2: sx, y2: 283, stroke: "var(--esi-red)", "stroke-width": 3 })); svgText(doc, node, "S  " + format(result.sTime, 1) + " s", left, 220, { "font-size": 12, fill: "var(--esi-red)" }); svgText(doc, node, "Δt=" + format(result.gap, 1) + " s", right, 305, { "font-size": 12, "text-anchor": "end", fill: "var(--esi-gold)" }); }
    else { node.appendChild(svgElement(doc, "line", { x1: left, y1: 246, x2: right, y2: 246, stroke: "var(--esi-red)", "stroke-width": 3, "stroke-dasharray": "8 5" })); svgText(doc, node, "S  直达相位不可用", left, 220, { "font-size": 12, fill: "var(--esi-red)" }); }
    svgText(doc, node, "到时条：不是完整层析", left, 335, { "font-size": 11, fill: "var(--fg-soft)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "esi-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) { clear(hostNode); var rows = [["路径长度 L", format(result.config.distance, 0), "km；教学路径"], ["P 速度", format(result.config.vp, 2), "km/s"], ["S 速度", result.sDirect ? format(result.config.vs, 2) : "不可用（液态路径）", result.sDirect ? "km/s" : "剪切相位被阻断"], ["P 到时", format(result.pTime, 2), "s"], ["S 到时", format(result.sTime, 2), "s；直达相位"], ["S−P", format(result.gap, 2), "s"], ["解释", result.interpretation, "需多路径校验"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "P/S 传播账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body])); }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return; var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE); var state = { config: { distance: DEFAULTS.distance, vp: DEFAULTS.vp, vs: DEFAULTS.vs, medium: DEFAULTS.medium }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; rootNode.textContent = "";
    var shell = element(doc, "div", { className: "esi-shell" }); shell.appendChild(element(doc, "h3", { text: "地震实验：波型差异如何提供内部证据" })); shell.appendChild(element(doc, "p", { className: "esi-note", text: "先预测 P/S 顺序与液态边界；揭示后调节路径、速度和介质。" })); var predictionHost = element(doc, "div"), groups = [], reveal;
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "esi-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); if (reveal) reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "esi-actions" }); reveal = element(doc, "button", { type: "button", className: "esi-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "esi-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "esi-controls" }); var specs = [["distance", "路径长度", 500, 12000, 100, "km"], ["vp", "P 速度", 5, 12, 0.1, "km/s"], ["vs", "S 速度", 2, 7, 0.1, "km/s"]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "esi-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; });
    var mediumId = uid + "-medium"; var mediumLabel = element(doc, "label", { htmlFor: mediumId, text: "路径介质" }); var mediumSelect = element(doc, "select", { id: mediumId, "aria-label": "路径介质" }, [element(doc, "option", { value: "solid", text: "固体" }), element(doc, "option", { value: "liquid", text: "液体" })]); mediumSelect.value = state.config.medium; mediumSelect.addEventListener("change", function () { state.config.medium = mediumSelect.value; if (state.revealed) renderResult(); }); controls.appendChild(element(doc, "div", { className: "esi-control" }, [mediumLabel, mediumSelect])); results.appendChild(controls);
    var layout = element(doc, "div", { className: "esi-layout" }); var stage = element(doc, "div", { className: "esi-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "esi-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "esi-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "esi-note", text: "均匀速度和一条路径只是教学模型；真实成像要联合多台站、多震相和速度模型。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeSeismic(state.config); state.config = { distance: result.config.distance, vp: result.config.vp, vs: result.config.vs, medium: result.config.medium }; results.hidden = !state.revealed; inputs.distance.value = result.config.distance; inputs.vp.value = result.config.vp; inputs.vs.max = String(Math.min(7, result.config.vp - 0.1)); inputs.vs.value = result.config.vs; inputs.vs.disabled = !result.sDirect; outputs.distance.textContent = format(result.config.distance, 0) + " km"; outputs.vp.textContent = format(result.config.vp, 1) + " km/s"; outputs.vs.textContent = result.sDirect ? format(result.config.vs, 1) + " km/s" : "不可用（液态）"; mediumSelect.value = result.config.medium; drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "P 到时", format(result.pTime, 1) + " s")); metrics.appendChild(metric(doc, "S 到时", format(result.sTime, 1) + " s")); metrics.appendChild(metric(doc, "S−P", format(result.gap, 1) + " s")); metrics.appendChild(metric(doc, "路径判断", result.sDirect ? "S 可传播" : "S 被阻断")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在比较路径长度与介质的作用。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { distance: DEFAULTS.distance, vp: DEFAULTS.vp, vs: DEFAULTS.vs, medium: DEFAULTS.medium }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); mediumSelect.value = state.config.medium; render(); announce(api, rootNode, "地震实验已重置。"); }); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-esi-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros"); var result = computeSeismic(DEFAULTS); check(near(result.pTime, 500), "P time"); check(near(result.sTime, 4000 / 4.5), "S time"); check(result.pTime < result.sTime, "P arrives first"); check(near(result.gap, result.sTime - result.pTime), "arrival gap"); var constrained = computeSeismic({ distance: 4000, vp: 5, vs: 7, medium: "solid" }); check(constrained.config.vs < constrained.config.vp && constrained.gap > 0, "solid-path speed constraint preserves P-first ordering"); check(computeSeismic({ distance: 4000, vp: 8, vs: 4.5, medium: "liquid" }).sTime === null, "liquid blocks direct S"); check(JSON.stringify(result) === JSON.stringify(computeSeismic(DEFAULTS)), "deterministic seismic model"); return { checks: checks }; }
  return { computeSeismic: computeSeismic, mount: mount, selfTest: selfTest };
});
