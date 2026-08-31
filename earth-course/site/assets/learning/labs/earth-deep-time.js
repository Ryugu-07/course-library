(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-deep-time", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-deep-time self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-deep-time self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "earth-deep-time";
  var STYLE_ID = "cl-earth-deep-time-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = { halfLife: 100, parentFraction: 0.5, fractionUncertainty: 0.04 };
  var QUESTIONS = [
    { key: "order", prompt: "在未扰动连续沉积层中，上面的层通常是？", expected: "young", choices: [["young", "较年轻"], ["old", "较老"], ["none", "无法排序"]] },
    { key: "fraction", prompt: "母体比例从 0.50 降到 0.25，年龄会？", expected: "older", choices: [["older", "变老"], ["younger", "变年轻"], ["same", "不变"]] },
    { key: "halfLife", prompt: "比例固定而半衰期加倍，年龄会？", expected: "double", choices: [["double", "加倍"], ["half", "减半"], ["same", "不变"]] }
  ];

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  function normalize(input) {
    var source = input || {};
    return {
      halfLife: clamp(finite(source.halfLife === undefined ? DEFAULTS.halfLife : source.halfLife, "half-life"), 1, 5000),
      parentFraction: clamp(finite(source.parentFraction === undefined ? DEFAULTS.parentFraction : source.parentFraction, "parent fraction"), 0.02, 0.98),
      fractionUncertainty: clamp(finite(source.fractionUncertainty === undefined ? DEFAULTS.fractionUncertainty : source.fractionUncertainty, "fraction uncertainty"), 0.001, 0.20)
    };
  }
  function computeDeepTime(input) {
    var config = normalize(input);
    var lambda = Math.log(2) / config.halfLife;
    var age = Math.log(1 / config.parentFraction) / lambda;
    var ageUncertainty = config.fractionUncertainty / (lambda * config.parentFraction);
    return {
      config: config,
      lambda: lambda,
      age: age,
      ageUncertainty: ageUncertainty,
      daughterFraction: 1 - config.parentFraction,
      halfLivesElapsed: age / config.halfLife,
      relativeUncertainty: ageUncertainty / Math.max(age, 1e-12),
      order: "下层较老 → 灰层 → 上层较年轻"
    };
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key]; if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value)); else if (key === "text") node.textContent = String(value); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value));
    });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value)); });
    if (children !== undefined && children !== null) (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child !== undefined && child !== null && child !== false) node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function svgText(doc, parent, text, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, text)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--edt-blue:#2563a6;--edt-green:#39734d;--edt-gold:#9b6a12;--edt-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}[data-learning-lab="' + LAB_ID + '"] .edt-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--edt-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .edt-primary{border-color:var(--edt-blue);background:var(--edt-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .edt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .edt-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .edt-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .edt-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .edt-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .edt-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--edt-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--edt-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .edt-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .edt-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .edt-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .edt-metric{min-width:0;padding:9px;border-top:2px solid var(--edt-blue)}[data-learning-lab="' + LAB_ID + '"] .edt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .edt-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .edt-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .edt-note{color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .edt-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .edt-choice-grid,[data-learning-lab="' + LAB_ID + '"] .edt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .edt-choice-grid,[data-learning-lab="' + LAB_ID + '"] .edt-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .edt-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); else { var live = rootNode.querySelector("[data-edt-live]"); if (live) live.textContent = message; } }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 760 330"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "地层顺序与放射性时钟示意");
    node.appendChild(svgElement(doc, "title", {}, "地层相对顺序与同位素年龄")); node.appendChild(svgElement(doc, "desc", {}, "左侧是下老上新的地层柱，右侧是母体比例、女儿比例和年龄标尺。"));
    node.appendChild(svgElement(doc, "rect", { x: 35, y: 60, width: 170, height: 220, rx: 5, fill: "var(--edt-gold)", "fill-opacity": ".10", stroke: "currentColor", "stroke-opacity": ".5" }));
    node.appendChild(svgElement(doc, "rect", { x: 36, y: 211, width: 168, height: 68, fill: "var(--edt-blue)", "fill-opacity": ".24" }));
    node.appendChild(svgElement(doc, "rect", { x: 36, y: 142, width: 168, height: 68, fill: "var(--edt-green)", "fill-opacity": ".23" }));
    node.appendChild(svgElement(doc, "rect", { x: 36, y: 116, width: 168, height: 18, fill: "var(--edt-red)", "fill-opacity": ".78" }));
    svgText(doc, node, "地层柱", 120, 37, { "font-size": 14, "font-weight": 700, "text-anchor": "middle" });
    svgText(doc, node, "上新", 120, 100, { "font-size": 12, "text-anchor": "middle", fill: "var(--edt-green)" });
    svgText(doc, node, "灰层", 120, 129, { "font-size": 11, "font-weight": 700, "text-anchor": "middle", fill: "#fff" });
    svgText(doc, node, "下老", 120, 250, { "font-size": 12, "text-anchor": "middle", fill: "var(--edt-blue)" });
    svgText(doc, node, "叠覆律：有条件", 120, 303, { "font-size": 11, "text-anchor": "middle", fill: "var(--fg-soft)" });
    var left = 300, right = 725, rulerY = 244, scaleMax = Math.max(result.age * 1.25, result.config.halfLife * 3, 1);
    node.appendChild(svgElement(doc, "line", { x1: left, y1: rulerY, x2: right, y2: rulerY, stroke: "currentColor", "stroke-opacity": ".55" }));
    for (var tick = 0; tick <= 4; tick += 1) { var tx = left + (right - left) * tick / 4; node.appendChild(svgElement(doc, "line", { x1: tx, y1: rulerY - 5, x2: tx, y2: rulerY + 5, stroke: "currentColor", "stroke-opacity": ".55" })); svgText(doc, node, format(scaleMax * tick / 4, 0), tx, rulerY + 22, { "font-size": 10, "text-anchor": "middle" }); }
    var ageX = left + (right - left) * result.age / scaleMax;
    node.appendChild(svgElement(doc, "line", { x1: ageX, y1: 93, x2: ageX, y2: rulerY, stroke: "var(--edt-red)", "stroke-width": 3 }));
    node.appendChild(svgElement(doc, "circle", { cx: ageX, cy: rulerY, r: 6, fill: "var(--edt-red)" }));
    svgText(doc, node, "放射性时钟", left, 37, { "font-size": 14, "font-weight": 700 });
    svgText(doc, node, "年龄 " + format(result.age, 1) + " Ma", ageX, 80, { "font-size": 12, "text-anchor": "middle", fill: "var(--edt-red)" });
    svgText(doc, node, "0", left, 274, { "font-size": 11, "text-anchor": "middle" });
    svgText(doc, node, "Ma 前", right, 274, { "font-size": 11, "text-anchor": "end" });
    var baseY = 112, count = 10, parentCount = Math.round(count * result.config.parentFraction), daughterCount = count - parentCount;
    for (var i = 0; i < count; i += 1) { var cx = 330 + (i % 5) * 30, cy = baseY + Math.floor(i / 5) * 28; node.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: 8, fill: i < parentCount ? "var(--edt-blue)" : "var(--edt-green)", "fill-opacity": ".78" })); }
    svgText(doc, node, "蓝 母体", 485, 112, { "font-size": 11, fill: "var(--edt-blue)" }); svgText(doc, node, "绿 女儿", 485, 137, { "font-size": 11, fill: "var(--edt-green)" });
    svgText(doc, node, "f=" + format(result.config.parentFraction, 3), 330, 195, { "font-size": 12, fill: "var(--edt-blue)" });
    svgText(doc, node, "1−f=" + format(result.daughterFraction, 3), 430, 195, { "font-size": 12, fill: "var(--edt-green)" });
    svgText(doc, node, "σt≈" + format(result.ageUncertainty, 1) + " Ma", 570, 195, { "font-size": 12, fill: "var(--edt-gold)" });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "edt-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) {
    clear(hostNode); var rows = [["衰变常数 λ", format(result.lambda, 6), "Ma⁻¹"], ["母体比例 f", format(result.config.parentFraction, 3), "无量纲"], ["女儿比例", format(result.daughterFraction, 3), "无量纲"], ["年龄 t", format(result.age, 2), "Ma"], ["年龄不确定度", format(result.ageUncertainty, 2), "Ma；仅传播 σf"], ["经过半衰期数", format(result.halfLivesElapsed, 3), "倍"], ["相对层序", result.order, "叠覆律条件"]];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); });
    hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "深时证据账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "结果" }), element(doc, "th", { text: "单位 / 解释" })])]), body]));
  }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument; installStyles(doc); var uid = LAB_ID + "-" + (++INSTANCE);
    var state = { config: { halfLife: DEFAULTS.halfLife, parentFraction: DEFAULTS.parentFraction, fractionUncertainty: DEFAULTS.fractionUncertainty }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" };
    rootNode.textContent = ""; var shell = element(doc, "div", { className: "edt-shell" }); shell.appendChild(element(doc, "h3", { text: "深时实验：相对层序与放射性时钟" })); shell.appendChild(element(doc, "p", { className: "edt-note", text: "先判断层序和衰变方向；揭示后调节半衰期、母体比例与比例误差。" }));
    var predictionHost = element(doc, "div"), groups = [], reveal;
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "edt-choice-grid" }); var buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item === button ? "true" : "false"); }); if (reveal) reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); }); shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "edt-actions" }); reveal = element(doc, "button", { type: "button", className: "edt-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "edt-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }); var controls = element(doc, "div", { className: "edt-controls" }); var specs = [["halfLife", "半衰期", 1, 500, 1, "Ma"], ["parentFraction", "母体比例 f", 0.02, 0.98, 0.01, ""], ["fractionUncertainty", "比例误差 σf", 0.001, 0.20, 0.001, ""]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "edt-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; }); results.appendChild(controls);
    var layout = element(doc, "div", { className: "edt-layout" }); var stage = element(doc, "div", { className: "edt-stage" }); var svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"); var metrics = element(doc, "div", { className: "edt-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "edt-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "edt-note", text: "比例误差传播不包括初始女儿、开放体系或标准的系统误差。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results); rootNode.appendChild(shell);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeDeepTime(state.config); results.hidden = !state.revealed; outputs.halfLife.textContent = format(result.config.halfLife, 0) + " Ma"; outputs.parentFraction.textContent = format(result.config.parentFraction, 3); outputs.fractionUncertainty.textContent = format(result.config.fractionUncertainty, 3); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "年龄", format(result.age, 1) + " Ma")); metrics.appendChild(metric(doc, "σt", format(result.ageUncertainty, 1) + " Ma")); metrics.appendChild(metric(doc, "母体", format(result.config.parentFraction, 3))); metrics.appendChild(metric(doc, "半衰期数", format(result.halfLivesElapsed, 2))); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在观察比例误差如何进入年龄。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: { halfLife: DEFAULTS.halfLife, parentFraction: DEFAULTS.parentFraction, fractionUncertainty: DEFAULTS.fractionUncertainty }, predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; Object.keys(inputs).forEach(function (key) { inputs[key].value = state.config[key]; }); render(); announce(api, rootNode, "深时实验已重置。"); });
    rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-edt-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros"); var result = computeDeepTime(DEFAULTS); check(near(result.age, 100), "one half-life gives one half-life age"); check(near(computeDeepTime({ halfLife: 100, parentFraction: 0.25, fractionUncertainty: 0.04 }).age, 200), "quarter fraction gives two half-lives"); check(near(computeDeepTime({ halfLife: 200, parentFraction: 0.5, fractionUncertainty: 0.04 }).age, 200), "age scales with half-life"); check(result.ageUncertainty > 0, "uncertainty is positive"); check(JSON.stringify(result) === JSON.stringify(computeDeepTime(DEFAULTS)), "deterministic age model"); return { checks: checks }; }
  return { computeDeepTime: computeDeepTime, mount: mount, selfTest: selfTest };
});
